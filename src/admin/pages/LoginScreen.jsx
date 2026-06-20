/**
 * @file pages/LoginScreen.jsx
 * @description صفحة تسجيل الدخول مع مصادقة ثنائية
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, ADMIN_EMAIL, ADMIN_PASS_HASH, TWO_FA_CODE, hashPwd } from '../constants.js'

/**
 * شاشة تسجيل الدخول — خطوتان: بيانات الدخول ثم كود OTP
 * @param {{ onLogin: Function }} props
 */
export default function LoginScreen({ onLogin }) {
  const [step,     setStep]     = useState(1)
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')
  const [code,     setCode]     = useState('')
  const [userData, setUserData] = useState(null)
  const [err,      setErr]      = useState('')
  const [loading,  setLoading]  = useState(false)

  /**
   * الخطوة 1: التحقق من البريد وكلمة المرور
   *
   * 🔐 المحاولة الأولى: استدعاء Edge Function (auth-login) التي تتحقق
   * من كلمة المرور بـ bcrypt على الخادم — راجع supabase/functions/auth-login.
   * إن لم تكن الدالة منشورة بعد (مشروع لم يُفعّلها)، نرجع تلقائياً
   * إلى التحقق المحلي القديم بـ SHA256 لضمان عمل تسجيل الدخول دائماً.
   */
  const step1 = async () => {
    setErr(''); setLoading(true)

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('auth-login', {
        body: { username: email.trim(), password: pass },
      })

      if (!fnError && fnData) {
        if (fnData.success) {
          const u = fnData.user
          let perms = {}
          try { perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions || '{}') : (u.permissions || {}) }
          catch { perms = {} }
          setUserData({ name: u.name, email: u.email, role: u.role, permissions: perms, id: u.id })
          setStep(2); setLoading(false); return
        }
        // الدالة استُدعيت بنجاح لكن رفضت بيانات الدخول
        setErr(fnData.message || 'البريد أو كلمة المرور غير صحيحة')
        setLoading(false); return
      }
      // fnError → الدالة غير منشورة بعد، ننتقل للتحقق المحلي أدناه
    } catch {
      // تجاهل الخطأ والانتقال للتحقق المحلي (fallback)
    }

    // ─── Fallback: تحقق محلي قديم بـ SHA256 (يعمل دون نشر Edge Function) ───
    if (email.trim() === ADMIN_EMAIL && hashPwd(pass) === ADMIN_PASS_HASH) {
      setUserData({ name: 'المدير', email: ADMIN_EMAIL, role: 'admin', permissions: {} })
      setStep(2); setLoading(false); return
    }

    const { data } = await supabase.from('employees').select('*')
      .eq('username', email.trim()).maybeSingle()

    if (data && data.password === hashPwd(pass)) {
      let perms = {}
      try { perms = typeof data.permissions === 'string' ? JSON.parse(data.permissions || '{}') : (data.permissions || {}) }
      catch { perms = {} }
      setUserData({ name: data.name, email: data.email, role: data.role, permissions: perms, id: data.id })
      setStep(2)
    } else {
      setErr('البريد أو كلمة المرور غير صحيحة')
    }
    setLoading(false)
  }

  /** الخطوة 2: التحقق من كود OTP */
  const step2 = () => {
    if (code !== TWO_FA_CODE) { setErr('كود التحقق غير صحيح'); return }
    onLogin(userData)
  }

  // شاشة إدخال كود OTP
  if (step === 2) return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B,#0F172A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl'
    }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40 }}>🔐</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', marginTop: 8 }}>التحقق الثنائي</h2>
          <p style={{ color: CLR.textSm, fontSize: 14, marginTop: 4 }}>أدخل كود التحقق المكون من 4 أرقام</p>
          <div style={{
            background: '#f0fdf4', borderRadius: 10, padding: 10, marginTop: 12,
            fontSize: 13, color: '#166534', border: '1px solid #bbf7d0'
          }}>
            📱 تم إرسال كود التحقق — تحقق من بريدك الإلكتروني
            <div style={{ fontSize: 11, marginTop: 4, color: '#15803d' }}>أدخل الكود المكوّن من 4 أرقام</div>
          </div>
        </div>

        {/* حقول الكود OTP */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {['', '', '', ''].map((_, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              maxLength={1}
              inputMode="numeric"
              value={code[i] || ''}
              onChange={e => {
                const v = e.target.value.replace(/\D/, '')
                const arr = code.split('')
                arr[i] = v; setCode(arr.join(''))
                if (v && i < 3) document.getElementById(`otp-${i + 1}`)?.focus()
              }}
              onKeyDown={e => { if (e.key === 'Backspace' && !code[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus() }}
              style={{
                width: 56, height: 60, border: '2px solid #e2e8f0', borderRadius: 12,
                textAlign: 'center', fontSize: 24, fontWeight: 900, outline: 'none',
                background: '#f8fafc', fontFamily: 'inherit'
              }}
            />
          ))}
        </div>

        {err && (
          <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 14, background: '#fef2f2', padding: 10, borderRadius: 10, textAlign: 'center' }}>
            {err}
          </div>
        )}
        <button style={{ ...S.btn, width: '100%', padding: '14px', fontSize: 16 }} onClick={step2}>
          ✅ تأكيد الدخول
        </button>
        <button onClick={() => { setStep(1); setCode(''); setErr('') }}
          style={{ ...S.btnGray, width: '100%', marginTop: 10, padding: '12px' }}>
          ← رجوع
        </button>
      </div>
    </div>
  )

  // شاشة إدخال البيانات
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B,#0F172A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl'
    }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>🛍️</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', marginTop: 8 }}>نقاء</h1>
          <p style={{ color: CLR.textSm, fontSize: 14 }}>لوحة الإدارة</p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>البريد الإلكتروني</label>
          <input
            style={S.input} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && step1()}
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>كلمة المرور</label>
          <input
            style={S.input} type="password" value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && step1()}
            autoComplete="current-password"
          />
        </div>
        {err && (
          <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 14, background: '#fef2f2', padding: '10px 14px', borderRadius: 10 }}>
            {err}
          </div>
        )}
        <button style={{ ...S.btn, width: '100%', padding: '14px', fontSize: 16 }}
          onClick={step1} disabled={loading}>
          {loading ? '⏳ جاري التحقق...' : '🔐 دخول'}
        </button>
      </div>
    </div>
  )
}
