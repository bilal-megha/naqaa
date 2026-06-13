import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase.js'
import Admin from './admin/Admin.jsx'
import Store from './store/Store.jsx'

export default function Router() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // اختبار الاتصال بـ Supabase
    supabase.from('settings').select('key').limit(1)
      .then(({ error: err }) => {
        if (err && err.code !== 'PGRST116') {
          setError('تعذّر الاتصال بقاعدة البيانات. تحقق من إعدادات .env')
        } else {
          setReady(true)
        }
      })
      .catch(() => setError('تعذّر الاتصال بقاعدة البيانات'))
  }, [])

  if (error) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',
      minHeight:'100vh',background:'#fee2e2',flexDirection:'column',gap:16,padding:24 }}>
      <span style={{ fontSize:48 }}>⚠️</span>
      <h2 style={{ color:'#dc2626',fontSize:20 }}>{error}</h2>
      <p style={{ color:'#475569',fontSize:14,textAlign:'center' }}>
        تأكد من وجود متغيرات البيئة <code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code>
      </p>
    </div>
  )

  if (!ready) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <h2 style={{ fontSize:24,fontWeight:700 }}>نقاء 🌿</h2>
      <p style={{ opacity:.8,marginTop:8,fontSize:14 }}>جاري التحميل...</p>
    </div>
  )

  return (
    <Routes>
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/*"       element={<Store />} />
    </Routes>
  )
}
