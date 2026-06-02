import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'jordan@nexusgrowth.com', password: 'ngi2024' },
  { label: 'Project Mgr', email: 'alex@nexusgrowth.com', password: 'ngi2024' },
  { label: 'Contractor', email: 'sam@nexusgrowth.com', password: 'ngi2024' },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(email.trim(), password.trim());
    setLoading(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? 'Login failed.');
    }
  };

  const loginAsDemo = async (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setError('');
    setLoading(true);
    const result = await login(acc.email, acc.password);
    setLoading(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'Demo login failed.');
    }
  };

  const handleTryDemo = async () => {
    setDemoLoading(true);
    setError('');
    const result = await login('jordan@nexusgrowth.com', 'ngi2024');
    setDemoLoading(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      setError('Demo login failed. Please try again.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandBlock}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImage}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
            <Text style={styles.companyName}>Nexus Growth Inc.</Text>
            <Text style={styles.tagline}>Property Management Platform</Text>
          </View>

          {/* Try Demo Banner */}
          <TouchableOpacity
            style={[styles.demoBanner, { backgroundColor: colors.gold }]}
            onPress={handleTryDemo}
            disabled={demoLoading}
            activeOpacity={0.85}
          >
            {demoLoading ? (
              <ActivityIndicator color={colors.navy} />
            ) : (
              <>
                <Feather name="play-circle" size={18} color={colors.navy} />
                <Text style={[styles.demoBannerText, { color: colors.navy }]}>
                  Try Demo — Explore All Features
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sign In</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="you@nexusgrowth.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signInBtn, { backgroundColor: colors.navy, opacity: loading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Demo quick access */}
            <View style={styles.demoSection}>
              <View style={[styles.demoDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.demoLabel, { color: colors.mutedForeground, backgroundColor: colors.card }]}>
                Sign in as
              </Text>
            </View>
            <View style={styles.demoRow}>
              {DEMO_ACCOUNTS.map((acc) => (
                <TouchableOpacity
                  key={acc.label}
                  style={[styles.demoChip, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                  onPress={() => loginAsDemo(acc)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.demoChipText, { color: colors.navy }]}>{acc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  brandBlock: { alignItems: 'center', marginBottom: 24 },
  logoImage: { width: 120, height: 80, marginBottom: 12 },
  companyName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 4 },
  tagline: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)' },
  demoBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    marginBottom: 16,
  },
  demoBannerText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  card: {
    borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#EF4444', fontFamily: 'Inter_400Regular', flex: 1 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  signInBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  signInText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  demoSection: { position: 'relative', alignItems: 'center', marginVertical: 20 },
  demoDivider: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1 },
  demoLabel: {
    paddingHorizontal: 12, fontSize: 12, fontFamily: 'Inter_500Medium', zIndex: 1,
  },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoChip: {
    flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center',
  },
  demoChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
