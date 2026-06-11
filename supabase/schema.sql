-- ============================================================
-- نقاء - قاعدة البيانات
-- انسخ هذا الكود كاملاً والصقه في: Supabase > SQL Editor > New query > Run
-- ============================================================

-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== جدول المنتجات ====================
CREATE TABLE IF NOT EXISTS products (
  id          BIGINT PRIMARY KEY,
  name        TEXT NOT NULL,
  price       DECIMAL(10,2) DEFAULT 0,
  cost_price  DECIMAL(10,2) DEFAULT 0,
  carton_price DECIMAL(10,2),
  units       INT DEFAULT 12,
  stock       INT DEFAULT 0,
  sku         TEXT,
  brand_id    BIGINT,
  category_id BIGINT,
  image       TEXT,
  discount    DECIMAL(5,2) DEFAULT 0,
  is_promo    BOOLEAN DEFAULT FALSE,
  disabled    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== جدول الموردين ====================
CREATE TABLE IF NOT EXISTS suppliers (
  id        BIGINT PRIMARY KEY,
  name      TEXT NOT NULL,
  phone     TEXT,
  whatsapp  TEXT,
  email     TEXT,
  address   TEXT,
  image     TEXT
);

-- ==================== جدول العملاء ====================
CREATE TABLE IF NOT EXISTS customers (
  id         BIGINT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE,
  phone      TEXT,
  address    TEXT,
  password   TEXT,
  points     INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== جدول الموظفين ====================
CREATE TABLE IF NOT EXISTS employees (
  id       BIGINT PRIMARY KEY,
  name     TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email    TEXT,
  role     TEXT DEFAULT 'staff'
);

-- إضافة مدير افتراضي (كلمة المرور: admin123)
INSERT INTO employees (id, name, username, password, email, role)
VALUES (1, 'المدير', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831d9676af5c44b3d8b1c3eaa', 'admin@naqaa.com', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ==================== جدول العلامات التجارية ====================
CREATE TABLE IF NOT EXISTS brands (
  id    BIGINT PRIMARY KEY,
  name  TEXT NOT NULL,
  image TEXT
);

INSERT INTO brands (id, name) VALUES
(1, 'Bledina'), (2, 'Bona'), (3, 'Bossa'), (4, 'Lebas Pacha'), (5, 'Riz Asmat')
ON CONFLICT (id) DO NOTHING;

-- ==================== جدول الفئات ====================
CREATE TABLE IF NOT EXISTS categories (
  id    BIGINT PRIMARY KEY,
  name  TEXT NOT NULL,
  image TEXT
);

INSERT INTO categories (id, name) VALUES
(1, 'المواد الغذائية'), (2, 'العناية الشخصية'), (3, 'المشروبات')
ON CONFLICT (id) DO NOTHING;

-- ==================== جدول المشتريات ====================
CREATE TABLE IF NOT EXISTS purchases (
  id            BIGINT PRIMARY KEY,
  supplier_id   BIGINT,
  supplier_name TEXT,
  date          TEXT,
  items         JSONB DEFAULT '[]',
  total         DECIMAL(10,2) DEFAULT 0,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== جدول الطلبيات ====================
CREATE TABLE IF NOT EXISTS orders (
  id               BIGINT PRIMARY KEY,
  customer_name    TEXT,
  customer_phone   TEXT,
  customer_address TEXT,
  date             TEXT,
  items            JSONB DEFAULT '[]',
  total            DECIMAL(10,2) DEFAULT 0,
  status           TEXT DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== جدول الكوبونات ====================
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

-- ==================== جدول الإشعارات ====================
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT PRIMARY KEY,
  title      TEXT,
  body       TEXT,
  date       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== جدول المصاريف ====================
CREATE TABLE IF NOT EXISTS expenses (
  id       BIGINT PRIMARY KEY,
  name     TEXT,
  amount   DECIMAL(10,2) DEFAULT 0,
  date     TEXT,
  category TEXT DEFAULT 'other'
);

-- ==================== جدول التقييمات ====================
CREATE TABLE IF NOT EXISTS reviews (
  id            BIGINT PRIMARY KEY,
  product_id    BIGINT,
  customer_name TEXT,
  rating        INT DEFAULT 5,
  comment       TEXT,
  image         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== جدول سجل النشاطات ====================
CREATE TABLE IF NOT EXISTS activity_log (
  id         BIGINT PRIMARY KEY,
  employee   TEXT,
  action     TEXT,
  details    TEXT,
  date       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== جدول المفضلة ====================
CREATE TABLE IF NOT EXISTS wishlist (
  id         BIGINT PRIMARY KEY,
  product_id BIGINT,
  session_id TEXT
);

-- ==================== جدول الإعدادات ====================
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

INSERT INTO settings (key, value) VALUES
('store_name', 'نقاء'),
('store_currency', 'دج'),
('whatsapp_number', ''),
('free_shipping_threshold', '500'),
('points_rate', '100')
ON CONFLICT (key) DO NOTHING;

-- ==================== صلاحيات القراءة/الكتابة (RLS) ====================
-- تفعيل RLS لكل الجداول
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings      ENABLE ROW LEVEL SECURITY;

-- السماح بكل العمليات للجميع (مناسب للمشروع المبدئي)
CREATE POLICY "allow_all_products"      ON products      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_suppliers"     ON suppliers     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_customers"     ON customers     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_employees"     ON employees     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_brands"        ON brands        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories"    ON categories    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_purchases"     ON purchases     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders"        ON orders        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_coupons"       ON coupons       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_expenses"      ON expenses      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reviews"       ON reviews       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activity_log"  ON activity_log  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_wishlist"      ON wishlist      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings"      ON settings      FOR ALL USING (true) WITH CHECK (true);
