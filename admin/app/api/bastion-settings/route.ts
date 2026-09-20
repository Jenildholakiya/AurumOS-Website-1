export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const VALID_FEATURES = [
    'db_watchdog_enabled',
    'session_guard_enabled',
    'file_integrity_enabled',
    'anti_debugger_enabled',
    'honeypot_enabled',
    'auto_healer_enabled',
    'pattern_learner_enabled',
    'alert_sender_enabled',
];

// ── GET ── Fetch current settings ──────────────────────────────
export async function GET() {
    try {
        const supabase = getSupabase();
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { status: 'error', message: 'Supabase config missing' },
                { status: 500 }
            );
        }

        let { data, error } = await supabase
            .from('global_bastion_settings')
            .select('*')
            .eq('id', 1)
            .single();

        // If row doesn't exist, create with all features ON
        if (error || !data) {
            const defaultRow: Record<string, any> = { id: 1 };
            for (const feat of VALID_FEATURES) {
                defaultRow[feat] = true;
            }

            const { data: newData, error: insertError } = await supabase
                .from('global_bastion_settings')
                .upsert(defaultRow, { onConflict: 'id' })
                .select()
                .single();

            if (insertError) {
                return NextResponse.json(
                    { status: 'error', message: insertError.message },
                    { status: 500 }
                );
            }

            data = newData;
        }

        return NextResponse.json({ status: 'ok', data });
    } catch (e: any) {
        return NextResponse.json(
            { status: 'error', message: e.message },
            { status: 500 }
        );
    }
}

// ── POST ── Toggle a feature ───────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { status: 'error', message: 'Supabase config missing' },
                { status: 500 }
            );
        }

        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { status: 'error', message: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const { feature_id, value } = body;

        if (!feature_id || !VALID_FEATURES.includes(feature_id)) {
            return NextResponse.json(
                { status: 'error', message: `Invalid feature: ${feature_id}` },
                { status: 400 }
            );
        }

        if (typeof value !== 'boolean') {
            return NextResponse.json(
                { status: 'error', message: 'Value must be boolean' },
                { status: 400 }
            );
        }

        // Ensure row exists
        await supabase
            .from('global_bastion_settings')
            .upsert({ id: 1 }, { onConflict: 'id' });

        // Update the feature (try with updated_at first)
        const updateData: Record<string, any> = {
            [feature_id]: value,
            updated_at: new Date().toISOString(),
        };

        let { error } = await supabase
            .from('global_bastion_settings')
            .update(updateData)
            .eq('id', 1);

        // If updated_at column missing, retry without it
        if (error && error.message.includes('updated_at')) {
            const retry = await supabase
                .from('global_bastion_settings')
                .update({ [feature_id]: value })
                .eq('id', 1);

            error = retry.error;
        }

        if (error) {
            return NextResponse.json(
                { status: 'error', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: 'ok',
            feature: feature_id,
            enabled: value,
            timestamp: new Date().toISOString(),
        });

    } catch (e: any) {
        return NextResponse.json(
            { status: 'error', message: e.message },
            { status: 500 }
        );
    }
}