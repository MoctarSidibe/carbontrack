'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2, Users, CreditCard, Award, TrendingUp,
  AlertCircle, Leaf, BarChart3, FileCheck, RefreshCw,
  UserCheck, Clock, CheckCircle2, XCircle, Activity,
  ArrowRight, Globe2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Stats {
  companies: number
  users: number
  activeSubscriptions: number
  totalRevenue: number
  assessments: number
  totalEmissions: number
  certifications: number
  experts: number
  certByStatus: Record<string, number>
  recentCompanies: {
    id: number; name: string; sector: string; createdAt: string
    userCount: number; assessmentCount: number; hasActiveSub: boolean
  }[]
  recentCerts: {
    id: number; status: string; requestedAt: string; updatedAt: string
    certificateNumber: string | null; expertName: string | null
    assessmentName: string; assessmentYear: number
    companyName: string; companySector: string
  }[]
  expiringSoon: { name: string; expiresAt: string; daysLeft: number }[]
  monthlyRevenue: { month: string; revenue: number; count: number }[]
  expertWorkload: { expert_name: string; total: number; active: number }[]
}

const SECTORS: Record<string, string> = {
  petrole_gaz: 'Pétrole & Gaz', mines: 'Mines', foresterie: 'Foresterie',
  agriculture: 'Agriculture', peche: 'Pêche', eau: 'Eau', energie: 'Énergie',
  industrie: 'Industrie', construction: 'Construction', chimie: 'Chimie',
  agroalimentaire: 'Agroalim.', emballage: 'Emballage',
  commerce: 'Commerce', transport: 'Transport', banque: 'Finance',
  telecom: 'Télécom', tech: 'Tech', sante: 'Santé', education: 'Éducation',
  immobilier: 'Immobilier', tourisme: 'Tourisme', medias: 'Médias',
  administration: 'Admin. publique', ong: 'ONG', organisations_int: 'Org. internationale',
  autre: 'Autre',
}

const CERT_STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  pending:    { label: 'En attente',    dot: 'bg-yellow-400', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  assigned:   { label: 'Assigné',       dot: 'bg-blue-400',   badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  in_progress:{ label: 'En cours',      dot: 'bg-violet-400', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  audit_done: { label: 'Audit terminé', dot: 'bg-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  certified:  { label: 'Certifié ✓',   dot: 'bg-green-400',  badge: 'bg-green-500/15 text-green-300 border-green-500/30' },
  rejected:   { label: 'Rejeté',        dot: 'bg-red-400',    badge: 'bg-red-500/15 text-red-300 border-red-500/30' },
}

function fmtFCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K FCFA`
  return `${n.toLocaleString()} FCFA`
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtMonth(m: string) {
  return new Date(m).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}
function fmtTons(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M tCO₂e`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K tCO₂e`
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} tCO₂e`
}

// Metric card for the dark theme
function KPI({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
      <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        data.recentCompanies ??= []
        data.recentCerts     ??= []
        data.expiringSoon    ??= []
        data.monthlyRevenue  ??= []
        data.expertWorkload  ??= []
        data.certByStatus    ??= {}
        setStats(data)
        setLastRefresh(new Date())
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gray-600 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800 rounded-xl p-4">
        <AlertCircle className="w-5 h-5" />
        Impossible de charger les statistiques.
        <button onClick={() => load()} className="ml-auto text-sm underline">Réessayer</button>
      </div>
    )
  }

  const pendingCerts   = stats.certByStatus['pending']     || 0
  const assignedCerts  = (stats.certByStatus['assigned']   || 0) + (stats.certByStatus['in_progress'] || 0) + (stats.certByStatus['audit_done'] || 0)
  const certifiedCount = stats.certByStatus['certified']   || 0
  const rejectedCount  = stats.certByStatus['rejected']    || 0

  const revenueChartData = stats.monthlyRevenue.map(r => ({
    month: fmtMonth(r.month),
    revenue: +(r.revenue / 1_000_000).toFixed(2),
    count: r.count,
  }))

  const pipelineSteps = [
    { label: 'En attente',  value: pendingCerts,   color: '#eab308' },
    { label: 'En cours',    value: assignedCerts,  color: '#8b5cf6' },
    { label: 'Certifiés',   value: certifiedCount, color: '#22c55e' },
    { label: 'Rejetés',     value: rejectedCount,  color: '#ef4444' },
  ]

  const certRate = stats.certifications > 0
    ? Math.round((certifiedCount / stats.certifications) * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Vue d&apos;ensemble de la plateforme CarbonTrack
            {lastRefresh && (
              <span className="ml-2 text-gray-600">· {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 hover:border-brand-500 text-gray-400 hover:text-brand-400 rounded-xl text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ── Expiry alerts ── */}
      {stats.expiringSoon.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">{stats.expiringSoon.length} abonnement{stats.expiringSoon.length > 1 ? 's' : ''} expire bientôt</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.expiringSoon.map(e => (
              <div key={e.name} className="flex items-center gap-2 bg-gray-800 border border-amber-700/30 rounded-lg px-3 py-1.5">
                <span className="text-sm text-white">{e.name}</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${e.daysLeft <= 7 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {e.daysLeft}j
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Entreprises"       value={stats.companies}           icon={Building2}  color="bg-blue-600" />
        <KPI label="Abonnements actifs" value={stats.activeSubscriptions}  icon={CreditCard} color="bg-brand-600"
             sub={`${stats.companies - stats.activeSubscriptions} inactif${stats.companies - stats.activeSubscriptions > 1 ? 's' : ''}`} />
        <KPI label="Revenu total"      value={fmtFCFA(stats.totalRevenue)} icon={TrendingUp}  color="bg-emerald-600" />
        <KPI label="Experts GreenLeaves" value={stats.experts}            icon={UserCheck}  color="bg-violet-600" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Utilisateurs"       value={stats.users}              icon={Users}       color="bg-indigo-600" />
        <KPI label="Bilans carbone"     value={stats.assessments}        icon={BarChart3}   color="bg-orange-600" />
        <KPI label="Certifications"     value={stats.certifications}     icon={Award}       color="bg-yellow-600"
             sub={`${certRate}% de succès`} />
        <KPI label="Émissions totales"  value={fmtTons(stats.totalEmissions)} icon={Leaf}   color="bg-teal-600" />
      </div>

      {/* ── Certification pipeline + pending action ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Pipeline bar */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-white">Pipeline des certifications</h2>
            </div>
            <Link href="/admin/certifications" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Gérer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {pipelineSteps.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-gray-400">{s.label}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ backgroundColor: s.color, width: stats.certifications > 0 ? `${Math.min(100, (s.value / stats.certifications) * 100)}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
          {pendingCerts > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-xs text-yellow-300">
                <strong>{pendingCerts}</strong> certification{pendingCerts > 1 ? 's' : ''} en attente d&apos;assignation expert
              </span>
              <Link href="/admin/certifications" className="ml-auto text-xs text-yellow-400 underline">Assigner →</Link>
            </div>
          )}
        </div>

        {/* Expert workload */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Charge des experts</h2>
          </div>
          {stats.expertWorkload.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Aucun expert enregistré</p>
          ) : (
            <div className="space-y-3">
              {stats.expertWorkload.map(e => (
                <div key={e.expert_name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300 truncate max-w-[140px]">{e.expert_name}</span>
                    <span className="text-xs text-gray-400">{e.active} actif{e.active > 1 ? 's' : ''} / {e.total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: e.total > 0 ? `${Math.min(100, (e.active / Math.max(...stats.expertWorkload.map(x => x.total), 1)) * 100)}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/experts" className="mt-4 flex items-center justify-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Gérer les experts <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Monthly revenue */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Revenus — 6 derniers mois (M FCFA)</h2>
            </div>
          </div>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#f9fafb', fontWeight: 600 }}
                  formatter={(v: number) => [`${v.toFixed(2)}M FCFA`, 'Revenu']}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {revenueChartData.map((_, i) => (
                    <Cell key={i} fill={i === revenueChartData.length - 1 ? '#22c55e' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">
              Pas encore de données
            </div>
          )}
        </div>

        {/* Recent companies */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Dernières entreprises</h2>
            </div>
            <Link href="/admin/companies" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {stats.recentCompanies.length === 0 && (
              <p className="text-gray-500 text-sm">Aucune entreprise.</p>
            )}
            {stats.recentCompanies.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {SECTORS[c.sector] || c.sector || '—'} · {c.assessmentCount} bilan{c.assessmentCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${
                  c.hasActiveSub ? 'bg-green-500/15 text-green-300 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
                }`}>
                  {c.hasActiveSub ? 'Actif' : 'Inactif'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent certifications ── */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Activité récente — Certifications</h2>
          </div>
          <Link href="/admin/certifications" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            Voir tout <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {stats.recentCerts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Aucune certification.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-700">
                  <th className="text-left py-2 pr-4 font-medium">Entreprise</th>
                  <th className="text-left py-2 pr-4 font-medium">Bilan</th>
                  <th className="text-left py-2 pr-4 font-medium">Expert</th>
                  <th className="text-left py-2 pr-4 font-medium">Mise à jour</th>
                  <th className="text-left py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {stats.recentCerts.map(c => {
                  const s = CERT_STATUS[c.status] ?? { label: c.status, dot: 'bg-gray-400', badge: 'bg-gray-700 text-gray-300 border-gray-600' }
                  return (
                    <tr key={c.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-white truncate max-w-[140px]">{c.companyName}</p>
                        <p className="text-xs text-gray-500">{SECTORS[c.companySector] || c.companySector || '—'}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-300 text-xs">
                        <span className="truncate block max-w-[120px]">{c.assessmentName}</span>
                        <span className="text-gray-500">{c.assessmentYear}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-gray-400">
                        {c.expertName || <span className="text-gray-600 italic">Non assigné</span>}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-gray-500">{fmtDate(c.updatedAt)}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bottom indicators ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Globe2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Émissions comptabilisées</p>
            <p className="text-lg font-bold text-white">{fmtTons(stats.totalEmissions)}</p>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Taux de certification</p>
            <p className="text-lg font-bold text-white">{certRate}%</p>
            <p className="text-xs text-gray-500">{certifiedCount} certifiés / {stats.certifications} total</p>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">En attente d'assignation</p>
            <p className="text-lg font-bold text-white">{pendingCerts}</p>
            <Link href="/admin/certifications" className="text-xs text-brand-400 hover:text-brand-300">Traiter →</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
