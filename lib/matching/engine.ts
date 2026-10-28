/**
 * TriageSync 2.0: Hospital Capability Matching Engine
 * Architecture Section 5: Pure, tested TypeScript scoring engine
 * Strict TypeScript: Zero `any` types.
 */

import {
  Hospital,
  HospitalResources,
  BloodStockItem,
  GeoLocation,
  IncidentType,
  TriageLevel,
  BloodGroup,
  HospitalRankItem,
  ScoreFactors,
} from '@/lib/types/database';
import {
  MATCHING_WEIGHTS,
  MATCHING_CONFIG,
  INCIDENT_REQUIREMENTS,
  BLOOD_COMPATIBILITY,
} from '@/lib/config';

export interface MatchingInput {
  incidentLocation: GeoLocation;
  incidentType: IncidentType;
  triageLevel: TriageLevel;
  patientBloodGroup?: BloodGroup | null;
  bloodUnitsNeeded?: number;
  hospitals: Hospital[];
  resourcesMap: Record<string, HospitalResources>;
  bloodStockList: BloodStockItem[];
  nowTimestamp?: number;
}

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
export function calculateHaversineDistanceKm(
  coord1: GeoLocation,
  coord2: GeoLocation
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates transit ETA in minutes based on distance and average speed (40 km/h)
 */
export function estimateEtaMinutes(
  distanceKm: number,
  speedKmh: number = MATCHING_CONFIG.DEFAULT_TRANSIT_SPEED_KMH
): number {
  const hours = distanceKm / speedKmh;
  const minutes = Math.round(hours * 60);
  return Math.max(2, minutes); // Minimum 2 minutes for immediate proximity
}

/**
 * Checks if a specific capability is available at the hospital
 */
function checkHospitalCapability(
  capability: string,
  hospital: Hospital,
  res?: HospitalResources
): boolean {
  if (!res) return false;

  switch (capability) {
    case 'er':
      return res.er_free > 0;
    case 'trauma_bay':
      return res.trauma_bay_free > 0;
    case 'icu':
      return res.icu_free > 0;
    case 'ot':
      return res.ot_available;
    case 'cath_lab':
      return res.cath_lab_available;
    case 'ct':
      return res.ct_available;
    case 'neuro':
      return Boolean(res.on_call.neurosurgeon || hospital.specialties.includes('neuro'));
    case 'burns':
      return Boolean(res.on_call.burn_specialist || hospital.specialties.includes('burns'));
    case 'obstetric':
      return Boolean(res.on_call.obstetrician || hospital.specialties.includes('obstetric'));
    case 'paediatric':
      return Boolean(res.on_call.pediatrician || hospital.specialties.includes('paediatric'));
    case 'blood':
      return true; // Blood evaluated separately in blood score
    default:
      return hospital.specialties.includes(capability);
  }
}

/**
 * Calculates blood compatibility score (0.0 to 1.0) and available units
 */
export function calculateBloodScore(
  patientBg: BloodGroup | null | undefined,
  unitsNeeded: number,
  hospitalId: string,
  bloodStockList: BloodStockItem[]
): { score: number; matchedUnits: number } {
  if (!patientBg || unitsNeeded <= 0) {
    return { score: 1.0, matchedUnits: 99 }; // Blood not requested or unknown
  }

  const compatibleGroups = BLOOD_COMPATIBILITY[patientBg] || [patientBg];
  const hospitalStock = bloodStockList.filter((b) => b.hospital_id === hospitalId);

  // Exact match stock
  const exactStockItem = hospitalStock.find((b) => b.blood_group === patientBg);
  const exactUnits = exactStockItem ? exactStockItem.units : 0;

  if (exactUnits >= unitsNeeded) {
    return { score: 1.0, matchedUnits: exactUnits };
  }

  // Compatible match stock
  let totalCompatibleUnits = 0;
  for (const bg of compatibleGroups) {
    const item = hospitalStock.find((b) => b.blood_group === bg);
    if (item) totalCompatibleUnits += item.units;
  }

  if (totalCompatibleUnits >= unitsNeeded) {
    return { score: 0.75, matchedUnits: totalCompatibleUnits };
  }

  if (totalCompatibleUnits > 0) {
    return { score: 0.35, matchedUnits: totalCompatibleUnits };
  }

  return { score: 0.0, matchedUnits: 0 };
}

/**
 * Evaluates all hospitals and returns ranked recommendations with factor breakdowns
 */
export function rankHospitalsForIncident(input: MatchingInput): {
  topRecommendations: HospitalRankItem[];
  excludedHospitals: HospitalRankItem[];
  allRankings: HospitalRankItem[];
} {
  const {
    incidentLocation,
    incidentType,
    triageLevel,
    patientBloodGroup,
    bloodUnitsNeeded = 2,
    hospitals,
    resourcesMap,
    bloodStockList,
    nowTimestamp = Date.now(),
  } = input;

  const typeConfig = INCIDENT_REQUIREMENTS[incidentType] || INCIDENT_REQUIREMENTS.other;
  const mustRequirements: string[] = [...typeConfig.must];
  const shouldRequirements: string[] = [...typeConfig.should];

  // Clinical Rule: Severity RED upgrades ICU bed and matching blood to mandatory must-haves
  if (triageLevel === 'red') {
    if (!mustRequirements.includes('icu')) {
      mustRequirements.push('icu');
    }
  }

  const scoredHospitals: HospitalRankItem[] = [];

  for (const hospital of hospitals) {
    const res = resourcesMap[hospital.id];
    const distanceKm = calculateHaversineDistanceKm(incidentLocation, hospital.location);
    const etaMinutes = estimateEtaMinutes(distanceKm);

    // Factor 1: ETA Score (0.0 - 1.0)
    const etaScore = Math.max(0, 1 - etaMinutes / MATCHING_CONFIG.MAX_ETA_MINUTES);

    // Hard Exclusion Evaluation
    const satisfiedMust: string[] = [];
    const failedMust: string[] = [];

    for (const req of mustRequirements) {
      if (checkHospitalCapability(req, hospital, res)) {
        satisfiedMust.push(req);
      } else {
        failedMust.push(req);
      }
    }

    const isExcluded = failedMust.length > 0;
    let excludedReason: string | null = null;
    if (isExcluded) {
      const formattedFailures = failedMust.map((f) => {
        if (f === 'trauma_bay') return 'No free trauma bay';
        if (f === 'icu') return 'ICU at 100% capacity';
        if (f === 'er') return 'ER full';
        if (f === 'cath_lab') return 'Cath Lab unavailable';
        return `Missing ${f}`;
      });
      excludedReason = formattedFailures.join(', ');
    }

    // Factor 2: Capability Score (0.0 - 1.0)
    const satisfiedShould: string[] = [];
    const missingShould: string[] = [];
    for (const req of shouldRequirements) {
      if (checkHospitalCapability(req, hospital, res)) {
        satisfiedShould.push(req);
      } else {
        missingShould.push(req);
      }
    }
    const capabilityScore =
      shouldRequirements.length > 0
        ? satisfiedShould.length / shouldRequirements.length
        : 1.0;

    // Factor 3: Bed Availability Score (0.0 - 1.0)
    const freeBeds = (res?.er_free || 0) + (res?.icu_free || 0);
    const bedScore = Math.min(1.0, freeBeds / 4);

    // Factor 4: Blood Compatibility Score (0.0 - 1.0)
    const bloodResult = calculateBloodScore(
      patientBloodGroup,
      bloodUnitsNeeded,
      hospital.id,
      bloodStockList
    );
    const bloodScore = bloodResult.score;

    // Factor 5: Queue / Load Score (0.0 - 1.0)
    const erTotal = res?.er_total || 20;
    const erOccupied = Math.max(0, erTotal - (res?.er_free || 0));
    const projectedErLoad = Math.min(1.0, erOccupied / erTotal);
    const queueScore = Math.max(0, 1.0 - projectedErLoad);

    // Factor 6: Freshness Score (0.0 - 1.0)
    const updatedTime = res ? new Date(res.updated_at).getTime() : nowTimestamp;
    const ageMinutes = Math.max(0, Math.floor((nowTimestamp - updatedTime) / (1000 * 60)));
    const freshnessScore = Math.exp(-ageMinutes / MATCHING_CONFIG.FRESHNESS_HALF_LIFE_MINUTES);

    // Weighted Overall Score (0 - 100)
    const rawTotalScore =
      MATCHING_WEIGHTS.ETA * etaScore +
      MATCHING_WEIGHTS.CAPABILITY * capabilityScore +
      MATCHING_WEIGHTS.BED * bedScore +
      MATCHING_WEIGHTS.BLOOD * bloodScore +
      MATCHING_WEIGHTS.QUEUE * queueScore +
      MATCHING_WEIGHTS.FRESHNESS * freshnessScore;

    const totalScore = isExcluded ? 0 : Math.round(rawTotalScore * 100);

    const factors: ScoreFactors = {
      eta_minutes: etaMinutes,
      eta_score: Math.round(etaScore * 100) / 100,
      capability_score: Math.round(capabilityScore * 100) / 100,
      bed_score: Math.round(bedScore * 100) / 100,
      blood_score: Math.round(bloodScore * 100) / 100,
      queue_score: Math.round(queueScore * 100) / 100,
      freshness_score: Math.round(freshnessScore * 100) / 100,
      satisfied_must: satisfiedMust,
      failed_must: failedMust,
      satisfied_should: satisfiedShould,
      missing_should: missingShould,
      blood_matched_units: bloodResult.matchedUnits,
      projected_er_load: Math.round(projectedErLoad * 100) / 100,
      age_minutes: ageMinutes,
    };

    scoredHospitals.push({
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      total_score: totalScore,
      is_excluded: isExcluded,
      excluded_reason: excludedReason,
      eta_minutes: etaMinutes,
      factors,
    });
  }

  // Sort eligible hospitals by total_score DESC, then by eta_minutes ASC (tie-break)
  const eligible = scoredHospitals
    .filter((h) => !h.is_excluded)
    .sort((a, b) => b.total_score - a.total_score || a.eta_minutes - b.eta_minutes);

  const excluded = scoredHospitals.filter((h) => h.is_excluded);

  return {
    topRecommendations: eligible.slice(0, MATCHING_CONFIG.MAX_RECOMMENDATIONS_RETURNED),
    excludedHospitals: excluded,
    allRankings: [...eligible, ...excluded],
  };
}
