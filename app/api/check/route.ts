import { NextRequest, NextResponse } from 'next/server';
import { getPlanFeatures } from '@/lib/plans';
import { validateKeyFormat } from '@/lib/license';
import { findLicenseByKey, saveLicense } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * POST /api/check — public license validation used by the AurumOS desktop
 * app on startup. Body: { key, machine_id }.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const key = String(body?.key ?? '').trim().toUpperCase();
    const machineId = String(body?.machine_id ?? '').trim();

    if (!key) {
      return NextResponse.json({ valid: false, status: 'missing', reason: 'License key is required.' });
    }

    const fmt = validateKeyFormat(key);
    if (!fmt.ok) {
      return NextResponse.json({ valid: false, status: 'invalid', reason: 'Malformed license key.' });
    }

    const license = await findLicenseByKey(key);
    if (!license) {
      return NextResponse.json({ valid: false, status: 'not_found', reason: 'License key not found.' });
    }

    if (license.status !== 'active') {
      return NextResponse.json({
        valid: false,
        status: license.status,
        plan: license.plan_type,
        reason: `License is ${license.status}.`,
      });
    }

    const now = Date.now();
    const expiresAt = Date.parse(license.subscription_expires_at);
    if (Number.isFinite(expiresAt) && expiresAt < now) {
      return NextResponse.json({
        valid: false,
        status: 'expired',
        plan: license.plan_type,
        effective_plan: license.plan_type,
        reason: 'Subscription has expired.',
        subscription: {
          started_at: license.subscription_started_at,
          expires_at: license.subscription_expires_at,
          days_left: 0,
        },
      });
    }

    // First activation locks the key to this machine.
    if (machineId) {
      if (!license.machine_id) {
        license.machine_id = machineId;
        license.is_used = true;
        await saveLicense(license);
      } else if (license.machine_id !== machineId) {
        return NextResponse.json({
          valid: false,
          status: 'machine_mismatch',
          plan: license.plan_type,
          reason: 'This key is already activated on a different machine.',
        });
      }
    }

    const daysLeft = Number.isFinite(expiresAt)
      ? Math.max(0, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)))
      : 0;

    return NextResponse.json({
      valid: true,
      status: 'active',
      plan: license.plan_type,
      effective_plan: license.plan_type,
      features: getPlanFeatures(license.plan_type),
      subscription: {
        started_at: license.subscription_started_at,
        expires_at: license.subscription_expires_at,
        days_left: daysLeft,
      },
    });
  } catch (err) {
    console.error('/api/check failed:', err);
    return NextResponse.json({ valid: false, status: 'error' }, { status: 500 });
  }
}
