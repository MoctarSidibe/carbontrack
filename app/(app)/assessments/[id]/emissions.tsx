import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { apiFetch, apiUpload } from '@/lib/api';
import type { AuditDocument } from '@/lib/types';
import {
  ENERGY_FUELS_STATIONARY, ENERGY_FUELS_ORGANIC, ENERGY_FUELS_MOBILE,
  ELECTRICITY_FACTORS, STEAM_COOLING_FACTORS, REFRIGERANT_FACTORS,
  INPUTS_METALS, INPUTS_PLASTICS, INPUTS_OTHER,
  FREIGHT_FACTORS, TRANSPORT_PEOPLE_FACTORS, WASTE_FACTORS, CAPITAL_GOODS_FACTORS,
  SCOPE_MAPPING,
  type EmissionFactor,
} from '@/lib/emission-factors';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface SubSection {
  id: string;
  label: string;
  scope: number;
  factors: EmissionFactor[];
}

interface Tab {
  id: string;
  label: string;
  icon: string;
}

/* ------------------------------------------------------------------ */
/*  Config                                                              */
/* ------------------------------------------------------------------ */
const TABS: Tab[] = [
  { id: 'energy',     label: 'Énergie',    icon: 'flame-outline' },
  { id: 'non_energy', label: 'Hors Én.',   icon: 'nuclear-outline' },
  { id: 'inputs',     label: 'Intrants',   icon: 'cube-outline' },
  { id: 'freight',    label: 'Fret',       icon: 'car-outline' },
  { id: 'transport',  label: 'Transport',  icon: 'people-outline' },
  { id: 'waste',      label: 'Déchets',    icon: 'trash-outline' },
  { id: 'capital',    label: 'Immo.',      icon: 'business-outline' },
];

const TAB_SECTIONS: Record<string, SubSection[]> = {
  energy: [
    { id: 'fuels_stationary', label: 'Combustibles fossiles (fixes)', scope: 1, factors: ENERGY_FUELS_STATIONARY },
    { id: 'fuels_organic',    label: 'Combustibles organiques',        scope: 1, factors: ENERGY_FUELS_ORGANIC },
    { id: 'fuels_mobile',     label: 'Combustibles (mobiles)',         scope: 1, factors: ENERGY_FUELS_MOBILE },
    { id: 'steam',            label: 'Achat de vapeur / froid',        scope: 2, factors: STEAM_COOLING_FACTORS },
    { id: 'electricity',      label: "Achat d'électricité",            scope: 2, factors: ELECTRICITY_FACTORS },
  ],
  non_energy: [
    { id: 'refrigerants', label: 'Fluides frigorigènes (HFC)', scope: 1, factors: REFRIGERANT_FACTORS.filter(f => f.subcategory === 'refrigerants') },
    { id: 'process',      label: 'Émissions de procédés',      scope: 1, factors: REFRIGERANT_FACTORS.filter(f => f.subcategory === 'process') },
  ],
  inputs: [
    { id: 'metals',       label: 'Métaux',                     scope: 3, factors: INPUTS_METALS },
    { id: 'plastics',     label: 'Plastiques',                 scope: 3, factors: INPUTS_PLASTICS },
    { id: 'other_inputs', label: 'Verre, Papier, Construction', scope: 3, factors: INPUTS_OTHER },
  ],
  freight: [
    { id: 'road',             label: 'Fret routier',      scope: 3, factors: FREIGHT_FACTORS.filter(f => f.subcategory === 'road') },
    { id: 'air_freight',      label: 'Fret aérien',       scope: 3, factors: FREIGHT_FACTORS.filter(f => f.subcategory === 'air') },
    { id: 'rail_freight',     label: 'Fret ferroviaire',  scope: 3, factors: FREIGHT_FACTORS.filter(f => f.subcategory === 'rail') },
    { id: 'maritime_freight', label: 'Fret maritime',     scope: 3, factors: FREIGHT_FACTORS.filter(f => f.subcategory === 'maritime' || f.subcategory === 'river') },
  ],
  transport: [
    { id: 'car',    label: 'Voitures',           scope: 3, factors: TRANSPORT_PEOPLE_FACTORS.filter(f => f.subcategory === 'car') },
    { id: 'public', label: 'Transports communs', scope: 3, factors: TRANSPORT_PEOPLE_FACTORS.filter(f => ['bus','train','metro'].includes(f.subcategory)) },
    { id: 'plane',  label: 'Avion',              scope: 3, factors: TRANSPORT_PEOPLE_FACTORS.filter(f => f.subcategory === 'plane') },
  ],
  waste: [
    { id: 'building_waste',  label: 'Déchets du bâtiment', scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'building') },
    { id: 'mineral_waste',   label: 'Déchets minéraux',    scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'mineral') },
    { id: 'organic_waste',   label: 'Déchets organiques',  scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'organic') },
    { id: 'plastic_waste',   label: 'Déchets plastiques',  scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'plastic') },
    { id: 'household_waste', label: 'Ordures ménagères',   scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'household') },
    { id: 'dangerous_waste', label: 'Déchets dangereux',   scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'dangerous') },
    { id: 'wastewater',      label: 'Eaux usées',          scope: 3, factors: WASTE_FACTORS.filter(f => f.subcategory === 'water') },
  ],
  capital: [
    { id: 'buildings', label: 'Bâtiments',    scope: 3, factors: CAPITAL_GOODS_FACTORS.filter(f => f.subcategory === 'buildings') },
    { id: 'vehicles',  label: 'Véhicules',    scope: 3, factors: CAPITAL_GOODS_FACTORS.filter(f => f.subcategory === 'vehicles') },
    { id: 'it',        label: 'Informatique', scope: 3, factors: CAPITAL_GOODS_FACTORS.filter(f => f.subcategory === 'it') },
    { id: 'furniture', label: 'Mobilier',     scope: 3, factors: CAPITAL_GOODS_FACTORS.filter(f => f.subcategory === 'furniture') },
  ],
};

const MONTHS = [
  { id: 1, label: 'Janv' }, { id: 2,  label: 'Févr' }, { id: 3,  label: 'Mars' },
  { id: 4, label: 'Avr'  }, { id: 5,  label: 'Mai'  }, { id: 6,  label: 'Juin' },
  { id: 7, label: 'Juil' }, { id: 8,  label: 'Août' }, { id: 9,  label: 'Sept' },
  { id: 10,label: 'Oct'  }, { id: 11, label: 'Nov'  }, { id: 12, label: 'Déc'  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function fmtCO2(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(2)} t`;
  if (v > 0) return `${v.toFixed(2)} kg`;
  return '—';
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function scopeTag(scope: number) {
  const c = {
    1: { label: 'S1', bg: '#f0fdf4', color: '#16a34a' },
    2: { label: 'S2', bg: '#eff6ff', color: '#1d4ed8' },
    3: { label: 'S3', bg: '#fffbeb', color: '#b45309' },
  };
  return c[scope as 1|2|3] ?? { label: `S${scope}`, bg: '#f3f4f6', color: '#6b7280' };
}

/* ------------------------------------------------------------------ */
/*  Document Panel Modal                                                */
/* ------------------------------------------------------------------ */
interface DocPanelProps {
  visible: boolean;
  factorId: string;
  factorName: string;
  assessmentId: string;
  year: number;
  month: number;
  onClose: () => void;
}

function DocPanel({ visible, factorId, factorName, assessmentId, year, month, onClose }: DocPanelProps) {
  const [docs, setDocs] = useState<AuditDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDocs = useCallback(async () => {
    if (!visible) return;
    setLoading(true);
    try {
      const data = await apiFetch<AuditDocument[]>(
        `/api/documents?assessmentId=${assessmentId}&factorId=${factorId}&year=${year}&month=${month}`
      );
      setDocs(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [visible, assessmentId, factorId, year, month]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];

      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
      } as any);
      formData.append('assessmentId', assessmentId);
      formData.append('factorId', factorId);
      formData.append('year', String(year));
      formData.append('month', String(month));

      await apiUpload('/api/documents', formData);
      await loadDocs();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Échec du téléversement.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    Alert.alert('Supprimer ce document ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          setDeletingId(docId);
          try {
            await apiFetch('/api/documents', {
              method: 'DELETE',
              body: JSON.stringify({ id: docId, assessmentId: parseInt(assessmentId) }),
            });
            setDocs(prev => prev.filter(d => d.id !== docId));
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
              Justificatifs
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }} numberOfLines={1}>
              {factorName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
            <Ionicons name="close" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Context badge */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', gap: 8 }}>
          <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '600' }}>
              {MONTHS.find(m => m.id === month)?.label ?? month} {year}
            </Text>
          </View>
          <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>
              {docs.length} document{docs.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Document list */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {loading ? (
            <ActivityIndicator color="#22c55e" style={{ marginTop: 32 }} />
          ) : docs.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Ionicons name="document-outline" size={40} color="#d1d5db" />
              <Text style={{ color: '#9ca3af', marginTop: 10, fontSize: 13 }}>
                Aucun justificatif pour ce mois
              </Text>
              <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 4 }}>
                Ajoutez des factures, relevés ou photos
              </Text>
            </View>
          ) : (
            docs.map(doc => (
              <View
                key={doc.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#f9fafb', borderRadius: 12,
                  padding: 12, marginBottom: 8,
                  borderWidth: 1, borderColor: '#f3f4f6',
                }}
              >
                <View style={{ width: 36, height: 36, backgroundColor: '#fff', borderRadius: 9, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                  <Ionicons
                    name={doc.mime_type?.includes('pdf') ? 'document-text-outline' : doc.mime_type?.includes('image') ? 'image-outline' : 'attach-outline'}
                    size={18} color="#6b7280"
                  />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                    {doc.original_name}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {fmtSize(doc.file_size)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  style={{ padding: 6 }}
                >
                  {deletingId === doc.id
                    ? <ActivityIndicator size={16} color="#ef4444" />
                    : <Ionicons name="trash-outline" size={17} color="#ef4444" />}
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Upload button */}
        <View style={{ padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading}
            style={{
              backgroundColor: '#22c55e', borderRadius: 14,
              paddingVertical: 13, flexDirection: 'row',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading
              ? <ActivityIndicator color="white" />
              : <Ionicons name="attach-outline" size={20} color="white" />}
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
              {uploading ? 'Téléversement…' : 'Joindre un document'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */
export default function EmissionsEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [entries, setEntries] = useState<Record<string, Record<string, number>>>({});
  const [docCounts, setDocCounts] = useState<Record<string, number>>({}); // factorId -> count all months
  const [activeTab, setActiveTab] = useState('energy');
  const [activeMonth, setActiveMonth] = useState(1);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [assessmentYear, setAssessmentYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Document panel state
  const [docPanel, setDocPanel] = useState<{ factorId: string; factorName: string } | null>(null);

  /* ---- Load existing entries + doc counts ---- */
  const loadData = useCallback(async () => {
    try {
      const [assessments, emData, docsData] = await Promise.all([
        apiFetch<{ id: number; year: number }[]>('/api/assessments'),
        apiFetch<{ emission_factor_id: string; quantity: number; month: number; year: number }[]>(
          `/api/emissions?assessmentId=${id}`
        ),
        apiFetch<AuditDocument[]>(`/api/documents?assessmentId=${id}`).catch(() => [] as AuditDocument[]),
      ]);

      const found = assessments.find(a => String(a.id) === String(id));
      if (found) setAssessmentYear(found.year);

      const map: Record<string, Record<string, number>> = {};
      for (const e of emData) {
        const fid = e.emission_factor_id;
        const m = parseInt(String(e.month)) || 1;
        const y = parseInt(String(e.year)) || (found?.year ?? new Date().getFullYear());
        if (!map[fid]) map[fid] = {};
        map[fid][`${y}-${m}`] = (map[fid][`${y}-${m}`] || 0) + (Number(e.quantity) || 0);
      }
      setEntries(map);

      // Build doc counts per factor
      const counts: Record<string, number> = {};
      for (const doc of docsData) {
        counts[doc.emission_factor_id] = (counts[doc.emission_factor_id] || 0) + 1;
      }
      setDocCounts(counts);

      // Open first section of each tab
      const autoOpen: Record<string, boolean> = {};
      Object.values(TAB_SECTIONS).forEach(secs => { if (secs[0]) autoOpen[secs[0].id] = true; });
      setOpenSections(autoOpen);
    } catch { /* ignore */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ---- Quantity helpers ---- */
  const getQty = (factorId: string): number =>
    entries[factorId]?.[`${assessmentYear}-${activeMonth}`] || 0;

  const setQty = (factorId: string, value: number) => {
    const key = `${assessmentYear}-${activeMonth}`;
    setEntries(prev => ({
      ...prev,
      [factorId]: { ...(prev[factorId] ?? {}), [key]: value },
    }));
  };

  /* ---- Tab total (for active month) ---- */
  const tabTotal = useMemo(() => {
    const sections = TAB_SECTIONS[activeTab] ?? [];
    return sections.reduce((sum, sec) =>
      sum + sec.factors.reduce((s, f) => s + getQty(f.id) * f.factorTotal, 0), 0
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, entries, activeMonth, assessmentYear]);

  /* ---- Save all ---- */
  const handleSave = async () => {
    setSaving(true);
    try {
      const allEntries: object[] = [];
      for (const [, sections] of Object.entries(TAB_SECTIONS)) {
        for (const sec of sections) {
          for (const factor of sec.factors) {
            for (let m = 1; m <= 12; m++) {
              const qty = entries[factor.id]?.[`${assessmentYear}-${m}`] || 0;
              if (qty > 0) {
                const si = SCOPE_MAPPING[factor.subcategory] ?? { scope: 3, ghgCategory: 'Autre', isoCategory: '' };
                allEntries.push({
                  emissionFactorId: factor.id,
                  factorName: factor.nameFr,
                  category: factor.category,
                  subcategory: factor.subcategory,
                  quantity: qty,
                  unit: factor.unit,
                  factorUpstream: factor.factorUpstream,
                  factorCombustion: factor.factorCombustion,
                  factorValue: factor.factorTotal,
                  totalCo2eq: qty * factor.factorTotal,
                  scope: si.scope,
                  ghgCategory: si.ghgCategory,
                  isoCategory: si.isoCategory,
                  description: `${factor.nameFr} - ${factor.source}`,
                  sourceCharacterization: factor.region,
                  month: m,
                  year: assessmentYear,
                });
              }
            }
          }
        }
      }

      await apiFetch('/api/emissions', {
        method: 'POST',
        body: JSON.stringify({ assessmentId: parseInt(id), entries: allEntries }),
      });

      Alert.alert('Brouillon sauvegardé', 'Les émissions ont été enregistrées. Vous pouvez continuer à les modifier.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  const sections = TAB_SECTIONS[activeTab] ?? [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ---- Category tabs ---- */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 6 }}>
          {TABS.map(tab => {
            const active = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: active ? '#22c55e' : '#f3f4f6',
                }}
              >
                <Ionicons name={tab.icon as any} size={14} color={active ? 'white' : '#6b7280'} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? 'white' : '#6b7280' }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Month picker + year display */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 10, gap: 4 }}>
            {MONTHS.map(m => {
              const active = m.id === activeMonth;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setActiveMonth(m.id)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
                    backgroundColor: active ? '#dcfce7' : 'transparent',
                    borderWidth: 1, borderColor: active ? '#22c55e' : '#e5e7eb',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: active ? '700' : '500', color: active ? '#16a34a' : '#9ca3af' }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', flexShrink: 0 }}>
            {assessmentYear}
          </Text>
        </View>
      </View>

      {/* ---- Section list ---- */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }} keyboardShouldPersistTaps="handled">
        {sections.map(sec => {
          const st = scopeTag(sec.scope);
          const isOpen = !!openSections[sec.id];
          const secTotal = sec.factors.reduce((s, f) => s + getQty(f.id) * f.factorTotal, 0);

          return (
            <View key={sec.id} style={{ marginBottom: 8, borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' }}>
              {/* Section header */}
              <TouchableOpacity
                onPress={() => setOpenSections(prev => ({ ...prev, [sec.id]: !prev[sec.id] }))}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 13, gap: 8 }}
              >
                <View style={{ backgroundColor: st.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: st.color }}>{st.label}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sec.label}
                </Text>
                {secTotal > 0 && (
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#22c55e' }}>{fmtCO2(secTotal)}</Text>
                )}
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
              </TouchableOpacity>

              {/* Factor rows */}
              {isOpen && (
                <View style={{ borderTopWidth: 1, borderTopColor: '#f9fafb' }}>
                  {sec.factors.map((factor, fi) => {
                    const qty = getQty(factor.id);
                    const co2 = qty * factor.factorTotal;
                    const docCount = docCounts[factor.id] ?? 0;
                    return (
                      <View
                        key={factor.id}
                        style={{
                          paddingHorizontal: 13, paddingVertical: 10,
                          borderTopWidth: fi > 0 ? 1 : 0, borderTopColor: '#f9fafb',
                        }}
                      >
                        {/* Factor name + unit badge + source */}
                        <View style={{ marginBottom: 6 }}>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }} numberOfLines={2}>
                            {factor.nameFr}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                            {/* Unit — prominent blue pill */}
                            <View style={{ backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#bfdbfe' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563eb' }}>
                                {factor.unit}
                              </Text>
                            </View>
                            {/* Source reference */}
                            <Text style={{ fontSize: 9, color: '#9ca3af', flexShrink: 1 }} numberOfLines={1}>
                              {factor.source}{factor.region ? ` · ${factor.region}` : ''}
                            </Text>
                          </View>
                        </View>

                        {/* Input row: quantity field + CO2 result + attach button */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {/* Quantity input */}
                          <TextInput
                            style={{
                              flex: 1, height: 38,
                              backgroundColor: '#f9fafb', borderRadius: 9,
                              borderWidth: 1, borderColor: qty > 0 ? '#22c55e' : '#e5e7eb',
                              paddingHorizontal: 10, textAlign: 'right',
                              fontSize: 14, fontWeight: qty > 0 ? '700' : '400',
                              color: '#111827',
                            }}
                            placeholder="0"
                            placeholderTextColor="#d1d5db"
                            keyboardType="decimal-pad"
                            value={qty > 0 ? String(qty) : ''}
                            onChangeText={v => {
                              const parsed = parseFloat(v.replace(',', '.'));
                              setQty(factor.id, isNaN(parsed) ? 0 : parsed);
                            }}
                          />

                          {/* CO2 result */}
                          <View style={{ minWidth: 70, alignItems: 'flex-end' }}>
                            {co2 > 0 && (
                              <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '700' }}>
                                {fmtCO2(co2)}
                              </Text>
                            )}
                          </View>

                          {/* Attach document button */}
                          <TouchableOpacity
                            onPress={() => setDocPanel({ factorId: factor.id, factorName: factor.nameFr })}
                            style={{
                              width: 36, height: 36,
                              borderRadius: 9,
                              backgroundColor: docCount > 0 ? '#f0fdf4' : '#f9fafb',
                              borderWidth: 1,
                              borderColor: docCount > 0 ? '#22c55e' : '#e5e7eb',
                              alignItems: 'center', justifyContent: 'center',
                              position: 'relative',
                            }}
                          >
                            <Ionicons
                              name="attach-outline"
                              size={17}
                              color={docCount > 0 ? '#22c55e' : '#9ca3af'}
                            />
                            {docCount > 0 && (
                              <View style={{
                                position: 'absolute', top: -4, right: -4,
                                backgroundColor: '#22c55e', borderRadius: 8,
                                width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Text style={{ fontSize: 9, fontWeight: '800', color: 'white' }}>{docCount}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ---- Bottom save bar ---- */}
      <View style={{
        backgroundColor: '#fff', padding: 14,
        paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        borderTopWidth: 1, borderTopColor: '#f3f4f6',
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '500' }}>CO₂ éq. — onglet / mois</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#22c55e' }}>{fmtCO2(tabTotal)}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: '#22c55e', borderRadius: 14,
            paddingHorizontal: 20, paddingVertical: 12,
            flexDirection: 'row', alignItems: 'center', gap: 7,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving
            ? <ActivityIndicator color="white" size="small" />
            : <Ionicons name="save-outline" size={18} color="white" />}
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ---- Document panel modal ---- */}
      {docPanel && (
        <DocPanel
          visible={!!docPanel}
          factorId={docPanel.factorId}
          factorName={docPanel.factorName}
          assessmentId={id}
          year={assessmentYear}
          month={activeMonth}
          onClose={() => {
            setDocPanel(null);
            // Refresh doc counts after panel closes
            apiFetch<AuditDocument[]>(`/api/documents?assessmentId=${id}`)
              .then(docs => {
                const counts: Record<string, number> = {};
                for (const doc of docs) counts[doc.emission_factor_id] = (counts[doc.emission_factor_id] || 0) + 1;
                setDocCounts(counts);
              })
              .catch(() => {});
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
