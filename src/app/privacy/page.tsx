import Link from 'next/link'
import { Leaf, ArrowLeft, Shield } from 'lucide-react'

export const metadata = {
  title: 'Politique de confidentialité — CarbonTrack',
  description: 'Politique de confidentialité conforme aux principes du RGPD et aux standards internationaux de protection des données personnelles.',
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
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
            <Shield className="w-6 h-6 text-brand-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
            <p className="text-sm text-gray-500 mt-1">
              Version 1.1 — En vigueur depuis le 17 mai 2026
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <Section title="1. Préambule">
            <p>
              La présente Politique de confidentialité décrit les modalités de collecte,
              d&apos;utilisation, de conservation et de protection des données à caractère
              personnel traitées par CarbonTrack (ci-après « la Plateforme »), édité par
              GreenLeaves SARL, dans le cadre de la fourniture de services de mesure,
              déclaration et certification de bilans carbone (GES) destinés aux entreprises.
            </p>
            <p>
              Notre traitement des données est aligné sur les principes du{' '}
              <strong>Règlement Général sur la Protection des Données (RGPD — UE 2016/679)</strong>,
              considérés comme le standard international le plus exigeant en matière de
              protection des données personnelles, ainsi que sur les bonnes pratiques de sécurité
              de l&apos;information (<strong>ISO/IEC 27001</strong>, <strong>ISO/IEC 27701</strong>).
            </p>
            <p>
              Cette politique s&apos;applique sans préjudice des lois nationales applicables au
              traitement des données personnelles dans les juridictions où nos utilisateurs sont
              établis.
            </p>
          </Section>

          <Section title="2. Responsable du traitement">
            <p>
              Le responsable du traitement est <strong>GreenLeaves SARL</strong>, société dont le
              siège social est à Libreville, République Gabonaise.
            </p>
            <p>
              Contact du Délégué à la Protection des Données (DPO) :{' '}
              <a href="mailto:dpo@greenleaves.ga" className="text-brand-600 underline">
                dpo@greenleaves.ga
              </a>
            </p>
          </Section>

          <Section title="3. Données collectées">
            <p>Dans le cadre de votre utilisation de la Plateforme, nous collectons :</p>

            <h3 className="font-semibold text-gray-900 mt-4">Données d&apos;identification</h3>
            <UL>
              <li>Nom, prénom, adresse email, numéro de téléphone</li>
              <li>Identifiants de connexion (mot de passe chiffré via bcrypt — jamais stocké en clair)</li>
            </UL>

            <h3 className="font-semibold text-gray-900 mt-4">Données de l&apos;entreprise</h3>
            <UL>
              <li>Raison sociale, numéro d&apos;immatriculation, secteur d&apos;activité</li>
              <li>Adresse, logo, sites d&apos;exploitation</li>
            </UL>

            <h3 className="font-semibold text-gray-900 mt-4">Données métier (bilan GES)</h3>
            <UL>
              <li>Consommations énergétiques, transports, déchets, intrants</li>
              <li>Factures et pièces justificatives téléversées</li>
              <li>Résultats de calculs d&apos;émissions, rapports d&apos;audit</li>
            </UL>

            <h3 className="font-semibold text-gray-900 mt-4">Données techniques</h3>
            <UL>
              <li>Adresse IP, horodatage des connexions, type d&apos;appareil et de navigateur</li>
              <li>Cookies strictement nécessaires (session, authentification, protection CSRF)</li>
            </UL>

            <p className="mt-3">
              Nous appliquons le <strong>principe de minimisation</strong> : seules les données
              strictement nécessaires aux finalités décrites ci-dessous sont collectées.
            </p>
          </Section>

          <Section title="4. Finalités du traitement">
            <p>Vos données sont traitées exclusivement pour :</p>
            <UL>
              <li>Créer et gérer votre compte utilisateur et celui de votre entreprise</li>
              <li>
                Calculer et stocker vos bilans carbone conformément aux normes internationales
                <strong> GHG Protocol</strong>, <strong>ISO 14064-1</strong> et <strong>ISO 14069</strong>
              </li>
              <li>Permettre la revue et l&apos;audit par des experts indépendants accrédités</li>
              <li>Émettre les rapports et certificats officiels de bilan</li>
              <li>Vous notifier des changements d&apos;état de vos demandes et abonnements</li>
              <li>Améliorer la Plateforme et prévenir la fraude et les abus</li>
              <li>Répondre à nos obligations légales, comptables et fiscales</li>
            </UL>
          </Section>

          <Section title="5. Bases légales du traitement">
            <p>
              Conformément aux principes RGPD, chaque traitement repose sur l&apos;une des bases
              légales suivantes :
            </p>
            <UL>
              <li>
                <strong>Exécution du contrat</strong> qui vous lie à la Plateforme (Conditions
                Générales d&apos;Utilisation)
              </li>
              <li>
                <strong>Consentement</strong> explicite recueilli au moment de l&apos;inscription
                (case à cocher), révocable à tout moment
              </li>
              <li>
                <strong>Obligation légale</strong> pour les déclarations comptables, fiscales et
                réglementaires applicables
              </li>
              <li>
                <strong>Intérêt légitime</strong> de GreenLeaves pour la sécurité de la
                Plateforme, la prévention de la fraude et l&apos;amélioration des services
              </li>
            </UL>
          </Section>

          <Section title="6. Destinataires des données">
            <p>Vos données peuvent être communiquées aux destinataires suivants :</p>
            <UL>
              <li>Le personnel autorisé de GreenLeaves (selon le principe du moindre privilège)</li>
              <li>
                Les <strong>experts auditeurs accrédités</strong> assignés à votre dossier de
                certification, soumis à des obligations strictes de confidentialité
              </li>
              <li>
                Nos <strong>sous-traitants techniques</strong> (hébergement, sauvegarde,
                messagerie) liés par contrat de sous-traitance conforme RGPD
              </li>
              <li>
                Les <strong>autorités administratives ou judiciaires</strong> compétentes, sur
                réquisition légale dûment motivée
              </li>
            </UL>
            <p>
              <strong>
                Aucune donnée n&apos;est vendue, louée ou cédée à des tiers à des fins
                publicitaires ou commerciales.
              </strong>
            </p>
          </Section>

          <Section title="7. Transferts internationaux">
            <p>
              Vos données sont hébergées prioritairement en Europe (Union Européenne) auprès de
              sous-traitants certifiés <strong>ISO/IEC 27001</strong>. Tout transfert vers un pays
              tiers est encadré par des garanties appropriées (clauses contractuelles types de la
              Commission Européenne, certifications reconnues) ou requiert votre consentement
              explicite préalable.
            </p>
          </Section>

          <Section title="8. Durée de conservation">
            <p>
              Nous appliquons le <strong>principe de limitation de la conservation</strong> :
            </p>
            <UL>
              <li>
                <strong>Données de compte</strong> : pendant toute la durée d&apos;utilisation du
                service + 3 ans après la dernière activité
              </li>
              <li>
                <strong>Bilans carbone et certificats</strong> : 10 ans (durée standard requise
                par les obligations comptables et la traçabilité des certifications)
              </li>
              <li>
                <strong>Pièces justificatives d&apos;audit</strong> : 10 ans
              </li>
              <li><strong>Logs techniques</strong> : 12 mois maximum</li>
              <li>
                <strong>Données de facturation</strong> : 10 ans (obligation comptable)
              </li>
            </UL>
          </Section>

          <Section title="9. Sécurité des données">
            <p>
              Nous mettons en œuvre les mesures techniques et organisationnelles appropriées au
              risque, conformément à l&apos;<strong>article 32 du RGPD</strong> :
            </p>
            <UL>
              <li>Chiffrement <strong>TLS 1.3</strong> pour toutes les communications client–serveur</li>
              <li>Mots de passe stockés avec <strong>bcrypt</strong> (salt + hash, jamais en clair)</li>
              <li>Tokens d&apos;authentification <strong>JWT</strong> signés avec rotation périodique</li>
              <li>Sauvegardes chiffrées quotidiennes hors-site</li>
              <li>Contrôle d&apos;accès strict par rôle (<strong>RBAC</strong>) avec moindre privilège</li>
              <li>Journalisation des accès aux données sensibles</li>
              <li>Audits de sécurité périodiques et tests d&apos;intrusion</li>
              <li>Plan de réponse aux incidents et obligation de notification sous 72h en cas de violation</li>
            </UL>
          </Section>

          <Section title="10. Vos droits">
            <p>
              Conformément aux principes du RGPD et aux lois applicables sur la protection des
              données, vous disposez des droits suivants sur vos données personnelles :
            </p>
            <UL>
              <li>
                <strong>Droit d&apos;accès</strong> — obtenir copie de l&apos;ensemble de vos
                données personnelles
              </li>
              <li>
                <strong>Droit de rectification</strong> — corriger les données inexactes ou
                incomplètes
              </li>
              <li>
                <strong>Droit à l&apos;effacement</strong> (« droit à l&apos;oubli ») — sous
                réserve des obligations légales de conservation
              </li>
              <li>
                <strong>Droit à la limitation</strong> du traitement
              </li>
              <li>
                <strong>Droit d&apos;opposition</strong> — refuser certains traitements pour des
                motifs légitimes
              </li>
              <li>
                <strong>Droit à la portabilité</strong> — récupérer vos données dans un format
                structuré et interopérable (JSON / CSV)
              </li>
              <li>
                <strong>Droit de retirer votre consentement</strong> à tout moment, sans affecter
                la licéité des traitements antérieurs
              </li>
              <li>
                <strong>Droit d&apos;introduire une réclamation</strong> auprès de l&apos;autorité
                de protection des données compétente dans votre juridiction
              </li>
            </UL>
            <p className="mt-3">
              Pour exercer ces droits, contactez notre DPO à{' '}
              <a href="mailto:dpo@greenleaves.ga" className="text-brand-600 underline font-semibold">
                dpo@greenleaves.ga
              </a>
              . Une réponse vous sera apportée dans un délai maximum de <strong>30 jours</strong>.
            </p>
          </Section>

          <Section title="11. Cookies">
            <p>
              La Plateforme utilise exclusivement des <strong>cookies strictement nécessaires</strong>{' '}
              à son fonctionnement (session, authentification, sécurité CSRF). Aucun cookie
              publicitaire, de profilage ou de tracking tiers n&apos;est utilisé. Aucun
              consentement supplémentaire n&apos;est donc requis (exemption prévue par les
              recommandations sur les cookies essentiels).
            </p>
          </Section>

          <Section title="12. Notification d'incidents">
            <p>
              En cas de violation de données à caractère personnel susceptible d&apos;engendrer un
              risque pour vos droits et libertés, vous serez informé dans les meilleurs délais
              (objectif : <strong>72 heures</strong>) avec :
            </p>
            <UL>
              <li>La nature de la violation et les catégories de données concernées</li>
              <li>Les conséquences probables et les mesures prises pour y remédier</li>
              <li>Les recommandations pour atténuer les éventuels effets négatifs</li>
            </UL>
          </Section>

          <Section title="13. Modifications de la Politique">
            <p>
              La présente Politique peut être modifiée pour refléter les évolutions légales,
              techniques ou organisationnelles. Toute modification substantielle vous sera
              notifiée par email et par notification dans la Plateforme au moins{' '}
              <strong>30 jours</strong> avant son entrée en vigueur.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              <strong>Délégué à la Protection des Données (DPO)</strong>
              <br />
              <a href="mailto:dpo@greenleaves.ga" className="text-brand-600 underline">
                dpo@greenleaves.ga
              </a>
            </p>
            <p>
              <strong>Service Support</strong>
              <br />
              <a href="mailto:support@greenleaves.ga" className="text-brand-600 underline">
                support@greenleaves.ga
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
