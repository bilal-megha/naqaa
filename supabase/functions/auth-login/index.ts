// supabase/functions/auth-login/index.ts
//
// 🔐 المهمة 1.2: تشفير كلمات المرور بـ bcrypt على جانب الخادم
// ------------------------------------------------------------
// هذه Supabase Edge Function (تعمل على خادم Deno لدى Supabase،
// وليست جزءاً من الفرونت إند) — هي الحل الصحيح لتنفيذ "تشفير
// على جانب الخادم" في مشروع لا يملك Express/Node backend خاص به.
//
// كيف تستخدمها:
//   1) ثبّت Supabase CLI: npm install -g supabase
//   2) في مجلد المشروع: supabase functions new auth-login
//      (سينشئ نفس المسار، استبدل المحتوى بهذا الملف)
//   3) النشر: supabase functions deploy auth-login
//   4) من الفرونت إند، تستبدل منطق step1() في LoginScreen.jsx
//      من مقارنة SHA256 محلياً، إلى:
//
//        const { data, error } = await supabase.functions.invoke('auth-login', {
//          body: { username: email, password: pass }
//        })
//
//      وتتحقق من data.success بدلاً من حساب hashPwd() في المتصفح.
//
// ⚠️ لماذا هذا أفضل من bcrypt في المتصفح؟
//   bcrypt يحتاج "salt rounds" بطيئة عمداً (لمقاومة brute-force)
//   وهذا يعني تشغيله في المتصفح يجمّد الواجهة، ويُسرّب خوارزمية
//   التحقق بالكامل لأي زائر يفتح Devtools. الخادم هو المكان
//   الصحيح الوحيد لتشغيله.
// ------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { compare, hash } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { username, password, action } = await req.json()

    // ⚠️ استخدم service_role key هنا فقط — هذا كود خادم، لا يُرسَل للمتصفح أبداً
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ─── إنشاء/تحديث كلمة مرور موظف جديد (يُستخدم من صفحة Employees) ───
    if (action === 'set_password') {
      const bcryptHash = await hash(password)
      return new Response(JSON.stringify({ success: true, hash: bcryptHash }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── تسجيل دخول موظف ───
    const { data: emp, error } = await supabase
      .from('employees')
      .select('id,name,email,phone,role,permissions,password')
      .eq('username', username)
      .maybeSingle()

    if (error || !emp) {
      return new Response(JSON.stringify({ success: false, message: 'بيانات الدخول غير صحيحة' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // bcrypt.compare يقارن النص الصريح بالـ hash المخزّن — بطيء عمداً، وهذا مقصود
    const valid = await compare(password, emp.password)
    if (!valid) {
      return new Response(JSON.stringify({ success: false, message: 'بيانات الدخول غير صحيحة' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // لا نُرجع كلمة المرور (حتى المُجزّأة) إلى الفرونت إند أبداً
    delete emp.password
    return new Response(JSON.stringify({ success: true, user: emp }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
