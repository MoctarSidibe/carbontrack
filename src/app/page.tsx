'use client'

import Link from 'next/link'
import {
  Leaf, BarChart3, Building2, Shield, ArrowRight, FileCheck,
  BadgeCheck, Bot, FileText, CheckCircle2, ChevronRight,
  Users, Globe2, ClipboardList, UserCheck, Phone, Smartphone,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CarbonTrack</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#fonctionnalites" className="hover:text-brand-600 transition-colors">Fonctionnalités</a>
            <a href="#workflow" className="hover:text-brand-600 transition-colors">Comment ça marche</a>
            <a href="#mobile" className="hover:text-brand-600 transition-colors">Application</a>
            <a href="#assistant" className="hover:text-brand-600 transition-colors">Assistant IA</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Tarifs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-sm">
              Commencer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <Globe2 className="w-4 h-4" />
            Plateforme Carbone Certifiée &bull; GreenLeaves Gabon
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Mesurez votre bilan carbone,<br />
            <span className="text-brand-600">obtenez votre certification</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            La plateforme tout-en-un pour les entreprises gabonaises — bilan GES Scope 1, 2 & 3
            et certification officielle GreenLeaves avec accompagnement expert de bout en bout.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-md">
              <Building2 className="w-5 h-5" />
              Créer mon compte
            </Link>
            <a href="#workflow"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 border border-gray-200 text-gray-700 hover:border-brand-300 hover:text-brand-600 font-semibold rounded-xl transition-colors">
              Voir comment ça marche
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
            {['ISO 14064', 'GHG Protocol', 'Ordonnance N°019/PR/2021', 'GreenLeaves Certified'].map(b => (
              <span key={b} className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-brand-500" /> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ─────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-600" />
            </div>
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Fonctionnalités</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Tout ce qu&apos;il vous faut pour votre bilan GES
          </h2>
          <p className="text-gray-500 max-w-2xl mb-10">
            Saisissez vos émissions, générez vos rapports, et obtenez votre
            certification GreenLeaves — le tout dans une seule interface.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: BarChart3,
                title: 'Bilan GES Scope 1, 2 & 3',
                desc: 'Saisie multi-sites par pays — référentiels ISO 14064-1, GHG Protocol Corporate Standard, facteurs Base Carbone ADEME, IPCC et locaux Gabon. Visualisation par scope, catégorie et mois.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Shield,
                title: 'Certification GreenLeaves',
                desc: 'Workflow simplifié en 5 étapes : soumission → expert assigné → audit terrain → revue finale → certificat. GreenLeaves gère tout le processus.',
                color: 'bg-brand-50 text-brand-600',
              },
              {
                icon: FileText,
                title: 'Documents PDF professionnels',
                desc: 'Rapport d\'audit expert détaillé, Récapitulatif de Certification et rapport de bilan GES générés automatiquement, prêts à soumettre.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: ClipboardList,
                title: 'Grille d\'audit expert',
                desc: 'Checklist structurée en 6 sections : éligibilité, qualité des données, calculs Scope 1/2/3, visite de site, conformité réglementaire, avis motivé.',
                color: 'bg-orange-50 text-orange-600',
              },
              {
                icon: UserCheck,
                title: 'Portail expert dédié',
                desc: 'Interface sombre et professionnelle pour les experts GreenLeaves. Analyse des données, saisie de la checklist, finalisation de l\'audit et génération du rapport PDF.',
                color: 'bg-teal-50 text-teal-600',
              },
              {
                icon: BadgeCheck,
                title: 'Suivi en temps réel',
                desc: 'Dashboard entreprise avec statut de certification en temps réel, historique des bilans par site, et notifications à chaque étape du processus.',
                color: 'bg-emerald-50 text-emerald-600',
              },
            ].map((f, i) => (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ─────────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Processus</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
              De l&apos;inscription à la certification
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Un parcours clair et guidé. GreenLeaves vous accompagne à chaque étape.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: '01', icon: Building2,    title: 'Inscription',         desc: 'Créez votre compte entreprise et renseignez vos sites de production par pays.' },
              { step: '02', icon: BarChart3,    title: 'Bilan GES',           desc: 'Saisissez vos données Scope 1, 2 & 3 — ISO 14064-1, GHG Protocol, facteurs ADEME, IPCC et locaux Gabon. Sites par pays.' },
              { step: '03', icon: FileCheck,    title: 'Demande de certification', desc: 'Soumettez votre bilan finalisé en un clic pour déclencher le processus.' },
              { step: '04', icon: UserCheck,    title: 'Audit expert',        desc: 'Un expert GreenLeaves est assigné, effectue la visite de site et complète la grille d\'audit.' },
              { step: '05', icon: BadgeCheck,   title: 'Certifié ✓',         desc: 'Votre certificat officiel GreenLeaves est émis avec numéro unique CT-GL.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-brand-400 font-mono">{s.step}</span>
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                      <s.icon className="w-4 h-4 text-brand-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:flex absolute top-8 -right-2.5 z-10 w-5 h-5 bg-white border border-gray-200 rounded-full items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Mobile ──────────────────────────────────────────────── */}
      <section id="mobile" className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Text side */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-50 shadow-sm border border-brand-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-brand-600" />
                </div>
                <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Application Mobile</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Votre bilan GES,<br />
                <span className="text-brand-600">partout avec vous</span>
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                L&apos;application CarbonTrack est disponible sur iOS et Android. Saisissez vos données
                d&apos;activité, consultez vos bilans, suivez vos certifications et posez vos questions
                à l&apos;assistant IA — directement depuis votre téléphone.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  { icon: BarChart3,  label: 'Saisie Scope 1, 2 & 3 depuis le terrain' },
                  { icon: BadgeCheck, label: 'Suivi de certification en temps réel' },
                  { icon: Bot,        label: 'Assistant IA intégré' },
                  { icon: FileText,   label: 'Consultation des rapports PDF' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store
                </div>
                <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="m12.954 11.616 2.957-2.957L6.36 3.291c-.633-.342-1.226-.39-1.736-.077l8.33 8.402zm3.461 3.462 3.074-1.729c.6-.336.929-.812.929-1.349 0-.537-.329-1.013-.929-1.349l-3.074-1.729-3.302 3.302 3.302 3.854zM4.442 4.524c-.214.352-.33.77-.33 1.275v12.402c0 .506.116.923.33 1.275l8.43-8.503L4.442 4.524zm8.512 8.578-8.33 8.403c.51.313 1.103.265 1.736-.077l9.551-5.368-2.957-2.958z"/></svg>
                  Google Play
                </div>
              </div>
            </div>

            {/* Screenshots side */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-center p-4 ${n === 2 ? 'mt-6' : ''}`}
                    style={{ aspectRatio: '9/19' }}>
                    <Smartphone className="w-6 h-6 text-gray-300 mb-2" />
                    <span className="text-[10px] text-gray-400 leading-tight">Capture d&apos;écran<br />mobile {n}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5">
                <span className="text-xs font-semibold text-brand-600">iOS & Android</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Assistant IA ─────────────────────────────────────────────────────── */}
      <section id="assistant" className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-50 shadow-sm border border-brand-100 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-brand-600" />
                </div>
                <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Assistant IA</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Posez vos questions,<br />
                <span className="text-brand-600">obtenez des réponses précises</span>
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Notre assistant IA répond à toutes vos questions sur le bilan carbone, les facteurs
                d&apos;émissions, les scopes et la réglementation gabonaise — avec des sources citées.
              </p>
              <div className="space-y-2.5 mb-6">
                {[
                  'Ma génératrice diesel est en Scope 1 ou Scope 2 ?',
                  'Comment calculer les émissions de ma flotte de véhicules ?',
                  'Quelles activités sont obligatoires à déclarer ?',
                  'C\'est quoi la différence entre Scope 2 market-based et location-based ?',
                  'Combien de tCO₂e émet 1 000 litres de gazole ?',
                ].map(q => (
                  <div key={q} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-3 h-3 text-brand-700" />
                    </div>
                    <p className="text-sm text-gray-700 italic">&quot;{q}&quot;</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Basé sur ISO 14064, GHG Protocol et l&apos;Ordonnance N°019/PR/2021. Cite ses sources.
              </p>
            </div>

            {/* Mock chat window */}
            <div className="bg-gray-950 rounded-2xl p-4 shadow-2xl border border-gray-800">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-800 mb-4">
                <div className="w-8 h-8 bg-brand-900/50 border border-brand-800 rounded-xl flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Assistant IA — CarbonTrack</p>
                  <p className="text-xs text-gray-500">ISO 14064 · GHG Protocol · Gabon</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-brand-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                    Les émissions de ma génératrice sont en Scope 1 ou 2 ?
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <div className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                    Une génératrice à carburant (gazole, essence) est en <strong className="text-white">Scope 1</strong> — c&apos;est une combustion directe sur votre site. Appliquez le facteur ADEME correspondant à votre carburant multiplié par la consommation en litres.
                  </div>
                </div>
                <div className="flex gap-1.5 pl-9">
                  <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">GHG Protocol</span>
                  <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Base Carbone ADEME</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modules recap ────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tout inclus dans l&apos;accès plateforme</h2>
            <p className="text-gray-500 text-sm">Chaque fonctionnalité dont votre entreprise a besoin, sans module supplémentaire</p>
          </div>
          <div className="border border-brand-100 rounded-2xl p-8 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-gray-900">Plateforme Entreprise — Tout inclus</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Bilan GES Scope 1, 2 & 3 multi-sites',
                'Soumission de dossier de certification',
                'Grille d\'audit expert (6 sections)',
                'Rapport d\'Audit Expert PDF',
                'Rapport de Bilan GES PDF',
                'Récapitulatif de Certification PDF',
                'Dashboard entreprise — suivi temps réel',
                'Application mobile iOS & Android',
                'Rapports conformes ISO 14064 & GHG Protocol',
                'Historique multi-années par site',
                'Assistant IA — questions GES',
                'Support technique inclus',
              ].map((label) => (
                <div key={label} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-brand-600" />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tarification claire et transparente</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              L&apos;accès à la plateforme et la certification nationale sont deux services distincts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* ── Card 1: Platform access ── */}
            <div className="card p-0 overflow-hidden border-2 border-brand-200 shadow-xl">
              <div className="bg-brand-600 px-6 py-5 text-center text-white">
                <p className="text-brand-100 text-xs font-medium mb-1 uppercase tracking-wider">Accès Plateforme</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">3 000 000</span>
                  <span className="text-brand-200">FCFA</span>
                </div>
                <p className="text-brand-200 text-sm mt-0.5">par an · par entreprise</p>
              </div>

              <div className="p-6">
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Accès complet à toutes les fonctionnalités de la plateforme pour réaliser
                  et gérer vos bilans GES, générer vos rapports PDF et suivre vos certifications.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    'Bilan GES Scope 1, 2 & 3',
                    'Soumission de dossier',
                    'Application mobile',
                    'Rapports PDF professionnels',
                    'Grille d\'audit 6 sections',
                    'Portail expert dédié',
                    'Assistant IA carbone',
                    'Sites illimités',
                    'Historique multi-années',
                    'Support technique inclus',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-2.5 h-2.5 text-brand-600" />
                      </div>
                      <span className="text-xs text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <Link href="/register" className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                  Commencer maintenant <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Card 2: National certification ── */}
            <div className="card p-0 overflow-hidden border-2 border-gray-200 shadow-sm">
              <div className="bg-gray-800 px-6 py-5 text-center text-white">
                <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Certification Nationale</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-bold">Sur devis</span>
                </div>
                <p className="text-gray-400 text-sm mt-0.5">Tarif selon la taille et le secteur</p>
              </div>

              <div className="p-6">
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  La certification officielle GreenLeaves inclut l&apos;audit terrain par un expert agréé,
                  la revue complète du dossier et l&apos;émission du certificat avec numéro CT-GL.
                  Ce service est distinct de l&apos;abonnement plateforme.
                </p>
                <div className="space-y-2.5 mb-6">
                  {[
                    { label: 'Audit terrain par expert GreenLeaves', included: true },
                    { label: 'Revue et validation du dossier GES',   included: true },
                    { label: 'Certificat officiel numéroté CT-GL',   included: true },
                    { label: 'Rapport d\'audit expert PDF',           included: true },
                    { label: 'Tarif variable selon secteur',          included: null },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.included === true ? 'bg-brand-100' : 'bg-gray-100'
                      }`}>
                        {item.included === true
                          ? <Shield className="w-2.5 h-2.5 text-brand-600" />
                          : <span className="text-gray-400 text-[8px] font-bold">i</span>
                        }
                      </div>
                      <span className="text-xs text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="mailto:contact@carbontrack.ga"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-gray-300 hover:border-brand-400 hover:text-brand-600 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Contacter l&apos;équipe technique
                </a>

                <p className="text-center text-xs text-gray-400 mt-3">
                  Accessible depuis votre tableau de bord après abonnement
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-14 px-6 bg-gray-950">
        <div className="max-w-3xl mx-auto text-center">
          <Leaf className="w-10 h-10 text-brand-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Prêt à certifier votre bilan carbone ?
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xl mx-auto">
            Créez votre compte entreprise et démarrez votre premier bilan GES dès aujourd&apos;hui.
            La certification GreenLeaves vous attend.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold px-8 py-3 rounded-xl transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-6 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-700">CarbonTrack</span>
            <span>&copy; 2026</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span>ISO 14064</span>
            <span>·</span>
            <span>GHG Protocol</span>
            <span>·</span>
            <span>Ordonnance N°019/PR/2021</span>
            <span>·</span>
            <span>GreenLeaves Certified</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
