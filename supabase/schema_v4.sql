-- ============================================================
-- نقاء v4 — جداول جديدة
-- انسخ والصق في Supabase SQL Editor → Run
-- ============================================================

-- ==================== جدول العروض ====================
CREATE TABLE IF NOT EXISTS promotions (
  id          BIGINT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL, -- 'buy_x_get_y' | 'percent' | 'fixed' | 'tier_discount'
  active      BOOLEAN DEFAULT TRUE,
  start_date  TIMESTAMPTZ DEFAULT NOW(),
  end_date    TIMESTAMPTZ,
  -- للعرض buy_x_get_y
  buy_qty     INT DEFAULT 3,
  get_qty     INT DEFAULT 1,
  -- للخصم
  discount_value DECIMAL(5,2) DEFAULT 0,
  -- المنتجات المشمولة (JSON array of product IDs)
  product_ids JSONB DEFAULT '[]',
  -- الحد الأدنى للشراء
  min_amount  DECIMAL(10,2) DEFAULT 0,
  -- الوصف
  description TEXT,
  -- صورة البانر
  image       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== فئات متعددة للمنتج ====================
CREATE TABLE IF NOT EXISTS product_categories (
  id          BIGINT PRIMARY KEY,
  product_id  BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  UNIQUE(product_id, category_id)
);

-- ==================== تحديث جدول العملاء — إضافة رتبة ====================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'M1';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_purchases DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tier_notes TEXT;

-- ==================== إعدادات الرتب ====================
INSERT INTO settings (key, value) VALUES
('tier_m1_label',   'عميل عادي'),
('tier_m2_label',   'عميل مميز'),
('tier_m3_label',   'عميل VIP'),
('tier_m1_min',     '0'),
('tier_m2_min',     '5000'),
('tier_m3_min',     '20000'),
('tier_m1_discount','0'),
('tier_m2_discount','5'),
('tier_m3_discount','10')
ON CONFLICT (key) DO NOTHING;

-- ==================== صلاحيات ====================
GRANT ALL PRIVILEGES ON TABLE promotions          TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE product_categories  TO anon, authenticated;

ALTER TABLE promotions         DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
