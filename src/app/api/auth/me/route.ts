import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userResult = await query(
      'SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, c.id as company_id, c.name as company_name, c.rccm, c.sector, c.logo_url FROM users u JOIN companies c ON u.company_id = c.id WHERE u.id = $1',
      [session.userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Check active subscription
    const subResult = await query(
      `SELECT id, plan, status, expires_at, payment_method FROM subscriptions 
       WHERE company_id = $1 AND status = 'active' AND expires_at > NOW() 
       ORDER BY expires_at DESC LIMIT 1`,
      [user.company_id]
    )
    const subscription = subResult.rows.length > 0 ? subResult.rows[0] : null

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      company: {
        id: user.company_id,
        name: user.company_name,
        rccm: user.rccm,
        sector: user.sector,
        logoUrl: user.logo_url || null,
      },
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        expiresAt: subscription.expires_at,
        paymentMethod: subscription.payment_method,
      } : null,
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
