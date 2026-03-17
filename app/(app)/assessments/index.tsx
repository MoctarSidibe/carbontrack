import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
  Modal, ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { apiFetch } from '@/lib/api';
import { API_URL } from '@/constants/config';
import type { Assessment, Certification } from '@/lib/types';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

function fmt(n: number | null) {
  const v = Number(n);
  if (!v || isNaN(v)) return '—';
  if (v >= 1000) return (v / 1000).toFixed(1) + ' t';
  return v.toFixed(1) + ' kg';
}

function statusBadge(s: string): { label: string; variant: 'gray' | 'blue' | 'green' } {
  if (s === 'completed') return { label: 'Terminé', variant: 'green' };
  if (s === 'in_progress') return { label: 'En cours', variant: 'blue' };
  return { label: 'Brouillon', variant: 'gray' };
}

function certBadge(s: string): { label: string; variant: 'gray' | 'yellow' | 'green' | 'red' | 'blue' } {
  if (s === 'certified') return { label: 'Certifié', variant: 'green' };
  if (s === 'rejected') return { label: 'Rejeté', variant: 'red' };
  if (s === 'assigned' || s === 'in_progress') return { label: 'En vérification', variant: 'yellow' };
  return { label: 'En attente', variant: 'gray' };
}

export default function AssessmentsScreen() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [certMap, setCertMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [finalizingId, setFinalizingId] = useState<number | null>(null);
  const [qrAssessment, setQrAssessment] = useState<Assessment | null>(null);

  const load = useCallback(async () => {
    try {
      const [asData, certData] = await Promise.all([
        apiFetch<Assessment[]>('/api/assessments'),
        apiFetch<Certification[]>('/api/certifications').catch(() => [] as Certification[]),
      ]);
      setAssessments(asData);
      const map: Record<number, string> = {};
      certData.forEach(c => { map[c.assessmentId] = c.status; });
      setCertMap(map);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (a: Assessment) => {
    Alert.alert(
      'Supprimer ce bilan ?',
      `"${a.name}" sera définitivement supprimé. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(a.id);
            try {
              await apiFetch(`/api/assessments/${a.id}`, { method: 'DELETE' });
              setAssessments(prev => prev.filter(x => x.id !== a.id));
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Impossible de supprimer ce bilan.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleFinalize = (a: Assessment) => {
    Alert.alert(
      'Finaliser ce bilan ?',
      `"${a.name}" sera marqué comme terminé. Vous pourrez ensuite demander la certification.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Finaliser',
          onPress: async () => {
            setFinalizingId(a.id);
            try {
              await apiFetch(`/api/assessments/${a.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'completed' }),
              });
              // Optimistic update: status → completed, cert button will appear
              setAssessments(prev =>
                prev.map(x => x.id === a.id ? { ...x, status: 'completed' } : x)
              );
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Impossible de finaliser.');
            } finally {
              setFinalizingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRequestCert = (a: Assessment) => {
    Alert.alert(
      'Demander une certification',
      `Soumettre "${a.name}" pour certification par un expert CarbonTrack ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: async () => {
            setSubmittingId(a.id);
            try {
              await apiFetch<Certification>('/api/certifications', {
                method: 'POST',
                body: JSON.stringify({ assessmentId: a.id }),
              });
              setCertMap(prev => ({ ...prev, [a.id]: 'pending' }));
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Impossible de soumettre la demande.');
            } finally {
              setSubmittingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View className="flex-1 bg-gray-50">
      {/* ── QR Code Modal ── */}
      <Modal
        visible={!!qrAssessment}
        transparent
        animationType="fade"
        onRequestClose={() => setQrAssessment(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={1}
          onPress={() => setQrAssessment(null)}
        >
          <View style={{
            backgroundColor: '#fff', borderRadius: 24, padding: 28,
            alignItems: 'center', width: 300,
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="qr-code-outline" size={18} color="#22c55e" />
              <Text style={{ fontWeight: '800', fontSize: 15, color: '#111827' }}>QR Code</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 20, textAlign: 'center' }} numberOfLines={1}>
              {qrAssessment?.name}
            </Text>

            {/* QR — only render when assessment is set (Android renders Modal children even when hidden) */}
            <View style={{
              padding: 14, backgroundColor: '#fff', borderRadius: 16,
              borderWidth: 1.5, borderColor: '#e5e7eb',
            }}>
              {qrAssessment !== null && (
                <QRCode
                  value={`${API_URL}/dashboard/assessments/${qrAssessment.id}`}
                  size={180}
                  color="#111827"
                  backgroundColor="#ffffff"
                />
              )}
            </View>

            <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 14, textAlign: 'center' }}>
              Scannez pour accéder au bilan dans l'application web
            </Text>

            <TouchableOpacity
              onPress={() => setQrAssessment(null)}
              style={{
                marginTop: 18, paddingVertical: 10, paddingHorizontal: 28,
                backgroundColor: '#f3f4f6', borderRadius: 12,
              }}
            >
              <Text style={{ fontWeight: '600', color: '#374151', fontSize: 13 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={assessments}
        keyExtractor={a => String(a.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        ListHeaderComponent={
          assessments.length > 0 ? (
            <Text className="text-xs text-gray-400 mb-3">
              {assessments.length} bilan{assessments.length > 1 ? 's' : ''} · Maintenez pour supprimer un brouillon
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="bar-chart-outline"
            title="Aucun bilan carbone"
            description="Créez votre premier bilan pour commencer."
          />
        }
        renderItem={({ item: a }) => {
          const st = statusBadge(a.status);
          const certStatus = certMap[a.id];
          const cert = certStatus ? certBadge(certStatus) : null;
          const isDraft = a.status === 'draft';
          const isDeleting = deletingId === a.id;

          const canFinalize = (a.status === 'draft' || a.status === 'in_progress') && !certStatus && Number(a.total_co2eq) > 0;
          const canCertify = a.status === 'completed' && !certStatus;
          const isSubmitting = submittingId === a.id;
          const isFinalizing = finalizingId === a.id;

          return (
            <TouchableOpacity
              className={`bg-white rounded-2xl p-4 mb-3 border ${
                isDeleting ? 'border-red-200 opacity-50' : 'border-gray-100'
              }`}
              onPress={() => !isDeleting && router.push(`/(app)/assessments/${a.id}` as any)}
              onLongPress={() => isDraft && !isDeleting && handleDelete(a)}
              delayLongPress={500}
              activeOpacity={0.85}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>{a.name}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {a.site_name} · {a.year}
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5 mt-2">
                    <Badge label={st.label} variant={st.variant} />
                    {cert && <Badge label={cert.label} variant={cert.variant} />}
                  </View>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-sm font-bold text-brand-600">{fmt(a.total_co2eq)}</Text>
                  <Text className="text-xs text-gray-400">CO₂ éq.</Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    {/* QR toggle */}
                    <TouchableOpacity
                      onPress={e => { e.stopPropagation?.(); setQrAssessment(a); }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="qr-code-outline" size={14} color="#9ca3af" />
                    </TouchableOpacity>
                    {isDraft ? (
                      <View className="flex-row items-center gap-0.5">
                        <Ionicons name="trash-outline" size={11} color="#d1d5db" />
                        <Text className="text-xs text-gray-300">suppr.</Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
                    )}
                  </View>
                </View>
              </View>

              {/* Finaliser CTA — in_progress bilans */}
              {canFinalize && (
                <TouchableOpacity
                  onPress={e => { e.stopPropagation?.(); handleFinalize(a); }}
                  disabled={isFinalizing}
                  style={{
                    marginTop: 12, paddingTop: 11,
                    borderTopWidth: 1, borderTopColor: '#f3f4f6',
                    flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'center', gap: 7,
                    opacity: isFinalizing ? 0.6 : 1,
                  }}
                >
                  {isFinalizing
                    ? <ActivityIndicator size={14} color="#6366f1" />
                    : <Ionicons name="checkmark-circle-outline" size={15} color="#6366f1" />}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366f1' }}>
                    {isFinalizing ? 'Finalisation…' : 'Finaliser le bilan'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Certification CTA — completed bilans with no cert request yet */}
              {canCertify && (
                <TouchableOpacity
                  onPress={e => { e.stopPropagation?.(); handleRequestCert(a); }}
                  disabled={isSubmitting}
                  style={{
                    marginTop: 12, paddingTop: 11,
                    borderTopWidth: 1, borderTopColor: '#f3f4f6',
                    flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'center', gap: 7,
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting
                    ? <ActivityIndicator size={14} color="#22c55e" />
                    : <Ionicons name="ribbon-outline" size={15} color="#22c55e" />}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#22c55e' }}>
                    {isSubmitting ? 'Envoi en cours…' : 'Demander la certification'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-brand-500 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/(app)/assessments/new' as any)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
