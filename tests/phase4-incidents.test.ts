import { describe, it, expect } from 'vitest';
import {
  calculateGoldenHour,
  findNearestAvailableAmbulance,
  canTransitionTo,
} from '@/lib/incident/service';
import { interpolateStep, stepAmbulanceFleet } from '@/lib/sim/simulator';
import { calculateHaversineDistanceKm } from '@/lib/matching/engine';
import { MOCK_AMBULANCES } from '@/lib/supabase/mock-data';
import { PUNE_CENTER } from '@/lib/config';

describe('Phase 4: Golden Hour Countdown Logic (INC-4)', () => {
  it('calculates remaining seconds and percentage elapsed accurately', () => {
    const now = Date.now();
    // 15 minutes elapsed -> 45 minutes (2700s) remaining
    const fifteenMinAgo = new Date(now - 15 * 60 * 1000).toISOString();

    const progress = calculateGoldenHour(fifteenMinAgo, now);
    expect(progress.remainingSeconds).toBe(45 * 60);
    expect(progress.formattedRemaining).toBe('45:00');
    expect(progress.percentageElapsed).toBe(25);
    expect(progress.urgencyTier).toBe('safe');
  });

  it('transitions to caution when under 30 minutes remain', () => {
    const now = Date.now();
    const fortyMinAgo = new Date(now - 40 * 60 * 1000).toISOString();

    const progress = calculateGoldenHour(fortyMinAgo, now);
    expect(progress.remainingSeconds).toBe(20 * 60);
    expect(progress.formattedRemaining).toBe('20:00');
    expect(progress.urgencyTier).toBe('caution');
  });

  it('transitions to critical when under 15 minutes remain', () => {
    const now = Date.now();
    const fiftyMinAgo = new Date(now - 50 * 60 * 1000).toISOString();

    const progress = calculateGoldenHour(fiftyMinAgo, now);
    expect(progress.remainingSeconds).toBe(10 * 60);
    expect(progress.formattedRemaining).toBe('10:00');
    expect(progress.urgencyTier).toBe('critical');
  });

  it('marks as expired when 60 minutes have fully passed', () => {
    const now = Date.now();
    const seventyMinAgo = new Date(now - 70 * 60 * 1000).toISOString();

    const progress = calculateGoldenHour(seventyMinAgo, now);
    expect(progress.remainingSeconds).toBe(0);
    expect(progress.urgencyTier).toBe('expired');
  });
});

describe('Phase 4: Nearest Available Ambulance (INC-5)', () => {
  it('identifies the closest available ambulance from fleet to incident coordinates', () => {
    const incidentLoc = PUNE_CENTER; // Shivajinagar ~18.5204, 73.8567
    const result = findNearestAvailableAmbulance(incidentLoc, MOCK_AMBULANCES);

    expect(result.ambulance).toBeDefined();
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.etaMinutes).toBeGreaterThan(0);
    // Closest ambulance to Shivajinagar should be Apex-101 or Rapid-102
    expect(['Apex-101', 'Rapid-102', 'Swarm-106']).toContain(result.ambulance?.callsign);
  });
});

describe('Phase 4: Incident Lifecycle State Machine (INC-3)', () => {
  it('allows valid sequential lifecycle transitions', () => {
    expect(canTransitionTo('created', 'assigned')).toBe(true);
    expect(canTransitionTo('assigned', 'en_route')).toBe(true);
    expect(canTransitionTo('en_route', 'arrived')).toBe(true);
    expect(canTransitionTo('arrived', 'handed_over')).toBe(true);
    expect(canTransitionTo('handed_over', 'closed')).toBe(true);
  });

  it('rejects skipping states out of sequence', () => {
    expect(canTransitionTo('created', 'arrived')).toBe(false);
    expect(canTransitionTo('assigned', 'handed_over')).toBe(false);
  });
});

describe('Phase 4: Ambulance Fleet Simulation (SIM-2)', () => {
  it('interpolates ambulance coordinates towards destination waypoint', () => {
    const startLoc = { latitude: 18.5204, longitude: 73.8567 };
    const targetLoc = { latitude: 18.5312, longitude: 73.8794 };

    const step = interpolateStep(startLoc, targetLoc, 0.25);
    expect(step.location.latitude).toBeGreaterThan(startLoc.latitude);
    expect(step.location.longitude).toBeGreaterThan(startLoc.longitude);
    expect(step.distanceKm).toBeLessThan(calculateHaversineDistanceKm(startLoc, targetLoc));
  });

  it('steps fleet and marks arrived when close to hospital', () => {
    const sampleFleet = [
      {
        id: 'amb-sim-1',
        callsign: 'Sim-1',
        location: { latitude: 18.5310, longitude: 73.8790 }, // ~25 meters from destination
        status: 'en_route' as const,
        updated_at: new Date().toISOString(),
      },
    ];

    const target = {
      'amb-sim-1': { latitude: 18.5312, longitude: 73.8794 },
    };

    const result = stepAmbulanceFleet(sampleFleet, target);
    expect(result.steps.length).toBe(1);
    expect(result.steps[0].hasArrived).toBe(true);
  });
});
