'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IncidentType, TriageLevel } from '@/lib/types/database';
import { PUNE_CENTER } from '@/lib/config';
import { findNearestAvailableAmbulance } from '@/lib/incident/service';
import { MOCK_AMBULANCES } from '@/lib/supabase/mock-data';
import { Flame, Ambulance, Navigation, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto space-y-8 py-2 sm:py-6">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-mono font-bold tracking-wider uppercase">
          <Flame className="w-3.5 h-3.5 animate-pulse" />
          <span>PARAMEDIC INCIDENT DISPATCH / SEC 01</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Report Emergency Incident
        </h1>
        <p className="text-sm text-slate-600 font-normal">
          One-handed rapid triage reporting with automatic nearest fleet assignment and hospital capability matching.
        </p>
      </div>

      <div className="space-y-8">
        {/* 1. Incident Type Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
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
                  className={`min-h-[52px] p-4 rounded-2xl text-left flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-sky-50 text-sky-900 border-sky-400 font-bold shadow-sm ring-1 ring-sky-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm">{label}</span>
                  <span className={`font-mono text-xs ${isSelected ? 'text-sky-700 font-bold' : 'text-slate-400'}`}>
                    {code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Triage Severity Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Initial Triage Severity (START Protocol)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                level: 'red' as TriageLevel,
                label: 'RED',
                sub: 'Immediate',
                activeClass: 'bg-red-50 text-red-700 border-red-500 ring-2 ring-red-400 font-black',
                dotColor: 'bg-red-600 animate-ping',
              },
              {
                level: 'yellow' as TriageLevel,
                label: 'YELLOW',
                sub: 'Delayed',
                activeClass: 'bg-amber-50 text-amber-700 border-amber-500 ring-2 ring-amber-400 font-black',
                dotColor: 'bg-amber-500',
              },
              {
                level: 'green' as TriageLevel,
                label: 'GREEN',
                sub: 'Minor',
                activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-400 font-black',
                dotColor: 'bg-emerald-500',
              },
            ].map(({ level, label, sub, activeClass, dotColor }) => {
              const isSelected = triage === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setTriage(level)}
                  className={`min-h-[58px] p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                    isSelected
                      ? activeClass
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                    <span className="font-mono text-xs font-bold">{label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Patient Count & GPS Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Patient Count
            </span>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setPatientCount(Math.max(1, patientCount - 1))}
                className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-900 flex items-center justify-center font-mono text-xl font-bold transition-all"
                aria-label="Decrease patient count"
              >
                -
              </button>
              <span className="font-mono text-3xl font-black text-slate-900">{patientCount}</span>
              <button
                type="button"
                onClick={() => setPatientCount(patientCount + 1)}
                className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-900 flex items-center justify-center font-mono text-xl font-bold transition-all"
                aria-label="Increase patient count"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                GPS Location
              </span>
              {isDetectingGps && (
                <span className="font-mono text-[10px] text-sky-600 font-bold animate-pulse">
                  Detecting GPS...
                </span>
              )}
            </div>
            <div className="font-mono text-base font-bold text-slate-900 pt-2 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-sky-600" />
              <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
            </div>
            <span className="text-xs text-slate-500 block font-medium">Pune Central Sector</span>
          </div>
        </div>

        {/* 4. Optional Linked MedPass Token */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Link MedPass Token (Optional)</span>
          </label>
          <input
            type="text"
            value={medpassToken}
            onChange={(e) => setMedpassToken(e.target.value)}
            placeholder="tok_asha_k_9901"
            className="w-full min-h-[48px] px-4 py-3 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Auto-suggested Ambulance */}
        {suggestedAmbulance && (
          <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                <Ambulance className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-sky-800 uppercase font-mono font-bold block">
                  Auto-Assigned Fleet Unit
                </span>
                <span className="text-slate-900 font-bold text-sm">
                  {suggestedAmbulance.callsign} — ETA ~{suggestedAmbulance.eta} MIN
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
              READY
            </span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCreateIncident}
            disabled={isSubmitting}
            className="w-full min-h-[54px] py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-xl shadow-red-600/30 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <HeartPulse className="w-5 h-5" />
            <span>{isSubmitting ? 'DISPATCHING EMERGENCY GRID...' : 'DISPATCH EMERGENCY & RESERVE HOSPITAL'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
