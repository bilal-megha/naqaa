import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('⚠️ أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
