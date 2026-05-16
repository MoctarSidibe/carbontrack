/**
 * POST /api/certifications/[id]/generate-certificate
 *
 * Generates and streams the GreenLeaves final Certificate PDF.
 * Accessible by the company that owns the certification, once
 * status is 'certified'.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { generateCertificatFinalPDF } from '@/lib/documents/CertificatFinalPDF'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const certId = parseInt(params.assessmentId)

    const result = await query(
      `SELECT
         cr.id, cr.status, cr.certificate_number,
         cr.expert_name, cr.company_id,
         cr.certified_at, cr.avis_date,
         cr.avis_number,
         cr.avis_period_start, cr.avis_period_end,
         a.name as assessment_name, a.year as assessment_year,
         a.total_co2eq, a.scope1_co2eq, a.scope2_co2eq, a.scope3_co2eq,
         a.approach,
         c.name as company_name, c.sector, c.rccm
       FROM certification_requests cr
       JOIN assessments a ON a.id = cr.assessment_id
       JOIN sites s ON s.id = a.site_id
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1 AND cr.company_id = $2`,
      [certId, session.companyId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Certification introuvable' }, { status: 404 })
    }

    const r = result.rows[0]

    if (r.status !== 'certified') {
      return NextResponse.json(
        { error: "Le certificat n'est disponible qu'apres la certification par GreenLeaves" },
        { status: 400 }
      )
    }

    if (!r.certificate_number) {
      return NextResponse.json(
        { error: 'Numero de certificat non encore attribue' },
        { status: 400 }
      )
    }

    // ── QR code ──────────────────────────────────────────────────────────────
    const verifyUrl = `https://greenleaves.ga/verify/${certId}`
    let qrCodeDataUrl: string | undefined
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
        color: { dark: '#166534', light: '#ffffff' },
      })
    } catch { /* non-fatal */ }

    // ── Company logo ──────────────────────────────────────────────────────────
    let companyLogoDataUrl: string | null = null
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logos', `company-${r.company_id}.png`)
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath)
        companyLogoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
      }
    } catch { /* non-fatal */ }

    // ── GreenLeaves logo ──────────────────────────────────────────────────────
    let greenLeavesLogoDataUrl: string | null = null
    try {
      const glLogoPath = path.join(process.cwd(), 'public', 'greenleaves-logo.png')
      if (fs.existsSync(glLogoPath)) {
        const glBuffer = fs.readFileSync(glLogoPath)
        greenLeavesLogoDataUrl = `data:image/png;base64,${glBuffer.toString('base64')}`
      }
    } catch { /* non-fatal */ }

    const pdfBuffer = await generateCertificatFinalPDF({
      certId,
      certificateNumber:  r.certificate_number,
      companyName:        r.company_name,
      companySector:      r.sector ?? '',
      companyRccm:        r.rccm ?? '',
      assessmentName:     r.assessment_name,
      assessmentYear:     parseInt(r.assessment_year),
      approach:           r.approach ?? 'operational_control',
      totalCo2eq:         parseFloat(r.total_co2eq) || 0,
      scope1:             parseFloat(r.scope1_co2eq) || 0,
      scope2:             parseFloat(r.scope2_co2eq) || 0,
      scope3:             parseFloat(r.scope3_co2eq) || 0,
      expertName:         r.expert_name ?? 'Expert GreenLeaves',
      issuedAt:           r.avis_date ?? r.certified_at ?? new Date().toISOString(),
      avisNumber:         r.avis_number ?? null,
      avisDate:           r.avis_date ?? null,
      periodStart:        r.avis_period_start ?? null,
      periodEnd:          r.avis_period_end ?? null,
      qrCodeDataUrl,
      companyLogoDataUrl,
      greenLeavesLogoDataUrl,
    })

    const filename = `certificat-carbontrack-${r.certificate_number}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      pdfBuffer.length.toString(),
        'Cache-Control':       'no-store',
      },
    })
  } catch (error) {
    console.error('Generate certificate error:', error)
    return NextResponse.json({ error: 'Erreur lors de la generation du certificat' }, { status: 500 })
  }
}
