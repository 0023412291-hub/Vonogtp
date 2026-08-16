import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { FormField } from '@/components/form-field';
import { Segmented } from '@/components/segmented';
import { COLORS, TYPOGRAPHY } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { isValidEmail, isValidPhone } from '@/utils/validation';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useApp();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!isValidEmail(email)) e.email = 'Vui lòng nhập email hợp lệ';
    if (password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (mode === 'register') {
      if (!name.trim()) e.name = 'Vui lòng nhập họ tên';
      if (!isValidPhone(phone)) e.phone = 'Số điện thoại không hợp lệ';
      if (confirm !== password) e.confirm = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    // Giả lập đăng nhập (frontend prototype)
    setTimeout(() => {
      setLoading(false);
      const displayName =
        mode === 'register' ? name.trim() : email.split('@')[0].replace(/[._-]/g, ' ');
      signIn({
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        phone: phone || '0912345678',
        email: email.trim(),
      });
      router.replace('/(tabs)');
    }, 700);
  };

  const socialLogin = (provider: string) => {
    Alert.alert(provider, `Đăng nhập bằng ${provider} sẽ được kết nối ở phiên bản sau.`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>

        <View style={styles.heading}>
          <Text style={styles.welcome}>Chào mừng đến với</Text>
          <Text style={styles.appName}>VoNo - Tìm Nhà Nhanh</Text>
          <Text style={styles.sub}>Đăng nhập để khám phá hàng nghìn tin bất động sản</Text>
        </View>

        <Segmented
          options={['Đăng Nhập', 'Đăng Ký']}
          value={mode === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
          onChange={(v) => setMode(v === 'Đăng Nhập' ? 'login' : 'register')}
          style={styles.segmented}
        />

        <View style={styles.form}>
          {mode === 'register' && (
            <>
              <FormField
                label="Họ và tên"
                required
                value={name}
                onChangeText={setName}
                placeholder="Nguyễn Văn A"
                error={errors.name}
                autoCapitalize="words"
              />
              <FormField
                label="Số điện thoại"
                required
                value={phone}
                onChangeText={setPhone}
                placeholder="0912345678"
                keyboardType="phone-pad"
                error={errors.phone}
              />
            </>
          )}
          <FormField
            label="Email"
            required
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <FormField
            label="Mật khẩu"
            required
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secure
            error={errors.password}
          />
          {mode === 'register' && (
            <FormField
              label="Xác nhận mật khẩu"
              required
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secure
              error={errors.confirm}
            />
          )}

          {mode === 'login' && (
            <View style={styles.rowBetween}>
              <TouchableOpacity
                style={styles.remember}
                onPress={() => setRemember((r) => !r)}
                hitSlop={6}
              >
                <Ionicons
                  name={remember ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={remember ? COLORS.warmGold : COLORS.grayMedium}
                />
                <Text style={styles.rememberText}>Nhớ tôi</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Quên mật khẩu', 'Liên kết đặt lại mật khẩu sẽ được gửi đến email của bạn.')}>
                <Text style={styles.forgot}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>
          )}

          <ActionButton
            label={mode === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
            loading={loading}
            onPress={handleSubmit}
            style={styles.submit}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>Hoặc</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={() => socialLogin('Google')}>
              <Text style={[styles.socialIcon, { color: '#EA4335' }]}>G</Text>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => socialLogin('Facebook')}>
              <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
            <Text style={styles.termsLink}>Chính sách bảo mật</Text> của VoNo.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heading: {
    marginBottom: 22,
  },
  welcome: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  appName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.darkBrown,
    marginVertical: 4,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  segmented: {
    marginBottom: 20,
  },
  form: {
    gap: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    fontSize: 13,
    color: COLORS.text,
  },
  forgot: {
    fontSize: 13,
    color: COLORS.warmGold,
    fontWeight: '600',
  },
  submit: {
    marginTop: 4,
    paddingVertical: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 22,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  or: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  socialIcon: {
    fontSize: 17,
    fontWeight: '800',
  },
  socialText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  terms: {
    marginTop: 22,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: COLORS.warmGold,
    fontWeight: '600',
  },
});
