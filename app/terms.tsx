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

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-3"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900">Conditions Générales d&apos;Utilisation</Text>
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

        <Section title="Article 1 — Objet">
          <P>
            Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent l&apos;accès
            et l&apos;utilisation de la plateforme CarbonTrack (« la Plateforme »), éditée par{' '}
            <Text className="font-semibold">GreenLeaves SARL</Text>.
          </P>
          <P>
            La Plateforme offre des services de mesure, déclaration, audit et certification de
            bilans carbone (gaz à effet de serre, GES) conformes aux standards internationaux :
            GHG Protocol Corporate Standard, ISO 14064-1 (Quantification et déclaration des
            émissions de GES) et ISO 14069 (Guide d&apos;application).
          </P>
        </Section>

        <Section title="Article 2 — Acceptation">
          <P>
            La création d&apos;un compte et l&apos;utilisation de la Plateforme valent
            acceptation sans réserve des présentes CGU et de la Politique de confidentialité
            associée.
          </P>
          <P>
            En cochant la case d&apos;acceptation lors de l&apos;inscription, vous reconnaissez
            avoir pris connaissance des présentes CGU et de la Politique de confidentialité.
          </P>
        </Section>

        <Section title="Article 3 — Inscription et compte">
          <P>
            L&apos;inscription est ouverte aux personnes morales (entreprises, ONG, administrations)
            représentées par une personne physique majeure dûment habilitée à engager la structure.
          </P>
          <LI>Les informations fournies doivent être exactes, complètes et tenues à jour</LI>
          <LI>L&apos;utilisateur est responsable de la confidentialité de ses identifiants</LI>
          <LI>Tout usage du compte est réputé fait par son titulaire</LI>
          <LI>Tout incident de sécurité doit être signalé sans délai : support@greenleaves.ga</LI>
        </Section>

        <Section title="Article 4 — Services proposés">
          <LI>Création et gestion de sites d&apos;exploitation</LI>
          <LI>Saisie et calcul de bilans carbone (Scopes 1, 2 et 3)</LI>
          <LI>Génération de rapports PDF conformes aux normes internationales</LI>
          <LI>Demande de certification par expert indépendant accrédité</LI>
          <LI>Accès à un assistant méthodologique</LI>
          <LI>Notifications et suivi de l&apos;avancement</LI>
        </Section>

        <Section title="Article 5 — Abonnement et tarification">
          <P>
            Certains services nécessitent un abonnement payant. Les conditions tarifaires sont
            détaillées sur la page « Abonnement » de la Plateforme.
          </P>
          <LI>Paiements par Mobile Money (Airtel Money, Moov Money), carte bancaire ou virement, selon les méthodes activées</LI>
          <LI>L&apos;abonnement est valable pour la durée souscrite (mensuelle ou annuelle)</LI>
          <LI>Aucun remboursement n&apos;est dû pour les périodes entamées</LI>
          <LI>Le renouvellement n&apos;est pas automatique sauf indication contraire</LI>
        </Section>

        <Section title="Article 6 — Obligations de l'utilisateur">
          <LI>Fournir des données exactes, complètes et sincères</LI>
          <LI>Conserver les pièces justificatives originales pendant 10 ans</LI>
          <LI>Coopérer de bonne foi avec l&apos;expert auditeur assigné</LI>
          <LI>Respecter les standards méthodologiques applicables (GHG Protocol, ISO 14064-1, ISO 14069)</LI>
          <LI>Ne pas tenter d&apos;altérer, contourner ou pirater la Plateforme</LI>
          <LI>Ne pas utiliser la Plateforme à des fins illicites ou frauduleuses</LI>
        </Section>

        <Section title="Article 7 — Audit et certification">
          <P>
            Les certificats émis par CarbonTrack attestent qu&apos;un bilan carbone a été calculé
            selon les standards GHG Protocol, ISO 14064-1 et ISO 14069, et qu&apos;il a été revu
            et validé par un expert indépendant accrédité par GreenLeaves.
          </P>
          <P>La valeur du certificat est subordonnée :</P>
          <LI>À l&apos;exactitude des données déclarées par l&apos;utilisateur</LI>
          <LI>À la conformité de l&apos;audit réalisé par l&apos;expert accrédité</LI>
          <LI>Au respect des présentes CGU</LI>
          <P>
            <Text className="font-semibold">
              En cas de fausse déclaration, le certificat peut être révoqué et l&apos;utilisateur
              engage sa responsabilité civile et pénale.
            </Text>
          </P>
          <P>
            Les certificats CarbonTrack constituent une attestation contractuelle de bonne
            exécution méthodologique. Leur valeur juridique vis-à-vis d&apos;une réglementation
            spécifique dépend du cadre normatif applicable à l&apos;utilisateur, qu&apos;il lui
            appartient de vérifier.
          </P>
        </Section>

        <Section title="Article 8 — Propriété intellectuelle">
          <P>
            La Plateforme, son code, son design, ses logos, ses méthodologies et sa documentation
            sont la propriété exclusive de GreenLeaves SARL. Toute reproduction, représentation,
            modification ou exploitation non autorisée est interdite.
          </P>
          <P>
            Les données de bilan saisies par l&apos;utilisateur restent sa propriété. L&apos;utilisateur
            concède à GreenLeaves une licence d&apos;usage strictement nécessaire à l&apos;exécution
            des services.
          </P>
        </Section>

        <Section title="Article 9 — Disponibilité et maintenance">
          <P>
            GreenLeaves s&apos;engage à fournir un service avec un objectif de disponibilité de
            99 % sur l&apos;année, hors maintenance planifiée et cas de force majeure.
          </P>
          <P>
            Les opérations de maintenance sont annoncées au moins 48 heures à l&apos;avance par
            email, sauf urgence sécuritaire.
          </P>
        </Section>

        <Section title="Article 10 — Responsabilité">
          <P>
            La Plateforme est fournie « en l&apos;état ». GreenLeaves ne saurait être tenue
            responsable :
          </P>
          <LI>De l&apos;exactitude des données saisies par l&apos;utilisateur</LI>
          <LI>Des conséquences d&apos;une certification annulée pour fausse déclaration</LI>
          <LI>D&apos;une interruption de service due à un cas de force majeure</LI>
          <LI>De dommages indirects (perte de profit, perte de marché)</LI>
          <P>
            La responsabilité totale de GreenLeaves est limitée au montant des abonnements
            effectivement payés au cours des 12 mois précédant le sinistre.
          </P>
        </Section>

        <Section title="Article 11 — Suspension et résiliation">
          <P>GreenLeaves se réserve le droit de suspendre ou résilier un compte en cas de :</P>
          <LI>Violation des présentes CGU</LI>
          <LI>Fraude, fausse déclaration ou tentative d&apos;altération de la Plateforme</LI>
          <LI>Défaut de paiement après mise en demeure</LI>
          <P>
            L&apos;utilisateur peut résilier son compte à tout moment depuis l&apos;interface ou
            par email à support@greenleaves.ga. Les données seront effacées dans les conditions
            prévues à la Politique de confidentialité.
          </P>
        </Section>

        <Section title="Article 12 — Modifications des CGU">
          <P>
            Les CGU peuvent être modifiées. Toute modification substantielle est notifiée 30 jours
            avant son entrée en vigueur. Le maintien du compte vaut acceptation des nouvelles
            conditions.
          </P>
        </Section>

        <Section title="Article 13 — Droit applicable">
          <P>
            Les présentes CGU sont régies par le droit gabonais. Tout litige sera soumis à une
            tentative de règlement amiable préalable. À défaut, les tribunaux compétents sont
            ceux du ressort de Libreville (Gabon).
          </P>
        </Section>

        <Section title="Article 14 — Contact">
          <P>
            <Text className="font-semibold">GreenLeaves SARL</Text>{'\n'}
            Libreville, République Gabonaise{'\n'}
            Support : support@greenleaves.ga{'\n'}
            Juridique : legal@greenleaves.ga{'\n'}
            Protection des données : dpo@greenleaves.ga
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
