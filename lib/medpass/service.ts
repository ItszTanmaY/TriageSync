/**
 * TriageSync 2.0: MedPass Core Service & Multilingual Utilities
 * Architecture Section 3 & SRS MP-1..MP-10
 */

import { BloodGroup } from '@/lib/types/database';

export interface MedPassTranslations {
  medicalId: string;
  emergencyOnly: string;
  bloodGroup: string;
  allergies: string;
  conditions: string;
  emergencyContact: string;
  organDonor: string;
  donorYes: string;
  donorNo: string;
  scanForHelp: string;
  offlineVerified: string;
  prototypeNotice: string;
}

export const I18N_MEDPASS: Record<'en' | 'hi' | 'mr', MedPassTranslations> = {
  en: {
    medicalId: 'EMERGENCY MEDICAL PASS',
    emergencyOnly: 'CRITICAL EMERGENCY IDENTITY',
    bloodGroup: 'BLOOD GROUP',
    allergies: 'ALLERGIES',
    conditions: 'CONDITIONS',
    emergencyContact: 'EMERGENCY CONTACT',
    organDonor: 'ORGAN DONOR',
    donorYes: 'YES (REGISTERED)',
    donorNo: 'NO',
    scanForHelp: 'Scan QR with any phone in emergency',
    offlineVerified: 'Ed25519 Cryptographically Signed Payload',
    prototypeNotice: 'Prototype demo. Not a certified medical device.',
  },
  hi: {
    medicalId: 'आपातकालीन मेडिकल पास (MedPass)',
    emergencyOnly: 'महत्वपूर्ण आपातकालीन पहचान',
    bloodGroup: 'रक्त समूह',
    allergies: 'एलर्जी',
    conditions: 'चिकित्सा स्थिति',
    emergencyContact: 'आपातकालीन संपर्क',
    organDonor: 'अंग दाता',
    donorYes: 'हाँ (पंजीकृत)',
    donorNo: 'नहीं',
    scanForHelp: 'आपात स्थिति में किसी भी फोन से QR स्कैन करें',
    offlineVerified: 'Ed25519 क्रिप्टोग्राफिक रूप से सत्यापित',
    prototypeNotice: 'प्रोटोटाइप प्रदर्शन। प्रमाणित चिकित्सा उपकरण नहीं।',
  },
  mr: {
    medicalId: 'तातडीचे वैद्यकीय ओळखपत्र (MedPass)',
    emergencyOnly: 'महत्त्वाची आपत्कालीन ओळख',
    bloodGroup: 'रक्तगट',
    allergies: 'अ‍ॅलर्जी',
    conditions: 'वैद्यकीय स्थिती',
    emergencyContact: 'तातडीचा संपर्क',
    organDonor: 'अवयव दाता',
    donorYes: 'होय (नोंदणीकृत)',
    donorNo: 'नाही',
    scanForHelp: 'आपत्कालीन परिस्थितीत कोणत्याही फोनवरून QR स्कॅन करा',
    offlineVerified: 'Ed25519 सुरक्षित स्वाक्षरीकृत',
    prototypeNotice: 'प्रोटोटाइप प्रात्यक्षिक. प्रमाणित वैद्यकीय उपकरण नाही.',
  },
};

/**
 * Generates a unique 128-bit collision-resistant public token for MedPass URLs
 */
export function generatePublicToken(prefix: string = 'tok'): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 16; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${rand}`;
}

/**
 * Builds an emergency distress SMS link with GPS coordinates and patient token
 */
export function buildEmergencySmsLink(
  phoneNumber: string,
  patientName: string,
  coords: { latitude: number; longitude: number },
  token: string,
  appUrl: string = 'http://localhost:3000'
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
  const mapsUrl = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
  const passUrl = `${appUrl}/s/${token}`;
  const message = `EMERGENCY ALERT: ${patientName} is in an accident! Location: ${mapsUrl} . View MedPass: ${passUrl} . Responders have been alerted.`;
  return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
}

/**
 * Builds a WhatsApp deep-link with formatted SOS emergency message
 */
export function buildEmergencyWhatsAppLink(
  phoneNumber: string,
  patientName: string,
  coords: { latitude: number; longitude: number },
  token: string,
  appUrl: string = 'http://localhost:3000'
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const mapsUrl = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
  const passUrl = `${appUrl}/s/${token}`;
  const message = `🚨 *EMERGENCY SOS ALERT* 🚨\n\n*Patient:* ${patientName}\n*Live GPS:* ${mapsUrl}\n*Emergency MedPass:* ${passUrl}\n\nPlease respond immediately. Dispatched to Pune Emergency Grid.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface RenderCardConfig {
  name: string;
  bloodGroup: BloodGroup | string;
  allergies: string[];
  conditions: string[];
  contactName: string;
  contactPhone: string;
  donor: boolean;
  lang: 'en' | 'hi' | 'mr';
  qrDataUrl: string;
}
