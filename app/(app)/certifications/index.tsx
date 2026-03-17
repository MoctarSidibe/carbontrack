import { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import type { Certification, CertificationStatus } from '@/lib/types';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(2) + ' t CO₂';
  return n.toFixed(2) + ' kg CO₂';
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

type BadgeVariant = 'gray' | 'yellow' | 'green' | 'red' | 'blue';

const STATUS_INFO: Record<CertificationStatus, { label: string; variant: BadgeVariant; icon: string; desc: string }> = {
  pending:     { label: 'En attente',      variant: 'gray',   icon: 'time-outline',          desc: 'Demande soumise, en attente d\'assignation.' },
  assigned:    { label: 'Expert assigné',  variant: 'blue',   icon: 'person-outline',        desc: 'Un expert a été assigné à votre dossier.' },
  in_progress: { label: 'En vérification', variant: 'yellow', icon: 'search-outline',        desc: 'L\'expert est en cours d\'inspection.' },
  certified:   { label: 'Certifié',        variant: 'green',  icon: 'checkmark-circle',     desc: 'Le bilan est certifié par l\'expert.' },
  rejected:    { label: 'Rejeté',          variant: 'red',    icon: 'close-circle-outline',  desc: 'La demande a été rejetée.' },
};

function Timeline({ status }: { status: CertificationStatus }) {
  const steps: CertificationStatus[] = ['pending', 'assigned', 'in_progress', 'certified'];
  const currentIdx = steps.indexOf(status);
  const isRejected = status === 'rejected';

  return (
    <View className="flex-row items-center mt-3">
      {steps.map((step, i) => {
        const done = !isRejected && currentIdx >= i;
        const active = !isRejected && currentIdx === i;
        return (
          <View key={step} className="flex-row items-center flex-1">
            <View className={`w-3 h-3 rounded-full border-2 ${done ? 'bg-brand-500 border-brand-500' : active ? 'border-brand-400' : 'border-gray-300'}`} />
            {i < steps.length - 1 && (
              <View className={`flex-1 h-0.5 ${done && currentIdx > i ? 'bg-brand-400' : 'bg-gray-200'}`} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function CertificationsScreen() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Certification[]>('/api/certifications');
      setCerts(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      data={certs}
      keyExtractor={c => String(c.id)}
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      ListEmptyComponent={
        <EmptyState
          icon="ribbon-outline"
          title="Aucune certification"
          description="Soumettez un bilan terminé pour demander une certification."
        />
      }
      renderItem={({ item: c }) => {
        const info = STATUS_INFO[c.status] ?? STATUS_INFO.pending;
        const isExpanded = expanded === c.id;

        return (
          <TouchableOpacity
            className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden"
            onPress={() => setExpanded(isExpanded ? null : c.id)}
            activeOpacity={0.85}
          >
            {/* Result banner for certified/rejected */}
            {c.status === 'certified' && (
              <View className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-green-700">Bilan certifié</Text>
                  {c.certifiedAt && (
                    <Text className="text-xs text-green-600 mt-0.5">
                      {fmtDate(c.certifiedAt)}{c.certificateNumber ? ` · N° ${c.certificateNumber}` : ''}
                    </Text>
                  )}
                </View>
              </View>
            )}
            {c.status === 'rejected' && (
              <View className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex-row items-center gap-2">
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-red-700">Bilan rejeté</Text>
                  {c.rejectionReason && (
                    <Text className="text-xs text-red-600 mt-0.5" numberOfLines={2}>{c.rejectionReason}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Header */}
            <View className="p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>{c.assessmentName}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{c.siteName} · {c.assessmentYear}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Badge label={info.label} variant={info.variant} />
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#9ca3af"
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-xs text-gray-500">Total CO₂</Text>
                <Text className="text-sm font-bold text-brand-600">{fmt(c.totalCo2eq)}</Text>
              </View>

              {/* Timeline */}
              <Timeline status={c.status} />
            </View>

            {/* Expanded details */}
            {isExpanded && (
              <View className="px-4 pb-4 border-t border-gray-50 pt-3">
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons name={info.icon as any} size={14} color="#6b7280" />
                    <Text className="text-xs font-medium text-gray-700">{info.label}</Text>
                  </View>
                  <Text className="text-xs text-gray-500">{info.desc}</Text>
                </View>

                <View className="flex-row gap-2 mb-3">
                  {[
                    { label: 'Scope 1', value: c.scope1 },
                    { label: 'Scope 2', value: c.scope2 },
                    { label: 'Scope 3', value: c.scope3 },
                  ].map(s => (
                    <View key={s.label} className="flex-1 bg-gray-50 rounded-xl p-2">
                      <Text className="text-xs text-gray-500">{s.label}</Text>
                      <Text className="text-xs font-semibold text-gray-800 mt-0.5">{fmt(s.value)}</Text>
                    </View>
                  ))}
                </View>

                {c.expertName && (
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Ionicons name="person-outline" size={13} color="#9ca3af" />
                    <Text className="text-xs text-gray-500">
                      Expert : <Text className="font-medium text-gray-700">{c.expertName}</Text>
                    </Text>
                  </View>
                )}

                {c.inspectionDate && (c.status === 'assigned' || c.status === 'in_progress') && (
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                    <Text className="text-xs text-gray-500">
                      Inspection prévue : <Text className="font-medium text-gray-700">{fmtDate(c.inspectionDate)}</Text>
                    </Text>
                  </View>
                )}

                {c.certificateNumber && (
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Ionicons name="ribbon-outline" size={13} color="#9ca3af" />
                    <Text className="text-xs text-gray-500">
                      Certificat : <Text className="font-medium text-brand-600">N° {c.certificateNumber}</Text>
                    </Text>
                  </View>
                )}

                {c.certifiedAt && (
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Ionicons name="checkmark-circle-outline" size={13} color="#9ca3af" />
                    <Text className="text-xs text-gray-500">
                      Certifié le : <Text className="font-medium text-gray-700">{fmtDate(c.certifiedAt)}</Text>
                    </Text>
                  </View>
                )}

                {c.rejectionReason && c.status === 'rejected' && (
                  <View className="bg-red-50 rounded-xl p-2.5 mb-1.5">
                    <Text className="text-xs font-medium text-red-700 mb-0.5">Motif de rejet</Text>
                    <Text className="text-xs text-red-600">{c.rejectionReason}</Text>
                  </View>
                )}

                <View className="flex-row items-center gap-1.5 mt-1">
                  <Ionicons name="time-outline" size={13} color="#9ca3af" />
                  <Text className="text-xs text-gray-400">
                    Demande soumise le {fmtDate(c.requestedAt)}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}
