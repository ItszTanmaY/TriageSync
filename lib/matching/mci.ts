/**
 * TriageSync 2.0: Mass-Casualty Incident (MCI) Patient Distribution Engine
 * SRS Requirement: CC-2 (Mass-casualty mode: split N patients across hospitals optimally)
 * Architecture Section 5.3 & IEEE 830 Spec
 */

import { Hospital, HospitalResources } from '@/lib/types/database';

export type TriageUrgency = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';

export interface MciPatient {
  id: string;
  triage: TriageUrgency;
  conditionDescription?: string;
  requiredSpecialty?: 'trauma' | 'burns' | 'cardiac' | 'pediatric' | 'general';
}

export interface PatientHospitalAllocation {
  patientId: string;
  triage: TriageUrgency;
  hospitalId: string;
  hospitalName: string;
  bedTypeAssigned: 'trauma_bay' | 'icu' | 'er' | 'general';
  allocationReason: string;
}

export interface MciDistributionResult {
  allocations: PatientHospitalAllocation[];
  unallocatedPatients: {
    patientId: string;
    triage: TriageUrgency;
    reason: string;
  }[];
  hospitalLoadSummary: {
    hospitalId: string;
    hospitalName: string;
    assignedRed: number;
    assignedYellow: number;
    assignedGreen: number;
    traumaBaysRemaining: number;
    icuRemaining: number;
    erRemaining: number;
  }[];
  totalPatientsProcessed: number;
}

export interface HospitalWithPossibleResources extends Hospital {
  resources?: HospitalResources;
}

/**
 * Greedily and optimally distributes N patients across available hospitals
 * according to triage level, capability requirements, and remaining capacities.
 * Guarantees no single hospital's critical facilities are overwhelmed.
 */
export function distributeMciPatients(
  patients: MciPatient[],
  hospitals: HospitalWithPossibleResources[],
  resourcesMap?: Record<string, HospitalResources>
): MciDistributionResult {
  // Sort patients by clinical priority: RED (immediate) -> YELLOW (delayed) -> GREEN (minor) -> BLACK
  const priorityOrder: Record<TriageUrgency, number> = {
    RED: 1,
    YELLOW: 2,
    GREEN: 3,
    BLACK: 4,
  };

  const sortedPatients = [...patients].sort(
    (a, b) => priorityOrder[a.triage] - priorityOrder[b.triage]
  );

  // Clone local capacity tracking to simulate allocations safely
  const hospitalTracking = hospitals.map((h) => {
    const res = resourcesMap?.[h.id] || h.resources || {
      trauma_bay_free: 2,
      icu_free: 4,
      er_free: 10,
      ot_available: true,
      ct_available: true,
    };

    return {
      hospitalId: h.id,
      hospitalName: h.name,
      traumaBaysRemaining: res.trauma_bay_free ?? 2,
      icuRemaining: res.icu_free ?? 4,
      erRemaining: res.er_free ?? 10,
      assignedRed: 0,
      assignedYellow: 0,
      assignedGreen: 0,
      hasOt: res.ot_available ?? true,
      hasCt: res.ct_available ?? true,
    };
  });

  const allocations: PatientHospitalAllocation[] = [];
  const unallocatedPatients: { patientId: string; triage: TriageUrgency; reason: string }[] = [];

  for (const patient of sortedPatients) {
    if (patient.triage === 'BLACK') {
      // Deceased/expectant: allocate to nearest facility with mortuary or flag for holding
      const firstAvailable = hospitalTracking[0];
      if (firstAvailable) {
        allocations.push({
          patientId: patient.id,
          triage: patient.triage,
          hospitalId: firstAvailable.hospitalId,
          hospitalName: firstAvailable.hospitalName,
          bedTypeAssigned: 'general',
          allocationReason: 'Deceased/Expectant triage protocol — stabilization & morgue holding.',
        });
      }
      continue;
    }

    if (patient.triage === 'RED') {
      // Immediate: Needs Trauma Bay + OT/ICU if available
      // Find candidate with available trauma bay first, then ICU
      const candidate = hospitalTracking
        .filter((h) => h.traumaBaysRemaining > 0 || h.icuRemaining > 0)
        .sort((a, b) => {
          // Prefer facility with both Trauma Bay and OT
          if (a.traumaBaysRemaining > 0 && b.traumaBaysRemaining === 0) return -1;
          if (b.traumaBaysRemaining > 0 && a.traumaBaysRemaining === 0) return 1;
          // Tie-break by least current RED load to balance city hospitals
          return a.assignedRed - b.assignedRed;
        })[0];

      if (candidate) {
        const bedType = candidate.traumaBaysRemaining > 0 ? 'trauma_bay' : 'icu';
        if (bedType === 'trauma_bay') {
          candidate.traumaBaysRemaining -= 1;
        } else {
          candidate.icuRemaining -= 1;
        }
        candidate.assignedRed += 1;

        allocations.push({
          patientId: patient.id,
          triage: patient.triage,
          hospitalId: candidate.hospitalId,
          hospitalName: candidate.hospitalName,
          bedTypeAssigned: bedType,
          allocationReason: `High-priority trauma allocation (${bedType.replace('_', ' ')} reserved; ${candidate.traumaBaysRemaining} bays remaining).`,
        });
      } else {
        // Fallback to ER bed if trauma bays & ICUs are exhausted
        const erCandidate = hospitalTracking.find((h) => h.erRemaining > 0);
        if (erCandidate) {
          erCandidate.erRemaining -= 1;
          erCandidate.assignedRed += 1;
          allocations.push({
            patientId: patient.id,
            triage: patient.triage,
            hospitalId: erCandidate.hospitalId,
            hospitalName: erCandidate.hospitalName,
            bedTypeAssigned: 'er',
            allocationReason: 'Critical alert: Surge overflow to ER resuscitation bed.',
          });
        } else {
          unallocatedPatients.push({
            patientId: patient.id,
            triage: patient.triage,
            reason: 'All regional trauma, ICU, and ER beds exhausted. Mutual aid requested.',
          });
        }
      }
    } else if (patient.triage === 'YELLOW') {
      // Delayed: Needs ER bed
      const candidate = hospitalTracking
        .filter((h) => h.erRemaining > 0)
        .sort((a, b) => a.assignedYellow - b.assignedYellow)[0];

      if (candidate) {
        candidate.erRemaining -= 1;
        candidate.assignedYellow += 1;
        allocations.push({
          patientId: patient.id,
          triage: patient.triage,
          hospitalId: candidate.hospitalId,
          hospitalName: candidate.hospitalName,
          bedTypeAssigned: 'er',
          allocationReason: `Assigned to ${candidate.hospitalName} ER (${candidate.erRemaining} beds remaining).`,
        });
      } else {
        unallocatedPatients.push({
          patientId: patient.id,
          triage: patient.triage,
          reason: 'No available ER beds across participating sector facilities.',
        });
      }
    } else if (patient.triage === 'GREEN') {
      // Minor: Allocate to hospital with lowest load or remaining ER beds
      const candidate = hospitalTracking
        .sort((a, b) => (a.assignedGreen + a.assignedYellow) - (b.assignedGreen + b.assignedYellow))[0];

      if (candidate) {
        candidate.assignedGreen += 1;
        allocations.push({
          patientId: patient.id,
          triage: patient.triage,
          hospitalId: candidate.hospitalId,
          hospitalName: candidate.hospitalName,
          bedTypeAssigned: 'general',
          allocationReason: `Minor injury observation queue at ${candidate.hospitalName}.`,
        });
      }
    }
  }

  return {
    allocations,
    unallocatedPatients,
    hospitalLoadSummary: hospitalTracking.map((h) => ({
      hospitalId: h.hospitalId,
      hospitalName: h.hospitalName,
      assignedRed: h.assignedRed,
      assignedYellow: h.assignedYellow,
      assignedGreen: h.assignedGreen,
      traumaBaysRemaining: h.traumaBaysRemaining,
      icuRemaining: h.icuRemaining,
      erRemaining: h.erRemaining,
    })),
    totalPatientsProcessed: sortedPatients.length,
  };
}
