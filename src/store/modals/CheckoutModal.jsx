import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== CheckoutModal ==========
export default function CheckoutModal({ cart, finalTotal, onClose, onSuccess, currency, waNum, storeName, customer, onPointsUpdate, settings, pointsUsed }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState('')
  const [genOtp, setGenOtp] = useState('')
  const [digits, setDigits] = useState(['', '', '', ''])
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const [loading, setLoading] = useState(false)
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const sendCodeViaWhatsApp = (phone, name, code) => {
    let waNumber = phone.replace(/^0/, '213')
    waNumber = waNumber.replace(/[^0-9]/g, '')
    const message = `🔐 كود تأكيد الطلبية - ${storeName || 'نقاء'}\n\nمرحباً ${name}،\nكود تأكيد طلبيتك هو: *${code}*\n\nأدخل هذا الكود لإتمام طلبك.`
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const goToOtp = () => {
    if (!form.name || !form.phone) { showToast('الاسم والهاتف مطلوبان', true); return }
    const code = String(Math.floor(1000 + Math.random() * 9000))
    setGenOtp(code)
    sendCodeViaWhatsApp(form.phone, form.name, code)
    showToast(`📱 تم إرسال الكود إلى ${form.phone} عبر واتساب`)
    setStep(3)
  }

  const handleDigit = (i, v) => {
    const nd = [...digits]
    nd[i] = v.replace(/\D/, '')
    setDigits(nd)
    if (nd[i] && i < 3) refs[i + 1].current?.focus()
    if (!nd[i] && i > 0) refs[i - 1].current?.focus()
    setOtp(nd.join(''))
  }

  const resendCode = () => {
    const newCode = String(Math.floor(1000 + Math.random() * 9000))
    setGenOtp(newCode)
    sendCodeViaWhatsApp(form.phone, form.name, newCode)
    showToast(`📱 تم إعادة إرسال الكود إلى ${form.phone}`)
  }

  const confirmOrder = async () => {
    if (otp !== genOtp) {
      showToast('❌ الكود غير صحيح، حاول مرة أخرى', true)
      setDigits(['', '', '', ''])
      setOtp('')
      refs[0].current?.focus()
      return
    }
    setLoading(true)
    const order = {
      id: Date.now(),
      customer_id: customer?.id || null,
      customer_name: form.name,
      customer_phone: form.phone,
      customer_address: form.address,
      date: new Date().toLocaleString('ar-DZ'),
      items: JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, quantity: i.qty, price: i.price }))),
      total: finalTotal,
      status: 'processing'
    }
    const { error } = await supabase.from('orders').insert(order)
    if (error) { showToast('خطأ: ' + error.message, true); setLoading(false); return }
    for (const item of cart) {
      const { data: p } = await supabase.from('products').select('stock').eq('id', item.id).maybeSingle()
      if (p) { await supabase.from('products').update({ stock: Math.max(0, (p.stock || 0) - item.qty) }).eq('id', item.id) }
    }
    // ✅ تحديث إجمالي مشتريات العميل
    if (customer?.id) {
      const { data: cu } = await supabase.from('customers').select('total_purchases').eq('id', customer.id).maybeSingle()
      await supabase.from('customers').update({ total_purchases: (parseFloat(cu?.total_purchases || 0) + finalTotal) }).eq('id', customer.id)
    }
    // ✅ إرسال إشعار للإدارة
    await supabase.from('notifications').insert({
      id: Date.now() + 1,
      title: `🛒 طلبية جديدة من ${form.name}`,
      body: `المبلغ: ${finalTotal} دج — ${cart.length} منتج`,
      date: new Date().toLocaleString('ar-DZ'),
      is_read: false,
    })
    // ✅ تحديث نقاط العميل في قاعدة البيانات
    // حساب النقاط المكتسبة
    const pointsPerOrder = parseFloat(settings?.points_per_order || '100')
    const pointsToDzd    = parseFloat(settings?.points_to_dzd   || '1')
    const pointsEarned   = pointsUsed > 0 ? 0 : Math.floor(finalTotal / pointsPerOrder)

    if (customer?.id) {
      const usedPoints = pointsUsed > 0 ? Math.ceil(pointsUsed / pointsToDzd) : 0
      const currentPoints = customer.points || 0
      const newPoints = Math.max(0, currentPoints - usedPoints) + pointsEarned
      try { await supabase.from('customers').update({ points: newPoints }).eq('id', customer.id) } catch {}
      if (onPointsUpdate) onPointsUpdate(newPoints)
    }

    let waNumber = form.phone.replace(/^0/, '213')
    waNumber = waNumber.replace(/[^0-9]/g, '')
    const pointsPerOrderCalc = parseFloat(settings?.points_per_order || '100')
    const pointsToDzdCalc    = parseFloat(settings?.points_to_dzd   || '1')
    const earnedCalc = pointsUsed > 0 ? 0 : Math.floor(finalTotal / pointsPerOrderCalc)
    const usedCalc   = pointsUsed > 0 ? Math.ceil(pointsUsed / pointsToDzdCalc) : 0
    const earnedMsg = pointsUsed > 0
      ? `\n⭐ تم خصم ${usedCalc} نقطة من رصيدك`
      : earnedCalc > 0 ? `\n⭐ كسبت ${earnedCalc} نقطة! رصيدك الجديد: ${(customer?.points || 0) + earnedCalc} نقطة` : ''
    const confirmMsg = `✅ تم تأكيد طلبك رقم ${order.id} بنجاح!\n\nالإجمالي: ${finalTotal.toFixed(0)} ${currency}${earnedMsg}\nشكراً لتسوقكم مع ${storeName || 'نقاء'} 🛍️`
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(confirmMsg)}`, '_blank')
    onSuccess(order.id)
    setLoading(false)
  }

  if (step === 3) {
    return (
      <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="msheet center">
          <div className="mhead"><h3>🔐 تأكيد الطلبية</h3><button className="mclose" onClick={onClose}>×</button></div>
          <div className="mbody" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
            <p style={{ fontSize: 14, color: 'var(--clr-primary,#1565C0)', marginBottom: 4 }}>تم إرسال كود التأكيد إلى رقم هاتفك عبر واتساب</p>
            <p style={{ fontWeight: 700, color: 'var(--clr-primary,#1565C0)', marginBottom: 16, fontSize: 15 }}>{form.phone}</p>
            <div className="otp-inputs">
              {digits.map((d, i) => (
                <input key={i} ref={refs[i]} className="otp-input" value={d} inputMode="numeric" maxLength={1}
                  autoFocus={i === 0} onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) refs[i - 1].current?.focus() }} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>أدخل الكود المكون من 4 أرقام الذي تلقيته على واتساب</p>
            <button onClick={resendCode} style={{ background: 'none', border: 'none', color: 'var(--clr-primary,#1565C0)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>🔄 لم يصلك الكود؟ أعد الإرسال</button>
            <button className="abtn green" onClick={confirmOrder} disabled={loading || otp.length < 4}>
              {loading ? '⏳ جاري التأكيد...' : '✅ تأكيد الطلبية'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📋 تأكيد الطلب</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <label className="fi-label">الاسم الكامل *</label>
          <input className="fi" value={form.name} onChange={F('name')} autoComplete="name" placeholder="أدخل اسمك الكامل" />
          <label className="fi-label">رقم الهاتف *</label>
          <input className="fi" type="tel" value={form.phone} onChange={F('phone')} inputMode="numeric" autoComplete="tel" placeholder="مثال: 0555123456" onKeyPress={e => { if (!/[0-9+]/.test(e.key)) e.preventDefault() }} />
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: -8, marginBottom: 12 }}>📱 سيُرسل كود التأكيد إلى هذا الرقم عبر واتساب</p>
          <label className="fi-label">العنوان</label>
          <textarea className="fi" rows="2" value={form.address} onChange={F('address')} style={{ resize: 'none' }} autoComplete="street-address" placeholder="أدخل عنوان التوصيل" />
          <div style={{ background: '#EEF4FF', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>إجمالي الطلب</span>
            <span style={{ fontWeight: 900, color: 'var(--clr-primary,#1565C0)', fontSize: 18 }}>{finalTotal.toFixed(0)} {currency}</span>
          </div>
          <button className="abtn" onClick={goToOtp}><i className="fas fa-shield-alt"></i> التالي — تأكيد بكود</button>
          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>🔒 سيتم إرسال كود تأكيد عبر واتساب للتحقق من هويتك</p>
        </div>
      </div>
    </div>
  )
}
