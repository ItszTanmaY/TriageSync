'use client';

import React, { useState, useEffect } from 'react';
import { HospitalQueueRadar } from '@/components/queue/HospitalQueueRadar';
import { EmergencyMap } from '@/components/map/EmergencyMap';
import { MOCK_HOSPITALS, MOCK_RESOURCES } from '@/lib/supabase/mock-data';
import { Ambulance, Incident, DiversionRecord } from '@/lib/types/database';
import { QueueTelemetry } from '@/lib/queue/engine';
import { distributeMciPatients, MciDistributionResult, MciPatient } from '@/lib/matching/mci';
import {
  ShieldAlert,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Users,
  Navigation,
} from 'lucide-react';

export default function CommandCenterPage() {
  const [queueData, setQueueData] = useState<(QueueTelemetry & { hospitalName: string })[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [diversions, setDiversions] = useState<DiversionRecord[]>([]);
  const [isSurging, setIsSurging] = useState<boolean>(false);
  const [isMciOpen, setIsMciOpen] = useState<boolean>(false);
  const [mciResult, setMciResult] = useState<MciDistributionResult | null>(null);
  const [greenCorridorActive, setGreenCorridorActive] = useState<boolean>(false);
  const [surgeResult, setSurgeResult] = useState<{
    scenario: string;
    targetHospital: string;
    fallbackHospital: string;
    steps: {
      step: number;
      ambulance: string;
      status: string;
      inbound: number;
      projectedLoad: number;
      waitMinutes?: number;
      action: string;
      reason?: string;
    }[];
  } | null>(null);

  const handleRunMciSimulation = (patientCount: number = 10) => {
    const victims: MciPatient[] = [
      { id: 'MCI-01', triage: 'RED' as const, conditionDescription: 'Unresponsive driver, flail chest, severe hypotension' },
      { id: 'MCI-02', triage: 'RED' as const, conditionDescription: 'Traumatic brain injury, GCS 8, left pupil dilated' },
      { id: 'MCI-03', triage: 'RED' as const, conditionDescription: 'Severe pelvic crush injury with active arterial hemorrhage' },
      { id: 'MCI-04', triage: 'YELLOW' as const, conditionDescription: 'Compound open femur fracture with controlled bleeding' },
      { id: 'MCI-05', triage: 'YELLOW' as const, conditionDescription: 'Blunt chest contusion, stable vitals, SpO2 94%' },
      { id: 'MCI-06', triage: 'YELLOW' as const, conditionDescription: 'Abdominal pain with guarding, hemodynamically compensated' },
      { id: 'MCI-07', triage: 'YELLOW' as const, conditionDescription: 'Multiple deep lacerations, shoulder dislocation' },
      { id: 'MCI-08', triage: 'GREEN' as const, conditionDescription: 'Superficial facial abrasions, mild concussion' },
      { id: 'MCI-09', triage: 'GREEN' as const, conditionDescription: 'Wrist sprain, contusions, ambulatory walking wounded' },
      { id: 'MCI-10', triage: 'BLACK' as const, conditionDescription: 'Severe cranial devastation, no signs of life on arrival' },
    ].slice(0, patientCount);

    const result = distributeMciPatients(victims, MOCK_HOSPITALS, MOCK_RESOURCES);
    setMciResult(result);
    setIsMciOpen(true);
  };

  // Load telemetry data
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const qRes = await fetch('/api/queue/overview');
        const qJson = await qRes.json();
        if (active && qJson.success) {
          setQueueData(qJson.data || []);
          setDiversions(qJson.diversions || []);
        }

        const ambRes = await fetch('/api/ambulances');
        const ambJson = await ambRes.json();
        if (active && ambJson.success) {
          setAmbulances(ambJson.data || []);
        }

        const incRes = await fetch('/api/incidents');
        const incJson = await incRes.json();
        if (active && incJson.success) {
          setIncidents(incJson.data || []);
        }
      } catch (err) {
        console.error('Failed to load command data', err);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Trigger Surge Chaos Test (SIM-3)
  const handleTriggerSurge = async () => {
    setIsSurging(true);
    try {
      const res = await fetch('/api/sim/surge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: 'hosp-001' }),
      });
      const json = await res.json();
      if (json.success) {
        setSurgeResult(json);
        // Refresh queue overview
        const qRes = await fetch('/api/queue/overview');
        const qJson = await qRes.json();
        if (qJson.success) {
          setQueueData(qJson.data || []);
          setDiversions(qJson.diversions || []);
        }
      }
    } catch (e) {
      console.error('Surge error', e);
    } finally {
      setIsSurging(false);
    }
  };

  const totalOverloaded = queueData.filter((q) => q.isOverloaded).length;

  return (
    <div className="space-y-10 py-2">
      {/* Top Banner: Dispatcher Grid Status */}
      <div className="p-6 rounded-3xl glass-panel-glow border-cyan-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                City Dispatch Command Center (CC-1..CC-4)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                GRID SYNCHRONIZED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Pune Municipal Emergency Network
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live fleet tracking, QueuePredict load balancing, and autonomous hospital diversion.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Green Corridor Toggle (CC-3) */}
          <button
            type="button"
            onClick={() => setGreenCorridorActive(!greenCorridorActive)}
            className={`touch-target px-4 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center gap-2 ${
              greenCorridorActive
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-white/10'
            }`}
            aria-label="Toggle Green Corridor Traffic Grid Signal"
          >
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>{greenCorridorActive ? 'Green Corridor: ACTIVE (Bund Rd)' : 'Signal Green Corridor (CC-3)'}</span>
          </button>

          {/* Mass-Casualty Mode Trigger (CC-2) */}
          <button
            type="button"
            onClick={() => handleRunMciSimulation(10)}
            className="touch-target px-4 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 shadow-sm"
            aria-label="Run Mass-Casualty Multi-Patient Distribution Simulation"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>MCI Mode: 10-Victim Split (CC-2)</span>
          </button>

          {/* Chaos Surge Test (SIM-3) */}
          <button
            type="button"
            onClick={handleTriggerSurge}
            disabled={isSurging}
            className="touch-target px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#FF2A44]/40 text-[#FF2A44] font-mono text-xs uppercase tracking-wider font-semibold shadow-sm transition-all flex items-center gap-2"
            aria-label="Run 3-Ambulance Surge Chaos Test"
          >
            <AlertTriangle className="w-4 h-4 text-[#FF2A44]" />
            <span>{isSurging ? 'Surging...' : 'Chaos Surge (SIM-3)'}</span>
          </button>
        </div>
      </div>

      {/* Green Corridor Active Banner (CC-3) */}
      {greenCorridorActive && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-4 text-xs font-mono text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span>
              <strong>EMERGENCY GREEN CORRIDOR ACTIVE:</strong> Priority route cleared from Koregaon Park Junction to Ruby Apex Trauma Institute. All traffic signals held green via Pune Traffic Command (CC-3).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setGreenCorridorActive(false)}
            className="text-zinc-400 hover:text-white px-2 py-1 rounded bg-black/40"
            aria-label="Dismiss Green Corridor Signal"
          >
            Deactivate
          </button>
        </div>
      )}

      {/* Grid Stats Bar & Analytics (CC-4) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl glass-panel border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Active Facilities</div>
          <div className="text-3xl font-black text-white mt-1">{MOCK_HOSPITALS.length}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">All telemetry online</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Fleet Vehicles</div>
          <div className="text-3xl font-black text-cyan-400 mt-1">{ambulances.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">GPS positions synced</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Near Capacity</div>
          <div className={`text-3xl font-black mt-1 ${totalOverloaded > 0 ? 'text-[#FF2A44]' : 'text-slate-300'}`}>
            {totalOverloaded}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">&gt; 85% projected load</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Avg Time-to-ER</div>
          <div className="text-3xl font-black text-white mt-1">11.4<span className="text-lg font-light text-zinc-400">m</span></div>
          <div className="text-[11px] text-emerald-400 mt-0.5">Golden Hour (CC-4)</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Autonomous Diversions</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{diversions.length}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">Dead-ends prevented</div>
        </div>
      </div>

      {/* QueuePredict Load Balancing Widget (QP-1..QP-5) */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border-slate-800 space-y-6">
        <HospitalQueueRadar
          queueData={queueData}
          onTriggerSurge={handleTriggerSurge}
          isSurging={isSurging}
        />
      </div>

      {/* Live Tactical Map (CC-1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            Live Sector Map & Fleet Telemetry
          </h2>
          <span className="text-xs text-slate-400 font-medium">OSRM Real-Time Routing</span>
        </div>
        <EmergencyMap
          hospitals={MOCK_HOSPITALS}
          ambulances={ambulances}
          incidentLocation={incidents[0]?.location || { latitude: 18.5204, longitude: 73.8567 }}
          selectedHospitalId="hosp-001"
          activeAmbulanceId="amb-101"
        />
      </div>

      {/* Active Diversions & Dead-Ends Prevented Log */}
      <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-white text-base">
              Autonomous Diversions Log (Mathematical Record)
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-bold">
            {diversions.length} Dead-Ends Avoided
          </span>
        </div>

        {diversions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">
            No active diversions. Click &quot;Chaos Test: Surge 3 Ambulances&quot; above to trigger load-balancing reroute.
          </p>
        ) : (
          <div className="space-y-3">
            {diversions.map((div, i) => (
              <div
                key={div.id || i}
                className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Diverted from {div.from_hospital} to {div.to_hospital}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{div.reason}</p>
                </div>
                <div className="font-mono text-xs text-amber-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  Projected Load: {Math.round((div.numbers?.projected_load || 0.9) * 100)}% • Wait: {div.numbers?.wait_min || 18}m
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Surge Chaos Test Results Modal (SIM-3) */}
      {surgeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl glass-panel-glow border-red-500/40 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg">
                    {surgeResult.scenario}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Target: {surgeResult.targetHospital}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSurgeResult(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              {surgeResult.steps.map((step) => (
                <div
                  key={step.step}
                  className={`p-4 rounded-2xl border ${
                    step.status === 'DIVERTED'
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30'
                      : 'bg-slate-900 border-slate-800'
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">
                      Ambulance #{step.step}: {step.ambulance}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        step.status === 'DIVERTED'
                          ? 'bg-amber-900 text-amber-200 border border-amber-600 animate-pulse'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{step.action}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Projected ER Load: {step.projectedLoad}% {step.waitMinutes ? `• Wait: ${step.waitMinutes}m` : ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3 text-xs text-emerald-300 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Dead-end avoided: {surgeResult.targetHospital} ER remained functional; patient safely routed to {surgeResult.fallbackHospital}.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSurgeResult(null)}
                className="touch-target px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs uppercase"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mass-Casualty Incident (MCI) Distribution Modal (CC-2) */}
      {isMciOpen && mciResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#08080c] border border-purple-500/40 space-y-6 text-zinc-100 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    Mass-Casualty Incident Protocol (CC-2)
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Optimal Greedy Multi-Hospital Split • {mciResult.totalPatientsProcessed} Patients Processed
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMciOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10"
                aria-label="Close Mass-Casualty Protocol Modal"
              >
                ✕ Close
              </button>
            </div>

            {/* Allocations Table */}
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
                Patient Allocations &amp; Bed Reservations
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {mciResult.allocations.map((alloc) => (
                  <div
                    key={alloc.patientId}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          alloc.triage === 'RED'
                            ? 'bg-[#FF2A44]/20 text-[#FF2A44] border border-[#FF2A44]/40'
                            : alloc.triage === 'YELLOW'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : alloc.triage === 'GREEN'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {alloc.triage}
                      </span>
                      <span className="font-bold text-white">{alloc.patientId}</span>
                      <span className="text-zinc-400 truncate max-w-xs">{alloc.allocationReason}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-white font-medium">{alloc.hospitalName}</span>
                      <span className="text-zinc-500 block text-[10px] uppercase">
                        Reserved: {alloc.bedTypeAssigned.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hospital Load Summary */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
                Hospital Capacity Residuals After MCI Influx
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {mciResult.hospitalLoadSummary
                  .filter((h) => h.assignedRed > 0 || h.assignedYellow > 0 || h.assignedGreen > 0)
                  .map((h) => (
                    <div
                      key={h.hospitalId}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-1"
                    >
                      <div className="font-bold text-white">{h.hospitalName}</div>
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>Inbound: {h.assignedRed} RED • {h.assignedYellow} YEL</span>
                        <span className="text-emerald-400 font-mono">Bays left: {h.traumaBaysRemaining}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsMciOpen(false)}
                className="touch-target px-6 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase"
              >
                Accept MCI Allocations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
