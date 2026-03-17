import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

async function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return false
  const result = await query('SELECT role FROM users WHERE id = $1', [session.userId])
  return result.rows.length > 0 && result.rows[0].role === 'admin'
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!await requireAdmin(session)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const certId = parseInt(params.id)
    const result = await query(
      `SELECT
         cr.id, cr.status, cr.requested_at, cr.updated_at,
         cr.inspection_notes, cr.inspection_checklist, cr.certified_at, cr.certificate_number,
         cr.rejection_reason, cr.admin_notes, cr.inspection_date,
         cr.company_message, cr.expert_name, cr.expert_email, cr.expert_user_id,
         a.id as assessment_id, a.name as assessment_name, a.year as assessment_year,
         a.total_co2eq, a.scope1_co2eq, a.scope2_co2eq, a.scope3_co2eq,
         a.approach,
         s.name as site_name, s.type as site_type, s.address as site_address,
         c.id as company_id, c.name as company_name, c.sector, c.rccm
       FROM certification_requests cr
       JOIN assessments a ON a.id = cr.assessment_id
       JOIN sites s ON s.id = a.site_id
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1`,
      [certId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Certification introuvable' }, { status: 404 })
    }

    const r = result.rows[0]

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

    const MONTH_LABELS = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const mes = entries.filter(e => e.month === m)
      return {
        month: m, label: MONTH_LABELS[m],
        total: mes.reduce((s, e) => s + e.totalCo2eq, 0),
        scope1: mes.filter(e => e.scope === 1).reduce((s, e) => s + e.totalCo2eq, 0),
        scope2: mes.filter(e => e.scope === 2).reduce((s, e) => s + e.totalCo2eq, 0),
        scope3: mes.filter(e => e.scope === 3).reduce((s, e) => s + e.totalCo2eq, 0),
      }
    })

    const catMap: Record<string, { total: number; scope: number; count: number }> = {}
    for (const e of entries) {
      if (!catMap[e.category]) catMap[e.category] = { total: 0, scope: e.scope, count: 0 }
      catMap[e.category].total += e.totalCo2eq
      catMap[e.category].count++
    }
    const byCategory = Object.entries(catMap)
      .map(([category, d]) => ({ category, ...d }))
      .sort((a, b) => b.total - a.total)

    const topEmitters = [...entries]
      .filter(e => e.totalCo2eq > 0)
      .sort((a, b) => b.totalCo2eq - a.totalCo2eq)
      .slice(0, 10)
      .map(e => ({ name: e.factorName, total: e.totalCo2eq, scope: e.scope, category: e.category, quantity: e.quantity, unit: e.unit, factorValue: e.factorValue }))

    const docsResult = await query(
      `SELECT id, doc_type, original_name, file_size, created_at
       FROM certification_documents WHERE certification_id = $1 ORDER BY created_at DESC`,
      [certId]
    )

    return NextResponse.json({
      id: r.id, status: r.status, requestedAt: r.requested_at, updatedAt: r.updated_at,
      inspectionDate: r.inspection_date, inspectionNotes: r.inspection_notes,
      inspectionChecklist: r.inspection_checklist ? JSON.parse(r.inspection_checklist) : null,
      certifiedAt: r.certified_at, certificateNumber: r.certificate_number,
      rejectionReason: r.rejection_reason, adminNotes: r.admin_notes,
      companyMessage: r.company_message,
      expertName: r.expert_name, expertEmail: r.expert_email, expertUserId: r.expert_user_id,
      assessmentId: r.assessment_id, assessmentName: r.assessment_name, assessmentYear: r.assessment_year,
      approach: r.approach,
      totalCo2eq: r.total_co2eq, scope1: r.scope1_co2eq, scope2: r.scope2_co2eq, scope3: r.scope3_co2eq,
      siteName: r.site_name, siteType: r.site_type, siteAddress: r.site_address,
      companyId: r.company_id, companyName: r.company_name, sector: r.sector, rccm: r.rccm,
      entries, byMonth, byCategory, topEmitters,
      documents: docsResult.rows.map(d => ({
        id: d.id, docType: d.doc_type, originalName: d.original_name,
        fileSize: d.file_size, createdAt: d.created_at,
      })),
    })
  } catch (error) {
    console.error('Admin cert detail GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!await requireAdmin(session)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const certId = parseInt(params.id)
    const body = await request.json()
    const { action } = body

    if (action === 'assign') {
      const { expertUserId, inspectionDate, adminNotes } = body

      // Ensure expert_user_id column exists (idempotent migration)
      await query(
        `ALTER TABLE certification_requests ADD COLUMN IF NOT EXISTS expert_user_id INTEGER REFERENCES users(id)`,
        []
      )

      if (!expertUserId) {
        return NextResponse.json({ error: 'Sélectionnez un expert' }, { status: 400 })
      }

      // Look up expert name/email from users table
      const expertResult = await query(
        `SELECT first_name, last_name, email FROM users WHERE id = $1 AND role = 'expert'`,
        [expertUserId]
      )
      if (expertResult.rows.length === 0) {
        return NextResponse.json({ error: 'Expert introuvable' }, { status: 404 })
      }
      const expert = expertResult.rows[0]

      await query(
        `UPDATE certification_requests
         SET status = 'assigned',
             expert_user_id = $1,
             expert_name = $2,
             expert_email = $3,
             inspection_date = $4,
             admin_notes = $5,
             updated_at = NOW()
         WHERE id = $6`,
        [
          expertUserId,
          `${expert.first_name} ${expert.last_name}`,
          expert.email,
          inspectionDate || null,
          adminNotes || null,
          certId,
        ]
      )
    } else if (action === 'in_progress') {
      await query(
        `UPDATE certification_requests SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
        [certId]
      )
    } else if (action === 'reject') {
      const { rejectionReason, adminNotes } = body
      await query(
        `UPDATE certification_requests
         SET status = 'rejected', rejection_reason = $1, admin_notes = $2, updated_at = NOW()
         WHERE id = $3`,
        [rejectionReason || null, adminNotes || null, certId]
      )
    } else if (action === 'notes') {
      const { adminNotes } = body
      await query(
        `UPDATE certification_requests SET admin_notes = $1, updated_at = NOW() WHERE id = $2`,
        [adminNotes, certId]
      )
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin certification update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
