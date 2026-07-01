import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import { CLR } from './styles/constants.js'
import useToast from './hooks/useToast.jsx'

// ── صفحات ────────────────────────────────────────────────────────
import LoginScreen   from './components/LoginScreen.jsx'
import Dashboard     from './pages/Dashboard.jsx'
import Products      from './pages/Products.jsx'
import Categories    from './pages/Categories.jsx'
import Brands        from './pages/Brands.jsx'
import Suppliers     from './pages/Suppliers.jsx'
import Customers     from './pages/Customers.jsx'
import Employees     from './pages/Employees.jsx'
import Drivers       from './pages/Drivers.jsx'
import Orders        from './pages/Orders.jsx'
import Coupons       from './pages/Coupons.jsx'
import Promotions    from './pages/Promotions.jsx'
import Notifications from './pages/Notifications.jsx'
import Purchases     from './pages/Purchases.jsx'
import Expenses      from './pages/Expenses.jsx'
import CashBox       from './pages/CashBox.jsx'
import Reports       from './pages/Reports.jsx'
import ActivityLog   from './pages/ActivityLog.jsx'
import RecycleBin    from './pages/RecycleBin.jsx'
import POS           from './pages/POS.jsx'
import Banners       from './pages/Banners.jsx'
import Settings      from './pages/SettingsPage.jsx'

// ── القائمة الجانبية ──────────────────────────────────────────────
const NAV = [
  { section: 'الرئيسية',  items: [
    { id: 'dashboard',     icon: '📊', label: 'لوحة التحكم' },
    { id: 'pos',           icon: '🖥️', label: 'نقطة البيع POS' },
  ]},
  { section: 'المنتجات',  items: [
    { id: 'products',      icon: '📦', label: 'المنتجات' },
    { id: 'categories',    icon: '🗂️', label: 'الفئات' },
    { id: 'brands',        icon: '🏷️', label: 'العلامات التجارية' },
  ]},
  { section: 'المبيعات',  items: [
    { id: 'orders',        icon: '🧾', label: 'الطلبيات' },
    { id: 'coupons',       icon: '🎟️', label: 'الكوبونات' },
    { id: 'promotions',    icon: '🎯', label: 'العروض' },
    { id: 'notifications', icon: '🔔', label: 'الإشعارات' },
    { id: 'banners',       icon: '🖼️', label: 'البانرات' },
  ]},
  { section: 'العملاء',   items: [
    { id: 'customers',     icon: '👥', label: 'العملاء' },
    { id: 'reviews',       icon: '⭐', label: 'التقييمات' },
  ]},
  { section: 'المخزن',    items: [
    { id: 'purchases',     icon: '🛒', label: 'المشتريات' },
    { id: 'suppliers',     icon: '🏭', label: 'الموردون' },
  ]},
  { section: 'الموارد',   items: [
    { id: 'expenses',      icon: '💸', label: 'المصاريف' },
    { id: 'cashbox',       icon: '🏦', label: 'الصندوق' },
  ]},
  { section: 'الفريق',    items: [
    { id: 'employees',     icon: '👷', label: 'الموظفون' },
    { id: 'drivers',       icon: '🚚', label: 'السائقون' },
  ]},
  { section: 'النظام',    items: [
    { id: 'reports',       icon: '📈', label: 'التقارير' },
    { id: 'activityLog',   icon: '📋', label: 'سجل النشاطات' },
    { id: 'recycle',       icon: '🗑️', label: 'سلة المهملات' },
    { id: 'settings',      icon: '⚙️', label: 'الإعدادات' },
  ]},
]

export default function App() {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('safaa_admin')) } catch { return null }
  })
  const [page,    setPage]    = useState('dashboard')
  const [sideOpen, setSideOpen] = useState(true)
  const [showToast, ToastUI]  = useToast()

  useEffect(() => {
    if (user) sessionStorage.setItem('safaa_admin', JSON.stringify(user))
  }, [user])

  if (!user) return <LoginScreen onLogin={u => setUser(u)} />

  const p = { user, showToast, setPage }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':     return <Dashboard     {...p} />
      case 'pos':           return <POS           {...p} />
      case 'products':      return <Products      {...p} />
      case 'categories':    return <Categories    {...p} />
      case 'brands':        return <Brands        {...p} />
      case 'suppliers':     return <Suppliers     {...p} />
      case 'customers':     return <Customers     {...p} />
      case 'employees':     return <Employees     {...p} />
      case 'drivers':       return <Drivers       {...p} />
      case 'orders':        return <Orders        {...p} />
      case 'coupons':       return <Coupons       {...p} />
      case 'promotions':    return <Promotions    {...p} />
      case 'notifications': return <Notifications {...p} />
      case 'banners':       return <Banners       {...p} />
      case 'purchases':     return <Purchases     {...p} />
      case 'expenses':      return <Expenses      {...p} />
      case 'cashbox':       return <CashBox       {...p} />
      case 'reports':       return <Reports       {...p} />
      case 'activityLog':   return <ActivityLog   {...p} />
      case 'recycle':       return <RecycleBin    {...p} />
      case 'settings':      return <Settings      {...p} />
      default:              return <Dashboard     {...p} />
    }
  }

  const pageTitle = NAV.flatMap(s => s.items).find(i => i.id === page)

  return (
    <div style={{ display:'flex', height:'100vh', direction:'rtl',
      fontFamily:"'Tajawal','Cairo',sans-serif", background: CLR.bg }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sideOpen ? 240 : 0,
        minWidth: sideOpen ? 240 : 0,
        background: CLR.sidebar,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width .25s, min-width .25s',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column',
      }}>
        {sideOpen && (
          <>
            {/* Logo */}
            <div style={{ padding: '20px 16px 10px', borderBottom: '1px solid #334155' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: CLR.accent }}>صفاء</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>لوحة الإدارة</div>
            </div>

            {/* User */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155',
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%',
                background: CLR.accent, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {user.role === 'admin' ? '👑' : '👷'}
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{user.name}</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>
                  {user.role === 'admin' ? 'مدير' : 'موظف'}
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ padding: '8px 0', flex: 1 }}>
              {NAV.map(section => (
                <div key={section.section}>
                  <div style={{ padding: '10px 16px 4px', fontSize: 10,
                    color: '#475569', fontWeight: 800, letterSpacing: 1 }}>
                    {section.section}
                  </div>
                  {section.items.map(item => (
                    <button key={item.id}
                      onClick={() => setPage(item.id)}
                      style={{
                        width: '100%', textAlign: 'right', padding: '9px 16px',
                        background: page === item.id ? CLR.accent : 'transparent',
                        color: page === item.id ? 'white' : '#CBD5E1',
                        border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 13, fontWeight: page === item.id ? 800 : 500,
                        display: 'flex', alignItems: 'center', gap: 10,
                        borderRadius: 8, margin: '1px 8px', width: 'calc(100% - 16px)',
                        transition: '.15s',
                      }}
                      onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.background = '#334155' }}
                      onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.background = 'transparent' }}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            {/* Logout */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #334155' }}>
              <button
                onClick={() => { sessionStorage.removeItem('safaa_admin'); setUser(null) }}
                style={{ width: '100%', padding: '9px 16px', background: '#1E3A5F',
                  color: '#94A3B8', border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8 }}>
                🚪 تسجيل الخروج
              </button>
            </div>
          </>
        )}
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          background: 'white', borderBottom: '1px solid #E2E8F0',
          padding: '0 20px', height: 56, display: 'flex',
          alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <button onClick={() => setSideOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: CLR.textSm, padding: 4, borderRadius: 8 }}>
            ☰
          </button>
          <span style={{ fontWeight: 800, fontSize: 15, color: CLR.text }}>
            {pageTitle?.icon} {pageTitle?.label}
          </span>
          <div style={{ marginRight: 'auto', fontSize: 12, color: CLR.textSm }}>
            {new Date().toLocaleDateString('ar-DZ', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {renderPage()}
        </div>
      </main>

      {ToastUI}
    </div>
  )
}
