'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, ClipboardList, TrendingDown, Plus, ArrowRight, Leaf, Upload } from 'lucide-react'

interface Site {
  id: number
  name: string
  type: string
  assessment_count: number
}

interface Assessment {
  id: number
  name: string
  year: number
  status: string
  total_co2eq: number
  scope1_co2eq: number
  scope2_co2eq: number
  scope3_co2eq: number
  site_name: string
}

interface Company {
  id: number
  name: string
  sector: string | null
  logoUrl: string | null
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [company, setCompany] = useState<Company | null>(null)

  useEffect(() => {
    fetch('/api/sites').then(r => r.json()).then(setSites).catch(() => {})
    fetch('/api/assessments').then(r => r.json()).then(setAssessments).catch(() => {})
    fetch('/api/auth/me').then(r => r.json()).then(d => setCompany(d.company)).catch(() => {})
  }, [])

  const totalEmissions = assessments.reduce((sum, a) => sum + (parseFloat(String(a.total_co2eq)) || 0), 0)
  const totalScope1 = assessments.reduce((sum, a) => sum + (parseFloat(String(a.scope1_co2eq)) || 0), 0)
  const totalScope2 = assessments.reduce((sum, a) => sum + (parseFloat(String(a.scope2_co2eq)) || 0), 0)
  const totalScope3 = assessments.reduce((sum, a) => sum + (parseFloat(String(a.scope3_co2eq)) || 0), 0)

  const formatCO2 = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} ktCO2eq`
    if (value >= 1000) return `${(value / 1000).toFixed(1)} tCO2eq`
    return `${value.toFixed(0)} kgCO2eq`
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('logo', file)
    const res = await fetch('/api/company/logo', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json()
      setCompany(prev => prev ? { ...prev, logoUrl: data.logoUrl } : prev)
    }
  }

  return (
    <div>
      {/* Company welcome banner */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 flex items-center gap-5 shadow-sm">
        <div className="relative group flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100 bg-brand-50 flex items-center justify-center">
            {company?.logoUrl
              ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
              : <Leaf className="w-8 h-8 text-brand-400" />}
          </div>
          {/* Logo upload trigger */}
          <label className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <Upload className="w-5 h-5 text-white" />
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{company?.name || 'Tableau de bord'}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {company?.sector ? `${company.sector} · ` : ''}Vue d&apos;ensemble de votre empreinte carbone
          </p>
        </div>
        <Link href="/dashboard/sites" className="btn-primary inline-flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> Nouveau site
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Émissions', value: formatCO2(totalEmissions), icon: TrendingDown, color: 'brand' },
          { label: 'Scope 1 - Direct', value: formatCO2(totalScope1), icon: Leaf, color: 'red' },
          { label: 'Scope 2 - Énergie', value: formatCO2(totalScope2), icon: Leaf, color: 'orange' },
          { label: 'Scope 3 - Indirect', value: formatCO2(totalScope3), icon: Leaf, color: 'blue' },
        ].map((stat, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'brand' ? 'bg-brand-50' :
                stat.color === 'red' ? 'bg-red-50' :
                stat.color === 'orange' ? 'bg-orange-50' : 'bg-blue-50'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'brand' ? 'text-brand-600' :
                  stat.color === 'red' ? 'text-red-500' :
                  stat.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                }`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sites */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Sites & Entités</h2>
            <Link href="/dashboard/sites" className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {sites.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aucun site enregistré</p>
              <Link href="/dashboard/sites" className="btn-primary inline-flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Ajouter un site
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sites.slice(0, 5).map(site => (
                <div key={site.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-brand-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{site.name}</p>
                      <p className="text-xs text-gray-400">{site.type} &bull; {site.assessment_count} bilan(s)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent assessments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Bilans récents</h2>
            <Link href="/dashboard/assessments" className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aucun bilan carbone</p>
              <Link href="/dashboard/assessments" className="btn-primary inline-flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Nouveau bilan
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.slice(0, 5).map(a => (
                <Link key={a.id} href={`/dashboard/assessments/${a.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-brand-50 transition-colors block">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.site_name} &bull; {a.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCO2(parseFloat(String(a.total_co2eq)) || 0)}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">S1: {formatCO2(parseFloat(String(a.scope1_co2eq)) || 0)}</span>
                      <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full">S2: {formatCO2(parseFloat(String(a.scope2_co2eq)) || 0)}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">S3: {formatCO2(parseFloat(String(a.scope3_co2eq)) || 0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
