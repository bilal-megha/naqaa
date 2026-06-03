/**
 * Store.jsx — واجهة متجر نقاء
 * تصميم مستوحى من تطبيق Esmmar مع تحسينات وألوان جديدة
 */
import { useState, useEffect, useRef } from 'react'
import CryptoJS from 'crypto-js'
import { cache, loadAll } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'

/* ─────────── CSS ─────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:'Tajawal',sans-serif;background:#F7F3EF;direction:rtl}
body.dark{background:#100800;color:#F0E8E0}

.sh{background:linear-gradient(160deg,#FF6B35,#E8430E 65%,#C02E00);padding:12px 16px 14px;
  position:sticky;top:0;z-index:300;box-shadow:0 4px 24px rgba(255,107,53,.4)}
.sh-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px}
.sh-icon{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;
  background:rgba(255,255,255,.2);color:white;font-size:17px;display:flex;
  align-items:center;justify-content:center;transition:.2s}
.sh-icon:active{transform:scale(.9)}
.sh-logo{font-size:21px;font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,.2)}
.sh-contact{background:white;color:#FF6B35;border:none;padding:7px 15px;border-radius:30px;
  font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s;
  box-shadow:0 3px 10px rgba(0,0,0,.15)}
.sh-contact:active{transform:scale(.95)}
.sh-search{background:white;border-radius:30px;display:flex;align-items:center;
  gap:8px;padding:9px 16px;box-shadow:0 2px 12px rgba(0,0,0,.12)}
body.dark .sh-search{background:#2a1400}
.sh-search input{border:none;outline:none;flex:1;font-family:inherit;font-size:14px;
  background:transparent;color:#333}
body.dark .sh-search input{color:#f0e8e0}
.sh-search i{color:#bbb;font-size:15px}

.banner-wrap{margin:14px 14px 0;border-radius:20px;overflow:hidden;position:relative;
  box-shadow:0 8px 28px rgba(255,107,53,.22)}
.banner-track{display:flex;transition:transform .45s cubic-bezier(.4,0,.2,1)}
.banner-slide{min-width:100%;height:175px;object-fit:cover;display:block}
.banner-fall{min-width:100%;height:175px;
  background:linear-gradient(135deg,#FF6B35,#7C3AED);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
.bdots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px}
.bdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);
  border:none;cursor:pointer;transition:.3s;padding:0}
.bdot.on{background:white;width:18px;border-radius:10px}

.sec{padding:0 14px;margin-bottom:18px}
.sec-head{display:flex;justify-content:space-between;align-items:center;
  padding-top:16px;margin-bottom:13px}
.sec-title{font-size:17px;font-weight:900;color:#1A0A00}
body.dark .sec-title{color:#F0E8E0}
.sec-more{color:#FF6B35;font-size:13px;font-weight:700;border:none;
  background:none;cursor:pointer;font-family:inherit;padding:0}

.brands-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.brand-card{background:white;border-radius:16px;overflow:hidden;cursor:pointer;
  transition:.2s;box-shadow:0 2px 10px rgba(0,0,0,.07);aspect-ratio:1;
  display:flex;align-items:center;justify-content:center;
  border:2.5px solid transparent}
body.dark .brand-card{background:#1e1208}
.brand-card:active{transform:scale(.95)}
.brand-card.sel{border-color:#FF6B35;box-shadow:0 4px 16px rgba(255,107,53,.3)}
.brand-card img{width:100%;height:100%;object-fit:cover;border-radius:13px}
.brand-no-logo{font-weight:900;font-size:13px;color:#1A0A00;text-align:center;padding:8px}
body.dark .brand-no-logo{color:#F0E8E0}
.brand-all{border-radius:16px;aspect-ratio:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;cursor:pointer;transition:.2s;
  background:linear-gradient(135deg,#FF6B35,#7C3AED);
  box-shadow:0 4px 16px rgba(255,107,53,.3)}
.brand-all:active{transform:scale(.95)}
.brand-all i{font-size:24px;color:white;margin-bottom:5px}
.brand-all span{font-size:12px;font-weight:800;color:white}

.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0}
.chips::-webkit-scrollbar{display:none}
.chip{background:white;border:1.5px solid #E8DDD5;border-radius:30px;
  padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;
  white-space:nowrap;transition:.2s;font-family:inherit;color:#7A6A5A;flex-shrink:0}
body.dark .chip{background:#1e1208;border-color:#3d2a1a;color:#C0A898}
.chip.sel{background:#FF6B35;color:white;border-color:#FF6B35;
  box-shadow:0 4px 12px rgba(255,107,53,.3)}
.chip:active{transform:scale(.96)}

.pc{background:white;border-radius:18px;padding:11px;transition:.2s;
  box-shadow:0 2px 14px rgba(0,0,0,.07);cursor:pointer;
  border:1.5px solid rgba(0,0,0,.04);width:160px;flex-shrink:0}
body.dark .pc{background:#1e1208;border-color:rgba(255,255,255,.05)}
.pc:active{transform:scale(.97)}
.pc-img{position:relative;border-radius:13px;overflow:hidden;margin-bottom:9px;
  background:#F8F4F0;aspect-ratio:1}
.pc-img img{width:100%;height:100%;object-fit:cover}
.pc-noimg{width:100%;height:100%;display:flex;align-items:center;
  justify-content:center;font-size:34px}
.badge{position:absolute;top:6px;right:6px;padding:3px 8px;border-radius:20px;
  font-size:10px;font-weight:800;color:white}
.b-new{background:#10b981}.b-hot{background:#f59e0b}.b-promo{background:#FF6B35}
.fav-b{position:absolute;top:6px;left:6px;width:28px;height:28px;border-radius:50%;
  background:white;border:none;cursor:pointer;display:flex;align-items:center;
  justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:.2s}
.fav-b:active{transform:scale(.88)}
.cmp-b{position:absolute;bottom:6px;left:6px;width:26px;height:26px;border-radius:50%;
  background:rgba(255,255,255,.9);border:none;cursor:pointer;display:flex;
  align-items:center;justify-content:center;font-size:10px;
  box-shadow:0 2px 6px rgba(0,0,0,.1)}
.pc-name{font-size:12px;font-weight:700;color:#1A0A00;margin-bottom:4px;
  line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;
  -webkit-box-orient:vertical;overflow:hidden}
body.dark .pc-name{color:#F0E8E0}
.pc-price{font-size:15px;font-weight:900;color:#FF6B35}
.pc-carton{font-size:10px;color:#7A6A5A;margin-top:1px}
.pc-stock{font-size:10px;color:#ef4444;margin-top:2px}
.add-b{width:100%;margin-top:8px;padding:7px 4px;border-radius:30px;
  background:linear-gradient(135deg,#FF6B35,#E8430E);color:white;
  border:none;cursor:pointer;font-family:inherit;font-size:11px;font-weight:800;
  transition:.2s;display:flex;align-items:center;justify-content:center;gap:4px}
.add-b:active{opacity:.88;transform:scale(.97)}

.prod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.prod-grid .pc{width:100%}
.hscroll{display:flex;gap:11px;overflow-x:auto;padding:2px 0 10px}
.hscroll::-webkit-scrollbar{display:none}

.cart-bar{background:linear-gradient(135deg,#FF6B35,#7C3AED);
  margin:14px;border-radius:16px;padding:12px 16px;
  display:flex;justify-content:space-between;align-items:center;
  cursor:pointer;box-shadow:0 6px 20px rgba(255,107,53,.3);transition:.2s}
.cart-bar:active{transform:scale(.98)}
.cart-bar span{color:white;font-weight:700;font-size:14px}
.cart-bar .amt{color:white;font-weight:900;font-size:16px}

.bnav{position:fixed;bottom:0;left:0;right:0;background:white;
  display:flex;justify-content:space-around;align-items:center;
  padding:10px 0 16px;z-index:300;
  box-shadow:0 -4px 20px rgba(0,0,0,.08);border-radius:20px 20px 0 0}
body.dark .bnav{background:#1e1208}
.bnav-b{display:flex;flex-direction:column;align-items:center;gap:3px;
  border:none;background:none;cursor:pointer;font-family:inherit;
  color:#AAA099;font-size:10px;font-weight:700;transition:.2s;
  padding:0 10px;position:relative;min-width:48px}
.bnav-b:active{transform:scale(.9)}
.bnav-b.on{color:#FF6B35}
.bnav-b i{font-size:22px;transition:.2s}
.bnav-b.on i{transform:scale(1.1)}
.nbadge{position:absolute;top:-1px;right:6px;background:#FF6B35;
  color:white;border-radius:50%;width:16px;height:16px;font-size:9px;
  display:flex;align-items:center;justify-content:center;font-weight:800;
  border:2px solid white}
body.dark .nbadge{border-color:#1e1208}

.wa{position:fixed;bottom:80px;left:14px;width:50px;height:50px;
  background:#25D366;border-radius:50%;display:flex;align-items:center;
  justify-content:center;box-shadow:0 4px 16px rgba(37,211,102,.45);
  cursor:pointer;z-index:280;border:none;
  animation:wap 2.5s ease-in-out infinite}
.wa:active{transform:scale(.92)}
@keyframes wap{0%,100%{box-shadow:0 4px 16px rgba(37,211,102,.45)}
  50%{box-shadow:0 4px 28px rgba(37,211,102,.7)}}
.scrtop{position:fixed;bottom:80px;right:14px;width:44px;height:44px;
  background:#FF6B35;color:white;border-radius:50%;border:none;
  cursor:pointer;font-size:18px;display:flex;align-items:center;
  justify-content:center;box-shadow:0 4px 16px rgba(255,107,53,.4);z-index:280}

.moverlay{position:fixed;inset:0;background:rgba(0,0,0,.55);
  backdrop-filter:blur(5px);z-index:1000;display:flex;
  align-items:flex-end;justify-content:center}
.msheet{background:white;border-radius:24px 24px 0 0;width:100%;
  max-height:92vh;overflow-y:auto;padding-bottom:30px;
  animation:slideUp .3s cubic-bezier(.4,0,.2,1)}
body.dark .msheet{background:#1e1208}
.msheet.center{border-radius:24px;max-width:460px;margin:20px auto;
  animation:zoomIn .25s ease}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.mhandle{width:38px;height:4px;background:#E8DDD5;border-radius:10px;margin:12px auto 2px}
body.dark .mhandle{background:#3d2a1a}
.mhead{padding:14px 18px;display:flex;justify-content:space-between;align-items:center;
  border-bottom:1px solid #F7F3EF;position:sticky;top:0;background:white;z-index:2}
body.dark .mhead{background:#1e1208;border-color:#2d1a0a}
.mhead h3{font-size:17px;font-weight:900;color:#1A0A00}
body.dark .mhead h3{color:#F0E8E0}
.mclose{width:32px;height:32px;border-radius:50%;background:#F7F3EF;
  border:none;cursor:pointer;font-size:17px;display:flex;align-items:center;
  justify-content:center;transition:.2s}
body.dark .mclose{background:#2d1a0a;color:#F0E8E0}
.mclose:active{transform:scale(.9)}
.mbody{padding:16px 18px}

.ci{display:flex;gap:12px;padding:12px 0;
  border-bottom:1px solid #F7F3EF;align-items:center}
body.dark .ci{border-color:#2d1a0a}
.ci-img{width:58px;height:58px;border-radius:12px;object-fit:cover;
  background:#F7F3EF;flex-shrink:0;display:flex;align-items:center;
  justify-content:center;font-size:24px}
.ci-name{font-weight:700;font-size:14px;color:#1A0A00}
body.dark .ci-name{color:#F0E8E0}
.ci-price{color:#FF6B35;font-weight:900;font-size:15px;margin-top:2px}
.qty-row{display:flex;align-items:center;gap:10px;margin-top:6px}
.qty-b{width:28px;height:28px;border-radius:50%;border:2px solid #FF6B35;
  color:#FF6B35;background:none;cursor:pointer;font-size:15px;font-weight:800;
  display:flex;align-items:center;justify-content:center;transition:.2s;line-height:1}
.qty-b:active{background:#FF6B35;color:white}
.qty-n{font-weight:800;font-size:15px;min-width:22px;text-align:center;color:#1A0A00}
body.dark .qty-n{color:#F0E8E0}
.del-b{margin-right:auto;border:none;background:none;color:#ef4444;
  cursor:pointer;font-size:18px;padding:4px}

.fi{background:#F7F3EF;border:1.5px solid #E8DDD5;border-radius:14px;
  padding:12px 16px;width:100%;font-family:inherit;font-size:14px;
  color:#1A0A00;transition:.2s;outline:none;margin-bottom:12px}
body.dark .fi{background:#2d1a0a;border-color:#3d2a1a;color:#F0E8E0}
.fi:focus{border-color:#FF6B35;box-shadow:0 0 0 3px rgba(255,107,53,.1)}
.fi-label{font-size:13px;font-weight:700;color:#7A6A5A;margin-bottom:6px;display:block}

.abtn{width:100%;padding:15px;border-radius:30px;
  background:linear-gradient(135deg,#FF6B35,#E8430E);color:white;
  border:none;cursor:pointer;font-family:inherit;font-size:16px;font-weight:900;
  transition:.2s;display:flex;align-items:center;justify-content:center;gap:8px;
  margin-bottom:10px}
.abtn:active{transform:scale(.98);opacity:.9}
.abtn.purple{background:linear-gradient(135deg,#7C3AED,#5B21B6)}

.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
  background:#1A0A00;color:white;padding:10px 22px;border-radius:30px;
  z-index:5000;font-size:13px;font-weight:700;animation:tin .3s ease;
  white-space:nowrap;max-width:85vw;text-align:center;
  box-shadow:0 8px 24px rgba(0,0,0,.25)}
.toast.err{background:#ef4444}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(16px)}
  to{opacity:1;transform:translateX(-50%) translateY(0)}}

.empty{text-align:center;padding:40px 16px;color:#7A6A5A}
.empty i{font-size:52px;margin-bottom:12px;display:block;opacity:.25}
.empty p{font-size:15px;font-weight:600}

.trstep{display:flex;gap:12px;align-items:flex-start;padding:10px 0;
  border-bottom:1px solid #F7F3EF}
body.dark .trstep{border-color:#2d1a0a}
.trdot{width:36px;height:36px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:15px}
.trdot.done{background:linear-gradient(135deg,#FF6B35,#7C3AED);color:white}
.trdot.wait{background:#F7F3EF;color:#AAA099}
body.dark .trdot.wait{background:#2d1a0a}

.page{padding-bottom:80px}
`

/* ─────────── TOAST ─────────── */
function toast(msg, isErr = false) {
  document.querySelectorAll('.toast').forEach(t => t.remove())
  const t = document.createElement('div')
  t.className = 'toast' + (isErr ? ' err' : '')
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2800)
}

const hashPwd = p => { try { return CryptoJS.SHA256(p).toString() } catch { return p } }

/* ─────────── COMPONENT ─────────── */
export default function Store() {

  const [customer, setCustomer] = useState(() => { try { return JSON.parse(localStorage.getItem('nq_customer') || 'null') } catch { return null } })
  const [cart,     setCart]     = useState(() => { try { return JSON.parse(localStorage.getItem('nq_cart')     || '[]')   } catch { return [] } })
  const [wishlist, setWishlist] = useState(() => { try { return JSON.parse(localStorage.getItem('nq_wish')     || '[]')   } catch { return [] } })

  const [tab,        setTab]        = useState('home')
  const [modal,      setModal]      = useState(null)
  const [detailP,    setDetailP]    = useState(null)
  const [search,     setSearch]     = useState('')
  const [brandSel,   setBrandSel]   = useState('all')
  const [catSel,     setCatSel]     = useState('all')
  const [sortSel,    setSortSel]    = useState('newest')
  const [page,       setPage]       = useState(1)
  const [compareList,setCompareList]= useState([])
  const [showScr,    setShowScr]    = useState(false)
  const [bannerIdx,  setBannerIdx]  = useState(0)
  const [thankId,    setThankId]    = useState(null)
  const [loginF,     setLoginF]     = useState({ email: '', pass: '' })
  const [regF,       setRegF]       = useState({ name:'',email:'',phone:'',address:'',pass:'',pass2:'' })
  const [coF,        setCoF]        = useState({ name:'',phone:'',address:'' })
  const [trackNum,   setTrackNum]   = useState('')
  const [trackRes,   setTrackRes]   = useState(null)

  const S        = cache.settings || {}
  const SNAME    = S['store_name']                 || 'نقاء'
  const CUR      = S['store_currency']             || 'دج'
  const WA       = S['whatsapp_number']            || ''
  const FREESHIP = parseFloat(S['free_shipping_threshold'] || '500')

  /* inject CSS */
  useEffect(() => {
    if (!document.getElementById('nq-css')) {
      const s = document.createElement('style')
      s.id = 'nq-css'; s.textContent = CSS
      document.head.appendChild(s)
    }
    if (localStorage.getItem('nqDark') === '1') document.body.classList.add('dark')
    const fn = () => setShowScr(window.scrollY > 300)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* banner auto-rotate */
  const banners = cache.products.filter(p => p.isPromo && p.image).slice(0, 5)
  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 3500)
    return () => clearInterval(t)
  }, [banners.length])

  /* persist */
  useEffect(() => { localStorage.setItem('nq_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('nq_wish', JSON.stringify(wishlist)) }, [wishlist])

  /* derived */
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const sevenAgo  = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7)

  const all     = cache.products.filter(p => !p.disabled)
  const promos  = all.filter(p => p.isPromo)
  const news    = all.filter(p => new Date(p.createdAt) >= sevenAgo)
  const scCount = {}; cache.orders.forEach(o => (o.items||[]).forEach(i => (scCount[i.name] = (scCount[i.name]||0) + i.quantity)))
  const best    = [...all].sort((a, b) => (scCount[b.name]||0) - (scCount[a.name]||0))

  const filtered = (() => {
    let f = all
    if (search)          f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    if (brandSel!=='all') f = f.filter(p => p.brandId == brandSel)
    if (catSel!=='all')   f = f.filter(p => p.categoryId == catSel)
    if (sortSel==='newest')      f = [...f].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))
    else if (sortSel==='price_asc')  f = [...f].sort((a,b) => a.price-b.price)
    else if (sortSel==='price_desc') f = [...f].sort((a,b) => b.price-a.price)
    else if (sortSel==='popular')    f = [...f].sort((a,b) => (scCount[b.name]||0)-(scCount[a.name]||0))
    return f
  })()
  const PER   = 12
  const PAGES = Math.ceil(filtered.length / PER)
  const paged = filtered.slice((page-1)*PER, page*PER)

  /* cart ops */
  const addToCart = (p, qty=1) => {
    if (!p||p.disabled) { toast('المنتج غير متوفر', true); return }
    setCart(prev => {
      if (prev.find(i=>i.id===p.id)) { toast(`⚠️ موجود في السلة`, true); return prev }
      toast(`✅ تمت الإضافة`)
      return [...prev, { id:p.id, name:p.name, price:p.price, qty, image:p.image }]
    })
  }
  const changeQty = (id, d) => setCart(prev => prev.map(i => i.id===id ? {...i, qty:Math.max(1, i.qty+d)} : i))
  const removeFromCart = id => setCart(prev => prev.filter(i=>i.id!==id))

  /* wishlist */
  const toggleWish = id => {
    setWishlist(prev => {
      if (prev.includes(id)) { toast('تم الإزالة'); return prev.filter(x=>x!==id) }
      toast('❤️ تمت الإضافة'); return [...prev, id]
    })
  }

  /* compare */
  const toggleCmp = id => {
    setCompareList(prev => {
      if (prev.includes(id)) { toast('تم الإزالة'); return prev.filter(x=>x!==id) }
      if (prev.length>=4)    { toast('4 منتجات كحد أقصى', true); return prev }
      toast('تمت الإضافة للمقارنة'); return [...prev, id]
    })
  }

  /* auth */
  const doLogin = async () => {
    if (!loginF.email||!loginF.pass) { toast('أدخل البيانات', true); return }
    const { data } = await supabase.from('customers').select('*')
      .or(`email.eq.${loginF.email},phone.eq.${loginF.email}`)
      .eq('password', hashPwd(loginF.pass)).maybeSingle()
    if (data) {
      setCustomer(data); localStorage.setItem('nq_customer', JSON.stringify(data))
      setModal(null); toast(`مرحباً ${data.name} 👋`)
    } else { toast('البيانات غير صحيحة', true) }
  }

  const doRegister = async () => {
    const { name, email, phone, pass, pass2 } = regF
    if (!name||!email||!phone||!pass) { toast('أكمل البيانات', true); return }
    if (pass!==pass2) { toast('كلمتا المرور غير متطابقتان', true); return }
    const { data: ex } = await supabase.from('customers').select('id').eq('email', email).maybeSingle()
    if (ex) { toast('البريد مسجّل مسبقاً', true); return }
    await supabase.from('customers').insert({ id:Date.now(), name, email, phone, address:regF.address, password:hashPwd(pass), points:0, created_at:new Date().toISOString() })
    toast('✅ تم التسجيل، ادخل الآن'); setModal('login')
  }

  const submitOrder = async () => {
    if (!coF.name||!coF.phone) { toast('الاسم والهاتف مطلوبان', true); return }
    const order = { id:Date.now(), customer_name:coF.name, customer_phone:coF.phone, customer_address:coF.address, date:new Date().toLocaleString('ar-DZ'), items:cart.map(i=>({id:i.id,name:i.name,quantity:i.qty,price:i.price})), total:cartTotal, status:'pending' }
    const { error } = await supabase.from('orders').insert(order)
    if (error) { toast('خطأ في الإرسال', true); return }
    for (const item of cart) {
      const p = cache.products.find(x=>x.id===item.id)
      if (p) await supabase.from('products').update({ stock:Math.max(0,(p.stock||0)-item.qty) }).eq('id',p.id)
    }
    await loadAll(); setCart([]); setModal('thankyou'); setThankId(order.id)
    if (WA) window.open(`https://wa.me/${coF.phone.replace(/^0/,'')}?text=مرحباً ${coF.name}، تم استلام طلبك رقم ${order.id}. شكراً!`, '_blank')
  }

  const trackOrder = async () => {
    if (!trackNum) return
    const { data } = await supabase.from('orders').select('*').eq('id', trackNum).maybeSingle()
    setTrackRes(data || false)
  }

  /* ── ProductCard ── */
  const PC = ({ p }) => {
    const isW = wishlist.includes(p.id)
    const isC = compareList.includes(p.id)
    const isN = new Date(p.createdAt) >= sevenAgo
    return (
      <div className="pc" onClick={()=>{setDetailP(p);setModal('detail')}}>
        <div className="pc-img">
          {p.image ? <img src={p.image} alt={p.name} loading="lazy"/> : <div className="pc-noimg">🛍️</div>}
          {p.isPromo && <span className="badge b-promo">عرض</span>}
          {isN && !p.isPromo && <span className="badge b-new">جديد</span>}
          {(scCount[p.name]||0)>10 && !p.isPromo && !isN && <span className="badge b-hot">🔥</span>}
          <button className="fav-b" onClick={e=>{e.stopPropagation();toggleWish(p.id)}}>
            <i className="fas fa-heart" style={{color:isW?'#FF6B35':'#CBD5E1'}}></i>
          </button>
          <button className="cmp-b" onClick={e=>{e.stopPropagation();toggleCmp(p.id)}}>
            <i className="fas fa-balance-scale" style={{color:isC?'#7C3AED':'#CBD5E1'}}></i>
          </button>
        </div>
        <div className="pc-name">{p.name}</div>
        <div className="pc-price">{p.price} {CUR}</div>
        {p.cartonPrice && <div className="pc-carton">كرتون: {p.cartonPrice} {CUR}</div>}
        {(p.stock||0)<10 && (p.stock||0)>0 && <div className="pc-stock">⚠️ متبقي {p.stock} فقط</div>}
        <button className="add-b" onClick={e=>{e.stopPropagation();addToCart(p)}}>
          <i className="fas fa-cart-plus"></i> أضف للسلة
        </button>
      </div>
    )
  }

  /* ── HOME ── */
  const Home = () => (
    <>
      {/* BANNER */}
      <div className="banner-wrap">
        <div className="banner-track" style={{transform:`translateX(${bannerIdx*100}%)`}}>
          {banners.length>0 ? banners.map((p,i)=><img key={i} src={p.image} className="banner-slide" alt=""/>) :
            <div className="banner-fall">
              <span style={{fontSize:40}}>🛍️</span>
              <span style={{color:'white',fontWeight:900,fontSize:24}}>{SNAME}</span>
              <span style={{color:'rgba(255,255,255,.8)',fontSize:14}}>أفضل المنتجات بأفضل الأسعار</span>
            </div>}
        </div>
        {banners.length>1 && (
          <div className="bdots">
            {banners.map((_,i)=><button key={i} className={`bdot${bannerIdx===i?' on':''}`} onClick={()=>setBannerIdx(i)}/>)}
          </div>
        )}
      </div>

      {/* BRANDS */}
      <div className="sec">
        <div className="sec-head">
          <span className="sec-title">أفضل الماركات</span>
          <button className="sec-more" onClick={()=>{setBrandSel('all');setTab('cats')}}>عرض الكل</button>
        </div>
        <div className="brands-grid">
          <div className="brand-all" onClick={()=>{setBrandSel('all');setTab('search')}}>
            <i className="fas fa-th"></i><span>عرض الكل</span>
          </div>
          {cache.brands.slice(0,5).map(b=>(
            <div key={b.id} className={`brand-card${brandSel==b.id?' sel':''}`}
              onClick={()=>{setBrandSel(b.id);setTab('search')}}>
              {b.image ? <img src={b.image} alt={b.name}/> : <div className="brand-no-logo">{b.name}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* PROMO */}
      {promos.length>0 && (
        <div className="sec">
          <div className="sec-head">
            <span className="sec-title">⚡ عروض خاصة</span>
            <button className="sec-more" onClick={()=>setTab('search')}>عرض الكل</button>
          </div>
          <div className="hscroll">{promos.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {/* NEW */}
      {news.length>0 && (
        <div className="sec">
          <div className="sec-head"><span className="sec-title">🎁 وصل حديثاً</span></div>
          <div className="hscroll">{news.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {/* BEST */}
      {best.length>0 && (
        <div className="sec">
          <div className="sec-head"><span className="sec-title">🔥 الأكثر طلباً</span></div>
          <div className="hscroll">{best.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {cartCount>0 && (
        <div className="cart-bar" onClick={()=>setModal('cart')}>
          <span>🛒 {cartCount} منتج في السلة</span>
          <span className="amt">{cartTotal.toFixed(0)} {CUR}</span>
        </div>
      )}
    </>
  )

  /* ── SEARCH TAB ── */
  const Search = () => (
    <div className="sec" style={{marginTop:14}}>
      <div className="chips" style={{marginBottom:10}}>
        <button className={`chip${catSel==='all'?' sel':''}`} onClick={()=>{setCatSel('all');setPage(1)}}>الكل</button>
        {cache.categories.map(c=>(
          <button key={c.id} className={`chip${catSel==c.id?' sel':''}`} onClick={()=>{setCatSel(c.id);setPage(1)}}>{c.name}</button>
        ))}
      </div>
      <div className="chips" style={{marginBottom:14}}>
        {[['newest','الأحدث'],['price_asc','السعر ↑'],['price_desc','السعر ↓'],['popular','الأكثر']].map(([v,l])=>(
          <button key={v} className={`chip${sortSel===v?' sel':''}`} onClick={()=>{setSortSel(v);setPage(1)}}>{l}</button>
        ))}
      </div>
      {paged.length===0
        ? <div className="empty"><i className="fas fa-search"></i><p>لا توجد منتجات</p></div>
        : <div className="prod-grid">{paged.map(p=><PC key={p.id} p={p}/>)}</div>}
      {PAGES>1 && (
        <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:18,flexWrap:'wrap'}}>
          {page>1 && <button className="chip" onClick={()=>setPage(p=>p-1)}>‹ السابق</button>}
          {Array.from({length:Math.min(PAGES,5)},(_,i)=>i+1).map(n=>(
            <button key={n} className={`chip${page===n?' sel':''}`} onClick={()=>setPage(n)}>{n}</button>
          ))}
          {page<PAGES && <button className="chip" onClick={()=>setPage(p=>p+1)}>التالي ›</button>}
        </div>
      )}
    </div>
  )

  /* ── CATS TAB ── */
  const Cats = () => (
    <div className="sec" style={{marginTop:14}}>
      <div className="brands-grid">
        <div className="brand-all" onClick={()=>{setBrandSel('all');setCatSel('all');setTab('search')}}>
          <i className="fas fa-th"></i><span>كل الماركات</span>
        </div>
        {cache.brands.map(b=>(
          <div key={b.id} className="brand-card" onClick={()=>{setBrandSel(b.id);setTab('search')}}>
            {b.image ? <img src={b.image} alt={b.name}/> : <div className="brand-no-logo">{b.name}</div>}
          </div>
        ))}
      </div>
      {cache.categories.length>0 && (
        <div style={{marginTop:20}}>
          <div className="sec-head"><span className="sec-title">الفئات</span></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            {cache.categories.map(c=>(
              <div key={c.id} onClick={()=>{setCatSel(c.id);setTab('search')}}
                style={{background:'white',borderRadius:16,padding:14,display:'flex',alignItems:'center',gap:12,cursor:'pointer',boxShadow:'0 2px 10px rgba(0,0,0,.07)',transition:'.2s'}}>
                {c.image ? <img src={c.image} style={{width:44,height:44,borderRadius:10,objectFit:'cover'}}/> :
                  <div style={{width:44,height:44,borderRadius:10,background:'#FFF0EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>📦</div>}
                <span style={{fontWeight:700,fontSize:14,color:'#1A0A00'}}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  /* ── WISH TAB ── */
  const Wish = () => {
    const wp = cache.products.filter(p=>wishlist.includes(p.id))
    return (
      <div className="sec" style={{marginTop:14}}>
        {wp.length===0
          ? <div className="empty"><i className="fas fa-heart"></i><p>قائمة المفضلة فارغة</p></div>
          : <div className="prod-grid">{wp.map(p=><PC key={p.id} p={p}/>)}</div>}
      </div>
    )
  }

  /* ── DETAIL MODAL ── */
  const Detail = () => {
    const p = detailP; if (!p) return null
    const rel = cache.products.filter(r=>(r.categoryId===p.categoryId||r.brandId===p.brandId)&&r.id!==p.id&&!r.disabled).slice(0,6)
    return (
      <div className="moverlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
        <div className="msheet">
          <div className="mhandle"></div>
          {p.image ? <img src={p.image} style={{width:'100%',height:260,objectFit:'cover'}} alt={p.name}/> :
            <div style={{width:'100%',height:200,background:'#F8F4F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56}}>🛍️</div>}
          <div className="mhead">
            <h3 style={{flex:1,fontSize:16}}>{p.name}</h3>
            <button className="mclose" onClick={()=>setModal(null)}>×</button>
          </div>
          <div className="mbody">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:24,fontWeight:900,color:'#FF6B35'}}>{p.price} {CUR}</span>
              <button onClick={()=>toggleWish(p.id)}
                style={{width:40,height:40,borderRadius:'50%',background:wishlist.includes(p.id)?'#FFF0EB':'#F7F3EF',border:'none',cursor:'pointer',fontSize:20}}>
                <i className="fas fa-heart" style={{color:wishlist.includes(p.id)?'#FF6B35':'#CBD5E1'}}></i>
              </button>
            </div>
            {p.cartonPrice && <p style={{color:'#7A6A5A',fontSize:13,marginBottom:8}}>الكرتون ({p.units||12} حبة): <strong>{p.cartonPrice} {CUR}</strong></p>}
            <p style={{fontSize:13,color:'#7A6A5A',marginBottom:8}}>
              المخزون: <strong style={{color:(p.stock||0)<10?'#ef4444':'#10b981'}}>{p.stock||0}</strong>
            </p>
            {(p.stock||0)<10 && <p style={{color:'#ef4444',fontWeight:700,fontSize:13,marginBottom:12}}>⚠️ متبقي {p.stock||0} قطعة فقط!</p>}
            <button className="abtn" onClick={()=>{addToCart(p);setModal(null)}}>
              <i className="fas fa-cart-plus"></i> أضف للسلة
            </button>
            {rel.length>0 && (
              <div style={{marginTop:16}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:10}}>قد يعجبك أيضاً</div>
                <div className="hscroll">
                  {rel.map(r=>(
                    <div key={r.id} onClick={()=>setDetailP(r)} style={{minWidth:95,cursor:'pointer',textAlign:'center',flexShrink:0}}>
                      {r.image ? <img src={r.image} style={{width:80,height:80,borderRadius:12,objectFit:'cover'}}/> :
                        <div style={{width:80,height:80,borderRadius:12,background:'#F7F3EF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>🛍️</div>}
                      <div style={{fontSize:11,fontWeight:700,marginTop:4}}>{r.name}</div>
                      <div style={{fontSize:12,color:'#FF6B35',fontWeight:800}}>{r.price} {CUR}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── CART MODAL ── */
  const Cart = () => (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
      <div className="msheet">
        <div className="mhandle"></div>
        <div className="mhead"><h3>🛒 السلة</h3><button className="mclose" onClick={()=>setModal(null)}>×</button></div>
        <div className="mbody">
          {cart.length===0
            ? <div className="empty"><i className="fas fa-shopping-cart"></i><p>السلة فارغة</p></div>
            : <>
              {cart.map(i=>(
                <div key={i.id} className="ci">
                  {i.image ? <img src={i.image} className="ci-img" alt=""/> : <div className="ci-img">🛍️</div>}
                  <div style={{flex:1}}>
                    <div className="ci-name">{i.name}</div>
                    <div className="ci-price">{(i.price*i.qty).toFixed(0)} {CUR}</div>
                    <div className="qty-row">
                      <button className="qty-b" onClick={()=>changeQty(i.id,-1)}>−</button>
                      <span className="qty-n">{i.qty}</span>
                      <button className="qty-b" onClick={()=>changeQty(i.id,1)}>+</button>
                    </div>
                  </div>
                  <button className="del-b" onClick={()=>removeFromCart(i.id)}>🗑️</button>
                </div>
              ))}
              <div style={{background:'#FFF0EB',borderRadius:14,padding:'12px 14px',margin:'14px 0'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700}}>
                  <span>{cartTotal>=FREESHIP?'🎉 توصيل مجاني!': `أضف ${(FREESHIP-cartTotal).toFixed(0)} ${CUR} للتوصيل المجاني`}</span>
                  <span style={{color:'#FF6B35'}}>{Math.min(100,(cartTotal/FREESHIP*100)).toFixed(0)}%</span>
                </div>
                <div style={{background:'#E8DDD5',borderRadius:30,height:6,marginTop:8,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'linear-gradient(90deg,#FF6B35,#7C3AED)',borderRadius:30,width:`${Math.min(100,cartTotal/FREESHIP*100)}%`,transition:'width .5s'}}></div>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:18,marginBottom:16}}>
                <span>الإجمالي</span>
                <span style={{color:'#FF6B35'}}>{cartTotal.toFixed(0)} {CUR}</span>
              </div>
              <button className="abtn" onClick={()=>{setCoF({name:customer?.name||'',phone:customer?.phone||'',address:customer?.address||''});setModal('checkout')}}>
                <i className="fas fa-credit-card"></i> إتمام الشراء
              </button>
            </>}
        </div>
      </div>
    </div>
  )

  /* ── CHECKOUT ── */
  const Checkout = () => (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&setModal('cart')}>
      <div className="msheet">
        <div className="mhandle"></div>
        <div className="mhead"><h3>📋 تأكيد الطلب</h3><button className="mclose" onClick={()=>setModal('cart')}>×</button></div>
        <div className="mbody">
          <label className="fi-label">الاسم الكامل *</label>
          <input className="fi" value={coF.name} onChange={e=>setCoF(f=>({...f,name:e.target.value}))} placeholder="أدخل اسمك الكامل"/>
          <label className="fi-label">رقم الهاتف *</label>
          <input className="fi" value={coF.phone} onChange={e=>setCoF(f=>({...f,phone:e.target.value}))} placeholder="0555 XXX XXX" inputMode="numeric"/>
          <label className="fi-label">العنوان</label>
          <textarea className="fi" rows="2" value={coF.address} onChange={e=>setCoF(f=>({...f,address:e.target.value}))} placeholder="الولاية / البلدية / الشارع" style={{resize:'none'}}></textarea>
          <div style={{background:'#FFF0EB',borderRadius:14,padding:'12px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:700}}>إجمالي الطلب</span>
            <span style={{fontWeight:900,color:'#FF6B35',fontSize:18}}>{cartTotal.toFixed(0)} {CUR}</span>
          </div>
          <button className="abtn" onClick={submitOrder}><i className="fas fa-check-circle"></i> تأكيد الطلب</button>
        </div>
      </div>
    </div>
  )

  /* ── THANK YOU ── */
  const Thankyou = () => (
    <div className="moverlay">
      <div className="msheet center">
        <div className="mbody" style={{textAlign:'center',padding:'32px 24px'}}>
          <div style={{fontSize:64,marginBottom:16}}>🎉</div>
          <h2 style={{fontSize:22,fontWeight:900,marginBottom:8}}>شكراً لطلبك!</h2>
          <p style={{color:'#7A6A5A',marginBottom:6}}>تم استلام طلبك بنجاح</p>
          <p style={{color:'#FF6B35',fontWeight:800,fontSize:18,marginBottom:24}}>رقم الطلب: {thankId}</p>
          <button className="abtn" onClick={()=>{setModal(null);setTab('home')}}>
            <i className="fas fa-home"></i> العودة للمتجر
          </button>
          {WA && (
            <button className="abtn purple" onClick={()=>window.open(`https://wa.me/${WA}`,'_blank')}>
              <i className="fab fa-whatsapp"></i> تواصل معنا
            </button>
          )}
        </div>
      </div>
    </div>
  )

  /* ── LOGIN ── */
  const Login = () => (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
      <div className="msheet center">
        <div className="mhead"><h3>🔐 تسجيل الدخول</h3><button className="mclose" onClick={()=>setModal(null)}>×</button></div>
        <div className="mbody">
          <label className="fi-label">البريد أو الهاتف</label>
          <input className="fi" value={loginF.email} onChange={e=>setLoginF(f=>({...f,email:e.target.value}))}/>
          <label className="fi-label">كلمة المرور</label>
          <input className="fi" type="password" value={loginF.pass} onChange={e=>setLoginF(f=>({...f,pass:e.target.value}))}/>
          <button className="abtn" onClick={doLogin}><i className="fas fa-sign-in-alt"></i> دخول</button>
          <button className="abtn purple" onClick={()=>setModal('register')}><i className="fas fa-user-plus"></i> حساب جديد</button>
          <div style={{textAlign:'center',marginTop:12}}>
            <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:'#7A6A5A',cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>متابعة كزائر</button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── REGISTER ── */
  const Register = () => (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&setModal('login')}>
      <div className="msheet center">
        <div className="mhead"><h3>📝 حساب جديد</h3><button className="mclose" onClick={()=>setModal('login')}>×</button></div>
        <div className="mbody">
          {[['name','الاسم الكامل'],['email','البريد'],['phone','الهاتف'],['address','العنوان']].map(([k,l])=>(
            <div key={k}><label className="fi-label">{l}</label>
              <input className="fi" value={regF[k]} onChange={e=>setRegF(f=>({...f,[k]:e.target.value}))}/></div>
          ))}
          <label className="fi-label">كلمة المرور</label>
          <input className="fi" type="password" value={regF.pass} onChange={e=>setRegF(f=>({...f,pass:e.target.value}))}/>
          <label className="fi-label">تأكيد كلمة المرور</label>
          <input className="fi" type="password" value={regF.pass2} onChange={e=>setRegF(f=>({...f,pass2:e.target.value}))}/>
          <button className="abtn" onClick={doRegister}><i className="fas fa-user-check"></i> تسجيل</button>
        </div>
      </div>
    </div>
  )

  /* ── TRACKING ── */
  const Tracking = () => {
    const steps = ['pending','processing','shipped','delivered']
    const labels = {pending:'تم استلام الطلب',processing:'قيد التجهيز',shipped:'في الطريق إليك',delivered:'تم التسليم'}
    const curIdx = trackRes ? steps.indexOf(trackRes.status) : -1
    return (
      <div className="moverlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
        <div className="msheet center">
          <div className="mhead"><h3>🔍 تتبع الطلب</h3><button className="mclose" onClick={()=>setModal(null)}>×</button></div>
          <div className="mbody">
            <label className="fi-label">رقم الطلب</label>
            <input className="fi" value={trackNum} onChange={e=>setTrackNum(e.target.value)} placeholder="أدخل رقم طلبك" inputMode="numeric"/>
            <button className="abtn" onClick={trackOrder}><i className="fas fa-search"></i> تتبع الطلب</button>
            {trackRes===false && <p style={{textAlign:'center',color:'#ef4444',marginTop:12}}>رقم الطلب غير صحيح</p>}
            {trackRes && trackRes.id && (
              <div style={{marginTop:16}}>
                <div style={{background:'#FFF0EB',borderRadius:14,padding:14,marginBottom:16}}>
                  <div style={{fontWeight:800}}>طلب رقم {trackRes.id}</div>
                  <div style={{color:'#7A6A5A',fontSize:13,marginTop:4}}>العميل: {trackRes.customer_name}</div>
                  <div style={{color:'#FF6B35',fontWeight:900,fontSize:18,marginTop:4}}>{Number(trackRes.total).toFixed(0)} {CUR}</div>
                </div>
                {steps.map((s,i)=>(
                  <div key={s} className="trstep">
                    <div className={`trdot ${i<=curIdx?'done':'wait'}`}>{i<=curIdx?'✓':i+1}</div>
                    <div style={{paddingTop:8}}>
                      <div style={{fontWeight:700,fontSize:14,color:i<=curIdx?'#FF6B35':'#7A6A5A'}}>{labels[s]}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── COMPARE ── */
  const Compare = () => {
    const cp = cache.products.filter(p=>compareList.includes(p.id))
    return (
      <div className="moverlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
        <div className="msheet">
          <div className="mhandle"></div>
          <div className="mhead"><h3>🔄 مقارنة المنتجات ({cp.length})</h3><button className="mclose" onClick={()=>setModal(null)}>×</button></div>
          <div className="mbody">
            {cp.length===0
              ? <div className="empty"><i className="fas fa-balance-scale"></i><p>لم تختر منتجات للمقارنة</p></div>
              : <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8}}>
                {cp.map(p=>(
                  <div key={p.id} style={{minWidth:140,background:'#F7F3EF',borderRadius:16,padding:12,textAlign:'center',flexShrink:0}}>
                    {p.image ? <img src={p.image} style={{width:90,height:90,borderRadius:12,objectFit:'cover',marginBottom:8}}/> :
                      <div style={{width:90,height:90,borderRadius:12,background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 8px'}}>🛍️</div>}
                    <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
                    <div style={{color:'#FF6B35',fontWeight:900,fontSize:15,margin:'4px 0'}}>{p.price} {CUR}</div>
                    <div style={{fontSize:12,color:'#7A6A5A',marginBottom:8}}>مخزون: {p.stock||0}</div>
                    <button onClick={()=>{addToCart(p);setModal(null)}} style={{width:'100%',padding:'7px',borderRadius:20,background:'#FF6B35',color:'white',border:'none',cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:700,marginBottom:5}}>أضف للسلة</button>
                    <button onClick={()=>setCompareList(prev=>prev.filter(x=>x!==p.id))} style={{width:'100%',padding:'6px',borderRadius:20,background:'#FFF0EB',color:'#FF6B35',border:'none',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>إزالة</button>
                  </div>
                ))}
              </div>}
          </div>
        </div>
      </div>
    )
  }

  /* ── CONTACT ── */
  const Contact = () => (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
      <div className="msheet center">
        <div className="mhead"><h3>📞 اتصل بنا</h3><button className="mclose" onClick={()=>setModal(null)}>×</button></div>
        <div className="mbody">
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{width:70,height:70,borderRadius:'50%',background:'linear-gradient(135deg,#FF6B35,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:30}}>🛍️</div>
            <div style={{fontWeight:900,fontSize:18}}>{SNAME}</div>
            <div style={{color:'#7A6A5A',fontSize:13,marginTop:4}}>متجرك الموثوق</div>
          </div>
          {WA && (
            <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer"
              style={{display:'flex',alignItems:'center',gap:12,background:'#f0fdf4',borderRadius:14,padding:16,marginBottom:12,textDecoration:'none'}}>
              <i className="fab fa-whatsapp" style={{fontSize:28,color:'#25D366'}}></i>
              <div><div style={{fontWeight:800,color:'#1A0A00'}}>واتساب</div><div style={{fontSize:13,color:'#7A6A5A'}}>{WA}</div></div>
            </a>
          )}
          <button className="abtn" onClick={()=>setModal('tracking')}><i className="fas fa-truck"></i> تتبع طلبي</button>
          {!customer && <button className="abtn purple" onClick={()=>setModal('login')}><i className="fas fa-user"></i> تسجيل الدخول</button>}
          {customer && <div style={{background:'#FFF0EB',borderRadius:14,padding:14,textAlign:'center'}}>
            <div style={{fontWeight:800}}>مرحباً، {customer.name}</div>
            <button onClick={()=>{setCustomer(null);localStorage.removeItem('nq_customer');setModal(null);toast('تم تسجيل الخروج')}} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',marginTop:6,fontSize:13,fontFamily:'inherit',fontWeight:700}}>تسجيل الخروج</button>
          </div>}
        </div>
      </div>
    </div>
  )

  /* ── MODAL SWITCHER ── */
  const ActiveModal = () => {
    switch(modal) {
      case 'detail':   return <Detail/>
      case 'cart':     return <Cart/>
      case 'checkout': return <Checkout/>
      case 'thankyou': return <Thankyou/>
      case 'login':    return <Login/>
      case 'register': return <Register/>
      case 'tracking': return <Tracking/>
      case 'compare':  return <Compare/>
      case 'contact':  return <Contact/>
      default: return null
    }
  }

  /* ── TAB SWITCHER ── */
  const ActiveTab = () => {
    switch(tab) {
      case 'search': return <Search/>
      case 'cats':   return <Cats/>
      case 'wish':   return <Wish/>
      default:       return <Home/>
    }
  }

  /* ── RENDER ── */
  return (
    <div dir="rtl">
      {/* HEADER */}
      <div className="sh">
        <div className="sh-top">
          <button className="sh-icon" onClick={()=>setModal('contact')}><i className="fas fa-bars"></i></button>
          <span className="sh-logo">{SNAME}</span>
          <button className="sh-contact" onClick={()=>setModal('contact')}>إتصل بنا</button>
        </div>
        <div className="sh-search">
          <i className="fas fa-search"></i>
          <input value={search} onChange={e=>{setSearch(e.target.value);setTab('search');setPage(1)}} placeholder="بحث عن المنتجات..."/>
          {search && <button onClick={()=>{setSearch('');setTab('home')}} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:16}}>×</button>}
        </div>
      </div>

      {/* DARK MODE TOGGLE */}
      <button onClick={()=>{document.body.classList.toggle('dark');localStorage.setItem('nqDark',document.body.classList.contains('dark')?'1':'0')}}
        style={{position:'fixed',top:78,right:14,zIndex:400,width:36,height:36,borderRadius:'50%',background:'rgba(255,107,53,.15)',color:'#FF6B35',border:'1.5px solid rgba(255,107,53,.3)',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <i className="fas fa-moon"></i>
      </button>

      {/* NOTIFICATION BELL (header left side) */}
      <button onClick={()=>toast('لا توجد إشعارات جديدة')}
        style={{position:'fixed',top:78,left:14,zIndex:400,width:36,height:36,borderRadius:'50%',background:'rgba(255,107,53,.15)',color:'#FF6B35',border:'1.5px solid rgba(255,107,53,.3)',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <i className="fas fa-bell"></i>
      </button>

      {/* PAGE */}
      <div className="page"><ActiveTab/></div>

      {/* BOTTOM NAV */}
      <div className="bnav">
        {[
          {id:'wish',   icon:'fas fa-heart',           label:'المفضلة',  badge:wishlist.length},
          {id:'cart-m', icon:'fas fa-shopping-basket', label:'السلة',    badge:cartCount, action:()=>setModal('cart')},
          {id:'search', icon:'fas fa-search',          label:'بحث'},
          {id:'cats',   icon:'fas fa-th',              label:'الفئات'},
          {id:'home',   icon:'fas fa-home',            label:'الرئيسية'},
        ].map(b=>(
          <button key={b.id} className={`bnav-b${tab===b.id||b.id==='cart-m'?'':''} ${(tab===b.id&&!b.action)?'on':''}`}
            onClick={()=>{if(b.action)b.action();else setTab(b.id)}}>
            <i className={b.icon}></i>
            {b.badge>0 && <span className="nbadge">{b.badge}</span>}
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      {/* WHATSAPP */}
      {WA && (
        <button className="wa" onClick={()=>window.open(`https://wa.me/${WA}`,'_blank')}>
          <i className="fab fa-whatsapp" style={{fontSize:26,color:'white'}}></i>
        </button>
      )}

      {/* SCROLL TOP */}
      {showScr && (
        <button className="scrtop" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

      {/* COMPARE BUBBLE */}
      {compareList.length>0 && (
        <button onClick={()=>setModal('compare')}
          style={{position:'fixed',bottom:90,right:showScr?70:14,background:'#7C3AED',color:'white',border:'none',borderRadius:30,padding:'8px 14px',cursor:'pointer',zIndex:279,fontSize:12,fontWeight:700,boxShadow:'0 4px 16px rgba(124,58,237,.4)',display:'flex',alignItems:'center',gap:6,fontFamily:'inherit'}}>
          <i className="fas fa-balance-scale"></i> مقارنة ({compareList.length})
        </button>
      )}

      {/* MODALS */}
      <ActiveModal/>
    </div>
  )
}
