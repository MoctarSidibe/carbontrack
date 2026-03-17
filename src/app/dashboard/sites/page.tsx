'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, MapPin, X, Ruler } from 'lucide-react'

interface Site {
  id: number
  name: string
  type: string
  address: string
  surface: number | null
  description: string
  assessment_count: number
  created_at: string
}

const SITE_TYPES = [
  { value: 'bureau', label: 'Bureau' },
  { value: 'entrepot', label: 'Entrepôt' },
  { value: 'usine', label: 'Usine / Atelier' },
  { value: 'magasin', label: 'Magasin / Commerce' },
  { value: 'chantier', label: 'Chantier' },
  { value: 'datacenter', label: 'Data Center' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'autre', label: 'Autre' },
]

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'bureau', address: '', surface: '', description: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = () => {
    fetch('/api/sites').then(r => r.json()).then(setSites).catch(() => {})
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, surface: form.surface ? parseFloat(form.surface) : null }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ name: '', type: 'bureau', address: '', surface: '', description: '' })
        fetchSites()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites & Entités</h1>
          <p className="text-gray-500 mt-1">Gérez les différents sites de votre entreprise</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter un site
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouveau site</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du site *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: Siège social Paris"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de site</label>
                <select
                  value={form.type}
                  onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="input-field"
                >
                  {SITE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                    className="input-field"
                    placeholder="Adresse du site"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Surface (m&sup2;)</label>
                  <input
                    type="number"
                    value={form.surface}
                    onChange={e => setForm(prev => ({ ...prev, surface: e.target.value }))}
                    className="input-field"
                    placeholder="Ex: 500"
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Description optionnelle..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Création...' : 'Créer le site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sites grid */}
      {sites.length === 0 ? (
        <div className="card p-16 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun site enregistré</h3>
          <p className="text-gray-500 mb-6">Ajoutez votre premier site pour commencer votre bilan carbone.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter un site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map(site => (
            <div key={site.id} className="card p-6 hover:border-brand-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-brand-600" />
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                  {SITE_TYPES.find(t => t.value === site.type)?.label || site.type}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{site.name}</h3>
              {site.address && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" /> {site.address}
                </p>
              )}
              {site.surface && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <Ruler className="w-3 h-3" /> {Number(site.surface).toLocaleString('fr-FR')} m&sup2;
                </p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">{site.assessment_count} bilan(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
