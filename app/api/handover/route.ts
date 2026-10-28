import { NextRequest, NextResponse } from 'next/server';
import { HandoverSubmitSchema } from '@/lib/voice/schema';
import { extractStructuredHandover, generatePreArrivalChecklist } from '@/lib/voice/parser';
import { mockStore } from '@/lib/supabase/client';
import { HandoverRecord } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = HandoverSubmitSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid handover payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { incident_id, patient_id, transcript, language } = parsed.data;

    // 1. Clinical Extraction (SBAR / MIST)
    const structured = extractStructuredHandover(transcript, language);

    // 2. Generate Hospital Pre-Arrival Action Checklist (VH-5)
    const checklist = generatePreArrivalChecklist(structured);

    // 3. Create Draft Handover Record
    const handoverId = crypto.randomUUID();
    const handoverRecord: HandoverRecord = {
      id: handoverId,
      patient_id,
      transcript,
      structured,
      needs: structured.needs,
      confirmed: false,
      created_at: new Date().toISOString(),
    };

    mockStore.saveHandover(handoverRecord);

    return NextResponse.json({
      success: true,
      handover_id: handoverId,
      incident_id,
      patient_id,
      transcript,
      structured,
      checklist,
      confirmed: false,
      message: 'Handover parsed successfully. Ready for paramedic review & confirmation.',
    });
  } catch (err) {
    console.error('Error in POST /api/handover:', err);
    return NextResponse.json(
      { error: 'Internal server error processing voice handover' },
      { status: 500 }
    );
  }
}
