/**
 * @file LoginScreen.jsx
 * @description شاشة تسجيل الدخول — مصادقة ثنائية
 * يدعم: SHA256 (المشرف الأصلي) + bcrypt (الموظفون الجدد)
 */
import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S }   from '../styles/constants.js'
import CryptoJS     from 'crypto-js'

// بيانات المدير — يمكن تجاوزها بمتغيرات البيئة
const ADMIN_EMAIL    = import.meta.env.VITE_ADMIN_EMAIL    || 'meghamel2012@gmail.com'
const ADMIN_PASS_RAW = import.meta.env.VITE_ADMIN_PASS_RAW || 'afbilalaf06'
const TWO_FA_CODE    = import.meta.env.VITE_TWO_FA_CODE    || '6789'

const sha256 = p => CryptoJS.SHA256(p).toString()

/** التحقق من كلمة المرور: يدعم SHA256 والنص الصريح */
async function checkPassword(plain, stored) {
  if (!plain || !stored) return false
  // مقارنة مع نص مباشر (admin env var)
  if (plain === stored) return true
  // SHA256
  if (sha256(plain) === stored) return true
  // bcrypt (للموظفين الجدد)
  if (stored.startsWith('$2')) {
    try {
      const bcrypt = await import('bcryptjs')
      return bcrypt.default.compare(plain, stored)
    } catch { return false }
  }
  return false
}

export default function LoginScreen({ onLogin }) {
  const [step,     setStep]     = useState(1)
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')
  const [code,     setCode]     = useState('')
  const [userData, setUserData] = useState(null)
  const [err,      setErr]      = useState('')
  const [loading,  setLoading]  = useState(false)

  const step1 = async () => {
    setErr(''); setLoading(true)
    try {
      // ── تحقق من المدير الرئيسي ──
      if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        const ok = await checkPassword(pass, ADMIN_PASS_RAW)
        if (ok) {
          setUserData({ name: 'المدير', email: ADMIN_EMAIL, role: 'admin', permissions: {} })
          setStep(2); setLoading(false); return
        }
      }

      // ── تحقق من موظف ──
      const { data, error } = await supabase
        .from('employees')
        .select('id,name,email,role,permissions,password,password_hash')
        .eq('username', email.trim())
        .maybeSingle()

      if (error) throw error

      if (data) {
        const stored = data.password_hash || data.password || ''
        const ok = await checkPassword(pass, stored)
        if (ok) {
          let perms = {}
          try { perms = typeof data.permissions === 'string' ? JSON.parse(data.permissions || '{}') : (data.permissions || {}) } catch {}
          setUserData({ name: data.name, email: data.email, role: data.role, permissions: perms, id: data.id })
          setStep(2); setLoading(false); return
        }
      }

      setErr('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } catch (e) {
      console.error(e)
      setErr('حدث خطأ أثناء الاتصال، حاول مجدداً')
    }
    setLoading(false)
  }

  const step2 = () => {
    if (code !== TWO_FA_CODE) { setErr('كود التحقق غير صحيح'); return }
    onLogin(userData)
  }

  if (step === 2) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E293B,#0F172A)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:24, padding:36, width:'100%', maxWidth:400,
        boxShadow:'0 24px 64px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:40 }}>🔐</div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#1e293b', marginTop:8 }}>التحقق الثنائي</h2>
          <p style={{ color:CLR.textSm, fontSize:14, marginTop:4 }}>كود التحقق المكوّن من 4 أرقام</p>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:20 }}>
          {[0,1,2,3].map(i => (
            <input key={i} id={`otp-${i}`} maxLength={1} inputMode="numeric"
              value={code[i] || ''}
              onChange={e => {
                const v = e.target.value.replace(/\D/,'')
                const arr = (code + '    ').split(''); arr[i] = v
                setCode(arr.join('').trim())
                if (v && i < 3) document.getElementById(`otp-${i+1}`)?.focus()
              }}
              onKeyDown={e => {
                if (e.key==='Backspace' && !code[i] && i>0) document.getElementById(`otp-${i-1}`)?.focus()
                if (e.key==='Enter') step2()
              }}
              style={{ width:56, height:60, border:'2px solid #e2e8f0', borderRadius:12,
                textAlign:'center', fontSize:24, fontWeight:900, outline:'none',
                background:'#f8fafc', fontFamily:'inherit', transition:'.15s' }}
            />
          ))}
        </div>

        {err && <p style={{ color:'#ef4444', fontSize:13, marginBottom:14,
          background:'#fef2f2', padding:10, borderRadius:10, textAlign:'center' }}>{err}</p>}

        <button style={{ ...S.btn, width:'100%', padding:14, fontSize:16, justifyContent:'center' }} onClick={step2}>
          ✅ تأكيد الدخول
        </button>
        <button onClick={() => { setStep(1); setCode(''); setErr('') }}
          style={{ ...S.btnGray, width:'100%', marginTop:10, padding:12, textAlign:'center' }}>
          ← رجوع
        </button>
      </div>
    </div>
  )

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
          <label style={S.label}>البريد الإلكتروني</label>
          <input style={S.input} type="email" value={email} autoComplete="email"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key==='Enter' && step1()}
            placeholder="admin@example.com" />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={S.label}>كلمة المرور</label>
          <input style={S.input} type="password" value={pass} autoComplete="current-password"
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key==='Enter' && step1()} />
        </div>

        {err && <p style={{ color:'#ef4444', fontSize:13, marginBottom:14,
          background:'#fef2f2', padding:'10px 14px', borderRadius:10 }}>{err}</p>}

        <button style={{ ...S.btn, width:'100%', padding:14, fontSize:16,
          justifyContent:'center', opacity: loading ? .7 : 1 }}
          onClick={step1} disabled={loading}>
          {loading ? '⏳ جاري التحقق...' : '🔐 دخول'}
        </button>

        <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:CLR.textSm }}>
          🔒 الاتصال مشفّر · 2FA
        </p>
      </div>
    </div>
  )
}
