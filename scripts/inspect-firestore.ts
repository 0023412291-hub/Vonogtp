/**
 * Liệt kê tất cả collection + số lượng document trong Firestore (kể cả subcollection).
 * Chạy: npx tsx scripts/inspect-firestore.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const KEY_PATH = resolve(process.cwd(), 'serviceAccountKey.json');

if (!existsSync(KEY_PATH)) {
  console.error('[!] Khong tim thay serviceAccountKey.json o thu muc goc.');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

async function countDocs(col: FirebaseFirestore.CollectionReference): Promise<number> {
  const snap = await col.count().get();
  return snap.data().count;
}

async function inspectCollection(
  col: FirebaseFirestore.CollectionReference,
  depth: number,
  path: string,
): Promise<void> {
  const total = await countDocs(col);
  const indent = '  '.repeat(depth);
  console.log(`${indent}- ${path} : ${total} docs`);

  if (total === 0) return;

  // Duyet toi da 20 doc dau tien de tim subcollection
  const sample = await col.limit(20).get();
  const subNames = new Set<string>();
  for (const d of sample.docs) {
    const subs = await d.ref.listCollections();
    for (const s of subs) subNames.add(s.id);
  }
  for (const name of subNames) {
    await inspectCollection(col.doc(sample.docs[0].id).collection(name), depth + 1, `${path}/${name}`);
  }
}

async function main(): Promise<void> {
  console.log(`Project: ${process.env.GCLOUD_PROJECT ?? '(default)'}\n`);
  const rootCols = await db.listCollections();
  if (rootCols.length === 0) {
    console.log('(Firestore trong - khong co collection nao)');
    return;
  }
  for (const col of rootCols) {
    await inspectCollection(col, 0, col.id);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[!] Loi:', err);
    process.exit(1);
  });
