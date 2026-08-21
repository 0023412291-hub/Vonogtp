const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

/**
 * google-services.json và GoogleService-Info.plist bị gitignore nên không nằm trong
 * archive gửi lên EAS Build. Thay vào đó chúng được cung cấp qua EAS file environment
 * variables (GOOGLE_SERVICES_JSON / GOOGLE_SERVICES_PLIST).
 *
 * Lưu ý: file env var của EAS được cung cấp dưới dạng ĐƯỜNG DẪN tới file trên build
 * runner (không phải nội dung). Vì vậy ta phải COPY file từ đường dẫn đó vào đúng vị
 * trí mà config plugin của @react-native-firebase cần, thay vì ghi nội dung.
 *
 * Ở máy local các file đã tồn tại sẵn nên không cần làm gì.
 */
const copyFileFromEnv = (envName, target) => {
  const src = process.env[envName];
  if (!src || typeof src !== 'string' || !fs.existsSync(src)) return;
  const dest = path.resolve(target);
  fs.copyFileSync(src, dest);
};

module.exports = () => {
  copyFileFromEnv('GOOGLE_SERVICES_JSON', './google-services.json');
  copyFileFromEnv('GOOGLE_SERVICES_PLIST', './GoogleService-Info.plist');
  return appJson;
};