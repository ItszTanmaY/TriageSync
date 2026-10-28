'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ambulance, Building2, ShieldAlert } from 'lucide-react';
import { VoiceHandoverConsole } from '@/components/voice/VoiceHandoverConsole';
import { Incident, Patient, Ambulance as AmbulanceType } from '@/lib/types/database';
import { MOCK_HOSPITALS } from '@/lib/supabase/mock-data';

export default function ParamedicVoiceHandoverPage() {
  const params = useParams();
  const incidentId = typeof params?.id === 'string' ? params.id : 'inc-demo-01';

  const [incident, setIncident] = useState<Incident | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [ambulance, setAmbulance] = useState<AmbulanceType | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const incRes = await fetch(`/api/incidents/${incidentId}`);
        const incJson = await incRes.json();

        if (active && incJson.success) {
          setIncident(incJson.incident);
          setPatient(incJson.patient);
          setAmbulance(incJson.ambulance);
        }
      } catch (err) {
        console.error('Failed to load incident for handover:', err);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [incidentId]);

  const destinationHospitalId = patient?.destination_hospital_id || 'hosp-sahyadri';
  const hospital =
    MOCK_HOSPITALS.find((h) => h.id === destinationHospitalId) || MOCK_HOSPITALS[0];

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Navigation Bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link
          href={`/incident/${incidentId}`}
          className="min-h-[48px] px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Incident
        </Link>

        <div className="flex items-center gap-3">
          {incident?.type && (
            <span className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-mono uppercase rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
              {incident.type.replace('_', ' ')}
            </span>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Ambulance className="w-4 h-4 text-cyan-400" />
            <span>Fleet: <strong className="text-white">{ambulance?.callsign || 'Apex-101'}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="truncate max-w-[150px]">{hospital.name}</span>
          </div>
        </div>
      </div>

      {/* Main Voice Handover Console */}
      <div className="max-w-4xl mx-auto">
        <VoiceHandoverConsole
          incidentId={incidentId}
          patientId={patient?.id || `pat-${incidentId}`}
          hospitalId={hospital.id}
          hospitalName={hospital.name}
          onHandoverConfirmed={() => {
            // After 3 seconds, allow quick jump back or to hospital dashboard
          }}
        />
      </div>

      {/* Footer Navigation & Shortcut */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800/80 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-500" />
          <span>TriageSync 2.0 Emergency Voice Link (Hands-Free Paramedic Workstation)</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/hospital/dashboard"
            className="hover:text-cyan-400 underline underline-offset-4"
          >
            Open ER Staff Dashboard →
          </Link>
          <Link
            href="/command"
            className="hover:text-cyan-400 underline underline-offset-4"
          >
            Open City Command Center →
          </Link>
        </div>
      </div>
    </div>
  );
}
