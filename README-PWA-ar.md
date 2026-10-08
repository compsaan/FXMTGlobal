# تثبيت تطبيق FXTM

هذه الملفات تجعل الواجهة تطبيق ويب قابلًا للتثبيت (PWA). ضع `index.html` و`pwa-install.js` و`manifest.webmanifest` و`sw.js` وأيقونتي PNG في جذر المستودع نفسه.

## النشر على GitHub Pages

1. افتح **Settings → Pages** في المستودع.
2. اختر النشر من فرع `main` ومجلد الجذر (`/`)، ثم احفظ.
3. افتح رابط الموقع المنشور عبر HTTPS.
4. على Android/Chrome اختر **Install app** أو **Add to Home screen**. على iPhone/iPad افتح الرابط في Safari ثم اختر **Share → Add to Home Screen**.

يحتاج تسجيل عامل الخدمة والتثبيت إلى سياق آمن عبر HTTPS؛ معاينة ملفات HTML محليًا لا تُظهر خيار التثبيت.
