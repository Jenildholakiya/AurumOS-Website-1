import { NextResponse } from 'next/server'
import { PLANS, PLAN_ORDER, getPlanFeatures } from '@/lib/plans'

/**
 * GET /api/subscription/plans
 *
 * Returns available subscription plans with pricing.
 * Used by the ERP client's revoked.html to display renewal options.
 *
 * Response:
 * {
 *   "plans": [
 *     { "id": "lite", "name": "Lite", "price": 3000, "onboarding": 15000, "period": "year", "desc": "10 Features", "features": [...] },
 *     ...
 *   ]
 * }
 */
export async function GET() {
  try {
    const plans = PLAN_ORDER.map(id => {
      const plan = PLANS[id]
      const features = getPlanFeatures(id)
      return {
        id: plan.id,
        name: plan.name,
        emoji: plan.emoji,
        price: plan.yearly,        // annual renewal price in ₹
        onboarding: plan.price,    // one-time onboarding price in ₹
        period: 'year',
        desc: `${features.length} Features`,
        features,
        accent: plan.accent,
      }
    })

    return NextResponse.json({ plans }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      }
    })
  } catch (err) {
    console.error('[GET /api/subscription/plans]:', err)
    return NextResponse.json({ plans: [] }, { status: 500 })
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
