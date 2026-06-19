/**
 * @file LoginScreen.jsx
 * @description شاشة تسجيل الدخول — مصادقة ثنائية مع bcrypt
 *
 * الخطوة 1: بريد + كلمة مرور  (bcrypt verify)
 * الخطوة 2: كود 2FA            (4 أرقام)
 */
import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S }   from '../styles/constants.js'
import { ADMIN_CREDS, verifyPassword, verifyTwoFA } from '../styles/auth.js'

/**
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

  /** الخطوة 1: التحقق من البريد وكلمة المرور */
  const step1 = async () => {
    setErr(''); setLoading(true)
    try {
      // ── التحقق من حساب المدير الرئيسي ──
      if (email.trim() === ADMIN_CREDS.email) {
        const ok = await verifyPassword(pass, ADMIN_CREDS.passHash)
        if (ok) {
          setUserData({ name: 'المدير', email: ADMIN_CREDS.email, role: 'admin', permissions: {} })
          setStep(2); return
        }
      }

      // ── التحقق من حساب موظف ──
      const { data, error } = await supabase
        .from('employees')
        .select('id,name,email,role,permissions,password,password_hash,password_algo')
        .eq('username', email.trim())
        .maybeSingle()

      if (error) throw error

      if (data) {
        // دعم كلاً من: bcrypt (password_hash) والقديم (password)
        const storedHash = data.password_hash || data.password || ''
        const ok = await verifyPassword(pass, storedHash)

        if (ok) {
          let perms = {}
          try {
            perms = typeof data.permissions === 'string'
              ? JSON.parse(data.permissions || '{}')
              : (data.permissions || {})
          } catch { perms = {} }

          setUserData({ name: data.name, email: data.email, role: data.role, permissions: perms, id: data.id })
          setStep(2)
          return
        }
      }

      setErr('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } catch (e) {
      console.error(e)
      setErr('حدث خطأ أثناء التحقق، حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  /** الخطوة 2: التحقق من كود 2FA */
  const step2 = () => {
    if (!verifyTwoFA(code)) { setErr('كود التحقق غير صحيح'); return }
    onLogin(userData)
  }

  // ── واجهة الخطوة 2: كود 2FA ────────────────────────────
  if (step === 2) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E293B,#0F172A)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:24, padding:36, width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:40 }}>🔐</div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#1e293b', marginTop:8 }}>التحقق الثنائي</h2>
          <p style={{ color:CLR.textSm, fontSize:14, marginTop:4 }}>أدخل كود التحقق المكوّن من 4 أرقام</p>
          <div style={{ background:'#f0fdf4', borderRadius:10, padding:10, marginTop:12,
            fontSize:13, color:'#166534', border:'1px solid #bbf7d0' }}>
            📱 تحقق من بريدك الإلكتروني أو تطبيق المصادقة
          </div>
        </div>

        {/* حقول OTP */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:20 }}>
          {[0,1,2,3].map(i => (
            <input key={i} id={`otp-${i}`} maxLength={1} inputMode="numeric"
              value={code[i] || ''}
              onChange={e => {
                const v = e.target.value.replace(/\D/, '')
                const arr = code.padEnd(4, ' ').split('')
                arr[i] = v; setCode(arr.join('').trim())
                if (v && i < 3) document.getElementById(`otp-${i+1}`)?.focus()
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace' && !code[i] && i > 0)
                  document.getElementById(`otp-${i-1}`)?.focus()
                if (e.key === 'Enter') step2()
              }}
              style={{ width:56, height:60, border:'2px solid #e2e8f0', borderRadius:12,
                textAlign:'center', fontSize:24, fontWeight:900, outline:'none',
                background:'#f8fafc', fontFamily:'inherit', transition:'.15s' }}
            />
          ))}
        </div>

        {err && <p style={{ color:'#ef4444', fontSize:13, marginBottom:14,
          background:'#fef2f2', padding:10, borderRadius:10, textAlign:'center' }}>{err}</p>}

        <button style={{ ...S.btn, width:'100%', padding:'14px', fontSize:16 }} onClick={step2}>
          ✅ تأكيد الدخول
        </button>
        <button onClick={() => { setStep(1); setCode(''); setErr('') }}
          style={{ ...S.btnGray, width:'100%', marginTop:10, padding:'12px' }}>
          ← رجوع
        </button>
      </div>
    </div>
  )

  // ── واجهة الخطوة 1: بريد + كلمة مرور ──────────────────
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E293B,#0F172A)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:24, padding:36, width:'100%', maxWidth:400,
        boxShadow:'0 24px 64px rgba(0,0,0,.3)' }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'#FFF7ED',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:32, margin:'0 auto 12px' }}>🛍️</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1e293b' }}>نقاء</h1>
          <p style={{ color:CLR.textSm, fontSize:14 }}>لوحة الإدارة</p>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={S.label}>البريد الإلكتروني / اسم المستخدم</label>
          <input style={S.input} type="email" value={email} autoComplete="email"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && step1()}
            placeholder="admin@example.com" />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={S.label}>كلمة المرور</label>
          <input style={S.input} type="password" value={pass} autoComplete="current-password"
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && step1()} />
        </div>

        {err && <p style={{ color:'#ef4444', fontSize:13, marginBottom:14,
          background:'#fef2f2', padding:'10px 14px', borderRadius:10 }}>{err}</p>}

        <button style={{ ...S.btn, width:'100%', padding:'14px', fontSize:16, justifyContent:'center' }}
          onClick={step1} disabled={loading}>
          {loading
            ? <><span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>⏳</span> جاري التحقق...</>
            : '🔐 دخول'}
        </button>

        <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:CLR.textSm }}>
          🔒 الاتصال مشفّر · bcrypt + 2FA
        </p>
      </div>
    </div>
  )
}
