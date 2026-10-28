'use client';

import React, { useState } from 'react';
import { HospitalRankItem } from '@/lib/types/database';
import {
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Building2,
  XCircle,
  HelpCircle,
  Navigation,
  Sparkles,
} from 'lucide-react';

interface HospitalRecommendationListProps {
  patientId: string;
  topRecommendations: HospitalRankItem[];
  excludedHospitals: HospitalRankItem[];
  onSelectHospital: (hospitalId: string, overrideReason?: string) => void;
  selectedHospitalId?: string | null;
  reservedUntil?: string | null;
}

export function HospitalRecommendationList({
  patientId: _patientId,
  topRecommendations,
  excludedHospitals,
  onSelectHospital,
  selectedHospitalId,
  reservedUntil,
}: HospitalRecommendationListProps) {
  const [expandedHospitalId, setExpandedHospitalId] = useState<string | null>(
    topRecommendations[0]?.hospital_id || null
  );
  const [showOverrideModal, setShowOverrideModal] = useState<string | null>(null);
  const [overrideReasonText, setOverrideReasonText] = useState<string>('');
  const [showExcluded, setShowExcluded] = useState<boolean>(true);

  const toggleExpand = (hospitalId: string) => {
    setExpandedHospitalId((prev) => (prev === hospitalId ? null : hospitalId));
  };

  const handleConfirmOverride = () => {
    if (!showOverrideModal) return;
    onSelectHospital(showOverrideModal, overrideReasonText || 'Clinical Paramedic Judgment');
    setShowOverrideModal(null);
    setOverrideReasonText('');
  };

  return (
    <div className="space-y-6">
      {/* Active Bed Reservation Banner (HM-8) */}
      {selectedHospitalId && reservedUntil && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between text-white shadow-xl shadow-emerald-950/30 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Bed Hold Active (15-Minute Reservation)
              </div>
              <div className="font-black text-sm sm:text-base">
                Reserved until: {new Date(reservedUntil).toLocaleTimeString()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700">
              HOLD CONFIRMED
            </span>
          </div>
        </div>
      )}

      {/* Top 3 Recommended Hospitals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white tracking-tight">
              Recommended Facilities (Top 3 Match)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Explainable Multi-Factor Engine</span>
        </div>

        {topRecommendations.map((hosp, index) => {
          const isSelected = selectedHospitalId === hosp.hospital_id;
          const isExpanded = expandedHospitalId === hosp.hospital_id;
          const rank = index + 1;

          return (
            <div
              key={hosp.hospital_id}
              className={`rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-400 shadow-2xl shadow-cyan-500/20'
                  : rank === 1
                  ? 'bg-slate-900/80 border-cyan-500/40 hover:border-cyan-400'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-5 sm:p-6 space-y-4">
                {/* Header: Rank, Name, ETA, Match Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                        rank === 1
                          ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      #{rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base sm:text-lg text-white">
                          {hosp.hospital_name}
                        </h4>
                        {rank === 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-600 uppercase tracking-widest">
                            BEST FIT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pune Emergency Grid</span>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">Updated {hosp.factors.age_minutes}m ago</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-black text-cyan-300 justify-end">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>ETA {hosp.eta_minutes} min</span>
                      </div>
                      <div className="text-xs text-slate-400">Transit estimate</div>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-2xl font-black text-emerald-400 leading-none">
                        {hosp.total_score}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        MATCH SCORE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons (Touch targets >= 48px) */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onSelectHospital(hosp.hospital_id)}
                    className={`touch-target px-5 py-2.5 rounded-xl text-xs font-black tracking-wide flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isSelected ? 'DESTINATION SELECTED' : 'ACCEPT & RESERVE BED'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOverrideModal(hosp.hospital_id)}
                    className="touch-target px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
                  >
                    Override Selection
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpand(hosp.hospital_id)}
                    className="touch-target ml-auto px-3 py-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>Why this hospital?</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Explainable Factor Breakdown (HM-5) */}
                {isExpanded && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-4 text-xs animate-in fade-in">
                    <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
                      Factor Breakdown & Scoring Explainability (Architecture Section 5)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* 1. ETA Score */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300 font-semibold">
                          <span>ETA Score (30%)</span>
                          <span className="text-cyan-400">{Math.round(hosp.factors.eta_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-400 h-1.5 rounded-full"
                            style={{ width: `${hosp.factors.eta_score * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">Transit: {hosp.eta_minutes} min to bay</span>
                      </div>

                      {/* 2. Capability Fit */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300 font-semibold">
                          <span>Clinical Capabilities (25%)</span>
                          <span className="text-emerald-400">{Math.round(hosp.factors.capability_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-1.5 rounded-full"
                            style={{ width: `${hosp.factors.capability_score * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Satisfied: {hosp.factors.satisfied_should.join(', ') || 'Core only'}
                        </span>
                      </div>

                      {/* 3. Bed Availability */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300 font-semibold">
                          <span>Free Beds (15%)</span>
                          <span className="text-purple-400">{Math.round(hosp.factors.bed_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-purple-400 h-1.5 rounded-full"
                            style={{ width: `${hosp.factors.bed_score * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">Immediate trauma bed ready</span>
                      </div>

                      {/* 4. Blood Match */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300 font-semibold">
                          <span>Blood Compatibility (15%)</span>
                          <span className="text-red-400">{Math.round(hosp.factors.blood_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-red-400 h-1.5 rounded-full"
                            style={{ width: `${hosp.factors.blood_score * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{hosp.factors.blood_matched_units} compatible units in bank</span>
                      </div>

                      {/* 5. Projected Queue */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300 font-semibold">
                          <span>Queue / Load (10%)</span>
                          <span className="text-amber-400">{Math.round(hosp.factors.queue_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-1.5 rounded-full"
                            style={{ width: `${hosp.factors.queue_score * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">Projected ER load: {Math.round(hosp.factors.projected_er_load * 100)}%</span>
                      </div>

                      {/* 6. Freshness Decay */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300 font-semibold">
                          <span>Data Freshness (5%)</span>
                          <span className="text-sky-400">{Math.round(hosp.factors.freshness_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-sky-400 h-1.5 rounded-full"
                            style={{ width: `${hosp.factors.freshness_score * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">Updated {hosp.factors.age_minutes}m ago</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Excluded / Unsuitable Hospitals Section (HM-6) */}
      {excludedHospitals.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
          <button
            type="button"
            onClick={() => setShowExcluded(!showExcluded)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <h4 className="font-bold text-sm text-slate-300">
                Excluded Facilities ({excludedHospitals.length} Hard Requirements Failed)
              </h4>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              {showExcluded ? 'Hide list' : 'View excluded'}
              {showExcluded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {showExcluded && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              {excludedHospitals.map((hosp) => (
                <div
                  key={hosp.hospital_id}
                  className="p-3.5 rounded-xl bg-slate-900/40 border border-red-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-300 line-through decoration-red-500/60">
                      {hosp.hospital_name}
                    </span>
                    <div className="text-xs text-slate-500">ETA {hosp.eta_minutes} min</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-950/80 text-red-300 border border-red-800/60 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      {hosp.excluded_reason}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOverrideModal(hosp.hospital_id)}
                      className="text-xs text-slate-400 hover:text-white underline pl-2"
                    >
                      Override
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Override Reason Modal (HM-7) */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl glass-panel-glow border-amber-500/40 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
              <AlertOctagon className="w-5 h-5" />
              <span>Override Engine Recommendation (HM-7)</span>
            </div>
            <p className="text-xs text-slate-300">
              The platform logs all clinical override events in the audit trail. Please specify the justification:
            </p>
            <div className="space-y-2">
              <label htmlFor="override-reason" className="text-xs font-semibold text-slate-400">
                Clinical Justification
              </label>
              <textarea
                id="override-reason"
                rows={3}
                value={overrideReasonText}
                onChange={(e) => setOverrideReasonText(e.target.value)}
                placeholder="e.g., Patient designated tertiary cardiac center, on-scene doctor instruction..."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(null)}
                className="touch-target px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="touch-target px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black tracking-wide"
              >
                Confirm & Log Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
