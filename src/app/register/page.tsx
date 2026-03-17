'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, Lock, User, Building2, ArrowRight, AlertCircle, Phone, Upload, X } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    rccm: '',
    sector: ''
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sectors = [
    'Industrie', 'Services', 'Commerce', 'Transport & Logistique',
    'Construction & BTP', 'Agriculture', 'Energie', 'Technologie',
    'Sante', 'Education', 'Finance & Assurance', 'Immobilier', 'Autre',
  ]

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo trop lourd (max 2 Mo)')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setError('')
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Step 1: Register (JSON)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription')
        return
      }

      // Step 2: Upload logo if provided
      if (logoFile) {
        const fd = new FormData()
        fd.append('logo', logoFile)
        await fetch('/api/company/logo', { method: 'POST', body: fd })
      }

      router.push('/dashboard')
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CarbonTrack</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Créer votre compte</h1>
          <p className="text-gray-500 mt-2">Commencez votre bilan carbone</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={form.firstName} onChange={e => updateField('firstName', e.target.value)}
                    className="input-field pl-11" placeholder="Jean" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                <input type="text" value={form.lastName} onChange={e => updateField('lastName', e.target.value)}
                  className="input-field" placeholder="Dupont" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)}
                  className="input-field pl-11" placeholder="jean.dupont@entreprise.fr" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" value={form.password} onChange={e => updateField('password', e.target.value)}
                  className="input-field pl-11" placeholder="Min. 8 caractères" minLength={8} required />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Company info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l&apos;entreprise</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={form.companyName} onChange={e => updateField('companyName', e.target.value)}
                  className="input-field pl-11" placeholder="Mon Entreprise" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)}
                  className="input-field pl-11" placeholder="+241 07 12 34 56" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">RCCM</label>
                <input type="text" value={form.rccm} onChange={e => updateField('rccm', e.target.value)}
                  className="input-field" placeholder="CD/KIN/RCCM/24-B-00123" maxLength={50} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Secteur d&apos;activité</label>
                <select value={form.sector} onChange={e => updateField('sector', e.target.value)} className="input-field">
                  <option value="">Sélectionner...</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Logo de l&apos;entreprise <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>

              {logoPreview ? (
                <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{logoFile?.name}</p>
                    <p className="text-xs text-gray-400">{logoFile ? (logoFile.size / 1024).toFixed(0) + ' Ko' : ''}</p>
                  </div>
                  <button type="button" onClick={removeLogo} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 px-4 py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50/50 transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-medium">Cliquer pour uploader le logo</span>
                  <span className="text-xs">PNG, JPG, WebP, SVG — max 2 Mo</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
