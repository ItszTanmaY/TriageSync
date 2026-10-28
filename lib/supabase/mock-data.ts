/**
 * TriageSync 2.0: High-fidelity Mock Seed Data for Pune Emergency Grid
 * Meets all requirements for Phase 0 (SIM-1) with differing capabilities.
 */

import {
  Hospital,
  HospitalResources,
  BloodStockItem,
  Ambulance,
  MedPass,
  EmergencyContact,
  BloodGroup,
} from '@/lib/types/database';
import { signCriticalPayload } from '@/lib/qr/signer';

export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-001',
    name: 'Ruby Apex Trauma Institute',
    location: { latitude: 18.5312, longitude: 73.8794 }, // Koregaon Park / Bund Garden
    phone: '+91 20 6645 5100',
    level: 1,
    specialties: ['trauma', 'cardiac', 'neuro', 'burns', 'icu', 'ct', 'ot'],
  },
  {
    id: 'hosp-002',
    name: 'Deccan Neuro & Multispeciality',
    location: { latitude: 18.5167, longitude: 73.8415 }, // Deccan Gymkhana
    phone: '+91 20 2567 8900',
    level: 1,
    specialties: ['neuro', 'stroke', 'cardiac', 'icu', 'ct', 'ot'],
  },
  {
    id: 'hosp-003',
    name: 'Sahyadri Metro Critical Care', // FULL ICU: icu_free = 0
    location: { latitude: 18.5089, longitude: 73.8197 }, // Kothrud
    phone: '+91 20 6721 3000',
    level: 2,
    specialties: ['trauma', 'er', 'ot', 'cardiac'],
  },
  {
    id: 'hosp-004',
    name: 'Pune Municipal General Hospital', // NO TRAUMA BAY: trauma_bay_free = 0
    location: { latitude: 18.5308, longitude: 73.8475 }, // Shivajinagar
    phone: '+91 20 2550 1000',
    level: 2,
    specialties: ['er', 'general', 'paediatric', 'obstetric'],
  },
  {
    id: 'hosp-005',
    name: 'Hadapsar LifeLine Center', // NO O-NEGATIVE BLOOD
    location: { latitude: 18.5034, longitude: 73.9268 }, // Hadapsar
    phone: '+91 20 2687 4000',
    level: 2,
    specialties: ['er', 'trauma', 'ot', 'icu'],
  },
  {
    id: 'hosp-006',
    name: 'Talegaon Expressway Trauma Hub', // FAR HIGHWAY (25km), BUT HIGHLY EQUIPPED
    location: { latitude: 18.7302, longitude: 73.6761 }, // Talegaon
    phone: '+91 2114 223 000',
    level: 1,
    specialties: ['trauma', 'icu', 'ot', 'ct', 'burns', 'blood'],
  },
  {
    id: 'hosp-007',
    name: 'Symbiosis University Hospital',
    location: { latitude: 18.5529, longitude: 73.7438 }, // Lavale / West Pune
    phone: '+91 20 6193 0000',
    level: 1,
    specialties: ['er', 'trauma', 'obstetric', 'paediatric', 'icu', 'ct'],
  },
  {
    id: 'hosp-008',
    name: 'Chinchwad Apex Emergency Care',
    location: { latitude: 18.6298, longitude: 73.7997 }, // Pimpri-Chinchwad
    phone: '+91 20 2744 5500',
    level: 2,
    specialties: ['er', 'burns', 'trauma', 'icu'],
  },
  {
    id: 'hosp-009',
    name: 'Kalyani Nagar Cardiac & Acute Center',
    location: { latitude: 18.5482, longitude: 73.9015 }, // Kalyani Nagar
    phone: '+91 20 4100 2000',
    level: 2,
    specialties: ['cardiac', 'cath_lab', 'icu', 'er'],
  },
  {
    id: 'hosp-010',
    name: 'Swargate City Emergency Hospital', // STALE DATA: updated 90 mins ago
    location: { latitude: 18.5018, longitude: 73.8586 }, // Swargate
    phone: '+91 20 2444 7000',
    level: 2,
    specialties: ['er', 'trauma', 'icu'],
  },
];

export const MOCK_RESOURCES: Record<string, HospitalResources> = {
  'hosp-001': {
    hospital_id: 'hosp-001',
    icu_total: 20,
    icu_free: 6,
    er_total: 25,
    er_free: 9,
    trauma_bay_free: 3,
    ventilators_free: 5,
    ot_available: true,
    cath_lab_available: true,
    ct_available: true,
    on_call: { trauma_surgeon: true, neurosurgeon: true, anesthesiologist: true },
    avg_er_service_min: 18,
    updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago (Fresh)
  },
  'hosp-002': {
    hospital_id: 'hosp-002',
    icu_total: 16,
    icu_free: 4,
    er_total: 20,
    er_free: 5,
    trauma_bay_free: 1,
    ventilators_free: 3,
    ot_available: true,
    cath_lab_available: true,
    ct_available: true,
    on_call: { neurosurgeon: true, cardiologist: true },
    avg_er_service_min: 22,
    updated_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  'hosp-003': { // Full ICU
    hospital_id: 'hosp-003',
    icu_total: 12,
    icu_free: 0, // FULL ICU
    er_total: 18,
    er_free: 4,
    trauma_bay_free: 2,
    ventilators_free: 0,
    ot_available: true,
    cath_lab_available: false,
    ct_available: true,
    on_call: { trauma_surgeon: true },
    avg_er_service_min: 25,
    updated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  'hosp-004': { // No Trauma Bay
    hospital_id: 'hosp-004',
    icu_total: 15,
    icu_free: 3,
    er_total: 30,
    er_free: 14,
    trauma_bay_free: 0, // NO TRAUMA BAY
    ventilators_free: 2,
    ot_available: true,
    cath_lab_available: false,
    ct_available: false,
    on_call: { obstetrician: true, pediatrician: true },
    avg_er_service_min: 20,
    updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  'hosp-005': { // Normal resources, but 0 O-negative
    hospital_id: 'hosp-005',
    icu_total: 10,
    icu_free: 3,
    er_total: 15,
    er_free: 6,
    trauma_bay_free: 2,
    ventilators_free: 2,
    ot_available: true,
    cath_lab_available: false,
    ct_available: true,
    on_call: { trauma_surgeon: true },
    avg_er_service_min: 19,
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  'hosp-006': { // Fully equipped highway hub
    hospital_id: 'hosp-006',
    icu_total: 30,
    icu_free: 14,
    er_total: 35,
    er_free: 18,
    trauma_bay_free: 5,
    ventilators_free: 10,
    ot_available: true,
    cath_lab_available: true,
    ct_available: true,
    on_call: { trauma_surgeon: true, neurosurgeon: true, burn_specialist: true },
    avg_er_service_min: 15,
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  'hosp-007': {
    hospital_id: 'hosp-007',
    icu_total: 18,
    icu_free: 5,
    er_total: 22,
    er_free: 8,
    trauma_bay_free: 2,
    ventilators_free: 4,
    ot_available: true,
    cath_lab_available: false,
    ct_available: true,
    on_call: { obstetrician: true, pediatrician: true, trauma_surgeon: true },
    avg_er_service_min: 20,
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  'hosp-008': {
    hospital_id: 'hosp-008',
    icu_total: 14,
    icu_free: 2,
    er_total: 16,
    er_free: 4,
    trauma_bay_free: 1,
    ventilators_free: 2,
    ot_available: true,
    cath_lab_available: false,
    ct_available: true,
    on_call: { burn_specialist: true },
    avg_er_service_min: 24,
    updated_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  'hosp-009': {
    hospital_id: 'hosp-009',
    icu_total: 12,
    icu_free: 4,
    er_total: 15,
    er_free: 6,
    trauma_bay_free: 1,
    ventilators_free: 3,
    ot_available: true,
    cath_lab_available: true,
    ct_available: true,
    on_call: { cardiologist: true },
    avg_er_service_min: 17,
    updated_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  'hosp-010': { // Stale Data: 95 mins ago
    hospital_id: 'hosp-010',
    icu_total: 10,
    icu_free: 2,
    er_total: 14,
    er_free: 3,
    trauma_bay_free: 1,
    ventilators_free: 1,
    ot_available: true,
    cath_lab_available: false,
    ct_available: false,
    on_call: {},
    avg_er_service_min: 30,
    updated_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(), // STALE
  },
};

const ALL_BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function generateMockBloodStock(): BloodStockItem[] {
  const stock: BloodStockItem[] = [];
  const now = new Date().toISOString();

  for (const hosp of MOCK_HOSPITALS) {
    for (const bg of ALL_BLOOD_GROUPS) {
      let units = Math.floor(Math.random() * 8) + 4; // 4-11 units

      // hosp-005 specifically has 0 units of O-negative
      if (hosp.id === 'hosp-005' && bg === 'O-') {
        units = 0;
      }
      // hosp-001 has abundant O-negative
      if (hosp.id === 'hosp-001' && bg === 'O-') {
        units = 14;
      }
      // hosp-006 (Talegaon) has high reserve
      if (hosp.id === 'hosp-006') {
        units = 18;
      }

      stock.push({
        hospital_id: hosp.id,
        blood_group: bg,
        units,
        updated_at: now,
      });
    }
  }

  return stock;
}

export const MOCK_BLOOD_STOCK: BloodStockItem[] = generateMockBloodStock();

export const MOCK_AMBULANCES: Ambulance[] = [
  { id: 'amb-101', callsign: 'Apex-101', location: { latitude: 18.528, longitude: 73.845 }, status: 'available', updated_at: new Date().toISOString() },
  { id: 'amb-102', callsign: 'Rapid-102', location: { latitude: 18.508, longitude: 73.818 }, status: 'available', updated_at: new Date().toISOString() },
  { id: 'amb-103', callsign: 'Delta-103', location: { latitude: 18.535, longitude: 73.882 }, status: 'available', updated_at: new Date().toISOString() },
  { id: 'amb-104', callsign: 'Life-104', location: { latitude: 18.505, longitude: 73.924 }, status: 'available', updated_at: new Date().toISOString() },
  { id: 'amb-105', callsign: 'Pulse-105', location: { latitude: 18.591, longitude: 73.738 }, status: 'available', updated_at: new Date().toISOString() }, // Hinjewadi
  { id: 'amb-106', callsign: 'Swarm-106', location: { latitude: 18.498, longitude: 73.859 }, status: 'available', updated_at: new Date().toISOString() }, // Swargate
  { id: 'amb-107', callsign: 'Shield-107', location: { latitude: 18.559, longitude: 73.782 }, status: 'available', updated_at: new Date().toISOString() }, // Baner
  { id: 'amb-108', callsign: 'North-108', location: { latitude: 18.625, longitude: 73.805 }, status: 'available', updated_at: new Date().toISOString() }, // Pimpri
  { id: 'amb-109', callsign: 'Aero-109', location: { latitude: 18.567, longitude: 73.914 }, status: 'available', updated_at: new Date().toISOString() }, // Viman Nagar
  { id: 'amb-110', callsign: 'South-110', location: { latitude: 18.455, longitude: 73.868 }, status: 'available', updated_at: new Date().toISOString() }, // Katraj
];

export interface SampleMedPassData {
  medpass: MedPass;
  contacts: EmergencyContact[];
  signedPayloadB64: string;
}

export function generateSampleMedPasses(): SampleMedPassData[] {
  const samples = [
    {
      id: 'mp-001',
      name: 'Asha Kulkarni',
      dob: '1988-06-14',
      sex: 'Female',
      bg: 'O-' as BloodGroup,
      al: ['Penicillin', 'Sulfa drugs'],
      cd: ['Type 2 Diabetes', 'Mild Asthma'],
      meds: ['Metformin 500mg', 'Albuterol inhaler PRN'],
      donor: true,
      token: 'tok_asha_k_9901',
      contacts: [
        { name: 'Dr. Ramesh Kulkarni', relation: 'Spouse', phone: '+91 98220 11223', priority: 1 },
        { name: 'Sunita Joshi', relation: 'Sister', phone: '+91 98220 33445', priority: 2 },
      ],
    },
    {
      id: 'mp-002',
      name: 'Rahul Sharma',
      dob: '1992-11-03',
      sex: 'Male',
      bg: 'A+' as BloodGroup,
      al: ['Aspirin', 'Ibuprofen'],
      cd: ['Hypertension'],
      meds: ['Amlodipine 5mg'],
      donor: true,
      token: 'tok_rahul_s_8820',
      contacts: [
        { name: 'Neha Sharma', relation: 'Spouse', phone: '+91 98900 44556', priority: 1 },
      ],
    },
    {
      id: 'mp-003',
      name: 'Pooja Patil',
      dob: '2001-04-22',
      sex: 'Female',
      bg: 'B+' as BloodGroup,
      al: ['Latex'],
      cd: [],
      meds: [],
      donor: false,
      token: 'tok_pooja_p_7731',
      contacts: [
        { name: 'Sanjay Patil', relation: 'Father', phone: '+91 97654 11223', priority: 1 },
        { name: 'Meena Patil', relation: 'Mother', phone: '+91 97654 33445', priority: 2 },
      ],
    },
    {
      id: 'mp-004',
      name: 'Vikram Deshmukh',
      dob: '1975-09-18',
      sex: 'Male',
      bg: 'AB-' as BloodGroup,
      al: ['Peanuts', 'Bee venom'],
      cd: ['Epilepsy'],
      meds: ['Levetiracetam 500mg'],
      donor: true,
      token: 'tok_vikram_d_6642',
      contacts: [
        { name: 'Anita Deshmukh', relation: 'Spouse', phone: '+91 98230 77889', priority: 1 },
      ],
    },
    {
      id: 'mp-005',
      name: 'Dr. Sneha Joshi',
      dob: '1995-02-10',
      sex: 'Female',
      bg: 'O+' as BloodGroup,
      al: [],
      cd: [],
      meds: [],
      donor: true,
      token: 'tok_sneha_j_5510',
      contacts: [
        { name: 'Deepak Joshi', relation: 'Brother', phone: '+91 98811 22334', priority: 1 },
      ],
    },
  ];

  return samples.map((s, idx) => {
    const compactPayload = {
      v: 1,
      n: s.name,
      bg: s.bg,
      al: s.al,
      cd: s.cd,
      ec: s.contacts[0].phone,
      t: s.token,
      ts: Math.floor(Date.now() / 1000),
    };

    const signed = signCriticalPayload(compactPayload);

    const medpass: MedPass = {
      id: s.id,
      owner_id: `user-mock-00${idx + 1}`,
      full_name: s.name,
      dob: s.dob,
      sex: s.sex,
      blood_group: s.bg,
      allergies: s.al,
      conditions: s.cd,
      medications: s.meds,
      organ_donor: s.donor,
      language: 'en',
      public_token: s.token,
      token_version: 1,
      critical_payload_signed: signed.signatureHex,
      full_tier_encrypted: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const contacts: EmergencyContact[] = s.contacts.map((c, cIdx) => ({
      id: `ec-${s.id}-${cIdx + 1}`,
      medpass_id: s.id,
      name: c.name,
      relation: c.relation,
      phone: c.phone,
      priority: c.priority,
    }));

    return {
      medpass,
      contacts,
      signedPayloadB64: signed.hashFragment,
    };
  });
}

export const MOCK_MEDPASSES: SampleMedPassData[] = generateSampleMedPasses();
