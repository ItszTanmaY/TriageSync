import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/client';
import { stepAmbulanceFleet } from '@/lib/sim/simulator';
import { GeoLocation } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ambulanceId = body.ambulance_id || 'amb-101';
    const destinationHospitalId = body.destination_hospital_id || 'hosp-001';

    const hospital = mockStore.getHospitalById(destinationHospitalId);
    const targetLocation: GeoLocation = hospital
      ? hospital.location
      : { latitude: 18.5312, longitude: 73.8794 };

    const destinations: Record<string, GeoLocation> = {
      [ambulanceId]: targetLocation,
    };

    const fleet = mockStore.getAmbulances();
    const { updatedFleet, steps } = stepAmbulanceFleet(fleet, destinations);

    // Apply updates to mockStore
    updatedFleet.forEach((a) => {
      mockStore.updateAmbulance(a.id, {
        location: a.location,
        status: a.status,
      });
    });

    return NextResponse.json({
      success: true,
      steps,
      ambulance: mockStore.getAmbulances().find((a) => a.id === ambulanceId),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Simulation step failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
