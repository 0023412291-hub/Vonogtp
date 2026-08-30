/**
 * Upload ảnh tin đăng lên Cloudinary (miễn phí) — thay Firebase Storage.
 *
 * Cấu hình 1 lần:
 *   1. Đăng ký miễn phí tại https://cloudinary.com
 *   2. Dashboard → copy "Cloud name" điền vào CLOUD_NAME bên dưới
 *   3. Settings (bánh răng) → Upload → Upload presets → Add upload preset
 *      → Signing mode chọn "Unsigned" → đặt tên (vd: vono_unsigned)
 *      → copy tên điền vào UPLOAD_PRESET bên dưới
 *
 * Cloud name + preset là thông tin công khai (không phải API secret) — an toàn khi đưa vào app.
 */

/** ⚙️ ĐIỀN 2 GIÁ TRỊ NÀY TỪ TÀI KHOẢN CLOUDINARY CỦA BẠN */
export const CLOUD_NAME: string = 'ovfyu2dv';
export const UPLOAD_PRESET: string = 'vono_unsigned';

export function cloudinaryConfigured(): boolean {
  return (
    CLOUD_NAME !== 'YOUR_CLOUD_NAME' &&
    UPLOAD_PRESET !== 'YOUR_UPLOAD_PRESET' &&
    CLOUD_NAME.length > 0 &&
    UPLOAD_PRESET.length > 0
  );
}

/** URI cục bộ (file://...) cần upload; URL http(s) đã host giữ nguyên */
function isLocalUri(uri: string): boolean {
  return !uri.startsWith('http://') && !uri.startsWith('https://');
}

/** Upload 1 ảnh lên Cloudinary — trả về URL hosted (secure_url), chạy được cả Android/iOS lẫn web. */
export async function uploadImageToCloudinary(uri: string): Promise<string> {
  if (!cloudinaryConfigured()) {
    throw new Error(
      'Chưa cấu hình Cloudinary — điền CLOUD_NAME và UPLOAD_PRESET trong utils/cloudinary.ts',
    );
  }
  const formData = new FormData();
  // Web: expo-image-picker trả về data/blob URL → fetch ra Blob thật mới gửi được FormData.
  // Native: URI file:// → cú pháp {uri, type, name} mới đúng.
  const isWeb = typeof window !== 'undefined' && !uri.startsWith('file:');
  const fileName = `vono-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  if (isWeb) {
    const blob = await (await fetch(uri)).blob();
    formData.append('file', new Blob([blob], { type: 'image/jpeg' }), fileName);
  } else {
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: fileName,
    } as unknown as Blob);
  }
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Upload ảnh thất bại (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) throw new Error('Cloudinary không trả về URL ảnh');
  return json.secure_url;
}

/**
 * Upload danh sách ảnh cho tin đăng:
 * - Ảnh local (file://) → upload lên Cloudinary
 * - Ảnh đã là URL (http/https, vd khi sửa tin) → giữ nguyên
 * onProgress báo số ảnh đã xong để hiện "Đang tải 2/5...".
 */
export async function uploadImagesToCloudinary(
  uris: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const total = uris.length;
  if (total === 0) return [];
  let done = 0;
  const results = await Promise.all(
    uris.map(async (uri) => {
      const url = isLocalUri(uri) ? await uploadImageToCloudinary(uri) : uri;
      done += 1;
      onProgress?.(done, total);
      return url;
    }),
  );
  return results;
}
