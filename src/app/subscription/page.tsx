'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Leaf, Shield, CheckCircle2, ArrowRight, AlertCircle,
  Clock, Zap, BarChart3, FileText, Building2, Globe2, Award,
} from 'lucide-react'
import LoadingScreen from '@/components/LoadingScreen'

interface Subscription {
  id: number; plan: string; amount: number; paymentRef: string
  status: string; expiresAt: string
}

function fmtPrice(v: number | string) {
  return Number(v).toLocaleString('fr-FR') + ' FCFA'
}

const FEATURES = [
  { icon: Building2, text: 'Sites & entités illimités, multi-pays' },
  { icon: BarChart3, text: 'Bilans GES complets — Scope 1, 2 & 3' },
  { icon: FileText,  text: 'Rapports PDF professionnels' },
  { icon: Globe2,    text: 'ISO 14064 · GHG Protocol · ADEME · IPCC' },
  { icon: Award,     text: 'Workflow de certification GreenLeaves' },
  { icon: Zap,       text: 'Assistant IA GES intégré' },
  { icon: Clock,     text: 'Accès 24/7 — Web & Application mobile' },
  { icon: Shield,    text: 'Support technique inclus' },
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ firstName: string; lastName: string; company: { name: string } } | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        setUser(data)
        if (data.subscription) setSubscription(data.subscription)
        setLoading(false)
      })
      .catch(() => router.push('/login'))
  }, [router])

  const handleActivate = async () => {
    setError('')
    setProcessing(true)
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'direct' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur lors de l\'activation'); return }
      setSubscription(data.subscription)
      setSuccess(true)
    } catch {
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <LoadingScreen theme="light" label="Vérification de l'abonnement…" />

  // ── SUCCESS ──
  if (success && subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès activé !</h1>
          <p className="text-gray-500 mb-8">Votre abonnement CarbonTrack est maintenant actif.</p>
          <div className="card p-5 text-left mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Référence</span>
              <span className="font-mono text-xs text-gray-700">{subscription.paymentRef}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Montant</span>
              <span className="font-semibold text-gray-900">{fmtPrice(subscription.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Valide jusqu'au</span>
              <span className="text-gray-900">{new Date(subscription.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Mode simulation :</span>{' '}
                L'intégration avec les systèmes de paiement réels sera activée prochainement.
              </p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
            Accéder à la plateforme <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // ── ALREADY SUBSCRIBED ──
  if (subscription) {
    const expiresAt = new Date(subscription.expiresAt)
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CarbonTrack</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Votre abonnement</h1>
          </div>
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-700">Abonnement actif</p>
                <p className="text-sm text-gray-500">{daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Montant annuel</span>
              <span className="font-medium">{fmtPrice(subscription.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expire le</span>
              <span className="font-medium">{expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <Link href="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              Retour au tableau de bord <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── PAYMENT FORM ──
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CarbonTrack</span>
          </Link>
          {user && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400">{user.company.name}</p>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Abonnement annuel requis
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Activez votre accès CarbonTrack</h1>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">
            Un abonnement annuel de <strong>3 000 000 FCFA</strong> donne accès à toutes les fonctionnalités
            de la plateforme pendant 12 mois.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* Features list */}
          <div className="card p-6">
            <div className="bg-brand-600 -mx-6 -mt-6 px-6 py-5 rounded-t-2xl mb-6 text-white text-center">
              <p className="text-brand-100 text-xs font-medium mb-1 uppercase tracking-wider">Plan Annuel</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold">3 000 000</span>
                <span className="text-brand-200 text-sm">FCFA / an</span>
              </div>
              <p className="text-brand-200 text-sm mt-1">par entreprise · accès complet</p>
            </div>
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <span className="text-sm text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activate panel */}
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Récapitulatif</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-500">Abonnement annuel</span>
                  <span className="text-gray-900">3 000 000 FCFA</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-500">Durée</span>
                  <span className="text-gray-900">12 mois</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-500">Entreprise</span>
                  <span className="text-gray-900 font-medium">{user?.company.name}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span className="text-gray-900">Total</span>
                  <span className="text-brand-700 text-base">3 000 000 FCFA</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2.5 rounded-lg mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleActivate}
                disabled={processing}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-60"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Activation en cours…
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Activer mon accès
                  </>
                )}
              </button>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">Mode simulation :</span>{' '}
                    L'intégration avec les systèmes de paiement (Mobile Money, carte bancaire) sera activée prochainement.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Paiement sécurisé</div>
              <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Activation immédiate</div>
              <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Support 24/7</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
