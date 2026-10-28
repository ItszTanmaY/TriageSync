/**
 * TriageSync 2.0: QueuePredict Engine & Load Balancing
 * Architecture Section 6 & SRS QP-1..QP-5
 * Strict TypeScript: Zero `any` types.
 */

import { HospitalResources, DiversionRecord } from '@/lib/types/database';
import { QUEUE_PREDICT_THRESHOLDS } from '@/lib/config';

export interface InboundAmbulanceInfo {
  ambulanceId: string;
  destinationHospitalId: string;
  etaMinutes: number;
}

export interface QueueTelemetry {
  hospitalId: string;
  erTotal: number;
  erFree: number;
  erOccupied: number;
  inboundCount: number;
  expectedDischarges: number;
  projectedLoad: number;      // 0.0 to 1.0+
  projectedLoadPercentage: number; // 0 to 100
  projectedWaitMinutes: number;
  isOverloaded: boolean;
  shouldDivert: boolean;
  diversionReason: string | null;
}

/**
 * Calculates inbound ambulances heading to a hospital within a specific arrival window
 */
export function calculateInboundCount(
  hospitalId: string,
  maxEtaMinutes: number,
  inTransitAmbulances: InboundAmbulanceInfo[]
): number {
  return inTransitAmbulances.filter(
    (amb) => amb.destinationHospitalId === hospitalId && amb.etaMinutes <= maxEtaMinutes
  ).length;
}

/**
 * Computes projected ER load at arrival time per ARCHITECTURE.md Section 6:
 * projected_load = (er_total - er_free + inbound(h, ETA_this) - expected_discharges(h, ETA_this)) / er_total
 */
export function calculateProjectedErLoad(
  resources: HospitalResources,
  inboundCount: number,
  etaMinutes: number
): { projectedLoad: number; occupied: number; discharges: number } {
  const erTotal = Math.max(1, resources.er_total);
  const occupied = Math.max(0, erTotal - resources.er_free);
  const avgServiceMin = resources.avg_er_service_min || QUEUE_PREDICT_THRESHOLDS.DEFAULT_AVG_ER_SERVICE_MIN;

  const discharges = Math.floor(etaMinutes / avgServiceMin);
  const projectedLoad = (occupied + inboundCount - discharges) / erTotal;

  return {
    projectedLoad: Math.max(0, Math.round(projectedLoad * 100) / 100),
    occupied,
    discharges,
  };
}

/**
 * Computes projected ER wait time in minutes:
 * wait_min = max(0, (inbound + occupied - er_total)) * avg_er_service_min / er_total
 */
export function calculateProjectedWaitMinutes(
  resources: HospitalResources,
  inboundCount: number
): number {
  const erTotal = Math.max(1, resources.er_total);
  const occupied = Math.max(0, erTotal - resources.er_free);
  const avgServiceMin = resources.avg_er_service_min || QUEUE_PREDICT_THRESHOLDS.DEFAULT_AVG_ER_SERVICE_MIN;

  const excess = Math.max(0, inboundCount + occupied - erTotal);
  const waitMinutes = (excess * avgServiceMin) / erTotal;

  return Math.round(waitMinutes * 10) / 10;
}

/**
 * Evaluates whether an incoming ambulance should be diverted per QP-3
 * Threshold: projected_load > 0.85 or wait_min > 15
 */
export function evaluateDiversion(
  hospitalId: string,
  resources: HospitalResources,
  inboundCount: number,
  etaMinutes: number
): QueueTelemetry {
  const { projectedLoad, occupied, discharges } = calculateProjectedErLoad(
    resources,
    inboundCount,
    etaMinutes
  );
  const waitMinutes = calculateProjectedWaitMinutes(resources, inboundCount);

  const exceedsLoad = projectedLoad >= QUEUE_PREDICT_THRESHOLDS.DIVERT_PROJECTED_LOAD;
  const exceedsWait = waitMinutes >= QUEUE_PREDICT_THRESHOLDS.DIVERT_WAIT_MINUTES;
  const shouldDivert = exceedsLoad || exceedsWait;

  let diversionReason: string | null = null;
  if (exceedsLoad && exceedsWait) {
    diversionReason = `Critical ER load (${Math.round(projectedLoad * 100)}%) and excessive wait (${waitMinutes}m)`;
  } else if (exceedsLoad) {
    diversionReason = `Projected ER capacity exceeded (${Math.round(projectedLoad * 100)}% > 85% limit)`;
  } else if (exceedsWait) {
    diversionReason = `Projected ER queue wait exceeds threshold (${waitMinutes}m > 15m limit)`;
  }

  return {
    hospitalId,
    erTotal: resources.er_total,
    erFree: resources.er_free,
    erOccupied: occupied,
    inboundCount,
    expectedDischarges: discharges,
    projectedLoad,
    projectedLoadPercentage: Math.min(100, Math.round(projectedLoad * 100)),
    projectedWaitMinutes: waitMinutes,
    isOverloaded: exceedsLoad,
    shouldDivert,
    diversionReason,
  };
}

/**
 * Formats a diversion record for database logging
 */
export function createDiversionRecord(
  incidentId: string,
  fromHospitalId: string,
  toHospitalId: string,
  telemetry: QueueTelemetry
): DiversionRecord {
  return {
    id: `div-${Date.now()}`,
    incident_id: incidentId,
    from_hospital: fromHospitalId,
    to_hospital: toHospitalId,
    reason: telemetry.diversionReason || 'Automatic load-balancing diversion',
    numbers: {
      projected_load: telemetry.projectedLoad,
      wait_min: telemetry.projectedWaitMinutes,
      inbound_count: telemetry.inboundCount,
      er_free: telemetry.erFree,
      er_total: telemetry.erTotal,
    },
    at: new Date().toISOString(),
  };
}
