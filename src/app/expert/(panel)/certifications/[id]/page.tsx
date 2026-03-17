'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, PlayCircle, FileText, Building2, Calendar,
  AlertCircle, ChevronDown, ChevronUp, Award, TrendingUp, BarChart3,
  Layers, ListChecks, Save, ClipboardList, ShieldCheck, AlertTriangle, Info
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

interface CertDetail {
  id: number; status: string; requestedAt: string; updatedAt: string
  inspectionDate: string | null; inspectionNotes: string | null
  inspectionChecklist: boolean[] | null
  certifiedAt: string | null; certificateNumber: string | null
  rejectionReason: string | null; adminNotes: string | null; companyMessage: string | null
  assessmentId: number; assessmentName: string; assessmentYear: number; approach: string | null
  totalCo2eq: number; scope1: number; scope2: number; scope3: number
  siteName: string; siteType: string; siteAddress: string | null
  companyName: string; sector: string; rccm: string | null
  entries: Entry[]; byMonth: MonthRow[]; byCategory: CatRow[]; topEmitters: TopRow[]
}

// ─── Checklist definition ─────────────────────────────────────────────────────

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

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  assigned:    { label: 'Assigné',               cls: 'bg-blue-500/20 text-blue-400' },
  in_progress: { label: "En cours d'inspection", cls: 'bg-violet-500/20 text-violet-400' },
  certified:   { label: 'Certifié',              cls: 'bg-green-500/20 text-green-400' },
  rejected:    { label: 'Rejeté',                cls: 'bg-red-500/20 text-red-400' },
}

// ─── Pre-validation ───────────────────────────────────────────────────────────

type CheckStatus = 'pass' | 'warning' | 'fail' | 'info'
interface PreCheck { status: CheckStatus; label: string; detail: string }

function computePreChecks(cert: CertDetail): PreCheck[] {
  const checks: PreCheck[] = []
  const entries = cert.entries
  const total   = Number(cert.totalCo2eq) || 0
  const s1      = Number(cert.scope1) || 0
  const s2      = Number(cert.scope2) || 0
  const s3      = Number(cert.scope3) || 0

  // 1 — Cohérence des totaux
  if (total === 0) {
    checks.push({ status: 'fail', label: 'Total CO₂ nul', detail: 'Aucune émission enregistrée dans ce bilan' })
  } else {
    const sumScopes = s1 + s2 + s3
    const diffPct   = Math.abs(sumScopes - total) / total * 100
    if (diffPct < 1) {
      checks.push({ status: 'pass', label: 'Cohérence des totaux', detail: `S1+S2+S3 = ${fmt(sumScopes)} ≈ total (écart ${diffPct.toFixed(2)}%)` })
    } else {
      checks.push({ status: 'fail', label: 'Incohérence des totaux', detail: `S1+S2+S3 = ${fmt(sumScopes)} ≠ total ${fmt(total)} (écart ${diffPct.toFixed(1)}%)` })
    }
  }

  // 2 — Scopes présents (informatif)
  for (const sc of [1, 2, 3] as const) {
    const scopeEntries = entries.filter(e => e.scope === sc)
    const scopeTotal   = scopeEntries.reduce((s, e) => s + e.totalCo2eq, 0)
    if (scopeEntries.length > 0) {
      checks.push({ status: 'info', label: `Scope ${sc} présent`, detail: `${scopeEntries.length} source${scopeEntries.length > 1 ? 's' : ''} — ${fmt(scopeTotal)}` })
    } else {
      checks.push({ status: 'info', label: `Scope ${sc} absent`, detail: 'Aucune donnée — absence à justifier si applicable' })
    }
  }

  // 3 — Entrées sans valeur
  const zeroEntries = entries.filter(e => e.quantity === 0 || e.totalCo2eq === 0)
  if (zeroEntries.length === 0) {
    checks.push({ status: 'pass', label: 'Entrées valides', detail: `Toutes les ${entries.length} sources ont des valeurs non nulles` })
  } else {
    const names = zeroEntries.slice(0, 3).map(e => e.factorName).join(', ') + (zeroEntries.length > 3 ? '…' : '')
    checks.push({ status: 'warning', label: `${zeroEntries.length} entrée${zeroEntries.length > 1 ? 's' : ''} sans valeur`, detail: names })
  }

  // 4 — Facteurs d'émission
  const zeroFactor = entries.filter(e => e.factorValue === 0)
  if (zeroFactor.length === 0) {
    checks.push({ status: 'pass', label: 'Facteurs d\'émission', detail: 'Tous les facteurs sont renseignés (> 0)' })
  } else {
    const names = zeroFactor.slice(0, 3).map(e => e.factorName).join(', ') + (zeroFactor.length > 3 ? '…' : '')
    checks.push({ status: 'warning', label: `${zeroFactor.length} facteur${zeroFactor.length > 1 ? 's' : ''} manquant${zeroFactor.length > 1 ? 's' : ''}`, detail: names })
  }

  // 5 — Couverture mensuelle
  const hasMonthly = entries.some(e => e.month && e.month > 0)
  if (hasMonthly) {
    const monthsWithData = new Set(entries.filter(e => e.month && e.month > 0).map(e => e.month)).size
    const pct = Math.round(monthsWithData / 12 * 100)
    if (monthsWithData >= 10) {
      checks.push({ status: 'pass', label: 'Couverture mensuelle', detail: `${monthsWithData}/12 mois couverts (${pct}%)` })
    } else if (monthsWithData >= 6) {
      checks.push({ status: 'warning', label: 'Couverture mensuelle partielle', detail: `${monthsWithData}/12 mois (${pct}%) — lacunes à justifier` })
    } else {
      checks.push({ status: 'warning', label: 'Faible couverture mensuelle', detail: `${monthsWithData}/12 mois (${pct}%) — vérifier si saisie annuelle intentionnelle` })
    }
  } else {
    checks.push({ status: 'info', label: 'Données annuelles', detail: 'Aucune ventilation mensuelle — saisie annuelle uniquement' })
  }

  return checks
}

const CHECK_STYLE: Record<CheckStatus, { icon: React.ComponentType<{ className?: string }>; cls: string; dot: string }> = {
  pass:    { icon: CheckCircle,   cls: 'text-green-400',  dot: 'bg-green-500' },
  warning: { icon: AlertTriangle, cls: 'text-amber-400',  dot: 'bg-amber-500' },
  fail:    { icon: XCircle,       cls: 'text-red-400',    dot: 'bg-red-500'   },
  info:    { icon: Info,          cls: 'text-blue-400',   dot: 'bg-blue-500'  },
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

export default function ExpertCertDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cert, setCert]         = useState<CertDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [notes, setNotes]       = useState('')
  const [checklist, setChecklist] = useState<boolean[]>(Array(CHECKLIST.length).fill(false))
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm]   = useState(false)
  const [openScope, setOpenScope] = useState<number | null>(null)
  const [savingChecklist, setSavingChecklist] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue]     = useState('')
  const [savingDate, setSavingDate]   = useState(false)

  const loadCert = () => {
    fetch(`/api/expert/certifications/${params.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        setCert(data)
        setNotes(data.inspectionNotes || '')
        setDateValue(data.inspectionDate ? data.inspectionDate.slice(0, 10) : '')
        if (Array.isArray(data.inspectionChecklist) && data.inspectionChecklist.length === CHECKLIST.length) {
          setChecklist(data.inspectionChecklist)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadCert() }, [params.id])

  const action = async (body: object) => {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/expert/certifications/${params.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur'); return }
      loadCert()
      setShowRejectForm(false)
    } catch { setError('Erreur de connexion.') }
    finally { setSubmitting(false) }
  }

  const toggleCheck = (i: number) => {
    if (cert?.status === 'certified' || cert?.status === 'rejected') return
    const next = [...checklist]; next[i] = !next[i]
    setChecklist(next)
    setSavingChecklist(true)
    fetch(`/api/expert/certifications/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checklist', checklist: next }),
    }).finally(() => setSavingChecklist(false))
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>
  if (!cert)   return <div className="text-center py-20 text-gray-500">Certification introuvable.</div>

  const s        = STATUS_LABELS[cert.status] || { label: cert.status, cls: 'bg-gray-700 text-gray-400' }
  const isReadOnly = cert.status === 'certified' || cert.status === 'rejected'
  const total    = Number(cert.totalCo2eq) || 0
  const checkedCount  = checklist.filter(Boolean).length
  const checklistPct  = Math.round((checkedCount / CHECKLIST.length) * 100)
  const sections = Array.from(new Set(CHECKLIST.map(c => c.section)))
  const entriesByScope: Record<number, Entry[]> = { 1: [], 2: [], 3: [] }
  for (const e of cert.entries) { if (entriesByScope[e.scope]) entriesByScope[e.scope].push(e) }
  const activeMonths = cert.byMonth.filter(m => m.total > 0)
  const maxMonth = Math.max(...cert.byMonth.map(m => m.total), 0.001)
  // Annual entries = entries with no specific month (month=null or 0)
  const annualEntries = cert.entries.filter(e => !e.month)
  const annualByScope: Record<number, Entry[]> = { 1: [], 2: [], 3: [] }
  for (const e of annualEntries) { if (annualByScope[e.scope]) annualByScope[e.scope].push(e) }
  // Monthly totals row
  const monthlyTotal  = cert.byMonth.reduce((s, m) => s + m.total,  0)
  const monthlyScope1 = cert.byMonth.reduce((s, m) => s + m.scope1, 0)
  const monthlyScope2 = cert.byMonth.reduce((s, m) => s + m.scope2, 0)
  const monthlyScope3 = cert.byMonth.reduce((s, m) => s + m.scope3, 0)
  // Per-year breakdown (for multi-year assessments)
  const yearMap: Record<number, { total: number; s1: number; s2: number; s3: number; count: number }> = {}
  for (const e of cert.entries) {
    const y = e.year || cert.assessmentYear
    if (!yearMap[y]) yearMap[y] = { total: 0, s1: 0, s2: 0, s3: 0, count: 0 }
    yearMap[y].total += e.totalCo2eq
    if (e.scope === 1) yearMap[y].s1 += e.totalCo2eq
    if (e.scope === 2) yearMap[y].s2 += e.totalCo2eq
    if (e.scope === 3) yearMap[y].s3 += e.totalCo2eq
    yearMap[y].count++
  }
  const byYear = Object.entries(yearMap)
    .map(([yr, d]) => ({ year: parseInt(yr), ...d }))
    .sort((a, b) => a.year - b.year)
  const monthlyEntryCount = cert.entries.filter(e => e.month).length

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="text-xs text-gray-500 hover:text-gray-300 mb-2 flex items-center gap-1">← Retour</button>
          <h1 className="text-2xl font-bold text-white">{cert.assessmentName}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{cert.companyName} · {cert.assessmentYear}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
      </div>

      {/* ── Top result banner (certified / rejected) ─────────────────────── */}
      {cert.status === 'certified' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-400">Bilan certifié</p>
            <p className="text-xs text-green-500 mt-0.5">
              {fmtDate(cert.certifiedAt)}
              {cert.certificateNumber && ` · Certificat n° ${cert.certificateNumber}`}
            </p>
          </div>
        </div>
      )}
      {cert.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-400">Bilan rejeté</p>
            {cert.rejectionReason && <p className="text-xs text-red-400/80 mt-0.5">{cert.rejectionReason}</p>}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
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
          <ScopeBar label="Scope 1 — Émissions directes"   value={Number(cert.scope1)} total={total} color={SCOPE_COLORS[1]} />
          <ScopeBar label="Scope 2 — Énergie indirecte"    value={Number(cert.scope2)} total={total} color={SCOPE_COLORS[2]} />
          <ScopeBar label="Scope 3 — Autres indirectes"    value={Number(cert.scope3)} total={total} color={SCOPE_COLORS[3]} />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div>
            <span className="text-sm text-gray-400">Total CO₂ éq. — </span>
            <span className="text-xs text-gray-500">{cert.entries.length} source{cert.entries.length !== 1 ? 's' : ''} · {cert.approach ?? 'contrôle opérationnel'}</span>
          </div>
          <span className="text-lg font-bold text-brand-400">{fmt(total)}</span>
        </div>
      </Card>

      {/* ── Pre-validation automatique ───────────────────────────────── */}
      {(() => {
        const checks   = computePreChecks(cert)
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

      {/* ── Annual entries (non-monthly) ──────────────────────────────── */}
      {annualEntries.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-300 px-5 py-4 flex items-center justify-between border-b border-gray-700">
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Données annuelles (non ventilées par mois)</span>
            <span className="text-xs text-gray-500">{annualEntries.length} source{annualEntries.length > 1 ? 's' : ''}</span>
          </h2>
          {([1, 2, 3] as const).map(scope => {
            const scopeAnnual = annualByScope[scope]
            if (!scopeAnnual || scopeAnnual.length === 0) return null
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
                        <th className="text-left text-gray-500 font-medium pb-2 px-2 hidden md:table-cell">Catégorie</th>
                        <th className="text-right text-gray-500 font-medium pb-2 px-2">Quantité</th>
                        <th className="text-right text-gray-500 font-medium pb-2 pl-2">CO₂ éq.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scopeAnnual.map(e => (
                        <tr key={e.id} className="border-b border-gray-700/20 last:border-0">
                          <td className="py-2 pr-2">
                            <p className="text-gray-200">{e.factorName}</p>
                            {e.subcategory && <p className="text-gray-600">{e.subcategory}</p>}
                          </td>
                          <td className="py-2 px-2 text-gray-400 hidden md:table-cell">{CAT_LABELS[e.category] ?? e.category}</td>
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
          {/* Annual subtotal */}
          <div className="px-5 py-3 bg-gray-700/30 flex items-center justify-between border-t border-gray-700">
            <span className="text-xs text-gray-400">Total données annuelles</span>
            <span className="text-sm font-bold text-white">{fmt(annualEntries.reduce((s, e) => s + e.totalCo2eq, 0))}</span>
          </div>
        </div>
      )}

      {/* ── Annual recap (always shown) ─────────────────────────────── */}
      {cert.entries.length > 0 && (
        <Card title={`Récapitulatif annuel — ${cert.assessmentYear}`} icon={Calendar}>
          {/* Type de saisie */}
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              <span className="text-gray-400">{monthlyEntryCount} entrée{monthlyEntryCount !== 1 ? 's' : ''} mensuelles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="text-gray-400">{annualEntries.length} entrée{annualEntries.length !== 1 ? 's' : ''} annuelles</span>
            </div>
            {activeMonths.length > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-gray-500">Moy. mensuelle :</span>
                <span className="text-white font-medium">{fmt(monthlyTotal / activeMonths.length)}</span>
              </div>
            )}
          </div>

          {/* Multi-year breakdown */}
          {byYear.length > 1 ? (
            <div className="space-y-3">
              {byYear.map(yr => (
                <div key={yr.year} className="border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-300 bg-gray-700 px-2 py-0.5 rounded">Année {yr.year}</span>
                    <span className="text-sm font-bold text-brand-400">{fmt(yr.total)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as const).map(sc => (
                      <div key={sc} className={`rounded-lg p-2 ${SCOPE_BG[sc]}`}>
                        <p className="text-xs text-gray-500">Scope {sc}</p>
                        <p className={`text-xs font-bold mt-0.5 ${SCOPE_TEXT[sc]}`}>{fmt(sc === 1 ? yr.s1 : sc === 2 ? yr.s2 : yr.s3)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Single year */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-1 border border-gray-700 rounded-xl p-3 flex flex-col justify-between">
                <p className="text-xs text-gray-500">Total annuel</p>
                <p className="text-xl font-bold text-brand-400 mt-1">{fmt(total)}</p>
                <p className="text-xs text-gray-600 mt-1">{cert.entries.length} source{cert.entries.length !== 1 ? 's' : ''}</p>
              </div>
              {([1, 2, 3] as const).map(sc => {
                const val = sc === 1 ? Number(cert.scope1) : sc === 2 ? Number(cert.scope2) : Number(cert.scope3)
                const pct = total > 0 ? (val / total * 100).toFixed(1) : '0'
                return (
                  <div key={sc} className={`border rounded-xl p-3 ${SCOPE_BG[sc]} border-transparent`}>
                    <p className="text-xs text-gray-400">Scope {sc}</p>
                    <p className={`text-base font-bold mt-1 ${SCOPE_TEXT[sc]}`}>{fmt(val)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pct}% du total</p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
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

      {/* ── Emission entries by scope (expandable) ───────────────────────── */}
      {cert.entries.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-300 px-5 py-4 flex items-center gap-2 border-b border-gray-700">
            <Layers className="w-4 h-4" />
            Détail des entrées ({cert.entries.length} source{cert.entries.length !== 1 ? 's' : ''})
          </h2>
          {([1, 2, 3] as const).map(scope => {
            const scopeEntries = entriesByScope[scope]
            if (!scopeEntries || scopeEntries.length === 0) return null
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
                            <td className="py-2 px-2 text-right text-gray-400 hidden sm:table-cell">
                              {e.month ? MONTH_NAMES[e.month] : '—'}
                            </td>
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

      {/* ── Inspection date / admin notes ───────────────────────────────── */}
      <div className="space-y-3">
        {/* Inspection date — always shown, editable when not read-only */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-gray-500">Date d&apos;inspection prévue</p>
            </div>
            {!isReadOnly && !editingDate && (
              <button
                onClick={() => setEditingDate(true)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {cert.inspectionDate ? 'Modifier' : 'Définir une date'}
              </button>
            )}
          </div>

          {editingDate ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="date"
                value={dateValue}
                onChange={e => setDateValue(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                disabled={savingDate}
                onClick={async () => {
                  setSavingDate(true)
                  const res = await fetch(`/api/expert/certifications/${params.id}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_date', inspectionDate: dateValue || null }),
                  })
                  if (res.ok) { loadCert(); setEditingDate(false) }
                  setSavingDate(false)
                }}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />{savingDate ? '…' : 'Sauvegarder'}
              </button>
              <button
                onClick={() => { setEditingDate(false); setDateValue(cert.inspectionDate ? cert.inspectionDate.slice(0, 10) : '') }}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-white mt-1">
              {cert.inspectionDate ? fmtDate(cert.inspectionDate) : <span className="text-gray-500 italic">Non définie</span>}
            </p>
          )}
        </div>

        {cert.adminNotes && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Notes de l&apos;administrateur</p>
            <p className="text-sm text-gray-300">{cert.adminNotes}</p>
          </div>
        )}
      </div>

      {/* ── Certificate / rejection result ──────────────────────────────── */}
      {cert.status === 'certified' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div><p className="text-sm font-bold text-green-400">Bilan certifié</p><p className="text-xs text-green-500">{fmtDate(cert.certifiedAt)}</p></div>
          </div>
          {cert.certificateNumber && <p className="text-xs text-green-400 font-mono">Certificat n° {cert.certificateNumber}</p>}
          {cert.inspectionNotes && <p className="text-sm text-gray-300 mt-2 border-t border-green-500/20 pt-2">{cert.inspectionNotes}</p>}
        </div>
      )}

      {cert.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm font-bold text-red-400">Bilan rejeté</p>
          </div>
          <p className="text-sm text-gray-300">{cert.rejectionReason}</p>
        </div>
      )}

      {/* ── Inspection checklist ─────────────────────────────────────────── */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <ListChecks className="w-4 h-4" />Grille d&apos;inspection ISO 14064
          </h2>
          <div className="flex items-center gap-3">
            {savingChecklist && <span className="text-xs text-gray-500 animate-pulse">Sauvegarde…</span>}
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${checklistPct}%` }} />
              </div>
              <span className="text-xs font-medium text-gray-400">{checkedCount}/{CHECKLIST.length}</span>
            </div>
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
                    <button
                      key={i}
                      onClick={() => toggleCheck(i)}
                      disabled={isReadOnly}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                        checklist[i]
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-gray-700/30 border border-gray-700/50 hover:border-gray-600'
                      } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        checklist[i] ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-600'
                      }`}>
                        {checklist[i] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`text-sm leading-snug ${checklist[i] ? 'text-green-300 line-through decoration-green-600' : 'text-gray-300'}`}>{item.text}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {checklistPct === 100 && !isReadOnly && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Tous les points ont été vérifiés. Vous pouvez certifier ou rejeter le bilan.
            </div>
          )}
        </div>
      </div>

      {/* ── Expert actions ───────────────────────────────────────────────── */}
      {!isReadOnly && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />Notes & décision
          </h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Notes d&apos;inspection</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Observations, résultats de vérification, remarques…"
            />
            <button
              onClick={() => action({ action: 'notes', inspectionNotes: notes })}
              disabled={submitting}
              className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />Sauvegarder les notes
            </button>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-700">
            {cert.status === 'assigned' && (
              <button onClick={() => action({ action: 'start_review' })} disabled={submitting}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <PlayCircle className="w-4 h-4" />Démarrer l&apos;inspection
              </button>
            )}
            {(cert.status === 'in_progress' || cert.status === 'assigned') && (
              <button onClick={() => action({ action: 'certify', inspectionNotes: notes })} disabled={submitting}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <CheckCircle className="w-4 h-4" />Certifier le bilan
              </button>
            )}
            {!showRejectForm && (
              <button onClick={() => setShowRejectForm(true)}
                className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <XCircle className="w-4 h-4" />Rejeter
              </button>
            )}
          </div>

          {showRejectForm && (
            <div className="border border-red-500/30 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-red-400">Motif du rejet</p>
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 resize-none"
                placeholder="Expliquer le motif du rejet…" />
              <div className="flex gap-2">
                <button onClick={() => { setShowRejectForm(false); setRejectionReason('') }}
                  className="px-4 py-2 rounded-xl bg-gray-700 text-gray-300 text-sm hover:text-white transition-colors">Annuler</button>
                <button onClick={() => action({ action: 'reject', rejectionReason })}
                  disabled={submitting || !rejectionReason.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                  Confirmer le rejet
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
