import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';

const SLOGAN = 'Tìm được nhà mơ ước chỉ trong vài bước';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => router.replace('/needs'), 2600);
    return () => clearTimeout(t);
  }, [fade, scale, router]);

  return (
    <LinearGradient colors={['#FFFFFF', '#F9F7F4']} style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.center, { opacity: fade, transform: [{ scale }] }]}>
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
            transition={300}
          />
        </View>
        <Text style={styles.name}>VoNo</Text>
        <View style={styles.taglineRow}>
          <View style={styles.line} />
          <Text style={styles.slogan}>{SLOGAN}</Text>
          <View style={styles.line} />
        </View>
        <Text style={styles.subSlogan}>Đồng hành cùng bạn tìm tổ ấm lý tưởng</Text>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.dotRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  logoWrap: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.darkGold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 26,
  },
  logo: {
    width: 150,
    height: 150,
  },
  name: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.darkBrown,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  line: {
    width: 28,
    height: 1,
    backgroundColor: COLORS.warmGold,
  },
  slogan: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.bronze,
    textAlign: 'center',
  },
  subSlogan: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.grayLight,
  },
  dotActive: {
    backgroundColor: COLORS.warmGold,
    width: 22,
  },
});
