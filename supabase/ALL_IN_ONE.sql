-- ════════════════════════════════════════════════════════
-- شغّل هذا الملف كله دفعة واحدة في Supabase SQL Editor
-- ════════════════════════════════════════════════════════

-- ── 1. RLS Security ──────────────────────────────────
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands        ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_read"    ON products;
DROP POLICY IF EXISTS "cat_read"         ON categories;
DROP POLICY IF EXISTS "brand_read"       ON brands;
DROP POLICY IF EXISTS "settings_read"    ON settings;
DROP POLICY IF EXISTS "notif_read"       ON notifications;
DROP POLICY IF EXISTS "wish_all"         ON wishlist;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "orders_insert"    ON orders;
DROP POLICY IF EXISTS "orders_read"      ON orders;

CREATE POLICY "products_read"    ON products      FOR SELECT USING (true);
CREATE POLICY "products_write"   ON products      FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "cat_read"         ON categories    FOR SELECT USING (true);
CREATE POLICY "brand_read"       ON brands        FOR SELECT USING (true);
CREATE POLICY "settings_read"    ON settings      FOR SELECT USING (true);
CREATE POLICY "settings_write"   ON settings      FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "notif_read"       ON notifications FOR SELECT USING (true);
CREATE POLICY "notif_write"      ON notifications FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "wish_all"         ON wishlist      FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "customers_insert" ON customers     FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_update" ON customers     FOR UPDATE USING (true);
CREATE POLICY "customers_read"   ON customers     FOR SELECT USING (true);
CREATE POLICY "orders_insert"    ON orders        FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_read"      ON orders        FOR SELECT USING (true);
CREATE POLICY "orders_update"    ON orders        FOR UPDATE USING (true);

-- ── 2. product_categories ────────────────────────────
CREATE TABLE IF NOT EXISTS product_categories (
  id          BIGINT PRIMARY KEY,
  product_id  BIGINT REFERENCES products(id)   ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE
);
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pc_all" ON product_categories;
CREATE POLICY "pc_all" ON product_categories FOR ALL USING (true) WITH CHECK (true);

-- ── 3. notifications columns ─────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_type text DEFAULT 'none';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_id   text;

CREATE TABLE IF NOT EXISTS notification_reads (
  id              bigint PRIMARY KEY DEFAULT extract(epoch from now())::bigint,
  notification_id bigint REFERENCES notifications(id) ON DELETE CASCADE,
  customer_id     bigint,
  read_at         timestamptz DEFAULT now()
);
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nr_all" ON notification_reads;
CREATE POLICY "nr_all" ON notification_reads FOR ALL USING (true) WITH CHECK (true);

-- ── 4. Storage buckets ───────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products',   'products',   true, 2097152, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('categories', 'categories', true, 1048576, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('brands',     'brands',     true, 1048576, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('banners',    'banners',    true, 3145728, ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_read"  ON storage.objects;
DROP POLICY IF EXISTS "storage_write" ON storage.objects;
DROP POLICY IF EXISTS "storage_del"   ON storage.objects;
CREATE POLICY "storage_read"  ON storage.objects FOR SELECT USING (bucket_id IN ('products','categories','brands','banners'));
CREATE POLICY "storage_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('products','categories','brands','banners'));
CREATE POLICY "storage_del"   ON storage.objects FOR DELETE USING (bucket_id IN ('products','categories','brands','banners'));

-- ── نتيجة ────────────────────────────────────────────
SELECT 'تم إعداد قاعدة البيانات بنجاح ✅' AS result;
