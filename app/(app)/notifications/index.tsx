import { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import type { Notification, NotificationsResponse } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

function fmtRelative(d: string) {
  const diffMs = Date.now() - new Date(d).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1)   return 'À l\'instant';
  if (min < 60)  return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7)  return `il y a ${days} j`;
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  cert_request:    { icon: 'paper-plane-outline',    color: '#2563eb', bg: '#dbeafe' },
  cert_assigned:   { icon: 'person-outline',         color: '#7c3aed', bg: '#ede9fe' },
  cert_validated:  { icon: 'checkmark-circle',       color: '#16a34a', bg: '#dcfce7' },
  cert_rejected:   { icon: 'close-circle',           color: '#dc2626', bg: '#fee2e2' },
  cert_comment:    { icon: 'chatbubble-outline',     color: '#0891b2', bg: '#cffafe' },
};

function metaFor(type: string) {
  return TYPE_META[type] ?? { icon: 'notifications-outline', color: '#6b7280', bg: '#f3f4f6' };
}

// Map web app links to mobile routes (mobile is company-only)
function mobilePathFor(webLink: string | null): string | null {
  if (!webLink) return null;
  if (webLink.startsWith('/dashboard/certifications')) return '/(app)/certifications';
  if (webLink.startsWith('/dashboard/assessments'))    return '/(app)/assessments';
  if (webLink.startsWith('/dashboard'))                return '/(app)';
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<NotificationsResponse>('/api/notifications');
      setItems(data.notifications ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleOpen = async (n: Notification) => {
    // Optimistically mark read
    if (!n.read) {
      setItems(prev => prev.map(i => i.id === n.id ? { ...i, read: true } : i));
      apiFetch(`/api/notifications/${n.id}`, { method: 'PATCH' }).catch(() => {});
    }
    const dest = mobilePathFor(n.link);
    if (dest) router.push(dest as never);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setItems(prev => prev.map(i => ({ ...i, read: true })));
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de tout marquer comme lu.');
    }
  };

  if (loading) return <LoadingSpinner />;

  const unreadCount = items.filter(i => !i.read).length;

  return (
    <FlatList
      data={items}
      keyExtractor={n => String(n.id)}
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      ListHeaderComponent={
        unreadCount > 0 ? (
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-sm font-medium text-gray-600">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text className="text-sm font-semibold text-brand-600">Tout marquer comme lu</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View className="mt-12">
          <EmptyState
            icon="notifications-off-outline"
            title="Aucune notification"
            description="Vous serez notifié des mises à jour de vos demandes ici."
          />
        </View>
      }
      renderItem={({ item: n }) => {
        const meta = metaFor(n.type);
        return (
          <TouchableOpacity
            onPress={() => handleOpen(n)}
            activeOpacity={0.85}
            className={`flex-row gap-3 bg-white border rounded-2xl p-4 mb-2 ${
              n.read ? 'border-gray-100' : 'border-brand-200 bg-brand-50/30'
            }`}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
              style={{ backgroundColor: meta.bg }}
            >
              <Ionicons name={meta.icon} size={20} color={meta.color} />
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>
                  {n.title}
                </Text>
                {!n.read && (
                  <View className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
                )}
              </View>
              <Text className="text-xs text-gray-600 mt-0.5" numberOfLines={2}>
                {n.message}
              </Text>
              <Text className="text-xs text-gray-400 mt-1.5">
                {fmtRelative(n.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}
