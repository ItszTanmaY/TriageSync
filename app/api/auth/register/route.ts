import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MOCK_HOSPITALS } from '@/lib/supabase/mock-data';

const RegisterSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['citizen', 'hospital_staff', 'paramedic', 'dispatcher']),
  hospital_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { full_name, email, role, hospital_id } = parsed.data;

    let hospital_name: string | undefined = undefined;
    if (role === 'hospital_staff') {
      if (!hospital_id) {
        return NextResponse.json(
          { success: false, error: 'Hospital ID required for clinical staff' },
          { status: 400 }
        );
      }
      const hosp = MOCK_HOSPITALS.find((h) => h.id === hospital_id);
      hospital_name = hosp ? hosp.name : 'Affiliated Hospital';
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      email,
      full_name,
      role,
      hospital_id,
      hospital_name,
      badge_number: role === 'paramedic' ? 'MED-101' : role === 'dispatcher' ? 'CMD-01' : undefined,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal registration error' },
      { status: 500 }
    );
  }
}
