# 🛍️ نقاء — دليل النشر الكامل

## ما الذي ستحصل عليه بعد الانتهاء؟

| الرابط | الوصف |
|--------|-------|
| `https://اسمك.netlify.app/` | المتجر للزبائن |
| `https://اسمك.netlify.app/admin` | لوحة الإدارة |

---

## الخطوات (5 خطوات فقط)

---

## 1️⃣ إنشاء قاعدة البيانات على Supabase

### أ) إنشاء الحساب
1. اذهب إلى: **https://supabase.com**
2. اضغط **"Start your project"**
3. سجّل دخول بحساب GitHub أو Google
4. اضغط **"New project"**
5. أدخل اسم المشروع: `naqaa`
6. أدخل كلمة مرور قوية (احفظها!)
7. اختر المنطقة الأقرب إليك (مثلاً `West EU`)
8. اضغط **"Create new project"** وانتظر دقيقتين

### ب) إنشاء الجداول
1. من القائمة اليسرى اضغط على **"SQL Editor"**
2. اضغط **"+ New query"**
3. افتح ملف `supabase/schema.sql` من هذا المشروع
4. انسخ كل محتواه والصقه في المحرر
5. اضغط **"Run"** (أو Ctrl+Enter)
6. يجب أن ترى: `Success. No rows returned`

### ج) الحصول على مفاتيح الاتصال
1. من القائمة اليسرى اضغط **"Settings"** (الترس ⚙️)
2. اضغط **"API"**
3. انسخ القيمتين التاليتين وضعهما في مكان آمن:
   - **Project URL** → مثل: `https://abcxyz.supabase.co`
   - **anon public** → سلسلة طويلة تبدأ بـ `eyJ...`

---

## 2️⃣ إعداد ملف البيئة .env

في مجلد المشروع، أنشئ ملف جديد اسمه **`.env`** (بدون امتداد):

```
VITE_SUPABASE_URL=https://abcxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **مهم:** استبدل القيمتين بالقيم الحقيقية التي نسختها من Supabase

---

## 3️⃣ رفع الكود على GitHub

### إذا كان لديك GitHub Desktop (الأسهل)
1. نزّل **GitHub Desktop** من: https://desktop.github.com
2. افتح البرنامج وسجّل الدخول
3. اضغط **"File → Add local repository"**
4. اختر مجلد المشروع `naqaa`
5. اضغط **"Publish repository"**
6. ضع اسم المستودع: `naqaa`
7. اضغط **"Publish Repository"**

### إذا كنت تريد استخدام سطر الأوامر (CMD)
```bash
cd naqaa
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/اسمك/naqaa.git
git push -u origin main
```

---

## 4️⃣ النشر على Netlify

1. اذهب إلى: **https://netlify.com**
2. اضغط **"Sign up"** وسجّل بحساب GitHub
3. اضغط **"Add new site → Import an existing project"**
4. اختر **"GitHub"**
5. اختر مستودع **naqaa**
6. في إعدادات البناء:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
7. اضغط **"Show advanced"** ثم **"New variable"**:
   - أضف: `VITE_SUPABASE_URL` → القيمة من Supabase
   - أضف: `VITE_SUPABASE_ANON_KEY` → القيمة من Supabase
8. اضغط **"Deploy site"**
9. انتظر دقيقتين → سيظهر رابط موقعك! 🎉

---

## 5️⃣ تسمية الموقع (اختياري)

1. في Netlify → **"Site settings → Change site name"**
2. اكتب اسمًا مميزًا مثل: `naqaa-store`
3. سيصبح الرابط: `https://naqaa-store.netlify.app`

---

## 🔐 بيانات الدخول للإدارة

| الحقل | القيمة |
|-------|--------|
| رابط الإدارة | `/admin` |
| اسم المستخدم | `admin` |
| كلمة المرور | `admin123` |

> ⚠️ **غيّر كلمة مرور المدير فور الدخول الأول!**

---

## 🗂️ هيكل المشروع

```
naqaa/
├── .env                    ← مفاتيح Supabase (لا ترفعه على GitHub!)
├── .gitignore              ← يمنع رفع الملفات الحساسة
├── index.html              ← صفحة الدخول
├── netlify.toml            ← إعدادات Netlify
├── package.json            ← الحزم المطلوبة
├── vite.config.js          ← إعدادات البناء
├── src/
│   ├── main.jsx            ← نقطة البداية
│   ├── Router.jsx          ← التوجيه (admin/store)
│   ├── index.css           ← الأنماط العامة
│   ├── lib/
│   │   ├── supabase.js     ← الاتصال بقاعدة البيانات
│   │   └── db.js           ← كل عمليات البيانات
│   ├── admin/
│   │   └── Admin.jsx       ← لوحة الإدارة الكاملة
│   └── store/
│       └── Store.jsx       ← المتجر للزبائن
└── supabase/
    └── schema.sql          ← جداول قاعدة البيانات
```

---

## 🔧 التطوير المحلي (على جهازك)

```bash
# 1. تثبيت الحزم
npm install

# 2. تشغيل الموقع محلياً
npm run dev

# 3. فتح المتصفح على
http://localhost:5173       ← المتجر
http://localhost:5173/admin ← الإدارة
```

---

## 🔄 عند تعديل الكود لاحقاً

بعد أي تعديل، ارفع التغييرات على GitHub:
```bash
git add .
git commit -m "تعديل"
git push
```
**Netlify ستتحدث تلقائياً خلال دقيقتين!** 🚀

---

## ❓ مشاكل شائعة وحلولها

| المشكلة | الحل |
|---------|------|
| "تعذر الاتصال بقاعدة البيانات" | تحقق من قيم `.env` في Netlify |
| لا تظهر البيانات | تحقق من أن SQL نُفِّذ بنجاح في Supabase |
| خطأ 404 عند فتح `/admin` | تحقق من وجود ملف `netlify.toml` |
| الصور لا تُحفظ | الصور محفوظة كـ Base64 في قاعدة البيانات، هذا طبيعي |

---

## 📞 الدعم

- وثائق Supabase: https://supabase.com/docs
- وثائق Netlify: https://docs.netlify.com
- وثائق Vite: https://vitejs.dev/guide
