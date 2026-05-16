'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, AlertCircle, Shield, Zap, BarChart3,
  FileText, Building2, Globe2, Award, RefreshCw, ArrowRight,
  CreditCard, Clock,
} from 'lucide-react'
import LoadingScreen from '@/components/LoadingScreen'

interface Subscription {
  id: number
  plan: string
  amount: number
  currency: string
  paymentRef: string | null
  paymentMethod: string
  status: string
  startsAt: string
  expiresAt: string
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

function fmtDate(d: string | undefined | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtPrice(n: number | undefined | null) {
  if (n == null) return '3 000 000 FCFA'
  return Number(n).toLocaleString('fr-FR') + ' FCFA'
}

export default function AbonnementPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [company, setCompany] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [renewing, setRenewing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const load = async () => {
    try {
      const [meRes, subRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/subscription'),
      ])
      if (!meRes.ok) { router.push('/login'); return }
      const me = await meRes.json()
      setCompany(me.company)
      if (subRes.ok) {
        const sub = await subRes.json()
        setSubscription(sub.subscription ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRenew = async () => {
    setError('')
    setRenewing(true)
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'direct' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur lors du renouvellement'); return }
      setSubscription(data.subscription)
      setSuccess(true)
    } catch {
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setRenewing(false)
    }
  }

  if (loading) return <LoadingScreen theme="light" label="Chargement de l'abonnement…" />

  const daysLeft = subscription
    ? Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / 86_400_000)
    : 0

  const isExpired = subscription != null && daysLeft <= 0
  const isActive  = subscription != null && daysLeft > 0
  const progress  = isActive ? Math.max(2, Math.min(100, Math.round((daysLeft / 365) * 100))) : 0

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-gray-500 text-sm mt-0.5">{company?.name} — Plan annuel CarbonTrack</p>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Abonnement activé avec succès !</p>
            <p className="text-green-700 text-xs mt-0.5">Votre accès est valide pour 12 mois.</p>
          </div>
        </div>
      )}

      {/* Expired alert */}
      {isExpired && !success && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Votre abonnement a expiré.</p>
            <p className="text-red-700 text-xs mt-0.5">Renouvelez pour continuer à utiliser la plateforme.</p>
          </div>
        </div>
      )}

      {/* Active subscription card */}
      {isActive && !success && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-brand-600 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Abonnement actif</p>
                  <p className="text-brand-200 text-sm">Plan annuel · {fmtPrice(subscription!.amount)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{daysLeft}</p>
                <p className="text-brand-200 text-xs">jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-brand-200 mb-1.5">
                <span>{fmtDate(subscription!.startsAt)}</span>
                <span>{fmtDate(subscription!.expiresAt)}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="px-6 py-5 divide-y divide-gray-100">
            {[
              { label: 'Référence',       value: subscription!.paymentRef ?? '—', mono: true },
              { label: 'Plan',            value: 'Annuel — Accès complet', mono: false },
              { label: 'Montant',         value: fmtPrice(subscription!.amount), mono: false },
              { label: 'Date d\'activation', value: fmtDate(subscription!.startsAt), mono: false },
              { label: 'Expire le',       value: fmtDate(subscription!.expiresAt), mono: false },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm py-2.5">
                <span className="text-gray-500">{r.label}</span>
                <span className={`text-gray-900 ${r.mono ? 'font-mono text-xs' : 'font-medium'}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success subscription card (after renewal) */}
      {success && subscription && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-brand-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Abonnement actif</p>
                <p className="text-brand-200 text-sm">Plan annuel · {fmtPrice(subscription.amount)}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 divide-y divide-gray-100">
            {[
              { label: 'Référence', value: subscription.paymentRef ?? '—', mono: true },
              { label: 'Montant',   value: fmtPrice(subscription.amount), mono: false },
              { label: 'Expire le', value: fmtDate(subscription.expiresAt), mono: false },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm py-2.5">
                <span className="text-gray-500">{r.label}</span>
                <span className={`text-gray-900 ${r.mono ? 'font-mono text-xs' : 'font-medium'}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="px-6 pb-5">
            <button onClick={() => router.push('/dashboard')} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              Accéder à la plateforme <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* No subscription */}
      {!subscription && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Aucun abonnement actif</h2>
          <p className="text-gray-500 text-sm mb-5">Activez votre accès annuel pour utiliser toutes les fonctionnalités.</p>
          <Link href="/subscription" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
            Activer un abonnement <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Renew — only shown when expired */}
      {isExpired && !success && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Renouveler l'abonnement</h2>
          <p className="text-gray-500 text-sm mb-5">
            Un nouvel abonnement annuel de <strong>3 000 000 FCFA</strong> sera créé pour {company?.name}.
          </p>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <button
            onClick={handleRenew}
            disabled={renewing}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {renewing
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Renouvellement…</>
              : <><RefreshCw className="w-4 h-4" /> Renouveler — 3 000 000 FCFA / an</>
            }
          </button>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            Mode simulation — intégration paiement réel à venir.
          </p>
        </div>
      )}

      {/* Features */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Ce qui est inclus</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-brand-600" />
              </div>
              <span className="text-sm text-gray-700">{text}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
