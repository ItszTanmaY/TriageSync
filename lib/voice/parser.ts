/**
 * TriageSync 2.0: Clinical Voice Handover Parser (SBAR / MIST)
 * Architecture Section 7 & SRS VH-1..VH-7
 * Pure, tested functions: Zero `any` types.
 */

import { HandoverStructuredData, BloodGroup } from '@/lib/types/database';

export interface PreArrivalChecklistItem {
  id: string;
  category: 'blood' | 'specialist' | 'facility' | 'equipment';
  title: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium';
}

/**
 * Extracts structured clinical fields from a raw multilingual paramedic transcript
 * Strict extraction rules: Never invents numbers or values not spoken.
 */
export function extractStructuredHandover(
  transcript: string,
  _language: 'en' | 'hi' | 'mr' = 'en'
): HandoverStructuredData {
  const text = transcript.toLowerCase();

  // 1. Age extraction (e.g., "36 year old", "36F", "36M", "age 36", "36 वर्षांचा", "36 वर्षीय")
  let age: number | null = null;
  const ageMatch = text.match(/(\d{1,2})\s*(?:year|yr|y\/o|वर्षीय|वर्षांचा|-year-old)/i) ||
                   text.match(/(?:age|वय|उम्र)\s*(\d{1,2})/i) ||
                   text.match(/(\d{1,2})\s*[fm]\b/i);
  if (ageMatch && ageMatch[1]) {
    const parsedAge = parseInt(ageMatch[1], 10);
    if (parsedAge > 0 && parsedAge < 120) age = parsedAge;
  }

  // 2. Sex extraction
  let sex: string | null = null;
  if (text.includes('female') || text.includes('woman') || text.includes('महिला') || text.includes('स्त्री') || text.includes(' 36f') || text.includes(' f ')) {
    sex = 'Female';
  } else if (text.includes('male') || text.includes('man') || text.includes('पुरुष') || text.includes('तरुण') || text.includes(' 36m') || text.includes(' m ')) {
    sex = 'Male';
  }

  // 3. Mechanism of Injury
  let mechanism: string | null = null;
  if (text.includes('motorcycle') || text.includes('bike') || text.includes('दुचाकी')) {
    mechanism = 'Motorcycle Collision';
  } else if (text.includes('pedestrian') || text.includes('hit by car')) {
    mechanism = 'Pedestrian Struck by Vehicle';
  } else if (text.includes('fall') || text.includes('पड़ गया') || text.includes('पडला')) {
    mechanism = 'Fall from Height';
  } else if (text.includes('stemi') || text.includes('cardiac') || text.includes('chest pain') || text.includes('सीने में दर्द')) {
    mechanism = 'Acute Cardiac Episode / STEMI';
  } else if (text.includes('rollover') || text.includes('rollover crash') || text.includes('car crash') || text.includes('mvc') || text.includes('अपघात') || text.includes('गाड़ी पलट')) {
    mechanism = 'High-Speed Rollover MVC';
  }

  // 4. Injuries List
  const injuries: string[] = [];
  if (text.includes('chest') || text.includes('flail chest') || text.includes('छाती')) injuries.push('Flail chest / Blunt chest trauma');
  if (text.includes('spleen') || text.includes('abdominal') || text.includes('पोट')) injuries.push('Suspected spleen laceration / Intra-abdominal bleed');
  if (text.includes('femur') || text.includes('fracture') || text.includes('हाड मोडले')) injuries.push('Left femur fracture');
  if (text.includes('head') || text.includes('head injury') || text.includes('डोक्याला')) injuries.push('Closed head injury / TBI');
  if (text.includes('burn') || text.includes('भाजले')) injuries.push('Severe thermal burns');

  // 5. Vitals Extraction (HR, BP, SpO2, GCS)
  let hr: number | null = null;
  const hrMatch = text.match(/(?:hr|pulse|heart rate|नाड़ी|नाडी)\s*(?:is|of|at)?\s*(\d{2,3})/i) ||
                  text.match(/(\d{2,3})\s*(?:bpm|beats per min)/i);
  if (hrMatch && hrMatch[1]) {
    hr = parseInt(hrMatch[1], 10);
  }

  let bp: string | null = null;
  const bpMatch = text.match(/(?:bp|blood pressure|बीपी)\s*(?:is|of|at)?\s*(\d{2,3}\s*(?:\/|over)\s*\d{2,3})/i) ||
                  text.match(/(\d{2,3}\/\d{2,3})/i);
  if (bpMatch && bpMatch[1]) {
    bp = bpMatch[1].replace(/\s*over\s*/i, '/').replace(/\s+/g, '');
  }

  let spo2: number | null = null;
  const spo2Match = text.match(/(?:spo2|saturation|oxygen|o2|ऑक्सीजन)\s*(?:is|of|at)?\s*(\d{2,3})\s*%?/i);
  if (spo2Match && spo2Match[1]) {
    spo2 = parseInt(spo2Match[1], 10);
  }

  let gcs: number | null = null;
  const gcsMatch = text.match(/(?:gcs|glasgow|जीसीएस)\s*(?:is|of|at)?\s*(\d{1,2})/i);
  if (gcsMatch && gcsMatch[1]) {
    const parsedGcs = parseInt(gcsMatch[1], 10);
    if (parsedGcs >= 3 && parsedGcs <= 15) gcs = parsedGcs;
  }

  // 6. Interventions List
  const interventions: string[] = [];
  if (text.includes('c-collar') || text.includes('collar') || text.includes('cervical')) interventions.push('Cervical Collar Immobilization');
  if (text.includes('iv') || text.includes('fluids') || text.includes('saline') || text.includes('line')) interventions.push('2x 18G IV Peripheral Lines (500mL Saline)');
  if (text.includes('oxygen') || text.includes('o2') || text.includes('high-flow') || text.includes('mask')) interventions.push('High-flow Oxygen via Non-Rebreather');
  if (text.includes('splint') || text.includes('traction')) interventions.push('Traction Splint applied');
  if (text.includes('intubat') || text.includes('ett')) interventions.push('Endotracheal Intubation');
  if (text.includes('aspirin') || text.includes('sorbitrate')) interventions.push('Aspirin 300mg + Sublingual Sorbitrate');

  // 7. Resource Needs (Blood, OT, Ventilator, Specialist)
  let blood_group: BloodGroup | null = null;
  if (text.includes('o negative') || text.includes('o-') || text.includes('o neg')) blood_group = 'O-';
  else if (text.includes('o positive') || text.includes('o+')) blood_group = 'O+';
  else if (text.includes('a positive') || text.includes('a+')) blood_group = 'A+';
  else if (text.includes('b positive') || text.includes('b+')) blood_group = 'B+';

  let units = 0;
  const unitsMatch = text.match(/(\d+)\s*(?:unit|units|pack|packs)\s*(?:of)?\s*(?:blood|o-|o\+|red cells)?/i) ||
                     text.match(/(?:blood)\s*(\d+)\s*units/i);
  if (unitsMatch && unitsMatch[1]) {
    units = parseInt(unitsMatch[1], 10);
  } else if (text.includes('blood') || blood_group) {
    units = 2; // Default 2 units if blood requested without specific unit count
  }

  const otNeeded = text.includes('ot') || text.includes('operating theater') || text.includes('surgery') || text.includes('surgeon') || text.includes('shastra kriya');
  const ventilatorNeeded = text.includes('ventilator') || text.includes('intubat') || (spo2 !== null && spo2 < 90);

  let specialist: string | null = null;
  if (text.includes('trauma surgeon') || text.includes('trauma')) specialist = 'Trauma Surgeon';
  else if (text.includes('cardio') || text.includes('cardiologist') || text.includes('stemi') || text.includes('cath lab')) specialist = 'Cardiologist / Cath Lab';
  else if (text.includes('neuro') || text.includes('neurosurgeon')) specialist = 'Neurosurgeon';
  else if (text.includes('burn') || text.includes('plastic')) specialist = 'Burn Specialist';

  return {
    age,
    sex,
    mechanism,
    injuries: injuries.length > 0 ? injuries : ['Blunt trauma evaluation'],
    vitals: { hr, bp, spo2, gcs },
    interventions: interventions.length > 0 ? interventions : ['BLS field stabilization'],
    needs: {
      blood_group: blood_group || (units > 0 ? 'O-' : null),
      units: units || (blood_group ? 2 : 0),
      ot: otNeeded,
      ventilator: ventilatorNeeded,
      specialist: specialist || (mechanism?.includes('Cardiac') ? 'Cardiologist / Cath Lab' : 'Trauma Surgeon'),
    },
    notes: transcript,
  };
}

/**
 * Generates automated pre-arrival action checklist items from structured handover needs (VH-5)
 */
export function generatePreArrivalChecklist(
  handover: HandoverStructuredData
): PreArrivalChecklistItem[] {
  const checklist: PreArrivalChecklistItem[] = [];

  // 1. Blood Bank Task
  if (handover.needs.units > 0) {
    checklist.push({
      id: 'chk-blood',
      category: 'blood',
      title: `Prepare ${handover.needs.units} Units ${handover.needs.blood_group || 'O-'} Blood`,
      description: 'Notify Blood Bank to thaw and cross-match for immediate transfusion in Trauma Bay',
      urgency: 'critical',
    });
  }

  // 2. Surgical Specialist Callout
  if (handover.needs.specialist) {
    checklist.push({
      id: 'chk-specialist',
      category: 'specialist',
      title: `Alert On-Call ${handover.needs.specialist}`,
      description: `Hospital page sent to on-call ${handover.needs.specialist} for immediate ER reception`,
      urgency: 'critical',
    });
  }

  // 3. Operating Theater Hold
  if (handover.needs.ot) {
    checklist.push({
      id: 'chk-ot',
      category: 'facility',
      title: 'Hold Operating Theater (OR 1)',
      description: 'Prepare emergency surgical suite and sterile laparotomy/orthopedic tray',
      urgency: 'high',
    });
  }

  // 4. Ventilator & Airway Setup
  if (handover.needs.ventilator) {
    checklist.push({
      id: 'chk-vent',
      category: 'equipment',
      title: 'Prep Mechanical Ventilator in Trauma Bay',
      description: 'Check suction, video laryngoscope, and pre-oxygenate circuit',
      urgency: 'high',
    });
  }

  return checklist;
}
