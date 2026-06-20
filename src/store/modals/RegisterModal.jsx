import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== RegisterModal ==========
export default function RegisterModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', pass: '', pass2: '' })
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState('')
  const [genOtp, setGenOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [digits, setDigits] = useState(['', '', '', ''])
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  const handleDigit = (i, v) => {
    const nd = [...digits]; nd[i] = v.replace(/\D/, ''); setDigits(nd)
    if (nd[i] && i < 3) refs[i + 1].current?.focus()
    if (!nd[i] && i > 0) refs[i - 1].current?.focus()
    setOtp(nd.join(''))
  }
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    const { name, email, phone, pass, pass2 } = form
    if (!name || !email || !phone || !pass) { showToast('أكمل البيانات', true); return }
    if (pass !== pass2) { showToast('كلمتا المرور غير متطابقتان', true); return }
    setLoading(true)
    try {
      const { data: ex } = await supabase.from('customers').select('id').eq('email', email).maybeSingle()
      if (ex) { showToast('البريد مسجّل مسبقاً', true); setLoading(false); return }
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { name, phone, address } }
      })
      if (error) { showToast('خطأ: ' + error.message, true); setLoading(false); return }
      const { error: insertError } = await supabase.from('customers').insert({
        id: data.user.id,
        name,
        email,
        phone,
        address,
        points: 0,
        tier: 'M1',
        created_at: new Date().toISOString()
      })
      if (insertError) { showToast('خطأ في حفظ البيانات: ' + insertError.message, true); setLoading(false); return }
      const code = String(Math.floor(1000 + Math.random() * 9000))
      setGenOtp(code)
      setStep(2)
      showToast(`📱 كود التحقق: ${code}`)
    } catch (err) { showToast('حدث خطأ غير متوقع', true) }
    setLoading(false)
  }

  const verify = async () => {
    if (otp !== genOtp) { showToast('الكود غير صحيح', true); return }
    setLoading(true)
    showToast('✅ تم التسجيل بنجاح!')
    onSuccess()
    setLoading(false)
  }

  if (step === 2) {
    return (
      <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="msheet center">
          <div className="mhead"><h3>📱 تأكيد الحساب</h3><button className="mclose" onClick={onClose}>×</button></div>
          <div className="mbody" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#0077B6', marginBottom: 16 }}>أدخل كود التحقق المكون من 4 أرقام</p>
            <div className="otp-inputs">
              {digits.map((d, i) => (
                <input key={i} ref={refs[i]} className="otp-input" value={d} inputMode="numeric" maxLength={1}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) refs[i - 1].current?.focus() }} />
              ))}
            </div>
            <div style={{ background: '#DBEAFE', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13 }}>
              🔑 كودك: <strong style={{ fontSize: 20, color: '#0077B6' }}>{genOtp}</strong>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>في الإصدار الكامل يُرسل على واتساب تلقائياً</p>
            </div>
            <button className="abtn" onClick={verify} disabled={loading || otp.length < 4}>{loading ? '⏳...' : '✅ تأكيد التسجيل'}</button>
            <button style={{ background: 'none', border: 'none', color: '#0077B6', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
              onClick={() => { setStep(1); setDigits(['', '', '', '']) }}>← تعديل البيانات</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📝 حساب جديد</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <label className="fi-label">الاسم الكامل *</label>
          <input className="fi" value={form.name} onChange={F('name')} autoComplete="name" />
          <label className="fi-label">البريد الإلكتروني *</label>
          <input className="fi" type="email" value={form.email} onChange={F('email')} autoComplete="email" />
          <label className="fi-label">رقم الهاتف *</label>
          <input className="fi" type="tel" value={form.phone} onChange={F('phone')} inputMode="numeric" autoComplete="tel" onKeyPress={e => { if (!/[0-9+]/.test(e.key)) e.preventDefault() }} />
          <label className="fi-label">العنوان</label>
          <input className="fi" value={form.address} onChange={F('address')} autoComplete="street-address" />
          <label className="fi-label">كلمة المرور *</label>
          <input className="fi" type="password" value={form.pass} onChange={F('pass')} autoComplete="new-password" />
          <label className="fi-label">تأكيد كلمة المرور *</label>
          <input className="fi" type="password" value={form.pass2} onChange={F('pass2')} autoComplete="new-password" />
          <button className="abtn" onClick={submit} disabled={loading}>{loading ? '⏳...' : '📱 التالي — تأكيد الهاتف'}</button>
        </div>
      </div>
    </div>
  )
}
