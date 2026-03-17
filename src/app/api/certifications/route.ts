import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: List all certification requests for the company
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const result = await query(
      `SELECT cr.*, 
              a.name as assessment_name, a.year as assessment_year, 
              a.total_co2eq, a.scope1_co2eq, a.scope2_co2eq, a.scope3_co2eq,
              s.name as site_name
       FROM certification_requests cr
       JOIN assessments a ON cr.assessment_id = a.id
       JOIN sites s ON a.site_id = s.id
       WHERE cr.company_id = $1
       ORDER BY cr.requested_at DESC`,
      [session.companyId]
    )

    // Get documents for each certification
    const certifications = await Promise.all(
      result.rows.map(async (cert) => {
        const docs = await query(
          `SELECT id, doc_type, original_name, file_size, mime_type, created_at 
           FROM certification_documents WHERE certification_id = $1 ORDER BY created_at DESC`,
          [cert.id]
        )
        return {
          id: cert.id,
          assessmentId: cert.assessment_id,
          assessmentName: cert.assessment_name,
          assessmentYear: cert.assessment_year,
          siteName: cert.site_name,
          totalCo2eq: parseFloat(cert.total_co2eq),
          scope1: parseFloat(cert.scope1_co2eq),
          scope2: parseFloat(cert.scope2_co2eq),
          scope3: parseFloat(cert.scope3_co2eq),
          status: cert.status,
          expertName: cert.expert_name,
          expertEmail: cert.expert_email,
          inspectionDate: cert.inspection_date,
          inspectionNotes: cert.inspection_notes,
          companyMessage: cert.company_message,
          adminNotes: cert.admin_notes,
          rejectionReason: cert.rejection_reason,
          certifiedAt: cert.certified_at,
          certificateNumber: cert.certificate_number,
          requestedAt: cert.requested_at,
          documents: docs.rows.map(d => ({
            id: d.id,
            docType: d.doc_type,
            originalName: d.original_name,
            fileSize: d.file_size,
            mimeType: d.mime_type,
            createdAt: d.created_at,
          })),
        }
      })
    )

    return NextResponse.json(certifications)
  } catch (error) {
    console.error('Certifications list error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Request certification for an assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const { assessmentId, message } = await request.json()

    if (!assessmentId) {
      return NextResponse.json({ error: 'ID du bilan requis' }, { status: 400 })
    }

    // Verify the assessment belongs to this company
    const assessment = await query(
      `SELECT a.id, a.name, a.total_co2eq, s.company_id 
       FROM assessments a JOIN sites s ON a.site_id = s.id 
       WHERE a.id = $1 AND s.company_id = $2`,
      [assessmentId, session.companyId]
    )

    if (assessment.rows.length === 0) {
      return NextResponse.json({ error: 'Bilan non trouve' }, { status: 404 })
    }

    // Check if there's already a pending/in_progress/certified request
    const existing = await query(
      `SELECT id, status FROM certification_requests 
       WHERE assessment_id = $1 AND status IN ('pending', 'assigned', 'in_progress', 'certified')`,
      [assessmentId]
    )

    if (existing.rows.length > 0) {
      const s = existing.rows[0].status
      if (s === 'certified') {
        return NextResponse.json({ error: 'Ce bilan est deja certifie' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Une demande de certification est deja en cours pour ce bilan' }, { status: 409 })
    }

    // Create the certification request
    const result = await query(
      `INSERT INTO certification_requests (assessment_id, company_id, status, company_message)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [assessmentId, session.companyId, message || null]
    )

    return NextResponse.json({
      success: true,
      message: 'Demande de certification envoyee avec succes',
      certification: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        requestedAt: result.rows[0].requested_at,
      },
    })
  } catch (error) {
    console.error('Certification request error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
