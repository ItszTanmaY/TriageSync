import { NextRequest, NextResponse } from 'next/server';
import { HospitalSelectionSchema } from '@/lib/validations/schemas';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { MATCHING_CONFIG } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientIdFromUrl } = await params;
    const json = await request.json();

    const parsed = HospitalSelectionSchema.safeParse({
      ...json,
      patient_id: json.patient_id || patientIdFromUrl,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid selection parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { patient_id, hospital_id, override_reason } = parsed.data;

    // 15-minute reservation hold time per HM-8
    const holdDurationMs = MATCHING_CONFIG.BED_RESERVATION_DURATION_MINUTES * 60 * 1000;
    const reservedUntil = new Date(Date.now() + holdDurationMs).toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .update({
          destination_hospital_id: hospital_id,
          reserved_until: reservedUntil,
        })
        .eq('id', patient_id)
        .select()
        .single();

      if (patientError) {
        console.warn('Patient update in Supabase warning:', patientError.message);
      }

      // Log in audit trail
      await supabase.from('audit_log').insert({
        action: override_reason ? 'hospital_override' : 'hospital_selected',
        entity: 'patient',
        entity_id: patient_id,
        meta: {
          hospital_id,
          override_reason: override_reason || null,
          reserved_until: reservedUntil,
        },
      });

      return NextResponse.json({
        success: true,
        patient_id,
        hospital_id,
        reserved_until: reservedUntil,
        is_override: Boolean(override_reason),
        override_reason: override_reason || null,
        data: patient,
      });
    }

    // In-memory mock store flow
    const existingPatient = mockStore.getPatient(patient_id) || {
      id: patient_id,
      incident_id: 'inc-demo-01',
      medpass_id: null,
      triage: 'red',
      est_age: null,
      sex: null,
      destination_hospital_id: null,
      reserved_until: null,
      eta_min: null,
    };

    const updatedPatient = {
      ...existingPatient,
      destination_hospital_id: hospital_id,
      reserved_until: reservedUntil,
    };

    mockStore.createPatient(updatedPatient);

    return NextResponse.json({
      success: true,
      patient_id,
      hospital_id,
      reserved_until: reservedUntil,
      is_override: Boolean(override_reason),
      override_reason: override_reason || null,
      data: updatedPatient,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown selection error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
