/**
 * TriageSync 2.0 System Configuration
 * Per AGENTS.md: Constants for weights and thresholds live in /lib/config.ts
 */

export const PUNE_CENTER = {
  latitude: 18.5204,
  longitude: 73.8567,
} as const;

export const MATCHING_WEIGHTS = {
  ETA: 0.30,
  CAPABILITY: 0.25,
  BED: 0.15,
  BLOOD: 0.15,
  QUEUE: 0.10,
  FRESHNESS: 0.05,
} as const;

export const MATCHING_CONFIG = {
  MAX_ETA_MINUTES: 60,
  FRESHNESS_HALF_LIFE_MINUTES: 30,
  DEFAULT_TRANSIT_SPEED_KMH: 40,
  BED_RESERVATION_DURATION_MINUTES: 15,
  MAX_RECOMMENDATIONS_RETURNED: 3,
} as const;

export const QUEUE_PREDICT_THRESHOLDS = {
  DIVERT_PROJECTED_LOAD: 0.85,
  DIVERT_WAIT_MINUTES: 15,
  DEFAULT_AVG_ER_SERVICE_MIN: 20,
} as const;

/**
 * Capability requirements per incident type from ARCHITECTURE.md section 5.1
 */
export const INCIDENT_REQUIREMENTS = {
  road_accident: {
    must: ['er', 'trauma_bay'] as const,
    should: ['ot', 'blood', 'icu', 'ct'] as const,
  },
  cardiac: {
    must: ['er', 'cath_lab'] as const,
    should: ['icu'] as const,
  },
  stroke: {
    must: ['er', 'ct'] as const,
    should: ['icu', 'neuro'] as const,
  },
  burns: {
    must: ['er'] as const,
    should: ['burns', 'icu'] as const,
  },
  obstetric: {
    must: ['er', 'obstetric'] as const,
    should: ['ot', 'blood'] as const,
  },
  paediatric: {
    must: ['er', 'paediatric'] as const,
    should: ['icu'] as const,
  },
  other: {
    must: ['er'] as const,
    should: [] as const,
  },
} as const;

/**
 * Blood group compatibility matrix
 * Key: Patient blood group
 * Value: Compatible donor blood groups
 */
export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};
