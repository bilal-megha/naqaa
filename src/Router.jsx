import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loadAll } from './lib/db.js'

// تحميل الصفحتين
// ✅ تم تحديث المسار: الإدارة الآن مقسّمة في src/admin/ (index.jsx + pages/ + components/ + hooks/)
import Admin from './admin/index.jsx'
import Store from './store/Store.jsx'

export default function Router() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAll()
      .then(ok => {
        if (ok) setReady(true)
        else setError('تعذّر الاتصال بقاعدة البيانات. تحقق من إعدادات .env')
      })
  }, [])

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#fee2e2', flexDirection:'column', gap:16, padding:24 }}>
      <i className="fas fa-exclamation-triangle" style={{ fontSize:48, color:'#dc2626' }}></i>
      <h2 style={{ color:'#dc2626', fontSize:20 }}>{error}</h2>
      <p style={{ color:'#475569', fontSize:14, textAlign:'center' }}>
        تأكد من وجود ملف <code>.env</code> يحتوي على<br/>
        <code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code>
      </p>
    </div>
  )

  if (!ready) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <h2 style={{ fontSize: 24, fontWeight: 700 }}>نقاء</h2>
      <p style={{ opacity: 0.8, marginTop: 8 }}>جاري تحميل البيانات...</p>
    </div>
  )

  return (
    <Routes>
      {/* /admin  ← لوحة الإدارة */}
      <Route path="/admin/*" element={<Admin />} />
      {/* /       ← المتجر للزبائن */}
      <Route path="/*"       element={<Store />} />
    </Routes>
  )
}
