import { NextResponse } from 'next/server';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('ambulances').select('*');
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

    const ambulances = mockStore.getAmbulances();
    return NextResponse.json({ success: true, data: ambulances });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown ambulances error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
