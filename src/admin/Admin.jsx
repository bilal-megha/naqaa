/**
 * Admin.jsx — نسخة مبسطة خالية من الأخطاء
 */
import { useState, useEffect } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

const ADMIN_EMAIL = 'meghamel2012@gmail.com'
const ADMIN_PASS_HASH = CryptoJS.SHA256('afbilalaf06').toString()
const TWO_FA_CODE = '6789'
const CUR = 'دج'

const hashPwd = p => CryptoJS.SHA256(p).toString()

function LoginScreen({ onLogin }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [code, setCode] = useState('')
  const [userData, setUserData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const step1 = async () => {
    setErr(''); setLoading(true)
    if (email.trim() === ADMIN_EMAIL && hashPwd(pass) === ADMIN_PASS_HASH) {
      setUserData({ name: 'المدير', email: ADMIN_EMAIL, role: 'admin' })
      setStep(2)
      setLoading(false)
      return
    }
    const { data } = await supabase.from('employees').select('*').eq('username', email.trim()).maybeSingle()
    if (data && data.password === hashPwd(pass)) {
      setUserData({ name: data.name, email: data.email, role: data.role || 'staff' })
      setStep(2)
    } else {
      setErr('البريد أو كلمة المرور غير صحيحة')
    }
    setLoading(false)
  }

  const step2 = () => {
    if (code !== TWO_FA_CODE) { setErr('كود التحقق غير صحيح'); return }
    onLogin(userData)
  }

  if (step === 2) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B,#0F172A)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 400 }}>
          <h2 style={{ textAlign: 'center', fontSize: 22 }}>🔐 التحقق الثنائي</h2>
          <p style={{ textAlign: 'center' }}>أدخل الكود: <strong>{TWO_FA_CODE}</strong></p>
          <input className="fi" placeholder="الكود" value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', padding: 12, margin: '10px 0', borderRadius: 8, border: '1px solid #ccc' }} />
          {err && <p style={{ color: 'red' }}>{err}</p>}
          <button onClick={step2} style={{ width: '100%', padding: 12, background: '#F97316', color: 'white', border: 'none', borderRadius: 8 }}>تأكيد</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B,#0F172A)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 400 }}>
        <h1 style={{ textAlign: 'center' }}>🛍️ نقاء</h1>
        <input placeholder="البريد" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 12, margin: '10px 0', borderRadius: 8, border: '1px solid #ccc' }} />
        <input type="password" placeholder="كلمة المرور" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 12, margin: '10px 0', borderRadius: 8, border: '1px solid #ccc' }} />
        {err && <p style={{ color: 'red' }}>{err}</p>}
        <button onClick={step1} disabled={loading} style={{ width: '100%', padding: 12, background: '#F97316', color: 'white', border: 'none', borderRadius: 8 }}>{loading ? '⏳...' : 'دخول'}</button>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div>
      <h1>📊 لوحة القيادة</h1>
      <p>مرحباً بك في لوحة تحكم نقاء</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 20 }}>
        <div style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>📦 المنتجات</div>
        <div style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>📋 الطلبيات</div>
        <div style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>👥 العملاء</div>
      </div>
    </div>
  )
}

function Products() {
  return <div>📦 صفحة المنتجات - قيد التطوير</div>
}

function Categories() { return <div>📂 الفئات</div> }
function Brands() { return <div>🏷️ العلامات</div> }
function Suppliers() { return <div>🏭 الموردون</div> }
function Customers() { return <div>👥 العملاء</div> }
function Employees() { return <div>👔 الموظفون</div> }
function Orders() { return <div>📋 الطلبيات</div> }
function Settings() { return <div>⚙️ الإعدادات</div> }

export default function Admin() {
  const [user, setUser] = useState(null)
  const [section, setSection] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('nq_admin')
    if (saved) try { setUser(JSON.parse(saved)) } catch { }
  }, [])

  const handleLogin = (u) => {
    setUser(u)
    sessionStorage.setItem('nq_admin', JSON.stringify(u))
  }
  const handleLogout = () => {
    setUser(null)
    sessionStorage.removeItem('nq_admin')
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  const sections = [
    { id: 'dashboard', icon: '📊', label: 'لوحة القيادة', comp: <Dashboard /> },
    { id: 'products', icon: '📦', label: 'المنتجات', comp: <Products /> },
    { id: 'categories', icon: '📂', label: 'الفئات', comp: <Categories /> },
    { id: 'brands', icon: '🏷️', label: 'العلامات', comp: <Brands /> },
    { id: 'suppliers', icon: '🏭', label: 'الموردون', comp: <Suppliers /> },
    { id: 'customers', icon: '👥', label: 'العملاء', comp: <Customers /> },
    { id: 'employees', icon: '👔', label: 'الموظفون', comp: <Employees /> },
    { id: 'orders', icon: '📋', label: 'الطلبيات', comp: <Orders /> },
    { id: 'settings', icon: '⚙️', label: 'الإعدادات', comp: <Settings /> },
  ]

  const currentComp = sections.find(s => s.id === section)?.comp || <Dashboard />

  return (
    <div dir="rtl" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside style={{ width: collapsed ? 60 : 220, background: '#1E293B', height: '100vh', position: 'sticky', top: 0, transition: '0.2s', flexShrink: 0 }}>
        <div style={{ padding: 16, color: 'white', fontWeight: 'bold', fontSize: 18 }}>{!collapsed && 'نقاء'}</div>
        <button onClick={() => setCollapsed(!collapsed)} style={{ margin: '0 10px 10px', padding: 5, background: 'none', border: '1px solid #fff', color: 'white', borderRadius: 8, cursor: 'pointer' }}>{collapsed ? '☰' : '✕'}</button>
        {sections.map(s => (
          <div key={s.id} onClick={() => setSection(s.id)} style={{ padding: '10px 16px', color: section === s.id ? '#F97316' : 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: section === s.id ? 'rgba(249,115,22,0.1)' : 'transparent' }}>
            <span>{s.icon}</span>
            {!collapsed && <span>{s.label}</span>}
          </div>
        ))}
        <div onClick={handleLogout} style={{ padding: '10px 16px', color: '#EF4444', cursor: 'pointer', marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {!collapsed ? '🚪 خروج' : '🚪'}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 24 }}>
        <h2 style={{ marginBottom: 20 }}>{sections.find(s => s.id === section)?.label}</h2>
        {currentComp}
      </main>
    </div>
  )
}