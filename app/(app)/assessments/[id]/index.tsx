import { useCallback, useState, useRef } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { apiFetch } from '@/lib/api';
import { API_URL } from '@/constants/config';
import type { Assessment, EmissionEntry, Certification, Report } from '@/lib/types';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

function fmt(n: number | null | undefined) {
  const v = Number(n);
  if (!v || isNaN(v)) return '—';
  if (v >= 1000) return (v / 1000).toFixed(2) + ' t CO₂';
  return v.toFixed(2) + ' kg CO₂';
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function certStatusInfo(status: string): { label: string; variant: 'gray' | 'yellow' | 'green' | 'red' | 'blue' } {
  switch (status) {
    case 'certified':   return { label: 'Certifié ✓', variant: 'green' };
    case 'rejected':    return { label: 'Rejeté', variant: 'red' };
    case 'in_progress': return { label: 'En vérification', variant: 'yellow' };
    case 'assigned':    return { label: 'Expert assigné', variant: 'blue' };
    default:            return { label: 'En attente', variant: 'gray' };
  }
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

export default function AssessmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [entries, setEntries] = useState<EmissionEntry[]>([]);
  const [cert, setCert] = useState<Certification | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const qrCaptured = useRef(false);

  const load = useCallback(async () => {
    try {
      const [asAll, emData, certData, reportData] = await Promise.all([
        apiFetch<Assessment[]>('/api/assessments'),
        apiFetch<EmissionEntry[]>(`/api/emissions?assessmentId=${id}`),
        apiFetch<{ certification: Certification | null }>(`/api/certifications/${id}`)
          .then(res => res.certification)
          .catch(() => null),
        apiFetch<Report>(`/api/reports/${id}`).catch(() => null),
      ]);
      const found = asAll.find(a => String(a.id) === String(id)) ?? null;
      setAssessment(found);
      setEntries(emData);
      setCert(certData);
      setReport(reportData as Report | null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const requestCertification = async () => {
    Alert.alert(
      'Demander une certification',
      'Soumettre ce bilan pour certification par un expert CarbonTrack ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: async () => {
            setSubmitting(true);
            try {
              const newCert = await apiFetch<Certification>('/api/certifications', {
                method: 'POST',
                body: JSON.stringify({ assessmentId: parseInt(id) }),
              });
              setCert(newCert);
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Impossible de soumettre la demande.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce bilan ?',
      `"${assessment?.name}" sera définitivement supprimé.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/assessments/${id}`, { method: 'DELETE' });
              router.back();
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Impossible de supprimer.');
            }
          },
        },
      ]
    );
  };

  const handleFinalize = () => {
    Alert.alert(
      'Finaliser ce bilan ?',
      'Les émissions seront verrouillées. Vous pourrez ensuite demander une certification.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Finaliser',
          onPress: async () => {
            setFinalizing(true);
            try {
              await apiFetch(`/api/assessments/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'completed' }),
              });
              await load();
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Impossible de finaliser.');
            } finally {
              setFinalizing(false);
            }
          },
        },
      ]
    );
  };

  const exportPdf = async () => {
    if (!assessment) return;
    setExportingPdf(true);
    try {
      const total = Number(assessment.total_co2eq) || 0;
      const s1 = Number(assessment.scope1_co2eq) || 0;
      const s2 = Number(assessment.scope2_co2eq) || 0;
      const s3 = Number(assessment.scope3_co2eq) || 0;
      const date = new Date().toLocaleDateString('fr-FR');

      const fmtCO2 = (v: number) => {
        const n = Number(v) || 0;
        if (n >= 1000000) return `${(n/1000000).toFixed(2)} ktCO2eq`;
        if (n >= 1000)    return `${(n/1000).toFixed(2)} tCO2eq`;
        return `${n.toFixed(1)} kgCO2eq`;
      };
      const pct = (v: number) => total > 0 ? ((v/total)*100).toFixed(1) : '0.0';

      const CAT_LABELS: Record<string,string> = {
        energy:'Énergie', non_energy:'Hors énergie', inputs:'Intrants',
        freight:'Fret', transport:'Transport', waste:'Déchets', capital:'Immobilisations',
      };

      // Category rows
      const byCatFallback = entries.reduce<Record<string,number>>((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+Number(e.total_co2eq); return acc; }, {});
      const catSource = report?.byCategory ?? byCatFallback;
      const catEntries = Object.entries(catSource).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
      const catMax = catEntries[0]?.[1] ?? 1;
      const catRows = catEntries.map(([cat,val]) => {
        const barW = Math.round((Number(val)/catMax)*100);
        const scopeColor = cat==='energy'||cat==='non_energy' ? '#22c55e' : cat==='inputs'||cat==='capital' ? '#3b82f6' : '#f59e0b';
        return `<tr>
          <td style="width:28%">${CAT_LABELS[cat]??cat}</td>
          <td style="width:38%"><div style="background:#f3f4f6;border-radius:3px;height:7px;overflow:hidden"><div style="width:${barW}%;height:100%;background:${scopeColor}"></div></div></td>
          <td style="text-align:right;font-weight:700;width:20%">${fmtCO2(Number(val))}</td>
          <td style="text-align:right;color:#6b7280;width:14%">${pct(Number(val))}%</td>
        </tr>`;
      }).join('');

      // Monthly rows — built directly from loaded entries so it always works
      const MONTH_LABELS_PDF = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
      const byMonthMap: Record<number, {total:number, scope1:number, scope2:number, scope3:number}> = {};
      for (const e of entries) {
        const m = parseInt(String(e.month)) || 0;
        if (m >= 1 && m <= 12) {
          if (!byMonthMap[m]) byMonthMap[m] = {total:0, scope1:0, scope2:0, scope3:0};
          const v = Number(e.total_co2eq) || 0;
          byMonthMap[m].total += v;
          if (e.scope === 1) byMonthMap[m].scope1 += v;
          else if (e.scope === 2) byMonthMap[m].scope2 += v;
          else byMonthMap[m].scope3 += v;
        }
      }
      const monthlyData = Object.entries(byMonthMap)
        .map(([m, data]) => ({ month: parseInt(m), label: MONTH_LABELS_PDF[parseInt(m)-1], ...data }))
        .sort((a, b) => a.month - b.month)
        .filter(d => d.total > 0);
      const monthMax = Math.max(...monthlyData.map(m=>m.total), 1);
      const monthlyRows = monthlyData.map(m => {
        const bW1 = Math.round((m.scope1/monthMax)*100);
        const bW2 = Math.round((m.scope2/monthMax)*100);
        const bW3 = Math.round((m.scope3/monthMax)*100);
        return `<tr>
          <td style="width:8%;font-weight:600">${m.label}</td>
          <td style="width:55%">
            <div style="display:flex;height:9px;background:#f3f4f6;border-radius:3px;overflow:hidden">
              <div style="width:${bW1}%;background:#22c55e"></div>
              <div style="width:${bW2}%;background:#3b82f6"></div>
              <div style="width:${bW3}%;background:#f59e0b"></div>
            </div>
          </td>
          <td style="text-align:right;font-weight:700;width:24%">${fmtCO2(m.total)}</td>
          <td style="text-align:right;color:#6b7280;width:13%">${pct(m.total)}%</td>
        </tr>`;
      }).join('');

      // Top emitters rows
      const topEmitters = report?.topEmitters?.slice(0,10) ?? [];
      const topMax = Math.max(...topEmitters.map(e=>e.total), 1);
      const topRows = topEmitters.map((e,i) => {
        const scopeColor = e.scope===1?'#22c55e':e.scope===2?'#3b82f6':'#f59e0b';
        const bW = Math.round((e.total/topMax)*100);
        return `<tr>
          <td style="width:4%;color:#9ca3af;text-align:center">${i+1}</td>
          <td style="width:36%">${e.name}</td>
          <td style="width:28%"><div style="background:#f3f4f6;border-radius:3px;height:7px;overflow:hidden"><div style="width:${bW}%;height:100%;background:${scopeColor}"></div></div></td>
          <td style="text-align:center;width:8%"><span style="background:${scopeColor}20;color:${scopeColor};border-radius:4px;padding:1px 5px;font-weight:700;font-size:9px">S${e.scope}</span></td>
          <td style="text-align:right;font-weight:700;width:24%">${fmtCO2(e.total)}</td>
        </tr>`;
      }).join('');

      // Emission entry detail rows
      const entryRows = entries.slice(0,60).map(e => {
        const scopeColor = e.scope===1?'#22c55e':e.scope===2?'#3b82f6':'#f59e0b';
        return `<tr>
          <td style="width:40%">${e.factor_name}</td>
          <td style="text-align:center;width:8%"><span style="background:${scopeColor}20;color:${scopeColor};border-radius:4px;padding:1px 5px;font-weight:700;font-size:9px">S${e.scope}</span></td>
          <td style="text-align:right;width:22%">${Number(e.quantity).toFixed(2)} ${e.unit}</td>
          <td style="text-align:right;font-weight:700;width:30%">${fmtCO2(Number(e.total_co2eq))}</td>
        </tr>`;
      }).join('');

      // Status-specific cover elements
      const isDraft = assessment.status === 'draft' || assessment.status === 'in_progress';
      const isCertified = cert?.status === 'certified';

      const draftBanner = isDraft ? `
        <div style="margin-top:18px;background:rgba(251,191,36,0.18);border:1.5px solid rgba(251,191,36,0.6);border-radius:10px;padding:10px 16px;display:inline-flex;align-items:center;gap:10px;">
          <span style="font-size:16px;">⚠</span>
          <div>
            <div style="font-weight:800;font-size:12px;letter-spacing:.5px;color:#fef3c7;">BROUILLON — Document non finalisé</div>
            <div style="font-size:10px;opacity:.7;margin-top:2px;">Ce rapport est à titre indicatif et n'a pas valeur officielle.</div>
          </div>
        </div>` : '';

      const certBanner = isCertified ? `
        <div style="margin-top:18px;background:rgba(34,197,94,0.18);border:1.5px solid rgba(74,222,128,0.6);border-radius:12px;padding:12px 16px;display:inline-flex;align-items:center;gap:14px;">
          <div style="width:42px;height:42px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="color:white;font-size:22px;font-weight:900;">✓</span>
          </div>
          <div>
            <div style="font-weight:800;font-size:13px;color:#bbf7d0;letter-spacing:.3px;">Bilan certifié CarbonTrack</div>
            ${cert?.certificateNumber ? `<div style="font-size:10px;color:rgba(187,247,208,.8);margin-top:3px;">N° ${cert.certificateNumber}</div>` : ''}
            <div style="font-size:10px;color:rgba(187,247,208,.75);margin-top:2px;">
              ${cert?.expertName ? `Expert : ${cert.expertName}` : ''}
              ${cert?.certifiedAt ? ` · Certifié le ${fmtDate(cert.certifiedAt)}` : ''}
            </div>
          </div>
        </div>` : '';

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { margin: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 11px; }

  /* Cover */
  .cover { background: linear-gradient(135deg, #14532d 0%, #15803d 40%, #22c55e 75%, #86efac 100%); color:white; padding:70px 48px 56px; position:relative; }
  .cover-brand { font-size:10px; font-weight:700; letter-spacing:2px; opacity:.65; margin-bottom:20px; display:flex; align-items:center; gap:6px; }
  .cover-dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.5); }
  .cover h1 { font-size:30px; font-weight:800; line-height:1.15; margin-bottom:8px; }
  .cover-sub { font-size:14px; opacity:.8; margin-bottom:4px; }
  .cover-meta { font-size:11px; opacity:.65; margin-bottom:20px; }
  .badges { display:flex; gap:8px; flex-wrap:wrap; }
  .badge { border:1px solid rgba(255,255,255,.4); border-radius:20px; padding:4px 14px; font-size:9px; font-weight:600; letter-spacing:.5px; }

  /* Content */
  .content { padding:28px 40px; }
  .section-title { font-size:13px; font-weight:800; color:#111827; margin: 22px 0 8px; padding-bottom:6px; border-bottom:2.5px solid #22c55e; display:inline-block; }

  /* Stat cards */
  .cards { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
  .card { border-radius:10px; padding:12px 14px; }
  .card .val { font-size:14px; font-weight:800; }
  .card .lbl { font-size:9px; color:#6b7280; margin-top:3px; }

  /* Scope bar */
  .scope-bar { display:flex; height:10px; border-radius:6px; overflow:hidden; margin:10px 0 6px; }
  .scope-legend { display:flex; gap:16px; font-size:9px; color:#6b7280; margin-bottom:12px; }
  .scope-legend span { display:flex; align-items:center; gap:4px; }
  .scope-legend .dot { width:8px; height:8px; border-radius:50%; }

  /* Tables */
  table { width:100%; border-collapse:collapse; margin:8px 0 16px; font-size:10px; }
  th { background:#22c55e; color:white; padding:6px 8px; text-align:left; font-size:9px; font-weight:700; letter-spacing:.3px; }
  td { padding:5px 8px; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  tr:nth-child(even) td { background:#fafafa; }

  /* Footer */
  .footer { margin-top:16px; padding-top:10px; border-top:1px solid #e5e7eb; text-align:center; font-size:9px; color:#9ca3af; }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-brand"><div class="cover-dot"></div>CARBONTRACK</div>
  <h1>${assessment.name}</h1>
  <div class="cover-sub">${assessment.site_name} &nbsp;&middot;&nbsp; Année ${assessment.year}</div>
  <div class="cover-meta">Bilan Carbone &mdash; Rapport d&apos;émissions GES</div>
  <div class="badges">
    <span class="badge">ISO 14064-1</span>
    <span class="badge">GHG Protocol</span>
    <span class="badge">Bilan Carbone&reg;</span>
    <span class="badge">ISO 14069</span>
  </div>
  ${draftBanner}
  ${certBanner}
  ${qrDataUrl ? `
  <div style="position:absolute;top:24px;right:24px;background:rgba(255,255,255,0.95);border-radius:10px;padding:8px 8px 6px;box-shadow:0 2px 14px rgba(0,0,0,0.28);">
    <img src="${qrDataUrl}" width="80" height="80" style="display:block;border-radius:4px;"/>
    <div style="font-size:7px;text-align:center;color:#374151;margin-top:5px;font-weight:700;letter-spacing:.3px;">ACCÈS EN LIGNE</div>
  </div>` : ''}
  <div style="position:absolute;bottom:0;left:0;right:0;display:flex;height:4px">
    <div style="flex:1;background:#009e60"></div>
    <div style="flex:1;background:#FCD116"></div>
    <div style="flex:1;background:#3A75C4"></div>
  </div>
</div>

<!-- CONTENT -->
<div class="content">

  <!-- Summary cards -->
  <div class="section-title">Résumé des émissions</div>
  <div class="cards" style="margin-top:12px">
    <div class="card" style="background:#f0fdf4;border:1px solid #bbf7d0">
      <div class="val" style="color:#15803d">${fmtCO2(total)}</div>
      <div class="lbl">Total CO₂ éq.</div>
    </div>
    <div class="card" style="background:#f0fdf4;border:1px solid #bbf7d0">
      <div class="val" style="color:#15803d">${fmtCO2(s1)}</div>
      <div class="lbl">Scope 1 &middot; Émissions directes</div>
    </div>
    <div class="card" style="background:#eff6ff;border:1px solid #bfdbfe">
      <div class="val" style="color:#1d4ed8">${fmtCO2(s2)}</div>
      <div class="lbl">Scope 2 &middot; Énergie achetée</div>
    </div>
    <div class="card" style="background:#fffbeb;border:1px solid #fde68a">
      <div class="val" style="color:#b45309">${fmtCO2(s3)}</div>
      <div class="lbl">Scope 3 &middot; Émissions indirectes</div>
    </div>
  </div>

  <!-- Scope bar -->
  <div class="scope-bar">
    <div style="width:${pct(s1)}%;background:#22c55e"></div>
    <div style="width:${pct(s2)}%;background:#3b82f6"></div>
    <div style="width:${pct(s3)}%;background:#f59e0b"></div>
  </div>
  <div class="scope-legend">
    <span><div class="dot" style="background:#22c55e"></div>Scope 1 : ${pct(s1)}%</span>
    <span><div class="dot" style="background:#3b82f6"></div>Scope 2 : ${pct(s2)}%</span>
    <span><div class="dot" style="background:#f59e0b"></div>Scope 3 : ${pct(s3)}%</span>
  </div>

  <!-- Category breakdown -->
  <div class="section-title">Répartition par catégorie</div>
  <table style="margin-top:10px">
    <thead><tr>
      <th>Catégorie</th><th>Proportion</th>
      <th style="text-align:right">Émissions CO₂ éq.</th>
      <th style="text-align:right">Part</th>
    </tr></thead>
    <tbody>${catRows || '<tr><td colspan="4" style="color:#9ca3af;text-align:center;padding:12px">Aucune donnée</td></tr>'}</tbody>
  </table>

  ${monthlyData.length > 0 ? `
  <!-- Monthly breakdown -->
  <div class="section-title">Ventilation mensuelle</div>
  <div style="font-size:9px;color:#9ca3af;margin:4px 0 8px;display:flex;gap:12px">
    <span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#22c55e"></span>Scope 1</span>
    <span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#3b82f6"></span>Scope 2</span>
    <span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#f59e0b"></span>Scope 3</span>
  </div>
  <table>
    <thead><tr>
      <th>Mois</th><th>Répartition scopes</th>
      <th style="text-align:right">Total CO₂ éq.</th>
      <th style="text-align:right">Part</th>
    </tr></thead>
    <tbody>${monthlyRows}</tbody>
  </table>
  ` : ''}

  ${topEmitters.length > 0 ? `
  <!-- Top emitters -->
  <div class="section-title">Top 10 sources d'émissions</div>
  <table style="margin-top:10px">
    <thead><tr>
      <th>#</th><th>Source</th><th>Proportion</th><th style="text-align:center">Scope</th>
      <th style="text-align:right">CO₂ éq.</th>
    </tr></thead>
    <tbody>${topRows}</tbody>
  </table>
  ` : ''}

  <!-- Emission entries detail -->
  <div class="section-title">Détail des entrées d'émissions</div>
  <table style="margin-top:10px">
    <thead><tr>
      <th>Source d'émission</th><th style="text-align:center">Scope</th>
      <th style="text-align:right">Quantité</th><th style="text-align:right">CO₂ éq.</th>
    </tr></thead>
    <tbody>${entryRows || '<tr><td colspan="4" style="color:#9ca3af;text-align:center;padding:12px">Aucune entrée d\'émission</td></tr>'}</tbody>
  </table>

  ${isCertified && cert ? `
  <!-- Certification summary section -->
  <div class="section-title">Certification officielle</div>
  <div style="margin-top:12px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:16px;">
    <div style="width:52px;height:52px;background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <span style="color:white;font-size:26px;font-weight:900;">✓</span>
    </div>
    <div style="flex:1">
      <div style="font-size:14px;font-weight:800;color:#15803d;margin-bottom:4px;">Bilan certifié conforme — CarbonTrack</div>
      ${cert.certificateNumber ? `<div style="font-size:11px;color:#16a34a;margin-bottom:2px;">Numéro de certificat : <strong>${cert.certificateNumber}</strong></div>` : ''}
      ${cert.expertName ? `<div style="font-size:11px;color:#6b7280;">Expert auditeur : ${cert.expertName}</div>` : ''}
      ${cert.certifiedAt ? `<div style="font-size:11px;color:#6b7280;">Date de certification : ${fmtDate(cert.certifiedAt)}</div>` : ''}
    </div>
  </div>
  ` : ''}

  ${isDraft ? `
  <!-- Draft disclaimer -->
  <div style="margin-top:12px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:12px 16px;font-size:10px;color:#92400e;">
    <strong>⚠ Document provisoire :</strong> Ce bilan est en cours d'élaboration et n'a pas encore été finalisé ni soumis à certification.
    Les chiffres présentés sont susceptibles d'évoluer.
  </div>
  ` : ''}

  <div class="footer">
    Généré par CarbonTrack &nbsp;&middot;&nbsp; ${date}
    &nbsp;&middot;&nbsp; Conforme aux normes ISO 14064-1 et GHG Protocol Corporate Standard
  </div>
</div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Bilan ${assessment.name}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!assessment) return (
    <EmptyState icon="alert-circle-outline" title="Bilan introuvable" />
  );

  const grouped = entries.reduce<Record<string, EmissionEntry[]>>((acc, e) => {
    const cat = e.category ?? 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});
  const sections = Object.entries(grouped).map(([cat, data]) => ({
    title: CATEGORY_LABELS[cat] ?? cat,
    data,
    total: data.reduce((s, e) => s + (Number(e.total_co2eq) || 0), 0),
  }));

  const total = Number(assessment.total_co2eq) || 0;
  const scopeData = [
    { label: 'Scope 1', value: Number(assessment.scope1_co2eq) || 0, color: SCOPE_COLORS[0] },
    { label: 'Scope 2', value: Number(assessment.scope2_co2eq) || 0, color: SCOPE_COLORS[1] },
    { label: 'Scope 3', value: Number(assessment.scope3_co2eq) || 0, color: SCOPE_COLORS[2] },
  ];

  const canRequestCert = assessment.status === 'completed' && !cert;

  const catEntries = report?.byCategory
    ? Object.entries(report.byCategory).sort((a, b) => b[1] - a[1])
    : [];
  const catTotal = catEntries.reduce((s, [, v]) => s + v, 0);

  const monthlyData = report?.byMonth?.filter(m => m.total > 0) ?? [];
  const maxMonthly = monthlyData.length > 0 ? Math.max(...monthlyData.map(m => m.total)) : 1;
  const topEmitters = report?.topEmitters?.slice(0, 5) ?? [];

  const qrUrl = `${API_URL}/dashboard/assessments/${id}`;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
    >
      {/* ── QR Modal ── */}
      <Modal visible={showQr} transparent animationType="fade" onRequestClose={() => setShowQr(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={1}
          onPress={() => setShowQr(false)}
        >
          <View style={{
            backgroundColor: '#fff', borderRadius: 24, padding: 28,
            alignItems: 'center', width: 300,
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="qr-code-outline" size={18} color="#22c55e" />
              <Text style={{ fontWeight: '800', fontSize: 15, color: '#111827' }}>QR Code</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 20, textAlign: 'center' }} numberOfLines={1}>
              {assessment.name}
            </Text>
            <View style={{ padding: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#e5e7eb' }}>
              {showQr && <QRCode value={qrUrl} size={180} color="#111827" backgroundColor="#ffffff" />}
            </View>
            <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 14, textAlign: 'center' }}>
              Scannez pour accéder au bilan dans l'application web
            </Text>
            <TouchableOpacity
              onPress={() => setShowQr(false)}
              style={{ marginTop: 18, paddingVertical: 10, paddingHorizontal: 28, backgroundColor: '#f3f4f6', borderRadius: 12 }}
            >
              <Text style={{ fontWeight: '600', color: '#374151', fontSize: 13 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Header card */}
      <View className="bg-white rounded-2xl mb-4 border border-gray-100 overflow-hidden">
        <View className="bg-brand-500 px-4 py-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-white font-bold text-lg" numberOfLines={1}>{assessment.name}</Text>
              <Text className="text-brand-100 text-xs mt-0.5">{assessment.site_name} · {assessment.year}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              {/* QR Code */}
              <TouchableOpacity
                onPress={() => setShowQr(true)}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 7 }}
              >
                <Ionicons name="qr-code-outline" size={16} color="white" />
              </TouchableOpacity>
              {/* PDF export — all statuses */}
              <TouchableOpacity
                onPress={exportPdf}
                disabled={exportingPdf}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 7 }}
              >
                {exportingPdf
                  ? <ActivityIndicator size={15} color="white" />
                  : <Ionicons name="download-outline" size={16} color="white" />}
              </TouchableOpacity>
              {/* Delete — draft bilans only */}
              {assessment.status === 'draft' && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={{ backgroundColor: 'rgba(239,68,68,0.25)', borderRadius: 8, padding: 7 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        <View className="p-4">
          {scopeData.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            return (
              <View key={s.label} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                    <Text className="text-xs text-gray-600">{s.label}</Text>
                  </View>
                  <Text className="text-xs font-semibold text-gray-700">{fmt(s.value)} · {pct.toFixed(1)}%</Text>
                </View>
                <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                </View>
              </View>
            );
          })}
          <View className="pt-3 border-t border-gray-100 flex-row items-center justify-between">
            <Text className="text-xs font-medium text-gray-500">Total CO₂ éq.</Text>
            <Text className="text-xl font-extrabold text-brand-600">{fmt(assessment.total_co2eq)}</Text>
          </View>
        </View>
      </View>

      {/* Edit emissions CTA — draft & in_progress */}
      {(assessment.status === 'draft' || assessment.status === 'in_progress') && (
        <TouchableOpacity
          className="bg-brand-500 rounded-2xl p-4 mb-3 flex-row items-center justify-center gap-2"
          onPress={() => router.push(`/(app)/assessments/${id}/emissions` as any)}
        >
          <Ionicons name="create-outline" size={18} color="white" />
          <Text className="text-white font-semibold text-base">Saisir les émissions</Text>
        </TouchableOpacity>
      )}

      {/* Finaliser CTA — draft & in_progress */}
      {(assessment.status === 'draft' || assessment.status === 'in_progress') && (
        <TouchableOpacity
          onPress={handleFinalize}
          disabled={finalizing}
          style={{
            borderWidth: 1.5, borderColor: '#22c55e', borderRadius: 16,
            padding: 14, marginBottom: 16,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: finalizing ? 0.6 : 1,
          }}
        >
          {finalizing
            ? <ActivityIndicator size="small" color="#22c55e" />
            : <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" />}
          <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 15 }}>
            {finalizing ? 'Finalisation…' : 'Finaliser le bilan'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Certification section */}
      {cert ? (
        <View className="bg-white rounded-2xl mb-4 border border-gray-100 overflow-hidden">
          {cert.status === 'certified' && (
            <View style={{ backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#bbf7d0', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#15803d' }}>Bilan certifié</Text>
                <Text style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                  {fmtDate(cert.certifiedAt)}{cert.certificateNumber ? ` · N° ${cert.certificateNumber}` : ''}
                </Text>
              </View>
            </View>
          )}
          {cert.status === 'rejected' && (
            <View style={{ backgroundColor: '#fef2f2', borderBottomWidth: 1, borderBottomColor: '#fecaca', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#b91c1c' }}>Bilan rejeté</Text>
                {cert.rejectionReason && (
                  <Text style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>{cert.rejectionReason}</Text>
                )}
              </View>
            </View>
          )}
          {cert.status === 'in_progress' && (
            <View style={{ backgroundColor: '#fffbeb', borderBottomWidth: 1, borderBottomColor: '#fde68a', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="search" size={20} color="#d97706" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#92400e' }}>Inspection en cours</Text>
                <Text style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>L'expert examine votre bilan.</Text>
              </View>
            </View>
          )}
          {cert.status === 'assigned' && (
            <View style={{ backgroundColor: '#eff6ff', borderBottomWidth: 1, borderBottomColor: '#bfdbfe', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="person-circle" size={20} color="#3b82f6" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#1d4ed8' }}>Expert assigné</Text>
                <Text style={{ fontSize: 12, color: '#2563eb', marginTop: 2 }}>Un expert a été attribué à votre dossier.</Text>
              </View>
            </View>
          )}
          {cert.status === 'pending' && (
            <View style={{ backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="time" size={20} color="#9ca3af" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#6b7280' }}>En attente d'assignation</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Votre demande a bien été reçue.</Text>
              </View>
            </View>
          )}
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Badge label={certStatusInfo(cert.status).label} variant={certStatusInfo(cert.status).variant} />
              {cert.certificateNumber && (
                <Text className="text-xs font-bold text-brand-600">N° {cert.certificateNumber}</Text>
              )}
            </View>
            {cert.expertName && (
              <View className="flex-row items-center gap-1.5 mt-1.5">
                <Ionicons name="person-outline" size={13} color="#9ca3af" />
                <Text className="text-xs text-gray-500">Expert : <Text className="font-medium text-gray-700">{cert.expertName}</Text></Text>
              </View>
            )}
            {cert.inspectionDate && (cert.status === 'assigned' || cert.status === 'in_progress') && (
              <View className="flex-row items-center gap-1.5 mt-1.5">
                <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                <Text className="text-xs text-gray-500">Inspection : <Text className="font-medium text-gray-700">{fmtDate(cert.inspectionDate)}</Text></Text>
              </View>
            )}
          </View>
        </View>
      ) : canRequestCert ? (
        <TouchableOpacity
          className={`bg-brand-500 rounded-2xl p-4 mb-4 flex-row items-center justify-center gap-2 ${submitting ? 'opacity-60' : ''}`}
          onPress={requestCertification}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="ribbon-outline" size={18} color="white" />}
          <Text className="text-white font-semibold">
            {submitting ? 'Envoi en cours…' : 'Demander une certification'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Category breakdown */}
      {catEntries.length > 0 && (
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-900 mb-3">Répartition par catégorie</Text>
          {catEntries.map(([cat, val], i) => {
            const pct = catTotal > 0 ? (val / catTotal) * 100 : 0;
            const color = CAT_COLORS[i % CAT_COLORS.length];
            return (
              <View key={cat} className="mb-2.5">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5 flex-1">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                    <Text className="text-xs text-gray-600">{CATEGORY_LABELS[cat] ?? cat}</Text>
                  </View>
                  <Text className="text-xs font-semibold text-gray-700">{fmt(val)} · {pct.toFixed(1)}%</Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Monthly trend */}
      {monthlyData.length > 0 && (
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-900 mb-3">Ventilation mensuelle</Text>
          {monthlyData.map(m => {
            const pct = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
            return (
              <View key={m.month} className="mb-2">
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-500 w-8">{m.label}</Text>
                  <View className="flex-1 mx-2">
                    <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <View className="h-full rounded-full bg-brand-400" style={{ width: `${pct}%` }} />
                    </View>
                  </View>
                  <Text className="text-xs font-medium text-gray-600 w-20 text-right">{fmt(m.total)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Top emitters */}
      {topEmitters.length > 0 && (
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-900 mb-3">Top émetteurs</Text>
          {topEmitters.map((e, i) => (
            <View key={i} className="flex-row items-center justify-between py-2 border-b border-gray-50">
              <View className="flex-row items-center gap-2 flex-1">
                <Text className="text-xs text-gray-400 font-bold w-5">{i + 1}</Text>
                <View className="flex-1">
                  <Text className="text-sm text-gray-800 font-medium" numberOfLines={1}>{e.name}</Text>
                  <Text className="text-xs text-gray-400">Scope {e.scope}</Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-gray-900">{fmt(e.total)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* QR Code card */}
      <TouchableOpacity
        onPress={() => setShowQr(true)}
        className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
        activeOpacity={0.85}
      >
        <View className="flex-row items-center gap-3">
          <View style={{
            width: 52, height: 52, borderRadius: 12,
            backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <QRCode
              value={qrUrl}
              size={36}
              color="#15803d"
              backgroundColor="#f0fdf4"
              getRef={(ref: any) => {
                if (ref && !qrCaptured.current) {
                  qrCaptured.current = true;
                  try {
                    ref.toDataURL?.((data: string) => {
                      if (data) setQrDataUrl(`data:image/png;base64,${data}`);
                    });
                  } catch { /* ignore native errors */ }
                }
              }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900">QR Code du bilan</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Appuyez pour afficher en grand · partage rapide</Text>
          </View>
          <Ionicons name="expand-outline" size={18} color="#9ca3af" />
        </View>
      </TouchableOpacity>

      {/* Emission entries */}
      <Text className="text-sm font-bold text-gray-700 mb-3">
        Entrées d'émissions ({entries.length})
      </Text>
      {sections.length === 0 ? (
        <EmptyState icon="analytics-outline" title="Aucune entrée" description="Les données d'émissions s'afficheront ici." />
      ) : (
        sections.map(section => (
          <View key={section.title} className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-semibold text-gray-700">{section.title}</Text>
                <Text className="text-xs text-gray-400">({section.data.length})</Text>
              </View>
              <Text className="text-xs text-brand-600 font-bold">{fmt(section.total)}</Text>
            </View>
            {section.data.map(e => {
              const scopeColor = e.scope === 1 ? '#22c55e' : e.scope === 2 ? '#3b82f6' : '#f59e0b';
              const scopeBg   = e.scope === 1 ? '#f0fdf4' : e.scope === 2 ? '#eff6ff' : '#fffbeb';
              return (
                <View
                  key={e.id}
                  className="bg-white rounded-xl mb-1.5 border border-gray-100 overflow-hidden"
                  style={{ flexDirection: 'row' }}
                >
                  {/* Scope color strip */}
                  <View style={{ width: 4, backgroundColor: scopeColor }} />
                  <View className="flex-1 p-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-medium text-gray-900">{e.factor_name}</Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <View style={{ backgroundColor: scopeBg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: scopeColor }}>S{e.scope}</Text>
                          </View>
                          <Text className="text-xs text-gray-500">{e.quantity} {e.unit}</Text>
                        </View>
                        {e.description ? <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{e.description}</Text> : null}
                      </View>
                      <Text className="text-sm font-bold text-gray-900">{fmt(e.total_co2eq)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))
      )}
    </ScrollView>
  );
}
