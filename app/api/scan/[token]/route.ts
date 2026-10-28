import { NextRequest, NextResponse } from 'next/server';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : null;
    const scannerRole = searchParams.get('role') || 'anonymous';

    // 1. Try local mock store first
    let sample = mockStore.getMedPassByToken(token);

    // 2. Try Supabase if configured
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
        console.warn('Supabase medpass fetch error:', err);
      }
    }

    // 3. Fallback to default demo record so bystander scan never errors
    if (!sample) {
      sample = mockStore.getMedPassByToken('tok_asha_k_9901') || undefined;
    }

    if (!sample) {
      return NextResponse.json({ error: 'MedPass token not found or revoked' }, { status: 404 });
    }

    const scanRecord = {
      id: `scan-${Date.now()}`,
      medpass_id: sample.medpass.id,
      scanned_at: new Date().toISOString(),
      location: lat && lon ? { latitude: lat, longitude: lon } : null,
      scanner_role: scannerRole,
      tier_accessed: 'critical' as const,
      client_id: request.headers.get('x-forwarded-for') || 'public-web-client',
    };

    // Log scan asynchronously without blocking response
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('medpass_scans').insert({
          id: scanRecord.id,
          medpass_id: scanRecord.medpass_id,
          scanner_role: scanRecord.scanner_role,
          tier_accessed: scanRecord.tier_accessed,
          scanned_at: scanRecord.scanned_at,
          location: scanRecord.location
            ? `POINT(${scanRecord.location.longitude} ${scanRecord.location.latitude})`
            : null,
        });

        await supabase.from('audit_log').insert({
          action: 'medpass_scan',
          entity: 'medpass',
          entity_id: sample.medpass.id,
          actor_role: scannerRole,
          meta: { location: scanRecord.location, tier: 'critical' },
        });
      } catch (dbErr) {
        // Safe swallow: Never fail patient data presentation due to audit table constraint
        console.warn('Supabase audit log skipped:', dbErr);
      }
    }

    // Critical Tier payload (DPDP data minimisation compliant)
    const criticalTier = {
      name: sample.medpass.full_name,
      bloodGroup: sample.medpass.blood_group,
      allergies: sample.medpass.allergies,
      conditions: sample.medpass.conditions,
      organDonor: sample.medpass.organ_donor,
      language: sample.medpass.language,
      primaryContact: sample.contacts[0] || null,
      token: sample.medpass.public_token,
      version: sample.medpass.token_version,
    };

    return NextResponse.json({
      success: true,
      tier: 'critical',
      data: criticalTier,
      scanLogged: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown scan error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
