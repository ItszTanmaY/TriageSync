import { z } from 'zod';

export const BloodGroupSchema = z.enum([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
]);

export const TriageLevelSchema = z.enum(['red', 'yellow', 'green', 'black']);

export const IncidentTypeSchema = z.enum([
  'road_accident',
  'cardiac',
  'stroke',
  'burns',
  'obstetric',
  'paediatric',
  'other',
]);

export const IncidentStatusSchema = z.enum([
  'created',
  'assigned',
  'en_route',
  'arrived',
  'handed_over',
  'closed',
]);

export const UserRoleSchema = z.enum([
  'citizen',
  'paramedic',
  'hospital_staff',
  'blood_bank',
  'dispatcher',
  'admin',
]);

export const GeoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const EmergencyContactInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  relation: z.string().max(50).nullable().optional(),
  phone: z
    .string()
    .min(10, 'Valid phone number required')
    .max(16)
    .regex(/^\+?[0-9\s-]+$/, 'Invalid phone number format'),
  priority: z.number().int().min(1).max(3).default(1),
});

export const MedPassFormSchema = z.object({
  full_name: z.string().min(2, 'Full name is required').max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD date required').nullable().optional(),
  sex: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).nullable().optional(),
  blood_group: BloodGroupSchema.nullable().optional(),
  allergies: z.array(z.string().min(1).max(50)).default([]),
  conditions: z.array(z.string().min(1).max(50)).default([]),
  medications: z.array(z.string().min(1).max(50)).default([]),
  organ_donor: z.boolean().default(false),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  contacts: z.array(EmergencyContactInputSchema).min(1, 'At least 1 emergency contact is required').max(3),
});

export const CriticalPayloadSchema = z.object({
  v: z.number().int().positive(),
  n: z.string().min(1).max(120),
  bg: BloodGroupSchema.nullable(),
  al: z.array(z.string()),
  cd: z.array(z.string()),
  ec: z.string().min(5),
  t: z.string().min(8),
  ts: z.number().int().positive(),
});

export const IncidentCreateSchema = z.object({
  type: IncidentTypeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  patient_count: z.number().int().min(1).max(50).default(1),
  ambulance_id: z.string().uuid().nullable().optional(),
  client_uuid: z.string().uuid(),
  initial_triage: TriageLevelSchema.default('red'),
  medpass_token: z.string().optional(),
});

export const HospitalResourcesUpdateSchema = z.object({
  hospital_id: z.string().uuid(),
  icu_free: z.number().int().min(0),
  icu_total: z.number().int().min(0).optional(),
  er_free: z.number().int().min(0),
  er_total: z.number().int().min(0).optional(),
  trauma_bay_free: z.number().int().min(0),
  ventilators_free: z.number().int().min(0),
  ot_available: z.boolean(),
  cath_lab_available: z.boolean(),
  ct_available: z.boolean(),
  on_call: z.record(z.string(), z.boolean()).default({}),
});

export const BloodStockUpdateSchema = z.object({
  hospital_id: z.string().uuid(),
  blood_group: BloodGroupSchema,
  units: z.number().int().min(0),
});

export const HospitalSelectionSchema = z.object({
  patient_id: z.string().uuid(),
  hospital_id: z.string().uuid(),
  override_reason: z.string().max(255).optional(),
});

export const HandoverSubmissionSchema = z.object({
  patient_id: z.string().uuid(),
  transcript: z.string().min(3),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
});

export const StructuredHandoverSchema = z.object({
  age: z.number().int().nullable().default(null),
  sex: z.string().nullable().default(null),
  mechanism: z.string().nullable().default(null),
  injuries: z.array(z.string()).default([]),
  vitals: z.object({
    hr: z.number().int().nullable().default(null),
    bp: z.string().nullable().default(null),
    spo2: z.number().int().nullable().default(null),
    gcs: z.number().int().nullable().default(null),
  }),
  interventions: z.array(z.string()).default([]),
  needs: z.object({
    blood_group: BloodGroupSchema.nullable().default(null),
    units: z.number().int().default(0),
    ot: z.boolean().default(false),
    ventilator: z.boolean().default(false),
    specialist: z.string().nullable().default(null),
  }),
  notes: z.string().nullable().default(null),
});

export const OutboxEventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'create_incident',
    'medpass_alert',
    'handover',
    'update_resources',
    'select_hospital',
  ]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.number().int().positive(),
  attempts: z.number().int().min(0).default(0),
  status: z.enum(['pending', 'in_flight', 'synced', 'failed']).default('pending'),
  lastError: z.string().optional(),
});
