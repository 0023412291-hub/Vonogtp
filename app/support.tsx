import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionHeader } from '@/components/section-header';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';

const HOTLINE = '19001234';
const EMAIL = 'hotro@vono.app';

interface ContactAction {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tint: string;
  bg: string;
  onPress: () => void;
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Tin của tôi mất bao lâu được hiển thị?',
    a: 'Tin đăng được hiển thị ngay sau khi hoàn tất. Nếu không thấy tin trên trang chủ, hãy kéo để làm mới danh sách.',
  },
  {
    q: 'Tôi quên mật khẩu, phải làm sao?',
    a: 'Ở màn hình Đăng nhập, bấm "Quên mật khẩu" và nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu vào hộp thư của bạn (kiểm tra cả mục Spam).',
  },
  {
    q: 'Làm sao để tin lên đầu trang chủ?',
    a: 'Cập nhật tin thường xuyên (sửa tin sẽ làm mới thời gian đăng) và dùng ảnh thật, rõ nét để tăng độ tin cậy.',
  },
  {
    q: 'Tôi bị lừa đảo qua tin đăng, phải làm sao?',
    a: 'Không chuyển tiền trước khi xem nhà trực tiếp. Gọi ngay hotline để chúng tôi khoá tin và hỗ trợ bạn.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const callHotline = () => {
    Linking.openURL(`tel:${HOTLINE}`).catch(() => Alert.alert('Lỗi', 'Không thể gọi điện trên thiết bị này.'));
  };

  const sendEmail = () => {
    const url = `mailto:${EMAIL}?subject=${encodeURIComponent('VoNo - Yêu cầu hỗ trợ')}&body=${encodeURIComponent(
      'Xin chào VoNo,\n\nTôi cần hỗ trợ về:\n\n',
    )}`;
    Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không tìm thấy ứng dụng email trên thiết bị.'));
  };

  const sendSms = () => {
    const url = `sms:${HOTLINE}`;
    Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể nhắn tin trên thiết bị này.'));
  };

  const actions: ContactAction[] = [
    {
      icon: 'call',
      title: 'Gọi hotline',
      subtitle: HOTLINE.replace(/(\d{4})(\d+)/, '$1 $2') + ' • 8:00 - 21:00 hằng ngày',
      tint: COLORS.successGreen,
      bg: 'rgba(42, 157, 143, 0.1)',
      onPress: callHotline,
    },
    {
      icon: 'mail',
      title: 'Gửi email',
      subtitle: EMAIL,
      tint: '#4A7DBF',
      bg: 'rgba(74, 125, 191, 0.1)',
      onPress: sendEmail,
    },
    {
      icon: 'chatbox-ellipses',
      title: 'Nhắn tin SMS',
      subtitle: `Soạn tin tới ${HOTLINE}`,
      tint: COLORS.priceAccent,
      bg: 'rgba(224, 145, 47, 0.12)',
      onPress: sendSms,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liên hệ hỗ trợ</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Ionicons name="headset" size={30} color={COLORS.bronze} />
          <Text style={styles.heroTitle}>Chúng tôi luôn sẵn sàng giúp bạn</Text>
          <Text style={styles.heroText}>
            Chọn một kênh liên hệ bên dưới — đội ngũ VoNo phản hồi trong vòng 1 giờ làm việc.
          </Text>
        </View>

        {/* Kênh liên hệ */}
        <SectionHeader title="Kênh liên hệ" />
        <View style={styles.actionList}>
          {actions.map((a) => (
            <TouchableOpacity key={a.title} style={styles.actionRow} activeOpacity={0.7} onPress={a.onPress}>
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={20} color={a.tint} />
              </View>
              <View style={styles.actionBody}>
                <Text style={styles.actionTitle}>{a.title}</Text>
                <Text style={styles.actionSubtitle}>{a.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.grayLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <SectionHeader title="Câu hỏi thường gặp" />
        <View style={styles.faqList}>
          {FAQS.map((f, i) => (
            <View key={i} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHead}
                activeOpacity={0.7}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons
                  name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
              {openFaq === i && <Text style={styles.faqA}>{f.a}</Text>}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>VoNo - Tìm Nhà Nhanh © 2026</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.softWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  heroText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  actionList: {
    gap: 10,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  actionSubtitle: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  faqList: {
    gap: 10,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 13,
  },
  faqQ: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 18,
  },
  faqA: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.grayDark,
    paddingBottom: 13,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
});
