import { NextRequest, NextResponse } from 'next/server';
import { rankHospitalsForIncident } from '@/lib/matching/engine';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { MOCK_HOSPITALS, MOCK_BLOOD_STOCK } from '@/lib/supabase/mock-data';
import { PUNE_CENTER } from '@/lib/config';
import { IncidentType, TriageLevel, BloodGroup, RecommendationRecord } from '@/lib/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: incidentId } = await params;
    const body = await request.json().catch(() => ({}));

    // Incident and Patient parameters
    const incidentType: IncidentType = body.incident_type || 'road_accident';
    const triageLevel: TriageLevel = body.triage_level || 'red';
    const patientBloodGroup: BloodGroup | null = body.blood_group || 'O-';
    const bloodUnitsNeeded: number = body.blood_units_needed || 2;
    const incidentLocation = body.location || {
      latitude: body.latitude || PUNE_CENTER.latitude,
      longitude: body.longitude || PUNE_CENTER.longitude,
    };
    const patientId = body.patient_id || `pat-${incidentId}`;

    let hospitals = MOCK_HOSPITALS;
    let bloodStockList = MOCK_BLOOD_STOCK;
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

      const { data: bloodData } = await supabase.from('blood_stock').select('*');
      if (bloodData) bloodStockList = bloodData;
    } else {
      hospitals = mockStore.getHospitals();
      mockStore.getAllResources().forEach((r) => {
        resourcesMap[r.hospital_id] = r;
      });
      bloodStockList = mockStore.getHospitals().flatMap((h) => mockStore.getBloodStock(h.id));
    }

    const { topRecommendations, excludedHospitals, allRankings } = rankHospitalsForIncident({
      incidentLocation,
      incidentType,
      triageLevel,
      patientBloodGroup,
      bloodUnitsNeeded,
      hospitals,
      resourcesMap: resourcesMap as Record<string, NonNullable<(typeof resourcesMap)[string]>>,
      bloodStockList,
    });

    const recommendationRecord: RecommendationRecord = {
      id: `rec-${incidentId}-${Date.now()}`,
      patient_id: patientId,
      ranking: allRankings,
      chosen_hospital_id: null,
      override_reason: null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('recommendations').insert({
        id: recommendationRecord.id,
        patient_id: recommendationRecord.patient_id,
        ranking: recommendationRecord.ranking,
        created_at: recommendationRecord.created_at,
      });
    } else {
      mockStore.saveRecommendation(recommendationRecord);
    }

    return NextResponse.json({
      success: true,
      recommendationId: recommendationRecord.id,
      patientId,
      incidentId,
      topRecommendations,
      excludedHospitals,
      totalEvaluated: allRankings.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown recommendation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
