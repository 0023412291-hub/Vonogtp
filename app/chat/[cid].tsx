import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import {
  MESSAGE_PAGE_SIZE,
  fetchConversation,
  fetchOlderMessages,
  markConversationRead,
  otherParticipant,
  sendMessage,
  subscribeMessages,
} from '@/firebase/chat';
import type { ChatMessage, Conversation } from '@/types';
import { formatClock } from '@/utils/formatters';

export default function ChatScreen() {
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const uid = user?.uid;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loadedConversation, setLoadedConversation] = useState(false);
  /** Tin nhắn MỚI NHẤT TRƯỚC — feed thẳng vào FlatList inverted */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Thông tin hội thoại cho header (đọc 1 lần khi vào màn hình)
  useEffect(() => {
    if (!cid) return;
    let active = true;
    fetchConversation(cid)
      .then((conv) => {
        if (active) {
          setConversation(conv);
          setLoadedConversation(true);
        }
      })
      .catch(() => {
        if (active) setLoadedConversation(true);
      });
    return () => {
      active = false;
    };
  }, [cid]);

  // Realtime trang tin nhắn mới nhất
  useEffect(() => {
    if (!cid) return;
    const unsub = subscribeMessages(
      cid,
      setMessages,
      (error) => {
        if (__DEV__) console.warn('Firestore messages error:', error);
      },
    );
    return unsub;
  }, [cid]);

  // Mở hội thoại → đặt lại số tin chưa đọc của tôi về 0
  useEffect(() => {
    if (!cid || !uid || !loadedConversation) return;
    markConversationRead(cid, uid).catch(() => {});
  }, [cid, uid, loadedConversation, messages.length]);

  const handleLoadMore = useCallback(async () => {
    if (!cid || loadingMore) return;
    const oldest = messages[messages.length - 1];
    if (!oldest || messages.length < MESSAGE_PAGE_SIZE) return;
    setLoadingMore(true);
    try {
      const older = await fetchOlderMessages(cid, oldest.createdAt);
      setMessages((prev) => [...prev, ...older.filter((m) => !prev.some((p) => p.id === m.id))]);
    } catch (error) {
      if (__DEV__) console.warn('Load older messages failed:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [cid, messages, loadingMore]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !uid || !conversation || sending) return;
    const peerUid = otherParticipant(conversation, uid);
    if (!peerUid) return;
    setText('');
    setSending(true);
    sendMessage({ cid: conversation.id, senderUid: uid, peerUid, text: trimmed })
      .catch(() => Alert.alert('Lỗi', 'Không gửi được tin nhắn. Vui lòng thử lại.'))
      .finally(() => setSending(false));
  };

  if (!uid) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header onBack={() => router.back()} />
        <EmptyState
          icon="chatbubbles-outline"
          title="Đăng nhập để nhắn tin"
          message="Đăng nhập để xem và gửi tin nhắn trong hội thoại này."
          actionLabel="Đăng nhập ngay"
          onAction={() => router.push('/auth')}
        />
      </View>
    );
  }

  if (loadedConversation && !conversation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={6}>
            <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <View style={styles.backBtn} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title="Hội thoại không tồn tại"
          message="Hội thoại có thể đã bị xóa."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const peerUid = conversation ? otherParticipant(conversation, uid) : '';
  const peerName =
    conversation?.memberInfo[peerUid]?.name ?? user?.name ?? 'Người dùng VoNo';

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.senderUid === uid;
    return (
      <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.msgText, mine && styles.msgTextMine]}>{item.text}</Text>
          <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>{formatClock(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }}>
        <Header peerName={peerName} listingTitle={conversation?.listingTitle ?? ''} onBack={() => router.back()} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        ListFooterComponent={
          loadingMore ? (
            <Text style={styles.loadingMore}>Đang tải tin nhắn cũ hơn...</Text>
          ) : null
        }
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.emptyMessageList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="hand-left-outline" size={28} color={COLORS.warmGold} />
            <Text style={styles.emptyChatText}>
              Chưa có tin nhắn nào.{'\n'}Hãy gửi lời chào đến {peerName}!
            </Text>
          </View>
        }
      />

      {/* Thanh nhập tin nhắn */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={COLORS.placeholder}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          hitSlop={4}
        >
          <Ionicons name="send" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Header chung của màn hình chat */
function Header({
  peerName,
  listingTitle,
  onBack,
}: {
  peerName?: string;
  listingTitle?: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={6}>
        <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
      </TouchableOpacity>
      {peerName ? <Avatar name={peerName} size={40} /> : <View style={styles.backBtn} />}
      <View style={styles.headerInfo}>
        <Text style={styles.headerPeerName} numberOfLines={1}>
          {peerName || 'Tin nhắn'}
        </Text>
        {listingTitle ? (
          <Text style={styles.headerListing} numberOfLines={1}>
            {listingTitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerPeerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  headerListing: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkBrown,
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  emptyMessageList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  msgRowMine: {
    justifyContent: 'flex-end',
  },
  msgRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: COLORS.warmGold,
    borderBottomRightRadius: 5,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 5,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.darkBrown,
  },
  msgTextMine: {
    color: COLORS.white,
  },
  msgTime: {
    alignSelf: 'flex-end',
    marginTop: 3,
    fontSize: 9.5,
    color: COLORS.grayMedium,
  },
  msgTimeMine: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  loadingMore: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingVertical: 10,
    transform: [{ scaleY: -1 }, { scaleX: -1 }],
  },
  emptyChat: {
    alignItems: 'center',
    gap: 10,
    transform: [{ scaleY: -1 }, { scaleX: -1 }],
    paddingHorizontal: 32,
  },
  emptyChatText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14,
    color: COLORS.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.warmGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
