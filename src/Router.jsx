import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loadAll } from './lib/db.js'

import Admin from './admin/Admin.jsx'
import Store from './store/Store.jsx'

export default function Router() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadAll()
      .then(() => setReady(true))
      .catch(() => setReady(true))
  }, [])

  if (!ready) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'100vh', background:'#F7F3EF', gap:16 }}>
      <div style={{ width:48, height:48, border:'4px solid #FF6B35',
        borderTopColor:'transparent', borderRadius:'50%',
        animation:'spin 1s linear infinite' }}/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <p style={{ fontFamily:'Tajawal,sans-serif', fontWeight:900,
        color:'#FF6B35', fontSize:22 }}>نقاء</p>
      <p style={{ fontFamily:'Tajawal,sans-serif', color:'#7A6A5A', fontSize:14 }}>
        جاري تحميل المتجر...
      </p>
    </div>
  )

  return (
    <Routes>
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/*"       element={<Store />} />
    </Routes>
  )
}
