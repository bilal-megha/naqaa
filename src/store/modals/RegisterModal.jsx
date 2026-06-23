import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'
import { hashPassword } from '../../lib/authHelpers.js'

/**
 * RegisterModal — تسجيل برقم الهاتف أو البريد
 * الخطوات:
 *   1. اختيار طريقة التسجيل
 *   2. إدخال البيانات
 *   3. تأكيد OTP
 */
export default function RegisterModal({ onClose, onSuccess, primaryColor = '#1565C0' }) {
  const [mode,    setMode]    = useState('phone')
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [showP,   setShowP]   = useState(false)
  const [genOtp,  setGenOtp]  = useState('')
  const [otp,     setOtp]     = useState('')
  const [digits,  setDigits]  = useState(['','','',''])
  const refs = [useRef(),useRef(),useRef(),useRef()]

  const [form, setForm] = useState({
    name:'', phone:'', email:'', address:'', pass:'', pass2:''
  })
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleDigit = (i, v) => {
    const nd = [...digits]; nd[i] = v.replace(/\D/,''); setDigits(nd)
    if (nd[i] && i < 3) refs[i+1].current?.focus()
    if (!nd[i] && i > 0) refs[i-1].current?.focus()
    setOtp(nd.join(''))
  }

  const validate = () => {
    if (!form.name.trim())  { showToast('أدخل الاسم الكامل', true); return false }
    if (mode==='phone' && form.phone.replace(/\D/g,'').length < 9) {
      showToast('أدخل رقم هاتف صحيح', true); return false
    }
    if (mode==='email' && !form.email.includes('@')) {
      showToast('أدخل بريد إلكتروني صحيح', true); return false
    }
    if (form.pass.length < 6) { showToast('كلمة المرور 6 أحرف على الأقل', true); return false }
    if (form.pass !== form.pass2) { showToast('كلمتا المرور غير متطابقتان', true); return false }
    return true
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const phone = form.phone.replace(/\s/g,'').replace(/^0/,'213')

      // فحص التكرار
      if (mode === 'phone') {
        const { data: ex } = await supabase.from('customers').select('id')
          .or(`phone.eq.${phone},phone.eq.0${phone.slice(3)}`)
          .maybeSingle()
        if (ex) { showToast('هذا الرقم مسجّل مسبقاً', true); setLoading(false); return }
      } else {
        const { data: ex } = await supabase.from('customers').select('id')
          .eq('email', form.email.toLowerCase().trim()).maybeSingle()
        if (ex) { showToast('هذا البريد مسجّل مسبقاً', true); setLoading(false); return }
      }

      // توليد OTP
      const code = String(Math.floor(1000 + Math.random() * 9000))
      setGenOtp(code)
      showToast(`📱 كود التحقق: ${code}`)
      setStep(2)
    } catch(e) { showToast('حدث خطأ', true) }
    setLoading(false)
  }

  const verify = async () => {
    if (otp !== genOtp) { showToast('الكود غير صحيح', true); return }
    setLoading(true)
    try {
      const phone = form.phone.replace(/\s/g,'').replace(/^0/,'213')
      const hashedPass = hashPassword(form.pass)
      const newId = Date.now()

      const { error } = await supabase.from('customers').insert({
        id:             newId,
        name:           form.name.trim(),
        phone:          mode==='phone' ? phone : form.phone,
        email:          form.email.toLowerCase().trim() || null,
        address:        form.address.trim() || null,
        password:       form.pass,
        password_hash:  hashedPass,
        points:         0,
        tier:           'M1',
        total_purchases: 0,
        created_at:     new Date().toISOString(),
      })

      if (error) { showToast('خطأ: ' + error.message, true); setLoading(false); return }

      showToast('✅ تم إنشاء حسابك بنجاح!')
      onSuccess()
    } catch(e) { showToast('حدث خطأ: ' + e.message, true) }
    setLoading(false)
  }

  // ── Step 2: OTP ──────────────────────────────────
  if (step === 2) return (
    <div className="moverlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="msheet center" style={{ maxWidth:360 }}>
        <div className="mhandle" />
        <div className="mhead">
          <h3>📱 تأكيد {mode==='phone' ? 'الهاتف' : 'البريد'}</h3>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody" style={{ textAlign:'center' }}>
          <div style={{ fontSize:50, marginBottom:10 }}>🔐</div>
          <p style={{ color:'#475569', fontSize:14, marginBottom:6 }}>
            أدخل الكود المكون من 4 أرقام
          </p>
          <p style={{ color:primaryColor, fontWeight:900, fontSize:14, marginBottom:20 }}>
            {mode==='phone' ? form.phone : form.email}
          </p>

          <div className="otp-inputs" style={{ justifyContent:'center', gap:12, marginBottom:20 }}>
            {digits.map((d,i) => (
              <input key={i} ref={refs[i]} className="otp-input"
                value={d} inputMode="numeric" maxLength={1}
                style={{ borderColor: d ? primaryColor : '#E2E8F0',
                  boxShadow: d ? `0 0 0 3px ${primaryColor}22` : 'none' }}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => { if (e.key==='Backspace' && !d && i>0) refs[i-1].current?.focus() }} />
            ))}
          </div>

          <div style={{ background:'#EEF4FF', borderRadius:12, padding:'10px 14px',
            marginBottom:18, fontSize:13 }}>
            🔑 كودك التجريبي: <strong style={{ fontSize:18, color:primaryColor }}>{genOtp}</strong>
            <p style={{ fontSize:11, color:'#94a3b8', margin:'4px 0 0' }}>
              في الإصدار النهائي يُرسل تلقائياً
            </p>
          </div>

          <button className="abtn" onClick={verify}
            disabled={loading || otp.length < 4}>
            {loading ? '⏳ جاري إنشاء الحساب...' : '✅ تأكيد وإنشاء الحساب'}
          </button>
          <button onClick={() => { setStep(1); setDigits(['','','','']); setOtp('') }}
            style={{ background:'none', border:'none', color:primaryColor,
              cursor:'pointer', fontSize:13, fontFamily:'inherit',
              marginTop:12, display:'block', width:'100%', fontWeight:700 }}>
            ← تعديل البيانات
          </button>
        </div>
      </div>
    </div>
  )

  // ── Step 1: Form ─────────────────────────────────
  return (
    <div className="moverlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="msheet center" style={{ maxWidth:420 }}>
        <div className="mhandle" />
        <div className="mhead">
          <h3>📝 حساب جديد</h3>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">

          {/* Toggle */}
          <div style={{ display:'flex', background:'#F1F5F9', borderRadius:30,
            padding:4, marginBottom:20 }}>
            {[['phone','📱 رقم الهاتف'],['email','📧 البريد']].map(([m,l]) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex:1, padding:'9px', borderRadius:26, border:'none',
                  background: mode===m ? 'white' : 'transparent',
                  color: mode===m ? primaryColor : '#94a3b8',
                  fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                  boxShadow: mode===m ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
                  transition:'.2s' }}>
                {l}
              </button>
            ))}
          </div>

          <label className="fi-label">الاسم الكامل *</label>
          <input className="fi" value={form.name} onChange={F('name')}
            placeholder="أحمد بن علي" autoComplete="name" autoFocus />

          {mode === 'phone' ? (<>
            <label className="fi-label">رقم الهاتف *</label>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <div style={{ background:'#F8FAFC', border:'1.5px solid #E2E8F0',
                borderRadius:12, padding:'12px 14px', fontWeight:700,
                fontSize:14, color:'#475569', flexShrink:0 }}>
                🇩🇿 +213
              </div>
              <input className="fi" style={{ margin:0, flex:1 }}
                type="tel" inputMode="numeric" value={form.phone}
                onChange={F('phone')} placeholder="0555 123 456" autoComplete="tel" />
            </div>
            <label className="fi-label">البريد الإلكتروني (اختياري)</label>
            <input className="fi" type="email" value={form.email}
              onChange={F('email')} placeholder="example@email.com" autoComplete="email" />
          </>) : (<>
            <label className="fi-label">البريد الإلكتروني *</label>
            <input className="fi" type="email" value={form.email}
              onChange={F('email')} placeholder="example@email.com" autoComplete="email" />
            <label className="fi-label">رقم الهاتف (اختياري)</label>
            <input className="fi" type="tel" value={form.phone}
              onChange={F('phone')} placeholder="0555 123 456" autoComplete="tel" />
          </>)}

          <label className="fi-label">العنوان / الولاية</label>
          <input className="fi" value={form.address} onChange={F('address')}
            placeholder="الجزائر العاصمة" autoComplete="street-address" />

          <label className="fi-label">كلمة المرور * (6 أحرف على الأقل)</label>
          <div style={{ position:'relative', marginBottom:14 }}>
            <input className="fi" style={{ margin:0, paddingLeft:44 }}
              type={showP ? 'text':'password'} value={form.pass}
              onChange={F('pass')} placeholder="••••••••" autoComplete="new-password" />
            <button onClick={() => setShowP(p=>!p)}
              style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16, padding:4 }}>
              {showP ? '🙈':'👁️'}
            </button>
          </div>

          <label className="fi-label">تأكيد كلمة المرور *</label>
          <input className="fi" type="password" value={form.pass2}
            onChange={F('pass2')} placeholder="••••••••" autoComplete="new-password" />

          {/* مؤشر قوة كلمة المرور */}
          {form.pass.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', gap:4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex:1, height:4, borderRadius:99,
                    background: form.pass.length >= i*2
                      ? i<=1 ? '#EF4444' : i<=2 ? '#F59E0B' : i<=3 ? '#3B82F6' : '#10B981'
                      : '#E2E8F0',
                    transition:'.3s' }} />
                ))}
              </div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:4, fontWeight:600 }}>
                {form.pass.length<4 ? 'ضعيفة' : form.pass.length<7 ? 'متوسطة' : form.pass.length<10 ? 'جيدة' : 'قوية جداً'}
              </div>
            </div>
          )}

          <button className="abtn" onClick={submit} disabled={loading}>
            {loading ? '⏳ جاري التحقق...' : `📱 التالي — تأكيد ${mode==='phone' ? 'الهاتف' : 'البريد'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
