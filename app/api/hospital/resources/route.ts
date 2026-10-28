import { NextRequest, NextResponse } from 'next/server';
import { HospitalResourcesUpdateSchema } from '@/lib/validations/schemas';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospital_id');

    if (hospitalId) {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('hospital_resources')
          .select('*')
          .eq('hospital_id', hospitalId)
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json({ data });
      }

      const res = mockStore.getResources(hospitalId);
      if (!res) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      }
      return NextResponse.json({ data: res });
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('hospital_resources').select('*');
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    return NextResponse.json({ data: mockStore.getAllResources() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = HospitalResourcesUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { hospital_id, ...updates } = parsed.data;

    if (isSupabaseConfigured() && supabase) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('hospital_resources')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('hospital_id', hospital_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    // In-Memory store update
    const updated = mockStore.updateResources(hospital_id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
