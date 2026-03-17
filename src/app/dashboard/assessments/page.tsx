'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus, X, Calendar, Building2, Award, Shield } from 'lucide-react'

interface Site { id: number; name: string; type: string }
interface Assessment {
  id: number; name: string; year: number; status: string;
  total_co2eq: number; site_name: string; site_type: string;
  scope1_co2eq: number; scope2_co2eq: number; scope3_co2eq: number;
}

export default function AssessmentsPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ siteId: '', name: '', year: new Date().getFullYear(), approach: 'operational_control' })
  const [loading, setLoading] = useState(false)
  const [certStatuses, setCertStatuses] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch('/api/sites').then(r => r.json()).then(setSites).catch(() => {})
    fetch('/api/assessments').then(r => r.json()).then(setAssessments).catch(() => {})
    fetch('/api/certifications').then(r => r.json()).then((certs: { assessmentId: number; status: string }[]) => {
      if (Array.isArray(certs)) {
        const map: Record<number, string> = {}
        certs.forEach(c => { map[c.assessmentId] = c.status })
        setCertStatuses(map)
      }
    }).catch(() => {})
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ siteId: '', name: '', year: new Date().getFullYear(), approach: 'operational_control' })
        const data = await fetch('/api/assessments').then(r => r.json())
        setAssessments(data)
      }
    } finally { setLoading(false) }
  }

  const formatCO2 = (v: number) => {
    const val = parseFloat(String(v)) || 0
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} ktCO2eq`
    if (val >= 1000) return `${(val / 1000).toFixed(1)} tCO2eq`
    return `${val.toFixed(0)} kgCO2eq`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bilans Carbone</h1>
          <p className="text-gray-500 mt-1">Créez et gérez vos bilans d'émissions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouveau bilan
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouveau bilan carbone</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site concerné *</label>
                <select value={form.siteId} onChange={e => setForm(p => ({ ...p, siteId: e.target.value }))} className="input-field" required>
                  <option value="">Sélectionner un site...</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                </select>
                {sites.length === 0 && <p className="text-xs text-orange-500 mt-1">Vous devez d'abord créer un site.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du bilan *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Ex: Bilan Carbone 2024 - Siège" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Année de référence *</label>
                  <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))} className="input-field" min={2000} max={2030} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Approche</label>
                  <select value={form.approach} onChange={e => setForm(p => ({ ...p, approach: e.target.value }))} className="input-field">
                    <option value="operational_control">Contrôle opérationnel</option>
                    <option value="financial_control">Contrôle financier</option>
                    <option value="equity_share">Part du capital</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={loading || sites.length === 0} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Création...' : 'Créer le bilan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assessments.length === 0 ? (
        <div className="card p-16 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun bilan carbone</h3>
          <p className="text-gray-500 mb-6">Créez votre premier bilan pour commencer à mesurer vos émissions.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau bilan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map(a => (
            <Link key={a.id} href={`/dashboard/assessments/${a.id}`} className="card p-6 flex items-center justify-between hover:border-brand-200 block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{a.name}</h3>
                    {certStatuses[a.id] === 'certified' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                        <Award className="w-3 h-3" /> Certifie
                      </span>
                    )}
                    {['pending', 'assigned', 'in_progress'].includes(certStatuses[a.id]) && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        <Shield className="w-3 h-3" /> Certification en cours
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {a.site_name}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.year}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCO2(a.total_co2eq)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">S1: {formatCO2(a.scope1_co2eq)}</span>
                  <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">S2: {formatCO2(a.scope2_co2eq)}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">S3: {formatCO2(a.scope3_co2eq)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
