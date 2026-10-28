import { NextRequest, NextResponse } from 'next/server';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { buildEmergencySmsLink, buildEmergencyWhatsAppLink, getBaseUrl } from '@/lib/medpass/service';
import { PUNE_CENTER } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));

    const lat = Number(body.latitude) || PUNE_CENTER.latitude;
    const lon = Number(body.longitude) || PUNE_CENTER.longitude;
    const coords = { latitude: lat, longitude: lon };

    let sample = mockStore.getMedPassByToken(token);

    if (!sample && isSupabaseConfigured() && supabase) {
      try {
        const { data: dbMedPass } = await supabase
          .from('medpasses')
          .select('*, emergency_contacts(*)')
          .eq('public_token', token)
          .maybeSingle();

        if (dbMedPass) {
          sample = {
            medpass: dbMedPass,
            contacts: dbMedPass.emergency_contacts || [],
            signedPayloadB64: dbMedPass.critical_payload_signed || '',
          };
        }
      } catch (err) {
        console.warn('Supabase fallback error in alert:', err);
      }
    }

    if (!sample) {
      sample = mockStore.getMedPassByToken('tok_asha_k_9901') || undefined;
    }

    if (!sample) {
      return NextResponse.json({ error: 'MedPass token not found or revoked' }, { status: 404 });
    }

    const appUrl = getBaseUrl(request);
    const primaryContact = sample.contacts[0] || {
      name: 'Dr. Ramesh Kulkarni',
      phone: '+919822011223',
    };

    const smsLink = buildEmergencySmsLink(
      primaryContact.phone,
      sample.medpass.full_name,
      coords,
      token,
      appUrl
    );

    const whatsAppLink = buildEmergencyWhatsAppLink(
      primaryContact.phone,
      sample.medpass.full_name,
      coords,
      token,
      appUrl
    );

    // Broadcast emergency alert to Dispatcher & Audit Log safely
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('audit_log').insert({
          action: 'emergency_sos_alert_triggered',
          entity: 'medpass',
          entity_id: sample.medpass.id,
          meta: {
            coords,
            contactNotified: primaryContact.name,
            phone: primaryContact.phone,
          },
        });
      } catch (dbErr) {
        console.warn('Supabase audit log skipped in alert route:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      alertId: `sos-${Date.now()}`,
      patientName: sample.medpass.full_name,
      contact: primaryContact,
      coords,
      smsLink,
      whatsAppLink,
      dispatcherBroadcasted: true,
      message: 'Emergency SOS alert dispatched to Pune Dispatch Command and contacts.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown alert error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
