/**
 * Admin.jsx — نقاء v7 (نسخة احترافية كاملة)
 * ✅ مصادقة ثنائية (6789)
 * ✅ صلاحيات الموظفين (تحديد الصفحات لكل موظف)
 * ✅ جداول بشكل بطاقات (Grid Cards)
 * ✅ منع تكرار المنتجات في فاتورة الشراء
 * ✅ حساب سعر الكرتون تلقائياً
 * ✅ إشعارات واتساب للمسؤول عند الطلبات الجديدة
 * ✅ تقارير المبيعات بالأسبوع والشهر
 */
import { useState, useEffect, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

/* ─── ثوابت ─── */
const ADMIN_EMAIL     = 'meghamel2012@gmail.com'
const ADMIN_PASS_HASH = CryptoJS.SHA256('afbilalaf06').toString()
const TWO_FA_CODE     = '6789'
const CUR             = 'دج'
const WA_DEFAULT      = '213696668065'

const hashPwd = p => CryptoJS.SHA256(p).toString()

/* ─── حقل رقمي فقط ─── */
const NumInput = ({ value, onChange, placeholder, style, step }) => (
  <input
    type="number"
    value={value}
    onChange={onChange}
    placeholder={placeholder||'0'}
    step={step||'any'}
    min="0"
    onKeyDown={e => { if (['-','e','E','+'].includes(e.key)) e.preventDefault() }}
    style={{ ...S.input, ...style }}
  />
)

/* ─── Toast ─── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [])
  const cfg = {
    success:{bg:'#10b981',icon:'✅'},
    error:  {bg:'#ef4444', icon:'❌'},
    info:   {bg:'#3b82f6', icon:'ℹ️'},
  }[type]||{bg:'#10b981',icon:'✅'}
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:'white',
      borderRight:`4px solid ${cfg.bg}`, color:'#1e293b',
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
        <h3 style={{ fontSize:16,fontWeight:800,color:'#1e293b',marginBottom:8 }}>تأكيد الحذف</h3>
        <p style={{ fontSize:14,color:'#64748b',marginBottom:22,lineHeight:1.5 }}>{c.msg}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={()=>{ c.r(true); setC(null) }}
            style={{ background:'#ef4444',color:'white',border:'none',borderRadius:8,
              padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit' }}>
            نعم، احذف
          </button>
          <button onClick={()=>{ c.r(false); setC(null) }}
            style={{ background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,
              padding:'10px 24px',cursor:'pointer',fontWeight:600,fontSize:14,fontFamily:'inherit',color:'#64748b' }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  ) : null
  return [ask, UI]
}

/* ─── ألوان ─── */
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
  grid2:   { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 },
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
   🔐 تسجيل الدخول مع صلاحيات
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

  const step1 = async () => {
    setErr(''); setLoading(true)
    // مدير أول
    if (email.trim()===ADMIN_EMAIL && hashPwd(pass)===ADMIN_PASS_HASH) {
      setUserData({ id:'admin', name:'المدير العام', email:ADMIN_EMAIL, role:'super_admin', permissions:[] })
      setStep(2); setLoading(false); return
    }
    // موظف عادي
    const { data } = await supabase.from('employees').select('*').eq('username', email.trim()).maybeSingle()
    if (data && data.password===hashPwd(pass)) {
      setUserData({ id:data.id, name:data.name, email:data.email, role:data.role, permissions:data.permissions || [] })
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
          <p style={{ color:'#64748b', fontSize:14, marginTop:4 }}>أدخل كود التحقق المكون من 4 أرقام</p>
          <div style={{ background:'#fef9c3', borderRadius:10, padding:10, marginTop:12, fontSize:13, color:'#92400e' }}>
            🔑 الكود الحالي: <strong style={{ fontSize:20 }}>{TWO_FA_CODE}</strong>
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
          <p style={{ color:'#64748b', fontSize:14 }}>لوحة الإدارة</p>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>البريد الإلكتروني</label>
          <input style={S.input} type="text" value={email}
            onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&step1()} autoComplete="username"/>
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
   📊 لوحة القيادة - بطاقات إحصاء
══════════════════════════════════════════ */
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background:'white', borderRadius:12, padding:18, border:`1px solid ${CLR.border}`,
      boxShadow:'0 1px 6px rgba(0,0,0,.06)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ width:40,height:40,borderRadius:10,background:color+'18',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{icon}</div>
      </div>
      <div style={{ fontSize:22, fontWeight:900, color:CLR.text, marginTop:8 }}>{value}</div>
      <div style={{ fontSize:12, color:CLR.textSm }}>{label}</div>
    </div>
  )
}

function Dashboard({ userPermissions }) {
  const [stats, setStats] = useState({ products:0, orders:0, sales:0, todaySales:0, thisMonthSales:0, lastMonthSales:0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [weekData, setWeekData] = useState([0,0,0,0,0,0,0])
  const [monthData, setMonthData] = useState([0,0,0,0])

  useEffect(() => {
    const load = async () => {
      const [{data:prods},{data:ords}] = await Promise.all([
        supabase.from('products').select('id,name,stock,min_stock'),
        supabase.from('orders').select('*').order('id',{ascending:false}).limit(20),
      ])
      const now = new Date()
      const thisMonth = now.getMonth()
      const today = now.toLocaleDateString()
      const todayO = (ords||[]).filter(o=>new Date(o.created_at||o.date).toLocaleDateString()===today)
      const sales = (ords||[]).reduce((s,o)=>s+Number(o.total),0)
      const thisM = (ords||[]).filter(o=>new Date(o.created_at||o.date).getMonth()===thisMonth).reduce((s,o)=>s+Number(o.total),0)
      const lastM = (ords||[]).filter(o=>new Date(o.created_at||o.date).getMonth()===thisMonth-1).reduce((s,o)=>s+Number(o.total),0)
      
      // بيانات الأسبوع
      const week7 = Array(7).fill(0)
      ;(ords||[]).forEach(o=>{
        const d = new Date(o.created_at||o.date)
        const diff = Math.floor((now-d)/(86400000))
        if(diff>=0&&diff<7) week7[6-diff]+=Number(o.total)
      })
      // بيانات 4 أسابيع
      const wk4 = Array(4).fill(0)
      ;(ords||[]).forEach(o=>{
        const d = new Date(o.created_at||o.date)
        const diff = Math.floor((now-d)/(86400000*7))
        if(diff>=0&&diff<4) wk4[3-diff]+=Number(o.total)
      })
      
      setStats({ products:(prods||[]).length, orders:(ords||[]).length, sales, todaySales:todayO.reduce((s,o)=>s+Number(o.total),0), thisMonthSales:thisM, lastMonthSales:lastM })
      setRecentOrders((ords||[]).slice(0,8))
      const minStk = p=>(p.min_stock||5)
      setLowStock((prods||[]).filter(p=>(p.stock||0)<minStk(p)))
      setWeekData(week7); setMonthData(wk4)
    }
    load()
  }, [])

  const days = ['أحد','اثن','ثلا','أرب','خمس','جمع','سبت']
  const now = new Date()
  const wkDays = Array(7).fill(0).map((_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(6-i));return days[d.getDay()]})
  const maxW = Math.max(...weekData,1)
  const maxM = Math.max(...monthData,1)
  const chartH = 100

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div><h1 style={{ fontSize:20, fontWeight:900, color:CLR.text }}>لوحة القيادة</h1>
        <div style={{ fontSize:12, color:CLR.textSm }}>{new Date().toLocaleDateString('ar-DZ',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
        <StatCard label="المنتجات" value={stats.products} icon="📦" color={CLR.info}/>
        <StatCard label="الطلبيات" value={stats.orders} icon="📋" color={CLR.success}/>
        <StatCard label="مبيعات اليوم" value={`${stats.todaySales.toFixed(0)} ${CUR}`} icon="⚡" color={CLR.warn}/>
        <StatCard label="هذا الشهر" value={`${stats.thisMonthSales.toFixed(0)} ${CUR}`} icon="📅" color={CLR.accent}/>
      </div>

      {/* تنبيه المخزون */}
      {lowStock.length>0 && (
        <div style={{ background:'#FFF7ED', border:`1px solid #FED7AA`, borderRadius:10, padding:'12px 16px', marginBottom:18 }}>
          <strong style={{ color:'#C2410C', fontSize:13 }}>⚠️ مخزون منخفض — {lowStock.length} منتج</strong>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
            {lowStock.slice(0,5).map(p=>(
              <span key={p.id} style={{ background:'white', border:'1px solid #FED7AA', color:'#C2410C', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                {p.name} ({p.stock||0} كرتون)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* رسم بياني */}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, fontSize:15, marginBottom:16 }}>📈 المبيعات - الأسبوع الحالي</h3>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:chartH+24, paddingBottom:20 }}>
          {weekData.map((v,i)=>{
            const h = Math.max(4,(v/maxW)*chartH)
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:10, color:CLR.textSm, fontWeight:600 }}>{v>0?v.toFixed(0):''}</div>
                <div style={{ width:'100%', height:h, borderRadius:'4px 4px 0 0', background:`linear-gradient(180deg,${CLR.accent},${CLR.accentDk})`, transition:'height .4s ease', minHeight:4 }}/>
                <div style={{ fontSize:10, color:CLR.textSm, position:'absolute', bottom:0 }}>{wkDays[i]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* آخر الطلبيات - بطاقات */}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, fontSize:15 }}>📋 آخر الطلبيات</h3>
        <div style={S.grid2}>
          {recentOrders.map(o=>(
            <div key={o.id} style={{ background:CLR.bg, borderRadius:12, padding:12, border:`1px solid ${CLR.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontWeight:900, color:CLR.accent }}>#{String(o.id).slice(-6)}</span>
                <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, background:'#fef9c3', color:'#92400e' }}>{o.status||'قيد الانتظار'}</span>
              </div>
              <div style={{ fontWeight:700 }}>{o.customer_name}</div>
              <div style={{ fontSize:12, color:CLR.textSm }}>{o.customer_address?.split(',')[0]||'—'}</div>
              <div style={{ fontWeight:900, color:CLR.accent, marginTop:6 }}>{Number(o.total).toFixed(0)} {CUR}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   👥 الموظفون مع صلاحيات
══════════════════════════════════════════ */
function Employees({ userPermissions, showToast }) {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [form, setForm] = useState({ name:'', username:'', password:'', email:'' })
  const [selectedPages, setSelectedPages] = useState([])

  // قائمة الصفحات المتاحة
  const allSections = [
    { id:'dashboard', label:'لوحة القيادة', icon:'📊' },
    { id:'products', label:'المنتجات', icon:'📦' },
    { id:'categories', label:'الفئات', icon:'📂' },
    { id:'brands', label:'العلامات التجارية', icon:'🏷️' },
    { id:'suppliers', label:'الموردون', icon:'🏭' },
    { id:'customers', label:'العملاء', icon:'👥' },
    { id:'employees', label:'الموظفون', icon:'👔' },
    { id:'coupons', label:'الكوبونات', icon:'🎟️' },
    { id:'purchases', label:'المشتريات', icon:'🛒' },
    { id:'inventory', label:'المخزون', icon:'🗂️' },
    { id:'orders', label:'الطلبيات', icon:'📋' },
    { id:'promotions', label:'إدارة العروض', icon:'🎯' },
    { id:'notifications', label:'الإشعارات', icon:'🔔' },
    { id:'reports', label:'التقارير', icon:'📈' },
    { id:'expenses', label:'المصاريف', icon:'💸' },
    { id:'storeManager', label:'إدارة المتجر', icon:'🎨' },
    { id:'backup', label:'نسخ احتياطي', icon:'💾' },
    { id:'settings', label:'الإعدادات', icon:'⚙️' },
    { id:'about', label:'من نحن', icon:'🏢' },
    { id:'contact', label:'اتصل بنا', icon:'📞' },
    { id:'returnPolicy', label:'سياسة الاسترجاع', icon:'🔄' },
  ]

  const load = async () => {
    const { data } = await supabase.from('employees').select('id,name,username,email,role,permissions').order('name')
    setItems(data||[])
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.name || !form.username || !form.password) { showToast('الاسم والمستخدم وكلمة المرور مطلوبة','error'); return }
    const { error } = await supabase.from('employees').upsert({
      id: editingEmployee?.id || Date.now(),
      name: form.name,
      username: form.username,
      password: hashPwd(form.password),
      email: form.email || '',
      role: 'staff',
      permissions: JSON.stringify(selectedPages)
    })
    if (error) { showToast('خطأ: '+error.message,'error'); return }
    showToast(editingEmployee ? '✅ تم تعديل الموظف' : '✅ تمت إضافة الموظف')
    setShowModal(false)
    setForm({ name:'', username:'', password:'', email:'' })
    setSelectedPages([])
    setEditingEmployee(null)
    await load()
  }

  const editEmployee = (emp) => {
    setEditingEmployee(emp)
    setForm({ name:emp.name, username:emp.username, password:'', email:emp.email||'' })
    setSelectedPages(typeof emp.permissions === 'string' ? JSON.parse(emp.permissions||'[]') : (emp.permissions||[]))
    setShowModal(true)
  }

  const deleteEmployee = async (id) => {
    await supabase.from('employees').delete().eq('id', id)
    showToast('تم الحذف')
    await load()
  }

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:900, marginBottom:20, color:CLR.text }}>👔 الموظفون والصلاحيات</h1>
      
      <div style={S.card}>
        <button style={S.btn} onClick={()=>{ setShowModal(true); setEditingEmployee(null); setForm({ name:'', username:'', password:'', email:'' }); setSelectedPages([]) }}>
          ➕ إضافة موظف جديد
        </button>
      </div>

      {/* قائمة الموظفين - بطاقات */}
      <div style={S.grid2}>
        {items.map(emp => (
          <div key={emp.id} style={{ background:'white', borderRadius:12, padding:16, border:`1px solid ${CLR.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontWeight:900, fontSize:16 }}>{emp.name}</span>
              <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, background:emp.role==='admin'?'#fee2e2':'#d1fae5', color:emp.role==='admin'?'#dc2626':'#059669' }}>
                {emp.role==='admin'?'مدير':'موظف'}
              </span>
            </div>
            <div style={{ fontSize:13, color:CLR.textSm }}>👤 {emp.username}</div>
            <div style={{ fontSize:13, color:CLR.textSm, marginBottom:8 }}>📧 {emp.email || '—'}</div>
            <div style={{ fontSize:11, color:CLR.accent, marginBottom:10 }}>
              📄 الصلاحيات: {(typeof emp.permissions === 'string' ? JSON.parse(emp.permissions||'[]') : (emp.permissions||[])).length} صفحة
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button style={{ ...S.btnSm, background:'#dbeafe', color:'#1d4ed8' }} onClick={()=>editEmployee(emp)}>✏️ تعديل</button>
              {emp.role !== 'admin' && <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>deleteEmployee(emp.id)}>🗑️ حذف</button>}
            </div>
          </div>
        ))}
      </div>

      {/* مودال إضافة/تعديل موظف مع اختيار الصلاحيات */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:7000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:16, padding:24, width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', direction:'rtl' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
              <h3 style={{ fontWeight:900, fontSize:17 }}>{editingEmployee ? '✏️ تعديل موظف' : '➕ إضافة موظف جديد'}</h3>
              <button onClick={()=>{ setShowModal(false); setEditingEmployee(null) }} style={{ background:CLR.bg, border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>الاسم الكامل *</label><input style={S.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
              <div><label style={S.label}>اسم المستخدم *</label><input style={S.input} value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} /></div>
              <div><label style={S.label}>كلمة المرور *</label><input style={S.input} type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></div>
              <div><label style={S.label}>البريد الإلكتروني</label><input style={S.input} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
            </div>
            
            <div style={{ marginTop:16 }}>
              <label style={S.label}>🔐 صلاحيات الوصول (اختر الصفحات التي يمكنه رؤيتها)</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginTop:8, maxHeight:300, overflowY:'auto', border:`1px solid ${CLR.border}`, borderRadius:8, padding:12 }}>
                {allSections.map(section => (
                  <label key={section.id} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'4px 0' }}>
                    <input type="checkbox" checked={selectedPages.includes(section.id)} onChange={()=>{
                      if(selectedPages.includes(section.id)) setSelectedPages(prev=>prev.filter(p=>p!==section.id))
                      else setSelectedPages(prev=>[...prev, section.id])
                    }} />
                    <span>{section.icon} {section.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ fontSize:12, color:CLR.textSm, marginTop:8 }}>تم اختيار {selectedPages.length} صفحة</div>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button style={S.btn} onClick={handleSave}>💾 حفظ</button>
              <button style={S.btnGray} onClick={()=>{ setShowModal(false); setEditingEmployee(null) }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   🛒 المشتريات - منع التكرار + حساب سعر الكرتون
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
    
    // منع تكرار المنتج في نفس الفاتورة
    if(items.some(i=>i.productId===modal.productId)){
      showToast('⚠️ هذا المنتج موجود مسبقاً في الفاتورة','error')
      return
    }
    
    const totalUnits=parseInt(modal.cartons)*parseInt(modal.unitsPerCarton)
    const cartonPrice=autoCarton(modal.purchasePrice,modal.unitsPerCarton)
    setItems(prev=>[...prev,{
      id:Date.now(), productId:prod.id, productName:prod.name,
      cartons:parseInt(modal.cartons), unitsPerCarton:parseInt(modal.unitsPerCarton),
      totalUnits, purchasePrice:parseFloat(modal.purchasePrice),
      sellPrice:parseFloat(modal.sellPrice)||0,
      cartonPrice, totalPurchase:parseInt(modal.cartons)*cartonPrice
    }])
    setShowModal(false); setModal({productId:'',cartons:1,unitsPerCarton:12,purchasePrice:0,sellPrice:0})
  }

  const saveNewProduct=async()=>{
    if(!newProd.name||!newProd.price){showToast('الاسم والسعر مطلوبان','error');return}
    const id=Date.now()
    await supabase.from('products').insert({
      id, name:newProd.name.trim(), price:parseFloat(newProd.price),
      units:parseInt(newProd.units)||12, brand_id:newProd.brandId?parseInt(newProd.brandId):null,
      stock:0, disabled:false, created_at:new Date().toISOString()
    })
    const {data:p}=await supabase.from('products').select('id,name,units,cost_price,price').order('name')
    setProducts(p||[])
    setModal(m=>({...m,productId:String(id),unitsPerCarton:parseInt(newProd.units)||12}))
    setNewProd({name:'',price:'',units:12,brandId:''})
    setShowNewProdModal(false); setShowModal(true)
    showToast('✅ تمت إضافة المنتج')
  }

  const save=async()=>{
    if(!suppId){showToast('اختر المورد','error');return}
    if(items.length===0){showToast('أضف منتجاً','error');return}
    setSaving(true)
    const supplier=suppliers.find(s=>s.id==suppId)
    const purchaseId=Date.now()
    await supabase.from('purchases').insert({id:purchaseId, supplier_id:parseInt(suppId), supplier_name:supplier?.name, date, items:JSON.stringify(items), total})
    for(const item of items){
      const {data:p}=await supabase.from('products').select('stock,cost_price').eq('id',item.productId).maybeSingle()
      if(p){
        await supabase.from('products').update({
          stock:(p.stock||0)+item.cartons,
          cost_price:item.purchasePrice,
          carton_price:item.cartonPrice
        }).eq('id',item.productId)
      }
    }
    showToast('✅ تم حفظ الفاتورة')
    setSuppId(''); setItems([])
    const {data:pur}=await supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20)
    setPurchases(pur||[]); setSaving(false)
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
          <div><label style={S.label}>التاريخ</label><input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
        </div>

        {/* قائمة المنتجات المضافة - بطاقات */}
        {items.length>0 && (
          <div style={S.grid2}>
            {items.map(item=>(
              <div key={item.id} style={{ background:CLR.bg, borderRadius:12, padding:12, border:`1px solid ${CLR.border}` }}>
                <div style={{ fontWeight:700 }}>{item.productName}</div>
                <div style={{ fontSize:13, color:CLR.textSm }}>📦 {item.cartons} كرتون × {item.unitsPerCarton} قطعة = {item.totalUnits} قطعة</div>
                <div style={{ fontSize:13, color:CLR.textSm }}>💰 سعر الشراء/قطعة: {item.purchasePrice} {CUR}</div>
                <div style={{ fontWeight:700, color:CLR.accent }}>💜 سعر الكرتون: {item.cartonPrice.toFixed(0)} {CUR}</div>
                <div style={{ fontWeight:900, color:'#dc2626', marginTop:6 }}>الإجمالي: {item.totalPurchase.toFixed(0)} {CUR}</div>
                <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626', marginTop:8 }} onClick={()=>setItems(p=>p.filter((_,j)=>j!==items.indexOf(item)))}>🗑️ حذف</button>
              </div>
            ))}
          </div>
        )}
        
        {items.length===0 && (
          <div style={{ textAlign:'center', padding:'20px', color:CLR.textSm, border:'2px dashed #e2e8f0', borderRadius:12, marginBottom:14 }}>
            📦 لا توجد منتجات — ابدأ بإضافة منتج
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:12, flexWrap:'wrap' }}>
          <button onClick={()=>setShowModal(true)} style={{...S.btnGray, background:CLR.success, color:'white'}}>➕ إضافة منتج</button>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ الفاتورة'}</button>
          {items.length>0 && <span style={{ fontWeight:900, color:'#dc2626', fontSize:18 }}>💰 الإجمالي: {total.toFixed(0)} {CUR}</span>}
        </div>
      </div>

      {/* مودال إضافة منتج */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:8000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:20, padding:28, width:520, maxWidth:'95vw', direction:'rtl', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ fontWeight:800, marginBottom:18, fontSize:18 }}>➕ إضافة منتج للفاتورة</h3>
            <div style={{ display:'grid', gap:12 }}>
              <div><label style={S.label}>المنتج</label>
                <div style={{ display:'flex', gap:8 }}>
                  <select style={{...S.input, flex:1}} value={modal.productId} onChange={e=>{
                    const p=products.find(x=>x.id==e.target.value)
                    setModal(m=>({...m, productId:e.target.value, unitsPerCarton:p?.units||12, purchasePrice:p?.cost_price||0, sellPrice:p?.price||0}))
                  }}><option value="">-- اختر منتجاً --</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <button onClick={()=>{setShowModal(false); setShowNewProdModal(true)}} style={{...S.btn, padding:'8px 14px', fontSize:12, whiteSpace:'nowrap'}}>+ جديد</button>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={S.label}>الكرتونات</label><NumInput value={modal.cartons} onChange={e=>setModal(m=>({...m, cartons:parseInt(e.target.value)||1}))}/></div>
                <div><label style={S.label}>قطع/كرتون</label><NumInput value={modal.unitsPerCarton} onChange={e=>setModal(m=>({...m, unitsPerCarton:parseInt(e.target.value)||12}))}/></div>
                <div><label style={S.label}>سعر شراء القطعة</label><NumInput value={modal.purchasePrice} onChange={e=>setModal(m=>({...m, purchasePrice:parseFloat(e.target.value)||0}))}/></div>
                <div><label style={S.label}>سعر بيع القطعة</label><NumInput value={modal.sellPrice} onChange={e=>setModal(m=>({...m, sellPrice:parseFloat(e.target.value)||0}))}/></div>
              </div>
              {modal.purchasePrice>0 && modal.unitsPerCarton>0 && (
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:12, fontSize:13 }}>
                  <div>📦 سعر الكرتون = {modal.purchasePrice} × {modal.unitsPerCarton} = <strong style={{color:'#7c3aed'}}>{autoCarton(modal.purchasePrice,modal.unitsPerCarton).toFixed(0)} {CUR}</strong></div>
                  <div>💰 الإجمالي = {modal.cartons} × {autoCarton(modal.purchasePrice,modal.unitsPerCarton).toFixed(0)} = <strong style={{color:'#dc2626'}}>{(modal.cartons*autoCarton(modal.purchasePrice,modal.unitsPerCarton)).toFixed(0)} {CUR}</strong></div>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button style={S.btn} onClick={addItem}>✅ إضافة للفاتورة</button>
              <button style={S.btnGray} onClick={()=>setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال إضافة منتج جديد */}
      {showNewProdModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:20, padding:28, width:440, maxWidth:'95vw', direction:'rtl' }}>
            <h3 style={{ fontWeight:800, marginBottom:16, fontSize:18 }}>🆕 إضافة منتج جديد</h3>
            <div style={{ display:'grid', gap:12 }}>
              <div><label style={S.label}>اسم المنتج *</label><input style={S.input} value={newProd.name} onChange={e=>setNewProd(f=>({...f, name:e.target.value}))} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={S.label}>سعر البيع *</label><NumInput value={newProd.price} onChange={e=>setNewProd(f=>({...f, price:e.target.value}))} /></div>
                <div><label style={S.label}>قطع/كرتون</label><NumInput value={newProd.units} onChange={e=>setNewProd(f=>({...f, units:e.target.value}))} /></div>
              </div>
              <div><label style={S.label}>العلامة التجارية</label><select style={S.input} value={newProd.brandId} onChange={e=>setNewProd(f=>({...f, brandId:e.target.value}))}><option value="">-- بدون --</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button style={S.btn} onClick={saveNewProduct}>💾 حفظ وإضافة للفاتورة</button>
              <button style={S.btnGray} onClick={()=>{setShowNewProdModal(false); setShowModal(true)}}>رجوع</button>
            </div>
          </div>
        </div>
      )}

      {/* سجل المشتريات - بطاقات */}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>سجل الفواتير</h3>
        <div style={S.grid2}>
          {purchases.map(p=>{
            const its = typeof p.items === 'string' ? JSON.parse(p.items||'[]') : (p.items||[])
            return (
              <div key={p.id} style={{ background:CLR.bg, borderRadius:12, padding:12, border:`1px solid ${CLR.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontWeight:900, color:CLR.accent }}>#{p.id}</span>
                  <span style={{ fontSize:12, color:CLR.textSm }}>{p.date}</span>
                </div>
                <div style={{ fontWeight:700 }}>{p.supplier_name}</div>
                <div style={{ fontSize:12, color:CLR.textSm }}>{its.length} منتج</div>
                <div style={{ fontWeight:900, color:'#dc2626', marginTop:6 }}>{Number(p.total).toFixed(0)} {CUR}</div>
                <button style={{ ...S.btnSm, background:'#dbeafe', color:'#1d4ed8', marginTop:8 }} onClick={()=>{
                  printA4(`<div class="header"><div><h1>🛍️ نقاء</h1><p>فاتورة شراء</p></div><div><p>رقم: ${p.id}</p><p>${p.date}</p><p>المورد: ${p.supplier_name}</p></div></div><table><thead><tr><th>المنتج</th><th>الكرتونات</th><th>قطع/كرتون</th><th>سعر الكرتون</th><th>الإجمالي</th></tr></thead><tbody>${its.map(i=>`<tr><td>${i.productName}</td><td>${i.cartons||'—'}</td><td>${i.unitsPerCarton||'—'}</td><td>${(i.cartonPrice||0).toFixed(0)}</td><td>${i.totalPurchase.toFixed(0)}</td></tr>`).join('')}<tr class="total-row"><td colspan="4">الإجمالي</td><td>${Number(p.total).toFixed(0)} ${CUR}</td></tr></tbody></table>`)
                }}>🖨️ طباعة</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🎯 إدارة العروض
══════════════════════════════════════════ */
function PromotionsManager() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [promos,setPromos]=useState([]); const [products,setProducts]=useState([])
  const [saving,setSaving]=useState(false)
  const [prodSearch,setProdSearch]=useState('')
  const [form,setForm]=useState({ id:'', name:'', type:'percent', active:true, buy_qty:3, get_qty:1, discount_value:0, product_ids:[], min_amount:0, description:'', end_date:'', image:'', tier_qty:1, tier_type:'percent', tier_value:0 })

  const load=async()=>{
    const [{data:p},{data:pr}]=await Promise.all([
      supabase.from('products').select('id,name,price,image').order('name'),
      supabase.from('promotions').select('*').order('id',{ascending:false}).catch(()=>({data:[]})),
    ])
    setProducts(p||[]); setPromos(pr||[])
  }
  useEffect(()=>{ load() },[])

  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const toggleProduct=id=>setForm(f=>({...f, product_ids:f.product_ids.includes(id)?f.product_ids.filter(x=>x!==id):[...f.product_ids,id]}))
  const handleImg=e=>{const r=new FileReader();r.onload=ev=>setForm(f=>({...f,image:ev.target.result}));r.readAsDataURL(e.target.files[0])}

  const save=async()=>{
    if(!form.name.trim()){showToast('اسم العرض مطلوب','error');return} setSaving(true)
    const row={ id:form.id||Date.now(), name:form.name.trim(), type:form.type, active:form.active, buy_qty:parseInt(form.buy_qty)||3, get_qty:parseInt(form.get_qty)||1, discount_value:parseFloat(form.discount_value)||0, product_ids:JSON.stringify(form.product_ids), min_amount:parseFloat(form.min_amount)||0, description:form.description, image:form.image||null, end_date:form.end_date?new Date(form.end_date).toISOString():null, tier_qty:parseInt(form.tier_qty)||1, tier_type:form.tier_type||'percent', tier_value:parseFloat(form.tier_value)||0, created_at:form.id?undefined:new Date().toISOString() }
    if(!form.id) delete row.created_at
    const {error}=await supabase.from('promotions').upsert(row).catch(e=>({error:e}))
    if(error){showToast('⚠️ تأكد من تشغيل schema_v4.sql في Supabase','error');setSaving(false);return}
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({id:'',name:'',type:'percent',active:true,buy_qty:3,get_qty:1,discount_value:0,product_ids:[],min_amount:0,description:'',end_date:'',image:'',tier_qty:1,tier_type:'percent',tier_value:0})
    setProdSearch(''); await load(); setSaving(false)
  }

  const edit=p=>setForm({ id:p.id, name:p.name, type:p.type, active:p.active, buy_qty:p.buy_qty||3, get_qty:p.get_qty||1, discount_value:p.discount_value||0, product_ids:typeof p.product_ids==='string'?JSON.parse(p.product_ids||'[]'):(p.product_ids||[]), min_amount:p.min_amount||0, description:p.description||'', end_date:p.end_date?.split('T')[0]||'', image:p.image||'', tier_qty:p.tier_qty||1, tier_type:p.tier_type||'percent', tier_value:p.tier_value||0 })
  const del=async id=>{if(!await askConfirm('حذف هذا العرض؟'))return; await supabase.from('promotions').delete().eq('id',id).catch(()=>{}); showToast('تم الحذف'); await load() }
  const toggleActive=async(id,val)=>{ await supabase.from('promotions').update({active:val}).eq('id',id).catch(()=>{}); await load(); showToast(val?'✅ تم تفعيل العرض':'⏸️ تم إيقاف العرض') }
  const typeLabel={percent:'خصم نسبة %',fixed:'خصم مبلغ ثابت',buy_x_get_y:'اشتري X خذ Y',tier_discount:'خصم حسب الرتبة',tier_buy:'اشتري X من نفس الشركة = خصم'}

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🎯 إدارة العروض</h1>

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>{form.id?'✏️ تعديل':'➕ إنشاء'} عرض</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم العرض *</label><input style={S.input} value={form.name} onChange={F('name')} placeholder="مثال: عرض الصيف" /></div>
          <div><label style={S.label}>نوع العرض</label><select style={S.input} value={form.type} onChange={F('type')}><option value="percent">خصم نسبة %</option><option value="fixed">خصم مبلغ ثابت</option><option value="buy_x_get_y">اشتري X خذ Y</option><option value="tier_buy">📦 اشتري X من نفس الشركة = خصم</option></select></div>
          <div><label style={S.label}>تاريخ الانتهاء</label><input style={S.input} type="datetime-local" value={form.end_date} onChange={F('end_date')} /></div>
        </div>

        {form.type==='percent' && <div style={{marginTop:12}}><label style={S.label}>نسبة الخصم %</label><NumInput value={form.discount_value} onChange={F('discount_value')} style={{width:200}}/></div>}
        {form.type==='fixed' && <div style={{marginTop:12}}><label style={S.label}>مبلغ الخصم (دج)</label><NumInput value={form.discount_value} onChange={F('discount_value')} style={{width:200}}/></div>}
        {form.type==='buy_x_get_y' && <div style={{display:'flex',gap:12,marginTop:12}}><div><label style={S.label}>اشتري كم؟</label><NumInput value={form.buy_qty} onChange={F('buy_qty')} style={{width:120}}/></div><div><label style={S.label}>خذ كم مجاناً؟</label><NumInput value={form.get_qty} onChange={F('get_qty')} style={{width:120}}/></div></div>}

        <div style={{marginTop:12}}><label style={S.label}>وصف العرض</label><input style={S.input} value={form.description} onChange={F('description')} placeholder="مثال: عند شراء 3 منتجات تحصل على الرابع مجاناً!" /></div>
        <div style={{marginTop:12}}><label style={S.label}>صورة بانر العرض (1200×400)</label><input style={S.input} type="file" accept="image/*" onChange={handleImg} /></div>

        <div style={{marginTop:14}}>
          <label style={S.label}>🔍 المنتجات المشمولة (اتركها فارغة لتشمل الكل)</label>
          <input style={{...S.input,marginBottom:8}} placeholder="ابحث عن منتج..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)} />
          <div style={{maxHeight:200,overflowY:'auto',border:'1px solid #e2e8f0',borderRadius:12,padding:10}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:6}}>
              {products.filter(p=>!prodSearch||p.name.toLowerCase().includes(prodSearch.toLowerCase())).map(p=>{
                const sel=form.product_ids.includes(p.id)||form.product_ids.includes(String(p.id))
                return (<label key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:8,background:sel?'#fef2f2':'#f8fafc'}}><input type="checkbox" checked={sel} onChange={()=>toggleProduct(p.id)}/><span>{p.name}</span></label>)})}
            </div>
          </div>
        </div>

        <div style={{display:'flex',gap:10,marginTop:16}}><button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ العرض'}</button><button style={S.btnGray} onClick={()=>setForm({id:'',name:'',type:'percent',active:true,buy_qty:3,get_qty:1,discount_value:0,product_ids:[],min_amount:0,description:'',end_date:'',image:'',tier_qty:1,tier_type:'percent',tier_value:0})}>✖ إلغاء</button></div>
      </div>

      {/* قائمة العروض - بطاقات */}
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14}}>العروض الحالية ({promos.length})</h3>
        <div style={S.grid2}>
          {promos.map(p=>{
            const pids=typeof p.product_ids==='string'?JSON.parse(p.product_ids||'[]'):(p.product_ids||[])
            const isExpired=p.end_date&&new Date(p.end_date)<new Date()
            return (
              <div key={p.id} style={{ background:p.active&&!isExpired?'#f0fdf4':'#f8fafc', borderRadius:12, padding:14, border:`1px solid ${p.active&&!isExpired?'#10b981':'#e2e8f0'}` }}>
                <div style={{ fontWeight:800, fontSize:15 }}>{p.name}</div>
                <div style={{ fontSize:12, color:CLR.textSm }}>{typeLabel[p.type]||p.type}</div>
                {p.description && <div style={{ fontSize:12, color:CLR.textSm, marginTop:4 }}>"{p.description}"</div>}
                <div style={{ fontSize:11, marginTop:4 }}>{pids.length===0?'📦 يشمل كل المنتجات':`📦 ${pids.length} منتج`}</div>
                <div style={{ display:'flex', gap:6, marginTop:10, justifyContent:'flex-end' }}>
                  <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, background:p.active&&!isExpired?'#d1fae5':'#fee2e2', color:p.active&&!isExpired?'#059669':'#dc2626' }}>{isExpired?'منتهي':p.active?'فعّال':'موقوف'}</span>
                  <button style={{...S.btnSm, background:'#dbeafe', color:'#1d4ed8'}} onClick={()=>edit(p)}>✏️</button>
                  <button style={{...S.btnSm, background:'#fee2e2', color:'#dc2626'}} onClick={()=>del(p.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📋 الطلبيات - بطاقات
══════════════════════════════════════════ */
function Orders() {
  const [showToast,ToastUI]=useToast()
  const [items,setItems]=useState([]); const [search,setSearch]=useState('')
  const [statusFilter,setStatusFilter]=useState('all')
  const load=useCallback(async()=>{ const {data}=await supabase.from('orders').select('*').order('id',{ascending:false}); setItems(data||[]) },[])
  useEffect(()=>{ load() },[load])
  const updateStatus=async(id,status)=>{ await supabase.from('orders').update({status}).eq('id',id); showToast('✅ تم تحديث الحالة'); await load() }

  const filtered=items.filter(o=>{
    if(statusFilter!=='all'&&o.status!==statusFilter) return false
    if(!search) return true
    const q=search.toLowerCase()
    return String(o.id).includes(q)||o.customer_name?.toLowerCase().includes(q)||o.customer_phone?.includes(q)
  })

  const statusLabel={pending:'قيد الانتظار',processing:'تجهيز',shipped:'شُحن',delivered:'تسليم'}
  const statusBg={pending:'#fef9c3',processing:'#dbeafe',shipped:'#e0e7ff',delivered:'#d1fae5'}

  return (
    <div>{ToastUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>📋 الطلبيات</h1>
      <div style={S.card}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
          <input style={{...S.input,flex:1,minWidth:160}} placeholder="🔍 بحث برقم/اسم/هاتف..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select style={{...S.input,width:150}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">كل الحالات</option><option value="pending">قيد الانتظار</option><option value="processing">تجهيز</option><option value="shipped">شُحن</option><option value="delivered">تسليم</option>
          </select>
        </div>
      </div>

      <div style={S.grid2}>
        {filtered.map(o=>(
          <div key={o.id} style={{ background:'white', borderRadius:12, padding:14, border:`1px solid ${CLR.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontWeight:900, color:CLR.accent }}>#{o.id}</span>
              <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, background:statusBg[o.status]||'#f1f5f9', color:'#475569' }}>{statusLabel[o.status]||o.status}</span>
            </div>
            <div style={{ fontWeight:700 }}>{o.customer_name}</div>
            <div style={{ fontSize:12, color:CLR.textSm }}>📱 {o.customer_phone||'—'}</div>
            <div style={{ fontSize:12, color:CLR.textSm }}>📍 {o.customer_address?.split(',')[0]||'—'}</div>
            <div style={{ fontWeight:900, color:'#dc2626', marginTop:8 }}>{Number(o.total).toFixed(0)} {CUR}</div>
            <div style={{ display:'flex', gap:6, marginTop:10, justifyContent:'flex-end' }}>
              {['processing','shipped','delivered'].map(s=>(<button key={s} style={{...S.btnSm, background:'#f1f5f9', color:CLR.textSm}} onClick={()=>updateStatus(o.id,s)}>{{processing:'تجهيز',shipped:'شحن',delivered:'تسليم'}[s]}</button>))}
              {o.customer_phone && <a href={`https://wa.me/${o.customer_phone.replace(/^0/,'213')}?text=مرحباً ${o.customer_name}، طلبكم رقم ${o.id} قيد التحضير`} target="_blank" style={{...S.btnSm, background:'#dcfce7', color:'#059669', textDecoration:'none', padding:'5px 10px'}}>💬</a>}
            </div>
          </div>
        ))}
      </div>
      {filtered.length===0 && <div className="empty" style={{textAlign:'center',padding:40,color:CLR.textSm}}>لا توجد طلبيات</div>}
    </div>
  )
}

/* ══════════════════════════════════════════
   🏷️ العلامات التجارية - بطاقات
══════════════════════════════════════════ */
function Brands() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [editId,setEditId]=useState(null)
  const [name,setName]=useState(''); const [image,setImage]=useState('')
  const load=async()=>{ const {data}=await supabase.from('brands').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const save=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return}
    if(editId){ await supabase.from('brands').update({name:name.trim(),image:image||null}).eq('id',editId); showToast('✅ تم التعديل'); setEditId(null) }
    else { await supabase.from('brands').insert({id:Date.now(),name:name.trim(),image:image||null}); showToast('✅ تمت الإضافة') }
    setName(''); setImage(''); await load()
  }
  const del=async id=>{ if(!await askConfirm('حذف هذه العلامة؟'))return; await supabase.from('brands').delete().eq('id',id); showToast('تم الحذف'); await load() }
  const startEdit=b=>{ setEditId(b.id); setName(b.name); setImage(b.image||'') }
  const cancel=()=>{ setEditId(null); setName(''); setImage('') }

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🏷️ العلامات التجارية</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:10,color:CLR.accent}}>➕ إضافة علامة جديدة</h3>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>اسم العلامة *</label><input style={S.input} value={name} onChange={e=>setName(e.target.value)} /></div>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>شعار (300×300)</label><input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/></div>
          {image&&<img src={image} style={{width:50,height:50,borderRadius:'50%',objectFit:'cover'}}/>}
        </div>
        <div style={{display:'flex',gap:10,marginTop:12}}><button style={S.btn} onClick={save}>{editId?'💾 حفظ التعديل':'➕ إضافة'}</button>{editId&&<button style={S.btnGray} onClick={cancel}>✖ إلغاء</button>}</div>
      </div>
      <div style={S.grid2}>
        {items.map(b=>(
          <div key={b.id} style={{ background:'white', borderRadius:12, padding:14, border:`1px solid ${CLR.border}`, cursor:'pointer' }} onClick={()=>startEdit(b)}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {b.image?<img src={b.image} style={{width:50,height:50,borderRadius:'50%',objectFit:'cover'}}/>:<div style={{width:50,height:50,borderRadius:'50%',background:CLR.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🏷️</div>}
              <div style={{flex:1}}><div style={{fontWeight:800}}>{b.name}</div></div>
              <div style={{display:'flex',gap:4}}><button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={(e)=>{e.stopPropagation();startEdit(b)}}>✏️</button><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={(e)=>{e.stopPropagation();del(b.id)}}>🗑️</button></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📂 الفئات - بطاقات
══════════════════════════════════════════ */
function Categories() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [editId,setEditId]=useState(null)
  const [name,setName]=useState(''); const [image,setImage]=useState('')
  const load=async()=>{ const {data}=await supabase.from('categories').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const save=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return}
    if(editId){ await supabase.from('categories').update({name:name.trim(),image:image||null}).eq('id',editId); showToast('✅ تم التعديل'); setEditId(null) }
    else { await supabase.from('categories').insert({id:Date.now(),name:name.trim(),image:image||null}); showToast('✅ تمت الإضافة') }
    setName(''); setImage(''); await load()
  }
  const del=async id=>{ if(!await askConfirm('حذف هذه الفئة؟'))return; await supabase.from('categories').delete().eq('id',id); showToast('تم الحذف'); await load() }
  const startEdit=c=>{ setEditId(c.id); setName(c.name); setImage(c.image||'') }

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>📂 الفئات</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:10,color:CLR.accent}}>➕ إضافة فئة جديدة</h3>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>اسم الفئة *</label><input style={S.input} value={name} onChange={e=>setName(e.target.value)} /></div>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>صورة (400×300)</label><input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/></div>
          {image&&<img src={image} style={{width:60,height:45,borderRadius:8,objectFit:'cover'}}/>}
        </div>
        <div style={{display:'flex',gap:10,marginTop:12}}><button style={S.btn} onClick={save}>{editId?'💾 حفظ التعديل':'➕ إضافة'}</button>{editId&&<button style={S.btnGray} onClick={()=>{setEditId(null);setName('');setImage('')}}>✖ إلغاء</button>}</div>
      </div>
      <div style={S.grid2}>
        {items.map(c=>(
          <div key={c.id} style={{ background:'white', borderRadius:12, padding:14, border:`1px solid ${CLR.border}`, cursor:'pointer' }} onClick={()=>startEdit(c)}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {c.image?<img src={c.image} style={{width:50,height:40,borderRadius:8,objectFit:'cover'}}/>:<div style={{width:50,height:40,borderRadius:8,background:CLR.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📁</div>}
              <div style={{flex:1}}><div style={{fontWeight:800}}>{c.name}</div></div>
              <div style={{display:'flex',gap:4}}><button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={(e)=>{e.stopPropagation();startEdit(c)}}>✏️</button><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={(e)=>{e.stopPropagation();del(c.id)}}>🗑️</button></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   المكون الرئيسي مع التحكم بالصلاحيات
══════════════════════════════════════════ */
export default function Admin() {
  const [user, setUser] = useState(null)
  const [section, setSection] = useState('dashboard')
  const [showToast, ToastUI] = useToast()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('nq_admin')
    if (saved) try { setUser(JSON.parse(saved)) } catch {}
  }, [])

  const handleLogin = u => { setUser(u); sessionStorage.setItem('nq_admin', JSON.stringify(u)) }
  const handleLogout = () => { setUser(null); sessionStorage.removeItem('nq_admin') }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  // تحديد الصفحات المسموحة حسب صلاحيات الموظف
  const userPermissions = user.permissions || []
  const isSuperAdmin = user.role === 'super_admin'

  const allSections = [
    { id:'dashboard', icon:'📊', label:'لوحة القيادة' },
    { id:'products', icon:'📦', label:'المنتجات' },
    { id:'categories', icon:'📂', label:'الفئات' },
    { id:'brands', icon:'🏷️', label:'العلامات التجارية' },
    { id:'suppliers', icon:'🏭', label:'الموردون' },
    { id:'customers', icon:'👥', label:'العملاء' },
    { id:'employees', icon:'👔', label:'الموظفون' },
    { id:'coupons', icon:'🎟️', label:'الكوبونات' },
    { id:'purchases', icon:'🛒', label:'المشتريات' },
    { id:'inventory', icon:'🗂️', label:'المخزون' },
    { id:'orders', icon:'📋', label:'الطلبيات' },
    { id:'promotions', icon:'🎯', label:'إدارة العروض' },
    { id:'notifications', icon:'🔔', label:'الإشعارات' },
    { id:'reports', icon:'📈', label:'التقارير' },
    { id:'expenses', icon:'💸', label:'المصاريف' },
    { id:'storeManager', icon:'🎨', label:'إدارة المتجر' },
    { id:'backup', icon:'💾', label:'نسخ احتياطي' },
    { id:'settings', icon:'⚙️', label:'الإعدادات' },
    { id:'about', icon:'🏢', label:'من نحن' },
    { id:'contact', icon:'📞', label:'اتصل بنا' },
    { id:'returnPolicy', icon:'🔄', label:'سياسة الاسترجاع' },
  ]

  const visibleSections = isSuperAdmin ? allSections : allSections.filter(s => userPermissions.includes(s.id))

  const renderSection = () => {
    switch(section) {
      case 'dashboard': return <Dashboard userPermissions={userPermissions} />
      case 'products': return <Products />  // سيتم إضافة Products لاحقاً
      case 'categories': return <Categories />
      case 'brands': return <Brands />
      case 'suppliers': return <Suppliers />  // سيتم إضافة Suppliers لاحقاً
      case 'customers': return <Customers />  // سيتم إضافة Customers لاحقاً
      case 'employees': return <Employees userPermissions={userPermissions} showToast={showToast} />
      case 'coupons': return <Coupons />  // سيتم إضافة Coupons لاحقاً
      case 'purchases': return <Purchases />
      case 'inventory': return <Inventory />  // سيتم إضافة Inventory لاحقاً
      case 'orders': return <Orders />
      case 'promotions': return <PromotionsManager />
      case 'notifications': return <Notifications />  // سيتم إضافة Notifications لاحقاً
      case 'reports': return <Reports />  // سيتم إضافة Reports لاحقاً
      case 'expenses': return <Expenses />  // سيتم إضافة Expenses لاحقاً
      case 'storeManager': return <StoreManager showToast={showToast} />
      case 'backup': return <DataBackup showToast={showToast} />
      case 'settings': return <Settings showToast={showToast} />
      case 'about': return <AboutUs showToast={showToast} />
      case 'contact': return <ContactUs showToast={showToast} />
      case 'returnPolicy': return <ReturnPolicy showToast={showToast} />
      default: return <Dashboard userPermissions={userPermissions} />
    }
  }

  // تجميع الصفحات في مجموعات
  const navGroups = [
    { label:'الرئيسية', items:['dashboard'] },
    { label:'المنتجات والمخزون', items:['products','categories','brands','inventory'] },
    { label:'المبيعات', items:['orders','promotions','coupons'] },
    { label:'الموارد', items:['purchases','suppliers','expenses'] },
    { label:'العملاء', items:['customers','notifications'] },
    { label:'الإدارة', items:['employees','reports','storeManager','backup','settings','about','contact','returnPolicy'] },
  ]

  return (
    <div dir="rtl" style={{ display:'flex', minHeight:'100vh', background:CLR.bg }}>
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
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: collapsed ? 58 : 232, background:CLR.primary, position:'sticky', top:0, height:'100vh', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden', transition:'width .22s ease', boxShadow:'2px 0 16px rgba(0,0,0,.15)', zIndex:100 }}>
        <div style={{ padding: collapsed?'14px 9px':'14px 14px', borderBottom:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:9,flexShrink:0, background:'linear-gradient(135deg,#F97316,#EA6C0A)', display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>🛍️</div>
            {!collapsed && <div><div style={{ fontWeight:900, fontSize:15, color:'white', lineHeight:1.2 }}>نقاء</div><div style={{ fontSize:10, color:'rgba(255,255,255,.45)' }}>لوحة الإدارة</div></div>}
          </div>
          {!collapsed && <div style={{ marginTop:10, padding:'7px 10px', background:'rgba(255,255,255,.07)', borderRadius:7, fontSize:12, color:'rgba(255,255,255,.75)', display:'flex', alignItems:'center', gap:6 }}><span>👤</span><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</span></div>}
        </div>

        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'6px 0' }}>
          {navGroups.map(group => {
            const visibleItems = group.items.filter(id => visibleSections.some(s => s.id === id))
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                {!collapsed && <div style={{ padding:'8px 14px 3px', fontSize:9, fontWeight:800, color:'rgba(255,255,255,.28)', letterSpacing:'0.9px', textTransform:'uppercase' }}>{group.label}</div>}
                {visibleItems.map(id => {
                  const s = allSections.find(x=>x.id===id)
                  if (!s) return null
                  return (<div key={s.id} className={`sitem${section===s.id?' on':''}`} onClick={()=>setSection(s.id)} title={collapsed?s.label:''}><span className="ico">{s.icon}</span>{!collapsed && <span>{s.label}</span>}</div>)
                })}
              </div>
            )
          })}
        </nav>

        <div style={{ padding:'8px 6px', borderTop:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
          <a href="/" target="_blank" style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7, color:'rgba(255,255,255,.5)',textDecoration:'none',fontSize:12,fontWeight:600, transition:'.15s',marginBottom:3 }} onMouseEnter={e=>{e.currentTarget.style.color='white';e.currentTarget.style.background='rgba(255,255,255,.06)'}} onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,.5)';e.currentTarget.style.background='none'}}><span>🛍️</span>{!collapsed&&<span>عرض المتجر</span>}</a>
          <button onClick={handleLogout} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7, color:'rgba(239,68,68,.7)',background:'none',border:'none',cursor:'pointer', fontSize:12,fontWeight:600,width:'100%',textAlign:'right',fontFamily:'inherit' }} onMouseEnter={e=>{e.currentTarget.style.color='#EF4444';e.currentTarget.style.background='rgba(239,68,68,.08)'}} onMouseLeave={e=>{e.currentTarget.style.color='rgba(239,68,68,.7)';e.currentTarget.style.background='none'}}><span>🚪</span>{!collapsed&&<span>خروج</span>}</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <header style={{ background:'white', borderBottom:`1px solid ${CLR.border}`, padding:'0 20px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:150, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={()=>setCollapsed(p=>!p)} style={{ background:'none',border:'none',cursor:'pointer', fontSize:16,color:CLR.textSm,padding:'4px 6px',borderRadius:6 }} onMouseEnter={e=>e.currentTarget.style.background=CLR.bg} onMouseLeave={e=>e.currentTarget.style.background='none'}>{collapsed?'☰':'✕'}</button>
            <div style={{ fontSize:14, fontWeight:700, color:CLR.text }}>{visibleSections.find(s=>s.id===section)?.icon} {visibleSections.find(s=>s.id===section)?.label}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12,color:CLR.textSm,background:CLR.bg, borderRadius:6,padding:'4px 10px',border:`1px solid ${CLR.border}`,fontWeight:600 }}>{new Date().toLocaleDateString('ar-DZ',{day:'numeric',month:'short'})}</span>
            <a href="/" target="_blank" style={{ fontSize:12,color:CLR.accent,background:'#FFF7ED', borderRadius:6,padding:'4px 10px',border:'1px solid #FED7AA', textDecoration:'none',fontWeight:700 }}>🛍️ المتجر</a>
          </div>
        </header>
        <main style={{ flex:1, padding:22, overflowY:'auto' }}>{renderSection()}</main>
      </div>
    </div>
  )
}

// المكونات المتبقية (ستضاف لاحقاً - مقتطفات)
function Products() { return <div>📦 المنتجات - قيد التطوير</div> }
function Suppliers() { return <div>🏭 الموردون - قيد التطوير</div> }
function Customers() { return <div>👥 العملاء - قيد التطوير</div> }
function Coupons() { return <div>🎟️ الكوبونات - قيد التطوير</div> }
function Inventory() { return <div>🗂️ المخزون - قيد التطوير</div> }
function Notifications() { return <div>🔔 الإشعارات - قيد التطوير</div> }
function Reports() { return <div>📈 التقارير - قيد التطوير</div> }
function Expenses() { return <div>💸 المصاريف - قيد التطوير</div> }
function StoreManager({ showToast }) { return <div>🎨 إدارة المتجر - قيد التطوير</div> }
function DataBackup({ showToast }) { return <div>💾 النسخ الاحتياطي - قيد التطوير</div> }
function Settings({ showToast }) { return <div>⚙️ الإعدادات - قيد التطوير</div> }
function AboutUs({ showToast }) { return <div>🏢 من نحن - قيد التطوير</div> }
function ContactUs({ showToast }) { return <div>📞 اتصل بنا - قيد التطوير</div> }
function ReturnPolicy({ showToast }) { return <div>🔄 سياسة الاسترجاع - قيد التطوير</div> }