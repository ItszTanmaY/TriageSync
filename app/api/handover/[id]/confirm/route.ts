import { NextRequest, NextResponse } from 'next/server';
import { HandoverConfirmSchema } from '@/lib/voice/schema';
import { mockStore } from '@/lib/supabase/client';
import { HandoverRecord, BloodGroup } from '@/lib/types/database';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const handoverId = params.id;
    const json = await request.json();

    const parsed = HandoverConfirmSchema.safeParse({
      ...json,
      handover_id: handoverId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid handover confirmation payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { patient_id, hospital_id, structured } = parsed.data;

    // Convert schema structured data to HandoverStructuredData
    const typedStructured = {
      age: structured.age ?? null,
      sex: structured.sex ?? null,
      mechanism: structured.mechanism ?? null,
      injuries: structured.injuries,
      vitals: {
        hr: structured.vitals.hr ?? null,
        bp: structured.vitals.bp ?? null,
        spo2: structured.vitals.spo2 ?? null,
        gcs: structured.vitals.gcs ?? null,
      },
      interventions: structured.interventions,
      needs: {
        blood_group: (structured.needs.blood_group as BloodGroup) ?? null,
        units: structured.needs.units,
        ot: structured.needs.ot,
        ventilator: structured.needs.ventilator,
        specialist: structured.needs.specialist ?? null,
      },
      notes: structured.notes ?? null,
    };

    // Update patient destination if set
    const patient = mockStore.getPatient(patient_id);
    if (patient) {
      patient.destination_hospital_id = hospital_id;
    }

    // Save confirmed handover
    const confirmedHandover: HandoverRecord = {
      id: handoverId,
      patient_id,
      transcript: structured.notes || 'Voice Handover Recorded',
      structured: typedStructured,
      needs: typedStructured.needs,
      confirmed: true,
      created_at: new Date().toISOString(),
    };

    mockStore.saveHandover(confirmedHandover);

    return NextResponse.json({
      success: true,
      handover: confirmedHandover,
      destination_hospital_id: hospital_id,
      message: 'Handover confirmed and pushed to hospital ER telemetry in real-time.',
    });
  } catch (err) {
    console.error('Error in POST /api/handover/[id]/confirm:', err);
    return NextResponse.json(
      { error: 'Internal server error confirming handover' },
      { status: 500 }
    );
  }
}
