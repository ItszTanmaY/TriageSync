/**
 * TriageSync 2.0 + MedPass: Strict Database and Domain Type Definitions
 * Strict TypeScript: Zero `any` types.
 */

export type UserRole =
  | 'citizen'
  | 'paramedic'
  | 'hospital_staff'
  | 'blood_bank'
  | 'dispatcher'
  | 'admin';

export type TriageLevel = 'red' | 'yellow' | 'green' | 'black';

export type IncidentStatus =
  | 'created'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'handed_over'
  | 'closed';

export type IncidentType =
  | 'road_accident'
  | 'cardiac'
  | 'stroke'
  | 'burns'
  | 'obstetric'
  | 'paediatric'
  | 'other';

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  hospital_id: string | null;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  medpass_id: string;
  name: string;
  relation: string | null;
  phone: string;
  priority: number;
}

export interface MedPass {
  id: string;
  owner_id: string;
  full_name: string;
  dob: string | null;
  sex: string | null;
  blood_group: BloodGroup | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  organ_donor: boolean;
  language: string;
  public_token: string;
  token_version: number;
  critical_payload_signed: string | null;
  full_tier_encrypted: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Compact offline QR Payload (<300 bytes) signed with Ed25519
 * v: version
 * n: full name
 * bg: blood group
 * al: allergies array
 * cd: conditions array
 * ec: emergency contact phone
 * t: rotatable public token
 * ts: unix timestamp (seconds)
 */
export interface CriticalMedPassPayload {
  v: number;
  n: string;
  bg: BloodGroup | null;
  al: string[];
  cd: string[];
  ec: string;
  t: string;
  ts: number;
}

export interface MedPassScan {
  id: string;
  medpass_id: string;
  scanned_at: string;
  location: GeoLocation | null;
  scanner_role: string;
  tier_accessed: 'critical' | 'full';
  client_id: string | null;
}

export interface Hospital {
  id: string;
  name: string;
  location: GeoLocation;
  phone: string | null;
  level: number;
  specialties: string[];
}

export interface HospitalOnCall {
  trauma_surgeon?: boolean;
  cardiologist?: boolean;
  neurosurgeon?: boolean;
  burn_specialist?: boolean;
  obstetrician?: boolean;
  pediatrician?: boolean;
  anesthesiologist?: boolean;
}

export interface HospitalResources {
  hospital_id: string;
  icu_total: number;
  icu_free: number;
  er_total: number;
  er_free: number;
  trauma_bay_free: number;
  ventilators_free: number;
  ot_available: boolean;
  cath_lab_available: boolean;
  ct_available: boolean;
  on_call: HospitalOnCall;
  avg_er_service_min: number;
  updated_at: string;
}

export interface BloodStockItem {
  hospital_id: string;
  blood_group: BloodGroup;
  units: number;
  updated_at: string;
}

export interface Ambulance {
  id: string;
  callsign: string;
  location: GeoLocation;
  status: 'available' | 'assigned' | 'en_route' | 'offline';
  updated_at: string;
}

export interface Incident {
  id: string;
  created_by: string | null;
  type: IncidentType;
  status: IncidentStatus;
  location: GeoLocation;
  patient_count: number;
  ambulance_id: string | null;
  created_at: string;
  closed_at: string | null;
  client_uuid: string | null;
}

export interface Patient {
  id: string;
  incident_id: string;
  medpass_id: string | null;
  triage: TriageLevel;
  est_age: number | null;
  sex: string | null;
  destination_hospital_id: string | null;
  reserved_until: string | null;
  eta_min: number | null;
}

export interface ScoreFactors {
  eta_minutes: number;
  eta_score: number;
  capability_score: number;
  bed_score: number;
  blood_score: number;
  queue_score: number;
  freshness_score: number;
  satisfied_must: string[];
  failed_must: string[];
  satisfied_should: string[];
  missing_should: string[];
  blood_matched_units: number;
  projected_er_load: number;
  age_minutes: number;
}

export interface HospitalRankItem {
  hospital_id: string;
  hospital_name: string;
  total_score: number;
  is_excluded: boolean;
  excluded_reason: string | null;
  eta_minutes: number;
  factors: ScoreFactors;
}

export interface RecommendationRecord {
  id: string;
  patient_id: string;
  ranking: HospitalRankItem[];
  chosen_hospital_id: string | null;
  override_reason: string | null;
  created_at: string;
}

export interface HandoverStructuredData {
  age: number | null;
  sex: string | null;
  mechanism: string | null;
  injuries: string[];
  vitals: {
    hr: number | null;
    bp: string | null;
    spo2: number | null;
    gcs: number | null;
  };
  interventions: string[];
  needs: {
    blood_group: BloodGroup | null;
    units: number;
    ot: boolean;
    ventilator: boolean;
    specialist: string | null;
  };
  notes: string | null;
}

export interface HandoverRecord {
  id: string;
  patient_id: string;
  transcript: string | null;
  structured: HandoverStructuredData | null;
  needs: HandoverStructuredData['needs'] | null;
  confirmed: boolean;
  created_at: string;
}

export interface DiversionRecord {
  id: string;
  incident_id: string;
  from_hospital: string;
  to_hospital: string;
  reason: string;
  numbers: {
    projected_load: number;
    wait_min: number;
    inbound_count: number;
    er_free: number;
    er_total: number;
  };
  at: string;
}

export interface OutboxEvent {
  id: string;
  type: 'create_incident' | 'medpass_alert' | 'handover' | 'update_resources' | 'select_hospital';
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'in_flight' | 'synced' | 'failed';
  lastError?: string;
}
