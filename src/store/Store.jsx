/**
 * Store.jsx — نقاء v6
 * ✅ تسجيل دخول + تسجيل جديد مع OTP
 * ✅ عروض من قاعدة البيانات مع مؤقت
 * ✅ خصم تدريجي حسب الكمية
 * ✅ اشتري X خذ Y
 * ✅ زر واتساب بارز
 * ✅ الطلب بالكارتون فقط
 * ✅ حقول رقمية فقط
 * ✅ تأكيد الطلب بكود
 * ✅ صور متحركة للفئات والماركات
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

const WA_NUM = '213696668065'
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:'Tajawal',sans-serif;background:#F7F3EF;direction:rtl}
body.dark{background:#100800;color:#F0E8E0}

/* HEADER */
.sh{background:linear-gradient(160deg,#FF6B35,#E8430E 65%,#C02E00);
  padding:12px 16px 14px;position:sticky;top:0;z-index:300;
  box-shadow:0 4px 24px rgba(255,107,53,.4)}
.sh-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;gap:8px}
.sh-right{display:flex;gap:8px;align-items:center}
.sh-login{background:rgba(255,255,255,.18);color:white;border:1.5px solid rgba(255,255,255,.45);
  padding:7px 14px;border-radius:30px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit}
.sh-icon{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;
  background:rgba(255,255,255,.2);color:white;font-size:17px;display:flex;
  align-items:center;justify-content:center}
.sh-logo{font-size:21px;font-weight:900;color:white}
.sh-contact{background:white;color:#FF6B35;border:none;padding:7px 15px;
  border-radius:30px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}
.sh-search{background:white;border-radius:30px;display:flex;align-items:center;
  gap:8px;padding:9px 16px;box-shadow:0 2px 12px rgba(0,0,0,.12)}
body.dark .sh-search{background:#2a1400}
.sh-search input{border:none;outline:none;flex:1;font-family:inherit;font-size:14px;
  background:transparent;color:#333}
body.dark .sh-search input{color:#f0e8e0}

/* ANNOUNCE BAR */
.announce{background:#FF6B35;color:white;text-align:center;padding:7px 16px;
  font-size:12px;font-weight:700;letter-spacing:.3px}

/* BANNER */
.banner-wrap{margin:14px 14px 0;border-radius:20px;overflow:hidden;position:relative;
  box-shadow:0 8px 28px rgba(255,107,53,.22)}
.banner-track{display:flex;transition:transform .45s cubic-bezier(.4,0,.2,1)}
.banner-slide{min-width:100%;height:175px;object-fit:cover;display:block}
.banner-fall{min-width:100%;height:175px;background:linear-gradient(135deg,#FF6B35,#7C3AED);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
.bdots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px}
.bdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);
  border:none;cursor:pointer;transition:.3s;padding:0}
.bdot.on{background:white;width:18px;border-radius:10px}

/* FLASH SALE BAR */
.flash-bar{background:linear-gradient(135deg,#dc2626,#7c3aed);margin:14px 14px 0;
  border-radius:16px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;
  cursor:pointer;box-shadow:0 4px 16px rgba(220,38,38,.3)}
.timer-wrap{display:flex;gap:5px;align-items:center}
.tbox{background:rgba(0,0,0,.3);color:white;padding:4px 8px;border-radius:8px;
  font-size:16px;font-weight:900;font-family:monospace;min-width:32px;text-align:center}

/* SECTION */
.sec{padding:0 14px;margin-bottom:18px}
.sec-head{display:flex;justify-content:space-between;align-items:center;
  padding-top:16px;margin-bottom:13px}
.sec-title{font-size:17px;font-weight:900;color:#1A0A00}
body.dark .sec-title{color:#F0E8E0}
.sec-more{color:#FF6B35;font-size:13px;font-weight:700;border:none;
  background:none;cursor:pointer;font-family:inherit}

/* ANIMATED BRANDS/CATS GRID */
.anim-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.anim-card{position:relative;border-radius:16px;overflow:hidden;cursor:pointer;
  aspect-ratio:1;box-shadow:0 4px 14px rgba(0,0,0,.1);transition:.3s;
  background:white;display:flex;align-items:center;justify-content:center;
  border:2.5px solid transparent}
body.dark .anim-card{background:#1e1208}
.anim-card:active{transform:scale(.95)}
.anim-card.sel{border-color:#FF6B35}
.anim-card img{width:100%;height:100%;object-fit:cover;transition:.4s}
.anim-card:hover img{transform:scale(1.08)}
.anim-card .overlay{position:absolute;inset:0;background:rgba(0,0,0,.35);
  display:flex;align-items:flex-end;padding:8px;opacity:0;transition:.3s}
.anim-card:hover .overlay{opacity:1}
.anim-card .overlay span{color:white;font-weight:700;font-size:12px}
.anim-card .no-img{font-weight:900;font-size:13px;color:#1A0A00;text-align:center;padding:8px}
body.dark .anim-card .no-img{color:#F0E8E0}
.anim-all{border-radius:16px;aspect-ratio:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;cursor:pointer;
  background:linear-gradient(135deg,#FF6B35,#7C3AED);transition:.2s}
.anim-all i{font-size:24px;color:white;margin-bottom:5px}
.anim-all span{font-size:12px;font-weight:800;color:white}

/* CATS HORIZONTAL */
.cats-scroll{display:flex;gap:10px;overflow-x:auto;padding:2px 0 8px}
.cats-scroll::-webkit-scrollbar{display:none}
.cat-item{flex-shrink:0;width:80px;text-align:center;cursor:pointer;transition:.2s}
.cat-item:active{transform:scale(.93)}
.cat-img{width:72px;height:72px;border-radius:16px;overflow:hidden;
  margin:0 auto 6px;background:#F8F4F0;display:flex;align-items:center;
  justify-content:center;font-size:28px;border:2.5px solid transparent;transition:.2s}
.cat-img img{width:100%;height:100%;object-fit:cover}
.cat-item.sel .cat-img{border-color:#FF6B35}
.cat-label{font-size:11px;font-weight:700;color:#1A0A00}
body.dark .cat-label{color:#F0E8E0}

/* CHIPS */
.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0}
.chips::-webkit-scrollbar{display:none}
.chip{background:white;border:1.5px solid #E8DDD5;border-radius:30px;
  padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;
  white-space:nowrap;font-family:inherit;color:#7A6A5A;flex-shrink:0}
body.dark .chip{background:#1e1208;border-color:#3d2a1a;color:#C0A898}
.chip.sel{background:#FF6B35;color:white;border-color:#FF6B35}

/* PRODUCT CARD */
.pc{background:white;border-radius:18px;padding:11px;transition:.2s;
  box-shadow:0 2px 14px rgba(0,0,0,.07);cursor:pointer;
  border:1.5px solid rgba(0,0,0,.04);width:160px;flex-shrink:0}
body.dark .pc{background:#1e1208}
.pc:active{transform:scale(.97)}
.pc-img{position:relative;border-radius:13px;overflow:hidden;margin-bottom:9px;
  background:#F8F4F0;aspect-ratio:1}
.pc-img img{width:100%;height:100%;object-fit:cover}
.pc-noimg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:34px}
.badge{position:absolute;top:6px;right:6px;padding:3px 8px;border-radius:20px;
  font-size:10px;font-weight:800;color:white}
.b-new{background:#10b981}.b-hot{background:#f59e0b}
.b-promo{background:#FF6B35}.b-flash{background:#dc2626}
.fav-b{position:absolute;top:6px;left:6px;width:28px;height:28px;border-radius:50%;
  background:white;border:none;cursor:pointer;display:flex;align-items:center;
  justify-content:center;font-size:12px}
.pc-name{font-size:12px;font-weight:700;color:#1A0A00;margin-bottom:4px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
body.dark .pc-name{color:#F0E8E0}
.pc-price{font-size:15px;font-weight:900;color:#FF6B35}
.pc-old{font-size:11px;color:#94a3b8;text-decoration:line-through;margin-left:4px}
.pc-disc{background:#dc2626;color:white;font-size:10px;font-weight:800;
  padding:1px 6px;border-radius:20px;margin-right:4px}
.pc-carton{font-size:10px;color:#7A6A5A;margin-top:1px}
.pc-stock{font-size:10px;color:#ef4444;margin-top:2px}
.add-b{width:100%;margin-top:8px;padding:7px;border-radius:30px;
  background:linear-gradient(135deg,#FF6B35,#E8430E);color:white;
  border:none;cursor:pointer;font-family:inherit;font-size:11px;font-weight:800;
  display:flex;align-items:center;justify-content:center;gap:4px}

/* GRID */
.prod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.prod-grid .pc{width:100%}
.hscroll{display:flex;gap:11px;overflow-x:auto;padding:2px 0 10px}
.hscroll::-webkit-scrollbar{display:none}

/* PROMO BANNER STRIP */
.promo-strip{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px}
.promo-box{border-radius:16px;padding:14px;text-align:center;cursor:pointer;transition:.2s}
.promo-box:active{transform:scale(.97)}

/* PROGRESSIVE DISCOUNT BAR */
.prog-bar-wrap{background:#FFF0EB;border-radius:14px;padding:12px 14px;margin:12px 0}
body.dark .prog-bar-wrap{background:#2d1a0a}
.prog-track{background:#E8DDD5;border-radius:30px;height:8px;margin-top:8px;overflow:hidden}
.prog-fill{height:100%;border-radius:30px;
  background:linear-gradient(90deg,#FF6B35,#7C3AED);transition:width .5s ease}

/* CART BAR */
.cart-bar{background:linear-gradient(135deg,#FF6B35,#7C3AED);margin:14px;border-radius:16px;
  padding:12px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;
  box-shadow:0 6px 20px rgba(255,107,53,.3)}

/* DAY DEAL */
.day-deal{background:white;margin:14px;border-radius:20px;overflow:hidden;
  box-shadow:0 4px 20px rgba(255,107,53,.15);border:2px solid #FF6B35}
body.dark .day-deal{background:#1e1208}

/* BOTTOM NAV */
.drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.58);backdrop-filter:blur(3px);z-index:800}
.drawer{position:fixed;top:0;right:0;height:100vh;width:272px;background:white;z-index:900;
  box-shadow:-8px 0 40px rgba(0,0,0,.18);transform:translateX(110%);
  transition:transform .32s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;overflow:hidden}
body.dark .drawer{background:#1A0A00}
.drawer.open{transform:translateX(0)}
.drawer-head{background:linear-gradient(135deg,#FF6B35,#C02E00);padding:20px 18px 16px;flex-shrink:0;position:relative}
.drawer-nav{flex:1;overflow-y:auto;padding:8px 0}
.di{display:flex;align-items:center;gap:12px;padding:13px 18px;cursor:pointer;
  transition:.18s;color:#1A0A00;font-size:14px;font-weight:700}
body.dark .di{color:#F0E8E0}
.di:hover,.di.act{background:rgba(255,107,53,.09);color:#FF6B35}
.di-ico{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;
  justify-content:center;font-size:17px;flex-shrink:0;background:#FFF0EB}
.di.act .di-ico{background:linear-gradient(135deg,#FF6B35,#E8430E)}
.di-div{height:1px;background:#F1ECE8;margin:4px 16px}
body.dark .di-div{background:#2d1a0a}
.di-badge{background:#FF6B35;color:white;border-radius:30px;padding:1px 8px;font-size:11px;font-weight:800;margin-right:auto}
.bnav{position:fixed;bottom:0;left:0;right:0;background:white;
  display:flex;justify-content:space-around;align-items:center;
  padding:10px 0 16px;z-index:300;
  box-shadow:0 -4px 20px rgba(0,0,0,.08);border-radius:20px 20px 0 0}
body.dark .bnav{background:#1e1208}
.bnav-b{display:flex;flex-direction:column;align-items:center;gap:3px;border:none;
  background:none;cursor:pointer;font-family:inherit;color:#AAA099;font-size:10px;
  font-weight:700;padding:0 10px;position:relative;min-width:48px}
.bnav-b.on{color:#FF6B35}
.bnav-b i{font-size:22px}
.nbadge{position:absolute;top:-1px;right:6px;background:#FF6B35;color:white;
  border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;
  align-items:center;justify-content:center;font-weight:800;border:2px solid white}
body.dark .nbadge{border-color:#1e1208}

/* WHATSAPP - prominent like Esmmar */
.wa-float{position:fixed;bottom:90px;left:14px;z-index:400}
.wa-btn{width:56px;height:56px;background:#25D366;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 20px rgba(37,211,102,.5);cursor:pointer;border:none;
  animation:waPulse 2s ease-in-out infinite;transition:.2s}
.wa-btn:active{transform:scale(.9)}
@keyframes waPulse{
  0%,100%{box-shadow:0 4px 20px rgba(37,211,102,.5)}
  50%{box-shadow:0 4px 32px rgba(37,211,102,.8),0 0 0 8px rgba(37,211,102,.15)}
}
.wa-label{background:#25D366;color:white;font-size:10px;font-weight:700;
  border-radius:20px;padding:3px 8px;text-align:center;margin-top:4px;
  white-space:nowrap}

/* SCROLL TOP */
.scrtop{position:fixed;bottom:90px;right:14px;width:44px;height:44px;
  background:#FF6B35;color:white;border-radius:50%;border:none;cursor:pointer;
  font-size:18px;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(255,107,53,.4);z-index:280}

/* MODAL */
.moverlay{position:fixed;inset:0;background:rgba(0,0,0,.55);
  backdrop-filter:blur(5px);z-index:1000;display:flex;
  align-items:flex-end;justify-content:center}
.msheet{background:white;border-radius:24px 24px 0 0;width:100%;
  max-height:92vh;overflow-y:auto;padding-bottom:30px;
  animation:slideUp .3s cubic-bezier(.4,0,.2,1)}
body.dark .msheet{background:#1e1208}
.msheet.center{border-radius:24px;max-width:460px;margin:20px auto;animation:zoomIn .25s ease}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.mhandle{width:38px;height:4px;background:#E8DDD5;border-radius:10px;margin:12px auto 2px}
body.dark .mhandle{background:#3d2a1a}
.mhead{padding:14px 18px;display:flex;justify-content:space-between;align-items:center;
  border-bottom:1px solid #F7F3EF;position:sticky;top:0;background:white;z-index:2}
body.dark .mhead{background:#1e1208;border-color:#2d1a0a}
.mhead h3{font-size:17px;font-weight:900;color:#1A0A00}
body.dark .mhead h3{color:#F0E8E0}
.mclose{width:32px;height:32px;border-radius:50%;background:#F7F3EF;border:none;
  cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center}
body.dark .mclose{background:#2d1a0a;color:#F0E8E0}
.mbody{padding:16px 18px}

/* INPUTS */
.fi{background:#F7F3EF;border:1.5px solid #E8DDD5;border-radius:14px;
  padding:12px 16px;width:100%;font-family:inherit;font-size:14px;
  color:#1A0A00;outline:none;margin-bottom:12px;
  -webkit-user-select:text;user-select:text}
body.dark .fi{background:#2d1a0a;border-color:#3d2a1a;color:#F0E8E0}
.fi:focus{border-color:#FF6B35;box-shadow:0 0 0 3px rgba(255,107,53,.1)}
.fi-label{font-size:13px;font-weight:700;color:#7A6A5A;margin-bottom:6px;display:block}

/* CART ITEM */
.ci{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F7F3EF;align-items:center}
body.dark .ci{border-color:#2d1a0a}
.ci-img{width:58px;height:58px;border-radius:12px;object-fit:cover;
  background:#F7F3EF;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px}
.qty-row{display:flex;align-items:center;gap:10px;margin-top:6px}
.qty-b{width:28px;height:28px;border-radius:50%;border:2px solid #FF6B35;
  color:#FF6B35;background:none;cursor:pointer;font-size:15px;font-weight:800;
  display:flex;align-items:center;justify-content:center}
.qty-b:active{background:#FF6B35;color:white}

/* BUTTONS */
.abtn{width:100%;padding:15px;border-radius:30px;
  background:linear-gradient(135deg,#FF6B35,#E8430E);color:white;
  border:none;cursor:pointer;font-family:inherit;font-size:16px;font-weight:900;
  display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px}
.abtn.purple{background:linear-gradient(135deg,#7C3AED,#5B21B6)}
.abtn.green{background:linear-gradient(135deg,#10b981,#059669)}

/* OTP */
.otp-inputs{display:flex;gap:10px;justify-content:center;margin:16px 0}
.otp-input{width:52px;height:58px;border:2px solid #E8DDD5;border-radius:12px;
  text-align:center;font-size:22px;font-weight:900;font-family:inherit;
  outline:none;background:#F7F3EF;-webkit-user-select:text;user-select:text}
.otp-input:focus{border-color:#FF6B35}
body.dark .otp-input{background:#2d1a0a;border-color:#3d2a1a;color:#F0E8E0}

/* TOAST */
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
  background:#1A0A00;color:white;padding:10px 22px;border-radius:30px;
  z-index:5000;font-size:13px;font-weight:700;animation:tin .3s ease;
  white-space:nowrap;max-width:85vw;text-align:center}
.toast.err{background:#ef4444}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(16px)}
  to{opacity:1;transform:translateX(-50%) translateY(0)}}

.empty{text-align:center;padding:40px 16px;color:#7A6A5A}
.empty i{font-size:52px;margin-bottom:12px;display:block;opacity:.25}
.trstep{display:flex;gap:12px;align-items:flex-start;padding:10px 0;
  border-bottom:1px solid #F7F3EF}
body.dark .trstep{border-color:#2d1a0a}
.trdot{width:36px;height:36px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:15px}
.trdot.done{background:linear-gradient(135deg,#FF6B35,#7C3AED);color:white}
.trdot.wait{background:#F7F3EF;color:#AAA099}
body.dark .trdot.wait{background:#2d1a0a}

.page{padding-bottom:80px}
/* Quick order table */
.qt-wrap{overflow-x:auto;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.07)}
.qt-wrap table{width:100%;border-collapse:collapse;min-width:460px}
/* Filter range */
input[type=range]{height:4px;border-radius:10px;cursor:pointer}
`

/* helpers */
function showToast(msg, isErr=false) {
  document.querySelectorAll('.toast').forEach(t=>t.remove())
  const t=document.createElement('div')
  t.className='toast'+(isErr?' err':''); t.textContent=msg
  document.body.appendChild(t); setTimeout(()=>t.remove(),2800)
}
const hashPwd = p => { try { return CryptoJS.SHA256(p).toString() } catch { return p } }

/* flash timer */
function useTimer(endTime) {
  const [tl, setTl] = useState({h:'00',m:'00',s:'00'})
  useEffect(() => {
    const tick = () => {
      const diff = endTime - Date.now()
      if (diff<=0) { setTl({h:'00',m:'00',s:'00'}); return }
      setTl({
        h: String(Math.floor(diff/3600000)).padStart(2,'0'),
        m: String(Math.floor((diff%3600000)/60000)).padStart(2,'0'),
        s: String(Math.floor((diff%60000)/1000)).padStart(2,'0'),
      })
    }
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id)
  }, [endTime])
  return tl
}

/* ── MODALS (outside main to prevent re-mount on re-render) ── */

function LoginModal({ onClose, onLogin, onRegister }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email||!pass) { showToast('أدخل البيانات',true); return }
    setLoading(true)
    const { data } = await supabase.from('customers').select('*')
      .or(`email.eq.${email},phone.eq.${email}`)
      .eq('password', hashPwd(pass)).maybeSingle()
    if (data) { onLogin(data) } else showToast('البيانات غير صحيحة',true)
    setLoading(false)
  }

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div style={{textAlign:'center',padding:'24px 18px 0'}}>
          <div style={{fontSize:40}}>🛍️</div>
          <h2 style={{fontSize:22,fontWeight:900,color:'#1A0A00',margin:'8px 0 4px'}}>نقاء</h2>
        </div>
        <div className="mbody">
          <label className="fi-label">البريد أو الهاتف</label>
          <input className="fi" type="email" value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()}
            autoComplete="email" autoFocus />
          <label className="fi-label">كلمة المرور</label>
          <input className="fi" type="password" value={pass}
            onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()}
            autoComplete="current-password" />
          <button className="abtn" onClick={submit} disabled={loading}>
            {loading?'⏳ جاري الدخول...':'🔐 دخول'}
          </button>
          <button className="abtn purple" onClick={onRegister}>📝 إنشاء حساب جديد</button>
          <div style={{textAlign:'center',marginTop:8}}>
            <button onClick={onClose}
              style={{background:'none',border:'none',color:'#FF6B35',cursor:'pointer',
                fontSize:14,fontFamily:'inherit',fontWeight:600}}>
              متابعة كزائر
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RegisterModal({ onClose, onSuccess }) {
  const [form, setForm]   = useState({name:'',email:'',phone:'',address:'',pass:'',pass2:''})
  const [step, setStep]   = useState(1)
  const [otp,  setOtp]    = useState('')
  const [genOtp, setGenOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [digits, setDigits]   = useState(['','','',''])
  const refs = [useRef(null),useRef(null),useRef(null),useRef(null)]

  const handleDigit = (i, v) => {
    const nd=[...digits]; nd[i]=v.replace(/\D/,''); setDigits(nd)
    if (nd[i]&&i<3) refs[i+1].current?.focus()
    if (!nd[i]&&i>0) refs[i-1].current?.focus()
    setOtp(nd.join(''))
  }

  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const submit = async () => {
    const {name,email,phone,pass,pass2}=form
    if (!name||!email||!phone||!pass) { showToast('أكمل البيانات',true); return }
    if (pass!==pass2) { showToast('كلمتا المرور غير متطابقتان',true); return }
    setLoading(true)
    const {data:ex}=await supabase.from('customers').select('id').eq('email',email).maybeSingle()
    if (ex) { showToast('البريد مسجّل مسبقاً',true); setLoading(false); return }
    const code = String(Math.floor(1000+Math.random()*9000))
    setGenOtp(code); setStep(2)
    showToast(`كود التحقق: ${code}`)
    setLoading(false)
  }

  const verify = async () => {
    if (otp!==genOtp) { showToast('الكود غير صحيح',true); return }
    setLoading(true)
    const {error}=await supabase.from('customers').insert({
      id:Date.now(), name:form.name, email:form.email, phone:form.phone,
      address:form.address, password:hashPwd(form.pass), points:0, tier:'M1',
      created_at:new Date().toISOString()
    })
    if (error) { showToast('خطأ: '+error.message,true); setLoading(false); return }
    showToast('✅ تم التسجيل بنجاح!'); onSuccess()
    setLoading(false)
  }

  if (step===2) return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📱 تأكيد الحساب</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody" style={{textAlign:'center'}}>
          <p style={{fontSize:14,color:'#7A6A5A',marginBottom:16}}>
            أدخل كود التحقق المكون من 4 أرقام
          </p>
          <div className="otp-inputs">
            {digits.map((d,i)=>(
              <input key={i} ref={refs[i]} className="otp-input"
                value={d} inputMode="numeric" maxLength={1}
                onChange={e=>handleDigit(i,e.target.value)}
                onKeyDown={e=>{if(e.key==='Backspace'&&!d&&i>0) refs[i-1].current?.focus()}} />
            ))}
          </div>
          <div style={{background:'#fef9c3',borderRadius:12,padding:12,marginBottom:16,fontSize:13}}>
            🔑 كودك: <strong style={{fontSize:20,color:'#dc2626'}}>{genOtp}</strong>
            <p style={{fontSize:11,color:'#64748b',marginTop:4}}>في الإصدار الكامل يُرسل على واتساب تلقائياً</p>
          </div>
          <button className="abtn" onClick={verify} disabled={loading||otp.length<4}>
            {loading?'⏳...':'✅ تأكيد التسجيل'}
          </button>
          <button style={{background:'none',border:'none',color:'#FF6B35',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}
            onClick={()=>{setStep(1);setDigits(['','','',''])}}>
            ← تعديل البيانات
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📝 حساب جديد</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <label className="fi-label">الاسم الكامل *</label>
          <input className="fi" value={form.name} onChange={F('name')} autoComplete="name" />
          <label className="fi-label">البريد الإلكتروني *</label>
          <input className="fi" type="email" value={form.email} onChange={F('email')} autoComplete="email" />
          <label className="fi-label">رقم الهاتف *</label>
          <input className="fi" type="tel" value={form.phone} onChange={F('phone')}
            inputMode="numeric" autoComplete="tel"
            onKeyPress={e=>{if(!/[0-9+]/.test(e.key)) e.preventDefault()}} />
          <label className="fi-label">العنوان</label>
          <input className="fi" value={form.address} onChange={F('address')} autoComplete="street-address" />
          <label className="fi-label">كلمة المرور *</label>
          <input className="fi" type="password" value={form.pass} onChange={F('pass')} autoComplete="new-password" />
          <label className="fi-label">تأكيد كلمة المرور *</label>
          <input className="fi" type="password" value={form.pass2} onChange={F('pass2')} autoComplete="new-password" />
          <button className="abtn" onClick={submit} disabled={loading}>
            {loading?'⏳...':'📱 التالي — تأكيد الهاتف'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CartModal({ cart, setCart, onClose, onCheckout, freeShip, currency, promos }) {
  const cartTotal  = cart.reduce((s,i)=>s+(Number(i.price)||0)*(Number(i.qty)||1),0)
  const changeQty  = (id,d) => setCart(p=>p.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i))
  const remove     = id => setCart(p=>p.filter(i=>i.id!==id))

  // حساب خصم اشتري X خذ Y
  const getBuy3Get1Discount = () => {
    const buyPromo = promos.find(p=>p.active&&p.type==='buy_x_get_y')
    if (!buyPromo) return 0
    const pids = typeof buyPromo.product_ids==='string'?JSON.parse(buyPromo.product_ids||'[]'):(buyPromo.product_ids||[])
    const eligible = cart.filter(i=>pids.length===0||pids.includes(i.id))
    const totalQty = eligible.reduce((s,i)=>s+i.qty,0)
    const buyQty   = buyPromo.buy_qty||3
    const getQty   = buyPromo.get_qty||1
    if (totalQty < buyQty+getQty) return 0
    const cheapest = [...eligible].sort((a,b)=>a.price-b.price)[0]
    return (cheapest?.price||0) * getQty
  }
  const buy3Disc = getBuy3Get1Discount()
  const buyPromoActive = promos.find(p=>p.active&&p.type==='buy_x_get_y')

  // خصم تدريجي (كلما اشتريت أكثر)
  const volTiers = [
    { min:500,  disc:5,  label:'خصم 5%' },
    { min:1000, disc:10, label:'خصم 10%' },
    { min:2000, disc:15, label:'خصم 15%' },
  ]
  const currentTier = [...volTiers].reverse().find(t=>cartTotal>=t.min)
  const nextTier    = volTiers.find(t=>cartTotal<t.min)
  const volDisc     = currentTier ? cartTotal*(currentTier.disc/100) : 0

  const finalTotal  = cartTotal - buy3Disc - volDisc

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet">
        <div className="mhandle"></div>
        <div className="mhead">
          <h3>🛒 سلة المشتريات ({cart.reduce((s,i)=>s+i.qty,0)} كرتون)</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          {cart.length===0
            ? <div className="empty"><i className="fas fa-shopping-cart"></i><p>السلة فارغة</p></div>
            : <>
              {cart.map(i=>(
                <div key={i.id} className="ci">
                  {i.image?<img src={i.image} className="ci-img" alt=""/>:<div className="ci-img">🛍️</div>}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#1A0A00'}}>{i.name}</div>
                    <div style={{color:'#FF6B35',fontWeight:900,fontSize:15,marginTop:2}}>
                      {i.price} {currency} × {i.qty} = {(i.price*i.qty).toFixed(0)} {currency}
                    </div>
                    <div className="qty-row">
                      <button className="qty-b" onClick={()=>changeQty(i.id,-1)}>−</button>
                      <span style={{fontWeight:800,fontSize:15,minWidth:22,textAlign:'center'}}>{i.qty} كرتون{i.unitsPerCarton?` (${i.qty*(i.unitsPerCarton||12)} قطعة)`:''}</span>
                      <button className="qty-b" onClick={()=>changeQty(i.id,1)}>+</button>
                    </div>
                  </div>
                  <button onClick={()=>remove(i.id)}
                    style={{border:'none',background:'none',color:'#ef4444',cursor:'pointer',fontSize:18}}>🗑️</button>
                </div>
              ))}

              {/* خصم اشتري X خذ Y */}
              {buy3Disc>0 && buyPromoActive && (
                <div style={{background:'linear-gradient(135deg,#d1fae5,#a7f3d0)',borderRadius:14,padding:12,margin:'10px 0',textAlign:'center'}}>
                  <div style={{fontWeight:800,color:'#059669',fontSize:15}}>🎁 {buyPromoActive.name}</div>
                  <div style={{fontSize:13,color:'#065f46',marginTop:4}}>خصم: <strong>{buy3Disc.toFixed(0)} {currency}</strong></div>
                </div>
              )}

              {/* خصم تدريجي */}
              {/* شريط التوصيل المجاني */}
              {cartTotal < freeShip && (
                <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:10,padding:'10px 12px',marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#C2410C',marginBottom:5}}>
                    🚚 أضف <strong style={{color:'#FF6B35',fontSize:15}}>{(freeShip-cartTotal).toFixed(0)} {currency}</strong> للتوصيل المجاني!
                  </div>
                  <div style={{background:'#E8DDD5',borderRadius:30,height:7,overflow:'hidden'}}>
                    <div style={{width:`${Math.min(100,(cartTotal/freeShip)*100)}%`,height:'100%',
                      background:'linear-gradient(90deg,#FF6B35,#10b981)',borderRadius:30,transition:'width .4s'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#94a3b8',marginTop:3}}>
                    <span>0 {currency}</span><span style={{color:'#10b981',fontWeight:700}}>🎁 {freeShip} {currency} = توصيل مجاني</span>
                  </div>
                </div>
              )}
              {cartTotal >= freeShip && (
                <div style={{background:'#D1FAE5',borderRadius:10,padding:'8px 12px',marginBottom:12,textAlign:'center',fontWeight:700,color:'#059669',fontSize:13}}>
                  🎉 أحسنت! التوصيل مجاني لهذا الطلب
                </div>
              )}

              <div className="prog-bar-wrap">
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700}}>
                  {currentTier
                    ? <span style={{color:'#10b981'}}>🎉 خصم {currentTier.disc}% مفعّل! وفّرت {volDisc.toFixed(0)} {currency}</span>
                    : nextTier
                      ? <span>أضف {(nextTier.min-cartTotal).toFixed(0)} {currency} للحصول على {nextTier.label}</span>
                      : <span>🏆 أقصى خصم محقق!</span>
                  }
                  <span style={{color:'#FF6B35'}}>{Math.min(100,(cartTotal/2000*100)).toFixed(0)}%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{width:`${Math.min(100,cartTotal/2000*100)}%`}}></div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#94a3b8',marginTop:4}}>
                  <span>500دج→5%</span><span>1000دج→10%</span><span>2000دج→15%</span>
                </div>
              </div>

              {/* الإجمالي */}
              {(buy3Disc>0||volDisc>0)&&(
                <div style={{fontSize:13,color:'#94a3b8',textDecoration:'line-through',textAlign:'left',marginBottom:4}}>
                  {cartTotal.toFixed(0)} {currency}
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:18,marginBottom:16}}>
                <span>الإجمالي</span>
                <span style={{color:'#FF6B35'}}>{finalTotal.toFixed(0)} {currency}</span>
              </div>
              <button className="abtn" onClick={()=>onCheckout(finalTotal,buy3Disc+volDisc)}>
                <i className="fas fa-credit-card"></i> إتمام الشراء
              </button>
            </>}
        </div>
      </div>
    </div>
  )
}

function CheckoutModal({ cart, finalTotal, onClose, onSuccess, currency, waNum, storeName }) {
  const [form, setForm] = useState({name:'',phone:'',address:''})
  const [step, setStep] = useState(1) // 1=form, 2=otp-choice, 3=otp
  const [otpMethod, setOtpMethod] = useState('whatsapp')
  const [otp,  setOtp]  = useState('')
  const [genOtp, setGenOtp] = useState('')
  const [digits, setDigits] = useState(['','','',''])
  const refs = [useRef(null),useRef(null),useRef(null),useRef(null)]
  const [loading, setLoading] = useState(false)
  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const goToOtp = () => {
    if (!form.name||!form.phone) { showToast('الاسم والهاتف مطلوبان',true); return }
    const code = String(Math.floor(1000+Math.random()*9000))
    setGenOtp(code); setStep(3)
    showToast(`كود التأكيد: ${code}`)
  }

  const handleDigit = (i, v) => {
    const nd=[...digits]; nd[i]=v.replace(/\D/,''); setDigits(nd)
    if (nd[i]&&i<3) refs[i+1].current?.focus()
    if (!nd[i]&&i>0) refs[i-1].current?.focus()
    setOtp(nd.join(''))
  }

  const confirmOrder = async () => {
    if (otp!==genOtp) { showToast('الكود غير صحيح',true); return }
    setLoading(true)
    const order = {
      id:Date.now(), customer_name:form.name, customer_phone:form.phone,
      customer_address:form.address,
      date:new Date().toLocaleString('ar-DZ'),
      items:JSON.stringify(cart.map(i=>({id:i.id,name:i.name,quantity:i.qty,price:i.price}))),
      total:finalTotal, status:'processing' // تأكيد مباشر بعد OTP
    }
    const {error}=await supabase.from('orders').insert(order)
    if (error) { showToast('خطأ: '+error.message,true); setLoading(false); return }
    for (const item of cart) {
      const {data:p}=await supabase.from('products').select('stock').eq('id',item.id).maybeSingle()
      if (p) await supabase.from('products').update({stock:Math.max(0,(p.stock||0)-item.qty)}).eq('id',item.id)
    }
    if (waNum) {
      const msg=`مرحباً ${form.name}، تم تأكيد طلبك رقم ${order.id} ✅\nالإجمالي: ${finalTotal.toFixed(0)} ${currency}\nشكراً! — ${storeName}`
      window.open(`https://wa.me/${form.phone.replace(/^0/,'213')}?text=${encodeURIComponent(msg)}`,'_blank')
    }
    onSuccess(order.id)
    setLoading(false)
  }

  if (step===3) return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>🔐 تأكيد الطلبية</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody" style={{textAlign:'center'}}>
          <p style={{fontSize:14,color:'#7A6A5A',marginBottom:8}}>أدخل كود التأكيد المرسل إليك</p>
          <p style={{fontWeight:700,color:'#FF6B35',marginBottom:16}}>{form.phone}</p>
          <div className="otp-inputs">
            {digits.map((d,i)=>(
              <input key={i} ref={refs[i]} className="otp-input"
                value={d} inputMode="numeric" maxLength={1}
                onChange={e=>handleDigit(i,e.target.value)}
                onKeyDown={e=>{if(e.key==='Backspace'&&!d&&i>0) refs[i-1].current?.focus()}} />
            ))}
          </div>
          <div style={{background:'#fef9c3',borderRadius:12,padding:12,marginBottom:16,fontSize:13}}>
            🔑 كودك: <strong style={{fontSize:20,color:'#dc2626'}}>{genOtp}</strong>
          </div>
          <button className="abtn green" onClick={confirmOrder} disabled={loading||otp.length<4}>
            {loading?'⏳...':'✅ تأكيد الطلبية'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📋 تأكيد الطلب</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <label className="fi-label">الاسم الكامل *</label>
          <input className="fi" value={form.name} onChange={F('name')} autoComplete="name" />
          <label className="fi-label">رقم الهاتف *</label>
          <input className="fi" type="tel" value={form.phone} onChange={F('phone')}
            inputMode="numeric" autoComplete="tel"
            onKeyPress={e=>{if(!/[0-9+]/.test(e.key)) e.preventDefault()}} />
          <label className="fi-label">العنوان</label>
          <textarea className="fi" rows="2" value={form.address} onChange={F('address')}
            style={{resize:'none'}} autoComplete="street-address"></textarea>
          <div style={{background:'#FFF0EB',borderRadius:14,padding:'12px 16px',
            marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:700}}>إجمالي الطلب</span>
            <span style={{fontWeight:900,color:'#FF6B35',fontSize:18}}>{finalTotal.toFixed(0)} {currency}</span>
          </div>
          <button className="abtn" onClick={goToOtp}>
            <i className="fas fa-shield-alt"></i> التالي — تأكيد بكود
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ product, wishlist, onClose, onAddCart, onToggleWish, currency, products, sevenAgo, onShowProduct, promos }) {
  if(!product) return null
  if (!product) return null
  const p = product
  const disc = Number(p.discount)||0
  const finalPrice = disc>0 ? (p.price*(1-disc/100)).toFixed(0) : p.price
  const related = products.filter(r=>(r.category_id===p.category_id||r.brand_id===p.brand_id)&&r.id!==p.id&&!r.disabled).slice(0,6)

  // خصم الكميات
  const volTiers=[{qty:6,disc:5},{qty:12,disc:10},{qty:24,disc:15}]

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet">
        <div className="mhandle"></div>
        {p.image?<img src={p.image} style={{width:'100%',height:260,objectFit:'cover'}} alt={p.name}/>:
          <div style={{width:'100%',height:200,background:'#F8F4F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56}}>🛍️</div>}
        <div className="mhead">
          <h3 style={{flex:1,fontSize:15}}>{p.name}</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div>
              {disc>0&&<span style={{fontSize:13,color:'#94a3b8',textDecoration:'line-through',marginLeft:8}}>{p.price} {currency}</span>}
              <span style={{fontSize:24,fontWeight:900,color:'#FF6B35'}}>{finalPrice} {currency}</span>
              {disc>0&&<span className="pc-disc" style={{marginRight:8}}>-{disc}%</span>}
            </div>
            <button onClick={()=>onToggleWish(p.id)}
              style={{width:40,height:40,borderRadius:'50%',background:wishlist.includes(p.id)?'#FFF0EB':'#F7F3EF',border:'none',cursor:'pointer',fontSize:20}}>
              <i className="fas fa-heart" style={{color:wishlist.includes(p.id)?'#FF6B35':'#CBD5E1'}}></i>
            </button>
          </div>
          {p.carton_price&&<p style={{color:'#7A6A5A',fontSize:13,marginBottom:8}}>الكرتون ({p.units||12} قطعة): {p.carton_price} {currency}</p>}
          {(p.stock||0)>0&&(p.stock||0)<10&&<p style={{color:'#ef4444',fontWeight:700,fontSize:13,marginBottom:8}}>⚠️ متبقي {p.stock} قطعة فقط!</p>}
          {(p.stock||0)===0&&<p style={{color:'#ef4444',fontWeight:700,fontSize:13,marginBottom:8}}>❌ نفذ من المخزون</p>}

          {/* جدول خصم الكميات */}
          <div style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',borderRadius:12,padding:12,marginBottom:12,border:'1px solid #10b981'}}>
            <div style={{fontWeight:800,color:'#059669',marginBottom:8,fontSize:13}}>📦 كلما اشتريت أكثر — وفّرت أكثر!</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {volTiers.map(({qty,disc})=>(
                <div key={qty} style={{background:'white',borderRadius:10,padding:'7px 4px',textAlign:'center',border:'1px solid #10b981'}}>
                  <div style={{fontWeight:800,fontSize:13}}>{qty}+ قطعة</div>
                  <div style={{color:'#10b981',fontWeight:700,fontSize:12}}>{disc}% خصم</div>
                  <div style={{fontSize:11,color:'#065f46'}}>{(p.price*(1-disc/100)).toFixed(0)} {currency}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="abtn" onClick={()=>{onAddCart(p);onClose()}} disabled={(p.stock||0)===0}>
            <i className="fas fa-cart-plus"></i>
            {(p.stock||0)===0?'نفذ من المخزون':'أضف للسلة'}
          </button>
          <button onClick={()=>{
            const msg=`🛍️ ${p.name}%0A💰 ${p.price} ${currency}/كرتون%0A📦 ${p.units||12} قطعة/كرتون%0A🔗 ${window.location.origin}`
            window.open(`https://wa.me/?text=${msg}`,'_blank')
          }} style={{width:'100%',padding:'10px',borderRadius:30,border:'2px solid #25D366',
            background:'none',color:'#25D366',fontWeight:800,cursor:'pointer',fontFamily:'inherit',
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:6,fontSize:14}}>
            <i className="fab fa-whatsapp"></i> شارك هذا المنتج
          </button>

          {related.length>0&&(
            <div style={{marginTop:16}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:10}}>🔄 قد يعجبك أيضاً</div>
              <div className="hscroll">
                {related.map(r=>(
                  <div key={r.id} onClick={()=>onShowProduct(r)}
                    style={{minWidth:95,cursor:'pointer',textAlign:'center',flexShrink:0}}>
                    {r.image?<img src={r.image} style={{width:80,height:80,borderRadius:12,objectFit:'cover'}}/>:
                      <div style={{width:80,height:80,borderRadius:12,background:'#F7F3EF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>🛍️</div>}
                    <div style={{fontSize:11,fontWeight:700,marginTop:4}}>{r.name}</div>
                    <div style={{fontSize:12,color:'#FF6B35',fontWeight:800}}>{r.price} {currency}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* تقييمات المنتج */}
          <ReviewsSection productId={p.id} currency={currency}/>
        </div>
      </div>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⭐ نظام تقييمات المنتجات
━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ReviewsSection({ productId, currency }) {
  const [reviews, setReviews] = useState([])
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')
  const [hover,   setHover]   = useState(0)
  const [saving,  setSaving]  = useState(false)
  const [loaded,  setLoaded]  = useState(false)

  useEffect(()=>{
    if(!productId) return
    supabase.from('reviews').select('*').eq('product_id', productId)
      .order('id',{ascending:false}).limit(20)
      .then(({data})=>{ setReviews(data||[]); setLoaded(true) })
      .catch(()=>setLoaded(true))
  },[productId])

  const avgR = reviews.length ? (reviews.reduce((s,r)=>s+(r.rating||0),0)/reviews.length).toFixed(1) : 0
  const cust = (() => { try{ return JSON.parse(localStorage.getItem('nq_customer')||'null') }catch{ return null } })()

  const toast = (msg,err=false) => {
    const d=document.createElement('div'); d.className='toast'+(err?' err':'')
    d.textContent=msg; document.body.appendChild(d); setTimeout(()=>d.remove(),3000)
  }

  const submit = async () => {
    if(!cust){ toast('سجّل دخولك لإضافة تقييم',true); return }
    if(!rating){ toast('اختر عدد النجوم أولاً',true); return }
    setSaving(true)
    await supabase.from('reviews').insert({
      id: Date.now(), product_id: productId,
      customer_id: cust.id, customer_name: cust.name,
      rating, comment: comment.trim(),
      created_at: new Date().toISOString()
    }).catch(()=>{})
    const {data} = await supabase.from('reviews').select('*').eq('product_id',productId).order('id',{ascending:false}).limit(20)
    setReviews(data||[]); setRating(0); setComment(''); setSaving(false)
    toast('✅ تم إضافة تقييمك')
  }

  if (!loaded) return null

  return (
    <div style={{borderTop:'1px solid #F1ECE8',padding:'16px 18px 0'}}>
      {/* ملخص التقييم */}
      {reviews.length>0&&(
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16,
          background:'#FFF7ED',borderRadius:12,padding:14}}>
          <div style={{textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:36,fontWeight:900,color:'#FF6B35',lineHeight:1}}>{avgR}</div>
            <div style={{display:'flex',justifyContent:'center',gap:1,margin:'4px 0'}}>
              {[1,2,3,4,5].map(n=><span key={n} style={{color:n<=Math.round(avgR)?'#FF6B35':'#E2E8F0',fontSize:14}}>★</span>)}
            </div>
            <div style={{fontSize:11,color:'#7A6A5A'}}>{reviews.length} تقييم</div>
          </div>
          <div style={{flex:1}}>
            {[5,4,3,2,1].map(n=>{
              const cnt=reviews.filter(r=>r.rating===n).length
              const pct=reviews.length?Math.round(cnt/reviews.length*100):0
              return (
                <div key={n} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{fontSize:11,color:'#7A6A5A',width:8,textAlign:'center'}}>{n}</span>
                  <span style={{color:'#FF6B35',fontSize:11}}>★</span>
                  <div style={{flex:1,background:'#E8DDD5',borderRadius:30,height:5,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:'#FF6B35',borderRadius:30,transition:'width .5s'}}/>
                  </div>
                  <span style={{fontSize:10,color:'#94a3b8',width:18,textAlign:'left'}}>{cnt}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <h3 style={{fontWeight:800,marginBottom:12,fontSize:15}}>⭐ التقييمات ({reviews.length})</h3>
      {/* نموذج إضافة تقييم */}
      {cust ? (
        <div style={{background:'#F7F3EF',borderRadius:12,padding:14,marginBottom:14}}>
          <p style={{fontSize:13,fontWeight:700,marginBottom:8,color:'#1A0A00'}}>🌟 أضف تقييمك</p>
          <div style={{display:'flex',gap:6,marginBottom:10}}>
            {[1,2,3,4,5].map(n=>(
              <span key={n} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
                onClick={()=>setRating(n)}
                style={{fontSize:30,cursor:'pointer',transition:'transform .15s',
                  color:(hover||rating)>=n?'#FF6B35':'#E2E8F0',
                  transform:(hover||rating)>=n?'scale(1.15)':'scale(1)'}}>★</span>
            ))}
            {rating>0&&<span style={{fontSize:12,color:'#7A6A5A',marginRight:4,alignSelf:'center'}}>
              {['','سيء','مقبول','جيد','جيد جداً','ممتاز'][rating]}
            </span>}
          </div>
          <textarea value={comment} onChange={e=>setComment(e.target.value)}
            placeholder="اكتب تعليقك (اختياري)..." maxLength={300} rows={2}
            style={{border:'1.5px solid #E8DDD5',borderRadius:10,padding:'9px 12px',
              width:'100%',fontFamily:'inherit',fontSize:13,outline:'none',
              resize:'none',background:'white',boxSizing:'border-box',marginBottom:8}}
            onFocus={e=>e.target.style.borderColor='#FF6B35'}
            onBlur={e=>e.target.style.borderColor='#E8DDD5'}/>
          <button className="abtn" onClick={submit} disabled={saving||!rating}
            style={{marginBottom:0,padding:'10px',fontSize:13,opacity:!rating?0.5:1}}>
            {saving?'⏳ جاري الإرسال...':'✅ إرسال التقييم'}
          </button>
        </div>
      ) : (
        <p style={{fontSize:13,color:'#7A6A5A',marginBottom:12,textAlign:'center',padding:'8px',
          background:'#F7F3EF',borderRadius:10}}>
          🔐 <strong>سجّل دخولك</strong> لإضافة تقييم
        </p>
      )}
      {/* قائمة التقييمات */}
      {reviews.map(r=>(
        <div key={r.id} style={{borderBottom:'1px solid #F1ECE8',padding:'12px 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
            <div>
              <strong style={{fontSize:13,color:'#1A0A00'}}>{r.customer_name}</strong>
              <div style={{display:'flex',gap:1,marginTop:2}}>
                {[1,2,3,4,5].map(n=><span key={n} style={{color:n<=r.rating?'#FF6B35':'#E2E8F0',fontSize:13}}>★</span>)}
              </div>
            </div>
            <span style={{fontSize:11,color:'#94a3b8'}}>{new Date(r.created_at).toLocaleDateString('ar-DZ')}</span>
          </div>
          {r.comment&&<p style={{fontSize:13,color:'#475569',margin:0,lineHeight:1.5}}>{r.comment}</p>}
        </div>
      ))}
      {reviews.length===0&&loaded&&(
        <p style={{textAlign:'center',color:'#94a3b8',fontSize:13,padding:'20px 0'}}>
          لا توجد تقييمات بعد — كن أول من يقيّم! ⭐
        </p>
      )}
    </div>
  )
}


function ThankyouModal({ orderId, storeName, onClose }) {
  return (
    <div className="moverlay">
      <div className="msheet center">
        <div className="mbody" style={{textAlign:'center',padding:'32px 24px'}}>
          <div style={{fontSize:64,marginBottom:16}}>🎉</div>
          <h2 style={{fontSize:22,fontWeight:900,marginBottom:8}}>تمت الطلبية بنجاح!</h2>
          <p style={{color:'#7A6A5A',marginBottom:6}}>تم تأكيد طلبك وبدأ التجهيز</p>
          <p style={{color:'#FF6B35',fontWeight:800,fontSize:18,marginBottom:6}}>رقم الطلب: {orderId}</p>
          <p style={{fontSize:13,color:'#64748b',marginBottom:24}}>ستصلك رسالة واتساب بتفاصيل التوصيل</p>
          <button className="abtn" onClick={onClose}><i className="fas fa-home"></i> العودة للمتجر</button>
        </div>
      </div>
    </div>
  )
}

function TrackingModal({ onClose, currency }) {
  const [num,setNum]=useState('')
  const [phone,setPhone]=useState('')
  const [res,setRes]=useState(null)
  const [orders,setOrders]=useState([])
  const [loading,setLoading]=useState(false)
  const steps=['pending','processing','shipped','delivered']
  const labels={pending:'تم استلام الطلب',processing:'قيد التجهيز',shipped:'في الطريق',delivered:'تم التسليم'}
  
  const track=async()=>{
    if(!num.trim()&&!phone.trim()) return
    setLoading(true); setRes(null); setOrders([])
    try {
      if(num.trim()){
        const {data}=await supabase.from('orders').select('*').eq('id',num.trim()).maybeSingle()
        setRes(data||false)
      } else {
        const {data}=await supabase.from('orders').select('*').eq('phone',phone.trim()).order('id',{ascending:false}).limit(10)
        setOrders(data||[])
        if(!data||data.length===0) setRes(false)
      }
    } catch { setRes(false) }
    setLoading(false)
  }

  const statusColors={pending:'#f59e0b',processing:'#3b82f6',shipped:'#7c3aed',delivered:'#10b981',cancelled:'#ef4444'}
  const statusLabels={pending:'⏳ انتظار',processing:'🔄 تجهيز',shipped:'🚚 شحن',delivered:'✅ تسليم',cancelled:'❌ ملغي'}

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📍 تتبع الطلب</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
            <input className="fi" value={num} onChange={e=>setNum(e.target.value)}
              placeholder="🔢 رقم الطلب" style={{marginBottom:0}}
              onKeyDown={e=>e.key==='Enter'&&track()}/>
            <div style={{textAlign:'center',fontSize:12,color:'#94a3b8'}}>أو</div>
            <input className="fi" value={phone} onChange={e=>setPhone(e.target.value)}
              placeholder="📱 رقم هاتفك" type="tel" style={{marginBottom:0}}
              onKeyDown={e=>e.key==='Enter'&&track()}/>
          </div>
          <button className="abtn" onClick={track} disabled={loading}>
            {loading?'⏳ جاري البحث...':'🔍 تتبع طلبي'}
          </button>
          {res===false&&orders.length===0&&!loading&&(num||phone)&&(
            <div style={{textAlign:'center',padding:'20px 0',color:'#ef4444'}}>
              <div style={{fontSize:32,marginBottom:8}}>❌</div>
              <p style={{fontWeight:700}}>لا توجد طلبيات بهذه البيانات</p>
            </div>
          )}
          {/* عرض طلب واحد */}
          {res&&res.id&&(
            <div style={{marginTop:16,background:'#FFF7ED',borderRadius:14,padding:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <span style={{fontWeight:900,fontSize:15}}>طلب #{String(res.id).slice(-6)}</span>
                <span style={{background:statusColors[res.status]||'#94a3b8',color:'white',
                  borderRadius:20,padding:'3px 10px',fontSize:12,fontWeight:700}}>
                  {statusLabels[res.status]||res.status}
                </span>
              </div>
              <div style={{color:'#7A6A5A',fontSize:13}}>{res.customer_name} — {res.phone}</div>
              <div style={{color:'#FF6B35',fontWeight:900,fontSize:18,margin:'6px 0'}}>{Number(res.total).toFixed(0)} {currency}</div>
              {steps.map((s,i)=>{
                const cur=steps.indexOf(res.status)
                return (
                  <div key={s} className="trstep">
                    <div className={`trdot ${i<=cur?'done':'wait'}`}>{i<=cur?'✓':i+1}</div>
                    <div style={{fontWeight:700,fontSize:13,color:i<=cur?'#FF6B35':'#94a3b8'}}>{labels[s]}</div>
                  </div>
                )
              })}
            </div>
          )}
          {/* عرض طلبيات متعددة */}
          {orders.length>0&&(
            <div style={{marginTop:16}}>
              <div style={{fontWeight:800,marginBottom:10,fontSize:14}}>طلبياتك ({orders.length})</div>
              {orders.map(o=>(
                <div key={o.id} style={{background:'#F7F3EF',borderRadius:12,padding:12,marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontWeight:700}}>#{String(o.id).slice(-6)}</span>
                    <span style={{background:statusColors[o.status]||'#94a3b8',color:'white',
                      borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700}}>
                      {statusLabels[o.status]||o.status}
                    </span>
                  </div>
                  <div style={{fontSize:13,color:'#7A6A5A'}}>{new Date(o.created_at).toLocaleDateString('ar-DZ')}</div>
                  <div style={{fontWeight:700,color:'#FF6B35',marginTop:4}}>{Number(o.total).toFixed(0)} {currency}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactModal({ settings, onClose }) {
  const WA = settings['contact_whatsapp']||settings['whatsapp_number']||settings['admin_phone']||WA_NUM
  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📞 اتصل بنا</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:40}}>🛍️</div>
            <div style={{fontWeight:900,fontSize:18,marginTop:8}}>{settings['store_name']||'نقاء'}</div>
          </div>
          {settings['contact_phone']&&<a href={`tel:${settings['contact_phone']}`}
            style={{display:'flex',alignItems:'center',gap:12,background:'#FFF0EB',borderRadius:14,padding:14,marginBottom:10,textDecoration:'none'}}>
            <span style={{fontSize:28}}>📱</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>الهاتف</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_phone']}</div></div>
          </a>}
          {WA&&<a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer"
            style={{display:'flex',alignItems:'center',gap:12,background:'#f0fdf4',borderRadius:14,padding:14,marginBottom:10,textDecoration:'none'}}>
            <span style={{fontSize:28}}>💬</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>واتساب</div><div style={{fontSize:13,color:'#7A6A5A'}}>{WA}</div></div>
          </a>}
          {settings['contact_address']&&<div style={{display:'flex',alignItems:'center',gap:12,background:'#f1f5f9',borderRadius:14,padding:14,marginBottom:10}}>
            <span style={{fontSize:28}}>📍</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>العنوان</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_address']}</div></div>
          </div>}
          {settings['contact_hours']&&<div style={{display:'flex',alignItems:'center',gap:12,background:'#fef9c3',borderRadius:14,padding:14}}>
            <span style={{fontSize:28}}>🕒</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>ساعات العمل</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_hours']}</div></div>
          </div>}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════
   MAIN STORE
═══════════════════════════════ */
/* Promo Countdown */
function PromoCountdown({ endDate }) {
  const [t, setT] = useState({h:'00',m:'00',s:'00'})
  useEffect(()=>{
    const tick=()=>{
      const diff=Math.max(0,new Date(endDate)-Date.now())
      setT({
        h:String(Math.floor(diff/3600000)).padStart(2,'0'),
        m:String(Math.floor(diff%3600000/60000)).padStart(2,'0'),
        s:String(Math.floor(diff%60000/1000)).padStart(2,'0')
      })
    }
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id)
  },[endDate])
  return (
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      <span style={{fontSize:11,color:'#94a3b8',fontWeight:700}}>⏳</span>
      {[t.h,t.m,t.s].map((v,i)=>(
        <span key={i} style={{display:'flex',alignItems:'center',gap:2}}>
          <span style={{background:'#1A0A00',color:'white',padding:'3px 6px',borderRadius:6,fontSize:13,fontWeight:900,fontFamily:'monospace'}}>{v}</span>
          {i<2&&<span style={{color:'#94a3b8',fontWeight:900}}>:</span>}
        </span>
      ))}
    </div>
  )
}

export default function Store() {
  const [customer,    setCustomer]    = useState(()=>{ try{return JSON.parse(localStorage.getItem('nq_customer')||'null')}catch{return null} })
  const [cart,        setCart]        = useState(()=>{ try{return JSON.parse(localStorage.getItem('nq_cart')||'[]')}catch{return []} })
  const [wishlist,    setWishlist]    = useState(()=>{ try{return JSON.parse(localStorage.getItem('nq_wish')||'[]')}catch{return []} })
  const [wishSynced,  setWishSynced]  = useState(false)
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [products,    setProducts]    = useState([])
  const [brands,      setBrands]      = useState([])
  const [categories,  setCategories]  = useState([])
  const [settings,    setSettings]    = useState({})
  const [promos,      setPromos]      = useState([])
  const [banners,     setBanners]     = useState([])
  const [loading,     setLoading]     = useState(true)

  const [modal,       setModal]       = useState(null)
  const [detailProd,  setDetailProd]  = useState(null)
  const [thankId,     setThankId]     = useState(null)
  const [checkoutTotal, setCheckoutTotal] = useState(0)
  const [tab,         setTab]         = useState('home')
  const [search,      setSearch]      = useState('')
  const [brandSel,    setBrandSel]    = useState('all')
  const [catSel,      setCatSel]      = useState('all')
  const [sortSel,     setSortSel]     = useState('newest')
  const [page,        setPage]        = useState(1)
  const [priceMin,    setPriceMin]    = useState(0)
  const [priceMax,    setPriceMax]    = useState(999999)
  const [showScr,     setShowScr]     = useState(false)
  const [bannerIdx,   setBannerIdx]   = useState(0)

  const flashEndRef = useRef(Date.now() + 24*3600*1000)
  const timer = useTimer(flashEndRef.current)

  const SNAME    = settings['store_name']      || 'نقاء'
  const CUR      = settings['store_currency']  || 'دج'
  const WA       = settings['contact_whatsapp']||settings['whatsapp_number']||settings['admin_phone']||WA_NUM
  const FREESHIP = parseFloat(settings['free_shipping_threshold'] || '5000')
  const ANNOUNCE = settings['announce_bar']    || ''
  const PROMO_TEXT= settings['promo_text']     || ''

  const cartTotal  = cart.reduce((s,i)=>s+(Number(i.price)||0)*(Number(i.qty)||1),0)
  const cartCount  = cart.reduce((s,i)=>s+i.qty,0)
  const sevenAgo   = new Date(); sevenAgo.setDate(sevenAgo.getDate()-7)
  const [bestSellers,  setBestSellers]  = useState([])


  /* load */
  useEffect(()=>{
    const load=async()=>{
      // جلب البيانات مع معالجة الأخطاء
      const results = await Promise.allSettled([
        supabase.from('products').select('*').or('disabled.eq.false,disabled.is.null').order('created_at',{ascending:false}),
        supabase.from('brands').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('settings').select('*'),
        supabase.from('promotions').select('*').eq('active',true),
      ])
      const [rP,rB,rC,rS,rPr] = results
      const p = rP.status==='fulfilled' ? rP.value.data : []
      const b = rB.status==='fulfilled' ? rB.value.data : []
      const c = rC.status==='fulfilled' ? rC.value.data : []
      const s = rS.status==='fulfilled' ? rS.value.data : []
      const pr= rPr.status==='fulfilled' ? rPr.value.data : []
      setProducts(p||[]); setBrands(b||[]); setCategories(c||[])
      const map={}; (s||[]).forEach(r=>(map[r.key]=r.value)); setSettings(map)
      try{setBanners(JSON.parse(map['store_banners']||'[]'))}catch{}
      setPromos((pr||[]).filter(px=>!px.end_date||new Date(px.end_date)>new Date()))
      setLoading(false)
      // حساب الأكثر مبيعاً
      try {
        const {data:ords} = await supabase.from('orders').select('items').limit(200)
        const counts={}
        ;(ords||[]).forEach(o=>{
          try {
            const its=typeof o.items==='string'?JSON.parse(o.items||'[]'):(o.items||[])
            its.forEach(i=>{if(i&&i.id) counts[String(i.id)]=(counts[String(i.id)]||0)+(i.qty||1)})
          } catch {}
        })
        const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id])=>id)
        setBestSellers(sorted)
      } catch {}
    }
    load()
  },[])

  /* CSS */
  useEffect(()=>{
    if(!document.getElementById('nq-css')){
      const s=document.createElement('style');s.id='nq-css';s.textContent=CSS;document.head.appendChild(s)
    }
    if(localStorage.getItem('nqDark')==='1') document.body.classList.add('dark')
    const fn=()=>setShowScr(window.scrollY>300)
    window.addEventListener('scroll',fn); return()=>window.removeEventListener('scroll',fn)
  },[])

  /* banner */
  useEffect(()=>{
    if(banners.length<2) return
    const t=setInterval(()=>setBannerIdx(i=>(i+1)%banners.length),3800)
    return()=>clearInterval(t)
  },[banners.length])

  /* persist */
  useEffect(()=>{ localStorage.setItem('nq_cart',JSON.stringify(cart)) },[cart])
  useEffect(()=>{ localStorage.setItem('nq_wish',JSON.stringify(wishlist)) },[wishlist])

  // مزامنة المفضلة مع Supabase عند تسجيل الدخول
  useEffect(()=>{
    if(!customer||wishSynced) return
    const syncWish = async()=>{
      // جلب المفضلة من Supabase
      const {data} = await supabase.from('wishlist').select('product_id').eq('customer_id',customer.id).catch(()=>({data:[]}))
      if(data&&data.length>0){
        const dbIds = data.map(r=>r.product_id)
        // دمج localStorage مع Supabase
        const merged = [...new Set([...wishlist,...dbIds])]
        setWishlist(merged)
      } else if(wishlist.length>0){
        // رفع localStorage إلى Supabase
        await Promise.all(wishlist.map(pid=>
          supabase.from('wishlist').upsert({id:Date.now()+Math.random()*1000|0,customer_id:customer.id,product_id:pid}).catch(()=>{})
        ))
      }
      setWishSynced(true)
    }
    syncWish()
  },[customer])

  const addToCart=useCallback((p,qty=1)=>{
    if(!p||(p.stock||0)===0){showToast('المنتج غير متوفر',true);return}
    setCart(prev=>{
      const existing=prev.find(i=>i.id===p.id)
      if(existing){
        showToast('✅ تمت زيادة الكمية')
        return prev.map(i=>i.id===p.id?{...i,qty:i.qty+qty}:i)
      }
      showToast('✅ تمت الإضافة للسلة')
      return [...prev,{id:p.id,name:p.name,price:Number(p.price),qty,image:p.image,unitsPerCarton:p.units||12}]
    })
  },[showToast])

  const toggleWish=useCallback(id=>{
    setWishlist(prev=>{
      const removing = prev.includes(id)
      if(removing){
        showToast('تم الإزالة من المفضلة')
        // حذف من Supabase
        if(customer) supabase.from('wishlist').delete().eq('customer_id',customer.id).eq('product_id',id).catch(()=>{})
        return prev.filter(x=>x!==id)
      }
      showToast('❤️ تمت الإضافة للمفضلة')
      // إضافة لـ Supabase
      if(customer) supabase.from('wishlist').upsert({id:Date.now(),customer_id:customer.id,product_id:id}).catch(()=>{})
      return [...prev,id]
    })
  },[customer])

  const handleLogin=data=>{
    setCustomer(data);localStorage.setItem('nq_customer',JSON.stringify(data));setModal(null)
    showToast(`مرحباً ${data.name} 👋`)
  }

  /* products */
  const allP    = products.filter(p=>p.disabled!==true)  // null أو false = مُفعَّل
  const promoP = allP.filter(p=>{
    if(p.is_promo) return true
    if(!promos||promos.length===0) return false
    return promos.some(pr=>{
      try {
        if(!pr.active) return false
        const ids=typeof pr.product_ids==='string'?JSON.parse(pr.product_ids||'[]'):(pr.product_ids||[])
        return ids.length===0||ids.includes(p.id)||ids.includes(String(p.id))
      } catch { return false }
    })
  })
  const newP    = allP.filter(p=>new Date(p.created_at)>=sevenAgo)
  const flashP  = allP.filter(p=>Number(p.discount)>0).slice(0,10)
  const dayDeal = allP.find(p=>Number(p.discount)>=20)||null

  const filtered=(()=>{
    let f=[...allP]
    if(search) f=f.filter(p=>(p.name||'').toLowerCase().includes(search.toLowerCase()))
    if(brandSel!=='all') f=f.filter(p=>p.brand_id==brandSel)
    if(catSel!=='all') f=f.filter(p=>p.category_id==catSel)
    if(priceMin>0||priceMax<999999) f=f.filter(p=>Number(p.price)>=priceMin&&Number(p.price)<=priceMax)
    if(sortSel==='newest') f=[...f].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    else if(sortSel==='price_asc') f=[...f].sort((a,b)=>a.price-b.price)
    else if(sortSel==='price_desc') f=[...f].sort((a,b)=>b.price-a.price)
    else if(sortSel==='disc') f=[...f].sort((a,b)=>(Number(b.discount)||0)-(Number(a.discount)||0))
    return f
  })()
  const PER=12; const PAGES=Math.ceil(filtered.length/PER)
  const paged=filtered.slice((page-1)*PER,page*PER)

  /* PC — بطاقة المنتج مع شارة عرض خاص كالصورة */
  const PC = ({ p }) => {
    if(!p) return null
    const isW=(wishlist||[]).includes(p.id)
    const isN=new Date(p.created_at)>=sevenAgo
    const disc=Number(p.discount)||0
    // حساب سعر العرض من promos
    const activePromo=promos.find(pr=>{
      if(!pr.active) return false
      if(pr.end_date&&new Date(pr.end_date)<new Date()) return false
      const ids=typeof pr.product_ids==='string'?JSON.parse(pr.product_ids||'[]'):(pr.product_ids||[])
      return ids.length===0||ids.includes(p.id)||ids.includes(String(p.id))
    })
    const hasPromo=!!activePromo
    let promoDisc=disc, promoPrice=disc>0?p.price*(1-disc/100):p.price
    if(activePromo){
      if(activePromo.type==='percent'){promoDisc=parseFloat(activePromo.discount_value)||0;promoPrice=p.price*(1-promoDisc/100)}
      else if(activePromo.type==='fixed'){promoPrice=p.price-(parseFloat(activePromo.discount_value)||0);promoDisc=Math.round((p.price-promoPrice)/p.price*100)}
    }
    const hasDisc=hasPromo||disc>0
    const fp=promoPrice.toFixed(0)
    const pct=promoDisc
    return (
      <div className="pc" onClick={()=>{setDetailProd(p);setModal('detail')}}>
        <div className="pc-img" style={{opacity:(p.stock||0)===0?0.45:1,filter:(p.stock||0)===0?'grayscale(60%)':'none',transition:'opacity .3s'}}>
          {/* شارة عرض خاص — علوي أيمن كما في الصورة */}
          {hasPromo&&<div className="pc-promo-badge"><i className="fas fa-bullhorn" style={{fontSize:9}}/> عرض خاص</div>}
          {(p.stock||0)===0&&<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(0,0,0,.55)',color:'white',borderRadius:20,padding:'4px 12px',fontSize:11,fontWeight:800,zIndex:2,whiteSpace:'nowrap'}}>نفذ المخزون</div>}
          {p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<div className="pc-noimg">🛍️</div>}
          {isN&&!hasPromo&&(p.stock||0)>0&&<span className="badge b-new">جديد</span>}
          <button className="fav-b" onClick={e=>{e.stopPropagation();toggleWish(p.id)}}>
            <i className="fas fa-heart" style={{color:isW?'#FF6B35':'#CBD5E1'}}></i>
          </button>
        </div>
        <div className="pc-name">{p.name}</div>
        {/* السعر مشطوب + نسبة + السعر الجديد — كالصورة */}
        {hasDisc
          ? <div>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2,flexWrap:'wrap'}}>
                <span style={{background:'#888',color:'white',fontSize:11,fontWeight:900,padding:'2px 7px',borderRadius:20}}>{pct}%</span>
                <span style={{fontSize:12,color:'#94a3b8',textDecoration:'line-through',fontWeight:600}}>{p.price}{CUR}</span>
              </div>
              <div style={{fontSize:16,fontWeight:900,color:'#1A0A00'}}>{fp}{CUR}</div>
            </div>
          : <div style={{fontSize:16,fontWeight:900,color:'#FF6B35'}}>{fp} {CUR}</div>}
        {p.units&&<div className="pc-carton">📦 {p.units} قطعة/كرتون</div>}
        {(p.stock||0)<10&&(p.stock||0)>0&&<div className="pc-stock">⚠️ {p.stock} كرتون فقط</div>}
        {(p.stock||0)===0&&<div className="pc-stock">❌ نفذ</div>}
        <div style={{display:'flex',gap:5,marginTop:'auto',paddingTop:6}}>
          <button className="add-b" style={{flex:1}} disabled={(p.stock||0)===0}
            onClick={e=>{e.stopPropagation();addToCart(p)}}>
            <i className="fas fa-cart-plus"></i>
            {(p.stock||0)===0?'نفذ':'أضف'}
          </button>
          <button onClick={e=>{e.stopPropagation();
            const msg=`🛍️ ${p.name}%0A💰 السعر: ${p.price} ${CUR}%0A🔗 ${window.location.origin}`
            window.open(`https://wa.me/?text=${msg}`,'_blank')}}
            style={{width:32,height:32,borderRadius:8,background:'#25D36610',color:'#25D366',
              border:'1px solid #25D36630',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className="fab fa-whatsapp" style={{fontSize:14}}></i>
          </button>
        </div>
      </div>
    )
  }

  /* ACTIVE PROMO BANNER */
  const activePromoBanner = promos.find(p=>p.image&&(p.type==='percent'||p.type==='buy_x_get_y'))
  const flashPromo = promos.find(p=>p.end_date)

  /* ── HOME ── */
  const Home = () => {
    try { return (
    <>
      {/* ANNOUNCE */}
      {ANNOUNCE&&<div className="announce">{ANNOUNCE}</div>}

      {/* BANNER */}
      <div className="banner-wrap">
        <div className="banner-track" style={{transform:`translateX(${bannerIdx*100}%)`}}>
          {banners.length>0
            ? banners.map((b,i)=>(b.image?<img key={i} src={b.image} className="banner-slide" alt=""/>:
                <div key={i} className="banner-fall"><span style={{fontSize:36}}>🛍️</span><span style={{color:'white',fontWeight:900,fontSize:22}}>{b.title||SNAME}</span>{b.subtitle&&<span style={{color:'rgba(255,255,255,.8)',fontSize:14}}>{b.subtitle}</span>}</div>))
            : <div className="banner-fall"><span style={{fontSize:40}}>🛍️</span><span style={{color:'white',fontWeight:900,fontSize:24}}>{SNAME}</span><span style={{color:'rgba(255,255,255,.8)',fontSize:14}}>أفضل المنتجات بأفضل الأسعار</span></div>}
        </div>
        {banners.length>1&&<div className="bdots">{banners.map((_,i)=><button key={i} className={`bdot${bannerIdx===i?' on':''}`} onClick={()=>setBannerIdx(i)}/>)}</div>}
      </div>

      {/* PROMO TEXT */}
      {PROMO_TEXT&&<div style={{background:'linear-gradient(135deg,#FFF0EB,#FFE4D6)',margin:'10px 14px 0',borderRadius:14,padding:'10px 16px',textAlign:'center',fontSize:13,fontWeight:800,color:'#FF6B35',border:'1px solid #FFD5C0'}}>{PROMO_TEXT}</div>}

      {/* FLASH BAR from DB promos */}
      {flashPromo&&(
        <div className="flash-bar" onClick={()=>setTab('search')}>
          <div>
            <div style={{color:'white',fontWeight:900,fontSize:16}}>⚡ {flashPromo.name}</div>
            <div style={{color:'rgba(255,255,255,.8)',fontSize:12}}>{flashPromo.description||'عرض لفترة محدودة'}</div>
          </div>
          <div className="timer-wrap">
            <div className="tbox">{timer.h}</div>
            <span style={{color:'white',fontWeight:900}}>:</span>
            <div className="tbox">{timer.m}</div>
            <span style={{color:'white',fontWeight:900}}>:</span>
            <div className="tbox">{timer.s}</div>
          </div>
        </div>
      )}

      {/* ANIMATED BRANDS GRID */}
      {brands.length>0&&(
        <div className="sec">
          <div className="sec-head">
            <span className="sec-title">⭐ أفضل الماركات</span>
            <button className="sec-more" onClick={()=>setDrawerOpen(true)}>عرض الكل</button>
          </div>
          <div className="anim-grid">
            <div className="anim-all" onClick={()=>{setBrandSel('all');setTab('search')}}>
              <i className="fas fa-th"></i><span>عرض الكل</span>
            </div>
            {brands.slice(0,5).map(b=>(
              <div key={b.id} className={`anim-card${brandSel==b.id?' sel':''}`}
                onClick={()=>{setBrandSel(b.id);setTab('search')}}>
                {b.image?<><img src={b.image} alt={b.name}/><div className="overlay"><span>{b.name}</span></div></>:
                  <div className="no-img">{b.name}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANIMATED CATEGORIES */}
      {categories.length>0&&(
        <div className="sec">
          <div className="sec-head">
            <span className="sec-title">📂 الفئات</span>
            <button className="sec-more" onClick={()=>setTab('cats')}>عرض الكل</button>
          </div>
          <div className="cats-scroll">
            {categories.map(c=>(
              <div key={c.id} className={`cat-item${catSel==c.id?' sel':''}`}
                onClick={()=>{setCatSel(c.id);setTab('search')}}>
                <div className="cat-img">
                  {c.image?<img src={c.image} alt={c.name}/>:<span>📁</span>}
                </div>
                <div className="cat-label">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROMO BOXES */}
      <div className="promo-strip">
        <div className="promo-box" style={{background:'linear-gradient(135deg,#10b981,#059669)'}}
          onClick={()=>{setSortSel('newest');setTab('search')}}>
          <div style={{fontSize:24}}>🎁</div>
          <div style={{color:'white',fontWeight:800,fontSize:13,marginTop:4}}>
            {promos.find(p=>p.type==='buy_x_get_y')?promos.find(p=>p.type==='buy_x_get_y').name:'اشتري 3 خذ 4'}
          </div>
          <div style={{color:'rgba(255,255,255,.8)',fontSize:11}}>أرخص منتج مجاناً</div>
        </div>
        <div className="promo-box" style={{background:'linear-gradient(135deg,#3b82f6,#1d4ed8)'}}
          onClick={()=>{setSortSel('price_asc');setTab('search')}}>
          <div style={{fontSize:24}}>📦</div>
          <div style={{color:'white',fontWeight:800,fontSize:13,marginTop:4}}>خصم الكميات</div>
          <div style={{color:'rgba(255,255,255,.8)',fontSize:11}}>500دج→5% | 1000دج→10%</div>
        </div>
      </div>

      {/* DAY DEAL */}
      {dayDeal&&(
        <div className="day-deal">
          <div style={{background:'linear-gradient(135deg,#FF6B35,#E8430E)',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{color:'white',fontWeight:900,fontSize:15}}>🌟 عرض اليوم</span>
            <span style={{color:'white',fontSize:13}}>خصم {dayDeal.discount}%</span>
          </div>
          <div style={{display:'flex',gap:16,padding:16,cursor:'pointer'}} onClick={()=>{setDetailProd(dayDeal);setModal('detail')}}>
            {dayDeal.image?<img src={dayDeal.image} style={{width:90,height:90,borderRadius:12,objectFit:'cover'}}/>:
              <div style={{width:90,height:90,borderRadius:12,background:'#F8F4F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36}}>🛍️</div>}
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{dayDeal.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,color:'#94a3b8',textDecoration:'line-through'}}>{dayDeal.price} {CUR}</span>
                <span style={{fontSize:20,fontWeight:900,color:'#FF6B35'}}>{(dayDeal.price*(1-dayDeal.discount/100)).toFixed(0)} {CUR}</span>
              </div>
              <button className="add-b" style={{marginTop:8}} onClick={e=>{e.stopPropagation();addToCart(dayDeal)}}>أضف للسلة</button>
            </div>
          </div>
        </div>
      )}

      {/* FLASH PRODUCTS */}
      {flashP.length>0&&(
        <div className="sec">
          <div className="sec-head"><span className="sec-title">⚡ عروض خاصة</span><button className="sec-more" onClick={()=>setTab('search')}>عرض الكل</button></div>
          <div className="hscroll">{flashP.map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {/* NEW */}
      {newP.length>0&&(
        <div className="sec">
          <div className="sec-head"><span className="sec-title">🎁 وصل حديثاً</span></div>
          <div className="hscroll">{newP.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {/* الأكثر مبيعاً */}
      {bestSellers.length>0&&(()=>{
        const bsp=bestSellers.map(id=>allP.find(p=>String(p.id)===id)).filter(Boolean).slice(0,12)
        return bsp.length>0?(
          <div className="sec">
            <div className="sec-head"><span className="sec-title">🔥 الأكثر مبيعاً</span>
              <button className="sec-more" onClick={()=>setTab('search')}>عرض الكل</button></div>
            <div className="hscroll">{bsp.map(p=><PC key={p.id} p={p}/>)}</div>
          </div>
        ):null
      })()}

      {/* ALL */}
      {allP.length>0&&(
        <div className="sec">
          <div className="sec-head"><span className="sec-title">📦 جميع المنتجات</span><button className="sec-more" onClick={()=>setTab('search')}>عرض الكل</button></div>
          <div className="hscroll">{allP.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {cartCount>0&&(
        <div className="cart-bar" onClick={()=>setModal('cart')}>
          <span style={{color:'white',fontWeight:700,fontSize:14}}>🛒 {cartCount} كرتون في السلة</span>
          <span style={{color:'white',fontWeight:900,fontSize:16}}>{cartTotal.toFixed(0)} {CUR}</span>
        </div>
      )}

      <div style={{textAlign:'center',color:'#94a3b8',fontSize:13,padding:'32px 0 8px',borderTop:'1px solid #e2e8f0',margin:'20px 14px 0'}}>
        © 2025 {SNAME} — جميع الحقوق محفوظة
      </div>
    </>
  )
    } catch(e){ return <div style={{padding:40,textAlign:'center',color:'#94a3b8'}}>⚠️ خطأ في تحميل الصفحة الرئيسية</div> }

  /* SEARCH TAB */
  const SearchTab = () => {
    const allPricesArr = allP.map(p=>Number(p.price)||0)
    const absoluteMax = Math.max(...allPricesArr, 1000)
    return (
    <div className="sec" style={{marginTop:14}}>
      <div className="chips" style={{marginBottom:10}}>
        <button className={`chip${catSel==='all'?' sel':''}`} onClick={()=>{setCatSel('all');setPage(1)}}>الكل</button>
        {categories.map(c=>(
          <button key={c.id} className={`chip${catSel==c.id?' sel':''}`} onClick={()=>{setCatSel(c.id);setPage(1)}}>{c.name}</button>
        ))}
      </div>
      <div className="chips" style={{marginBottom:12}}>
        {[['newest','الأحدث'],['price_asc','السعر ↑'],['price_desc','السعر ↓'],['disc','الخصومات أولاً']].map(([v,l])=>(
          <button key={v} className={`chip${sortSel===v?' sel':''}`} onClick={()=>{setSortSel(v);setPage(1)}}>{l}</button>
        ))}
      </div>
      {/* فلتر السعر */}
      <div style={{background:'white',borderRadius:14,padding:'12px 14px',marginBottom:12,
        boxShadow:'0 1px 6px rgba(0,0,0,.06)',border:'1.5px solid #F1ECE8'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,fontWeight:700}}>
          <span style={{color:'#1A0A00'}}>🎚️ فلتر السعر</span>
          <span style={{color:'#FF6B35',fontWeight:800}}>{priceMin.toLocaleString()} — {priceMax>=999999?'∞':priceMax.toLocaleString()} {CUR}</span>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:4}}>
          <span style={{fontSize:11,color:'#94a3b8',flexShrink:0}}>من</span>
          <input type="range" min={0} max={absoluteMax} step={50} value={Math.min(priceMin,absoluteMax)}
            onChange={e=>setPriceMin(Math.min(Number(e.target.value),priceMax-50))}
            style={{flex:1,accentColor:'#FF6B35',cursor:'pointer'}}/>
          <span style={{fontSize:11,color:'#94a3b8',flexShrink:0}}>إلى</span>
          <input type="range" min={0} max={absoluteMax} step={50} value={Math.min(priceMax,absoluteMax)}
            onChange={e=>setPriceMax(Math.max(Number(e.target.value),priceMin+50))}
            style={{flex:1,accentColor:'#FF6B35',cursor:'pointer'}}/>
        </div>
        {(priceMin>0||priceMax<999999)&&(
          <button onClick={()=>{setPriceMin(0);setPriceMax(999999)}}
            style={{fontSize:11,color:'#FF6B35',background:'none',border:'none',cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>
            ✕ إلغاء فلتر السعر
          </button>
        )}
      </div>
      {paged.length===0
        ?<div className="empty"><i className="fas fa-search"></i><p>لا توجد منتجات</p></div>
        :<div className="prod-grid">{paged.map(p=><PC key={p.id} p={p}/>)}</div>}
      {PAGES>1&&(
        <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:18,flexWrap:'wrap'}}>
          {page>1&&<button className="chip" onClick={()=>setPage(p=>p-1)}>‹ السابق</button>}
          {Array.from({length:Math.min(PAGES,5)},(_,i)=>i+1).map(n=>(
            <button key={n} className={`chip${page===n?' sel':''}`} onClick={()=>setPage(n)}>{n}</button>
          ))}
          {page<PAGES&&<button className="chip" onClick={()=>setPage(p=>p+1)}>التالي ›</button>}
        </div>
      )}
    </div>
  )}

  /* CATS TAB */
  const CatsTab = () => {
    try { return (
    <div className="sec" style={{marginTop:14}}>
      <div className="sec-head" style={{paddingTop:0}}><span className="sec-title">🏷️ الماركات</span></div>
      <div className="anim-grid">
        <div className="anim-all" onClick={()=>{setBrandSel('all');setCatSel('all');setTab('search')}}>
          <i className="fas fa-th"></i><span>كل المنتجات</span>
        </div>
        {brands.map(b=>(
          <div key={b.id} className="anim-card" onClick={()=>{setBrandSel(b.id);setTab('search')}}>
            {b.image?<><img src={b.image} alt={b.name}/><div className="overlay"><span>{b.name}</span></div></>:
              <div className="no-img">{b.name}</div>}
          </div>
        ))}
      </div>
      {categories.length>0&&(
        <div style={{marginTop:20}}>
          <div className="sec-head" style={{paddingTop:0}}><span className="sec-title">📂 الفئات</span></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            {categories.map(c=>(
              <div key={c.id} onClick={()=>{setCatSel(c.id);setTab('search')}}
                style={{background:'white',borderRadius:16,padding:14,display:'flex',alignItems:'center',gap:12,cursor:'pointer',boxShadow:'0 2px 10px rgba(0,0,0,.07)',transition:'.2s',overflow:'hidden'}}>
                {c.image?<img src={c.image} style={{width:50,height:38,borderRadius:10,objectFit:'cover',flexShrink:0}}/>:
                  <div style={{width:50,height:38,borderRadius:10,background:'#FFF0EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>📦</div>}
                <span style={{fontWeight:700,fontSize:14,color:'#1A0A00'}}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )} catch(e){ return <div style={{padding:40,textAlign:'center',color:'#94a3b8'}}>⚠️ خطأ في تحميل الفئات</div> }
  }

  /* WISH TAB */
  const WishTab = () => {
    const wp=(products||[]).filter(p=>(wishlist||[]).includes(p.id))
    return (
      <div className="sec" style={{marginTop:14}}>
        {wp.length===0?<div className="empty"><i className="fas fa-heart"></i><p>قائمة المفضلة فارغة — أضف منتجات من ❤️</p></div>:
          <div className="prod-grid">{wp.map(p=><PC key={p.id} p={p}/>)}</div>}
      </div>
    )
  }

  /* PROMOS TAB — عصري */
  const PromosTab = () => {
    try {
    const active = (promos||[]).filter(p=>p&&p.active)
    const typeLabel={percent:'خصم نسبة %',fixed:'خصم مبلغ ثابت',buy_x_get_y:'اشتري X خذ Y',tier_buy:'خصم كمية الشركة'}
    const typeColor={percent:'#FF6B35',fixed:'#7c3aed',buy_x_get_y:'#10b981',tier_buy:'#3b82f6'}
    return (
      <div style={{paddingBottom:80}}>
        {/* Hero */}
        <div style={{background:'linear-gradient(135deg,#FF6B35,#7C3AED)',padding:'22px 18px 20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-40%',right:'-15%',width:180,height:180,background:'rgba(255,255,255,.07)',borderRadius:'50%'}}/>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{fontSize:12,color:'rgba(255,255,255,.75)',fontWeight:700,marginBottom:3}}>العروض الحصرية</div>
            <h2 style={{color:'white',fontWeight:900,fontSize:22,marginBottom:4}}>🎯 {active.length} عرض نشط</h2>
            <p style={{color:'rgba(255,255,255,.8)',fontSize:13}}>وفّر أكثر مع عروضنا المتجددة</p>
          </div>
        </div>
        {active.length===0&&<div className="empty" style={{marginTop:40}}><i className="fas fa-tag"/><p>لا توجد عروض حالياً</p></div>}
        {active.map(promo=>{
          const pids=(() => {
            try { return typeof promo.product_ids==='string'?JSON.parse(promo.product_ids||'[]'):(promo.product_ids||[]) }
            catch { return [] }
          })()
          const promoProds=pids.length>0?allP.filter(p=>pids.includes(p.id)||pids.includes(String(p.id))):allP.slice(0,5)
          const col=typeColor[promo.type]||'#FF6B35'
          const isExpired=promo.end_date&&new Date(promo.end_date)<new Date()
          if(isExpired) return null
          return (
            <div key={promo.id} style={{background:'white',borderRadius:20,margin:'12px 14px',
              boxShadow:'0 4px 20px rgba(0,0,0,.08)',overflow:'hidden',border:'1.5px solid #F1ECE8'}}>
              {promo.image&&<img src={promo.image} style={{width:'100%',height:130,objectFit:'cover'}}/>}
              <div style={{padding:'16px 16px 10px'}}>
                {/* شارة النوع */}
                <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',
                  borderRadius:30,fontSize:11,fontWeight:800,marginBottom:10,
                  background:col+'18',color:col}}>
                  {typeLabel[promo.type]||promo.type}
                </div>
                {/* قيمة الخصم بارزة */}
                {(promo.type==='percent'||promo.type==='fixed')&&(
                  <div style={{background:'linear-gradient(135deg,#FF6B35,#E8430E)',color:'white',
                    borderRadius:50,padding:'5px 14px',fontSize:17,fontWeight:900,
                    display:'inline-block',marginBottom:8,float:'left',
                    boxShadow:'0 4px 12px rgba(255,107,53,.35)'}}>
                    {promo.type==='percent'?`-${promo.discount_value}%`:`-${promo.discount_value} ${CUR}`}
                  </div>
                )}
                <div style={{fontWeight:900,fontSize:16,marginBottom:4,clear:'both'}}>{promo.name}</div>
                {promo.description&&<p style={{color:'#64748b',fontSize:13,marginBottom:10}}>{promo.description}</p>}
                {promo.type==='tier_buy'&&<p style={{color:'#3b82f6',fontSize:12,fontWeight:700,marginBottom:10}}>
                  📦 اشتري {promo.tier_qty} كرتون من نفس الشركة → خصم {promo.tier_value}{promo.tier_type==='percent'?'%':' '+CUR}
                </p>}
              </div>
              {/* صور المنتجات */}
              {promoProds.length>0&&(
                <div style={{display:'flex',gap:8,overflowX:'auto',padding:'0 14px 14px'}}>
                  {promoProds.slice(0,6).map(pp=>(
                    <div key={pp.id} style={{flexShrink:0,width:64,textAlign:'center',cursor:'pointer'}}
                      onClick={()=>{setDetailProd(pp);setModal('detail')}}>
                      {pp.image
                        ?<img src={pp.image} style={{width:60,height:60,borderRadius:12,objectFit:'cover',display:'block',margin:'0 auto 4px',border:'2px solid #F1ECE8'}}/>
                        :<div style={{width:60,height:60,borderRadius:12,background:'#F8F4F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,margin:'0 auto 4px'}}>🛍️</div>}
                      <div style={{fontSize:10,fontWeight:700,color:'#7A6A5A',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{pp.name}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* footer */}
              <div style={{padding:'10px 16px 14px',borderTop:'1px solid #F1ECE8',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                {promo.end_date
                  ?<PromoCountdown endDate={promo.end_date}/>
                  :<span style={{fontSize:12,color:'#94a3b8',fontWeight:700}}>⚡ بدون تاريخ انتهاء</span>}
                <button style={{background:'linear-gradient(135deg,#FF6B35,#E8430E)',color:'white',
                  border:'none',borderRadius:30,padding:'8px 18px',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}
                  onClick={()=>setTab('search')}>
                  تسوّق الآن
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
    } catch(e) {
      return <div style={{padding:40,textAlign:'center',color:'#94a3b8'}}><p>⚠️ حدث خطأ في تحميل العروض</p></div>
    }
  }

  const QuickOrderTab = () => {
    const [qtyMap,setQtyMap]=useState({})
    const visibleProds=allP.filter(p=>(p.stock||0)>0)
    const addAll=()=>{
      let count=0
      visibleProds.forEach(p=>{
        const qty=parseInt(qtyMap[p.id])||0
        if(qty>0){addToCart(p,qty);count++}
      })
      if(count>0)showToast(`✅ تمت إضافة ${count} منتج`)
      else showToast('أدخل الكميات أولاً',true)
    }
    return (
      <div className="sec" style={{marginTop:14,paddingBottom:80}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <h2 className="sec-title">⚡ الطلب السريع</h2>
          <button onClick={addAll}
            style={{background:'linear-gradient(135deg,#FF6B35,#E8430E)',color:'white',border:'none',
              borderRadius:30,padding:'10px 20px',fontWeight:800,fontSize:14,cursor:'pointer',fontFamily:'inherit',
              display:'flex',alignItems:'center',gap:6}}>
            <i className="fas fa-cart-plus"></i> إضافة الكل للسلة
          </button>
        </div>
        <div style={{background:'white',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.07)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#FF6B35'}}>
                <th style={{padding:'11px 12px',textAlign:'right',color:'white',fontWeight:700,fontSize:13,border:'1px solid rgba(255,255,255,.2)'}}>المنتج</th>
                <th style={{padding:'11px 12px',textAlign:'center',color:'white',fontWeight:700,fontSize:13,border:'1px solid rgba(255,255,255,.2)'}}>سعر/كرتون</th>
                <th style={{padding:'11px 12px',textAlign:'center',color:'white',fontWeight:700,fontSize:13,border:'1px solid rgba(255,255,255,.2)'}}>الكمية (كرتون)</th>
                <th style={{padding:'11px 12px',textAlign:'center',color:'white',fontWeight:700,fontSize:13,border:'1px solid rgba(255,255,255,.2)'}}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {visibleProds.map((p,i)=>{
                const qty=parseInt(qtyMap[p.id])||0
                const unitPrice=p.carton_price||p.price*(p.units||12)
                return (
                  <tr key={p.id} style={{background:i%2===0?'white':'#F8FAFC',borderBottom:'1px solid #E2E8F0'}}>
                    <td style={{padding:'10px 12px',border:'1px solid #E2E8F0'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        {p.image&&<img src={p.image} style={{width:36,height:36,borderRadius:8,objectFit:'cover',border:'1px solid #E2E8F0'}}/>}
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:'#1A0A00'}}>{p.name}</div>
                          <div style={{fontSize:11,color:'#94a3b8'}}>{p.units||12} قطعة/كرتون</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'10px 12px',textAlign:'center',fontWeight:700,color:'#FF6B35',border:'1px solid #E2E8F0'}}>{unitPrice.toFixed(0)} {CUR}</td>
                    <td style={{padding:'10px 12px',textAlign:'center',border:'1px solid #E2E8F0'}}>
                      <input type="number" min="0" value={qtyMap[p.id]||''} onChange={e=>setQtyMap(m=>({...m,[p.id]:e.target.value}))}
                        placeholder="0"
                        style={{width:70,textAlign:'center',border:'2px solid #E2E8F0',borderRadius:8,padding:'5px 8px',fontSize:14,fontWeight:700,fontFamily:'inherit',outline:'none'}}
                        onFocus={e=>e.target.style.borderColor='#FF6B35'}
                        onBlur={e=>e.target.style.borderColor='#E2E8F0'}/>
                    </td>
                    <td style={{padding:'10px 12px',textAlign:'center',fontWeight:700,color:'#1A0A00',border:'1px solid #E2E8F0'}}>
                      {qty>0?`${(qty*unitPrice).toFixed(0)} ${CUR}`:'—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#FFF7ED'}}>
                <td colSpan={3} style={{padding:'12px',fontWeight:800,color:'#1A0A00',fontSize:14,border:'1px solid #E2E8F0',textAlign:'right'}}>
                  💰 الإجمالي المحدد:
                </td>
                <td style={{padding:'12px',fontWeight:900,color:'#FF6B35',fontSize:16,border:'1px solid #E2E8F0',textAlign:'center'}}>
                  {Object.entries(qtyMap).reduce((sum,[id,qty])=>{
                    const p=allP.find(x=>String(x.id)===String(id))
                    const up=p?(p.carton_price||p.price*(p.units||12)):0
                    return sum+(parseInt(qty)||0)*up
                  },0).toFixed(0)} {CUR}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }


  // وضع الصيانة
  if (settings['maintenance_mode']==='1') return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',
      background:'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)',flexDirection:'column',
      gap:20,padding:24,textAlign:'center',direction:'rtl'}}>
      <div style={{fontSize:72,animation:'pulse 2s infinite'}}>🔧</div>
      <h1 style={{color:'white',fontSize:28,fontWeight:900}}>نقاء</h1>
      <p style={{color:'rgba(255,255,255,.8)',fontSize:16,maxWidth:340,lineHeight:1.8}}>
        {settings['maintenance_msg']||'المتجر في طور التحديث، سنعود قريباً 🔧'}
      </p>
      <a href={`https://wa.me/${settings['whatsapp_number']||settings['admin_phone']||'213696668065'}`} target="_blank"
        style={{background:'#25D366',color:'white',padding:'14px 32px',borderRadius:30,
          textDecoration:'none',fontWeight:800,fontSize:16,display:'flex',alignItems:'center',gap:8}}>
        <i className="fab fa-whatsapp"></i> تواصل معنا
      </a>
    </div>
  )

  const tabs={home:<Home/>,search:<SearchTab/>,cats:<CatsTab/>,wish:<WishTab/>,promos:<PromosTab/>,quick:<QuickOrderTab/>}

  return (
    <div dir="rtl">
      {/* HEADER */}
      <div className="sh">
        <div className="sh-top">
          <button className="sh-icon" onClick={()=>setDrawerOpen(true)}><i className="fas fa-bars"></i></button>
          <span className="sh-logo">{SNAME}</span>
          <div className="sh-right">
            <button className="sh-contact" onClick={()=>setModal('contact')}>
              <i className="fas fa-phone"></i> اتصل
            </button>
            {customer
              ?<button className="sh-login" onClick={()=>setModal('account')}>
                  <i className="fas fa-user"></i> {customer.name.split(' ')[0]}
                </button>
              :<button className="sh-login" onClick={()=>setModal('login')}>
                  <i className="fas fa-user"></i> دخول
                </button>}
          </div>
        </div>
        <div className="sh-search">
          <i className="fas fa-search" style={{color:'#aaa'}}></i>
          <input value={search}
            onChange={e=>{setSearch(e.target.value);setTab('search');setPage(1)}}
            placeholder="بحث عن المنتجات..." />
          {search&&<button onClick={()=>{setSearch('');setTab('home')}}
            style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:16}}>×</button>}
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen&&<div className="drawer-overlay" onClick={()=>setDrawerOpen(false)}/>}
      <div className={`drawer${drawerOpen?' open':''}`}>
        <div className="drawer-head">
          <div style={{fontSize:20,fontWeight:900,color:'white',marginBottom:4}}>🛍️ {SNAME}</div>
          {customer
            ?<div style={{fontSize:13,color:'rgba(255,255,255,.85)',fontWeight:700}}>مرحباً، {customer.name} 👋</div>
            :<div style={{fontSize:12,color:'rgba(255,255,255,.7)'}}>اطلب بالكارتون ووفّر أكثر</div>}
          <button onClick={()=>setDrawerOpen(false)}
            style={{position:'absolute',top:14,left:14,background:'rgba(255,255,255,.2)',border:'none',
              color:'white',width:30,height:30,borderRadius:'50%',cursor:'pointer',fontSize:15}}>✕</button>
        </div>
        <div className="drawer-nav">
          {[
            {id:'home',  e:'🏠', l:'الرئيسية'},
            {id:'search',e:'🔍', l:'جميع المنتجات'},
            {id:'cats',  e:'📂', l:'الفئات والماركات'},
            {id:'promos',e:'🎯', l:'العروض', b:promos.filter(x=>x.active).length},
            null,
            {id:'wish',  e:'❤️', l:'المفضلة', b:wishlist.length},
            {id:'cart-d',e:'🛒', l:'السلة', b:cartCount, a:()=>setModal('cart')},
            {id:'track', e:'📍', l:'تتبع الطلب', a:()=>setModal('tracking')},
            {id:'quick', e:'⚡', l:'الطلب السريع'},
            null,
            {id:'auth',  e:'👤', l:customer?customer.name:'تسجيل الدخول', a:()=>setModal(customer?'account':'login')},
            {id:'contact-d',e:'📞',l:'اتصل بنا', a:()=>setModal('contact')},
            {id:'dark',  e:'🌙', l:'الوضع الليلي', a:()=>{document.body.classList.toggle('dark');localStorage.setItem('nqDark',document.body.classList.contains('dark')?'1':'0')}},
            {id:'faq',   e:'❓', l:'الأسئلة الشائعة', a:()=>setModal('faq')},
            {id:'terms', e:'📄', l:'الشروط والأحكام', a:()=>setModal('terms')},
          ].map((it,i)=>it===null
            ?<div key={i} className="di-div"/>
            :<div key={it.id} className={`di${tab===it.id&&!it.a?' act':''}`}
                onClick={()=>{(it.a?it.a():setTab(it.id));setDrawerOpen(false)}}>
                <div className="di-ico">{it.e}</div>
                <span style={{flex:1}}>{it.l}</span>
                {it.b>0&&<span className="di-badge">{it.b}</span>}
              </div>
          )}
        </div>
      </div>

      {/* dark mode moved to drawer menu only */}

      {/* customer badge */}
      {customer&&(
        <div style={{position:'fixed',top:78,left:58,zIndex:400,background:'rgba(255,107,53,.9)',color:'white',borderRadius:20,padding:'5px 10px',fontSize:11,fontWeight:700,display:'flex',gap:6,alignItems:'center'}}>
          <span>👤 {customer.name}</span>
          <button onClick={()=>{setCustomer(null);localStorage.removeItem('nq_customer');showToast('تم الخروج')}}
            style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:13}}>✕</button>
        </div>
      )}


      {/* PAGE */}
      <div className="page">{tabs[tab]||<Home/>}</div>

      {/* BOTTOM NAV */}
      <div className="bnav">
        {[
          {id:'home',  icon:'fas fa-home',            label:'الرئيسية'},
          {id:'search',icon:'fas fa-search',           label:'بحث'},
          {id:'promos',icon:'fas fa-tag',              label:'العروض', badge:promos.filter(x=>x.active).length},
          {id:'wish',  icon:'fas fa-heart',            label:'المفضلة',badge:wishlist.length},
          {id:'cart-m',icon:'fas fa-shopping-basket',  label:'السلة',  badge:cartCount,action:()=>setModal('cart')},
        ].map(b=>(
          <button key={b.id} className={`bnav-b${tab===b.id&&!b.action?' on':''}`}
            onClick={()=>b.action?b.action():setTab(b.id)}>
            <i className={b.icon}></i>
            {b.badge>0&&<span className="nbadge">{b.badge}</span>}
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      {/* Terms Modal */}
      {modal==='terms'&&(
        <div className="moverlay" onClick={e=>{if(e.target.className==='moverlay')setModal(null)}}>
          <div className="msheet">
            <div className="mhandle"/>
            <div className="mhead"><h3>📄 الشروط والأحكام</h3><button className="mclose" onClick={()=>setModal(null)}>✕</button></div>
            <div className="mbody">
              <div style={{fontSize:14,lineHeight:1.9,color:'#475569'}}>
                {settings['terms_text']||`1. يُعدّ الطلب مؤكداً بعد التأكيد عبر واتساب فقط.
2. الأسعار قابلة للتغيير دون إشعار مسبق.
3. الطلب بالكارتون الكامل فقط.
4. التوصيل يتم خلال 24-48 ساعة داخل الولاية.
5. سياسة الاسترجاع: خلال 24 ساعة من الاستلام وفي حالة وجود عيوب مصنعية.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {modal==='faq'&&(
        <div className="moverlay" onClick={e=>{if(e.target.className==='moverlay')setModal(null)}}>
          <div className="msheet">
            <div className="mhandle"/>
            <div className="mhead"><h3>❓ الأسئلة الشائعة</h3><button className="mclose" onClick={()=>setModal(null)}>✕</button></div>
            <div className="mbody">
              {[
                {q:'ما هو الحد الأدنى للطلب؟',a:'لا يوجد حد أدنى، يمكنك الطلب من كرتون واحد.'},
                {q:'كم تكلفة التوصيل؟',a:`التوصيل ${settings['shipping_cost']||'500'} ${CUR}. مجاني للطلبات التي تتجاوز ${settings['free_shipping_threshold']||'500'} ${CUR}.`},
                {q:'كيف أتتبع طلبي؟',a:'اضغط على "تتبع الطلب" في القائمة وأدخل رقم هاتفك.'},
                {q:'كيف يتم التسليم؟',a:'يتواصل معك فريقنا عبر واتساب لتحديد موعد التسليم.'},
                {q:'ما طرق الدفع المتاحة؟',a:'الدفع نقداً عند الاستلام.'},
                {q:'هل يمكن الإلغاء بعد الطلب؟',a:'يمكن الإلغاء قبل تأكيد الطلب عبر التواصل معنا.'},
              ].map((item,i)=>(
                <div key={i} style={{marginBottom:14,background:'#F7F3EF',borderRadius:12,padding:14}}>
                  <div style={{fontWeight:800,fontSize:14,color:'#1A0A00',marginBottom:6}}>❓ {item.q}</div>
                  <div style={{fontSize:13,color:'#475569',lineHeight:1.6}}>💡 {item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP - بارز مثل Esmmar */}
      <div className="wa-float">
        <button className="wa-btn" onClick={()=>window.open(`https://wa.me/${WA}`,'_blank')}>
          <i className="fab fa-whatsapp" style={{fontSize:28,color:'white'}}></i>
        </button>
        <div className="wa-label">تواصل معنا</div>
      </div>

      {/* SCROLL TOP */}
      {showScr&&(
        <button className="scrtop" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

      {/* MODALS */}
      {modal==='login'&&<LoginModal onClose={()=>setModal(null)} onLogin={handleLogin} onRegister={()=>setModal('register')}/>}
      {modal==='register'&&<RegisterModal onClose={()=>setModal(null)} onSuccess={()=>{setModal('login');showToast('✅ سجّل الآن للدخول')}}/>}
      {modal==='cart'&&<CartModal cart={cart} setCart={setCart} onClose={()=>setModal(null)}
        onCheckout={(total,disc)=>{setCheckoutTotal(total);setModal('checkout')}}
        freeShip={FREESHIP} currency={CUR} promos={promos}/>}
      {modal==='checkout'&&<CheckoutModal cart={cart} finalTotal={checkoutTotal||cartTotal}
        onClose={()=>setModal('cart')}
        onSuccess={id=>{setCart([]);setThankId(id);setModal('thankyou')}}
        currency={CUR} waNum={WA} storeName={SNAME}/>}
      {modal==='detail'&&<DetailModal product={detailProd} wishlist={wishlist}
        onClose={()=>setModal(null)} onAddCart={addToCart} onToggleWish={toggleWish}
        currency={CUR} products={products} sevenAgo={sevenAgo}
        onShowProduct={p=>setDetailProd(p)} promos={promos}/>}
      {modal==='tracking'&&<TrackingModal onClose={()=>setModal(null)} currency={CUR}/>}
      {modal==='contact'&&<ContactModal settings={settings} onClose={()=>setModal(null)}/>}
      {modal==='thankyou'&&<ThankyouModal orderId={thankId} storeName={SNAME} onClose={()=>{setModal(null);setTab('home')}}/>}
    </div>
  )
}