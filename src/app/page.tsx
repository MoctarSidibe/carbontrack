'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Leaf, BarChart3, Building2, Shield, ArrowRight, Globe2, FileCheck } from 'lucide-react'

export default function HomePage() {
  const [monthlyPrice, setMonthlyPrice] = useState('250\u00a0000')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.monthly_price) {
          setMonthlyPrice(Number(data.monthly_price).toLocaleString('fr-FR'))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CarbonTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="btn-primary inline-flex items-center gap-2">
              Commencer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-10 pb-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Conforme ISO 14064 &bull; GHG Protocol &bull; Bilan Carbone&reg;
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Votre bilan carbone
            <span className="text-brand-600"> professionnel</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-6 leading-relaxed">
            Mesurez, analysez et r&eacute;duisez l&apos;empreinte carbone de votre entreprise avec notre plateforme 
            conforme aux standards internationaux. Scope 1, 2 et 3 complets.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              Demarrer votre bilan <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Une solution complete</h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto mb-8 text-sm">
            Bas&eacute;e sur la m&eacute;thodologie Bilan Carbone&reg; et les facteurs d&apos;&eacute;missions de la Base Carbone (ADEME)
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Building2,
                title: 'Multi-sites',
                description: 'G&eacute;rez plusieurs sites (bureaux, entrep&ocirc;ts, usines) et comparez leurs empreintes carbone.'
              },
              {
                icon: BarChart3,
                title: 'Scope 1, 2 & 3',
                description: '&Eacute;valuez toutes les &eacute;missions : directes, indirectes &eacute;nerg&eacute;tiques et indirectes de la cha&icirc;ne de valeur.'
              },
              {
                icon: FileCheck,
                title: 'Rapports conformes',
                description: 'G&eacute;n&eacute;rez des rapports conformes au GHG Protocol, ISO 14069 et aux standards internationaux.'
              },
              {
                icon: Globe2,
                title: 'Facteurs d\'&eacute;missions',
                description: 'Plus de 100 facteurs d\'&eacute;missions issus de la Base Carbone, r&eacute;guli&egrave;rement mis &agrave; jour.'
              },
              {
                icon: Shield,
                title: 'Standards internationaux',
                description: 'Conformit&eacute; ISO 14064, ISO 14069, GHG Protocol Corporate Standard et CDP.'
              },
              {
                icon: Leaf,
                title: 'Plan d\'action',
                description: 'Identifiez vos principaux postes d\'&eacute;missions et priorisez vos actions de r&eacute;duction.'
              },
            ].map((feature, i) => (
              <div key={i} className="card p-5">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: feature.description }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-10 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tarification simple et transparente</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Un seul plan avec toutes les fonctionnalites. Sans engagement, resiliable a tout moment.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="card p-0 overflow-hidden border-2 border-brand-200 shadow-xl">
              <div className="bg-brand-600 px-6 py-5 text-center text-white">
                <p className="text-brand-100 text-xs font-medium mb-1 uppercase tracking-wider">Plan Professionnel</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">{monthlyPrice}</span>
                  <span className="text-brand-200">FCFA</span>
                </div>
                <p className="text-brand-200 text-sm mt-0.5">par mois</p>
              </div>

              <div className="p-6">
                <div className="space-y-2.5 mb-6">
                  {[
                    'Sites & entites illimites',
                    'Bilans carbone complets (Scope 1, 2, 3)',
                    'Rapports PDF professionnels avec QR code',
                    '+100 facteurs d\'emission (Base Carbone ADEME)',
                    'Conforme ISO 14064 & GHG Protocol',
                    'Suivi mensuel & annuel detaille',
                    'Acces 24h/24 a la plateforme',
                    'Support technique inclus',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3 h-3 text-brand-600" />
                      </div>
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <Link href="/register" className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                  Commencer maintenant <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Méthodes de paiement</p>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Image src="/airtel-money-logo.png" alt="Airtel Money" width={72} height={36} className="object-contain" />
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="relative flex flex-col items-center gap-1">
                      <Image src="/moov-money-logo.png" alt="Moov Money" width={44} height={44} className="object-contain opacity-40" />
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">Bientôt disponible</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="relative flex items-center gap-1.5">
                      <Image src="/card-payment-logo.png" alt="Visa / Mastercard" width={64} height={28} className="object-contain opacity-40" />
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">Bientôt disponible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 px-6 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Pret a mesurer votre empreinte ?</h2>
          <p className="text-brand-100 text-sm mb-5">
            Creez votre compte et commencez votre premier bilan carbone des aujourd&apos;hui.
          </p>
          <Link href="/register" className="bg-white text-brand-700 hover:bg-brand-50 font-semibold px-6 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors">
            Demarrer votre bilan <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-brand-500" />
            <span>CarbonTrack &copy; 2026</span>
          </div>
          <div>
            Conforme ISO 14064 &bull; GHG Protocol &bull; GreenLeaves Gabon
          </div>
        </div>
      </footer>
    </div>
  )
}
