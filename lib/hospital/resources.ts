/**
 * TriageSync 2.0: Hospital Resources & Freshness Logic
 * Pure, tested functions per AGENTS.md rule 3
 */

export interface FreshnessStatus {
  ageMinutes: number;
  label: string;
  tier: 'fresh' | 'stale_warning' | 'stale_critical';
  colorClass: string;
  decayMultiplier: number;
}

/**
 * Calculates data freshness status and scoring decay multiplier
 * - Fresh (< 30 min): multiplier ~ 1.0 (Green)
 * - Warning (30-60 min): multiplier ~ 0.36 - 0.13 (Amber)
 * - Critical (> 60 min): multiplier < 0.13 (Red)
 */
export function calculateFreshnessStatus(
  updatedAtIso: string,
  nowTimestamp: number = Date.now()
): FreshnessStatus {
  const updatedTime = new Date(updatedAtIso).getTime();
  const diffMs = Math.max(0, nowTimestamp - updatedTime);
  const ageMinutes = Math.floor(diffMs / (1000 * 60));

  // Exponential decay with 30-minute half-life: e^(-age / 30)
  const decayMultiplier = Math.exp(-ageMinutes / 30);

  if (ageMinutes < 30) {
    return {
      ageMinutes,
      label: ageMinutes === 0 ? 'Just now' : `${ageMinutes}m ago`,
      tier: 'fresh',
      colorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20',
      decayMultiplier,
    };
  }

  if (ageMinutes <= 60) {
    return {
      ageMinutes,
      label: `${ageMinutes}m ago (Needs update)`,
      tier: 'stale_warning',
      colorClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-500/20',
      decayMultiplier,
    };
  }

  return {
    ageMinutes,
    label: `${ageMinutes}m ago (STALE)`,
    tier: 'stale_critical',
    colorClass: 'bg-red-950/80 text-red-300 border-red-500/60 shadow-red-500/20 animate-pulse',
    decayMultiplier,
  };
}

/**
 * Bounds checking helper for bed steppers (ensures free beds <= total beds and >= 0)
 */
export function clampBedCount(value: number, total: number = 999): number {
  return Math.max(0, Math.min(value, total));
}
