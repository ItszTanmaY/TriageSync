/**
 * TriageSync 2.0: Incident Management & Golden Hour Utilities
 * Architecture Section 5 & SRS INC-1..INC-5
 */

import { Ambulance, GeoLocation, IncidentStatus } from '@/lib/types/database';
import { calculateHaversineDistanceKm, estimateEtaMinutes } from '@/lib/matching/engine';

export interface GoldenHourProgress {
  elapsedSeconds: number;
  remainingSeconds: number;
  formattedRemaining: string; // "54:32"
  percentageElapsed: number;  // 0 to 100
  urgencyTier: 'safe' | 'caution' | 'critical' | 'expired';
  colorClass: string;
}

/**
 * Calculates Golden Hour countdown (60 minutes = 3600 seconds)
 */
export function calculateGoldenHour(
  createdAtIso: string,
  nowTimestamp: number = Date.now()
): GoldenHourProgress {
  const createdMs = new Date(createdAtIso).getTime();
  const elapsedMs = Math.max(0, nowTimestamp - createdMs);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const totalSeconds = 60 * 60; // 60 minutes
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedRemaining = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const percentageElapsed = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

  if (remainingSeconds <= 0) {
    return {
      elapsedSeconds,
      remainingSeconds: 0,
      formattedRemaining: '00:00 (EXPIRED)',
      percentageElapsed: 100,
      urgencyTier: 'expired',
      colorClass: 'text-red-500 bg-red-950/80 border-red-500/60 animate-pulse',
    };
  }

  if (remainingSeconds <= 15 * 60) {
    // Under 15 minutes left
    return {
      elapsedSeconds,
      remainingSeconds,
      formattedRemaining,
      percentageElapsed,
      urgencyTier: 'critical',
      colorClass: 'text-red-400 bg-red-950/60 border-red-500/50',
    };
  }

  if (remainingSeconds <= 30 * 60) {
    // Under 30 minutes left
    return {
      elapsedSeconds,
      remainingSeconds,
      formattedRemaining,
      percentageElapsed,
      urgencyTier: 'caution',
      colorClass: 'text-amber-400 bg-amber-950/60 border-amber-500/50',
    };
  }

  return {
    elapsedSeconds,
    remainingSeconds,
    formattedRemaining,
    percentageElapsed,
    urgencyTier: 'safe',
    colorClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50',
  };
}

/**
 * Finds the nearest available ambulance to the incident location
 */
export function findNearestAvailableAmbulance(
  incidentLocation: GeoLocation,
  ambulances: Ambulance[]
): {
  ambulance: Ambulance | null;
  distanceKm: number;
  etaMinutes: number;
} {
  const available = ambulances.filter((a) => a.status === 'available');
  if (available.length === 0) {
    return { ambulance: null, distanceKm: 0, etaMinutes: 0 };
  }

  let nearest: Ambulance = available[0];
  let minDistance = calculateHaversineDistanceKm(incidentLocation, nearest.location);

  for (let i = 1; i < available.length; i++) {
    const dist = calculateHaversineDistanceKm(incidentLocation, available[i].location);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = available[i];
    }
  }

  return {
    ambulance: nearest,
    distanceKm: Math.round(minDistance * 10) / 10,
    etaMinutes: estimateEtaMinutes(minDistance),
  };
}

/**
 * Validates lifecycle transition order
 */
export const LIFECYCLE_ORDER: IncidentStatus[] = [
  'created',
  'assigned',
  'en_route',
  'arrived',
  'handed_over',
  'closed',
];

export function canTransitionTo(current: IncidentStatus, next: IncidentStatus): boolean {
  const currentIdx = LIFECYCLE_ORDER.indexOf(current);
  const nextIdx = LIFECYCLE_ORDER.indexOf(next);
  return nextIdx === currentIdx + 1 || (next === 'closed' && current !== 'closed');
}
