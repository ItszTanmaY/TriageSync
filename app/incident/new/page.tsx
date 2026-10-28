'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  const INCIDENT_TYPES: { type: IncidentType; code: string; label: string }[] = [
    { type: 'road_accident', code: '01', label: 'Trauma / Road Accident' },
    { type: 'cardiac', code: '02', label: 'Cardiac Arrest / STEMI' },
    { type: 'stroke', code: '03', label: 'Acute Stroke / Neuro' },
    { type: 'burns', code: '04', label: 'Severe Burns' },
    { type: 'obstetric', code: '05', label: 'Obstetric Emergency' },
    { type: 'paediatric', code: '06', label: 'Paediatric Critical Care' },
    { type: 'other', code: '07', label: 'General / Other Emergency' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
          PARAMEDIC INCIDENT DISPATCH / SEC 01
        </div>
        <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
          Report Emergency
        </h1>
        <p className="text-sm text-zinc-400 font-normal">
          One-handed rapid triage reporting with automatic nearest fleet assignment.
        </p>
      </div>

      <div className="space-y-8">
        {/* 1. Incident Type Selection (Clean Typographic Grid) */}
        <div className="space-y-3">
          <label className="font-mono text-xs uppercase tracking-wider text-zinc-400 block">
            Select Condition Class
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INCIDENT_TYPES.map(({ type: t, code, label }) => {
              const isSelected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`touch-target p-4 rounded-xl text-left flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)] font-semibold'
                      : 'bg-zinc-950/80 text-zinc-300 border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <span className="text-sm">{label}</span>
                  <span className={`font-mono text-xs ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Triage Severity Selector */}
        <div className="space-y-3">
          <label className="font-mono text-xs uppercase tracking-wider text-zinc-400 block">
            Initial Triage Severity (START Framework)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { level: 'red' as TriageLevel, label: 'RED', sub: 'Immediate', color: 'bg-[#FF2A44]', border: 'border-[#FF2A44]' },
              { level: 'yellow' as TriageLevel, label: 'YELLOW', sub: 'Delayed', color: 'bg-[#FFB020]', border: 'border-[#FFB020]' },
              { level: 'green' as TriageLevel, label: 'GREEN', sub: 'Minor', color: 'bg-[#00E599]', border: 'border-[#00E599]' },
            ].map(({ level, label, sub, color, border }) => {
              const isSelected = triage === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setTriage(level)}
                  className={`touch-target p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    isSelected
                      ? `bg-zinc-900 ${border} text-white ring-1 ring-white/20`
                      : 'bg-zinc-950/60 border-white/[0.08] text-zinc-400 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`telemetry-pip ${color}`} />
                    <span className="font-mono text-xs font-semibold">{label}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Patient Count & GPS Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl tactile-panel space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block">
              Patient Count
            </span>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setPatientCount(Math.max(1, patientCount - 1))}
                className="touch-target w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/25 text-white flex items-center justify-center font-mono text-lg"
              >
                -
              </button>
              <span className="font-mono text-3xl font-light text-white">{patientCount}</span>
              <button
                type="button"
                onClick={() => setPatientCount(patientCount + 1)}
                className="touch-target w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/25 text-white flex items-center justify-center font-mono text-lg"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl tactile-panel space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block">
                GPS Coordinate
              </span>
              {isDetectingGps && (
                <span className="font-mono text-[10px] text-zinc-500">Detecting...</span>
              )}
            </div>
            <div className="font-mono text-base font-normal text-white pt-2">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </div>
            <span className="font-mono text-[11px] text-zinc-500 block">Pune Central Sector</span>
          </div>
        </div>

        {/* 4. Optional Linked MedPass Token */}
        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-wider text-zinc-400 block">
            Link MedPass Token (Optional)
          </label>
          <input
            type="text"
            value={medpassToken}
            onChange={(e) => setMedpassToken(e.target.value)}
            placeholder="tok_..."
            className="touch-target w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Auto-suggested Ambulance (Monochrome Telemetry) */}
        {suggestedAmbulance && (
          <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-950/40 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-zinc-500 block uppercase text-[10px]">Auto-Assigned Fleet Unit</span>
              <span className="text-white font-medium text-sm">
                {suggestedAmbulance.callsign} — ETA ~{suggestedAmbulance.eta} MIN
              </span>
            </div>
            <span className="telemetry-pip bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleCreateIncident}
            disabled={isSubmitting}
            className="touch-target w-full py-4 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono font-semibold text-xs uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.99] flex items-center justify-center gap-3"
          >
            <span>{isSubmitting ? 'DISPATCHING EMERGENCY GRID...' : 'DISPATCH EMERGENCY & RESERVE HOSPITAL'}</span>
            <span className="font-sans font-bold text-sm">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
