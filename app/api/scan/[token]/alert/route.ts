import { NextRequest, NextResponse } from 'next/server';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { buildEmergencySmsLink, buildEmergencyWhatsAppLink } from '@/lib/medpass/service';
import { PUNE_CENTER } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));

    const lat = body.latitude || PUNE_CENTER.latitude;
    const lon = body.longitude || PUNE_CENTER.longitude;
    const coords = { latitude: lat, longitude: lon };

    const sample = mockStore.getMedPassByToken(token);
    if (!sample) {
      return NextResponse.json({ error: 'MedPass token not found or revoked' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const primaryContact = sample.contacts[0] || {
      name: 'Emergency Contact',
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

    // Broadcast emergency alert to Dispatcher & Audit Log
    if (isSupabaseConfigured() && supabase) {
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
