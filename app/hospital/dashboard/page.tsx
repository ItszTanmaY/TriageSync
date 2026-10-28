'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  MOCK_HOSPITALS,
} from '@/lib/supabase/mock-data';
import {
  Hospital,
  HospitalResources,
  BloodStockItem,
  Patient,
  HandoverRecord,
} from '@/lib/types/database';
import { calculateFreshnessStatus } from '@/lib/hospital/resources';
import {
  Building2,
  Clock,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Activity,
  HeartPulse,
  Layers,
  Sparkles,
  RefreshCw,
  Bell,
  Stethoscope,
} from 'lucide-react';

export default function HospitalDashboardPage() {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-001');
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [resources, setResources] = useState<HospitalResources | null>(null);
  const [bloodStock, setBloodStock] = useState<BloodStockItem[]>([]);
  const [incomingPatients, setIncomingPatients] = useState<{ patient: Patient; handover?: HandoverRecord }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load selected hospital data
  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const found = MOCK_HOSPITALS.find((h) => h.id === selectedHospitalId);
        if (found && active) setHospital(found);

        // Fetch Resources
        const resRes = await fetch(`/api/hospital/resources?hospital_id=${selectedHospitalId}`);
        const resJson = await resRes.json();
        if (active && resJson.data) {
          setResources(resJson.data);
        }

        // Fetch Blood Stock
        const bloodRes = await fetch(`/api/hospital/blood?hospital_id=${selectedHospitalId}`);
        const bloodJson = await bloodRes.json();
        if (active && bloodJson.data) {
          setBloodStock(bloodJson.data);
        }

        // Mock incoming patient for demo if hosp-001 is selected
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

  // Handle Stepper Updates for Beds/Ventilators
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
        showToast('Resource updated');
      } catch (e) {
        console.error('Failed to patch resource', e);
      }
    });
  };

  // Handle Equipment and Specialist Toggles
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
        showToast('Equipment status updated');
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
        showToast('Specialist on-call updated');
      } catch (e) {
        console.error('Failed to update specialist', e);
      }
    });
  };

  // Handle Blood Stock Stepper
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
        showToast(`Blood stock for ${group} updated`);
      } catch (e) {
        console.error('Failed to update blood stock', e);
      }
    });
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Calculate freshness status for the updated_at timestamp
  const freshness = resources
    ? calculateFreshnessStatus(resources.updated_at)
    : { label: 'Checking...', colorClass: 'bg-slate-800 text-slate-300' };

  return (
    <div className="space-y-8 py-2">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-sm font-semibold shadow-2xl shadow-cyan-500/30 animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Header: Hospital Selector & Freshness Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Hospital Command Center
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                Level {hospital?.level || 2} Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {hospital?.name || 'Loading Hospital...'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Phone: {hospital?.phone} • Specialties: {hospital?.specialties.join(', ')}
            </p>
          </div>
        </div>

        {/* Hospital Switcher & Freshness Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-col">
            <label htmlFor="hosp-select" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Switch Facility
            </label>
            <select
              id="hosp-select"
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="touch-target px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer min-w-[240px]"
            >
              {MOCK_HOSPITALS.map((h) => (
                <option key={h.id} value={h.id} className="bg-slate-900 text-slate-100">
                  {h.name} {h.id === 'hosp-003' ? '(Full ICU)' : h.id === 'hosp-004' ? '(No Trauma)' : h.id === 'hosp-005' ? '(No O-)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Data Freshness
            </span>
            <div
              className={`touch-target px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${freshness.colorClass}`}
              title="Per SRS HM-2: Freshness score decays after 30 min (amber) and 60 min (red)"
            >
              <Clock className="w-4 h-4" />
              <span>{freshness.label}</span>
              {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin ml-1 text-cyan-400" />}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16 rounded-2xl glass-panel">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="ml-3 text-slate-300 font-bold">Connecting to facility telemetry...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Live Bed & Equipment Steppers */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Critical Care Bed Steppers */}
            <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <HeartPulse className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-black text-white tracking-wide">
                    Live Bed Availability (One-Tap Steppers)
                  </h2>
                </div>
                <span className="text-xs text-slate-400">Touch targets &ge; 48px</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ICU Beds Stepper */}
                <div className={`p-5 rounded-2xl border ${resources?.icu_free === 0 ? 'bg-red-950/20 border-red-500/40' : 'bg-slate-900/70 border-slate-800'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">ICU Free Beds</div>
                      <div className="text-xs text-slate-500">Total Capacity: {resources?.icu_total || 20}</div>
                    </div>
                    {resources?.icu_free === 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-700 animate-pulse">
                        FULL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => updateResourceField('icu_free', -1)}
                      className="touch-target w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-black text-lg transition-transform focus:ring-2 focus:ring-cyan-400"
                      aria-label="Decrease ICU Free Beds"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-3xl font-black text-white px-4">{resources?.icu_free ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateResourceField('icu_free', 1)}
                      className="touch-target w-12 h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 flex items-center justify-center font-black text-lg transition-transform focus:ring-2 focus:ring-cyan-400"
                      aria-label="Increase ICU Free Beds"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* ER Beds Stepper */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Emergency (ER) Beds</div>
                      <div className="text-xs text-slate-500">Total Capacity: {resources?.er_total || 25}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => updateResourceField('er_free', -1)}
                      className="touch-target w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-black text-lg transition-transform focus:ring-2 focus:ring-cyan-400"
                      aria-label="Decrease ER Free Beds"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-3xl font-black text-white px-4">{resources?.er_free ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateResourceField('er_free', 1)}
                      className="touch-target w-12 h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 flex items-center justify-center font-black text-lg transition-transform focus:ring-2 focus:ring-cyan-400"
                      aria-label="Increase ER Free Beds"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Trauma Bay Free Stepper */}
                <div className={`p-5 rounded-2xl border ${resources?.trauma_bay_free === 0 ? 'bg-red-950/20 border-red-500/40' : 'bg-slate-900/70 border-slate-800'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Trauma Bays Available</div>
                      <div className="text-xs text-slate-500">Must requirement for RED trauma</div>
                    </div>
                    {resources?.trauma_bay_free === 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-700">
                        NONE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => updateResourceField('trauma_bay_free', -1)}
                      className="touch-target w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-black text-lg transition-transform focus:ring-2 focus:ring-cyan-400"
                      aria-label="Decrease Trauma Bays"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-3xl font-black text-white px-4">{resources?.trauma_bay_free ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateResourceField('trauma_bay_free', 1)}
                      className="touch-target w-12 h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 flex items-center justify-center font-black text-lg transition-transform focus:ring-2 focus:ring-cyan-400"
                      aria-label="Increase Trauma Bays"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Ventilators Free Stepper */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Ventilators Free</div>
                      <div className="text-xs text-slate-500">Critical airway support</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => updateResourceField('ventilators_free', -1)}
                      className="touch-target w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-black text-lg transition-transform focus:ring-2 focus:ring-cyan-400"
                      aria-label="Decrease Ventilators"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-3xl font-black text-white px-4">{resources?.ventilators_free ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateResourceField('ventilators_free', 1)}
                      className="touch-target w-12 h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 flex items-center justify-center font-black text-lg transition-transform focus:ring-2 focus:ring-cyan-400"
                      aria-label="Increase Ventilators"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Critical Equipment Toggles */}
            <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-black text-white tracking-wide">
                  Equipment Status (Instant Toggles)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* OT Available Toggle */}
                <button
                  type="button"
                  onClick={() => toggleEquipment('ot_available')}
                  className={`touch-target p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    resources?.ot_available
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">Operating Theater</div>
                    <div className="text-xs text-slate-400">{resources?.ot_available ? 'Available' : 'Busy / Closed'}</div>
                  </div>
                  {resources?.ot_available ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-600" />
                  )}
                </button>

                {/* Cath Lab Toggle */}
                <button
                  type="button"
                  onClick={() => toggleEquipment('cath_lab_available')}
                  className={`touch-target p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    resources?.cath_lab_available
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">Cath Lab (Cardiac)</div>
                    <div className="text-xs text-slate-400">{resources?.cath_lab_available ? 'Ready for STEMI' : 'Unavailable'}</div>
                  </div>
                  {resources?.cath_lab_available ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-600" />
                  )}
                </button>

                {/* CT Scanner Toggle */}
                <button
                  type="button"
                  onClick={() => toggleEquipment('ct_available')}
                  className={`touch-target p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    resources?.ct_available
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">CT Scanner</div>
                    <div className="text-xs text-slate-400">{resources?.ct_available ? 'Operational' : 'Down / Maintenance'}</div>
                  </div>
                  {resources?.ct_available ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* 3. On-Call Specialists Matrix */}
            <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-black text-white tracking-wide">
                    On-Call Specialist Team (Tap to Toggle)
                  </h2>
                </div>
                <span className="text-xs text-purple-300 font-semibold">Live in matching engine</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                      className={`touch-target p-3.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                        isOnCall
                          ? 'bg-purple-950/50 border-purple-500/50 text-purple-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isOnCall ? 'bg-purple-400 animate-pulse' : 'bg-slate-700'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Blood Stock Grid (All 8 Groups) */}
            <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-red-400" />
                  <h2 className="text-lg font-black text-white tracking-wide">
                    Live Blood Bank Stock (All 8 Groups)
                  </h2>
                </div>
                <span className="text-xs text-slate-400">Directly impacts blood match score</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((group) => {
                  const item = bloodStock.find((b) => b.blood_group === group);
                  const units = item?.units ?? 0;
                  const isZero = units === 0;

                  return (
                    <div
                      key={group}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                        isZero
                          ? 'bg-red-950/30 border-red-500/60 shadow-lg shadow-red-950/40'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-base text-white">{group}</span>
                        {isZero ? (
                          <span className="text-[10px] font-black text-red-400 bg-red-900/60 px-1.5 py-0.5 rounded border border-red-700 animate-pulse">
                            0 UNITS
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">{units} units</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => updateBloodStockUnits(group, -1)}
                          className="touch-target w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold"
                          aria-label={`Decrease ${group} blood stock`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl font-black text-white">{units}</span>
                        <button
                          type="button"
                          onClick={() => updateBloodStockUnits(group, 1)}
                          className="touch-target w-9 h-9 rounded-lg bg-red-700 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center font-bold"
                          aria-label={`Increase ${group} blood stock`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Incoming Patients Radar & Pre-arrival Checklist (HD-3) */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass-panel-glow border-cyan-500/30 space-y-6 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h2 className="text-lg font-black text-white tracking-wide">
                    Incoming Emergency Radar
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>{incomingPatients.length} Inbound</span>
                </div>
              </div>

              {incomingPatients.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-4">
                  <div className="relative mx-auto w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center overflow-hidden bg-slate-900/50">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent animate-radar-sweep origin-center" />
                    <Radio className="w-8 h-8 text-cyan-400 z-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Listening for Inbound Handovers</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Ambulances routing to {hospital?.name} will broadcast SBAR briefs and prep requests here in real time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingPatients.map(({ patient, handover }) => (
                    <div
                      key={patient.id}
                      className="p-5 rounded-2xl bg-red-950/20 border border-red-500/40 space-y-4 shadow-xl shadow-red-950/20"
                    >
                      {/* Triage & ETA Header */}
                      <div className="flex items-center justify-between">
                        <span className="badge-triage-red px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 animate-bounce" />
                          CRITICAL RED
                        </span>
                        <div className="flex items-center gap-1 text-sm font-black text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span>ETA {patient.eta_min} min</span>
                        </div>
                      </div>

                      {/* Patient Demographics & Mechanism */}
                      <div>
                        <div className="text-sm font-bold text-white">
                          Patient: {handover?.structured?.age ?? 36}y {handover?.structured?.sex ?? 'F'} • {handover?.structured?.mechanism ?? 'High-Speed Trauma'}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 italic">
                          "{handover?.transcript}"
                        </p>
                      </div>

                      {/* Live Vitals Grid */}
                      {handover?.structured?.vitals && (
                        <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">HR</span>
                            <span className="font-black text-red-400">{handover.structured.vitals.hr ?? '--'} bpm</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">BP</span>
                            <span className="font-black text-amber-300">{handover.structured.vitals.bp ?? '--'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">SpO2</span>
                            <span className="font-black text-cyan-300">{handover.structured.vitals.spo2 ?? '--'}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">GCS</span>
                            <span className="font-black text-purple-300">{handover.structured.vitals.gcs ?? '--'}/15</span>
                          </div>
                        </div>
                      )}

                      {/* Generated Pre-Arrival Action Checklist (VH-5) */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                        <div className="text-xs font-black text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Pre-Arrival ER Action Checklist
                        </div>
                        <ul className="text-xs space-y-1.5 text-slate-200">
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Prepare <strong>{handover?.needs?.units ?? 2} units {handover?.needs?.blood_group ?? 'O-'} blood</strong> in Trauma Bay
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            Alert on-call <strong>Trauma Surgeon</strong> & Anesthesiologist
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Hold Operating Theater #1 on emergency standby
                          </li>
                        </ul>
                      </div>

                      {/* Bed Hold Timer */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        <span>Trauma Bed Held</span>
                        <span className="font-semibold text-emerald-400">12:45 remaining</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
