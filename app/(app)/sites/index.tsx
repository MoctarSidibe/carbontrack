import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, FlatList,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import type { Site } from '@/lib/types';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

const SITE_TYPE_LABELS: Record<string, string> = {
  agence: 'Agence / Succursale',
  boutique: 'Boutique / Point de Vente',
  bureau: 'Bureau / Siège Social',
  chantier: 'Chantier / Construction',
  clinique: 'Clinique / Centre Médical',
  datacenter: 'Data Center / Informatique',
  ecole: 'École / Campus',
  entrepot: 'Entrepôt / Stockage',
  exploitation_agricole: 'Exploitation Agricole',
  garage: 'Garage / Atelier',
  hotel: 'Hôtel / Hébergement',
  laboratoire: 'Laboratoire / R&D',
  logistique: 'Plateforme Logistique',
  magasin: 'Magasin',
  restaurant: 'Restaurant / Restauration',
  supermarche: 'Supermarché / Hypermarché',
  usine: 'Usine / Production',
  autre: 'Autre',
};

export default function SitesScreen() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Site[]>('/api/sites');
      setSites(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingSpinner />;

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={sites}
        keyExtractor={s => String(s.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="Aucun site"
            description="Ajoutez votre premier site pour commencer."
          />
        }
        renderItem={({ item: s }) => (
          <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-gray-900">{s.name}</Text>
                {[s.address, s.country].filter(Boolean).length > 0 ? (
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {[s.address, s.country].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
                <View className="flex-row gap-2 mt-2">
                  <Badge label={SITE_TYPE_LABELS[s.type] ?? s.type} variant="blue" />
                  {s.assessment_count > 0 && (
                    <Badge label={`${s.assessment_count} bilan${s.assessment_count > 1 ? 's' : ''}`} variant="green" />
                  )}
                </View>
              </View>
              {s.surface ? (
                <Text className="text-xs text-gray-400">{s.surface} m²</Text>
              ) : null}
            </View>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-brand-500 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/(app)/sites/new' as any)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
