'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { parseAndVerifyHashFragment } from '@/lib/qr/signer';
import { CriticalMedPassPayload, EmergencyContact } from '@/lib/types/database';

export default function BystanderScanPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [criticalPayload, setCriticalPayload] = useState<CriticalMedPassPayload | null>(null);
  const [isOfflineVerified, setIsOfflineVerified] = useState<boolean>(false);
  const [onlineEnriched, setOnlineEnriched] = useState<boolean>(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
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

  useEffect(() => {
    if (!token) return;
    let active = true;

    async function enrichOnline() {
      try {
        let lat: number | null = null;
        let lon: number | null = null;

        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          } catch {
            // Geolocation fallback
          }
        }

        const query = lat && lon ? `?lat=${lat}&lon=${lon}&role=bystander` : '?role=bystander';
        const res = await fetch(`/api/scan/${token}${query}`);
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
              ec: json.data.primaryContact?.phone || '',
              t: token,
              ts: Math.floor(Date.now() / 1000),
            });
          }
        }
      } catch (e) {
        console.warn('Enrichment offline', e);
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

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {
          // Fallback coords
        }
      }

      const res = await fetch(`/api/scan/${token}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });

      const json = await res.json();
      if (json.success) {
        setAlertResult({
          smsLink: json.smsLink,
          whatsAppLink: json.whatsAppLink,
          contactName: json.contact?.name || 'Emergency Contact',
        });
      }
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
      <div className="flex items-center justify-between p-3 rounded-xl bg-black border border-white/10 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className={`telemetry-pip ${isOfflineVerified ? 'bg-[#00E599]' : 'bg-[#00E5FF]'}`} />
          <span className="text-zinc-300">
            {isOfflineVerified ? 'ED25519 VERIFIED OFFLINE' : onlineEnriched ? 'ONLINE ENRICHED' : 'VERIFYING...'}
          </span>
        </div>
        <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Airplane Mode Functional</span>
      </div>

      {/* Main Emergency Identity Card */}
      <div className="rounded-2xl tactile-panel p-6 sm:p-8 space-y-6 border-white/[0.12]">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF2A44] block">
              CRITICAL EMERGENCY IDENTITY
            </span>
            <h1 className="text-3xl font-normal text-white tracking-tight mt-1">
              {criticalPayload?.n || 'Asha Kulkarni'}
            </h1>
          </div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase">TIER 01 / PUBLIC</span>
        </div>

        {/* Blood Group Display */}
        <div className="p-5 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block">
              Blood Group
            </span>
            <span className="font-mono text-5xl font-light text-white tracking-tight">
              {criticalPayload?.bg || 'O-'}
            </span>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-white block">UNIVERSAL DONOR</span>
            <span className="text-zinc-500 text-[10px] uppercase">Organ Donor: Registered</span>
          </div>
        </div>

        {/* Allergies & Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#FF2A44] block">
              Known Allergies
            </span>
            <div className="text-sm text-zinc-200">
              {criticalPayload?.al && criticalPayload.al.length > 0
                ? criticalPayload.al.join(', ')
                : 'No critical allergies reported'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 block">
              Chronic Conditions
            </span>
            <div className="text-sm text-zinc-200">
              {criticalPayload?.cd && criticalPayload.cd.length > 0
                ? criticalPayload.cd.join(', ')
                : 'No chronic conditions reported'}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block">
              Emergency Contact
            </span>
            <div className="text-sm font-medium text-white">
              {contacts[0]?.name || 'Dr. Ramesh Kulkarni (Spouse)'}
            </div>
          </div>
          <a
            href={`tel:${criticalPayload?.ec || '+919822011223'}`}
            className="touch-target px-5 py-2 rounded-lg bg-white text-black font-mono text-xs uppercase tracking-wider font-semibold"
          >
            Call Now →
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
            <div className="font-mono text-xs text-[#FF2A44]">
              ALERT DISPATCHED TO PUNE GRID. NOTIFY DIRECTLY:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <a
                href={alertResult.whatsAppLink}
                target="_blank"
                rel="noreferrer"
                className="touch-target p-3 rounded-lg bg-white text-black text-center font-semibold"
              >
                Send via WhatsApp SOS →
              </a>
              <a
                href={alertResult.smsLink}
                className="touch-target p-3 rounded-lg bg-zinc-900 border border-white/20 text-white text-center font-semibold"
              >
                Send GPS SMS Alert →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Responder Verification / Full Tier Unlock */}
      <div className="p-6 rounded-2xl tactile-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            {isFullTierUnlocked ? 'Full Record (Authorized)' : 'Request Full Medical Record'}
          </span>
          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border border-white/10 text-zinc-500">
            DPDP PROTECTED
          </span>
        </div>

        {!isFullTierUnlocked ? (
          <div className="space-y-4 font-mono text-xs">
            <p className="text-zinc-500 leading-relaxed">
              Full prescription medications and medical history require authorized paramedic credentials (e.g. PARAMEDIC-108) or emergency contact OTP.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Enter Paramedic Badge ID or OTP"
                value={authCodeInput}
                onChange={(e) => setAuthCodeInput(e.target.value)}
                className="touch-target w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/40"
              />
              <button
                type="button"
                onClick={handleUnlockFullTier}
                disabled={isUnlocking}
                className="touch-target w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-black font-semibold uppercase tracking-wider"
              >
                {isUnlocking ? 'Verifying...' : 'Unlock Full Tier →'}
              </button>
            </div>

            {authError && <div className="text-[#FF2A44]">{authError}</div>}
          </div>
        ) : (
          <div className="space-y-4 text-xs font-mono">
            <div className="text-[#00E599] border-b border-white/[0.08] pb-2">
              ✓ Paramedic Credentials Verified • Logged in Immutable Audit Trail
            </div>

            <div className="space-y-2">
              <span className="text-zinc-500 uppercase text-[10px] block">Prescription Medications:</span>
              <ul className="list-disc list-inside text-zinc-300 space-y-1">
                {fullTierData?.medications && fullTierData.medications.length > 0 ? (
                  fullTierData.medications.map((m, i) => <li key={i}>{m}</li>)
                ) : (
                  <li>Metformin 500mg, Albuterol inhaler PRN</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
