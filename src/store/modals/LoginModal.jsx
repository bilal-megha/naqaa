import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'
import { verifyPassword } from '../../lib/authHelpers.js'

/**
 * LoginModal — دخول برقم الهاتف أو البريد الإلكتروني
 * الخطوات:
 *   1. إدخال هاتف/بريد + كلمة مرور
 *   2. (إذا هاتف) OTP للتحقق
 */
export default function LoginModal({ onClose, onLogin, onRegister, primaryColor = '#1565C0' }) {
  const [mode,    setMode]    = useState('phone')   // 'phone' | 'email'
  const [phone,   setPhone]   = useState('')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [step,    setStep]    = useState(1)          // 1=form 2=otp
  const [otp,     setOtp]     = useState('')
  const [genOtp,  setGenOtp]  = useState('')
  const [digits,  setDigits]  = useState(['','','',''])
  const [loading, setLoading] = useState(false)
  const [showP,   setShowP]   = useState(false)
  const refs = [useRef(),useRef(),useRef(),useRef()]

  const handleDigit = (i, v) => {
    const nd = [...digits]; nd[i] = v.replace(/\D/,''); setDigits(nd)
    if (nd[i] && i < 3) refs[i+1].current?.focus()
    if (!nd[i] && i > 0) refs[i-1].current?.focus()
    setOtp(nd.join(''))
  }

  // ── دخول برقم الهاتف ──────────────────────────────
  const loginByPhone = async () => {
    const cleaned = phone.replace(/\s/g,'').replace(/^0/,'213')
    if (cleaned.length < 9) { showToast('أدخل رقم هاتف صحيح', true); return }
    if (!pass) { showToast('أدخل كلمة المرور', true); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${cleaned},phone.eq.0${cleaned.slice(3)},phone.eq.${phone.trim()}`)
        .maybeSingle()

      if (error || !data) { showToast('الرقم غير مسجّل', true); setLoading(false); return }
      if (!verifyPassword(pass, data.password_hash || data.password)) {
        showToast('كلمة المرور غير صحيحة', true); setLoading(false); return
      }
      // توليد OTP وإرساله عبر واتساب
      const code = String(Math.floor(1000 + Math.random() * 9000))
      setGenOtp(code)
      // في الإنتاج: أرسل عبر API واتساب
      // await sendWhatsappOTP(cleaned, code)
      showToast(`📱 كود التحقق: ${code}`) // مؤقت للتطوير
      setStep(2)
    } catch(e) { showToast('حدث خطأ', true) }
    setLoading(false)
  }

  // ── دخول بالبريد الإلكتروني ───────────────────────
  const loginByEmail = async () => {
    if (!email || !pass) { showToast('أدخل البيانات', true); return }
    setLoading(true)
    try {
      // أولاً: ابحث في جدول customers مباشرة
      const { data: cust } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()

      if (!cust) { showToast('البريد غير مسجّل', true); setLoading(false); return }
      if (!verifyPassword(pass, cust.password_hash || cust.password)) {
        showToast('كلمة المرور غير صحيحة', true); setLoading(false); return
      }
      onLogin(cust)
    } catch(e) { showToast('حدث خطأ', true) }
    setLoading(false)
  }

  // ── التحقق من OTP ──────────────────────────────────
  const verifyOtp = async () => {
    if (otp !== genOtp) { showToast('الكود غير صحيح', true); return }
    setLoading(true)
    try {
      const cleaned = phone.replace(/\s/g,'').replace(/^0/,'213')
      const { data } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${cleaned},phone.eq.0${cleaned.slice(3)},phone.eq.${phone.trim()}`)
        .maybeSingle()
      if (data) onLogin(data)
      else showToast('خطأ في البيانات', true)
    } catch(e) { showToast('حدث خطأ', true) }
    setLoading(false)
  }

  // ── OTP Screen ────────────────────────────────────
  if (step === 2) return (
    <div className="moverlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="msheet center" style={{ maxWidth: 360 }}>
        <div className="mhandle" />
        <div className="mhead">
          <h3>📱 تأكيد رقم الهاتف</h3>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody" style={{ textAlign:'center' }}>
          <p style={{ color:'#475569', fontSize:14, marginBottom:8 }}>
            أدخل كود التحقق المرسل على واتساب
          </p>
          <p style={{ color: primaryColor, fontWeight:900, fontSize:15, marginBottom:20 }}>
            {phone}
          </p>
          <div className="otp-inputs" style={{ justifyContent:'center', gap:12, marginBottom:20 }}>
            {digits.map((d,i) => (
              <input key={i} ref={refs[i]} className="otp-input"
                value={d} inputMode="numeric" maxLength={1}
                style={{ borderColor: d ? primaryColor : '#E2E8F0' }}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => {
                  if (e.key==='Backspace' && !d && i>0) refs[i-1].current?.focus()
                }} />
            ))}
          </div>
          {/* مؤقت للتطوير */}
          <div style={{ background:'#EEF4FF', borderRadius:12, padding:'10px 14px',
            marginBottom:18, fontSize:13 }}>
            🔑 كودك التجريبي: <strong style={{ fontSize:18, color:primaryColor }}>{genOtp}</strong>
            <p style={{ fontSize:11, color:'#94a3b8', margin:'4px 0 0' }}>
              في الإصدار النهائي يُرسل على واتساب تلقائياً
            </p>
          </div>
          <button className="abtn" onClick={verifyOtp}
            disabled={loading || otp.length < 4}>
            {loading ? '⏳...' : '✅ تأكيد الدخول'}
          </button>
          <button onClick={() => { setStep(1); setDigits(['','','','']); setOtp('') }}
            style={{ background:'none', border:'none', color:primaryColor,
              cursor:'pointer', fontSize:13, fontFamily:'inherit',
              marginTop:12, fontWeight:700 }}>
            ← تغيير الرقم
          </button>
        </div>
      </div>
    </div>
  )

  // ── Main Screen ────────────────────────────────────
  return (
    <div className="moverlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="msheet center" style={{ maxWidth: 400 }}>
        <div className="mhandle" />

        {/* Logo */}
        <div style={{ textAlign:'center', padding:'22px 18px 0' }}>
          <div style={{ fontSize:44 }}>🛍️</div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0D1B2A', margin:'6px 0 2px' }}>
            نقاء
          </h2>
          <p style={{ fontSize:13, color:'#94a3b8', fontWeight:600, margin:0 }}>
            أهلاً بك — سجّل دخولك للمتابعة
          </p>
        </div>

        <div className="mbody">
          {/* Toggle phone/email */}
          <div style={{ display:'flex', background:'#F1F5F9', borderRadius:30,
            padding:4, marginBottom:20 }}>
            <button onClick={() => setMode('phone')}
              style={{ flex:1, padding:'9px', borderRadius:26, border:'none',
                background: mode==='phone' ? 'white' : 'transparent',
                color: mode==='phone' ? primaryColor : '#94a3b8',
                fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                boxShadow: mode==='phone' ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
                transition:'.2s' }}>
              📱 رقم الهاتف
            </button>
            <button onClick={() => setMode('email')}
              style={{ flex:1, padding:'9px', borderRadius:26, border:'none',
                background: mode==='email' ? 'white' : 'transparent',
                color: mode==='email' ? primaryColor : '#94a3b8',
                fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                boxShadow: mode==='email' ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
                transition:'.2s' }}>
              📧 البريد الإلكتروني
            </button>
          </div>

          {/* Fields */}
          {mode === 'phone' ? (
            <>
              <label className="fi-label">رقم الهاتف</label>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <div style={{ background:'#F8FAFC', border:'1.5px solid #E2E8F0',
                  borderRadius:12, padding:'12px 14px', fontWeight:700,
                  fontSize:14, color:'#475569', flexShrink:0 }}>
                  🇩🇿 +213
                </div>
                <input className="fi" style={{ margin:0, flex:1 }}
                  type="tel" inputMode="numeric" value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^\d+\s]/g,''))}
                  onKeyDown={e => e.key==='Enter' && loginByPhone()}
                  placeholder="0555 123 456" autoComplete="tel" autoFocus />
              </div>
            </>
          ) : (
            <>
              <label className="fi-label">البريد الإلكتروني</label>
              <input className="fi" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key==='Enter' && loginByEmail()}
                placeholder="example@email.com" autoComplete="email" autoFocus />
            </>
          )}

          <label className="fi-label">كلمة المرور</label>
          <div style={{ position:'relative', marginBottom:14 }}>
            <input className="fi" style={{ margin:0, paddingLeft:44 }}
              type={showP ? 'text' : 'password'} value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key==='Enter' && (mode==='phone' ? loginByPhone() : loginByEmail())}
              placeholder="••••••••" autoComplete="current-password" />
            <button onClick={() => setShowP(p => !p)}
              style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', color:'#94a3b8',
                fontSize:16, padding:4 }}>
              {showP ? '🙈' : '👁️'}
            </button>
          </div>

          <button className="abtn" style={{ marginBottom:10 }}
            onClick={mode==='phone' ? loginByPhone : loginByEmail}
            disabled={loading}>
            {loading ? '⏳ جاري التحقق...' : mode==='phone' ? '📱 إرسال كود التحقق' : '🔐 دخول'}
          </button>

          <button className="abtn" style={{ background:'linear-gradient(135deg,#7C3AED,#6D28D9)' }}
            onClick={onRegister}>
            📝 إنشاء حساب جديد
          </button>

          <div style={{ textAlign:'center', marginTop:14 }}>
            <button onClick={onClose}
              style={{ background:'none', border:'none', color:'#94a3b8',
                cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:600 }}>
              متابعة كزائر ←
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
