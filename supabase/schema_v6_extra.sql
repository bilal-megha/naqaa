-- نقاء v6 تحديثات إضافية
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_purchase timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS tier_type text DEFAULT 'percent';
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS tier_value numeric DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS tier_qty integer DEFAULT 1;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS brand_ids text DEFAULT '[]';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'all';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_count integer DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id bigint;

-- نسخ password إلى password_hash
UPDATE customers SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;

-- reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id bigint PRIMARY KEY,
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  customer_id bigint,
  customer_name text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow all reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
