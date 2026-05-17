import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import type { Subscription } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SubscriptionResponse {
  current: Subscription | null;
  history: Subscription[];
  renewalAmount?: number;
}

function daysLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmount(amount: number, currency: string) {
  if (!amount) return '—';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + (currency ?? 'XAF');
}

function planLabel(plan: string) {
  const map: Record<string, string> = {
    starter: 'Starter', basic: 'Basique', standard: 'Standard',
    professional: 'Professionnel', enterprise: 'Entreprise', monthly: 'Mensuel',
  };
  return map[plan] ?? plan.charAt(0).toUpperCase() + plan.slice(1);
}

const PAYMENT_METHODS = [
  { id: 'AFG Bank',      label: 'AFG Bank',        icon: 'business-outline',        iconColor: '#1e40af', logoBg: '#eff6ff', available: false },
  { id: 'Airtel Money',  label: 'Airtel Money',     icon: 'phone-portrait-outline',  iconColor: '#dc2626', logoBg: '#fff5f5', available: true  },
  { id: 'Moov Money',    label: 'Moov Money',       icon: 'phone-portrait-outline',  iconColor: '#ea580c', logoBg: '#fff9f0', available: false },
  { id: 'Carte bancaire',label: 'Mastercard / Visa',icon: 'card-outline',            iconColor: '#7c3aed', logoBg: '#f5f8ff', available: false },
];

export default function SubscriptionScreen() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [renewModal, setRenewModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [payMethod, setPayMethod] = useState('Airtel Money');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<SubscriptionResponse>('/api/subscriptions');
      setData(res);
    } catch {
      setData({ current: null, history: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleRenewSubmit = async () => {
    if (!phone.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir votre numéro de paiement.');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/subscriptions/request', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'monthly',
          amount: renewalAmount,
          currency: 'XAF',
          paymentMethod: payMethod,
          phonePayment: phone.trim(),
        }),
      });
      setRenewModal(false);
      setPhone('');
      Alert.alert(
        'Demande envoyée !',
        `Votre demande a été soumise. Notre équipe va confirmer votre paiement ${payMethod} sous 24h et activer votre accès.`,
        [{ text: 'OK', onPress: load }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'envoyer la demande. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const sub = data?.current ?? null;
  const history = data?.history ?? [];
  const renewalAmount = data?.renewalAmount ?? 250000;
  const days = sub ? daysLeft(sub.expiresAt) : 0;
  const expiringSoon = sub && days <= 14;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
    >
      {/* ── Hero ── */}
      {sub ? (
        <View
          style={{ backgroundColor: expiringSoon ? '#d97706' : '#16a34a' }}
          className="rounded-2xl p-5 mb-4"
        >
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                Abonnement actif
              </Text>
              <Text className="text-white text-2xl font-extrabold">{planLabel(sub.plan)}</Text>
              <Text className="text-white/75 text-sm mt-1">
                {fmtAmount(renewalAmount, 'XAF')} / mois
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: 10 }}>
              <Ionicons name="shield-checkmark" size={24} color="white" />
            </View>
          </View>

          {/* Time remaining bar */}
          {sub.startsAt && (
            (() => {
              const total = new Date(sub.expiresAt).getTime() - new Date(sub.startsAt).getTime();
              const elapsed = Date.now() - new Date(sub.startsAt).getTime();
              const remaining = Math.min(100, Math.max(0, ((total - elapsed) / total) * 100));
              return (
                <View className="bg-black/15 rounded-xl p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white/80 text-xs font-medium">Temps restant</Text>
                    <Text className="text-white font-extrabold text-sm">
                      {days} jour{days !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <View className="h-full rounded-full bg-white" style={{ width: `${remaining}%` }} />
                  </View>
                  <View className="flex-row justify-between mt-1.5">
                    <Text className="text-white/50 text-xs">{fmtDate(sub.startsAt)}</Text>
                    <Text className="text-white/50 text-xs">{fmtDate(sub.expiresAt)}</Text>
                  </View>
                </View>
              );
            })()
          )}

          {expiringSoon && (
            <View className="flex-row items-center gap-2 mt-3 bg-black/15 rounded-xl px-3 py-2">
              <Ionicons name="warning-outline" size={14} color="white" />
              <Text className="text-white text-xs font-semibold flex-1">
                Abonnement expirant bientôt — pensez à le renouveler.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View style={{ backgroundColor: '#fee2e2', borderRadius: 12, padding: 9 }}>
              <Ionicons name="alert-circle-outline" size={22} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-700 font-extrabold text-base">Aucun abonnement actif</Text>
              <Text className="text-red-400 text-xs mt-0.5">Accès aux fonctionnalités limité</Text>
            </View>
          </View>
          <Text className="text-red-600 text-sm leading-5">
            Souscrivez à un plan pour bénéficier de l'ensemble des fonctionnalités CarbonTrack : bilans illimités, rapports détaillés et certifications.
          </Text>
        </View>
      )}

      {/* ── Payment info (real data only) ── */}
      {sub && (
        <View className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-50">
            <Text className="text-sm font-bold text-gray-900">Détails du paiement</Text>
          </View>
          <InfoRow icon="card-outline"            label="Mode de paiement"   value={sub.paymentMethod ?? '—'} />
          {sub.phonePayment && (
            <InfoRow icon="phone-portrait-outline" label="Numéro de paiement" value={sub.phonePayment} />
          )}
          {sub.paymentRef && (
            <InfoRow icon="receipt-outline"        label="Référence"          value={sub.paymentRef} />
          )}
          <InfoRow icon="calendar-outline"         label="Souscrit le"        value={fmtDate(sub.createdAt)} last />
        </View>
      )}

      {/* ── Renew / Subscribe CTA ── */}
      <TouchableOpacity
        onPress={() => setRenewModal(true)}
        activeOpacity={0.88}
        className="rounded-2xl overflow-hidden mb-4"
      >
        <View
          style={{ backgroundColor: sub ? '#1d4ed8' : '#16a34a' }}
          className="px-5 py-4 flex-row items-center"
        >
          <View className="flex-1">
            <Text className="text-white font-extrabold text-base">
              {sub ? 'Renouveler mon abonnement' : 'Souscrire maintenant'}
            </Text>
            <Text className="text-white/70 text-xs mt-0.5">
              Airtel Money · {fmtAmount(renewalAmount, 'XAF')}/mois
            </Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: 9 }}>
            <Ionicons name={sub ? 'refresh-outline' : 'arrow-forward-outline'} size={20} color="white" />
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Renewal Modal ── */}
      <Modal visible={renewModal} transparent animationType="slide" onRequestClose={() => setRenewModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', position: 'absolute', inset: 0 }} />
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

            <Text style={{ fontWeight: '800', fontSize: 18, color: '#111827', marginBottom: 4 }}>
              {sub ? 'Renouveler l\'abonnement' : 'Souscrire à CarbonTrack'}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
              Complétez votre paiement Mobile Money pour activer votre accès.
            </Text>

            {/* Amount summary */}
            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>Montant à payer</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#15803d' }}>{fmtAmount(renewalAmount, 'XAF')}</Text>
                <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>par mois · abonnement mensuel</Text>
              </View>
              <View style={{ backgroundColor: '#dcfce7', borderRadius: 10, padding: 8 }}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#16a34a" />
              </View>
            </View>

            {/* Payment method selector — 3 methods, real logos */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 10 }}>Mode de paiement</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {PAYMENT_METHODS.map(m => {
                const isSelected = payMethod === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => m.available && setPayMethod(m.id)}
                    activeOpacity={m.available ? 0.75 : 1}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? '#22c55e' : '#e5e7eb',
                      backgroundColor: isSelected ? '#f0fdf4' : (m.available ? '#fff' : '#fafafa'),
                      padding: 10,
                      alignItems: 'center',
                      opacity: m.available ? 1 : 0.75,
                    }}
                  >
                    {/* Logo */}
                    <View style={{
                      width: 52, height: 36,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: m.logoBg, borderRadius: 8,
                      marginBottom: 6,
                    }}>
                      <Ionicons name={m.icon as any} size={22} color={m.iconColor} />
                    </View>
                    <Text style={{
                      fontSize: 10, fontWeight: '700', textAlign: 'center',
                      color: isSelected ? '#15803d' : (m.available ? '#374151' : '#9ca3af'),
                    }} numberOfLines={1}>{m.label}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={14} color="#22c55e" style={{ marginTop: 4 }} />
                    )}
                    {!m.available && (
                      <View style={{
                        backgroundColor: '#fef9c3', borderRadius: 5,
                        paddingHorizontal: 5, paddingVertical: 2, marginTop: 4,
                      }}>
                        <Text style={{ fontSize: 8, fontWeight: '700', color: '#854d0e' }}>Bientôt</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Phone input */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
              Numéro {payMethod} *
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+241 07 00 00 00"
              keyboardType="phone-pad"
              style={{
                borderWidth: 1.5, borderColor: phone ? '#22c55e' : '#e5e7eb',
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                fontSize: 15, color: '#111827', marginBottom: 8,
              }}
            />
            <Text style={{ fontSize: 10, color: '#9ca3af', marginBottom: 20 }}>
              Un paiement de {fmtAmount(renewalAmount, 'XAF')} sera initié depuis ce numéro. Votre accès sera activé après confirmation sous 24h.
            </Text>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setRenewModal(false)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '600', color: '#6b7280' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRenewSubmit}
                disabled={submitting}
                style={{
                  flex: 2, paddingVertical: 13, borderRadius: 12,
                  backgroundColor: submitting ? '#86efac' : '#16a34a',
                  alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                }}
              >
                <Ionicons name={submitting ? 'hourglass-outline' : 'checkmark-circle-outline'} size={18} color="white" />
                <Text style={{ fontWeight: '700', color: 'white', fontSize: 14 }}>
                  {submitting ? 'Envoi...' : 'Confirmer le paiement'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── History ── */}
      {history.length > 1 && (
        <>
          <TouchableOpacity
            onPress={() => setShowHistory(v => !v)}
            className="flex-row items-center justify-between mb-3 mt-1"
          >
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Historique des abonnements
            </Text>
            <Ionicons name={showHistory ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
          </TouchableOpacity>

          {showHistory && (
            <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {history.map((s, i) => (
                <View
                  key={s.id}
                  className={`px-4 py-3 flex-row items-center ${i < history.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-800">{planLabel(s.plan)}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {fmtDate(s.startsAt)} → {fmtDate(s.expiresAt)}
                    </Text>
                    {s.amount > 0 && (
                      <Text className="text-xs text-gray-400">{fmtAmount(s.amount, s.currency)}</Text>
                    )}
                  </View>
                  <View className={`rounded-full px-2.5 py-1 ${s.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Text className={`text-xs font-bold ${s.status === 'active' ? 'text-green-700' : 'text-gray-500'}`}>
                      {s.status === 'active' ? 'Actif' : 'Expiré'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, last }: {
  icon: string; label: string; value: string; last?: boolean;
}) {
  return (
    <View className={`flex-row items-center px-4 py-3 ${last ? '' : 'border-b border-gray-50'}`}>
      <Ionicons name={icon as any} size={15} color="#9ca3af" style={{ marginRight: 10 }} />
      <Text className="text-sm text-gray-500 flex-1">{label}</Text>
      <Text className="text-sm font-semibold text-gray-800 text-right" style={{ maxWidth: '55%' }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
