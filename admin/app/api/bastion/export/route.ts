// app/api/bastion/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

function csvEscape(val: any): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') || req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.AURUM_ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = req.nextUrl.searchParams.get('client_id');
  if (!clientId) {
    return NextResponse.json({ ok: false, error: 'client_id required' }, { status: 400 });
  }

  const raw = await kv.get(`bastion:${clientId}`);
  if (!raw) {
    return NextResponse.json({ ok: false, error: 'No data found for this client' }, { status: 404 });
  }

  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const events = data.events || [];

  const header = ['Timestamp', 'Event Type', 'Severity', 'Score', 'Detail', 'Action Taken'];
  const rows = events.map((ev: any) => [
    ev.ts || '',
    ev.event_type || '',
    ev.severity || '',
    ev.score ?? '',
    ev.detail || '',
    ev.action_taken || '',
  ]);

  const csv = [header, ...rows]
    .map(row => row.map(csvEscape).join(','))
    .join('\n');

  const filename = `audit-trail-${clientId}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}