export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabase } from '@/lib/supabase';

// Verify admin secret is configured
const MASTER_KEY = process.env.AURUM_MASTER_KEY || '';

function deriveShopSecret(clientId: string): string {
  return crypto.createHmac('sha256', MASTER_KEY).update(clientId).digest('hex').slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    console.log("[DEBUG] Received Payload:", JSON.stringify(body));

    // Extract fields including business_name
    const {
        client_id,
        events,
        alerts,
        thresholds,
        suspended,
        summary,
        business_name,
    } = body;

    const secret = req.headers.get('x-admin-secret');

    // Auth Check
    if (secret !== MASTER_KEY) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!client_id) {
      return NextResponse.json({ ok: false, error: 'client_id is missing' }, { status: 400 });
    }

    // Upsert into Supabase including the business_name
    const { error } = await supabase
      .from('bastion_data')
      .upsert({
        client_id,
        business_name: business_name || 'Unnamed Shop', // Saving business name
        events: Array.isArray(events) ? events : [],
        alerts: Array.isArray(alerts) ? alerts : [],
        thresholds: typeof thresholds === 'object' ? thresholds : {},
        suspended: !!suspended,
        summary: typeof summary === 'string' ? summary : '',
        received_at: new Date().toISOString(),
      }, { onConflict: 'client_id' });

    if (error) {
      console.error("[SUPABASE ERROR]:", JSON.stringify(error));
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      shop_secret: deriveShopSecret(client_id),
      received: Array.isArray(events) ? events.length : 0,
    });
  } catch (e: any) {
    console.error("[CRITICAL API ERROR]:", e);
    return NextResponse.json({ ok: false, error: 'Server Crash: ' + e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== MASTER_KEY) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get('client_id');

  try {
    const supabase = getSupabase();
    if (!clientId) {
      // Retrieve both for the dropdown
      const { data, error } = await supabase.from('bastion_data').select('client_id, business_name');
      if (error) throw error;

      return NextResponse.json({
        ok: true,
        clients: data.map(d => ({
            id: d.client_id,
            name: d.business_name || d.client_id
        }))
      });
    }

    const { data, error } = await supabase.from('bastion_data').select('*').eq('client_id', clientId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ ok: true, data: data || null });
  } catch (e: any) {
    console.error("[BASTION GET ERROR]:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}