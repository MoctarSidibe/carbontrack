import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// GET: download/serve a document by id
// Accessible to: the owning company, any admin, or the expert assigned to the certification
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Try all three session types
    const adminSession  = await getSession('admin')
    const expertSession = await getSession('expert')
    const userSession   = await getSession()
    const session = adminSession ?? expertSession ?? userSession

    if (!session) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const docId = parseInt(params.id)

    // Fetch the document record with its assessment and company info
    const docResult = await query(
      `SELECT d.*, a.id as assessment_id, s.company_id
       FROM audit_documents d
       JOIN assessments a ON d.assessment_id = a.id
       JOIN sites s ON a.site_id = s.id
       WHERE d.id = $1`,
      [docId]
    )

    if (docResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 })
    }

    const doc = docResult.rows[0]

    // Access control
    const isAdmin   = session.role === 'admin'
    const isCompany = session.role === 'user' && doc.company_id === session.companyId
    let isExpert = false

    if (session.role === 'expert') {
      // Expert can access if assigned to a certification for this assessment
      const certCheck = await query(
        `SELECT id FROM certification_requests
         WHERE assessment_id = $1 AND expert_user_id = $2`,
        [doc.assessment_id, session.userId]
      )
      isExpert = certCheck.rows.length > 0
    }

    if (!isAdmin && !isCompany && !isExpert) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const filePath = path.join(UPLOAD_DIR, String(doc.assessment_id), doc.filename)

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type':        doc.mime_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.original_name)}"`,
        'Content-Length':      String(fileBuffer.length),
      },
    })
  } catch (error) {
    console.error('Document serve error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
