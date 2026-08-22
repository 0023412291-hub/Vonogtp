/**
 * Tạo TÀI KHOẢN DEMO (Firebase Auth thật) + dữ liệu mẫu gắn với chúng,
 * để đủ nội dung trong cả 6 collection: users, listings, favorites, leads, videos, notifications.
 *
 * Chạy: npm run seed:demo
 *
 * Lưu ý: ai sở hữu SĐT demo này đều có thể OTP đăng nhập và "kế thừa" dữ liệu demo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const KEY_PATH = resolve(process.cwd(), 'serviceAccountKey.json');
if (!existsSync(KEY_PATH)) {
  console.error('[!] Thiếu serviceAccountKey.json ở thư mục gốc.');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();
const auth = getAuth();

const DEMO_OWNER = {
  email: 'chunha@vono.demo',
  password: 'vono123',
  phone: '0903000001',
  name: 'Minh Tuấn (Chủ nhà demo)',
};
const DEMO_RENTER = {
  email: 'thuenha@vono.demo',
  password: 'vono123',
  phone: '0903000002',
  name: 'Lan Anh (Người thuê demo)',
};

/** Tạo hoặc lấy sẵn tài khoản Auth theo email */
async function ensureAuthUser(email: string, password: string, name: string): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch {
    const created = await auth.createUser({ email, password, displayName: name });
    return created.uid;
  }
}

async function main(): Promise<void> {
  console.log('\nTạo tài khoản demo...\n');

  // ---- 1) users ----
  const ownerUid = await ensureAuthUser(DEMO_OWNER.email, DEMO_OWNER.password, DEMO_OWNER.name);
  await db.doc(`users/${ownerUid}`).set({
    uid: ownerUid,
    name: DEMO_OWNER.name,
    phone: DEMO_OWNER.phone,
    email: DEMO_OWNER.email,
    role: 'owner',
  });
  console.log(`✓ users/${ownerUid} — ${DEMO_OWNER.name} (${DEMO_OWNER.email})`);

  const renterUid = await ensureAuthUser(DEMO_RENTER.email, DEMO_RENTER.password, DEMO_RENTER.name);
  await db.doc(`users/${renterUid}`).set({
    uid: renterUid,
    name: DEMO_RENTER.name,
    phone: DEMO_RENTER.phone,
    email: DEMO_RENTER.email,
    role: 'renter',
  });
  console.log(`✓ users/${renterUid} — ${DEMO_RENTER.name} (${DEMO_RENTER.email})`);

  // ---- 2) listings của chủ nhà demo ----
  const demoListings = [
    {
      id: 'demo001',
      title: 'Phòng trọ mới xây gần ĐH Kinh tế — chủ nhà demo',
      price: 4_200_000,
      area: 22,
      districtId: 'q3',
      district: 'Quận 3',
      ward: 'Phường Võ Thị Sáu',
      address: '88 Nguyễn Đình Chiểu, Quận 3',
      type: 'phong_tro',
      bedrooms: 1,
      bathrooms: 1,
      floor: 4,
      yearBuilt: 2023,
      description:
        'Phòng mới xây 22m² đầy đủ nội thất, máy lạnh, WC riêng, cửa sổ thoáng. Cách ĐH Kinh tế 400m, an ninh tốt, giờ giấc tự do. Tin demo của chủ nhà mẫu.',
      amenities: ['WiFi', 'Máy lạnh', 'Tủ lạnh', 'WC riêng', 'Nấu ăn'],
      images: [
        'https://picsum.photos/seed/vonodemo01/640/420',
        'https://picsum.photos/seed/vonodemo02/640/420',
        'https://picsum.photos/seed/vonodemo03/640/420',
      ],
      contact: { name: DEMO_OWNER.name, phone: DEMO_OWNER.phone },
      showPhone: true,
      views: 156,
      contactCount: 7,
      savedCount: 12,
      latitude: 10.7745,
      longitude: 106.6945,
      status: 'active',
      rating: 4.7,
      reviewCount: 9,
      condition: 'new',
    },
    {
      id: 'demo002',
      title: 'Căn hộ 2PN Thủ Đức view sông — chủ nhà demo',
      price: 9_500_000,
      area: 65,
      districtId: 'thuduc',
      district: 'Thủ Đức',
      ward: 'Phường Trường Thọ',
      address: '12A Xa lộ Hà Nội, Thủ Đức',
      type: 'can_ho',
      bedrooms: 2,
      bathrooms: 2,
      floor: 8,
      yearBuilt: 2021,
      description:
        'Căn hộ 2 phòng ngủ 65m², nội thất cao cấp, hồ bơi + gym miễn phí, bảo vệ 24/7. Phù hợp gia đình trẻ hoặc 2 bạn ở chung.',
      amenities: ['WiFi', 'Máy lạnh', 'Tủ lạnh', 'Máy giặt', 'Thang máy', 'Bảo vệ', 'Ban công'],
      images: [
        'https://picsum.photos/seed/vonodemo04/640/420',
        'https://picsum.photos/seed/vonodemo05/640/420',
      ],
      contact: { name: DEMO_OWNER.name, phone: DEMO_OWNER.phone },
      showPhone: false,
      views: 342,
      contactCount: 15,
      savedCount: 28,
      latitude: 10.8385,
      longitude: 106.7725,
      status: 'active',
      rating: 4.9,
      reviewCount: 21,
      condition: 'new',
    },
    {
      id: 'demo003',
      title: 'Nhà nguyên căn Gò Vấp đã cho thuê — chủ nhà demo',
      price: 12_000_000,
      area: 90,
      districtId: 'govap',
      district: 'Gò Vấp',
      ward: 'Phường 10',
      address: '45 Quang Trung, Gò Vấp',
      type: 'nha_nguyen_can',
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2016,
      description:
        'Nhà 2 tầng 90m², hẻm xe hơi, sân phơi rộng. Đã cho thuê — giữ lại làm ví dụ trạng thái "Đã cho thuê" trên dashboard.',
      amenities: ['WiFi', 'Máy lạnh', 'Bếp riêng', 'Sân phơi'],
      images: ['https://picsum.photos/seed/vonodemo06/640/420'],
      contact: { name: DEMO_OWNER.name, phone: DEMO_OWNER.phone },
      showPhone: true,
      views: 520,
      contactCount: 31,
      savedCount: 44,
      latitude: 10.8298,
      longitude: 106.6895,
      status: 'rented',
      condition: 'needs_repair',
    },
  ];
  for (const l of demoListings) {
    await db
      .collection('listings')
      .doc(l.id)
      .set({ ...l, ownerUid });
  }
  console.log(`✓ listings: +${demoListings.length} tin của chủ nhà demo`);

  // ---- 3) leads trên tin của chủ nhà demo ----
  const demoLeads = [
    {
      id: 'demold001',
      name: 'Quốc Huy',
      phone: '0938111222',
      listingId: 'demo001',
      message: 'Phòng còn không ạ? Cuối tuần em qua xem được không?',
      status: 'new',
      time: '15 phút trước',
    },
    {
      id: 'demold002',
      name: 'Bảo Trân',
      phone: '0977555333',
      listingId: 'demo002',
      message: 'Cho em hỏi giá còn thương lượng được không? Gia đình em ở 4 người.',
      status: 'contacted',
      time: '2 giờ trước',
    },
    {
      id: 'demold003',
      name: 'Đức Khang',
      phone: '0909444777',
      listingId: 'demo001',
      message: 'Em chốt phòng luôn, cọc giữ chỗ giúp em nhé!',
      status: 'closed',
      time: 'Hôm qua',
    },
  ];
  for (const ld of demoLeads) {
    await db.collection('leads').doc(ld.id).set({ ...ld, ownerUid });
  }
  console.log(`✓ leads: +${demoLeads.length} khách quan tâm của chủ nhà demo`);

  // ---- 4) notifications ----
  await db.collection('notifications').doc('demontf001').set({
    uid: ownerUid,
    role: 'owner',
    icon: 'chatbubble-ellipses',
    title: 'Khách quan tâm tin của bạn',
    body: 'Quốc Huy vừa liên hệ tin "Phòng trọ mới xây gần ĐH Kinh tế". Hãy phản hồi nhanh để chốt đơn.',
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection('notifications').doc('demontf002').set({
    uid: ownerUid,
    role: 'owner',
    icon: 'eye',
    title: 'Lượt xem tăng vượt trội',
    body: 'Tin "Căn hộ 2PN Thủ Đức" đạt 342 lượt xem tuần này, tăng 40% so với tuần trước.',
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection('notifications').doc('demontf003').set({
    uid: renterUid,
    role: 'renter',
    icon: 'home',
    title: 'Tin mới phù hợp bạn',
    body: '5 tin mới tại Quận 3 trong tầm giá bạn quan tâm. Khám phá ngay!',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log('✓ notifications: +3 thông báo (2 cho chủ nhà, 1 cho người thuê)');

  // ---- 5) favorites của người thuê demo ----
  await db.collection('favorites').doc(renterUid).set({
    listingIds: ['bds001', 'bds002', 'demo002'],
  });
  console.log('✓ favorites: 3 tin đã lưu cho người thuê demo');

  console.log(`
Hoàn tất! Giờ Firestore có đủ:
  users (${ownerUid.slice(0, 6)}…, ${renterUid.slice(0, 6)}…) · listings · favorites · leads · notifications
Đăng nhập bằng email ${DEMO_OWNER.email} / mật khẩu ${DEMO_OWNER.password} sẽ thấy dashboard chủ nhà demo đầy đủ.
`);
}

main()
  .catch((err) => {
    console.error('[!] Seed demo lỗi:', err);
    process.exit(1);
  })
  .then(() => process.exit(0));
