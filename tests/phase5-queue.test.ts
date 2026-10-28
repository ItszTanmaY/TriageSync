import { describe, it, expect } from 'vitest';
import {
  calculateInboundCount,
  calculateProjectedErLoad,
  calculateProjectedWaitMinutes,
  evaluateDiversion,
  createDiversionRecord,
} from '@/lib/queue/engine';
import { HospitalResources } from '@/lib/types/database';

describe('Phase 5: QueuePredict Inbound Telemetry (QP-1)', () => {
  it('counts inbound ambulances heading to a hospital within arrival window', () => {
    const ambulances = [
      { ambulanceId: 'amb-1', destinationHospitalId: 'hosp-001', etaMinutes: 5 },
      { ambulanceId: 'amb-2', destinationHospitalId: 'hosp-001', etaMinutes: 12 },
      { ambulanceId: 'amb-3', destinationHospitalId: 'hosp-001', etaMinutes: 25 },
      { ambulanceId: 'amb-4', destinationHospitalId: 'hosp-002', etaMinutes: 4 },
    ];

    // Check with 15-minute max ETA
    const count = calculateInboundCount('hosp-001', 15, ambulances);
    expect(count).toBe(2); // amb-1 (5m) and amb-2 (12m)
  });
});

describe('Phase 5: Projected ER Load & Discharge Calculations (QP-2)', () => {
  const sampleResources: HospitalResources = {
    hospital_id: 'hosp-001',
    icu_total: 10,
    icu_free: 2,
    er_total: 20,
    er_free: 5, // occupied = 15
    trauma_bay_free: 2,
    ventilators_free: 3,
    ot_available: true,
    cath_lab_available: true,
    ct_available: true,
    on_call: {},
    avg_er_service_min: 20,
    updated_at: new Date().toISOString(),
  };

  it('computes projected load using exact mathematical formula', () => {
    // er_total = 20, occupied = 15, inbound = 3, eta = 20m -> discharges = 1
    // projected = (15 + 3 - 1) / 20 = 17 / 20 = 0.85
    const result = calculateProjectedErLoad(sampleResources, 3, 20);
    expect(result.occupied).toBe(15);
    expect(result.discharges).toBe(1);
    expect(result.projectedLoad).toBe(0.85);
  });
});

describe('Phase 5: Projected ER Wait Minutes (QP-2)', () => {
  it('returns 0 wait time when ER has sufficient capacity', () => {
    const resources: HospitalResources = {
      hospital_id: 'hosp-001',
      icu_total: 10,
      icu_free: 5,
      er_total: 20,
      er_free: 10, // occupied = 10
      trauma_bay_free: 2,
      ventilators_free: 2,
      ot_available: true,
      cath_lab_available: true,
      ct_available: true,
      on_call: {},
      avg_er_service_min: 20,
      updated_at: new Date().toISOString(),
    };

    // occupied = 10, inbound = 2 -> total 12 <= 20
    const wait = calculateProjectedWaitMinutes(resources, 2);
    expect(wait).toBe(0);
  });

  it('calculates wait time when inbound + occupied exceeds capacity', () => {
    const resources: HospitalResources = {
      hospital_id: 'hosp-001',
      icu_total: 10,
      icu_free: 1,
      er_total: 20,
      er_free: 1, // occupied = 19
      trauma_bay_free: 1,
      ventilators_free: 1,
      ot_available: true,
      cath_lab_available: true,
      ct_available: true,
      on_call: {},
      avg_er_service_min: 20,
      updated_at: new Date().toISOString(),
    };

    // occupied = 19, inbound = 5 -> excess = 4
    // wait_min = 4 * 20 / 20 = 4 minutes
    const wait = calculateProjectedWaitMinutes(resources, 5);
    expect(wait).toBe(4);
  });
});

describe('Phase 5: Automatic Diversion Thresholds (QP-3, QP-5)', () => {
  it('triggers diversion when projected ER load exceeds 0.85 threshold', () => {
    const resources: HospitalResources = {
      hospital_id: 'hosp-001',
      icu_total: 10,
      icu_free: 1,
      er_total: 20,
      er_free: 2, // occupied = 18
      trauma_bay_free: 1,
      ventilators_free: 1,
      ot_available: true,
      cath_lab_available: true,
      ct_available: true,
      on_call: {},
      avg_er_service_min: 20,
      updated_at: new Date().toISOString(),
    };

    // inbound = 3, eta = 10m (0 discharges) -> projected = (18 + 3) / 20 = 1.05 (> 0.85)
    const telemetry = evaluateDiversion('hosp-001', resources, 3, 10);
    expect(telemetry.shouldDivert).toBe(true);
    expect(telemetry.isOverloaded).toBe(true);
    expect(telemetry.diversionReason).toContain('Projected ER capacity exceeded');

    // Generate record
    const record = createDiversionRecord(
      'inc-100',
      'hosp-001',
      'hosp-002',
      telemetry
    );
    expect(record.from_hospital).toBe('hosp-001');
    expect(record.to_hospital).toBe('hosp-002');
    expect(record.numbers.projected_load).toBeGreaterThan(0.85);
  });
});
