-- ============================================================
-- rls_policies.sql — نقاء v8 (نسخة مصحّحة)
-- 
-- ✅ الأعمدة مطابقة للـ schema الحقيقي:
--    orders.phone (ليس customer_phone)
--    customers.id (bigint)
-- ✅ جداول قد لا توجد (wishlist, reviews) محمية بـ DO $$
-- ✅ كل policy محمية بـ DROP IF EXISTS قبل الإنشاء
--
-- طريقة التطبيق:
--   Supabase Dashboard → SQL Editor → شغّل هذا الملف كاملاً
-- ============================================================


-- ══════════════════════════════════════════════════════════
-- 0. دالة مساعدة: هل الطلب من service_role أو مستخدم مُسجَّل؟
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION is_admin_or_service()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    current_setting('role', true) = 'service_role'
    OR (auth.role() IS NOT NULL AND auth.role() = 'authenticated');
$$;


-- ══════════════════════════════════════════════════════════
-- 1. products — قراءة عامة، كتابة للمشرفين
-- ══════════════════════════════════════════════════════════
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public"  ON products;
DROP POLICY IF EXISTS "products_all_admin"       ON products;

CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (disabled IS NOT TRUE);

CREATE POLICY "products_all_admin"
  ON products FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 2. categories
-- ══════════════════════════════════════════════════════════
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON categories;
DROP POLICY IF EXISTS "categories_all_admin"     ON categories;

CREATE POLICY "categories_select_public"
  ON categories FOR SELECT USING (true);

CREATE POLICY "categories_all_admin"
  ON categories FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 3. brands
-- ══════════════════════════════════════════════════════════
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_select_public" ON brands;
DROP POLICY IF EXISTS "brands_all_admin"     ON brands;

CREATE POLICY "brands_select_public"
  ON brands FOR SELECT USING (true);

CREATE POLICY "brands_all_admin"
  ON brands FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 4. promotions — عرض النشطة فقط
-- ══════════════════════════════════════════════════════════
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_select_active" ON promotions;
DROP POLICY IF EXISTS "promotions_all_admin"     ON promotions;

CREATE POLICY "promotions_select_active"
  ON promotions FOR SELECT
  USING (
    active = true
    AND (end_date IS NULL OR end_date::timestamptz > now())
  );

CREATE POLICY "promotions_all_admin"
  ON promotions FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 5. coupons — قراءة النشطة للتحقق
-- ══════════════════════════════════════════════════════════
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select_active" ON coupons;
DROP POLICY IF EXISTS "coupons_all_admin"     ON coupons;

CREATE POLICY "coupons_select_active"
  ON coupons FOR SELECT
  USING (active IS NOT FALSE);

CREATE POLICY "coupons_all_admin"
  ON coupons FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 6. settings — قراءة عامة ماعدا الحقول السرية
-- ══════════════════════════════════════════════════════════
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_public" ON settings;
DROP POLICY IF EXISTS "settings_all_admin"     ON settings;

CREATE POLICY "settings_select_public"
  ON settings FOR SELECT
  USING (
    key NOT IN (
      'admin_password_hash',
      'two_fa_secret',
      'smtp_password',
      'api_keys',
      'secret_key'
    )
  );

CREATE POLICY "settings_all_admin"
  ON settings FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 7. orders
--    ✅ العمود الصحيح: phone (وليس customer_phone)
-- ══════════════════════════════════════════════════════════
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_insert_public"  ON orders;
DROP POLICY IF EXISTS "orders_select_own"     ON orders;
DROP POLICY IF EXISTS "orders_all_admin"      ON orders;

-- أي زبون يمكنه تقديم طلب جديد
CREATE POLICY "orders_insert_public"
  ON orders FOR INSERT
  WITH CHECK (true);

-- الزبون يرى طلباته عبر رقم هاتفه
-- المشرف يرى الكل
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (
    phone = current_setting('app.customer_phone', true)
    OR is_admin_or_service()
  );

CREATE POLICY "orders_all_admin"
  ON orders FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 8. customers
--    ✅ العمود الصحيح: id (bigint)
-- ══════════════════════════════════════════════════════════
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_insert_public"  ON customers;
DROP POLICY IF EXISTS "customers_select_own"     ON customers;
DROP POLICY IF EXISTS "customers_update_own"     ON customers;
DROP POLICY IF EXISTS "customers_delete_admin"   ON customers;

CREATE POLICY "customers_insert_public"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "customers_select_own"
  ON customers FOR SELECT
  USING (
    id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  );

CREATE POLICY "customers_update_own"
  ON customers FOR UPDATE
  USING (
    id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  )
  WITH CHECK (
    id::text = current_setting('app.customer_id', true)
    OR is_admin_or_service()
  );

CREATE POLICY "customers_delete_admin"
  ON customers FOR DELETE
  USING (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 9. جداول الإدارة الداخلية — مشرفون فقط
-- ══════════════════════════════════════════════════════════

-- employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_all_admin" ON employees;
CREATE POLICY "employees_all_admin"
  ON employees FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_all_admin" ON suppliers;
CREATE POLICY "suppliers_all_admin"
  ON suppliers FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchases_all_admin" ON purchases;
CREATE POLICY "purchases_all_admin"
  ON purchases FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_all_admin" ON expenses;
CREATE POLICY "expenses_all_admin"
  ON expenses FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_public" ON notifications;
DROP POLICY IF EXISTS "notifications_all_admin"     ON notifications;
CREATE POLICY "notifications_select_public"
  ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_all_admin"
  ON notifications FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());

-- activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_log_insert_all"   ON activity_log;
DROP POLICY IF EXISTS "activity_log_select_admin" ON activity_log;
CREATE POLICY "activity_log_insert_all"
  ON activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "activity_log_select_admin"
  ON activity_log FOR SELECT
  USING (is_admin_or_service());

-- product_categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_categories_select_public" ON product_categories;
DROP POLICY IF EXISTS "product_categories_all_admin"     ON product_categories;
CREATE POLICY "product_categories_select_public"
  ON product_categories FOR SELECT USING (true);
CREATE POLICY "product_categories_all_admin"
  ON product_categories FOR ALL
  USING (is_admin_or_service())
  WITH CHECK (is_admin_or_service());


-- ══════════════════════════════════════════════════════════
-- 10. جداول اختيارية — محمية بـ DO $$ IF EXISTS $$
--     (wishlist, reviews, deleted_items, orders_archive)
-- ══════════════════════════════════════════════════════════

DO $$
BEGIN

  -- ── reviews ────────────────────────────────────────────
  IF EXISTS (
    SELECT FROM information_schema.tables WHERE table_name = 'reviews'
  ) THEN
    EXECUTE 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "reviews_select_public" ON reviews';
    EXECUTE 'DROP POLICY IF EXISTS "reviews_insert_own"    ON reviews';
    EXECUTE 'DROP POLICY IF EXISTS "reviews_all_admin"     ON reviews';
    EXECUTE $p$
      CREATE POLICY "reviews_select_public"
        ON reviews FOR SELECT USING (true)
    $p$;
    EXECUTE $p$
      CREATE POLICY "reviews_insert_own"
        ON reviews FOR INSERT
        WITH CHECK (
          customer_id::text = current_setting('app.customer_id', true)
          OR current_setting('role', true) = 'service_role'
        )
    $p$;
    EXECUTE $p$
      CREATE POLICY "reviews_all_admin"
        ON reviews FOR ALL
        USING (is_admin_or_service())
        WITH CHECK (is_admin_or_service())
    $p$;
  END IF;

  -- ── wishlist ───────────────────────────────────────────
  IF EXISTS (
    SELECT FROM information_schema.tables WHERE table_name = 'wishlist'
  ) THEN
    EXECUTE 'ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "wishlist_select_own" ON wishlist';
    EXECUTE 'DROP POLICY IF EXISTS "wishlist_insert_all" ON wishlist';
    EXECUTE 'DROP POLICY IF EXISTS "wishlist_delete_own" ON wishlist';
    EXECUTE $p$
      CREATE POLICY "wishlist_select_own"
        ON wishlist FOR SELECT
        USING (
          customer_id::text = current_setting('app.customer_id', true)
          OR current_setting('role', true) = 'service_role'
        )
    $p$;
    EXECUTE $p$
      CREATE POLICY "wishlist_insert_all"
        ON wishlist FOR INSERT WITH CHECK (true)
    $p$;
    EXECUTE $p$
      CREATE POLICY "wishlist_delete_own"
        ON wishlist FOR DELETE
        USING (
          customer_id::text = current_setting('app.customer_id', true)
          OR current_setting('role', true) = 'service_role'
        )
    $p$;
  END IF;

  -- ── deleted_items ──────────────────────────────────────
  IF EXISTS (
    SELECT FROM information_schema.tables WHERE table_name = 'deleted_items'
  ) THEN
    EXECUTE 'ALTER TABLE deleted_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "deleted_items_all_admin" ON deleted_items';
    EXECUTE $p$
      CREATE POLICY "deleted_items_all_admin"
        ON deleted_items FOR ALL
        USING (is_admin_or_service())
        WITH CHECK (is_admin_or_service())
    $p$;
  END IF;

  -- ── orders_archive ─────────────────────────────────────
  IF EXISTS (
    SELECT FROM information_schema.tables WHERE table_name = 'orders_archive'
  ) THEN
    EXECUTE 'ALTER TABLE orders_archive ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "orders_archive_all_admin" ON orders_archive';
    EXECUTE $p$
      CREATE POLICY "orders_archive_all_admin"
        ON orders_archive FOR ALL
        USING (is_admin_or_service())
        WITH CHECK (is_admin_or_service())
    $p$;
  END IF;

END $$;


-- ══════════════════════════════════════════════════════════
-- 11. تحديث جدول employees: حقل password_hash
--     (آمن — يتجاهل إذا كان موجوداً)
-- ══════════════════════════════════════════════════════════
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS password_algo text DEFAULT 'bcrypt';

-- ══════════════════════════════════════════════════════════
-- ✅ انتهى التطبيق — تحقق بتشغيل:
--    SELECT tablename, rowsecurity
--    FROM pg_tables
--    WHERE schemaname = 'public'
--    ORDER BY tablename;
-- ══════════════════════════════════════════════════════════
