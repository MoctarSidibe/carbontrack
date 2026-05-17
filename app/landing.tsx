import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing,
  StatusBar, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURES = [
  {
    icon: 'bar-chart-outline' as const,
    title: 'Bilans carbone complets',
    desc: 'Saisie guidée Scope 1, 2 et 3 selon ISO 14064-1 et GHG Protocol',
  },
  {
    icon: 'globe-outline' as const,
    title: 'Référentiels internationaux',
    desc: 'GHG Protocol Corporate Standard · Base Carbone ADEME · 100+ facteurs d\'émission vérifiés',
  },
  {
    icon: 'ribbon-outline' as const,
    title: 'Certification par experts',
    desc: 'Dossier audité et certifié par les experts GreenLeaves, autorité de certification officielle.',
  },
];

const FLAG_COLORS = ['#009e60', '#FCD116', '#3A75C4'];

// 3 thin long horizontal bands stacked — Gabon flag colors (green / yellow / blue)
function FlagStrip({ bandHeight = 3 }: { bandHeight?: number }) {
  return (
    <View>
      {FLAG_COLORS.map(c => (
        <View key={c} style={{ height: bandHeight, backgroundColor: c }} />
      ))}
    </View>
  );
}


export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const logoAnim     = useRef(new Animated.Value(0)).current;
  const titleAnim    = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim      = useRef(new Animated.Value(0)).current;

  // Pulsar rings
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.stagger(160, [
      Animated.timing(logoAnim,     { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(titleAnim,    { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(featuresAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(ctaAnim,      { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Pulsar loops — ring 2 starts half a period later for staggered effect
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

    Animated.parallel([
      makePulse(pulse1, 0),
      makePulse(pulse2, 1200),
    ]).start();
  }, []);

  const slide = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#1a6b3a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1a6b3a" />

      {/* ── Gabon flag strip — TOP (3 thin long horizontal bands: green · yellow · blue) ── */}
      <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 10 }}>
        <FlagStrip bandHeight={3} />
      </View>


      {/* ── Main layout ── */}
      <View style={{
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: insets.top + (Platform.OS === 'android' ? 44 : 48),
        paddingBottom: insets.bottom + 16,
        justifyContent: 'space-between',
      }}>

        {/* Logo + Brand */}
        <Animated.View style={[{ alignItems: 'center' }, slide(logoAnim)]}>
          {/* Pulsar container — same size as ring; pulsars scale visually via transform without affecting layout */}
          <View style={{ width: 128, height: 128, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>

            {/* ── Pulsar ring 1 ── */}
            <Animated.View pointerEvents="none" style={{
              position: 'absolute',
              width: 128, height: 128, borderRadius: 64,
              borderWidth: 1.5, borderColor: '#4ade80',
              opacity: pulse1.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.7, 0.3, 0] }),
              transform: [{ scale: pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] }) }],
            }} />

            {/* ── Pulsar ring 2 ── */}
            <Animated.View pointerEvents="none" style={{
              position: 'absolute',
              width: 128, height: 128, borderRadius: 64,
              borderWidth: 1.5, borderColor: '#86efac',
              opacity: pulse2.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.55, 0.2, 0] }),
              transform: [{ scale: pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] }) }],
            }} />

            {/* ── Outer halo ring (static) ── */}
            <View style={{
              width: 128, height: 128, borderRadius: 64,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Inner halo */}
              <View style={{
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: 'rgba(34,197,94,0.22)',
                borderWidth: 1, borderColor: 'rgba(74,222,128,0.4)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Icon box */}
                <View style={{
                  width: 72, height: 72, borderRadius: 20,
                  backgroundColor: '#22c55e',
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#4ade80',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.7,
                  shadowRadius: 24,
                  elevation: 16,
                }}>
                  <Ionicons name="leaf" size={36} color="white" />
                </View>
              </View>
            </View>
          </View>

          <Animated.View style={[{ alignItems: 'center' }, slide(titleAnim)]}>
            <Text style={{
              fontSize: 38, fontWeight: '800', color: 'white',
              letterSpacing: -1.2, marginBottom: 7,
            }}>
              CarbonTrack
            </Text>
            <Text style={{
              fontSize: 12, color: 'rgba(255,255,255,0.6)',
              letterSpacing: 2.0, textTransform: 'uppercase', fontWeight: '700',
            }}>
              Mesurez · Réduisez · Certifiez
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Feature cards */}
        <Animated.View style={[{ gap: 10 }, slide(featuresAnim)]}>
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 18, padding: 16, gap: 14,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
              }}
            >
              <View style={{
                width: 46, height: 46, borderRadius: 14,
                backgroundColor: 'rgba(74,222,128,0.22)',
                borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ionicons name={f.icon} size={22} color="#86efac" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'white', marginBottom: 3 }}>
                  {f.title}
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.52)', lineHeight: 17 }}>
                  {f.desc}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CTA + badges */}
        <Animated.View style={slide(ctaAnim)}>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#22c55e',
              borderRadius: 18,
              paddingVertical: 17,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#4ade80',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.55,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 }}>
              Se connecter
            </Text>
            <Ionicons name="arrow-forward" size={19} color="white" />
          </TouchableOpacity>

          {/* Compliance badges */}
          <View style={{
            flexDirection: 'row', justifyContent: 'center',
            flexWrap: 'wrap', gap: 7, marginTop: 18,
          }}>
            {['ISO 14064-1', 'GHG Protocol', 'Base Carbone ADEME', 'ISO 14069'].map(b => (
              <View key={b} style={{
                borderRadius: 20,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
                paddingHorizontal: 11, paddingVertical: 4,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}>
                <Text style={{
                  fontSize: 9, color: 'rgba(255,255,255,0.5)',
                  fontWeight: '700', letterSpacing: 0.6,
                }}>
                  {b}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
