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
import {
  authErrorMessage,
  fetchUserProfileWithRetry,
  formatPhoneVN,
  normalizeVietnamesePhone,
  saveUserProfile,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from '@/firebase/auth';
import { isValidEmail, isValidPhone } from '@/utils/validation';
import type { User } from '@/types';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useApp();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (mode === 'register' && !name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!isValidEmail(email)) e.email = 'Email không hợp lệ';
    if (mode === 'register' && phone.trim() && !isValidPhone(phone)) {
      e.phone = 'Số điện thoại không hợp lệ';
    }
    if (password.length < 6) e.password = 'Mật khẩu cần ít nhất 6 ký tự';
    if (mode === 'register' && confirm !== password) e.confirm = 'Mật khẩu nhập lại chưa khớp';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'register') {
        // Tạo tài khoản Auth rồi lưu hồ sơ kèm tên + SĐT liên hệ xuống Firestore
        const uid = await signUpWithEmail({ email, password });
        await saveUserProfile({
          uid,
          name: name.trim(),
          phone: phone.trim() ? formatPhoneVN(normalizeVietnamesePhone(phone)) : '',
          email: email.trim(),
          role: 'renter',
        });
        signIn({ uid, name: name.trim(), phone, email: email.trim(), role: 'renter' });
      } else {
        // Đăng nhập → nạp hồ sơ từ Firestore vào app.
        // Lỗi đọc hồ sơ (session vừa đổi, token Firestore chưa kịp cập nhật)
        // KHÔNG được chặn đăng nhập — chỉ cần Auth thành công là vào được app.
        const uid = await signInWithEmail(email, password);
        let profile: User | null = null;
        try {
          profile = await fetchUserProfileWithRetry(uid);
        } catch (err) {
          if (__DEV__) console.warn('[auth] Lỗi đọc hồ sơ sau đăng nhập (bỏ qua):', err);
        }
        if (!profile) {
          profile = {
            uid,
            name: email.split('@')[0],
            phone: '',
            email: email.trim(),
            role: 'renter',
          };
          await saveUserProfile({ ...profile, uid }).catch(() => {});
        }
        signIn(profile);
      }
      router.replace('/(tabs)');
    } catch (err) {
      if (__DEV__) console.warn('[auth] Đăng nhập/đăng ký lỗi chi tiết:', err);
      Alert.alert(mode === 'register' ? 'Đăng ký thất bại' : 'Đăng nhập thất bại', authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!isValidEmail(email)) {
      setErrors({ email: 'Nhập email đã đăng ký để nhận mail đặt lại mật khẩu' });
      return;
    }
    Alert.alert('Đặt lại mật khẩu', `Gửi hướng dẫn đặt lại mật khẩu đến ${email.trim()}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Gửi',
        onPress: async () => {
          try {
            await sendPasswordReset(email);
            Alert.alert('Đã gửi', 'Kiểm tra hộp thư (kể cả mục Spam) để đặt lại mật khẩu.');
          } catch (err) {
            const code = String((err as { code?: string })?.code ?? '');
            if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
              Alert.alert('Không gửi được', 'Không có tài khoản nào với email này. Hãy kiểm tra lại.');
            } else {
              Alert.alert('Lỗi', authErrorMessage(err));
            }
          }
        },
      },
    ]);
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
          <Text style={styles.sub}>
            {mode === 'login'
              ? 'Đăng nhập bằng tài khoản để đăng tin, lưu tin yêu thích và quản lý khách quan tâm'
              : 'Tạo tài khoản miễn phí chỉ với email và mật khẩu'}
          </Text>
        </View>

        <Segmented
          options={['Đăng Nhập', 'Đăng Ký']}
          value={mode === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
          onChange={(v) => {
            setMode(v === 'Đăng Nhập' ? 'login' : 'register');
            setErrors({});
          }}
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
                label="Số điện thoại liên hệ"
                value={phone}
                onChangeText={setPhone}
                placeholder="0912345678 (khách sẽ gọi số này)"
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
            placeholder="ban@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <FormField
            label="Mật khẩu"
            required
            value={password}
            onChangeText={setPassword}
            placeholder="Ít nhất 6 ký tự"
            secure
            error={errors.password}
          />
          {mode === 'register' && (
            <FormField
              label="Nhập lại mật khẩu"
              required
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Gõ lại mật khẩu"
              secure
              error={errors.confirm}
            />
          )}

          <ActionButton
            label={mode === 'login' ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẨN'}
            loading={loading}
            onPress={handleSubmit}
            style={styles.submit}
          />

          {mode === 'login' && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgot}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.terms}>
          Bằng cách tiếp tục, bạn đồng ý với{' '}
          <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
          <Text style={styles.termsLink}>Chính sách bảo mật</Text> của VoNo.
        </Text>
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
  submit: {
    marginTop: 10,
    paddingVertical: 15,
  },
  forgot: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.warmGold,
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
