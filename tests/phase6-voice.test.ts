import { describe, it, expect } from 'vitest';
import { extractStructuredHandover, generatePreArrivalChecklist } from '@/lib/voice/parser';
import { HandoverSubmitSchema, HandoverConfirmSchema } from '@/lib/voice/schema';

describe('Phase 6: Voice Handover Engine (VH-1..VH-7)', () => {
  const englishMvcTranscript =
    '36 year old male involved in high-speed rollover crash on Pune expressway. Flail chest, suspected spleen laceration, left femur fracture. Heart rate is 128, BP 85/50, SpO2 88 percent, GCS 11. C-collar applied, two large bore IV lines with saline, high-flow oxygen mask. Need 2 units O negative blood, trauma surgeon ready, emergency OT held on arrival.';

  const hindiStemiTranscript =
    '54 वर्षीय पुरुष, सीने में तेज दर्द और पसीना. Acute STEMI, pulse 110, BP 90/60, oxygen 92%. Aspirin and Sorbitrate given. ETA 12 minutes. Cath lab and cardiologist alert required.';

  const marathiNeuroTranscript =
    '28 वर्षांचा तरुण, दुचाकी अपघात. डोक्याला गंभीर दुखापत आणि हाड मोडले. जीसीएस 9, pulse 120, BP 100/70. Oxygen mask attached. Neurosurgeon and ventilator preparation needed. 2 units blood ready.';

  describe('Clinical SBAR / MIST Extraction', () => {
    it('correctly extracts trauma demographics, vitals, injuries and needs from English transcript (VH-3)', () => {
      const result = extractStructuredHandover(englishMvcTranscript, 'en');

      expect(result.age).toBe(36);
      expect(result.sex).toBe('Male');
      expect(result.mechanism).toContain('Rollover');
      expect(result.vitals.hr).toBe(128);
      expect(result.vitals.bp).toBe('85/50');
      expect(result.vitals.spo2).toBe(88);
      expect(result.vitals.gcs).toBe(11);
      expect(result.injuries.some((i) => i.toLowerCase().includes('chest'))).toBe(true);
      expect(result.injuries.some((i) => i.toLowerCase().includes('femur'))).toBe(true);
      expect(result.interventions.some((i) => i.toLowerCase().includes('collar'))).toBe(true);
      expect(result.interventions.some((i) => i.toLowerCase().includes('iv'))).toBe(true);
      expect(result.needs.blood_group).toBe('O-');
      expect(result.needs.units).toBe(2);
      expect(result.needs.ot).toBe(true);
      expect(result.needs.ventilator).toBe(true);
      expect(result.needs.specialist).toBe('Trauma Surgeon');
    });

    it('correctly extracts Hindi cardiac handover (VH-2, VH-3)', () => {
      const result = extractStructuredHandover(hindiStemiTranscript, 'hi');

      expect(result.age).toBe(54);
      expect(result.sex).toBe('Male');
      expect(result.vitals.hr).toBe(110);
      expect(result.vitals.bp).toBe('90/60');
      expect(result.vitals.spo2).toBe(92);
      expect(result.interventions.some((i) => i.toLowerCase().includes('aspirin'))).toBe(true);
      expect(result.needs.specialist).toContain('Cardiologist');
    });

    it('correctly extracts Marathi neuro trauma handover (VH-2, VH-3)', () => {
      const result = extractStructuredHandover(marathiNeuroTranscript, 'mr');

      expect(result.age).toBe(28);
      expect(result.sex).toBe('Male');
      expect(result.mechanism).toContain('Motorcycle');
      expect(result.vitals.gcs).toBe(9);
      expect(result.vitals.hr).toBe(120);
      expect(result.vitals.bp).toBe('100/70');
      expect(result.needs.ventilator).toBe(true);
      expect(result.needs.specialist).toBe('Neurosurgeon');
    });

    it('strict clinical rule: never invents values that were not in the transcript', () => {
      const sparseTranscript = 'Patient picked up from roadside, breathing heavily.';
      const result = extractStructuredHandover(sparseTranscript, 'en');

      expect(result.age).toBeNull();
      expect(result.sex).toBeNull();
      expect(result.vitals.hr).toBeNull();
      expect(result.vitals.bp).toBeNull();
      expect(result.vitals.spo2).toBeNull();
      expect(result.vitals.gcs).toBeNull();
    });
  });

  describe('Pre-Arrival Preparation Checklist (VH-5)', () => {
    it('generates targeted ER checklist items based on extracted needs', () => {
      const handover = extractStructuredHandover(englishMvcTranscript, 'en');
      const checklist = generatePreArrivalChecklist(handover);

      expect(checklist.length).toBeGreaterThanOrEqual(3);

      const bloodTask = checklist.find((c) => c.category === 'blood');
      expect(bloodTask).toBeDefined();
      expect(bloodTask?.title).toContain('2 Units O- Blood');
      expect(bloodTask?.urgency).toBe('critical');

      const surgeonTask = checklist.find((c) => c.category === 'specialist');
      expect(surgeonTask).toBeDefined();
      expect(surgeonTask?.title).toContain('Trauma Surgeon');

      const otTask = checklist.find((c) => c.category === 'facility');
      expect(otTask).toBeDefined();
      expect(otTask?.title).toContain('Operating Theater');

      const ventTask = checklist.find((c) => c.category === 'equipment');
      expect(ventTask).toBeDefined();
      expect(ventTask?.title).toContain('Ventilator');
    });
  });

  describe('Zod Validation at Boundaries (VH-6)', () => {
    it('validates submission schema correctly', () => {
      const valid = {
        incident_id: '11111111-1111-1111-1111-111111111111',
        patient_id: '22222222-2222-2222-2222-222222222222',
        transcript: 'Patient with chest injury, HR 110',
        language: 'en',
      };
      const parsed = HandoverSubmitSchema.safeParse(valid);
      expect(parsed.success).toBe(true);

      const invalid = {
        incident_id: 'not-a-uuid',
        patient_id: 'not-a-uuid',
        transcript: '',
      };
      const failParsed = HandoverSubmitSchema.safeParse(invalid);
      expect(failParsed.success).toBe(false);
    });

    it('validates confirmation schema correctly', () => {
      const validConfirm = {
        handover_id: '33333333-3333-3333-3333-333333333333',
        patient_id: '22222222-2222-2222-2222-222222222222',
        hospital_id: '44444444-4444-4444-4444-444444444444',
        confirmed: true,
        structured: {
          age: 36,
          sex: 'Male',
          mechanism: 'MVC',
          injuries: ['Flail chest'],
          vitals: { hr: 120, bp: '90/60', spo2: 90, gcs: 11 },
          interventions: ['IV Fluids'],
          needs: { blood_group: 'O-', units: 2, ot: true, ventilator: true, specialist: 'Trauma Surgeon' },
          notes: 'Test note',
        },
      };
      const parsed = HandoverConfirmSchema.safeParse(validConfirm);
      expect(parsed.success).toBe(true);
    });
  });
});
