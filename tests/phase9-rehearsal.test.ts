/**
 * TriageSync 2.0: Phase 9 Acceptance Criteria Test Suite
 * SRS Section 9 (Demo-Level Acceptance Criteria 1..6)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { signCriticalPayload, parseAndVerifyHashFragment } from '@/lib/qr/signer';
import { rankHospitalsForIncident } from '@/lib/matching/engine';
import { MOCK_HOSPITALS, MOCK_RESOURCES, MOCK_BLOOD_STOCK } from '@/lib/supabase/mock-data';
import { extractStructuredHandover, generatePreArrivalChecklist } from '@/lib/voice/parser';
import { evaluateDiversion } from '@/lib/queue/engine';
import { createRelayPacket, processInboundPacket, resetSeenPacketIds } from '@/lib/peer/relay';
import { PUNE_CENTER } from '@/lib/config';
import { BloodGroup } from '@/lib/types/database';

describe('Phase 9 Acceptance Criteria Verification (SRS Section 9)', () => {
  beforeEach(() => {
    resetSeenPacketIds();
  });

  // Criterion 1: Scan a QR with airplane mode on: critical info shows.
  it('Criterion 1: Decodes and cryptographically verifies patient identity offline with zero network', () => {
    const payload = {
      v: 1,
      n: 'Asha Kulkarni',
      bg: 'O-' as BloodGroup,
      al: ['Penicillin'],
      cd: ['Type 2 Diabetes'],
      ec: '+91 98220 11223',
      t: 'tok_asha_k_9901',
      ts: 1793189000,
    };

    const signed = signCriticalPayload(payload);
    expect(signed.hashFragment).toBeDefined();

    // Verify completely offline from hash fragment alone
    const result = parseAndVerifyHashFragment(`#${signed.hashFragment}`);
    expect(result.isValid).toBe(true);
    expect(result.payload?.n).toBe('Asha Kulkarni');
    expect(result.payload?.bg).toBe('O-');
    expect(result.payload?.al).toContain('Penicillin');
  });

  // Criterion 2: Create incident: top 3 hospitals shown with explanations; one with full ICU is excluded.
  it('Criterion 2: Recommends top hospitals with factor breakdowns and excludes hospital with zero ICU/trauma', () => {
    const result = rankHospitalsForIncident({
      incidentLocation: PUNE_CENTER,
      incidentType: 'road_accident',
      triageLevel: 'red',
      hospitals: MOCK_HOSPITALS,
      resourcesMap: MOCK_RESOURCES,
      bloodStockList: MOCK_BLOOD_STOCK,
    });

    expect(result.topRecommendations.length).toBeGreaterThanOrEqual(1);

    // Top hospital has factor breakdown
    const top = result.topRecommendations[0];
    expect(top.factors).toBeDefined();
    expect(top.total_score).toBeGreaterThan(0);

    // Excluded hospital exists (hosp-004 has no trauma bay)
    expect(result.excludedHospitals.length).toBeGreaterThanOrEqual(1);
    const noTrauma = result.excludedHospitals.find((h) => h.hospital_id === 'hosp-004');
    expect(noTrauma).toBeDefined();
    expect(noTrauma?.is_excluded).toBe(true);
  });

  // Criterion 3: Fill a hospital's ICU in the dashboard: recommendation changes dynamically.
  it('Criterion 3: Dynamic resource changes immediately alter ranking and factor scores', () => {
    // Initial ranking
    const baseline = rankHospitalsForIncident({
      incidentLocation: PUNE_CENTER,
      incidentType: 'cardiac',
      triageLevel: 'red',
      hospitals: MOCK_HOSPITALS,
      resourcesMap: MOCK_RESOURCES,
      bloodStockList: MOCK_BLOOD_STOCK,
    });

    const topHospitalId = baseline.topRecommendations[0].hospital_id;

    // Simulate filling the top hospital's ICU to 0
    const modifiedResources = {
      ...MOCK_RESOURCES,
      [topHospitalId]: {
        ...MOCK_RESOURCES[topHospitalId],
        icu_free: 0,
        trauma_bay_free: 0,
      },
    };

    const updated = rankHospitalsForIncident({
      incidentLocation: PUNE_CENTER,
      incidentType: 'cardiac',
      triageLevel: 'red',
      hospitals: MOCK_HOSPITALS,
      resourcesMap: modifiedResources,
      bloodStockList: MOCK_BLOOD_STOCK,
    });

    // The hospital should now be excluded because red cardiac needs ICU
    const wasExcluded = updated.excludedHospitals.some((h) => h.hospital_id === topHospitalId);
    expect(wasExcluded).toBe(true);
  });

  // Criterion 4: Three ambulances target one hospital: the third is diverted with the reason shown.
  it('Criterion 4: Diverts 3rd inbound ambulance when hospital projected ER load exceeds 85%', () => {
    const res = {
      ...MOCK_RESOURCES['hosp-001'],
      er_total: 20,
      er_free: 2,
    };

    const telemetry = evaluateDiversion('hosp-001', res, 3, 10);
    expect(telemetry.projectedLoad).toBeGreaterThan(0.85);
    expect(telemetry.shouldDivert).toBe(true);
    expect(telemetry.diversionReason).toBeDefined();
  });

  // Criterion 5: Speak a handover: structured brief appears on hospital screen with a prep checklist.
  it('Criterion 5: Hands-free voice handover extracts SBAR fields and triggers prep checklist', () => {
    const speech =
      'This is medic 4 on route with a 45-year-old female driver from a vehicle crash. Suspected pelvic fracture. Pulse 128, BP 85 over 50, GCS 12. Needs 2 units O negative blood and immediate surgery.';

    const structured = extractStructuredHandover(speech);
    expect(structured.age).toBe(45);
    expect(structured.sex?.toLowerCase()).toBe('female');
    expect(structured.vitals?.hr).toBe(128);
    expect(structured.needs?.units).toBe(2);

    const checklist = generatePreArrivalChecklist(structured);
    expect(checklist.some((item) => item.title.includes('Blood') || item.description.includes('blood'))).toBe(true);
  });

  // Criterion 6: Disconnect network: peer relay forwards packet and deduplicates.
  it('Criterion 6: Peer mesh forwards packets with store-and-forward, hop decrement, and deduplication', () => {
    const packet = createRelayPacket(
      'ambulance-101',
      'incident_relay',
      { incidentId: 'inc-001', triage: 'RED' },
      { initialTtl: 3 }
    );

    // First receive: packet is accepted and forwarded
    const result1 = processInboundPacket(packet, 'mesh-node-pune', false);
    expect(result1.action).toBe('forward_to_peers');
    expect(result1.forwardablePacket?.hops).toContain('mesh-node-pune');

    // Second receive: duplicate packet is dropped
    const result2 = processInboundPacket(packet, 'mesh-node-pune', false);
    expect(result2.action).toBe('drop_duplicate');
  });
});
