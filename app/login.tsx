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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError('');
    setLoading(true);

    const url = `${API_URL}/api/auth/login`;
    console.log('[LOGIN] →', url);

    // Abort the fetch after 10 s so we don't sit on a silent hang
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 10_000);

    try {
      const t0 = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        signal: ctrl.signal,
      });
      console.log('[LOGIN] response in', Date.now() - t0, 'ms · status', res.status);
      const data = await res.json();

      if (!res.ok) {
        console.log('[LOGIN] body:', data);
        setError(data.error || `Erreur ${res.status} — vérifiez vos identifiants.`);
        setLoading(false);
        return;
      }

      const token = data.token
        ?? res.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];
      if (!token) {
        setError('Connexion OK mais aucun token reçu — vérifier le serveur.');
        setLoading(false);
        return;
      }
      await saveToken(token);
      console.log('[LOGIN] success, navigating to /(app)');
      router.replace('/(app)');
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      const msg = err?.message ?? String(err);
      console.log('[LOGIN] ERROR ·', err?.name, '·', msg);

      let userMsg: string;
      if (isAbort) {
        userMsg = 'Délai dépassé. Vérifiez votre connexion et réessayez.';
      } else if (/Network request failed/i.test(msg)) {
        userMsg = 'Connexion impossible. Vérifiez votre connexion internet.';
      } else {
        userMsg = `Erreur : ${msg}`;
      }
      setError(userMsg);
    } finally {
      clearTimeout(timeoutId);
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
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + brand */}
        <View className="items-center mb-10">
          <View style={{
            width: 110, height: 110,
            backgroundColor: '#22c55e', borderRadius: 32,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 18,
            shadowColor: '#22c55e',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.45,
            shadowRadius: 18,
            elevation: 12,
          }}>
            <Ionicons name="leaf" size={58} color="white" />
          </View>
          <Text className="text-4xl font-bold text-gray-900 tracking-tight">CarbonTrack</Text>
          <Text className="text-gray-500 mt-2 text-base">Connexion à votre compte</Text>
        </View>

        {/* Card */}
        <View className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex-row items-start gap-2">
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Email</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 mb-5 text-base"
            placeholder="votre@email.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />

          {/* Password */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Mot de passe</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-7">
            <TextInput
              className="flex-1 py-4 text-gray-900 text-base"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            className={`bg-brand-500 rounded-xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
            style={{
              shadowColor: '#22c55e',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg tracking-wide">Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View className="flex-row justify-center items-center mt-7 gap-1.5">
          <Text className="text-gray-500 text-base">Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text className="text-brand-500 font-bold text-base">Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
