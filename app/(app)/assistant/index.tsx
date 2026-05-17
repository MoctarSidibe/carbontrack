import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/config';
import { getToken } from '@/lib/auth';
import BotIcon from '@/components/BotIcon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Source {
  title: string;
  code: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  error?: boolean;
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

const SUGGESTIONS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'flash-outline',         text: 'Quels équipements entrent dans le Scope 1 ?' },
  { icon: 'car-outline',           text: 'Comment calculer les émissions de ma flotte de véhicules ?' },
  { icon: 'document-text-outline', text: 'Différence entre Scope 2 market-based et location-based ?' },
  { icon: 'sparkles-outline',      text: 'Combien de tCO2e émet 1000 L de gazole ?' },
];

// ─── SSE parser (used after collecting full response text) ───────────────────

function parseSSE(text: string): { tokens: string[]; sources: Source[] } {
  const tokens: string[] = [];
  let sources: Source[] = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const json = line.slice(6).trim();
    if (json === '[DONE]' || !json) continue;
    try {
      const parsed = JSON.parse(json);
      if (parsed.sources) sources = parsed.sources;
      else if (parsed.token) tokens.push(parsed.token);
    } catch { /* skip malformed */ }
  }
  return { tokens, sources };
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages, loading]);

  const sendMessage = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Cookie: `token=${token}` } : {}),
        },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: body.error ?? `Erreur ${res.status}. Vérifiez la configuration de l'assistant.`,
          error: true,
        }]);
        return;
      }

      // Buffer entire SSE response, then parse — most reliable approach on RN
      const text = await res.text();
      const { tokens, sources } = parseSSE(text);
      const content = tokens.join('');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: content || "Je n'ai pas trouvé d'information pertinente sur cette question dans ma base de connaissances.",
        sources,
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erreur de connexion. Vérifiez votre réseau et réessayez.',
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    if (messages.length === 0) return;
    Alert.alert(
      'Nouvelle conversation',
      'Effacer l\'historique de la conversation en cours ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: () => setMessages([]) },
      ]
    );
  };

  const showEmpty = messages.length === 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Sub-header with badges + clear button */}
      <View className="bg-white px-4 py-2.5 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 flex-wrap flex-1">
          {['ISO 14064', 'GHG Protocol', 'ADEME'].map(tag => (
            <View key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-medium text-gray-500">{tag}</Text>
            </View>
          ))}
        </View>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={clearConversation}
            className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
          >
            <Ionicons name="trash-outline" size={14} color="#9ca3af" />
            <Text className="text-xs font-medium text-gray-400">Nouvelle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 16,
          flexGrow: 1,
          justifyContent: showEmpty ? 'center' : 'flex-start',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {showEmpty ? (
          <View className="items-center">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: '#16a34a' }}
            >
              <BotIcon size={30} color="white" strokeWidth={2.2} />
            </View>
            <Text className="text-lg font-bold text-gray-900 mb-1.5">
              Comment puis-je vous aider ?
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-6 px-2">
              Posez vos questions sur le bilan GES, les scopes d&apos;émissions, les facteurs ADEME ou la réglementation gabonaise.
            </Text>

            <View className="w-full gap-2.5">
              {SUGGESTIONS.map(s => (
                <TouchableOpacity
                  key={s.text}
                  onPress={() => sendMessage(s.text)}
                  activeOpacity={0.7}
                  className="flex-row items-start gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3"
                >
                  <View className="w-8 h-8 bg-brand-50 rounded-lg items-center justify-center flex-shrink-0">
                    <Ionicons name={s.icon} size={16} color="#16a34a" />
                  </View>
                  <Text className="text-sm text-gray-700 flex-1 leading-5">
                    {s.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View className="gap-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <View className="flex-row gap-2 items-end">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  <BotIcon size={18} color="white" />
                </View>
                <View className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#16a34a" />
                  <Text className="text-sm text-gray-500">Réflexion…</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View
        className="bg-white border-t border-gray-100 px-3 pt-2.5"
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      >
        <View className="flex-row items-end gap-2 bg-gray-100 rounded-2xl px-3 py-1.5">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Posez votre question…"
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            className="flex-1 text-sm text-gray-900 py-2 max-h-24"
            editable={!loading}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            blurOnSubmit
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-xl items-center justify-center ${
              !input.trim() || loading ? 'bg-gray-300' : 'bg-brand-600'
            }`}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <View className={`flex-row gap-2 ${isUser ? 'justify-end' : 'justify-start'} items-end`}>
      {!isUser && (
        <View
          className="w-8 h-8 rounded-xl items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#16a34a' }}
        >
          <BotIcon size={18} color="white" />
        </View>
      )}
      <View className={isUser ? 'items-end max-w-[80%]' : 'items-start flex-1 min-w-0 gap-1.5'}>
        <View
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-brand-600 rounded-tr-sm'
              : msg.error
                ? 'bg-red-50 border border-red-200 rounded-tl-sm'
                : 'bg-white border border-gray-200 rounded-tl-sm'
          }`}
        >
          {msg.error && (
            <View className="flex-row items-center gap-1.5 mb-1">
              <Ionicons name="alert-circle" size={14} color="#dc2626" />
              <Text className="text-xs font-semibold text-red-700">Erreur</Text>
            </View>
          )}
          <Text
            className={`text-sm leading-5 ${
              isUser ? 'text-white' : msg.error ? 'text-red-700' : 'text-gray-800'
            }`}
            selectable
          >
            {msg.content}
          </Text>
        </View>

        {msg.sources && msg.sources.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {msg.sources.map((src, j) => (
              <View
                key={j}
                className="flex-row items-center gap-1 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full"
              >
                <Ionicons name="book-outline" size={9} color="#6b7280" />
                <Text className="text-[10px] font-medium text-gray-500" numberOfLines={1}>
                  {src.code ? `${src.code} — ` : ''}{src.title}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
