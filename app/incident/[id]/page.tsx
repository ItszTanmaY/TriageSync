'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
    colorClass: '',
  });

  const [topRecommendations, setTopRecommendations] = useState<HospitalRankItem[]>([]);
  const [excludedHospitals, setExcludedHospitals] = useState<HospitalRankItem[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  const [isSimulatingStep, setIsSimulatingStep] = useState<boolean>(false);

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
    <div className="space-y-10 py-2">
      {/* 1. Precision Golden Hour Telemetry */}
      <div className="p-6 rounded-2xl tactile-panel flex flex-col sm:flex-row items-center justify-between gap-6 border-white/[0.09]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            <span className="telemetry-pip bg-[#FF2A44] shadow-[0_0_8px_#FF2A44]" />
            GOLDEN HOUR TRAUMA WINDOW
          </div>
          <div className="font-mono text-4xl sm:text-5xl font-light text-white tracking-tight">
            {goldenHour.formattedRemaining}
          </div>
        </div>

        <div className="w-full sm:w-72 space-y-2">
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-1000"
              style={{ width: `${goldenHour.percentageElapsed}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            <span>Elapsed: {goldenHour.percentageElapsed}%</span>
            <span>Limit: 60 MIN</span>
          </div>
        </div>
      </div>

      {/* 2. Incident Header & Lifecycle Progress Bar */}
      <div className="p-6 rounded-2xl tactile-panel space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                INCIDENT ID: {incidentId}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-white/20 text-white">
                {patient?.triage?.toUpperCase() || 'RED'} SEVERITY
              </span>
            </div>
            <h1 className="text-2xl font-normal text-white">
              {incident?.type?.replace('_', ' ').toUpperCase() || 'TRAUMA INCIDENT'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <Link
              href={`/incident/${incidentId}/handover`}
              className="touch-target px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>🎙️ Voice Handover (SBAR)</span>
            </Link>
            <div className="text-right">
              <div className="text-zinc-500 uppercase text-[10px]">Fleet Unit</div>
              <div className="text-white font-medium">{ambulance?.callsign || 'Apex-101'}</div>
            </div>
            <button
              type="button"
              onClick={handleSimulateStep}
              disabled={isSimulatingStep}
              className="touch-target px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-mono text-xs uppercase tracking-wider active:scale-95 transition-all"
            >
              {isSimulatingStep ? 'Stepping...' : 'Simulate 1 Step →'}
            </button>
          </div>
        </div>

        {/* Lifecycle Buttons */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block">
            Lifecycle Progress
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
                  className={`touch-target p-3 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all ${
                    isCurrent
                      ? 'bg-white text-black border-white font-bold'
                      : isPast
                      ? 'bg-zinc-900 border-white/20 text-white'
                      : 'bg-zinc-950/60 border-white/[0.06] text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {step.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Tactical Map Display */}
      <EmergencyMap
        hospitals={MOCK_HOSPITALS}
        ambulances={allAmbulances}
        incidentLocation={incident?.location || { latitude: 18.5204, longitude: 73.8567 }}
        selectedHospitalId={selectedHospitalId}
        activeAmbulanceId={ambulance?.id || 'amb-101'}
      />

      {/* 4. Explainable Capability Recommendation List */}
      <div className="p-6 rounded-2xl tactile-panel space-y-6">
        <div className="border-b border-white/[0.08] pb-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Capability-Aware Destination Routing
          </h2>
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
