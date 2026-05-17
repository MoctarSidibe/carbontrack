import { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import { downloadAndShareFile } from '@/lib/download';
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
  pending:    { label: 'En attente',     variant: 'gray',   icon: 'time-outline',           desc: 'Demande soumise, en attente d\'assignation.' },
  assigned:   { label: 'Expert assigné', variant: 'blue',   icon: 'person-outline',         desc: 'Un expert GreenLeaves a été assigné à votre dossier.' },
  in_progress:{ label: 'En vérification',variant: 'yellow', icon: 'search-outline',         desc: 'L\'expert est en cours d\'inspection.' },
  audit_done: { label: 'Audit finalisé', variant: 'yellow', icon: 'checkmark-done-outline', desc: 'L\'audit est terminé. Revue finale en cours.' },
  certified:  { label: 'Certifié',      variant: 'green',  icon: 'checkmark-circle',       desc: 'Le bilan carbone est certifié par GreenLeaves.' },
  rejected:   { label: 'Rejeté',        variant: 'red',    icon: 'close-circle-outline',   desc: 'La demande a été rejetée.' },
};

const STATUS_STEP: Record<CertificationStatus, number> = {
  pending:     0,
  assigned:    1,
  in_progress: 2,
  audit_done:  3,
  certified:   4,
  rejected:    -1,
};

const TIMELINE_LABELS = ['Soumis', 'Expert', 'Audit', 'Revue', 'Certifié'];

function Timeline({ status }: { status: CertificationStatus }) {
  const currentIdx = STATUS_STEP[status] ?? 0;
  const isRejected = status === 'rejected';

  return (
    <View className="flex-row items-center mt-3">
      {TIMELINE_LABELS.map((_, i) => {
        const done = !isRejected && currentIdx >= i;
        const active = !isRejected && currentIdx === i;
        return (
          <View key={i} className="flex-row items-center flex-1">
            <View className={`w-3 h-3 rounded-full border-2 ${done ? 'bg-brand-500 border-brand-500' : active ? 'border-brand-400' : 'border-gray-300'}`} />
            {i < TIMELINE_LABELS.length - 1 && (
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
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownloadPdf = async (cert: Certification) => {
    setDownloadingId(cert.id);
    try {
      await downloadAndShareFile({
        path: `/api/admin/certifications/${cert.id}/generate-pdf`,
        method: 'POST',
        filename: `rapport-audit-${cert.id}.pdf`,
        dialogTitle: `Rapport d'audit — ${cert.assessmentName}`,
      });
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Impossible de télécharger le rapport.');
    } finally {
      setDownloadingId(null);
    }
  };

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

                {/* Inspection scheduling block — shows audit_scheduled_date, location, confirmation state */}
                {(c.auditScheduledDate || c.inspectionDate || c.inspectionProposedDate) && (
                  <View className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <Ionicons name="calendar-outline" size={14} color="#2563eb" />
                      <Text className="text-xs font-bold text-blue-700">Planification de l'inspection</Text>
                      {c.inspectionConfirmed && (
                        <View className="flex-row items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded-full ml-auto">
                          <Ionicons name="checkmark-circle" size={11} color="#16a34a" />
                          <Text className="text-xs font-medium text-green-700">Confirmée</Text>
                        </View>
                      )}
                      {!c.inspectionConfirmed && c.inspectionProposedDate && (
                        <View className="flex-row items-center gap-1 bg-amber-100 px-1.5 py-0.5 rounded-full ml-auto">
                          <Ionicons name="refresh-outline" size={11} color="#b45309" />
                          <Text className="text-xs font-medium text-amber-700">Proposée</Text>
                        </View>
                      )}
                    </View>
                    {(c.auditScheduledDate || c.inspectionDate) && (
                      <Text className="text-xs text-gray-700 mb-0.5">
                        Date prévue : <Text className="font-medium">{fmtDate(c.auditScheduledDate ?? c.inspectionDate)}</Text>
                      </Text>
                    )}
                    {c.auditLocation && (
                      <Text className="text-xs text-gray-600">
                        Lieu : <Text className="font-medium">{c.auditLocation}</Text>
                      </Text>
                    )}
                    {c.inspectionProposedDate && !c.inspectionConfirmed && (
                      <Text className="text-xs text-amber-700 mt-1">
                        {c.inspectionProposedBy === 'expert' ? "L'expert propose : " : "L'admin propose : "}
                        <Text className="font-medium">{fmtDate(c.inspectionProposedDate)}</Text>
                      </Text>
                    )}
                  </View>
                )}

                {/* Expert Report PDF — available after audit_done or certified */}
                {(c.status === 'audit_done' || c.status === 'certified') && (
                  <TouchableOpacity
                    onPress={() => handleDownloadPdf(c)}
                    disabled={downloadingId === c.id}
                    className={`flex-row items-center justify-center gap-2 bg-brand-600 rounded-xl py-2.5 mb-3 ${
                      downloadingId === c.id ? 'opacity-60' : ''
                    }`}
                    activeOpacity={0.85}
                  >
                    {downloadingId === c.id ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Ionicons name="document-text-outline" size={16} color="#ffffff" />
                    )}
                    <Text className="text-sm font-semibold text-white">
                      {downloadingId === c.id ? 'Téléchargement…' : "Télécharger le rapport d'audit"}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Justificatifs joints à la demande */}
                {c.documents && c.documents.length > 0 && (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-2 flex-row items-center">
                      Justificatifs ({c.documents.length})
                    </Text>
                    {c.documents.map(d => (
                      <View
                        key={d.id}
                        className="flex-row items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-1.5"
                      >
                        <Ionicons name="document-attach-outline" size={14} color="#6b7280" />
                        <View className="flex-1 min-w-0">
                          <Text className="text-xs font-medium text-gray-800" numberOfLines={1}>
                            {d.originalName}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            {d.docType} · {(d.fileSize / 1024).toFixed(0)} Ko
                          </Text>
                        </View>
                      </View>
                    ))}
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
