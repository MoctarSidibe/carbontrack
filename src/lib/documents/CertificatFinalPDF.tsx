import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CertificatFinalData {
  certId: number
  certificateNumber: string
  companyName: string
  companySector: string
  companyRccm: string
  assessmentName: string
  assessmentYear: number
  approach: string
  totalCo2eq: number
  scope1: number
  scope2: number
  scope3: number
  expertName: string
  issuedAt: string
  avisNumber: string | null
  avisDate: string | null
  periodStart: number | null
  periodEnd: number | null
  qrCodeDataUrl?: string
  companyLogoDataUrl?: string | null
  greenLeavesLogoDataUrl?: string | null
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GREEN   = '#15803d'
const DKGREEN = '#166534'
const LTGREEN = '#dcfce7'
const GOLD    = '#b45309'
const LTGOLD  = '#fef3c7'
const GRAY    = '#6b7280'
const DKGRAY  = '#1f2937'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },

  // ── Outer frame ──
  outerBorder: {
    margin: 18,
    borderWidth: 3,
    borderColor: GREEN,
    borderRadius: 4,
    flex: 1,
    flexDirection: 'column',
  },
  innerBorder: {
    margin: 5,
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 2,
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },

  // ── Header band ──
  headerBand: {
    backgroundColor: GREEN,
    marginHorizontal: -32,
    marginTop: -24,
    marginBottom: 18,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glCircle: {
    width: 40, height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glText: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: GREEN },
  glLogoImg: { width: 44, height: 44, borderRadius: 4 },
  brandBlock: { flexDirection: 'column' },
  brandName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 7.5,
    color: '#bbf7d0',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  headerRight: { alignItems: 'flex-end' },
  certNumLabel: {
    fontSize: 7,
    color: '#bbf7d0',
    letterSpacing: 1,
  },
  certNum: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // ── Title block ──
  titleBlock: {
    alignItems: 'center',
    marginBottom: 14,
  },
  docType: {
    fontSize: 7,
    color: GRAY,
    letterSpacing: 2,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 19,
    fontFamily: 'Helvetica-Bold',
    color: DKGREEN,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 8,
    color: GRAY,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 1.5,
  },
  divider: {
    height: 2,
    backgroundColor: GREEN,
    marginHorizontal: 40,
    marginTop: 10,
    marginBottom: 14,
    borderRadius: 1,
  },

  // ── Company header (logo + name) ──
  companyHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  companyLogoImg: {
    width: 56, height: 56,
    borderRadius: 6,
    marginBottom: 6,
  },
  companyLogoPlaceholder: {
    width: 56, height: 56,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyLogoPlaceholderText: {
    fontSize: 8,
    color: GREEN,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Intro text ──
  introText: {
    fontSize: 8.5,
    color: DKGRAY,
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  companyHighlight: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: DKGREEN,
    textAlign: 'center',
    marginBottom: 3,
  },

  // ── Info cards ──
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
  cardGreen: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  cardTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    marginBottom: 7,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
  },
  cardTitleGreen: {
    color: DKGREEN,
    borderBottomColor: '#86efac',
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cardLabel: {
    width: 90,
    fontSize: 7.5,
    color: GRAY,
  },
  cardValue: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: DKGRAY,
  },

  // ── Emissions table ──
  table: {
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1fae5',
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: LTGREEN,
  },
  thCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  tdCell: {
    fontSize: 8,
    color: DKGRAY,
  },
  tdCellBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: DKGREEN,
  },
  col1: { flex: 1 },
  col2: { flex: 2 },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },

  // ── Certification banner ──
  avisBanner: {
    backgroundColor: LTGOLD,
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 4,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avisBadge: {
    backgroundColor: GOLD,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  avisBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  avisText: {
    flex: 1,
    fontSize: 7.5,
    color: '#78350f',
    lineHeight: 1.5,
  },

  // ── Signatures + QR code ──
  sigQrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 8,
  },
  sigBox: {
    width: 170,
    alignItems: 'center',
  },
  sigLine: {
    height: 0.5,
    backgroundColor: '#9ca3af',
    width: '100%',
    marginBottom: 5,
  },
  sigLabel: {
    fontSize: 7,
    color: GRAY,
    textAlign: 'center',
  },
  sigName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: DKGRAY,
    textAlign: 'center',
    marginTop: 3,
  },
  qrBlock: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  qrImage: { width: 68, height: 68 },
  qrCaption: { fontSize: 6, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  qrSub: { fontSize: 5.5, color: '#bbbbbb', textAlign: 'center', marginTop: 1 },

  // ── Footer ──
  footerBand: {
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
    marginHorizontal: -32,
    marginBottom: -24,
    paddingHorizontal: 28,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: GRAY,
  },
  footerBrand: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    .replace(/&amp;/g,   '&')
    .replace(/&lt;/g,    '<')
    .replace(/&gt;/g,    '>')
    .replace(/&quot;/g,  '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g,   "'")
    .replace(/&nbsp;/g,  ' ')
    .replace(/&eacute;/g, 'e')
    .replace(/&egrave;/g, 'e')
    .replace(/&ecirc;/g,  'e')
    .replace(/&agrave;/g, 'a')
    .replace(/&ccedil;/g, 'c')
    .replace(/&ocirc;/g,  'o')
    .replace(/&ucirc;/g,  'u')
    .replace(/&iuml;/g,   'i')
    .replace(/&hellip;/g, '...')
    .replace(/&ndash;/g,  '-')
    .replace(/&mdash;/g,  '-')
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function CertificatFinalDocument({ data }: { data: CertificatFinalData }) {
  const period = data.periodStart && data.periodEnd
    ? `${data.periodStart} – ${data.periodEnd}`
    : String(data.assessmentYear)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>

            {/* ── Header band ── */}
            <View style={styles.headerBand}>
              <View style={styles.headerLeft}>
                {data.greenLeavesLogoDataUrl ? (
                  <Image src={data.greenLeavesLogoDataUrl} style={styles.glLogoImg} />
                ) : (
                  <View style={styles.glCircle}>
                    <Text style={styles.glText}>GL</Text>
                  </View>
                )}
                <View style={styles.brandBlock}>
                  <Text style={styles.brandName}>GreenLeaves</Text>
                  <Text style={styles.brandSub}>Certification GES officielle — Republique Gabonaise</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.certNumLabel}>N° DE CERTIFICAT</Text>
                <Text style={styles.certNum}>{data.certificateNumber}</Text>
              </View>
            </View>

            {/* ── Title block ── */}
            <View style={styles.titleBlock}>
              <Text style={styles.docType}>DOCUMENT OFFICIEL — GREENLEAVES</Text>
              <Text style={styles.mainTitle}>RECAPITULATIF DE CERTIFICATION</Text>
              <Text style={styles.subtitle}>
                Certification GES officielle delivree par GreenLeaves,{'\n'}
                autorite de certification agreee — Republique Gabonaise
              </Text>
              <View style={styles.divider} />
            </View>

            {/* ── Intro text ── */}
            <Text style={styles.introText}>
              Le present recapitulatif confirme que l'entite ci-dessous a realise son diagnostic
              des emissions de Gaz a Effet de Serre, et que son dossier a ete audite et certifie
              par GreenLeaves conformement aux normes ISO 14064 / GHG Protocol.
            </Text>

            {/* ── Company logo + name ── */}
            <View style={styles.companyHeader}>
              {data.companyLogoDataUrl ? (
                <Image src={data.companyLogoDataUrl} style={styles.companyLogoImg} />
              ) : (
                <View style={styles.companyLogoPlaceholder}>
                  <Text style={styles.companyLogoPlaceholderText}>LOGO</Text>
                </View>
              )}
              <Text style={styles.companyHighlight}>{sanitize(data.companyName)}</Text>
            </View>

            {/* ── Company + Bilan cards ── */}
            <View style={styles.cardsRow}>
              <View style={[styles.card, styles.cardGreen]}>
                <Text style={[styles.cardTitle, styles.cardTitleGreen]}>INFORMATIONS ENTITE</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>N° RCCM</Text>
                  <Text style={styles.cardValue}>{sanitize(data.companyRccm)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Secteur</Text>
                  <Text style={styles.cardValue}>{sanitize(data.companySector)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Approche</Text>
                  <Text style={styles.cardValue}>
                    {data.approach === 'operational_control' ? 'Controle operationnel' : 'Quote-part du capital'}
                  </Text>
                </View>
              </View>

              <View style={[styles.card, styles.cardGreen]}>
                <Text style={[styles.cardTitle, styles.cardTitleGreen]}>BILAN GES CERTIFIE</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Bilan</Text>
                  <Text style={styles.cardValue}>{sanitize(data.assessmentName)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Periode</Text>
                  <Text style={styles.cardValue}>{period}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Expert auditeur</Text>
                  <Text style={styles.cardValue}>{sanitize(data.expertName)}</Text>
                </View>
              </View>
            </View>

            {/* ── Emissions table ── */}
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, styles.col1]}>Scope</Text>
                <Text style={[styles.thCell, styles.col2]}>Description</Text>
                <Text style={[styles.thCell, styles.col3]}>Emissions (tCO2e)</Text>
                <Text style={[styles.thCell, styles.col4]}>% du total</Text>
              </View>
              {[
                { scope: 'Scope 1', desc: 'Emissions directes (combustion, procedes, fugitives)', val: data.scope1 },
                { scope: 'Scope 2', desc: "Emissions indirectes liees a l'energie consommee",   val: data.scope2 },
                { scope: 'Scope 3', desc: 'Autres emissions indirectes (chaine de valeur)',      val: data.scope3 },
              ].map(row => (
                <View key={row.scope} style={styles.tableRow}>
                  <Text style={[styles.tdCell, styles.col1]}>{row.scope}</Text>
                  <Text style={[styles.tdCell, styles.col2]}>{row.desc}</Text>
                  <Text style={[styles.tdCell, styles.col3]}>{fmtNum(row.val)}</Text>
                  <Text style={[styles.tdCell, styles.col4]}>
                    {data.totalCo2eq > 0 ? (row.val / data.totalCo2eq * 100).toFixed(1) + ' %' : '—'}
                  </Text>
                </View>
              ))}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.tdCellBold, styles.col1]}>TOTAL</Text>
                <Text style={[styles.tdCell, styles.col2]}>Toutes sources d'emissions confondues</Text>
                <Text style={[styles.tdCellBold, styles.col3]}>{fmtNum(data.totalCo2eq)}</Text>
                <Text style={[styles.tdCellBold, styles.col4]}>100 %</Text>
              </View>
            </View>

            {/* ── Certification banner ── */}
            {data.avisNumber ? (
              <View style={styles.avisBanner}>
                <View style={styles.avisBadge}>
                  <Text style={styles.avisBadgeText}>CERTIFIE</Text>
                </View>
                <Text style={styles.avisText}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>Reference N° {data.avisNumber}</Text>
                  {' '}— Certification delivree par GreenLeaves le {fmtDate(data.avisDate)}.{'\n'}
                  Les emissions declarees ont ete verifiees et validees conformement a l'Ordonnance N°019/PR/2021.
                </Text>
              </View>
            ) : (
              <View style={[styles.avisBanner, { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }]}>
                <Text style={[styles.avisText, { color: '#6b7280' }]}>
                  Certification officielle delivree par GreenLeaves — autorite de certification agreee, Republique Gabonaise.
                </Text>
              </View>
            )}

            {/* ── Signatures + QR code ── */}
            <View style={styles.sigQrRow}>
              <View style={styles.sigBox}>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>Fait a Libreville, le {fmtDate(data.issuedAt)}</Text>
                <Text style={styles.sigName}>{sanitize(data.expertName)}</Text>
                <Text style={styles.sigLabel}>Expert auditeur agree</Text>
              </View>

              {data.qrCodeDataUrl && (
                <View style={styles.qrBlock}>
                  <Image src={data.qrCodeDataUrl} style={styles.qrImage} />
                  <Text style={styles.qrCaption}>Verifier l'authenticite</Text>
                  <Text style={styles.qrSub}>greenleaves.ga/verify/{data.certId}</Text>
                </View>
              )}

              <View style={styles.sigBox}>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>Pour GreenLeaves</Text>
                <Text style={styles.sigName}>Direction de la Certification</Text>
                <Text style={styles.sigLabel}>Autorite de certification agreee</Text>
              </View>
            </View>

            {/* ── Footer band ── */}
            <View style={styles.footerBand}>
              <Text style={styles.footerText}>
                Ce document est genere electroniquement par la plateforme GreenLeaves
              </Text>
              <Text style={styles.footerBrand}>GreenLeaves · Gabon · carbontrack.ga</Text>
              <Text style={styles.footerText}>N° {data.certificateNumber}</Text>
            </View>

          </View>
        </View>
      </Page>
    </Document>
  )
}

// ─── Generator function ───────────────────────────────────────────────────────

export async function generateCertificatFinalPDF(data: CertificatFinalData): Promise<Buffer> {
  const doc = <CertificatFinalDocument data={data} />
  const instance = pdf(doc)
  const blob = await instance.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
