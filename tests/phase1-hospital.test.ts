import { describe, it, expect } from 'vitest';
import { calculateFreshnessStatus, clampBedCount } from '@/lib/hospital/resources';
import {
  HospitalResourcesUpdateSchema,
  BloodStockUpdateSchema,
} from '@/lib/validations/schemas';
import { mockStore } from '@/lib/supabase/client';

describe('Phase 1: Hospital Freshness & Decay Logic (HM-2)', () => {
  it('classifies timestamp < 30 minutes as fresh with high decay multiplier', () => {
    const now = Date.now();
    const tenMinAgo = new Date(now - 10 * 60 * 1000).toISOString();

    const result = calculateFreshnessStatus(tenMinAgo, now);
    expect(result.tier).toBe('fresh');
    expect(result.ageMinutes).toBe(10);
    expect(result.decayMultiplier).toBeGreaterThan(0.7);
    expect(result.colorClass).toContain('emerald');
  });

  it('classifies timestamp between 30 and 60 minutes as stale_warning', () => {
    const now = Date.now();
    const fortyMinAgo = new Date(now - 40 * 60 * 1000).toISOString();

    const result = calculateFreshnessStatus(fortyMinAgo, now);
    expect(result.tier).toBe('stale_warning');
    expect(result.ageMinutes).toBe(40);
    expect(result.colorClass).toContain('amber');
  });

  it('classifies timestamp > 60 minutes as stale_critical with low decay multiplier', () => {
    const now = Date.now();
    const ninetyMinAgo = new Date(now - 90 * 60 * 1000).toISOString();

    const result = calculateFreshnessStatus(ninetyMinAgo, now);
    expect(result.tier).toBe('stale_critical');
    expect(result.ageMinutes).toBe(90);
    expect(result.decayMultiplier).toBeLessThan(0.1);
    expect(result.colorClass).toContain('red');
  });

  it('clamps bed counts accurately without negative values', () => {
    expect(clampBedCount(-5, 20)).toBe(0);
    expect(clampBedCount(15, 20)).toBe(15);
    expect(clampBedCount(25, 20)).toBe(20);
  });
});

describe('Phase 1: Hospital Resource Updates & Schema Validation (HD-2, HM-1)', () => {
  it('validates and accepts valid resource payload', () => {
    const valid = {
      hospital_id: '11111111-2222-3333-4444-555555555555',
      icu_free: 4,
      er_free: 8,
      trauma_bay_free: 2,
      ventilators_free: 3,
      ot_available: true,
      cath_lab_available: true,
      ct_available: true,
      on_call: { trauma_surgeon: true },
    };

    const parsed = HospitalResourcesUpdateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects resource payload with negative bed count', () => {
    const invalid = {
      hospital_id: '11111111-2222-3333-4444-555555555555',
      icu_free: -1, // Invalid: cannot be negative
      er_free: 5,
      trauma_bay_free: 1,
      ventilators_free: 1,
      ot_available: true,
      cath_lab_available: false,
      ct_available: true,
    };

    const parsed = HospitalResourcesUpdateSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates blood stock update schema correctly', () => {
    const valid = {
      hospital_id: '11111111-2222-3333-4444-555555555555',
      blood_group: 'O-',
      units: 4,
    };
    const parsed = BloodStockUpdateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const invalidGroup = {
      hospital_id: '11111111-2222-3333-4444-555555555555',
      blood_group: 'X+', // Invalid blood group
      units: 4,
    };
    const parsedInvalid = BloodStockUpdateSchema.safeParse(invalidGroup);
    expect(parsedInvalid.success).toBe(false);
  });

  it('updates resources in mockStore and refreshes updated_at timestamp', () => {
    mockStore.resetToDefaults();
    const original = mockStore.getResources('hosp-001');
    expect(original).toBeDefined();

    const updated = mockStore.updateResources('hosp-001', {
      icu_free: 12,
      trauma_bay_free: 4,
    });

    expect(updated.icu_free).toBe(12);
    expect(updated.trauma_bay_free).toBe(4);
    expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(original!.updated_at).getTime()
    );
  });

  it('updates blood stock in mockStore correctly', () => {
    mockStore.resetToDefaults();
    const updated = mockStore.updateBloodStock('hosp-005', 'O-', 5);
    expect(updated.units).toBe(5);

    const retrieved = mockStore
      .getBloodStock('hosp-005')
      .find((b) => b.blood_group === 'O-');
    expect(retrieved?.units).toBe(5);
  });
});
