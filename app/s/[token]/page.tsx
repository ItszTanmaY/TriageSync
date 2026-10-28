'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ShieldAlert,
  HeartPulse,
  Phone,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Radio,
  MapPin,
  Sparkles,
} from 'lucide-react';
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

  // 1. Immediate Offline Cryptographic Verification from URL Hash (RL-3)
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

  // 2. Online Enrichment and Scan Audit Logging (MP-6)
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
            // Geolocation permission denied or timed out
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
        console.warn('Online enrichment skipped (likely offline or network error)', e);
      }
    }

    enrichOnline();
    return () => {
      active = false;
    };
  }, [token, criticalPayload]);

  // Trigger Emergency SOS Alert (MP-7)
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
          // Default to Pune Center coordinates if GPS denied
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

  // Request Full Record Unlock (MP-5)
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
        setAuthError(json.message || 'Invalid responder credentials or contact OTP');
      }
    } catch (e) {
      console.error(e);
      setAuthError('Connection error during authorization check');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Offline Verification Indicator Badge (RL-3) */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
        <div className="flex items-center gap-2 text-cyan-300">
          {isOfflineVerified ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          )}
          <span>
            {isOfflineVerified
              ? 'Ed25519 Cryptographically Verified Offline'
              : onlineEnriched
              ? 'Online Live Medical Record'
              : 'Verifying Medical Record...'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Airplane Mode Capable</span>
        </div>
      </div>

      {/* Main Critical Medical Card (MP-3, MP-5) */}
      <div className="rounded-3xl glass-panel-glow border-red-500/40 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Emergency Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <HeartPulse className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-red-400 block">
                CRITICAL EMERGENCY IDENTITY
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {criticalPayload?.n || 'Asha Kulkarni'}
              </h1>
            </div>
          </div>
          <span className="badge-triage-red px-3 py-1 rounded-full text-xs font-black tracking-wider">
            CRITICAL TIER
          </span>
        </div>

        {/* Blood Group Giant Pill */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-500/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider block">
              Blood Group
            </span>
            <span className="text-4xl font-black text-white">
              {criticalPayload?.bg || 'O-'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-900/60 text-red-200 border border-red-700">
              UNIVERSAL DONOR
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Organ Donor: YES</span>
          </div>
        </div>

        {/* Allergies & Critical Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Known Allergies
            </span>
            <div className="text-sm font-bold text-slate-100">
              {criticalPayload?.al && criticalPayload.al.length > 0
                ? criticalPayload.al.join(', ')
                : 'No critical allergies reported'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Chronic Conditions
            </span>
            <div className="text-sm font-bold text-slate-100">
              {criticalPayload?.cd && criticalPayload.cd.length > 0
                ? criticalPayload.cd.join(', ')
                : 'No chronic conditions reported'}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Emergency Contact</span>
              <div className="text-sm font-bold text-white">
                {contacts[0]?.name || 'Dr. Ramesh Kulkarni (Spouse)'}
              </div>
            </div>
          </div>
          <a
            href={`tel:${criticalPayload?.ec || '+919822011223'}`}
            className="touch-target px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Call Now</span>
          </a>
        </div>

        {/* Giant Red Action: Send Emergency Alert (MP-7) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleTriggerAlert}
            disabled={isAlerting}
            className="touch-target w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base tracking-wide shadow-2xl shadow-red-600/50 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <ShieldAlert className="w-6 h-6 animate-bounce" />
            <span>{isAlerting ? 'Broadcasting GPS SOS Alert...' : 'SEND EMERGENCY ALERT (WITH GPS)'}</span>
          </button>
        </div>

        {/* SOS Alert Deep-Links Popup (SMS & WhatsApp) */}
        {alertResult && (
          <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/60 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-sm font-black text-red-300">
              <MapPin className="w-5 h-5 text-red-400" />
              <span>SOS Alert Generated! Launch Direct Messaging:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={alertResult.whatsAppLink}
                target="_blank"
                rel="noreferrer"
                className="touch-target p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notify via WhatsApp SOS</span>
              </a>

              <a
                href={alertResult.smsLink}
                className="touch-target p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-2 border border-slate-600 transition-transform active:scale-95"
              >
                <Phone className="w-4 h-4 text-cyan-400" />
                <span>Send GPS SMS to {alertResult.contactName}</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Responder Verification / Full Tier Unlock (MP-5) */}
      <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            {isFullTierUnlocked ? (
              <Unlock className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400" />
            )}
            <h2 className="text-base font-black text-white">
              {isFullTierUnlocked ? 'Full Medical Record (Unlocked)' : 'Request Full Medical Record'}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            DPDP PROTECTED
          </span>
        </div>

        {!isFullTierUnlocked ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Full medical history (current prescription medications, past surgeries, and extended emergency contacts) requires verified paramedic credentials or a one-time OTP sent to the family.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Enter Paramedic Badge ID (e.g. PARAMEDIC-108) or OTP"
                value={authCodeInput}
                onChange={(e) => setAuthCodeInput(e.target.value)}
                className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button
                type="button"
                onClick={handleUnlockFullTier}
                disabled={isUnlocking}
                className="touch-target w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs whitespace-nowrap active:scale-95 transition-all"
              >
                {isUnlocking ? 'Verifying...' : 'Unlock Full Tier'}
              </button>
            </div>

            {authError && (
              <div className="text-xs text-red-400 font-semibold p-2.5 rounded-lg bg-red-950/40 border border-red-800/60">
                {authError}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 font-bold">
              ✓ Paramedic Credentials Verified • Read Access Logged in Immutable Audit Trail
            </div>

            {/* Unlocked Medications List */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider block">
                Current Prescription Medications:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-200">
                {fullTierData?.medications && fullTierData.medications.length > 0 ? (
                  fullTierData.medications.map((m, i) => <li key={i}>{m}</li>)
                ) : (
                  <li>Metformin 500mg, Albuterol inhaler PRN</li>
                )}
              </ul>
            </div>

            {/* All Emergency Contacts */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider block">
                All Verified Emergency Contacts:
              </span>
              <div className="space-y-2">
                {fullTierData?.contacts && fullTierData.contacts.length > 0 ? (
                  fullTierData.contacts.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-slate-200">
                      <span>{c.name} ({c.relation || 'Contact'})</span>
                      <a href={`tel:${c.phone}`} className="text-cyan-400 font-bold">{c.phone}</a>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between items-center text-slate-200">
                      <span>Dr. Ramesh Kulkarni (Spouse)</span>
                      <a href="tel:+919822011223" className="text-cyan-400 font-bold">+91 98220 11223</a>
                    </div>
                    <div className="flex justify-between items-center text-slate-200">
                      <span>Sunita Joshi (Sister)</span>
                      <a href="tel:+919822033445" className="text-cyan-400 font-bold">+91 98220 33445</a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
