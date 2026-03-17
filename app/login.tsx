import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/config';
import { saveToken } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
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
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Email ou mot de passe incorrect.');
        setLoading(false);
        return;
      }

      // Extract JWT from Set-Cookie header (React Native can read it)
      const setCookie = res.headers.get('set-cookie') ?? '';
      const match = setCookie.match(/token=([^;]+)/);
      if (match?.[1]) {
        await saveToken(match[1]);
      } else {
        setError('Impossible de récupérer le token. Vérifiez la configuration du serveur.');
        setLoading(false);
        return;
      }

      router.replace('/(app)');
    } catch (err) {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion WiFi et l\'IP dans config.ts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-brand-500 rounded-3xl items-center justify-center mb-4">
              <Ionicons name="leaf" size={40} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">CarbonTrack</Text>
            <Text className="text-gray-500 mt-1">Connexion à votre compte</Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text className="text-red-600 text-sm flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text className="text-xs font-medium text-gray-500 mb-1.5">Email</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-4"
              placeholder="votre@email.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            {/* Password */}
            <Text className="text-xs font-medium text-gray-500 mb-1.5">Mot de passe</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-6">
              <TextInput
                className="flex-1 py-3 text-gray-900"
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity
              className={`bg-brand-500 rounded-xl py-3.5 items-center ${loading ? 'opacity-60' : ''}`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
