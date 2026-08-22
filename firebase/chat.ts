import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

import type { ChatMessage, Conversation, Listing, User } from '@/types';

import { getFirebaseDb } from './app';
import { normalizeTimestamp } from './firestore';

/** Số tin nhắn mỗi trang (trang mới nhất + mỗi lần tải thêm) */
export const MESSAGE_PAGE_SIZE = 30;

/**
 * ID hội thoại deterministic: cùng 1 cặp user trên 1 tin luôn tính ra đúng 1 id
 * → tạo hội thoại chỉ cần setDoc với merge, không cần query kiểm tra trước.
 */
export function buildConversationId(listingId: string, uidA: string, uidB: string): string {
  return `${listingId}_${[uidA, uidB].sort().join('_')}`;
}

/** Uid của người kia trong hội thoại */
export function otherParticipant(conversation: Conversation, myUid: string): string {
  return conversation.participants.find((u) => u !== myUid) ?? '';
}

function normalizeMessage(id: string, data: DocumentData): ChatMessage {
  return {
    id,
    senderUid: data.senderUid ?? '',
    text: data.text ?? '',
    createdAt: normalizeTimestamp(data.createdAt),
    status: data.status === 'seen' ? 'seen' : 'sent',
  };
}

function normalizeConversation(id: string, data: DocumentData): Conversation {
  const last = (data.lastMessage ?? {}) as DocumentData;
  return {
    id,
    participants: Array.isArray(data.participants) ? data.participants : [],
    listingId: data.listingId ?? '',
    listingTitle: data.listingTitle ?? '',
    memberInfo: (data.memberInfo ?? {}) as Conversation['memberInfo'],
    lastMessage: {
      text: last.text ?? '',
      senderUid: last.senderUid ?? '',
      createdAt: normalizeTimestamp(last.createdAt),
    },
    unread: (data.unread ?? {}) as Record<string, number>,
    createdAt: normalizeTimestamp(data.createdAt),
  };
}

/**
 * Tạo (hoặc lấy lại) hội thoại giữa người dùng hiện tại và chủ tin.
 * Denormalize sẵn tên các thành viên + tiêu đề tin để inbox không cần join.
 * Hội thoại rỗng vẫn có lastMessage.createdAt để không bị loại khỏi query orderBy.
 */
export async function createOrGetConversation(listing: Listing, me: User & { uid: string }): Promise<string> {
  if (!listing.ownerUid) throw new Error('Tin này không có chủ đăng');
  const cid = buildConversationId(listing.id, me.uid, listing.ownerUid);
  await setDoc(
    doc(getFirebaseDb(), 'conversations', cid),
    {
      participants: [me.uid, listing.ownerUid].sort(),
      listingId: listing.id,
      listingTitle: listing.title,
      memberInfo: {
        [me.uid]: { name: me.name || 'Khách hàng VoNo' },
        [listing.ownerUid]: { name: listing.contact.name },
      },
      lastMessage: { text: '', senderUid: '', createdAt: serverTimestamp() },
      unread: {},
    },
    { merge: true },
  );
  return cid;
}

/** Đọc một hội thoại (dùng cho header màn hình chat) */
export async function fetchConversation(cid: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'conversations', cid));
  return snap.exists() ? normalizeConversation(snap.id, snap.data()) : null;
}

/**
 * Inbox: các hội thoại của user, có tin mới nhất lên đầu.
 * Cần composite index (participants array-contains + lastMessage.createdAt desc)
 * khai báo trong firestore.indexes.json.
 */
export function subscribeConversations(
  uid: string,
  callback: (items: Conversation[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(
    collection(getFirebaseDb(), 'conversations'),
    where('participants', 'array-contains', uid),
    orderBy('lastMessage.createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => normalizeConversation(d.id, d.data()))),
    (error) => onError?.(error),
  );
}

/**
 * Realtime trang tin nhắn mới nhất của hội thoại — trả về MỚI NHẤT TRƯỚC
 * (để feed trực tiếp vào FlatList inverted).
 */
export function subscribeMessages(
  cid: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(
    collection(getFirebaseDb(), 'conversations', cid, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(MESSAGE_PAGE_SIZE),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => normalizeMessage(d.id, d.data()))),
    (error) => onError?.(error),
  );
}

/** Tải thêm các tin cũ hơn mốc thời gian cho trước (phân trang cuộn lên) */
export async function fetchOlderMessages(cid: string, beforeIso: string): Promise<ChatMessage[]> {
  const q = query(
    collection(getFirebaseDb(), 'conversations', cid, 'messages'),
    orderBy('createdAt', 'desc'),
    startAfter(Timestamp.fromDate(new Date(beforeIso))),
    limit(MESSAGE_PAGE_SIZE),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeMessage(d.id, d.data()));
}

/**
 * Gửi tin nhắn: ghi message vào subcollection + cập nhật lastMessage/unread
 * trên doc hội thoại để người kia thấy trong inbox.
 */
export async function sendMessage(params: {
  cid: string;
  senderUid: string;
  peerUid: string;
  text: string;
}): Promise<void> {
  const db = getFirebaseDb();
  const trimmed = params.text.trim();
  await addDoc(collection(db, 'conversations', params.cid, 'messages'), {
    senderUid: params.senderUid,
    text: trimmed,
    status: 'sent',
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'conversations', params.cid), {
    lastMessage: {
      text: trimmed,
      senderUid: params.senderUid,
      createdAt: serverTimestamp(),
    },
    [`unread.${params.peerUid}`]: increment(1),
  });
}

/** Đặt lại số tin chưa đọc của tôi về 0 (gọi khi mở hội thoại) */
export async function markConversationRead(cid: string, uid: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'conversations', cid), { [`unread.${uid}`]: 0 });
}
