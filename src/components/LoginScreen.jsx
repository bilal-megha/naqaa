import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function LoginScreen({ onLogin }) {
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async () => {
    if (!phone || !password) { setError('أدخل رقم الهاتف وكلمة المرور'); return }
    setLoading(true); setError('')
    try {
      const { data, error: e } = await supabase.rpc('verify_employee_login', {
        p_phone: phone, p_password: password
      })
      if (e || !data?.length) { setError('رقم الهاتف أو كلمة المرور غير صحيحة'); return }
      const emp = data[0]
      onLogin({ id: emp.emp_id, name: emp.emp_name, phone: emp.emp_phone, role: emp.emp_role })
    } catch { setError('حدث خطأ، حاول مجدداً')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#1E293B',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Tajawal','Cairo',sans-serif", direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:20, padding:36,
        width:340, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🏢</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#F97316', margin:0 }}>صفاء</h1>
          <p style={{ fontSize:13, color:'#64748B', margin:'4px 0 0' }}>لوحة الإدارة</p>
        </div>
        {error && (
          <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:10,
            padding:'10px 14px', fontSize:13, fontWeight:700, marginBottom:16 }}>
            ❌ {error}
          </div>
        )}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>
            رقم الهاتف
          </label>
          <input value={phone} onChange={e => setPhone(e.target.value)}
            style={{ width:'100%', padding:'11px 14px', borderRadius:10,
              border:'1.5px solid #E2E8F0', fontSize:14, fontFamily:'inherit',
              outline:'none', boxSizing:'border-box', direction:'ltr', textAlign:'right' }}
            placeholder="0000" />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>
            كلمة المرور
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width:'100%', padding:'11px 14px', borderRadius:10,
              border:'1.5px solid #E2E8F0', fontSize:14, fontFamily:'inherit',
              outline:'none', boxSizing:'border-box' }}
            placeholder="••••••" />
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{ width:'100%', padding:'12px', background: loading ? '#94A3B8' : '#F97316',
            color:'white', border:'none', borderRadius:10, fontSize:15,
            fontWeight:800, cursor: loading ? 'default' : 'pointer',
            fontFamily:'inherit', transition:'.2s' }}>
          {loading ? '⏳ جاري الدخول...' : '🔐 دخول'}
        </button>
        <p style={{ textAlign:'center', fontSize:11, color:'#94A3B8', marginTop:16 }}>
          صفاء — نظام إدارة المخزن والمبيعات
        </p>
      </div>
    </div>
  )
}
