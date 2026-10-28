import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceKm,
  estimateEtaMinutes,
  calculateBloodScore,
  rankHospitalsForIncident,
} from '@/lib/matching/engine';
import {
  MOCK_HOSPITALS,
  MOCK_RESOURCES,
  MOCK_BLOOD_STOCK,
} from '@/lib/supabase/mock-data';
import { PUNE_CENTER, MATCHING_CONFIG } from '@/lib/config';

describe('Phase 2: Matching Engine Distance & ETA (HM-4)', () => {
  it('calculates realistic Haversine distance and transit ETA in Pune', () => {
    const loc1 = { latitude: 18.5204, longitude: 73.8567 }; // Shivajinagar
    const loc2 = { latitude: 18.5312, longitude: 73.8794 }; // Koregaon Park (~3 km)

    const distanceKm = calculateHaversineDistanceKm(loc1, loc2);
    expect(distanceKm).toBeGreaterThan(1.5);
    expect(distanceKm).toBeLessThan(4.5);

    const etaMin = estimateEtaMinutes(distanceKm, 40);
    expect(etaMin).toBeGreaterThanOrEqual(2);
    expect(etaMin).toBeLessThanOrEqual(10);
  });
});

describe('Phase 2: Hard Exclusions (HM-6)', () => {
  it('excludes hospital with no free trauma bay for a road accident', () => {
    const result = rankHospitalsForIncident({
      incidentLocation: PUNE_CENTER,
      incidentType: 'road_accident',
      triageLevel: 'yellow',
      hospitals: MOCK_HOSPITALS,
      resourcesMap: MOCK_RESOURCES,
      bloodStockList: MOCK_BLOOD_STOCK,
    });

    const puneMunicipal = result.excludedHospitals.find((h) => h.hospital_id === 'hosp-004');
    expect(puneMunicipal).toBeDefined();
    expect(puneMunicipal?.is_excluded).toBe(true);
    expect(puneMunicipal?.excluded_reason).toContain('No free trauma bay');
  });

  it('excludes hospital with full ICU when triage level is RED (immediate critical care)', () => {
    const result = rankHospitalsForIncident({
      incidentLocation: PUNE_CENTER,
      incidentType: 'road_accident',
      triageLevel: 'red', // RED elevates ICU to a mandatory must-have
      hospitals: MOCK_HOSPITALS,
      resourcesMap: MOCK_RESOURCES,
      bloodStockList: MOCK_BLOOD_STOCK,
    });

    const sahyadriFullIcu = result.excludedHospitals.find((h) => h.hospital_id === 'hosp-003');
    expect(sahyadriFullIcu).toBeDefined();
    expect(sahyadriFullIcu?.is_excluded).toBe(true);
    expect(sahyadriFullIcu?.excluded_reason).toContain('ICU at 100% capacity');
  });
});

describe('Phase 2: Blood Compatibility Scoring (HM-4)', () => {
  it('penalises hospitals with 0 units of requested O-negative blood', () => {
    const hadapsarBlood = calculateBloodScore('O-', 2, 'hosp-005', MOCK_BLOOD_STOCK);
    expect(hadapsarBlood.score).toBe(0.0);
    expect(hadapsarBlood.matchedUnits).toBe(0);

    const rubyApexBlood = calculateBloodScore('O-', 2, 'hosp-001', MOCK_BLOOD_STOCK);
    expect(rubyApexBlood.score).toBe(1.0);
    expect(rubyApexBlood.matchedUnits).toBeGreaterThanOrEqual(2);
  });
});

describe('Phase 2: Freshness Decay Penalty (HM-2, HM-4)', () => {
  it('applies a heavy freshness decay penalty to stale data (>90 min old)', () => {
    const result = rankHospitalsForIncident({
      incidentLocation: PUNE_CENTER,
      incidentType: 'other',
      triageLevel: 'green',
      hospitals: MOCK_HOSPITALS,
      resourcesMap: MOCK_RESOURCES,
      bloodStockList: MOCK_BLOOD_STOCK,
    });

    const staleHosp = result.allRankings.find((h) => h.hospital_id === 'hosp-010');
    expect(staleHosp).toBeDefined();
    expect(staleHosp?.factors.freshness_score).toBeLessThan(0.1);
  });
});

describe('Phase 2: Top Recommendations & Explainability (HM-5, HM-8)', () => {
  it('returns at most 3 top recommendations sorted by score descending', () => {
    const result = rankHospitalsForIncident({
      incidentLocation: PUNE_CENTER,
      incidentType: 'road_accident',
      triageLevel: 'red',
      patientBloodGroup: 'O-',
      bloodUnitsNeeded: 2,
      hospitals: MOCK_HOSPITALS,
      resourcesMap: MOCK_RESOURCES,
      bloodStockList: MOCK_BLOOD_STOCK,
    });

    expect(result.topRecommendations.length).toBeLessThanOrEqual(
      MATCHING_CONFIG.MAX_RECOMMENDATIONS_RETURNED
    );

    // Verify ordering
    if (result.topRecommendations.length >= 2) {
      expect(result.topRecommendations[0].total_score).toBeGreaterThanOrEqual(
        result.topRecommendations[1].total_score
      );
    }

    // Top match should be Ruby Apex or a fully capable facility
    const top = result.topRecommendations[0];
    expect(top.factors.eta_minutes).toBeDefined();
    expect(top.factors.blood_matched_units).toBeGreaterThanOrEqual(2);
    expect(top.is_excluded).toBe(false);
  });
});
