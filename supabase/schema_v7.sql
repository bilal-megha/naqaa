-- =====================================================
-- جداول إضافية لنظام نقاء (Naqaa)
-- =====================================================

-- 1. جدول صلاحيات الموظفين
CREATE TABLE IF NOT EXISTS employee_permissions (
  id BIGINT PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  page_id VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. جدول نقاط الولاء
CREATE TABLE IF NOT EXISTS loyalty_points (
  id BIGINT PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  total_earned INT DEFAULT 0,
  total_redeemed INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. جدول سجل النقاط
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id BIGINT PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  points INT NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. جدول الخصومات المستبدلة
CREATE TABLE IF NOT EXISTS redeemed_discounts (
  id BIGINT PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount INT NOT NULL,
  points_used INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. جدول الطلبات السريعة المؤقتة
CREATE TABLE IF NOT EXISTS quick_order_temp (
  id BIGINT PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(255),
  quantity INT DEFAULT 1,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. إضافة أعمدة للعملاء
ALTER TABLE customers ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tier VARCHAR(10) DEFAULT 'M1';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_purchases DECIMAL(10,2) DEFAULT 0;

-- 7. إضافة عمود المخزون للمنتجات
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INT DEFAULT 5;

-- 8. إضافة عمود الصلاحيات للموظفين
ALTER TABLE employees ADD COLUMN IF NOT EXISTS permissions JSON DEFAULT '[]';

-- 9. إضافة إعدادات المتجر (الصيغة الصحيحة لـ JSON)
INSERT INTO settings (key, value) VALUES 
  ('return_policy', 'يمكن للعميل استرجاع المنتج خلال 14 يوم من الاستلام بشرط أن يكون بحالته الأصلية.\n\nشروط الاسترجاع:\n• المنتج بدون استخدام\n• مع الفاتورة الأصلية\n• خلال 14 يوم'),
  ('faq', '[{"q":"ما هو الحد الأدنى للطلب؟","a":"الحد الأدنى للطلب هو 1000 دج"},{"q":"كم تكلفة التوصيل؟","a":"تكلفة التوصيل 200 دج، مجاني للطلبات فوق 500 دج"},{"q":"كيف أتتبع طلبي؟","a":"يمكنك تتبع طلبك من خلال قسم \"تتبع الطلب\" في القائمة الرئيسية"}]'),
  ('terms_conditions', 'شروط وأحكام متجر نقاء...'),
  ('loyalty_rate', '100'),
  ('loyalty_discount_rate', '10')
ON CONFLICT (key) DO NOTHING;

-- 10. إضافة صفحات الإدارة للصلاحيات (صيغة JSON صحيحة)
INSERT INTO settings (key, value) VALUES ('admin_pages', '[
  {"id":"dashboard","label":"لوحة القيادة","icon":"📊"},
  {"id":"products","label":"المنتجات","icon":"📦"},
  {"id":"categories","label":"الفئات","icon":"📂"},
  {"id":"brands","label":"العلامات التجارية","icon":"🏷️"},
  {"id":"suppliers","label":"الموردون","icon":"🏭"},
  {"id":"customers","label":"العملاء","icon":"👥"},
  {"id":"employees","label":"الموظفون","icon":"👔"},
  {"id":"coupons","label":"الكوبونات","icon":"🎟️"},
  {"id":"purchases","label":"المشتريات","icon":"🛒"},
  {"id":"inventory","label":"المخزون","icon":"🗂️"},
  {"id":"orders","label":"الطلبيات","icon":"📋"},
  {"id":"promotions","label":"العروض","icon":"🎯"},
  {"id":"notifications","label":"الإشعارات","icon":"🔔"},
  {"id":"reports","label":"التقارير","icon":"📈"},
  {"id":"expenses","label":"المصاريف","icon":"💸"},
  {"id":"storeManager","label":"إدارة المتجر","icon":"🎨"},
  {"id":"backup","label":"نسخ احتياطي","icon":"💾"},
  {"id":"settings","label":"الإعدادات","icon":"⚙️"},
  {"id":"about","label":"من نحن","icon":"🏢"},
  {"id":"contact","label":"اتصل بنا","icon":"📞"},
  {"id":"returnPolicy","label":"سياسة الاسترجاع","icon":"🔄"}
]') ON CONFLICT (key) DO NOTHING;

-- 11. حذف سياسات RLS القديمة (إذا كانت موجودة) وإضافتها بشكل صحيح
DROP POLICY IF EXISTS admin_all_employee_permissions ON employee_permissions;
DROP POLICY IF EXISTS customer_view_own_points ON loyalty_points;

-- تفعيل RLS
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeemed_discounts ENABLE ROW LEVEL SECURITY;

-- إضافة السياسات الجديدة (بدون IF NOT EXISTS)
CREATE POLICY admin_all_employee_permissions ON employee_permissions
  FOR ALL USING (true);

CREATE POLICY customer_view_own_points ON loyalty_points
  FOR SELECT USING (auth.uid()::text = customer_id::text);

-- =====================================================
-- عرض جميع الجداول (للتحقق)
-- =====================================================
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;