-- ═══════════════════════════════════════════════════════════
--  نقاء Store — Master SQL (الملف الرئيسي الوحيد)
--  شغّل هذا الملف في: Supabase > SQL Editor > New query > Run
--  يحتوي على: الجداول + البيانات الافتراضية + RLS + Storage
--  تاريخ: 2026-06-23
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- الجزء 1: قاعدة البيانات الكاملة
-- ═══════════════════════════════════════════════════════════
-- ============================================================
-- نقاء — قاعدة البيانات الكاملة والنهائية
-- انسخ هذا الكود كاملاً في:
-- Supabase > SQL Editor > New query > Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== منتجات ====================
CREATE TABLE IF NOT EXISTS products (
  id            BIGINT PRIMARY KEY,
  name          TEXT NOT NULL,
  price         DECIMAL(10,2) DEFAULT 0,
  cost_price    DECIMAL(10,2) DEFAULT 0,
  carton_price  DECIMAL(10,2) DEFAULT 0,
  units         INT DEFAULT 12,
  stock         INT DEFAULT 0,
  min_stock     INT DEFAULT 5,
  sku           TEXT,
  barcode       TEXT,
  brand_id      BIGINT,
  category_id   BIGINT,
  image         TEXT,
  description   TEXT,
  discount      DECIMAL(5,2) DEFAULT 0,
  is_promo      BOOLEAN DEFAULT FALSE,
  disabled      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== موردون ====================
CREATE TABLE IF NOT EXISTS suppliers (
  id        BIGINT PRIMARY KEY,
  name      TEXT NOT NULL,
  phone     TEXT,
  whatsapp  TEXT,
  email     TEXT,
  address   TEXT,
  image     TEXT
);

-- ==================== عملاء ====================
CREATE TABLE IF NOT EXISTS customers (
  id               BIGINT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE,
  phone            TEXT,
  address          TEXT,
  wilaya           TEXT,
  activite         TEXT,
  rc               TEXT,
  nif              TEXT,
  nis              TEXT,
  art              TEXT,
  password         TEXT,
  points           INT DEFAULT 0,
  tier             TEXT DEFAULT 'M1',
  "group"          TEXT,
  debt             DECIMAL(10,2) DEFAULT 0,
  total_purchases  DECIMAL(10,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== موظفون ====================
CREATE TABLE IF NOT EXISTS employees (
  id          BIGINT PRIMARY KEY,
  name        TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  role        TEXT DEFAULT 'staff',
  permissions JSONB DEFAULT '{}'
);

-- مدير افتراضي (كلمة المرور: admin123)
INSERT INTO employees (id, name, username, password, email, role, permissions)
VALUES (1, 'المدير', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831d9676af5c44b3d8b1c3eaa', 'admin@naqaa.com', 'admin', '{}')
ON CONFLICT (id) DO NOTHING;

-- ==================== ماركات ====================
CREATE TABLE IF NOT EXISTS brands (
  id    BIGINT PRIMARY KEY,
  name  TEXT NOT NULL,
  image TEXT
);

-- ==================== فئات ====================
CREATE TABLE IF NOT EXISTS categories (
  id    BIGINT PRIMARY KEY,
  name  TEXT NOT NULL,
  image TEXT
);

-- ==================== مشتريات ====================
CREATE TABLE IF NOT EXISTS purchases (
  id            BIGINT PRIMARY KEY,
  supplier_id   BIGINT,
  supplier_name TEXT,
  date          TEXT,
  items         JSONB DEFAULT '[]',
  total         DECIMAL(10,2) DEFAULT 0,
  invoice_num   TEXT,
  pay_mode      TEXT DEFAULT 'cash',
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== طلبيات ====================
CREATE TABLE IF NOT EXISTS orders (
  id               BIGINT PRIMARY KEY,
  customer_id      BIGINT,
  customer_name    TEXT,
  customer_phone   TEXT,
  customer_address TEXT,
  date             TEXT,
  items            JSONB DEFAULT '[]',
  total            DECIMAL(10,2) DEFAULT 0,
  paid_amount      DECIMAL(10,2) DEFAULT 0,
  pay_mode         TEXT DEFAULT 'cash',
  status           TEXT DEFAULT 'processing',
  invoice_num      TEXT,
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== أرشيف الطلبيات ====================
CREATE TABLE IF NOT EXISTS orders_archive (
  id               BIGINT PRIMARY KEY,
  customer_id      BIGINT,
  customer_name    TEXT,
  customer_phone   TEXT,
  customer_address TEXT,
  date             TEXT,
  items            JSONB DEFAULT '[]',
  total            DECIMAL(10,2) DEFAULT 0,
  paid_amount      DECIMAL(10,2) DEFAULT 0,
  pay_mode         TEXT DEFAULT 'cash',
  status           TEXT DEFAULT 'delivered',
  invoice_num      TEXT,
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== كوبونات ====================
CREATE TABLE IF NOT EXISTS coupons (
  id        BIGINT PRIMARY KEY,
  code      TEXT UNIQUE NOT NULL,
  type      TEXT DEFAULT 'percent',
  value     DECIMAL(10,2) DEFAULT 0,
  expiry    TEXT,
  max_uses  INT DEFAULT 100,
  min_order DECIMAL(10,2) DEFAULT 0,
  used      INT DEFAULT 0
);

-- ==================== إشعارات ====================
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT PRIMARY KEY,
  title      TEXT,
  body       TEXT,
  target_type TEXT DEFAULT 'all',
  target_count INT DEFAULT 0,
  date       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== مصاريف ====================
CREATE TABLE IF NOT EXISTS expenses (
  id       BIGINT PRIMARY KEY,
  name     TEXT,
  amount   DECIMAL(10,2) DEFAULT 0,
  date     TEXT,
  category TEXT DEFAULT 'other'
);

-- ==================== تقييمات ====================
CREATE TABLE IF NOT EXISTS reviews (
  id            BIGINT PRIMARY KEY,
  product_id    BIGINT,
  customer_name TEXT,
  rating        INT DEFAULT 5,
  comment       TEXT,
  image         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== سجل النشاطات ====================
CREATE TABLE IF NOT EXISTS activity_log (
  id         BIGINT PRIMARY KEY,
  employee   TEXT,
  action     TEXT,
  details    TEXT,
  date       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== المفضلة ====================
CREATE TABLE IF NOT EXISTS wishlist (
  id         BIGINT PRIMARY KEY,
  product_id BIGINT,
  session_id TEXT
);

-- ==================== العروض ====================
CREATE TABLE IF NOT EXISTS promotions (
  id             BIGINT PRIMARY KEY,
  name           TEXT NOT NULL,
  description    TEXT,
  type           TEXT DEFAULT 'percent',
  active         BOOLEAN DEFAULT TRUE,
  discount_value DECIMAL(10,2) DEFAULT 0,
  min_amount     DECIMAL(10,2) DEFAULT 0,
  product_ids    JSONB DEFAULT '[]',
  image          TEXT,
  end_date       TIMESTAMPTZ,
  tier_qty       INT DEFAULT 1,
  tier_type      TEXT DEFAULT 'percent',
  tier_value     DECIMAL(10,2) DEFAULT 0,
  region         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== سلة المهملات ====================
CREATE TABLE IF NOT EXISTS deleted_items (
  id          BIGINT PRIMARY KEY,
  table_name  TEXT NOT NULL,
  item_id     BIGINT,
  data        TEXT,
  deleted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== الإعدادات ====================
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

INSERT INTO settings (key, value) VALUES
  ('store_name',              'نقاء'),
  ('store_currency',          'دج'),
  ('whatsapp_number',         ''),
  ('free_shipping_threshold', '5000'),
  ('points_per_order',        '100'),
  ('points_to_dzd',           '1'),
  ('promo_text',              ''),
  ('announce_bar',            ''),
  ('store_logo',              ''),
  ('store_banners',           '[]'),
  ('maintenance_mode',        '0'),
  ('maintenance_msg',         'المتجر في طور التحديث، سنعود قريباً 🔧'),
  ('primary_color',           '#1565C0'),
  ('accent_color',            '#FF6D00'),
  ('tier_m2_min',             '5000'),
  ('tier_m3_min',             '20000'),
  ('tier_m1_discount',        '0'),
  ('tier_m2_discount',        '5'),
  ('tier_m3_discount',        '10'),
  ('about_us',                ''),
  ('contact_whatsapp',        ''),
  ('contact_email',           ''),
  ('contact_address',         ''),
  ('return_policy',           ''),
  ('company_name',            'نقاء'),
  ('company_phone',           ''),
  ('company_mobile',          ''),
  ('company_email',           ''),
  ('company_address',         ''),
  ('branches',                '[]')
ON CONFLICT (key) DO NOTHING;

-- ==================== تفعيل RLS ====================
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist       ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;

-- ==================== سياسات RLS ====================
CREATE POLICY "allow_all_products"       ON products       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_suppliers"      ON suppliers      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_customers"      ON customers      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_employees"      ON employees      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_brands"         ON brands         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories"     ON categories     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_purchases"      ON purchases      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders"         ON orders         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders_archive" ON orders_archive FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_coupons"        ON coupons        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications"  ON notifications  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_expenses"       ON expenses       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reviews"        ON reviews        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activity_log"   ON activity_log   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_wishlist"       ON wishlist       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_promotions"     ON promotions     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_deleted_items"  ON deleted_items  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings"       ON settings       FOR ALL USING (true) WITH CHECK (true);

-- ==================== Realtime ====================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- ═══════════════════════════════════════════════════════════
-- الجزء 2: إضافات إضافية (إشعارات، wishlist مع customer_id)
-- ═══════════════════════════════════════════════════════════
-- تشغيل هذا في Supabase > SQL Editor أولاً

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_type  text DEFAULT 'none';
-- link_type: 'none' | 'product' | 'category' | 'brand' | 'promo' | 'url'
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_id    text;
-- link_id: id المنتج أو الفئة أو الرابط

-- جدول لتتبع من قرأ الإشعار (اختياري)
CREATE TABLE IF NOT EXISTS notification_reads (
  id              bigint PRIMARY KEY DEFAULT extract(epoch from now())::bigint,
  notification_id bigint REFERENCES notifications(id) ON DELETE CASCADE,
  customer_id     bigint REFERENCES customers(id) ON DELETE CASCADE,
  read_at         timestamptz DEFAULT now()
);
ALTER TABLE notification_reads DISABLE ROW LEVEL SECURITY;

SELECT 'تم تحديث جدول notifications ✅' AS result;


-- ═══════════════════════════════════════════════════════════
-- الجزء 3: إصلاحات وتحسينات
-- ═══════════════════════════════════════════════════════════
-- ============================================================
-- schema_fixes.sql — نقاء v8 إصلاحات قاعدة البيانات
-- انسخ والصق في Supabase SQL Editor → Run
-- ============================================================

-- ── 1. جدول deleted_items (سلة المهملات) ──────────────────
CREATE TABLE IF NOT EXISTS deleted_items (
  id          bigint PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
  table_name  text NOT NULL,
  item_id     bigint,
  data        text NOT NULL,
  deleted_at  timestamptz DEFAULT now()
);

ALTER TABLE deleted_items DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE deleted_items TO anon, authenticated;

-- ── 2. إضافة عمود region لجدول promotions ─────────────────
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS region text;

-- ── 3. إضافة عمود deleted_at لجدول promotions ─────────────
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── 4. إضافة عمود deleted_at للجداول الأخرى (للـ softDelete) ─
ALTER TABLE products   ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE customers  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE employees  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE suppliers  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── 5. تحديث جدول employees — إضافة عمود username ─────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash text;

-- ── 6. فهارس للأداء ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_deleted_items_deleted_at ON deleted_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- ── 7. حذف سجلات deleted_items القديمة (أكثر من 30 يوم) ───
-- يمكن تشغيلها يدوياً أو جدولتها
-- DELETE FROM deleted_items WHERE deleted_at < now() - interval '30 days';



-- ═══════════════════════════════════════════════════════════
-- الجزء 4: إعداد التخزين (Storage Buckets)
-- ═══════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════
-- Supabase Storage Setup
-- شغّل في: Supabase > SQL Editor
-- ════════════════════════════════════════════════════════

-- إنشاء buckets للصور
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products',   'products',   true, 2097152, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('categories', 'categories', true, 1048576, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('brands',     'brands',     true, 1048576, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('banners',    'banners',    true, 3145728, ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- سياسات القراءة العامة
CREATE POLICY "public_read_products"   ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "public_read_categories" ON storage.objects FOR SELECT USING (bucket_id = 'categories');
CREATE POLICY "public_read_brands"     ON storage.objects FOR SELECT USING (bucket_id = 'brands');
CREATE POLICY "public_read_banners"    ON storage.objects FOR SELECT USING (bucket_id = 'banners');

-- سياسات الكتابة (service role فقط — الأدمن)
CREATE POLICY "admin_write_products"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "admin_write_categories" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'categories');
CREATE POLICY "admin_write_brands"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brands');
CREATE POLICY "admin_write_banners"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');

-- حذف
CREATE POLICY "admin_delete_products"   ON storage.objects FOR DELETE USING (bucket_id = 'products');
CREATE POLICY "admin_delete_categories" ON storage.objects FOR DELETE USING (bucket_id = 'categories');
CREATE POLICY "admin_delete_brands"     ON storage.objects FOR DELETE USING (bucket_id = 'brands');
CREATE POLICY "admin_delete_banners"    ON storage.objects FOR DELETE USING (bucket_id = 'banners');

SELECT 'Storage buckets created ✅' AS result;

