/**
 * Gửi push notification FCM tới TẤT CẢ thiết bị của một user.
 *
 * Cách dùng:
 *   npm run push -- <uid> "Tiêu đề" "Nội dung"
 *   npm run push -- all "Tiêu đề" "Nội dung"     (gửi cho mọi user có token)
 *
 * Token lấy từ users/{uid}.fcmTokens — app lưu khi user đăng nhập SĐT và cấp quyền thông báo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const KEY_PATH = resolve(process.cwd(), 'serviceAccountKey.json');
if (!existsSync(KEY_PATH)) {
  console.error('[!] Thiếu serviceAccountKey.json ở thư mục gốc.');
  process.exit(1);
}

const [uidArg, title, body] = process.argv.slice(2);
if (!uidArg || !title) {
  console.error('Cú pháp: npm run push -- <uid|all> "Tiêu đề" "Nội dung"');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

async function main(): Promise<void> {
  let tokens: string[] = [];

  if (uidArg === 'all') {
    const snap = await db.collection('users').get();
    tokens = snap.docs.flatMap((d) => {
      const arr = d.data().fcmTokens as unknown;
      return Array.isArray(arr) ? (arr.filter((t) => typeof t === 'string') as string[]) : [];
    });
  } else {
    const snap = await db.doc(`users/${uidArg}`).get();
    const arr = snap.data()?.fcmTokens as unknown;
    tokens = Array.isArray(arr) ? (arr.filter((t) => typeof t === 'string') as string[]) : [];
  }

  if (tokens.length === 0) {
    console.log('Không tìm thấy FCM token nào (user chưa đăng nhập app / chưa cấp quyền).');
    process.exit(0);
  }

  const res = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body: body ?? '' },
  });
  console.log(`Đã gửi thành công ${res.successCount}/${tokens.length} thiết bị.`);
  res.responses.forEach((r, i) => {
    if (!r.success) console.error(`Token #${i} lỗi:`, r.error?.message);
  });
}

main()
  .catch((err) => {
    console.error('[!] Gửi push lỗi:', err);
    process.exit(1);
  })
  .then(() => process.exit(0));
