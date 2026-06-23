/**
 * Store.jsx — النسخة المُعاد هيكلتها
 * ✅ CSS في ملف منفصل  (store.css)
 * ✅ جلب البيانات في hook (hooks/useStoreData.js) — متوازي + caching
 * ✅ كل مودال في ملفه (modals/)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import './store.css'

import { supabase }       from '../lib/supabase.js'
import { showToast }      from './utils.js'
import { useStoreData }   from './hooks/useStoreData.js'
import { useTimer }       from './hooks/useTimer.jsx'

import AccountModal   from './modals/AccountModal.jsx'
import LoginModal     from './modals/LoginModal.jsx'
import RegisterModal  from './modals/RegisterModal.jsx'
import CartModal      from './modals/CartModal.jsx'
import CheckoutModal  from './modals/CheckoutModal.jsx'
import DetailModal    from './modals/DetailModal.jsx'
import TrackingModal  from './modals/TrackingModal.jsx'
import ThankyouModal  from './modals/ThankyouModal.jsx'
import ContactModal   from './modals/ContactModal.jsx'
import NotificationBell from './components/NotificationBell.jsx'

const WA_NUM = '213696668065'

export default function Store() {
  // ── بيانات المتجر عبر hook مركزي (متوازي + مكاش) ──
  const { products, brands, categories, settings, banners, promos, bestSellers, loading, decreaseStock } = useStoreData()

  const [customer, setCustomer] = useState(() => { try { return JSON.parse(localStorage.getItem('nq_customer') || 'null') } catch { return null } })
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('nq_cart') || '[]') } catch { return [] } })
  const [wishlist, setWishlist] = useState(() => { try { return JSON.parse(localStorage.getItem('nq_wish') || '[]') } catch { return [] } })
  const [wishSynced, setWishSynced] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [modal, setModal] = useState(null)
  const [detailProd, setDetailProd] = useState(null)
  const [thankId, setThankId] = useState(null)
  const [checkoutTotal, setCheckoutTotal] = useState(0)
  const [pointsUsed, setPointsUsed] = useState(0)
  const [tab, setTab] = useState('home')
  const [search, setSearch] = useState('')
  const [brandSel, setBrandSel] = useState('all')
  const [catSel, setCatSel] = useState('all')
  const [sortSel, setSortSel] = useState('newest')
  const [page, setPage] = useState(1)
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(999999)
  const [showScr, setShowScr] = useState(false)
  const [bannerIdx, setBannerIdx] = useState(0)

  // debounce للبحث
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeout = useRef(null)
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(searchTimeout.current)
  }, [search])

  const flashEndRef = useRef(Date.now() + 24 * 3600 * 1000)
  const timer = useTimer(flashEndRef.current)

  const SNAME = settings?.store_name || 'نقاء'
  const CUR = settings?.store_currency || 'دج'
  const WA = settings?.contact_whatsapp || settings?.whatsapp_number || settings?.admin_phone || WA_NUM
  const FREESHIP = parseFloat(settings?.free_shipping_threshold || '5000')
  const ANNOUNCE = settings?.announce_bar || ''
  const PROMO_TEXT = settings?.promo_text || ''

  const cartTotal = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7)



  // ── تطبيق الهوية البصرية من إعدادات المتجر ──────────────
  React.useEffect(() => {
    const primary = settings?.primary_color || '#1565C0'
    const accent  = settings?.accent_color  || '#FF6D00'
    document.documentElement.style.setProperty('--clr-primary', primary)
    document.documentElement.style.setProperty('--clr-accent',  accent)
    // تحديث الـ CSS الديناميكي
    const styleId = 'nq-dynamic-css'
    let el = document.getElementById(styleId)
    if (!el) { el = document.createElement('style'); el.id = styleId; document.head.appendChild(el) }
    el.textContent = `
      .sh { background: linear-gradient(135deg, ${primary}, ${primary}DD) !important; }
      .sh-logo { color: white !important; }
      .add-b { background: linear-gradient(135deg, ${accent}, ${accent}CC) !important; }
      .bnav-b.on { color: ${primary} !important; }
      .chip.sel { background: ${primary} !important; border-color: ${primary} !important; }
      .pc-price { color: ${primary} !important; }
      .abtn { background: linear-gradient(135deg, ${primary}, ${primary}DD) !important; }
      .cart-bar { background: linear-gradient(135deg, ${primary}, ${primary}DD) !important; }
      .anim-all { background: linear-gradient(135deg, ${primary}, ${primary}DD) !important; }
      .prog-fill { background: linear-gradient(90deg, ${primary}, ${accent}) !important; }
      .sec-more { color: ${primary} !important; }
      .qty-b { border-color: ${primary} !important; color: ${primary} !important; }
    `
  }, [settings?.primary_color, settings?.accent_color])

  // وضع ليلي + زر الصعود للأعلى
  useEffect(() => {
    if (localStorage.getItem('nqDark') === '1') document.body.classList.add('dark')
    const fn = () => setShowScr(window.scrollY > 300)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // banners
  useEffect(() => {
    if (!banners || banners.length < 2) return
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 3800)
    return () => clearInterval(t)
  }, [banners])

  // حفظ السلة والمفضلة
  useEffect(() => { localStorage.setItem('nq_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('nq_wish', JSON.stringify(wishlist)) }, [wishlist])

  // مزامنة المفضلة مع supabase
  useEffect(() => {
    if (!customer || wishSynced) return
    const syncWish = async () => {
      let data = []
      try { const res = await supabase.from('wishlist').select('product_id').eq('customer_id', customer.id); data = res.data || [] } catch { data = [] }
      if (data && data.length > 0) {
        const dbIds = data.map(r => r.product_id)
        const merged = [...new Set([...wishlist, ...dbIds])]
        setWishlist(merged)
      } else if (wishlist.length > 0) {
        await Promise.all(wishlist.map(pid =>
          supabase.from('wishlist').upsert({ id: Date.now() + Math.random() * 1000 | 0, customer_id: customer.id, product_id: pid }).then(() => {}).catch(() => {})
        ))
      }
      setWishSynced(true)
    }
    syncWish()
  }, [customer, wishSynced])

  // دوال محسّنة بـ useCallback
  const addToCart = useCallback((p, qty = 1) => {
    if (!p || (p.stock || 0) === 0) { showToast('المنتج غير متوفر', true); return }
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id)
      if (existing) {
        showToast('✅ تمت زيادة الكمية')
        return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + qty } : i)
      }
      showToast('✅ تمت الإضافة للسلة')
      return [...prev, { id: p.id, name: p.name, price: Number(p.price), qty, image: p.image, unitsPerCarton: p.units || 12 }]
    })
  }, [])

  const toggleWish = useCallback((id) => {
    setWishlist(prev => {
      const removing = prev.includes(id)
      if (removing) {
        showToast('تم الإزالة من المفضلة')
        if (customer) supabase.from('wishlist').delete().eq('customer_id', customer.id).eq('product_id', id).then(() => {}).catch(() => {})
        return prev.filter(x => x !== id)
      }
      showToast('❤️ تمت الإضافة للمفضلة')
      if (customer) supabase.from('wishlist').upsert({ id: Date.now(), customer_id: customer.id, product_id: id }).then(() => {}).catch(() => {})
      return [...prev, id]
    })
  }, [customer])

  const handleLogin = (data) => {
    setCustomer(data)
    localStorage.setItem('nq_customer', JSON.stringify(data))
    setModal(null)
    showToast(`مرحباً ${data.name} 👋`)
  }

  // التنقل من الإشعارات
  const handleNotifNavigate = (type, id) => {
    if (type === 'product' && id) {
      const p = products.find(x => String(x.id) === String(id))
      if (p) { setDetailProd(p); setModal('detail') }
    } else if (type === 'category' && id) {
      setCatSel(id); setTab('search')
    } else if (type === 'brand' && id) {
      setBrandSel(id); setTab('search')
    } else if (type === 'promos') {
      setTab('promos')
    }
  }

  const handleLogout = () => {
    setCustomer(null)
    localStorage.removeItem('nq_customer')
    setModal(null)
    showToast('👋 تم تسجيل الخروج')
  }

  const handlePointsUpdate = (newPoints) => {
    const updated = { ...customer, points: newPoints }
    setCustomer(updated)
    localStorage.setItem('nq_customer', JSON.stringify(updated))
  }

  // ========== مكونات التابات ==========
  // ProductCard
  const ProductCard = ({ p }) => {
    if (!p) return null
    const isW = wishlist.includes(p.id)
    const isN = new Date(p.created_at) >= sevenAgo
    const disc = Number(p.discount) || 0
    const activePromo = promos && promos.length > 0 ? promos.find(pr => {
      if (!pr.active) return false
      if (pr.end_date && new Date(pr.end_date) < new Date()) return false
      const ids = typeof pr.product_ids === 'string' ? JSON.parse(pr.product_ids || '[]') : (pr.product_ids || [])
      return ids.length === 0 || ids.includes(p.id) || ids.includes(String(p.id))
    }) : null
    const hasPromo = !!activePromo
    let promoDisc = disc, promoPrice = disc > 0 ? p.price * (1 - disc / 100) : p.price
    if (activePromo) {
      if (activePromo.type === 'percent') { promoDisc = parseFloat(activePromo.discount_value) || 0; promoPrice = p.price * (1 - promoDisc / 100) }
      else if (activePromo.type === 'fixed') { promoPrice = p.price - (parseFloat(activePromo.discount_value) || 0); promoDisc = Math.round((p.price - promoPrice) / p.price * 100) }
    }
    const hasDisc = hasPromo || disc > 0
    const fp = promoPrice.toFixed(0)
    const pct = promoDisc

    return (
      <div className="pc" onClick={() => { setDetailProd(p); setModal('detail') }}>
        <div className="pc-img" style={{ opacity: (p.stock || 0) === 0 ? 0.45 : 1, filter: (p.stock || 0) === 0 ? 'grayscale(60%)' : 'none' }}>
          {hasPromo && <div className="pc-promo-badge" style={{ position: 'absolute', top: 6, right: 6, background: '#1565C0', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 800, zIndex: 2 }}><i className="fas fa-bullhorn" style={{ fontSize: 9 }} /> عرض خاص</div>}
          {(p.stock || 0) === 0 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,.55)', color: 'white', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 800, zIndex: 2, whiteSpace: 'nowrap' }}>نفذ المخزون</div>}
          {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <div className="pc-noimg">🛍️</div>}
          {isN && !hasPromo && (p.stock || 0) > 0 && <span className="badge b-new">جديد</span>}
          <button className="fav-b" onClick={e => { e.stopPropagation(); toggleWish(p.id) }}>
            <i className="fas fa-heart" style={{ color: isW ? 'var(--clr-primary,#1565C0)' : '#CBD5E1' }}></i>
          </button>
        </div>
        <div className="pc-name">{p.name}</div>
        {hasDisc ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
              <span style={{ background: '#888', color: 'white', fontSize: 11, fontWeight: 900, padding: '2px 7px', borderRadius: 20 }}>{pct}%</span>
              <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>{p.price}{CUR}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--clr-primary,#1565C0)' }}>{fp}{CUR}</div>
          </div>
        ) : (
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--clr-primary,#1565C0)' }}>{fp} {CUR}</div>
        )}
        {(p.units || p.carton_price) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            background:'#EEF4FF', borderRadius:8, padding:'5px 10px', marginBottom:4,
            fontSize:11, border:'1px solid #C7D9F5' }}>
            <span style={{ fontWeight:800, color:'var(--clr-primary,#1565C0)', fontSize:12 }}>
              {p.carton_price ? `${Number(p.carton_price).toFixed(0)} ${CUR}` : `${(Number(fp) * (p.units||12)).toFixed(0)} ${CUR}`}
              <span style={{ color:'#64748B', fontWeight:600, fontSize:10 }}> / carton</span>
            </span>
            {p.units && <span style={{ color:'#64748B', fontWeight:700, fontSize:10 }}>{p.units} قطعة</span>}
          </div>
        )}
        <button className="add-b" style={{ marginTop: 8 }} disabled={(p.stock || 0) === 0} onClick={e => { e.stopPropagation(); addToCart(p) }}>
          <i className="fas fa-cart-plus"></i>
          {(p.stock || 0) === 0 ? 'نفذ المخزون' : 'أضف للسلة'}
        </button>
      </div>
    )
  }

  // الفلاتر
  const allP = products.filter(p => !p.disabled && p.disabled !== 'true')
  const newP = allP.filter(p => new Date(p.created_at) >= sevenAgo)
  const flashP = allP.filter(p => Number(p.discount) > 0).slice(0, 10)
  const dayDeal = allP.find(p => Number(p.discount) >= 20) || null

  const filtered = (() => {
    let f = [...allP]
    if (debouncedSearch) f = f.filter(p => (p.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()))
    if (brandSel !== 'all') f = f.filter(p => p.brand_id == brandSel)
    if (catSel !== 'all') f = f.filter(p => p.category_id == catSel)
    if (priceMin > 0 || priceMax < 999999) f = f.filter(p => Number(p.price) >= priceMin && Number(p.price) <= priceMax)
    if (sortSel === 'newest') f = [...f].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (sortSel === 'price_asc') f = [...f].sort((a, b) => a.price - b.price)
    else if (sortSel === 'price_desc') f = [...f].sort((a, b) => b.price - a.price)
    else if (sortSel === 'disc') f = [...f].sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0))
    return f
  })()
  const PER = 12
  const PAGES = Math.ceil(filtered.length / PER)
  const paged = filtered.slice((page - 1) * PER, page * PER)

  // ========== Home Tab ==========
  const HomeTab = () => {
    const bestSellerProducts = bestSellers.map(id => allP.find(p => String(p.id) === id)).filter(Boolean).slice(0, 12)
    return (
      <>
        {ANNOUNCE && <div className="announce">{ANNOUNCE}</div>}
        <div className="banner-wrap">
          <div className="banner-track" style={{ transform: `translateX(${bannerIdx * 100}%)` }}>
            {banners && banners.length > 0 ? banners.map((b, i) => (
              b.image ? <img key={i} src={b.image} className="banner-slide" alt="" /> :
                <div key={i} className="banner-fall"><span style={{ fontSize: 36 }}>🛍️</span><span style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>{b.title || SNAME}</span>{b.subtitle && <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>{b.subtitle}</span>}</div>
            )) : <div className="banner-fall"><span style={{ fontSize: 40 }}>🛍️</span><span style={{ color: 'white', fontWeight: 900, fontSize: 24 }}>{SNAME}</span><span style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>أفضل المنتجات بأفضل الأسعار</span></div>}
          </div>
          {banners && banners.length > 1 && <div className="bdots">{banners.map((_, i) => <button key={i} className={`bdot${bannerIdx === i ? ' on' : ''}`} onClick={() => setBannerIdx(i)} />)}</div>}
        </div>
        {PROMO_TEXT && <div style={{ background: 'linear-gradient(135deg,#EEF4FF,#EEF4FF)', margin: '10px 14px 0', borderRadius: 14, padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#1565C0', border: '1px solid #90CAF9' }}>{PROMO_TEXT}</div>}
        {promos && promos.length > 0 && promos.find(p => p.end_date) && (
          <div className="flash-bar" onClick={() => setTab('search')}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>⚡ {promos.find(p => p.end_date).name}</div>
              <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12 }}>{promos.find(p => p.end_date).description || 'عرض لفترة محدودة'}</div>
            </div>
            <div className="timer-wrap">
              <div className="tbox">{timer.h}</div>
              <span style={{ color: 'white', fontWeight: 900 }}>:</span>
              <div className="tbox">{timer.m}</div>
              <span style={{ color: 'white', fontWeight: 900 }}>:</span>
              <div className="tbox">{timer.s}</div>
            </div>
          </div>
        )}
        {brands && brands.length > 0 && (
          <div className="sec">
            <div className="sec-head"><span className="sec-title">⭐ أفضل الماركات</span><button className="sec-more" onClick={() => setDrawerOpen(true)}>عرض الكل</button></div>
            <div className="anim-grid">
              <div className="anim-all" onClick={() => { setBrandSel('all'); setTab('search') }}><i className="fas fa-th"></i><span>عرض الكل</span></div>
              {brands.slice(0, 5).map(b => (
                <div key={b.id} className={`anim-card${brandSel == b.id ? ' sel' : ''}`} onClick={() => { setBrandSel(b.id); setTab('search') }}>
                  {b.image
                    ? <><img src={b.image} alt={b.name} style={{ width:'100%', height:'100%', objectFit:'contain', padding:6 }} /><div className="overlay"><span>{b.name}</span></div></>
                    : <div className="no-img" style={{ padding:8, textAlign:'center' }}>{b.name}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {categories && categories.length > 0 && (
          <div className="sec">
            <div className="sec-head"><span className="sec-title">📂 الفئات</span><button className="sec-more" onClick={() => setTab('cats')}>عرض الكل</button></div>
            <div className="cats-scroll">
              {categories.map(c => (
                <div key={c.id} className={`cat-item${catSel == c.id ? ' sel' : ''}`} onClick={() => { setCatSel(c.id); setTab('search') }}>
                  <div className="cat-img">{c.image ? <img src={c.image} alt={c.name} /> : <span>📁</span>}</div>
                  <div className="cat-label">{c.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ── الأكثر طلباً ── */}
        {bestSellerProducts.length > 0 && (
          <div className="sec">
            <div className="sec-head">
              <span className="sec-title">🔥 الأكثر طلباً</span>
              <button className="sec-more" onClick={() => setTab('search')}>عرض الكل</button>
            </div>
            <div className="prod-grid">
              {bestSellerProducts.slice(0, 6).map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* ── منتجات جديدة ── */}
        {newP.length > 0 && (
          <div className="sec">
            <div className="sec-head">
              <span className="sec-title">✨ منتجات جديدة</span>
              <button className="sec-more" onClick={() => setTab('search')}>عرض الكل</button>
            </div>
            <div className="prod-grid">
              {newP.slice(0, 6).map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* ── كل المنتجات إذا لا يوجد شيء آخر ── */}
        {bestSellerProducts.length === 0 && newP.length === 0 && allP.length > 0 && (
          <div className="sec">
            <div className="sec-head">
              <span className="sec-title">🛍️ المنتجات</span>
              <button className="sec-more" onClick={() => setTab('search')}>عرض الكل</button>
            </div>
            <div className="prod-grid">
              {allP.slice(0, 6).map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}
      </>
    )
  }

  // ========== Quick Order Tab ==========
  const QuickOrderTab = () => {
    const [qtyMap, setQtyMap] = useState({})
    const visibleProds = allP.filter(p => (p.stock || 0) > 0)
    const addAll = () => {
      let count = 0
      visibleProds.forEach(p => {
        const qty = parseInt(qtyMap[p.id]) || 0
        if (qty > 0) { addToCart(p, qty); count++ }
      })
      if (count > 0) showToast(`✅ تمت إضافة ${count} منتج`)
      else showToast('أدخل الكميات أولاً', true)
    }
    return (
      <div className="sec" style={{ marginTop: 14, paddingBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 className="sec-title">⚡ الطلب السريع</h2>
          <button onClick={addAll} style={{ background: 'var(--clr-primary,#1565C0)', color: 'white', border: 'none', borderRadius: 30, padding: '10px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}><i className="fas fa-cart-plus"></i> إضافة الكل للسلة</button>
        </div>
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1565C0' }}>
                <th style={{ padding: '11px 12px', textAlign: 'right', color: 'white', fontWeight: 700, fontSize: 13, border: '1px solid rgba(255,255,255,.2)', fontFamily: "'Times New Roman',serif" }}>المنتج</th>
                <th style={{ padding: '11px 12px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 13, border: '1px solid rgba(255,255,255,.2)' }}>سعر/كرتون</th>
                <th style={{ padding: '11px 12px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 13, border: '1px solid rgba(255,255,255,.2)' }}>الكمية (كرتون)</th>
                <th style={{ padding: '11px 12px', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: 13, border: '1px solid rgba(255,255,255,.2)' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {visibleProds.map((p, i) => {
                const qty = parseInt(qtyMap[p.id]) || 0
                const unitPrice = p.carton_price || p.price * (p.units || 12)
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#F8FAFC', borderBottom: '1px solid #EEF4FF' }}>
                    <td style={{ padding: '10px 12px', border: '1px solid #EEF4FF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.image && <img src={p.image} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid #EEF4FF' }} />}
                        <div><div style={{ fontWeight: 700, fontSize: 13, color: '#0D1B2A' }}>{p.name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{p.units || 12} قطعة/كرتون</div></div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#1565C0', border: '1px solid #EEF4FF' }}>{unitPrice.toFixed(0)} {CUR}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #EEF4FF' }}>
                      <input type="number" min="0" value={qtyMap[p.id] || ''} onChange={e => setQtyMap(m => ({ ...m, [p.id]: e.target.value }))} placeholder="0"
                        style={{ width: 70, textAlign: 'center', border: '2px solid #EEF4FF', borderRadius: 8, padding: '5px 8px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#1565C0'} onBlur={e => e.target.style.borderColor = '#EEF4FF'}
                        onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault() }}
                        inputMode="numeric" />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#0D1B2A', border: '1px solid #EEF4FF' }}>{qty > 0 ? `${(qty * unitPrice).toFixed(0)} ${CUR}` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F8FAFC' }}>
                <td colSpan={3} style={{ padding: '12px', fontWeight: 800, color: '#0D1B2A', fontSize: 14, border: '1px solid #EEF4FF', textAlign: 'right' }}>💰 الإجمالي المحدد:</td>
                <td style={{ padding: '12px', fontWeight: 900, color: '#1565C0', fontSize: 16, border: '1px solid #EEF4FF', textAlign: 'center' }}>
                  {Object.entries(qtyMap).reduce((sum, [id, qty]) => {
                    const p = allP.find(x => String(x.id) === String(id))
                    const up = p ? (p.carton_price || p.price * (p.units || 12)) : 0
                    return sum + (parseInt(qty) || 0) * up
                  }, 0).toFixed(0)} {CUR}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  // ========== شاشة التحميل (Skeleton) ==========
  if (loading) {
    return (
      <div dir="rtl" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
        {/* Header skeleton */}
        <div style={{ background: 'linear-gradient(150deg,#0D47A1,#1565C0 55%,#06B6D4 100%)', padding: '12px 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <div className="sk" style={{ width: 80, height: 24, borderRadius: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="sk" style={{ width: 64, height: 32, borderRadius: 20 }} />
              <div className="sk" style={{ width: 64, height: 32, borderRadius: 20 }} />
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 30, padding: '10px 16px', display: 'flex', gap: 8 }}>
            <div className="sk" style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0 }} />
            <div className="sk" style={{ flex: 1, height: 18, borderRadius: 8 }} />
          </div>
        </div>

        {/* Banner skeleton */}
        <div style={{ margin: '14px 14px 0', borderRadius: 20, overflow: 'hidden' }}>
          <div className="sk" style={{ height: 175, borderRadius: 20 }} />
        </div>

        {/* Section title skeleton */}
        <div style={{ padding: '16px 14px 12px', display: 'flex', justifyContent: 'space-between' }}>
          <div className="sk" style={{ width: 120, height: 20, borderRadius: 8 }} />
          <div className="sk" style={{ width: 60, height: 16, borderRadius: 8 }} />
        </div>

        {/* Product cards skeleton */}
        <div className="sk-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="sk-card">
              <div className="sk" style={{ height: 140, borderRadius: 13, marginBottom: 10 }} />
              <div className="sk" style={{ height: 14, borderRadius: 6, marginBottom: 6, width: '80%' }} />
              <div className="sk" style={{ height: 14, borderRadius: 6, marginBottom: 8, width: '50%' }} />
              <div className="sk" style={{ height: 34, borderRadius: 30 }} />
            </div>
          ))}
        </div>

        {/* Bottom nav skeleton */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', justifyContent: 'space-around', padding: '10px 0 16px', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,.08)' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className="sk" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <div className="sk" style={{ width: 36, height: 10, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ========== وضع الصيانة ==========
  if (settings?.maintenance_mode === '1') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg,#0D1B2A 0%,#0F172A 100%)', flexDirection: 'column', gap: 20, padding: 24, textAlign: 'center', direction: 'rtl' }}>
        <div style={{ fontSize: 72, animation: 'pulse 2s infinite' }}>🔧</div>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>نقاء</h1>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 16, maxWidth: 340, lineHeight: 1.8 }}>{settings?.maintenance_msg || 'المتجر في طور التحديث، سنعود قريباً 🔧'}</p>
        <a href={`https://wa.me/${settings?.whatsapp_number || settings?.admin_phone || '213696668065'}`} target="_blank" style={{ background: '#25D366', color: 'white', padding: '14px 32px', borderRadius: 30, textDecoration: 'none', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><i className="fab fa-whatsapp"></i> تواصل معنا</a>
      </div>
    )
  }

  // ========== Search Tab ==========
  const SearchTab = () => {
    const getBrand = id => brands.find(b => b.id == id)
    const getCat = id => categories.find(c => c.id == id)
    return (
      <div className="sec" style={{ marginTop: 14, paddingBottom: 80 }}>
        {/* فلاتر */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
          <select value={catSel} onChange={e => { setCatSel(e.target.value); setPage(1) }}
            style={{ border: '1.5px solid #E2E8F0', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontFamily: 'inherit', background: 'white', cursor: 'pointer', flexShrink: 0 }}>
            <option value="all">كل الفئات</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={brandSel} onChange={e => { setBrandSel(e.target.value); setPage(1) }}
            style={{ border: '1.5px solid #E2E8F0', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontFamily: 'inherit', background: 'white', cursor: 'pointer', flexShrink: 0 }}>
            <option value="all">كل الماركات</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={sortSel} onChange={e => { setSortSel(e.target.value); setPage(1) }}
            style={{ border: '1.5px solid #E2E8F0', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontFamily: 'inherit', background: 'white', cursor: 'pointer', flexShrink: 0 }}>
            <option value="newest">الأحدث</option>
            <option value="price_asc">السعر: الأقل</option>
            <option value="price_desc">السعر: الأعلى</option>
            <option value="disc">الأكثر خصماً</option>
          </select>
        </div>
        {/* رأس النتائج */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{filtered.length} منتج {debouncedSearch || brandSel !== 'all' || catSel !== 'all' ? '(مفلتر)' : ''}</span>
          {(brandSel !== 'all' || catSel !== 'all' || debouncedSearch) && (
            <button onClick={() => { setBrandSel('all'); setCatSel('all'); setSearch(''); setPage(1) }}
              style={{ fontSize: 12, color: '#1565C0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
              ✕ مسح الفلاتر
            </button>
          )}
        </div>
        {/* الشبكة */}
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>لا توجد نتائج</div>
          </div>
        ) : (
          <div className="pg">{paged.map(p => <ProductCard key={p.id} p={p} />)}</div>
        )}
        {/* التصفح */}
        {PAGES > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            {Array.from({ length: PAGES }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid',
                  borderColor: page === n ? '#1565C0' : '#E2E8F0',
                  background: page === n ? '#1565C0' : 'white',
                  color: page === n ? 'white' : '#475569',
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ========== Cats Tab ==========
  const CatsTab = () => (
    <div className="sec" style={{ marginTop: 14, paddingBottom: 80 }}>
      {categories.length > 0 && (
        <>
          <div className="sec-head"><span className="sec-title">📂 الفئات</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 24 }}>
            {categories.map(c => (
              <div key={c.id} onClick={() => { setCatSel(c.id); setTab('search') }}
                style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {c.image ? <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>📁</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0D1B2A' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{allP.filter(p => p.category_id == c.id).length} منتج</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {brands.length > 0 && (
        <>
          <div className="sec-head"><span className="sec-title">🏷️ الماركات</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {brands.map(b => (
              <div key={b.id} onClick={() => { setBrandSel(b.id); setTab('search') }}
                style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {b.image ? <img src={b.image} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🏷️</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0D1B2A' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{allP.filter(p => p.brand_id == b.id).length} منتج</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  // ========== Wish Tab ==========
  const WishTab = () => {
    const wishProds = allP.filter(p => wishlist.includes(p.id))
    return (
      <div className="sec" style={{ marginTop: 14, paddingBottom: 80 }}>
        <div className="sec-head"><span className="sec-title">❤️ المفضلة ({wishProds.length})</span></div>
        {wishProds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 52 }}>💔</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>قائمة المفضلة فارغة</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>أضف منتجات بالضغط على ❤️</div>
          </div>
        ) : (
          <div className="prod-grid">{wishProds.map(p => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </div>
    )
  }

  // ========== Promos Tab ==========
  const PromosTab = () => {
    const promoProds = allP.filter(p => {
      if (Number(p.discount) > 0) return true
      if (!promos || promos.length === 0) return false
      return promos.some(pr => {
        if (!pr.active) return false
        if (pr.end_date && new Date(pr.end_date) < new Date()) return false
        const ids = typeof pr.product_ids === 'string' ? JSON.parse(pr.product_ids || '[]') : (pr.product_ids || [])
        return ids.length === 0 || ids.includes(p.id) || ids.includes(String(p.id))
      })
    })
    return (
      <div className="sec" style={{ marginTop: 14, paddingBottom: 80 }}>
        {promos && promos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {promos.map(pr => (
              <div key={pr.id} style={{ background: 'linear-gradient(135deg,#1565C0,#0D47A1)', borderRadius: 16, padding: '14px 16px', marginBottom: 10, color: 'white' }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{pr.name}</div>
                {pr.description && <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{pr.description}</div>}
                {pr.end_date && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>⏳ ينتهي: {new Date(pr.end_date).toLocaleDateString('ar-DZ')}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="sec-head"><span className="sec-title">🎯 منتجات العروض ({promoProds.length})</span></div>
        {promoProds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 52 }}>🎯</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>لا توجد عروض حالياً</div>
          </div>
        ) : (
          <div className="pg">{promoProds.map(p => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </div>
    )
  }

  // ========== عرض التاب الحالي مباشرة (بدون useMemo لتجنب خطأ Hooks #310) ==========
  const renderTab = () => {
    if (tab === 'home')   return <HomeTab />
    if (tab === 'search') return <SearchTab />
    if (tab === 'cats')   return <CatsTab />
    if (tab === 'wish')   return <WishTab />
    if (tab === 'promos') return <PromosTab />
    if (tab === 'quick')  return <QuickOrderTab />
    return <HomeTab />
  }

  // ========== المكون الرئيسي ==========
  return (
    <div dir="rtl">
      {/* HEADER */}
      <div className="sh">
        <div className="sh-top">
          <button className="sh-icon" onClick={() => setDrawerOpen(true)}><i className="fas fa-bars"></i></button>
          <span className="sh-logo">{SNAME}</span>
          <div className="sh-right">
            <NotificationBell
              onNavigate={handleNotifNavigate}
              primaryColor={settings?.primary_color || '#1565C0'}
            />
            <button className="sh-contact" onClick={() => setModal('contact')}><i className="fas fa-phone"></i> اتصل</button>
            {customer ? (
              <button className="sh-login" onClick={() => setModal('account')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-user"></i> {customer.name.split(' ')[0]} 🏅 {customer.points || 0}
              </button>
            ) : (
              <button className="sh-login" onClick={() => setModal('login')}><i className="fas fa-user"></i> دخول</button>
            )}
          </div>
        </div>
        <div className="sh-search">
          <i className="fas fa-search" style={{ color: '#aaa' }}></i>
          <input value={search} onChange={e => { setSearch(e.target.value); setTab('search'); setPage(1) }} placeholder="بحث عن المنتجات..." />
          {search && <button onClick={() => { setSearch(''); setTab('home') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16 }}>×</button>}
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />}
      <div className={`drawer${drawerOpen ? ' open' : ''}`}>
        <div className="drawer-head">
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 4 }}>🛍️ {SNAME}</div>
          {customer ? <div style={{ fontSize: 13, color: '#FFF3E0', fontWeight: 700, background: 'rgba(0,0,0,.25)', padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>مرحباً، {customer.name} 👋</div> : <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>اطلب بالكارتون ووفّر أكثر</div>}
          <button onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>
        <div className="drawer-nav">
          {[
            { id: 'home', e: '🏠', l: 'الرئيسية' },
            { id: 'search', e: '🔍', l: 'جميع المنتجات' },
            { id: 'cats', e: '📂', l: 'الفئات والماركات' },
            { id: 'promos', e: '🎯', l: 'العروض', b: promos ? promos.filter(x => x.active).length : 0 },
            null,
            { id: 'wish', e: '❤️', l: 'المفضلة', b: wishlist.length },
            { id: 'cart-d', e: '🛒', l: 'السلة', b: cartCount, a: () => setModal('cart') },
            { id: 'track', e: '📍', l: 'تتبع الطلب', a: () => setModal('tracking') },
            { id: 'quick', e: '⚡', l: 'الطلب السريع' },
            null,
            { id: 'auth', e: '👤', l: customer ? customer.name : 'تسجيل الدخول', a: () => setModal(customer ? 'account' : 'login') },
            { id: 'contact-d', e: '📞', l: 'اتصل بنا', a: () => setModal('contact') },
            { id: 'dark', e: '🌙', l: 'الوضع الليلي', a: () => { document.body.classList.toggle('dark'); localStorage.setItem('nqDark', document.body.classList.contains('dark') ? '1' : '0') } },
            { id: 'faq', e: '❓', l: 'الأسئلة الشائعة', a: () => setModal('faq') },
            { id: 'terms', e: '📄', l: 'الشروط والأحكام', a: () => setModal('terms') },
          ].map((it, i) => it === null ? <div key={i} className="di-div" /> :
            <div key={it.id} className={`di${tab === it.id && !it.a ? ' act' : ''}`} onClick={() => { (it.a ? it.a() : setTab(it.id)); setDrawerOpen(false) }}>
              <div className="di-ico">{it.e}</div>
              <span style={{ flex: 1 }}>{it.l}</span>
              {it.b > 0 && <span className="di-badge">{it.b}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="page">{renderTab()}</div>

      {/* BOTTOM NAV */}
      <div className="bnav">
        {[
          { id: 'home', icon: 'fas fa-home', label: 'الرئيسية' },
          { id: 'search', icon: 'fas fa-search', label: 'بحث' },
          { id: 'promos', icon: 'fas fa-tag', label: 'العروض', badge: promos ? promos.filter(x => x.active).length : 0 },
          { id: 'wish', icon: 'fas fa-heart', label: 'المفضلة', badge: wishlist.length },
          { id: 'cart-m', icon: 'fas fa-shopping-basket', label: 'السلة', badge: cartCount, action: () => setModal('cart') },
        ].map(b => (
          <button key={b.id} className={`bnav-b${tab === b.id && !b.action ? ' on' : ''}`} onClick={() => b.action ? b.action() : setTab(b.id)}>
            <i className={b.icon}></i>
            {b.badge > 0 && <span className="nbadge">{b.badge}</span>}
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      {/* TERMS MODAL */}
      {modal === 'terms' && (
        <div className="moverlay" onClick={e => { if (e.target.className === 'moverlay') setModal(null) }}>
          <div className="msheet">
            <div className="mhandle" />
            <div className="mhead"><h3>📄 الشروط والأحكام</h3><button className="mclose" onClick={() => setModal(null)}>✕</button></div>
            <div className="mbody">
              <div style={{ fontSize: 14, lineHeight: 1.9, color: '#475569' }}>
                {settings?.terms_text || `1. يُعدّ الطلب مؤكداً بعد التأكيد عبر واتساب فقط.
2. الأسعار قابلة للتغيير دون إشعار مسبق.
3. الطلب بالكارتون الكامل فقط.
4. التوصيل يتم خلال 24-48 ساعة داخل الولاية.
5. سياسة الاسترجاع: خلال 24 ساعة من الاستلام وفي حالة وجود عيوب مصنعية.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ MODAL (مع سؤال النقاط الجديد) */}
      {modal === 'faq' && (
        <div className="moverlay" onClick={e => { if (e.target.className === 'moverlay') setModal(null) }}>
          <div className="msheet">
            <div className="mhandle" />
            <div className="mhead"><h3>❓ الأسئلة الشائعة</h3><button className="mclose" onClick={() => setModal(null)}>✕</button></div>
            <div className="mbody">
              {[
                { q: 'ما هو الحد الأدنى للطلب؟', a: 'لا يوجد حد أدنى، يمكنك الطلب من كرتون واحد.' },
                { q: 'كم تكلفة التوصيل؟', a: `التوصيل ${settings?.shipping_cost || '500'} ${CUR}. مجاني للطلبات التي تتجاوز ${settings?.free_shipping_threshold || '500'} ${CUR}.` },
                { q: 'كيف أتتبع طلبي؟', a: 'اضغط على "تتبع الطلب" في القائمة وأدخل رقم هاتفك.' },
                { q: 'كيف يتم التسليم؟', a: 'يتواصل معك فريقنا عبر واتساب لتحديد موعد التسليم.' },
                { q: 'ما طرق الدفع المتاحة؟', a: 'الدفع نقداً عند الاستلام.' },
                { q: 'هل يمكن الإلغاء بعد الطلب؟', a: 'يمكن الإلغاء قبل تأكيد الطلب عبر التواصل معنا.' },
                { q: 'كيف أجمع نقاط؟', a: 'تحصل على نقطة واحدة مقابل كل 100 دج من إجمالي مشترياتك (بعد الخصومات). يمكنك استخدام نقاطك للحصول على خصم يصل إلى 100% من قيمة الطلب (كل 100 نقطة = 100 دج خصم).' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 14, background: '#F8FAFC', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0D1B2A', marginBottom: 6 }}>❓ {item.q}</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>💡 {item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP FLOAT */}
      <div className="wa-float">
        <button className="wa-btn" onClick={() => window.open(`https://wa.me/${WA}`, '_blank')}>
          <i className="fab fa-whatsapp" style={{ fontSize: 28, color: 'white' }}></i>
        </button>
        <div className="wa-label">تواصل معنا</div>
      </div>

      {/* SCROLL TOP */}
      {showScr && (
        <button className="scrtop" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

      {/* MODALS */}
      {modal === 'login' && <LoginModal onClose={() => setModal(null)} onLogin={handleLogin} onRegister={() => setModal('register')} />}
      {modal === 'register' && <RegisterModal onClose={() => setModal(null)} onSuccess={() => { setModal('login'); showToast('✅ سجّل الآن للدخول') }} />}
      {modal === 'cart' && <CartModal cart={cart} setCart={setCart} settings={settings} onClose={() => setModal(null)}
        onCheckout={(total, pUsed) => { setCheckoutTotal(total); setPointsUsed(pUsed || 0); setModal('checkout') }}
        freeShip={FREESHIP} currency={CUR} promos={promos} customer={customer} />}
      {modal === 'checkout' && <CheckoutModal cart={cart} finalTotal={checkoutTotal || cartTotal}
        onClose={() => setModal('cart')}
        onSuccess={(id, cartSnap) => { decreaseStock(cartSnap || cart); setCart([]); setThankId(id); setModal('thankyou') }}
        currency={CUR} waNum={WA} storeName={SNAME} settings={settings}
        customer={customer} onPointsUpdate={handlePointsUpdate} pointsUsed={pointsUsed} />}
      {modal === 'detail' && <DetailModal product={detailProd} wishlist={wishlist}
        onClose={() => setModal(null)} onAddCart={addToCart} onToggleWish={toggleWish}
        currency={CUR} products={products} sevenAgo={sevenAgo}
        onShowProduct={p => setDetailProd(p)} promos={promos} />}
      {modal === 'tracking' && <TrackingModal onClose={() => setModal(null)} currency={CUR} />}
      {modal === 'contact' && <ContactModal settings={settings} onClose={() => setModal(null)} />}
      {modal === 'thankyou' && <ThankyouModal orderId={thankId} storeName={SNAME} onClose={() => { setModal(null); setTab('home') }} />}
      {modal === 'account' && customer && <AccountModal customer={customer} onClose={() => setModal(null)} onLogout={handleLogout} onUpdatePoints={handlePointsUpdate} currency={CUR} />}
    </div>
  )
}
