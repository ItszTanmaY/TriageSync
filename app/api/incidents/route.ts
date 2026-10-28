import { NextRequest, NextResponse } from 'next/server';
import { IncidentCreateSchema } from '@/lib/validations/schemas';
import { findNearestAvailableAmbulance } from '@/lib/incident/service';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { Incident, Patient } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = IncidentCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid incident payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      type,
      latitude,
      longitude,
      patient_count,
      client_uuid,
      initial_triage,
      ambulance_id,
      medpass_token,
    } = parsed.data;

    // Idempotency check via client_uuid (ARCHITECTURE Section 8 & RL-1)
    const allIncidents = mockStore.getAllIncidents();
    const existing = allIncidents.find((i) => i.client_uuid === client_uuid);
    if (existing) {
      return NextResponse.json({
        success: true,
        incident: existing,
        idempotent: true,
        message: 'Incident already exists with this client UUID',
      });
    }

    const location = { latitude, longitude };
    const ambulances = mockStore.getAmbulances();

    // Auto-suggest nearest ambulance if not manually specified (INC-5)
    let assignedAmbulanceId = ambulance_id || null;
    let nearestMeta = null;

    if (!assignedAmbulanceId) {
      const nearest = findNearestAvailableAmbulance(location, ambulances);
      if (nearest.ambulance) {
        assignedAmbulanceId = nearest.ambulance.id;
        nearestMeta = nearest;
        mockStore.updateAmbulance(nearest.ambulance.id, { status: 'assigned' });
      }
    }

    const incidentId = `inc-${Date.now()}`;
    const newIncident: Incident = {
      id: incidentId,
      created_by: null,
      type,
      status: assignedAmbulanceId ? 'assigned' : 'created',
      location,
      patient_count,
      ambulance_id: assignedAmbulanceId,
      created_at: new Date().toISOString(),
      closed_at: null,
      client_uuid,
    };

    mockStore.createIncident(newIncident);

    // Create primary patient record
    let linkedMedPassId: string | null = null;
    if (medpass_token) {
      const mp = mockStore.getMedPassByToken(medpass_token);
      if (mp) linkedMedPassId = mp.medpass.id;
    }

    const patientId = `pat-${incidentId}-1`;
    const newPatient: Patient = {
      id: patientId,
      incident_id: incidentId,
      medpass_id: linkedMedPassId,
      triage: initial_triage,
      est_age: null,
      sex: null,
      destination_hospital_id: null,
      reserved_until: null,
      eta_min: null,
    };

    mockStore.createPatient(newPatient);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('incidents').insert({
        id: newIncident.id,
        type: newIncident.type,
        status: newIncident.status,
        location: `POINT(${location.longitude} ${location.latitude})`,
        patient_count: newIncident.patient_count,
        ambulance_id: newIncident.ambulance_id,
        client_uuid: newIncident.client_uuid,
      });

      await supabase.from('patients').insert(newPatient);
    }

    return NextResponse.json({
      success: true,
      incident: newIncident,
      patient: newPatient,
      nearestAmbulance: nearestMeta,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown incident creation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const incidents = mockStore.getAllIncidents();
    return NextResponse.json({ success: true, data: incidents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve incidents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
