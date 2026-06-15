-- ═══════════════════════════════════════════════════════════
--  نقاء — Schema الكامل v6
--  شغّل هذا الملف كاملاً في Supabase SQL Editor
--  يحذف القديم ويُنشئ كل شيء من جديد بشكل صحيح
-- ═══════════════════════════════════════════════════════════

-- ── 1. إيقاف RLS على كل الجداول (مطلوب للمشاريع البسيطة) ──
-- سنُعيد تفعيله فقط للجداول الحساسة لاحقاً

-- ── 2. إنشاء الجداول ──

-- الإعدادات
CREATE TABLE IF NOT EXISTS settings (
  key   text PRIMARY KEY,
  value text
);

-- الفئات
CREATE TABLE IF NOT EXISTS categories (
  id    bigint PRIMARY KEY,
  name  text NOT NULL,
  image text
);

-- العلامات التجارية
CREATE TABLE IF NOT EXISTS brands (
  id    bigint PRIMARY KEY,
  name  text NOT NULL,
  image text
);

-- الموردون
CREATE TABLE IF NOT EXISTS suppliers (
  id      bigint PRIMARY KEY,
  name    text NOT NULL,
  phone   text,
  address text,
  email   text
);

-- الموظفون
CREATE TABLE IF NOT EXISTS employees (
  id          bigint PRIMARY KEY,
  name        text NOT NULL,
  username    text UNIQUE,
  password    text,
  email       text,
  role        text DEFAULT 'staff',
  permissions text DEFAULT '[]',
  created_at  timestamptz DEFAULT now()
);

-- العملاء
CREATE TABLE IF NOT EXISTS customers (
  id               bigint PRIMARY KEY,
  name             text NOT NULL,
  phone            text,
  email            text,
  address          text,
  password         text,
  password_hash    text,
  tier             text DEFAULT 'M1',
  total_purchases  numeric DEFAULT 0,
  points           integer DEFAULT 0,
  otp_code         text,
  otp_expiry       timestamptz,
  last_purchase    timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- المنتجات
CREATE TABLE IF NOT EXISTS products (
  id           bigint PRIMARY KEY,
  name         text NOT NULL,
  price        numeric DEFAULT 0,
  cost_price   numeric DEFAULT 0,
  carton_price numeric,
  units        integer DEFAULT 12,
  stock        integer DEFAULT 0,
  min_stock    integer DEFAULT 5,
  sku          text,
  brand_id     bigint REFERENCES brands(id) ON DELETE SET NULL,
  image        text,
  is_promo     boolean DEFAULT false,
  discount     numeric DEFAULT 0,
  description  text,
  disabled     boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- ربط المنتجات بالفئات (many-to-many)
CREATE TABLE IF NOT EXISTS product_categories (
  id          bigint PRIMARY KEY,
  product_id  bigint REFERENCES products(id) ON DELETE CASCADE,
  category_id bigint REFERENCES categories(id) ON DELETE CASCADE
);

-- العروض
CREATE TABLE IF NOT EXISTS promotions (
  id             bigint PRIMARY KEY,
  name           text NOT NULL,
  type           text DEFAULT 'percent',
  active         boolean DEFAULT true,
  discount_value numeric DEFAULT 0,
  buy_qty        integer DEFAULT 3,
  get_qty        integer DEFAULT 1,
  product_ids    text DEFAULT '[]',
  brand_ids      text DEFAULT '[]',
  min_amount     numeric DEFAULT 0,
  description    text,
  image          text,
  end_date       timestamptz,
  tier_type      text DEFAULT 'percent',
  tier_value     numeric DEFAULT 0,
  tier_qty       integer DEFAULT 1,
  created_at     timestamptz DEFAULT now()
);

-- الكوبونات
CREATE TABLE IF NOT EXISTS coupons (
  id        bigint PRIMARY KEY,
  code      text UNIQUE NOT NULL,
  type      text DEFAULT 'percent',
  value     numeric DEFAULT 0,
  min_order numeric DEFAULT 0,
  uses      integer DEFAULT 0,
  max_uses  integer,
  active    boolean DEFAULT true
);

-- المشتريات
CREATE TABLE IF NOT EXISTS purchases (
  id            bigint PRIMARY KEY,
  supplier_id   bigint,
  supplier_name text,
  date          text,
  items         text DEFAULT '[]',
  total         numeric DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- الطلبيات
CREATE TABLE IF NOT EXISTS orders (
  id              bigint PRIMARY KEY,
  customer_id     bigint,
  customer_name   text,
  phone           text,
  address         text,
  note            text,
  items           text DEFAULT '[]',
  total           numeric DEFAULT 0,
  status          text DEFAULT 'pending',
  coupon_code     text,
  discount        numeric DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- أرشيف الطلبيات
CREATE TABLE IF NOT EXISTS orders_archive (
  id              bigint PRIMARY KEY,
  customer_id     bigint,
  customer_name   text,
  phone           text,
  address         text,
  note            text,
  items           text DEFAULT '[]',
  total           numeric DEFAULT 0,
  status          text DEFAULT 'delivered',
  created_at      timestamptz
);

-- المصاريف
CREATE TABLE IF NOT EXISTS expenses (
  id          bigint PRIMARY KEY,
  name        text NOT NULL,
  amount      numeric DEFAULT 0,
  category    text,
  date        text,
  note        text,
  created_at  timestamptz DEFAULT now()
);

-- الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id           bigint PRIMARY KEY,
  title        text,
  body         text,
  target_type  text DEFAULT 'all',
  target_count integer DEFAULT 0,
  is_read      boolean DEFAULT false,
  date         text,
  created_at   timestamptz DEFAULT now()
);

-- سجل النشاطات
CREATE TABLE IF NOT EXISTS activity_log (
  id         bigint PRIMARY KEY,
  user       text,
  action     text,
  details    text,
  created_at timestamptz DEFAULT now()
);

-- تقييمات المنتجات
CREATE TABLE IF NOT EXISTS reviews (
  id            bigint PRIMARY KEY,
  product_id    bigint REFERENCES products(id) ON DELETE CASCADE,
  customer_id   bigint,
  customer_name text,
  rating        integer CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz DEFAULT now()
);

-- المفضلة (مرتبطة بالعميل)
CREATE TABLE IF NOT EXISTS wishlist (
  id          bigint PRIMARY KEY,
  customer_id bigint NOT NULL,
  product_id  bigint NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- ── 3. تعطيل RLS على كل الجداول ──
ALTER TABLE settings           DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories         DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands             DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees          DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers          DISABLE ROW LEVEL SECURITY;
ALTER TABLE products           DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions         DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons            DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases          DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders             DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders_archive     DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses           DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log       DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist           DISABLE ROW LEVEL SECURITY;

-- ── 4. منح صلاحيات كاملة ──
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ── 5. إعدادات افتراضية للمتجر ──
INSERT INTO settings (key, value) VALUES
  ('store_name',              'نقاء'),
  ('store_currency',          'دج'),
  ('whatsapp_number',         '213696668065'),
  ('contact_whatsapp',        '213696668065'),
  ('free_shipping_threshold', '5000'),
  ('shipping_cost',           '500'),
  ('announce_bar',            '🎉 توصيل مجاني على الطلبات فوق 5000 دج'),
  ('maintenance_mode',        '0'),
  ('maintenance_msg',         'المتجر في طور التحديث، سنعود قريباً 🔧'),
  ('contact_hours',           'من 8 صباحاً إلى 10 مساءً'),
  ('terms_text',              '1. الطلب بالكارتون الكامل فقط.
2. يُعدّ الطلب مؤكداً بعد التأكيد عبر واتساب.
3. التوصيل خلال 24-48 ساعة.
4. الاسترجاع خلال 24 ساعة في حالة عيوب مصنعية.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ── 6. إضافة الأعمدة المفقودة (للجداول القديمة الموجودة) ──
ALTER TABLE products       ADD COLUMN IF NOT EXISTS disabled     boolean DEFAULT false;
ALTER TABLE products       ADD COLUMN IF NOT EXISTS min_stock    integer DEFAULT 5;
ALTER TABLE products       ADD COLUMN IF NOT EXISTS description  text;
ALTER TABLE products       ADD COLUMN IF NOT EXISTS carton_price numeric;
ALTER TABLE products       ADD COLUMN IF NOT EXISTS cost_price   numeric DEFAULT 0;
ALTER TABLE products       ADD COLUMN IF NOT EXISTS units        integer DEFAULT 12;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS points       integer DEFAULT 0;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS otp_code     text;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS otp_expiry   timestamptz;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS last_purchase timestamptz;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS total_purchases numeric DEFAULT 0;
ALTER TABLE promotions     ADD COLUMN IF NOT EXISTS brand_ids    text DEFAULT '[]';
ALTER TABLE promotions     ADD COLUMN IF NOT EXISTS tier_type    text DEFAULT 'percent';
ALTER TABLE promotions     ADD COLUMN IF NOT EXISTS tier_value   numeric DEFAULT 0;
ALTER TABLE promotions     ADD COLUMN IF NOT EXISTS tier_qty     integer DEFAULT 1;
ALTER TABLE notifications  ADD COLUMN IF NOT EXISTS target_type  text DEFAULT 'all';
ALTER TABLE notifications  ADD COLUMN IF NOT EXISTS target_count integer DEFAULT 0;
ALTER TABLE orders         ADD COLUMN IF NOT EXISTS customer_id  bigint;
ALTER TABLE orders         ADD COLUMN IF NOT EXISTS coupon_code  text;
ALTER TABLE orders         ADD COLUMN IF NOT EXISTS discount     numeric DEFAULT 0;
ALTER TABLE employees      ADD COLUMN IF NOT EXISTS permissions  text DEFAULT '[]';

-- ── 7. تصحيح المنتجات: disabled=NULL → false ──
UPDATE products SET disabled = false WHERE disabled IS NULL;

-- ── 8. نسخ password → password_hash للعملاء القدامى ──
UPDATE customers SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;

