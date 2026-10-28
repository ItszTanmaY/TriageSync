import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { generatePublicToken, getBaseUrl } from '@/lib/medpass/service';
import { signCriticalPayload } from '@/lib/qr/signer';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const token = json.token || 'tok_asha_k_9901';

    const sample = mockStore.getMedPassByToken(token);
    if (!sample) {
      return NextResponse.json({ error: 'MedPass token not found' }, { status: 404 });
    }

    const newToken = generatePublicToken('tok');
    const newVersion = sample.medpass.token_version + 1;
    const nowTs = Math.floor(Date.now() / 1000);

    const signed = signCriticalPayload({
      v: newVersion,
      n: sample.medpass.full_name,
      bg: sample.medpass.blood_group,
      al: sample.medpass.allergies,
      cd: sample.medpass.conditions,
      ec: sample.contacts[0]?.phone || '+910000000000',
      t: newToken,
      ts: nowTs,
    });

    sample.medpass.public_token = newToken;
    sample.medpass.token_version = newVersion;
    sample.medpass.critical_payload_signed = signed.signatureHex;
    sample.medpass.updated_at = new Date().toISOString();
    sample.signedPayloadB64 = signed.hashFragment;

    const appUrl = getBaseUrl(request);
    const newScanUrl = `${appUrl}/s/${newToken}#${signed.hashFragment}`;

    const newQrDataUrl = await QRCode.toDataURL(newScanUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
    });

    if (isSupabaseConfigured() && supabase) {
      await supabase
        .from('medpasses')
        .update({
          public_token: newToken,
          token_version: newVersion,
          critical_payload_signed: signed.signatureHex,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sample.medpass.id);
    }

    return NextResponse.json({
      success: true,
      newToken,
      newVersion,
      newScanUrl,
      newQrDataUrl,
      message: 'Previous QR token successfully revoked and invalidated.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown token rotation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
