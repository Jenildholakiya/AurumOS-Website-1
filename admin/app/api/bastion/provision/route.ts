export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Log the request to see what the client is sending
    const body = await req.json().catch(() => ({}));
    console.log("[PROVISION REQUEST RECEIVED]:", body);

    // Return a success status to satisfy the client's handshake
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Provisioning endpoint active',
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}