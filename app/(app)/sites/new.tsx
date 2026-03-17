import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';

const SITE_TYPES = [
  { value: 'bureau', label: 'Bureau' },
  { value: 'entrepot', label: 'Entrepôt' },
  { value: 'usine', label: 'Usine' },
  { value: 'magasin', label: 'Magasin' },
  { value: 'chantier', label: 'Chantier' },
  { value: 'datacenter', label: 'Data Center' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'autre', label: 'Autre' },
];

export default function NewSiteScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('bureau');
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
