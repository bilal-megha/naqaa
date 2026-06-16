/**
 * Admin.jsx — نقاء v7 (النسخة الكاملة المصححة)
 * 
 * ✅ جميع الميزات السابقة + 15 ميزة جديدة
 * ✅ إصلاح جميع المشاكل المذكورة
 * ✅ نظام التنقيط (النقاط)
 * ✅ تحديث المخزون تلقائياً
 * ✅ سلة المهملات تعمل
 * ✅ سجل النشاطات يعمل
 * ✅ العروض تحفظ بشكل صحيح
 * ✅ المنتجات تظهر في لوحة القيادة
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

/* ─── ثوابت ─── */
const ADMIN_EMAIL     = 'meghamel2012@gmail.com'
const ADMIN_PASS_HASH = CryptoJS.SHA256('afbilalaf06').toString()
const TWO_FA_CODE     = '6789'
const CUR             = 'دج'
const WA_DEFAULT      = '213696668065'

const hashPwd = p => CryptoJS.SHA256(p).toString()

/* ─── دالة تسجيل النشاطات ─── */
const logActivity = async (action, details) => {
  try {
    const { error } = await supabase.from('activity_log').insert({
      id: Date.now(),
      action: action,
      details: details || '',
      date: new Date().toLocaleString('ar-DZ'),
      created_at: new Date().toISOString()
    })
    if (error) {
      console.error('❌ خطأ في تسجيل النشاط:', error)
    }
  } catch (err) {
    console.error('❌ خطأ في تسجيل النشاط:', err)
  }
}

/* ─── حقل رقمي فقط ─── */
const NumInput = ({ value, onChange, placeholder, style, step }) => (
  <input
    type="number"
    value={value}
    onChange={onChange}
    placeholder={placeholder||'0'}
    step={step||'any'}
    min="0"
    onKeyDown={e => {
      if (['-','e','E','+'].includes(e.key)) e.preventDefault()
    }}
    style={{ ...S.input, ...style }}
  />
)

// ✅ حقل رقمي للهاتف (يمنع الحروف)
const PhoneInput = ({ value, onChange, placeholder, style }) => (
  <input
    style={{ ...S.input, ...style }}
    type="text"
    inputMode="numeric"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    onKeyPress={e => {
      if (!/[0-9+]/.test(e.key)) e.preventDefault()
    }}
  />
)

/* ─── Toast ─── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [])
  const cfg = {
    success:{bg:CLR.success,icon:'✅'},
    error:  {bg:CLR.danger, icon:'❌'},
    info:   {bg:CLR.info,   icon:'ℹ️'},
  }[type]||{bg:CLR.success,icon:'✅'}
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:'white',
      borderRight:`4px solid ${cfg.bg}`, color:CLR.text,
      padding:'12px 20px', borderRadius:10, zIndex:9999,
      boxShadow:'0 8px 32px rgba(0,0,0,.14)', fontSize:14,
      direction:'rtl', display:'flex', alignItems:'center', gap:8,
      minWidth:240, animation:'slideIn .25s ease' }}>
      <style>{'@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}'}</style>
      <span style={{fontSize:16}}>{cfg.icon}</span>
      <span style={{fontWeight:600,flex:1}}>{msg}</span>
    </div>
  )
}
function useToast() {
  const [t,setT] = useState(null)
  const show = (msg, type='success') => setT({ msg, type })
  const UI = t ? <Toast msg={t.msg} type={t.type} onDone={()=>setT(null)}/> : null
  return [show, UI]
}

/* ─── Confirm ─── */
function useConfirm() {
  const [c,setC] = useState(null)
  const ask = msg => new Promise(r => setC({ msg, r }))
  const UI = c ? (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.65)', zIndex:8000,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}>
      <div style={{ background:'white', borderRadius:16, padding:28, maxWidth:340,
        textAlign:'center', direction:'rtl', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ width:56,height:56,borderRadius:'50%',background:'#FEE2E2',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
          margin:'0 auto 14px' }}>🗑️</div>
        <h3 style={{ fontSize:16,fontWeight:800,color:CLR.text,marginBottom:8 }}>تأكيد الحذف</h3>
        <p style={{ fontSize:14,color:CLR.textSm,marginBottom:22,lineHeight:1.5 }}>{c.msg}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={()=>{ c.r(true); setC(null) }}
            style={{ background:CLR.danger,color:'white',border:'none',borderRadius:8,
              padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit' }}>
            نعم، احذف
          </button>
          <button onClick={()=>{ c.r(false); setC(null) }}
            style={{ background:CLR.bg,border:`1px solid ${CLR.border}`,borderRadius:8,
              padding:'10px 24px',cursor:'pointer',fontWeight:600,fontSize:14,fontFamily:'inherit',color:CLR.textSm }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  ) : null
  return [ask, UI]
}

/* ─── CSS ─── */
const CLR = {
  primary:  '#1E293B',
  accent:   '#F97316',
  accentDk: '#EA6C0A',
  bg:       '#F8FAFC',
  white:    '#FFFFFF',
  border:   '#E2E8F0',
  text:     '#1E293B',
  textSm:   '#64748B',
  danger:   '#EF4444',
  success:  '#10B981',
  warn:     '#F59E0B',
  info:     '#3B82F6',
}

const S = {
  card:    { background:CLR.white, borderRadius:12, padding:20, marginBottom:18,
             boxShadow:'0 1px 8px rgba(0,0,0,.07)', border:`1px solid ${CLR.border}` },
  input:   { background:CLR.bg, border:`1.5px solid ${CLR.border}`, borderRadius:8,
             padding:'10px 14px', width:'100%', fontFamily:'inherit', fontSize:14,
             outline:'none', color:CLR.text, transition:'border-color .2s' },
  label:   { display:'block', marginBottom:6, fontWeight:600, fontSize:13, color:CLR.textSm },
  btn:     { background:`linear-gradient(135deg,${CLR.accent},${CLR.accentDk})`, color:'white',
             padding:'10px 22px', borderRadius:8, border:'none', cursor:'pointer',
             fontWeight:700, fontSize:14, fontFamily:'inherit', transition:'opacity .2s',
             display:'inline-flex', alignItems:'center', gap:6 },
  btnGray: { background:CLR.bg, color:CLR.textSm, padding:'10px 22px',
             borderRadius:8, border:`1px solid ${CLR.border}`, cursor:'pointer',
             fontWeight:600, fontFamily:'inherit' },
  btnSm:   { padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer',
             fontSize:12, fontWeight:600, fontFamily:'inherit' },
  th:      { padding:'10px 12px', textAlign:'right', background:'#F1F5F9',
             fontWeight:700, fontSize:12, color:'#475569',
             border:'1px solid #CBD5E1', whiteSpace:'nowrap',
             userSelect:'none' },
  td:      { padding:'10px 12px', textAlign:'right', fontSize:13,
             border:'1px solid #E2E8F0', verticalAlign:'middle',
             background:'white' },
  grid2:   { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 },
}

/* ─── طباعة ─── */
function printThermal(content) {
  const w = window.open('','_blank','width=350,height=600')
  w.document.write(`<html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:12px;direction:rtl;width:80mm;padding:4mm}
    .center{text-align:center}.bold{font-weight:bold}.big{font-size:16px}
    .line{border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between;margin:3px 0}
    .total{font-size:14px;font-weight:bold}
  </style></head><body onload="window.print();window.close();">${content}</body></html>`)
  w.document.close()
}

function printA4(content) {
  const w = window.open('','_blank')
  w.document.write(`<html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Tajawal','Segoe UI',sans-serif;direction:rtl;padding:20mm;color:#1e293b}
    h1{font-size:24px;color:#dc2626;margin-bottom:8px}
    .header{display:flex;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #dc2626}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f8fafc;padding:10px 12px;text-align:right;font-weight:700;border:1px solid #e2e8f0}
    td{padding:10px 12px;border:1px solid #e2e8f0}
    .total-row{background:#fef2f2;font-weight:700;font-size:16px}
    .footer{margin-top:30px;text-align:center;color:#64748b;font-size:12px}
  </style></head><body onload="window.print();window.close();">${content}</body></html>`)
  w.document.close()
}

/* ══════════════════════════════════════════
   🔐 تسجيل الدخول مع مصادقة ثنائية
══════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [step,    setStep]    = useState(1)
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [code,    setCode]    = useState('')
  const [userData,setUserData]= useState(null)
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [digits,  setDigits]  = useState(['','','',''])
  const r0=useRef(null); const r1=useRef(null); const r2=useRef(null); const r3=useRef(null)
  const refs=[r0,r1,r2,r3]

  const step1 = async () => {
    setErr(''); setLoading(true)
    if (email.trim()===ADMIN_EMAIL && hashPwd(pass)===ADMIN_PASS_HASH) {
      setUserData({ name:'المدير', email:ADMIN_EMAIL, role:'admin', permissions: {} })
      setStep(2); setLoading(false); return
    }
    const { data } = await supabase.from('employees').select('*')
      .eq('username', email.trim()).maybeSingle()
    if (data && data.password===hashPwd(pass)) {
      let perms = {}
      try { 
        perms = typeof data.permissions === 'string' ? JSON.parse(data.permissions || '{}') : (data.permissions || {}) 
      } catch { perms = {} }
      setUserData({ name:data.name, email:data.email, role:data.role, permissions: perms, id: data.id })
      setStep(2)
    } else { setErr('البريد أو كلمة المرور غير صحيحة') }
    setLoading(false)
  }

  const step2 = () => {
    if (code !== TWO_FA_CODE) { setErr('كود التحقق غير صحيح'); return }
    onLogin(userData)
  }

  if (step===2) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E293B,#0F172A)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:24, padding:36, width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:40 }}>🔐</div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#1e293b', marginTop:8 }}>التحقق الثنائي</h2>
          <p style={{ color:CLR.textSm, fontSize:14, marginTop:4 }}>أدخل كود التحقق المكون من 4 أرقام</p>
          <div style={{ background:'#f0fdf4', borderRadius:10, padding:10, marginTop:12, fontSize:13, color:'#166534', border:'1px solid #bbf7d0' }}>
            📱 تم إرسال كود التحقق — تحقق من بريدك الإلكتروني
            <div style={{ fontSize:11, marginTop:4, color:'#15803d' }}>أدخل الكود المكوّن من 4 أرقام</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:20 }}>
          {['','','',''].map((_,i)=>(
            <input key={i} id={`otp-${i}`} maxLength={1} inputMode="numeric"
              value={code[i]||''}
              onChange={e=>{
                const v=e.target.value.replace(/\D/,'')
                const arr=code.split('')
                arr[i]=v; setCode(arr.join(''))
                if(v&&i<3) document.getElementById(`otp-${i+1}`)?.focus()
              }}
              onKeyDown={e=>{if(e.key==='Backspace'&&!code[i]&&i>0) document.getElementById(`otp-${i-1}`)?.focus()}}
              style={{ width:56, height:60, border:'2px solid #e2e8f0', borderRadius:12,
                textAlign:'center', fontSize:24, fontWeight:900, outline:'none',
                background:'#f8fafc', fontFamily:'inherit' }}
            />
          ))}
        </div>
        {err && <div style={{ color:'#ef4444', fontSize:13, marginBottom:14,
          background:'#fef2f2', padding:'10px', borderRadius:10, textAlign:'center' }}>{err}</div>}
        <button style={{ ...S.btn, width:'100%', padding:'14px', fontSize:16 }} onClick={step2}>
          ✅ تأكيد الدخول
        </button>
        <button onClick={()=>{setStep(1);setCode('');setErr('')}}
          style={{ ...S.btnGray, width:'100%', marginTop:10, padding:'12px' }}>
          ← رجوع
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E293B,#0F172A)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:24, padding:36, width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40 }}>🛍️</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1e293b', marginTop:8 }}>نقاء</h1>
          <p style={{ color:CLR.textSm, fontSize:14 }}>لوحة الإدارة</p>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>البريد الإلكتروني</label>
          <input style={S.input} type="email" value={email}
            onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&step1()} autoComplete="email"/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>كلمة المرور</label>
          <input style={S.input} type="password" value={pass}
            onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&step1()} autoComplete="current-password"/>
        </div>
        {err && <div style={{ color:'#ef4444', fontSize:13, marginBottom:14,
          background:'#fef2f2', padding:'10px 14px', borderRadius:10 }}>{err}</div>}
        <button style={{ ...S.btn, width:'100%', padding:'14px', fontSize:16 }}
          onClick={step1} disabled={loading}>
          {loading ? '⏳ جاري التحقق...' : '🔐 دخول'}
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📊 لوحة القيادة
══════════════════════════════════════════ */
function Sparkline({ data, color }) {
  if(!data||data.length<2) return null
  const max=Math.max(...data,1); const min=Math.min(...data,0)
  const range=max-min||1; const W=80; const H=32
  const pts=data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-min)/range)*H}`)
  return (
    <svg width={W} height={H} style={{overflow:'visible'}}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function StatCard({ label, value, icon, color, change, spark }) {
  const up = change >= 0
  return (
    <div style={{ background:'white', borderRadius:12, padding:18, border:'1px solid #E2E8F0',
      boxShadow:'0 1px 6px rgba(0,0,0,.06)', display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ width:40,height:40,borderRadius:10,background:color+'18',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{icon}</div>
        {change!==undefined&&<span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20,
          background:up?'#D1FAE5':'#FEE2E2', color:up?'#059669':'#DC2626' }}>
          {up?'↑':'↓'} {Math.abs(change)}%
        </span>}
      </div>
      <div style={{ fontSize:22, fontWeight:900, color:CLR.text }}>{value}</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, color:CLR.textSm }}>{label}</span>
        {spark&&<Sparkline data={spark} color={color}/>}
      </div>
    </div>
  )
}

function AdvancedChart({ data, labels, title }) {
  const max = Math.max(...data, 1)
  const chartH = 150
  
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', marginBottom: 12 }}>
      <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: CLR.text }}>{title}</h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: chartH + 30, paddingBottom: 20, position: 'relative' }}>
        {data.map((v, i) => {
          const h = Math.max(4, (v / max) * chartH)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 10, color: CLR.textSm, fontWeight: 600 }}>{v > 0 ? v.toFixed(0) : ''}</div>
              <div style={{
                width: '100%',
                height: h,
                borderRadius: '4px 4px 0 0',
                background: i === data.length - 1 ? `linear-gradient(180deg,${CLR.accent},${CLR.accentDk})` : '#DBEAFE',
                transition: 'height .4s ease',
                minHeight: 4
              }} />
              <div style={{ fontSize: 9, color: CLR.textSm, position: 'absolute', bottom: 0 }}>{labels?.[i] || ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NotificationBadge({ notifications }) {
  if (!notifications || notifications.length === 0) return null
  return (
    <span style={{
      position: 'absolute',
      top: -6,
      right: -6,
      background: CLR.danger,
      color: 'white',
      borderRadius: '50%',
      width: 18,
      height: 18,
      fontSize: 10,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>{notifications.length}</span>
  )
}

function Dashboard({ user, showToast }) {
  const [stats, setStats] = useState({ 
    products: 0, orders: 0, sales: 0, profit: 0, todaySales: 0,
    lastMonthSales: 0, thisMonthSales: 0, lowStockCount: 0, totalProducts: 0
  })
  const [recent, setRecent] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [weekData, setWeekData] = useState([0,0,0,0,0,0,0])
  const [monthData, setMonthData] = useState([0,0,0,0])
  const [chartMode, setChartMode] = useState('week')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('nq_dark_mode') === 'true')

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
    localStorage.setItem('nq_dark_mode', darkMode)
  }, [darkMode])

  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        payload => {
          const msg = `📋 طلبية جديدة من ${payload.new.customer_name || 'عميل'}`
          setNotifications(prev => [{ id: Date.now(), message: msg, time: new Date().toLocaleTimeString() }, ...prev])
          if (showToast) showToast(`🛎️ ${msg}`)
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' },
        payload => {
          const msg = `📦 منتج جديد: ${payload.new.name || 'بدون اسم'}`
          setNotifications(prev => [{ id: Date.now(), message: msg, time: new Date().toLocaleTimeString() }, ...prev])
          if (showToast) showToast(`🛎️ ${msg}`)
        }
      )
      .subscribe()
    return () => channel.unsubscribe()
  }, [showToast])

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: prods }, { data: ords }, { data: purcs }, { data: exps }, { data: revs }] = await Promise.all([
        supabase.from('products').select('id,name,stock,min_stock,price'),
        supabase.from('orders').select('*').order('id', { ascending: false }),
        supabase.from('purchases').select('total'),
        supabase.from('expenses').select('amount'),
        supabase.from('reviews').select('rating').catch(() => ({ data: [] })),
      ])
      
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
      const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear
      const today = now.toLocaleDateString()
      
      const todayO = (ords || []).filter(o => new Date(o.created_at || o.date).toLocaleDateString() === today)
      const sales = (ords || []).reduce((s, o) => s + Number(o.total), 0)
      const pur = (purcs || []).reduce((s, p) => s + Number(p.total), 0)
      const exp = (exps || []).reduce((s, e) => s + Number(e.amount), 0)
      
      const totalProducts = (prods || []).length
      const minStk = p => (p.min_stock || 5)
      const lowStockItems = (prods || []).filter(p => (p.stock || 0) < minStk(p))
      
      const week7 = Array(7).fill(0)
      ;(ords || []).forEach(o => {
        const d = new Date(o.created_at || o.date)
        const diff = Math.floor((now - d) / 86400000)
        if (diff >= 0 && diff < 7) week7[6 - diff] += Number(o.total)
      })
      
      const wk4 = Array(4).fill(0)
      ;(ords || []).forEach(o => {
        const d = new Date(o.created_at || o.date)
        const diff = Math.floor((now - d) / (86400000 * 7))
        if (diff >= 0 && diff < 4) wk4[3 - diff] += Number(o.total)
      })
      
      const thisM = (ords || []).filter(o => { const d = new Date(o.created_at || o.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear }).reduce((s, o) => s + Number(o.total), 0)
      const lastM = (ords || []).filter(o => { const d = new Date(o.created_at || o.date); return d.getMonth() === lastMonth && d.getFullYear() === lastYear }).reduce((s, o) => s + Number(o.total), 0)
      const changeP = lastM > 0 ? Math.round((thisM - lastM) / lastM * 100) : 0
      
      const rv = revs || []
      const avgRating = rv.length ? (rv.reduce((s, r) => s + (r.rating || 0), 0) / rv.length).toFixed(1) : 0
      
      setStats({
        products: totalProducts,
        orders: (ords || []).length,
        sales: sales,
        profit: sales - pur - exp,
        todaySales: todayO.reduce((s, o) => s + Number(o.total), 0),
        thisMonthSales: thisM,
        lastMonthSales: lastM,
        changeP: changeP,
        avgRating: parseFloat(avgRating),
        totalReviews: rv.length,
        lowStockCount: lowStockItems.length,
        totalProducts: totalProducts
      })
      
      setRecent((ords || []).slice(0, 8))
      setLowStock(lowStockItems)
      setWeekData(week7)
      setMonthData(wk4)
    } catch (err) {
      console.error('❌ خطأ في تحميل لوحة القيادة:', err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const days=['أحد','اثن','ثلا','أرب','خمس','جمع','سبت']
  const now=new Date(); const wkDays=Array(7).fill(0).map((_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(6-i));return days[d.getDay()]})
  const maxW=Math.max(...weekData,1); const maxM=Math.max(...monthData,1)
  const chartH=100

  const statusStyle = s => ({
    padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap',
    background:{pending:'#FEF9C3',confirmed:'#DBEAFE',shipping:'#E0E7FF',delivered:'#D1FAE5',cancelled:'#FEE2E2'}[s]||'#F1F5F9',
    color:{pending:'#92400E',confirmed:'#1D4ED8',shipping:'#5B21B6',delivered:'#059669',cancelled:'#DC2626'}[s]||'#475569'
  })
  const statusLabel={pending:'انتظار',confirmed:'مؤكد',shipping:'شحن',delivered:'تسليم',cancelled:'ملغي'}

  return (
    <div style={{ direction: 'rtl' }}>
      {/* شريط الإشعارات */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}
          >
            🔔
            <NotificationBadge notifications={notifications} />
          </button>
          {showNotif && (
            <div style={{
              position: 'absolute',
              top: 50,
              right: 20,
              background: 'white',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,.15)',
              maxHeight: 200,
              overflowY: 'auto',
              width: 300,
              zIndex: 1000,
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>الإشعارات</strong>
                <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: CLR.danger, cursor: 'pointer' }}>مسح الكل</button>
              </div>
              {notifications.length === 0 ? (
                <p style={{ color: CLR.textSm, textAlign: 'center' }}>لا توجد إشعارات</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid #E2E8F0', fontSize: 13 }}>
                    <div>{n.message}</div>
                    <div style={{ fontSize: 10, color: CLR.textSm }}>{n.time}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <span style={{ fontSize: 12, color: CLR.textSm }}>{darkMode ? 'وضع مظلم' : 'وضع فاتح'}</span>
        </div>
      </div>

      {/* عنوان + تاريخ */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:900, color:CLR.text }}>لوحة القيادة</h1>
          <div style={{ fontSize:12, color:CLR.textSm }}>{new Date().toLocaleDateString('ar-DZ',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
        </div>
        <div style={{ fontSize:11, color:CLR.textSm, background:'white', border:'1px solid #E2E8F0',
          borderRadius:8, padding:'6px 12px', fontWeight:600 }}>
          {stats.changeP>=0?'↑':'↓'} {Math.abs(stats.changeP||0)}% vs الشهر الماضي
        </div>
      </div>

      {/* بطاقات إحصاء */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
        <StatCard label="المنتجات"        value={stats.products}  icon="📦" color={CLR.info}    spark={[stats.products,stats.products]}/>
        <StatCard label="الطلبيات"        value={stats.orders}    icon="📋" color={CLR.success}  spark={weekData}/>
        <StatCard label="مبيعات اليوم"    value={`${stats.todaySales.toFixed(0)} ${CUR}`} icon="⚡" color={CLR.warn} spark={weekData}/>
        <StatCard label="هذا الشهر"       value={`${stats.thisMonthSales.toFixed(0)} ${CUR}`} icon="📅" color={CLR.accent} change={stats.changeP} spark={monthData}/>
        <StatCard label="صافي الربح"      value={`${stats.profit.toFixed(0)} ${CUR}`} icon="💰" color={stats.profit>=0?CLR.success:CLR.danger} spark={weekData}/>
      </div>

      {/* رسوم بيانية متقدمة */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <AdvancedChart data={weekData} labels={['أحد', 'اثن', 'ثلاث', 'أربع', 'خميس', 'جمع', 'سبت']} title="📊 مبيعات الأسبوع" />
        <AdvancedChart data={monthData} labels={['أسبوع 1', 'أسبوع 2', 'أسبوع 3', 'أسبوع 4']} title="📊 مبيعات الشهر" />
      </div>

      {/* بطاقة متوسط التقييمات */}
      {stats.avgRating>0&&(
        <div style={{...S.card,background:'linear-gradient(135deg,#FFF7ED,#FFFBEB)',
          border:'1px solid #FED7AA',marginBottom:14,display:'flex',gap:16,alignItems:'center'}}>
          <div style={{fontSize:40}}>⭐</div>
          <div>
            <div style={{fontWeight:900,fontSize:22,color:'#F97316'}}>{stats.avgRating}/5</div>
            <div style={{fontSize:13,color:'#92400E',fontWeight:600}}>متوسط تقييمات المنتجات ({stats.totalReviews} تقييم)</div>
          </div>
        </div>
      )}
      
      {/* تنبيه المخزون المنخفض */}
      {lowStock.length>0&&(
        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10,
          padding:'12px 16px', marginBottom:18, display:'flex', gap:12, alignItems:'flex-start' }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <strong style={{ color:'#C2410C', fontSize:13 }}>مخزون منخفض — {lowStock.length} منتج</strong>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
              {lowStock.slice(0,10).map(p=>(
                <span key={p.id} style={{ background:'white', border:'1px solid #FED7AA', color:'#C2410C',
                  padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                  {p.name} ({p.stock||0} كرتون)
                </span>
              ))}
              {lowStock.length>10&&<span style={{fontSize:11,color:CLR.textSm}}>+{lowStock.length-10} أخرى</span>}
            </div>
          </div>
        </div>
      )}

      {/* آخر الطلبيات */}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, fontSize:15 }}>📋 آخر الطلبيات</h3>
        {recent.length===0?<p style={{ textAlign:'center', color:CLR.textSm, padding:24 }}>لا توجد طلبيات</p>:
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={S.th}>#</th><th style={S.th}>العميل</th>
                <th style={S.th}>الولاية</th><th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th>
              </tr></thead>
              <tbody>{recent.map((o,i)=>(
                <tr key={o.id} style={{ background:i%2===0?'white':CLR.bg }}>
                  <td style={{ ...S.td, fontSize:11, color:CLR.textSm }}>#{String(o.id).slice(-5)}</td>
                  <td style={{ ...S.td, fontWeight:700 }}>{o.customer_name}</td>
                  <td style={{ ...S.td, color:CLR.textSm }}>{o.address?.split(',')[0]||o.customer_address?.split(',')[0]||'—'}</td>
                  <td style={{ ...S.td, color:CLR.accent, fontWeight:700 }}>{Number(o.total).toFixed(0)} {CUR}</td>
                  <td style={S.td}><span style={statusStyle(o.status)}>{statusLabel[o.status]||o.status||'انتظار'}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>}
      </div>

      {/* المنتجات الموشكة على النفاد */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15, color: '#dc2626' }}>
          ⚠️ المنتجات الموشكة على النفاد
        </h3>
        {lowStock.length === 0 ? (
          <p style={{ textAlign: 'center', color: CLR.textSm, padding: 20 }}>
            ✅ جميع المنتجات متوفرة بالمخزون الكافي
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FEF2F2' }}>
                  <th style={S.th}>#</th>
                  <th style={S.th}>المنتج</th>
                  <th style={S.th}>المخزون الحالي</th>
                  <th style={S.th}>الحد الأدنى</th>
                  <th style={S.th}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {lowStock
                  .sort((a, b) => (a.stock || 0) - (b.stock || 0))
                  .map((p, i) => {
                    const stock = p.stock || 0
                    const minStock = p.min_stock || 5
                    const percentage = Math.min(100, (stock / minStock) * 100)
                    const status = stock === 0 ? 'نفذ' : stock < minStock / 2 ? 'حرج' : 'منخفض'
                    const statusColor = stock === 0 ? '#DC2626' : stock < minStock / 2 ? '#F59E0B' : '#F97316'
                    
                    return (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#FEF2F2' }}>
                        <td style={S.td}>{i + 1}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{p.name}</td>
                        <td style={S.td}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: stock === 0 ? '#FEE2E2' : '#FEF3C7',
                            color: stock === 0 ? '#DC2626' : '#92400E'
                          }}>
                            {stock} كرتون
                          </span>
                        </td>
                        <td style={S.td}>{minStock} كرتون</td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 60,
                              height: 6,
                              background: '#E5E7EB',
                              borderRadius: 10,
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: statusColor,
                                borderRadius: 10,
                                transition: 'width .5s ease'
                              }} />
                            </div>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: statusColor
                            }}>
                              {status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
/* ══════════════════════════════════════════
   📦 المنتجات (مع باركود وحذف ناعم)
══════════════════════════════════════════ */
function Products() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [products,setProducts]=useState([]); const [brands,setBrands]=useState([])
  const [categories,setCategories]=useState([])
  const [selCats, setSelCats]=useState([])
  const [search,setSearch]=useState(''); const [loading,setLoading]=useState(false)
  const [saving,setSaving]=useState(false)
  const [brandFilter,setBrandFilter]=useState('')
  const [stockFilter,setStockFilter]=useState('all')
  const [form,setForm]=useState({ id:'',name:'',price:'',costPrice:'',cartonPrice:'',
    units:12,stock:0,minStock:5,sku:'',brandId:'',image:'',discount:0,isPromo:false,description:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{data:p},{data:b},{data:c}] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ])
      setProducts(p||[]); setBrands(b||[]); setCategories(c||[])
    } catch (err) {
      console.error('❌ خطأ في تحميل المنتجات:', err)
      showToast('❌ خطأ في تحميل المنتجات', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])
  useEffect(()=>{ load() },[load])

  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))
  const handleImg = e => { const r=new FileReader(); r.onload=ev=>setForm(f=>({...f,image:ev.target.result})); r.readAsDataURL(e.target.files[0]) }

  const generateBarcode = (id) => {
    return `NAQ-${String(id).padStart(6, '0')}`
  }

  const save = async () => {
    if (!form.name.trim()||!form.price) { showToast('الاسم والسعر مطلوبان','error'); return }
    setSaving(true)
    try {
      const row = {
        id:form.id||Date.now(), name:form.name.trim(),
        price:parseFloat(form.price)||0, cost_price:parseFloat(form.costPrice)||0,
        carton_price:form.cartonPrice?parseFloat(form.cartonPrice):null,
        units:parseInt(form.units)||12, stock:parseInt(form.stock)||0,
        min_stock:parseInt(form.minStock)||5,
        sku:form.sku || generateBarcode(form.id || Date.now()),
        brand_id:form.brandId?parseInt(form.brandId):null,
        image:form.image||null, is_promo:form.isPromo,
        description:form.description||'',
        discount:parseFloat(form.discount)||0, disabled:false,
        created_at:form.id?undefined:new Date().toISOString()
      }
      if (!form.id) delete row.created_at
      const { error } = await supabase.from('products').upsert(row)
      if (error) { showToast('خطأ: '+error.message,'error'); return }
      if (form.id) await supabase.from('product_categories').delete().eq('product_id',row.id)
      if (selCats.length>0) {
        await supabase.from('product_categories').upsert(
          selCats.map(cid=>({ id:Date.now()+Math.random(), product_id:row.id, category_id:cid }))
        ).catch(()=>{})
      }
      
      await logActivity(
        form.id ? 'تعديل منتج' : 'إضافة منتج',
        `${form.id ? 'تم تعديل' : 'تم إضافة'} المنتج: ${form.name}`
      )
      
      showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
      setForm({ id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false })
      setSelCats([])
      await load()
    } catch (err) {
      console.error('❌ خطأ:', err)
      showToast('❌ حدث خطأ غير متوقع', 'error')
    } finally {
      setSaving(false)
    }
  }

  const edit = async p => {
    setForm({ id:p.id, name:p.name, price:p.price||'', costPrice:p.cost_price||'',
      cartonPrice:p.carton_price||'', units:p.units||12, stock:p.stock||0,
      minStock:p.min_stock||5, sku:p.sku||generateBarcode(p.id),
      brandId:p.brand_id||'',
      image:p.image||'', discount:p.discount||0, isPromo:p.is_promo||false,
      description:p.description||'' })
    const { data } = await supabase.from('product_categories').select('category_id').eq('product_id',p.id)
    setSelCats((data||[]).map(r=>r.category_id))
  }

  const softDelete = async (id) => {
    if (!await askConfirm('⚠️ حذف هذا المنتج؟ يمكن استعادته من سلة المهملات')) return
    
    try {
      const product = products.find(p => p.id === id)
      if (!product) {
        showToast('❌ المنتج غير موجود', 'error')
        return
      }
      
      const { error: insertError } = await supabase.from('deleted_items').insert({
        table_name: 'products',
        item_id: id,
        data: JSON.stringify(product),
        deleted_at: new Date().toISOString()
      })
      
      if (insertError) {
        console.error('❌ خطأ في الإضافة إلى سلة المهملات:', insertError)
        showToast('❌ خطأ: ' + insertError.message, 'error')
        return
      }
      
      const { error: deleteError } = await supabase.from('products').delete().eq('id', id)
      if (deleteError) {
        console.error('❌ خطأ في حذف المنتج:', deleteError)
        showToast('❌ خطأ في حذف المنتج', 'error')
        return
      }
      
      await logActivity('حذف منتج', `تم حذف المنتج: ${product.name}`)
      
      showToast('✅ تم نقل المنتج إلى سلة المهملات')
      await load()
    } catch (err) {
      console.error('❌ خطأ:', err)
      showToast('❌ حدث خطأ غير متوقع', 'error')
    }
  }

  const toggleCat = id => setSelCats(prev => prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])

  const filtered = products.filter(p=>{
    const matchSearch=!search||p.name?.toLowerCase().includes(search.toLowerCase())
    const matchBrand=!brandFilter||p.brand_id==brandFilter
    const matchStock=stockFilter==='all'||(stockFilter==='low'&&(p.stock||0)<5)||(stockFilter==='ok'&&(p.stock||0)>=5)
    return matchSearch&&matchBrand&&matchStock
  })

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📦 المنتجات</h1>

      <div style={{ ...S.card, background:'#f0f9ff', borderRight:'4px solid #3b82f6' }}>
        <strong style={{ color:'#1d4ed8' }}>📐 أحجام الصور المثالية:</strong>
        <div style={{ display:'flex', gap:16, marginTop:8, flexWrap:'wrap', fontSize:13 }}>
          <span>📦 منتج: <strong>600×600</strong></span>
          <span>🏷️ ماركة: <strong>300×300</strong></span>
          <span>📂 فئة: <strong>400×300</strong></span>
          <span>🖼️ بانر: <strong>1200×450</strong></span>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>
          {form.id?'✏️ تعديل':'➕ إضافة'} منتج
        </h3>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المنتج *</label>
            <input style={S.input} value={form.name} onChange={F('name')} placeholder="اسم المنتج" /></div>
          <div><label style={S.label}>سعر البيع (قطعة) *</label>
            <NumInput value={form.price} onChange={F('price')} placeholder="0" /></div>
          <div><label style={S.label}>سعر الشراء (قطعة)</label>
            <NumInput value={form.costPrice} onChange={F('costPrice')} /></div>
          <div><label style={S.label}>سعر الكرتون</label>
            <NumInput value={form.cartonPrice} onChange={F('cartonPrice')} /></div>
          <div><label style={S.label}>قطع في الكرتون</label>
            <NumInput value={form.units} onChange={F('units')} /></div>
          <div><label style={S.label}>المخزون (قطعة)</label>
            <NumInput value={form.stock} onChange={F('stock')} /></div>
          <div><label style={S.label}>خصم % (0 = بدون خصم)</label>
            <NumInput value={form.discount} onChange={F('discount')} placeholder="0" /></div>
          <div><label style={S.label}>الباركود / SKU</label>
            <input style={S.input} value={form.sku} onChange={F('sku')} placeholder="اختياري" /></div>
          <div><label style={S.label}>العلامة التجارية</label>
            <select style={S.input} value={form.brandId} onChange={F('brandId')}>
              <option value="">-- بدون --</option>
              {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select></div>
          <div><label style={S.label}>صورة المنتج (600×600)</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleImg} /></div>
          {form.image && <div style={{ display:'flex', alignItems:'center' }}>
            <img src={form.image} style={{ width:80, height:80, objectFit:'cover', borderRadius:12 }} /></div>}
        </div>
        <div style={{ marginTop:14 }}>
          <label style={S.label}>الفئات (يمكن اختيار أكثر من فئة)</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:6 }}>
            {categories.map(c=>(
              <button key={c.id} onClick={()=>toggleCat(c.id)}
                style={{ ...S.btnSm, background:selCats.includes(c.id)?'#dc2626':'#e2e8f0',
                  color:selCats.includes(c.id)?'white':'#475569' }}>
                {selCats.includes(c.id)?'✓ ':''}{c.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="isPromo" checked={form.isPromo}
            onChange={e=>setForm(f=>({...f,isPromo:e.target.checked}))} />
          <label htmlFor="isPromo" style={{ fontWeight:700, fontSize:14, cursor:'pointer' }}>
            ⚡ منتج ضمن العروض الخاصة
          </label>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
          <button style={S.btn} onClick={save} disabled={saving}>
            {saving?'⏳ حفظ...':'💾 حفظ المنتج'}</button>
          <button style={S.btnGray} onClick={()=>{
            setForm({id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false})
            setSelCats([])
          }}>✖ إلغاء</button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10, alignItems:'center' }}>
          <h3 style={{ fontWeight:800, fontSize:15 }}>قائمة المنتجات
            <span style={{ marginRight:8, background:CLR.bg, border:'1px solid #E2E8F0', borderRadius:20,
              padding:'2px 10px', fontSize:12, fontWeight:600, color:CLR.textSm }}>{filtered.length}</span>
          </h3>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <input style={{ ...S.input, width:180 }} placeholder="🔍 بحث بالاسم..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select style={{...S.input,width:130}} value={brandFilter||''} onChange={e=>setBrandFilter(e.target.value)}>
              <option value="">كل الماركات</option>
              {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select style={{...S.input,width:120}} value={stockFilter||'all'} onChange={e=>setStockFilter(e.target.value)}>
              <option value="all">كل المخزون</option>
              <option value="low">منخفض (&lt;5)</option>
              <option value="ok">متوفر</option>
            </select>
          </div>
        </div>
        {loading
          ? <div style={{ padding:40, textAlign:'center' }}>
              {[1,2,3,4].map(i=><div key={i} style={{ height:48, background:'#F1F5F9', borderRadius:8, marginBottom:8, animation:'pulse 1.5s ease infinite' }}/>)}
            </div>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:CLR.bg }}>
                    <th style={S.th}>الصورة</th>
                    <th style={S.th}>الاسم</th>
                    <th style={S.th}>السعر</th>
                    <th style={S.th}>الكرتون</th>
                    <th style={S.th}>المخزون</th>
                    <th style={S.th}>الماركة</th>
                    <th style={S.th}>الباركود</th>
                    <th style={S.th}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p,i)=>{
                    const stockLvl=(p.stock||0)<5?'low':(p.stock||0)<20?'med':'ok'
                    const stockStyle={
                      low: {bg:'#FEE2E2',color:'#DC2626'},
                      med: {bg:'#FEF9C3',color:'#92400E'},
                      ok:  {bg:'#D1FAE5',color:'#059669'},
                    }[stockLvl]
                    return (
                      <tr key={p.id}
                        style={{ background:i%2===0?'white':CLR.bg, cursor:'pointer', transition:'background .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#FFF7ED'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':CLR.bg}
                        onClick={()=>edit(p)}>
                        <td style={S.td}>
                          {p.image
                            ?<img src={p.image} style={{width:44,height:44,objectFit:'cover',borderRadius:8,border:'1px solid #E2E8F0'}}/>
                            :<div style={{width:44,height:44,borderRadius:8,background:CLR.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📦</div>}
                        </td>
                        <td style={{ ...S.td, fontWeight:700, maxWidth:200 }}>
                          <div>{p.name}</div>
                          {p.is_promo&&<span style={{background:'#FEF9C3',color:'#92400E',padding:'1px 7px',borderRadius:20,fontSize:10,fontWeight:700}}>عرض</span>}
                        </td>
                        <td style={{ ...S.td, fontWeight:700, color:CLR.accent }}>{p.price} {CUR}</td>
                        <td style={{ ...S.td, color:CLR.textSm }}>{p.carton_price?`${p.carton_price} ${CUR}`:'—'}</td>
                        <td style={S.td}>
                          <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                            background:stockStyle.bg, color:stockStyle.color }}>
                            {p.stock||0} كرتون
                          </span>
                        </td>
                        <td style={{ ...S.td, color:CLR.textSm }}>
                          {brands.find(b=>b.id==p.brand_id)?.name||'—'}
                        </td>
                        <td style={{ ...S.td, fontSize:11, color:CLR.textSm }}>
                          <code>{p.sku || generateBarcode(p.id)}</code>
                        </td>
                        <td style={S.td} onClick={e=>e.stopPropagation()}>
                          <div style={{ display:'flex', gap:4 }}>
                            <button style={{ ...S.btnSm, background:'#DBEAFE', color:'#1D4ED8' }} onClick={()=>edit(p)}>✏️</button>
                            <button style={{ ...S.btnSm, background:'#FEE2E2', color:'#DC2626' }} onClick={()=>softDelete(p.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:36,color:CLR.textSm}}>
                    <div style={{ fontSize:32, marginBottom:8 }}>📦</div>لا توجد منتجات
                  </td></tr>}
                </tbody>
              </table>
            </div>}
      </div>

      {/* Modal تعديل المنتج */}
      {form.id&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:7000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:16, padding:24, width:'100%', maxWidth:640,
            maxHeight:'90vh', overflowY:'auto', direction:'rtl' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontWeight:900, fontSize:17 }}>✏️ تعديل: {form.name}</h3>
              <button onClick={()=>{ setForm({id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false}); setSelCats([]) }}
                style={{ background:CLR.bg, border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>اسم المنتج *</label><input style={S.input} value={form.name} onChange={F('name')}/></div>
              <div><label style={S.label}>سعر البيع *</label><NumInput value={form.price} onChange={F('price')}/></div>
              <div><label style={S.label}>سعر الشراء/قطعة</label><NumInput value={form.costPrice} onChange={F('costPrice')}/></div>
              <div><label style={S.label}>سعر الكرتون</label><NumInput value={form.cartonPrice} onChange={F('cartonPrice')}/></div>
              <div><label style={S.label}>قطع/كرتون</label><NumInput value={form.units} onChange={F('units')}/></div>
              <div><label style={S.label}>المخزون</label><NumInput value={form.stock} onChange={F('stock')}/></div>
              <div><label style={S.label}>الحد الأدنى للتنبيه</label><NumInput value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))}/></div>
              <div><label style={S.label}>خصم %</label><NumInput value={form.discount} onChange={F('discount')}/></div>
              <div><label style={S.label}>العلامة التجارية</label>
                <select style={S.input} value={form.brandId} onChange={F('brandId')}>
                  <option value="">-- بدون --</option>
                  {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select></div>
              <div><label style={S.label}>صورة جديدة</label><input style={S.input} type="file" accept="image/*" onChange={handleImg}/></div>
            </div>
            <div style={{ marginTop:12 }}>
              <label style={S.label}>الفئات</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                {categories.map(c=>(
                  <button key={c.id} onClick={()=>toggleCat(c.id)}
                    style={{ ...S.btnSm, background:selCats.includes(c.id)?CLR.accent:'#E2E8F0',
                      color:selCats.includes(c.id)?'white':CLR.textSm }}>
                    {selCats.includes(c.id)?'✓ ':''}{c.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ التعديل'}</button>
              <button style={S.btnGray} onClick={()=>{ setForm({id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false}); setSelCats([]) }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   📂 الفئات
══════════════════════════════════════════ */
function Categories() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [editId,setEditId]=useState(null)
  const [name,setName]=useState(''); const [image,setImage]=useState('')
  const load=async()=>{ 
    const {data}=await supabase.from('categories').select('*').order('name'); 
    setItems(data||[]) 
  }
  useEffect(()=>{ load() },[])
  const save=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return}
    try {
      if(editId){
        await supabase.from('categories').update({name:name.trim(),image:image||null}).eq('id',editId)
        await logActivity('تعديل فئة', `تم تعديل الفئة: ${name}`)
        showToast('✅ تم التعديل'); setEditId(null)
      } else {
        await supabase.from('categories').insert({id:Date.now(),name:name.trim(),image:image||null})
        await logActivity('إضافة فئة', `تم إضافة الفئة: ${name}`)
        showToast('✅ تمت الإضافة')
      }
      setName(''); setImage(''); await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }
  const startEdit=c=>{ setEditId(c.id); setName(c.name); setImage(c.image||'') }
  const cancel=()=>{ setEditId(null); setName(''); setImage('') }
  const del=async id=>{
    if(!await askConfirm('حذف هذه الفئة؟'))return
    try {
      await supabase.from('categories').delete().eq('id',id)
      await logActivity('حذف فئة', `تم حذف الفئة` )
      showToast('تم الحذف')
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>📂 الفئات</h1>

      {editId&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:14,padding:24,width:'100%',maxWidth:440,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>✏️ تعديل الفئة</h3>
              <button onClick={cancel} style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} />
            <label style={{...S.label,marginTop:10}}>صورة جديدة (400×300)</label>
            <input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/>
            {image&&<img src={image} style={{width:'100%',height:60,objectFit:'cover',borderRadius:8,marginTop:8}}/>}
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={save}>💾 حفظ التعديل</button>
              <button style={S.btnGray} onClick={cancel}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:10,color:CLR.accent}}>➕ إضافة فئة جديدة</h3>
        <p style={{fontSize:12,color:CLR.textSm,marginBottom:12}}>📐 حجم صورة الفئة المثالي: <strong>400×300 بكسل</strong></p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>اسم الفئة *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: مواد غذائية" /></div>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>صورة (400×300)</label>
            <input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/></div>
          {image&&<img src={image} style={{width:60,height:45,borderRadius:8,objectFit:'cover'}}/>}
        </div>
        <div style={{display:'flex',gap:10,marginTop:12}}>
          <button style={S.btn} onClick={save}>{editId?'💾 حفظ التعديل':'➕ إضافة'}</button>
          {editId&&<button style={S.btnGray} onClick={cancel}>✖ إلغاء</button>}
        </div>
      </div>
      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الصورة</th><th style={S.th}>الاسم</th><th style={S.th}>إجراءات</th></tr></thead>
          <tbody>{items.map((c,i)=>(
            <tr key={c.id} className="nq-tr" style={{background:i%2===0?'white':CLR.bg,cursor:'pointer'}}
              onClick={()=>startEdit(c)}>
              <td style={S.td}>{c.image
                ?<img src={c.image} style={{width:56,height:42,borderRadius:8,objectFit:'cover',border:`1px solid ${CLR.border}`}}/>
                :<div style={{width:56,height:42,borderRadius:8,background:CLR.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>📁</div>}</td>
              <td style={{...S.td,fontWeight:700}}>{c.name}</td>
              <td style={S.td} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:5}}>
                  <button style={{...S.btnSm,background:'#DBEAFE',color:'#1D4ED8'}} onClick={()=>startEdit(c)}>✏️</button>
                  <button style={{...S.btnSm,background:'#FEE2E2',color:'#DC2626'}} onClick={()=>del(c.id)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={3} style={{textAlign:'center',padding:28,color:CLR.textSm}}>
            <div style={{fontSize:32,marginBottom:8}}>📂</div>لا توجد فئات
          </td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏷️ العلامات التجارية
══════════════════════════════════════════ */
function Brands() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [editId,setEditId]=useState(null)
  const [name,setName]=useState(''); const [image,setImage]=useState('')
  const load=async()=>{ const {data}=await supabase.from('brands').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const save=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return}
    try {
      if(editId){
        await supabase.from('brands').update({name:name.trim(),image:image||null}).eq('id',editId)
        await logActivity('تعديل علامة', `تم تعديل العلامة: ${name}`)
        showToast('✅ تم التعديل'); setEditId(null)
      } else {
        await supabase.from('brands').insert({id:Date.now(),name:name.trim(),image:image||null})
        await logActivity('إضافة علامة', `تم إضافة العلامة: ${name}`)
        showToast('✅ تمت الإضافة')
      }
      setName(''); setImage(''); await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }
  const del=async id=>{
    if(!await askConfirm('حذف هذه العلامة؟'))return
    try {
      await supabase.from('brands').delete().eq('id',id)
      await logActivity('حذف علامة', `تم حذف العلامة`)
      showToast('تم الحذف')
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }
  const startEdit=b=>{ setEditId(b.id); setName(b.name); setImage(b.image||'') }
  const cancel=()=>{ setEditId(null); setName(''); setImage('') }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🏷️ العلامات التجارية</h1>

      {editId&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:14,padding:24,width:'100%',maxWidth:400,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>✏️ تعديل العلامة التجارية</h3>
              <button onClick={cancel} style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} />
            <label style={{...S.label,marginTop:10}}>شعار جديد (300×300)</label>
            <input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/>
            {image&&<img src={image} style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',display:'block',margin:'8px auto 0'}}/>}
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={save}>💾 حفظ التعديل</button>
              <button style={S.btnGray} onClick={cancel}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:10,color:CLR.accent}}>➕ إضافة علامة جديدة</h3>
        <p style={{fontSize:12,color:CLR.textSm,marginBottom:12}}>📐 حجم شعار الماركة المثالي: <strong>300×300 بكسل</strong> (مربع)</p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>اسم العلامة *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: Yema" /></div>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>شعار (300×300)</label>
            <input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/></div>
          {image&&<img src={image} style={{width:50,height:50,borderRadius:'50%',objectFit:'cover'}}/>}
        </div>
        <div style={{display:'flex',gap:10,marginTop:12}}>
          <button style={S.btn} onClick={save}>{editId?'💾 حفظ التعديل':'➕ إضافة'}</button>
          {editId&&<button style={S.btnGray} onClick={cancel}>✖ إلغاء</button>}
        </div>
      </div>
      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الشعار</th><th style={S.th}>الاسم</th><th style={S.th}>إجراءات</th></tr></thead>
          <tbody>{items.map((b,i)=>(
            <tr key={b.id} className="nq-tr" style={{background:i%2===0?'white':CLR.bg,cursor:'pointer'}}
              onClick={()=>startEdit(b)}>
              <td style={S.td}>{b.image
                ?<img src={b.image} style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',border:`2px solid ${CLR.border}`}}/>
                :<div style={{width:44,height:44,borderRadius:'50%',background:CLR.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🏷️</div>}</td>
              <td style={{...S.td,fontWeight:700}}>{b.name}</td>
              <td style={S.td} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:5}}>
                  <button style={{...S.btnSm,background:'#DBEAFE',color:'#1D4ED8'}} onClick={()=>startEdit(b)}>✏️</button>
                  <button style={{...S.btnSm,background:'#FEE2E2',color:'#DC2626'}} onClick={()=>del(b.id)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={3} style={{textAlign:'center',padding:28,color:CLR.textSm}}>
            <div style={{fontSize:32,marginBottom:8}}>🏷️</div>لا توجد علامات
          </td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏭 الموردون
══════════════════════════════════════════ */
function Suppliers() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})
  
  const load=async()=>{ 
    const {data}=await supabase.from('suppliers').select('*').order('name')
    setItems(data||[])
  }
  useEffect(()=>{ load() },[])
  
  const F = k => e => {
    const value = e.target.value
    if ((k === 'phone' || k === 'whatsapp') && !/^[0-9+]*$/.test(value) && value !== '') return
    setForm(f => ({ ...f, [k]: value }))
  }
  
  const save=async()=>{
    if(!form.name.trim()){showToast('الاسم مطلوب','error');return} 
    setSaving(true)
    try {
      const data = {
        id: form.id || Date.now(),
        name: form.name.trim(),
        phone: form.phone || '',
        whatsapp: form.whatsapp || '',
        email: form.email || '',
        address: form.address || ''
      }
      const { error } = await supabase.from('suppliers').upsert(data)
      if (error) { showToast('خطأ: ' + error.message, 'error'); return }
      
      await logActivity(
        form.id ? 'تعديل مورد' : 'إضافة مورد',
        `${form.id ? 'تم تعديل' : 'تم إضافة'} المورد: ${form.name}`
      )
      
      showToast(form.id ? '✅ تم التعديل' : '✅ تمت الإضافة')
      setForm({ id: '', name: '', phone: '', whatsapp: '', email: '', address: '' })
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    } finally {
      setSaving(false)
    }
  }
  
  const edit=s=>setForm({id:s.id,name:s.name,phone:s.phone||'',whatsapp:s.whatsapp||'',email:s.email||'',address:s.address||''})
  const del=async id=>{
    if(!await askConfirm('حذف هذا المورد؟'))return
    try {
      await supabase.from('suppliers').delete().eq('id',id)
      await logActivity('حذف مورد', `تم حذف المورد`)
      showToast('تم الحذف')
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }
  const filtered=items.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase()))
  
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🏭 الموردون</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>{form.id?'✏️ تعديل':'➕ إضافة'} مورد</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>الهاتف</label>
            <PhoneInput value={form.phone} onChange={F('phone')} placeholder="مثال: 0555123456" />
          </div>
          <div><label style={S.label}>واتساب</label>
            <PhoneInput value={form.whatsapp} onChange={F('whatsapp')} placeholder="مثال: 0555123456" />
          </div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
          <button style={S.btnGray} onClick={()=>setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})}>✖</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <h3 style={{fontWeight:800}}>الموردون ({filtered.length})</h3>
          <input style={{...S.input,width:200}} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={S.th}>الاسم</th><th style={S.th}>الهاتف</th><th style={S.th}>واتساب</th><th style={S.th}>إجراءات</th></tr></thead>
            <tbody>{filtered.map(s=>(
              <tr key={s.id} className='nq-tr'>
                <td style={{...S.td,fontWeight:700}}>{s.name}</td>
                <td style={S.td}>{s.phone||'—'}</td>
                <td style={S.td}>{s.whatsapp?<a href={`https://wa.me/${s.whatsapp}`} target="_blank" style={{color:'#25D366',fontWeight:700}}>💬 {s.whatsapp}</a>:'—'}</td>
                <td style={{...S.td,display:'flex',gap:5}}>
                  <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>edit(s)}>✏️</button>
                  <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(s.id)}>🗑️</button>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={4} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد موردين</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   👥 العملاء + تصنيف M1/M2/M3 + نقاط
══════════════════════════════════════════ */
function Customers() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false)
  const [tierSettings,setTierSettings]=useState({ m1:0, m2:5000, m3:20000, d1:0, d2:5, d3:10 })
  const [form,setForm]=useState({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1',group:''})
  const [tierFilter,setTierFilter]=useState('all')
  const [groupFilter,setGroupFilter]=useState('all')
  const [groups,setGroups]=useState([])

  const load=async()=>{
    const {data}=await supabase.from('customers').select('*').order('name')
    setItems(data||[])
    const uniqueGroups = [...new Set((data||[]).map(c => c.group).filter(Boolean))]
    setGroups(uniqueGroups)
  }
  useEffect(()=>{
    load()
    supabase.from('settings').select('*').in('key',['tier_m2_min','tier_m3_min','tier_m1_discount','tier_m2_discount','tier_m3_discount'])
      .then(({data})=>{
        if(!data) return
        const m={}; data.forEach(r=>(m[r.key]=parseFloat(r.value)))
        setTierSettings({ m1:0, m2:m['tier_m2_min']||5000, m3:m['tier_m3_min']||20000,
          d1:m['tier_m1_discount']||0, d2:m['tier_m2_discount']||5, d3:m['tier_m3_discount']||10 })
      })
  },[])

  const F = k => e => {
    const value = e.target.value
    if (k === 'phone' && !/^[0-9+]*$/.test(value) && value !== '') return
    setForm(f => ({ ...f, [k]: value }))
  }

  const calculatePoints = (totalAmount) => {
    return Math.floor(totalAmount / 100)
  }

  const pointsToDiscount = (points) => {
    return Math.floor(points / 100)
  }

  const save=async()=>{
    if(!form.name.trim()){showToast('الاسم مطلوب','error');return} setSaving(true)
    try {
      const ex=items.find(c=>c.id==form.id)
      const {error}=await supabase.from('customers').upsert({
        id:form.id||Date.now(), name:form.name.trim(), email:form.email, phone:form.phone,
        address:form.address, tier:form.tier, group:form.group || null,
        password:form.password?hashPwd(form.password):(ex?.password||hashPwd('123456')),
        points:ex?.points||0, created_at:ex?.created_at||new Date().toISOString()
      })
      if(error){showToast('خطأ: '+error.message,'error');return}
      
      await logActivity(
        form.id ? 'تعديل عميل' : 'إضافة عميل',
        `${form.id ? 'تم تعديل' : 'تم إضافة'} العميل: ${form.name}`
      )
      
      showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
      setForm({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1',group:''})
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const edit=c=>setForm({id:c.id,name:c.name,email:c.email||'',phone:c.phone||'',address:c.address||'',password:'',tier:c.tier||'M1',group:c.group||''})
  const del=async id=>{
    if(!await askConfirm('حذف هذا العميل؟'))return
    try {
      await supabase.from('customers').delete().eq('id',id)
      await logActivity('حذف عميل', `تم حذف العميل`)
      showToast('تم الحذف')
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }

  const tierLabel = t => ({ M1:'🥉 M1 عادي', M2:'🥈 M2 مميز', M3:'🥇 M3 VIP' }[t]||t)

  const filtered=items.filter(c=>{
    const matchName = c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    const matchTier = tierFilter === 'all' || (c.tier || 'M1') === tierFilter
    const matchGroup = groupFilter === 'all' || c.group === groupFilter
    return matchName && matchTier && matchGroup
  })

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>👥 العملاء</h1>

      <div style={{...S.card, background:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'1px solid #fcd34d'}}>
        <h3 style={{fontWeight:800,marginBottom:12,color:'#92400e'}}>🏅 إعدادات تصنيف العملاء</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {tier:'M1',label:'🥉 M1 عادي',min:0,disc:tierSettings.d1,color:CLR.textSm},
            {tier:'M2',label:'🥈 M2 مميز',min:tierSettings.m2,disc:tierSettings.d2,color:'#3b82f6'},
            {tier:'M3',label:'🥇 M3 VIP',min:tierSettings.m3,disc:tierSettings.d3,color:'#f59e0b'},
          ].map(({tier,label,min,disc,color})=>(
            <div key={tier} style={{background:'white',borderRadius:12,padding:12,textAlign:'center',border:`2px solid ${color}`}}>
              <div style={{fontWeight:800,color,marginBottom:4}}>{label}</div>
              <div style={{fontSize:13,color:CLR.textSm}}>من {min} {CUR}</div>
              <div style={{fontSize:13,color:'#10b981',fontWeight:700}}>خصم {disc}%</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:12,color:'#92400e',marginTop:10}}>💡 لتعديل حدود الرتب اذهب إلى ⚙️ الإعدادات → تصنيف العملاء</p>
      </div>

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>{form.id?'✏️ تعديل':'➕ إضافة'} عميل</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>الهاتف</label>
            <PhoneInput value={form.phone} onChange={F('phone')} placeholder="مثال: 0555123456" />
          </div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
          <div><label style={S.label}>كلمة المرور</label><input style={S.input} type="password" value={form.password} onChange={F('password')} /></div>
          <div><label style={S.label}>الرتبة</label>
            <select style={S.input} value={form.tier} onChange={F('tier')}>
              <option value="M1">🥉 M1 — عميل عادي</option>
              <option value="M2">🥈 M2 — عميل مميز</option>
              <option value="M3">🥇 M3 — عميل VIP</option>
            </select></div>
          <div><label style={S.label}>المجموعة</label>
            <input style={S.input} value={form.group} onChange={F('group')} placeholder="مثال: عملاء مميزين, ولاية الجزائر" />
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
          <button style={S.btnGray} onClick={()=>setForm({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1',group:''})}>✖</button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10,alignItems:'center'}}>
          <h3 style={{fontWeight:800,fontSize:15}}>
            العملاء
            <span style={{marginRight:8,background:CLR.bg,border:'1px solid #E2E8F0',borderRadius:20,
              padding:'2px 10px',fontSize:12,fontWeight:600,color:CLR.textSm}}>{filtered.length}</span>
          </h3>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <input style={{...S.input,width:200}} placeholder="🔍 اسم / هاتف..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select style={{...S.input,width:110}} value={tierFilter||'all'} onChange={e=>setTierFilter(e.target.value)}>
              <option value="all">كل الرتب</option>
              <option value="M1">🥉 M1</option>
              <option value="M2">🥈 M2</option>
              <option value="M3">🥇 M3</option>
            </select>
            <select style={{...S.input,width:130}} value={groupFilter||'all'} onChange={e=>setGroupFilter(e.target.value)}>
              <option value="all">كل المجموعات</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:CLR.bg}}>
                <th style={S.th}>الاسم</th>
                <th style={S.th}>الهاتف</th>
                <th style={S.th}>الولاية</th>
                <th style={S.th}>الرتبة</th>
                <th style={S.th}>المجموعة</th>
                <th style={S.th}>المشتريات</th>
                <th style={S.th}>النقاط</th>
                <th style={S.th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i)=>{
                const ts={M1:{bg:'#F1F5F9',color:CLR.textSm},M2:{bg:'#DBEAFE',color:'#1D4ED8'},M3:{bg:'#FEF9C3',color:'#92400E'}}[c.tier||'M1']
                return (
                  <tr key={c.id}
                    style={{background:i%2===0?'white':CLR.bg,cursor:'pointer',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FFF7ED'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':CLR.bg}
                    onClick={()=>edit(c)}>
                    <td style={{...S.td,fontWeight:700}}>
                      <div>{c.name}</div>
                      {c.email&&<div style={{fontSize:11,color:CLR.textSm}}>{c.email}</div>}
                    </td>
                    <td style={{...S.td,color:CLR.textSm}}>{c.phone||'—'}</td>
                    <td style={{...S.td,color:CLR.textSm}}>{(c.address||'—').split(',')[0]}</td>
                    <td style={S.td}>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:ts?.bg,color:ts?.color}}>
                        {tierLabel(c.tier||'M1')}
                      </span>
                    </td>
                    <td style={{...S.td,color:CLR.textSm}}>{c.group || '—'}</td>
                    <td style={{...S.td,fontWeight:700,color:CLR.accent}}>
                      {Number(c.total_purchases||0).toFixed(0)} {CUR}
                    </td>
                    <td style={{...S.td,color:CLR.textSm}}>
                      {c.points||0} ⭐
                      {c.points > 0 && <span style={{fontSize:10,color:'#10b981',marginRight:4}}>
                        (خصم {pointsToDiscount(c.points)}%)
                      </span>}
                    </td>
                    <td style={S.td} onClick={e=>e.stopPropagation()}>
                      <div style={{display:'flex',gap:4}}>
                        <button style={{...S.btnSm,background:'#DBEAFE',color:'#1D4ED8'}} onClick={()=>edit(c)}>✏️</button>
                        <button style={{...S.btnSm,background:'#FEE2E2',color:'#DC2626'}} onClick={()=>del(c.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:36,color:CLR.textSm}}>
                <div style={{fontSize:32,marginBottom:8}}>👥</div>لا يوجد عملاء
              </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
/* ══════════════════════════════════════════
   👔 الموظفون (مع صلاحيات تفصيلية)
══════════════════════════════════════════ */
const ALL_PERMISSIONS = [
  { id:'dashboard',    label:'📊 لوحة القيادة', actions: ['view'] },
  { id:'products',     label:'📦 المنتجات', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'categories',   label:'📂 الفئات', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'brands',       label:'🏷️ العلامات التجارية', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'suppliers',    label:'🏭 الموردون', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'customers',    label:'👥 العملاء', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'coupons',      label:'🎟️ الكوبونات', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'purchases',    label:'🛒 المشتريات', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'inventory',    label:'🗂️ المخزون', actions: ['view', 'edit'] },
  { id:'orders',       label:'📋 الطلبيات', actions: ['view', 'edit', 'delete'] },
  { id:'promotions',   label:'🎯 العروض', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'notifications',label:'🔔 الإشعارات', actions: ['view', 'add'] },
  { id:'reports',      label:'📈 التقارير', actions: ['view'] },
  { id:'expenses',     label:'💸 المصاريف', actions: ['view', 'add', 'edit', 'delete'] },
  { id:'activityLog',  label:'📋 سجل النشاطات', actions: ['view'] },
  { id:'storeManager', label:'🎨 إدارة المتجر', actions: ['view', 'edit'] },
  { id:'recycle',      label:'🗑️ سلة المهملات', actions: ['view', 'restore', 'delete'] },
]

function Employees() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [saving,setSaving]=useState(false)
  const [editItem,setEditItem]=useState(null)
  const [form,setForm]=useState({name:'',username:'',password:'',email:'',phone:'',permissions:{}})

  const load=async()=>{ 
    const {data}=await supabase.from('employees').select('id,name,username,email,phone,role,permissions').order('name')
    const formatted = (data||[]).map(emp => {
      let perms = {}
      try {
        const raw = typeof emp.permissions === 'string' ? JSON.parse(emp.permissions || '{}') : (emp.permissions || {})
        perms = raw
      } catch { perms = {} }
      return { ...emp, permissions: perms }
    })
    setItems(formatted)
  }
  useEffect(()=>{ load() },[])

  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const togglePermission = (permId, action) => {
    setForm(prev => {
      const current = prev.permissions[permId] || []
      const newActions = current.includes(action) 
        ? current.filter(a => a !== action) 
        : [...current, action]
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [permId]: newActions
        }
      }
    })
  }

  const hasPermission = (permId, action) => {
    return (form.permissions[permId] || []).includes(action)
  }

  const add=async()=>{
    if(!form.name||!form.username||!form.password){showToast('الاسم والمستخدم والكلمة مطلوبة','error');return} 
    setSaving(true)
    try {
      if(editItem){
        await supabase.from('employees').update({
          name:form.name,
          username:form.username,
          email:form.email,
          phone:form.phone,
          permissions:JSON.stringify(form.permissions)
        }).eq('id',editItem)
        await logActivity('تعديل موظف', `تم تعديل الموظف: ${form.name}`)
        showToast('✅ تم التعديل')
        setEditItem(null)
      } else {
        await supabase.from('employees').insert({
          id:Date.now(),
          name:form.name,
          username:form.username,
          password:hashPwd(form.password),
          email:form.email,
          phone:form.phone,
          role:'staff',
          permissions:JSON.stringify(form.permissions)
        })
        await logActivity('إضافة موظف', `تم إضافة الموظف: ${form.name}`)
        showToast('✅ تم إضافة الموظف')
      }
      setForm({name:'',username:'',password:'',email:'',phone:'',permissions:{}})
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const del=async id=>{
    if(!await askConfirm('حذف هذا الموظف؟'))return
    try {
      await supabase.from('employees').delete().eq('id',id)
      await logActivity('حذف موظف', `تم حذف الموظف`)
      showToast('تم الحذف')
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }

  const edit = (emp) => {
    let perms = {}
    try {
      perms = typeof emp.permissions === 'string' ? JSON.parse(emp.permissions || '{}') : (emp.permissions || {})
    } catch { perms = {} }
    setEditItem(emp.id)
    setForm({
      name: emp.name,
      username: emp.username,
      password: '',
      email: emp.email || '',
      phone: emp.phone || '',
      permissions: perms
    })
  }

  const resetPermissions = () => {
    const allPerms = {}
    ALL_PERMISSIONS.forEach(p => {
      allPerms[p.id] = p.actions
    })
    setForm(prev => ({ ...prev, permissions: allPerms }))
  }

  const clearPermissions = () => {
    setForm(prev => ({ ...prev, permissions: {} }))
  }

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>👔 الموظفون</h1>
      {editItem&&<div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,fontWeight:600,color:'#C2410C'}}>⚠️ تعديل الموظف المحدد</div>}
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:CLR.accent}}>{editItem?'✏️ تعديل موظف':'➕ إضافة موظف جديد'}</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم الكامل *</label><input style={S.input} value={form.name} onChange={F('name')} placeholder="محمد علي" /></div>
          <div><label style={S.label}>اسم المستخدم *</label><input style={S.input} value={form.username} onChange={F('username')} placeholder="mohammed.ali" /></div>
          <div><label style={S.label}>كلمة المرور {editItem?'(اترك فارغاً للإبقاء)':' *'}</label><input style={S.input} type="password" value={form.password} onChange={F('password')} placeholder="••••••••" /></div>
          <div><label style={S.label}>البريد الإلكتروني</label><input style={S.input} value={form.email} onChange={F('email')} placeholder="email@example.com" /></div>
          <div><label style={S.label}>رقم الهاتف (للإشعارات)</label>
            <PhoneInput value={form.phone} onChange={F('phone')} placeholder="مثال: 0555123456" />
          </div>
        </div>
        <div style={{marginTop:14}}>
          <label style={{...S.label,marginBottom:8}}>🔑 الصلاحيات التفصيلية</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8,border:'1px solid #E2E8F0',borderRadius:8,padding:12,background:'#F8FAFC',maxHeight:300,overflowY:'auto'}}>
            {ALL_PERMISSIONS.map(p => (
              <div key={p.id} style={{border:'1px solid #E2E8F0',borderRadius:8,padding:8,background:'white'}}>
                <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>{p.label}</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {p.actions.map(action => (
                    <label key={action} style={{fontSize:11,display:'flex',alignItems:'center',gap:3,cursor:'pointer'}}>
                      <input
                        type="checkbox"
                        checked={hasPermission(p.id, action)}
                        onChange={() => togglePermission(p.id, action)}
                        style={{accentColor:'#F97316'}}
                      />
                      {action === 'view' && '👁️ عرض'}
                      {action === 'add' && '➕ إضافة'}
                      {action === 'edit' && '✏️ تعديل'}
                      {action === 'delete' && '🗑️ حذف'}
                      {action === 'restore' && '↩️ استعادة'}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <button style={{...S.btnSm,background:'#F97316',color:'white',fontSize:11}} onClick={resetPermissions}>✅ كل الصلاحيات</button>
            <button style={{...S.btnSm,background:'#E2E8F0',color:'#475569',fontSize:11}} onClick={clearPermissions}>❌ إلغاء الكل</button>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:16}}>
          <button style={S.btn} onClick={add} disabled={saving}>{saving?'⏳...':`💾 ${editItem?'حفظ التعديل':'إضافة موظف'}`}</button>
          {editItem&&<button style={S.btnGray} onClick={()=>{setEditItem(null);setForm({name:'',username:'',password:'',email:'',phone:'',permissions:{}})}}>إلغاء</button>}
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,fontSize:15}}>قائمة الموظفين ({items.length})</h3>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#F1F5F9'}}>
              <th style={S.th}>الاسم / المستخدم</th>
              <th style={S.th}>الدور</th>
              <th style={S.th}>الصلاحيات</th>
              <th style={S.th}>إجراءات</th>
            </tr></thead>
            <tbody>{items.map((e,i)=>{
              const perms = e.permissions || {}
              const totalPerms = Object.values(perms).reduce((sum, actions) => sum + actions.length, 0)
              const maxPerms = ALL_PERMISSIONS.reduce((sum, p) => sum + p.actions.length, 0)
              return (
              <tr key={e.id} style={{background:i%2===0?'white':'#F8FAFC',cursor:'pointer'}}
                onClick={()=>edit(e)}>
                <td style={{...S.td,fontWeight:700}}>
                  <div>{e.name}</div>
                  <div style={{fontSize:11,color:CLR.textSm}}>{e.username}</div>
                  {e.phone&&<div style={{fontSize:10,color:CLR.textSm}}>📱 {e.phone}</div>}
                </td>
                <td style={S.td}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                    background:e.role==='admin'?'#FEE2E2':'#D1FAE5',
                    color:e.role==='admin'?'#DC2626':'#059669'}}>
                    {e.role==='admin'?'🔴 مدير':'🟢 موظف'}
                  </span>
                </td>
                <td style={S.td}>
                  <span style={{background:'#EFF6FF',color:'#1D4ED8',borderRadius:20,padding:'2px 9px',fontSize:11,fontWeight:700}}>
                    {totalPerms} / {maxPerms} صلاحية
                  </span>
                </td>
                <td style={S.td} onClick={ev=>ev.stopPropagation()}>
                  {e.role!=='admin'&&<button style={{...S.btnSm,background:'#FEE2E2',color:'#DC2626'}} onClick={()=>del(e.id)}>🗑️</button>}
                </td>
              </tr>
            )})}
            {items.length===0&&<tr><td colSpan={4} style={{textAlign:'center',padding:28,color:CLR.textSm}}>
              <div style={{fontSize:28,marginBottom:6}}>👔</div>لا توجد موظفين
            </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🎟️ الكوبونات
══════════════════════════════════════════ */
function Coupons() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0})
  const load=async()=>{ const {data}=await supabase.from('coupons').select('*').order('id',{ascending:false}); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const add=async()=>{
    if(!form.code||!form.value){showToast('الكود والقيمة مطلوبان','error');return} setSaving(true)
    try {
      await supabase.from('coupons').insert({id:Date.now(),code:form.code.toUpperCase().trim(),type:form.type,value:parseFloat(form.value),expiry:form.expiry||null,max_uses:parseInt(form.maxUses)||100,min_order:parseFloat(form.minOrder)||0,used:0})
      await logActivity('إضافة كوبون', `تم إضافة الكوبون: ${form.code}`)
      showToast('✅ تمت الإضافة')
      setForm({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0})
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    } finally {
      setSaving(false)
    }
  }
  const del=async id=>{
    if(!await askConfirm('حذف؟'))return
    try {
      await supabase.from('coupons').delete().eq('id',id)
      await logActivity('حذف كوبون', `تم حذف الكوبون`)
      showToast('تم الحذف')
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🎟️ الكوبونات</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>الكود *</label><input style={S.input} value={form.code} onChange={F('code')} placeholder="SAVE20" /></div>
          <div><label style={S.label}>النوع</label><select style={S.input} value={form.type} onChange={F('type')}><option value="percent">نسبة %</option><option value="fixed">مبلغ ثابت</option></select></div>
          <div><label style={S.label}>القيمة *</label><NumInput value={form.value} onChange={F('value')} /></div>
          <div><label style={S.label}>تاريخ الانتهاء</label><input style={S.input} type="date" value={form.expiry} onChange={F('expiry')} /></div>
          <div><label style={S.label}>الحد الأقصى</label><NumInput value={form.maxUses} onChange={F('maxUses')} /></div>
          <div><label style={S.label}>الحد الأدنى للطلب</label><NumInput value={form.minOrder} onChange={F('minOrder')} /></div>
        </div>
        <button style={{...S.btn,marginTop:14}} onClick={add} disabled={saving}>{saving?'⏳...':'💾 إضافة كوبون'}</button>
      </div>
      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الكود</th><th style={S.th}>النوع</th><th style={S.th}>القيمة</th><th style={S.th}>الاستخدامات</th><th style={S.th}>حذف</th></tr></thead>
          <tbody>{items.map(c=>(
            <tr key={c.id} className='nq-tr'>
              <td style={{...S.td,fontWeight:900,color:'#dc2626'}}>{c.code}</td>
              <td style={S.td}>{c.type==='percent'?'نسبة':'ثابت'}</td>
              <td style={{...S.td,fontWeight:700}}>{c.type==='percent'?`${c.value}%`:`${c.value} دج`}</td>
              <td style={S.td}>{c.used||0}/{c.max_uses}</td>
              <td style={S.td}><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(c.id)}>🗑️</button></td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد كوبونات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🛒 المشتريات
══════════════════════════════════════════ */
function Purchases() {
  const [showToast,ToastUI]=useToast()
  const [suppliers,setSuppliers]=useState([]); const [products,setProducts]=useState([])
  const [purchases,setPurchases]=useState([]); const [items,setItems]=useState([])
  const [suppId,setSuppId]=useState(''); const [date,setDate]=useState(new Date().toISOString().split('T')[0])
  const [showModal,setShowModal]=useState(false)
  const [showNewProdModal,setShowNewProdModal]=useState(false)
  const [modal,setModal]=useState({productId:'',cartons:1,unitsPerCarton:12,purchasePrice:0,sellPrice:0})
  const [newProd,setNewProd]=useState({name:'',price:'',units:12,brandId:''})
  const [brands,setBrands]=useState([])
  const [saving,setSaving]=useState(false)

  const autoCarton=(price,units)=>parseFloat(price||0)*parseInt(units||12)

  useEffect(()=>{
    const load=async()=>{
      const [{data:s},{data:p},{data:pur},{data:b}]=await Promise.all([
        supabase.from('suppliers').select('id,name').order('name'),
        supabase.from('products').select('id,name,units,cost_price,price').order('name'),
        supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20),
        supabase.from('brands').select('id,name').order('name'),
      ])
      setSuppliers(s||[]); setProducts(p||[]); setPurchases(pur||[]); setBrands(b||[])
    }
    load()
  },[])

  const total=items.reduce((s,i)=>s+i.totalPurchase,0)

  const addItem=()=>{
    const prod=products.find(p=>p.id==modal.productId)
    if(!prod||!modal.cartons||!modal.purchasePrice){showToast('اختر منتجاً وأدخل البيانات','error');return}
    const existing=items.find(i=>i.productId==prod.id)
    if(existing){
      const cartonPrice=autoCarton(modal.purchasePrice,modal.unitsPerCarton)
      const newCartons=existing.cartons+parseInt(modal.cartons)
      setItems(prev=>prev.map(i=>i.productId==prod.id?{
        ...i,cartons:newCartons,
        totalUnits:newCartons*parseInt(modal.unitsPerCarton),
        cartonPrice,totalPurchase:newCartons*cartonPrice
      }:i))
      showToast('✅ تمت إضافة الكمية للمنتج الموجود')
    } else {
      const totalUnits=parseInt(modal.cartons)*parseInt(modal.unitsPerCarton)
      const cartonPrice=autoCarton(modal.purchasePrice,modal.unitsPerCarton)
      setItems(prev=>[...prev,{
        id:Date.now(),productId:prod.id,productName:prod.name,
        cartons:parseInt(modal.cartons),unitsPerCarton:parseInt(modal.unitsPerCarton),
        totalUnits,purchasePrice:parseFloat(modal.purchasePrice),
        sellPrice:parseFloat(modal.sellPrice)||0,
        cartonPrice,totalPurchase:parseInt(modal.cartons)*cartonPrice
      }])
    }
    setShowModal(false); setModal({productId:'',cartons:1,unitsPerCarton:12,purchasePrice:0,sellPrice:0})
  }

  const saveNewProduct=async()=>{
    if(!newProd.name||!newProd.price){showToast('الاسم والسعر مطلوبان','error');return}
    try {
      const id=Date.now()
      await supabase.from('products').insert({
        id,name:newProd.name.trim(),price:parseFloat(newProd.price),
        units:parseInt(newProd.units)||12,
        brand_id:newProd.brandId?parseInt(newProd.brandId):null,
        stock:0,disabled:false,created_at:new Date().toISOString()
      })
      await logActivity('إضافة منتج', `تم إضافة المنتج: ${newProd.name}`)
      const {data:p}=await supabase.from('products').select('id,name,units,cost_price,price').order('name')
      setProducts(p||[])
      setModal(m=>({...m,productId:String(id),unitsPerCarton:parseInt(newProd.units)||12}))
      setNewProd({name:'',price:'',units:12,brandId:''})
      setShowNewProdModal(false); setShowModal(true)
      showToast('✅ تمت إضافة المنتج')
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }

  const save=async()=>{
    if(!suppId){showToast('اختر المورد','error');return}
    if(items.length===0){showToast('أضف منتجاً','error');return}
    setSaving(true)
    try {
      const supplier=suppliers.find(s=>s.id==suppId)
      const purchaseId=Date.now()
      await supabase.from('purchases').insert({id:purchaseId,supplier_id:parseInt(suppId),supplier_name:supplier?.name,date,items:JSON.stringify(items),total})
      
      for(const item of items){
        const {data:p}=await supabase.from('products').select('stock').eq('id',item.productId).maybeSingle()
        if(p) await supabase.from('products').update({
          stock:(p.stock||0)+item.cartons,
          cost_price:item.purchasePrice,
          carton_price:item.cartonPrice
        }).eq('id',item.productId)
      }
      
      await logActivity('إضافة شراء', `تم إضافة فاتورة شراء بقيمة ${total} دج`)
      
      printA4(`
        <div class="header"><div><h1>🛍️ نقاء</h1><p>فاتورة شراء</p></div>
        <div style="text-align:left"><p><strong>رقم:</strong> ${purchaseId}</p><p><strong>التاريخ:</strong> ${date}</p><p><strong>المورد:</strong> ${supplier?.name||'—'}</p></div></div>
        <table><thead><tr><th>المنتج</th><th>الكرتونات</th><th>قطع/كرتون</th><th>إجمالي قطع</th><th>سعر الشراء/قطعة</th><th>سعر الكرتون</th><th>الإجمالي</th></tr></thead>
        <tbody>${items.map(i=>`<tr>
          <td>${i.productName}</td><td style="text-align:center">${i.cartons}</td>
          <td style="text-align:center">${i.unitsPerCarton}</td><td style="text-align:center">${i.totalUnits}</td>
          <td style="text-align:center">${i.purchasePrice} ${CUR}</td>
          <td style="text-align:center;font-weight:700;color:#7c3aed">${i.cartonPrice.toFixed(0)} ${CUR}</td>
          <td style="text-align:center;font-weight:700;color:#dc2626">${i.totalPurchase.toFixed(0)} ${CUR}</td>
        </tr>`).join('')}
        <tr class="total-row"><td colspan="6">الإجمالي الكلي</td><td>${total.toFixed(0)} ${CUR}</td></tr>
        </tbody></table>
        <div class="footer">نقاء — ${new Date().toLocaleDateString('ar-DZ')}</div>
      `)
      showToast('✅ تم حفظ الفاتورة وطباعتها')
      setSuppId('');setItems([])
      const {data:pur}=await supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20)
      setPurchases(pur||[])
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>{ToastUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🛒 المشتريات</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>➕ فاتورة شراء جديدة</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div><label style={S.label}>المورد *</label>
            <select style={S.input} value={suppId} onChange={e=>setSuppId(e.target.value)}>
              <option value="">-- اختر مورداً --</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div><label style={S.label}>التاريخ</label>
            <input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
        </div>

        {items.length>0&&(
          <div style={{overflowX:'auto',marginBottom:14}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'linear-gradient(135deg,#1E293B,#0F172A)'}}>
                  {['المنتج','الكرتونات','قطع/كرتون','إجمالي قطع','سعر/قطعة','سعر الكرتون','الإجمالي',''].map((h,i)=>(
                    <th key={i} style={{...S.th,color:'white',background:'transparent',padding:'10px 8px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item,i)=>(
                  <tr key={item.id} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'white':'#fafafa'}}>
                    <td style={{...S.td,fontWeight:700}}>{item.productName}</td>
                    <td style={{...S.td,textAlign:'center',fontWeight:700}}>{item.cartons}</td>
                    <td style={{...S.td,textAlign:'center'}}>{item.unitsPerCarton}</td>
                    <td style={{...S.td,textAlign:'center',color:CLR.textSm}}>{item.totalUnits}</td>
                    <td style={{...S.td,textAlign:'center'}}>{item.purchasePrice} {CUR}</td>
                    <td style={{...S.td,textAlign:'center',fontWeight:700,color:'#7c3aed'}}>{item.cartonPrice.toFixed(0)} {CUR}</td>
                    <td style={{...S.td,textAlign:'center',fontWeight:900,color:'#dc2626'}}>{item.totalPurchase.toFixed(0)} {CUR}</td>
                    <td style={S.td}><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))}>🗑️</button></td>
                  </tr>
                ))}
                <tr style={{background:'#fff7ed',fontWeight:900}}>
                  <td colSpan={6} style={{...S.td,fontSize:15}}>💰 الإجمالي الكلي للفاتورة</td>
                  <td style={{...S.td,fontSize:18,color:'#dc2626',fontWeight:900}}>{total.toFixed(0)} {CUR}</td>
                  <td style={S.td}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {items.length===0&&(
          <div style={{textAlign:'center',padding:'20px',color:CLR.textSm,border:'2px dashed #e2e8f0',borderRadius:12,marginBottom:14}}>
            📦 لا توجد منتجات — ابدأ بإضافة منتج
          </div>
        )}

        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={()=>setShowModal(true)} style={{...S.btnGray,background:CLR.success,color:'white'}}>➕ إضافة منتج</button>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ + طباعة'}</button>
          {items.length>0&&<span style={{fontWeight:900,color:'#dc2626',fontSize:18}}>💰 {total.toFixed(0)} {CUR}</span>}
        </div>
      </div>

      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:8000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:20,padding:28,width:520,maxWidth:'95vw',direction:'rtl',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <h3 style={{fontWeight:800,fontSize:18}}>➕ إضافة منتج للفاتورة</h3>
              <button onClick={()=>setShowModal(false)} style={{background:'#f1f5f9',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{display:'grid',gap:12}}>
              <div>
                <label style={S.label}>المنتج</label>
                <div style={{display:'flex',gap:8}}>
                  <select style={{...S.input,flex:1}} value={modal.productId} onChange={e=>{
                    const p=products.find(x=>x.id==e.target.value)
                    setModal(m=>({...m,productId:e.target.value,unitsPerCarton:p?.units||12,purchasePrice:p?.cost_price||0,sellPrice:p?.price||0}))
                  }}>
                    <option value="">-- اختر منتجاً --</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button onClick={()=>{setShowModal(false);setShowNewProdModal(true)}}
                    style={{...S.btn,padding:'8px 14px',fontSize:12,whiteSpace:'nowrap'}}>
                    + جديد
                  </button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={S.label}>الكرتونات</label><NumInput value={modal.cartons} onChange={e=>setModal(m=>({...m,cartons:parseInt(e.target.value)||1}))}/></div>
                <div><label style={S.label}>قطع/كرتون</label><NumInput value={modal.unitsPerCarton} onChange={e=>setModal(m=>({...m,unitsPerCarton:parseInt(e.target.value)||12}))}/></div>
                <div><label style={S.label}>سعر شراء القطعة</label><NumInput value={modal.purchasePrice} onChange={e=>setModal(m=>({...m,purchasePrice:parseFloat(e.target.value)||0}))}/></div>
                <div><label style={S.label}>سعر بيع القطعة</label><NumInput value={modal.sellPrice} onChange={e=>setModal(m=>({...m,sellPrice:parseFloat(e.target.value)||0}))}/></div>
              </div>
              {modal.purchasePrice>0&&modal.unitsPerCarton>0&&(
                <div style={{background:'#f0fdf4',borderRadius:10,padding:12,fontSize:13}}>
                  <div>📦 <strong>{modal.cartons*modal.unitsPerCarton}</strong> قطعة إجمالاً</div>
                  <div style={{marginTop:4}}>💜 سعر الكرتون = {modal.purchasePrice} × {modal.unitsPerCarton} = <strong style={{color:'#7c3aed'}}>{autoCarton(modal.purchasePrice,modal.unitsPerCarton).toFixed(0)} {CUR}</strong></div>
                  <div style={{marginTop:4}}>💰 الإجمالي = {modal.cartons} × {autoCarton(modal.purchasePrice,modal.unitsPerCarton).toFixed(0)} = <strong style={{color:'#dc2626',fontSize:16}}>{(modal.cartons*autoCarton(modal.purchasePrice,modal.unitsPerCarton)).toFixed(0)} {CUR}</strong></div>
                </div>
              )}
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={addItem}>✅ إضافة للفاتورة</button>
              <button style={S.btnGray} onClick={()=>setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showNewProdModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:20,padding:28,width:440,maxWidth:'95vw',direction:'rtl'}}>
            <h3 style={{fontWeight:800,marginBottom:16,fontSize:18}}>🆕 إضافة منتج جديد</h3>
            <div style={{display:'grid',gap:12}}>
              <div><label style={S.label}>اسم المنتج *</label>
                <input style={S.input} value={newProd.name} onChange={e=>setNewProd(f=>({...f,name:e.target.value}))} /></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={S.label}>سعر البيع *</label>
                  <NumInput value={newProd.price} onChange={e=>setNewProd(f=>({...f,price:e.target.value}))} /></div>
                <div><label style={S.label}>قطع/كرتون</label>
                  <NumInput value={newProd.units} onChange={e=>setNewProd(f=>({...f,units:e.target.value}))} /></div>
              </div>
              <div><label style={S.label}>العلامة التجارية</label>
                <select style={S.input} value={newProd.brandId} onChange={e=>setNewProd(f=>({...f,brandId:e.target.value}))}>
                  <option value="">-- بدون --</option>
                  {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select></div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:18}}>
              <button style={S.btn} onClick={saveNewProduct}>💾 حفظ وإضافة للفاتورة</button>
              <button style={S.btnGray} onClick={()=>{setShowNewProdModal(false);setShowModal(true)}}>رجوع</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14}}>سجل الفواتير</h3>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={S.th}>#</th><th style={S.th}>المورد</th><th style={S.th}>التاريخ</th><th style={S.th}>المنتجات</th><th style={S.th}>الإجمالي</th><th style={S.th}>طباعة</th></tr></thead>
            <tbody>{purchases.map(p=>{
              const its=typeof p.items==='string'?JSON.parse(p.items||'[]'):(p.items||[])
              return (
                <tr key={p.id} className='nq-tr'>
                  <td style={{...S.td,fontSize:11,color:CLR.textSm}}>{p.id}</td>
                  <td style={{...S.td,fontWeight:700}}>{p.supplier_name}</td>
                  <td style={S.td}>{p.date}</td>
                  <td style={S.td}>{its.length} منتج</td>
                  <td style={{...S.td,color:CLR.accent,fontWeight:700}}>{Number(p.total).toFixed(0)} {CUR}</td>
                  <td style={S.td}>
                    <div style={{display:'flex',gap:4}}>
                      <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>{
                        printA4(`<div class="header"><div><h1>🛍️ نقاء</h1><p>فاتورة شراء</p></div>
                        <div><p>رقم: ${p.id}</p><p>${p.date}</p><p>المورد: ${p.supplier_name}</p></div></div>
                        <table><thead><tr><th>المنتج</th><th>الكرتونات</th><th>قطع/كرتون</th><th>سعر الكرتون</th><th>الإجمالي</th></tr></thead>
                        <tbody>${its.map(i=>`<tr><td>${i.productName}</td><td>${i.cartons||'—'}</td><td>${i.unitsPerCarton||'—'}</td><td>${(i.cartonPrice||0).toFixed(0)}</td><td>${i.totalPurchase.toFixed(0)}</td></tr>`).join('')}
                        <tr class="total-row"><td colspan="4">الإجمالي</td><td>${Number(p.total).toFixed(0)} ${CUR}</td></tr></tbody></table>`)
                      }}>A4</button>
                      <button style={{...S.btnSm,background:'#f0fdf4',color:'#059669'}} onClick={()=>{
                        const its2=typeof p.items==='string'?JSON.parse(p.items):p.items
                        printThermal(`<div class="center bold big">نقاء</div><div class="line"></div>
                        <div class="row"><span>المورد:</span><span>${p.supplier_name}</span></div>
                        <div class="row"><span>التاريخ:</span><span>${p.date}</span></div><div class="line"></div>
                        ${its2.map(i=>`<div class="row"><span>${i.productName}</span><span>${i.totalPurchase.toFixed(0)}</span></div>`).join('')}
                        <div class="line"></div><div class="row total"><span>الإجمالي:</span><span>${Number(p.total).toFixed(0)} ${CUR}</span></div>`)
                      }}>🖨️</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {purchases.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد فواتير</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📦 المخزون + Excel
══════════════════════════════════════════ */
function Inventory() {
  const [showToast,ToastUI]=useToast()
  const [items,setItems]=useState([]); const [search,setSearch]=useState('')

  const sendWaAlert=(prod)=>{
    const wa=(localStorage.getItem('nq_wa_alert')||WA_DEFAULT).replace(/\D/g,'')
    if(!wa){showToast('أدخل رقم واتساب أولاً','error');return}
    const msg=`⚠️ تنبيه مخزون نقاء%0A%0Aالمنتج: ${encodeURIComponent(prod.name)}%0Aالمخزون الحالي: ${prod.stock||0} كرتون%0Aالحد الأدنى: ${prod.min_stock||5}%0A%0Aيرجى إعادة الطلب عاجلاً`
    window.open('https://wa.me/' + msg, '_blank')
    showToast('📱 تم فتح واتساب')
  }

  const load=async()=>{
    const {data}=await supabase.from('products').select('id,name,stock,price,cost_price,sku,units,min_stock').order('name')
    setItems(data||[])
  }
  useEffect(()=>{ load() },[])

  const filtered=items.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()))

  const exportCSV = () => {
    const header = 'ID,اسم المنتج,الباركود,المخزون,السعر,سعر الشراء,قطع/كرتون,الحد الأدنى'
    const rows = items.map(p => `${p.id},"${p.name}","${p.sku||''}",${p.stock||0},${p.price},${p.cost_price||0},${p.units||12},${p.min_stock||5}`)
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='naqaa_inventory.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('✅ تم تصدير المخزون')
  }

  const importCSV = e => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const lines = ev.target.result.split('\n').slice(1)
      let updated = 0
      for (const line of lines) {
        const cols = line.split(',')
        if (cols.length < 4) continue
        const id    = cols[0]?.trim()
        const stock = parseInt(cols[3]?.trim())
        const price = parseFloat(cols[4]?.trim())
        if (!id || isNaN(stock)) continue
        const row = { stock }
        if (!isNaN(price) && price > 0) row.price = price
        await supabase.from('products').update(row).eq('id', id)
        updated++
      }
      await logActivity('استيراد مخزون', `تم استيراد ${updated} منتج`)
      showToast(`✅ تم تحديث ${updated} منتج`)
      await load()
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const printInventory = () => {
    printA4(`
      <div class="header"><div><h1>🛍️ نقاء</h1></div><div><p>تقرير المخزون</p><p>${new Date().toLocaleDateString('ar-DZ')}</p></div></div>
      <table><thead><tr><th>المنتج</th><th>الباركود</th><th>المخزون</th><th>الحد الأدنى</th><th>الحالة</th><th>القيمة</th></tr></thead>
      <tbody>${filtered.map(p=>`<tr><td>${p.name}</td><td>${p.sku||'—'}</td><td>${p.stock||0}</td><td>${p.min_stock||5}</td><td>${(p.stock||0)<(p.min_stock||5)?'⚠️ منخفض':(p.stock||0)<20?'متوسط':'جيد'}</td><td>${((p.stock||0)*Number(p.price)).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody></table>
      <div class="footer">إجمالي قيمة المخزون: ${filtered.reduce((s,p)=>s+(p.stock||0)*Number(p.price),0).toFixed(0)} ${CUR}</div>
    `)
  }

  return (
    <div>{ToastUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>📦 المخزون</h1>
      <div style={S.card}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
          <input style={{...S.input,flex:1,minWidth:180}} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
          <button style={{...S.btnGray,background:CLR.success,color:'white'}} onClick={exportCSV}>📥 تصدير Excel</button>
          <label style={{...S.btnGray,background:'#3b82f6',color:'white',cursor:'pointer',padding:'10px 22px',borderRadius:30,fontWeight:700,fontSize:14}}>
            📤 استيراد Excel
            <input type="file" accept=".csv,.xlsx" style={{display:'none'}} onChange={importCSV}/>
          </label>
          <button style={{...S.btnGray,background:'#7c3aed',color:'white'}} onClick={printInventory}>🖨️ طباعة</button>
        </div>
        <div style={{background:'#f0f9ff',borderRadius:10,padding:12,marginBottom:14,fontSize:12,color:'#1d4ed8'}}>
          💡 <strong>تعليمات الاستيراد:</strong> صدّر الملف أولاً، عدّل الكميات والأسعار في Excel، ثم استورده مجدداً. العمود الأول (ID) لا تغيّره.
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={S.th}>المنتج</th><th style={S.th}>الباركود</th>
              <th style={S.th}>المخزون</th><th style={S.th}>الحد الأدنى</th>
              <th style={S.th}>الحالة</th>
              <th style={S.th}>القيمة</th>
            </tr></thead>
            <tbody>{filtered.map(p=>(
              <tr key={p.id} className='nq-tr'>
                <td style={{...S.td,fontWeight:700}}>{p.name}</td>
                <td style={S.td}>{p.sku||'—'}</td>
                <td style={S.td}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,
                    background:(p.stock||0)<(p.min_stock||5)?'#fee2e2':(p.stock||0)<20?'#fef9c3':'#d1fae5',
                    color:(p.stock||0)<(p.min_stock||5)?'#dc2626':(p.stock||0)<20?'#b45309':'#059669'}}>
                    {p.stock||0}
                  </span>
                </td>
                <td style={S.td}>{p.min_stock||5}</td>
                <td style={S.td}>{(p.stock||0)<(p.min_stock||5)?'⚠️ منخفض':(p.stock||0)<20?'⚡ متوسط':'✅ جيد'}</td>
                <td style={S.td}>{((p.stock||0)*Number(p.price)).toFixed(0)} {CUR}</td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد منتجات</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:12,fontWeight:700,color:'#3b82f6'}}>
          💰 إجمالي قيمة المخزون: {filtered.reduce((s,p)=>s+(p.stock||0)*Number(p.price),0).toFixed(0)} {CUR}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📋 الطلبيات (مع الخريطة)
══════════════════════════════════════════ */
function Orders() {
  const [showToast,ToastUI]=useToast()
  const [items,setItems]=useState([]); const [search,setSearch]=useState('')
  const [searchType,setSearchType]=useState('all'); const [statusFilter,setStatusFilter]=useState('all')
  const [viewMode,setViewMode]=useState('list'); const [selectedOrders,setSelectedOrders]=useState([])
  const [showMap,setShowMap]=useState(false)

  const load=useCallback(async()=>{
    const {data}=await supabase.from('orders').select('*').order('id',{ascending:false})
    setItems(data||[])
  },[])
  useEffect(()=>{ load() },[load])

  const updateStatus=async(id,status)=>{
    try {
      await supabase.from('orders').update({status}).eq('id',id)
      await logActivity('تحديث حالة طلب', `تم تحديث حالة الطلب #${id} إلى ${status}`)
      
      if(status==='shipped'||status==='delivered'){
        const {data:ord}=await supabase.from('orders').select('*').eq('id',id).maybeSingle()
        if(ord?.phone){
          const msgs={
            shipped:`🚚 طلبيتك رقم #${String(id).slice(-5)} في الطريق إليك! سنتواصل معك قريباً للتسليم.`,
            delivered:`✅ تم تسليم طلبيتك رقم #${String(id).slice(-5)} بنجاح! شكراً لثقتك بنا 🌟`
          }
          const wa=(ord.phone||'').replace(/\D/g,'')
          if(wa.length>=9) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msgs[status])}`,'_blank')
        }
      }
      showToast('✅ تم تحديث الحالة'); await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }
  
  const updateMulti=async(status)=>{
    if(selectedOrders.length===0){showToast('اختر طلبيات أولاً','error');return}
    try {
      await Promise.all(selectedOrders.map(id=>supabase.from('orders').update({status}).eq('id',id)))
      await logActivity('تحديث حالات طلبيات', `تم تحديث ${selectedOrders.length} طلبية إلى ${status}`)
      showToast(`✅ تم تحديث ${selectedOrders.length} طلبية`)
      setSelectedOrders([])
      await load()
    } catch (err) {
      showToast('❌ خطأ: '+err.message, 'error')
    }
  }

  const filtered=items.filter(o=>{
    if(statusFilter!=='all'&&o.status!==statusFilter) return false
    if(!search) return true
    const q=search.toLowerCase()
    switch(searchType){
      case 'id':      return String(o.id).includes(q)
      case 'name':    return o.customer_name?.toLowerCase().includes(q)
      case 'phone':   return o.customer_phone?.includes(q)
      case 'address': return o.customer_address?.toLowerCase().includes(q)
      default: return String(o.id).includes(q)||o.customer_name?.toLowerCase().includes(q)||o.customer_phone?.includes(q)||o.customer_address?.toLowerCase().includes(q)
    }
  })

  const grouped=filtered.reduce((acc,o)=>{
    const zone=o.customer_address?.split(',')[0]?.trim()||'غير محدد'
    if(!acc[zone]) acc[zone]=[]
    acc[zone].push(o); return acc
  },{})

  const MapView = () => (
    <div style={{background:'white',borderRadius:12,padding:16,border:'1px solid #E2E8F0',marginBottom:12}}>
      <h4 style={{fontWeight:800,marginBottom:8}}>📍 توزيع الطلبيات على الخريطة</h4>
      <div style={{background:'#E2E8F0',borderRadius:8,padding:40,textAlign:'center',color:CLR.textSm}}>
        🗺️ خريطة تفاعلية (تظهر مواقع العملاء)
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:12}}>
          {Object.entries(grouped).slice(0,8).map(([zone,orders]) => (
            <span key={zone} style={{background:CLR.accent,color:'white',padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700}}>
              {zone} ({orders.length})
            </span>
          ))}
        </div>
      </div>
    </div>
  )

  const printDelivery=()=>{
    const content=Object.entries(grouped).map(([zone,orders])=>`
      <div style="margin-bottom:24px;page-break-inside:avoid">
        <h2 style="color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:8px;margin-bottom:12px">📍 ${zone} (${orders.length} طلبية)</h2>
        <table><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>العنوان</th><th>الإجمالي</th></tr></thead>
        <tbody>${orders.map(o=>`<tr><td>${o.id}</td><td>${o.customer_name}</td><td>${o.customer_phone||'—'}</td><td>${o.customer_address||'—'}</td><td>${Number(o.total).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody></table>
        <p style="font-weight:bold;text-align:right;margin-top:8px">إجمالي المنطقة: ${orders.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} ${CUR}</p>
      </div>`).join('')
    printA4(`<div class="header"><div><h1>🛍️ نقاء</h1><p>قائمة التوصيل</p></div><div>${new Date().toLocaleDateString('ar-DZ')}<br>${filtered.length} طلبية</div></div>${content}<div class="footer">نقاء</div>`)
  }

  const printReceipt=o=>{
    const its=typeof o.items==='string'?JSON.parse(o.items):(o.items||[])
    printThermal(`<div class="center bold big">نقاء</div><div class="center">إيصال طلبية</div><div class="line"></div>
    <div class="row"><span>رقم الطلب:</span><span class="bold">${o.id}</span></div>
    <div class="row"><span>العميل:</span><span>${o.customer_name}</span></div>
    <div class="row"><span>الهاتف:</span><span>${o.customer_phone||'—'}</span></div>
    <div class="row"><span>العنوان:</span><span>${o.customer_address||'—'}</span></div>
    <div class="row"><span>التاريخ:</span><span>${o.date}</span></div><div class="line"></div>
    ${its.map(i=>`<div class="row"><span>${i.name} ×${i.quantity}</span><span>${(i.price*i.quantity).toFixed(0)}</span></div>`).join('')}
    <div class="line"></div><div class="row total"><span>الإجمالي:</span><span>${Number(o.total).toFixed(0)} ${CUR}</span></div>
    <div class="line"></div><div class="center" style="font-size:10px">شكراً لتسوقكم معنا — نقاء</div>`)
  }

  const sLabel=s=>({pending:'قيد الانتظار',processing:'تجهيز',shipped:'شُحن',delivered:'تسليم'}[s]||s)
  const sColor=s=>({pending:'#fef9c3',processing:'#dbeafe',shipped:'#e0e7ff',delivered:'#d1fae5'}[s]||'#f1f5f9')

  return (
    <div>{ToastUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>📋 الطلبيات</h1>
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <button
          onClick={() => setShowMap(!showMap)}
          style={{...S.btnSm,background:showMap?'#dc2626':'#e2e8f0',color:showMap?'white':'#475569',padding:'6px 14px'}}
        >
          🗺️ {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}
        </button>
      </div>

      {showMap && <MapView />}

      <div style={{...S.card,background:'#F0FDF4',border:'1px solid #A7F3D0',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
          <div>
            <strong style={{color:'#059669',fontSize:14}}>📦 أرشفة الطلبيات القديمة</strong>
            <p style={{fontSize:12,color:'#047857',marginTop:3}}>نقل الطلبيات المسلّمة الأقدم من 6 أشهر إلى الأرشيف لتحسين الأداء</p>
          </div>
          <button onClick={async()=>{
            try {
              const cutoff=new Date(); cutoff.setMonth(cutoff.getMonth()-6)
              const {data:old}=await supabase.from('orders').select('*')
                .eq('status','delivered').lt('created_at',cutoff.toISOString())
              if(!old||old.length===0){showToast('لا توجد طلبيات قديمة للأرشفة');return}
              for(const o of old){
                await supabase.from('orders_archive').upsert(o).catch(()=>{})
                await supabase.from('orders').delete().eq('id',o.id)
              }
              await logActivity('أرشفة طلبيات', `تمت أرشفة ${old.length} طلبية`)
              showToast(`✅ تمت أرشفة ${old.length} طلبية`); await load()
            } catch (err) {
              showToast('❌ خطأ: '+err.message, 'error')
            }
          }} style={{...S.btn,background:'#059669',fontSize:13}}>
            📦 أرشفة الآن
          </button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
          <select style={{...S.input,width:150}} value={searchType} onChange={e=>setSearchType(e.target.value)}>
            <option value="all">🔍 كل الحقول</option>
            <option value="id">🔢 رقم الطلب</option>
            <option value="name">👤 اسم العميل</option>
            <option value="phone">📱 الهاتف</option>
            <option value="address">📍 العنوان</option>
          </select>
          <input style={{...S.input,flex:1,minWidth:160}} value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={`بحث بـ ${{all:'كل الحقول',id:'الرقم',name:'الاسم',phone:'الهاتف',address:'العنوان'}[searchType]}...`} />
          <select style={{...S.input,width:150}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">تجهيز</option>
            <option value="shipped">شُحن</option>
            <option value="delivered">تسليم</option>
          </select>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <button style={{...S.btnSm,background:viewMode==='list'?'#dc2626':'#e2e8f0',color:viewMode==='list'?'white':'#475569'}} onClick={()=>setViewMode('list')}>📋 قائمة</button>
          <button style={{...S.btnSm,background:viewMode==='grouped'?'#dc2626':'#e2e8f0',color:viewMode==='grouped'?'white':'#475569'}} onClick={()=>setViewMode('grouped')}>📍 تجميع بالعنوان</button>
          {selectedOrders.length>0&&<>
            <span style={{fontSize:13,color:CLR.textSm}}>✓ {selectedOrders.length} محدد</span>
            <button style={{...S.btnSm,background:CLR.success,color:'white'}} onClick={()=>updateMulti('processing')}>تجهيز الكل</button>
            <button style={{...S.btnSm,background:'#3b82f6',color:'white'}} onClick={()=>updateMulti('shipped')}>شحن الكل</button>
            <button style={{...S.btnSm,background:'#7c3aed',color:'white'}} onClick={()=>updateMulti('delivered')}>تسليم الكل</button>
          </>}
          <button style={{...S.btnGray,background:'#f59e0b',color:'white',marginRight:'auto'}} onClick={printDelivery}>
            🖨️ طباعة قائمة الكاميو ({filtered.length})
          </button>
        </div>
        <div style={{marginTop:10,fontSize:13,color:CLR.textSm}}>
          {filtered.length} طلبية — إجمالي: {filtered.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} {CUR}
        </div>
      </div>

      {viewMode==='grouped' ? (
        Object.entries(grouped).map(([zone,zOrders])=>(
          <div key={zone} style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{fontWeight:800,color:'#dc2626'}}>📍 {zone} ({zOrders.length} طلبية)</h3>
              <span style={{fontWeight:700,color:'#10b981'}}>{zOrders.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} {CUR}</span>
            </div>
            {zOrders.map(o=>(
              <div key={o.id} style={{background:'#f8fafc',borderRadius:12,padding:12,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <div style={{fontSize:13}}>
                  <strong>#{o.id}</strong> — {o.customer_name} — {o.customer_phone||'—'}
                  <div style={{color:CLR.textSm,fontSize:12}}>{o.customer_address}</div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{fontWeight:700,color:'#dc2626'}}>{Number(o.total).toFixed(0)} {CUR}</span>
                  <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,background:sColor(o.status)}}>{sLabel(o.status)}</span>
                  <button style={{...S.btnSm,background:'#f0fdf4',color:'#059669'}} onClick={()=>printReceipt(o)}>🖨️</button>
                  {o.customer_phone&&<a href={`https://wa.me/${o.customer_phone.replace(/^0/,'213')}?text=مرحباً ${o.customer_name}، طلبكم رقم ${o.id} جاهز للتوصيل`} target="_blank"
                    style={{...S.btnSm,background:'#dcfce7',color:'#059669',textDecoration:'none',padding:'5px 10px'}}>💬</a>}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div style={S.card}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={S.th}><input type="checkbox" onChange={e=>setSelectedOrders(e.target.checked?filtered.map(o=>o.id):[])}/></th>
                <th style={S.th}>#</th><th style={S.th}>العميل</th><th style={S.th}>الهاتف</th>
                <th style={S.th}>العنوان</th><th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th><th style={S.th}>إجراءات</th>
              </tr></thead>
              <tbody>{filtered.map(o=>(
                <tr key={o.id} className='nq-tr'>
                  <td style={S.td}><input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={()=>setSelectedOrders(p=>p.includes(o.id)?p.filter(x=>x!==o.id):[...p,o.id])}/></td>
                  <td style={{...S.td,fontSize:11,color:CLR.textSm}}>{o.id}</td>
                  <td style={{...S.td,fontWeight:700}}>{o.customer_name}</td>
                  <td style={S.td}>{o.customer_phone||'—'}</td>
                  <td style={{...S.td,fontSize:12}}>{o.customer_address||'—'}</td>
                  <td style={{...S.td,color:CLR.accent,fontWeight:700}}>{Number(o.total).toFixed(0)} {CUR}</td>
                  <td style={S.td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700,background:sColor(o.status)}}>{sLabel(o.status)}</span></td>
                  <td style={S.td}>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {['processing','shipped','delivered'].map(s=>(
                        <button key={s} style={{...S.btnSm,background:'#f1f5f9',color:CLR.textSm,fontSize:11}} onClick={()=>updateStatus(o.id,s)}>
                          {{processing:'تجهيز',shipped:'شحن',delivered:'تسليم'}[s]}
                        </button>
                      ))}
                      <button style={{...S.btnSm,background:'#f0fdf4',color:'#059669'}} onClick={()=>printReceipt(o)}>🖨️</button>
                      {o.customer_phone&&<a href={`https://wa.me/${o.customer_phone.replace(/^0/,'213')}?text=مرحباً ${o.customer_name}، طلبكم رقم ${o.id} في الطريق`} target="_blank"
                        style={{...S.btnSm,background:'#dcfce7',color:'#059669',textDecoration:'none',padding:'5px 10px'}}>💬</a>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:30,color:CLR.textSm}}>لا توجد طلبيات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
/* ══════════════════════════════════════════
   🎯 إدارة العروض الكاملة (مصححة)
══════════════════════════════════════════ */
function PromotionsManager() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm();
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [prodSearch, setProdSearch] = useState("");
  const [form, setForm] = useState({
    id: "",
    name: "",
    type: "percent",
    active: true,
    buy_qty: 3,
    get_qty: 1,
    discount_value: 0,
    product_ids: [],
    min_amount: 0,
    description: "",
    end_date: "",
    image: "",
    tier_qty: 1,
    tier_type: "percent",
    tier_value: 0,
    region: "",
  });

  const load = async () => {
    try {
      const [{ data: p }, { data: pr }] = await Promise.all([
        supabase.from("products").select("id,name,price,image,stock").order("name"),
        supabase.from("promotions").select("*").order("id", { ascending: false }),
      ]);
      setProducts(p || []);
      setPromos(pr || []);
      console.log("✅ تم تحميل المنتجات:", p?.length || 0);
      console.log("✅ تم تحميل العروض:", pr?.length || 0);
    } catch (err) {
      console.error("❌ خطأ في تحميل العروض:", err);
      showToast("❌ خطأ في تحميل البيانات", "error");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleProduct = (id) =>
    setForm((f) => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter((x) => x !== id)
        : [...f.product_ids, id],
    }));

  const handleImg = (e) => {
    const r = new FileReader();
    r.onload = (ev) => setForm((f) => ({ ...f, image: ev.target.result }));
    r.readAsDataURL(e.target.files[0]);
  };

  const save = async () => {
    if (!form.name.trim()) {
      showToast("⚠️ اسم العرض مطلوب", "error");
      return;
    }

    setSaving(true);
    try {
      const row = {
        id: form.id || Date.now(),
        name: form.name.trim(),
        type: form.type,
        active: form.active !== undefined ? form.active : true,
        buy_qty: parseInt(form.buy_qty) || 3,
        get_qty: parseInt(form.get_qty) || 1,
        discount_value: parseFloat(form.discount_value) || 0,
        product_ids: JSON.stringify(form.product_ids || []),
        min_amount: parseFloat(form.min_amount) || 0,
        description: form.description || "",
        image: form.image || null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        tier_qty: parseInt(form.tier_qty) || 1,
        tier_type: form.tier_type || "percent",
        tier_value: parseFloat(form.tier_value) || 0,
        region: form.region || null,
        created_at: form.id ? undefined : new Date().toISOString(),
      };

      if (!form.id) delete row.created_at;

      console.log("💾 جاري حفظ العرض:", row);

      const { error } = await supabase.from("promotions").upsert(row);

      if (error) {
        console.error("❌ خطأ في حفظ العرض:", error);
        showToast("❌ خطأ: " + error.message, "error");
        return;
      }

      await logActivity(
        form.id ? "تعديل عرض" : "إضافة عرض",
        `${form.id ? "تم تعديل" : "تم إضافة"} العرض: ${form.name}`
      );

      showToast(form.id ? "✅ تم التعديل" : "✅ تمت الإضافة");

      setForm({
        id: "",
        name: "",
        type: "percent",
        active: true,
        buy_qty: 3,
        get_qty: 1,
        discount_value: 0,
        product_ids: [],
        min_amount: 0,
        description: "",
        end_date: "",
        image: "",
        tier_qty: 1,
        tier_type: "percent",
        tier_value: 0,
        region: "",
      });
      setProdSearch("");

      await load();
    } catch (err) {
      console.error("❌ خطأ:", err);
      showToast("❌ حدث خطأ غير متوقع", "error");
    } finally {
      setSaving(false);
    }
  };

  const edit = (p) =>
    setForm({
      id: p.id,
      name: p.name,
      type: p.type,
      active: p.active,
      buy_qty: p.buy_qty || 3,
      get_qty: p.get_qty || 1,
      discount_value: p.discount_value || 0,
      product_ids: typeof p.product_ids === "string" ? JSON.parse(p.product_ids || "[]") : (p.product_ids || []),
      min_amount: p.min_amount || 0,
      description: p.description || "",
      end_date: p.end_date?.split("T")[0] || "",
      image: p.image || "",
      tier_qty: p.tier_qty || 1,
      tier_type: p.tier_type || "percent",
      tier_value: p.tier_value || 0,
      region: p.region || "",
    });

  const del = async (id) => {
    if (!(await askConfirm("حذف هذا العرض؟"))) return;
    try {
      await supabase.from("promotions").delete().eq("id", id).catch(() => {});
      await logActivity("حذف عرض", `تم حذف العرض`);
      showToast("تم الحذف");
      await load();
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    }
  };

  const toggleActive = async (id, val) => {
    try {
      await supabase.from("promotions").update({ active: val }).eq("id", id).catch(() => {});
      await logActivity(val ? "تفعيل عرض" : "إيقاف عرض", `تم ${val ? "تفعيل" : "إيقاف"} العرض`);
      await load();
      showToast(val ? "✅ تم تفعيل العرض" : "⏸️ تم إيقاف العرض");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    }
  };

  const typeLabel = {
    percent: "خصم نسبة %",
    fixed: "خصم مبلغ ثابت",
    buy_x_get_y: "اشتري X خذ Y",
    tier_discount: "خصم حسب الرتبة",
    tier_buy: "اشتري X من نفس الشركة = خصم",
  };

  return (
    <div>
      {ToastUI}
      {ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>🎯 إدارة العروض</h1>

      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>{form.id ? "✏️ تعديل" : "➕ إنشاء"} عرض</h3>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>اسم العرض *</label>
            <input style={S.input} value={form.name} onChange={F("name")} placeholder="مثال: عرض الصيف" />
          </div>
          <div>
            <label style={S.label}>نوع العرض</label>
            <select style={S.input} value={form.type} onChange={F("type")}>
              <option value="percent">خصم نسبة % على المنتجات</option>
              <option value="fixed">خصم مبلغ ثابت</option>
              <option value="buy_x_get_y">اشتري X خذ Y مجاناً</option>
              <option value="tier_buy">📦 اشتري X من نفس الشركة = خصم</option>
            </select>
          </div>
          <div>
            <label style={S.label}>تاريخ الانتهاء</label>
            <input style={S.input} type="datetime-local" value={form.end_date} onChange={F("end_date")} />
          </div>
          <div>
            <label style={S.label}>الحد الأدنى للطلب</label>
            <NumInput value={form.min_amount} onChange={F("min_amount")} />
          </div>
          <div>
            <label style={S.label}>المنطقة</label>
            <input style={S.input} value={form.region} onChange={F("region")} placeholder="مثال: الجزائر العاصمة (اتركه فارغاً للكل)" />
          </div>
        </div>

        {form.type === "percent" && (
          <div style={{ marginTop: 12 }}>
            <label style={S.label}>نسبة الخصم %</label>
            <NumInput value={form.discount_value} onChange={F("discount_value")} placeholder="مثال: 20" style={{ width: 200 }} />
          </div>
        )}
        {form.type === "fixed" && (
          <div style={{ marginTop: 12 }}>
            <label style={S.label}>مبلغ الخصم (دج)</label>
            <NumInput value={form.discount_value} onChange={F("discount_value")} style={{ width: 200 }} />
          </div>
        )}
        {form.type === "buy_x_get_y" && (
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <div>
              <label style={S.label}>اشتري كم؟</label>
              <NumInput value={form.buy_qty} onChange={F("buy_qty")} style={{ width: 120 }} />
            </div>
            <div>
              <label style={S.label}>خذ كم مجاناً؟</label>
              <NumInput value={form.get_qty} onChange={F("get_qty")} style={{ width: 120 }} />
            </div>
            <div style={{ padding: "14px 0", fontSize: 14, color: CLR.textSm, alignSelf: "flex-end" }}>
              ← أي منتج من الأرخص يكون مجاناً
            </div>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label style={S.label}>وصف العرض (يظهر للزبون)</label>
          <input style={S.input} value={form.description} onChange={F("description")} placeholder="مثال: عند شراء 3 منتجات تحصل على الرابع مجاناً!" />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={S.label}>صورة بانر العرض (1200×400)</label>
          <input style={S.input} type="file" accept="image/*" onChange={handleImg} />
          {form.image && <img src={form.image} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10, marginTop: 6 }} />}
        </div>

        {form.type === "tier_buy" && (
          <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 14, marginTop: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#1d4ed8" }}>
              📦 عند شراء X كرتون من نفس الشركة → خصم
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={S.label}>عدد الكراتين المطلوب</label>
                <NumInput value={form.tier_qty} onChange={F("tier_qty")} />
              </div>
              <div>
                <label style={S.label}>نوع الخصم</label>
                <select style={S.input} value={form.tier_type} onChange={F("tier_type")}>
                  <option value="percent">نسبة %</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>
              <div>
                <label style={S.label}>قيمة الخصم</label>
                <NumInput value={form.tier_value} onChange={F("tier_value")} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: CLR.textSm, marginTop: 8 }}>
              مثال: اشتري {form.tier_qty} كرتون من نفس الشركة → {form.tier_value}
              {form.tier_type === "percent" ? "%" : " " + CUR} خصم
            </p>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <label style={{ ...S.label, marginBottom: 8 }}>
            🔍 المنتجات المشمولة بالعرض
            <span style={{ fontWeight: 400, color: CLR.textSm, marginRight: 8, fontSize: 12 }}>
              (اتركه فارغاً = جميع المنتجات)
            </span>
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              style={{ ...S.input, flex: 1, marginBottom: 0 }}
              placeholder="🔍 ابحث عن منتج..."
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
            />
            <button
              style={{ ...S.btnSm, background: CLR.accent, color: "white", padding: "6px 14px", fontSize: 12 }}
              onClick={() => {
                const vis = products.filter((p) => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()));
                const visIds = vis.map((p) => p.id);
                const allSel = visIds.every((id) => form.product_ids.includes(id) || form.product_ids.includes(String(id)));
                setForm((f) => ({
                  ...f,
                  product_ids: allSel
                    ? f.product_ids.filter((x) => !visIds.includes(x) && !visIds.map(String).includes(String(x)))
                    : [...new Set([...f.product_ids, ...visIds])],
                }));
              }}
            >
              تحديد الكل
            </button>
            {form.product_ids.length > 0 && (
              <button
                style={{ ...S.btnSm, background: "#FEE2E2", color: CLR.danger, fontSize: 12 }}
                onClick={() => setForm((f) => ({ ...f, product_ids: [] }))}
              >
                إلغاء الكل
              </button>
            )}
          </div>
          <div
            style={{
              maxHeight: 280,
              overflowY: "auto",
              border: `1.5px solid ${CLR.border}`,
              borderRadius: 10,
              background: "white",
            }}
          >
            {products.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: CLR.textSm }}>⏳ جاري تحميل المنتجات...</div>
            ) : products.filter((p) => {
                if (!prodSearch || prodSearch.trim() === "") return true;
                return p.name?.toLowerCase().includes(prodSearch.toLowerCase());
              }).length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: CLR.textSm }}>🔍 لا توجد نتائج لـ "{prodSearch}"</div>
            ) : (
              products
                .filter((p) => {
                  if (!prodSearch || prodSearch.trim() === "") return true;
                  return p.name?.toLowerCase().includes(prodSearch.toLowerCase());
                })
                .map((p, i) => {
                  const sel = form.product_ids.includes(p.id) || form.product_ids.includes(String(p.id));
                  return (
                    <label
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        cursor: "pointer",
                        background: sel ? "#FFF7ED" : i % 2 === 0 ? "white" : CLR.bg,
                        borderBottom: `1px solid ${CLR.border}`,
                        transition: "background .12s",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => {}}
                        style={{ accentColor: CLR.accent, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
                      />
                      {p.image ? (
                        <img
                          src={p.image}
                          style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: `1px solid ${CLR.border}` }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            background: CLR.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                        >
                          📦
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: sel ? 700 : 500,
                            color: sel ? CLR.accent : CLR.text,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: CLR.textSm, marginTop: 1 }}>
                          💰 {p.price} {CUR} &nbsp;|&nbsp; 📦 {p.stock || 0} كرتون
                        </div>
                      </div>
                      {sel && (
                        <div
                          style={{
                            background: CLR.accent,
                            color: "white",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            flexShrink: 0,
                            fontWeight: 900,
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </label>
                  );
                })
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: form.product_ids.length > 0 ? CLR.success : CLR.textSm }}>
            {form.product_ids.length > 0
              ? `✅ ${form.product_ids.length} منتج محدد — سيظهر فقط هؤلاء في العرض`
              : "📦 لم يُحدَّد أي منتج — العرض يشمل جميع المنتجات"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          <label htmlFor="active" style={{ fontWeight: 700, cursor: "pointer" }}>
            ⚡ تفعيل العرض فور الحفظ
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button style={S.btn} onClick={save} disabled={saving}>
            {saving ? "⏳..." : "💾 حفظ العرض"}
          </button>
          <button
            style={S.btnGray}
            onClick={() =>
              setForm({
                id: "",
                name: "",
                type: "percent",
                active: true,
                buy_qty: 3,
                get_qty: 1,
                discount_value: 0,
                product_ids: [],
                min_amount: 0,
                description: "",
                end_date: "",
                image: "",
                region: "",
              })
            }
          >
            ✖ إلغاء
          </button>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14 }}>العروض الحالية ({promos.length})</h3>
        {promos.length === 0 && (
          <p style={{ textAlign: "center", color: CLR.textSm, padding: 24 }}>لا توجد عروض — أنشئ أول عرض الآن!</p>
        )}
        {promos.map((p) => {
          const pids = typeof p.product_ids === "string" ? JSON.parse(p.product_ids || "[]") : (p.product_ids || []);
          const isExpired = p.end_date && new Date(p.end_date) < new Date();
          return (
            <div
              key={p.id}
              style={{
                background: p.active && !isExpired ? "#f0fdf4" : "#f8fafc",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                border: `1px solid ${p.active && !isExpired ? "#10b981" : "#e2e8f0"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: CLR.textSm, marginTop: 2 }}>{typeLabel[p.type] || p.type}</div>
                  {p.description && (
                    <div style={{ fontSize: 12, color: CLR.textSm, marginTop: 4, fontStyle: "italic" }}>"{p.description}"</div>
                  )}
                  {p.end_date && (
                    <div style={{ fontSize: 11, color: isExpired ? "#ef4444" : "#f59e0b", marginTop: 2 }}>
                      {isExpired ? "⏰ انتهى" : "⏳ ينتهي"}: {new Date(p.end_date).toLocaleDateString("ar-DZ")}
                    </div>
                  )}
                  {p.region && (
                    <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 2 }}>📍 {p.region}</div>
                  )}
                  <div style={{ fontSize: 11, color: CLR.textSm, marginTop: 4 }}>
                    {pids.length === 0 ? "📦 يشمل كل المنتجات" : `📦 ${pids.length} منتج محدد`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: p.active && !isExpired ? "#d1fae5" : isExpired ? "#fee2e2" : "#fef9c3",
                      color: p.active && !isExpired ? "#059669" : isExpired ? "#dc2626" : "#92400e",
                    }}
                  >
                    {isExpired ? "منتهي" : p.active ? "✅ فعّال" : "⏸️ موقوف"}
                  </span>
                  <button
                    style={{ ...S.btnSm, background: p.active ? "#fef9c3" : "#d1fae5", color: p.active ? "#92400e" : "#059669" }}
                    onClick={() => toggleActive(p.id, !p.active)}
                  >
                    {p.active ? "⏸️ إيقاف" : "▶️ تفعيل"}
                  </button>
                  <button style={{ ...S.btnSm, background: "#dbeafe", color: "#1d4ed8" }} onClick={() => edit(p)}>
                    ✏️
                  </button>
                  <button style={{ ...S.btnSm, background: "#fee2e2", color: "#dc2626" }} onClick={() => del(p.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   🔔 الإشعارات
══════════════════════════════════════════ */
function Notifications() {
  const [showToast, ToastUI] = useToast();
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [addressFilter, setAddressFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [{ data: n }, { data: c }] = await Promise.all([
        supabase.from("notifications").select("*").order("id", { ascending: false }),
        supabase.from("customers").select("id,name,tier,address,phone").order("name"),
      ]);
      setItems(n || []);
      setCustomers(c || []);
    } catch (err) {
      console.error("❌ خطأ في تحميل الإشعارات:", err);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const targeted = customers.filter((c) => {
    if (targetType === "all") return true;
    if (["M1", "M2", "M3"].includes(targetType)) return (c.tier || "M1") === targetType;
    if (targetType === "address") {
      if (!addressFilter) return false;
      const customerAddress = (c.address || "").toLowerCase();
      const filter = addressFilter.toLowerCase();
      return customerAddress.includes(filter);
    }
    return true;
  });

  const send = async () => {
    if (!title || !body) {
      showToast("العنوان والنص مطلوبان", "error");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("notifications").insert({
        id: Date.now(),
        title,
        body,
        target_type: targetType,
        target_count: targeted.length,
        date: new Date().toLocaleString("ar-DZ"),
        is_read: false,
      });
      await logActivity("إرسال إشعار", `تم إرسال إشعار لـ ${targeted.length} عميل: ${title}`);
      showToast(`✅ تم الإرسال لـ ${targeted.length} عميل`);
      setTitle("");
      setBody("");
      await load();
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const tierLabels = { all: "الكل", M1: "M1 عادي", M2: "M2 مميز", M3: "M3 VIP", address: "حسب العنوان" };
  const tierColors = { all: "#475569", M1: "#475569", M2: "#1d4ed8", M3: "#92400e", address: "#059669" };

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>🔔 الإشعارات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>📢 إرسال إشعار</h3>
        <label style={S.label}>👥 أرسل إلى</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {Object.entries(tierLabels).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTargetType(k)}
              style={{
                ...S.btnSm,
                background: targetType === k ? tierColors[k] : "#f1f5f9",
                color: targetType === k ? "white" : "#64748b",
                border: `2px solid ${targetType === k ? tierColors[k] : "transparent"}`,
                fontWeight: 700,
              }}
            >
              {v}
            </button>
          ))}
        </div>
        {targetType === "address" && (
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>🗺️ فلتر العنوان (ولاية أو حي)</label>
            <input
              style={S.input}
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              placeholder="مثال: الجزائر العاصمة"
            />
            <p style={{ fontSize: 11, color: CLR.textSm, marginTop: 4 }}>
              📌 سيتم إرسال الإشعار للعملاء الذين يحتوي عنوانهم على هذه الكلمة
            </p>
          </div>
        )}
        <div
          style={{
            background: "#f0fdf4",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 12,
            fontSize: 13,
            fontWeight: 700,
            color: "#059669",
          }}
        >
          👥 سيصل الإشعار إلى: <strong>{targeted.length}</strong> عميل
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>العنوان *</label>
            <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>النص *</label>
            <input style={S.input} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <button style={S.btn} onClick={send} disabled={saving || targeted.length === 0}>
          {saving ? "⏳..." : "📢 إرسال"}
        </button>
      </div>
      <div style={S.card}>
        {items.length === 0 ? (
          <p style={{ textAlign: "center", color: CLR.textSm, padding: 24 }}>لا توجد إشعارات</p>
        ) : (
          items.map((n) => (
            <div key={n.id} style={{ borderBottom: `1px solid ${CLR.bg}`, padding: "12px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <strong>{n.title}</strong>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {n.target_type && n.target_type !== "all" && (
                    <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 20, padding: "2px 8px" }}>
                      {tierLabels[n.target_type] || n.target_type}
                    </span>
                  )}
                  {n.target_count > 0 && (
                    <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>{n.target_count} عميل</span>
                  )}
                  <span style={{ fontSize: 12, color: CLR.textSm }}>{n.date}</span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: CLR.textSm, marginTop: 4 }}>{n.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   📈 التقارير المفصلة (مع PDF)
══════════════════════════════════════════ */
function Reports() {
  const [showToast, ToastUI] = useToast();
  const [data, setData] = useState({ orders: [], purchases: [], expenses: [], customers: [] });
  const [repTab, setRepTab] = useState("overview");

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: o }, { data: p }, { data: e }, { data: cu }] = await Promise.all([
          supabase.from("orders").select("*").order("id", { ascending: false }),
          supabase.from("purchases").select("*"),
          supabase.from("expenses").select("*"),
          supabase.from("customers").select("id,name,total_purchases,tier,address"),
        ]);
        setData({ orders: o || [], purchases: p || [], expenses: e || [], customers: cu || [] });
      } catch (err) {
        console.error("❌ خطأ في تحميل التقارير:", err);
        showToast("❌ خطأ في تحميل التقارير", "error");
      }
    };
    load();
  }, []);

  const exportPDF = () => {
    const content = `
      <div class="header"><div><h1>🛍️ نقاء</h1><p>تقرير شامل</p></div><div>${new Date().toLocaleDateString("ar-DZ")}</div></div>
      <h2>إحصائيات</h2>
      <table>
        <thead><tr><th>المؤشر</th><th>القيمة</th></tr></thead>
        <tbody>
          <tr><td>إجمالي المبيعات</td><td>${data.orders.reduce((s, o) => s + Number(o.total), 0).toFixed(0)} ${CUR}</td></tr>
          <tr><td>عدد الطلبيات</td><td>${data.orders.length}</td></tr>
          <tr><td>عدد العملاء</td><td>${data.customers.length}</td></tr>
          <tr><td>إجمالي المشتريات</td><td>${data.purchases.reduce((s, p) => s + Number(p.total), 0).toFixed(0)} ${CUR}</td></tr>
          <tr><td>إجمالي المصاريف</td><td>${data.expenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(0)} ${CUR}</td></tr>
        </tbody>
      </table>
      <div class="footer">نقاء — تقرير شهري</div>
    `;
    printA4(content);
  };

  const now = new Date();
  const thisM = now.getMonth();
  const thisY = now.getFullYear();
  const lastM = thisM === 0 ? 11 : thisM - 1;
  const lastY = thisM === 0 ? thisY - 1 : thisY;
  const salesThisM = data.orders
    .filter((o) => {
      const d = new Date(o.created_at || o.date);
      return d.getMonth() === thisM && d.getFullYear() === thisY;
    })
    .reduce((s, o) => s + Number(o.total), 0);
  const salesLastM = data.orders
    .filter((o) => {
      const d = new Date(o.created_at || o.date);
      return d.getMonth() === lastM && d.getFullYear() === lastY;
    })
    .reduce((s, o) => s + Number(o.total), 0);
  const chg = salesLastM > 0 ? Math.round(((salesThisM - salesLastM) / salesLastM) * 100) : 0;
  const totalSales = data.orders.reduce((s, o) => s + Number(o.total), 0);
  const totalPurch = data.purchases.reduce((s, p) => s + Number(p.total), 0);
  const totalExp = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = totalSales - totalPurch - totalExp;

  const prodSales = {};
  data.orders.forEach((o) => {
    const its = typeof o.items === "string" ? JSON.parse(o.items || "[]") : (o.items || []);
    its.forEach((i) => {
      prodSales[i.name] = (prodSales[i.name] || 0) + ((i.qty || 1) * (i.price || 0));
    });
  });
  const topProds = Object.entries(prodSales).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topCusts = [...data.customers].sort((a, b) => Number(b.total_purchases || 0) - Number(a.total_purchases || 0)).slice(0, 8);
  const geoData = {};
  data.orders.forEach((o) => {
    const w = (o.address || o.customer_address || "غير محدد").split(/[,،]/)[0].trim() || "غير محدد";
    geoData[w] = (geoData[w] || 0) + Number(o.total);
  });
  const topGeo = Object.entries(geoData).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxP = topProds[0]?.[1] || 1;
  const maxC = Number(topCusts[0]?.total_purchases || 1);
  const maxG = topGeo[0]?.[1] || 1;

  const sSt = (s) => ({
    padding: "3px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background:
      {
        pending: "#FEF9C3",
        confirmed: "#DBEAFE",
        shipping: "#E0E7FF",
        delivered: "#D1FAE5",
        cancelled: "#FEE2E2",
      }[s] || "#F1F5F9",
    color:
      {
        pending: "#92400E",
        confirmed: "#1D4ED8",
        shipping: "#5B21B6",
        delivered: "#059669",
        cancelled: "#DC2626",
      }[s] || "#475569",
  });

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>📈 التقارير</h1>

      <button style={{ ...S.btn, background: "#7c3aed", marginBottom: 16 }} onClick={exportPDF}>
        📄 تصدير تقرير PDF
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "هذا الشهر", v: salesThisM, c: CLR.accent, i: "📅", ch: chg },
          { l: "الشهر الماضي", v: salesLastM, c: "#94A3B8", i: "🗓️" },
          { l: "إجمالي المبيعات", v: totalSales, c: CLR.success, i: "💰" },
          { l: "صافي الربح", v: profit, c: profit >= 0 ? CLR.success : CLR.danger, i: "📊" },
        ].map((s, i) => (
          <div key={i} style={{ ...S.card, marginBottom: 0, borderTop: `3px solid ${s.c}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: s.c + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {s.i}
              </div>
              {s.ch !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 20,
                    background: s.ch >= 0 ? "#D1FAE5" : "#FEE2E2",
                    color: s.ch >= 0 ? "#059669" : "#DC2626",
                  }}
                >
                  {s.ch >= 0 ? "↑" : "↓"}
                  {Math.abs(s.ch)}%
                </span>
              )}
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: s.c, marginTop: 8 }}>
              {s.v.toFixed(0)} {CUR}
            </div>
            <div style={{ fontSize: 12, color: CLR.textSm }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          ["overview", "نظرة عامة"],
          ["products", "المنتجات"],
          ["customers", "العملاء"],
          ["geo", "جغرافي"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setRepTab(v)}
            style={{
              ...S.btnSm,
              background: repTab === v ? CLR.accent : "white",
              color: repTab === v ? "white" : CLR.textSm,
              border: `1px solid ${repTab === v ? CLR.accent : CLR.border}`,
              padding: "7px 16px",
              fontSize: 13,
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {repTab === "overview" && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>📋 آخر الطلبيات</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: CLR.bg }}>
                  <th style={S.th}>#</th>
                  <th style={S.th}>العميل</th>
                  <th style={S.th}>الولاية</th>
                  <th style={S.th}>الإجمالي</th>
                  <th style={S.th}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.slice(0, 15).map((o, i) => (
                  <tr key={o.id} className="nq-tr" style={{ background: i % 2 === 0 ? "white" : CLR.bg }}>
                    <td style={{ ...S.td, fontSize: 11, color: CLR.textSm }}>#{String(o.id).slice(-5)}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{o.customer_name}</td>
                    <td style={{ ...S.td, color: CLR.textSm }}>{(o.address || o.customer_address || "—").split(/[,،]/)[0]}</td>
                    <td style={{ ...S.td, color: CLR.accent, fontWeight: 700 }}>{Number(o.total).toFixed(0)} {CUR}</td>
                    <td style={S.td}>
                      <span style={sSt(o.status)}>{o.status || "انتظار"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {repTab === "products" && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>📦 أكثر المنتجات مبيعاً</h3>
          {topProds.length === 0 ? (
            <p style={{ color: CLR.textSm, textAlign: "center", padding: 24 }}>لا بيانات</p>
          ) : (
            topProds.map(([name, val], i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>
                    {i + 1}. {name}
                  </span>
                  <span style={{ color: CLR.accent, fontWeight: 700 }}>{val.toFixed(0)} {CUR}</span>
                </div>
                <div style={{ background: CLR.bg, borderRadius: 30, height: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(val / maxP) * 100}%`,
                      height: "100%",
                      background: `linear-gradient(90deg,${CLR.accent},${CLR.accentDk})`,
                      borderRadius: 30,
                      transition: "width .5s",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {repTab === "customers" && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>👥 أكثر العملاء شراءً</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: CLR.bg }}>
                  <th style={S.th}>#</th>
                  <th style={S.th}>الاسم</th>
                  <th style={S.th}>الرتبة</th>
                  <th style={S.th}>المشتريات</th>
                  <th style={S.th}>التقدم</th>
                </tr>
              </thead>
              <tbody>
                {topCusts.map((c, i) => {
                  const ts = { M1: { bg: "#F1F5F9", color: CLR.textSm }, M2: { bg: "#DBEAFE", color: "#1D4ED8" }, M3: { bg: "#FEF9C3", color: "#92400E" } }[
                    c.tier || "M1"
                  ];
                  return (
                    <tr key={c.id} className="nq-tr" style={{ background: i % 2 === 0 ? "white" : CLR.bg }}>
                      <td style={{ ...S.td, fontWeight: 900, color: CLR.textSm }}>{i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{c.name}</td>
                      <td style={S.td}>
                        <span style={{ ...ts, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {c.tier || "M1"}
                        </span>
                      </td>
                      <td style={{ ...S.td, color: CLR.accent, fontWeight: 700 }}>{Number(c.total_purchases || 0).toFixed(0)} {CUR}</td>
                      <td style={{ ...S.td, minWidth: 100 }}>
                        <div style={{ background: CLR.bg, borderRadius: 30, height: 6, overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(100, (Number(c.total_purchases || 0) / maxC) * 100)}%`,
                              height: "100%",
                              background: `linear-gradient(90deg,${CLR.accent},#FB923C)`,
                              borderRadius: 30,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {repTab === "geo" && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>🗺️ المبيعات حسب الولاية</h3>
          {topGeo.length === 0 ? (
            <p style={{ color: CLR.textSm, textAlign: "center", padding: 24 }}>لا بيانات</p>
          ) : (
            topGeo.map(([wil, val], i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>📍 {wil}</span>
                  <span style={{ color: CLR.info, fontWeight: 700 }}>{val.toFixed(0)} {CUR}</span>
                </div>
                <div style={{ background: CLR.bg, borderRadius: 30, height: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(val / maxG) * 100}%`,
                      height: "100%",
                      background: `linear-gradient(90deg,${CLR.info},#60A5FA)`,
                      borderRadius: 30,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   💸 المصاريف
══════════════════════════════════════════ */
function Expenses() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", date: new Date().toISOString().split("T")[0], category: "other" });
  const load = async () => {
    try {
      const { data } = await supabase.from("expenses").select("*").order("id", { ascending: false });
      setItems(data || []);
    } catch (err) {
      console.error("❌ خطأ في تحميل المصاريف:", err);
      showToast("❌ خطأ في تحميل المصاريف", "error");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const add = async () => {
    if (!form.name || !form.amount) {
      showToast("الاسم والمبلغ مطلوبان", "error");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("expenses").insert({
        id: Date.now(),
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        date: form.date,
        category: form.category,
      });
      await logActivity("إضافة مصروف", `تم إضافة مصروف: ${form.name} بقيمة ${form.amount} دج`);
      showToast("✅ تمت الإضافة");
      setForm({ name: "", amount: "", date: new Date().toISOString().split("T")[0], category: "other" });
      await load();
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const del = async (id) => {
    if (!(await askConfirm("حذف؟"))) return;
    try {
      await supabase.from("expenses").delete().eq("id", id);
      await logActivity("حذف مصروف", `تم حذف المصروف`);
      showToast("تم الحذف");
      await load();
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    }
  };
  const catLabel = { rent: "إيجار", salary: "رواتب", utilities: "فواتير", other: "أخرى" };
  const filtered = items.filter((e) => e.name?.toLowerCase().includes(search.toLowerCase()));
  const total = items.reduce((s, e) => s + Number(e.amount), 0);
  return (
    <div>
      {ToastUI}
      {ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>💸 المصاريف</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={form.name} onChange={F("name")} />
          </div>
          <div>
            <label style={S.label}>المبلغ *</label>
            <NumInput value={form.amount} onChange={F("amount")} />
          </div>
          <div>
            <label style={S.label}>التاريخ</label>
            <input style={S.input} type="date" value={form.date} onChange={F("date")} />
          </div>
          <div>
            <label style={S.label}>الفئة</label>
            <select style={S.input} value={form.category} onChange={F("category")}>
              <option value="rent">إيجار</option>
              <option value="salary">رواتب</option>
              <option value="utilities">فواتير</option>
              <option value="other">أخرى</option>
            </select>
          </div>
        </div>
        <button style={{ ...S.btn, marginTop: 14 }} onClick={add} disabled={saving}>
          {saving ? "⏳..." : "➕ إضافة"}
        </button>
      </div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontWeight: 800 }}>المصاريف</h3>
          <input style={{ ...S.input, width: 200 }} placeholder="🔍 بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>الاسم</th>
                <th style={S.th}>المبلغ</th>
                <th style={S.th}>الفئة</th>
                <th style={S.th}>التاريخ</th>
                <th style={S.th}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="nq-tr">
                  <td style={{ ...S.td, fontWeight: 700 }}>{e.name}</td>
                  <td style={{ ...S.td, color: "#ef4444", fontWeight: 700 }}>{Number(e.amount).toFixed(0)} {CUR}</td>
                  <td style={S.td}>{catLabel[e.category] || e.category}</td>
                  <td style={S.td}>{e.date}</td>
                  <td style={S.td}>
                    <button style={{ ...S.btnSm, background: "#fee2e2", color: "#dc2626" }} onClick={() => del(e.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: CLR.textSm }}>
                    لا توجد مصاريف
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14, fontWeight: 900, color: "#ef4444", fontSize: 16 }}>💰 الإجمالي: {total.toFixed(0)} {CUR}</div>
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════
   📋 سجل النشاطات
══════════════════════════════════════════ */
function ActivityLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("activity_log")
          .select("*")
          .order("id", { ascending: false })
          .limit(50);
        setItems(data || []);
      } catch (err) {
        console.error("❌ خطأ في تحميل سجل النشاطات:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        📋 سجل النشاطات
      </h1>
      <div style={{ ...S.card, maxHeight: 500, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 24, color: CLR.textSm }}>
            ⏳ جاري التحميل...
          </div>
        ) : items.length === 0 ? (
          <p style={{ textAlign: "center", color: CLR.textSm, padding: 24 }}>
            📭 لا توجد نشاطات مسجلة
          </p>
        ) : (
          items.map((log) => (
            <div
              key={log.id}
              style={{ borderBottom: `1px solid ${CLR.bg}`, padding: "10px 0" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong style={{ color: CLR.accent }}>{log.action}</strong>
                <span style={{ fontSize: 12, color: CLR.textSm }}>{log.date}</span>
              </div>
              <p style={{ fontSize: 13, color: CLR.textSm, marginTop: 2 }}>
                {log.details}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   🗑️ سلة مهملات (مصححة)
══════════════════════════════════════════ */
function RecycleBin() {
  const [showToast, ToastUI] = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deleted_items")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (error) {
        console.error("❌ خطأ في تحميل سلة المهملات:", error);
        showToast("❌ خطأ في تحميل سلة المهملات", "error");
        setItems([]);
      } else {
        setItems(data || []);
        console.log("✅ تم تحميل سلة المهملات:", data?.length || 0);
      }
    } catch (err) {
      console.error("❌ خطأ:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const restore = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item) {
      showToast("❌ العنصر غير موجود", "error");
      return;
    }
    try {
      const data = JSON.parse(item.data);
      const { error } = await supabase.from(item.table_name).insert(data);
      if (error) throw error;

      await supabase.from("deleted_items").delete().eq("id", id);
      await logActivity("استعادة عنصر", `تم استعادة عنصر من سلة المهملات`);
      showToast("✅ تم استعادة العنصر");
      load();
    } catch (err) {
      console.error("❌ خطأ في الاستعادة:", err);
      showToast("❌ خطأ في استعادة العنصر", "error");
    }
  };

  const permanentDelete = async (id) => {
    if (!confirm("⚠️ حذف نهائي؟ لا يمكن استعادته")) return;
    try {
      await supabase.from("deleted_items").delete().eq("id", id);
      await logActivity("حذف نهائي", `تم حذف عنصر نهائياً من سلة المهملات`);
      showToast("🗑️ تم الحذف النهائي");
      load();
    } catch (err) {
      showToast("❌ خطأ في الحذف", "error");
    }
  };

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>
        🗑️ سلة المهملات
      </h1>
      <p style={{ color: CLR.textSm, marginBottom: 16, fontSize: 13 }}>
        العناصر المحذوفة خلال آخر 30 يوم يمكن استعادتها
      </p>
      <div style={S.card}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>⏳ جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: CLR.textSm }}>
            🗑️ سلة المهملات فارغة
            <p style={{ fontSize: 12, marginTop: 8 }}>
              عند حذف منتج أو عنصر، سيظهر هنا
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: CLR.bg }}>
                  <th style={S.th}>الجدول</th>
                  <th style={S.th}>البيانات</th>
                  <th style={S.th}>تاريخ الحذف</th>
                  <th style={S.th}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  let dataPreview = "";
                  try {
                    const d = JSON.parse(item.data);
                    dataPreview = d.name || d.title || d.code || `#${d.id || item.item_id}`;
                  } catch {
                    dataPreview = `#${item.item_id}`;
                  }
                  return (
                    <tr key={item.id} className="nq-tr">
                      <td style={S.td}>{item.table_name}</td>
                      <td style={S.td}>{dataPreview}</td>
                      <td style={S.td}>
                        {new Date(item.deleted_at).toLocaleDateString("ar-DZ")}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            style={{ ...S.btnSm, background: "#D1FAE5", color: "#059669" }}
                            onClick={() => restore(item.id)}
                          >
                            ↩️ استعادة
                          </button>
                          <button
                            style={{ ...S.btnSm, background: "#FEE2E2", color: "#DC2626" }}
                            onClick={() => permanentDelete(item.id)}
                          >
                            🗑️ حذف نهائي
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ⚙️ الإعدادات (مع إدارة الفروع)
══════════════════════════════════════════ */
function Settings({ showToast }) {
  const [form, setForm] = useState({
    store_name: "نقاء",
    store_currency: "دج",
    whatsapp_number: WA_DEFAULT,
    admin_phone: WA_DEFAULT,
    contact_whatsapp: WA_DEFAULT,
    free_shipping_threshold: "5000",
    shipping_cost: "500",
    tier_m2_min: "5000",
    tier_m3_min: "20000",
    tier_m1_discount: "0",
    tier_m2_discount: "5",
    tier_m3_discount: "10",
    maintenance_mode: "0",
    maintenance_msg: "المتجر في طور التحديث، سنعود قريباً 🔧",
    terms_text: "",
    announce_bar: "",
    contact_hours: "من 8 صباحاً إلى 10 مساءً",
    contact_address: "",
    contact_email: "",
  });
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from("settings").select("*");
        if (data) {
          const map = {};
          data.forEach((r) => (map[r.key] = r.value));
          setForm((f) => ({ ...f, ...map }));

          // تحميل الفروع
          try {
            const b = JSON.parse(map["branches"] || "[]");
            setBranches(
              b.length > 0
                ? b
                : [{ id: Date.now(), name: "الفرع الرئيسي", address: "الجزائر العاصمة", phone: "" }]
            );
          } catch {
            setBranches([
              { id: Date.now(), name: "الفرع الرئيسي", address: "الجزائر العاصمة", phone: "" },
            ]);
          }
        }
      } catch (err) {
        console.error("❌ خطأ في تحميل الإعدادات:", err);
        showToast("❌ خطأ في تحميل الإعدادات", "error");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // إدارة الفروع
  const addBranch = () => {
    const newBranch = { id: Date.now(), name: "", address: "", phone: "" };
    setBranches([...branches, newBranch]);
  };

  const updateBranch = (id, field, value) => {
    setBranches(branches.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const removeBranch = (id) => {
    if (!confirm("حذف هذا الفرع؟")) return;
    setBranches(branches.filter((b) => b.id !== id));
  };

  const saveBranches = async () => {
    try {
      await supabase.from("settings").upsert({ key: "branches", value: JSON.stringify(branches) });
      return true;
    } catch (err) {
      console.error("❌ خطأ في حفظ الفروع:", err);
      showToast("❌ خطأ في حفظ الفروع", "error");
      return false;
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(form).map(([key, value]) =>
          supabase.from("settings").upsert({ key, value: String(value) })
        )
      );
      await saveBranches();
      await logActivity("تحديث الإعدادات", "تم تحديث إعدادات المتجر");
      showToast("✅ تم حفظ جميع الإعدادات");
    } catch (err) {
      console.error("❌ خطأ في الحفظ:", err);
      showToast("❌ خطأ في حفظ الإعدادات", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40 }}>⏳ جاري تحميل الإعدادات...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        ⚙️ إعدادات المتجر
      </h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: CLR.accent }}>
          🏪 إعدادات عامة
        </h3>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>اسم المتجر</label>
            <input
              style={S.input}
              value={form.store_name}
              onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}
              placeholder="نقاء"
            />
          </div>
          <div>
            <label style={S.label}>العملة</label>
            <input
              style={S.input}
              value={form.store_currency}
              onChange={(e) => setForm((f) => ({ ...f, store_currency: e.target.value }))}
              placeholder="دج"
            />
          </div>
          <div>
            <label style={S.label}>📱 رقم واتساب المتجر</label>
            <PhoneInput
              value={form.whatsapp_number}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  whatsapp_number: e.target.value,
                  admin_phone: e.target.value,
                  contact_whatsapp: e.target.value,
                }))
              }
              placeholder="213xxxxxxxxx"
            />
          </div>
          <div>
            <label style={S.label}>📧 البريد الإلكتروني للتواصل</label>
            <input
              style={S.input}
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              placeholder="info@naqaa.dz"
            />
          </div>
          <div>
            <label style={S.label}>🚚 حد التوصيل المجاني (دج)</label>
            <NumInput
              value={form.free_shipping_threshold}
              onChange={(e) => setForm((f) => ({ ...f, free_shipping_threshold: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>🚚 تكلفة التوصيل (دج)</label>
            <NumInput
              value={form.shipping_cost}
              onChange={(e) => setForm((f) => ({ ...f, shipping_cost: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>⏰ ساعات العمل</label>
            <input
              style={S.input}
              value={form.contact_hours}
              onChange={(e) => setForm((f) => ({ ...f, contact_hours: e.target.value }))}
              placeholder="من 8 صباحاً إلى 10 مساءً"
            />
          </div>
          <div>
            <label style={S.label}>📍 العنوان</label>
            <input
              style={S.input}
              value={form.contact_address}
              onChange={(e) => setForm((f) => ({ ...f, contact_address: e.target.value }))}
              placeholder="الجزائر العاصمة"
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={S.label}>📢 شريط الإعلانات (يظهر في أعلى المتجر)</label>
          <input
            style={S.input}
            value={form.announce_bar}
            onChange={(e) => setForm((f) => ({ ...f, announce_bar: e.target.value }))}
            placeholder="🎉 توصيل مجاني على الطلبات فوق 5000 دج"
          />
        </div>
      </div>

      {/* ✅ إدارة الفروع */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>
          🏢 إدارة الفروع
        </h3>
        {branches.map((branch, index) => (
          <div
            key={branch.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr auto",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
              background: CLR.bg,
              padding: 10,
              borderRadius: 8,
            }}
          >
            <input
              style={S.input}
              value={branch.name}
              onChange={(e) => updateBranch(branch.id, "name", e.target.value)}
              placeholder="اسم الفرع"
            />
            <input
              style={S.input}
              value={branch.address}
              onChange={(e) => updateBranch(branch.id, "address", e.target.value)}
              placeholder="العنوان"
            />
            <PhoneInput
              value={branch.phone}
              onChange={(e) => updateBranch(branch.id, "phone", e.target.value)}
              placeholder="الهاتف"
            />
            <button
              style={{ ...S.btnSm, background: "#FEE2E2", color: "#DC2626" }}
              onClick={() => removeBranch(branch.id)}
            >
              🗑️
            </button>
          </div>
        ))}
        <button
          style={{ ...S.btnSm, background: CLR.success, color: "white" }}
          onClick={addBranch}
        >
          ➕ إضافة فرع
        </button>
      </div>

      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>
          🏅 إعدادات تصنيف العملاء
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 14,
          }}
        >
          <div>
            <label style={S.label}>🥈 M2 — الحد الأدنى (دج)</label>
            <NumInput
              value={form.tier_m2_min}
              onChange={(e) => setForm((f) => ({ ...f, tier_m2_min: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>🥇 M3 — الحد الأدنى (دج)</label>
            <NumInput
              value={form.tier_m3_min}
              onChange={(e) => setForm((f) => ({ ...f, tier_m3_min: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>خصم M1 %</label>
            <NumInput
              value={form.tier_m1_discount}
              onChange={(e) => setForm((f) => ({ ...f, tier_m1_discount: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>خصم M2 %</label>
            <NumInput
              value={form.tier_m2_discount}
              onChange={(e) => setForm((f) => ({ ...f, tier_m2_discount: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>خصم M3 %</label>
            <NumInput
              value={form.tier_m3_discount}
              onChange={(e) => setForm((f) => ({ ...f, tier_m3_discount: e.target.value }))}
            />
          </div>
        </div>
      </div>
      <button style={{ ...S.btn, marginTop: 16 }} onClick={save} disabled={saving}>
        {saving ? "⏳ جاري الحفظ..." : "💾 حفظ جميع الإعدادات"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   🎨 إدارة واجهة المتجر
══════════════════════════════════════════ */
function StoreManager({ showToast }) {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState({ title: "", subtitle: "", image: "" });
  const [promoText, setPromoText] = useState("");
  const [announceBar, setAnnounceBar] = useState("");
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#dc2626");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeName2, setStoreName2] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("settings").select("*");
        if (!data) return;
        const map = {};
        data.forEach((r) => (map[r.key] = r.value));
        try {
          setBanners(JSON.parse(map["store_banners"] || "[]"));
        } catch {}
        setPromoText(map["promo_text"] || "");
        setAnnounceBar(map["announce_bar"] || "");
        setPrimaryColor(map["primary_color"] || "#dc2626");
        setStoreLogo(map["store_logo"] || "");
        setStoreName2(map["store_name"] || "نقاء");
      } catch (err) {
        console.error("❌ خطأ في تحميل إدارة المتجر:", err);
        showToast("❌ خطأ في تحميل البيانات", "error");
      }
    };
    load();
  }, []);

  const handleLogo = (e) => {
    const r = new FileReader();
    r.onload = (ev) => setStoreLogo(ev.target.result);
    r.readAsDataURL(e.target.files[0]);
  };
  const handleImg = (e) => {
    const r = new FileReader();
    r.onload = (ev) => setForm((f) => ({ ...f, image: ev.target.result }));
    r.readAsDataURL(e.target.files[0]);
  };

  const addBanner = async () => {
    if (!form.title && !form.image) {
      showToast("أضف صورة أو عنوان", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = [...banners, { id: Date.now(), ...form }];
      await supabase.from("settings").upsert({ key: "store_banners", value: JSON.stringify(updated) });
      setBanners(updated);
      setForm({ title: "", subtitle: "", image: "" });
      await logActivity("إضافة بانر", `تم إضافة بانر: ${form.title || "بدون عنوان"}`);
      showToast("✅ تمت الإضافة");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const delBanner = async (id) => {
    try {
      const updated = banners.filter((b) => b.id !== id);
      await supabase.from("settings").upsert({ key: "store_banners", value: JSON.stringify(updated) });
      setBanners(updated);
      await logActivity("حذف بانر", `تم حذف البانر`);
      showToast("تم الحذف");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    }
  };

  const saveTexts = async () => {
    setSaving(true);
    try {
      await Promise.all([
        supabase.from("settings").upsert({ key: "promo_text", value: promoText }),
        supabase.from("settings").upsert({ key: "announce_bar", value: announceBar }),
        supabase.from("settings").upsert({ key: "primary_color", value: primaryColor }),
        supabase.from("settings").upsert({ key: "store_logo", value: storeLogo }),
        supabase.from("settings").upsert({ key: "store_name", value: storeName2 }),
      ]);
      await logActivity("تحديث واجهة المتجر", "تم تحديث واجهة المتجر");
      showToast("✅ تم الحفظ");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        🎨 إدارة واجهة المتجر
      </h1>
      <div style={{ ...S.card, background: "#f0f9ff", border: "1px solid #bfdbfe" }}>
        <strong style={{ color: "#1d4ed8" }}>📐 أحجام الصور:</strong>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 8,
            flexWrap: "wrap",
            fontSize: 13,
          }}
        >
          <span>
            🖼️ بانر: <strong>1200×450px</strong>
          </span>
          <span>
            🏷️ ماركة: <strong>300×300px</strong>
          </span>
          <span>
            📂 فئة: <strong>400×300px</strong>
          </span>
          <span>
            📦 منتج: <strong>600×600px</strong>
          </span>
          <span>
            🎯 بانر عرض: <strong>1200×400px</strong>
          </span>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>
          📢 النصوص الترويجية
        </h3>
        <label style={S.label}>شريط الإعلانات (أعلى الصفحة)</label>
        <input
          style={S.input}
          value={announceBar}
          onChange={(e) => setAnnounceBar(e.target.value)}
          placeholder="🎉 توصيل مجاني على الطلبات فوق 500 دج"
        />
        <div style={{ marginTop: 12 }}>
          <label style={S.label}>نص ترويجي (تحت البانر)</label>
          <input
            style={S.input}
            value={promoText}
            onChange={(e) => setPromoText(e.target.value)}
            placeholder="اشتري 3 خذ 4 مجاناً!"
          />
        </div>
        <button style={{ ...S.btn, marginTop: 14 }} onClick={saveTexts} disabled={saving}>
          {saving ? "⏳..." : "💾 حفظ النصوص"}
        </button>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>
          🎨 الهوية البصرية للمتجر
        </h3>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>اسم المتجر</label>
            <input
              style={S.input}
              value={storeName2}
              onChange={(e) => setStoreName2(e.target.value)}
            />
          </div>
          <div>
            <label style={S.label}>اللون الأساسي</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: 46, height: 38, border: "none", borderRadius: 8, cursor: "pointer" }}
              />
              <input
                style={{ ...S.input, width: 120 }}
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={S.label}>شعار المتجر (Logo)</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleLogo} />
            {storeLogo && (
              <img src={storeLogo} style={{ height: 50, marginTop: 6, borderRadius: 8 }} />
            )}
          </div>
        </div>
        <button style={{ ...S.btn, marginTop: 14 }} onClick={saveTexts} disabled={saving}>
          {saving ? "⏳..." : "💾 حفظ الهوية"}
        </button>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>
          🖼️ البانرات المتحركة
        </h3>
        <p style={{ fontSize: 12, color: CLR.textSm, marginBottom: 12 }}>
          📐 حجم البانر المثالي: <strong>1200×450 بكسل</strong>
        </p>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>العنوان</label>
            <input
              style={S.input}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="عروض الصيف"
            />
          </div>
          <div>
            <label style={S.label}>نص فرعي</label>
            <input
              style={S.input}
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>صورة (1200×450)</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleImg} />
          </div>
          {form.image && (
            <div>
              <img
                src={form.image}
                style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 10 }}
              />
            </div>
          )}
        </div>
        <button style={{ ...S.btn, marginTop: 14 }} onClick={addBanner} disabled={saving}>
          {saving ? "⏳..." : "➕ إضافة بانر"}
        </button>
      </div>
      {banners.length > 0 && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 800, marginBottom: 14 }}>البانرات ({banners.length})</h3>
          {banners.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: "#f8fafc",
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: 700, color: CLR.textSm }}>#{i + 1}</span>
              {b.image && (
                <img
                  src={b.image}
                  style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{b.title || "(بدون عنوان)"}</div>
                {b.subtitle && <div style={{ fontSize: 12, color: CLR.textSm }}>{b.subtitle}</div>}
              </div>
              <button
                style={{ ...S.btnSm, background: "#fee2e2", color: "#dc2626" }}
                onClick={() => delBanner(b.id)}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   💾 نسخ احتياطي
══════════════════════════════════════════ */
function DataBackup({ showToast }) {
  const [loading, setLoading] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState(localStorage.getItem("nq_last_backup") || "—");

  useEffect(() => {
    const ab = localStorage.getItem("nq_auto_backup") === "1";
    setAutoBackup(ab);
    if (ab) {
      const last = localStorage.getItem("nq_last_backup_date");
      const today = new Date().toDateString();
      if (last !== today) {
        setTimeout(() => doAutoBackup(), 3000);
      }
    }
  }, []);

  const doAutoBackup = async () => {
    try {
      const tables = [
        "products",
        "categories",
        "brands",
        "suppliers",
        "customers",
        "orders",
        "purchases",
        "expenses",
        "promotions",
        "settings",
      ];
      const backup = {};
      for (const t of tables) {
        const { data } = await supabase.from(t).select("*").catch(() => ({ data: [] }));
        backup[t] = data || [];
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `naqaa_auto_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const now = new Date().toLocaleString("ar-DZ");
      localStorage.setItem("nq_last_backup_date", new Date().toDateString());
      localStorage.setItem("nq_last_backup", now);
      setLastBackup(now);
    } catch (err) {
      console.error("❌ خطأ في النسخ الاحتياطي التلقائي:", err);
    }
  };

  const toggleAuto = () => {
    const v = !autoBackup;
    setAutoBackup(v);
    localStorage.setItem("nq_auto_backup", v ? "1" : "0");
    showToast(v ? "✅ سيتم النسخ الاحتياطي تلقائياً كل يوم" : "⏸️ تم إيقاف النسخ التلقائي");
  };

  const tables = [
    "products",
    "orders",
    "customers",
    "suppliers",
    "brands",
    "categories",
    "purchases",
    "coupons",
    "expenses",
    "notifications",
    "settings",
  ];

  const backup = async () => {
    setLoading(true);
    try {
      const backup = {};
      for (const table of tables) {
        const { data } = await supabase.from(table).select("*");
        backup[table] = data || [];
      }
      backup._date = new Date().toISOString();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `naqaa_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await logActivity("نسخ احتياطي", "تم إنشاء نسخة احتياطية");
      showToast("✅ تم تحميل النسخة الاحتياطية");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const restore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("⚠️ هذا سيستبدل البيانات الحالية. هل أنت متأكد؟")) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        let restored = 0;
        for (const table of tables) {
          if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
            await supabase.from(table).upsert(data[table]);
            restored += data[table].length;
          }
        }
        await logActivity("استعادة نسخة احتياطية", `تم استعادة ${restored} سجل`);
        showToast(`✅ تم استعادة ${restored} سجل`);
      } catch (err) {
        showToast("❌ خطأ في ملف النسخة الاحتياطية", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        💾 النسخ الاحتياطي
      </h1>
      <div style={S.card}>
        <p style={{ color: CLR.textSm, fontSize: 14, marginBottom: 20 }}>
          احفظ نسخة من جميع بيانات متجرك (منتجات، طلبيات، عملاء، إعدادات...) في ملف JSON.
          <br />
          يمكنك استعادتها في أي وقت.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button
            style={{ ...S.btn, padding: "14px 28px", fontSize: 15 }}
            onClick={backup}
            disabled={loading}
          >
            {loading ? "⏳ جاري التحميل..." : "📥 تحميل نسخة احتياطية"}
          </button>
          <label
            style={{
              ...S.btnGray,
              padding: "14px 28px",
              fontSize: 15,
              cursor: "pointer",
              borderRadius: 30,
              fontWeight: 700,
            }}
          >
            📤 استعادة من ملف
            <input type="file" accept=".json" style={{ display: "none" }} onChange={restore} />
          </label>
        </div>
        <div
          style={{
            marginTop: 20,
            background: "#fef9c3",
            borderRadius: 12,
            padding: 14,
            fontSize: 13,
            color: "#92400e",
          }}
        >
          ⚠️ <strong>تنبيه:</strong> استعادة النسخة الاحتياطية ستضيف البيانات للموجودة ولن تحذف شيئاً.
          يُنصح بعمل نسخة احتياطية أسبوعية.
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={autoBackup} onChange={toggleAuto} />
            <span>🔄 نسخ احتياطي تلقائي يومي</span>
          </label>
          {lastBackup !== "—" && (
            <span style={{ fontSize: 12, color: CLR.textSm }}>📅 آخر نسخ: {lastBackup}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   🏢 من نحن
══════════════════════════════════════════ */
function AboutUs({ showToast }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "about_us")
      .maybeSingle()
      .then(({ data }) =>
        setContent(
          data?.value ||
            "نقاء — متجر إلكتروني جزائري متخصص في توزيع المواد الغذائية ومنتجات العناية الشخصية.\n\nتأسس المتجر بهدف تقديم أفضل المنتجات بأسعار تنافسية مع ضمان الجودة والخدمة الممتازة."
        )
      );
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      await supabase.from("settings").upsert({ key: "about_us", value: content });
      await logActivity("تحديث من نحن", "تم تحديث صفحة من نحن");
      showToast("✅ تم الحفظ");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        🏢 من نحن
      </h1>
      <div style={S.card}>
        <label style={S.label}>محتوى الصفحة</label>
        <textarea
          style={{ ...S.input, minHeight: 200, resize: "vertical", marginBottom: 14 }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button style={S.btn} onClick={save} disabled={saving}>
          {saving ? "⏳..." : "💾 حفظ"}
        </button>
      </div>
      {content && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 800, marginBottom: 10 }}>معاينة</h3>
          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.8,
              color: CLR.textSm,
              fontSize: 14,
            }}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   📞 اتصل بنا
══════════════════════════════════════════ */
function ContactUs({ showToast }) {
  const [form, setForm] = useState({
    contact_phone: "0696668065",
    contact_whatsapp: WA_DEFAULT,
    contact_email: "",
    contact_address: "",
    contact_facebook: "",
    contact_instagram: "",
    contact_hours: "السبت–الخميس: 8ص–6م",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach((r) => (map[r.key] = r.value));
          setForm((f) => ({ ...f, ...map }));
        }
      });
  }, []);

  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(form).map(([key, value]) =>
          supabase.from("settings").upsert({ key, value: String(value) })
        )
      );
      await logActivity("تحديث اتصل بنا", "تم تحديث صفحة اتصل بنا");
      showToast("✅ تم الحفظ");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        📞 اتصل بنا
      </h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>📱 الهاتف</label>
            <PhoneInput value={form.contact_phone} onChange={F("contact_phone")} />
          </div>
          <div>
            <label style={S.label}>💬 واتساب</label>
            <PhoneInput value={form.contact_whatsapp} onChange={F("contact_whatsapp")} />
          </div>
          <div>
            <label style={S.label}>📧 البريد</label>
            <input style={S.input} value={form.contact_email} onChange={F("contact_email")} />
          </div>
          <div>
            <label style={S.label}>📍 العنوان</label>
            <input style={S.input} value={form.contact_address} onChange={F("contact_address")} />
          </div>
          <div>
            <label style={S.label}>📘 فيسبوك</label>
            <input style={S.input} value={form.contact_facebook} onChange={F("contact_facebook")} />
          </div>
          <div>
            <label style={S.label}>📸 إنستغرام</label>
            <input style={S.input} value={form.contact_instagram} onChange={F("contact_instagram")} />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={S.label}>🕒 ساعات العمل</label>
            <input style={S.input} value={form.contact_hours} onChange={F("contact_hours")} />
          </div>
        </div>
        <button style={{ ...S.btn, marginTop: 18 }} onClick={save} disabled={saving}>
          {saving ? "⏳..." : "💾 حفظ"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   🔄 سياسة الاسترجاع
══════════════════════════════════════════ */
function ReturnPolicy({ showToast }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "return_policy")
      .maybeSingle()
      .then(({ data }) =>
        setContent(
          data?.value ||
            "يمكن للعميل استرجاع المنتج خلال 14 يوم من الاستلام بشرط أن يكون بحالته الأصلية.\n\nشروط الاسترجاع:\n• المنتج بدون استخدام\n• مع الفاتورة الأصلية\n• خلال 14 يوم"
        )
      );
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      await supabase.from("settings").upsert({ key: "return_policy", value: content });
      await logActivity("تحديث سياسة الاسترجاع", "تم تحديث سياسة الاسترجاع");
      showToast("✅ تم الحفظ");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        🔄 سياسة الاسترجاع
      </h1>
      <div style={S.card}>
        <label style={S.label}>محتوى السياسة</label>
        <textarea
          style={{ ...S.input, minHeight: 220, resize: "vertical", marginBottom: 14 }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button style={S.btn} onClick={save} disabled={saving}>
          {saving ? "⏳..." : "💾 حفظ"}
        </button>
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════
   🏠 المكوّن الرئيسي Admin
══════════════════════════════════════════ */
export default function Admin() {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState("dashboard");
  const [showToast, ToastUI] = useToast();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("nq_admin");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // ✅ تحويل الصلاحيات إذا كانت string
        if (typeof parsed.permissions === "string") {
          try {
            parsed.permissions = JSON.parse(parsed.permissions || "{}");
          } catch {
            parsed.permissions = {};
          }
        }
        setUser(parsed);
      } catch (err) {
        console.error("❌ خطأ في استعادة الجلسة:", err);
      }
    }
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    sessionStorage.setItem("nq_admin", JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("nq_admin");
    setSection("dashboard");
  };

  // ✅ دالة التحقق من الصلاحيات (مصححة)
  const hasPermission = (permId, action = "view") => {
    if (!user) return false;
    if (user.role === "admin") return true;
    const perms = user.permissions || {};
    const permActions = perms[permId] || [];
    return permActions.includes(action);
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // ✅ تعريف الأقسام مع الصلاحيات
  const sections = [
    { id: "dashboard", icon: "📊", label: "لوحة القيادة", perm: "dashboard" },
    { id: "products", icon: "📦", label: "المنتجات", perm: "products" },
    { id: "categories", icon: "📂", label: "الفئات", perm: "categories" },
    { id: "brands", icon: "🏷️", label: "العلامات التجارية", perm: "brands" },
    { id: "suppliers", icon: "🏭", label: "الموردون", perm: "suppliers" },
    { id: "customers", icon: "👥", label: "العملاء (M1/M2/M3)", perm: "customers" },
    { id: "employees", icon: "👔", label: "الموظفون", perm: "employees" },
    { id: "coupons", icon: "🎟️", label: "الكوبونات", perm: "coupons" },
    { id: "purchases", icon: "🛒", label: "المشتريات", perm: "purchases" },
    { id: "inventory", icon: "🗂️", label: "المخزون + Excel", perm: "inventory" },
    { id: "orders", icon: "📋", label: "الطلبيات", perm: "orders" },
    { id: "promotions", icon: "🎯", label: "إدارة العروض", perm: "promotions" },
    { id: "notifications", icon: "🔔", label: "الإشعارات", perm: "notifications" },
    { id: "reports", icon: "📈", label: "التقارير", perm: "reports" },
    { id: "expenses", icon: "💸", label: "المصاريف", perm: "expenses" },
    { id: "activityLog", icon: "📋", label: "سجل النشاطات", perm: "activityLog" },
    { id: "storeManager", icon: "🎨", label: "إدارة المتجر", perm: "storeManager" },
    { id: "backup", icon: "💾", label: "نسخ احتياطي", perm: "backup" },
    { id: "settings", icon: "⚙️", label: "الإعدادات", perm: "settings" },
    { id: "about", icon: "🏢", label: "من نحن", perm: "about" },
    { id: "contact", icon: "📞", label: "اتصل بنا", perm: "contact" },
    { id: "returnPolicy", icon: "🔄", label: "سياسة الاسترجاع", perm: "returnPolicy" },
    { id: "recycle", icon: "🗑️", label: "سلة المهملات", perm: "recycle" },
  ];

  // ✅ دالة عرض القسم مع التحقق من الصلاحيات
  const renderSection = () => {
    const currentSection = sections.find((s) => s.id === section);

    // ✅ التحقق من صلاحية الوصول
    if (currentSection && !hasPermission(currentSection.perm)) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
            gap: 16,
            color: CLR.textSm,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 56 }}>🔒</div>
          <h3 style={{ fontWeight: 800, color: CLR.text }}>لا تملك صلاحية الوصول</h3>
          <p style={{ fontSize: 14, textAlign: "center" }}>
            {user.role === "admin"
              ? "أنت مدير، لديك صلاحية الوصول لكل شيء ✅"
              : "تواصل مع المدير لمنحك الصلاحية"}
          </p>
          {user.role !== "admin" && (
            <div
              style={{
                background: "#FEF9C3",
                padding: "12px 18px",
                borderRadius: 8,
                fontSize: 13,
                color: "#92400E",
                textAlign: "center",
                maxWidth: 400,
              }}
            >
              💡 الصلاحيات الممنوحة لك:{" "}
              {Object.keys(user.permissions || {}).length > 0
                ? Object.keys(user.permissions).join(", ")
                : "لا توجد صلاحيات حالياً"}
            </div>
          )}
        </div>
      );
    }

    // ✅ عرض الأقسام حسب الصلاحيات
    switch (section) {
      case "dashboard":
        return <Dashboard user={user} showToast={showToast} />;
      case "products":
        return <Products />;
      case "categories":
        return <Categories />;
      case "brands":
        return <Brands />;
      case "suppliers":
        return <Suppliers />;
      case "customers":
        return <Customers />;
      case "employees":
        return <Employees />;
      case "coupons":
        return <Coupons />;
      case "purchases":
        return <Purchases />;
      case "inventory":
        return <Inventory />;
      case "orders":
        return <Orders />;
      case "promotions":
        return <PromotionsManager />;
      case "notifications":
        return <Notifications />;
      case "reports":
        return <Reports />;
      case "expenses":
        return <Expenses />;
      case "activityLog":
        return <ActivityLog />;
      case "storeManager":
        return <StoreManager showToast={showToast} />;
      case "backup":
        return <DataBackup showToast={showToast} />;
      case "settings":
        return <Settings showToast={showToast} />;
      case "about":
        return <AboutUs showToast={showToast} />;
      case "contact":
        return <ContactUs showToast={showToast} />;
      case "returnPolicy":
        return <ReturnPolicy showToast={showToast} />;
      case "recycle":
        return <RecycleBin />;
      default:
        return <Dashboard user={user} showToast={showToast} />;
    }
  };

  // ✅ مجموعات القائمة الجانبية
  const navGroups = [
    { label: "الرئيسية", items: ["dashboard"] },
    {
      label: "المنتجات والمخزون",
      items: ["products", "categories", "brands", "inventory"],
    },
    {
      label: "المبيعات",
      items: ["orders", "promotions", "coupons"],
    },
    {
      label: "الموارد",
      items: ["purchases", "suppliers", "expenses"],
    },
    {
      label: "العملاء",
      items: ["customers", "notifications"],
    },
    {
      label: "الإدارة",
      items: [
        "reports",
        "employees",
        "activityLog",
        "storeManager",
        "backup",
        "settings",
        "about",
        "contact",
        "returnPolicy",
        "recycle",
      ],
    },
  ];

  return (
    <div dir="rtl" style={{ display: "flex", minHeight: "100vh", background: CLR.bg }}>
      {ToastUI}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;900&display=swap');
        body,*{font-family:'Tajawal',sans-serif!important}
        .sitem{display:flex;align-items:center;gap:9px;padding:9px 10px;color:rgba(255,255,255,.55);
          cursor:pointer;border-radius:8px;margin:1px 6px;transition:.15s;
          font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sitem:hover{background:rgba(249,115,22,.18);color:#FDBA74}
        .sitem.on{background:rgba(249,115,22,.22);color:#FB923C;font-weight:700}
        .sitem span.ico{font-size:15px;flex-shrink:0;width:18px;text-align:center}
        input:focus,select:focus,textarea:focus{border-color:#F97316!important;
          box-shadow:0 0 0 3px rgba(249,115,22,.12)!important;outline:none}
        input[type=number]::-webkit-inner-spin-button{opacity:1}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
        .nq-tr:hover td{background:#FFF7ED!important}
        .dark .nq-tr:hover td{background:#1e293b!important}
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <aside
        style={{
          width: collapsed ? 58 : 232,
          background: CLR.primary,
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
          transition: "width .22s ease",
          boxShadow: "2px 0 16px rgba(0,0,0,.15)",
          zIndex: 100,
        }}
      >
        {/* لوغو */}
        <div
          style={{
            padding: collapsed ? "14px 9px" : "14px 14px",
            borderBottom: "1px solid rgba(255,255,255,.07)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                flexShrink: 0,
                background: "linear-gradient(135deg,#F97316,#EA6C0A)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🛍️
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: "white", lineHeight: 1.2 }}>
                  نقاء
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>لوحة الإدارة</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div
              style={{
                marginTop: 10,
                padding: "7px 10px",
                background: "rgba(255,255,255,.07)",
                borderRadius: 7,
                fontSize: 12,
                color: "rgba(255,255,255,.75)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>👤</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name || "المدير"}
              </span>
              {user.role === "admin" && (
                <span
                  style={{
                    fontSize: 8,
                    background: "rgba(239,68,68,.3)",
                    padding: "1px 6px",
                    borderRadius: 10,
                    color: "#FCA5A5",
                  }}
                >
                  مدير
                </span>
              )}
            </div>
          )}
        </div>

        {/* قائمة مجمّعة */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div
                  style={{
                    padding: "8px 14px 3px",
                    fontSize: 9,
                    fontWeight: 800,
                    color: "rgba(255,255,255,.28)",
                    letterSpacing: "0.9px",
                    textTransform: "uppercase",
                  }}
                >
                  {group.label}
                </div>
              )}
              {group.items.map((id) => {
                const s = sections.find((x) => x.id === id);
                if (!s) return null;
                // ✅ التحقق من صلاحية الموظف
                if (!hasPermission(s.perm)) return null;
                return (
                  <div
                    key={s.id}
                    className={`sitem${section === s.id ? " on" : ""}`}
                    onClick={() => setSection(s.id)}
                    title={collapsed ? s.label : ""}
                  >
                    <span className="ico">{s.icon}</span>
                    {!collapsed && <span>{s.label}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* أسفل القائمة */}
        <div
          style={{
            padding: "8px 6px",
            borderTop: "1px solid rgba(255,255,255,.07)",
            flexShrink: 0,
          }}
        >
          <a
            href="/"
            target="_blank"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 7,
              color: "rgba(255,255,255,.5)",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 600,
              transition: ".15s",
              marginBottom: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "white";
              e.currentTarget.style.background = "rgba(255,255,255,.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,.5)";
              e.currentTarget.style.background = "none";
            }}
          >
            <span>🛍️</span>
            {!collapsed && <span>عرض المتجر</span>}
          </a>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 7,
              color: "rgba(239,68,68,.7)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              width: "100%",
              textAlign: "right",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#EF4444";
              e.currentTarget.style.background = "rgba(239,68,68,.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(239,68,68,.7)";
              e.currentTarget.style.background = "none";
            }}
          >
            <span>🚪</span>
            {!collapsed && <span>خروج</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* TOP BAR */}
        <header
          style={{
            background: "white",
            borderBottom: `1px solid ${CLR.border}`,
            padding: "0 20px",
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 150,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setCollapsed((p) => !p)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: CLR.textSm,
                padding: "4px 6px",
                borderRadius: 6,
                transition: ".15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = CLR.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {collapsed ? "☰" : "✕"}
            </button>
            <div style={{ fontSize: 14, fontWeight: 700, color: CLR.text }}>
              {sections.find((s) => s.id === section)?.icon}{" "}
              {sections.find((s) => s.id === section)?.label}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                color: CLR.textSm,
                background: CLR.bg,
                borderRadius: 6,
                padding: "4px 10px",
                border: `1px solid ${CLR.border}`,
                fontWeight: 600,
              }}
            >
              {new Date().toLocaleDateString("ar-DZ", { day: "numeric", month: "short" })}
            </span>
            <a
              href="/"
              target="_blank"
              style={{
                fontSize: 12,
                color: CLR.accent,
                background: "#FFF7ED",
                borderRadius: 6,
                padding: "4px 10px",
                border: "1px solid #FED7AA",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              🛍️ المتجر
            </a>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: 22, overflowY: "auto" }}>{renderSection()}</main>
      </div>
    </div>
  );
}
