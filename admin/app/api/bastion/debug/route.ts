import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    
    // Minimalist Upsert: only the absolute essentials
    const { error } = await supabase
      .from('bastion_data')
      .upsert({
        client_id: body.client_id || 'UNKNOWN',
        events: [],
        alerts: [],
        thresholds: {},
        suspended: false,
        summary: 'Minimalist Test',
        received_at: new Date().toISOString()
      }, { onConflict: 'client_id' });

    if (error) throw error;
    return NextResponse.json({ status: 'success' });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.message }, { status: 500 });
  }
}