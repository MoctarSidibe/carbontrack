'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Users, CreditCard, Award, TrendingUp,
  AlertCircle, Leaf, BarChart3
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  companies: number
  users: number
  subscriptions: number
  activeSubscriptions: number
  totalRevenue: number
  assessments: number
  totalEmissions: number
  certifications: number
  certByStatus: Record<string, number>
  recentCompanies: {
    id: number
    name: string
    sector: string
    createdAt: string
    userCount: number
    hasActiveSub: boolean
  }[]
  monthlyRevenue: { month: string; revenue: number; count: number }[]
}

const SECTORS: Record<string, string> = {
  agriculture: 'Agriculture',
  industrie: 'Industrie',
  transport: 'Transport',
  energie: 'Énergie',
  construction: 'Construction',
  commerce: 'Commerce',
  services: 'Services',
  mining: 'Mines & Extraction',
  telecom: 'Télécommunications',
  banque: 'Banque & Finance',
  sante: 'Santé',
  education: 'Éducation',
  autre: 'Autre',
}

function formatFCFA(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M FCFA`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K FCFA`
  return `${amount.toLocaleString()} FCFA`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMonth(m: string) {
  return new Date(m).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center animate-pulse">
          <Leaf className="w-6 h-6 text-white" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
        <AlertCircle className="w-5 h-5" />
        <span>Impossible de charger les statistiques.</span>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Entreprises',
      value: stats.companies,
      icon: Building2,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    {
      label: 'Utilisateurs',
      value: stats.users,
      icon: Users,
      color: 'bg-violet-500',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
    },
    {
      label: 'Abonnements actifs',
      value: `${stats.activeSubscriptions} / ${stats.subscriptions}`,
      icon: CreditCard,
      color: 'bg-brand-500',
      bg: 'bg-brand-50',
      text: 'text-brand-700',
    },
    {
      label: 'Revenu total',
      value: formatFCFA(stats.totalRevenue),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    },
    {
      label: 'Bilans carbone',
      value: stats.assessments,
      icon: BarChart3,
      color: 'bg-orange-500',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
    },
    {
      label: 'Certifications',
      value: stats.certifications,
      icon: Award,
      color: 'bg-yellow-500',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      badge: undefined,
    },
  ]

  const revenueData = stats.monthlyRevenue.map(r => ({
    month: formatMonth(r.month),
    revenue: r.revenue / 1_000_000,
    count: r.count,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-gray-400 text-sm mt-1">Vue d&apos;ensemble de la plateforme CarbonTrack</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certifications breakdown */}
      {(() => {
        const s = stats.certByStatus
        const pending    = s['pending']    || 0
        const assigned   = s['assigned']   || 0
        const inProgress = s['in_progress']|| 0
        const certified  = s['certified']  || 0
        const rejected   = s['rejected']   || 0
        const active     = pending + assigned + inProgress
        const breakdown = [
          { label: 'En attente',  value: pending,    dot: 'bg-gray-400',   text: 'text-gray-300'   },
          { label: 'Assignés',    value: assigned,   dot: 'bg-blue-500',   text: 'text-blue-400'   },
          { label: 'En cours',    value: inProgress, dot: 'bg-violet-500', text: 'text-violet-400' },
          { label: 'Certifiés',   value: certified,  dot: 'bg-green-500',  text: 'text-green-400'  },
          { label: 'Rejetés',     value: rejected,   dot: 'bg-red-500',    text: 'text-red-400'    },
        ]
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <h2 className="text-sm font-semibold text-white">Certifications — statuts</h2>
              </div>
              {active > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full">
                  {active} en cours de traitement
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-3">
              {breakdown.map(b => (
                <div key={b.label} className="text-center">
                  <div className={`text-2xl font-bold ${b.text}`}>{b.value}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${b.dot} inline-block`} />
                    <span className="text-xs text-gray-500">{b.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Revenus mensuels (M FCFA)</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#f9fafb' }}
                  itemStyle={{ color: '#22c55e' }}
                  formatter={(v: number) => [`${v.toFixed(2)}M FCFA`, 'Revenu']}
                />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">
              Pas de données disponibles
            </div>
          )}
        </div>

        {/* Recent companies */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Dernières entreprises inscrites</h2>
            <a href="/admin/companies" className="text-xs text-brand-400 hover:text-brand-300">Voir tout →</a>
          </div>
          <div className="space-y-3">
            {stats.recentCompanies.length === 0 && (
              <p className="text-gray-500 text-sm">Aucune entreprise.</p>
            )}
            {stats.recentCompanies.map(c => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{SECTORS[c.sector] || c.sector} · {formatDate(c.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-gray-500">{c.userCount} user{c.userCount > 1 ? 's' : ''}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.hasActiveSub ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {c.hasActiveSub ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total emissions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total émissions carbone comptabilisées</p>
            <p className="text-xl font-bold text-white">
              {stats.totalEmissions.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} tCO₂e
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
