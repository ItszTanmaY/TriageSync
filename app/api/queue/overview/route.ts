import { NextResponse } from 'next/server';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { evaluateDiversion, QueueTelemetry } from '@/lib/queue/engine';
import { MOCK_HOSPITALS } from '@/lib/supabase/mock-data';

export async function GET() {
  try {
    let hospitals = MOCK_HOSPITALS;
    const resourcesMap: Record<string, ReturnType<typeof mockStore.getResources>> = {};

    if (isSupabaseConfigured() && supabase) {
      const { data: hospData } = await supabase.from('hospitals').select('*');
      if (hospData) hospitals = hospData;

      const { data: resData } = await supabase.from('hospital_resources').select('*');
      if (resData) {
        resData.forEach((r) => {
          resourcesMap[r.hospital_id] = r;
        });
      }
    } else {
      hospitals = mockStore.getHospitals();
      mockStore.getAllResources().forEach((r) => {
        resourcesMap[r.hospital_id] = r;
      });
    }

    // Inbound ambulances count from active patients
    const allPatients = mockStore.getPatientsByHospital('all');
    const queueList: (QueueTelemetry & { hospitalName: string })[] = [];

    for (const h of hospitals) {
      const res = resourcesMap[h.id] || mockStore.getResources(h.id);
      if (!res) continue;

      // Count inbound patients assigned to this hospital
      const inboundCount = allPatients.filter(
        (p) => p.destination_hospital_id === h.id && (!p.eta_min || p.eta_min > 0)
      ).length;

      const telemetry = evaluateDiversion(h.id, res, inboundCount, 10);
      queueList.push({
        ...telemetry,
        hospitalName: h.name,
      });
    }

    const diversions = mockStore.getDiversions();

    return NextResponse.json({
      success: true,
      data: queueList,
      diversions,
      summary: {
        totalHospitals: hospitals.length,
        overloadedHospitals: queueList.filter((q) => q.isOverloaded).length,
        divertedAmbulances: diversions.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve queue overview';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
