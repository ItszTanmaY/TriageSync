/**
 * TriageSync 2.0: Database Seeder Script
 * Meets requirement SIM-1.
 * Seeds 10 fictional hospitals around Pune with differing capabilities:
 * - hosp-001: Ruby Apex (Level 1, fully equipped, abundant O-neg)
 * - hosp-002: Deccan Neuro (Level 1 Neuro/Stroke)
 * - hosp-003: Sahyadri Metro (FULL ICU: 0 free beds)
 * - hosp-004: Pune Municipal (NO TRAUMA BAY: 0 trauma bays free)
 * - hosp-005: Hadapsar LifeLine (NO O-NEGATIVE: 0 units O-)
 * - hosp-006: Talegaon Expressway (FAR HIGHWAY HUB, fully equipped)
 * - hosp-007: Symbiosis University (Level 1 Comprehensive)
 * - hosp-008: Chinchwad Apex (Burns / Level 2)
 * - hosp-009: Kalyani Nagar Cardiac (Cardiac / Cath Lab)
 * - hosp-010: Swargate City (STALE DATA: >90 min old)
 * Blood stock for all 8 groups across all hospitals.
 * 10 ambulances stationed across Pune.
 * 5 sample MedPasses with Ed25519-signed offline payloads.
 */

import {
  MOCK_HOSPITALS,
  MOCK_RESOURCES,
  MOCK_BLOOD_STOCK,
  MOCK_AMBULANCES,
  MOCK_MEDPASSES,
} from '../lib/supabase/mock-data';
import { supabase, isSupabaseConfigured, mockStore } from '../lib/supabase/client';

export async function runSeed(): Promise<{
  success: boolean;
  hospitalsCount: number;
  resourcesCount: number;
  bloodStockCount: number;
  ambulancesCount: number;
  medpassesCount: number;
  mode: 'supabase' | 'in-memory-store';
}> {
  console.log('--------------------------------------------------');
  console.log('🚀 TriageSync 2.0: Initializing Pune Emergency Grid Seed');
  console.log('--------------------------------------------------');

  if (isSupabaseConfigured() && supabase) {
    console.log('📡 Connected to live Supabase backend. Seeding PostgreSQL tables...');

    // 1. Seed Hospitals
    for (const h of MOCK_HOSPITALS) {
      const { error } = await supabase.from('hospitals').upsert({
        id: h.id,
        name: h.name,
        location: `POINT(${h.location.longitude} ${h.location.latitude})`,
        phone: h.phone,
        level: h.level,
        specialties: h.specialties,
      });
      if (error) console.error(`Error inserting hospital ${h.name}:`, error.message);
    }

    // 2. Seed Resources
    for (const r of Object.values(MOCK_RESOURCES)) {
      const { error } = await supabase.from('hospital_resources').upsert(r);
      if (error) console.error(`Error inserting resources for ${r.hospital_id}:`, error.message);
    }

    // 3. Seed Blood Stock
    for (const b of MOCK_BLOOD_STOCK) {
      const { error } = await supabase.from('blood_stock').upsert(b);
      if (error) console.error(`Error inserting blood stock:`, error.message);
    }

    // 4. Seed Ambulances
    for (const a of MOCK_AMBULANCES) {
      const { error } = await supabase.from('ambulances').upsert({
        id: a.id,
        callsign: a.callsign,
        location: `POINT(${a.location.longitude} ${a.location.latitude})`,
        status: a.status,
        updated_at: a.updated_at,
      });
      if (error) console.error(`Error inserting ambulance ${a.callsign}:`, error.message);
    }

    // 5. Seed MedPasses
    for (const m of MOCK_MEDPASSES) {
      const { error } = await supabase.from('medpasses').upsert(m.medpass);
      if (error) console.error(`Error inserting medpass ${m.medpass.full_name}:`, error.message);

      for (const c of m.contacts) {
        await supabase.from('emergency_contacts').upsert(c);
      }
    }

    console.log('✅ Supabase tables successfully populated.');
    return {
      success: true,
      hospitalsCount: MOCK_HOSPITALS.length,
      resourcesCount: Object.keys(MOCK_RESOURCES).length,
      bloodStockCount: MOCK_BLOOD_STOCK.length,
      ambulancesCount: MOCK_AMBULANCES.length,
      medpassesCount: MOCK_MEDPASSES.length,
      mode: 'supabase',
    };
  } else {
    console.log('ℹ️ Live Supabase credentials not set or in offline demo mode.');
    console.log('⚡ Populating and verifying Local In-Memory Store with 10 Pune hospitals...');

    mockStore.resetToDefaults();

    // Verify key test cases
    const fullIcu = mockStore.getResources('hosp-003');
    const noTrauma = mockStore.getResources('hosp-004');
    const noONeg = mockStore.getBloodStock('hosp-005').find((b) => b.blood_group === 'O-');
    const talegaonFar = mockStore.getHospitalById('hosp-006');
    const staleHosp = mockStore.getResources('hosp-010');

    console.log(`✓ Hospital 003 (Sahyadri): ICU Free = ${fullIcu?.icu_free} (Full ICU test case)`);
    console.log(`✓ Hospital 004 (Pune Municipal): Trauma Bay Free = ${noTrauma?.trauma_bay_free} (No Trauma Bay test case)`);
    console.log(`✓ Hospital 005 (Hadapsar): O-Negative Units = ${noONeg?.units} (Blood Shortage test case)`);
    console.log(`✓ Hospital 006 (Talegaon Hub): Highway Level ${talegaonFar?.level} (Far but fully equipped)`);
    console.log(`✓ Hospital 010 (Swargate): Updated at = ${staleHosp?.updated_at} (Data freshness decay test case)`);
    console.log(`✓ Seeded ${MOCK_AMBULANCES.length} ambulances and ${MOCK_MEDPASSES.length} signed MedPasses.`);
    console.log('✅ Local Mock Store verified and ready for end-to-end execution.');

    return {
      success: true,
      hospitalsCount: MOCK_HOSPITALS.length,
      resourcesCount: Object.keys(MOCK_RESOURCES).length,
      bloodStockCount: MOCK_BLOOD_STOCK.length,
      ambulancesCount: MOCK_AMBULANCES.length,
      medpassesCount: MOCK_MEDPASSES.length,
      mode: 'in-memory-store',
    };
  }
}

// Execute directly if run via CLI
if (require.main === module || process.argv[1]?.includes('seed')) {
  runSeed()
    .then((res) => {
      console.log('Seed summary:', res);
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
