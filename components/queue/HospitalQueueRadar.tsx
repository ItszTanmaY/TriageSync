'use client';

import React, { useState } from 'react';
import { QueueTelemetry } from '@/lib/queue/engine';
import { AlertOctagon, HelpCircle, ArrowRight } from 'lucide-react';

interface HospitalQueueRadarProps {
  queueData: (QueueTelemetry & { hospitalName: string })[];
  onTriggerSurge?: () => void;
  isSurging?: boolean;
}

export function HospitalQueueRadar({
  queueData,
  onTriggerSurge,
  isSurging,
}: HospitalQueueRadarProps) {
  const [selectedHospitalTelemetry, setSelectedHospitalTelemetry] = useState<
    (QueueTelemetry & { hospitalName: string }) | null
  >(null);

  return (
    <div className="space-y-6">
      {/* Widget Header with Live Stats & Chaos Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="telemetry-pip bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <h3 className="text-lg font-black text-white tracking-tight">
              QueuePredict Load Balancing Radar
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ER occupancy, incoming transit queue, and automatic diversion threshold (85%).
          </p>
        </div>

        {onTriggerSurge && (
          <button
            type="button"
            onClick={onTriggerSurge}
            disabled={isSurging}
            className="touch-target px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center gap-2"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{isSurging ? 'Surging Fleet...' : 'Chaos Test: Surge 3 Ambulances'}</span>
          </button>
        )}
      </div>

      {/* Grid of Hospital Load Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {queueData.map((hosp) => {
          const isOverLimit = hosp.projectedLoad >= 0.85;
          const loadPercent = Math.min(100, Math.round(hosp.projectedLoad * 100));

          return (
            <div
              key={hosp.hospitalId}
              className={`p-5 rounded-2xl border transition-all ${
                isOverLimit
                  ? 'bg-red-950/30 border-red-500/50 shadow-xl shadow-red-950/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-sm text-white">{hosp.hospitalName}</h4>
                  <span className="text-[11px] text-slate-400">
                    ER Free: {hosp.erFree} / {hosp.erTotal} • Inbound: {hosp.inboundCount}
                  </span>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-black leading-none ${
                      isOverLimit ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {loadPercent}%
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                    Projected Load
                  </span>
                </div>
              </div>

              {/* Progress Bar with 85% Threshold Line */}
              <div className="relative w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isOverLimit
                      ? 'bg-gradient-to-r from-amber-500 to-red-500'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                  }`}
                  style={{ width: `${loadPercent}%` }}
                />
                {/* 85% Threshold Indicator */}
                <div
                  className="absolute top-0 bottom-0 border-r-2 border-dashed border-red-400 z-10"
                  style={{ left: '85%' }}
                  title="85% Diversion Threshold"
                />
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Est. Wait:</span>
                  <span className={`font-bold ${hosp.projectedWaitMinutes > 15 ? 'text-red-400' : 'text-cyan-300'}`}>
                    {hosp.projectedWaitMinutes} min
                  </span>
                </div>

                {isOverLimit ? (
                  <button
                    type="button"
                    onClick={() => setSelectedHospitalTelemetry(hosp)}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <span>Diverting (View Math)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedHospitalTelemetry(hosp)}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>View Load Math</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* "Why Diverted?" Mathematical Breakdown Modal (QP-5) */}
      {selectedHospitalTelemetry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl glass-panel-glow border-cyan-500/40 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="telemetry-pip bg-cyan-400" />
                <h3 className="font-black text-white text-base">
                  QueuePredict Mathematical Model (Architecture Section 6)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHospitalTelemetry(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                  1. Projected ER Load Formula
                </div>
                <div className="font-mono text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  projected_load = (er_total - er_free + inbound - discharges) / er_total
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 font-mono">
                  <span>ER Total: {selectedHospitalTelemetry.erTotal}</span>
                  <span>Occupied: {selectedHospitalTelemetry.erOccupied}</span>
                  <span>Inbound Transit: {selectedHospitalTelemetry.inboundCount}</span>
                  <span>Discharges: {selectedHospitalTelemetry.expectedDischarges}</span>
                </div>
                <div className="text-right font-black text-sm text-cyan-300">
                  Result: {Math.round(selectedHospitalTelemetry.projectedLoad * 100)}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
                  2. Projected Wait Time Formula
                </div>
                <div className="font-mono text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  wait_min = max(0, (inbound + occupied - er_total)) * avg_service / er_total
                </div>
                <div className="text-right font-black text-sm text-emerald-300">
                  Result: {selectedHospitalTelemetry.projectedWaitMinutes} minutes
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300">
                <strong>Diversion Criterion (QP-3):</strong> Divert if projected_load &gt; 85% or wait_min &gt; 15 min.
                <div className="mt-1 font-bold">
                  Status: {selectedHospitalTelemetry.shouldDivert ? 'AUTOMATIC DIVERSION TRIGGERED' : 'NORMAL INGESTION OK'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedHospitalTelemetry(null)}
                className="touch-target px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
