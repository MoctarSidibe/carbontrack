import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const userResult = await query('SELECT role FROM users WHERE id = $1', [session.userId])
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const [
      companiesResult,
      usersResult,
      subscriptionsResult,
      activeSubsResult,
      revenueResult,
      assessmentsResult,
      emissionsResult,
      certificationsResult,
      certStatusResult,
      recentCompaniesResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM companies'),
      query('SELECT COUNT(*) as count FROM users WHERE role != \'expert\''),
      query('SELECT COUNT(*) as count FROM subscriptions'),
      query("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND expires_at > NOW()"),
      query("SELECT COALESCE(SUM(amount), 0) as total FROM subscriptions WHERE status = 'active'"),
      query('SELECT COUNT(*) as count FROM assessments'),
      query('SELECT COALESCE(SUM(total_co2eq), 0) as total FROM assessments'),
      query('SELECT COUNT(*) as count FROM certification_requests'),
      query(`SELECT status, COUNT(*) as count FROM certification_requests GROUP BY status`),
      query(`SELECT c.id, c.name, c.sector, c.created_at,
               (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as user_count,
               (SELECT status FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' AND s.expires_at > NOW() ORDER BY s.expires_at DESC LIMIT 1) as sub_status
             FROM companies c ORDER BY c.created_at DESC LIMIT 5`),
    ])

    const monthlyRevenue = await query(`
      SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as revenue, COUNT(*) as count
      FROM subscriptions
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `)

    return NextResponse.json({
      companies: parseInt(companiesResult.rows[0].count),
      users: parseInt(usersResult.rows[0].count),
      subscriptions: parseInt(subscriptionsResult.rows[0].count),
      activeSubscriptions: parseInt(activeSubsResult.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].total),
      assessments: parseInt(assessmentsResult.rows[0].count),
      totalEmissions: parseFloat(emissionsResult.rows[0].total),
      certifications: parseInt(certificationsResult.rows[0].count),
      certByStatus: Object.fromEntries(
        certStatusResult.rows.map((r: { status: string; count: string }) => [r.status, parseInt(r.count)])
      ),
      recentCompanies: recentCompaniesResult.rows.map(c => ({
        id: c.id,
        name: c.name,
        sector: c.sector,
        createdAt: c.created_at,
        userCount: parseInt(c.user_count),
        hasActiveSub: !!c.sub_status,
      })),
      monthlyRevenue: monthlyRevenue.rows.map(r => ({
        month: r.month,
        revenue: parseFloat(r.revenue),
        count: parseInt(r.count),
      })),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
