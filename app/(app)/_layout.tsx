import { useRef, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { removeToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

function AppHeader({ title }: { title: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makePulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1, duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    Animated.parallel([makePulse(pulse1, 0), makePulse(pulse2, 1200)]).start();
  }, []);

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    await removeToken();
    router.replace('/login');
  };

  return (
    <View style={{ backgroundColor: '#fff' }}>
      {/* Single row: leaf icon · title (flex) · logout */}
      <View style={{
        paddingTop: insets.top + 10,
        paddingBottom: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
        {/* Brand icon — 30×30 layout footprint; 3 layered pulsars expand visually via transform */}
        <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {/* Ring 1 — brightest, fastest */}
          <Animated.View pointerEvents="none" style={{
            position: 'absolute', width: 30, height: 30, borderRadius: 15,
            borderWidth: 2, borderColor: '#22c55e',
            opacity: pulse1.interpolate({ inputRange: [0, 0.1, 0.6, 1], outputRange: [0, 0.9, 0.3, 0] }),
            transform: [{ scale: pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
          }} />
          {/* Ring 2 — medium, offset */}
          <Animated.View pointerEvents="none" style={{
            position: 'absolute', width: 30, height: 30, borderRadius: 15,
            borderWidth: 1.5, borderColor: '#4ade80',
            opacity: pulse2.interpolate({ inputRange: [0, 0.1, 0.6, 1], outputRange: [0, 0.7, 0.2, 0] }),
            transform: [{ scale: pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
          }} />
          <View style={{
            width: 30, height: 30,
            backgroundColor: '#22c55e', borderRadius: 9,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#22c55e',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 6,
          }}>
            <Ionicons name="leaf" size={15} color="white" />
          </View>
        </View>

        {/* Page title — takes all available space, truncates if needed */}
        <Text
          style={{ flex: 1, fontWeight: '700', fontSize: 16, color: '#111827', letterSpacing: -0.2 }}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Brand name + logout */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#22c55e', letterSpacing: 0.3 }}>
            CarbonTrack
          </Text>
          <View style={{ width: 1, height: 16, backgroundColor: '#e5e7eb' }} />
          <TouchableOpacity onPress={handleLogout} style={{ padding: 6 }}>
            <Ionicons name="log-out-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Gabon flag strip */}
      <View style={{ flexDirection: 'row', height: 3 }}>
        <View style={{ flex: 1, backgroundColor: '#009e60' }} />
        <View style={{ flex: 1, backgroundColor: '#FCD116' }} />
        <View style={{ flex: 1, backgroundColor: '#3A75C4' }} />
      </View>
    </View>
  );
}

type TabItem = {
  name: string;
  title: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { name: 'index',                icon: 'home-outline',          iconFocused: 'home',          title: 'Accueil',        label: 'Accueil'  },
  { name: 'sites/index',          icon: 'business-outline',      iconFocused: 'business',      title: 'Sites',          label: 'Sites'    },
  { name: 'assessments/index',    icon: 'bar-chart-outline',     iconFocused: 'bar-chart',     title: 'Bilans',         label: 'Bilans'   },
  { name: 'reports/index',        icon: 'document-text-outline', iconFocused: 'document-text', title: 'Rapports',       label: 'Rapports' },
  { name: 'certifications/index', icon: 'ribbon-outline',        iconFocused: 'ribbon',        title: 'Certifications', label: 'Certifs'  },
];

function TabIcon({ name, focused, color }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; color: string }) {
  return (
    <View style={{ alignItems: 'center', width: 40 }}>
      <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: focused ? '#22c55e' : 'transparent', marginBottom: 4 }} />
      <Ionicons name={name} size={focused ? 23 : 21} color={color} />
    </View>
  );
}

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const extraBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 8) : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 16,
          paddingBottom: extraBottom + 2,
          paddingTop: 0,
          height: 62 + extraBottom,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 1, letterSpacing: 0.1 },
        tabBarItemStyle: { paddingTop: 4 },
        header: ({ options }) => <AppHeader title={options.title ?? ''} />,
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? tab.iconFocused : tab.icon} focused={focused} color={color} />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="sites/new"                      options={{ href: null, title: 'Nouveau site' }} />
      <Tabs.Screen name="assessments/new"                options={{ href: null, title: 'Nouveau bilan' }} />
      <Tabs.Screen name="assessments/[id]/index"         options={{ href: null, title: 'Détail bilan' }} />
      <Tabs.Screen name="assessments/[id]/emissions"     options={{ href: null, title: 'Saisir les émissions' }} />
      <Tabs.Screen name="subscription/index"             options={{ href: null, title: 'Mon abonnement' }} />
    </Tabs>
  );
}
