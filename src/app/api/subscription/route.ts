import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: Check current subscription status
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE company_id = $1 AND status = 'active' AND expires_at > NOW() 
       ORDER BY expires_at DESC LIMIT 1`,
      [session.companyId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ active: false, subscription: null })
    }

    const sub = result.rows[0]
    return NextResponse.json({
      active: true,
      subscription: {
        id: sub.id,
        plan: sub.plan,
        amount: sub.amount,
        currency: sub.currency,
        paymentMethod: sub.payment_method,
        paymentRef: sub.payment_ref,
        status: sub.status,
        startsAt: sub.starts_at,
        expiresAt: sub.expires_at,
      },
    })
  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Create/simulate a payment
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const { paymentMethod, phoneNumber } = await request.json()

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Methode de paiement requise' }, { status: 400 })
    }

    if (paymentMethod === 'airtel_money' && !phoneNumber) {
      return NextResponse.json({ error: 'Numero de telephone requis pour Airtel Money' }, { status: 400 })
    }

    // Check if already has active subscription
    const existing = await query(
      `SELECT id FROM subscriptions WHERE company_id = $1 AND status = 'active' AND expires_at > NOW()`,
      [session.companyId]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Vous avez deja un abonnement actif' }, { status: 409 })
    }

    // Load dynamic price and duration from platform_settings
    let amount = 250000
    let durationDays = 30
    try {
      const priceRow = await query(`SELECT value FROM platform_settings WHERE key = 'monthly_price'`, [])
      const durRow = await query(`SELECT value FROM platform_settings WHERE key = 'subscription_duration_days'`, [])
      if (priceRow.rows.length > 0) amount = parseInt(priceRow.rows[0].value) || 250000
      if (durRow.rows.length > 0) durationDays = parseInt(durRow.rows[0].value) || 30
    } catch { /* table may not exist yet, use defaults */ }

    // Simulate payment processing
    // In production, this is where you'd call the Airtel Money API or Moov Money / Visa payment gateway
    const paymentRef = `CT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Simulate a small delay like a real payment
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Create subscription record
    const result = await query(
      `INSERT INTO subscriptions (company_id, plan, amount, currency, payment_method, payment_ref, phone_payment, status, starts_at, expires_at)
       VALUES ($1, 'monthly', $2, 'FCFA', $3, $4, $5, 'active', NOW(), NOW() + ($6 || ' days')::INTERVAL)
       RETURNING *`,
      [session.companyId, amount, paymentMethod, paymentRef, phoneNumber || null, durationDays]
    )

    const sub = result.rows[0]
    return NextResponse.json({
      success: true,
      message: 'Paiement effectue avec succes (simulation)',
      subscription: {
        id: sub.id,
        plan: sub.plan,
        amount: sub.amount,
        currency: sub.currency,
        paymentMethod: sub.payment_method,
        paymentRef: sub.payment_ref,
        status: sub.status,
        startsAt: sub.starts_at,
        expiresAt: sub.expires_at,
      },
    })
  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json({ error: 'Erreur lors du paiement' }, { status: 500 })
  }
}
