'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { MOCK_HOSPITALS } from '@/lib/supabase/mock-data';
import {
  Hospital,
  HospitalResources,
  BloodStockItem,
  Patient,
  HandoverRecord,
} from '@/lib/types/database';
import { calculateFreshnessStatus } from '@/lib/hospital/resources';
import { generatePreArrivalChecklist } from '@/lib/voice/parser';
import { useAuth } from '@/lib/auth/context';

export default function HospitalDashboardPage() {
  const { user, switchUser } = useAuth();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(() => {
    return user?.hospital_id || 'hosp-001';
  });
  const [hospital, setHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    if (user?.role === 'hospital_staff' && user.hospital_id) {
      setSelectedHospitalId(user.hospital_id);
    }
  }, [user]);
  const [resources, setResources] = useState<HospitalResources | null>(null);
  const [bloodStock, setBloodStock] = useState<BloodStockItem[]>([]);
  const [incomingPatients, setIncomingPatients] = useState<{ patient: Patient; handover?: HandoverRecord }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [audioChimePlayed, setAudioChimePlayed] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const playRedInboundChime = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
      setAudioChimePlayed(true);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const found = MOCK_HOSPITALS.find((h) => h.id === selectedHospitalId);
        if (found && active) setHospital(found);

        const resRes = await fetch(`/api/hospital/resources?hospital_id=${selectedHospitalId}`);
        const resJson = await resRes.json();
        if (active && resJson.data) {
          setResources(resJson.data);
        }

        const bloodRes = await fetch(`/api/hospital/blood?hospital_id=${selectedHospitalId}`);
        const bloodJson = await bloodRes.json();
        if (active && bloodJson.data) {
          setBloodStock(bloodJson.data);
        }

        if (selectedHospitalId === 'hosp-001') {
          setIncomingPatients([
            {
              patient: {
                id: 'pat-demo-01',
                incident_id: 'inc-demo-01',
                medpass_id: 'mp-001',
                triage: 'red',
                est_age: 36,
                sex: 'Female',
                destination_hospital_id: 'hosp-001',
                reserved_until: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
                eta_min: 7,
              },
              handover: {
                id: 'ho-demo-01',
                patient_id: 'pat-demo-01',
                transcript: '36F unrestrained passenger in rollover crash. Blunt chest trauma, BP 85/55, HR 125, GCS 11.',
                structured: {
                  age: 36,
                  sex: 'Female',
                  mechanism: 'Rollover high-speed MVC',
                  injuries: ['Flail chest', 'Suspected spleen laceration', 'Left femur fracture'],
                  vitals: { hr: 125, bp: '85/55', spo2: 91, gcs: 11 },
                  interventions: ['C-collar', '2x 18G IV fluids 500mL', 'High-flow O2'],
                  needs: { blood_group: 'O-', units: 2, ot: true, ventilator: true, specialist: 'Trauma Surgeon' },
                  notes: 'Known MedPass: Penicillin allergy. Unstable.',
                },
                needs: { blood_group: 'O-', units: 2, ot: true, ventilator: true, specialist: 'Trauma Surgeon' },
                confirmed: true,
                created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              },
            },
          ]);
        } else {
          setIncomingPatients([]);
        }
      } catch (err) {
        console.error('Failed to load hospital data:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [selectedHospitalId]);

  const updateResourceField = (
    field: 'icu_free' | 'er_free' | 'trauma_bay_free' | 'ventilators_free',
    delta: number
  ) => {
    if (!resources) return;
    const current = resources[field];
    const updatedVal = Math.max(0, current + delta);

    const newResources: HospitalResources = {
      ...resources,
      [field]: updatedVal,
      updated_at: new Date().toISOString(),
    };

    setResources(newResources);

    startTransition(async () => {
      try {
        await fetch('/api/hospital/resources', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newResources),
        });
      } catch (e) {
        console.error('Failed to patch resource', e);
      }
    });
  };

  const toggleEquipment = (field: 'ot_available' | 'cath_lab_available' | 'ct_available') => {
    if (!resources) return;
    const newResources: HospitalResources = {
      ...resources,
      [field]: !resources[field],
      updated_at: new Date().toISOString(),
    };
    setResources(newResources);

    startTransition(async () => {
      try {
        await fetch('/api/hospital/resources', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newResources),
        });
      } catch (e) {
        console.error('Failed to patch equipment', e);
      }
    });
  };

  const toggleOnCallSpecialist = (specialistKey: string) => {
    if (!resources) return;
    const currentStatus = Boolean(resources.on_call[specialistKey as keyof typeof resources.on_call]);
    const updatedOnCall = {
      ...resources.on_call,
      [specialistKey]: !currentStatus,
    };
    const newResources: HospitalResources = {
      ...resources,
      on_call: updatedOnCall,
      updated_at: new Date().toISOString(),
    };
    setResources(newResources);

    startTransition(async () => {
      try {
        await fetch('/api/hospital/resources', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newResources),
        });
      } catch (e) {
        console.error('Failed to update specialist', e);
      }
    });
  };

  const updateBloodStockUnits = (group: string, delta: number) => {
    const item = bloodStock.find((b) => b.blood_group === group);
    if (!item) return;

    const newUnits = Math.max(0, item.units + delta);
    setBloodStock((prev) =>
      prev.map((b) => (b.blood_group === group ? { ...b, units: newUnits } : b))
    );

    startTransition(async () => {
      try {
        await fetch('/api/hospital/blood', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospital_id: selectedHospitalId,
            blood_group: group,
            units: newUnits,
          }),
        });
      } catch (e) {
        console.error('Failed to update blood stock', e);
      }
    });
  };

  const freshness = resources
    ? calculateFreshnessStatus(resources.updated_at)
    : { label: 'Checking...', tier: 'fresh' };

  return (
    <div className="space-y-10 py-2">
      {/* Role-Scoped Access Banner */}
      {user?.role === 'citizen' && (
        <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="telemetry-pip bg-[#00E599]" />
            <span>Viewing as Citizen ({user.full_name}). Public View: Log in as Hospital Staff to manage emergency bed counts.</span>
          </div>
          <button
            type="button"
            onClick={() => switchUser('hospital_staff')}
            className="touch-target px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold uppercase text-[10px] tracking-wider transition-colors shrink-0"
          >
            Switch to ER Staff Demo
          </button>
        </div>
      )}

      {user?.role === 'hospital_staff' && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs font-mono text-cyan-300">
          <div className="flex items-center gap-2">
            <span className="telemetry-pip bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
            <span>Authenticated ER Clinical Session: <strong>{user.full_name}</strong> @ {hospital?.name}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold hidden sm:inline">
            Full Clinical Authorization
          </span>
        </div>
      )}

      {/* Top Header: Switcher & Telemetry Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              FACILITY COMMAND CONSOLE
            </span>
            <span className="font-mono text-[10px] uppercase text-zinc-400 px-2 py-0.5 rounded border border-white/10">
              LEVEL {hospital?.level || 2}
            </span>
          </div>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            {hospital?.name || 'Loading Facility...'}
          </h1>
          <p className="font-mono text-xs text-zinc-500">
            {hospital?.phone} • {hospital?.specialties.join(' / ').toUpperCase()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label htmlFor="facility-select" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block">
              Facility Node
            </label>
            <select
              id="facility-select"
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="touch-target px-3 py-2 bg-zinc-950 border border-white/15 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-white/40 cursor-pointer min-w-[220px]"
            >
              {MOCK_HOSPITALS.map((h) => (
                <option key={h.id} value={h.id} className="bg-zinc-950 text-white">
                  {h.name} {h.id === 'hosp-003' ? '(ICU FULL)' : h.id === 'hosp-004' ? '(NO TRAUMA)' : h.id === 'hosp-005' ? '(NO O-)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block">
              Freshness
            </span>
            <div className="touch-target px-4 py-2 rounded-xl bg-zinc-950 border border-white/15 font-mono text-xs text-zinc-300 flex items-center gap-2">
              <span
                className={`telemetry-pip ${
                  freshness.tier === 'fresh'
                    ? 'bg-[#00E599]'
                    : freshness.tier === 'stale_warning'
                    ? 'bg-[#FFB020]'
                    : 'bg-[#FF2A44] animate-pulse'
                }`}
              />
              <span>{freshness.label.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center font-mono text-xs text-zinc-500 uppercase tracking-widest">
          Connecting to facility telemetry grid...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Bed Steppers */}
            <div className="p-6 rounded-2xl tactile-panel space-y-6">
              <div className="font-mono text-xs uppercase tracking-widest text-zinc-400 border-b border-white/[0.08] pb-3">
                Live Capacity Steppers (1-Tap &ge; 48px)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ICU Beds */}
                <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400 uppercase">ICU Free Beds</span>
                    {resources?.icu_free === 0 ? (
                      <span className="text-[10px] text-[#FF2A44] border border-[#FF2A44]/40 px-1.5 py-0.5 rounded">
                        100% FULL
                      </span>
                    ) : (
                      <span className="text-zinc-500">Cap: {resources?.icu_total || 20}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => updateResourceField('icu_free', -1)}
                      className="touch-target w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/25 text-white flex items-center justify-center font-mono text-lg"
                    >
                      -
                    </button>
                    <span className="font-mono text-4xl font-light text-white">{resources?.icu_free ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateResourceField('icu_free', 1)}
                      className="touch-target w-12 h-12 rounded-lg bg-white text-black hover:bg-zinc-200 flex items-center justify-center font-mono text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* ER Beds */}
                <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400 uppercase">Emergency Beds</span>
                    <span className="text-zinc-500">Cap: {resources?.er_total || 25}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => updateResourceField('er_free', -1)}
                      className="touch-target w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/25 text-white flex items-center justify-center font-mono text-lg"
                    >
                      -
                    </button>
                    <span className="font-mono text-4xl font-light text-white">{resources?.er_free ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateResourceField('er_free', 1)}
                      className="touch-target w-12 h-12 rounded-lg bg-white text-black hover:bg-zinc-200 flex items-center justify-center font-mono text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Trauma Bays */}
                <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400 uppercase">Trauma Bays Available</span>
                    {resources?.trauma_bay_free === 0 && (
                      <span className="text-[10px] text-[#FF2A44] border border-[#FF2A44]/40 px-1.5 py-0.5 rounded">
                        NONE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => updateResourceField('trauma_bay_free', -1)}
                      className="touch-target w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/25 text-white flex items-center justify-center font-mono text-lg"
                    >
                      -
                    </button>
                    <span className="font-mono text-4xl font-light text-white">{resources?.trauma_bay_free ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateResourceField('trauma_bay_free', 1)}
                      className="touch-target w-12 h-12 rounded-lg bg-white text-black hover:bg-zinc-200 flex items-center justify-center font-mono text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Ventilators */}
                <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400 uppercase">Ventilators Free</span>
                    <span className="text-zinc-500">Airway Support</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => updateResourceField('ventilators_free', -1)}
                      className="touch-target w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/25 text-white flex items-center justify-center font-mono text-lg"
                    >
                      -
                    </button>
                    <span className="font-mono text-4xl font-light text-white">{resources?.ventilators_free ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateResourceField('ventilators_free', 1)}
                      className="touch-target w-12 h-12 rounded-lg bg-white text-black hover:bg-zinc-200 flex items-center justify-center font-mono text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Equipment Switches */}
            <div className="p-6 rounded-2xl tactile-panel space-y-4">
              <div className="font-mono text-xs uppercase tracking-widest text-zinc-400 border-b border-white/[0.08] pb-3">
                Operational Unit Toggles
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'ot_available' as const, label: 'Operating Theater', status: resources?.ot_available ? 'ONLINE' : 'BUSY' },
                  { key: 'cath_lab_available' as const, label: 'Cath Lab (Cardiac)', status: resources?.cath_lab_available ? 'READY' : 'OFFLINE' },
                  { key: 'ct_available' as const, label: 'CT Scanner', status: resources?.ct_available ? 'ONLINE' : 'MAINT' },
                ].map(({ key, label, status }) => {
                  const isActive = resources?.[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleEquipment(key)}
                      className={`touch-target p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-zinc-900 border-white/30 text-white'
                          : 'bg-black/40 border-white/[0.06] text-zinc-600'
                      }`}
                    >
                      <div>
                        <div className="font-mono text-xs">{label}</div>
                        <div className="font-mono text-[10px] text-zinc-500 mt-0.5">{status}</div>
                      </div>
                      <span className={`telemetry-pip ${isActive ? 'bg-[#00E599]' : 'bg-zinc-700'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. On-Call Specialists */}
            <div className="p-6 rounded-2xl tactile-panel space-y-4">
              <div className="font-mono text-xs uppercase tracking-widest text-zinc-400 border-b border-white/[0.08] pb-3">
                On-Call Surgical & Specialist Teams
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'trauma_surgeon', label: 'Trauma Surgeon' },
                  { key: 'cardiologist', label: 'Cardiologist' },
                  { key: 'neurosurgeon', label: 'Neurosurgeon' },
                  { key: 'burn_specialist', label: 'Burn Specialist' },
                  { key: 'obstetrician', label: 'Obstetrician' },
                  { key: 'pediatrician', label: 'Pediatrician' },
                ].map(({ key, label }) => {
                  const isOnCall = Boolean(resources?.on_call?.[key as keyof typeof resources.on_call]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleOnCallSpecialist(key)}
                      className={`touch-target p-3 rounded-lg border font-mono text-xs flex items-center justify-between transition-all ${
                        isOnCall
                          ? 'bg-zinc-900 border-white/20 text-white'
                          : 'bg-black/40 border-white/[0.06] text-zinc-600'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`telemetry-pip ${isOnCall ? 'bg-white' : 'bg-zinc-800'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Blood Stock Steppers (8 Groups) */}
            <div className="p-6 rounded-2xl tactile-panel space-y-4">
              <div className="font-mono text-xs uppercase tracking-widest text-zinc-400 border-b border-white/[0.08] pb-3">
                Blood Inventory (Units Per Group)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((group) => {
                  const item = bloodStock.find((b) => b.blood_group === group);
                  const units = item?.units ?? 0;
                  const isZero = units === 0;

                  return (
                    <div
                      key={group}
                      className={`p-3 rounded-xl border flex flex-col justify-between ${
                        isZero
                          ? 'bg-[#FF2A44]/10 border-[#FF2A44]/40'
                          : 'bg-black/40 border-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-semibold text-white">{group}</span>
                        {isZero ? (
                          <span className="font-mono text-[9px] text-[#FF2A44] uppercase">0 Units</span>
                        ) : (
                          <span className="font-mono text-xs text-zinc-500">{units}u</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => updateBloodStockUnits(group, -1)}
                          className="touch-target w-9 h-9 rounded-md bg-zinc-900 border border-white/10 hover:border-white/20 text-white flex items-center justify-center font-mono"
                        >
                          -
                        </button>
                        <span className="font-mono text-lg text-white">{units}</span>
                        <button
                          type="button"
                          onClick={() => updateBloodStockUnits(group, 1)}
                          className="touch-target w-9 h-9 rounded-md bg-white text-black hover:bg-zinc-200 flex items-center justify-center font-mono font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Inbound Radar & Action Checklist */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl tactile-panel space-y-6 sticky top-20">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 block">
                    Incoming ER Telemetry
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Real-time SBAR Voice & Resource Sync
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={playRedInboundChime}
                    className="touch-target px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-[10px] font-mono flex items-center gap-1 active:scale-95 transition-all"
                    title="Test audible chime for incoming RED patient (HD-4)"
                  >
                    <span>🔔 {audioChimePlayed ? 'Re-chime' : 'Test RED Chime'}</span>
                  </button>
                  <span className="font-mono text-[10px] text-[#00E599] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {incomingPatients.length} Inbound
                  </span>
                </div>
              </div>

              {incomingPatients.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                    Radar Standby
                  </div>
                  <p className="text-xs text-zinc-600 max-w-xs mx-auto">
                    Awaiting ambulance routing broadcasts and SBAR hands-free audio transmissions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingPatients.map(({ patient, handover }) => {
                    const checklistItems = handover?.structured
                      ? generatePreArrivalChecklist(handover.structured)
                      : [];

                    return (
                      <div
                        key={patient.id}
                        className="p-5 rounded-xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 via-zinc-950/80 to-zinc-950 space-y-4 shadow-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="telemetry-pip bg-[#FF2A44] shadow-[0_0_8px_#FF2A44] animate-ping" />
                            <span className="font-mono text-xs font-semibold text-rose-400 uppercase tracking-wider">
                              CRITICAL RED PRIORITY
                            </span>
                          </div>
                          <span className="font-mono text-xs text-white bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                            ETA {patient.eta_min ?? 8} MIN
                          </span>
                        </div>

                        <div className="text-xs text-zinc-200 font-medium">
                          {handover?.structured?.age ? `${handover.structured.age}Y` : ''}{' '}
                          {handover?.structured?.sex || 'Unknown'} —{' '}
                          <span className="text-cyan-400">{handover?.structured?.mechanism || 'Emergency Trauma Evaluation'}</span>
                        </div>

                        {handover?.structured?.vitals && (
                          <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-black/60 border border-white/[0.08] font-mono text-center text-xs">
                            <div>
                              <span className="text-[9px] text-zinc-500 block">HR</span>
                              <span className="text-rose-400 font-bold">{handover.structured.vitals.hr ?? '--'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 block">BP</span>
                              <span className="text-amber-400 font-bold">{handover.structured.vitals.bp ?? '--'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 block">SPO2</span>
                              <span className="text-cyan-400 font-bold">{handover.structured.vitals.spo2 ?? '--'}%</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 block">GCS</span>
                              <span className="text-purple-400 font-bold">{handover.structured.vitals.gcs ?? '--'}</span>
                            </div>
                          </div>
                        )}

                        {/* Injuries Tags */}
                        {handover?.structured?.injuries && handover.structured.injuries.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {handover.structured.injuries.map((inj, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono"
                              >
                                {inj}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Generated Pre-Arrival Action Checklist (VH-5) */}
                        <div className="p-3.5 rounded-lg bg-zinc-900 border border-cyan-500/20 space-y-2 font-mono text-xs">
                          <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">
                            Pre-Arrival Action Checklist (Automated)
                          </span>
                          <ul className="space-y-1.5 text-zinc-300">
                            {checklistItems.length > 0 ? (
                              checklistItems.map((item) => (
                                <li key={item.id} className="flex items-start gap-1.5 text-[11px]">
                                  <span className="text-cyan-400 font-bold">✓</span>
                                  <span>{item.title}</span>
                                </li>
                              ))
                            ) : (
                              <>
                                <li className="flex items-start gap-1.5 text-[11px]">
                                  <span className="text-cyan-400 font-bold">✓</span>
                                  <span>Prepare 2 units O- blood in Trauma Bay</span>
                                </li>
                                <li className="flex items-start gap-1.5 text-[11px]">
                                  <span className="text-cyan-400 font-bold">✓</span>
                                  <span>Alert on-call Trauma Surgeon</span>
                                </li>
                                <li className="flex items-start gap-1.5 text-[11px]">
                                  <span className="text-cyan-400 font-bold">✓</span>
                                  <span>Hold OR-1 on immediate standby</span>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>

                        <div className="flex justify-between font-mono text-[10px] text-zinc-500 pt-1 border-t border-white/[0.06]">
                          <span>15-Min Bed Hold Active</span>
                          <span className="text-[#00E599]">12:45 remaining</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
