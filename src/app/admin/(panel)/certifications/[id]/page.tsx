'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, FileText, Building2, Calendar,
  AlertCircle, ChevronDown, ChevronUp, Award, TrendingUp, BarChart3,
  Layers, ListChecks, ShieldCheck, AlertTriangle, Info,
  User, Clock, X, Save
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Entry {
  id: number; scope: number; category: string; subcategory: string
  factorName: string; quantity: number; unit: string; factorValue: number
  totalCo2eq: number; month: number | null; year: number | null
  ghgCategory: string | null; description: string | null; sourceCharacterization: string | null
}
interface MonthRow { month: number; label: string; total: number; scope1: number; scope2: number; scope3: number }
interface CatRow   { category: string; total: number; scope: number; count: number }
interface TopRow   { name: string; total: number; scope: number; category: string; quantity: number; unit: string; factorValue: number }
interface DocRow   { id: number; docType: string; originalName: string; fileSize: number; createdAt: string }

interface CertDetail {
  id: number; status: string; requestedAt: string; updatedAt: string
  inspectionDate: string | null; inspectionNotes: string | null
  inspectionChecklist: boolean[] | null
  certifiedAt: string | null; certificateNumber: string | null
  rejectionReason: string | null; adminNotes: string | null; companyMessage: string | null
  expertName: string | null; expertEmail: string | null; expertUserId: number | null
  assessmentId: number; assessmentName: string; assessmentYear: number; approach: string | null
  totalCo2eq: number; scope1: number; scope2: number; scope3: number
  siteName: string; siteType: string; siteAddress: string | null
  companyName: string; sector: string; rccm: string | null
  entries: Entry[]; byMonth: MonthRow[]; byCategory: CatRow[]; topEmitters: TopRow[]
  documents: DocRow[]
}

// ─── Checklist (same as expert) ───────────────────────────────────────────────

const CHECKLIST = [
  { section: 'Périmètre', text: 'Le périmètre organisationnel est clairement défini et justifié' },
  { section: 'Périmètre', text: "L'approche de consolidation (contrôle opérationnel/financier) est appropriée" },
  { section: 'Périmètre', text: "Toutes les sources d'émissions matérielles (Scopes 1, 2, 3) sont incluses" },
  { section: 'Périmètre', text: "Les éventuelles exclusions sont justifiées" },
  { section: 'Données', text: "Les données d'activité sont complètes pour la période de référence" },
  { section: 'Données', text: "Les sources de données sont identifiables et vérifiables (factures, compteurs…)" },
  { section: 'Données', text: "La cohérence temporelle des données (mensuelle/annuelle) est satisfaisante" },
  { section: 'Données', text: "Aucune lacune significative n'est détectée dans les données" },
  { section: 'Calculs', text: "Les facteurs d'émission utilisés sont appropriés, reconnus et à jour" },
  { section: 'Calculs', text: "La méthode de calcul est conforme à ISO 14064 / GHG Protocol" },
  { section: 'Calculs', text: "Les conversions d'unités sont correctes et documentées" },
  { section: 'Calculs', text: "Les totaux par scope correspondent à la somme des entrées individuelles" },
  { section: 'Qualité', text: "Le niveau d'incertitude des données est acceptable" },
  { section: 'Qualité', text: "La transparence méthodologique est satisfaisante" },
  { section: 'Qualité', text: "Le bilan est cohérent avec les caractéristiques déclarées de l'entreprise" },
  { section: 'Qualité', text: "Les informations légales de l'entreprise (RCCM, secteur) sont vérifiées" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | null) {
  if (!n) return '—'
  if (n >= 1000) return (n / 1000).toFixed(2) + ' tCO₂e'
  return n.toFixed(2) + ' kgCO₂e'
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const SCOPE_COLORS = ['', '#22c55e', '#3b82f6', '#f59e0b']
const SCOPE_TEXT   = ['', 'text-green-400', 'text-blue-400', 'text-amber-400']
const SCOPE_BG     = ['', 'bg-green-500/20', 'bg-blue-500/20', 'bg-amber-500/20']
const MONTH_NAMES  = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const CAT_LABELS: Record<string, string> = {
  energy: 'Énergie', transport: 'Transport', freight: 'Fret',
  waste: 'Déchets', water: 'Eau', materials: 'Matériaux', other: 'Autre',
}

const STATUS_LABELS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:     { label: 'En attente',          cls: 'bg-yellow-500/20 text-yellow-400',  icon: <Clock className="w-3.5 h-3.5" /> },
  assigned:    { label: 'Expert assigné',       cls: 'bg-blue-500/20 text-blue-400',     icon: <User className="w-3.5 h-3.5" /> },
  in_progress: { label: "En cours d'inspection",cls: 'bg-violet-500/20 text-violet-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  certified:   { label: 'Certifié',             cls: 'bg-green-500/20 text-green-400',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected:    { label: 'Rejeté',               cls: 'bg-red-500/20 text-red-400',       icon: <XCircle className="w-3.5 h-3.5" /> },
}

// ─── Pre-validation ───────────────────────────────────────────────────────────

type CheckStatus = 'pass' | 'warning' | 'fail' | 'info'
interface PreCheck { status: CheckStatus; label: string; detail: string }

function computePreChecks(cert: CertDetail): PreCheck[] {
  const checks: PreCheck[] = []
  const entries = cert.entries
  const total   = Number(cert.totalCo2eq) || 0
  const s1 = Number(cert.scope1) || 0
  const s2 = Number(cert.scope2) || 0
  const s3 = Number(cert.scope3) || 0

  if (total === 0) {
    checks.push({ status: 'fail', label: 'Total CO₂ nul', detail: 'Aucune émission enregistrée' })
  } else {
    const sumScopes = s1 + s2 + s3
    const diffPct = Math.abs(sumScopes - total) / total * 100
    if (diffPct < 1) {
      checks.push({ status: 'pass', label: 'Cohérence des totaux', detail: `S1+S2+S3 = ${fmt(sumScopes)} ≈ total (écart ${diffPct.toFixed(2)}%)` })
    } else {
      checks.push({ status: 'fail', label: 'Incohérence des totaux', detail: `S1+S2+S3 = ${fmt(sumScopes)} ≠ total ${fmt(total)} (écart ${diffPct.toFixed(1)}%)` })
    }
  }

  for (const sc of [1, 2, 3] as const) {
    const scopeEntries = entries.filter(e => e.scope === sc)
    const scopeTotal = scopeEntries.reduce((s, e) => s + e.totalCo2eq, 0)
    if (scopeEntries.length > 0) {
      checks.push({ status: 'info', label: `Scope ${sc} présent`, detail: `${scopeEntries.length} source${scopeEntries.length > 1 ? 's' : ''} — ${fmt(scopeTotal)}` })
    } else {
      checks.push({ status: 'info', label: `Scope ${sc} absent`, detail: 'Aucune donnée — absence à justifier si applicable' })
    }
  }

  const zeroEntries = entries.filter(e => e.quantity === 0 || e.totalCo2eq === 0)
  if (zeroEntries.length === 0) {
    checks.push({ status: 'pass', label: 'Entrées valides', detail: `Toutes les ${entries.length} sources ont des valeurs non nulles` })
  } else {
    checks.push({ status: 'warning', label: `${zeroEntries.length} entrée${zeroEntries.length > 1 ? 's' : ''} sans valeur`, detail: zeroEntries.slice(0, 3).map(e => e.factorName).join(', ') + (zeroEntries.length > 3 ? '…' : '') })
  }

  const zeroFactor = entries.filter(e => e.factorValue === 0)
  if (zeroFactor.length === 0) {
    checks.push({ status: 'pass', label: "Facteurs d'émission", detail: 'Tous les facteurs sont renseignés (> 0)' })
  } else {
    checks.push({ status: 'warning', label: `${zeroFactor.length} facteur${zeroFactor.length > 1 ? 's' : ''} manquant${zeroFactor.length > 1 ? 's' : ''}`, detail: zeroFactor.slice(0, 3).map(e => e.factorName).join(', ') + (zeroFactor.length > 3 ? '…' : '') })
  }

  const hasMonthly = entries.some(e => e.month && e.month > 0)
  if (hasMonthly) {
    const monthsWithData = new Set(entries.filter(e => e.month && e.month > 0).map(e => e.month)).size
    const pct = Math.round(monthsWithData / 12 * 100)
    if (monthsWithData >= 10) {
      checks.push({ status: 'pass', label: 'Couverture mensuelle', detail: `${monthsWithData}/12 mois (${pct}%)` })
    } else {
      checks.push({ status: 'warning', label: 'Couverture mensuelle partielle', detail: `${monthsWithData}/12 mois (${pct}%)` })
    }
  } else {
    checks.push({ status: 'info', label: 'Données annuelles', detail: 'Aucune ventilation mensuelle' })
  }

  return checks
}

const CHECK_STYLE: Record<CheckStatus, { icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  pass:    { icon: CheckCircle,   cls: 'text-green-400'  },
  warning: { icon: AlertTriangle, cls: 'text-amber-400'  },
  fail:    { icon: XCircle,       cls: 'text-red-400'    },
  info:    { icon: Info,          cls: 'text-blue-400'   },
}

// ─── Small components ─────────────────────────────────────────────────────────

function ScopeBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{fmt(value)} <span className="text-gray-500">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><Icon className="w-4 h-4" />{title}</h2>
      {children}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminCertDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cert, setCert]     = useState<CertDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [openScope, setOpenScope] = useState<number | null>(null)

  // Modal state
  const [modalMode, setModalMode] = useState<'assign' | 'reject' | 'notes' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [experts, setExperts] = useState<{ id: number; firstName: string; lastName: string; email: string }[]>([])
  const [expertUserId, setExpertUserId] = useState('')
  const [inspectionDate, setInspectionDate] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const loadCert = () => {
    fetch(`/api/admin/certifications/${params.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setCert(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadCert()
    fetch('/api/admin/experts?limit=100')
      .then(r => r.json())
      .then(data => setExperts(data.experts || []))
      .catch(() => {})
  }, [params.id])

  const openModal = (mode: 'assign' | 'reject' | 'notes') => {
    setModalMode(mode)
    setExpertUserId('')
    setInspectionDate(cert?.inspectionDate ? cert.inspectionDate.slice(0, 10) : '')
    setAdminNotes(cert?.adminNotes || '')
    setRejectionReason('')
  }

  const submitModal = async () => {
    if (!cert) return
    setSubmitting(true)
    let body: object = { action: modalMode }
    if (modalMode === 'assign') {
      body = { action: 'assign', expertUserId: parseInt(expertUserId), inspectionDate: inspectionDate || null, adminNotes }
    } else if (modalMode === 'reject') {
      body = { action: 'reject', rejectionReason, adminNotes }
    } else if (modalMode === 'notes') {
      body = { action: 'notes', adminNotes }
    }
    await fetch(`/api/admin/certifications/${cert.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setSubmitting(false)
    setModalMode(null)
    loadCert()
  }

  const quickAction = async (action: string) => {
    if (!cert) return
    await fetch(`/api/admin/certifications/${cert.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    loadCert()
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>
  if (!cert)   return <div className="text-center py-20 text-gray-500">Certification introuvable.</div>

  const s = STATUS_LABELS[cert.status] || { label: cert.status, cls: 'bg-gray-700 text-gray-400', icon: null }
  const total = Number(cert.totalCo2eq) || 0
  const checklist = Array.isArray(cert.inspectionChecklist) && cert.inspectionChecklist.length === CHECKLIST.length
    ? cert.inspectionChecklist : Array(CHECKLIST.length).fill(false)
  const checkedCount = checklist.filter(Boolean).length
  const checklistPct = Math.round(checkedCount / CHECKLIST.length * 100)
  const sections = Array.from(new Set(CHECKLIST.map(c => c.section)))
  const entriesByScope: Record<number, Entry[]> = { 1: [], 2: [], 3: [] }
  for (const e of cert.entries) { if (entriesByScope[e.scope]) entriesByScope[e.scope].push(e) }
  const activeMonths = cert.byMonth.filter(m => m.total > 0)
  const maxMonth = Math.max(...cert.byMonth.map(m => m.total), 0.001)
  const annualEntries = cert.entries.filter(e => !e.month)
  const monthlyTotal  = cert.byMonth.reduce((s, m) => s + m.total, 0)
  const monthlyScope1 = cert.byMonth.reduce((s, m) => s + m.scope1, 0)
  const monthlyScope2 = cert.byMonth.reduce((s, m) => s + m.scope2, 0)
  const monthlyScope3 = cert.byMonth.reduce((s, m) => s + m.scope3, 0)

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="text-xs text-gray-500 hover:text-gray-300 mb-2 flex items-center gap-1">← Retour</button>
          <h1 className="text-2xl font-bold text-white">{cert.assessmentName}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{cert.companyName} · {cert.siteName} · {cert.assessmentYear}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full flex-shrink-0 ${s.cls}`}>
          {s.icon}{s.label}
        </span>
      </div>

      {/* ── Result banner ──────────────────────────────────────────────────── */}
      {cert.status === 'certified' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-400">Bilan certifié</p>
            <p className="text-xs text-green-500 mt-0.5">
              {fmtDate(cert.certifiedAt)}
              {cert.certificateNumber && ` · Certificat n° ${cert.certificateNumber}`}
              {cert.expertName && ` · Par ${cert.expertName}`}
            </p>
          </div>
        </div>
      )}
      {cert.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">Bilan rejeté</p>
            {cert.rejectionReason && <p className="text-xs text-red-400/80 mt-0.5">{cert.rejectionReason}</p>}
          </div>
        </div>
      )}

      {/* ── Admin actions ─────────────────────────────────────────────────── */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Actions administrateur</p>
        <div className="flex flex-wrap gap-2">
          {cert.status === 'pending' && (
            <button onClick={() => openModal('assign')}
              className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
              Assigner un expert
            </button>
          )}
          {cert.status === 'assigned' && (
            <button onClick={() => quickAction('in_progress')}
              className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-colors">
              Marquer en cours
            </button>
          )}
          {['pending', 'assigned', 'in_progress'].includes(cert.status) && (
            <button onClick={() => openModal('reject')}
              className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
              Rejeter
            </button>
          )}
          <button onClick={() => openModal('notes')}
            className="text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
            Notes admin
          </button>
        </div>
        {cert.adminNotes && (
          <p className="mt-3 text-xs text-gray-400 bg-gray-700/40 rounded-lg px-3 py-2 border-l-2 border-gray-600">
            <span className="text-gray-500">Notes : </span>{cert.adminNotes}
          </p>
        )}
      </div>

      {/* ── Expert info ───────────────────────────────────────────────────── */}
      {cert.expertName && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Expert assigné</p>
            <p className="text-sm font-medium text-white">{cert.expertName}</p>
            {cert.expertEmail && <p className="text-xs text-gray-400">{cert.expertEmail}</p>}
            {cert.inspectionDate && (
              <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />Inspection prévue : {fmtDate(cert.inspectionDate)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── CO₂ Summary ─────────────────────────────────────────────────── */}
      <Card title="Bilan carbone — Synthèse" icon={FileText}>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {([1, 2, 3] as const).map(sc => (
            <div key={sc} className={`rounded-xl p-3 ${SCOPE_BG[sc]}`}>
              <p className="text-xs text-gray-400">Scope {sc}</p>
              <p className={`text-sm font-bold mt-0.5 ${SCOPE_TEXT[sc]}`}>
                {fmt(sc === 1 ? Number(cert.scope1) : sc === 2 ? Number(cert.scope2) : Number(cert.scope3))}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-2.5 mb-4">
          <ScopeBar label="Scope 1 — Émissions directes"  value={Number(cert.scope1)} total={total} color={SCOPE_COLORS[1]} />
          <ScopeBar label="Scope 2 — Énergie indirecte"   value={Number(cert.scope2)} total={total} color={SCOPE_COLORS[2]} />
          <ScopeBar label="Scope 3 — Autres indirectes"   value={Number(cert.scope3)} total={total} color={SCOPE_COLORS[3]} />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div>
            <span className="text-sm text-gray-400">Total CO₂ éq. — </span>
            <span className="text-xs text-gray-500">{cert.entries.length} source{cert.entries.length !== 1 ? 's' : ''} · {cert.approach ?? 'contrôle opérationnel'}</span>
          </div>
          <span className="text-lg font-bold text-brand-400">{fmt(total)}</span>
        </div>
      </Card>

      {/* ── Pre-validation ────────────────────────────────────────────────── */}
      {(() => {
        const checks = computePreChecks(cert)
        const passCount = checks.filter(c => c.status === 'pass').length
        const warnCount = checks.filter(c => c.status === 'warning').length
        const failCount = checks.filter(c => c.status === 'fail').length
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />Pré-validation automatique
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{passCount} OK</span>
                {warnCount > 0 && <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />{warnCount} avert.</span>}
                {failCount  > 0 && <span className="flex items-center gap-1 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />{failCount} échec</span>}
              </div>
            </div>
            <div className="divide-y divide-gray-700/40">
              {checks.map((chk, i) => {
                const { icon: Icon, cls } = CHECK_STYLE[chk.status]
                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cls}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${cls}`}>{chk.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{chk.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── By category ─────────────────────────────────────────────────── */}
      {cert.byCategory.length > 0 && (
        <Card title="Répartition par catégorie" icon={BarChart3}>
          <div className="space-y-2.5">
            {cert.byCategory.map(cat => {
              const pct = total > 0 ? (cat.total / total) * 100 : 0
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${SCOPE_BG[cat.scope]} ${SCOPE_TEXT[cat.scope]}`}>S{cat.scope}</span>
                      <span className="text-gray-300">{CAT_LABELS[cat.category] ?? cat.category}</span>
                      <span className="text-gray-600">{cat.count} source{cat.count > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-white font-medium">{fmt(cat.total)} <span className="text-gray-500">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── Monthly breakdown ────────────────────────────────────────────── */}
      {activeMonths.length > 0 && (
        <Card title="Ventilation mensuelle" icon={TrendingUp}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-500 pb-2 pr-3">Mois</th>
                  <th className="text-right text-green-400/80 pb-2 px-2">Scope 1</th>
                  <th className="text-right text-blue-400/80 pb-2 px-2">Scope 2</th>
                  <th className="text-right text-amber-400/80 pb-2 px-2">Scope 3</th>
                  <th className="text-right text-gray-300 pb-2 pl-2">Total</th>
                  <th className="w-20 pb-2 pl-4"></th>
                </tr>
              </thead>
              <tbody>
                {cert.byMonth.map(m => (
                  <tr key={m.month} className={`border-b border-gray-700/30 ${m.total === 0 ? 'opacity-25' : ''}`}>
                    <td className="py-1.5 pr-3 text-gray-300 font-medium">{m.label}</td>
                    <td className="py-1.5 px-2 text-right text-green-400">{m.scope1 > 0 ? fmt(m.scope1) : '—'}</td>
                    <td className="py-1.5 px-2 text-right text-blue-400">{m.scope2 > 0 ? fmt(m.scope2) : '—'}</td>
                    <td className="py-1.5 px-2 text-right text-amber-400">{m.scope3 > 0 ? fmt(m.scope3) : '—'}</td>
                    <td className="py-1.5 pl-2 text-right text-white font-semibold">{m.total > 0 ? fmt(m.total) : '—'}</td>
                    <td className="py-1.5 pl-4">
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden w-20">
                        <div className="h-full bg-brand-500/60 rounded-full" style={{ width: `${(m.total / maxMonth) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-600 font-semibold">
                  <td className="py-2 pr-3 text-gray-200 text-xs">Total annuel</td>
                  <td className="py-2 px-2 text-right text-green-400 text-xs">{monthlyScope1 > 0 ? fmt(monthlyScope1) : '—'}</td>
                  <td className="py-2 px-2 text-right text-blue-400 text-xs">{monthlyScope2 > 0 ? fmt(monthlyScope2) : '—'}</td>
                  <td className="py-2 px-2 text-right text-amber-400 text-xs">{monthlyScope3 > 0 ? fmt(monthlyScope3) : '—'}</td>
                  <td className="py-2 pl-2 text-right text-white text-xs">{fmt(monthlyTotal)}</td>
                  <td className="py-2 pl-4" />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Annual entries ────────────────────────────────────────────────── */}
      {annualEntries.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-300 px-5 py-4 flex items-center justify-between border-b border-gray-700">
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Données annuelles</span>
            <span className="text-xs text-gray-500">{annualEntries.length} source{annualEntries.length > 1 ? 's' : ''}</span>
          </h2>
          {([1, 2, 3] as const).map(scope => {
            const scopeAnnual = annualEntries.filter(e => e.scope === scope)
            if (!scopeAnnual.length) return null
            const scopeTotal = scopeAnnual.reduce((s, e) => s + e.totalCo2eq, 0)
            return (
              <div key={scope} className="border-b border-gray-700/50 last:border-0">
                <div className="flex items-center justify-between px-5 py-2.5 bg-gray-700/20">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${SCOPE_BG[scope]} ${SCOPE_TEXT[scope]}`}>Scope {scope}</span>
                  <span className={`text-sm font-bold ${SCOPE_TEXT[scope]}`}>{fmt(scopeTotal)}</span>
                </div>
                <div className="px-5 pb-3 overflow-x-auto">
                  <table className="w-full text-xs mt-2">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-500 font-medium pb-2 pr-2">Source</th>
                        <th className="text-right text-gray-500 font-medium pb-2 px-2">Quantité</th>
                        <th className="text-right text-gray-500 font-medium pb-2 pl-2">CO₂ éq.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scopeAnnual.map(e => (
                        <tr key={e.id} className="border-b border-gray-700/20 last:border-0">
                          <td className="py-2 pr-2 text-gray-200">{e.factorName}</td>
                          <td className="py-2 px-2 text-right text-gray-300">{e.quantity.toFixed(2)} <span className="text-gray-500">{e.unit}</span></td>
                          <td className={`py-2 pl-2 text-right font-semibold ${SCOPE_TEXT[e.scope]}`}>{fmt(e.totalCo2eq)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Top emitters ─────────────────────────────────────────────────── */}
      {cert.topEmitters.length > 0 && (
        <Card title="Top émetteurs" icon={Award}>
          <div className="space-y-1">
            {cert.topEmitters.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-700/40 last:border-0">
                <span className="text-xs text-gray-600 w-5 flex-shrink-0">{i + 1}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${SCOPE_BG[e.scope]} ${SCOPE_TEXT[e.scope]}`}>S{e.scope}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-200 truncate">{e.name}</p>
                  <p className="text-xs text-gray-500">{CAT_LABELS[e.category] ?? e.category} · {e.quantity.toFixed(2)} {e.unit}</p>
                </div>
                <span className="text-xs font-semibold text-white flex-shrink-0">{fmt(e.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Emission entries by scope ─────────────────────────────────────── */}
      {cert.entries.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-300 px-5 py-4 flex items-center gap-2 border-b border-gray-700">
            <Layers className="w-4 h-4" />
            Détail des entrées ({cert.entries.length} source{cert.entries.length !== 1 ? 's' : ''})
          </h2>
          {([1, 2, 3] as const).map(scope => {
            const scopeEntries = entriesByScope[scope]
            if (!scopeEntries?.length) return null
            const scopeTotal = scopeEntries.reduce((s, e) => s + e.totalCo2eq, 0)
            const isOpen = openScope === scope
            return (
              <div key={scope} className="border-b border-gray-700/50 last:border-0">
                <button
                  onClick={() => setOpenScope(isOpen ? null : scope)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${SCOPE_BG[scope]} ${SCOPE_TEXT[scope]}`}>Scope {scope}</span>
                    <span className="text-sm text-gray-300">{scopeEntries.length} source{scopeEntries.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${SCOPE_TEXT[scope]}`}>{fmt(scopeTotal)}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left text-gray-500 font-medium pb-2 pr-2">Source</th>
                          <th className="text-left text-gray-500 font-medium pb-2 px-2 hidden md:table-cell">Catégorie</th>
                          <th className="text-right text-gray-500 font-medium pb-2 px-2">Quantité</th>
                          <th className="text-right text-gray-500 font-medium pb-2 px-2 hidden sm:table-cell">Mois</th>
                          <th className="text-right text-gray-500 font-medium pb-2 pl-2">CO₂ éq.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scopeEntries.map(e => (
                          <tr key={e.id} className="border-b border-gray-700/20 last:border-0">
                            <td className="py-2 pr-2">
                              <p className="text-gray-200">{e.factorName}</p>
                              {e.subcategory && <p className="text-gray-600">{e.subcategory}</p>}
                            </td>
                            <td className="py-2 px-2 text-gray-400 hidden md:table-cell">{CAT_LABELS[e.category] ?? e.category}</td>
                            <td className="py-2 px-2 text-right text-gray-300">{e.quantity.toFixed(2)} <span className="text-gray-500">{e.unit}</span></td>
                            <td className="py-2 px-2 text-right text-gray-400 hidden sm:table-cell">{e.month ? MONTH_NAMES[e.month] : '—'}</td>
                            <td className={`py-2 pl-2 text-right font-semibold ${SCOPE_TEXT[e.scope]}`}>{fmt(e.totalCo2eq)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Company info ─────────────────────────────────────────────────── */}
      <Card title="Entreprise" icon={Building2}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-gray-500">Nom</p><p className="text-white">{cert.companyName}</p></div>
          <div><p className="text-xs text-gray-500">Secteur</p><p className="text-white">{cert.sector || '—'}</p></div>
          <div><p className="text-xs text-gray-500">Site</p><p className="text-white">{cert.siteName}</p></div>
          {cert.rccm && <div><p className="text-xs text-gray-500">RCCM</p><p className="text-white font-mono text-xs">{cert.rccm}</p></div>}
          {cert.siteAddress && <div className="col-span-2"><p className="text-xs text-gray-500">Adresse</p><p className="text-white">{cert.siteAddress}</p></div>}
        </div>
        {cert.companyMessage && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-1">Message de l&apos;entreprise</p>
            <p className="text-sm text-gray-300 italic">{cert.companyMessage}</p>
          </div>
        )}
      </Card>

      {/* ── Inspection notes (from expert) ────────────────────────────────── */}
      {cert.inspectionNotes && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Notes d&apos;inspection (expert)</p>
          <p className="text-sm text-gray-300">{cert.inspectionNotes}</p>
        </div>
      )}

      {/* ── Inspection checklist (read-only) ─────────────────────────────── */}
      {cert.inspectionChecklist && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <ListChecks className="w-4 h-4" />Grille d&apos;inspection ISO 14064
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${checklistPct}%` }} />
              </div>
              <span className="text-xs font-medium text-gray-400">{checkedCount}/{CHECKLIST.length}</span>
            </div>
          </div>
          <div className="p-5 space-y-5">
            {sections.map(section => (
              <div key={section}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{section}</p>
                <div className="space-y-2">
                  {CHECKLIST.map((item, i) => {
                    if (item.section !== section) return null
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${checklist[i] ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-700/20 border border-gray-700/40'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border ${checklist[i] ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-600'}`}>
                          {checklist[i] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-sm leading-snug ${checklist[i] ? 'text-green-300' : 'text-gray-400'}`}>{item.text}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Documents ────────────────────────────────────────────────────── */}
      {cert.documents.length > 0 && (
        <Card title={`Documents joints (${cert.documents.length})`} icon={FileText}>
          <div className="space-y-2">
            {cert.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between py-1.5 border-b border-gray-700/40 last:border-0">
                <div>
                  <p className="text-sm text-gray-200">{doc.originalName}</p>
                  <p className="text-xs text-gray-500">{doc.docType} · {(doc.fileSize / 1024).toFixed(1)} Ko · {fmtDate(doc.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">
                {modalMode === 'assign' && 'Assigner un expert'}
                {modalMode === 'reject' && 'Rejeter la demande'}
                {modalMode === 'notes' && 'Notes administrateur'}
              </h2>
              <button onClick={() => setModalMode(null)} className="p-1.5 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">{cert.companyName} · {cert.assessmentName}</p>

              {modalMode === 'assign' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">Expert certifieur *</label>
                    {experts.length === 0 ? (
                      <p className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5">
                        Aucun expert enregistré. Créez-en un dans la section <strong>Experts</strong>.
                      </p>
                    ) : (
                      <select value={expertUserId} onChange={e => setExpertUserId(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500">
                        <option value="">Sélectionner un expert...</option>
                        {experts.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.firstName} {ex.lastName} ({ex.email})</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">Date d&apos;inspection prévue</label>
                    <input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">Notes admin (internes)</label>
                    <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-none"
                      placeholder="Notes internes..." />
                  </div>
                </>
              )}

              {modalMode === 'reject' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">Motif du rejet *</label>
                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-none"
                      placeholder="Expliquer le motif du rejet..." />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">Notes admin (internes)</label>
                    <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-none" />
                  </div>
                </>
              )}

              {modalMode === 'notes' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Notes administrateur</label>
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={5}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-none"
                    placeholder="Notes internes..." />
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-700">
              <button onClick={() => setModalMode(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Annuler
              </button>
              <button
                onClick={submitModal}
                disabled={submitting || (modalMode === 'assign' && !expertUserId) || (modalMode === 'reject' && !rejectionReason)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white
                  ${modalMode === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
              >
                {submitting ? 'En cours...' : modalMode === 'assign' ? 'Assigner' : modalMode === 'reject' ? 'Rejeter' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
