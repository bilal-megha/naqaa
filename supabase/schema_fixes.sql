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

