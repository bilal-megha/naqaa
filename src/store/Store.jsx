/**
 * Store.jsx — متجر نقاء (نسخة احترافية)
 * ✅ إصلاح مشكلة الكتابة في النوافذ
 * ✅ عروض فلاش مع عداد تنازلي
 * ✅ خصم الكميات
 * ✅ اشتري 3 خذ 4
 * ✅ عرض اليوم
 * ✅ مؤشر الطلب
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

/* ─── CSS ─── */
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
  align-items:center;justify-content:center}
.sh-logo{font-size:21px;font-weight:900;color:white}
.sh-contact{background:white;color:#FF6B35;border:none;padding:7px 15px;border-radius:30px;
  font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}
.sh-search{background:white;border-radius:30px;display:flex;align-items:center;
  gap:8px;padding:9px 16px;box-shadow:0 2px 12px rgba(0,0,0,.12)}
body.dark .sh-search{background:#2a1400}
.sh-search input{border:none;outline:none;flex:1;font-family:inherit;font-size:14px;background:transparent;color:#333}
body.dark .sh-search input{color:#f0e8e0}
/* BANNER */
.banner-wrap{margin:14px 14px 0;border-radius:20px;overflow:hidden;position:relative;
  box-shadow:0 8px 28px rgba(255,107,53,.22)}
.banner-track{display:flex;transition:transform .45s cubic-bezier(.4,0,.2,1)}
.banner-slide{min-width:100%;height:175px;object-fit:cover;display:block}
.banner-fall{min-width:100%;height:175px;background:linear-gradient(135deg,#FF6B35,#7C3AED);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
.bdots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px}
.bdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);border:none;cursor:pointer;transition:.3s;padding:0}
.bdot.on{background:white;width:18px;border-radius:10px}
/* FLASH SALE */
.flash-bar{background:linear-gradient(135deg,#dc2626,#7c3aed);margin:14px 14px 0;border-radius:16px;
  padding:14px 16px;display:flex;justify-content:space-between;align-items:center}
.flash-timer{display:flex;gap:6px;align-items:center}
.timer-box{background:rgba(0,0,0,.3);color:white;padding:4px 8px;border-radius:8px;
  font-size:16px;font-weight:900;font-family:monospace;min-width:32px;text-align:center}
/* DAY DEAL */
.day-deal{background:white;margin:14px;border-radius:20px;overflow:hidden;
  box-shadow:0 4px 20px rgba(255,107,53,.15);border:2px solid #FF6B35}
body.dark .day-deal{background:#1e1208}
/* PROMO BANNER */
.promo-banner{margin:14px;border-radius:16px;overflow:hidden;cursor:pointer}
/* SEC */
.sec{padding:0 14px;margin-bottom:18px}
.sec-head{display:flex;justify-content:space-between;align-items:center;padding-top:16px;margin-bottom:13px}
.sec-title{font-size:17px;font-weight:900;color:#1A0A00}
body.dark .sec-title{color:#F0E8E0}
.sec-more{color:#FF6B35;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;font-family:inherit}
/* BRANDS */
.brands-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.brand-card{background:white;border-radius:16px;overflow:hidden;cursor:pointer;
  transition:.2s;box-shadow:0 2px 10px rgba(0,0,0,.07);aspect-ratio:1;
  display:flex;align-items:center;justify-content:center;border:2.5px solid transparent}
body.dark .brand-card{background:#1e1208}
.brand-card:active{transform:scale(.95)}
.brand-card.sel{border-color:#FF6B35}
.brand-card img{width:100%;height:100%;object-fit:cover;border-radius:13px}
.brand-all{border-radius:16px;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;cursor:pointer;background:linear-gradient(135deg,#FF6B35,#7C3AED)}
.brand-all i{font-size:24px;color:white;margin-bottom:5px}
.brand-all span{font-size:12px;font-weight:800;color:white}
/* CHIPS */
.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0}
.chips::-webkit-scrollbar{display:none}
.chip{background:white;border:1.5px solid #E8DDD5;border-radius:30px;padding:7px 16px;
  font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;color:#7A6A5A;flex-shrink:0}
body.dark .chip{background:#1e1208;border-color:#3d2a1a;color:#C0A898}
.chip.sel{background:#FF6B35;color:white;border-color:#FF6B35}
/* PRODUCT CARD */
.pc{background:white;border-radius:18px;padding:11px;transition:.2s;
  box-shadow:0 2px 14px rgba(0,0,0,.07);cursor:pointer;border:1.5px solid rgba(0,0,0,.04);width:160px;flex-shrink:0}
body.dark .pc{background:#1e1208}
.pc:active{transform:scale(.97)}
.pc-img{position:relative;border-radius:13px;overflow:hidden;margin-bottom:9px;background:#F8F4F0;aspect-ratio:1}
.pc-img img{width:100%;height:100%;object-fit:cover}
.pc-noimg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:34px}
.badge{position:absolute;top:6px;right:6px;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:800;color:white}
.b-new{background:#10b981}.b-hot{background:#f59e0b}.b-promo{background:#FF6B35}.b-flash{background:#dc2626}
.fav-b{position:absolute;top:6px;left:6px;width:28px;height:28px;border-radius:50%;
  background:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px}
.pc-name{font-size:12px;font-weight:700;color:#1A0A00;margin-bottom:4px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
body.dark .pc-name{color:#F0E8E0}
.pc-price{font-size:15px;font-weight:900;color:#FF6B35}
.pc-old-price{font-size:11px;color:#94a3b8;text-decoration:line-through;margin-right:4px}
.pc-discount{background:#dc2626;color:white;font-size:10px;font-weight:800;padding:2px 6px;border-radius:20px}
.pc-carton{font-size:10px;color:#7A6A5A;margin-top:1px}
.pc-stock{font-size:10px;color:#ef4444;margin-top:2px}
.pc-viewers{font-size:10px;color:#7C3AED;margin-top:2px}
.add-b{width:100%;margin-top:8px;padding:7px;border-radius:30px;
  background:linear-gradient(135deg,#FF6B35,#E8430E);color:white;
  border:none;cursor:pointer;font-family:inherit;font-size:11px;font-weight:800;
  display:flex;align-items:center;justify-content:center;gap:4px}
/* VOLUME DISCOUNT */
.vol-disc{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #10b981;
  border-radius:12px;padding:10px 14px;margin:8px 0;font-size:12px}
/* GRID */
.prod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.prod-grid .pc{width:100%}
.hscroll{display:flex;gap:11px;overflow-x:auto;padding:2px 0 10px}
.hscroll::-webkit-scrollbar{display:none}
/* CART BAR */
.cart-bar{background:linear-gradient(135deg,#FF6B35,#7C3AED);margin:14px;border-radius:16px;
  padding:12px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
/* BOTTOM NAV */
.bnav{position:fixed;bottom:0;left:0;right:0;background:white;
  display:flex;justify-content:space-around;align-items:center;
  padding:10px 0 16px;z-index:300;box-shadow:0 -4px 20px rgba(0,0,0,.08);border-radius:20px 20px 0 0}
body.dark .bnav{background:#1e1208}
.bnav-b{display:flex;flex-direction:column;align-items:center;gap:3px;border:none;
  background:none;cursor:pointer;font-family:inherit;color:#AAA099;font-size:10px;
  font-weight:700;padding:0 10px;position:relative;min-width:48px}
.bnav-b.on{color:#FF6B35}
.bnav-b i{font-size:22px}
.nbadge{position:absolute;top:-1px;right:6px;background:#FF6B35;color:white;border-radius:50%;
  width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:800;border:2px solid white}
body.dark .nbadge{border-color:#1e1208}
/* MODAL */
.moverlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);
  z-index:1000;display:flex;align-items:flex-end;justify-content:center}
.msheet{background:white;border-radius:24px 24px 0 0;width:100%;max-height:92vh;
  overflow-y:auto;padding-bottom:30px;animation:slideUp .3s cubic-bezier(.4,0,.2,1)}
body.dark .msheet{background:#1e1208}
.msheet.center{border-radius:24px;max-width:460px;margin:20px auto;animation:zoomIn .25s ease}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.mhandle{width:38px;height:4px;background:#E8DDD5;border-radius:10px;margin:12px auto 2px}
.mhead{padding:14px 18px;display:flex;justify-content:space-between;align-items:center;
  border-bottom:1px solid #F7F3EF;position:sticky;top:0;background:white;z-index:2}
body.dark .mhead{background:#1e1208;border-color:#2d1a0a}
.mhead h3{font-size:17px;font-weight:900;color:#1A0A00}
body.dark .mhead h3{color:#F0E8E0}
.mclose{width:32px;height:32px;border-radius:50%;background:#F7F3EF;border:none;cursor:pointer;
  font-size:17px;display:flex;align-items:center;justify-content:center}
body.dark .mclose{background:#2d1a0a;color:#F0E8E0}
.mbody{padding:16px 18px}
/* CART */
.ci{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F7F3EF;align-items:center}
body.dark .ci{border-color:#2d1a0a}
.ci-img{width:58px;height:58px;border-radius:12px;object-fit:cover;background:#F7F3EF;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px}
.qty-row{display:flex;align-items:center;gap:10px;margin-top:6px}
.qty-b{width:28px;height:28px;border-radius:50%;border:2px solid #FF6B35;color:#FF6B35;
  background:none;cursor:pointer;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center}
/* INPUTS */
.fi{background:#F7F3EF;border:1.5px solid #E8DDD5;border-radius:14px;padding:12px 16px;
  width:100%;font-family:inherit;font-size:14px;color:#1A0A00;outline:none;margin-bottom:12px;
  -webkit-user-select:text;user-select:text}
body.dark .fi{background:#2d1a0a;border-color:#3d2a1a;color:#F0E8E0}
.fi:focus{border-color:#FF6B35;box-shadow:0 0 0 3px rgba(255,107,53,.1)}
.fi-label{font-size:13px;font-weight:700;color:#7A6A5A;margin-bottom:6px;display:block}
/* BUTTONS */
.abtn{width:100%;padding:15px;border-radius:30px;background:linear-gradient(135deg,#FF6B35,#E8430E);
  color:white;border:none;cursor:pointer;font-family:inherit;font-size:16px;font-weight:900;
  display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px}
.abtn.purple{background:linear-gradient(135deg,#7C3AED,#5B21B6)}
/* TOAST */
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
  background:#1A0A00;color:white;padding:10px 22px;border-radius:30px;
  z-index:5000;font-size:13px;font-weight:700;animation:tin .3s ease;
  white-space:nowrap;max-width:85vw;text-align:center}
.toast.err{background:#ef4444}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
/* EMPTY */
.empty{text-align:center;padding:40px 16px;color:#7A6A5A}
.empty i{font-size:52px;margin-bottom:12px;display:block;opacity:.25}
/* TRACKING */
.trstep{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #F7F3EF}
body.dark .trstep{border-color:#2d1a0a}
.trdot{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:15px}
.trdot.done{background:linear-gradient(135deg,#FF6B35,#7C3AED);color:white}
.trdot.wait{background:#F7F3EF;color:#AAA099}
/* WA */
.wa{position:fixed;bottom:80px;left:14px;width:50px;height:50px;background:#25D366;
  border-radius:50%;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(37,211,102,.45);cursor:pointer;z-index:280;border:none}
.scrtop{position:fixed;bottom:80px;right:14px;width:44px;height:44px;background:#FF6B35;
  color:white;border-radius:50%;border:none;cursor:pointer;font-size:18px;
  display:flex;align-items:center;justify-content:center;z-index:280}
.page{padding-bottom:80px}
/* PROMO TAGS */
.buy3get1{background:linear-gradient(135deg,#10b981,#059669);color:white;
  padding:3px 8px;border-radius:20px;font-size:10px;font-weight:800}
.vol-tag{background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;
  padding:2px 6px;border-radius:20px;font-size:9px;font-weight:800}
/* OTP */
.otp-inputs{display:flex;gap:10px;justify-content:center;margin:16px 0}
.otp-input{width:50px;height:55px;border:2px solid #E8DDD5;border-radius:12px;
  text-align:center;font-size:22px;font-weight:900;font-family:inherit;outline:none;background:#F7F3EF}
.otp-input:focus{border-color:#FF6B35}
`

/* ─── Helpers ─── */
function showToast(msg, isErr=false) {
  document.querySelectorAll('.toast').forEach(t=>t.remove())
  const t=document.createElement('div')
  t.className='toast'+(isErr?' err':''); t.textContent=msg
  document.body.appendChild(t); setTimeout(()=>t.remove(),2800)
}
const hashPwd = p => { try { return CryptoJS.SHA256(p).toString() } catch { return p } }

/* ─── Flash Timer Hook ─── */
function useFlashTimer(endTime) {
  const [timeLeft, setTimeLeft] = useState({ h:'00', m:'00', s:'00' })
  useEffect(() => {
    const tick = () => {
      const diff = endTime - Date.now()
      if (diff <= 0) { setTimeLeft({ h:'00', m:'00', s:'00' }); return }
      const h = Math.floor(diff/3600000)
      const m = Math.floor((diff%3600000)/60000)
      const s = Math.floor((diff%60000)/1000)
      setTimeLeft({ h:String(h).padStart(2,'0'), m:String(m).padStart(2,'0'), s:String(s).padStart(2,'0') })
    }
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id)
  }, [endTime])
  return timeLeft
}

/* ═══════════════════════════════════
   MODAL COMPONENTS — خارج المكون الرئيسي
   لتجنب مشكلة فقدان التركيز عند الكتابة
═══════════════════════════════════ */

/* ─── Login Modal ─── */
function LoginModal({ onClose, onLogin, onGuest, onRegister, waNum }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email||!pass) { showToast('أدخل البيانات',true); return }
    setLoading(true)
    const { data } = await supabase.from('customers').select('*')
      .or(`email.eq.${email},phone.eq.${email}`)
      .eq('password', hashPwd(pass)).maybeSingle()
    if (data) { onLogin(data); showToast(`مرحباً ${data.name} 👋`) }
    else showToast('البيانات غير صحيحة',true)
    setLoading(false)
  }

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div style={{textAlign:'center',padding:'24px 18px 0'}}>
          <div style={{fontSize:40}}>🛍️</div>
          <h2 style={{fontSize:22,fontWeight:900,color:'#1A0A00',margin:'8px 0 4px'}}>نقاء</h2>
          <p style={{fontSize:13,color:'#7A6A5A',marginBottom:20}}>سجّل دخولك للمتابعة</p>
        </div>
        <div className="mbody">
          <label className="fi-label">البريد الإلكتروني أو الهاتف</label>
          <input className="fi" type="email" value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="email" />
          <label className="fi-label">كلمة المرور</label>
          <input className="fi" type="password" value={pass}
            onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="current-password" />
          <button className="abtn" onClick={submit} disabled={loading}>
            {loading?'⏳ جاري الدخول...':'🔐 دخول'}
          </button>
          <button className="abtn purple" onClick={onRegister}>
            📝 إنشاء حساب جديد
          </button>
          <div style={{textAlign:'center',marginTop:8}}>
            <button onClick={onGuest}
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

/* ─── Register Modal ─── */
function RegisterModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', pass:'', pass2:'' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1=form, 2=otp
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const refs = [useRef(null),useRef(null),useRef(null),useRef(null)]
  const [digits, setDigits] = useState(['','','',''])

  const handleDigit = (idx, val) => {
    const v = val.replace(/\D/,'')
    const nd = [...digits]; nd[idx]=v; setDigits(nd)
    if (v && idx<3) refs[idx+1].current?.focus()
    if (!v && idx>0) refs[idx-1].current?.focus()
    setOtp(nd.join(''))
  }

  const submit = async () => {
    const { name, email, phone, pass, pass2 } = form
    if (!name||!email||!phone||!pass) { showToast('أكمل البيانات',true); return }
    if (pass!==pass2) { showToast('كلمتا المرور غير متطابقتان',true); return }
    setLoading(true)
    const { data: ex } = await supabase.from('customers').select('id').eq('email',email).maybeSingle()
    if (ex) { showToast('البريد مسجّل مسبقاً',true); setLoading(false); return }
    // توليد كود OTP
    const code = String(Math.floor(1000+Math.random()*9000))
    setGeneratedOtp(code)
    setStep(2)
    showToast(`كود التحقق: ${code} (أرسل عبر واتساب)`)
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (otp !== generatedOtp) { showToast('الكود غير صحيح',true); return }
    setLoading(true)
    const { error } = await supabase.from('customers').insert({
      id:Date.now(), name:form.name, email:form.email, phone:form.phone,
      address:form.address, password:hashPwd(form.pass), points:0,
      created_at:new Date().toISOString()
    })
    if (error) { showToast('خطأ في التسجيل: '+error.message,true); setLoading(false); return }
    showToast('✅ تم التسجيل!'); onSuccess()
    setLoading(false)
  }

  const F = key => e => setForm(f=>({...f,[key]:e.target.value}))

  if (step===2) return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead">
          <h3>📱 تأكيد رقم الهاتف</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody" style={{textAlign:'center'}}>
          <p style={{fontSize:14,color:'#7A6A5A',marginBottom:20}}>
            أدخل الكود المكون من 4 أرقام<br/>
            <strong style={{color:'#FF6B35'}}>{form.phone}</strong>
          </p>
          <div className="otp-inputs">
            {digits.map((d,i)=>(
              <input key={i} ref={refs[i]} className="otp-input"
                value={d} inputMode="numeric" maxLength={1}
                onChange={e=>handleDigit(i,e.target.value)}
                onKeyDown={e=>{if(e.key==='Backspace'&&!d&&i>0) refs[i-1].current?.focus()}} />
            ))}
          </div>
          {/* عرض الكود في التطوير */}
          <div style={{background:'#fef9c3',borderRadius:12,padding:12,marginBottom:16,fontSize:13}}>
            🔑 كودك: <strong style={{fontSize:20,color:'#dc2626'}}>{generatedOtp}</strong>
            <p style={{fontSize:11,color:'#64748b',marginTop:4}}>
              في الإصدار الكامل يُرسل عبر واتساب تلقائياً
            </p>
          </div>
          <button className="abtn" onClick={verifyOtp} disabled={loading||otp.length<4}>
            {loading?'⏳...':'✅ تأكيد التسجيل'}
          </button>
          <button style={{background:'none',border:'none',color:'#FF6B35',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}
            onClick={()=>{setStep(1);setDigits(['','','',''])}}>
            تعديل البيانات
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead">
          <h3>📝 حساب جديد</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          <label className="fi-label">الاسم الكامل *</label>
          <input className="fi" value={form.name} onChange={F('name')}
            placeholder="أدخل اسمك الكامل" autoComplete="name" />
          <label className="fi-label">البريد الإلكتروني *</label>
          <input className="fi" type="email" value={form.email} onChange={F('email')}
            placeholder="example@email.com" autoComplete="email" />
          <label className="fi-label">رقم الهاتف *</label>
          <input className="fi" type="tel" value={form.phone} onChange={F('phone')}
            placeholder="0555 XX XX XX" autoComplete="tel" inputMode="numeric" />
          <label className="fi-label">العنوان</label>
          <input className="fi" value={form.address} onChange={F('address')}
            placeholder="الولاية / البلدية" autoComplete="street-address" />
          <label className="fi-label">كلمة المرور *</label>
          <input className="fi" type="password" value={form.pass} onChange={F('pass')}
            placeholder="على الأقل 6 أحرف" autoComplete="new-password" />
          <label className="fi-label">تأكيد كلمة المرور *</label>
          <input className="fi" type="password" value={form.pass2} onChange={F('pass2')}
            placeholder="أعد كتابة كلمة المرور" autoComplete="new-password" />
          <button className="abtn" onClick={submit} disabled={loading}>
            {loading?'⏳...':'📱 التالي — تأكيد الهاتف'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Cart Modal ─── */
function CartModal({ cart, setCart, onClose, onCheckout, freeShip, currency, products }) {
  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0)
  const changeQty = (id,d) => setCart(p=>p.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i))
  const remove = id => setCart(p=>p.filter(i=>i.id!==id))

  // حساب خصم اشتري 3 خذ 4
  const checkBuy3Get1 = () => {
    const total3 = cart.reduce((s,i)=>s+i.qty,0)
    if (total3>=4) {
      const cheapest = [...cart].sort((a,b)=>a.price-b.price)[0]
      return cheapest?.price || 0
    }
    return 0
  }
  const buy3get1Discount = checkBuy3Get1()

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet">
        <div className="mhandle"></div>
        <div className="mhead">
          <h3>🛒 سلة المشتريات</h3>
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
                      {(i.price*i.qty).toFixed(0)} {currency}
                    </div>
                    <div className="qty-row">
                      <button className="qty-b" onClick={()=>changeQty(i.id,-1)}>−</button>
                      <span style={{fontWeight:800,fontSize:15,minWidth:22,textAlign:'center'}}>{i.qty}</span>
                      <button className="qty-b" onClick={()=>changeQty(i.id,1)}>+</button>
                    </div>
                  </div>
                  <button onClick={()=>remove(i.id)}
                    style={{border:'none',background:'none',color:'#ef4444',cursor:'pointer',fontSize:18}}>🗑️</button>
                </div>
              ))}

              {/* خصم اشتري 4 ووفر أرخص منتج */}
              {buy3get1Discount>0 && (
                <div style={{background:'linear-gradient(135deg,#d1fae5,#a7f3d0)',borderRadius:14,padding:12,margin:'12px 0',textAlign:'center'}}>
                  <div style={{fontWeight:800,color:'#059669',fontSize:15}}>🎁 مبروك! اشتريت 4 منتجات</div>
                  <div style={{fontSize:13,color:'#065f46',marginTop:4}}>خصم تلقائي: <strong>{buy3get1Discount.toFixed(0)} {currency}</strong></div>
                </div>
              )}

              {/* شريط التوصيل المجاني */}
              <div style={{background:'#FFF0EB',borderRadius:14,padding:'12px 14px',margin:'14px 0'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700}}>
                  <span>{cartTotal>=freeShip?'🎉 توصيل مجاني!':`أضف ${(freeShip-cartTotal).toFixed(0)} ${currency} للتوصيل المجاني`}</span>
                  <span style={{color:'#FF6B35'}}>{Math.min(100,(cartTotal/freeShip*100)).toFixed(0)}%</span>
                </div>
                <div style={{background:'#E8DDD5',borderRadius:30,height:6,marginTop:8,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'linear-gradient(90deg,#FF6B35,#7C3AED)',borderRadius:30,
                    width:`${Math.min(100,cartTotal/freeShip*100)}%`,transition:'width .5s'}}></div>
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:18,marginBottom:16}}>
                <span>الإجمالي</span>
                <span style={{color:'#FF6B35'}}>{(cartTotal-buy3get1Discount).toFixed(0)} {currency}</span>
              </div>
              <button className="abtn" onClick={onCheckout}>
                <i className="fas fa-credit-card"></i> إتمام الشراء
              </button>
            </>}
        </div>
      </div>
    </div>
  )
}

/* ─── Checkout Modal ─── */
function CheckoutModal({ cart, onClose, onSuccess, currency, waNum, storeName }) {
  const [form, setForm] = useState({ name:'', phone:'', address:'' })
  const [loading, setLoading] = useState(false)
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0)
  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const submit = async () => {
    if (!form.name||!form.phone) { showToast('الاسم والهاتف مطلوبان',true); return }
    setLoading(true)
    const order = {
      id:Date.now(), customer_name:form.name, customer_phone:form.phone,
      customer_address:form.address, date:new Date().toLocaleString('ar-DZ'),
      items:JSON.stringify(cart.map(i=>({id:i.id,name:i.name,quantity:i.qty,price:i.price}))),
      total, status:'pending'
    }
    const { error } = await supabase.from('orders').insert(order)
    if (error) { showToast('خطأ: '+error.message,true); setLoading(false); return }
    // تحديث المخزون
    for (const item of cart) {
      const { data:p } = await supabase.from('products').select('stock').eq('id',item.id).maybeSingle()
      if (p) await supabase.from('products').update({ stock:Math.max(0,(p.stock||0)-item.qty) }).eq('id',item.id)
    }
    // إرسال واتساب
    if (waNum) {
      const msg = `مرحباً ${form.name}، تم استلام طلبك رقم ${order.id} بنجاح ✅\nالإجمالي: ${total.toFixed(0)} ${currency}\nشكراً لك! — ${storeName}`
      window.open(`https://wa.me/${form.phone.replace(/^0/,'213')}?text=${encodeURIComponent(msg)}`,'_blank')
    }
    onSuccess(order.id)
    setLoading(false)
  }

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📋 تأكيد الطلب</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <label className="fi-label">الاسم الكامل *</label>
          <input className="fi" value={form.name} onChange={F('name')}
            placeholder="أدخل اسمك" autoComplete="name" />
          <label className="fi-label">رقم الهاتف *</label>
          <input className="fi" type="tel" value={form.phone} onChange={F('phone')}
            placeholder="0555 XX XX XX" autoComplete="tel" inputMode="numeric" />
          <label className="fi-label">العنوان</label>
          <textarea className="fi" rows="2" value={form.address} onChange={F('address')}
            placeholder="الولاية / البلدية" style={{resize:'none'}} autoComplete="street-address"></textarea>
          <div style={{background:'#FFF0EB',borderRadius:14,padding:'12px 16px',marginBottom:16,
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:700}}>إجمالي الطلب</span>
            <span style={{fontWeight:900,color:'#FF6B35',fontSize:18}}>{total.toFixed(0)} {currency}</span>
          </div>
          <button className="abtn" onClick={submit} disabled={loading}>
            {loading?'⏳...':'✅ تأكيد الطلب'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Detail Modal ─── */
function DetailModal({ product, wishlist, onClose, onAddCart, onToggleWish, currency, products, sevenAgo, onShowProduct }) {
  if (!product) return null
  const p = product
  const related = products.filter(r=>(r.category_id===p.category_id||r.brand_id===p.brand_id)&&r.id!==p.id&&!r.disabled).slice(0,6)
  const isNew = new Date(p.created_at) >= sevenAgo

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
              {p.discount>0&&<span style={{fontSize:13,color:'#94a3b8',textDecoration:'line-through',marginLeft:8}}>{p.price} {currency}</span>}
              <span style={{fontSize:24,fontWeight:900,color:'#FF6B35'}}>{p.discount>0?(p.price*(1-p.discount/100)).toFixed(0):p.price} {currency}</span>
              {p.discount>0&&<span className="pc-discount" style={{marginRight:8}}>-{p.discount}%</span>}
            </div>
            <button onClick={()=>onToggleWish(p.id)}
              style={{width:40,height:40,borderRadius:'50%',background:wishlist.includes(p.id)?'#FFF0EB':'#F7F3EF',border:'none',cursor:'pointer',fontSize:20}}>
              <i className="fas fa-heart" style={{color:wishlist.includes(p.id)?'#FF6B35':'#CBD5E1'}}></i>
            </button>
          </div>
          {p.carton_price&&<p style={{color:'#7A6A5A',fontSize:13,marginBottom:8}}>الكرتون ({p.units||12} حبة): {p.carton_price} {currency}</p>}
          {(p.stock||0)>0&&(p.stock||0)<10&&<p style={{color:'#ef4444',fontWeight:700,fontSize:13,marginBottom:8}}>⚠️ متبقي {p.stock} فقط!</p>}
          {(p.stock||0)===0&&<p style={{color:'#ef4444',fontWeight:700,fontSize:13,marginBottom:8}}>❌ نفذ من المخزون</p>}

          {/* خصم الكميات */}
          {p.price && (
            <div className="vol-disc">
              <div style={{fontWeight:800,color:'#059669',marginBottom:6}}>📦 خصم الكميات</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,textAlign:'center'}}>
                {[{qty:6,disc:5},{qty:12,disc:10},{qty:24,disc:15}].map(({qty,disc})=>(
                  <div key={qty} style={{background:'white',borderRadius:10,padding:'6px 4px',border:'1px solid #10b981'}}>
                    <div style={{fontWeight:800,fontSize:13}}>{qty}+</div>
                    <div style={{color:'#10b981',fontWeight:700,fontSize:12}}>{disc}% خصم</div>
                    <div style={{fontSize:11,color:'#065f46'}}>{(p.price*(1-disc/100)).toFixed(0)} {currency}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="abtn" onClick={()=>{onAddCart(p);onClose()}} disabled={(p.stock||0)===0}>
            <i className="fas fa-cart-plus"></i> {(p.stock||0)===0?'نفذ من المخزون':'أضف للسلة'}
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
        </div>
      </div>
    </div>
  )
}

/* ─── Tracking Modal ─── */
function TrackingModal({ onClose, currency }) {
  const [num, setNum] = useState('')
  const [res, setRes] = useState(null)
  const steps = ['pending','processing','shipped','delivered']
  const labels = { pending:'تم استلام الطلب', processing:'قيد التجهيز', shipped:'في الطريق إليك', delivered:'تم التسليم' }

  const track = async () => {
    if (!num) return
    const { data } = await supabase.from('orders').select('*').eq('id',num).maybeSingle()
    setRes(data||false)
  }

  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>🔍 تتبع الطلب</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <label className="fi-label">رقم الطلب</label>
          <input className="fi" value={num} onChange={e=>setNum(e.target.value)}
            placeholder="أدخل رقم طلبك" inputMode="numeric" autoComplete="off" />
          <button className="abtn" onClick={track}><i className="fas fa-search"></i> تتبع الطلب</button>
          {res===false&&<p style={{textAlign:'center',color:'#ef4444',marginTop:12}}>رقم الطلب غير صحيح</p>}
          {res&&res.id&&(
            <div style={{marginTop:16}}>
              <div style={{background:'#FFF0EB',borderRadius:14,padding:14,marginBottom:16}}>
                <div style={{fontWeight:800}}>طلب رقم {res.id}</div>
                <div style={{color:'#7A6A5A',fontSize:13,marginTop:4}}>العميل: {res.customer_name}</div>
                <div style={{color:'#FF6B35',fontWeight:900,fontSize:18,marginTop:4}}>{Number(res.total).toFixed(0)} {currency}</div>
              </div>
              {steps.map((s,i)=>{
                const curIdx = steps.indexOf(res.status)
                return (
                  <div key={s} className="trstep">
                    <div className={`trdot ${i<=curIdx?'done':'wait'}`}>{i<=curIdx?'✓':i+1}</div>
                    <div style={{paddingTop:8}}>
                      <div style={{fontWeight:700,fontSize:14,color:i<=curIdx?'#FF6B35':'#7A6A5A'}}>{labels[s]}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Contact Modal ─── */
function ContactModal({ settings, onClose }) {
  return (
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📞 اتصل بنا</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:40,marginBottom:8}}>🛍️</div>
            <div style={{fontWeight:900,fontSize:18}}>{settings['store_name']||'نقاء'}</div>
          </div>
          {settings['contact_phone']&&<a href={`tel:${settings['contact_phone']}`}
            style={{display:'flex',alignItems:'center',gap:12,background:'#FFF0EB',borderRadius:14,padding:14,marginBottom:10,textDecoration:'none'}}>
            <span style={{fontSize:24}}>📱</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>الهاتف</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_phone']}</div></div>
          </a>}
          {settings['contact_whatsapp']&&<a href={`https://wa.me/${settings['contact_whatsapp']}`} target="_blank" rel="noreferrer"
            style={{display:'flex',alignItems:'center',gap:12,background:'#f0fdf4',borderRadius:14,padding:14,marginBottom:10,textDecoration:'none'}}>
            <span style={{fontSize:24}}>💬</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>واتساب</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_whatsapp']}</div></div>
          </a>}
          {settings['contact_address']&&<div style={{display:'flex',alignItems:'center',gap:12,background:'#f1f5f9',borderRadius:14,padding:14,marginBottom:10}}>
            <span style={{fontSize:24}}>📍</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>العنوان</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_address']}</div></div>
          </div>}
          {settings['contact_hours']&&<div style={{display:'flex',alignItems:'center',gap:12,background:'#fef9c3',borderRadius:14,padding:14,marginBottom:10}}>
            <span style={{fontSize:24}}>🕒</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>ساعات العمل</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_hours']}</div></div>
          </div>}
        </div>
      </div>
    </div>
  )
}

/* ─── Thankyou Modal ─── */
function ThankyouModal({ orderId, storeName, onClose }) {
  return (
    <div className="moverlay">
      <div className="msheet center">
        <div className="mbody" style={{textAlign:'center',padding:'32px 24px'}}>
          <div style={{fontSize:64,marginBottom:16}}>🎉</div>
          <h2 style={{fontSize:22,fontWeight:900,marginBottom:8}}>شكراً لطلبك!</h2>
          <p style={{color:'#7A6A5A',marginBottom:6}}>تم استلام طلبك بنجاح</p>
          <p style={{color:'#FF6B35',fontWeight:800,fontSize:18,marginBottom:8}}>رقم الطلب: {orderId}</p>
          <p style={{fontSize:13,color:'#64748b',marginBottom:24}}>سيصلك إشعار واتساب بتأكيد طلبك</p>
          <button className="abtn" onClick={onClose}><i className="fas fa-home"></i> العودة للمتجر</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   MAIN STORE COMPONENT
═══════════════════════════════════ */
export default function Store() {
  /* ─── State ─── */
  const [customer,    setCustomer]    = useState(()=>{ try{return JSON.parse(localStorage.getItem('nq_customer')||'null')}catch{return null} })
  const [cart,        setCart]        = useState(()=>{ try{return JSON.parse(localStorage.getItem('nq_cart')||'[]')}catch{return [] } })
  const [wishlist,    setWishlist]    = useState(()=>{ try{return JSON.parse(localStorage.getItem('nq_wish')||'[]')}catch{return [] } })
  const [products,    setProducts]    = useState([])
  const [brands,      setBrands]      = useState([])
  const [settings,    setSettings]    = useState({})
  const [banners,     setBanners]     = useState([])
  const [loading,     setLoading]     = useState(true)

  const [modal,       setModal]       = useState(null)
  const [detailProd,  setDetailProd]  = useState(null)
  const [thankId,     setThankId]     = useState(null)
  const [tab,         setTab]         = useState('home')
  const [search,      setSearch]      = useState('')
  const [brandSel,    setBrandSel]    = useState('all')
  const [catSel,      setCatSel]      = useState('all')
  const [sortSel,     setSortSel]     = useState('newest')
  const [page,        setPage]        = useState(1)
  const [showScr,     setShowScr]     = useState(false)
  const [bannerIdx,   setBannerIdx]   = useState(0)
  const [compareList, setCompareList] = useState([])

  /* ─── Flash sale end time (24h from load) ─── */
  const flashEnd = useRef(Date.now() + 24*3600*1000)
  const timer = useFlashTimer(flashEnd.current)

  /* ─── Derived ─── */
  const SNAME   = settings['store_name']      || 'نقاء'
  const CUR     = settings['store_currency']  || 'دج'
  const WA      = settings['contact_whatsapp']|| settings['whatsapp_number']||''
  const FREESHIP= parseFloat(settings['free_shipping_threshold']||'500')

  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0)
  const cartCount = cart.reduce((s,i)=>s+i.qty,0)
  const sevenAgo  = new Date(); sevenAgo.setDate(sevenAgo.getDate()-7)

  /* ─── Load data ─── */
  useEffect(()=>{
    const load=async()=>{
      const [{data:p},{data:b},{data:s}]=await Promise.all([
        supabase.from('products').select('*').eq('disabled',false).order('created_at',{ascending:false}),
        supabase.from('brands').select('*').order('name'),
        supabase.from('settings').select('*'),
      ])
      setProducts(p||[])
      setBrands(b||[])
      const map={}; (s||[]).forEach(r=>(map[r.key]=r.value)); setSettings(map)
      // Banners من الـ settings
      try { const bans=JSON.parse(map['store_banners']||'[]'); setBanners(bans) } catch {}
      setLoading(false)
    }
    load()
  },[])

  /* ─── Inject CSS ─── */
  useEffect(()=>{
    if(!document.getElementById('nq-css')){
      const s=document.createElement('style');s.id='nq-css';s.textContent=CSS;document.head.appendChild(s)
    }
    if(localStorage.getItem('nqDark')==='1') document.body.classList.add('dark')
    const fn=()=>setShowScr(window.scrollY>300)
    window.addEventListener('scroll',fn); return()=>window.removeEventListener('scroll',fn)
  },[])

  /* ─── Auto banner ─── */
  useEffect(()=>{
    if(banners.length<2) return
    const t=setInterval(()=>setBannerIdx(i=>(i+1)%banners.length),3500)
    return()=>clearInterval(t)
  },[banners.length])

  /* ─── Persist ─── */
  useEffect(()=>{ localStorage.setItem('nq_cart',JSON.stringify(cart)) },[cart])
  useEffect(()=>{ localStorage.setItem('nq_wish',JSON.stringify(wishlist)) },[wishlist])

  /* ─── Cart ─── */
  const addToCart = useCallback((p,qty=1)=>{
    if(!p||p.disabled||(p.stock||0)===0){ showToast('المنتج غير متوفر',true); return }
    setCart(prev=>{
      if(prev.find(i=>i.id===p.id)){ showToast(`⚠️ موجود في السلة`,true); return prev }
      showToast(`✅ تمت الإضافة`)
      return [...prev,{id:p.id,name:p.name,price:Number(p.price),qty,image:p.image}]
    })
  },[])

  const toggleWish = useCallback(id=>{
    setWishlist(prev=>{
      if(prev.includes(id)){ showToast('تم الإزالة'); return prev.filter(x=>x!==id) }
      showToast('❤️ تمت الإضافة'); return [...prev,id]
    })
  },[])

  /* ─── Products filtering ─── */
  const sc = {}; products.forEach(p=>{})
  const allP = products.filter(p=>!p.disabled)
  const promos  = allP.filter(p=>p.is_promo)
  const news    = allP.filter(p=>new Date(p.created_at)>=sevenAgo)
  const flashP  = allP.filter(p=>p.discount>0).slice(0,10)
  const dayDeal = allP.find(p=>p.discount>=20) || null
  const viewersCount = (id) => Math.floor(Math.random()*20)+5

  const filtered = (()=>{
    let f=[...allP]
    if(search) f=f.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
    if(brandSel!=='all') f=f.filter(p=>p.brand_id==brandSel)
    if(catSel!=='all') f=f.filter(p=>p.category_id==catSel)
    if(sortSel==='newest') f=[...f].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    else if(sortSel==='price_asc') f=[...f].sort((a,b)=>a.price-b.price)
    else if(sortSel==='price_desc') f=[...f].sort((a,b)=>b.price-a.price)
    return f
  })()
  const PER=12; const PAGES=Math.ceil(filtered.length/PER)
  const paged=filtered.slice((page-1)*PER,page*PER)

  /* ─── Login/Register handlers ─── */
  const handleLogin = (data) => {
    setCustomer(data); localStorage.setItem('nq_customer',JSON.stringify(data)); setModal(null)
  }
  const handleLogout = () => {
    setCustomer(null); localStorage.removeItem('nq_customer')
    setCart([]); showToast('تم تسجيل الخروج')
  }

  /* ─── Product Card ─── */
  const PC = ({ p }) => {
    const isW  = wishlist.includes(p.id)
    const isN  = new Date(p.created_at)>=sevenAgo
    const disc = Number(p.discount)||0
    const finalPrice = disc>0 ? (p.price*(1-disc/100)).toFixed(0) : p.price

    return (
      <div className="pc" onClick={()=>{ setDetailProd(p); setModal('detail') }}>
        <div className="pc-img">
          {p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<div className="pc-noimg">🛍️</div>}
          {disc>0&&<span className="badge b-flash">-{disc}%</span>}
          {isN&&!disc&&<span className="badge b-new">جديد</span>}
          <button className="fav-b" onClick={e=>{e.stopPropagation();toggleWish(p.id)}}>
            <i className="fas fa-heart" style={{color:isW?'#FF6B35':'#CBD5E1'}}></i>
          </button>
        </div>
        <div className="pc-name">{p.name}</div>
        <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
          {disc>0&&<span className="pc-old-price">{p.price}</span>}
          <span className="pc-price">{finalPrice} {CUR}</span>
          {disc>0&&<span className="pc-discount">-{disc}%</span>}
        </div>
        {p.carton_price&&<div className="pc-carton">كرتون: {p.carton_price} {CUR}</div>}
        {(p.stock||0)<10&&(p.stock||0)>0&&<div className="pc-stock">⚠️ متبقي {p.stock} فقط</div>}
        <button className="add-b" onClick={e=>{e.stopPropagation();addToCart(p)}}
          disabled={(p.stock||0)===0}>
          <i className="fas fa-cart-plus"></i>
          {(p.stock||0)===0?'نفذ':'أضف للسلة'}
        </button>
      </div>
    )
  }

  /* ─── Home Tab ─── */
  const HomeTab = () => (
    <>
      {/* BANNER */}
      {loading ? <div style={{height:175,background:'#F8F4F0',margin:'14px 14px 0',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>⏳</div> : (
        <div className="banner-wrap">
          <div className="banner-track" style={{transform:`translateX(${bannerIdx*100}%)`}}>
            {banners.length>0
              ? banners.map((b,i)=>(b.image
                  ? <img key={i} src={b.image} className="banner-slide" alt=""/>
                  : <div key={i} className="banner-fall">
                      <span style={{fontSize:36}}>🛍️</span>
                      <span style={{color:'white',fontWeight:900,fontSize:22}}>{b.title||SNAME}</span>
                      {b.subtitle&&<span style={{color:'rgba(255,255,255,.8)',fontSize:14}}>{b.subtitle}</span>}
                    </div>
                ))
              : <div className="banner-fall">
                  <span style={{fontSize:36}}>🛍️</span>
                  <span style={{color:'white',fontWeight:900,fontSize:24}}>{SNAME}</span>
                  <span style={{color:'rgba(255,255,255,.8)',fontSize:14}}>أفضل المنتجات بأفضل الأسعار</span>
                </div>}
          </div>
          {banners.length>1&&(
            <div className="bdots">
              {banners.map((_,i)=><button key={i} className={`bdot${bannerIdx===i?' on':''}`} onClick={()=>setBannerIdx(i)}/>)}
            </div>
          )}
        </div>
      )}

      {/* FLASH SALE */}
      {flashP.length>0&&(
        <div className="flash-bar">
          <div>
            <div style={{color:'white',fontWeight:900,fontSize:16}}>⚡ عروض فلاش</div>
            <div style={{color:'rgba(255,255,255,.8)',fontSize:12}}>تنتهي قريباً</div>
          </div>
          <div className="flash-timer">
            <div className="timer-box">{timer.h}</div>
            <span style={{color:'white',fontWeight:900}}>:</span>
            <div className="timer-box">{timer.m}</div>
            <span style={{color:'white',fontWeight:900}}>:</span>
            <div className="timer-box">{timer.s}</div>
          </div>
        </div>
      )}
      {flashP.length>0&&(
        <div className="sec" style={{marginTop:12}}>
          <div className="hscroll">{flashP.map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {/* DAY DEAL */}
      {dayDeal&&(
        <div className="day-deal" style={{margin:'14px 14px 0'}}>
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
                <span style={{fontSize:11,color:'#94a3b8',textDecoration:'line-through'}}>{dayDeal.price} {CUR}</span>
                <span style={{fontSize:20,fontWeight:900,color:'#FF6B35'}}>{(dayDeal.price*(1-dayDeal.discount/100)).toFixed(0)} {CUR}</span>
              </div>
              <button className="add-b" style={{marginTop:8}} onClick={e=>{e.stopPropagation();addToCart(dayDeal)}}>
                أضف للسلة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BRANDS */}
      {brands.length>0&&(
        <div className="sec">
          <div className="sec-head">
            <span className="sec-title">⭐ أفضل الماركات</span>
            <button className="sec-more" onClick={()=>setTab('cats')}>عرض الكل</button>
          </div>
          <div className="brands-grid">
            <div className="brand-all" onClick={()=>{setBrandSel('all');setTab('search')}}>
              <i className="fas fa-th"></i><span>عرض الكل</span>
            </div>
            {brands.slice(0,5).map(b=>(
              <div key={b.id} className={`brand-card${brandSel==b.id?' sel':''}`}
                onClick={()=>{setBrandSel(b.id);setTab('search')}}>
                {b.image?<img src={b.image} alt={b.name}/>:<div style={{fontWeight:900,fontSize:13,color:'#1A0A00',textAlign:'center',padding:8}}>{b.name}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROMO STRIP */}
      <div style={{margin:'14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div style={{background:'linear-gradient(135deg,#10b981,#059669)',borderRadius:16,padding:14,textAlign:'center',cursor:'pointer'}}
          onClick={()=>{setSortSel('newest');setTab('search')}}>
          <div style={{fontSize:24}}>🎁</div>
          <div style={{color:'white',fontWeight:800,fontSize:13,marginTop:4}}>اشتري 3 خذ 4</div>
          <div style={{color:'rgba(255,255,255,.8)',fontSize:11}}>أرخص منتج مجاناً</div>
        </div>
        <div style={{background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:16,padding:14,textAlign:'center',cursor:'pointer'}}
          onClick={()=>{setSortSel('price_asc');setTab('search')}}>
          <div style={{fontSize:24}}>📦</div>
          <div style={{color:'white',fontWeight:800,fontSize:13,marginTop:4}}>خصم الكميات</div>
          <div style={{color:'rgba(255,255,255,.8)',fontSize:11}}>كلما زاد وفرت</div>
        </div>
      </div>

      {/* NEW */}
      {news.length>0&&(
        <div className="sec">
          <div className="sec-head">
            <span className="sec-title">🎁 وصل حديثاً</span>
            <button className="sec-more" onClick={()=>setTab('search')}>عرض الكل</button>
          </div>
          <div className="hscroll">{news.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {/* PROMOS */}
      {promos.length>0&&(
        <div className="sec">
          <div className="sec-head"><span className="sec-title">⚡ عروض خاصة</span></div>
          <div className="hscroll">{promos.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div>
        </div>
      )}

      {cartCount>0&&(
        <div className="cart-bar" onClick={()=>setModal('cart')}>
          <span style={{color:'white',fontWeight:700,fontSize:14}}>🛒 {cartCount} منتج في السلة</span>
          <span style={{color:'white',fontWeight:900,fontSize:16}}>{cartTotal.toFixed(0)} {CUR}</span>
        </div>
      )}

      <div style={{textAlign:'center',color:'#94a3b8',fontSize:13,padding:'32px 0 8px',borderTop:'1px solid #e2e8f0',marginTop:24}}>
        © 2025 {SNAME} — جميع الحقوق محفوظة
      </div>
    </>
  )

  /* ─── Search Tab ─── */
  const SearchTab = () => (
    <div className="sec" style={{marginTop:14}}>
      <div className="chips" style={{marginBottom:10}}>
        <button className={`chip${catSel==='all'?' sel':''}`} onClick={()=>{setCatSel('all');setPage(1)}}>الكل</button>
        {[...new Set(products.filter(p=>p.category_id).map(p=>p.category_id))].slice(0,6).map(cid=>{
          const name = settings[`cat_${cid}`] || `فئة ${cid}`
          return <button key={cid} className={`chip${catSel==cid?' sel':''}`} onClick={()=>{setCatSel(cid);setPage(1)}}>{name}</button>
        })}
      </div>
      <div className="chips" style={{marginBottom:14}}>
        {[['newest','الأحدث'],['price_asc','السعر ↑'],['price_desc','السعر ↓']].map(([v,l])=>(
          <button key={v} className={`chip${sortSel===v?' sel':''}`} onClick={()=>{setSortSel(v);setPage(1)}}>{l}</button>
        ))}
      </div>
      {paged.length===0
        ? <div className="empty"><i className="fas fa-search"></i><p>لا توجد منتجات</p></div>
        : <div className="prod-grid">{paged.map(p=><PC key={p.id} p={p}/>)}</div>}
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
  )

  /* ─── Cats Tab ─── */
  const CatsTab = () => (
    <div className="sec" style={{marginTop:14}}>
      <div className="brands-grid">
        <div className="brand-all" onClick={()=>{setBrandSel('all');setCatSel('all');setTab('search')}}>
          <i className="fas fa-th"></i><span>كل الماركات</span>
        </div>
        {brands.map(b=>(
          <div key={b.id} className="brand-card" onClick={()=>{setBrandSel(b.id);setTab('search')}}>
            {b.image?<img src={b.image} alt={b.name}/>:<div style={{fontWeight:900,fontSize:13,color:'#1A0A00',textAlign:'center',padding:8}}>{b.name}</div>}
          </div>
        ))}
      </div>
    </div>
  )

  /* ─── Wish Tab ─── */
  const WishTab = () => {
    const wp=products.filter(p=>wishlist.includes(p.id))
    return (
      <div className="sec" style={{marginTop:14}}>
        {wp.length===0?<div className="empty"><i className="fas fa-heart"></i><p>قائمة المفضلة فارغة</p></div>:
          <div className="prod-grid">{wp.map(p=><PC key={p.id} p={p}/>)}</div>}
      </div>
    )
  }

  /* ─── Tab Render ─── */
  const tabs = { home:<HomeTab/>, search:<SearchTab/>, cats:<CatsTab/>, wish:<WishTab/> }

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
          <i className="fas fa-search" style={{color:'#aaa'}}></i>
          <input value={search}
            onChange={e=>{setSearch(e.target.value);setTab('search');setPage(1)}}
            placeholder="بحث عن المنتجات..." />
          {search&&<button onClick={()=>{setSearch('');setTab('home')}}
            style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:16}}>×</button>}
        </div>
      </div>

      {/* Dark mode */}
      <button onClick={()=>{document.body.classList.toggle('dark');localStorage.setItem('nqDark',document.body.classList.contains('dark')?'1':'0')}}
        style={{position:'fixed',top:78,right:14,zIndex:400,width:36,height:36,borderRadius:'50%',background:'rgba(255,107,53,.15)',color:'#FF6B35',border:'1.5px solid rgba(255,107,53,.3)',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <i className="fas fa-moon"></i>
      </button>

      {/* PAGE */}
      <div className="page">{tabs[tab]||<HomeTab/>}</div>

      {/* BOTTOM NAV */}
      <div className="bnav">
        {[
          {id:'wish',icon:'fas fa-heart',label:'المفضلة',badge:wishlist.length},
          {id:'cart-m',icon:'fas fa-shopping-basket',label:'السلة',badge:cartCount,action:()=>setModal('cart')},
          {id:'search',icon:'fas fa-search',label:'بحث'},
          {id:'cats',icon:'fas fa-th',label:'الفئات'},
          {id:'home',icon:'fas fa-home',label:'الرئيسية'},
        ].map(b=>(
          <button key={b.id} className={`bnav-b${tab===b.id&&!b.action?' on':''}`}
            onClick={()=>b.action?b.action():setTab(b.id)}>
            <i className={b.icon}></i>
            {b.badge>0&&<span className="nbadge">{b.badge}</span>}
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      {/* WA */}
      {WA&&<button className="wa" onClick={()=>window.open(`https://wa.me/${WA}`,'_blank')}>
        <i className="fab fa-whatsapp" style={{fontSize:26,color:'white'}}></i>
      </button>}

      {/* Scroll Top */}
      {showScr&&<button className="scrtop" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
        <i className="fas fa-chevron-up"></i>
      </button>}

      {/* Customer badge */}
      {customer&&(
        <div style={{position:'fixed',top:78,left:14,zIndex:400,background:'rgba(255,107,53,.9)',color:'white',
          borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:700,display:'flex',gap:8,alignItems:'center'}}>
          <span>{customer.name}</span>
          <button onClick={handleLogout} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:14}}>✕</button>
        </div>
      )}

      {/* MODALS */}
      {modal==='login' && <LoginModal
        onClose={()=>setModal(null)}
        onLogin={handleLogin}
        onGuest={()=>setModal(null)}
        onRegister={()=>setModal('register')}
        waNum={WA} />}

      {modal==='register' && <RegisterModal
        onClose={()=>setModal(null)}
        onSuccess={()=>{ setModal('login'); showToast('✅ تم التسجيل، ادخل الآن') }} />}

      {modal==='cart' && <CartModal
        cart={cart} setCart={setCart}
        onClose={()=>setModal(null)}
        onCheckout={()=>setModal('checkout')}
        freeShip={FREESHIP} currency={CUR} products={products} />}

      {modal==='checkout' && <CheckoutModal
        cart={cart}
        onClose={()=>setModal('cart')}
        onSuccess={id=>{ setCart([]); setThankId(id); setModal('thankyou') }}
        currency={CUR} waNum={WA} storeName={SNAME} />}

      {modal==='detail' && <DetailModal
        product={detailProd} wishlist={wishlist}
        onClose={()=>setModal(null)}
        onAddCart={addToCart}
        onToggleWish={toggleWish}
        currency={CUR} products={products}
        sevenAgo={sevenAgo}
        onShowProduct={p=>setDetailProd(p)} />}

      {modal==='tracking' && <TrackingModal onClose={()=>setModal(null)} currency={CUR} />}

      {modal==='contact' && <ContactModal settings={settings} onClose={()=>setModal(null)} />}

      {modal==='thankyou' && <ThankyouModal orderId={thankId} storeName={SNAME} onClose={()=>setModal(null)} />}
    </div>
  )
}
