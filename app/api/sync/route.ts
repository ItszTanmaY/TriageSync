import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockStore } from '@/lib/supabase/client';
import { Incident, Patient, IncidentType, TriageLevel } from '@/lib/types/database';

const SyncItemSchema = z.object({
  id: z.string().uuid().or(z.string().min(5)),
  type: z.enum(['create_incident', 'scan_alert', 'voice_handover', 'update_incident']),
  payload: z.record(z.unknown()),
  createdAt: z.number().optional(),
});

const SyncBatchSchema = z.object({
  events: z.array(SyncItemSchema).optional(),
  _outbox_id: z.string().optional(),
  _client_timestamp: z.number().optional(),
}).passthrough();

// Set of processed client UUIDs for deduplication (RL-6)
const processedClientUUIDs = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const clientUuidHeader = req.headers.get('x-client-uuid') || rawBody._outbox_id || rawBody.id;

    // Single item direct sync or batch sync
    let itemsToProcess: z.infer<typeof SyncItemSchema>[] = [];

    if (Array.isArray(rawBody.events)) {
      const parsedBatch = SyncBatchSchema.safeParse(rawBody);
      if (!parsedBatch.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid sync batch schema', details: parsedBatch.error.issues },
          { status: 400 }
        );
      }
      itemsToProcess = parsedBatch.data.events || [];
    } else if (rawBody.type && rawBody.payload) {
      const parsedSingle = SyncItemSchema.safeParse({
        id: clientUuidHeader || `evt-${Date.now()}`,
        type: rawBody.type,
        payload: rawBody.payload,
        createdAt: rawBody.createdAt || Date.now(),
      });
      if (!parsedSingle.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid event schema', details: parsedSingle.error.issues },
          { status: 400 }
        );
      }
      itemsToProcess = [parsedSingle.data];
    } else {
      // General direct endpoint forward (e.g. from flushOutbox posting directly)
      const outboxId = clientUuidHeader || `sync-${Date.now()}`;
      if (processedClientUUIDs.has(outboxId)) {
        return NextResponse.json({
          success: true,
          idempotent: true,
          message: 'Already processed',
          id: outboxId,
        });
      }
      processedClientUUIDs.add(outboxId);
      return NextResponse.json({
        success: true,
        message: 'Synchronized successfully via direct outbox payload',
        id: outboxId,
      });
    }

    const processedIds: string[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const item of itemsToProcess) {
      // Idempotency check: Dedup by UUID (RL-6)
      if (processedClientUUIDs.has(item.id)) {
        processedIds.push(item.id);
        continue;
      }

      try {
        if (item.type === 'create_incident') {
          const payload = item.payload;
          const incidentId = `inc-offline-${item.id.slice(0, 8)}`;
          
          const newIncident: Incident = {
            id: incidentId,
            created_by: null,
            type: (payload.type as IncidentType) || 'road_accident',
            status: 'created',
            location: (payload.location as { latitude: number; longitude: number }) || {
              latitude: Number(payload.latitude) || 18.5204,
              longitude: Number(payload.longitude) || 73.8567,
            },
            patient_count: Number(payload.patient_count) || 1,
            ambulance_id: null,
            created_at: new Date(item.createdAt || Date.now()).toISOString(),
            closed_at: null,
            client_uuid: item.id,
          };

          mockStore.createIncident(newIncident);

          const newPatient: Patient = {
            id: `pat-offline-${item.id.slice(0, 8)}`,
            incident_id: incidentId,
            medpass_id: (payload.medpass_token as string) || null,
            triage: (payload.initial_triage as TriageLevel) || 'red',
            est_age: null,
            sex: null,
            destination_hospital_id: null,
            reserved_until: null,
            eta_min: null,
          };
          mockStore.createPatient(newPatient);

          processedClientUUIDs.add(item.id);
          processedIds.push(item.id);
        } else if (item.type === 'scan_alert') {
          mockStore.logMedPassScan({
            id: `scan-${item.id.slice(0, 8)}`,
            medpass_id: (item.payload.medpass_id as string) || 'tok_asha_k_9901',
            scanned_at: new Date().toISOString(),
            scanner_role: 'offline_emergency_alert',
            tier_accessed: 'critical',
            location: (item.payload.location as { latitude: number; longitude: number }) || null,
            client_id: item.id,
          });
          processedClientUUIDs.add(item.id);
          processedIds.push(item.id);
        } else {
          processedClientUUIDs.add(item.id);
          processedIds.push(item.id);
        }
      } catch (err) {
        errors.push({
          id: item.id,
          error: err instanceof Error ? err.message : 'Unknown sync processing error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedIds,
      errors: errors.length > 0 ? errors : undefined,
      totalReceived: itemsToProcess.length,
      totalProcessed: processedIds.length,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal sync server error' },
      { status: 500 }
    );
  }
}
