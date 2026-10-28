import { describe, it, expect } from 'vitest';
import { distributeMciPatients, MciPatient } from '@/lib/matching/mci';
import { MOCK_HOSPITALS, MOCK_RESOURCES } from '@/lib/supabase/mock-data';
import { evaluateDiversion } from '@/lib/queue/engine';

describe('Phase 8: Mass-Casualty Incident (MCI) Distribution Algorithm (CC-2)', () => {
  it('distributes N multi-triage patients across hospitals without overloading any facility', () => {
    const patients: MciPatient[] = [
      { id: 'p-1', triage: 'RED' },
      { id: 'p-2', triage: 'RED' },
      { id: 'p-3', triage: 'RED' },
      { id: 'p-4', triage: 'YELLOW' },
      { id: 'p-5', triage: 'YELLOW' },
      { id: 'p-6', triage: 'GREEN' },
      { id: 'p-7', triage: 'GREEN' },
      { id: 'p-8', triage: 'BLACK' },
    ];

    const result = distributeMciPatients(patients, MOCK_HOSPITALS, MOCK_RESOURCES);

    expect(result.totalPatientsProcessed).toBe(8);
    expect(result.allocations.length).toBe(8);
    expect(result.unallocatedPatients.length).toBe(0);

    // Verify RED patients were prioritized and assigned trauma bays/ICU
    const redAllocations = result.allocations.filter((a) => a.triage === 'RED');
    expect(redAllocations.length).toBe(3);
    for (const alloc of redAllocations) {
      expect(['trauma_bay', 'icu']).toContain(alloc.bedTypeAssigned);
    }

    // Verify load was distributed across more than one hospital
    const assignedHospitalIds = new Set(result.allocations.map((a) => a.hospitalId));
    expect(assignedHospitalIds.size).toBeGreaterThan(1);
  });

  it('gracefully handles severe surge when trauma bays are exhausted', () => {
    // Single hospital mock with only 1 trauma bay
    const limitedHospitals = [
      {
        ...MOCK_HOSPITALS[0],
        resources: {
          ...MOCK_RESOURCES['hosp-001'],
          trauma_bay_free: 1,
          icu_free: 0,
          er_free: 1,
        },
      },
    ];

    const patients: MciPatient[] = [
      { id: 'p-1', triage: 'RED' },
      { id: 'p-2', triage: 'RED' },
      { id: 'p-3', triage: 'RED' },
    ];

    const result = distributeMciPatients(patients, limitedHospitals);

    // First RED gets trauma bay, second gets ER overflow, third is flagged as unallocated
    expect(result.allocations[0].bedTypeAssigned).toBe('trauma_bay');
    expect(result.allocations[1].bedTypeAssigned).toBe('er');
    expect(result.unallocatedPatients.length).toBe(1);
    expect(result.unallocatedPatients[0].patientId).toBe('p-3');
  });
});

describe('Phase 8: Command Center & Fleet Analytics (CC-1..CC-4)', () => {
  it('computes projected load and triggers auto-diversion when ER exceeds 85%', () => {
    const res = {
      ...MOCK_RESOURCES['hosp-001'],
      er_total: 20,
      er_free: 2, // 18 occupied
    };

    const telemetry = evaluateDiversion('hosp-001', res, 3, 10);

    // With 18/20 occupied and 3 inbound, projectedLoad will exceed 85%
    expect(telemetry.projectedLoad).toBeGreaterThan(0.85);
    expect(telemetry.shouldDivert).toBe(true);
    expect(telemetry.diversionReason).toContain('capacity exceeded');
  });
});
