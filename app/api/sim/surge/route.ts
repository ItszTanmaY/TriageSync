import { NextRequest, NextResponse } from 'next/server';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { evaluateDiversion, createDiversionRecord } from '@/lib/queue/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetHospitalId = body.hospital_id || 'hosp-001';
    const fallbackHospitalId = body.fallback_hospital_id || 'hosp-002';

    const hospital = mockStore.getHospitalById(targetHospitalId) || {
      id: targetHospitalId,
      name: 'Ruby Apex Trauma Institute',
    };
    const fallback = mockStore.getHospitalById(fallbackHospitalId) || {
      id: fallbackHospitalId,
      name: 'Deccan Neuro & Multispeciality',
    };

    const resources = mockStore.getResources(targetHospitalId);
    if (!resources) {
      return NextResponse.json({ error: 'Hospital resources not found' }, { status: 404 });
    }

    // Step 2: Ambulance 1 dispatches (inbound = 1)
    const afterAmb1 = evaluateDiversion(targetHospitalId, resources, 1, 8);

    // Step 3: Ambulance 2 dispatches (inbound = 2)
    // Reduce free beds slightly to create realistic high-traffic surge
    const surgeResources = {
      ...resources,
      er_free: Math.max(1, Math.min(3, resources.er_free - 4)),
    };
    const afterAmb2 = evaluateDiversion(targetHospitalId, surgeResources, 2, 8);

    // Step 4: Ambulance 3 dispatches (inbound = 3) -> projected_load hits ~0.90+ (>0.85 threshold)
    const afterAmb3 = evaluateDiversion(targetHospitalId, surgeResources, 3, 8);

    // Execute Diversion for Ambulance 3
    const diversionRecord = createDiversionRecord(
      `inc-surge-${Date.now()}`,
      targetHospitalId,
      fallbackHospitalId,
      afterAmb3
    );

    mockStore.logDiversion(diversionRecord);

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('diversions').insert(diversionRecord);
    }

    return NextResponse.json({
      success: true,
      scenario: 'Triple Trauma Surge (SIM-3 / QP-3)',
      targetHospital: hospital.name,
      fallbackHospital: fallback.name,
      steps: [
        {
          step: 1,
          ambulance: 'Apex-101',
          status: 'Accepted',
          inbound: 1,
          projectedLoad: Math.round(afterAmb1.projectedLoad * 100),
          action: `Routed to ${hospital.name}. ER load within normal capacity.`,
        },
        {
          step: 2,
          ambulance: 'Rapid-102',
          status: 'Accepted',
          inbound: 2,
          projectedLoad: Math.round(afterAmb2.projectedLoad * 100),
          action: `Routed to ${hospital.name}. ER capacity approaching caution threshold.`,
        },
        {
          step: 3,
          ambulance: 'Delta-103',
          status: 'DIVERTED',
          inbound: 3,
          projectedLoad: Math.round(afterAmb3.projectedLoad * 100),
          waitMinutes: afterAmb3.projectedWaitMinutes,
          action: `AUTOMATICALLY DIVERTED to ${fallback.name}!`,
          reason: afterAmb3.diversionReason,
          numbersLogged: diversionRecord.numbers,
        },
      ],
      diversionRecord,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Surge simulation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
