import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// GET: download/serve a document by id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const docId = params.id

    // Get document record
    const result = await query(
      `SELECT d.*, a.site_id FROM audit_documents d
       JOIN assessments a ON d.assessment_id = a.id
       JOIN sites s ON a.site_id = s.id
       WHERE d.id = $1 AND s.company_id = $2`,
      [docId, session.companyId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    const doc = result.rows[0]
    const filePath = path.join(UPLOAD_DIR, String(doc.assessment_id), doc.filename)

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.mime_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.original_name)}"`,
        'Content-Length': String(fileBuffer.length),
      },
    })
  } catch (error) {
    console.error('Document serve error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
