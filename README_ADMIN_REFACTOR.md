# 🛍️ نقاء — تحديث لوحة الإدارة (Admin Refactor)

هذا التحديث يُعيد بناء `src/admin/Admin.jsx` (6754 سطر) إلى هيكل ملفات منظّم،
مع تنفيذ التحسينات الأمنية والأدائية المطلوبة. **لم يُغيَّر أي شيء في `src/store/`**.

---

## 📁 الهيكل الجديد

```
src/admin/
├── index.jsx              ← المكوّن الرئيسي (يستبدل Admin.jsx القديم)
├── constants.js            ← الثوابت، الألوان، الأنماط، الأقسام، الصلاحيات
├── utils.js                ← logActivity, softDelete, printThermal, printA4
├── types.d.ts              ← تعريفات الأنواع (TypeScript تدريجي عبر JSDoc)
├── components/
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── Toast.jsx
│   └── FormControls.jsx    ← NumInput, PhoneInput (مشترك بين الصفحات)
├── pages/                  ← 22 صفحة، كل واحدة بملفها المستقل
│   └── ...
├── hooks/
│   ├── useAuth.jsx
│   ├── useToast.jsx
│   └── useConfirm.jsx
├── styles/
│   └── admin.css
└── tests/
    ├── utils.test.js
    └── constants.test.js
```

---

## 🚀 خطوات التطبيق على مشروعك

1. **احذف** الملف القديم `src/admin/Admin.jsx` (بعد أخذ نسخة احتياطية منه).
2. **انسخ** مجلد `src/admin/` الجديد بالكامل (هذا التسليم) إلى مكانه.
3. **استبدل** `src/Router.jsx` بالنسخة الجديدة المرفقة (تغيير سطر استيراد واحد فقط:
   `from './admin/Admin.jsx'` → `from './admin/index.jsx'`).
4. شغّل `npm run dev` وتحقق من أن كل الأقسام تعمل كما كانت.
5. **اختياري لكنه موصى به بشدة:** نفّذ ملف `supabase/rls_security.sql` في
   Supabase SQL Editor لتفعيل RLS (راجع القسم أدناه).

---

## ✅ المهمة 1: تحسين الأمان

### 1.1 — RLS (Row Level Security)
ملف `supabase/rls_security.sql` يفعّل RLS على كل الجداول (17 جدولاً) مع
سياسات محددة لكل جدول (قراءة عامة / كتابة مقيّدة / إداري بالكامل).

**⚠️ صراحةً:** هذا المشروع لا يستخدم Supabase Auth — تسجيل الدخول مُنفّذ
بالكامل من جانب العميل، والجميع يتصل بنفس `anon key`. لذلك RLS هنا يحمي من
الكتابة العرضية وبعض هجمات الحقن، لكنه **لا يستطيع** التمييز بين مدير
حقيقي وزائر يعرف الـ anon key من Devtools. الملف يوضّح هذا بالتفصيل في
تعليقاته، ويقترح الخطوة التالية: نقل المصادقة إلى `supabase.auth` الحقيقي
(`auth.uid()`) — وهي مهمة منفصلة يمكننا تنفيذها متى قرّرت.

كما أضاف الملف **عرضين آمنين** (`customers_safe`, `employees_safe`) تُخفي
عمود `password` عن أي استعلام SELECT عام.

### 1.2 — bcrypt بدلاً من SHA256
المشروع بدون خادم (serverless front-end فقط)، فـ "تشفير على جانب الخادم"
الحقيقي الوحيد المتاح هو **Supabase Edge Function**:
- `supabase/functions/auth-login/index.ts` — دالة Deno تتحقق من كلمة
  المرور بـ bcrypt الحقيقي على خادم Supabase، ولا ترسل أي hash للمتصفح.
- `LoginScreen.jsx` يستدعي هذه الدالة أولاً؛ **إن لم تُنشر بعد**، يعمل
  تلقائياً بالنظام القديم (SHA256 محلي) دون انقطاع للخدمة.
- **للتفعيل:** ثبّت Supabase CLI ثم `supabase functions deploy auth-login`
  (التفاصيل والتعليمات الكاملة داخل الملف نفسه).

---

## ✅ المهمة 2: تحسين الأداء

### 2.1 — تقسيم admin.jsx
تم — 22 صفحة في ملفات مستقلة، كما هو موضّح في الهيكل أعلاه.

### 2.2 — Pagination
أُضيف فعلياً (وليس فقط فلترة في الذاكرة) عبر `.range()` في:
- **Products.jsx** — 20 عنصر/صفحة
- **Orders.jsx** — 25 عنصر/صفحة
- **Customers.jsx** — 20 عنصر/صفحة

كل صفحة منها تحسب `count` الإجمالي من قاعدة البيانات وتعرض شريط تنقل
بين الصفحات (السابق / أرقام / التالي).

### 2.3 — Lazy Loading للصور
مكوّن `LazyImage` داخل `Products.jsx` يستخدم `IntersectionObserver` —
الصور لا تُحمَّل من قاعدة البيانات (وهي Base64 ثقيلة) إلا عند ظهورها
فعلياً في إطار الرؤية، مع placeholder رمادي بسيط أثناء الانتظار.

---

## ✅ المهمة 3: تحسين تجربة المستخدم

### 3.1 — إشعارات فورية (Realtime)
`Dashboard.jsx` يفتح قناة `supabase.channel('admin-notifications')` تستمع
لـ `INSERT` على جدولي `orders` و `products`، وتُظهر Toast + جرس إشعارات
فوري بدون تحديث الصفحة.

### 3.2 — بحث متقدم مع فلاتر
`Products.jsx`: فلترة بالاسم + الماركة + حالة المخزون (منخفض/متوفر) —
كل الفلاتر تُرسَل لقاعدة البيانات (ليس فقط على البيانات المحمَّلة) لتبقى
صحيحة مع الـ Pagination.
`Customers.jsx`: فلترة بالاسم/الهاتف + الرتبة (M1/M2/M3) + المجموعة.
`Orders.jsx`: بحث بالرقم/الاسم/الهاتف/العنوان + فلترة بالحالة.

### 3.3 — Responsive Design
`styles/admin.css` يحتوي media queries لـ 768px و 480px (تكديس الشبكات،
تصغير الجداول والعناوين على الجوال). يمكن تعميقها أكثر إن احتجت.

---

## ✅ المهمة 4: ميزات جديدة

### 4.1 — تقارير مبيعات مع رسوم بيانية
`Reports.jsx` يحتوي رسم أعمدة (bar chart) مبني بـ CSS/divs لمبيعات آخر
6 أشهر، بالإضافة لشرائط تقدّم (progress bars) لأكثر المنتجات/العملاء/
الولايات. `Dashboard.jsx` يحتوي رسمين مماثلين لمبيعات الأسبوع والشهر.

> 💡 هذه رسوم بسيطة بدون مكتبة خارجية للحفاظ على الأداء. إن رغبت برسوم
> أكثر تفاعلية (tooltips، zoom...) يمكن استخدام `recharts` التي تدعمها
> بيئة الـ Artifacts، لكنها تحتاج تأكيدك أولاً لإضافتها كـ dependency.

### 4.2 — كوبونات متقدمة
`Coupons.jsx` يدعم نسبة % أو مبلغ ثابت، تاريخ انتهاء، حد أقصى استخدامات،
وحد أدنى للطلب (هذا كان موجوداً جزئياً في الأصل وتم الحفاظ عليه/تنظيمه).

### 4.3 — إدارة عملاء متقدمة
`Customers.jsx`: رتب (M1/M2/M3) قابلة للتعديل من الإعدادات، مجموعات
نصية حرة، نظام نقاط، **وإشعارات جماعية عبر واتساب** لمجموعة مُحدَّدة من
العملاء دفعة واحدة (ميزة جديدة لم تكن موجودة في الأصل).

---

## ✅ المهمة 5: الجودة

- **JSDoc:** كل دالة في `constants.js`, `utils.js`, `hooks/*.jsx`,
  والمكوّنات الرئيسية موثّقة بـ `@param`/`@returns`/`@example`.
- **TypeScript تدريجي:** `types.d.ts` يعرّف الأنواع المشتركة (`Product`,
  `Order`, `Customer`...) بصيغة تُفهَم عبر JSDoc، مع `jsconfig.json`
  يُفعّل فحص الأنواع في الإيدي بدون تحويل أي ملف لـ `.tsx` فعلياً —
  وبالتالي بدون أي خطر على الكود الحالي. راجع التعليق الكامل داخل الملف
  لشرح سبب هذا الاختيار بدل تحويل شامل.
- **Unit Tests:** `tests/utils.test.js` و `tests/constants.test.js` بـ
  Vitest. للتشغيل:
  ```bash
  npm install -D vitest @testing-library/react jsdom --legacy-peer-deps
  npm test
  ```
  (أضف `"test": "vitest"` إلى `scripts` في `package.json`)

---

## 🗂️ خريطة الأقسام → الملفات

| القسم في القائمة الجانبية | الملف |
|---|---|
| لوحة القيادة | `pages/Dashboard.jsx` |
| المنتجات | `pages/Products.jsx` |
| الفئات | `pages/Categories.jsx` |
| العلامات التجارية | `pages/Brands.jsx` |
| الموردون | `pages/Suppliers.jsx` |
| العملاء | `pages/Customers.jsx` |
| الموظفون | `pages/Employees.jsx` |
| الكوبونات | `pages/Coupons.jsx` |
| المشتريات | `pages/Purchases.jsx` |
| المخزون | `pages/Inventory.jsx` |
| الطلبيات | `pages/Orders.jsx` |
| العروض | `pages/Promotions.jsx` |
| الإشعارات | `pages/Notifications.jsx` |
| التقارير | `pages/Reports.jsx` |
| المصاريف | `pages/Expenses.jsx` |
| سجل النشاطات | `pages/ActivityLog.jsx` |
| إدارة المتجر | `pages/StoreManager.jsx` |
| نسخ احتياطي | `pages/DataBackup.jsx` |
| الإعدادات | `pages/Settings.jsx` |
| من نحن | `pages/AboutUs.jsx` |
| اتصل بنا | `pages/ContactUs.jsx` |
| سياسة الاسترجاع | `pages/ReturnPolicy.jsx` |
| سلة المهملات | `pages/RecycleBin.jsx` |

---

## ⚠️ ملاحظات صادقة (لا أخفي عنك شيئاً)

1. **لم أختبر الكود بتشغيله فعلياً** (لا توجد بيئة Node/npm متصلة بـ
   Supabase الحقيقي هنا) — راجعت كل سطر يدوياً ضد الكود الأصلي، لكن
   أنصحك تجربته أولاً في فرع (branch) تجريبي قبل الدمج مع الإنتاج.
2. **bcrypt الحقيقي يحتاج نشر Edge Function** — لن يعمل تلقائياً، يحتاج
   منك تنفيذ خطوات `supabase functions deploy` المذكورة في الملف.
3. **RLS الحالي ليس حلاً نهائياً 100%** كما وضّحت في القسم 1.1 — هو
   تحسين حقيقي وملموس، لكن الأمان الكامل يحتاج Supabase Auth.
4. **الرسوم البيانية مبنية بـ CSS بسيط**، ليست مكتبة charting متقدمة —
   اخترت ذلك عمداً لتفادي إضافة dependency ثقيلة بدون موافقتك أولاً.
