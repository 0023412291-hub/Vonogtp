import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { Segmented } from '@/components/segmented';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { subscribeLeads, subscribeNotifications, updateLeadStatusRemote } from '@/firebase/firestore';
import { PROPERTY_TYPES, USER_ROLES, type AppNotification, type Lead, type LeadStatus } from '@/types';
import { activeFiltersCount } from '@/utils/filters';
import { formatDealPrice, formatNumber, formatPriceShort, formatViews } from '@/utils/formatters';

/** Cờ Firebase luôn bật (JS SDK) — khai báo cục bộ thay vì import barrel '@/firebase' bị lỗi transform */
const firebaseEnabled = true;

/** Số ngày tối đa một tin đăng hiển thị trước khi xem là "sắp hết hạn" */
const EXPIRY_DAYS = 25;

/** Đếm số phần tử theo nhóm (key do hàm key sinh ra) */
function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** Lấy n nhóm có số lượng nhiều nhất */
function topEntries(map: Map<string, number>, n: number): [string, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/** Phần tử xuất hiện nhiều nhất trong mảng */
function mostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = arr[0];
  let bestCount = 0;
  counts.forEach((n, v) => {
    if (n > bestCount) {
      bestCount = n;
      best = v;
    }
  });
  return best;
}

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    myListings,
    signOut,
    updateUser,
    activeRole,
    listings,
    favorites,
    filters,
    recentListings,
    favoriteCount,
  } = useApp();

  const [editOpen, setEditOpen] = useState(false);
  const [leadsTab, setLeadsTab] = useState<LeadStatus>('new');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [leadsY, setLeadsY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editPhone, setEditPhone] = useState(user?.phone ?? '');
  const [editEmail, setEditEmail] = useState(user?.email ?? '');

  // Khách quan tâm: đọc thật từ Firestore, khách chưa đăng nhập → danh sách rỗng
  useEffect(() => {
    if (!firebaseEnabled || !user?.uid) {
      setLeads([]);
      return;
    }
    let active = true;
    const unsub = subscribeLeads(
      user.uid,
      (remote) => {
        if (active) setLeads(remote);
      },
      (error) => {
        if (__DEV__) console.warn('Firestore leads error:', error);
      },
    );
    return () => {
      active = false;
      unsub();
    };
  }, [user?.uid]);

  // Thông báo: đọc thật từ Firestore theo user, khách chưa đăng nhập → rỗng
  useEffect(() => {
    if (!firebaseEnabled || !user?.uid) {
      setNotifs([]);
      return;
    }
    let active = true;
    const unsub = subscribeNotifications(
      user.uid,
      (remote) => {
        if (active) setNotifs(remote);
      },
      (error) => {
        if (__DEV__) console.warn('Firestore notifications error:', error);
      },
    );
    return () => {
      active = false;
      unsub();
    };
  }, [user?.uid]);

  const activeList = myListings.filter((l) => l.status === 'active');
  const rentedList = myListings.filter((l) => l.status === 'rented');

  const newLeads = leads.filter((l) => l.status === 'new');
  const contactedLeads = leads.filter((l) => l.status === 'contacted');
  const closedLeads = leads.filter((l) => l.status === 'closed');
  const filteredLeads =
    leadsTab === 'new' ? newLeads : leadsTab === 'contacted' ? contactedLeads : closedLeads;

  // ---- Số liệu dashboard theo vai trò ----
  const filterCount = activeFiltersCount(filters);
  const favDistricts = favorites
    .map((id) => listings.find((l) => l.id === id)?.district)
    .filter((d): d is string => Boolean(d));
  const topDistrict = mostCommon(favDistricts) ?? filters.districts[0] ?? 'TP.HCM';

  const totalViews = myListings.reduce((s, l) => s + (l.views ?? 0), 0);
  const totalContacts = myListings.reduce((s, l) => s + (l.contactCount ?? 0), 0);
  const totalSaved = myListings.reduce((s, l) => s + (l.savedCount ?? 0), 0);
  const ratedListings = myListings.filter((l) => l.rating != null);
  const avgRating =
    ratedListings.length > 0
      ? ratedListings.reduce((s, l) => s + (l.rating ?? 0), 0) / ratedListings.length
      : null;
  const activeRevenue = activeList.reduce((s, l) => s + l.price, 0);
  const expiringCount = activeList.filter(
    (l) => Date.now() - new Date(l.createdAt).getTime() > EXPIRY_DAYS * 86_400_000,
  ).length;

  const distChips = topEntries(countBy(myListings, (l) => l.district), 2).map(([k, n]) => ({
    key: k,
    label: `${k}: ${n} tin`,
  }));
  const typeChips = topEntries(
    countBy(myListings, (l) => PROPERTY_TYPES.find((t) => t.value === l.type)?.label ?? l.type),
    2,
  ).map(([k, n]) => ({ key: k, label: `${k}: ${n} tin` }));

  /** Cập nhật trạng thái khách quan tâm (Mới → Đã liên hệ → Đã chốt) */
  const setLeadStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (firebaseEnabled) {
      updateLeadStatusRemote(id, status).catch(() => {});
    }
  };

  /** Cuộn xuống phần khách quan tâm */
  const scrollToLeads = () => scrollRef.current?.scrollTo({ y: leadsY, animated: true });

  const saveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống.');
      return;
    }
    updateUser({ name: editName.trim(), phone: editPhone.trim(), email: editEmail.trim() });
    setEditOpen(false);
  };

  /** Đăng tin = hoạt động của chế độ chủ nhà: tự chuyển chế độ rồi mở form đăng tin */
  const goToPost = () => {
    if (!user) {
      Alert.alert('Cần đăng nhập', 'Đăng nhập để đăng tin cho thuê/bán.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/auth') },
      ]);
      return;
    }
    if (activeRole !== 'owner') updateUser({ role: 'owner' });
    router.push('/(tabs)/post');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài Khoản</Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Công tắc chế độ: 1 tài khoản đổi vai trò linh hoạt */}
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>Chế độ sử dụng</Text>
          <Segmented
            options={USER_ROLES.map((r) => r.label)}
            value={USER_ROLES.find((r) => r.value === activeRole)?.label ?? 'Tìm Nhà'}
            onChange={(v) => {
              const target = v === 'Đăng Tin' ? 'owner' : 'renter';
              if (!user) {
                Alert.alert('Cần đăng nhập', 'Đăng nhập để dùng chế độ Đăng Tin.', [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Đăng nhập', onPress: () => router.push('/auth') },
                ]);
                return;
              }
              updateUser({ role: target });
            }}
          />
          <Text style={styles.modeHint}>
            Một tài khoản có thể luân phiên đổi chế độ bất cứ lúc nào.
          </Text>
        </View>

        {/* Dashboard theo chế độ đang dùng */}
        {activeRole === 'owner' ? (
          <View style={styles.ownerBanner}>
            <View style={styles.ownerTop}>
              <View style={styles.ownerGreetWrap}>
                <Text style={styles.ownerGreeting}>Dashboard chủ nhà</Text>
                <Text style={styles.ownerSub}>Quản lý tin đăng và tiếp cận người thuê/mua dễ dàng</Text>
              </View>
              <View style={styles.ownerIconWrap}>
                <Ionicons name="megaphone" size={18} color={COLORS.warmGold} />
              </View>
            </View>

            {/* Trạng thái tin */}
            <View style={styles.ownerStats}>
              <View style={styles.ownerStat}>
                <Text style={styles.ownerStatNum}>{activeList.length}</Text>
                <Text style={styles.ownerStatLabel}>Đang hiển thị</Text>
              </View>
              <View style={styles.ownerStatDivider} />
              <View style={styles.ownerStat}>
                <Text style={styles.ownerStatNum}>{rentedList.length}</Text>
                <Text style={styles.ownerStatLabel}>Đã cho thuê</Text>
              </View>
            </View>

            {/* Hiệu quả tin đăng */}
            <View style={styles.ownerPerf}>
              <View style={styles.ownerPerfItem}>
                <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.ownerPerfNum}>{formatViews(totalViews)}</Text>
                <Text style={styles.ownerPerfLabel}>Lượt xem</Text>
              </View>
              <View style={styles.ownerPerfItem}>
                <Ionicons name="call-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.ownerPerfNum}>{formatNumber(totalContacts)}</Text>
                <Text style={styles.ownerPerfLabel}>Liên hệ</Text>
              </View>
              <View style={styles.ownerPerfItem}>
                <Ionicons name="heart-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.ownerPerfNum}>{formatNumber(totalSaved)}</Text>
                <Text style={styles.ownerPerfLabel}>Lượt lưu</Text>
              </View>
              <View style={styles.ownerPerfItem}>
                <Ionicons name="star-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.ownerPerfNum}>{avgRating != null ? avgRating.toFixed(1) : '—'}</Text>
                <Text style={styles.ownerPerfLabel}>Đánh giá</Text>
              </View>
            </View>

            {/* Doanh thu tiềm năng */}
            <View style={styles.ownerLine}>
              <Ionicons name="wallet-outline" size={15} color={COLORS.warmGold} />
              <Text style={styles.ownerLineText}>
                Doanh thu tiềm năng:{' '}
                <Text style={styles.ownerLineStrong}>{formatPriceShort(activeRevenue)}/tháng</Text>
              </Text>
            </View>

            {/* Tin sắp hết hạn */}
            {expiringCount > 0 && (
              <View style={styles.ownerLine}>
                <Ionicons name="time-outline" size={15} color="rgba(245, 166, 35, 0.95)" />
                <Text style={styles.ownerLineText}>
                  {expiringCount} tin sắp hết hạn — gia hạn để tiếp tục hiển thị
                </Text>
              </View>
            )}

            {/* Phân bố tin theo khu vực & loại hình */}
            {distChips.length + typeChips.length > 0 && (
              <View style={styles.ownerChips}>
                {[...distChips, ...typeChips].map((c) => (
                  <View key={c.key} style={styles.ownerChip}>
                    <Text style={styles.ownerChipText}>{c.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.ownerPostBtn} onPress={goToPost}>
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.ownerPostText}>Đăng tin mới</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ownerManageBtn} onPress={scrollToLeads}>
                <Ionicons name="people-outline" size={16} color={COLORS.darkBrown} />
                <Text style={styles.ownerManageText}>Khách quan tâm</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.renterCard}>
            <View style={styles.renterTop}>
              <View style={styles.renterIconWrap}>
                <Ionicons name="search-outline" size={18} color={COLORS.warmGold} />
              </View>
              <View style={styles.renterTopText}>
                <Text style={styles.renterTitle}>Chế độ Tìm Nhà</Text>
                <Text style={styles.renterSub}>Khám phá và lưu tin phù hợp nhu cầu của bạn</Text>
              </View>
            </View>
            <View style={styles.renterStats}>
              <View style={styles.renterStat}>
                <Text style={styles.renterStatNum}>{favoriteCount}</Text>
                <Text style={styles.renterStatLabel}>Tin đã lưu</Text>
              </View>
              <View style={styles.renterStatDivider} />
              <View style={styles.renterStat}>
                <Text style={styles.renterStatNum}>{filterCount}</Text>
                <Text style={styles.renterStatLabel}>Bộ lọc đang dùng</Text>
              </View>
              <View style={styles.renterStatDivider} />
              <View style={styles.renterStat}>
                <Text style={[styles.renterStatNum, styles.renterStatDistrict]} numberOfLines={1}>
                  {topDistrict}
                </Text>
                <Text style={styles.renterStatLabel}>Khu vực quan tâm</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.renterAction}
              onPress={() => router.push('/(tabs)/favorites')}
            >
              <Ionicons name="heart-outline" size={16} color={COLORS.darkBrown} />
              <Text style={styles.renterActionText}>Xem tin đã lưu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar name={user?.name ?? 'Khách'} size={76} />
          <Text style={styles.profileName}>{user?.name ?? 'Khách'}</Text>
          <Text style={styles.profileMeta}>{user?.phone ?? 'Chưa có SĐT'}</Text>
          <Text style={styles.profileMeta}>{user?.email ?? 'Chưa có email'}</Text>
          {user ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditName(user?.name ?? '');
                setEditPhone(user?.phone ?? '');
                setEditEmail(user?.email ?? '');
                setEditOpen(true);
              }}
            >
              <Ionicons name="create-outline" size={14} color={COLORS.darkBrown} />
              <Text style={styles.editBtnText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/auth')}
            >
              <Ionicons name="log-in-outline" size={14} color={COLORS.darkBrown} />
              <Text style={styles.editBtnText}>Đăng nhập / Đăng ký</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeRole === 'renter' ? (
          <>
            {/* Tin đã xem gần đây */}
            <Text style={styles.sectionLabel}>TIN ĐÃ XEM GẦN ĐÂY</Text>
            {recentListings.length === 0 ? (
              <EmptyState
                icon="time-outline"
                title="Bạn chưa xem tin nào"
                message="Những tin bạn vừa mở sẽ hiện ở đây để xem lại nhanh chóng."
                actionLabel="Khám phá tin mới"
                onAction={() => router.push('/(tabs)')}
              />
            ) : (
              <View style={styles.myList}>
                {recentListings.slice(0, 3).map((l) => (
                  <View key={l.id} style={styles.myCard}>
                    <TouchableOpacity
                      style={styles.myCardMain}
                      onPress={() => router.push(`/listing/${l.id}`)}
                    >
                      <Image source={{ uri: l.images[0] }} style={styles.myThumb} contentFit="cover" />
                      <View style={styles.myInfo}>
                        <Text style={styles.myTitle} numberOfLines={2}>
                          {l.title}
                        </Text>
                        <Text style={styles.myMeta}>
                          {formatDealPrice(l.price, l.deal)} • {l.area}m²
                        </Text>
                        <Text style={styles.myDate}>{l.district}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Khách quan tâm — thay cho danh sách tin đã đăng */}
            <Text style={styles.sectionLabel} onLayout={(e) => setLeadsY(e.nativeEvent.layout.y)}>
              KHÁCH QUAN TÂM
            </Text>
            <Segmented
              options={[`Mới (${newLeads.length})`, `Đã liên hệ (${contactedLeads.length})`, `Đã chốt (${closedLeads.length})`]}
              value={
                leadsTab === 'new'
                  ? `Mới (${newLeads.length})`
                  : leadsTab === 'contacted'
                    ? `Đã liên hệ (${contactedLeads.length})`
                    : `Đã chốt (${closedLeads.length})`
              }
              onChange={(v) =>
                setLeadsTab(v.startsWith('Mới') ? 'new' : v.startsWith('Đã liên hệ') ? 'contacted' : 'closed')
              }
            />

            {filteredLeads.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="Chưa có khách ở trạng thái này"
                message="Khi khách quan tâm tin của bạn, họ sẽ xuất hiện ở đây để bạn liên hệ ngay."
              />
            ) : (
              <View style={styles.myList}>
                {filteredLeads.map((lead) => {
                  const listing = listings.find((l) => l.id === lead.listingId);
                  return (
                    <View key={lead.id} style={styles.leadCard}>
                      <View style={styles.leadHeader}>
                        <Avatar name={lead.name} size={38} />
                        <View style={styles.leadInfo}>
                          <Text style={styles.leadName}>{lead.name}</Text>
                          <Text style={styles.leadTime}>{lead.time}</Text>
                        </View>
                        {lead.status === 'closed' && (
                          <View style={styles.leadClosedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color={COLORS.successGreen} />
                            <Text style={styles.leadClosedText}>Đã chốt</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.leadMsg} numberOfLines={2}>
                        “{lead.message}”
                      </Text>

                      {listing && (
                        <TouchableOpacity
                          style={styles.leadListing}
                          onPress={() => router.push(`/listing/${listing.id}`)}
                        >
                          <Image
                            source={{ uri: listing.images[0] }}
                            style={styles.leadListingThumb}
                            contentFit="cover"
                          />
                          <Text style={styles.leadListingTitle} numberOfLines={1}>
                            Quan tâm: {listing.title}
                          </Text>
                          <Ionicons name="chevron-forward" size={14} color={COLORS.grayMedium} />
                        </TouchableOpacity>
                      )}

                      <View style={styles.leadActions}>
                        <TouchableOpacity
                          style={styles.leadCallBtn}
                          onPress={() =>
                            Linking.openURL(`tel:${lead.phone}`).catch(() =>
                              Alert.alert('Lỗi', 'Không thể gọi điện trên thiết bị này.'),
                            )
                          }
                        >
                          <Ionicons name="call" size={14} color={COLORS.darkBrown} />
                          <Text style={styles.leadCallText}>{lead.phone}</Text>
                        </TouchableOpacity>
                        {lead.status === 'new' && (
                          <TouchableOpacity
                            style={styles.leadMarkBtn}
                            onPress={() => setLeadStatus(lead.id, 'contacted')}
                          >
                            <Ionicons name="checkmark" size={14} color={COLORS.warmGold} />
                            <Text style={styles.leadMarkText}>Đã liên hệ</Text>
                          </TouchableOpacity>
                        )}
                        {lead.status === 'contacted' && (
                          <TouchableOpacity
                            style={styles.leadMarkBtn}
                            onPress={() => setLeadStatus(lead.id, 'closed')}
                          >
                            <Ionicons name="checkmark-done" size={14} color={COLORS.successGreen} />
                            <Text style={styles.leadMarkText}>Chốt</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Thông báo */}
        <Text style={styles.sectionLabel}>THÔNG BÁO</Text>
        <View style={styles.notifCard}>
          {notifs
            .filter((n) => n.role === 'both' || n.role === activeRole)
            .map((n) => (
            <TouchableOpacity
              key={n.id}
              style={styles.notifRow}
              onPress={() => Alert.alert(n.title, n.body)}
            >
              <View style={styles.notifIcon}>
                <Ionicons name={n.icon as never} size={17} color={COLORS.warmGold} />
              </View>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle} numberOfLines={1}>
                  {n.title}
                </Text>
                <Text style={styles.notifText} numberOfLines={2}>
                  {n.body}
                </Text>
              </View>
              <Text style={styles.notifTime}>{n.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            signOut();
            router.replace('/auth');
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.errorRed} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.version}>VoNo - Tìm Nhà Nhanh • v1.0.0</Text>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            <FormField label="Họ và tên" value={editName} onChangeText={setEditName} placeholder="Nguyễn Văn A" />
            <FormField label="Số điện thoại" value={editPhone} onChangeText={setEditPhone} placeholder="0912345678" keyboardType="phone-pad" />
            <FormField label="Email" value={editEmail} onChangeText={setEditEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />

            <View style={styles.modalActions}>
              <ActionButton label="Hủy" variant="soft" onPress={() => setEditOpen(false)} style={{ flex: 0.45 }} />
              <ActionButton label="Lưu" onPress={saveProfile} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    gap: 4,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginTop: 6,
  },
  profileMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginBottom: 8,
  },
  modeHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.warmGold,
    backgroundColor: COLORS.white,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  // Dashboard chế độ Tìm Nhà
  renterCard: {
    backgroundColor: 'rgba(14, 143, 142, 0.08)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(14, 143, 142, 0.35)',
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  renterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  renterIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renterTopText: {
    flex: 1,
  },
  renterTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  renterSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  renterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  renterStat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 4,
  },
  renterStatNum: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  renterStatDistrict: {
    fontSize: 12.5,
  },
  renterStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  renterStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  renterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.warmGold,
    borderRadius: 9,
    paddingVertical: 10,
  },
  renterActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  ownerBanner: {
    backgroundColor: COLORS.darkBrown,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  ownerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerGreetWrap: {
    flex: 1,
  },
  ownerGreeting: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  ownerSub: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
    lineHeight: 16,
  },
  ownerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  ownerStat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  ownerStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.warmGold,
  },
  ownerStatLabel: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.7)',
  },
  ownerStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerPostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.warmGold,
    borderRadius: 9,
    paddingVertical: 10,
  },
  ownerPostText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.white,
  },
  ownerManageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    borderRadius: 9,
    paddingVertical: 10,
  },
  ownerManageText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  ownerPerf: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  ownerPerfItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  ownerPerfNum: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 1,
  },
  ownerPerfLabel: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.6)',
  },
  ownerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ownerLineText: {
    flex: 1,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  ownerLineStrong: {
    fontWeight: '800',
    color: COLORS.priceAccent,
  },
  ownerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ownerChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.white,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.bronze,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  myList: {
    marginTop: 14,
  },
  myCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  myCardMain: {
    flex: 1,
    flexDirection: 'row',
  },
  myThumb: {
    width: 92,
    height: 92,
  },
  myInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  myTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 17,
  },
  myMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.priceAccent,
  },
  myDate: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  // Khách quan tâm
  leadCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  leadTime: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  leadClosedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(42, 157, 143, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  leadClosedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.successGreen,
  },
  leadMsg: {
    fontSize: 12.5,
    color: COLORS.text,
    lineHeight: 18,
  },
  leadListing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 8,
  },
  leadListingThumb: {
    width: 34,
    height: 34,
    borderRadius: 6,
  },
  leadListingTitle: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  leadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  leadCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 9,
  },
  leadCallText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  leadMarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.warmGold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  leadMarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  notifCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    marginBottom: 24,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(14, 143, 142, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  notifText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  notifTime: {
    fontSize: 10,
    color: COLORS.grayMedium,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.errorRed,
    backgroundColor: 'rgba(230, 57, 70, 0.05)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.errorRed,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,32,51,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayLight,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
