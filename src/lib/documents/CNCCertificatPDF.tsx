import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'

export interface CNCCertificatData {
  certId: number
  certificateNumber: string
  glCertificateNumber: string
  companyName: string
  companySector: string
  companyRccm: string
  siteName: string
  assessmentName: string
  assessmentYear: number
  approach: string
  totalCo2eq: number
  scope1: number
  scope2: number
  scope3: number
  expertName: string
  avisNumber: string | null
  avisDate: string | null
  periodStart: number | null
  periodEnd: number | null
  avisTotalCo2eq: number | null
  issuedAt: string
  companyLogoDataUrl?: string | null
}

const GREEN = '#0f6b3a'
const DKGREEN = '#0a4f2a'
const GOLD = '#b8860b'
const LTGOLD = '#fef3c7'
const GRAY = '#6b7280'
const DKGRAY = '#1f2937'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    padding: 0,
  },
  outerBorder: {
    margin: 20,
    borderWidth: 3,
    borderColor: GREEN,
    flex: 1,
    flexDirection: 'column',
  },
  innerBorder: {
    margin: 6,
    borderWidth: 1,
    borderColor: '#86efac',
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },

  // Header - Republic of Gabon
  republicBand: {
    backgroundColor: GREEN,
    marginHorizontal: -30,
    marginTop: -20,
    marginBottom: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  republicText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  republicSub: {
    fontSize: 8,
    color: '#bbf7d0',
    marginTop: 2,
    letterSpacing: 1,
    textAlign: 'center',
  },
  devisaText: {
    fontSize: 7.5,
    color: '#d1fae5',
    marginTop: 1,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // CNC Title
  cncHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  cncAcronym: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: DKGREEN,
    letterSpacing: 3,
  },
  cncFullName: {
    fontSize: 8,
    color: GRAY,
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
  },

  docType: {
    fontSize: 7,
    color: GRAY,
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: DKGREEN,
    letterSpacing: 1,
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: GREEN,
    marginHorizontal: 60,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 1,
  },

  // Certificate number
  certNumberBlock: {
    alignItems: 'center',
    marginBottom: 10,
  },
  certNumLabel: {
    fontSize: 6.5,
    color: GRAY,
    letterSpacing: 1.5,
  },
  certNumValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DKGREEN,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Intro
  introText: {
    fontSize: 8,
    color: DKGRAY,
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: DKGREEN,
    textAlign: 'center',
    marginBottom: 2,
  },

  // Info cards
  cardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  cardTitle: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: DKGREEN,
    letterSpacing: 0.5,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#86efac',
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  cardLabel: {
    width: 70,
    fontSize: 7,
    color: GRAY,
  },
  cardValue: {
    flex: 1,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: DKGRAY,
  },

  // Emissions table
  table: {
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1fae5',
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#dcfce7',
  },
  thCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  tdCell: { fontSize: 7.5, color: DKGRAY },
  tdCellBold: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: DKGREEN },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1, textAlign: 'right' },

  // Certification banner
  certBanner: {
    backgroundColor: LTGOLD,
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 4,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  certBadge: {
    backgroundColor: GOLD,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  certBadgeText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  certText: {
    flex: 1,
    fontSize: 7,
    color: '#78350f',
    lineHeight: 1.5,
  },

  // Legal text
  legalBlock: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  legalTitle: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: GRAY,
    marginBottom: 4,
  },
  legalText: {
    fontSize: 6,
    color: '#9ca3af',
    lineHeight: 1.4,
  },

  // Signatures
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  },
  sigBox: {
    width: 160,
    alignItems: 'center',
  },
  sigLine: {
    height: 0.5,
    backgroundColor: '#9ca3af',
    width: '100%',
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 6.5,
    color: GRAY,
    textAlign: 'center',
  },
  sigTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: DKGRAY,
    textAlign: 'center',
    marginTop: 2,
  },

  // Footer
  footer: {
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
    marginHorizontal: -30,
    marginBottom: -20,
    paddingHorizontal: 24,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 6,
    color: GRAY,
  },
  footerBold: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
})

function fmtNum(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function sanitize(text: string | null | undefined): string {
  if (!text) return '—'
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/gi, "'").replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&eacute;/g, 'e').replace(/&egrave;/g, 'e')
    .replace(/&ecirc;/g, 'e').replace(/&agrave;/g, 'a').replace(/&ccedil;/g, 'c')
    .replace(/&ocirc;/g, 'o').replace(/&ucirc;/g, 'u').replace(/&iuml;/g, 'i')
    .replace(/&hellip;/g, '...').replace(/&ndash;/g, '-').replace(/&mdash;/g, '-')
}

export function CNCCertificatDocument({ data }: { data: CNCCertificatData }) {
  const period = data.periodStart && data.periodEnd
    ? `${data.periodStart} – ${data.periodEnd}`
    : String(data.assessmentYear)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>

            {/* Republic of Gabon header */}
            <View style={styles.republicBand}>
              <Text style={styles.republicText}>REPUBLIQUE GABONAISE</Text>
              <Text style={styles.republicSub}>Conseil National du Climat (CNC)</Text>
              <Text style={styles.devisaText}>{'"Union \u2014 Travail \u2014 Justice"'}</Text>
            </View>

            {/* CNC header */}
            <View style={styles.cncHeader}>
              <Text style={styles.cncAcronym}>CNC</Text>
              <Text style={styles.cncFullName}>CONSEIL NATIONAL DU CLIMAT</Text>
            </View>

            <Text style={styles.docType}>DOCUMENT OFFICIEL — CERTIFICATION FINALE</Text>
            <Text style={styles.mainTitle}>CERTIFICAT DE CONFORMITE CARBONE</Text>
            <View style={styles.divider} />

            {/* Certificate number */}
            <View style={styles.certNumberBlock}>
              <Text style={styles.certNumLabel}>N° DE CERTIFICAT CNC</Text>
              <Text style={styles.certNumValue}>{data.certificateNumber}</Text>
            </View>

            {/* Intro */}
            <Text style={styles.introText}>
              Le Conseil National du Climat (CNC), autorité compétente de la République Gabonaise en matière
              de certification carbone, certifie que le dossier ci-dessous a été examiné et validé conformément
              aux dispositions de l'Ordonnance N°019/PR/2021 et aux normes ISO 14064 / GHG Protocol.
            </Text>

            <Text style={styles.companyName}>{sanitize(data.companyName)}</Text>

            {/* Info cards */}
            <View style={styles.cardsRow}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>ENTITE CERTIFIEE</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>N° RCCM</Text>
                  <Text style={styles.cardValue}>{sanitize(data.companyRccm)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Secteur</Text>
                  <Text style={styles.cardValue}>{sanitize(data.companySector)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Site</Text>
                  <Text style={styles.cardValue}>{sanitize(data.siteName)}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>BILAN CERTIFIE</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Bilan</Text>
                  <Text style={styles.cardValue}>{sanitize(data.assessmentName)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Période</Text>
                  <Text style={styles.cardValue}>{period}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Expert</Text>
                  <Text style={styles.cardValue}>{sanitize(data.expertName)}</Text>
                </View>
              </View>
            </View>

            {/* Emissions table */}
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, styles.col1]}>Source</Text>
                <Text style={[styles.thCell, styles.col2]}>tCO2e</Text>
                <Text style={[styles.thCell, styles.col3]}>%</Text>
              </View>
              {[
                { label: 'Scope 1 — Émissions directes', val: data.scope1 },
                { label: 'Scope 2 — Énergie indirecte',  val: data.scope2 },
                { label: 'Scope 3 — Autres indirectes',  val: data.scope3 },
              ].map(row => (
                <View key={row.label} style={styles.tableRow}>
                  <Text style={[styles.tdCell, styles.col1]}>{row.label}</Text>
                  <Text style={[styles.tdCell, styles.col2]}>{fmtNum(row.val)}</Text>
                  <Text style={[styles.tdCell, styles.col3]}>
                    {data.totalCo2eq > 0 ? (row.val / data.totalCo2eq * 100).toFixed(1) + ' %' : '—'}
                  </Text>
                </View>
              ))}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.tdCellBold, styles.col1]}>TOTAL</Text>
                <Text style={[styles.tdCellBold, styles.col2]}>{fmtNum(data.totalCo2eq)}</Text>
                <Text style={[styles.tdCellBold, styles.col3]}>100 %</Text>
              </View>
            </View>

            {/* Certification banner */}
            <View style={styles.certBanner}>
              <View style={styles.certBadge}>
                <Text style={styles.certBadgeText}>CERTIFIE</Text>
              </View>
              <Text style={styles.certText}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Certificat N° {data.certificateNumber}</Text>
                {' '}— Délivré par le Conseil National du Climat (CNC), République Gabonaise, le {fmtDate(data.issuedAt)}.
                {'\n'}Certification GreenLeaves associée : {data.glCertificateNumber}
                {data.avisNumber ? ` · Avis CNC N° ${data.avisNumber}` : ''}
              </Text>
            </View>

            {/* Legal */}
            <View style={styles.legalBlock}>
              <Text style={styles.legalTitle}>BASE LEGALE</Text>
              <Text style={styles.legalText}>
                Ordonnance N°019/PR/2021 relative à la certification carbone en République Gabonaise.
                Délibération du Conseil National du Climat en date du {fmtDate(data.issuedAt)}.
                {data.avisNumber ? ` Avis de conformité N° ${data.avisNumber} du ${fmtDate(data.avisDate)}.` : ''}
                Les présentes émissions ont été vérifiées et validées conformément aux procédures en vigueur.
                Le présent certificat est valable pour une durée d'un an à compter de sa date d'émission.
              </Text>
            </View>

            {/* Signatures */}
            <View style={styles.sigRow}>
              <View style={styles.sigBox}>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>Fait à Libreville, le {fmtDate(data.issuedAt)}</Text>
                <Text style={styles.sigTitle}>Le Président du CNC</Text>
                <Text style={styles.sigLabel}>Conseil National du Climat</Text>
              </View>
              <View style={styles.sigBox}>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>Visa</Text>
                <Text style={styles.sigTitle}>Le Secrétaire Général</Text>
                <Text style={styles.sigLabel}>Ministère de l'Environnement</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Document officiel généré par la plateforme CarbonTrack / GreenLeaves
              </Text>
              <Text style={styles.footerBold}>CNC · Gabon · carbontrack.ga</Text>
              <Text style={styles.footerText}>N° {data.certificateNumber}</Text>
            </View>

          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generateCNCCertificatPDF(data: CNCCertificatData): Promise<Buffer> {
  const doc = <CNCCertificatDocument data={data} />
  const instance = pdf(doc)
  const blob = await instance.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
