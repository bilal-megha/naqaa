/**
 * @file index.jsx
 * @description المكوّن الرئيسي للوحة الإدارة — نقاء v8
 * يستورد كل الصفحات والمكونات ويدير التنقل والصلاحيات والجلسة
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { CLR } from './styles/constants.js'
import useToast from './hooks/useToast.jsx'

// ── مكونات مشتركة ──
import LoginScreen from './components/LoginScreen.jsx'

// ── الصفحات ──
import Dashboard      from './pages/Dashboard.jsx'
import Products       from './pages/Products.jsx'
import Categories     from './pages/Categories.jsx'
import Brands         from './pages/Brands.jsx'
import Suppliers      from './pages/Suppliers.jsx'
import Customers      from './pages/Customers.jsx'
import Employees      from './pages/Employees.jsx'
import Coupons        from './pages/Coupons.jsx'
import Purchases      from './pages/Purchases.jsx'
import Inventory      from './pages/Inventory.jsx'
import Orders         from './pages/Orders.jsx'
import Promotions     from './pages/Promotions.jsx'
import Notifications  from './pages/Notifications.jsx'
import Reports        from './pages/Reports.jsx'
import Expenses       from './pages/Expenses.jsx'
import ActivityLog    from './pages/ActivityLog.jsx'
import RecycleBin     from './pages/RecycleBin.jsx'
import Settings       from './pages/Settings.jsx'
import StoreManager   from './pages/StoreManager.jsx'
import DataBackup     from './pages/DataBackup.jsx'
import AboutUs        from './pages/AboutUs.jsx'
import ContactUs      from './pages/ContactUs.jsx'
import ReturnPolicy   from './pages/ReturnPolicy.jsx'
import POS            from './pages/POS.jsx'
import ProductMovement from './pages/ProductMovement.jsx'

/** قائمة أقسام لوحة الإدارة مع أيقوناتها وصلاحياتها */
const SECTIONS = [
  { id: 'dashboard',    icon: '📊', label: 'لوحة القيادة',        perm: 'dashboard'    },
  { id: 'pos',          icon: '🖥️', label: 'نقطة البيع (POS)',    perm: 'orders'       },
  { id: 'products',     icon: '📦', label: 'المنتجات',            perm: 'products'     },
  { id: 'categories',  icon: '📂', label: 'الفئات',              perm: 'categories'   },
  { id: 'brands',      icon: '🏷️', label: 'العلامات التجارية',   perm: 'brands'       },
  { id: 'suppliers',   icon: '🏭', label: 'الموردون',            perm: 'suppliers'    },
  { id: 'customers',   icon: '👥', label: 'العملاء',             perm: 'customers'    },
  { id: 'employees',   icon: '👔', label: 'الموظفون',            perm: 'employees'    },
  { id: 'coupons',     icon: '🎟️', label: 'الكوبونات',           perm: 'coupons'      },
  { id: 'purchases',   icon: '🛒', label: 'المشتريات',           perm: 'purchases'    },
  { id: 'inventory',   icon: '🗂️', label: 'المخزون',             perm: 'inventory'    },
  { id: 'orders',      icon: '📋', label: 'الطلبيات',            perm: 'orders'       },
  { id: 'promotions',  icon: '🎯', label: 'العروض',              perm: 'promotions'   },
  { id: 'notifications',icon:'🔔', label: 'الإشعارات',           perm: 'notifications'},
  { id: 'reports',     icon: '📈', label: 'التقارير',            perm: 'reports'      },
  { id: 'productMovement', icon: '🔄', label: 'حركة المنتج',     perm: 'reports'      },
  { id: 'expenses',    icon: '💸', label: 'المصاريف',            perm: 'expenses'     },
  { id: 'activityLog', icon: '📋', label: 'سجل النشاطات',        perm: 'activityLog'  },
  { id: 'storeManager',icon: '🎨', label: 'إدارة المتجر',        perm: 'storeManager' },
  { id: 'backup',      icon: '💾', label: 'نسخ احتياطي',         perm: 'backup'       },
  { id: 'settings',    icon: '⚙️', label: 'الإعدادات',           perm: 'settings'     },
  { id: 'about',       icon: '🏢', label: 'من نحن',              perm: 'about'        },
  { id: 'contact',     icon: '📞', label: 'اتصل بنا',            perm: 'contact'      },
  { id: 'returnPolicy',icon: '🔄', label: 'سياسة الاسترجاع',     perm: 'returnPolicy' },
  { id: 'recycle',     icon: '🗑️', label: 'سلة المهملات',        perm: 'recycle'      },
]

/** مجموعات القائمة الجانبية */
const NAV_GROUPS = [
  { label: 'الرئيسية',           items: ['dashboard','pos'] },
  { label: 'المنتجات والمخزون',  items: ['products','categories','brands','inventory','productMovement'] },
  { label: 'المبيعات',           items: ['orders','promotions','coupons'] },
  { label: 'الموارد',            items: ['purchases','suppliers','expenses'] },
  { label: 'العملاء',            items: ['customers','notifications'] },
  { label: 'الإدارة',            items: ['reports','employees','activityLog','storeManager','backup','settings','about','contact','returnPolicy','recycle'] },
]

/**
 * المكوّن الرئيسي للوحة الإدارة
 * يدير: الجلسة، الصلاحيات، التنقل، القائمة الجانبية، الهيدر
 */
// ── مكوّن البحث العالمي ──
function GlobalSearch({ onNavigate }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [{ data: prods }, { data: custs }, { data: ords }] = await Promise.all([
          supabase.from('products').select('id,name,stock,price').ilike('name', `%${q}%`).limit(5),
          supabase.from('customers').select('id,name,phone').ilike('name', `%${q}%`).limit(5),
          supabase.from('orders').select('id,customer_name,total,invoice_num').or(`customer_name.ilike.%${q}%,invoice_num.ilike.%${q}%`).limit(5),
        ])
        const res = []
        ;(prods||[]).forEach(p => res.push({ type:'product', icon:'📦', label:p.name, sub:`مخزون: ${p.stock} | ${p.price} دج`, action:() => onNavigate('products') }))
        ;(custs||[]).forEach(c => res.push({ type:'customer', icon:'👥', label:c.name, sub:c.phone||'', action:() => onNavigate('customers') }))
        ;(ords||[]).forEach(o => res.push({ type:'order', icon:'📋', label:`فاتورة ${o.invoice_num||o.id}`, sub:`${o.customer_name} — ${Number(o.total).toFixed(0)} دج`, action:() => onNavigate('orders') }))
        setResults(res); setOpen(res.length > 0)
      } catch {}
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [q, onNavigate])

  return (
    <div ref={ref} style={{ position:'relative', flex:1, maxWidth:360, margin:'0 16px' }}>
      <div style={{ position:'relative' }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="🔍 بحث في المنتجات، العملاء، الفواتير..."
          style={{ width:'100%', padding:'7px 14px 7px 36px', border:'1.5px solid #e2e8f0', borderRadius:20, fontSize:13, fontFamily:'inherit', background:'#f8fafc', outline:'none', direction:'rtl', boxSizing:'border-box' }}
        />
        {loading && <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12 }}>⏳</div>}
        {q && <button onClick={() => { setQ(''); setResults([]); setOpen(false) }} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:14 }}>✕</button>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, left:0, background:'white', border:'1.5px solid #e2e8f0', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:9999, overflow:'hidden' }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => { r.action(); setQ(''); setOpen(false) }}
              style={{ padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid #f1f5f9', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <span style={{ fontSize:18 }}>{r.icon}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'#0D1B2A' }}>{r.label}</div>
                {r.sub && <div style={{ fontSize:11, color:'#94a3b8' }}>{r.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const [user,      setUser]      = useState(null)
  const [section,   setSection]   = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [showToast, ToastUI]      = useToast()

  // استعادة الجلسة من sessionStorage عند التحميل
  useEffect(() => {
    const saved = sessionStorage.getItem('nq_admin')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (typeof parsed.permissions === 'string') {
        try { parsed.permissions = JSON.parse(parsed.permissions || '{}') }
        catch { parsed.permissions = {} }
      }
      setUser(parsed)
    } catch (err) {
      console.error('❌ خطأ في استعادة الجلسة:', err)
    }
  }, [])

  const handleLogin = u => {
    setUser(u)
    sessionStorage.setItem('nq_admin', JSON.stringify(u))
  }

  const handleLogout = () => {
    setUser(null)
    sessionStorage.removeItem('nq_admin')
    setSection('dashboard')
  }

  /**
   * التحقق من صلاحية المستخدم
   * @param {string} permId - معرّف الصلاحية
   * @param {string} [action='view'] - نوع الإجراء
   * @returns {boolean}
   */
  const hasPermission = (permId, action = 'view') => {
    if (!user) return false
    if (user.role === 'admin') return true
    const perms = user.permissions || {}
    return (perms[permId] || []).includes(action)
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  /** تصيير الصفحة النشطة مع التحقق من الصلاحية */
  const renderSection = () => {
    const cur = SECTIONS.find(s => s.id === section)
    if (cur && !hasPermission(cur.perm)) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', minHeight:300, gap:16, color:CLR.textSm, padding:24 }}>
          <div style={{ fontSize:56 }}>🔒</div>
          <h3 style={{ fontWeight:800, color:CLR.text }}>لا تملك صلاحية الوصول</h3>
          <p style={{ fontSize:14, textAlign:'center' }}>تواصل مع المدير لمنحك الصلاحية</p>
          {Object.keys(user.permissions || {}).length > 0 && (
            <div style={{ background:'#FEF9C3', padding:'12px 18px', borderRadius:8,
              fontSize:13, color:'#92400E', textAlign:'center', maxWidth:400 }}>
              💡 صلاحياتك: {Object.keys(user.permissions).join('، ')}
            </div>
          )}
        </div>
      )
    }
    const p = { showToast, user }
    switch (section) {
      case 'dashboard':    return <Dashboard {...p} />
      case 'products':     return <Products />
      case 'categories':   return <Categories />
      case 'brands':       return <Brands />
      case 'suppliers':    return <Suppliers />
      case 'customers':    return <Customers />
      case 'employees':    return <Employees />
      case 'coupons':      return <Coupons />
      case 'purchases':    return <Purchases />
      case 'inventory':    return <Inventory />
      case 'orders':       return <Orders />
      case 'promotions':   return <Promotions />
      case 'notifications':return <Notifications />
      case 'reports':      return <Reports />
      case 'pos':          return <POS />
      case 'productMovement': return <ProductMovement />
      case 'expenses':     return <Expenses />
      case 'activityLog':  return <ActivityLog />
      case 'recycle':      return <RecycleBin />
      case 'storeManager': return <StoreManager showToast={showToast} />
      case 'backup':       return <DataBackup showToast={showToast} />
      case 'settings':     return <Settings showToast={showToast} />
      case 'about':        return <AboutUs showToast={showToast} />
      case 'contact':      return <ContactUs showToast={showToast} />
      case 'returnPolicy': return <ReturnPolicy showToast={showToast} />
      default:             return <Dashboard {...p} />
    }
  }

  const curSection = SECTIONS.find(s => s.id === section)

  return (
    <div dir="rtl" style={{ display:'flex', minHeight:'100vh', background:CLR.bg }}>
      {ToastUI}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;900&display=swap');
        body,*{font-family:'Times New Roman',serif,sans-serif!important}
        .sitem{display:flex;align-items:center;gap:9px;padding:9px 10px;
          color:rgba(255,255,255,.55);cursor:pointer;border-radius:8px;margin:1px 6px;
          transition:.15s;font-size:13px;font-weight:600;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis}
        .sitem:hover{background:rgba(249,115,22,.18);color:#FDBA74}
        .sitem.on{background:rgba(249,115,22,.22);color:#FB923C;font-weight:700}
        .sitem span.ico{font-size:15px;flex-shrink:0;width:18px;text-align:center}
        input:focus,select:focus,textarea:focus{
          border-color:#F97316!important;
          box-shadow:0 0 0 3px rgba(249,115,22,.12)!important;outline:none}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
        .nq-tr:hover td{background:#FFF7ED!important}
      `}</style>

      {/* ── القائمة الجانبية ── */}
      <aside style={{ width:collapsed?58:232, background:CLR.primary, position:'sticky',
        top:0, height:'100vh', display:'flex', flexDirection:'column',
        overflowX:'hidden', flexShrink:0, transition:'width .22s ease' }}>

        {/* الشعار */}
        <div style={{ padding:'14px 10px 8px', borderBottom:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'rgba(249,115,22,.25)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🛍️</div>
            {!collapsed && (
              <div>
                <div style={{ fontWeight:900, fontSize:15, color:'white', lineHeight:1.2 }}>نقاء</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.45)' }}>لوحة الإدارة</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div style={{ marginTop:10, padding:'7px 10px', background:'rgba(255,255,255,.07)',
              borderRadius:7, fontSize:12, color:'rgba(255,255,255,.75)',
              display:'flex', alignItems:'center', gap:6 }}>
              <span>👤</span>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.name || 'المدير'}
              </span>
              {user.role === 'admin' && (
                <span style={{ fontSize:8, background:'rgba(239,68,68,.3)', padding:'1px 6px',
                  borderRadius:10, color:'#FCA5A5' }}>مدير</span>
              )}
            </div>
          )}
        </div>

        {/* روابط التنقل */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'6px 0' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <div style={{ padding:'8px 14px 3px', fontSize:9, fontWeight:800,
                  color:'rgba(255,255,255,.28)', letterSpacing:'0.9px', textTransform:'uppercase' }}>
                  {group.label}
                </div>
              )}
              {group.items.map(id => {
                const s = SECTIONS.find(x => x.id === id)
                if (!s || !hasPermission(s.perm)) return null
                return (
                  <div key={s.id} className={`sitem${section === s.id ? ' on' : ''}`}
                    onClick={() => setSection(s.id)} title={collapsed ? s.label : ''}>
                    <span className="ico">{s.icon}</span>
                    {!collapsed && <span>{s.label}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        {/* زر المتجر والخروج */}
        <div style={{ padding:'8px 6px', borderTop:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
          <a href="/" target="_blank" style={{ display:'flex', alignItems:'center', gap:8,
            padding:'8px 10px', borderRadius:7, color:'rgba(255,255,255,.5)',
            textDecoration:'none', fontSize:12, fontWeight:600 }}>
            <span>🛍️</span>{!collapsed && <span>عرض المتجر</span>}
          </a>
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:8,
            padding:'8px 10px', borderRadius:7, color:'rgba(239,68,68,.7)',
            background:'none', border:'none', cursor:'pointer', fontSize:12,
            fontWeight:600, width:'100%', textAlign:'right', fontFamily:'inherit' }}>
            <span>🚪</span>{!collapsed && <span>خروج</span>}
          </button>
        </div>
      </aside>

      {/* ── المحتوى الرئيسي ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* الهيدر */}
        <header style={{ background:'white', borderBottom:`1px solid ${CLR.border}`,
          padding:'0 20px', height:52, display:'flex', alignItems:'center',
          justifyContent:'space-between', position:'sticky', top:0, zIndex:150, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setCollapsed(p => !p)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:16,
                color:CLR.textSm, padding:'4px 6px', borderRadius:6 }}>
              {collapsed ? '☰' : '✕'}
            </button>
            <div style={{ fontSize:14, fontWeight:700, color:CLR.text }}>
              {curSection?.icon} {curSection?.label}
            </div>
          </div>

          {/* ── بحث عالمي ── */}
          <GlobalSearch onNavigate={setSection} />

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, color:CLR.textSm, background:CLR.bg,
              borderRadius:6, padding:'4px 10px', border:`1px solid ${CLR.border}`, fontWeight:600 }}>
              {new Date().toLocaleDateString('ar-DZ',{day:'numeric',month:'short'})}
            </span>
            <a href="/" target="_blank" style={{ fontSize:12, color:CLR.accent,
              background:'#FFF7ED', borderRadius:6, padding:'4px 10px',
              border:'1px solid #FED7AA', textDecoration:'none', fontWeight:700 }}>
              🛍️ المتجر
            </a>
          </div>
        </header>

        <main style={{ flex:1, padding:22, overflowY:'auto' }}>
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
