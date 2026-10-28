/**
 * TriageSync 2.0: Supabase Client and Local Mock Store Interface
 * Respects RLS and never exposes the service-role key to client code.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  MOCK_HOSPITALS,
  MOCK_RESOURCES,
  MOCK_BLOOD_STOCK,
  MOCK_AMBULANCES,
  MOCK_MEDPASSES,
} from '@/lib/supabase/mock-data';
import {
  Hospital,
  HospitalResources,
  BloodStockItem,
  Ambulance,
  Incident,
  Patient,
  HandoverRecord,
  RecommendationRecord,
  DiversionRecord,
  MedPassScan,
} from '@/lib/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Universal Mock In-Memory Store for zero-config offline/demo execution.
 * Allows all 9 roadmap phases to run 100% reliably in hackathon environments.
 */
class LocalMockStore {
  private hospitals: Map<string, Hospital> = new Map();
  private resources: Map<string, HospitalResources> = new Map();
  private bloodStock: BloodStockItem[] = [];
  private ambulances: Map<string, Ambulance> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private patients: Map<string, Patient> = new Map();
  private handovers: Map<string, HandoverRecord> = new Map();
  private recommendations: Map<string, RecommendationRecord> = new Map();
  private diversions: DiversionRecord[] = [];
  private scans: MedPassScan[] = [];

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.hospitals.clear();
    MOCK_HOSPITALS.forEach((h) => this.hospitals.set(h.id, { ...h }));

    this.resources.clear();
    Object.values(MOCK_RESOURCES).forEach((r) => this.resources.set(r.hospital_id, { ...r }));

    this.bloodStock = [...MOCK_BLOOD_STOCK];

    this.ambulances.clear();
    MOCK_AMBULANCES.forEach((a) => this.ambulances.set(a.id, { ...a }));

    this.incidents.clear();
    this.patients.clear();
    this.handovers.clear();
    this.recommendations.clear();
    this.diversions = [];
    this.scans = [];
  }

  public getHospitals(): Hospital[] {
    return Array.from(this.hospitals.values());
  }

  public getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.get(id);
  }

  public getResources(hospitalId: string): HospitalResources | undefined {
    return this.resources.get(hospitalId);
  }

  public getAllResources(): HospitalResources[] {
    return Array.from(this.resources.values());
  }

  public updateResources(hospitalId: string, partial: Partial<HospitalResources>): HospitalResources {
    const existing = this.resources.get(hospitalId);
    if (!existing) {
      throw new Error(`Hospital ${hospitalId} resources not found`);
    }
    const updated: HospitalResources = {
      ...existing,
      ...partial,
      hospital_id: hospitalId,
      updated_at: new Date().toISOString(),
    };
    this.resources.set(hospitalId, updated);
    return updated;
  }

  public getBloodStock(hospitalId: string): BloodStockItem[] {
    return this.bloodStock.filter((b) => b.hospital_id === hospitalId);
  }

  public updateBloodStock(hospitalId: string, bloodGroup: string, units: number): BloodStockItem {
    const existingIdx = this.bloodStock.findIndex(
      (b) => b.hospital_id === hospitalId && b.blood_group === bloodGroup
    );
    const updated: BloodStockItem = {
      hospital_id: hospitalId,
      blood_group: bloodGroup as BloodStockItem['blood_group'],
      units,
      updated_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.bloodStock[existingIdx] = updated;
    } else {
      this.bloodStock.push(updated);
    }
    return updated;
  }

  public getAmbulances(): Ambulance[] {
    return Array.from(this.ambulances.values());
  }

  public updateAmbulance(id: string, partial: Partial<Ambulance>): Ambulance {
    const amb = this.ambulances.get(id);
    if (!amb) {
      throw new Error(`Ambulance ${id} not found`);
    }
    const updated: Ambulance = {
      ...amb,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    this.ambulances.set(id, updated);
    return updated;
  }

  public createIncident(incident: Incident): Incident {
    this.incidents.set(incident.id, incident);
    return incident;
  }

  public getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  public getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  public updateIncident(id: string, partial: Partial<Incident>): Incident {
    const inc = this.incidents.get(id);
    if (!inc) {
      throw new Error(`Incident ${id} not found`);
    }
    const updated: Incident = { ...inc, ...partial };
    this.incidents.set(id, updated);
    return updated;
  }

  public createPatient(patient: Patient): Patient {
    this.patients.set(patient.id, patient);
    return patient;
  }

  public getPatient(id: string): Patient | undefined {
    return this.patients.get(id);
  }

  public getPatientsByHospital(hospitalId: string): Patient[] {
    return Array.from(this.patients.values()).filter(
      (p) => p.destination_hospital_id === hospitalId
    );
  }

  public saveRecommendation(record: RecommendationRecord): RecommendationRecord {
    this.recommendations.set(record.id, record);
    return record;
  }

  public getRecommendation(patientId: string): RecommendationRecord | undefined {
    return Array.from(this.recommendations.values()).find((r) => r.patient_id === patientId);
  }

  public saveHandover(handover: HandoverRecord): HandoverRecord {
    this.handovers.set(handover.id, handover);
    return handover;
  }

  public getHandover(patientId: string): HandoverRecord | undefined {
    return Array.from(this.handovers.values()).find((h) => h.patient_id === patientId);
  }

  public getHandoversByHospital(hospitalId: string): HandoverRecord[] {
    const hospitalPatients = this.getPatientsByHospital(hospitalId).map((p) => p.id);
    return Array.from(this.handovers.values()).filter((h) =>
      hospitalPatients.includes(h.patient_id)
    );
  }

  public logDiversion(record: DiversionRecord): void {
    this.diversions.push(record);
  }

  public getDiversions(): DiversionRecord[] {
    return [...this.diversions];
  }

  public logMedPassScan(scan: MedPassScan): void {
    this.scans.push(scan);
  }

  public getMedPassScans(): MedPassScan[] {
    return [...this.scans];
  }

  public getMedPassByToken(token: string) {
    return MOCK_MEDPASSES.find((m) => m.medpass.public_token === token);
  }
}

// Global singleton instance
export const mockStore = new LocalMockStore();
