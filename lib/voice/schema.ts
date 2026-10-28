import { z } from 'zod';

export const HandoverSubmitSchema = z.object({
  incident_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  hospital_id: z.string().uuid().optional().nullable(),
  transcript: z.string().min(3, 'Transcript must contain clinical notes or speech'),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  audio_blob_base64: z.string().optional(),
});

export type HandoverSubmitInput = z.infer<typeof HandoverSubmitSchema>;

export const HandoverConfirmSchema = z.object({
  handover_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  hospital_id: z.string().uuid(),
  confirmed: z.boolean().default(true),
  structured: z.object({
    age: z.number().nullable().optional(),
    sex: z.string().nullable().optional(),
    mechanism: z.string().nullable().optional(),
    injuries: z.array(z.string()),
    vitals: z.object({
      hr: z.number().nullable().optional(),
      bp: z.string().nullable().optional(),
      spo2: z.number().nullable().optional(),
      gcs: z.number().nullable().optional(),
    }),
    interventions: z.array(z.string()),
    needs: z.object({
      blood_group: z.string().nullable().optional(),
      units: z.number().default(0),
      ot: z.boolean().default(false),
      ventilator: z.boolean().default(false),
      specialist: z.string().nullable().optional(),
    }),
    notes: z.string().nullable().optional(),
  }),
});

export type HandoverConfirmInput = z.infer<typeof HandoverConfirmSchema>;
