import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DEMO_USERS } from '@/lib/auth/types';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const found = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (found) {
      return NextResponse.json({
        success: true,
        user: found,
      });
    }

    // Dynamic user fallback
    const dynamicUser = {
      id: `usr-${Date.now()}`,
      email,
      full_name: email.split('@')[0],
      role: 'citizen' as const,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: dynamicUser,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal login error' },
      { status: 500 }
    );
  }
}
