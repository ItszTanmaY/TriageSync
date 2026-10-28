import { NextRequest, NextResponse } from 'next/server';
import { BloodStockUpdateSchema } from '@/lib/validations/schemas';
import { mockStore, isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospital_id');

    if (!hospitalId) {
      return NextResponse.json({ error: 'hospital_id parameter is required' }, { status: 400 });
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('blood_stock')
        .select('*')
        .eq('hospital_id', hospitalId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    const stock = mockStore.getBloodStock(hospitalId);
    return NextResponse.json({ data: stock });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = BloodStockUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid blood stock data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { hospital_id, blood_group, units } = parsed.data;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('blood_stock')
        .upsert({
          hospital_id,
          blood_group,
          units,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    const updated = mockStore.updateBloodStock(hospital_id, blood_group, units);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
