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
