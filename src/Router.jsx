import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loadAll } from './lib/db.js'

// تحميل الصفحتين
import Admin from './admin/Admin.jsx'
import Store from './store/Store.jsx'

export default function Router() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAll()
      .then(ok => {
        // نُظهر المتجر دائماً حتى لو فشل تحميل بعض الجداول
        setReady(true)
        if (!ok) console.warn('تحذير: فشل تحميل بعض البيانات من Supabase')
      })
      .catch(() => {
        setReady(true)
      })
  }, [])

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
