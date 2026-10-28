/**
 * TriageSync 2.0: Real-Time Ambulance Fleet Simulator
 * Requirement SIM-2: Advances simulated vehicles along routes to destination
 */

import { GeoLocation, Ambulance } from '@/lib/types/database';
import { calculateHaversineDistanceKm } from '@/lib/matching/engine';

export interface RouteSimulationStep {
  ambulanceId: string;
  previousLocation: GeoLocation;
  newLocation: GeoLocation;
  destinationLocation: GeoLocation;
  remainingDistanceKm: number;
  hasArrived: boolean;
}

/**
 * Moves an ambulance towards a target location by a defined step fraction (e.g., 0.12 = 12% per step)
 */
export function interpolateStep(
  current: GeoLocation,
  target: GeoLocation,
  fraction: number = 0.15
): { location: GeoLocation; distanceKm: number; hasArrived: boolean } {
  const distanceKm = calculateHaversineDistanceKm(current, target);

  if (distanceKm <= 0.2) {
    // Within 200m -> considered arrived
    return {
      location: { ...target },
      distanceKm: 0,
      hasArrived: true,
    };
  }

  // Linear spherical interpolation step
  const newLat = current.latitude + (target.latitude - current.latitude) * fraction;
  const newLon = current.longitude + (target.longitude - current.longitude) * fraction;

  const newLocation: GeoLocation = {
    latitude: Math.round(newLat * 100000) / 100000,
    longitude: Math.round(newLon * 100000) / 100000,
  };

  const remainingDist = calculateHaversineDistanceKm(newLocation, target);

  return {
    location: newLocation,
    distanceKm: Math.round(remainingDist * 10) / 10,
    hasArrived: remainingDist <= 0.2,
  };
}

/**
 * Steps the simulation for a list of active assigned ambulances
 */
export function stepAmbulanceFleet(
  fleet: Ambulance[],
  destinations: Record<string, GeoLocation>
): {
  updatedFleet: Ambulance[];
  steps: RouteSimulationStep[];
} {
  const steps: RouteSimulationStep[] = [];
  const updatedFleet: Ambulance[] = [];

  for (const amb of fleet) {
    const target = destinations[amb.id];

    if (!target || amb.status === 'available' || amb.status === 'offline') {
      updatedFleet.push({ ...amb });
      continue;
    }

    const result = interpolateStep(amb.location, target, 0.18);

    const updatedAmb: Ambulance = {
      ...amb,
      location: result.location,
      status: result.hasArrived ? 'assigned' : 'en_route',
      updated_at: new Date().toISOString(),
    };

    updatedFleet.push(updatedAmb);
    steps.push({
      ambulanceId: amb.id,
      previousLocation: amb.location,
      newLocation: result.location,
      destinationLocation: target,
      remainingDistanceKm: result.distanceKm,
      hasArrived: result.hasArrived,
    });
  }

  return { updatedFleet, steps };
}
