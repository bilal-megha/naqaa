/**
 * Store.jsx — نقاء v7 (نسخة كاملة مصححة)
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

const WA_NUM = '213696668065'
const CUR = 'دج'

function showToast(msg, isErr = false) {
  const toast = document.createElement('div')
  toast.textContent = msg
  toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${isErr ? '#ef4444' : '#10b981'};color:white;padding:10px 20px;border-radius:30px;z-index:9999;font-family:sans-serif`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2500)
}

export default function Store() {
  const [customer, setCustomer] = useState(null)
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [settings, setSettings] = useState({})
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('home')
  const [search, setSearch] = useState('')
  const [brandSel, setBrandSel] = useState('all')
  const [catSel, setCatSel] = useState('all')
  const [sortSel, setSortSel] = useState('newest')
  const [showScr, setShowScr] = useState(false)

  const SNAME = settings['store_name'] || 'نقاء'
  const WA = settings['contact_whatsapp'] || WA_NUM
  const FREESHIP = parseFloat(settings['free_shipping_threshold'] || '500')

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  // تحميل البيانات
  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: b }, { data: c }, { data: s }] = await Promise.all([
        supabase.from('products').select('*').eq('disabled', false),
        supabase.from('brands').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('settings').select('*')
      ])
      setProducts(p || [])
      setBrands(b || [])
      setCategories(c || [])
      const map = {}
      ;(s || []).forEach(r => (map[r.key] = r.value))
      setSettings(map)
      setLoading(false)
    }
    load()
  }, [])

  // استرجاع السلة من localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('nq_cart')
    if (savedCart) setCart(JSON.parse(savedCart))
  }, [])

  useEffect(() => {
    localStorage.setItem('nq_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (p, qty = 1) => {
    if (!p || (p.stock || 0) === 0) {
      showToast('المنتج غير متوفر', true)
      return
    }
    setCart(prev => {
      if (prev.find(i => i.id === p.id)) {
        showToast('⚠️ موجود في السلة', true)
        return prev
      }
      showToast('✅ تمت الإضافة')
      return [...prev, { id: p.id, name: p.name, price: Number(p.price), qty, image: p.image }]
    })
  }

  const allP = products.filter(p => !p.disabled)

  // فلترة المنتجات
  const filtered = (() => {
    let f = [...allP]
    if (search) f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    if (brandSel !== 'all') f = f.filter(p => p.brand_id == brandSel)
    if (catSel !== 'all') f = f.filter(p => p.category_id == catSel)
    if (sortSel === 'newest') f = f.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (sortSel === 'price_asc') f = f.sort((a, b) => a.price - b.price)
    else if (sortSel === 'price_desc') f = f.sort((a, b) => b.price - a.price)
    return f
  })()

  // Home Component
  const Home = () => (
    <div style={{ paddingBottom: 80 }}>
      <div className="banner-fall" style={{ background: 'linear-gradient(135deg,#FF6B35,#7C3AED)', padding: 40, textAlign: 'center', borderRadius: 20, margin: 14 }}>
        <span style={{ fontSize: 48 }}>🛍️</span>
        <h2 style={{ color: 'white', marginTop: 8 }}>أفضل المنتجات بأفضل الأسعار</h2>
      </div>

      {cartCount > 0 && (
        <div onClick={() => setModal('cart')} style={{ background: 'linear-gradient(135deg,#FF6B35,#7C3AED)', margin: 14, borderRadius: 16, padding: 12, display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ color: 'white' }}>🛒 {cartCount} كرتون في السلة</span>
          <span style={{ color: 'white', fontWeight: 'bold' }}>{cartTotal.toFixed(0)} {CUR}</span>
        </div>
      )}
    </div>
  )

  // Search Tab
  const SearchTab = () => (
    <div style={{ padding: '0 14px' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12 }}>
        <button className={`chip${catSel === 'all' ? ' sel' : ''}`} onClick={() => setCatSel('all')}>الكل</button>
        {categories.map(c => (
          <button key={c.id} className={`chip${catSel === c.id ? ' sel' : ''}`} onClick={() => setCatSel(c.id)}>{c.name}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: 16, padding: 10, border: '1px solid #eee' }}>
            <div style={{ fontSize: 40, textAlign: 'center' }}>📦</div>
            <h3 style={{ fontSize: 13, margin: '5px 0' }}>{p.name}</h3>
            <p style={{ color: '#FF6B35', fontWeight: 'bold' }}>{p.price} {CUR}</p>
            <button onClick={() => addToCart(p)} style={{ background: '#FF6B35', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 25, width: '100%', cursor: 'pointer' }}>🛒 أضف</button>
          </div>
        ))}
      </div>
    </div>
  )

  // Cart Modal
  const CartModal = () => (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 20, position: 'fixed', bottom: 0 }}>
        <h3>🛒 سلة المشتريات</h3>
        {cart.length === 0 ? <p>السلة فارغة</p> : cart.map(i => (
          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #eee' }}>
            <div><strong>{i.name}</strong><br />{i.price} × {i.qty} = {(i.price * i.qty).toFixed(0)}</div>
            <button onClick={() => setCart(c => c.filter(x => x.id !== i.id))} style={{ color: '#ef4444', border: 'none', background: 'none' }}>🗑️</button>
          </div>
        ))}
        <div style={{ fontWeight: 'bold', marginTop: 16, textAlign: 'left' }}>الإجمالي: {cartTotal.toFixed(0)} {CUR}</div>
        <button className="abtn" style={{ width: '100%', marginTop: 16, padding: 12, background: '#FF6B35', color: 'white', border: 'none', borderRadius: 30 }} onClick={() => setModal('checkout')}>إتمام الشراء</button>
      </div>
    </div>
  )

  const tabs = { home: <Home />, search: <SearchTab /> }

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}>⏳ جاري التحميل...</div>

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', background: '#F7F3EF', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#FF6B35,#E8430E)', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 300 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setDrawerOpen(true)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', width: 40, height: 40, borderRadius: 50, fontSize: 20, cursor: 'pointer' }}>☰</button>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{SNAME}</span>
          <button className="sh-contact" onClick={() => setModal('contact')} style={{ background: 'white', color: '#FF6B35', border: 'none', padding: '7px 15px', borderRadius: 30 }}>📞 اتصل</button>
        </div>
        <div style={{ background: 'white', borderRadius: 30, display: 'flex', alignItems: 'center', padding: '8px 16px', marginTop: 10 }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setTab('search') }} placeholder="بحث عن المنتجات..." style={{ border: 'none', flex: 1, outline: 'none', background: 'transparent' }} />
        </div>
      </div>

      {/* DRAWER SIDEBAR */}
      {drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400 }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, width: 260, height: '100%', background: '#1E293B', zIndex: 401, transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)', transition: '0.3s', padding: 20 }}>
        <button onClick={() => setDrawerOpen(false)} style={{ float: 'left', background: 'none', border: 'none', color: 'white', fontSize: 20 }}>✕</button>
        <div style={{ marginTop: 40 }}>
          <div onClick={() => { setTab('home'); setDrawerOpen(false) }} style={{ padding: 10, color: 'white', cursor: 'pointer' }}>🏠 الرئيسية</div>
          <div onClick={() => { setTab('search'); setDrawerOpen(false) }} style={{ padding: 10, color: 'white', cursor: 'pointer' }}>🔍 جميع المنتجات</div>
          <div onClick={() => setModal('cart')} style={{ padding: 10, color: 'white', cursor: 'pointer' }}>🛒 السلة ({cartCount})</div>
          <hr style={{ margin: '10px 0', borderColor: 'rgba(255,255,255,.1)' }} />
          <div onClick={() => setModal('contact')} style={{ padding: 10, color: 'white', cursor: 'pointer' }}>📞 اتصل بنا</div>
        </div>
      </div>

      {/* PAGE */}
      <div style={{ paddingBottom: 80 }}>{tabs[tab] || <Home />}</div>

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', justifyContent: 'space-around', padding: '10px 0', boxShadow: '0 -4px 10px rgba(0,0,0,.05)' }}>
        <button onClick={() => setTab('home')} style={{ border: 'none', background: 'none', textAlign: 'center', cursor: 'pointer', color: tab === 'home' ? '#FF6B35' : '#AAA' }}>🏠<div>الرئيسية</div></button>
        <button onClick={() => setTab('search')} style={{ border: 'none', background: 'none', textAlign: 'center', cursor: 'pointer', color: tab === 'search' ? '#FF6B35' : '#AAA' }}>🔍<div>بحث</div></button>
        <button onClick={() => setModal('cart')} style={{ border: 'none', background: 'none', textAlign: 'center', cursor: 'pointer', color: '#AAA', position: 'relative' }}>🛒<div>السلة</div>{cartCount > 0 && <span style={{ position: 'absolute', top: -5, right: 5, background: '#FF6B35', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}</button>
      </div>

      {/* WHATSAPP FLOAT */}
      <div style={{ position: 'fixed', bottom: 80, left: 14, zIndex: 400 }}>
        <button onClick={() => window.open(`https://wa.me/${WA}`, '_blank')} style={{ width: 50, height: 50, borderRadius: '50%', background: '#25D366', border: 'none', boxShadow: '0 4px 12px rgba(37,211,102,.4)', cursor: 'pointer' }}>💬</button>
      </div>

      {/* MODALS */}
      {modal === 'cart' && <CartModal />}
    </div>
  )
}