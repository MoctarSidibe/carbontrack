'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Leaf, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      // Hard redirect — forces a full page load with the new cookie set
      if (data.role === 'admin')        window.location.href = '/admin'
      else if (data.role === 'expert')  window.location.href = '/expert'
      else if (data.role === 'partner') window.location.href = '/partner'
      else                              window.location.href = '/dashboard'
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CarbonTrack</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-500 mt-2">Accédez à votre tableau de bord</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Votre mot de passe"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Connexion en cours...</>
                : <><span>Se connecter</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
