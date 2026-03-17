'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserCheck, AlertCircle } from 'lucide-react'

export default function ExpertLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Email ou mot de passe incorrect.')
        return
      }
      if (data.role !== 'expert') {
        setError('Ce compte n\'est pas un compte expert certifieur.')
        return
      }
      router.push('/expert')
    } catch {
      setError('Impossible de joindre le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Espace Expert</h1>
          <p className="text-gray-500 mt-1 text-sm">CarbonTrack — Certification carbone</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="expert@carbontrack.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? 'Connexion...' : 'Accéder à l\'espace expert'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
