import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';

const SITE_TYPES = [
  { value: 'agence', label: 'Agence / Succursale' },
  { value: 'boutique', label: 'Boutique / Point de Vente' },
  { value: 'bureau', label: 'Bureau / Siège Social' },
  { value: 'chantier', label: 'Chantier / Construction' },
  { value: 'clinique', label: 'Clinique / Centre Médical' },
  { value: 'datacenter', label: 'Data Center / Informatique' },
  { value: 'ecole', label: 'École / Campus' },
  { value: 'entrepot', label: 'Entrepôt / Stockage' },
  { value: 'exploitation_agricole', label: 'Exploitation Agricole' },
  { value: 'garage', label: 'Garage / Atelier' },
  { value: 'hotel', label: 'Hôtel / Hébergement' },
  { value: 'laboratoire', label: 'Laboratoire / R&D' },
  { value: 'logistique', label: 'Plateforme Logistique' },
  { value: 'magasin', label: 'Magasin' },
  { value: 'restaurant', label: 'Restaurant / Restauration' },
  { value: 'supermarche', label: 'Supermarché / Hypermarché' },
  { value: 'usine', label: 'Usine / Production' },
  { value: 'autre', label: 'Autre' }
];

const COUNTRIES = [
  "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola", "Antigua-et-Barbuda", 
  "Arabie Saoudite", "Argentine", "Arménie", "Australie", "Autriche", "Azerbaïdjan", "Bahamas", "Bahreïn", 
  "Bangladesh", "Barbade", "Belgique", "Bélize", "Bénin", "Bhoutan", "Biélorussie", "Birmanie (Myanmar)", 
  "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Brunei", "Bulgarie", "Burkina Faso", "Burundi", 
  "Cambodge", "Cameroun", "Canada", "Cap-Vert", "Centrafrique", "Chili", "Chine", "Chypre", "Colombie", 
  "Comores", "Congo (Brazzaville)", "Congo (Kinshasa)", "Corée du Nord", "Corée du Sud", "Costa Rica", 
  "Côte d'Ivoire", "Croatie", "Cuba", "Danemark", "Djibouti", "Dominique", "Égypte", "Émirats Arabes Unis", 
  "Équateur", "Érythrée", "Espagne", "Estonie", "Eswatini", "États-Unis", "Éthiopie", "Fidji", "Finlande", 
  "France", "Gabon", "Gambie", "Géorgie", "Ghana", "Grèce", "Grenade", "Guatemala", "Guinée", "Guinée équatoriale", 
  "Guinée-Bissau", "Guyana", "Haïti", "Honduras", "Hongrie", "Inde", "Indonésie", "Irak", "Iran", "Irlande", 
  "Islande", "Israël", "Italie", "Jamaïque", "Japon", "Jordanie", "Kazakhstan", "Kenya", "Kirghizistan", 
  "Kiribati", "Koweït", "Laos", "Lesotho", "Lettonie", "Liban", "Libéria", "Libye", "Liechtenstein", "Lituanie", 
  "Luxembourg", "Macédoine du Nord", "Madagascar", "Malaisie", "Malawi", "Maldives", "Mali", "Malte", "Maroc", 
  "Maurice", "Mauritanie", "Mexique", "Micronésie", "Moldavie", "Monaco", "Mongolie", "Monténégro", "Mozambique", 
  "Namibie", "Nauru", "Népal", "Nicaragua", "Niger", "Nigeria", "Norvège", "Nouvelle-Zélande", "Oman", 
  "Ouganda", "Ouzbékistan", "Pakistan", "Palaos", "Panama", "Papouasie-Nouvelle-Guinée", "Paraguay", "Pays-Bas", 
  "Pérou", "Philippines", "Pologne", "Portugal", "Qatar", "République Dominicaine", "République Tchèque", 
  "Roumanie", "Royaume-Uni", "Russie", "Rwanda", "Saint-Kitts-et-Nevis", "Saint-Marin", "Saint-Vincent-et-les-Grenadines",
  "Sainte-Lucie", "Salvador", "Samoa", "São Tomé-et-Príncipe", "Sénégal", "Serbie", "Seychelles", "Sierra Leone", 
  "Singapour", "Slovaquie", "Slovénie", "Somalie", "Soudan", "Soudan du Sud", "Sri Lanka", "Suède", "Suisse", 
  "Suriname", "Syrie", "Tadjikistan", "Tanzanie", "Tchad", "Thaïlande", "Timor oriental", "Togo", "Tonga", 
  "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu", "Ukraine", "Uruguay", "Vanuatu", 
  "Vatican", "Venezuela", "Vietnam", "Yémen", "Zambie", "Zimbabwe"
];

export default function NewSiteScreen() {
  const router = useRouter();
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('bureau');
  const [country, setCountry] = useState('Gabon');
  const [address, setAddress] = useState('');
  const [surface, setSurface] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Le nom du site est obligatoire.'); return; }
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/sites', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          type,
          country: country.trim() || undefined,
          address: address.trim() || undefined,
          surface: surface ? parseFloat(surface) : undefined,
          description: description.trim() || undefined,
        }),
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors de la création du site.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-3xl p-5 border border-gray-100">
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
            </View>
          ) : null}

          <Field label="Nom du site *">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Siège social, Entrepôt Nord..."
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </Field>

          <Field label="Type de site">
            <View className="flex-row flex-wrap gap-2">
              {SITE_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-full border ${type === t.value ? 'bg-brand-500 border-brand-500' : 'bg-gray-50 border-gray-200'}`}
                >
                  <Text className={`text-xs font-medium ${type === t.value ? 'text-white' : 'text-gray-600'}`}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Pays *">
            <TouchableOpacity
              onPress={() => setShowCountryModal(true)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4"
            >
              <Text className={country ? "text-gray-900" : "text-gray-400"}>
                {country || "Sélectionnez un pays..."}
              </Text>
            </TouchableOpacity>
          </Field>

          <Field label="Adresse">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              placeholder="123 Rue de la Paix, Dakar"
              placeholderTextColor="#9ca3af"
              value={address}
              onChangeText={setAddress}
            />
          </Field>

          <Field label="Surface (m²)">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              placeholder="500"
              placeholderTextColor="#9ca3af"
              value={surface}
              onChangeText={setSurface}
              keyboardType="numeric"
            />
          </Field>

          <Field label="Description" last>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Informations complémentaires..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72 }}
            />
          </Field>
        </View>

        <TouchableOpacity
          className={`mt-4 bg-brand-500 rounded-2xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Créer le site</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-3 py-3 items-center"
          onPress={() => router.back()}
        >
          <Text className="text-gray-500">Annuler</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCountryModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5" style={{ height: '70%' }}>
            <View className="flex-row items-center justify-between mb-4 mt-2">
              <Text className="text-lg font-bold">Sélectionnez un pays</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)} className="bg-gray-100 rounded-full p-1.5">
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {COUNTRIES.map(c => (
                <TouchableOpacity
                  key={c}
                  className="py-3.5 border-b border-gray-100 flex-row items-center justify-between"
                  onPress={() => { setCountry(c); setShowCountryModal(false); }}
                >
                  <Text className={`text-base ${country === c ? 'text-brand-600 font-bold' : 'text-gray-800'}`}>{c}</Text>
                  {country === c && <Ionicons name="checkmark-circle" size={22} color="#16a34a" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View className={last ? '' : 'mb-4'}>
      <Text className="text-xs font-medium text-gray-500 mb-1.5">{label}</Text>
      {children}
    </View>
  );
}
