import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import type { Assessment, Report } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

function fmt(n: number) {
  const v = Number(n);
  if (!v || isNaN(v)) return '0';
  if (v >= 1000) return (v / 1000).toFixed(2) + ' t';
  return v.toFixed(2) + ' kg';
}

const CATEGORY_LABELS: Record<string, string> = {
  energy: 'Énergie',
  transport: 'Transport',
  freight: 'Fret',
  waste: 'Déchets',
  water: 'Eau',
  materials: 'Matériaux',
  other: 'Autre',
};

const SCOPE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];
const CAT_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function ReportsScreen() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const data = await apiFetch<Assessment[]>('/api/assessments');
      setAssessments(data);
      if (data.length > 0 && selected === null) {
        setSelected(data[0].id);
      }
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadList(); }, [loadList]));

  useEffect(() => {
    if (!selected) { setReport(null); return; }
    setLoadingReport(true);
    apiFetch<Report>(`/api/reports/${selected}`)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoadingReport(false));
  }, [selected]);

  const onRefresh = () => { setRefreshing(true); loadList(); };

  if (loadingList) return <LoadingSpinner />;
  if (assessments.length === 0) {
    return (
      <EmptyState icon="document-text-outline" title="Aucun bilan disponible" description="Créez des bilans pour générer des rapports." />
    );
  }

  const selectedAssessment = assessments.find(a => a.id === selected);
  const categories = report ? Object.entries(report.byCategory ?? {}).sort((a, b) => b[1] - a[1]) : [];
  const catTotal = categories.reduce((s, [, v]) => s + v, 0);
  const monthlyData = report?.byMonth?.filter(m => m.total > 0) ?? [];
  const maxMonthly = monthlyData.length > 0 ? Math.max(...monthlyData.map(m => m.total)) : 1;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
    >
      {/* Assessment picker */}
      <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Sélectionner un bilan</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ flexGrow: 0 }}>
        <View className="flex-row gap-2 pb-1">
          {assessments.map(a => (
            <TouchableOpacity
              key={a.id}
              onPress={() => setSelected(a.id)}
              className={`px-4 py-2 rounded-full border ${selected === a.id ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-sm font-semibold ${selected === a.id ? 'text-white' : 'text-gray-700'}`} numberOfLines={1}>
                {a.name}
              </Text>
              <Text className={`text-xs ${selected === a.id ? 'text-brand-100' : 'text-gray-400'}`}>
                {a.year} · {a.site_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loadingReport ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#22c55e" size="large" />
          <Text className="text-gray-400 text-xs mt-2">Chargement du rapport…</Text>
        </View>
      ) : report ? (
        <>
          {/* Summary hero */}
          <View className="bg-brand-600 rounded-2xl mb-4 overflow-hidden">
            <View className="p-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-brand-200 text-xs font-semibold uppercase tracking-wider">Total CO₂ éq.</Text>
                  <Text className="text-white text-3xl font-extrabold mt-1">{fmt(report.summary.total)}</Text>
                </View>
                <View className="bg-brand-500 rounded-xl p-2">
                  <Ionicons name="bar-chart" size={22} color="#bbf7d0" />
                </View>
              </View>
              {selectedAssessment && (
                <Text className="text-brand-300 text-xs">{selectedAssessment.site_name} · {selectedAssessment.year}</Text>
              )}
            </View>
            {/* Scope strip */}
            <View className="flex-row border-t border-brand-500">
              {(['scope1', 'scope2', 'scope3'] as const).map((key, i) => {
                const val = (report.summary as any)[key] as number;
                const pct = report.summary.total > 0 ? (val / report.summary.total * 100).toFixed(1) : '0';
                return (
                  <View key={key} className="flex-1 p-3 items-center" style={{ borderRightWidth: i < 2 ? 1 : 0, borderRightColor: '#16a34a' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: SCOPE_COLORS[i], marginBottom: 4 }} />
                    <Text className="text-brand-200 text-xs">Scope {i + 1}</Text>
                    <Text className="text-white text-sm font-bold">{fmt(val)}</Text>
                    <Text className="text-brand-300 text-xs">{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Scope bars */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <Text className="text-sm font-bold text-gray-900 mb-3">Répartition par scope</Text>
            {(['scope1', 'scope2', 'scope3'] as const).map((key, i) => {
              const val = (report.summary as any)[key] as number;
              const pct = report.summary.total > 0 ? (val / report.summary.total) * 100 : 0;
              return (
                <View key={key} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: SCOPE_COLORS[i] }} />
                      <Text className="text-xs text-gray-600 font-medium">Scope {i + 1}</Text>
                    </View>
                    <Text className="text-xs font-semibold text-gray-700">{fmt(val)} · {pct.toFixed(1)}%</Text>
                  </View>
                  <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: SCOPE_COLORS[i] }} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* By category */}
          {categories.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <Text className="text-sm font-bold text-gray-900 mb-3">Répartition par catégorie</Text>
              {categories.map(([cat, val], i) => {
                const pct = catTotal > 0 ? (val / catTotal) * 100 : 0;
                const color = CAT_COLORS[i % CAT_COLORS.length];
                return (
                  <View key={cat} className="mb-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center gap-1.5 flex-1">
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
                        <Text className="text-xs text-gray-600 font-medium">{CATEGORY_LABELS[cat] ?? cat}</Text>
                      </View>
                      <Text className="text-xs font-semibold text-gray-700">{fmt(val)} · {pct.toFixed(1)}%</Text>
                    </View>
                    <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Monthly breakdown */}
          {monthlyData.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <Text className="text-sm font-bold text-gray-900 mb-3">Ventilation mensuelle</Text>
              {monthlyData.map(m => {
                const pct = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
                return (
                  <View key={m.month} className="mb-2.5">
                    <View className="flex-row items-center">
                      <Text className="text-xs text-gray-500 font-medium w-8">{m.label}</Text>
                      <View className="flex-1 mx-2">
                        <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <View className="h-full rounded-full bg-brand-400" style={{ width: `${pct}%` }} />
                        </View>
                      </View>
                      <Text className="text-xs font-semibold text-gray-600 w-20 text-right">{fmt(m.total)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Top emitters */}
          {report.topEmitters && report.topEmitters.length > 0 && (
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-sm font-bold text-gray-900 mb-3">Top émetteurs</Text>
              {report.topEmitters.slice(0, 5).map((e, i) => {
                const pct = report.summary.total > 0 ? (e.total / report.summary.total) * 100 : 0;
                return (
                  <View key={i} className="py-2.5 border-b border-gray-50">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center gap-2 flex-1">
                        <Text className="text-xs font-bold text-gray-300 w-5">{i + 1}</Text>
                        <View className="flex-1">
                          <Text className="text-sm text-gray-800 font-medium" numberOfLines={1}>{e.name}</Text>
                          <Text className="text-xs text-gray-400">Scope {e.scope}</Text>
                        </View>
                      </View>
                      <Text className="text-sm font-bold text-gray-900">{fmt(e.total)}</Text>
                    </View>
                    <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-7">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(pct * 3, 100)}%`, backgroundColor: SCOPE_COLORS[(e.scope - 1) % 3] }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}
