import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, Image
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import { removeToken } from '@/lib/auth';
import { API_URL } from '@/constants/config';
import type { Assessment, Site, MeResponse, Certification } from '@/lib/types';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';

function fmt(n: number | null) {
  const v = Number(n);
  if (!v || isNaN(v)) return '0';
  if (v >= 1000) return (v / 1000).toFixed(1) + ' t';
  return v.toFixed(1) + ' kg';
}

function statusColor(s: string): 'gray' | 'yellow' | 'green' | 'blue' {
  if (s === 'completed') return 'green';
  if (s === 'in_progress') return 'blue';
  return 'gray';
}
function statusLabel(s: string) {
  if (s === 'completed') return 'Terminé';
  if (s === 'in_progress') return 'En cours';
  return 'Brouillon';
}

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [meData, asData, siData, certData] = await Promise.all([
        apiFetch<MeResponse>('/api/auth/me'),
        apiFetch<Assessment[]>('/api/assessments'),
        apiFetch<Site[]>('/api/sites'),
        apiFetch<Certification[]>('/api/certifications').catch(() => [] as Certification[]),
      ]);
      setMe(meData);
      setAssessments(asData);
      setSites(siData);
      setCerts(certData);
      setError('');
    } catch (e: any) {
      if (e?.status === 401) {
        await removeToken();
        router.replace('/login');
      } else {
        setError(e?.message ?? 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  // Fix: Number() coercion because PostgreSQL returns numerics as strings
  const totalCo2 = assessments.reduce((s, a) => s + (Number(a.total_co2eq) || 0), 0);
  const recent = assessments.slice(0, 3);

  const certifiedCount = certs.filter(c => c.status === 'certified').length;
  const pendingCertCount = certs.filter(c => ['pending', 'assigned', 'in_progress'].includes(c.status)).length;

  // Subscription expiry
  const subExpiresAt = (me?.subscription as any)?.expiresAt ?? null;
  const subDays = subExpiresAt
    ? Math.max(0, Math.ceil((new Date(subExpiresAt).getTime() - Date.now()) / 86400000))
    : null;
  const subExpiringSoon = subDays !== null && subDays <= 14;
  const subInactive = !me?.subscription || me.subscription.status !== 'active';

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
    >
      {/* Greeting */}
      <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-sm text-gray-400 mb-0.5">Bienvenue,</Text>
            <Text className="text-xl font-extrabold text-gray-900" numberOfLines={1}>
              {me?.firstName}{me?.lastName ? ` ${me.lastName}` : ''}
            </Text>
            <Text className="text-base font-bold text-brand-600 mt-0.5" numberOfLines={2}>
              {me?.company?.name}
            </Text>
            {/* Sector */}
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <Ionicons name="business-outline" size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400" numberOfLines={1}>
                {me?.company?.sector ?? 'Entreprise'}
              </Text>
            </View>
          </View>
          
          {/* Company Logo rendering */}
          {(me?.company as any)?.logoUrl && (
            <View className="w-20 h-20 flex items-center justify-center ml-4">
              <Image
                source={{ uri: (me?.company as any).logoUrl.startsWith('http') ? (me?.company as any).logoUrl : `${API_URL}${(me?.company as any).logoUrl}` }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            </View>
          )}
        </View>

        {/* Subscription pill — clearly tappable */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/subscription' as any)}
          activeOpacity={0.75}
          style={{
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: me?.subscription?.status === 'active' ? '#f0fdf4' : '#fef2f2',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: me?.subscription?.status === 'active' ? '#bbf7d0' : '#fecaca',
          }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={me?.subscription?.status === 'active' ? '#16a34a' : '#ef4444'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: me?.subscription?.status === 'active' ? '#15803d' : '#dc2626',
              flex: 1,
            }}
          >
            {me?.subscription?.status === 'active'
              ? `Abonnement ${(me.subscription as any).plan ?? ''} · Actif`
              : 'Aucun abonnement actif'}
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 3,
            backgroundColor: me?.subscription?.status === 'active' ? '#dcfce7' : '#fee2e2',
            borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: me?.subscription?.status === 'active' ? '#16a34a' : '#dc2626' }}>
              Gérer
            </Text>
            <Ionicons
              name="chevron-forward"
              size={11}
              color={me?.subscription?.status === 'active' ? '#16a34a' : '#dc2626'}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Subscription warning — only when expiring soon or inactive */}
      {(subExpiringSoon || subInactive) && (
        <TouchableOpacity
          onPress={() => router.push('/(app)/subscription' as any)}
          activeOpacity={0.88}
          className="mb-4"
        >
          <View
            className="rounded-2xl px-4 py-3 flex-row items-center"
            style={{
              backgroundColor: subInactive ? '#fef2f2' : '#fffbeb',
              borderWidth: 1,
              borderColor: subInactive ? '#fecaca' : '#fcd34d',
            }}
          >
            <Ionicons
              name={subInactive ? 'alert-circle-outline' : 'warning-outline'}
              size={16}
              color={subInactive ? '#ef4444' : '#d97706'}
              style={{ marginRight: 8 }}
            />
            <Text
              className={`flex-1 text-xs font-semibold ${subInactive ? 'text-red-600' : 'text-amber-700'}`}
            >
              {subInactive
                ? 'Aucun abonnement actif — Souscrire'
                : `Abonnement expire dans ${subDays} jour${subDays !== 1 ? 's' : ''} — Renouveler`}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={subInactive ? '#ef4444' : '#d97706'} />
          </View>
        </TouchableOpacity>
      )}

      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <Text className="text-red-600 text-sm">{error}</Text>
        </View>
      ) : null}

      {/* Stats */}
      <View className="flex-row gap-3 mb-3">
        <StatCard
          label="CO₂ total"
          value={fmt(totalCo2)}
          sub="éq. CO₂"
          accent
          icon="leaf"
        />
        <StatCard
          label="Bilans"
          value={assessments.length}
          sub={assessments.filter(a => a.status === 'completed').length + ' terminés'}
          icon="bar-chart"
          iconColor="#22c55e"
          iconBg="#f0fdf4"
        />
      </View>
      <View className="flex-row gap-3 mb-5">
        <StatCard
          label="Sites"
          value={sites.length}
          sub="enregistrés"
          icon="business"
          iconColor="#3b82f6"
          iconBg="#eff6ff"
        />
        <StatCard
          label="Certifiés"
          value={certifiedCount}
          sub={pendingCertCount > 0 ? `${pendingCertCount} en cours` : 'certifications'}
          icon="ribbon"
          iconColor="#f59e0b"
          iconBg="#fffbeb"
        />
      </View>

      {/* ── Create new bilan CTA ── */}
      <TouchableOpacity
        className="mb-5 rounded-2xl overflow-hidden"
        onPress={() => router.push('/(app)/assessments/new' as any)}
        activeOpacity={0.88}
      >
        <View style={{ backgroundColor: '#16a34a' }} className="px-5 py-4 flex-row items-center">
          <View className="flex-1">
            <Text className="text-white font-extrabold text-base">Nouveau bilan carbone</Text>
            <Text className="text-green-200 text-xs mt-0.5">Démarrer une nouvelle analyse CO₂</Text>
          </View>
          <View
            style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: 10 }}
          >
            <Ionicons name="add" size={26} color="white" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Recent assessments */}
      <SectionHeader
        title="Bilans récents"
        action={{ label: 'Voir tout', onPress: () => router.push('/(app)/assessments' as any) }}
      />
      {recent.length === 0 ? (
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
          <Text className="text-gray-400 text-sm text-center">Aucun bilan pour l'instant.</Text>
        </View>
      ) : (
        recent.map(a => (
          <TouchableOpacity
            key={a.id}
            className="bg-white rounded-2xl p-4 mb-2 border border-gray-100 flex-row items-center justify-between"
            onPress={() => router.push(`/(app)/assessments/${a.id}` as any)}
          >
            <View className="flex-1 mr-3">
              <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>{a.name}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">{a.site_name} · {a.year}</Text>
              <View className="mt-1.5">
                <Badge label={statusLabel(a.status)} variant={statusColor(a.status)} />
              </View>
            </View>
            <View className="items-end">
              <Text className="text-sm font-bold text-brand-600">{fmt(a.total_co2eq)}</Text>
              <Text className="text-xs text-gray-400">CO₂</Text>
              <Ionicons name="chevron-forward" size={14} color="#d1d5db" style={{ marginTop: 4 }} />
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Certifications teaser */}
      {certs.length > 0 && (
        <>
          <SectionHeader
            title="Certifications"
            action={{ label: 'Voir tout', onPress: () => router.push('/(app)/certifications' as any) }}
          />
          {certs.slice(0, 2).map(c => {
            const isPending = ['pending', 'assigned', 'in_progress'].includes(c.status);
            return (
              <View
                key={c.id}
                className={`rounded-2xl p-3.5 mb-2 border flex-row items-center justify-between ${
                  c.status === 'certified' ? 'bg-green-50 border-green-100' :
                  c.status === 'rejected'  ? 'bg-red-50 border-red-100' :
                  'bg-white border-gray-100'
                }`}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <Ionicons
                    name={c.status === 'certified' ? 'checkmark-circle' : c.status === 'rejected' ? 'close-circle' : 'ribbon-outline'}
                    size={18}
                    color={c.status === 'certified' ? '#22c55e' : c.status === 'rejected' ? '#ef4444' : '#9ca3af'}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{c.assessmentName}</Text>
                    <Text className="text-xs text-gray-500">{c.assessmentYear} · {c.siteName}</Text>
                  </View>
                </View>
                {c.status === 'certified' && <Text className="text-xs font-bold text-green-600">Certifié</Text>}
                {c.status === 'rejected'  && <Text className="text-xs font-bold text-red-600">Rejeté</Text>}
                {isPending && <Text className="text-xs text-gray-400">En cours</Text>}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}
