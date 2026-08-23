const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

/**
 * Trigger khi có tin nhắn chat mới: conversations/{cid}/messages/{mid}.
 * 1) Tạo doc thông báo in-app cho người nhận (collection `notifications`).
 * 2) Đẩy push FCM tới toàn bộ token trong `users/{peer}.fcmTokens`
 *    (token được app lưu sau khi user đăng nhập và cấp quyền).
 *
 * Lưu ý: chạy bằng Admin SDK nên bỏ qua security rules.
 */
exports.onChatMessageCreated = onDocumentCreated(
  'conversations/{cid}/messages/{mid}',
  async (event) => {
    const message = event.data && event.data.data();
    if (!message || !message.senderUid || !message.text) return;

    const db = getFirestore();

    const convSnap = await db.doc(`conversations/${event.params.cid}`).get();
    const conversation = convSnap.data();
    if (!conversation || !Array.isArray(conversation.participants)) return;

    const peerUid = conversation.participants.find((u) => u !== message.senderUid);
    if (!peerUid) return;

    const senderName =
      (conversation.memberInfo &&
        conversation.memberInfo[message.senderUid] &&
        conversation.memberInfo[message.senderUid].name) ||
      'Người dùng VoNo';

    // Thông báo trong app (hiện ở tab THÔNG BÁO của màn hình tài khoản)
    await db.collection('notifications').add({
      uid: peerUid,
      role: 'both',
      icon: 'chatbubble-ellipses',
      title: `${senderName} đã nhắn tin cho bạn`,
      body: String(message.text).slice(0, 120),
      createdAt: FieldValue.serverTimestamp(),
    });

    // Push FCM tới các thiết bị của người nhận
    const userSnap = await db.doc(`users/${peerUid}`).get();
    const tokens = (userSnap.exists && userSnap.data().fcmTokens) || [];
    if (!tokens.length) return;

    await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: senderName,
        body: String(message.text).slice(0, 200),
      },
      data: {
        type: 'chat',
        conversationId: event.params.cid,
      },
    });
  },
);
