# Alili Super App v17.1

تطبيق ذكاء اصطناعي شامل مع أدوات متقدمة.

## 🚀 الميزات
- محادثة ذكية (Groq GPT-OSS-120B)
- توليد صور (FLUX)
- تعديل الصور (Img2Img)
- توليد فيديو (Magic Hour)
- مسح/توليد QR Code
- إنشاء فواتير PDF
- قراءة PDF
- مايك صوتي
- سجل محادثات

## 🏗️ البنية
- Frontend: HTML/JS (index.html)
- Backend: Cloudflare Worker (worker.js)
- Mobile: Capacitor 6 + Android

## 📱 البناء
```bash
npm install
npm run prepare:web
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
