import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

async function ensureColumns() {
  await query(`ALTER TABLE certification_requests ADD COLUMN IF NOT EXISTS expert_user_id INTEGER REFERENCES users(id)`, [])
  await query(`ALTER TABLE certification_requests ADD COLUMN IF NOT EXISTS inspection_checklist TEXT`, [])
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'expert') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await ensureColumns()

    const certId = parseInt(params.id)
    const result = await query(
      `SELECT
         cr.id, cr.status, cr.requested_at, cr.updated_at,
         cr.inspection_notes, cr.inspection_checklist, cr.certified_at, cr.certificate_number,
         cr.rejection_reason, cr.admin_notes, cr.inspection_date,
         cr.company_message,
         a.id as assessment_id, a.name as assessment_name, a.year as assessment_year,
         a.total_co2eq, a.scope1_co2eq, a.scope2_co2eq, a.scope3_co2eq,
         a.approach,
         s.name as site_name, s.type as site_type, s.address as site_address,
         c.id as company_id, c.name as company_name, c.sector, c.rccm
       FROM certification_requests cr
       JOIN assessments a ON a.id = cr.assessment_id
       JOIN sites s ON s.id = a.site_id
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1 AND cr.expert_user_id = $2`,
      [certId, session.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Certification introuvable ou non assignée' }, { status: 404 })
    }

    const r = result.rows[0]

    // Fetch all emission entries for this assessment
    const entriesResult = await query(
      `SELECT id, scope, category, subcategory, factor_name,
              quantity, unit, factor_value, total_co2eq, month, year,
              ghg_category, description, source_characterization
       FROM emission_entries
       WHERE assessment_id = $1
       ORDER BY scope, category, factor_name`,
      [r.assessment_id]
    )

    const entries = entriesResult.rows.map(e => ({
      id: e.id,
      scope: parseInt(e.scope),
      category: e.category,
      subcategory: e.subcategory,
      factorName: e.factor_name,
      quantity: parseFloat(e.quantity) || 0,
      unit: e.unit,
      factorValue: parseFloat(e.factor_value) || 0,
      totalCo2eq: parseFloat(e.total_co2eq) || 0,
      month: parseInt(e.month) || null,
      year: parseInt(e.year) || null,
      ghgCategory: e.ghg_category,
      description: e.description,
      sourceCharacterization: e.source_characterization,
    }))

    // Monthly breakdown
    const MONTH_LABELS = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const mes = entries.filter(e => e.month === m)
      return {
        month: m,
        label: MONTH_LABELS[m],
        total: mes.reduce((s, e) => s + e.totalCo2eq, 0),
        scope1: mes.filter(e => e.scope === 1).reduce((s, e) => s + e.totalCo2eq, 0),
        scope2: mes.filter(e => e.scope === 2).reduce((s, e) => s + e.totalCo2eq, 0),
        scope3: mes.filter(e => e.scope === 3).reduce((s, e) => s + e.totalCo2eq, 0),
      }
    })

    // By category
    const catMap: Record<string, { total: number; scope: number; count: number }> = {}
    for (const e of entries) {
      if (!catMap[e.category]) catMap[e.category] = { total: 0, scope: e.scope, count: 0 }
      catMap[e.category].total += e.totalCo2eq
      catMap[e.category].count++
    }
    const byCategory = Object.entries(catMap)
      .map(([category, d]) => ({ category, ...d }))
      .sort((a, b) => b.total - a.total)

    // Top emitters
    const topEmitters = [...entries]
      .filter(e => e.totalCo2eq > 0)
      .sort((a, b) => b.totalCo2eq - a.totalCo2eq)
      .slice(0, 10)
      .map(e => ({ name: e.factorName, total: e.totalCo2eq, scope: e.scope, category: e.category, quantity: e.quantity, unit: e.unit, factorValue: e.factorValue }))

    return NextResponse.json({
      id: r.id,
      status: r.status,
      requestedAt: r.requested_at,
      updatedAt: r.updated_at,
      inspectionDate: r.inspection_date,
      inspectionNotes: r.inspection_notes,
      inspectionChecklist: r.inspection_checklist ? JSON.parse(r.inspection_checklist) : null,
      certifiedAt: r.certified_at,
      certificateNumber: r.certificate_number,
      rejectionReason: r.rejection_reason,
      adminNotes: r.admin_notes,
      companyMessage: r.company_message,
      assessmentId: r.assessment_id,
      assessmentName: r.assessment_name,
      assessmentYear: r.assessment_year,
      approach: r.approach,
      totalCo2eq: r.total_co2eq,
      scope1: r.scope1_co2eq,
      scope2: r.scope2_co2eq,
      scope3: r.scope3_co2eq,
      siteName: r.site_name,
      siteType: r.site_type,
      siteAddress: r.site_address,
      companyId: r.company_id,
      companyName: r.company_name,
      sector: r.sector,
      rccm: r.rccm,
      entries,
      byMonth,
      byCategory,
      topEmitters,
    })
  } catch (error) {
    console.error('Expert cert detail error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'expert') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const certId = parseInt(params.id)
    const body = await request.json()
    const { action } = body

    const owned = await query(
      `SELECT id, status FROM certification_requests WHERE id = $1 AND expert_user_id = $2`,
      [certId, session.userId]
    )
    if (owned.rows.length === 0) {
      return NextResponse.json({ error: 'Certification introuvable ou non assignée' }, { status: 404 })
    }
    const cert = owned.rows[0]

    if (action === 'update_date') {
      const { inspectionDate } = body
      await query(
        `UPDATE certification_requests SET inspection_date = $1, updated_at = NOW() WHERE id = $2`,
        [inspectionDate || null, certId]
      )

    } else if (action === 'start_review') {
      if (cert.status !== 'assigned') {
        return NextResponse.json({ error: 'Ce bilan n\'est pas dans l\'état "assigné"' }, { status: 400 })
      }
      await query(`UPDATE certification_requests SET status = 'in_progress', updated_at = NOW() WHERE id = $1`, [certId])

    } else if (action === 'notes') {
      const { inspectionNotes } = body
      await query(
        `UPDATE certification_requests SET inspection_notes = $1, updated_at = NOW() WHERE id = $2`,
        [inspectionNotes || null, certId]
      )

    } else if (action === 'checklist') {
      const { checklist } = body
      await query(
        `UPDATE certification_requests SET inspection_checklist = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(checklist), certId]
      )

    } else if (action === 'certify') {
      if (!['in_progress', 'assigned'].includes(cert.status)) {
        return NextResponse.json({ error: 'Statut invalide pour certifier' }, { status: 400 })
      }
      const year = new Date().getFullYear()
      const random = Math.floor(100000 + Math.random() * 900000)
      const certificateNumber = `CT-${year}-${random}`
      await query(
        `UPDATE certification_requests SET status = 'certified', certified_at = NOW(), certificate_number = $1, updated_at = NOW() WHERE id = $2`,
        [certificateNumber, certId]
      )
      await query(
        `UPDATE assessments SET status = 'completed', updated_at = NOW() WHERE id = (SELECT assessment_id FROM certification_requests WHERE id = $1)`,
        [certId]
      )

    } else if (action === 'reject') {
      const { rejectionReason } = body
      if (!rejectionReason?.trim()) {
        return NextResponse.json({ error: 'Le motif de rejet est obligatoire' }, { status: 400 })
      }
      await query(
        `UPDATE certification_requests SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
        [rejectionReason.trim(), certId]
      )

    } else {
      return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expert cert action error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
