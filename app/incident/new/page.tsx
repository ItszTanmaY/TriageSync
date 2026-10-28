'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  MapPin,
  Ambulance as AmbulanceIcon,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { IncidentType, TriageLevel } from '@/lib/types/database';
import { PUNE_CENTER } from '@/lib/config';
import { findNearestAvailableAmbulance } from '@/lib/incident/service';
import { MOCK_AMBULANCES } from '@/lib/supabase/mock-data';

export default function NewIncidentPage() {
  const router = useRouter();

  const [type, setType] = useState<IncidentType>('road_accident');
  const [triage, setTriage] = useState<TriageLevel>('red');
  const [patientCount, setPatientCount] = useState<number>(1);
  const [latitude, setLatitude] = useState<number>(PUNE_CENTER.latitude);
  const [longitude, setLongitude] = useState<number>(PUNE_CENTER.longitude);
  const [medpassToken, setMedpassToken] = useState<string>('tok_asha_k_9901');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [suggestedAmbulance, setSuggestedAmbulance] = useState<{ callsign: string; eta: number } | null>({
    callsign: 'Apex-101',
    eta: 4,
  });

  // Auto-detect GPS on load (INC-1)
  useEffect(() => {
    if (navigator.geolocation) {
      setIsDetectingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          const nearest = findNearestAvailableAmbulance(
            { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
            MOCK_AMBULANCES
          );
          if (nearest.ambulance) {
            setSuggestedAmbulance({
              callsign: nearest.ambulance.callsign,
              eta: nearest.etaMinutes,
            });
          }
          setIsDetectingGps(false);
        },
        () => {
          setIsDetectingGps(false);
        },
        { timeout: 3000 }
      );
    }
  }, []);

  const handleCreateIncident = async () => {
    setIsSubmitting(true);
    try {
      const clientUuid = crypto.randomUUID();
      const payload = {
        type,
        latitude,
        longitude,
        patient_count: patientCount,
        initial_triage: triage,
        client_uuid: clientUuid,
        medpass_token: medpassToken || undefined,
      };

      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.incident) {
        router.push(`/incident/${json.incident.id}`);
      } else {
        alert('Failed to launch incident: ' + JSON.stringify(json.details || json.error));
      }
    } catch (e) {
      console.error(e);
      alert('Network error while launching emergency incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const INCIDENT_TYPES: { type: IncidentType; label: string; icon: string }[] = [
    { type: 'road_accident', label: 'Road Accident / Trauma', icon: '💥' },
    { type: 'cardiac', label: 'Cardiac Arrest / STEMI', icon: '❤️' },
    { type: 'stroke', label: 'Stroke / Neuro Emergency', icon: '🧠' },
    { type: 'burns', label: 'Severe Burns', icon: '🔥' },
    { type: 'obstetric', label: 'Obstetric / Labor', icon: '👶' },
    { type: 'paediatric', label: 'Paediatric Emergency', icon: '🍼' },
    { type: 'other', label: 'General / Other Trauma', icon: '🚨' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* 1-Handed Emergency Header */}
      <div className="p-6 rounded-3xl glass-panel-glow border-red-500/40 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            1-HANDED PARAMEDIC FLOW (INC-1)
          </span>
          <span className="text-xs font-bold text-slate-400">Touch targets &ge; 48px</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Report Emergency Incident
        </h1>
        <p className="text-xs text-slate-300">
          Fast triage classification, auto-GPS capture, and nearest ambulance suggestion.
        </p>
      </div>

      {/* Main Incident Form */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border-slate-800 space-y-6">
        {/* 1. Emergency Type Chips */}
        <div className="space-y-2.5">
          <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
            1. Select Incident Type (Maps Capabilities per HM-3)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INCIDENT_TYPES.map(({ type: t, label, icon }) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`touch-target p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  type === t
                    ? 'bg-cyan-500 text-slate-950 font-black border-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-900/80 text-slate-300 font-bold border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Triage Level Selector */}
        <div className="space-y-2.5 pt-2">
          <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
            2. Initial Triage Severity (START Framework)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { level: 'red' as TriageLevel, label: 'RED (IMMEDIATE)', desc: 'Life-Threatening', color: 'badge-triage-red' },
              { level: 'yellow' as TriageLevel, label: 'YELLOW (DELAYED)', desc: 'Serious / Stable', color: 'badge-triage-yellow' },
              { level: 'green' as TriageLevel, label: 'GREEN (MINOR)', desc: 'Walking Wounded', color: 'badge-triage-green' },
            ].map(({ level, label, desc, color }) => (
              <button
                key={level}
                type="button"
                onClick={() => setTriage(level)}
                className={`touch-target p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  triage === level
                    ? `${color} ring-2 ring-white/60 font-black scale-105`
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 font-semibold opacity-70'
                }`}
              >
                <span className="text-xs">{label}</span>
                <span className="text-[10px] mt-0.5 opacity-80">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Patient Count & GPS Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Patient Count */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Patient Count</span>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPatientCount(Math.max(1, patientCount - 1))}
                className="touch-target w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-black text-white">{patientCount}</span>
              <button
                type="button"
                onClick={() => setPatientCount(patientCount + 1)}
                className="touch-target w-11 h-11 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 flex items-center justify-center font-bold"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">GPS Location</span>
              {isDetectingGps && (
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-semibold">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Detecting...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>{latitude.toFixed(4)}, {longitude.toFixed(4)} (Pune)</span>
            </div>
          </div>
        </div>

        {/* 4. Optional Linked MedPass Token */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Link Patient MedPass (Optional QR Token)
          </label>
          <input
            type="text"
            value={medpassToken}
            onChange={(e) => setMedpassToken(e.target.value)}
            placeholder="e.g. tok_asha_k_9901"
            className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Auto-suggested Ambulance (INC-5) */}
        {suggestedAmbulance && (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <AmbulanceIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-300 block">Auto-Assigned Nearest Ambulance</span>
                <span className="font-black text-cyan-300">
                  {suggestedAmbulance.callsign} • ETA ~{suggestedAmbulance.eta} min to scene
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-900 text-cyan-200 border border-cyan-700 uppercase">
              SUGGESTED
            </span>
          </div>
        )}

        {/* Launch Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCreateIncident}
            disabled={isSubmitting}
            className="touch-target w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base tracking-wide shadow-2xl shadow-red-600/40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span>{isSubmitting ? 'Launching Emergency Grid...' : 'LAUNCH EMERGENCY INCIDENT & DISPATCH'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
