import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/client';
import { calculateGoldenHour, canTransitionTo } from '@/lib/incident/service';
import { IncidentStatus } from '@/lib/types/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let incident = mockStore.getIncident(id);

    // Default mock incident fallback for demo purposes if not created yet
    if (!incident) {
      incident = {
        id,
        created_by: null,
        type: 'road_accident',
        status: 'en_route',
        location: { latitude: 18.5204, longitude: 73.8567 },
        patient_count: 1,
        ambulance_id: 'amb-101',
        created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14 mins ago
        closed_at: null,
        client_uuid: '11111111-2222-3333-4444-555555555555',
      };
      mockStore.createIncident(incident);
    }

    let patient = mockStore.getPatient(`pat-${id}-1`) || mockStore.getPatient(id);
    if (!patient) {
      patient = {
        id: `pat-${id}-1`,
        incident_id: id,
        medpass_id: 'mp-001',
        triage: 'red',
        est_age: 36,
        sex: 'Female',
        destination_hospital_id: 'hosp-001',
        reserved_until: new Date(Date.now() + 11 * 60 * 1000).toISOString(),
        eta_min: 7,
      };
      mockStore.createPatient(patient);
    }

    const ambulance = incident.ambulance_id
      ? mockStore.getAmbulances().find((a) => a.id === incident.ambulance_id) || null
      : null;

    const goldenHour = calculateGoldenHour(incident.created_at);

    return NextResponse.json({
      success: true,
      incident,
      patient,
      ambulance,
      goldenHour,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown incident error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const newStatus = body.status as IncidentStatus;

    const incident = mockStore.getIncident(id);
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (!canTransitionTo(incident.status, newStatus)) {
      return NextResponse.json(
        {
          error: 'Invalid lifecycle transition',
          current: incident.status,
          target: newStatus,
        },
        { status: 400 }
      );
    }

    const updated = mockStore.updateIncident(id, {
      status: newStatus,
      closed_at: newStatus === 'closed' ? new Date().toISOString() : incident.closed_at,
    });

    // If incident arrived or handed over, update ambulance status accordingly
    if (incident.ambulance_id) {
      if (newStatus === 'en_route') {
        mockStore.updateAmbulance(incident.ambulance_id, { status: 'en_route' });
      } else if (newStatus === 'closed') {
        mockStore.updateAmbulance(incident.ambulance_id, { status: 'available' });
      }
    }

    return NextResponse.json({ success: true, incident: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown status update error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
