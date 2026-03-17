import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const result = await query(
      'SELECT s.*, (SELECT COUNT(*) FROM assessments a WHERE a.site_id = s.id) as assessment_count FROM sites s WHERE s.company_id = $1 ORDER BY s.created_at DESC',
      [session.companyId]
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Sites fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { name, type, address, surface, description } = await request.json()
    if (!name) return NextResponse.json({ error: 'Le nom du site est requis' }, { status: 400 })

    const result = await query(
      'INSERT INTO sites (company_id, name, type, address, surface, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [session.companyId, name, type || 'bureau', address || null, surface || null, description || null]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Site creation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du site' }, { status: 500 })
  }
}
