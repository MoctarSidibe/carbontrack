import Link from 'next/link'
import { Leaf, ArrowLeft, FileText } from 'lucide-react'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — CarbonTrack',
  description: 'CGU de CarbonTrack alignées sur les standards internationaux et les principes du RGPD.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-gray-700 leading-relaxed text-[15px]">{children}</div>
    </section>
  )
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 space-y-1.5 marker:text-brand-500">{children}</ul>
}

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour à l&apos;accueil</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">CarbonTrack</span>
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-brand-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conditions Générales d&apos;Utilisation</h1>
            <p className="text-sm text-gray-500 mt-1">
              Version 1.1 — En vigueur depuis le 17 mai 2026
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <Section title="Article 1 — Objet">
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent
              l&apos;accès et l&apos;utilisation de la plateforme CarbonTrack (« la Plateforme »),
              éditée par <strong>GreenLeaves SARL</strong>.
            </p>
            <p>
              La Plateforme offre des services de mesure, déclaration, audit et certification de
              bilans carbone (gaz à effet de serre, GES) conformes aux standards internationaux :{' '}
              <strong>GHG Protocol Corporate Standard</strong>, <strong>ISO 14064-1</strong>{' '}
              (Quantification et déclaration des émissions de GES) et <strong>ISO 14069</strong>{' '}
              (Guide d&apos;application).
            </p>
          </Section>

          <Section title="Article 2 — Acceptation des CGU">
            <p>
              La création d&apos;un compte et l&apos;utilisation de la Plateforme valent
              acceptation sans réserve des présentes CGU et de la{' '}
              <Link href="/privacy" className="text-brand-600 underline font-semibold">
                Politique de confidentialité
              </Link>{' '}
              associée.
            </p>
            <p>
              En cochant la case d&apos;acceptation lors de l&apos;inscription, vous reconnaissez
              avoir pris connaissance des présentes CGU et de la Politique de confidentialité,
              et vous engagez à les respecter intégralement.
            </p>
          </Section>

          <Section title="Article 3 — Inscription et compte utilisateur">
            <p>
              L&apos;inscription est ouverte aux personnes morales (entreprises, ONG,
              administrations) représentées par une personne physique majeure dûment habilitée à
              engager la structure.
            </p>
            <UL>
              <li>Les informations fournies doivent être exactes, complètes et tenues à jour</li>
              <li>L&apos;utilisateur est responsable de la confidentialité de ses identifiants</li>
              <li>Tout usage du compte est réputé fait par son titulaire</li>
              <li>
                Tout incident de sécurité (usurpation, accès non autorisé) doit être signalé sans
                délai à{' '}
                <a href="mailto:support@greenleaves.ga" className="text-brand-600 underline">
                  support@greenleaves.ga
                </a>
              </li>
            </UL>
          </Section>

          <Section title="Article 4 — Services proposés">
            <UL>
              <li>Création et gestion de sites d&apos;exploitation</li>
              <li>Saisie et calcul de bilans carbone (Scopes 1, 2 et 3)</li>
              <li>Génération de rapports PDF conformes aux normes internationales</li>
              <li>Demande de certification par expert indépendant accrédité</li>
              <li>Accès à un assistant méthodologique</li>
              <li>Notifications et suivi de l&apos;avancement des demandes</li>
            </UL>
          </Section>

          <Section title="Article 5 — Abonnement et tarification">
            <p>
              Certains services nécessitent un abonnement payant. Les conditions tarifaires
              actualisées sont détaillées sur la page « Abonnement » de la Plateforme.
            </p>
            <UL>
              <li>
                Les paiements peuvent être effectués par Mobile Money (Airtel Money, Moov Money),
                carte bancaire ou virement, selon les méthodes activées
              </li>
              <li>L&apos;abonnement est valable pour la durée souscrite (mensuelle ou annuelle)</li>
              <li>Aucun remboursement n&apos;est dû pour les périodes entamées</li>
              <li>
                Le renouvellement n&apos;est pas automatique sauf indication contraire au moment
                de la souscription
              </li>
            </UL>
          </Section>

          <Section title="Article 6 — Obligations de l'utilisateur">
            <UL>
              <li>Fournir des données exactes, complètes et sincères</li>
              <li>Conserver les pièces justificatives originales pendant 10 ans</li>
              <li>Coopérer de bonne foi avec l&apos;expert auditeur assigné</li>
              <li>
                Respecter les standards méthodologiques applicables (GHG Protocol, ISO 14064-1,
                ISO 14069)
              </li>
              <li>Ne pas tenter d&apos;altérer, contourner ou pirater la Plateforme</li>
              <li>Ne pas utiliser la Plateforme à des fins illicites ou frauduleuses</li>
              <li>Respecter les droits de propriété intellectuelle de GreenLeaves et des tiers</li>
            </UL>
          </Section>

          <Section title="Article 7 — Audit et certification">
            <p>
              Les certificats émis par CarbonTrack attestent qu&apos;un bilan carbone a été
              calculé selon les standards <strong>GHG Protocol</strong>, <strong>ISO 14064-1</strong>{' '}
              et <strong>ISO 14069</strong>, et qu&apos;il a été revu et validé par un expert
              indépendant accrédité par GreenLeaves.
            </p>
            <p>
              La valeur du certificat est subordonnée :
            </p>
            <UL>
              <li>À l&apos;exactitude des données déclarées par l&apos;utilisateur</li>
              <li>À la conformité de l&apos;audit réalisé par l&apos;expert accrédité</li>
              <li>Au respect des présentes CGU</li>
            </UL>
            <p>
              <strong>
                En cas de fausse déclaration, le certificat peut être révoqué et
                l&apos;utilisateur engage sa responsabilité civile et pénale.
              </strong>
            </p>
            <p>
              Les certificats CarbonTrack constituent une attestation contractuelle de bonne
              exécution méthodologique. Leur valeur juridique vis-à-vis d&apos;une réglementation
              spécifique (locale ou internationale) dépend du cadre normatif applicable à
              l&apos;utilisateur, qu&apos;il lui appartient de vérifier.
            </p>
          </Section>

          <Section title="Article 8 — Propriété intellectuelle">
            <p>
              La Plateforme, son code source, son design, ses logos, ses méthodologies et sa
              documentation sont la propriété exclusive de GreenLeaves SARL. Toute reproduction,
              représentation, modification ou exploitation non autorisée est strictement interdite
              et expose son auteur aux sanctions prévues par les lois sur la propriété
              intellectuelle.
            </p>
            <p>
              Les données de bilan saisies par l&apos;utilisateur restent sa propriété.
              L&apos;utilisateur concède à GreenLeaves une licence d&apos;usage non exclusive,
              strictement nécessaire à l&apos;exécution des services contractés (calcul,
              stockage, transmission à l&apos;expert auditeur).
            </p>
          </Section>

          <Section title="Article 9 — Disponibilité et maintenance">
            <p>
              GreenLeaves s&apos;engage à fournir un service avec un objectif de disponibilité de
              <strong> 99 %</strong> sur l&apos;année, hors maintenance planifiée et cas de force
              majeure (panne opérateur télécom, coupure d&apos;électricité, catastrophe naturelle,
              etc.).
            </p>
            <p>
              Les opérations de maintenance planifiée sont annoncées au moins{' '}
              <strong>48 heures</strong> à l&apos;avance par email et par notification dans la
              Plateforme, sauf urgence sécuritaire impérieuse.
            </p>
          </Section>

          <Section title="Article 10 — Responsabilité">
            <p>
              La Plateforme est fournie « en l&apos;état » et selon les meilleurs efforts.
              GreenLeaves ne saurait être tenue responsable :
            </p>
            <UL>
              <li>De l&apos;exactitude des données saisies par l&apos;utilisateur</li>
              <li>Des conséquences d&apos;une certification annulée pour fausse déclaration</li>
              <li>D&apos;une interruption de service due à un cas de force majeure</li>
              <li>De dommages indirects (perte de profit, perte de marché, atteinte à l&apos;image)</li>
            </UL>
            <p>
              <strong>
                La responsabilité totale de GreenLeaves, tous préjudices confondus, est limitée
                au montant des abonnements effectivement payés au cours des 12 mois précédant
                l&apos;évènement dommageable.
              </strong>
            </p>
          </Section>

          <Section title="Article 11 — Suspension et résiliation">
            <p>GreenLeaves se réserve le droit de suspendre ou résilier un compte en cas de :</p>
            <UL>
              <li>Violation des présentes CGU</li>
              <li>Fraude, fausse déclaration ou tentative d&apos;altération de la Plateforme</li>
              <li>Défaut de paiement après mise en demeure restée infructueuse pendant 15 jours</li>
              <li>Utilisation contraire aux lois et règlements en vigueur</li>
            </UL>
            <p>
              L&apos;utilisateur peut résilier son compte à tout moment depuis l&apos;interface
              ou par email à{' '}
              <a href="mailto:support@greenleaves.ga" className="text-brand-600 underline">
                support@greenleaves.ga
              </a>
              . Les données seront effacées dans les conditions prévues à la{' '}
              <Link href="/privacy" className="text-brand-600 underline font-semibold">
                Politique de confidentialité
              </Link>{' '}
              (sous réserve des obligations légales de conservation).
            </p>
          </Section>

          <Section title="Article 12 — Modifications des CGU">
            <p>
              Les présentes CGU peuvent être modifiées. Toute modification substantielle est
              notifiée <strong>30 jours</strong> avant son entrée en vigueur par email et par
              notification dans la Plateforme. Le maintien du compte au-delà de cette période
              vaut acceptation des nouvelles conditions.
            </p>
          </Section>

          <Section title="Article 13 — Droit applicable et juridiction compétente">
            <p>
              Les présentes CGU sont régies par le droit gabonais. Tout litige relatif à leur
              interprétation ou à leur exécution sera soumis à une tentative de règlement amiable
              préalable pendant un délai minimum de <strong>30 jours</strong>.
            </p>
            <p>
              À défaut d&apos;accord amiable, les tribunaux compétents sont ceux du ressort de
              Libreville (République Gabonaise).
            </p>
          </Section>

          <Section title="Article 14 — Contact">
            <p>
              <strong>GreenLeaves SARL</strong>
              <br />
              Libreville, République Gabonaise
            </p>
            <p>
              Support :{' '}
              <a href="mailto:support@greenleaves.ga" className="text-brand-600 underline">
                support@greenleaves.ga
              </a>
              <br />
              Juridique :{' '}
              <a href="mailto:legal@greenleaves.ga" className="text-brand-600 underline">
                legal@greenleaves.ga
              </a>
              <br />
              Protection des données :{' '}
              <a href="mailto:dpo@greenleaves.ga" className="text-brand-600 underline">
                dpo@greenleaves.ga
              </a>
            </p>
          </Section>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          CarbonTrack © GreenLeaves SARL — Tous droits réservés
        </p>
      </article>
    </div>
  )
}
