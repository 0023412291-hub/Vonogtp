import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

import type { AppNotification, Lead, LeadStatus, Listing } from '@/types';
import { formatRelativeTime } from '@/utils/formatters';

import { getFirebaseDb } from './app';

/** Firestore trả về Timestamp cho createdAt — chuẩn hóa về ISO string */
export function normalizeTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  const maybeDate = (value as { toDate?: () => Date }).toDate?.();
  if (maybeDate instanceof Date) return maybeDate.toISOString();
  return new Date().toISOString();
}

/** Chuyển doc listing từ Firestore sang đúng kiểu Listing (isFavorite do context tính) */
function normalizeListing(id: string, data: DocumentData): Listing {
  const { createdAt, ...rest } = data;
  return {
    ...(rest as Omit<Listing, 'id' | 'createdAt' | 'isFavorite'>),
    id,
    createdAt: normalizeTimestamp(createdAt),
    isFavorite: false,
  } as Listing;
}

/** Chuyển doc lead từ Firestore sang kiểu Lead (tính thời gian tương đối nếu là lead thật) */
function normalizeLead(id: string, data: DocumentData): Lead {
  const base = { ...(data as unknown as Lead), id };
  if (!base.time && data.createdAt) {
    base.time = formatRelativeTime(normalizeTimestamp(data.createdAt));
  }
  return base;
}

/** Theo dõi realtime toàn bộ tin đăng (đọc công khai, không cần đăng nhập) */
export function subscribeListings(
  callback: (listings: Listing[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(collection(getFirebaseDb(), 'listings'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => normalizeListing(d.id, d.data())));
    },
    (error) => onError?.(error),
  );
}

/** Theo dõi realtime danh sách id tin yêu thích của một user */
export function subscribeFavorites(uid: string, callback: (ids: string[]) => void): () => void {
  const ref = doc(getFirebaseDb(), 'favorites', uid);
  return onSnapshot(ref, (snap) => {
    const data = snap.data();
    const ids = data?.listingIds;
    callback(Array.isArray(ids) ? (ids as string[]) : []);
  });
}

/** Thêm/bỏ một tin vào danh sách yêu thích của user trên Firestore */
export async function toggleFavoriteRemote(uid: string, listingId: string): Promise<void> {
  const ref = doc(getFirebaseDb(), 'favorites', uid);
  const current = await getDoc(ref);
  const ids: string[] =
    current.exists() && Array.isArray(current.data()?.listingIds)
      ? ((current.data()?.listingIds as unknown[]) as string[])
      : [];
  const next = ids.includes(listingId) ? ids.filter((x) => x !== listingId) : [...ids, listingId];
  await setDoc(ref, { listingIds: next }, { merge: true });
}

/** Tạo tin mới trên Firestore — trả về id tin vừa tạo */
export async function addListingRemote(
  data: Omit<Listing, 'id' | 'createdAt' | 'isFavorite' | 'status'>,
  uid: string,
): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'listings'), {
    ...data,
    ownerUid: uid,
    status: 'active',
    isFavorite: false,
    views: 0,
    contactCount: 0,
    savedCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Cập nhật một phần tin đăng trên Firestore */
export async function updateListingRemote(id: string, partial: Partial<Listing>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'listings', id), partial as Record<string, unknown>);
}

/** Xóa tin đăng trên Firestore */
export async function deleteListingRemote(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'listings', id));
}

/** Đánh dấu tin đã cho thuê */
export async function markRentedRemote(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'listings', id), { status: 'rented' });
}

/** Tăng lượt xem tin (analytics-lite, gọi khi mở chi tiết tin) */
export async function incrementListingViews(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'listings', id), { views: increment(1) });
}

/** Tăng số lần khách bấm liên hệ trên tin (analytics-lite) */
export async function incrementListingContacts(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'listings', id), { contactCount: increment(1) });
}

/** Tăng lượt lưu tin (analytics-lite, chỉ gọi khi thêm vào yêu thích) */
export async function incrementListingSaves(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'listings', id), { savedCount: increment(1) });
}

/** Tạo lead thật khi khách bấm Gọi/Liên hệ trên tin — chủ tin sẽ thấy trong "Khách quan tâm" */
export async function addLeadRemote(params: {
  listingId: string;
  ownerUid: string;
  name: string;
  phone: string;
  message: string;
}): Promise<void> {
  await addDoc(collection(getFirebaseDb(), 'leads'), {
    ...params,
    status: 'new',
    createdAt: serverTimestamp(),
  });
}

/**
 * Theo dõi realtime khách quan tâm của một chủ tin (chỉ lead thật theo ownerUid).
 */
export function subscribeLeads(uid: string, callback: (leads: Lead[]) => void): () => void {
  const db = getFirebaseDb();
  const ownQuery = query(collection(db, 'leads'), where('ownerUid', '==', uid));

  let active = true;
  const unsubOwn = onSnapshot(ownQuery, (snap) => {
    if (active) callback(snap.docs.map((d) => normalizeLead(d.id, d.data())));
  });

  return () => {
    active = false;
    unsubOwn();
  };
}

/** Cập nhật trạng thái khách quan tâm (Mới → Đã liên hệ → Đã chốt) */
export async function updateLeadStatusRemote(id: string, status: LeadStatus): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'leads', id), { status });
}

/** Chuẩn hóa doc notification: tính chuỗi thời gian tương đối từ createdAt */
function normalizeNotification(id: string, data: DocumentData): AppNotification {
  const base = { ...(data as unknown as AppNotification), id };
  if (!base.time && data.createdAt) {
    base.time = formatRelativeTime(normalizeTimestamp(data.createdAt));
  }
  return base;
}

/** Theo dõi realtime thông báo của một user (mới nhất trước) */
export function subscribeNotifications(
  uid: string,
  callback: (items: AppNotification[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(
    collection(getFirebaseDb(), 'notifications'),
    where('uid', '==', uid),
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data();
        const ms = new Date(normalizeTimestamp(data.createdAt)).getTime();
        return { item: normalizeNotification(d.id, data), ms };
      });
      items.sort((a, b) => b.ms - a.ms);
      callback(items.map((x) => x.item));
    },
    (error) => onError?.(error),
  );
}

/** Tạo một thông báo cho user (vd: chủ tin có khách quan tâm) */
export async function addNotificationRemote(params: {
  uid: string;
  role: AppNotification['role'];
  icon: string;
  title: string;
  body: string;
}): Promise<void> {
  await addDoc(collection(getFirebaseDb(), 'notifications'), {
    ...params,
    createdAt: serverTimestamp(),
  });
}

