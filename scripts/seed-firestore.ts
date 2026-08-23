/**
 * Seed dữ liệu mẫu lên Firestore CHẠY TỪ MÁY TÍNH (không cần mở app).
 *
 * Chuẩn bị (1 lần):
 *   1. Firebase Console → Project settings (bánh răng) → Service accounts
 *   2. Bấm "Generate new private key" → tải file JSON về
 *   3. Đổi tên thành serviceAccountKey.json đặt ở thư mục gốc project
 *
 * Chạy:
 *   npm run seed            — chỉ seed khi collection trống
 *   npm run seed -- --force — xóa dữ liệu cũ trong 3 collection rồi seed lại
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { SAMPLE_LEADS, SAMPLE_LISTINGS } from './sample-data';

const KEY_PATH = resolve(process.cwd(), 'serviceAccountKey.json');
const FORCE = process.argv.includes('--force');

if (!existsSync(KEY_PATH)) {
  console.error(
    '\n[!] Không tìm thấy serviceAccountKey.json ở thư mục gốc.\n' +
      '    Tải tại: Firebase Console → Project settings → Service accounts → Generate new private key\n' +
      '    Rồi đổi tên thành serviceAccountKey.json đặt cạnh package.json.\n',
  );
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

async function count(col: string): Promise<number> {
  const snap = await db.collection(col).count().get();
  return snap.data().count;
}

async function clear(col: string): Promise<void> {
  const snap = await db.collection(col).get();
  const chunks: FirebaseFirestore.WriteBatch[] = [];
  let batch = db.batch();
  snap.docs.forEach((d, i) => {
    batch.delete(d.ref);
    if ((i + 1) % 400 === 0) {
      chunks.push(batch);
      batch = db.batch();
    }
  });
  chunks.push(batch);
  await Promise.all(chunks.map((b) => b.commit()));
}

async function main(): Promise<void> {
  console.log(`\nFirebase seed → project: ${process.env.GCLOUD_PROJECT ?? '(theo key)'}\n`);

  const existingListings = await count('listings');
  if (existingListings > 0 && !FORCE) {
    console.log(`Collection "listings" đã có ${existingListings} tin — bỏ qua seed.`);
    console.log('Muốn nạp lại từ đầu: npm run seed -- --force\n');
    return;
  }

  if (FORCE) {
    console.log('--force: xóa dữ liệu cũ...');
    await Promise.all([clear('listings'), clear('leads')]);
  }

  // Tin đăng — ownerUid rỗng = tin mẫu công khai
  const listingBatch = db.batch();
  for (const listing of SAMPLE_LISTINGS) {
    const { isFavorite: _drop, ...data } = listing;
    listingBatch.set(db.collection('listings').doc(listing.id), { ...data, ownerUid: '' });
  }
  await listingBatch.commit();
  console.log(`✓ listings: ${SAMPLE_LISTINGS.length} tin`);

  // Khách quan tâm mẫu
  const leadBatch = db.batch();
  for (const lead of SAMPLE_LEADS) {
    leadBatch.set(db.collection('leads').doc(lead.id), { ...lead, ownerUid: '' });
  }
  await leadBatch.commit();
  console.log(`✓ leads: ${SAMPLE_LEADS.length} khách`);

  console.log('\nSeed hoàn tất! Mở app là thấy dữ liệu ngay.\n');
}

main()
  .catch((err) => {
    console.error('\n[!] Seed lỗi:', err);
    process.exit(1);
  })
  .then(() => process.exit(0));
