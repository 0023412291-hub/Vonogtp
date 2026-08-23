import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';

type Step = 'notifications' | 'location' | 'done';

export default function PermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUserLocation, completeOnboarding } = useApp();

  const [step, setStep] = useState<Step>('notifications');
  const [busy, setBusy] = useState(false);

  /**
   * Khách đã từ chối quyền vĩnh viễn trên máy → hộp thoại hệ điều hành sẽ
   * KHÔNG bao giờ hiện lại nữa. Bắt buộc đưa họ vào Cài đặt để bật thủ công.
   */
  const promptOpenSettings = (title: string, message: string, onNext: () => void) => {
    Alert.alert(title, message, [
      { text: 'Để sau', style: 'cancel', onPress: onNext },
      { text: 'Mở Cài đặt', onPress: () => void Linking.openSettings() },
    ]);
  };

  const allowNotifications = async () => {
    setBusy(true);
    try {
      let status = await Notifications.getPermissionsAsync();
      // Chưa cấp nhưng vẫn có thể hỏi → bung hộp thoại quyền của hệ điều hành
      if (!status.granted && status.canAskAgain) {
        status = await Notifications.requestPermissionsAsync();
      }
      if (!status.granted && !status.canAskAgain) {
        setBusy(false);
        promptOpenSettings(
          'Thông báo đang bị tắt',
          'Bạn đã từ chối quyền thông báo trên điện thoại. Hãy bật lại trong Cài đặt để không bỏ lỡ tin mới phù hợp.',
          () => setStep('location'),
        );
        return;
      }
    } catch {
      // Thiết bị không hỗ trợ — vẫn tiếp tục
    }
    setBusy(false);
    setStep('location');
  };

  const allowLocation = async () => {
    setBusy(true);
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (!perm.granted && perm.canAskAgain) {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (!perm.granted && !perm.canAskAgain) {
        setBusy(false);
        promptOpenSettings(
          'Vị trí đang bị tắt',
          'Bạn đã từ chối quyền vị trí trên điện thoại. Hãy bật trong Cài đặt để xem chính xác các tin gần bạn nhất.',
          () => setStep('done'),
        );
        return;
      }
      if (perm.granted) {
        // Lấy tọa độ chính xác cao ngay khi được cấp quyền
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      }
    } catch {
      // Không lấy được vị trí — vẫn tiếp tục
    }
    setBusy(false);
    setStep('done');
  };

  const skip = () => setStep(step === 'notifications' ? 'location' : 'done');

  const content = {
    notifications: {
      icon: 'notifications-outline' as const,
      iconBg: 'rgba(14, 143, 142, 0.12)',
      title: 'Cho phép nhận thông báo?',
      desc: 'VoNo sẽ gửi cho bạn những tin mới phù hợp với nhu cầu, giá tốt và cập nhật trạng thái tin bạn đang quan tâm.',
      primaryLabel: 'Cho phép thông báo',
      primaryIcon: 'notifications' as const,
      onPrimary: allowNotifications,
    },
    location: {
      icon: 'location-outline' as const,
      iconBg: 'rgba(13, 115, 119, 0.1)',
      title: 'Bật vị trí để tìm chính xác hơn?',
      desc: 'Cho phép VoNo sử dụng vị trí của bạn để hiển thị những tin gần nhất và tra cứu bản đồ chính xác hơn.',
      primaryLabel: 'Bật vị trí',
      primaryIcon: 'locate' as const,
      onPrimary: allowLocation,
    },
    done: {
      icon: 'checkmark-circle-outline' as const,
      iconBg: 'rgba(42, 157, 143, 0.12)',
      title: 'Hoàn tất!',
      desc: 'VoNo đã sẵn sàng giúp bạn tìm được nhà mơ ước. Chúc bạn sớm tìm được tổ ấm ưng ý!',
      primaryLabel: 'Vào trang chủ',
      primaryIcon: 'home' as const,
      onPrimary: () => {
        completeOnboarding();
        router.replace('/(tabs)');
      },
    },
  }[step];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={[styles.progressDot, step === 'notifications' && styles.progressDotActive]} />
        <View style={[styles.progressLine, step === 'location' || step === 'done' ? styles.progressLineActive : null]} />
        <View style={[styles.progressDot, step === 'location' && styles.progressDotActive, step === 'done' && styles.progressDotDone]} />
        <View style={[styles.progressLine, step === 'done' ? styles.progressLineActive : null]} />
        <View style={[styles.progressDot, step === 'done' && styles.progressDotActive]} />
      </View>

      <View style={styles.center}>
        <View style={[styles.iconCircle, { backgroundColor: content.iconBg }]}>
          <Ionicons name={content.icon} size={56} color={COLORS.bronze} />
        </View>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.desc}>{content.desc}</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {step === 'done' ? (
          <ActionButton
            label={content.primaryLabel}
            icon={content.primaryIcon}
            onPress={content.onPrimary}
            loading={busy}
          />
        ) : (
          <>
            <ActionButton
              label={content.primaryLabel}
              icon={content.primaryIcon}
              onPress={content.onPrimary}
              loading={busy}
            />
            <ActionButton label="Để sau" variant="ghost" onPress={skip} disabled={busy} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 28,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 22,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.grayLight,
  },
  progressDotActive: {
    backgroundColor: COLORS.warmGold,
  },
  progressDotDone: {
    backgroundColor: COLORS.successGreen,
  },
  progressLine: {
    width: 26,
    height: 2,
    backgroundColor: COLORS.grayLight,
    borderRadius: 1,
  },
  progressLineActive: {
    backgroundColor: COLORS.warmGold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.darkBrown,
    textAlign: 'center',
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  footer: {
    gap: 4,
  },
});
