import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { MedPassFormSchema } from '@/lib/validations/schemas';
import { signCriticalPayload } from '@/lib/qr/signer';
import { generatePublicToken, getBaseUrl } from '@/lib/medpass/service';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { MedPass, EmergencyContact } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = MedPassFormSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      full_name,
      dob = null,
      sex = null,
      blood_group = null,
      allergies,
      conditions,
      medications,
      organ_donor,
      language,
      contacts,
    } = parsed.data;

    const token = generatePublicToken('tok');
    const nowTs = Math.floor(Date.now() / 1000);
    const primaryContactPhone = contacts[0]?.phone || '+910000000000';

    // Sign compact offline payload per ARCHITECTURE.md Section 3
    const signed = signCriticalPayload({
      v: 1,
      n: full_name,
      bg: blood_group,
      al: allergies,
      cd: conditions,
      ec: primaryContactPhone,
      t: token,
      ts: nowTs,
    });

    const appUrl = getBaseUrl(request);
    const publicScanUrl = `${appUrl}/s/${token}#${signed.hashFragment}`;

    // Generate high-resolution QR code
    const qrDataUrl = await QRCode.toDataURL(publicScanUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
    });

    const medpassId = `mp-${Date.now()}`;
    const newMedpass: MedPass = {
      id: medpassId,
      owner_id: 'user-active-session',
      full_name,
      dob: dob || null,
      sex: sex || null,
      blood_group,
      allergies,
      conditions,
      medications,
      organ_donor,
      language,
      public_token: token,
      token_version: 1,
      critical_payload_signed: signed.signatureHex,
      full_tier_encrypted: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newContacts: EmergencyContact[] = contacts.map((c, idx) => ({
      id: `ec-${medpassId}-${idx + 1}`,
      medpass_id: medpassId,
      name: c.name,
      relation: c.relation || null,
      phone: c.phone,
      priority: c.priority,
    }));

    if (isSupabaseConfigured() && supabase) {
      const { error: mpErr } = await supabase.from('medpasses').upsert(newMedpass);
      if (mpErr) console.warn('Supabase medpass save warning:', mpErr.message);

      for (const c of newContacts) {
        await supabase.from('emergency_contacts').upsert(c);
      }
    }

    return NextResponse.json({
      success: true,
      medpass: newMedpass,
      contacts: newContacts,
      publicToken: token,
      publicScanUrl,
      hashFragment: signed.hashFragment,
      qrDataUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown MedPass error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Default to the first sample medpass for demo (Asha Kulkarni)
    const sample = mockStore.getMedPassByToken('tok_asha_k_9901');
    if (!sample) {
      return NextResponse.json({ error: 'MedPass not found' }, { status: 404 });
    }

    const appUrl = getBaseUrl(request);
    const publicScanUrl = `${appUrl}/s/${sample.medpass.public_token}#${sample.signedPayloadB64}`;

    const qrDataUrl = await QRCode.toDataURL(publicScanUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
    });

    const mockScanHistory = [
      {
        id: 'scan-01',
        scanned_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        location: { latitude: 18.5204, longitude: 73.8567 },
        scanner_role: 'paramedic',
        tier_accessed: 'critical',
      },
      {
        id: 'scan-02',
        scanned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 18.5312, longitude: 73.8794 },
        scanner_role: 'anonymous',
        tier_accessed: 'critical',
      },
    ];

    return NextResponse.json({
      success: true,
      medpass: sample.medpass,
      contacts: sample.contacts,
      publicScanUrl,
      qrDataUrl,
      scanHistory: mockScanHistory,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown MedPass error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
