/**
 * Store.jsx — واجهة المتجر للزبائن
 * تستخدم Supabase عبر db.js
 */
import { useState, useEffect, useRef } from 'react'
import CryptoJS from 'crypto-js'
import { cache, loadAll, dbInsert, dbUpdate, getSetting } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'

// ==================== Toast ====================
function useToast() {
  return (msg, isError = false) => {
    const t = document.createElement('div')
    t.className = 'toast' + (isError ? ' toast-error' : '')
    t.innerHTML = msg
    document.body.appendChild(t)
    setTimeout(() => t.remove(), 3000)
  }
}

// ==================== Modal ====================
function Modal({ show, onClose, title, children, width = 500 }) {
  if (!show) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: width }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#ef4444' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ==================== CSS متجر ====================
const STORE_CSS = `
  .store-header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 15px 20px; border-radius: 0 0 20px 20px; margin-bottom: 20px; position: sticky; top: 0; z-index: 200; }
  .brands-section { background: white; border-radius: 16px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  body.dark .brands-section { background: #1e293b; }
  .brand-item { text-align: center; cursor: pointer; transition: 0.2s; min-width: 80px; }
  .brand-item:hover { transform: translateY(-5px); }
  .brand-icon { width: 70px; height: 70px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 28px; color: #dc2626; }
  .section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .section-title h3 { font-size: 20px; font-weight: bold; color: #333; }
  body.dark .section-title h3 { color: white; }
  .slider-container { position: relative; overflow: hidden; }
  .slider-track { display: flex; gap: 16px; overflow-x: auto; scroll-behavior: smooth; padding-bottom: 8px; }
  .slider-track::-webkit-scrollbar { display: none; }
  .slider-btn { position: absolute; top: 50%; transform: translateY(-50%); background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; border: none; transition: 0.2s; }
  .slider-btn.left { left: 0; }
  .slider-btn.right { right: 0; }
  .slider-btn:hover { background: #dc2626; color: white; }
  .product-card { background: white; border-radius: 16px; padding: 14px; transition: 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; border: 1px solid #eee; }
  body.dark .product-card { background: #1e293b; }
  .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }
  .product-card img { width: 100%; height: 160px; object-fit: cover; border-radius: 12px; margin-bottom: 10px; }
  .product-price { font-size: 18px; font-weight: bold; color: #dc2626; margin: 6px 0; }
  .carton-price { font-size: 12px; color: #64748b; }
  .limited-stock { font-size: 12px; color: #ef4444; margin-top: 4px; }
  .new-badge { position: absolute; top: 8px; right: 8px; background: #10b981; color: white; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 30px; }
  .promo-badge { position: absolute; top: 8px; right: 8px; background: #dc2626; color: white; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 30px; }
  .filter-section { background: white; border-radius: 16px; padding: 16px 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  body.dark .filter-section { background: #1e293b; }
  .customer-bar { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
  #scrollTopBtn { position: fixed; bottom: 80px; left: 20px; background: #dc2626; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: none; font-size: 18px; z-index: 500; transition: 0.2s; }
  #scrollTopBtn:hover { transform: scale(1.1); }
`

// ==================== المكوّن الرئيسي ====================
export default function Store() {
  const toast = useToast()

  // ---- حالة التطبيق ----
  const [customer,    setCustomer]    = useState(() => { try { return JSON.parse(localStorage.getItem('currentCustomer') || 'null') } catch { return null } })
  const [cart,        setCart]        = useState(() => { try { return JSON.parse(localStorage.getItem('store_front_cart') || '[]') } catch { return [] } })
  const [wishlist,    setWishlist]    = useState(() => { try { return JSON.parse(localStorage.getItem('store_front_wishlist') || '[]') } catch { return [] } })
  const [compareList, setCompareList] = useState([])
  const [search,      setSearch]      = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [page,        setPage]        = useState(1)
  const [, forceRender]               = useState(0)
  const refresh = () => forceRender(n => n + 1)

  // ---- نوافذ ----
  const [modal, setModal] = useState(null) // 'login'|'register'|'cart'|'checkout'|'detail'|'wishlist'|'tracking'|'compare'|'thankyou'
  const [detailProduct,   setDetailProduct]   = useState(null)
  const [thankYouOrderId, setThankYouOrderId] = useState(null)

  // ---- إعدادات ----
  const [settings, setSettings] = useState({ store_name:'نقاء', store_currency:'دج', free_shipping_threshold:'500', whatsapp_number:'' })

  // ---- فلتر ----
  const [filterMin,  setFilterMin]  = useState('')
  const [filterMax,  setFilterMax]  = useState('')
  const [filterSort, setFilterSort] = useState('newest')
  const [filterBrand,setFilterBrand]= useState('all')

  // ---- سكرول للأعلى ----
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    // حقن CSS
    if (!document.getElementById('store-css')) {
      const s = document.createElement('style')
      s.id = 'store-css'
      s.textContent = STORE_CSS
      document.head.appendChild(s)
    }
    // تحميل الإعدادات
    const s = cache.settings
    setSettings({ store_name: s['store_name']||'نقاء', store_currency: s['store_currency']||'دج', free_shipping_threshold: s['free_shipping_threshold']||'500', whatsapp_number: s['whatsapp_number']||'' })
    // سكرول
    const onScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ---- حفظ السلة والمفضلة ----
  useEffect(() => { localStorage.setItem('store_front_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('store_front_wishlist', JSON.stringify(wishlist)) }, [wishlist])

  // ==================== منتجات ====================
  const allProducts = cache.products.filter(p => !p.disabled)

  const applyFilters = (prods) => {
    let f = [...prods]
    if (search)          f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    if (brandFilter !== 'all') f = f.filter(p => p.brandId == brandFilter)
    if (filterMin)       f = f.filter(p => p.price >= parseFloat(filterMin))
    if (filterMax)       f = f.filter(p => p.price <= parseFloat(filterMax))
    if (filterBrand !== 'all') f = f.filter(p => p.brandId == filterBrand)
    if (filterSort === 'newest')     f.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    else if (filterSort === 'price_asc')  f.sort((a,b) => a.price - b.price)
    else if (filterSort === 'price_desc') f.sort((a,b) => b.price - a.price)
    else if (filterSort === 'popular') {
      const sc = {}; cache.orders.forEach(o=>(o.items||[]).forEach(i=>(sc[i.name]=(sc[i.name]||0)+i.quantity)))
      f.sort((a,b)=>(sc[b.name]||0)-(sc[a.name]||0))
    }
    return f
  }

  const PER_PAGE = 12
  const filtered   = applyFilters(allProducts)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const promoProducts  = allProducts.filter(p => p.isPromo).slice(0,10)
  const sevenDaysAgo   = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate()-7)
  const newProducts    = allProducts.filter(p => new Date(p.createdAt) >= sevenDaysAgo).slice(0,10)
  const sc             = {}; cache.orders.forEach(o=>(o.items||[]).forEach(i=>(sc[i.name]=(sc[i.name]||0)+i.quantity)))
  const bestSelling    = [...allProducts].sort((a,b)=>(sc[b.name]||0)-(sc[a.name]||0)).slice(0,10)

  // ==================== السلة ====================
  const cartTotal    = cart.reduce((s,i)=>s+i.price*i.quantity, 0)
  const cartCount    = cart.reduce((s,i)=>s+i.quantity, 0)
  const freeShipping = parseFloat(settings.free_shipping_threshold) || 500

  const addToCart = (productId, qty=1) => {
    const p = cache.products.find(x=>x.id==productId)
    if (!p||p.disabled) { toast('المنتج غير متوفر',true); return }
    if (cart.find(i=>i.id==productId)) { toast(`⚠️ ${p.name} موجود بالفعل في السلة`,true); return }
    if ((p.stock||0) < qty) { toast('الكمية غير متوفرة',true); return }
    setCart(prev=>[...prev,{ id:p.id, name:p.name, price:p.price, quantity:qty, image:p.image }])
    toast(`✅ تم إضافة ${p.name} إلى السلة`)
  }

  const removeFromCart = (id) => setCart(prev=>prev.filter(i=>i.id!=id))

  // ==================== المفضلة ====================
  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) { setWishlist(prev=>prev.filter(x=>x!=id)); toast('تم الإزالة من المفضلة') }
    else { setWishlist(prev=>[...prev,id]); toast('تم الإضافة إلى المفضلة') }
    refresh()
  }

  // ==================== المقارنة ====================
  const addToCompare = (id) => {
    if (compareList.includes(id)) { setCompareList(prev=>prev.filter(x=>x!=id)); toast('تم الإزالة') }
    else if (compareList.length>=4) { toast('يمكنك مقارنة 4 منتجات كحد أقصى',true); return }
    else { setCompareList(prev=>[...prev,id]); toast('تم الإضافة للمقارنة') }
  }

  // ==================== تسجيل الدخول ====================
  const hashPwd = p => { return CryptoJS.SHA256(p).toString() }

  const [loginForm,    setLoginForm]    = useState({ email:'', password:'' })
  const [registerForm, setRegisterForm] = useState({ name:'', email:'', phone:'', address:'', password:'', confirm:'' })

  const doLogin = async () => {
    const { email, password } = loginForm
    const { data } = await supabase.from('customers').select('*').or(`email.eq.${email},phone.eq.${email}`).eq('password', hashPwd(password)).maybeSingle()
    if (data) {
      setCustomer(data); localStorage.setItem('currentCustomer', JSON.stringify(data))
      setModal(null); toast(`مرحباً ${data.name}`)
    } else {
      toast('البريد أو كلمة المرور غير صحيحة',true)
    }
  }

  const doRegister = async () => {
    const { name, email, phone, address, password, confirm } = registerForm
    if (!name||!email||!phone||!password) { toast('جميع الحقول مطلوبة',true); return }
    if (password!==confirm) { toast('كلمة المرور غير متطابقة',true); return }
    const { data: existing } = await supabase.from('customers').select('id').eq('email',email).maybeSingle()
    if (existing) { toast('البريد مسجل بالفعل',true); return }
    const newCust = { id:Date.now(), name, email, phone, address, password:hashPwd(password), points:0, created_at:new Date().toISOString() }
    await supabase.from('customers').insert(newCust)
    toast('تم التسجيل، يمكنك الدخول الآن'); setModal('login')
  }

  const doLogout = () => {
    setCustomer(null); localStorage.removeItem('currentCustomer')
    setCart([]); toast('تم تسجيل الخروج')
  }

  // ==================== إتمام الطلب ====================
  const [checkoutForm, setCheckoutForm] = useState({ name:'', phone:'', address:'' })

  const submitOrder = async () => {
    if (!checkoutForm.name||!checkoutForm.phone) { toast('الاسم والهاتف مطلوبان',true); return }
    const order = {
      id: Date.now(),
      customer_name: checkoutForm.name,
      customer_phone: checkoutForm.phone,
      customer_address: checkoutForm.address,
      date: new Date().toLocaleString('ar-DZ'),
      items: cart.map(i=>({ id:i.id, name:i.name, quantity:i.quantity, price:i.price })),
      total: cartTotal,
      status: 'pending',
    }
    const { error } = await supabase.from('orders').insert(order)
    if (error) { toast('خطأ في إرسال الطلب',true); console.error(error); return }
    // تحديث المخزون
    for (const item of cart) {
      const p = cache.products.find(x=>x.id==item.id)
      if (p) await supabase.from('products').update({ stock: Math.max(0,(p.stock||0)-item.quantity) }).eq('id',p.id)
    }
    await loadAll()
    setCart([]); setModal('thankyou'); setThankYouOrderId(order.id)
    toast('✅ تم استلام طلبك')
    if (settings.whatsapp_number) {
      const phone = checkoutForm.phone.replace(/^0/,'')
      window.open(`https://wa.me/${phone}?text=مرحباً ${checkoutForm.name}، تم استلام طلبك رقم ${order.id} بنجاح. شكراً لتسوقك مع ${settings.store_name}`,'_blank')
    }
  }

  // ==================== تتبع الطلب ====================
  const [trackingNum, setTrackingNum] = useState('')
  const [trackingResult, setTrackingResult] = useState(null)

  const trackOrder = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', trackingNum).maybeSingle()
    setTrackingResult(data || null)
  }

  // ==================== ProductCard ====================
  const ProductCard = ({ p, mini=false }) => (
    <div className="product-card" style={{ minWidth: mini?220:undefined }} onClick={()=>{ setDetailProduct(p); setModal('detail') }}>
      <div style={{ position:'relative' }}>
        {p.image ? <img src={p.image} alt={p.name} style={{ height:mini?140:160 }} /> :
          <div style={{ width:'100%', height:mini?140:160, background:'#f1f5f9', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, marginBottom:10 }}>📷</div>}
        {p.isPromo && <span className="promo-badge">⚡ عرض</span>}
        {new Date(p.createdAt) >= sevenDaysAgo && !p.isPromo && <span className="new-badge">جديد</span>}
        <button onClick={e=>{e.stopPropagation();addToCart(p.id)}} style={{ position:'absolute', bottom:8, left:8, background:'#dc2626', color:'white', border:'none', borderRadius:'50%', width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <i className="fas fa-cart-plus" style={{fontSize:13}}></i>
        </button>
        <button onClick={e=>{e.stopPropagation();toggleWishlist(p.id)}} style={{ position:'absolute', top:8, left:8, background:'white', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}>
          <i className={`fas fa-heart`} style={{ color: wishlist.includes(p.id)?'#dc2626':'#cbd5e1', fontSize:13 }}></i>
        </button>
        <button onClick={e=>{e.stopPropagation();addToCompare(p.id)}} style={{ position:'absolute', top:8, right:8, background:'white', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}>
          <i className="fas fa-chart-line" style={{ color: compareList.includes(p.id)?'#dc2626':'#cbd5e1', fontSize:11 }}></i>
        </button>
      </div>
      <div style={{ fontWeight:700, fontSize:15, marginTop:6 }}>{p.name}</div>
      <div className="product-price">{p.price} {settings.store_currency}</div>
      {p.cartonPrice && <div className="carton-price">كرتون: {p.cartonPrice} {settings.store_currency}</div>}
      {(p.stock||0) < 10 && <div className="limited-stock">⚠️ متبقي {p.stock||0} فقط!</div>}
    </div>
  )

  // ==================== Slider ====================
  const Slider = ({ id, items, title, link }) => {
    const ref = useRef(null)
    if (items.length===0) return null
    return (
      <div style={{ marginBottom:32 }}>
        <div className="section-title">
          <h3><span style={{color:'#dc2626',marginLeft:8}}>●</span>{title}</h3>
          {link && <a href="#" onClick={e=>{e.preventDefault();link()}} style={{ color:'#dc2626', fontSize:14 }}>عرض الكل ←</a>}
        </div>
        <div className="slider-container">
          <div ref={ref} className="slider-track" id={id}>
            {items.map(p=><ProductCard key={p.id} p={p} mini />)}
          </div>
          <button className="slider-btn left" onClick={()=>ref.current?.scrollBy({left:-260,behavior:'smooth'})}>❮</button>
          <button className="slider-btn right" onClick={()=>ref.current?.scrollBy({left:260,behavior:'smooth'})}>❯</button>
        </div>
      </div>
    )
  }

  // ==================== JSX ====================
  return (
    <div dir="rtl">
      {/* شريط العميل أو الزائر */}
      {customer ? (
        <div className="customer-bar">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <i className="fas fa-store text-xl"></i>
            <strong style={{ fontSize:18 }}>{settings.store_name}</strong>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ background:'white', color:'#dc2626', padding:'4px 14px', borderRadius:20, fontSize:14 }}>مرحباً، {customer.name}</span>
            <button onClick={doLogout} style={{ padding:'4px 14px', borderRadius:20, background:'rgba(255,255,255,0.2)', color:'white', border:'1px solid rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13 }}>خروج</button>
          </div>
        </div>
      ) : (
        <div className="store-header">
          <div className="flex-between" style={{ flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <i className="fas fa-store" style={{ fontSize:22 }}></i>
              <strong style={{ fontSize:20 }}>{settings.store_name}</strong>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="🔍 بحث..." style={{ padding:'8px 16px', borderRadius:30, border:'none', color:'#1f2937', width:220 }} />
              <div style={{ position:'relative', cursor:'pointer' }} onClick={()=>setModal('cart')}>
                <i className="fas fa-shopping-cart" style={{ fontSize:20 }}></i>
                {cartCount>0 && <span style={{ position:'absolute', top:-8, right:-8, background:'#fbbf24', color:'#dc2626', borderRadius:'50%', width:18, height:18, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{cartCount}</span>}
              </div>
              <div style={{ position:'relative', cursor:'pointer' }} onClick={()=>setModal('wishlist')}>
                <i className="fas fa-heart" style={{ fontSize:20 }}></i>
                {wishlist.length>0 && <span style={{ position:'absolute', top:-8, right:-8, background:'#ef4444', color:'white', borderRadius:'50%', width:18, height:18, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>{wishlist.length}</span>}
              </div>
              <i className="fas fa-truck" style={{ fontSize:20, cursor:'pointer' }} onClick={()=>setModal('tracking')}></i>
              <i className="fas fa-user" style={{ fontSize:20, cursor:'pointer' }} onClick={()=>setModal('login')}></i>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:'0 16px 32px' }}>

        {/* فلتر */}
        <div className="filter-section">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
            <div><label style={{ fontSize:12 }}>الحد الأدنى</label><input type="number" value={filterMin} onChange={e=>setFilterMin(e.target.value)} placeholder="0" /></div>
            <div><label style={{ fontSize:12 }}>الحد الأقصى</label><input type="number" value={filterMax} onChange={e=>setFilterMax(e.target.value)} placeholder="10000" /></div>
            <div>
              <label style={{ fontSize:12 }}>العلامة</label>
              <select value={filterBrand} onChange={e=>{setFilterBrand(e.target.value);setPage(1)}}>
                <option value="all">الكل</option>
                {cache.brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12 }}>الترتيب</label>
              <select value={filterSort} onChange={e=>{setFilterSort(e.target.value);setPage(1)}}>
                <option value="newest">الأحدث</option>
                <option value="price_asc">السعر ↑</option>
                <option value="price_desc">السعر ↓</option>
                <option value="popular">الأكثر مبيعاً</option>
              </select>
            </div>
          </div>
        </div>

        {/* الماركات */}
        {cache.brands.length > 0 && (
          <div className="brands-section">
            <div className="section-title"><h3>⭐ أفضل الماركات</h3></div>
            <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:8 }}>
              <div className="brand-item" onClick={()=>{setBrandFilter('all');setPage(1)}}>
                <div className="brand-icon" style={{ background:brandFilter==='all'?'#dc2626':undefined, color:brandFilter==='all'?'white':undefined }}><i className="fas fa-th-large"></i></div>
                <div style={{ fontSize:12, fontWeight:700 }}>الكل</div>
              </div>
              {cache.brands.map(b=>(
                <div key={b.id} className="brand-item" onClick={()=>{setBrandFilter(b.id);setPage(1)}}>
                  <div className="brand-icon" style={{ background:brandFilter==b.id?'#dc2626':undefined, color:brandFilter==b.id?'white':undefined }}>
                    {b.image?<img src={b.image} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>:<i className="fas fa-building"></i>}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{b.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* سلايدرات */}
        <Slider id="promo"  items={promoProducts} title="⚡ عروض خاصة" link={()=>{setFilterSort('newest');setFilterBrand('all');setBrandFilter('all')}} />
        <Slider id="new"    items={newProducts}   title="🎁 منتجات جديدة" />
        <Slider id="best"   items={bestSelling}   title="🔥 الأكثر مبيعاً" />

        {/* جميع المنتجات */}
        <div>
          <div className="flex-between" style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:20, fontWeight:700 }}>📦 جميع المنتجات</h3>
            {compareList.length>0 && (
              <button onClick={()=>setModal('compare')} style={{ padding:'8px 18px', borderRadius:30, background:'#3b82f6', color:'white', border:'none', cursor:'pointer', fontSize:13 }}>
                🔄 مقارنة ({compareList.length})
              </button>
            )}
          </div>
          {paginated.length===0 ? <p style={{ textAlign:'center', color:'#64748b', padding:40 }}>لا توجد منتجات</p> :
            <div className="grid-cards">{paginated.map(p=><ProductCard key={p.id} p={p} />)}</div>}
          {totalPages>1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:24, flexWrap:'wrap' }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} style={{ padding:'6px 14px', borderRadius:20, background: page===1?'#e2e8f0':'#dc2626', color:page===1?'inherit':'white', border:'none', cursor:'pointer' }}>السابق</button>
              {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)} style={{ padding:'6px 12px', borderRadius:20, background:page===n?'#dc2626':'#e2e8f0', color:page===n?'white':'inherit', border:'none', cursor:'pointer', fontWeight:page===n?700:400 }}>{n}</button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} style={{ padding:'6px 14px', borderRadius:20, background:page===totalPages?'#e2e8f0':'#dc2626', color:page===totalPages?'inherit':'white', border:'none', cursor:'pointer' }}>التالي</button>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', color:'#94a3b8', fontSize:13, padding:'32px 0 8px', borderTop:'1px solid #e2e8f0', marginTop:32 }}>
          © 2025 {settings.store_name} — جميع الحقوق محفوظة
        </div>
      </div>

      {/* زر للأعلى */}
      {showScrollTop && <button id="scrollTopBtn" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>↑</button>}

      {/* ==================== النوافذ ==================== */}

      {/* تسجيل الدخول */}
      <Modal show={modal==='login'} onClose={()=>setModal(null)} title="🔐 تسجيل الدخول">
        <div style={{ marginBottom:12 }}><label>البريد / الهاتف</label><input value={loginForm.email} onChange={e=>setLoginForm(f=>({...f,email:e.target.value}))} /></div>
        <div style={{ marginBottom:16 }}><label>كلمة المرور</label><input type="password" value={loginForm.password} onChange={e=>setLoginForm(f=>({...f,password:e.target.value}))} /></div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-primary" style={{ flex:1 }} onClick={doLogin}>دخول</button>
          <button onClick={()=>setModal('register')} style={{ flex:1, padding:'10px', borderRadius:30, background:'#3b82f6', color:'white', border:'none', cursor:'pointer' }}>تسجيل جديد</button>
        </div>
        <div style={{ textAlign:'center', marginTop:12 }}>
          <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:14 }}>متابعة كزائر</button>
        </div>
      </Modal>

      {/* إنشاء حساب */}
      <Modal show={modal==='register'} onClose={()=>setModal('login')} title="📝 إنشاء حساب">
        {['name','email','phone','address'].map(k=>(
          <div key={k} style={{ marginBottom:10 }}>
            <label>{{name:'الاسم',email:'البريد',phone:'الهاتف',address:'العنوان'}[k]}</label>
            <input value={registerForm[k]} onChange={e=>setRegisterForm(f=>({...f,[k]:e.target.value}))} />
          </div>
        ))}
        <div style={{ marginBottom:10 }}><label>كلمة المرور</label><input type="password" value={registerForm.password} onChange={e=>setRegisterForm(f=>({...f,password:e.target.value}))} /></div>
        <div style={{ marginBottom:16 }}><label>تأكيد كلمة المرور</label><input type="password" value={registerForm.confirm} onChange={e=>setRegisterForm(f=>({...f,confirm:e.target.value}))} /></div>
        <button className="btn-primary" style={{ width:'100%' }} onClick={doRegister}>تسجيل</button>
      </Modal>

      {/* السلة */}
      <Modal show={modal==='cart'} onClose={()=>setModal(null)} title="🛒 سلة المشتريات">
        {cart.length===0 ? <p style={{ textAlign:'center', color:'#64748b', padding:24 }}>السلة فارغة</p> :
          cart.map(i=>(
            <div key={i.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {i.image && <img src={i.image} style={{ width:40, height:40, borderRadius:8, objectFit:'cover' }} />}
                <div><div style={{ fontWeight:600 }}>{i.name}</div><div style={{ fontSize:12, color:'#64748b' }}>x{i.quantity}</div></div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontWeight:700, color:'#dc2626' }}>{(i.price*i.quantity).toFixed(0)} دج</span>
                <button onClick={()=>removeFromCart(i.id)} style={{ background:'#fee2e2', border:'none', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'#dc2626' }}>×</button>
              </div>
            </div>
          ))
        }
        {cart.length>0 && (
          <>
            <div style={{ margin:'16px 0', fontWeight:700, fontSize:18 }}>الإجمالي: {cartTotal.toFixed(0)} دج</div>
            <div style={{ fontSize:13, color:'#10b981', marginBottom:12 }}>
              {cartTotal >= freeShipping ? '🎉 توصيل مجاني!' : `✨ أضف ${(freeShipping-cartTotal).toFixed(0)} دج للتوصيل المجاني`}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-primary" style={{ flex:1 }} onClick={()=>{ setCheckoutForm({name:customer?.name||'',phone:customer?.phone||'',address:customer?.address||''}); setModal('checkout') }}>إتمام الشراء</button>
              <button onClick={()=>setModal(null)} style={{ padding:'10px 20px', borderRadius:30, background:'#e2e8f0', border:'none', cursor:'pointer' }}>إغلاق</button>
            </div>
          </>
        )}
      </Modal>

      {/* إتمام الطلب */}
      <Modal show={modal==='checkout'} onClose={()=>setModal('cart')} title="📋 إتمام الطلب">
        <div style={{ marginBottom:10 }}><label>الاسم *</label><input value={checkoutForm.name} onChange={e=>setCheckoutForm(f=>({...f,name:e.target.value}))} /></div>
        <div style={{ marginBottom:10 }}><label>الهاتف *</label><input value={checkoutForm.phone} onChange={e=>setCheckoutForm(f=>({...f,phone:e.target.value}))} /></div>
        <div style={{ marginBottom:16 }}><label>العنوان</label><textarea value={checkoutForm.address} onChange={e=>setCheckoutForm(f=>({...f,address:e.target.value}))} rows="2"></textarea></div>
        <div style={{ fontWeight:700, fontSize:18, marginBottom:16 }}>الإجمالي: {cartTotal.toFixed(0)} دج</div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-primary" style={{ flex:1 }} onClick={submitOrder}>✅ تأكيد الطلب</button>
          <button onClick={()=>setModal('cart')} style={{ padding:'10px 20px', borderRadius:30, background:'#e2e8f0', border:'none', cursor:'pointer' }}>رجوع</button>
        </div>
      </Modal>

      {/* شكراً */}
      <Modal show={modal==='thankyou'} onClose={()=>setModal(null)} title="">
        <div style={{ textAlign:'center', padding:'16px 0' }}>
          <i className="fas fa-check-circle" style={{ fontSize:56, color:'#10b981', marginBottom:16 }}></i>
          <h2 style={{ fontSize:22, fontWeight:700 }}>شكراً لتسوقك!</h2>
          <p style={{ color:'#64748b', margin:'12px 0' }}>رقم طلبك: <strong style={{ color:'#dc2626' }}>{thankYouOrderId}</strong></p>
          <button className="btn-primary" onClick={()=>setModal(null)}>موافق</button>
        </div>
      </Modal>

      {/* تفاصيل المنتج */}
      <Modal show={modal==='detail'&&!!detailProduct} onClose={()=>setModal(null)} title={detailProduct?.name||''} width={700}>
        {detailProduct && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
            <div style={{ flex:'1 1 260px' }}>
              {detailProduct.image ? <img src={detailProduct.image} style={{ width:'100%', borderRadius:16, objectFit:'cover', maxHeight:280 }} /> :
                <div style={{ width:'100%', height:220, background:'#f1f5f9', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>📷</div>}
            </div>
            <div style={{ flex:'1 1 220px' }}>
              <div style={{ fontSize:26, fontWeight:700, color:'#dc2626' }}>{detailProduct.price} {settings.store_currency}</div>
              {detailProduct.cartonPrice && <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>الكرتون ({detailProduct.units||12} حبة): {detailProduct.cartonPrice} دج</div>}
              <div style={{ marginTop:8 }}>المخزون: <strong>{detailProduct.stock||0}</strong></div>
              {(detailProduct.stock||0)<10 && <div style={{ color:'#ef4444', fontWeight:700, marginTop:4 }}>⚠️ متبقي {detailProduct.stock||0} فقط!</div>}
              <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
                <button className="btn-primary" style={{ flex:1 }} onClick={()=>{ addToCart(detailProduct.id); setModal(null) }}>
                  <i className="fas fa-cart-plus"></i> أضف للسلة
                </button>
                <button onClick={()=>{ toggleWishlist(detailProduct.id); setModal(null) }} style={{ padding:'10px 16px', borderRadius:30, background:'#fce7f3', color:'#be185d', border:'none', cursor:'pointer' }}>
                  <i className="fas fa-heart"></i>
                </button>
              </div>
              {/* منتجات مشابهة */}
              {cache.products.filter(r=>(r.categoryId===detailProduct.categoryId||r.brandId===detailProduct.brandId)&&r.id!==detailProduct.id&&!r.disabled).slice(0,3).length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontWeight:700, marginBottom:8, fontSize:14 }}>🔄 قد يعجبك أيضاً</div>
                  <div style={{ display:'flex', gap:8, overflowX:'auto' }}>
                    {cache.products.filter(r=>(r.categoryId===detailProduct.categoryId||r.brandId===detailProduct.brandId)&&r.id!==detailProduct.id&&!r.disabled).slice(0,3).map(r=>(
                      <div key={r.id} style={{ minWidth:100, cursor:'pointer', textAlign:'center' }} onClick={()=>setDetailProduct(r)}>
                        {r.image?<img src={r.image} style={{width:80,height:60,objectFit:'cover',borderRadius:8}}/>:<span style={{fontSize:28}}>📷</span>}
                        <div style={{fontSize:11,fontWeight:600,marginTop:4}}>{r.name}</div>
                        <div style={{fontSize:12,color:'#dc2626'}}>{r.price} دج</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* المفضلة */}
      <Modal show={modal==='wishlist'} onClose={()=>setModal(null)} title="❤️ المفضلة" width={700}>
        {wishlist.length===0 ? <p style={{ textAlign:'center', color:'#64748b', padding:24 }}>لا توجد منتجات في المفضلة</p> :
          <div className="grid-cards" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))' }}>
            {cache.products.filter(p=>wishlist.includes(p.id)).map(p=>(
              <div key={p.id} className="product-card">
                {p.image?<img src={p.image} />:<div style={{height:120,background:'#f1f5f9',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,marginBottom:8}}>📷</div>}
                <div style={{fontWeight:600}}>{p.name}</div>
                <div className="product-price">{p.price} دج</div>
                <button className="btn-primary" style={{width:'100%',marginTop:8,padding:'8px'}} onClick={()=>{ addToCart(p.id); setModal(null) }}>أضف للسلة</button>
                <button onClick={()=>toggleWishlist(p.id)} style={{width:'100%',marginTop:6,padding:'6px',borderRadius:30,background:'#fee2e2',color:'#dc2626',border:'none',cursor:'pointer',fontSize:13}}>إزالة</button>
              </div>
            ))}
          </div>
        }
      </Modal>

      {/* تتبع الطلب */}
      <Modal show={modal==='tracking'} onClose={()=>setModal(null)} title="🔍 تتبع الطلب">
        <div style={{ marginBottom:12 }}><label>رقم الطلب</label><input value={trackingNum} onChange={e=>setTrackingNum(e.target.value)} placeholder="أدخل رقم الطلب" /></div>
        <button className="btn-primary" style={{ width:'100%', marginBottom:16 }} onClick={trackOrder}>تتبع</button>
        {trackingResult===null && trackingNum && <p style={{ color:'#ef4444', textAlign:'center' }}>رقم الطلب غير صحيح</p>}
        {trackingResult && (
          <div style={{ background:'#f0fdf4', borderRadius:12, padding:16 }}>
            <div style={{ fontWeight:700 }}>✅ الطلب رقم {trackingResult.id}</div>
            <div style={{ marginTop:8, fontSize:14 }}>
              <div>العميل: {trackingResult.customer_name}</div>
              <div>التاريخ: {trackingResult.date}</div>
              <div>الإجمالي: {Number(trackingResult.total).toFixed(0)} دج</div>
              <div>الحالة: <strong>{{pending:'قيد الانتظار',processing:'تجهيز',shipped:'شُحن',delivered:'تسليم'}[trackingResult.status]||trackingResult.status}</strong></div>
            </div>
          </div>
        )}
      </Modal>

      {/* مقارنة المنتجات */}
      <Modal show={modal==='compare'} onClose={()=>setModal(null)} title="🔄 مقارنة المنتجات" width={800}>
        {compareList.length===0 ? <p style={{ textAlign:'center', color:'#64748b', padding:24 }}>اختر منتجات للمقارنة</p> :
          <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:8 }}>
            {cache.products.filter(p=>compareList.includes(p.id)).map(p=>(
              <div key={p.id} className="glass-card" style={{ minWidth:190, textAlign:'center', flex:'0 0 190px' }}>
                {p.image?<img src={p.image} style={{width:'100%',height:120,objectFit:'cover',borderRadius:12,marginBottom:8}}/>:<div style={{height:100,background:'#f1f5f9',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,marginBottom:8}}>📷</div>}
                <div style={{fontWeight:700}}>{p.name}</div>
                <div className="product-price">{p.price} دج</div>
                <div style={{fontSize:13,color:'#64748b'}}>المخزون: {p.stock||0}</div>
                <button onClick={()=>{ addToCart(p.id); setModal(null) }} className="btn-primary" style={{width:'100%',marginTop:10,padding:'6px',fontSize:13}}>أضف للسلة</button>
                <button onClick={()=>setCompareList(prev=>prev.filter(x=>x!==p.id))} style={{width:'100%',marginTop:6,padding:'5px',borderRadius:30,background:'#fee2e2',color:'#dc2626',border:'none',cursor:'pointer',fontSize:12}}>إزالة</button>
              </div>
            ))}
          </div>
        }
      </Modal>

    </div>
  )
}
