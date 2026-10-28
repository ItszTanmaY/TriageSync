'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Incident,
  Patient,
  Ambulance,
  HospitalRankItem,
  IncidentStatus,
} from '@/lib/types/database';
import { calculateGoldenHour, LIFECYCLE_ORDER } from '@/lib/incident/service';
import { MOCK_HOSPITALS } from '@/lib/supabase/mock-data';
import { HospitalRecommendationList } from '@/components/matching/HospitalRecommendationList';
import { EmergencyMap } from '@/components/map/EmergencyMap';
import {
  ShieldAlert,
  Clock,
  Ambulance as AmbulanceIcon,
  CheckCircle2,
  Play,
  Activity,
} from 'lucide-react';

export default function ParamedicIncidentConsole() {
  const params = useParams();
  const incidentId = typeof params?.id === 'string' ? params.id : 'inc-demo-01';

  const [incident, setIncident] = useState<Incident | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [allAmbulances, setAllAmbulances] = useState<Ambulance[]>([]);
  const [goldenHour, setGoldenHour] = useState<ReturnType<typeof calculateGoldenHour>>({
    elapsedSeconds: 0,
    remainingSeconds: 3600,
    formattedRemaining: '59:59',
    percentageElapsed: 0,
    urgencyTier: 'safe',
    colorClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50',
  });

  const [topRecommendations, setTopRecommendations] = useState<HospitalRankItem[]>([]);
  const [excludedHospitals, setExcludedHospitals] = useState<HospitalRankItem[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  const [isSimulatingStep, setIsSimulatingStep] = useState<boolean>(false);

  // Load Incident, Ambulances, and Recommendations
  useEffect(() => {
    let active = true;

    async function loadIncidentData() {
      try {
        const incRes = await fetch(`/api/incidents/${incidentId}`);
        const incJson = await incRes.json();

        if (active && incJson.success) {
          setIncident(incJson.incident);
          setPatient(incJson.patient);
          setAmbulance(incJson.ambulance);
          if (incJson.goldenHour) setGoldenHour(incJson.goldenHour);
          if (incJson.patient?.destination_hospital_id) {
            setSelectedHospitalId(incJson.patient.destination_hospital_id);
            setReservedUntil(incJson.patient.reserved_until);
          }
        }

        const ambRes = await fetch('/api/ambulances');
        const ambJson = await ambRes.json();
        if (active && ambJson.success) {
          setAllAmbulances(ambJson.data);
        }

        // Fetch Capability Recommendations
        const recRes = await fetch(`/api/incidents/${incidentId}/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incident_type: incJson.incident?.type || 'road_accident',
            triage_level: incJson.patient?.triage || 'red',
            blood_group: 'O-',
          }),
        });
        const recJson = await recRes.json();
        if (active && recJson.success) {
          setTopRecommendations(recJson.topRecommendations || []);
          setExcludedHospitals(recJson.excludedHospitals || []);
          if (!selectedHospitalId && recJson.topRecommendations?.[0]) {
            setSelectedHospitalId(recJson.topRecommendations[0].hospital_id);
          }
        }
      } catch (err) {
        console.error('Failed to load incident console data', err);
      }
    }

    loadIncidentData();

    // Golden hour live countdown interval (ticking every second)
    const timer = setInterval(() => {
      if (incident?.created_at) {
        setGoldenHour(calculateGoldenHour(incident.created_at));
      }
    }, 1000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [incidentId, incident?.created_at, selectedHospitalId]);

  // Handle Lifecycle Status Transition
  const handleTransitionStatus = async (newStatus: IncidentStatus) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success && json.incident) {
        setIncident(json.incident);
      }
    } catch (err) {
      console.error('Status transition error', err);
    }
  };

  // Handle Hospital Selection & 15-Minute Bed Hold
  const handleSelectHospital = async (hospitalId: string, overrideReason?: string) => {
    try {
      const res = await fetch(`/api/patients/${patient?.id || incidentId}/select-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: hospitalId,
          override_reason: overrideReason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedHospitalId(hospitalId);
        setReservedUntil(json.reserved_until);
      }
    } catch (err) {
      console.error('Selection error', err);
    }
  };

  // Simulate 1 Route Step (SIM-2)
  const handleSimulateStep = async () => {
    setIsSimulatingStep(true);
    try {
      const res = await fetch('/api/sim/ambulances/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambulance_id: ambulance?.id || 'amb-101',
          destination_hospital_id: selectedHospitalId || 'hosp-001',
        }),
      });
      const json = await res.json();
      if (json.success && json.ambulance) {
        setAmbulance(json.ambulance);
        setAllAmbulances((prev) =>
          prev.map((a) => (a.id === json.ambulance.id ? json.ambulance : a))
        );
      }
    } catch (err) {
      console.error('Simulation step error', err);
    } finally {
      setIsSimulatingStep(false);
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* 1. Golden Hour Urgency Countdown Banner (INC-4) */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl ${goldenHour.colorClass}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-950/60 flex items-center justify-center font-black text-xl">
            <Clock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest block opacity-90">
              GOLDEN HOUR TRAUMA WINDOW (INC-4)
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
              {goldenHour.formattedRemaining}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="w-40 sm:w-56 bg-slate-950/60 rounded-full h-3 p-0.5 overflow-hidden border border-white/20">
            <div
              className="bg-current h-2 rounded-full transition-all duration-1000"
              style={{ width: `${goldenHour.percentageElapsed}%` }}
            />
          </div>
          <span className="text-xs font-bold whitespace-nowrap">
            {goldenHour.percentageElapsed}% Elapsed
          </span>
        </div>
      </div>

      {/* 2. Top Header: Incident Identity & Lifecycle Steppers (INC-3) */}
      <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-triage-red px-2.5 py-0.5 rounded-full text-xs font-black uppercase">
                  {patient?.triage || 'RED'} SEVERITY
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {incident?.type?.replace('_', ' ').toUpperCase() || 'ROAD ACCIDENT'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Incident #{incidentId.slice(-8)}
              </h1>
            </div>
          </div>

          {/* Assigned Ambulance Callout */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <AmbulanceIcon className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="font-bold text-slate-200 block">
                Assigned Unit: {ambulance?.callsign || 'Apex-101'}
              </span>
              <span className="text-slate-400 capitalize">Status: {ambulance?.status || 'Assigned'}</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateStep}
              disabled={isSimulatingStep}
              className="touch-target ml-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black flex items-center gap-1.5 text-xs active:scale-95 transition-all"
              title="Advances simulated ambulance along OSRM route"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulatingStep ? 'Stepping...' : 'Simulate 1 Step'}</span>
            </button>
          </div>
        </div>

        {/* Lifecycle State Buttons (INC-3) */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Incident Lifecycle Progression
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {LIFECYCLE_ORDER.map((step) => {
              const currentStatus = incident?.status || 'created';
              const currentIdx = LIFECYCLE_ORDER.indexOf(currentStatus);
              const stepIdx = LIFECYCLE_ORDER.indexOf(step);
              const isPast = stepIdx <= currentIdx;
              const isCurrent = step === currentStatus;

              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleTransitionStatus(step)}
                  className={`touch-target p-3 rounded-xl border text-center text-xs font-bold capitalize transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 border-white shadow-lg shadow-cyan-500/25 font-black scale-105'
                      : isPast
                      ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="block truncate">{step.replace('_', ' ')}</span>
                  {isPast && !isCurrent && <CheckCircle2 className="w-3.5 h-3.5 mx-auto mt-1 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Interactive Leaflet / Tactical Map (CC-1) */}
      <EmergencyMap
        hospitals={MOCK_HOSPITALS}
        ambulances={allAmbulances}
        incidentLocation={incident?.location || { latitude: 18.5204, longitude: 73.8567 }}
        selectedHospitalId={selectedHospitalId}
        activeAmbulanceId={ambulance?.id || 'amb-101'}
      />

      {/* 4. Integrated Hospital Recommendations & Factor Breakdown (HM-4, HM-5, HM-8) */}
      <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-black text-white tracking-wide">
              Capability-Aware Destination Routing
            </h2>
          </div>
          <span className="text-xs text-slate-400">Live 15-Minute Bed Hold Engine</span>
        </div>

        <HospitalRecommendationList
          patientId={patient?.id || incidentId}
          topRecommendations={topRecommendations}
          excludedHospitals={excludedHospitals}
          onSelectHospital={handleSelectHospital}
          selectedHospitalId={selectedHospitalId}
          reservedUntil={reservedUntil}
        />
      </div>
    </div>
  );
}
