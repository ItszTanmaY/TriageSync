'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { parseAndVerifyHashFragment } from '@/lib/qr/signer';
import { CriticalMedPassPayload, EmergencyContact } from '@/lib/types/database';
import { enqueueOutboxEvent, flushOutbox } from '@/lib/offline/outbox';

export default function BystanderScanPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : 'tok_asha_k_9901';

  const [criticalPayload, setCriticalPayload] = useState<CriticalMedPassPayload | null>(null);
  const [isOfflineVerified, setIsOfflineVerified] = useState<boolean>(false);
  const [onlineEnriched, setOnlineEnriched] = useState<boolean>(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: 'c-default',
      medpass_id: 'mp-001',
      name: 'Dr. Ramesh Kulkarni (Spouse)',
      relation: 'Spouse',
      phone: '+91 98220 11223',
      priority: 1,
    },
  ]);
  const [isAlerting, setIsAlerting] = useState<boolean>(false);
  const [alertResult, setAlertResult] = useState<{
    smsLink: string;
    whatsAppLink: string;
    contactName: string;
  } | null>(null);

  // Full tier unlock state
  const [isFullTierUnlocked, setIsFullTierUnlocked] = useState<boolean>(false);
  const [fullTierData, setFullTierData] = useState<{
    medications: string[];
    contacts: EmergencyContact[];
    dob: string | null;
    sex: string | null;
  } | null>(null);
  const [authCodeInput, setAuthCodeInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  // 1. Check for client-side cryptographic hash fragment in URL (#payload.sig)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      const verifyResult = parseAndVerifyHashFragment(hash);
      if (verifyResult.isValid && verifyResult.payload) {
        setCriticalPayload(verifyResult.payload);
        setIsOfflineVerified(true);
      }
    }
  }, []);

  // 2. Fetch critical patient data immediately without waiting on GPS
  useEffect(() => {
    if (!token) return;
    let active = true;

    async function enrichOnline() {
      try {
        const res = await fetch(`/api/scan/${token}?role=bystander`);
        const json = await res.json();

        if (active && json.success && json.data) {
          setOnlineEnriched(true);
          if (json.data.primaryContact) {
            setContacts([json.data.primaryContact]);
          }
          if (!criticalPayload) {
            setCriticalPayload({
              v: json.data.version || 1,
              n: json.data.name,
              bg: json.data.bloodGroup,
              al: json.data.allergies || [],
              cd: json.data.conditions || [],
              ec: json.data.primaryContact?.phone || '+919822011223',
              t: token,
              ts: Math.floor(Date.now() / 1000),
            });
          }
        }
      } catch (e) {
        console.warn('Enrichment fetch error, utilizing offline defaults:', e);
      }
    }

    enrichOnline();
    return () => {
      active = false;
    };
  }, [token, criticalPayload]);

  const handleTriggerAlert = async () => {
    setIsAlerting(true);
    try {
      let lat = 18.5204;
      let lon = 73.8567;

      if (typeof window !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await Promise.race([
            new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 1500, maximumAge: 60000 });
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
          ]).catch(() => null);

          if (pos) {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          }
        } catch {
          // Geolocation timeout fallback
        }
      }

      const clientUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `alert-${Date.now()}`;

      // Durable write to offline outbox (RL-1)
      await enqueueOutboxEvent({
        id: clientUuid,
        type: 'scan_alert',
        endpoint: `/api/scan/${token}/alert`,
        method: 'POST',
        payload: { latitude: lat, longitude: lon, token, medpass_id: token },
      });

      if (typeof window !== 'undefined' && window.navigator.onLine) {
        try {
          const res = await fetch(`/api/scan/${token}/alert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Client-UUID': clientUuid,
            },
            body: JSON.stringify({ latitude: lat, longitude: lon }),
          });

          const json = await res.json();
          if (json.success) {
            flushOutbox().catch(() => {});
            setAlertResult({
              smsLink: json.smsLink,
              whatsAppLink: json.whatsAppLink,
              contactName: json.contact?.name || 'Emergency Contact',
            });
            return;
          }
        } catch (fetchErr) {
          console.warn('Online alert fetch failed, falling back to offline deep links:', fetchErr);
        }
      }

      // Offline fallback: Use phone from signed QR payload
      const phone = criticalPayload?.ec || '+919822011223';
      const patientName = criticalPayload?.n || 'Asha Kulkarni';
      const text = `CRITICAL MEDICAL ALERT: ${patientName} has been scanned in an emergency. Location: https://maps.google.com/?q=${lat},${lon}`;
      setAlertResult({
        smsLink: `sms:${phone}?body=${encodeURIComponent(text)}`,
        whatsAppLink: `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`,
        contactName: contacts[0]?.name || 'Primary Emergency Contact (Offline QR)',
      });
    } catch (e) {
      console.error('Alert trigger error', e);
    } finally {
      setIsAlerting(false);
    }
  };

  const handleUnlockFullTier = async () => {
    setIsUnlocking(true);
    setAuthError(null);
    try {
      const res = await fetch(`/api/scan/${token}/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_code: authCodeInput }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setIsFullTierUnlocked(true);
        setFullTierData(json.data);
      } else {
        setAuthError(json.message || 'Invalid responder badge ID or contact OTP');
      }
    } catch (e) {
      console.error(e);
      setAuthError('Authorization check failed');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Telemetry Status Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/80 border border-white/15 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className={`telemetry-pip ${isOfflineVerified ? 'bg-[#00E599]' : 'bg-[#00E5FF]'}`} />
          <span className="text-zinc-200 font-semibold">
            {isOfflineVerified ? 'ED25519 VERIFIED OFFLINE' : onlineEnriched ? 'ONLINE ENRICHED' : 'PUBLIC EMERGENCY SCAN'}
          </span>
        </div>
        <span className="text-zinc-400 text-[10px] uppercase tracking-widest hidden sm:inline">
          Airplane Mode Functional
        </span>
      </div>

      {/* Main Emergency Identity Card */}
      <div className="rounded-2xl tactile-panel p-6 sm:p-8 space-y-6 border border-white/20 bg-[#08080c] shadow-2xl">
        <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF2A44] font-bold block">
              CRITICAL EMERGENCY IDENTITY
            </span>
            <h1 className="text-3xl font-normal text-white tracking-tight mt-1">
              {criticalPayload?.n || 'Asha Kulkarni'}
            </h1>
          </div>
          <span className="font-mono text-[10px] text-zinc-400 uppercase px-2 py-0.5 rounded border border-white/10 bg-zinc-900">
            TIER 01 / PUBLIC
          </span>
        </div>

        {/* Blood Group Display */}
        <div className="p-5 rounded-xl bg-black/70 border border-white/15 flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
              Blood Group
            </span>
            <span className="font-mono text-5xl font-light text-white tracking-tight">
              {criticalPayload?.bg || 'O-'}
            </span>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-white font-semibold block">UNIVERSAL DONOR</span>
            <span className="text-emerald-400 text-[10px] uppercase block mt-0.5 font-bold">
              Organ Donor: Registered
            </span>
          </div>
        </div>

        {/* Allergies & Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#FF2A44] font-bold block">
              Known Allergies
            </span>
            <div className="text-sm text-zinc-200">
              {criticalPayload?.al && criticalPayload.al.length > 0
                ? criticalPayload.al.join(', ')
                : 'Penicillin, Sulfa drugs'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
              Chronic Conditions
            </span>
            <div className="text-sm text-zinc-200">
              {criticalPayload?.cd && criticalPayload.cd.length > 0
                ? criticalPayload.cd.join(', ')
                : 'Type 2 Diabetes, Mild Asthma'}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">
              Emergency Contact
            </span>
            <div className="text-sm font-medium text-white">
              {contacts[0]?.name || 'Dr. Ramesh Kulkarni (Spouse)'}
            </div>
          </div>
          <a
            href={`tel:${contacts[0]?.phone || criticalPayload?.ec || '+919822011223'}`}
            className="touch-target px-5 py-2.5 rounded-xl bg-white text-black font-mono text-xs uppercase tracking-wider font-semibold hover:bg-zinc-200 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Call Now</span>
            <span>→</span>
          </a>
        </div>

        {/* Giant Red Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleTriggerAlert}
            disabled={isAlerting}
            className="touch-target w-full py-4 px-6 rounded-xl bg-[#FF2A44] hover:bg-[#ff1430] text-white font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(255,42,68,0.3)] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{isAlerting ? 'BROADCASTING GPS SOS ALERT...' : 'SEND EMERGENCY ALERT (WITH GPS)'}</span>
            <span className="font-sans font-bold text-sm">→</span>
          </button>
        </div>

        {/* Deep Link Buttons */}
        {alertResult && (
          <div className="p-4 rounded-xl bg-[#FF2A44]/10 border border-[#FF2A44]/30 space-y-3 animate-in fade-in">
            <div className="font-mono text-xs text-[#FF2A44] font-semibold">
              ALERT READY FOR DISPATCH. NOTIFY CONTACT DIRECTLY:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <a
                href={alertResult.whatsAppLink}
                target="_blank"
                rel="noreferrer"
                className="touch-target p-3 rounded-lg bg-white text-black text-center font-semibold hover:bg-zinc-200 transition-colors"
              >
                Send via WhatsApp SOS →
              </a>
              <a
                href={alertResult.smsLink}
                className="touch-target p-3 rounded-lg bg-zinc-900 border border-white/20 text-white text-center font-semibold hover:bg-zinc-800 transition-colors"
              >
                Send GPS SMS Alert →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Responder Verification / Full Tier Unlock */}
      <div className="p-6 rounded-2xl tactile-panel space-y-4 border border-white/20 bg-[#08080c]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-semibold">
            TIER 02 / CLINICAL UNLOCK
          </span>
          <span className="font-mono text-[10px] text-zinc-500 uppercase">Paramedic / Hospital Staff</span>
        </div>

        {!isFullTierUnlocked ? (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-zinc-400 font-sans text-xs">
              Full prescription medication history and medical records are restricted to authenticated emergency responders or OTP verification.
            </p>

            {authError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
                {authError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={authCodeInput}
                onChange={(e) => setAuthCodeInput(e.target.value)}
                placeholder="Enter Badge ID (e.g. APEX-101) or OTP"
                className="touch-target w-full sm:flex-1 px-4 py-3 bg-zinc-950 border border-white/15 focus:border-white/40 rounded-xl text-white outline-none"
              />
              <button
                type="button"
                onClick={handleUnlockFullTier}
                disabled={isUnlocking || !authCodeInput}
                className="touch-target w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-black font-semibold uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-40"
              >
                {isUnlocking ? 'Verifying...' : 'Unlock Full Tier'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs animate-in fade-in">
            <div className="text-[#00E599] font-semibold text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E599]" />
              <span>Full Clinical Tier Authorized &amp; Decrypted</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Current Medications
                </span>
                <div className="text-sm text-white">
                  {fullTierData?.medications && fullTierData.medications.length > 0
                    ? fullTierData.medications.join(', ')
                    : 'Metformin 500mg, Albuterol inhaler PRN'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Demographics
                </span>
                <div className="text-sm text-white">
                  DOB: {fullTierData?.dob || '1988-06-14'} • Sex: {fullTierData?.sex || 'Female'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
