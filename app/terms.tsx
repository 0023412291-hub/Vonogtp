import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BORDER_RADIUS, COLORS } from '@/constants/colors';

/** Một khối nội dung: tiêu đề mục + danh sách điều khoản */
function PolicySection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.item}>
          <Text style={styles.itemNumber}>{i + 1}. </Text>
          {item}
        </Text>
      ))}
    </View>
  );
}

const TERMS: string[] = [
  'VoNo là nền tảng trung gian kết nối người có nhu cầu thuê nhà với người cho thuê. Chúng tôi không phải bên tham gia giao dịch thuê giữa hai bên.',
  'Người đăng tin chịu trách nhiệm về tính chính xác của thông tin, hình ảnh và giá cho thuê đã công bố. Tin đăng sai sự thật có thể bị gỡ bỏ mà không cần báo trước.',
  'Mọi tin đăng phải là bất động sản thật, đang có nhu cầu cho thuê và thuộc quyền sở hữu hoặc được ủy quyền hợp pháp của người đăng.',
  'Nghiêm cấm đăng tin chứa nội dung vi phạm pháp luật, lừa đảo, quảng cáo sản phẩm khác hoặc spam trùng lặp.',
  'Chúng tôi có quyền tạm ngưng hoặc khoá tài khoản vi phạm điều khoản mà không cần thông báo trước.',
  'Việc sử dụng ứng dụng đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý với toàn bộ các điều khoản này.',
];

const PRIVACY: string[] = [
  'Chúng tôi thu thập số điện thoại, họ tên và email nhằm phục vụ đăng nhập, tạo hồ sơ và liên hệ giữa người thuê với người cho thuê.',
  'Hình ảnh tin đăng bạn tải lên được lưu trữ trên dịch vụ đám mây để hiển thị cho người dùng khác xem tin.',
  'Thông tin vị trí chỉ được sử dụng khi bạn bật tính năng tìm phòng gần trường/gần vị trí của bạn và không được chia sẻ cho bên thứ ba.',
  'Mã thiết bị dùng để nhận thông báo đẩy (FCM token) chỉ phục vụ việc gửi thông báo về tin đăng và khách quan tâm.',
  'Chúng tôi không bán hay chia sẻ thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại.',
  'Bạn có quyền yêu cầu xoá tài khoản cùng toàn bộ dữ liệu liên quan bằng cách liên hệ hotline hỗ trợ.',
];

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điều khoản & Chính sách</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Ionicons name="shield-checkmark" size={26} color={COLORS.bronze} />
          <Text style={styles.introTitle}>Cam kết của VoNo</Text>
          <Text style={styles.introText}>
            Minh bạch, an toàn và tôn trọng quyền riêng tư của mọi người dùng. Vui lòng đọc kỹ trước khi
            sử dụng ứng dụng.
          </Text>
        </View>

        <PolicySection title="Điều khoản sử dụng" items={TERMS} />
        <PolicySection title="Chính sách bảo mật" items={PRIVACY} />

        <View style={styles.contactCard}>
          <Text style={styles.contactText}>
            Có thắc mắc về điều khoản? Liên hệ {'\n'}hotro@vono.app • 1900 1234
          </Text>
        </View>

        <Text style={styles.footer}>Cập nhật lần cuối: Tháng 08/2026</Text>
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
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  introText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginBottom: 10,
  },
  item: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.grayDark,
    marginBottom: 8,
  },
  itemNumber: {
    fontWeight: '800',
    color: COLORS.bronze,
  },
  contactCard: {
    backgroundColor: 'rgba(14, 143, 142, 0.08)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(14, 143, 142, 0.25)',
    padding: 14,
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.darkGold,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
});
