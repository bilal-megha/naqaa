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
