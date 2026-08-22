import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { otherParticipant, subscribeConversations } from '@/firebase/chat';
import type { Conversation } from '@/types';
import { formatRelativeTime } from '@/utils/formatters';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useApp();
  const uid = user?.uid;

  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Realtime inbox: hội thoại có tin mới nhất lên đầu (denormalize từ lastMessage)
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeConversations(
      uid,
      setConversations,
      (error) => {
        if (__DEV__) console.warn('Firestore conversations error:', error);
      },
    );
    return unsub;
  }, [uid]);

  if (!uid) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
        </View>
        <EmptyState
          icon="chatbubbles-outline"
          title="Đăng nhập để xem tin nhắn"
          message="Đăng nhập để chat trực tiếp với chủ nhà và quản lý các hội thoại của bạn."
          actionLabel="Đăng nhập ngay"
          onAction={() => router.push('/auth')}
        />
      </View>
    );
  }

  const renderRow = ({ item }: { item: Conversation }) => {
    if (!uid) return null;
    const peerUid = otherParticipant(item, uid);
    const peerName = item.memberInfo[peerUid]?.name ?? 'Người dùng VoNo';
    const mine = item.lastMessage.senderUid === uid;
    const preview = item.lastMessage.text
      ? `${mine ? 'Bạn: ' : ''}${item.lastMessage.text}`
      : 'Hãy gửi lời chào đầu tiên 👋';
    const unreadCount = item.unread[uid] ?? 0;

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/chat/[cid]', params: { cid: item.id } })}
      >
        <Avatar name={peerName} size={48} />
        <View style={styles.rowMain}>
          <View style={styles.rowTopLine}>
            <Text style={styles.peerName} numberOfLines={1}>
              {peerName}
            </Text>
            {item.lastMessage.text ? (
              <Text style={styles.time}>{formatRelativeTime(item.lastMessage.createdAt)}</Text>
            ) : null}
          </View>
          <Text style={[styles.preview, unreadCount > 0 && styles.previewUnread]} numberOfLines={2}>
            {preview}
          </Text>
          {item.listingTitle ? (
            <View style={styles.listingTag}>
              <Ionicons name="home-outline" size={11} color={COLORS.bronze} />
              <Text style={styles.listingTitle} numberOfLines={1}>
                {item.listingTitle}
              </Text>
            </View>
          ) : null}
        </View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Chưa có tin nhắn nào"
            message="Bấm nút Chat trên bất kỳ tin đăng để bắt đầu trò chuyện với chủ nhà."
          />
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.list}
      />
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
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  list: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowMain: {
    flex: 1,
    gap: 3,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  peerName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  time: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  preview: {
    fontSize: 13,
    color: COLORS.grayDark,
    lineHeight: 18,
  },
  previewUnread: {
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  listingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(42, 157, 143, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  listingTitle: {
    fontSize: 11,
    color: COLORS.bronze,
    maxWidth: 220,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: COLORS.errorRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
});
