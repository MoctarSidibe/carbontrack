import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import type { Site } from '@/lib/types';

export default function NewAssessmentScreen() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Site[]>('/api/sites').then(setSites).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Le nom est obligatoire.'); return; }
    if (!siteId) { setError('Sélectionnez un site.'); return; }
    if (!year || isNaN(parseInt(year))) { setError('Année invalide.'); return; }
    setError('');
    setLoading(true);
    try {
      const newAssessment = await apiFetch<{ id: number }>('/api/assessments', {
        method: 'POST',
        body: JSON.stringify({ siteId, name: name.trim(), year: parseInt(year) }),
      });
      // Navigate to the new assessment's emissions entry screen
      router.replace(`/(app)/assessments/${newAssessment.id}/emissions` as any);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors de la création.');
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

          {/* Name */}
          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1.5">Nom du bilan *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Bilan 2025 - Siège"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Year */}
          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1.5">Année *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              placeholder="2025"
              placeholderTextColor="#9ca3af"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          {/* Site picker */}
          <View>
            <Text className="text-xs font-medium text-gray-500 mb-1.5">Site *</Text>
            {sites.length === 0 ? (
              <Text className="text-sm text-gray-400">Aucun site disponible. Créez-en un d'abord.</Text>
            ) : (
              sites.map(s => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSiteId(s.id)}
                  className={`flex-row items-center px-4 py-3 mb-2 rounded-xl border ${siteId === s.id ? 'bg-brand-50 border-brand-300' : 'bg-gray-50 border-gray-200'}`}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${siteId === s.id ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}>
                    {siteId === s.id && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-900">{s.name}</Text>
                    <Text className="text-xs text-gray-500">{s.type}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <TouchableOpacity
          className={`mt-4 bg-brand-500 rounded-2xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Créer le bilan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="mt-3 py-3 items-center" onPress={() => router.back()}>
          <Text className="text-gray-500">Annuler</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
