import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/config';
import { saveToken } from '@/lib/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    rccm: '',
    sector: '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    const { firstName, lastName, companyName, email, phone, password } = form;
    if (!firstName || !lastName || !companyName || !email || !phone || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (!acceptedTerms) {
      setError('Vous devez accepter la Politique de confidentialité et les CGU pour continuer.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyName: companyName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          rccm: form.rccm.trim() || undefined,
          sector: form.sector.trim() || undefined,
          acceptedTermsVersion: '1.0',
          acceptedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription.");
        return;
      }

      const token = data.token
        ?? res.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];
      if (token) {
        await saveToken(token);
        router.replace('/(app)');
      } else {
        setError('Compte créé. Veuillez vous connecter.');
        router.replace('/login');
      }
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-brand-500 rounded-3xl items-center justify-center mb-4">
            <Ionicons name="leaf" size={40} color="white" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">Créer un compte</Text>
          <Text className="text-gray-500 mt-1 text-center">
            Inscrivez votre entreprise sur CarbonTrack
          </Text>
        </View>

        {/* Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex-row items-start gap-2">
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
            </View>
          ) : null}

          {/* Company */}
          <Text className="text-xs font-medium text-gray-500 mb-1.5">Nom de l&apos;entreprise *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-4"
            placeholder="Ma Société SARL"
            placeholderTextColor="#9ca3af"
            value={form.companyName}
            onChangeText={set('companyName')}
            returnKeyType="next"
          />

          {/* First + Last name */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-500 mb-1.5">Prénom *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Jean"
                placeholderTextColor="#9ca3af"
                value={form.firstName}
                onChangeText={set('firstName')}
                returnKeyType="next"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-500 mb-1.5">Nom *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Dupont"
                placeholderTextColor="#9ca3af"
                value={form.lastName}
                onChangeText={set('lastName')}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <Text className="text-xs font-medium text-gray-500 mb-1.5">Email *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-4"
            placeholder="votre@email.com"
            placeholderTextColor="#9ca3af"
            value={form.email}
            onChangeText={set('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />

          {/* Phone */}
          <Text className="text-xs font-medium text-gray-500 mb-1.5">Téléphone *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-4"
            placeholder="+241 01 23 45 67"
            placeholderTextColor="#9ca3af"
            value={form.phone}
            onChangeText={set('phone')}
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          {/* Password */}
          <Text className="text-xs font-medium text-gray-500 mb-1.5">Mot de passe *</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-4">
            <TextInput
              className="flex-1 py-3 text-gray-900"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry={!showPassword}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* RCCM (optional) */}
          <Text className="text-xs font-medium text-gray-500 mb-1.5">
            RCCM <Text className="text-gray-400">(optionnel)</Text>
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-4"
            placeholder="GA-LBV-2024-B12-00123"
            placeholderTextColor="#9ca3af"
            value={form.rccm}
            onChangeText={set('rccm')}
            autoCapitalize="characters"
            returnKeyType="next"
          />

          {/* Sector (optional) */}
          <Text className="text-xs font-medium text-gray-500 mb-1.5">
            Secteur d&apos;activité <Text className="text-gray-400">(optionnel)</Text>
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-5"
            placeholder="Transport, Industrie, Agriculture..."
            placeholderTextColor="#9ca3af"
            value={form.sector}
            onChangeText={set('sector')}
            returnKeyType="done"
          />

          {/* Legal acceptance — required */}
          <TouchableOpacity
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
            className="flex-row items-start gap-3 mb-5"
          >
            <View
              className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center ${
                acceptedTerms ? 'bg-brand-500 border-brand-500' : 'border-gray-300 bg-white'
              }`}
            >
              {acceptedTerms && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text className="flex-1 text-xs text-gray-600 leading-5">
              J&apos;ai lu et j&apos;accepte la{' '}
              <Text
                className="text-brand-600 font-semibold underline"
                onPress={(e) => { e.stopPropagation(); router.push('/privacy'); }}
              >
                Politique de confidentialité
              </Text>
              {' '}et les{' '}
              <Text
                className="text-brand-600 font-semibold underline"
                onPress={(e) => { e.stopPropagation(); router.push('/terms'); }}
              >
                Conditions d&apos;utilisation
              </Text>
              {' '}de CarbonTrack, alignées sur les principes du Règlement Général sur la Protection des Données (RGPD).
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            className={`bg-brand-500 rounded-xl py-3.5 items-center ${
              loading || !acceptedTerms ? 'opacity-50' : ''
            }`}
            onPress={handleRegister}
            disabled={loading || !acceptedTerms}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Créer mon compte</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to login */}
        <View className="flex-row justify-center items-center mt-6 gap-1">
          <Text className="text-gray-500 text-sm">Déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text className="text-brand-500 font-semibold text-sm">Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
