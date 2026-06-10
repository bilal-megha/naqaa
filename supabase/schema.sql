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

-- ============================================================
-- بيانات المنتجات من CSV (296 منتج)
-- ============================================================

-- علامات تجارية جديدة من CSV
INSERT INTO brands (id, name) VALUES
(10, 'Faderco'),
(11, 'Brilex'),
(12, 'L''Orage'),
(13, 'Force Express'),
(14, 'Amir'),
(15, 'Aigle'),
(16, 'Sidhoum'),
(17, 'Nassah'),
(18, 'Omo (Unilever)'),
(19, 'Hayat'),
(20, 'Canbebe'),
(21, 'Life'),
(22, 'El Hayat'),
(23, 'Wafa'),
(24, 'Sofia'),
(25, 'Hikal')
ON CONFLICT (id) DO NOTHING;

-- فئات جديدة من CSV
INSERT INTO categories (id, name) VALUES
(10, 'منتجات العناية بالأطفال'),
(11, 'مطهرات, غسيل الملابس, تنظيف المنزل'),
(12, 'العناية بالمنزل (مزيل انسداد)'),
(13, 'معطرات الجو'),
(14, 'غسيل الملابس (منعم)'),
(15, 'مطهرات, العناية بالمنزل (حمامات)'),
(16, 'غسيل الملابس (مزيل بقع), العناية بالمنزل'),
(17, 'العناية بالمنزل (حمامات, مزيل كلس)'),
(18, 'العناية بالمنزل (متعدد الأسطح)'),
(19, 'العناية بالمنزل (مزيل شحوم)'),
(20, 'العناية بالمنزل (زجاج)'),
(21, 'مطهرات, غسيل الملابس'),
(22, 'غسيل الأواني'),
(23, 'العناية بالمنزل (أرضيات)'),
(24, 'غسيل الملابس'),
(25, 'مطهرات, العناية بالمنزل'),
(26, 'العناية بالمنزل (أرضيات - رخام)'),
(27, 'العناية بالمنزل (أرضيات - باركيه)'),
(28, 'العناية بالمنزل (أرضيات - سيراميك)'),
(29, 'غسيل الملابس, العناية الشخصية'),
(30, 'مطهرات'),
(31, 'العناية بالمنزل (مزيل كلس)'),
(32, 'العناية بالمنزل (مطبخ)'),
(33, 'العناية بالمنزل (حمامات)'),
(34, 'غسيل الملابس (مزيل بقع)'),
(35, 'العناية بالمنزل (فرن)'),
(36, 'فوط ومحارم ورقية'),
(37, 'منتجات العناية بالأطفال, العناية الشخصية'),
(38, 'ألومنيوم ورق طهي وفليم غذائي'),
(39, 'العناية الشخصية (مناديل مبللة للكبار)'),
(40, 'منتجات العناية بالأطفال (حفاضات كبار)'),
(41, 'العناية الشخصية'),
(42, 'فوط ومحارم ورقية, العناية الشخصية')
ON CONFLICT (id) DO NOTHING;

-- المنتجات
INSERT INTO products (id, name, price, carton_price, units, brand_id, category_id) VALUES
(100, 'AWANE DRY 8', 114, 2052, 18, 10, 10),
(101, 'AWANE ultra fine maxi', 134, 2150, 16, 10, 10),
(102, 'AWANE ULTRA FIN 8', 119, 2146, 18, 10, 10),
(103, 'Aware 3D nuit 7', 114, 2060, 18, 10, 10),
(104, 'Aware maxi confort pack 9', 81, 1950, 24, 10, 10),
(105, 'AWANE NORMAL PACK 10', 81, 1950, 24, 10, 10),
(106, 'awane style normal 9', 84, 1503, 18, 10, 10),
(107, 'awane style longue 8', 84, 1503, 18, 10, 10),
(108, 'awaNe 3D cotton 9', 104, 1870, 18, 10, 10),
(109, 'AWANE 3D EXTRA NIGHT *7P', 131, 2358, 18, 10, 10),
(110, 'awaNe dry nuit 7', 114, 2052, 18, 10, 10),
(111, 'awaNe dry normal 9', 114, 2052, 18, 10, 10),
(112, 'BRILEX Javel Moussant 1.8L', 170, 1020, 6, 11, 11),
(113, 'Brilex Deboucheur Poudre 300g', 220, 3402, 15, 11, 12),
(114, 'BRILEX Javel Moussant 925mL', 98, 1176, 12, 11, 11),
(115, 'Desodorisant L''Orage 750ml', 219, 2628, 12, 12, 13),
(116, 'DESODORISANT L''ORAGE 300ml', 107, 2568, 24, 12, 13),
(117, 'FORCE EXPRESS ADOUCISSANT 3L ROSE', 490, 1960, 4, 13, 14),
(118, 'FORCE EXPRESS ADOUCISSANT 3L BLEU', 490, 1960, 4, 13, 14),
(119, 'FORCE EXPRESS GEL WC DESINFECTANT 650ML', 228, 2736, 12, 13, 15),
(120, 'Force Express Liquide DE Rinçage 430ml', 175, 2100, 12, 13, 14),
(121, 'Force Express Detache Tout 1l', 385, 3465, 9, 13, 16),
(122, 'FORCE EXPRESS GEL WC DETARTRANT 650ML', 222, 2744, 12, 13, 17),
(123, 'Force Express Désodorisant Jasmine De Nuit 430ml', 210, 2520, 12, 13, 13),
(124, 'Force express Multi Surface 300ml', 230, 4600, 20, 13, 18),
(125, 'Force Express Dégraissant professionnel 500ml', 180, 2160, 12, 13, 19),
(126, 'Force Express Turbo Déboucheur 1L', 220, 2640, 12, 13, 12),
(127, 'Force express Lave Vitre 750ml', 175, 2100, 12, 13, 20),
(128, 'Force Express Dégraissant professionnel 1L', 300, 3000, 10, 13, 19),
(129, 'force express multi surface 750ml', 178, 2136, 12, 13, 18),
(130, 'force express adoucissant bouquet floral', 194, 2400, 12, 13, 14),
(131, 'FORCE EXPRESS ADOUCISSANT 3L VERT', 490, 1960, 4, 13, 14),
(132, 'Force Express Désodorisant Fleur D''agrumes 430ml', 210, 2520, 12, 13, 13),
(133, 'Force Express Désodorisant Pétales Blanches 430ml', 210, 2520, 12, 13, 13),
(134, 'Force Express Désodorisant Rosée Matinale 430ml', 210, 2520, 12, 13, 13),
(135, 'Force Press Désodorisant Iris et Lila 430ml', 213, 2556, 12, 13, 13),
(136, 'Force Express Désodorisant Reine de La Nuit 430ml', 210, 2520, 12, 13, 13),
(137, 'Force Express Désodorisant Douceur des roses 430ml', 210, 2520, 12, 13, 13),
(138, 'Force Express Désodorisant Orchidée Blue 430ml', 210, 2520, 12, 13, 13),
(139, 'Force Express Désodorisant Evasion Florale 430ml', 210, 2520, 12, 13, 13),
(140, 'AMIR Javel 1L Moussant', 132, 1320, 10, 14, 21),
(141, 'AMIR VAISSELE 650ML ANTI BACTERIEN', 185, 2220, 12, 14, 22),
(142, 'Amir Lave vitre 450MI', 95, 1140, 12, 14, 20),
(143, 'Amir Lave Sol Rose 1L', 182, 2184, 12, 14, 23),
(144, 'AMIR VAISSELE 650ML MAIN SENSIBLE', 180, 2160, 12, 14, 22),
(145, 'AMIR Javel 2L Moussant', 188, 1128, 6, 14, 21),
(146, 'AMIR Multi Surface 450MI', 135, 1620, 12, 14, 18),
(147, 'AMIR Multi Surface 750MI', 185, 2220, 12, 14, 18),
(148, 'AMIR Javel 2L', 150, 900, 6, 14, 21),
(149, 'AMIR Javel 4L', 245, 980, 4, 14, 21),
(150, 'AMIR Gel Machine 2.5L', 735, 2940, 4, 14, 24),
(151, 'AMIR Gel Machine 1L', 310, 2790, 9, 14, 24),
(152, 'Amir Sani BON soudé VIOLET 850ml', 78, 936, 12, 14, 25),
(153, 'Amir Lave Vitre', 135, 1620, 12, 14, 20),
(154, 'AMIR VAISSELLE 650ML', 165, 1980, 12, 14, 22),
(155, 'Amir Sani Bon océanique 1L', 109, 1308, 12, 14, 25),
(156, 'Amir Sani Bon Lavande 1L', 109, 1308, 12, 14, 25),
(157, 'Amir Sani Bon Rose 1L', 109, 1308, 12, 14, 25),
(158, 'Amir Sani Bon pin 1L', 109, 1308, 12, 14, 25),
(159, 'Amir Lave Sol marbre et granite 1L', 225, 2700, 12, 14, 26),
(160, 'Amir Lave Sol parquet 1L', 243, 2916, 12, 14, 27),
(161, 'AMIR LAVE SOL LAVANDE 1L', 182, 2184, 12, 14, 23),
(162, 'AMIR Lave Sol Océan 1L', 175, 2100, 12, 14, 23),
(163, 'Amir Lave Sol ceramique 1L', 243, 2916, 12, 14, 28),
(164, 'AMIR VAISSELE 650ML CITRON VERT', 165, 1980, 12, 14, 22),
(165, 'AMIR LAVE SOL BLANCHE 1L', 177, 2124, 12, 14, 23),
(166, 'Aigle Javel Soude 825ml', 68, 816, 12, 15, 21),
(167, 'Aigle Savon liquide Marine Bleu', 103, 1235, 12, 15, 29),
(168, 'Aigle Sea Power7 Original 1Kg', 265, 1060, 4, 15, 24),
(169, 'Aigle Savon Power7 Jasmin 1Kg', 285, 1140, 4, 15, 24),
(170, 'Aigle Machine Poudre valise 2.5kg', 600, 600, 1, 15, 24),
(171, 'Aigle sachet multi usage 750g', 220, 2640, 12, 15, 24),
(172, 'Aigle Sachet Power7 Original 450g', 179, 2150, 12, 15, 24),
(173, 'aigle Javel TOP 900mL', 120, 2880, 24, 15, 30),
(174, 'AIGLE LAVE SOL WAVE 1L SOFTY', 165, 1980, 12, 15, 23),
(175, 'Aigle Gel Detartrant 700ml Marine', 177, 2120, 12, 15, 31),
(176, 'Aigle sachet multi usage 300g', 179, 2150, 12, 15, 24),
(177, 'Aigle Gel Detartrant 700ml peche', 96, 2304, 24, 15, 31),
(178, 'Aigle Gel Detartrant 700ml Lavande', 220, 2640, 12, 15, 31),
(179, 'Aigle Nettoyant Cuisine 500ml', 150, 1800, 12, 15, 32),
(180, 'Aigle Gel Javel 750ML', 163, 1956, 12, 15, 21),
(181, 'Aigle Top Sol White Clean 1L', 98, 1176, 12, 15, 23),
(182, 'Aigle Nettoyant salle de bain 500ml', 177, 2120, 12, 15, 33),
(183, 'Aigle Savon Detachant', 100, 2400, 24, 15, 34),
(184, 'Aigle Savon Marseille Vert', 125, 3000, 24, 15, 29),
(185, 'AIGLE SAVON LIQUIDE LAVANDE VIOLET', 125, 3000, 24, 15, 29),
(186, 'Aigle Savon liquide Caramel Jaune', 114, 1368, 12, 15, 29),
(187, 'SaniTop Aigle soudée marine 850ml', 83, 996, 12, 15, 30),
(188, 'SaniTop Aigle soudée rose 850ml', 83, 996, 12, 15, 30),
(189, 'Aigle Savon Marseille Bleu', 100, 2400, 24, 15, 29),
(190, 'Aigle Top Sol Marine 1L', 98, 1176, 12, 15, 23),
(191, 'Aigle Decap four 500ml', 160, 1919, 12, 15, 35),
(192, 'Aigle Top Sol lavande1L', 98, 1176, 12, 15, 23),
(193, 'Aigle Vaisselle 970ml', 240, 2880, 12, 15, 22),
(194, 'Aigle Vaisselle 430ml', 115, 2070, 18, 15, 22),
(195, 'SaniTop Aigle soudée lavande 850ml', 83, 996, 12, 15, 30),
(196, 'AIGLE LAVE SOL WAVE 1L NATURAL', 193, 2316, 12, 15, 23),
(197, 'Aigle Top Sol Rose 1L', 98, 1176, 12, 15, 23),
(198, 'Aigle Vaisselle 650ml', 172, 2752, 16, 15, 22),
(199, 'JAVEL SIDHOUM 1L', 127, 1524, 12, 16, 21),
(200, 'JAVEL SIDHOUM 2L', 225, 1350, 6, 16, 21),
(201, 'Sido Savon Détachant', 125, 4500, 36, 16, 34),
(202, 'Sido Savon marseille', 125, 4500, 36, 16, 29),
(203, 'Nassah Eau de Javel 720ml', 64, 640, 10, 17, 21),
(204, 'nassah vaissele 5 l', 835, 1670, 2, 17, 22),
(205, 'NASSAH EAU DE JAVEL 5L', 244, 488, 2, 17, 21),
(206, 'Omo Machine Liquid expert 2.5L bouquet de violettes', 680, 2720, 4, 18, 24),
(207, 'OMO Machine sachet 1.4kg', 390, 3120, 8, 18, 24),
(208, 'OMO MACHINE SACHET 500g', 135, 2160, 16, 18, 24),
(209, 'Omo Machine Liquide 2.5L', 680, 2720, 4, 18, 24),
(210, 'Omo Machine Liquide 1L', 325, 3900, 12, 18, 24),
(211, 'OMO sachet 580g', 95, 2280, 24, 18, 24),
(212, 'OMO sachet 290g', 160, 1920, 12, 18, 24),
(213, 'OMO Machine 500g', 155, 2480, 16, 18, 24),
(214, 'OMO sachet 800g', 215, 2150, 10, 18, 24),
(215, 'COTEX ESSUITE TOUT CLASSIC 2+1', 120, 600, 5, 10, 36),
(216, 'Bimbies couche 5 Valise', 1030, 4120, 4, 10, 10),
(217, 'COTEX ESSUIT TOUT PLUS 4+2', 385, 1540, 4, 10, 36),
(218, 'LINGETTE BIMBIES SENSITIVE 36 PCS', 95, 1900, 20, 10, 37),
(219, 'COTEX CONFROT 4+2 R', 110, 1100, 10, 10, 36),
(220, 'cotex jumbo promo', 365, 2190, 6, 10, 36),
(221, 'cotex mille feuille promo', 443, 1329, 3, 10, 36),
(222, 'cotex mega promo', 190, 1900, 10, 10, 36),
(223, 'bimbies val 6', 935, 3740, 4, 10, 10),
(224, 'cotex deco 12 r', 296, 888, 3, 10, 36),
(225, 'cotex evasion velours 4R', 185, 1850, 10, 10, 36),
(226, 'COTEX CLASSIC 4+2', 240, 960, 4, 10, 36),
(227, 'COTEX DECO 4R', 115, 1725, 15, 10, 36),
(228, 'LINGETTE BIMBIES ESSENTIELLE LAIT', 172, 2064, 12, 10, 37),
(229, 'LINGETTE BIMBIES ESSENTIELLE AMANDE', 172, 2064, 12, 10, 37),
(230, 'cotex velours mesk+2 ellil 4', 200, 1000, 5, 10, 36),
(231, 'cotex velours 4+2', 220, 1100, 5, 10, 36),
(232, 'COTEX ALUMINUM 10M', 123, 4428, 36, 10, 38),
(233, 'COTEX ALUMINUM 100M', 890, 5340, 6, 10, 38),
(234, 'COTEX CONFORT 12R', 277, 831, 3, 10, 36),
(235, 'COTEX FILM 200M', 715, 2145, 3, 10, 38),
(236, 'Bimbies couche 6', 295, 2950, 10, 10, 10),
(237, 'Bimbies couche 5', 224, 2240, 10, 10, 10),
(238, 'Lingettes Bimbies Fresh', 120, 1620, 12, 10, 37),
(239, 'COTEX PAPIER MOUCHOIR', 100, 100, 1, 10, 36),
(240, 'Cortex Classic Plus', 175, 1750, 10, 10, 36),
(241, 'COTEX ESSUIT TOUT CLASSIC', 128, 1280, 10, 10, 36),
(242, 'Bimbies couche 4', 220, 2200, 10, 10, 10),
(243, 'Bimbies couche 3', 224, 2240, 10, 10, 10),
(244, 'cotex absorba 2+1', 205, 1025, 5, 10, 36),
(245, 'cotex maxi 2R', 275, 2200, 8, 10, 36),
(246, 'cotex boite auto 70 pcs', 95, 1900, 20, 10, 36),
(247, 'LINGETTE UNIFORM ADULTE', 184, 2753, 15, 10, 39),
(248, 'uniform large', 550, 3300, 6, 10, 40),
(249, 'uniform medium', 650, 3900, 6, 10, 40),
(250, 'uniform culotte medium', 864, 6912, 8, 10, 10),
(251, 'uniform culotte large', 750, 6000, 8, 10, 10),
(252, 'cotex boite auto 140 pcs', 349, 2094, 6, 10, 36),
(253, 'cotex basico 2 R', 120, 2400, 20, 10, 36),
(254, 'bimbies val 2', 744, 2976, 4, 10, 10),
(255, 'COTEX CONFORT 4R', 100, 1500, 15, 10, 36),
(256, 'COTEX PLUS 4R', 349, 2094, 6, 10, 36),
(257, 'COTEX expert 2 R', 215, 2150, 10, 10, 36),
(258, 'COTEX VELOURS 4 R', 214, 2140, 10, 10, 36),
(259, 'cortex confort 24+8', 585, 1755, 3, 10, 36),
(260, 'cortex confort 12+4', 535, 1605, 3, 10, 36),
(261, 'cortex serviette color', 543, 1630, 3, 10, 36),
(262, 'cortex JUMBO', 410, 2460, 6, 10, 36),
(263, 'COTEX CLASSIC 4R', 209, 1254, 6, 10, 36),
(264, 'Cortex Papier serviette original', 61, 1650, 27, 10, 36),
(265, 'COTEX MILLE FEUILLES', 530, 1590, 3, 10, 36),
(266, 'COTEX MEGA', 218, 1744, 8, 10, 36),
(267, 'COTEX ALUMINUM 5M', 88, 3168, 36, 10, 38),
(268, 'COTEX SERVIETTE ORIGINAL 160+40 PCS', 144, 1728, 12, 10, 36),
(269, 'COTEX CUISSON 50M', 640, 3840, 6, 10, 38),
(270, 'COTEX FILM 10M', 60, 2160, 36, 10, 38),
(271, 'COTEX PRO SERVIETTE DE TABEL', 168, 2016, 12, 10, 36),
(272, 'COTEX DECO 12+4', 330, 990, 3, 10, 36),
(273, 'COTEX CUISSON 5M', 84, 3024, 36, 10, 38),
(274, 'COTEX CUISSON 10M', 160, 5760, 36, 10, 38),
(275, 'Molfix Couches 6', 225, 2700, 12, 19, 10),
(276, 'Molfix Couches 5', 225, 2700, 12, 19, 10),
(277, 'Molfix 6 Valise 35', 950, 3800, 4, 19, 10),
(278, 'molfix couches 2', 225, 2700, 12, 19, 10),
(279, 'molfix couches 3', 245, 2940, 12, 19, 10),
(280, 'Molfix valise 4', 995, 3980, 4, 19, 10),
(281, 'Molfix Couches 4', 225, 2700, 12, 19, 10),
(282, 'canbébé 4 valise 40', 1030, 4120, 4, 20, 10),
(283, 'Canbebe Couches 6', 310, 3720, 12, 20, 10),
(284, 'canbébé 6 valise 35', 1020, 4080, 4, 20, 10),
(285, 'canbébé 5 valise 40', 1130, 4520, 4, 20, 10),
(286, 'Canbebe Couches 5', 238, 2856, 12, 20, 10),
(287, 'Canbebe COUCHES 2', 235, 2820, 12, 20, 10),
(288, 'Canbebe Couches 3', 235, 2820, 12, 20, 10),
(289, 'Life Assouplissant Linge Mauve 1l', 213, 2559, 12, 21, 14),
(290, 'Life Liquidine Linge 3L Frambois', 488, 2441, 5, 21, 24),
(291, 'LIFE ASSOUPLISSANT PETALE EXQUISE Rouge 3L', 463, 1852, 4, 21, 14),
(292, 'Javel Life 900ml', 91, 1088, 12, 21, 21),
(293, 'Life Liquidine Linge 3L Aloe Vera', 488, 2441, 5, 21, 24),
(294, 'Life Liquidine Linge 3L Rose', 488, 2441, 5, 21, 24),
(295, 'Life Liquidine Linge 3L Citron', 488, 2441, 5, 21, 24),
(296, 'LIFE ASSOUPLISSANT Brise Fraîcheur jaune 1L', 213, 2559, 12, 21, 14),
(297, 'Life Liquidine Linge 3L Jasmin', 488, 2441, 5, 21, 24),
(298, 'LIFE ASSOUPLISSANT PETALE EXQUISE Rouge 1L', 213, 2559, 12, 21, 14),
(299, 'Life Liquid Linge 3L Colore', 488, 2441, 5, 21, 24),
(300, 'LIFE ASSOUPLISSANT Bouquet Bleu 1L', 213, 2559, 12, 21, 14),
(301, 'Life Lave Vitre', 116, 1397, 12, 21, 20),
(302, 'Life Vaissele 1.25L', 112, 1347, 12, 21, 22),
(303, 'Life Dégraissant 1L', 251, 3016, 12, 21, 19),
(304, 'Life Plus Liquide Vaissele 2L', 288, 3461, 12, 21, 22),
(305, 'Life Savon Liquide à Main Pomme2.5L', 379, 2274, 6, 21, 41),
(306, 'Life Savon Liquide à Main Lavande 500ml', 112, 1347, 12, 21, 41),
(307, 'Life Savon Liquide à Main Fraise 500ml', 112, 1347, 12, 21, 41),
(308, 'Life Savon Liquide à Main Vanille 500ml', 112, 1347, 12, 21, 41),
(309, 'Life Savon Liquide à Main Pomme 500ml', 112, 1347, 12, 21, 41),
(310, 'Life Vaissele 650ml', 168, 2015, 12, 21, 22),
(311, 'Life Savon Liquide à Main Caramel 500ml', 112, 1347, 12, 21, 41),
(312, 'Life Savon Liquide à Main Lavande2.5L', 376, 2256, 6, 21, 41),
(313, 'Life Savion Liquide à Main Fraise 2.5L', 376, 2256, 6, 21, 41),
(314, 'LIFE LIQUIDE LINGE 3L LAVANDE', 488, 2441, 5, 21, 24),
(315, 'Life Savon Liquide à Main Vanille 2.5L', 376, 2256, 6, 21, 41),
(316, 'Life Liquid Linge Marseille 10L', 1215, 1215, 1, 21, 24),
(317, 'Life Liquid Linge lavande 10L', 1215, 1215, 1, 21, 24),
(318, 'Life Savon Liquid à Main Citron 2.5L', 376, 2256, 6, 21, 41),
(319, 'Life Savon Liquid à Main Caramel2.5L', 376, 2256, 6, 21, 41),
(320, 'Life Plus Liquide Vaissele 4L', 731, 2925, 4, 21, 22),
(321, 'Life Liquide Linge 3L Savon Marseille', 488, 2441, 5, 21, 24),
(322, 'Life Liquide Linge bicarbonate & mille fleurs 10L', 1215, 1215, 1, 21, 24),
(323, 'JAVEL LIFE 5L', 243, 972, 4, 21, 21),
(324, 'LIFE SAVON LIQUIDE A MAIN DOVY 500ml', 112, 1347, 12, 21, 41),
(325, 'LIFE ASSOUPLISSANT 1L JARDIN DEDEN VERT', 213, 2559, 12, 21, 14),
(326, 'LIFE LIQUIDE LINGE 3L BICARBONATE & MILLE FLEURS', 488, 2441, 5, 21, 24),
(327, 'LIFE SAVON LIQUIDE A MAIN DOVY 2.5L', 376, 2256, 6, 21, 41),
(328, 'Bingo Liquid Machine 1L antibacterien', 325, 2925, 9, 22, 24),
(329, 'Bingo Liquid Machine 1L VIOLET anti Odeur p.m', 325, 2925, 9, 22, 24),
(330, 'Bingo Liquide Machine 1L ROUGE propriete et fraicheur', 369, 3325, 9, 22, 24),
(331, 'Test Javel 1L', 86, 1032, 12, 22, 21),
(332, 'BINGO MACHINE SACHET 2.5Kg', 640, 2560, 4, 22, 24),
(333, 'TEST SACHET 420G', 95, 2090, 22, 22, 24),
(334, 'Test Machine Poudre sachet 2.5kg', 690, 2760, 4, 22, 24),
(335, 'BINGO VAISSELLE 1200ml', 295, 3540, 12, 22, 22),
(336, 'BINGO SACHET 1.5kg', 445, 3560, 8, 22, 24),
(337, 'BINGO LIQUIDE MACHINE 3L BOUCHOUNE BLEU', 810, 3240, 4, 22, 24),
(338, 'BINGO LIQUIDE MACHINE 3L VIOLET ANDTI ODEUR', 810, 3240, 4, 22, 24),
(339, 'Test Liquide Vaisselle 975mL', 195, 2340, 12, 22, 22),
(340, 'Test Machine Poudre Bidon 2.5kg', 580, 2320, 4, 22, 24),
(341, 'BINGO MACHINE VALISE 2.5kg', 880, 3520, 4, 22, 24),
(342, 'TEST SACHET 300g', 96, 2400, 25, 22, 24),
(343, 'Test Liquide Vaisselle 1.25L', 255, 3060, 12, 22, 22),
(344, 'BINGO VAISSELLE 610ml', 184, 2944, 16, 22, 22),
(345, 'Test sachet 750g', 225, 3150, 14, 22, 24),
(346, 'Test Liquide Vaisselle 650ml', 158, 1896, 12, 22, 22),
(347, 'BINGO LIQUIDE MACHINE 3L ROUGE PROPRIETE ET FRAICHEUR', 830, 3320, 4, 22, 24),
(348, 'BINGO SACHET 800g', 235, 2820, 12, 22, 24),
(349, 'BINGO SACHET 300g', 113, 2712, 24, 22, 24),
(350, 'WAFA PAPIER HYGENIQUE ECO 20+4', 551, 1654, 3, 23, 36),
(351, 'WAFA PAPIER HYGENIQUE 08 RLX ECO', 215, 1722, 8, 23, 36),
(352, 'Wafa Aluminium 180M', 1750, 1750, 1, 23, 38),
(353, 'WAFA SERVIETTES ECO BLANCH 160+20', 137, 2184, 16, 23, 36),
(354, 'WAFA ESSUIT TOUT ECO PLUS NEW 02 RLX', 93, 1116, 12, 23, 36),
(355, 'WAFA MOUCHOIR DE POCHE ROSE', 11, 105, 10, 23, 36),
(356, 'WAFA PAPIER HYGENIQUE EXTRA PARFUME 4+2 ROSE', 221, 1103, 5, 23, 36),
(357, 'WAFA SERVIETTES ECO IMPRIME 160+20', 145, 2318, 16, 23, 36),
(358, 'WAFA PAPIER HYGENIQUE EXTRA PARFUME 4+2 JASMINE', 221, 1103, 5, 23, 36),
(359, 'WAFA PAPIER HYGENIQUE EXTRA PARFUME 4+2 LAVANDE', 221, 1103, 5, 23, 36),
(360, 'WAFA ESSUIT TOUT EXTRA 02 RLX', 96, 2865, 30, 23, 36),
(361, 'Wafa Film Transparent 10mètres', 170, 2040, 12, 23, 38),
(362, 'Wafa Papier Cuisson', 63, 1890, 30, 23, 38),
(363, 'WAFA SERVIETTES 40/50 IMPRIME 2 PLIS', 140, 2240, 16, 23, 36),
(364, 'WAFA ESSUIT TOUT ECO 2XL 385da', 350, 2100, 6, 23, 36),
(365, 'WAFA PAPIER HYGENIQUE ECO 10+2', 278, 1670, 6, 23, 36),
(366, 'WAFA BOITE MOUCHOIR 140PCS', 116, 2310, 20, 23, 36),
(367, 'WAFA PAPIER HYGENIQUE ECO 12 RLX', 158, 1890, 12, 23, 36),
(368, 'WAFA SERVIETTES PALACE IMPRIME 2 PLIS 45PCS', 145, 1740, 12, 23, 36),
(369, 'WAFA PAPIER HYGENIQUE EXTRA 4+2', 188, 1129, 6, 23, 36),
(370, 'WAFA PAPIER HYGENIQUE 04 RLX ECO', 334, 1336, 4, 23, 36),
(371, 'WAFLA LINGETTES 80PCS ROSE 160DA', 142, 2268, 16, 23, 42),
(372, 'WAFLA LINGETTES 80PCS VERT 160DA', 142, 2268, 16, 23, 42),
(373, 'WAFLA ESSUIT TOUT EXTRA MAXI', 360, 1440, 4, 23, 36),
(374, 'WAFLA LINGETTES 80PCS BLEU 160DA', 142, 2268, 16, 23, 42),
(375, 'WAFA MOUCHOIR DE POCHE VERT', 11, 105, 10, 23, 36),
(376, 'WAFA MOUCHOIR DE POCHE BLEU', 11, 105, 10, 23, 36),
(377, 'WAFA ESSUIT TOUT ECO DOUBLO 02RLX 485da', 450, 1350, 3, 23, 36),
(378, 'wafa essuit tout eco 2 RLX', 135, 1620, 12, 23, 36),
(379, 'WAFLA LINGETTES WARDA 72PCS LAVANDE', 98, 1568, 16, 23, 42),
(380, 'WAFA PAPIER HYGENIQUE EXTRA 04 RLX 195DA', 179, 1785, 10, 23, 36),
(381, 'WAFLA LINGETTES WARDA 72PCS ALOE VERRA', 98, 1568, 16, 23, 42),
(382, 'WAFA LINGETTES WARDA 72PCS CAMOMILLE', 98, 1568, 16, 23, 42),
(383, 'WAFA SERVIETTES PALACE BLANC 2 PLIS 45PCS', 135, 1620, 12, 23, 36),
(384, 'WAFA ESSUIT TOUT 04 RELAX ECO', 247, 1481, 6, 23, 36),
(385, 'WAFA SERVIETTES 30/80 IMPRIME', 75, 3000, 40, 23, 36),
(386, 'WAFA SERVIETTES BLANCHE 30/80 CUISTO', 60, 2400, 40, 23, 36),
(387, 'WAFA ESSUIT TOUT 4+2 EXTRA', 360, 1440, 4, 23, 36),
(388, 'Sofia serviette chic new 80pcs', 62, 2232, 36, 24, 36),
(389, 'WAFA FILM 200m', 790, 790, 1, 23, 38),
(390, 'WAFA BOITE MOUCHOIR MOYEN 70PCS', 72, 2288, 32, 23, 36),
(391, 'ISIS SACHET 800G', 218, 2616, 12, 25, 24),
(392, 'ISIS LIQUIDE VAISSELLE 3L', 710, 2840, 4, 25, 22),
(393, 'ISIS VAISSELLE 1.25L', 314, 3768, 12, 25, 22),
(394, 'ISIS VAISSELLE 650ml', 180, 2160, 12, 25, 22),
(395, 'Iris sachet 320g', 92, 2300, 25, 25, 24)
ON CONFLICT (id) DO NOTHING;