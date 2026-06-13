# 🌿 نقاء — متجر التجميل والعناية

مشروع React + Supabase + Vite قابل للنشر على Vercel.

## 🚀 التشغيل المحلي

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/naqaa-store.git
cd naqaa-store

# 2. تثبيت المكتبات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# عدّل .env وأضف بيانات Supabase

# 4. تشغيل التطوير
npm run dev
```

## 🏗️ هيكل المشروع

```
naqaa-store/
├── src/
│   ├── admin/Admin.jsx      ← لوحة الإدارة  (/admin)
│   ├── store/Store.jsx      ← المتجر         (/)
│   ├── lib/
│   │   ├── supabase.js      ← اتصال Supabase
│   │   └── db.js            ← Cache + CRUD
│   ├── Router.jsx           ← التوجيه
│   ├── main.jsx             ← نقطة الدخول
│   └── index.css            ← أنماط عامة
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
└── .env.example
```

## 🌐 النشر على Vercel

### طريقة 1 — Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### طريقة 2 — GitHub + Vercel Dashboard
1. ارفع المشروع على GitHub
2. اذهب إلى [vercel.com](https://vercel.com) → New Project
3. استورد المستودع
4. أضف متغيرات البيئة:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy 🚀

## 🔗 الروابط
- المتجر: `https://your-app.vercel.app/`
- الإدارة: `https://your-app.vercel.app/admin`

## 🔐 بيانات الدخول للإدارة
- البريد: `meghamel2012@gmail.com`
- كلمة المرور: (موجودة في الكود)
- كود التحقق: `6789`

## 🗄️ قاعدة البيانات
راجع ملفات `schema.sql` و `schema_v6_extra.sql` لإنشاء الجداول في Supabase.
