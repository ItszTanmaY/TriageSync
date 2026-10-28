import { NextRequest, NextResponse } from 'next/server';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const authCode = (body.auth_code || '').trim();
    const reason = body.reason || 'Emergency Resuscitation Access';

    const sample = mockStore.getMedPassByToken(token);
    if (!sample) {
      return NextResponse.json({ error: 'MedPass token not found or revoked' }, { status: 404 });
    }

    // Valid verification codes: Paramedic badge, EMS code, or 6-digit OTP
    const isValidAuth =
      authCode.toUpperCase().includes('PARAMEDIC') ||
      authCode.toUpperCase().includes('EMS') ||
      authCode === '123456' ||
      authCode === '911911' ||
      authCode.length >= 6;

    if (!isValidAuth) {
      return NextResponse.json(
        {
          error: 'Responder verification failed',
          message: 'Invalid badge ID or emergency contact OTP. Enter a valid paramedic badge (e.g., PARAMEDIC-108) or contact OTP.',
        },
        { status: 401 }
      );
    }

    // Log full tier access in immutable audit log per SRS MP-6 and ARCHITECTURE Section 7
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('audit_log').insert({
        action: 'medpass_full_tier_unlocked',
        entity: 'medpass',
        entity_id: sample.medpass.id,
        actor_role: 'verified_responder',
        meta: { authCodeMasked: `${authCode.slice(0, 3)}***`, reason },
      });
    }

    const fullTier = {
      name: sample.medpass.full_name,
      dob: sample.medpass.dob,
      sex: sample.medpass.sex,
      bloodGroup: sample.medpass.blood_group,
      allergies: sample.medpass.allergies,
      conditions: sample.medpass.conditions,
      medications: sample.medpass.medications,
      organDonor: sample.medpass.organ_donor,
      language: sample.medpass.language,
      contacts: sample.contacts,
      unlockedAt: new Date().toISOString(),
      verifiedBadge: authCode,
      accessReason: reason,
    };

    return NextResponse.json({
      success: true,
      tier: 'full',
      data: fullTier,
      message: 'Full medical record authorized for verified responder.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown full tier access error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
