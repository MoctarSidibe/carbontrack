import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-base font-bold text-gray-900 mb-2">{title}</Text>
      <View className="gap-2">{children}</View>
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm text-gray-700 leading-6">{children}</Text>;
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-sm text-gray-700">•</Text>
      <Text className="text-sm text-gray-700 leading-6 flex-1">{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-3"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900">Politique de confidentialité</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <Text className="text-xs text-gray-500 mb-4">
          Version 1.1 — En vigueur depuis le 17 mai 2026
        </Text>

        <Section title="1. Préambule">
          <P>
            La présente Politique de confidentialité décrit les modalités de collecte,
            d&apos;utilisation, de conservation et de protection des données à caractère personnel
            traitées par CarbonTrack (ci-après « la Plateforme »), édité par GreenLeaves SARL,
            dans le cadre de la fourniture de services de mesure, déclaration et certification de
            bilans carbone (GES) destinés aux entreprises.
          </P>
          <P>
            Notre traitement des données est aligné sur les principes du{' '}
            <Text className="font-semibold">
              Règlement Général sur la Protection des Données (RGPD — UE 2016/679)
            </Text>
            , considérés comme le standard international le plus exigeant en matière de
            protection des données personnelles, ainsi que sur les bonnes pratiques de sécurité
            de l&apos;information (ISO/IEC 27001, ISO/IEC 27701).
          </P>
        </Section>

        <Section title="2. Responsable du traitement">
          <P>
            Le responsable du traitement est <Text className="font-semibold">GreenLeaves SARL</Text>,
            dont le siège social est à Libreville, République Gabonaise.
          </P>
          <P>
            Contact du Délégué à la Protection des Données (DPO) : dpo@greenleaves.ga
          </P>
        </Section>

        <Section title="3. Données collectées">
          <P>Dans le cadre de votre utilisation de la Plateforme, nous collectons :</P>
          <Text className="text-sm font-semibold text-gray-900 mt-2">Données d&apos;identification</Text>
          <LI>Nom, prénom, adresse email, numéro de téléphone</LI>
          <LI>Identifiants de connexion (mot de passe chiffré via bcrypt — jamais stocké en clair)</LI>
          <Text className="text-sm font-semibold text-gray-900 mt-2">Données de l&apos;entreprise</Text>
          <LI>Raison sociale, numéro d&apos;immatriculation, secteur d&apos;activité</LI>
          <LI>Adresse, logo, sites d&apos;exploitation</LI>
          <Text className="text-sm font-semibold text-gray-900 mt-2">Données métier (bilan GES)</Text>
          <LI>Consommations énergétiques, transports, déchets, intrants</LI>
          <LI>Factures et pièces justificatives téléversées</LI>
          <LI>Résultats de calculs d&apos;émissions, rapports d&apos;audit</LI>
          <Text className="text-sm font-semibold text-gray-900 mt-2">Données techniques</Text>
          <LI>Adresse IP, horodatage des connexions, type d&apos;appareil</LI>
          <LI>Cookies strictement nécessaires (session, authentification, sécurité CSRF)</LI>
          <P>
            Nous appliquons le <Text className="font-semibold">principe de minimisation</Text> :
            seules les données strictement nécessaires aux finalités décrites sont collectées.
          </P>
        </Section>

        <Section title="4. Finalités du traitement">
          <P>Vos données sont traitées exclusivement pour :</P>
          <LI>Créer et gérer votre compte utilisateur et celui de votre entreprise</LI>
          <LI>Calculer et stocker vos bilans carbone conformément aux normes GHG Protocol, ISO 14064-1 et ISO 14069</LI>
          <LI>Permettre la revue et l&apos;audit par des experts indépendants accrédités</LI>
          <LI>Émettre les rapports et certificats officiels de bilan</LI>
          <LI>Vous notifier des changements d&apos;état de vos demandes et abonnements</LI>
          <LI>Améliorer la Plateforme et prévenir la fraude et les abus</LI>
          <LI>Répondre à nos obligations légales, comptables et fiscales</LI>
        </Section>

        <Section title="5. Bases légales">
          <P>
            Conformément aux principes RGPD, chaque traitement repose sur l&apos;une des bases
            légales suivantes :
          </P>
          <LI><Text className="font-semibold">Exécution du contrat</Text> qui vous lie à la Plateforme (CGU)</LI>
          <LI><Text className="font-semibold">Consentement</Text> explicite recueilli à l&apos;inscription, révocable à tout moment</LI>
          <LI><Text className="font-semibold">Obligation légale</Text> pour les déclarations comptables et fiscales applicables</LI>
          <LI><Text className="font-semibold">Intérêt légitime</Text> pour la sécurité et la prévention de la fraude</LI>
        </Section>

        <Section title="6. Destinataires des données">
          <P>Vos données peuvent être communiquées à :</P>
          <LI>Le personnel autorisé de GreenLeaves (principe du moindre privilège)</LI>
          <LI>Les experts auditeurs accrédités assignés à votre dossier, soumis à confidentialité stricte</LI>
          <LI>Nos sous-traitants techniques (hébergement, sauvegarde, messagerie) liés par contrat de sous-traitance conforme RGPD</LI>
          <LI>Les autorités administratives ou judiciaires compétentes, sur réquisition légale dûment motivée</LI>
          <P>
            <Text className="font-semibold">
              Aucune donnée n&apos;est vendue, louée ou cédée à des tiers à des fins
              publicitaires ou commerciales.
            </Text>
          </P>
        </Section>

        <Section title="7. Transferts internationaux">
          <P>
            Vos données sont hébergées prioritairement en Europe auprès de sous-traitants
            certifiés ISO/IEC 27001. Tout transfert vers un pays tiers est encadré par des
            garanties appropriées (clauses contractuelles types de la Commission Européenne,
            certifications reconnues) ou requiert votre consentement explicite préalable.
          </P>
        </Section>

        <Section title="8. Durée de conservation">
          <LI>Données de compte : durée d&apos;utilisation + 3 ans</LI>
          <LI>Bilans carbone et certificats : 10 ans (obligation comptable + traçabilité)</LI>
          <LI>Pièces justificatives d&apos;audit : 10 ans</LI>
          <LI>Logs techniques : 12 mois maximum</LI>
          <LI>Données de facturation : 10 ans (obligation comptable)</LI>
        </Section>

        <Section title="9. Sécurité">
          <P>
            Conformément à l&apos;article 32 du RGPD, nous mettons en œuvre :
          </P>
          <LI>Chiffrement TLS 1.3 pour toutes les communications</LI>
          <LI>Mots de passe stockés avec bcrypt (salt + hash)</LI>
          <LI>Tokens d&apos;authentification JWT signés avec rotation</LI>
          <LI>Sauvegardes chiffrées quotidiennes hors-site</LI>
          <LI>Contrôle d&apos;accès strict par rôle (RBAC) avec moindre privilège</LI>
          <LI>Journalisation des accès aux données sensibles</LI>
          <LI>Audits de sécurité périodiques</LI>
          <LI>Plan de réponse aux incidents — notification sous 72h</LI>
        </Section>

        <Section title="10. Vos droits">
          <P>
            Conformément aux principes du RGPD et aux lois applicables sur la protection des
            données, vous disposez des droits suivants :
          </P>
          <LI><Text className="font-semibold">Droit d&apos;accès</Text> — obtenir copie de vos données</LI>
          <LI><Text className="font-semibold">Droit de rectification</Text> — corriger les données inexactes</LI>
          <LI><Text className="font-semibold">Droit à l&apos;effacement</Text> (« droit à l&apos;oubli ») — sous réserve des obligations légales</LI>
          <LI><Text className="font-semibold">Droit à la limitation</Text> du traitement</LI>
          <LI><Text className="font-semibold">Droit d&apos;opposition</Text> à certains traitements</LI>
          <LI><Text className="font-semibold">Droit à la portabilité</Text> — récupérer vos données en format JSON / CSV</LI>
          <LI><Text className="font-semibold">Droit de retirer votre consentement</Text> à tout moment</LI>
          <LI><Text className="font-semibold">Droit d&apos;introduire une réclamation</Text> auprès de l&apos;autorité de protection des données compétente</LI>
          <P>
            Pour exercer ces droits : <Text className="font-semibold">dpo@greenleaves.ga</Text>.
            Réponse sous 30 jours maximum.
          </P>
        </Section>

        <Section title="11. Cookies">
          <P>
            La Plateforme utilise exclusivement des cookies strictement nécessaires (session,
            authentification, sécurité CSRF). Aucun cookie publicitaire, de profilage ou de
            tracking tiers n&apos;est utilisé.
          </P>
        </Section>

        <Section title="12. Notification d'incidents">
          <P>
            En cas de violation de données susceptible d&apos;engendrer un risque pour vos droits
            et libertés, vous serez informé dans les meilleurs délais (objectif : 72 heures)
            avec la nature de la violation, les conséquences probables et les mesures prises.
          </P>
        </Section>

        <Section title="13. Modifications">
          <P>
            La présente Politique peut être modifiée. Toute modification substantielle vous sera
            notifiée par email et par notification dans la Plateforme au moins 30 jours avant son
            entrée en vigueur.
          </P>
        </Section>

        <Section title="14. Contact">
          <P>
            Délégué à la Protection des Données (DPO) :{'\n'}
            <Text className="font-semibold">dpo@greenleaves.ga</Text>
          </P>
          <P>
            Service Support :{'\n'}
            <Text className="font-semibold">support@greenleaves.ga</Text>
          </P>
        </Section>

        <View className="mt-4 mb-2 pt-4 border-t border-gray-100">
          <Text className="text-xs text-gray-400 text-center">
            CarbonTrack © GreenLeaves SARL — Tous droits réservés
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
