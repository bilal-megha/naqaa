-- تشغيل هذا في Supabase > SQL Editor > New query > Run

CREATE TABLE IF NOT EXISTS product_categories (
  id          BIGINT PRIMARY KEY,
  product_id  BIGINT REFERENCES products(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_product_categories" ON product_categories;
CREATE POLICY "allow_all_product_categories"
  ON product_categories FOR ALL USING (true) WITH CHECK (true);

SELECT 'تم إنشاء جدول product_categories بنجاح ✅' AS result;
