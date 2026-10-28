import { describe, it, expect } from 'vitest';
import {
  CriticalPayloadSchema,
  IncidentCreateSchema,
  MedPassFormSchema,
  HospitalResourcesUpdateSchema,
} from '@/lib/validations/schemas';
import {
  signCriticalPayload,
  verifyCriticalPayload,
  parseAndVerifyHashFragment,
} from '@/lib/qr/signer';
import {
  MOCK_HOSPITALS,
  MOCK_RESOURCES,
  MOCK_BLOOD_STOCK,
  MOCK_AMBULANCES,
  MOCK_MEDPASSES,
} from '@/lib/supabase/mock-data';
import { mockStore } from '@/lib/supabase/client';
import { CriticalMedPassPayload } from '@/lib/types/database';

describe('Phase 0: Schema Validation and Boundary Checks', () => {
  it('validates a correct MedPass form payload', () => {
    const validMedPass = {
      full_name: 'Asha Kulkarni',
      dob: '1988-06-14',
      sex: 'Female',
      blood_group: 'O-',
      allergies: ['Penicillin'],
      conditions: ['Type 2 Diabetes'],
      medications: ['Metformin'],
      organ_donor: true,
      language: 'en',
      contacts: [
        {
          name: 'Dr. Ramesh Kulkarni',
          relation: 'Spouse',
          phone: '+919822011223',
          priority: 1,
        },
      ],
    };

    const parsed = MedPassFormSchema.safeParse(validMedPass);
    expect(parsed.success).toBe(true);

    const validCritical = {
      v: 1,
      n: 'Asha Kulkarni',
      bg: 'O-',
      al: ['Penicillin'],
      cd: ['Type 2 Diabetes'],
      ec: '+919822011223',
      t: 'tok_asha_k_9901',
      ts: 1730100000,
    };
    const parsedCritical = CriticalPayloadSchema.safeParse(validCritical);
    expect(parsedCritical.success).toBe(true);
  });

  it('rejects an invalid incident create payload with invalid UUID or missing type', () => {
    const invalidIncident = {
      type: 'invalid_type',
      latitude: 18.5204,
      longitude: 73.8567,
      patient_count: 0, // must be >= 1
      client_uuid: 'not-a-uuid',
    };

    const parsed = IncidentCreateSchema.safeParse(invalidIncident);
    expect(parsed.success).toBe(false);
  });

  it('validates hospital resource updates strictly', () => {
    const validResourceUpdate = {
      hospital_id: '123e4567-e89b-12d3-a456-426614174000',
      icu_free: 5,
      icu_total: 20,
      er_free: 8,
      er_total: 25,
      trauma_bay_free: 2,
      ventilators_free: 4,
      ot_available: true,
      cath_lab_available: false,
      ct_available: true,
      on_call: { trauma_surgeon: true, neurosurgeon: false },
    };

    const parsed = HospitalResourcesUpdateSchema.safeParse(validResourceUpdate);
    expect(parsed.success).toBe(true);
  });
});

describe('Phase 0: Ed25519 Cryptographic QR Signatures', () => {
  const samplePayload: CriticalMedPassPayload = {
    v: 1,
    n: 'Asha Kulkarni',
    bg: 'O-',
    al: ['Penicillin', 'Sulfa drugs'],
    cd: ['Type 2 Diabetes'],
    ec: '+919822011223',
    t: 'tok_asha_k_9901',
    ts: 1730100000,
  };

  it('signs and verifies payload correctly offline', () => {
    const signed = signCriticalPayload(samplePayload);
    expect(signed.signatureHex).toBeDefined();
    expect(signed.hashFragment).toBeDefined();

    const verification = verifyCriticalPayload(
      signed.payloadJson,
      signed.signatureHex
    );

    expect(verification.isValid).toBe(true);
    expect(verification.payload?.n).toBe('Asha Kulkarni');
    expect(verification.payload?.bg).toBe('O-');
  });

  it('verifies directly from URL hash fragment', () => {
    const signed = signCriticalPayload(samplePayload);
    const result = parseAndVerifyHashFragment(`#${signed.hashFragment}`);

    expect(result.isValid).toBe(true);
    expect(result.payload?.t).toBe('tok_asha_k_9901');
    expect(result.payload?.al).toContain('Penicillin');
  });

  it('rejects tampered payload', () => {
    const signed = signCriticalPayload(samplePayload);
    const tamperedPayloadJson = signed.payloadJson.replace('O-', 'AB+');

    const result = verifyCriticalPayload(tamperedPayloadJson, signed.signatureHex);
    expect(result.isValid).toBe(false);
  });
});

describe('Phase 0: Seed Data and Pune Emergency Grid (SIM-1)', () => {
  it('contains exactly 10 fictional hospitals around Pune with specialized capabilities', () => {
    expect(MOCK_HOSPITALS.length).toBe(10);

    // 1. Full ICU test case (Sahyadri)
    const fullIcuHosp = MOCK_RESOURCES['hosp-003'];
    expect(fullIcuHosp).toBeDefined();
    expect(fullIcuHosp.icu_free).toBe(0);

    // 2. No trauma bay test case (Pune Municipal)
    const noTraumaHosp = MOCK_RESOURCES['hosp-004'];
    expect(noTraumaHosp).toBeDefined();
    expect(noTraumaHosp.trauma_bay_free).toBe(0);

    // 3. No O-negative blood test case (Hadapsar)
    const hadapsarBlood = MOCK_BLOOD_STOCK.filter(
      (b) => b.hospital_id === 'hosp-005'
    );
    const oNeg = hadapsarBlood.find((b) => b.blood_group === 'O-');
    expect(oNeg?.units).toBe(0);

    // 4. Far highway trauma hub (Talegaon)
    const talegaon = MOCK_HOSPITALS.find((h) => h.id === 'hosp-006');
    expect(talegaon).toBeDefined();
    expect(talegaon?.level).toBe(1);

    // 5. Stale data (>60 minutes old) test case (Swargate)
    const staleHosp = MOCK_RESOURCES['hosp-010'];
    expect(staleHosp).toBeDefined();
    const ageMinutes = (Date.now() - new Date(staleHosp.updated_at).getTime()) / (1000 * 60);
    expect(ageMinutes).toBeGreaterThan(60);
  });

  it('contains blood stock for all 8 groups across all 10 hospitals', () => {
    const expectedTotalEntries = 10 * 8; // 80 stock items
    expect(MOCK_BLOOD_STOCK.length).toBe(expectedTotalEntries);

    const rubyBlood = MOCK_BLOOD_STOCK.filter((b) => b.hospital_id === 'hosp-001');
    expect(rubyBlood.length).toBe(8);
  });

  it('contains 10 active ambulances and 5 sample MedPasses with valid Ed25519 signatures', () => {
    expect(MOCK_AMBULANCES.length).toBe(10);
    expect(MOCK_MEDPASSES.length).toBe(5);

    for (const sample of MOCK_MEDPASSES) {
      expect(sample.medpass.public_token).toBeDefined();
      expect(sample.signedPayloadB64).toBeDefined();
      const verified = parseAndVerifyHashFragment(sample.signedPayloadB64);
      expect(verified.isValid).toBe(true);
      expect(verified.payload?.n).toBe(sample.medpass.full_name);
    }
  });

  it('allows mockStore to query and update resources and state safely', () => {
    mockStore.resetToDefaults();
    const hosp = mockStore.getHospitalById('hosp-001');
    expect(hosp?.name).toBe('Ruby Apex Trauma Institute');

    const updated = mockStore.updateResources('hosp-001', { icu_free: 7 });
    expect(updated.icu_free).toBe(7);
  });
});
