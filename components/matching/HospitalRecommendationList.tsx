'use client';

import React, { useState } from 'react';
import { HospitalRankItem } from '@/lib/types/database';

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
      {/* 15-Minute Bed Hold Active Banner (HM-8) */}
      {selectedHospitalId && reservedUntil && (
        <div className="p-4 rounded-xl border border-[#00E599]/40 bg-[#00E599]/[0.06] flex items-center justify-between text-white animate-in fade-in">
          <div className="space-y-0.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#00E599]">
              Bed Reservation Confirmed (15-Minute Hold)
            </div>
            <div className="font-mono text-sm text-white">
              Hold valid until: {new Date(reservedUntil).toLocaleTimeString()}
            </div>
          </div>
          <span className="telemetry-pip bg-[#00E599] shadow-[0_0_8px_#00E599]" />
        </div>
      )}

      {/* Top Recommendations */}
      <div className="space-y-3">
        <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          Ranked Clinical Capabilities
        </div>

        {topRecommendations.map((hosp, index) => {
          const isSelected = selectedHospitalId === hosp.hospital_id;
          const isExpanded = expandedHospitalId === hosp.hospital_id;
          const rank = index + 1;

          return (
            <div
              key={hosp.hospital_id}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? 'border-white bg-zinc-900/90 shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                  : 'border-white/[0.08] bg-zinc-950/60 hover:border-white/20'
              }`}
            >
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-zinc-500 w-6">0{rank}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium text-white">{hosp.hospital_name}</h4>
                        {rank === 1 && (
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border border-[#00E599]/40 text-[#00E599]">
                            BEST FIT
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-zinc-500 mt-0.5">
                        ETA {hosp.eta_minutes} MIN • DATA UPDATED {hosp.factors.age_minutes}M AGO
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="font-mono text-2xl font-light text-white">{hosp.total_score}</div>
                      <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">MATCH SCORE</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => onSelectHospital(hosp.hospital_id)}
                    className={`touch-target px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                      isSelected
                        ? 'bg-[#00E599] text-black font-bold'
                        : 'bg-white hover:bg-zinc-200 text-black font-semibold shadow-sm'
                    }`}
                  >
                    {isSelected ? 'DESTINATION SELECTED' : 'ACCEPT & RESERVE BED →'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOverrideModal(hosp.hospital_id)}
                    className="touch-target px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-white border border-white/10 hover:border-white/25"
                  >
                    Override
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpand(hosp.hospital_id)}
                    className="touch-target ml-auto text-xs font-mono text-zinc-500 hover:text-zinc-300"
                  >
                    {isExpanded ? 'Hide Factor Breakdown' : 'Why This Facility? →'}
                  </button>
                </div>

                {/* Factor Breakdown */}
                {isExpanded && (
                  <div className="p-4 rounded-lg bg-black/60 border border-white/[0.06] space-y-3 font-mono text-xs">
                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest border-b border-white/[0.06] pb-2">
                      Factor Weightings & Telemetry (Section 5)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between text-zinc-400">
                          <span>ETA (30%)</span>
                          <span className="text-white">{Math.round(hosp.factors.eta_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-white h-full" style={{ width: `${hosp.factors.eta_score * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Capability (25%)</span>
                          <span className="text-white">{Math.round(hosp.factors.capability_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-white h-full" style={{ width: `${hosp.factors.capability_score * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Free Beds (15%)</span>
                          <span className="text-white">{Math.round(hosp.factors.bed_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-white h-full" style={{ width: `${hosp.factors.bed_score * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Blood Match (15%)</span>
                          <span className="text-white">{Math.round(hosp.factors.blood_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-white h-full" style={{ width: `${hosp.factors.blood_score * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Queue / Load (10%)</span>
                          <span className="text-white">{Math.round(hosp.factors.queue_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-white h-full" style={{ width: `${hosp.factors.queue_score * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Freshness (5%)</span>
                          <span className="text-white">{Math.round(hosp.factors.freshness_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-white h-full" style={{ width: `${hosp.factors.freshness_score * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Excluded Facilities Section */}
      {excludedHospitals.length > 0 && (
        <div className="p-4 rounded-xl border border-white/[0.06] bg-zinc-950/40 space-y-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => setShowExcluded(!showExcluded)}
            className="w-full flex items-center justify-between text-left text-zinc-400 hover:text-white"
          >
            <span>EXCLUDED FACILITIES ({excludedHospitals.length} FAILED CLINICAL CRITERIA)</span>
            <span className="text-[10px] text-zinc-600">{showExcluded ? 'COLLAPSE' : 'EXPAND'}</span>
          </button>

          {showExcluded && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              {excludedHospitals.map((hosp) => (
                <div
                  key={hosp.hospital_id}
                  className="p-3 rounded-lg bg-black/40 border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="text-zinc-500 line-through">{hosp.hospital_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#FF2A44] border border-[#FF2A44]/30 px-2 py-0.5 rounded">
                      {hosp.excluded_reason}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOverrideModal(hosp.hospital_id)}
                      className="text-[10px] text-zinc-400 hover:text-white underline pl-2"
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

      {/* Override Justification Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-950 border border-white/20 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-white">
              Clinical Override Justification
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every recommendation override is logged in the immutable audit trail. Enter rationale:
            </p>
            <textarea
              rows={3}
              value={overrideReasonText}
              onChange={(e) => setOverrideReasonText(e.target.value)}
              placeholder="e.g., Patient-specified center, on-scene physician directive..."
              className="w-full p-3 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/40"
            />
            <div className="flex justify-end gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowOverrideModal(null)}
                className="touch-target px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="touch-target px-4 py-2 rounded-lg bg-white text-black font-semibold"
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
