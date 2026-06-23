import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== LoginModal ==========
export default function LoginModal({ onClose, onLogin, onRegister }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !pass) { showToast('أدخل البيانات', true); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) { showToast('البريد أو كلمة المرور غير صحيحة', true); setLoading(false); return }
      const { data: customerData, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', data.user.id)
        .single()
      if (custError) { showToast('حدث خطأ في جلب بياناتك', true); setLoading(false); return }
      onLogin(customerData)
    } catch (err) { showToast('حدث خطأ غير متوقع', true) }
    setLoading(false)
  }

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center">
        <div style={{ textAlign: 'center', padding: '24px 18px 0' }}>
          <div style={{ fontSize: 40 }}>🛍️</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0D1B2A', margin: '8px 0 4px' }}>نقاء</h2>
        </div>
        <div className="mbody">
          <label className="fi-label">البريد الإلكتروني</label>
          <input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="email" autoFocus />
          <label className="fi-label">كلمة المرور</label>
          <input className="fi" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="current-password" />
          <button className="abtn" onClick={submit} disabled={loading}>{loading ? '⏳ جاري الدخول...' : '🔐 دخول'}</button>
          <button className="abtn purple" onClick={onRegister}>📝 إنشاء حساب جديد</button>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#1565C0', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', fontWeight: 600 }}>متابعة كزائر</button>
          </div>
        </div>
      </div>
    </div>
  )
}
