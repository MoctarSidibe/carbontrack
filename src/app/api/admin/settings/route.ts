import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key   VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      label VARCHAR(255),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `, [])

  // Seed defaults if empty
  await query(`
    INSERT INTO platform_settings (key, value, label) VALUES
      ('monthly_price',             '250000',  'Prix mensuel (FCFA)'),
      ('currency',                  'FCFA',    'Devise'),
      ('subscription_duration_days','30',      'Durée abonnement (jours)')
    ON CONFLICT (key) DO NOTHING
  `, [])
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    await ensureTable()
    const result = await query(`SELECT key, value, label, updated_at FROM platform_settings ORDER BY key`, [])
    const settings: Record<string, { value: string; label: string; updatedAt: string }> = {}
    for (const r of result.rows) {
      settings[r.key] = { value: r.value, label: r.label, updatedAt: r.updated_at }
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Admin settings GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    await ensureTable()

    const body = await request.json()
    const updates = body as Record<string, string>

    for (const [key, value] of Object.entries(updates)) {
      if (typeof value !== 'string' && typeof value !== 'number') continue
      await query(
        `UPDATE platform_settings SET value = $1, updated_at = NOW() WHERE key = $2`,
        [String(value), key]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin settings PATCH error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
