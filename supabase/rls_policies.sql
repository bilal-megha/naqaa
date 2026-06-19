-- ============================================================
-- rls_policies.sql — نقاء v8
-- سياسات أمان Row Level Security لكل جداول Supabase
--
-- طريقة التطبيق:
--   1. افتح Supabase Dashboard → SQL Editor
--   2. انسخ هذا الملف كاملاً وشغّله
--
-- المنطق المعتمد:
--   • الزبائن (anon)      : قراءة عامة + كتابة محدودة (طلبات، مراجعات)
--   • الـ service_role    : صلاحية كاملة (مستخدم من لوحة الإدارة)
--   • authenticated       : صلاحية كاملة (موظفون مسجّلون)
-- ============================================================

-- ── 0. دالة مساعدة: هل المستخدم لديه دور معيّن؟ ──────────
CREATE OR REPLACE FUNCTION is_admin_or_service()
RETURNS boolean AS $$
  SELECT current_setting('role') = 'service_role'
      OR auth.role() = 'authenticated';
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ════════════════════════════════════════════════════════════
-- جداول القراءة العامة (الزبائن يقرأون، الإدارة تكتب)
-- ════════════════════════════════════════════════════════════

-- ── products ────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: قراءة عامة للزبائن"
  ON products FOR SELECT
  USING (disabled IS NOT TRUE);

CREATE POLICY "products: إدارة كاملة للمشرفين"
  ON products FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── categories ──────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: قراءة عامة"
  ON categories FOR SELECT USING (true);

CREATE POLICY "categories: إدارة للمشرفين"
  ON categories FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── brands ──────────────────────────────────────────────────
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brands: قراءة عامة"
  ON brands FOR SELECT USING (true);

CREATE POLICY "brands: إدارة للمشرفين"
  ON brands FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── promotions ──────────────────────────────────────────────
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions: قراءة العروض النشطة"
  ON promotions FOR SELECT
  USING (active = true
    AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "promotions: إدارة للمشرفين"
  ON promotions FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── coupons ─────────────────────────────────────────────────
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons: قراءة للتحقق من الكود فقط"
  ON coupons FOR SELECT
  USING (active = true);

CREATE POLICY "coupons: إدارة للمشرفين"
  ON coupons FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── settings ────────────────────────────────────────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings: قراءة عامة للإعدادات العامة"
  ON settings FOR SELECT
  USING (key NOT IN (
    'admin_password_hash',
    'two_fa_secret',
    'smtp_password',
    'api_keys'
  ));

CREATE POLICY "settings: إدارة للمشرفين"
  ON settings FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ════════════════════════════════════════════════════════════
-- جداول الزبائن (كتابة عامة مع قيود)
-- ════════════════════════════════════════════════════════════

-- ── orders ──────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: إضافة طلب جديد (زبون)"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "orders: قراءة طلب بالهاتف (زبون)"
  ON orders FOR SELECT
  USING (
    -- الزبون يرى طلباته فقط عبر رقم هاتفه
    customer_phone = current_setting('app.customer_phone', true)
    OR is_admin_or_service()
  );

CREATE POLICY "orders: إدارة كاملة للمشرفين"
  ON orders FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── customers ───────────────────────────────────────────────
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers: تسجيل حساب جديد"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "customers: قراءة بياناته الشخصية فقط"
  ON customers FOR SELECT
  USING (
    id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  );

CREATE POLICY "customers: تحديث بياناته الشخصية"
  ON customers FOR UPDATE
  USING (
    id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  )
  WITH CHECK (
    id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  );

CREATE POLICY "customers: حذف للمشرفين فقط"
  ON customers FOR DELETE
  USING (is_admin_or_service());

-- ── reviews ─────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews: قراءة عامة"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "reviews: إضافة تقييم (زبون مسجّل)"
  ON reviews FOR INSERT
  WITH CHECK (
    customer_id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  );

CREATE POLICY "reviews: إدارة للمشرفين"
  ON reviews FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── wishlist ─────────────────────────────────────────────────
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist: قراءة المفضلة الشخصية"
  ON wishlist FOR SELECT
  USING (
    customer_id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  );

CREATE POLICY "wishlist: إضافة للمفضلة"
  ON wishlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "wishlist: حذف من المفضلة"
  ON wishlist FOR DELETE
  USING (
    customer_id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  );


-- ════════════════════════════════════════════════════════════
-- جداول الإدارة الداخلية (مشرفون فقط)
-- ════════════════════════════════════════════════════════════

-- ── employees ───────────────────────────────────────────────
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees: مشرفون فقط"
  ON employees FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── suppliers ───────────────────────────────────────────────
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers: مشرفون فقط"
  ON suppliers FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── purchases ────────────────────────────────────────────────
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases: مشرفون فقط"
  ON purchases FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── expenses ────────────────────────────────────────────────
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: مشرفون فقط"
  ON expenses FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── notifications ───────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: قراءة للزبائن المستهدفين"
  ON notifications FOR SELECT USING (true);

CREATE POLICY "notifications: إدارة للمشرفين"
  ON notifications FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- ── activity_log ────────────────────────────────────────────
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log: كتابة للجميع (تسجيل)"
  ON activity_log FOR INSERT WITH CHECK (true);

CREATE POLICY "activity_log: قراءة للمشرفين فقط"
  ON activity_log FOR SELECT
  USING (is_admin_or_service());

-- ── product_categories ──────────────────────────────────────
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories: قراءة عامة"
  ON product_categories FOR SELECT USING (true);

CREATE POLICY "product_categories: إدارة للمشرفين"
  ON product_categories FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ════════════════════════════════════════════════════════════
-- جدول deleted_items (سلة المهملات)
-- ════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'deleted_items'
  ) THEN
    EXECUTE 'ALTER TABLE deleted_items ENABLE ROW LEVEL SECURITY';
    EXECUTE $policy$
      CREATE POLICY "deleted_items: مشرفون فقط"
        ON deleted_items FOR ALL
        USING (is_admin_or_service())
        WITH CHECK (is_admin_or_service())
    $policy$;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════
-- تحديث جدول employees: حقل password_hash آمن
-- ════════════════════════════════════════════════════════════
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS password_algo text DEFAULT 'bcrypt';

-- تعليق توضيحي: كلمة المرور الجديدة تُخزَّن كـ bcrypt hash
-- الحقل القديم 'password' يُبقى مؤقتاً للتوافق ثم يُحذف في v9
COMMENT ON COLUMN employees.password_hash
  IS 'bcrypt hash — يستبدل حقل password النصي القديم';

COMMENT ON COLUMN employees.password_algo
  IS 'خوارزمية التشفير: bcrypt (افتراضي) أو sha256 (قديم)';
