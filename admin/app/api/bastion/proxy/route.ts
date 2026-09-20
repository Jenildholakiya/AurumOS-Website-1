export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const MASTER_KEY = process.env.AURUM_MASTER_KEY || '';

export async function POST(req: NextRequest) {
  try {
    if (!MASTER_KEY) {
      return NextResponse.json(
        { error: 'Admin secret (AURUM_MASTER_KEY) is not configured' },
        { status: 500 }
      );
    }
    const { path } = await req.json();

    // Use the request host to keep the proxy internal to your deployment
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const targetUrl = `${protocol}://${host}${path}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-admin-secret': MASTER_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}