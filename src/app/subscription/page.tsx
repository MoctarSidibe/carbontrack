'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Leaf, Shield, CheckCircle2, Smartphone,
  ArrowRight, AlertCircle, Clock, Zap, BarChart3,
  FileText, Building2, Globe2, X
} from 'lucide-react'

interface Subscription {
  id: number
  plan: string
  amount: number
  currency: string
  paymentMethod: string
  paymentRef: string
  status: string
  startsAt: string
  expiresAt: string
}

interface PlatformSettings {
  monthly_price: string
  currency: string
  subscription_duration_days: string
}

type PaymentMethod = 'airtel_money' | 'moov_money' | 'visa' | null

function fmtPrice(price: string | number) {
  return Number(price).toLocaleString('fr-FR') + ' FCFA'
}

function methodLabel(m: string) {
  if (m === 'airtel_money') return 'Airtel Money'
  if (m === 'moov_money') return 'Moov Money'
  if (m === 'visa') return 'Visa / Mastercard'
  return m
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ firstName: string; lastName: string; phone: string; company: { name: string } } | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [settings, setSettings] = useState<PlatformSettings>({ monthly_price: '250000', currency: 'FCFA', subscription_duration_days: '30' })
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => { if (!r.ok) throw new Error(); return r.json() }),
      fetch('/api/settings').then(r => r.json()),
    ])
      .then(([userData, settingsData]) => {
        setUser(userData)
        setPhoneNumber(userData.phone || '')
        if (userData.subscription) setSubscription(userData.subscription)
        setSettings(settingsData)
        setLoading(false)
      })
      .catch(() => router.push('/login'))
  }, [router])

  const handlePayment = async () => {
    if (!paymentMethod) return
    if ((paymentMethod === 'airtel_money' || paymentMethod === 'moov_money') && !phoneNumber) {
      setError(`Veuillez saisir votre numéro ${paymentMethod === 'airtel_money' ? 'Airtel Money' : 'Moov Money'}`)
      return
    }
    setError('')
    setProcessing(true)
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod, phoneNumber }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur lors du paiement'); return }
      setSubscription(data.subscription)
      setSuccess(true)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  // SUCCESS STATE
  if (success && subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h1>
          <p className="text-gray-500 mb-8">Votre abonnement CarbonTrack est maintenant actif.</p>

          <div className="card p-6 text-left mb-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Référence</span>
                <span className="font-mono text-gray-900">{subscription.paymentRef}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Montant</span>
                <span className="font-semibold text-gray-900">{fmtPrice(subscription.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Méthode</span>
                <span className="text-gray-900">{methodLabel(subscription.paymentMethod)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valide jusqu&apos;au</span>
                <span className="text-gray-900">{new Date(subscription.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Mode simulation</p>
                <p>Ce paiement est une simulation. L&apos;intégration réelle avec les APIs de paiement sera effectuée une fois la documentation disponible.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3"
          >
            Accéder à la plateforme <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // ALREADY SUBSCRIBED STATE
  if (subscription) {
    const expiresAt = new Date(subscription.expiresAt)
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CarbonTrack</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Votre abonnement</h1>
          </div>

          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-700">Abonnement actif</p>
                <p className="text-sm text-gray-500">{daysLeft} jours restants</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">Plan</span>
                <span className="font-medium text-gray-900">Mensuel — {fmtPrice(subscription.amount)}</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">Expire le</span>
                <span className="font-medium text-gray-900">{expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">Méthode</span>
                <span className="font-medium text-gray-900">{methodLabel(subscription.paymentMethod)}</span>
              </div>
            </div>

            <Link href="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
              Retour au tableau de bord <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // PAYMENT FORM STATE
  const displayPrice = fmtPrice(settings.monthly_price)
  const needsPhone = paymentMethod === 'airtel_money' || paymentMethod === 'moov_money'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Abonnement requis
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Activez votre accès CarbonTrack</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Pour accéder à la plateforme et gérer votre bilan carbone, un abonnement mensuel est requis.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Plan card */}
          <div className="lg:col-span-2">
            <div className="card p-0 overflow-hidden sticky top-6">
              <div className="bg-brand-600 px-6 py-5 text-white">
                <p className="text-brand-100 text-sm font-medium mb-1">Plan Mensuel</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{Number(settings.monthly_price).toLocaleString('fr-FR')}</span>
                  <span className="text-brand-200 text-sm">FCFA / mois</span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Inclus dans votre abonnement :</p>
                <div className="space-y-3">
                  {[
                    { icon: Building2, text: 'Sites & entités illimitées' },
                    { icon: BarChart3, text: 'Bilans carbone complets (Scope 1, 2, 3)' },
                    { icon: FileText, text: 'Rapports PDF professionnels avec QR code' },
                    { icon: Globe2, text: '+100 facteurs d\'émission (Base Carbone)' },
                    { icon: Shield, text: 'Conforme ISO 14064 & GHG Protocol' },
                    { icon: Zap, text: 'Suivi mensuel & annuel' },
                    { icon: Clock, text: 'Accès 24/7 à la plateforme' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-brand-50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-3.5 h-3.5 text-brand-600" />
                      </div>
                      <span className="text-sm text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment section */}
          <div className="lg:col-span-3">
            <div className="card p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Choisissez votre méthode de paiement</h2>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Payment methods */}
              <div className="space-y-3 mb-6">
                {/* Airtel Money */}
                <button
                  onClick={() => { setPaymentMethod('airtel_money'); setError('') }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'airtel_money'
                      ? 'border-red-500 bg-red-50 ring-1 ring-red-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-white border border-gray-100">
                    <Image src="/airtel-money-logo.png" alt="Airtel Money" width={52} height={52} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">Airtel Money</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Disponible</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Paiement mobile rapide et sécurisé</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === 'airtel_money' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'airtel_money' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>

                {/* Moov Money */}
                <button
                  onClick={() => { setPaymentMethod('moov_money'); setError('') }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'moov_money'
                      ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-white border border-gray-100">
                    <Image src="/moov-money-logo.png" alt="Moov Money" width={52} height={52} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">Moov Money</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Disponible</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Paiement mobile Moov Africa</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === 'moov_money' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'moov_money' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>

                {/* Visa / Mastercard — coming soon */}
                <div className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed">
                  <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                    <Image src="/card-payment-logo.png" alt="Visa / Mastercard" width={52} height={36} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-500">Visa / Mastercard</p>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Bientôt disponible</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">Paiement par carte bancaire</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                </div>
              </div>

              {/* Phone input for mobile money */}
              {needsPhone && (
                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro {paymentMethod === 'airtel_money' ? 'Airtel Money' : 'Moov Money'}
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="input-field pl-11"
                      placeholder="+241 077 123 456"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Un message de confirmation sera envoyé sur ce numéro pour valider le paiement.
                  </p>
                </div>
              )}

              {/* Summary */}
              {paymentMethod && (
                <div className="border-t border-gray-100 pt-5 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Abonnement mensuel</span>
                      <span className="text-gray-900">{displayPrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Méthode</span>
                      <span className="text-gray-900">{methodLabel(paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100">
                      <span className="text-gray-900">Total à payer</span>
                      <span className="text-brand-700">{displayPrice}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePayment}
                disabled={!paymentMethod || processing}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Payer {displayPrice}
                  </>
                )}
              </button>

              {/* Simulation notice */}
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">Mode simulation :</span> Le paiement est simulé pour le moment.
                    L&apos;intégration réelle avec les APIs de paiement sera effectuée dès réception des documentations techniques.
                  </p>
                </div>
              </div>

              {/* Security badges */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Paiement sécurisé</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Activation immédiate</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>Sans engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
