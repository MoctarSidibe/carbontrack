import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const siteId = request.nextUrl.searchParams.get('siteId')
    
    let sql = `SELECT a.*, s.name as site_name, s.type as site_type 
               FROM assessments a 
               JOIN sites s ON a.site_id = s.id 
               WHERE s.company_id = $1`
    const params: unknown[] = [session.companyId]

    if (siteId) {
      sql += ' AND a.site_id = $2'
      params.push(siteId)
    }
    sql += ' ORDER BY a.created_at DESC'

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Assessments fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { siteId, name, year, approach } = await request.json()
    if (!siteId || !name || !year) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const siteCheck = await query('SELECT id FROM sites WHERE id = $1 AND company_id = $2', [siteId, session.companyId])
    if (siteCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Site non trouvé' }, { status: 404 })
    }

    const result = await query(
      'INSERT INTO assessments (site_id, name, year, approach, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [siteId, name, year, approach || 'operational_control', 'draft', session.userId]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Assessment creation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
