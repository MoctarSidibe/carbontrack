'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, MapPin, X, Ruler } from 'lucide-react'

const COUNTRIES = [
  "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola", "Antigua-et-Barbuda", 
  "Arabie Saoudite", "Argentine", "Arménie", "Australie", "Autriche", "Azerbaïdjan", "Bahamas", "Bahreïn", 
  "Bangladesh", "Barbade", "Belgique", "Bélize", "Bénin", "Bhoutan", "Biélorussie", "Birmanie (Myanmar)", 
  "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Brunei", "Bulgarie", "Burkina Faso", "Burundi", 
  "Cambodge", "Cameroun", "Canada", "Cap-Vert", "Centrafrique", "Chili", "Chine", "Chypre", "Colombie", 
  "Comores", "Congo (Brazzaville)", "Congo (Kinshasa)", "Corée du Nord", "Corée du Sud", "Costa Rica", 
  "Côte d'Ivoire", "Croatie", "Cuba", "Danemark", "Djibouti", "Dominique", "Égypte", "Émirats Arabes Unis", 
  "Équateur", "Érythrée", "Espagne", "Estonie", "Eswatini", "États-Unis", "Éthiopie", "Fidji", "Finlande", 
  "France", "Gabon", "Gambie", "Géorgie", "Ghana", "Grèce", "Grenade", "Guatemala", "Guinée", "Guinée équatoriale", 
  "Guinée-Bissau", "Guyana", "Haïti", "Honduras", "Hongrie", "Inde", "Indonésie", "Irak", "Iran", "Irlande", 
  "Islande", "Israël", "Italie", "Jamaïque", "Japon", "Jordanie", "Kazakhstan", "Kenya", "Kirghizistan", 
  "Kiribati", "Koweït", "Laos", "Lesotho", "Lettonie", "Liban", "Libéria", "Libye", "Liechtenstein", "Lituanie", 
  "Luxembourg", "Macédoine du Nord", "Madagascar", "Malaisie", "Malawi", "Maldives", "Mali", "Malte", "Maroc", 
  "Maurice", "Mauritanie", "Mexique", "Micronésie", "Moldavie", "Monaco", "Mongolie", "Monténégro", "Mozambique", 
  "Namibie", "Nauru", "Népal", "Nicaragua", "Niger", "Nigeria", "Norvège", "Nouvelle-Zélande", "Oman", 
  "Ouganda", "Ouzbékistan", "Pakistan", "Palaos", "Panama", "Papouasie-Nouvelle-Guinée", "Paraguay", "Pays-Bas", 
  "Pérou", "Philippines", "Pologne", "Portugal", "Qatar", "République Dominicaine", "République Tchèque", 
  "Roumanie", "Royaume-Uni", "Russie", "Rwanda", "Saint-Kitts-et-Nevis", "Saint-Marin", "Saint-Vincent-et-les-Grenadines",
  "Sainte-Lucie", "Salvador", "Samoa", "São Tomé-et-Príncipe", "Sénégal", "Serbie", "Seychelles", "Sierra Leone", 
  "Singapour", "Slovaquie", "Slovénie", "Somalie", "Soudan", "Soudan du Sud", "Sri Lanka", "Suède", "Suisse", 
  "Suriname", "Syrie", "Tadjikistan", "Tanzanie", "Tchad", "Thaïlande", "Timor oriental", "Togo", "Tonga", 
  "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu", "Ukraine", "Uruguay", "Vanuatu", 
  "Vatican", "Venezuela", "Vietnam", "Yémen", "Zambie", "Zimbabwe"
]

interface Site {
  id: number
  name: string
  type: string
  address: string
  surface: number | null
  description: string
  assessment_count: number
  created_at: string
  country?: string | null
}

const SITE_TYPES = [
  { value: 'agence', label: 'Agence / Succursale' },
  { value: 'boutique', label: 'Boutique / Point de Vente' },
  { value: 'bureau', label: 'Bureau / Siège Social' },
  { value: 'chantier', label: 'Chantier / Construction' },
  { value: 'clinique', label: 'Clinique / Centre Médical' },
  { value: 'datacenter', label: 'Data Center / Informatique' },
  { value: 'ecole', label: 'École / Campus' },
  { value: 'entrepot', label: 'Entrepôt / Stockage' },
  { value: 'exploitation_agricole', label: 'Exploitation Agricole' },
  { value: 'garage', label: 'Garage / Atelier' },
  { value: 'hotel', label: 'Hôtel / Hébergement' },
  { value: 'laboratoire', label: 'Laboratoire / R&D' },
  { value: 'logistique', label: 'Plateforme Logistique' },
  { value: 'magasin', label: 'Magasin' },
  { value: 'restaurant', label: 'Restaurant / Restauration' },
  { value: 'supermarche', label: 'Supermarché / Hypermarché' },
  { value: 'usine', label: 'Usine / Production' },
  { value: 'autre', label: 'Autre' }
]

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'bureau', address: '', surface: '', description: '', country: 'Gabon' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = () => {
    fetch('/api/sites').then(r => r.json()).then(d => { if (Array.isArray(d)) setSites(d) }).catch(() => {})
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
        setForm({ name: '', type: 'bureau', address: '', surface: '', description: '', country: 'Gabon' })
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

            {/* Header — never scrolls */}
            <div className="flex items-center justify-between px-8 pt-7 pb-5 flex-shrink-0 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Nouveau site</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 px-8 py-6">
              <form id="site-form" onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du site *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="Ex: Siège social Libreville"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays *</label>
                    <select
                      value={form.country}
                      onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                      className="input-field"
                      required
                    >
                      <option value="" disabled>Sélectionnez un pays...</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
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
              </form>
            </div>

            {/* Footer buttons — never scrolls */}
            <div className="flex gap-3 px-8 py-5 border-t border-gray-100 flex-shrink-0">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              <button type="submit" form="site-form" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                {loading ? 'Création...' : 'Créer le site'}
              </button>
            </div>

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
              <p className="text-sm text-gray-400 flex items-center gap-1 mb-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" /> {[site.address, site.country].filter(Boolean).join(' · ') || 'Aucune adresse'}
              </p>
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
