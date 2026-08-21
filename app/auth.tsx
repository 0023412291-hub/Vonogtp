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
import { firebaseEnabled } from '@/firebase';
import {
  fetchUserProfile,
  formatPhoneVN,
  saveUserProfile,
  sendOtp,
  verifyOtp,
  type PendingVerification,
} from '@/firebase/auth';
import { isValidPhone } from '@/utils/validation';

type Mode = 'login' | 'register';
type Step = 'phone' | 'otp';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useApp();

  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const requireFirebase = () => {
    if (firebaseEnabled) return true;
    Alert.alert(
      'Cần bản build có Firebase',
      'Đăng nhập bằng số điện thoại yêu cầu bản development build (EAS Build). Hãy chạy npx eas build --profile development --platform android và cài lên máy.',
    );
    return false;
  };

  const handleSendOtp = async () => {
    const e: Record<string, string> = {};
    if (mode === 'register' && !name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!isValidPhone(phone)) e.phone = 'Số điện thoại không hợp lệ';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!requireFirebase()) return;

    setLoading(true);
    try {
      const result = await sendOtp(phone);
      setPending(result);
      setStep('otp');
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('invalid')
          ? 'Số điện thoại không hợp lệ.'
          : 'Không gửi được mã xác minh. Kiểm tra SĐT và kết nối mạng.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pending) return;
    if (code.trim().length < 6) {
      setErrors({ code: 'Mã xác minh gồm 6 chữ số' });
      return;
    }
    if (!requireFirebase()) return;

    setLoading(true);
    try {
      const { uid, phone: intlPhone } = await verifyOtp(pending.verificationId, code.trim());
      let profile = await fetchUserProfile(uid);
      if (!profile) {
        profile = {
          uid,
          name: mode === 'register' && name.trim() ? name.trim() : `Người dùng ${phone.slice(-4)}`,
          phone: formatPhoneVN(intlPhone),
          email: '',
          role: 'renter',
        };
        await saveUserProfile({ ...profile, uid });
      }
      signIn(profile);
      router.replace('/(tabs)');
    } catch {
      setErrors({ code: 'Mã xác minh không đúng hoặc đã hết hạn' });
    } finally {
      setLoading(false);
    }
  };

  const resetToPhone = () => {
    setStep('phone');
    setCode('');
    setErrors({});
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
        <TouchableOpacity onPress={() => (step === 'otp' ? resetToPhone() : router.back())} style={styles.back} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>

        <View style={styles.heading}>
          <Text style={styles.welcome}>Chào mừng đến với</Text>
          <Text style={styles.appName}>VoNo - Tìm Nhà Nhanh</Text>
          <Text style={styles.sub}>
            {step === 'phone'
              ? 'Đăng nhập bằng số điện thoại để khám phá hàng nghìn tin bất động sản'
              : `Nhập mã xác minh gửi đến ${pending ? formatPhoneVN(pending.phone) : ''}`}
          </Text>
        </View>

        {step === 'phone' ? (
          <>
            <Segmented
              options={['Đăng Nhập', 'Đăng Ký']}
              value={mode === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
              onChange={(v) => setMode(v === 'Đăng Nhập' ? 'login' : 'register')}
              style={styles.segmented}
            />

            <View style={styles.form}>
              {mode === 'register' && (
                <FormField
                  label="Họ và tên"
                  required
                  value={name}
                  onChangeText={setName}
                  placeholder="Nguyễn Văn A"
                  error={errors.name}
                  autoCapitalize="words"
                />
              )}
              <FormField
                label="Số điện thoại"
                required
                value={phone}
                onChangeText={setPhone}
                placeholder="0912345678"
                keyboardType="phone-pad"
                error={errors.phone}
              />

              <ActionButton
                label="GỬI MÃ XÁC MINH"
                loading={loading}
                onPress={handleSendOtp}
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
          </>
        ) : (
          <View style={styles.form}>
            <FormField
              label="Mã xác minh (OTP)"
              required
              value={code}
              onChangeText={setCode}
              placeholder="6 chữ số"
              keyboardType="number-pad"
              error={errors.code}
            />
            <ActionButton
              label="XÁC MINH VÀ ĐĂNG NHẬP"
              loading={loading}
              onPress={handleVerifyOtp}
              style={styles.submit}
            />
            <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={styles.resend}>
              <Text style={styles.resendText}>Gửi lại mã</Text>
            </TouchableOpacity>
          </View>
        )}
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
  resend: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.warmGold,
  },
});