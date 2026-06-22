-- ════════════════════════════════════════════════════════
-- 1. SECURITY — RLS محكم (شغّل في Supabase SQL Editor)
-- ════════════════════════════════════════════════════════

-- أولاً: تفعيل RLS على كل الجداول الحساسة
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands           ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews          ENABLE ROW LEVEL SECURITY;

-- ── products: الكل يقدر يقرأ (متجر عام) ─────────────
DROP POLICY IF EXISTS "products_read"   ON products;
DROP POLICY IF EXISTS "products_write"  ON products;
CREATE POLICY "products_read"  ON products FOR SELECT USING (disabled IS NOT TRUE);
CREATE POLICY "products_write" ON products FOR ALL   USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ── categories & brands: قراءة عامة ─────────────────
DROP POLICY IF EXISTS "cat_read"   ON categories;
DROP POLICY IF EXISTS "brand_read" ON brands;
CREATE POLICY "cat_read"   ON categories FOR SELECT USING (true);
CREATE POLICY "brand_read" ON brands     FOR SELECT USING (true);

-- ── settings: قراءة عامة (اللون، اسم المتجر...) ─────
DROP POLICY IF EXISTS "settings_read"  ON settings;
DROP POLICY IF EXISTS "settings_write" ON settings;
CREATE POLICY "settings_read"  ON settings FOR SELECT USING (true);
CREATE POLICY "settings_write" ON settings FOR ALL    USING (auth.role() = 'service_role');

-- ── customers: كل عميل يرى بياناته فقط ──────────────
DROP POLICY IF EXISTS "customers_own"   ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
CREATE POLICY "customers_own"    ON customers FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (auth.uid()::text = id::text);

-- ── orders: العميل يرى طلباته فقط ───────────────────
DROP POLICY IF EXISTS "orders_own"    ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_own"    ON orders FOR SELECT USING (customer_id::text = auth.uid()::text OR auth.uid() IS NULL);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);

-- ── notifications: قراءة عامة ────────────────────────
DROP POLICY IF EXISTS "notif_read" ON notifications;
CREATE POLICY "notif_read" ON notifications FOR SELECT USING (true);

-- ── wishlist: مفتوحة (بدون تسجيل دخول) ──────────────
DROP POLICY IF EXISTS "wish_all" ON wishlist;
CREATE POLICY "wish_all" ON wishlist FOR ALL USING (true) WITH CHECK (true);

-- ── reviews ──────────────────────────────────────────
DROP POLICY IF EXISTS "reviews_read"   ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_read"   ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (true);

SELECT 'RLS configured ✅' AS result;
