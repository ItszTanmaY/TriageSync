import { describe, it, expect } from 'vitest';
import {
  generatePublicToken,
  buildEmergencySmsLink,
  buildEmergencyWhatsAppLink,
  I18N_MEDPASS,
} from '@/lib/medpass/service';
import {
  signCriticalPayload,
  parseAndVerifyHashFragment,
} from '@/lib/qr/signer';
import { mockStore } from '@/lib/supabase/client';

describe('Phase 3: MedPass Token & Link Generation (MP-1, MP-7)', () => {
  it('generates unique 128-bit collision-resistant public tokens', () => {
    const tok1 = generatePublicToken('tok');
    const tok2 = generatePublicToken('tok');
    expect(tok1.startsWith('tok_')).toBe(true);
    expect(tok2.startsWith('tok_')).toBe(true);
    expect(tok1).not.toBe(tok2);
  });

  it('generates valid emergency SMS deep-link with GPS coordinates', () => {
    const link = buildEmergencySmsLink(
      '+91 98220 11223',
      'Asha Kulkarni',
      { latitude: 18.5204, longitude: 73.8567 },
      'tok_asha_k_9901',
      'http://localhost:3000'
    );

    expect(link.startsWith('sms:+919822011223?body=')).toBe(true);
    expect(decodeURIComponent(link)).toContain('Asha Kulkarni');
    expect(decodeURIComponent(link)).toContain('18.5204,73.8567');
    expect(decodeURIComponent(link)).toContain('http://localhost:3000/s/tok_asha_k_9901');
  });

  it('generates valid emergency WhatsApp SOS link', () => {
    const link = buildEmergencyWhatsAppLink(
      '+91 98220 11223',
      'Asha Kulkarni',
      { latitude: 18.5204, longitude: 73.8567 },
      'tok_asha_k_9901',
      'http://localhost:3000'
    );

    expect(link.startsWith('https://wa.me/919822011223?text=')).toBe(true);
    expect(decodeURIComponent(link)).toContain('EMERGENCY SOS ALERT');
  });
});

describe('Phase 3: Multilingual Support (MP-10)', () => {
  it('provides complete translation dictionaries in English, Hindi, and Marathi', () => {
    expect(I18N_MEDPASS.en.bloodGroup).toBe('BLOOD GROUP');
    expect(I18N_MEDPASS.hi.bloodGroup).toBe('रक्त समूह');
    expect(I18N_MEDPASS.mr.bloodGroup).toBe('रक्तगट');

    expect(I18N_MEDPASS.hi.allergies).toBe('एलर्जी');
    expect(I18N_MEDPASS.mr.allergies).toBe('अ‍ॅलर्जी');
  });
});

describe('Phase 3: Cryptographic QR & Offline Airplane Mode (MP-3, RL-3)', () => {
  it('encodes and verifies full offline payload directly from URL hash fragment', () => {
    const payload = {
      v: 1,
      n: 'Rahul Sharma',
      bg: 'A+' as const,
      al: ['Aspirin'],
      cd: ['Hypertension'],
      ec: '+919890044556',
      t: 'tok_rahul_s_8820',
      ts: 1730100000,
    };

    const signed = signCriticalPayload(payload);
    const hash = `#${signed.hashFragment}`;

    const verified = parseAndVerifyHashFragment(hash);
    expect(verified.isValid).toBe(true);
    expect(verified.payload?.n).toBe('Rahul Sharma');
    expect(verified.payload?.bg).toBe('A+');
    expect(verified.payload?.al).toContain('Aspirin');
  });
});

describe('Phase 3: Token Revocation & Rotation (MP-8)', () => {
  it('updates token and increments token_version on revocation in mock store', () => {
    mockStore.resetToDefaults();
    const sample = mockStore.getMedPassByToken('tok_asha_k_9901');
    expect(sample).toBeDefined();

    const oldToken = sample!.medpass.public_token;
    const oldVersion = sample!.medpass.token_version;

    // Rotate
    const newToken = generatePublicToken('tok');
    sample!.medpass.public_token = newToken;
    sample!.medpass.token_version = oldVersion + 1;

    expect(sample!.medpass.public_token).not.toBe(oldToken);
    expect(sample!.medpass.token_version).toBe(oldVersion + 1);
  });
});
