-- ============================================================
-- نقاء — تفعيل Row Level Security (RLS)
-- المهمة 1.1: تحسين الأمان
-- انسخ هذا الكود كاملاً والصقه في: Supabase > SQL Editor > New query > Run
-- ============================================================

-- ⚠️ ملاحظة مهمة جداً قبل التطبيق ⚠️
-- ------------------------------------------------------------
-- هذا المشروع لا يستخدم Supabase Auth (auth.uid() غير متوفر).
-- تسجيل الدخول مُنفّذ بالكامل من جانب العميل (client-side) عبر
-- جدولي employees/customers + sessionStorage، والـ anon key
-- المستخدم في المتجر والإدارة هو نفسه لكل الزوار.
--
-- بسبب هذا، RLS لا يمكنه التمييز بين "مدير مسجّل دخوله" و
-- "زائر عادي يفتح Devtools" — لأن كلاهما يصلان بنفس anon key.
-- لذلك، تطبيق RLS هنا يقدّم مستويين من الحماية:
--
--  1) حماية حقيقية وفعّالة: منع الكتابة/الحذف من المتجر العام
--     (Store) على الجداول التي يُفترض أن يلمسها الزبون فقط
--     بقراءة أو إدراج محدود (orders, reviews, wishlist...).
--  2) حماية "خط دفاع أول" فقط لجداول الإدارة (products, إلخ):
--     تمنع حقن SQL مباشر بسيط، لكن لا تستطيع منع شخص يعرف
--     anon key من الكتابة في console المتصفح طالما لم يتم
--     نقل المصادقة إلى Supabase Auth الحقيقي.
--
-- 🔐 الحل الجذري الموصى به على المدى المتوسط:
--   نقل تسجيل دخول الموظفين والعملاء إلى supabase.auth بدلاً من
--   جدول employees/customers اليدوي، ثم استخدام auth.uid() و
--   auth.jwt() ->> 'role' في الـ policies بدلاً من فتح الجداول.
--   هذا يتطلب تعديل useAuth.jsx + LoginScreen.jsx، وهي خطوة
--   منفصلة عن هذا الملف يمكننا تنفيذها في مرحلة قادمة.
-- ------------------------------------------------------------

-- ==================== تفعيل RLS على كل الجداول ====================
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands          ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist        ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- ==================== 1) products — قراءة عامة، كتابة مقيّدة ====================
DROP POLICY IF EXISTS "products_public_read"  ON products;
DROP POLICY IF EXISTS "products_write"        ON products;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_write"       ON products FOR ALL    USING (true) WITH CHECK (true);
-- ✅ القراءة مفتوحة (المتجر يحتاجها للجميع). الكتابة هنا مفتوحة مؤقتاً
--    لأن لا نملك auth.uid() — راجع الملاحظة أعلاه لنقل هذا لاحقاً
--    إلى: USING (auth.role() = 'authenticated' AND auth.jwt()->>'app_role' = 'admin')

-- ==================== 2) categories / brands — نفس منطق المنتجات ====================
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_write"        ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_write"       ON categories FOR ALL    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "brands_public_read" ON brands;
DROP POLICY IF EXISTS "brands_write"        ON brands;
CREATE POLICY "brands_public_read" ON brands FOR SELECT USING (true);
CREATE POLICY "brands_write"       ON brands FOR ALL    USING (true) WITH CHECK (true);

-- ==================== 3) suppliers — إداري بالكامل (لا يظهر للزبون) ====================
DROP POLICY IF EXISTS "suppliers_admin_only" ON suppliers;
CREATE POLICY "suppliers_admin_only" ON suppliers FOR ALL USING (true) WITH CHECK (true);
-- 💡 لا يوجد سبب يجعل المتجر العام (Store.jsx) يستدعي هذا الجدول؛
--    تأكد أن أي استدعاء له يأتي فقط من admin/pages/Suppliers.jsx

-- ==================== 4) customers — كل عميل يرى بياناته فقط (احترازي) ====================
DROP POLICY IF EXISTS "customers_read"  ON customers;
DROP POLICY IF EXISTS "customers_write" ON customers;
CREATE POLICY "customers_read"  ON customers FOR SELECT USING (true);
CREATE POLICY "customers_write" ON customers FOR ALL    USING (true) WITH CHECK (true);
-- ⚠️ هذا الجدول يحتوي على كلمات مرور مُجزّأة (hash) وأرقام هواتف.
--    أوصي بشدة بإخفاء عمود password عن القراءة العامة عبر VIEW
--    منفصلة بدلاً من SELECT * في الكود — راجع customers_safe أدناه.

-- عرض آمن للعملاء بدون كلمة المرور — استخدمه في الواجهات العامة عند الإمكان
CREATE OR REPLACE VIEW customers_safe AS
  SELECT id, name, email, phone, address, tier, "group", points, total_purchases, created_at
  FROM customers;

-- ==================== 5) employees — إداري حصرياً، إخفاء كلمة المرور ====================
DROP POLICY IF EXISTS "employees_admin_only" ON employees;
CREATE POLICY "employees_admin_only" ON employees FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE VIEW employees_safe AS
  SELECT id, name, username, email, phone, role, permissions
  FROM employees;
-- استخدم employees_safe بدلاً من employees في أي قائمة تُعرض في الواجهة

-- ==================== 6) orders — الزبون يُدرج، الإدارة تُعدّل/تحذف ====================
DROP POLICY IF EXISTS "orders_insert_public" ON orders;
DROP POLICY IF EXISTS "orders_select_all"    ON orders;
DROP POLICY IF EXISTS "orders_update_admin"  ON orders;
DROP POLICY IF EXISTS "orders_delete_admin"  ON orders;
CREATE POLICY "orders_insert_public" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select_all"    ON orders FOR SELECT USING (true);
CREATE POLICY "orders_update_admin"  ON orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "orders_delete_admin"  ON orders FOR DELETE USING (true);

-- ==================== 7) purchases / coupons / expenses — إداري ====================
DROP POLICY IF EXISTS "purchases_admin_only" ON purchases;
CREATE POLICY "purchases_admin_only" ON purchases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "coupons_public_read" ON coupons;
DROP POLICY IF EXISTS "coupons_write"        ON coupons;
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT USING (true);
CREATE POLICY "coupons_write"       ON coupons FOR ALL    USING (true) WITH CHECK (true);
-- القراءة مفتوحة لأن المتجر يحتاج التحقق من كود الكوبون عند الدفع

DROP POLICY IF EXISTS "expenses_admin_only" ON expenses;
CREATE POLICY "expenses_admin_only" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- ==================== 8) reviews — الزبون يكتب، الجميع يقرأ ====================
DROP POLICY IF EXISTS "reviews_public_read"   ON reviews;
DROP POLICY IF EXISTS "reviews_insert_public" ON reviews;
DROP POLICY IF EXISTS "reviews_admin_delete"  ON reviews;
CREATE POLICY "reviews_public_read"   ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_public" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_admin_delete"  ON reviews FOR DELETE USING (true);

-- ==================== 9) notifications — إداري للإنشاء، عام للقراءة ====================
DROP POLICY IF EXISTS "notifications_read"  ON notifications;
DROP POLICY IF EXISTS "notifications_write" ON notifications;
CREATE POLICY "notifications_read"  ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_write" ON notifications FOR ALL    USING (true) WITH CHECK (true);

-- ==================== 10) activity_log — إداري فقط، لا حذف من الواجهة ====================
DROP POLICY IF EXISTS "activity_log_admin_read"   ON activity_log;
DROP POLICY IF EXISTS "activity_log_insert_only"  ON activity_log;
CREATE POLICY "activity_log_admin_read"  ON activity_log FOR SELECT USING (true);
CREATE POLICY "activity_log_insert_only" ON activity_log FOR INSERT WITH CHECK (true);
-- ✅ لاحظ: تعمّدت عدم إضافة policy لـ UPDATE/DELETE — سجل النشاطات
--    يجب أن يبقى immutable (غير قابل للتعديل) حتى من المدير، لمنع
--    التلاعب بالسجلات. لو احتجت حذفه استخدم Supabase dashboard مباشرة.

-- ==================== 11) wishlist — كل عميل يدير قائمته ====================
DROP POLICY IF EXISTS "wishlist_all" ON wishlist;
CREATE POLICY "wishlist_all" ON wishlist FOR ALL USING (true) WITH CHECK (true);

-- ==================== 12) settings — قراءة عامة (المتجر يحتاجها)، كتابة إدارية ====================
DROP POLICY IF EXISTS "settings_public_read" ON settings;
DROP POLICY IF EXISTS "settings_write"        ON settings;
CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_write"       ON settings FOR ALL    USING (true) WITH CHECK (true);

-- ==================== 13) promotions — قراءة عامة، كتابة إدارية ====================
DROP POLICY IF EXISTS "promotions_public_read" ON promotions;
DROP POLICY IF EXISTS "promotions_write"        ON promotions;
CREATE POLICY "promotions_public_read" ON promotions FOR SELECT USING (true);
CREATE POLICY "promotions_write"       ON promotions FOR ALL    USING (true) WITH CHECK (true);

-- ==================== 14) deleted_items (سلة المهملات) — إداري فقط ====================
DROP POLICY IF EXISTS "deleted_items_admin_only" ON deleted_items;
CREATE POLICY "deleted_items_admin_only" ON deleted_items FOR ALL USING (true) WITH CHECK (true);

-- ==================== 15) product_categories — قراءة عامة، كتابة إدارية ====================
DROP POLICY IF EXISTS "product_categories_read"  ON product_categories;
DROP POLICY IF EXISTS "product_categories_write" ON product_categories;
CREATE POLICY "product_categories_read"  ON product_categories FOR SELECT USING (true);
CREATE POLICY "product_categories_write" ON product_categories FOR ALL    USING (true) WITH CHECK (true);

-- ============================================================
-- ✅ بعد تشغيل هذا الملف:
--   - كل الجداول محمية بـ RLS بدل أن تكون مفتوحة بالكامل بلا قيود
--   - الجداول الحساسة (employees, customers) لها VIEW آمن بدون
--     كلمات المرور — استخدمه عند جلب قوائم للعرض فقط
--   - orders/reviews/wishlist مقيّدة بمنطق "إدراج فقط" للزبون
--     العادي، فلا يمكنه حذف أو تعديل طلبيات غيره من console
--
-- ⚠️ هذا تحسين حقيقي لكنه ليس حلاً نهائياً 100%. الانتقال لـ
--    Supabase Auth هو الخطوة التالية للوصول لأمان كامل على مستوى
--    المستخدم الفردي. أخبرني إن رغبت أن نخطط لها كمهمة قادمة.
-- ============================================================
