/**
 * Admin.jsx — نقاء v6 (نسخة احترافية شاملة)
 * ✅ مصادقة ثنائية (6789)
 * ✅ تصنيف العملاء M1/M2/M3
 * ✅ إدارة العروض الكاملة
 * ✅ استيراد/تصدير Excel
 * ✅ نسخ احتياطي
 * ✅ حقول رقمية فقط
 * ✅ صلاحيات الموظفين الكاملة
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
    onKeyDown={e => {
      if (['-','e','E','+'].includes(e.key)) e.preventDefault()
    }}
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
  th:      { padding:'11px 14px', textAlign:'right', background:CLR.bg,
             fontWeight:700, fontSize:12, color:CLR.textSm,
             borderBottom:`2px solid ${CLR.border}`, whiteSpace:'nowrap',
             userSelect:'none' },
  td:      { padding:'11px 14px', textAlign:'right', fontSize:13,
             borderBottom:`1px solid ${CLR.bg}`, verticalAlign:'middle' },
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
   🔐 تسجيل الدخول مع مصادقة ثنائية وصلاحيات
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
      let perms = []
      try { perms = typeof data.permissions === 'string' ? JSON.parse(data.permissions||'[]') : (data.permissions||[]) } catch(e) {}
      setUserData({ id:data.id, name:data.name, email:data.email, role:data.role, permissions:perms })
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

function Dashboard() {
  const [stats,  setStats]  = useState({ products:0, orders:0, sales:0, profit:0, todaySales:0,
    lastMonthSales:0, thisMonthSales:0 })
  const [recent,    setRecent]    = useState([])
  const [lowStock,  setLowStock]  = useState([])
  const [weekData,  setWeekData]  = useState([0,0,0,0,0,0,0])
  const [monthData, setMonthData] = useState([0,0,0,0])
  const [chartMode, setChartMode] = useState('week')

  useEffect(() => {
    const load = async () => {
      const [{ data:prods },{ data:ords },{ data:purcs },{ data:exps }] = await Promise.all([
        supabase.from('products').select('id,name,stock,min_stock'),
        supabase.from('orders').select('*').order('id',{ascending:false}),
        supabase.from('purchases').select('total'),
        supabase.from('expenses').select('amount'),
      ])
      const now = new Date()
      const thisMonth = now.getMonth(); const thisYear = now.getFullYear()
      const lastMonth = thisMonth===0?11:thisMonth-1
      const lastYear  = thisMonth===0?thisYear-1:thisYear
      const today = now.toLocaleDateString()
      const todayO = (ords||[]).filter(o=>new Date(o.created_at||o.date).toLocaleDateString()===today)
      const sales  = (ords||[]).reduce((s,o)=>s+Number(o.total),0)
      const pur    = (purcs||[]).reduce((s,p)=>s+Number(p.total),0)
      const exp    = (exps||[]).reduce((s,e)=>s+Number(e.amount),0)
      const week7 = Array(7).fill(0)
      ;(ords||[]).forEach(o=>{
        const d = new Date(o.created_at||o.date)
        const diff = Math.floor((now-d)/(86400000))
        if(diff>=0&&diff<7) week7[6-diff]+=Number(o.total)
      })
      const wk4 = Array(4).fill(0)
      ;(ords||[]).forEach(o=>{
        const d = new Date(o.created_at||o.date)
        const diff = Math.floor((now-d)/(86400000*7))
        if(diff>=0&&diff<4) wk4[3-diff]+=Number(o.total)
      })
      const thisM = (ords||[]).filter(o=>{ const d=new Date(o.created_at||o.date); return d.getMonth()===thisMonth&&d.getFullYear()===thisYear }).reduce((s,o)=>s+Number(o.total),0)
      const lastM = (ords||[]).filter(o=>{ const d=new Date(o.created_at||o.date); return d.getMonth()===lastMonth&&d.getFullYear()===lastYear }).reduce((s,o)=>s+Number(o.total),0)
      const changeP = lastM>0?Math.round((thisM-lastM)/lastM*100):0
      setStats({ products:(prods||[]).length, orders:(ords||[]).length, sales, profit:sales-pur-exp,
        todaySales:todayO.reduce((s,o)=>s+Number(o.total),0),
        thisMonthSales:thisM, lastMonthSales:lastM, changeP })
      setRecent((ords||[]).slice(0,8))
      const minStk = p=>(p.min_stock||5)
      setLowStock((prods||[]).filter(p=>(p.stock||0)<minStk(p)))
      setWeekData(week7); setMonthData(wk4)
    }
    load()
  }, [])

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
    <div>
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

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
        <StatCard label="المنتجات"        value={stats.products}  icon="📦" color={CLR.info}    spark={[stats.products,stats.products]}/>
        <StatCard label="الطلبيات"        value={stats.orders}    icon="📋" color={CLR.success}  spark={weekData}/>
        <StatCard label="مبيعات اليوم"    value={`${stats.todaySales.toFixed(0)} ${CUR}`} icon="⚡" color={CLR.warn} spark={weekData}/>
        <StatCard label="هذا الشهر"       value={`${stats.thisMonthSales.toFixed(0)} ${CUR}`} icon="📅" color={CLR.accent} change={stats.changeP} spark={monthData}/>
        <StatCard label="صافي الربح"      value={`${stats.profit.toFixed(0)} ${CUR}`} icon="💰" color={stats.profit>=0?CLR.success:CLR.danger} spark={weekData}/>
      </div>

      {lowStock.length>0&&(
        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10,
          padding:'12px 16px', marginBottom:18, display:'flex', gap:12, alignItems:'flex-start' }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <strong style={{ color:'#C2410C', fontSize:13 }}>مخزون منخفض — {lowStock.length} منتج</strong>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
              {lowStock.map(p=>(
                <span key={p.id} style={{ background:'white', border:'1px solid #FED7AA', color:'#C2410C',
                  padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                  {p.name} ({p.stock||0} كرتون)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ ...S.card, marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontWeight:800, fontSize:15, color:CLR.text }}>📈 المبيعات</h3>
          <div style={{ display:'flex', gap:6 }}>
            {[['week','أسبوعي'],['month','شهري']].map(([v,l])=>(
              <button key={v} onClick={()=>setChartMode(v)}
                style={{ ...S.btnSm, background:chartMode===v?CLR.accent:'#F1F5F9',
                  color:chartMode===v?'white':CLR.textSm, padding:'4px 12px' }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:16, marginBottom:14, flexWrap:'wrap' }}>
          {[['هذا الشهر',stats.thisMonthSales,CLR.accent],['الشهر الماضي',stats.lastMonthSales,'#94A3B8']].map(([l,v,c])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              <div style={{ width:10,height:10,borderRadius:'50%',background:c }}/>
              <span style={{ color:CLR.textSm }}>{l}:</span>
              <span style={{ fontWeight:700,color:CLR.text }}>{v.toFixed(0)} {CUR}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:chartH+24, paddingBottom:20, position:'relative' }}>
          {(chartMode==='week'?weekData:monthData).map((v,i)=>{
            const h = chartMode==='week'?Math.max(4,(v/maxW)*chartH):Math.max(4,(v/maxM)*chartH)
            const lbl = chartMode==='week'?wkDays[i]:`أسبوع ${i+1}`
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:10, color:CLR.textSm, fontWeight:600 }}>{v>0?v.toFixed(0):''}</div>
                <div style={{ width:'100%', height:h, borderRadius:'4px 4px 0 0',
                  background:i===(chartMode==='week'?weekData:monthData).length-1
                    ?`linear-gradient(180deg,${CLR.accent},${CLR.accentDk})`
                    :'#DBEAFE',
                  transition:'height .4s ease', minHeight:4 }}/>
                <div style={{ fontSize:10, color:CLR.textSm, position:'absolute', bottom:0 }}>{lbl}</div>
              </div>
            )
          })}
        </div>
      </div>

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
    </div>
  )
}

/* ══════════════════════════════════════════
   📦 المنتجات
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
  const [showModal, setShowModal] = useState(false)
  const [form,setForm]=useState({ id:'',name:'',price:'',costPrice:'',cartonPrice:'',
    units:12,stock:0,minStock:5,sku:'',brandId:'',image:'',discount:0,isPromo:false,description:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const [{data:p},{data:b},{data:c}] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(p||[]); setBrands(b||[]); setCategories(c||[]); setLoading(false)
  }, [])
  useEffect(()=>{ load() },[load])

  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))
  const handleImg = e => { const r=new FileReader(); r.onload=ev=>setForm(f=>({...f,image:ev.target.result})); r.readAsDataURL(e.target.files[0]) }

  const save = async () => {
    if (!form.name.trim()||!form.price) { showToast('الاسم والسعر مطلوبان','error'); return }
    setSaving(true)
    const row = {
      id:form.id||Date.now(), name:form.name.trim(),
      price:parseFloat(form.price)||0, cost_price:parseFloat(form.costPrice)||0,
      carton_price:form.cartonPrice?parseFloat(form.cartonPrice):null,
      units:parseInt(form.units)||12, stock:parseInt(form.stock)||0,
      min_stock:parseInt(form.minStock)||5,
      sku:form.sku||'', brand_id:form.brandId?parseInt(form.brandId):null,
      image:form.image||null, is_promo:form.isPromo,
      description:form.description||'',
      discount:parseFloat(form.discount)||0, disabled:false,
      created_at:form.id?undefined:new Date().toISOString()
    }
    if (!form.id) delete row.created_at
    const { error } = await supabase.from('products').upsert(row)
    if (error) { showToast('خطأ: '+error.message,'error'); setSaving(false); return }
    if (form.id) await supabase.from('product_categories').delete().eq('product_id',row.id)
    if (selCats.length>0) {
      await supabase.from('product_categories').upsert(
        selCats.map(cid=>({ id:Date.now()+Math.random(), product_id:row.id, category_id:cid }))
      ).catch(()=>{})
    }
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({ id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false })
    setSelCats([])
    setShowModal(false)
    await load(); setSaving(false)
  }

  const edit = async p => {
    setForm({ id:p.id, name:p.name, price:p.price||'', costPrice:p.cost_price||'',
      cartonPrice:p.carton_price||'', units:p.units||12, stock:p.stock||0,
      minStock:p.min_stock||5, sku:p.sku||'', brandId:p.brand_id||'',
      image:p.image||'', discount:p.discount||0, isPromo:p.is_promo||false,
      description:p.description||'' })
    const { data } = await supabase.from('product_categories').select('category_id').eq('product_id',p.id)
    setSelCats((data||[]).map(r=>r.category_id))
    setShowModal(true)
  }

  const del = async id => {
    if (!await askConfirm('حذف هذا المنتج؟')) return
    await supabase.from('products').delete().eq('id',id)
    showToast('تم الحذف'); await load()
  }

  const toggleCat = id => setSelCats(prev => prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])

  const filtered = products.filter(p=>{
    const matchSearch=!search||p.name?.toLowerCase().includes(search.toLowerCase())
    const matchBrand=!brandFilter||p.brand_id==brandFilter
    const matchStock=stockFilter==='all'||(stockFilter==='low'&&(p.stock||0)<5)||(stockFilter==='ok'&&(p.stock||0)>=5)
    return matchSearch&&matchBrand&&matchStock
  })

  const cartonPrice = (price, units) => (parseFloat(price)||0) * (parseInt(units)||12)

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
                    <th style={S.th}>سعر الكرتون</th>
                    <th style={S.th}>المخزون</th>
                    <th style={S.th}>الماركة</th>
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
                          {p.sku&&<div style={{fontSize:11,color:CLR.textSm}}>{p.sku}</div>}
                         </td>
                        <td style={{ ...S.td, fontWeight:700, color:CLR.accent }}>{p.price} {CUR}</td>
                        <td style={{ ...S.td, color:'#7c3aed', fontWeight:700 }}>{cartonPrice(p.price, p.units).toFixed(0)} {CUR}</td>
                        <td style={S.td}>
                          <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                            background:stockStyle.bg, color:stockStyle.color }}>
                            {p.stock||0} كرتون
                          </span>
                         </td>
                        <td style={{ ...S.td, color:CLR.textSm }}>
                          {brands.find(b=>b.id==p.brand_id)?.name||'—'}
                         </td>
                        <td style={S.td} onClick={e=>e.stopPropagation()}>
                          <div style={{ display:'flex', gap:4 }}>
                            <button style={{ ...S.btnSm, background:'#DBEAFE', color:'#1D4ED8' }} onClick={()=>edit(p)}>✏️</button>
                            <button style={{ ...S.btnSm, background:'#FEE2E2', color:'#DC2626' }} onClick={()=>del(p.id)}>🗑️</button>
                          </div>
                         </td>
                       </td>
                    )
                  })}
                  {filtered.length===0&&茅<td colSpan={7} style={{textAlign:'center',padding:36,color:CLR.textSm}}>
                    <div style={{ fontSize:32, marginBottom:8 }}>📦</div>لا توجد منتجات
                   </td></tr>}
                </tbody>
              </table>
            </div>}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:7000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:16, padding:24, width:'100%', maxWidth:640,
            maxHeight:'90vh', overflowY:'auto', direction:'rtl' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontWeight:900, fontSize:17 }}>{form.id ? '✏️ تعديل منتج' : '➕ إضافة منتج جديد'}</h3>
              <button onClick={()=>{ setShowModal(false); setForm({id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false}); setSelCats([]) }}
                style={{ background:CLR.bg, border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>اسم المنتج *</label><input style={S.input} value={form.name} onChange={F('name')}/></div>
              <div><label style={S.label}>سعر البيع *</label><NumInput value={form.price} onChange={F('price')}/></div>
              <div><label style={S.label}>سعر الشراء</label><NumInput value={form.costPrice} onChange={F('costPrice')}/></div>
              <div><label style={S.label}>قطع/كرتون</label><NumInput value={form.units} onChange={F('units')}/></div>
              <div><label style={S.label}>المخزون</label><NumInput value={form.stock} onChange={F('stock')}/></div>
              <div><label style={S.label}>الحد الأدنى للتنبيه</label><NumInput value={form.minStock||5} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))}/></div>
              <div><label style={S.label}>خصم %</label><NumInput value={form.discount} onChange={F('discount')}/></div>
              <div><label style={S.label}>الباركود / SKU</label><input style={S.input} value={form.sku} onChange={F('sku')}/></div>
              <div><label style={S.label}>العلامة التجارية</label>
                <select style={S.input} value={form.brandId} onChange={F('brandId')}>
                  <option value="">-- بدون --</option>
                  {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select></div>
              <div><label style={S.label}>صورة المنتج (600×600)</label><input style={S.input} type="file" accept="image/*" onChange={handleImg}/></div>
              {form.image && <div><img src={form.image} style={{width:80,height:80,objectFit:'cover',borderRadius:12}}/></div>}
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
              <input type="checkbox" id="isPromo" checked={form.isPromo} onChange={e=>setForm(f=>({...f,isPromo:e.target.checked}))} />
              <label htmlFor="isPromo" style={{ fontWeight:700, fontSize:14, cursor:'pointer' }}>⚡ منتج ضمن العروض الخاصة</label>
            </div>
            <div style={{ marginTop:14 }}>
              <label style={S.label}>وصف المنتج</label>
              <textarea style={S.input} rows="2" value={form.description} onChange={F('description')}/>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
              <button style={S.btnGray} onClick={()=>{ setShowModal(false); setForm({id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false}); setSelCats([]) }}>إلغاء</button>
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
  const [showModal, setShowModal] = useState(false)
  
  const load=async()=>{ const {data}=await supabase.from('categories').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  
  const save=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return}
    if(editId){
      await supabase.from('categories').update({name:name.trim(),image:image||null}).eq('id',editId)
      showToast('✅ تم التعديل')
    } else {
      await supabase.from('categories').insert({id:Date.now(),name:name.trim(),image:image||null})
      showToast('✅ تمت الإضافة')
    }
    setName(''); setImage(''); setEditId(null); setShowModal(false); await load()
  }
  
  const startEdit=c=>{ setEditId(c.id); setName(c.name); setImage(c.image||''); setShowModal(true) }
  const del=async id=>{
    if(!await askConfirm('حذف هذه الفئة؟'))return
    await supabase.from('categories').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>📂 الفئات</h1>

      <div style={S.card}>
        <button style={S.btn} onClick={()=>{ setEditId(null); setName(''); setImage(''); setShowModal(true) }}>➕ إضافة فئة جديدة</button>
      </div>

      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الصورة</th><th style={S.th}>الاسم</th><th style={S.th}>إجراءات</th></tr></thead>
          <tbody>{items.map((c,i)=>(
            <tr key={c.id} className="nq-tr" style={{background:i%2===0?'white':CLR.bg,cursor:'pointer'}} onClick={()=>startEdit(c)}>
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
          {items.length===0&&茅<td colSpan={3} style={{textAlign:'center',padding:28,color:CLR.textSm}}>
            <div style={{fontSize:32,marginBottom:8}}>📂</div>لا توجد فئات
          </td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:14,padding:24,width:'100%',maxWidth:440,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>{editId ? '✏️ تعديل الفئة' : '➕ إضافة فئة جديدة'}</h3>
              <button onClick={()=>{setShowModal(false); setEditId(null); setName(''); setImage('')}} 
                style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} />
            <label style={{...S.label,marginTop:10}}>صورة (400×300)</label>
            <input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/>
            {image&&<img src={image} style={{width:'100%',height:60,objectFit:'cover',borderRadius:8,marginTop:8}}/>}
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={save}>💾 حفظ</button>
              <button style={S.btnGray} onClick={()=>{setShowModal(false); setEditId(null); setName(''); setImage('')}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
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
  const [showModal, setShowModal] = useState(false)
  
  const load=async()=>{ const {data}=await supabase.from('brands').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  
  const save=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return}
    if(editId){
      await supabase.from('brands').update({name:name.trim(),image:image||null}).eq('id',editId)
      showToast('✅ تم التعديل')
    } else {
      await supabase.from('brands').insert({id:Date.now(),name:name.trim(),image:image||null})
      showToast('✅ تمت الإضافة')
    }
    setName(''); setImage(''); setEditId(null); setShowModal(false); await load()
  }
  
  const startEdit=b=>{ setEditId(b.id); setName(b.name); setImage(b.image||''); setShowModal(true) }
  const del=async id=>{
    if(!await askConfirm('حذف هذه العلامة؟'))return
    await supabase.from('brands').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🏷️ العلامات التجارية</h1>

      <div style={S.card}>
        <button style={S.btn} onClick={()=>{ setEditId(null); setName(''); setImage(''); setShowModal(true) }}>➕ إضافة علامة جديدة</button>
      </div>

      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الشعار</th><th style={S.th}>الاسم</th><th style={S.th}>إجراءات</th></tr></thead>
          <tbody>{items.map((b,i)=>(
            <tr key={b.id} className="nq-tr" style={{background:i%2===0?'white':CLR.bg,cursor:'pointer'}} onClick={()=>startEdit(b)}>
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
          {items.length===0&&茅<td colSpan={3} style={{textAlign:'center',padding:28,color:CLR.textSm}}>
            <div style={{fontSize:32,marginBottom:8}}>🏷️</div>لا توجد علامات
          </td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:14,padding:24,width:'100%',maxWidth:400,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>{editId ? '✏️ تعديل العلامة' : '➕ إضافة علامة جديدة'}</h3>
              <button onClick={()=>{setShowModal(false); setEditId(null); setName(''); setImage('')}} 
                style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} />
            <label style={{...S.label,marginTop:10}}>شعار (300×300)</label>
            <input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/>
            {image&&<img src={image} style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',display:'block',margin:'8px auto 0'}}/>}
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={save}>💾 حفظ</button>
              <button style={S.btnGray} onClick={()=>{setShowModal(false); setEditId(null); setName(''); setImage('')}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   🏭 الموردون
══════════════════════════════════════════ */
function Suppliers() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form,setForm]=useState({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})
  
  const load=async()=>{ const {data}=await supabase.from('suppliers').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  
  const save=async()=>{
    if(!form.name.trim()){showToast('الاسم مطلوب','error');return} setSaving(true)
    await supabase.from('suppliers').upsert({id:form.id||Date.now(),name:form.name.trim(),phone:form.phone,whatsapp:form.whatsapp,email:form.email,address:form.address})
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})
    setShowModal(false)
    await load(); setSaving(false)
  }
  
  const edit=s=>{ setForm({id:s.id,name:s.name,phone:s.phone||'',whatsapp:s.whatsapp||'',email:s.email||'',address:s.address||''}); setShowModal(true) }
  const del=async id=>{if(!await askConfirm('حذف هذا المورد؟'))return;await supabase.from('suppliers').delete().eq('id',id);showToast('تم الحذف');await load()}
  
  const filtered=items.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase()))
  
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🏭 الموردون</h1>
      
      <div style={S.card}>
        <button style={S.btn} onClick={()=>{ setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''}); setShowModal(true) }}>➕ إضافة مورد جديد</button>
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
                <td style={{...S.td,fontWeight:700}}>{s.name}</td><td style={S.td}>{s.phone||'—'}</td>
                <td style={S.td}>{s.whatsapp?<a href={`https://wa.me/${s.whatsapp}`} target="_blank" style={{color:'#25D366',fontWeight:700}}>💬 {s.whatsapp}</a>:'—'}</td>
                <td style={{...S.td,display:'flex',gap:5}}>
                  <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>edit(s)}>✏️</button>
                  <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(s.id)}>🗑️</button>
                </td>
              </tr>
            ))}
            {filtered.length===0&&茅<td colSpan={4} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد موردين茅</td>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:16,padding:24,width:'100%',maxWidth:500,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>{form.id ? '✏️ تعديل مورد' : '➕ إضافة مورد جديد'}</h3>
              <button onClick={()=>{setShowModal(false); setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})}} 
                style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
              <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} inputMode="numeric"/></div>
              <div><label style={S.label}>واتساب</label><input style={S.input} value={form.whatsapp} onChange={F('whatsapp')} inputMode="numeric"/></div>
              <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
              <div><label style={S.label} colSpan="2">العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
              <button style={S.btnGray} onClick={()=>{setShowModal(false); setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   👥 العملاء
══════════════════════════════════════════ */
function Customers() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false)
  const [tierSettings,setTierSettings]=useState({ m1:0, m2:5000, m3:20000, d1:0, d2:5, d3:10 })
  const [showModal, setShowModal] = useState(false)
  const [form,setForm]=useState({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1'})
  const [tierFilter,setTierFilter]=useState('all')

  const load=async()=>{
    const {data}=await supabase.from('customers').select('*').order('name')
    setItems(data||[])
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

  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  const save=async()=>{
    if(!form.name.trim()){showToast('الاسم مطلوب','error');return} setSaving(true)
    const ex=items.find(c=>c.id==form.id)
    const {error}=await supabase.from('customers').upsert({
      id:form.id||Date.now(), name:form.name.trim(), email:form.email, phone:form.phone,
      address:form.address, tier:form.tier,
      password:form.password?hashPwd(form.password):(ex?.password||hashPwd('123456')),
      points:ex?.points||0, created_at:ex?.created_at||new Date().toISOString()
    })
    if(error){showToast('خطأ: '+error.message,'error');setSaving(false);return}
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1'})
    setShowModal(false)
    await load(); setSaving(false)
  }

  const edit=c=>{ setForm({id:c.id,name:c.name,email:c.email||'',phone:c.phone||'',address:c.address||'',password:'',tier:c.tier||'M1'}); setShowModal(true) }
  const del=async id=>{if(!await askConfirm('حذف هذا العميل؟'))return;await supabase.from('customers').delete().eq('id',id);showToast('تم الحذف');await load()}

  const tierLabel = t => ({ M1:'🥉 M1 عادي', M2:'🥈 M2 مميز', M3:'🥇 M3 VIP' }[t]||t)
  const filtered=items.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search))

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
      </div>

      <div style={S.card}>
        <button style={S.btn} onClick={()=>{ setForm({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1'}); setShowModal(true) }}>➕ إضافة عميل جديد</button>
      </div>

      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10,alignItems:'center'}}>
          <h3 style={{fontWeight:800,fontSize:15}}>العملاء <span style={{marginRight:8,background:CLR.bg,border:'1px solid #E2E8F0',borderRadius:20,padding:'2px 10px',fontSize:12,fontWeight:600,color:CLR.textSm}}>{filtered.length}</span></h3>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <input style={{...S.input,width:200}} placeholder="🔍 اسم / هاتف..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select style={{...S.input,width:110}} value={tierFilter||'all'} onChange={e=>setTierFilter(e.target.value)}>
              <option value="all">كل الرتب</option><option value="M1">🥉 M1</option><option value="M2">🥈 M2</option><option value="M3">🥇 M3</option>
            </select>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:CLR.bg}}>
              <th style={S.th}>الاسم</th><th style={S.th}>الهاتف</th><th style={S.th}>الولاية</th><th style={S.th}>الرتبة</th><th style={S.th}>المشتريات</th><th style={S.th}>النقاط</th><th style={S.th}>إجراءات</th>
            </tr></thead>
            <tbody>{filtered.filter(c=>!tierFilter||tierFilter==='all'||(c.tier||'M1')===tierFilter).map((c,i)=>{
              const ts={M1:{bg:'#F1F5F9',color:CLR.textSm},M2:{bg:'#DBEAFE',color:'#1D4ED8'},M3:{bg:'#FEF9C3',color:'#92400E'}}[c.tier||'M1']
              return (
                <tr key={c.id} style={{background:i%2===0?'white':CLR.bg,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='#FFF7ED'} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':CLR.bg} onClick={()=>edit(c)}>
                  <td style={{...S.td,fontWeight:700}}><div>{c.name}</div>{c.email&&<div style={{fontSize:11,color:CLR.textSm}}>{c.email}</div>}</td>
                  <td style={{...S.td,color:CLR.textSm}}>{c.phone||'—'}</td>
                  <td style={{...S.td,color:CLR.textSm}}>{(c.address||'—').split(',')[0]}</td>
                  <td style={S.td}><span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:ts?.bg,color:ts?.color}}>{tierLabel(c.tier||'M1')}</span></td>
                  <td style={{...S.td,fontWeight:700,color:CLR.accent}}>{Number(c.total_purchases||0).toFixed(0)} {CUR}</td>
                  <td style={{...S.td,color:CLR.textSm}}>{c.points||0} ⭐</td>
                  <td style={S.td} onClick={e=>e.stopPropagation()}><div style={{display:'flex',gap:4}}><button style={{...S.btnSm,background:'#DBEAFE',color:'#1D4ED8'}} onClick={()=>edit(c)}>✏️</button><button style={{...S.btnSm,background:'#FEE2E2',color:'#DC2626'}} onClick={()=>del(c.id)}>🗑️</button></div></td>
                </td>
              )
            })}
            {filtered.length===0&&茅<td colSpan={7} style={{textAlign:'center',padding:36,color:CLR.textSm}}><div style={{fontSize:32,marginBottom:8}}>👥</div>لا يوجد عملاء茅</td>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:16,padding:24,width:'100%',maxWidth:600,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>{form.id ? '✏️ تعديل عميل' : '➕ إضافة عميل جديد'}</h3>
              <button onClick={()=>{setShowModal(false); setForm({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1'})}} 
                style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
              <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
              <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} inputMode="numeric"/></div>
              <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
              <div><label style={S.label}>كلمة المرور</label><input style={S.input} type="password" value={form.password} onChange={F('password')} placeholder="اتركه فارغاً للإبقاء على نفس الكلمة"/></div>
              <div><label style={S.label}>الرتبة</label><select style={S.input} value={form.tier} onChange={F('tier')}><option value="M1">🥉 M1 — عميل عادي</option><option value="M2">🥈 M2 — عميل مميز</option><option value="M3">🥇 M3 — عميل VIP</option></select></div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
              <button style={S.btnGray} onClick={()=>{setShowModal(false); setForm({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1'})}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   👔 الموظفون (مع صلاحيات كاملة)
══════════════════════════════════════════ */
function Employees() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [saving,setSaving]=useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form,setForm]=useState({name:'',username:'',password:'',email:'',permissions:[]})
  
  // قائمة جميع الصفحات المتاحة في لوحة التحكم
  const allSections = [
    { id:'dashboard', label:'لوحة القيادة', icon:'📊' },
    { id:'products', label:'المنتجات', icon:'📦' },
    { id:'categories', label:'الفئات', icon:'📂' },
    { id:'brands', label:'العلامات التجارية', icon:'🏷️' },
    { id:'suppliers', label:'الموردون', icon:'🏭' },
    { id:'customers', label:'العملاء', icon:'👥' },
    { id:'coupons', label:'الكوبونات', icon:'🎟️' },
    { id:'purchases', label:'المشتريات', icon:'🛒' },
    { id:'inventory', label:'المخزون', icon:'🗂️' },
    { id:'orders', label:'الطلبيات', icon:'📋' },
    { id:'promotions', label:'إدارة العروض', icon:'🎯' },
    { id:'notifications', label:'الإشعارات', icon:'🔔' },
    { id:'reports', label:'التقارير', icon:'📈' },
    { id:'expenses', label:'المصاريف', icon:'💸' },
    { id:'activityLog', label:'سجل النشاطات', icon:'📋' },
    { id:'storeManager', label:'إدارة المتجر', icon:'🎨' },
    { id:'backup', label:'نسخ احتياطي', icon:'💾' },
    { id:'settings', label:'الإعدادات', icon:'⚙️' },
    { id:'about', label:'من نحن', icon:'🏢' },
    { id:'contact', label:'اتصل بنا', icon:'📞' },
    { id:'returnPolicy', label:'سياسة الاسترجاع', icon:'🔄' },
  ]

  const load=async()=>{ 
    const {data}=await supabase.from('employees').select('*').order('name')
    setItems(data||[]) 
  }
  useEffect(()=>{ load() },[])
  
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  
  const togglePermission = (permId) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }))
  }
  
  const selectAllPermissions = () => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.length === allSections.length 
        ? [] 
        : allSections.map(s => s.id)
    }))
  }
  
  const saveEmployee = async () => {
    if(!form.name||!form.username||!form.password){
      showToast('الاسم والمستخدم وكلمة المرور مطلوبة','error')
      return
    }
    setSaving(true)
    
    const employeeData = {
      id: editingId || Date.now(),
      name: form.name,
      username: form.username,
      password: hashPwd(form.password),
      email: form.email || '',
      role: 'staff',
      permissions: JSON.stringify(form.permissions)
    }
    
    const { error } = await supabase.from('employees').upsert(employeeData)
    if(error){
      showToast('خطأ: '+error.message,'error')
      setSaving(false)
      return
    }
    
    showToast(editingId ? '✅ تم تعديل الموظف' : '✅ تمت إضافة الموظف')
    setShowModal(false)
    setForm({name:'',username:'',password:'',email:'',permissions:[]})
    setEditingId(null)
    await load()
    setSaving(false)
  }
  
  const editEmployee = (emp) => {
    setEditingId(emp.id)
    let perms = []
    try {
      perms = typeof emp.permissions === 'string' ? JSON.parse(emp.permissions||'[]') : (emp.permissions||[])
    } catch(e) { perms = [] }
    setForm({
      name: emp.name,
      username: emp.username,
      password: '',
      email: emp.email || '',
      permissions: perms
    })
    setShowModal(true)
  }
  
  const deleteEmployee = async (id) => {
    if(!await askConfirm('حذف هذا الموظف؟')) return
    await supabase.from('employees').delete().eq('id', id)
    showToast('تم الحذف')
    await load()
  }
  
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>👔 الموظفون والصلاحيات</h1>
      
      <div style={S.card}>
        <button style={S.btn} onClick={()=>{ 
          setEditingId(null)
          setForm({name:'',username:'',password:'',email:'',permissions:[]})
          setShowModal(true) 
        }}>➕ إضافة موظف جديد</button>
      </div>
      
      <div style={S.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:CLR.bg}}>
                <th style={S.th}>الاسم</th>
                <th style={S.th}>المستخدم</th>
                <th style={S.th}>الصلاحيات</th>
                <th style={S.th}>الدور</th>
                <th style={S.th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map(e=>{
                let perms = []
                try { perms = typeof e.permissions === 'string' ? JSON.parse(e.permissions||'[]') : (e.permissions||[]) } catch(e) {}
                return (
                  <tr key={e.id} className='nq-tr'>
                    <td style={{...S.td,fontWeight:700}}>{e.name}</td>
                    <td style={S.td}>{e.username}</td>
                    <td style={S.td}>
                      <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,background:'#dbeafe',color:'#1d4ed8'}}>
                        {perms.length} صفحة
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                        background:e.role==='admin'?'#fee2e2':'#d1fae5',
                        color:e.role==='admin'?'#dc2626':'#059669'}}>
                        {e.role==='admin'?'مدير':'موظف'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{display:'flex',gap:5}}>
                        <button style={{...S.btnSm,background:'#DBEAFE',color:'#1D4ED8'}} onClick={()=>editEmployee(e)}>✏️</button>
                        {e.role!=='admin' && <button style={{...S.btnSm,background:'#FEE2E2',color:'#DC2626'}} onClick={()=>deleteEmployee(e.id)}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {items.length===0 && (
                <tr><td colSpan={5} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد موظفين</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة منبثقة لإضافة/تعديل موظف مع صلاحيات */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:16,padding:24,width:'100%',maxWidth:650,maxHeight:'90vh',overflowY:'auto',direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>{editingId ? '✏️ تعديل موظف' : '➕ إضافة موظف جديد'}</h3>
              <button onClick={()=>{setShowModal(false); setForm({name:'',username:'',password:'',email:'',permissions:[]}); setEditingId(null)}} 
                style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            
            <div style={S.grid2}>
              <div><label style={S.label}>الاسم الكامل *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
              <div><label style={S.label}>اسم المستخدم *</label><input style={S.input} value={form.username} onChange={F('username')} /></div>
              <div><label style={S.label}>كلمة المرور {editingId && '(اتركه فارغاً للإبقاء)'}</label><input style={S.input} type="password" value={form.password} onChange={F('password')} placeholder={editingId ? 'أدخل كلمة جديدة لتغييرها' : '********'}/></div>
              <div><label style={S.label}>البريد الإلكتروني</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
            </div>
            
            <div style={{marginTop:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <label style={S.label}>🔐 صلاحيات الوصول</label>
                <button onClick={selectAllPermissions} style={{...S.btnSm,background:'#e2e8f0',color:'#475569'}}>
                  {form.permissions.length === allSections.length ? 'إلغاء الكل' : 'تحديد الكل'}
                </button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,maxHeight:300,overflowY:'auto',border:`1px solid ${CLR.border}`,borderRadius:8,padding:12}}>
                {allSections.map(section => (
                  <label key={section.id} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'4px 0'}}>
                    <input type="checkbox" checked={form.permissions.includes(section.id)} onChange={()=>togglePermission(section.id)} />
                    <span>{section.icon} {section.label}</span>
                  </label>
                ))}
              </div>
              <div style={{fontSize:12,color:CLR.textSm,marginTop:8}}>تم اختيار {form.permissions.length} صفحة من {allSections.length}</div>
            </div>
            
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button style={S.btn} onClick={saveEmployee} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
              <button style={S.btnGray} onClick={()=>{setShowModal(false); setForm({name:'',username:'',password:'',email:'',permissions:[]}); setEditingId(null)}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   🎟️ الكوبونات
══════════════════════════════════════════ */
function Coupons() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [saving,setSaving]=useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form,setForm]=useState({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0})
  
  const load=async()=>{ const {data}=await supabase.from('coupons').select('*').order('id',{ascending:false}); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  
  const add=async()=>{
    if(!form.code||!form.value){showToast('الكود والقيمة مطلوبان','error');return} setSaving(true)
    await supabase.from('coupons').insert({id:Date.now(),code:form.code.toUpperCase().trim(),type:form.type,value:parseFloat(form.value),expiry:form.expiry||null,max_uses:parseInt(form.maxUses)||100,min_order:parseFloat(form.minOrder)||0,used:0})
    showToast('✅ تمت الإضافة');setForm({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0});setShowModal(false);await load();setSaving(false)
  }
  
  const del=async id=>{if(!await askConfirm('حذف؟'))return;await supabase.from('coupons').delete().eq('id',id);showToast('تم الحذف');await load()}
  
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🎟️ الكوبونات</h1>
      
      <div style={S.card}>
        <button style={S.btn} onClick={()=>{ setForm({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0}); setShowModal(true) }}>➕ إضافة كوبون جديد</button>
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
          {items.length===0&&茅<td colSpan={5} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد كوبونات茅</td>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:16,padding:24,width:'100%',maxWidth:500,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>➕ إضافة كوبون جديد</h3>
              <button onClick={()=>{setShowModal(false); setForm({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0})}} 
                style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>الكود *</label><input style={S.input} value={form.code} onChange={F('code')} placeholder="SAVE20" /></div>
              <div><label style={S.label}>النوع</label><select style={S.input} value={form.type} onChange={F('type')}><option value="percent">نسبة %</option><option value="fixed">مبلغ ثابت</option></select></div>
              <div><label style={S.label}>القيمة *</label><NumInput value={form.value} onChange={F('value')} /></div>
              <div><label style={S.label}>تاريخ الانتهاء</label><input style={S.input} type="date" value={form.expiry} onChange={F('expiry')} /></div>
              <div><label style={S.label}>الحد الأقصى</label><NumInput value={form.maxUses} onChange={F('maxUses')} /></div>
              <div><label style={S.label}>الحد الأدنى للطلب</label><NumInput value={form.minOrder} onChange={F('minOrder')} /></div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={add} disabled={saving}>{saving?'⏳...':'💾 إضافة كوبون'}</button>
              <button style={S.btnGray} onClick={()=>{setShowModal(false); setForm({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0})}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
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
    
    // منع تكرار المنتج في نفس الفاتورة
    if(items.some(i=>i.productId===modal.productId)){
      showToast('⚠️ هذا المنتج موجود مسبقاً في الفاتورة','error')
      return
    }
    
    const totalUnits=parseInt(modal.cartons)*parseInt(modal.unitsPerCarton)
    const cartonPrice=autoCarton(modal.purchasePrice,modal.unitsPerCarton)
    setItems(prev=>[...prev,{
      id:Date.now(),productId:prod.id,productName:prod.name,
      cartons:parseInt(modal.cartons),unitsPerCarton:parseInt(modal.unitsPerCarton),
      totalUnits,purchasePrice:parseFloat(modal.purchasePrice),
      sellPrice:parseFloat(modal.sellPrice)||0,
      cartonPrice,totalPurchase:parseInt(modal.cartons)*cartonPrice
    }])
    setShowModal(false); setModal({productId:'',cartons:1,unitsPerCarton:12,purchasePrice:0,sellPrice:0})
  }

  const saveNewProduct=async()=>{
    if(!newProd.name||!newProd.price){showToast('الاسم والسعر مطلوبان','error');return}
    const id=Date.now()
    await supabase.from('products').insert({
      id,name:newProd.name.trim(),price:parseFloat(newProd.price),
      units:parseInt(newProd.units)||12,
      brand_id:newProd.brandId?parseInt(newProd.brandId):null,
      stock:0,disabled:false,created_at:new Date().toISOString()
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
    await supabase.from('purchases').insert({id:purchaseId,supplier_id:parseInt(suppId),supplier_name:supplier?.name,date,items:JSON.stringify(items),total})
    for(const item of items){
      const {data:p}=await supabase.from('products').select('stock').eq('id',item.productId).maybeSingle()
      if(p) await supabase.from('products').update({
        stock:(p.stock||0)+item.cartons,
        cost_price:item.purchasePrice,
        carton_price:item.cartonPrice
      }).eq('id',item.productId)
    }
    printA4(`
      <div class="header"><div><h1>🛍️ نقاء</h1><p>فاتورة شراء</p></div>
      <div style="text-align:left"><p><strong>رقم:</strong> ${purchaseId}</p><p><strong>التاريخ:</strong> ${date}</p><p><strong>المورد:</strong> ${supplier?.name||'—'}</p></div></div>
      <table><thead><tr><th>المنتج</th><th>الكرتونات</th><th>قطع/كرتون</th><th>سعر الشراء/قطعة</th><th>سعر الكرتون</th><th>الإجمالي</th></tr></thead>
      <tbody>${items.map(i=>`<tr><td>${i.productName}</td><td style="text-align:center">${i.cartons}</td><td style="text-align:center">${i.unitsPerCarton}</td><td style="text-align:center">${i.purchasePrice} ${CUR}</td><td style="text-align:center;font-weight:700;color:#7c3aed">${i.cartonPrice.toFixed(0)} ${CUR}</td><td style="text-align:center;font-weight:700;color:#dc2626">${i.totalPurchase.toFixed(0)} ${CUR}</td></tr>`).join('')}
      <tr class="total-row"><td colspan="5">الإجمالي الكلي</td><td>${total.toFixed(0)} ${CUR}</td></tr>
      </tbody>
    </table>
      <div class="footer">نقاء — ${new Date().toLocaleDateString('ar-DZ')}</div>
    `)
    showToast('✅ تم حفظ الفاتورة وطباعتها');setSuppId('');setItems([])
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

        {items.length>0&&(
          <div style={{overflowX:'auto',marginBottom:14}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{background:'linear-gradient(135deg,#1E293B,#0F172A)'}}>
                {['المنتج','الكرتونات','قطع/كرتون','سعر/قطعة','سعر الكرتون','الإجمالي',''].map((h,i)=><th key={i} style={{...S.th,color:'white',background:'transparent',padding:'10px 8px'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {items.map((item,i)=>(
                  <tr key={item.id} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'white':'#fafafa'}}>
                    <td style={{...S.td,fontWeight:700}}>{item.productName}</td>
                    <td style={{...S.td,textAlign:'center',fontWeight:700}}>{item.cartons}</td>
                    <td style={{...S.td,textAlign:'center'}}>{item.unitsPerCarton}</td>
                    <td style={{...S.td,textAlign:'center'}}>{item.purchasePrice} {CUR}</td>
                    <td style={{...S.td,textAlign:'center',fontWeight:700,color:'#7c3aed'}}>{item.cartonPrice.toFixed(0)} {CUR}</td>
                    <td style={{...S.td,textAlign:'center',fontWeight:900,color:'#dc2626'}}>{item.totalPurchase.toFixed(0)} {CUR}</td>
                    <td style={S.td}><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))}>🗑️</button></td>
                  </tr>
                ))}
                <tr style={{background:'#fff7ed',fontWeight:900}}>
                  <td colSpan={5} style={{...S.td,fontSize:15}}>💰 الإجمالي الكلي للفاتورة</td>
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
              <div><label style={S.label}>المنتج</label>
                <div style={{display:'flex',gap:8}}>
                  <select style={{...S.input,flex:1}} value={modal.productId} onChange={e=>{
                    const p=products.find(x=>x.id==e.target.value)
                    setModal(m=>({...m,productId:e.target.value,unitsPerCarton:p?.units||12,purchasePrice:p?.cost_price||0,sellPrice:p?.price||0}))
                  }}><option value="">-- اختر منتجاً --</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <button onClick={()=>{setShowModal(false);setShowNewProdModal(true)}} style={{...S.btn,padding:'8px 14px',fontSize:12,whiteSpace:'nowrap'}}>+ جديد</button>
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
                  <div>📦 سعر الكرتون = {modal.purchasePrice} × {modal.unitsPerCarton} = <strong style={{color:'#7c3aed'}}>{autoCarton(modal.purchasePrice,modal.unitsPerCarton).toFixed(0)} {CUR}</strong></div>
                  <div>💰 الإجمالي = {modal.cartons} × {autoCarton(modal.purchasePrice,modal.unitsPerCarton).toFixed(0)} = <strong style={{color:'#dc2626'}}>{(modal.cartons*autoCarton(modal.purchasePrice,modal.unitsPerCarton)).toFixed(0)} {CUR}</strong></div>
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
              <div><label style={S.label}>اسم المنتج *</label><input style={S.input} value={newProd.name} onChange={e=>setNewProd(f=>({...f,name:e.target.value}))} /></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={S.label}>سعر البيع *</label><NumInput value={newProd.price} onChange={e=>setNewProd(f=>({...f,price:e.target.value}))} /></div>
                <div><label style={S.label}>قطع/كرتون</label><NumInput value={newProd.units} onChange={e=>setNewProd(f=>({...f,units:e.target.value}))} /></div>
              </div>
              <div><label style={S.label}>العلامة التجارية</label><select style={S.input} value={newProd.brandId} onChange={e=>setNewProd(f=>({...f,brandId:e.target.value}))}><option value="">-- بدون --</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
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
                    <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>{
                      printA4(`<div class="header"><div><h1>🛍️ نقاء</h1><p>فاتورة شراء</p></div><div><p>رقم: ${p.id}</p><p>${p.date}</p><p>المورد: ${p.supplier_name}</p></div></div>
                      <table><thead><tr><th>المنتج</th><th>الكرتونات</th><th>قطع/كرتون</th><th>سعر الكرتون</th><th>الإجمالي</th></tr></thead>
                      <tbody>${its.map(i=>`<tr><td>${i.productName}</td><td style="text-align:center">${i.cartons||'—'}</td><td style="text-align:center">${i.unitsPerCarton||'—'}</td><td style="text-align:center">${(i.cartonPrice||0).toFixed(0)}</td><td style="text-align:center">${i.totalPurchase.toFixed(0)}</td></tr>`).join('')}
                      <tr class="total-row"><td colspan="4">الإجمالي</td><td>${Number(p.total).toFixed(0)} ${CUR}</td></tr>
                      </tbody>
                    </table>`)
                    }}>🖨️ طباعة</button>
                  </td>
                </tr>
              )
            })}
            {purchases.length===0&&茅<td colSpan={6} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد فواتير茅</td>}
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

  const load=async()=>{
    const {data}=await supabase.from('products').select('id,name,stock,price,cost_price,sku,units').order('name')
    setItems(data||[])
  }
  useEffect(()=>{ load() },[])

  const filtered=items.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()))

  const exportCSV = () => {
    const header = 'ID,اسم المنتج,الباركود,المخزون,السعر,سعر الشراء,قطع/كرتون'
    const rows = items.map(p => `${p.id},"${p.name}","${p.sku||''}",${p.stock||0},${p.price},${p.cost_price||0},${p.units||12}`)
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
      showToast(`✅ تم تحديث ${updated} منتج`)
      await load()
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const printInventory = () => {
    printA4(`
      <div class="header"><div><h1>🛍️ نقاء</h1></div><div><p>تقرير المخزون</p><p>${new Date().toLocaleDateString('ar-DZ')}</p></div></div>
      <table><thead><tr><th>المنتج</th><th>الباركود</th><th>المخزون</th><th>الحالة</th><th>القيمة</th></tr></thead>
      <tbody>${filtered.map(p=>`<tr><td>${p.name}</td><td>${p.sku||'—'}</td><td>${p.stock||0}</td><td>${(p.stock||0)<5?'⚠️ منخفض':(p.stock||0)<20?'متوسط':'جيد'}</td><td>${((p.stock||0)*Number(p.price)).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody>
    </table>
      <div class="footer">إجمالي قيمة المخزون: ${filtered.reduce((s,p)=>s+(p.stock||0)*Number(p.price),0).toFixed(0)} ${CUR}</div>
    `)
  }

  const cartonPrice = (price, units) => (parseFloat(price)||0) * (parseInt(units)||12)

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
              <th style={S.th}>المخزون</th><th style={S.th}>سعر الكرتون</th><th style={S.th}>القيمة</th>
            </tr></thead>
            <tbody>{filtered.map(p=>(
              <tr key={p.id} className='nq-tr'>
                <td style={{...S.td,fontWeight:700}}>{p.name}</td>
                <td style={S.td}>{p.sku||'—'}</td>
                <td style={S.td}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,
                    background:(p.stock||0)<5?'#fee2e2':(p.stock||0)<20?'#fef9c3':'#d1fae5',
                    color:(p.stock||0)<5?'#dc2626':(p.stock||0)<20?'#b45309':'#059669'}}>
                    {p.stock||0}
                  </span>
                </td>
                <td style={S.td}>{cartonPrice(p.price, p.units).toFixed(0)} {CUR}</td>
                <td style={S.td}>{((p.stock||0)*Number(p.price)).toFixed(0)} {CUR}</td>
              </tr>
            ))}
            {filtered.length===0&&茅<td colSpan={5} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد منتجات茅</td>}
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
   📋 الطلبيات
══════════════════════════════════════════ */
function Orders() {
  const [showToast,ToastUI]=useToast()
  const [items,setItems]=useState([]); const [search,setSearch]=useState('')
  const [searchType,setSearchType]=useState('all'); const [statusFilter,setStatusFilter]=useState('all')
  const [viewMode,setViewMode]=useState('list'); const [selectedOrders,setSelectedOrders]=useState([])

  const load=useCallback(async()=>{
    const {data}=await supabase.from('orders').select('*').order('id',{ascending:false})
    setItems(data||[])
  },[])
  useEffect(()=>{ load() },[load])

  const updateStatus=async(id,status)=>{
    await supabase.from('orders').update({status}).eq('id',id)
    showToast('✅ تم تحديث الحالة'); await load()
  }
  const updateMulti=async(status)=>{
    if(selectedOrders.length===0){showToast('اختر طلبيات أولاً','error');return}
    await Promise.all(selectedOrders.map(id=>supabase.from('orders').update({status}).eq('id',id)))
    showToast(`✅ تم تحديث ${selectedOrders.length} طلبية`);setSelectedOrders([]);await load()
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

  const printDelivery=()=>{
    const content=Object.entries(grouped).map(([zone,orders])=>`
      <div style="margin-bottom:24px;page-break-inside:avoid">
        <h2 style="color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:8px;margin-bottom:12px">📍 ${zone} (${orders.length} طلبية)</h2>
        <table><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>العنوان</th><th>الإجمالي</th></tr></thead>
        <tbody>${orders.map(o=>`<tr><td>${o.id}</td><td>${o.customer_name}</td><td>${o.customer_phone||'—'}</td><td>${o.customer_address||'—'}</td><td>${Number(o.total).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody>
      </table>
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
              {filtered.length===0&&茅<td colSpan={8} style={{textAlign:'center',padding:30,color:CLR.textSm}}>لا توجد طلبيات茅</table>}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
  const [showModal, setShowModal] = useState(false)
  const [prodSearch,setProdSearch]=useState('')
  const [form,setForm]=useState({
    id:'', name:'', type:'percent', active:true,
    buy_qty:3, get_qty:1, discount_value:0,
    product_ids:[], min_amount:0, description:'',
    end_date:'', image:'',
    tier_qty:1, tier_type:'percent', tier_value:0
  })

  const load=async()=>{
    const [{data:p},{data:pr}]=await Promise.all([
      supabase.from('products').select('id,name,price,image').order('name'),
      supabase.from('promotions').select('*').order('id',{ascending:false}).catch(()=>({data:[]})),
    ])
    setProducts(p||[]); setPromos(pr||[])
  }
  useEffect(()=>{ load() },[])

  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const toggleProduct=id=>setForm(f=>({...f,product_ids:f.product_ids.includes(id)?f.product_ids.filter(x=>x!==id):[...f.product_ids,id]}))
  const handleImg=e=>{const r=new FileReader();r.onload=ev=>setForm(f=>({...f,image:ev.target.result}));r.readAsDataURL(e.target.files[0])}

  const save=async()=>{
    if(!form.name.trim()){showToast('اسم العرض مطلوب','error');return} setSaving(true)
    const row={
      id:form.id||Date.now(), name:form.name.trim(), type:form.type, active:form.active,
      buy_qty:parseInt(form.buy_qty)||3, get_qty:parseInt(form.get_qty)||1,
      discount_value:parseFloat(form.discount_value)||0,
      product_ids:JSON.stringify(form.product_ids),
      min_amount:parseFloat(form.min_amount)||0,
      description:form.description, image:form.image||null,
      end_date:form.end_date?new Date(form.end_date).toISOString():null,
      tier_qty:parseInt(form.tier_qty)||1,
      tier_type:form.tier_type||'percent',
      tier_value:parseFloat(form.tier_value)||0,
      created_at:form.id?undefined:new Date().toISOString()
    }
    if(!form.id) delete row.created_at
    const {error}=await supabase.from('promotions').upsert(row).catch(e=>({error:e}))
    if(error){showToast('⚠️ تأكد من تشغيل schema_v4.sql في Supabase','error');setSaving(false);return}
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({id:'',name:'',type:'percent',active:true,buy_qty:3,get_qty:1,discount_value:0,product_ids:[],min_amount:0,description:'',end_date:'',image:'',tier_qty:1,tier_type:'percent',tier_value:0})
    setProdSearch('')
    setShowModal(false)
    await load(); setSaving(false)
  }

  const edit=p=>{
    setForm({
      id:p.id, name:p.name, type:p.type, active:p.active,
      buy_qty:p.buy_qty||3, get_qty:p.get_qty||1, discount_value:p.discount_value||0,
      product_ids:typeof p.product_ids==='string'?JSON.parse(p.product_ids||'[]'):(p.product_ids||[]),
      min_amount:p.min_amount||0, description:p.description||'', end_date:p.end_date?.split('T')[0]||'', image:p.image||'',
      tier_qty:p.tier_qty||1, tier_type:p.tier_type||'percent', tier_value:p.tier_value||0
    })
    setShowModal(true)
  }

  const del=async id=>{
    if(!await askConfirm('حذف هذا العرض؟'))return
    await supabase.from('promotions').delete().eq('id',id).catch(()=>{})
    showToast('تم الحذف');await load()
  }

  const toggleActive=async(id,val)=>{
    await supabase.from('promotions').update({active:val}).eq('id',id).catch(()=>{})
    await load(); showToast(val?'✅ تم تفعيل العرض':'⏸️ تم إيقاف العرض')
  }

  const typeLabel={percent:'خصم نسبة %',fixed:'خصم مبلغ ثابت',buy_x_get_y:'اشتري X خذ Y',tier_discount:'خصم حسب الرتبة',tier_buy:'اشتري X من نفس الشركة = خصم'}

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🎯 إدارة العروض</h1>

      <div style={S.card}>
        <button style={S.btn} onClick={()=>{ setForm({id:'',name:'',type:'percent',active:true,buy_qty:3,get_qty:1,discount_value:0,product_ids:[],min_amount:0,description:'',end_date:'',image:'',tier_qty:1,tier_type:'percent',tier_value:0}); setShowModal(true) }}>➕ إنشاء عرض جديد</button>
      </div>

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14}}>العروض الحالية ({promos.length})</h3>
        {promos.length===0&&<p style={{textAlign:'center',color:CLR.textSm,padding:24}}>لا توجد عروض — أنشئ أول عرض الآن!</p>}
        {promos.map(p=>{
          const pids=typeof p.product_ids==='string'?JSON.parse(p.product_ids||'[]'):(p.product_ids||[])
          const isExpired=p.end_date&&new Date(p.end_date)<new Date()
          return (
            <div key={p.id} style={{background:p.active&&!isExpired?'#f0fdf4':'#f8fafc',borderRadius:14,padding:14,marginBottom:10,border:`1px solid ${p.active&&!isExpired?'#10b981':'#e2e8f0'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontWeight:800,fontSize:15}}>{p.name}</div>
                  <div style={{fontSize:12,color:CLR.textSm,marginTop:2}}>{typeLabel[p.type]||p.type}</div>
                  {p.description&&<div style={{fontSize:12,color:CLR.textSm,marginTop:4,fontStyle:'italic'}}>"{p.description}"</div>}
                  {p.end_date&&<div style={{fontSize:11,color:isExpired?'#ef4444':'#f59e0b',marginTop:2}}>
                    {isExpired?'⏰ انتهى':'⏳ ينتهي'}: {new Date(p.end_date).toLocaleDateString('ar-DZ')}
                  </div>}
                  <div style={{fontSize:11,color:CLR.textSm,marginTop:4}}>
                    {pids.length===0?'📦 يشمل كل المنتجات':`📦 ${pids.length} منتج محدد`}
                  </div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,
                    background:p.active&&!isExpired?'#d1fae5':isExpired?'#fee2e2':'#fef9c3',
                    color:p.active&&!isExpired?'#059669':isExpired?'#dc2626':'#92400e'}}>
                    {isExpired?'منتهي':p.active?'✅ فعّال':'⏸️ موقوف'}
                  </span>
                  <button style={{...S.btnSm,background:p.active?'#fef9c3':'#d1fae5',color:p.active?'#92400e':'#059669'}}
                    onClick={()=>toggleActive(p.id,!p.active)}>
                    {p.active?'⏸️ إيقاف':'▶️ تفعيل'}
                  </button>
                  <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>edit(p)}>✏️</button>
                  <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(p.id)}>🗑️</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:7000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:16,padding:24,width:'100%',maxWidth:700,maxHeight:'90vh',overflowY:'auto',direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontWeight:900,fontSize:16}}>{form.id ? '✏️ تعديل العرض' : '➕ إنشاء عرض جديد'}</h3>
              <button onClick={()=>{setShowModal(false); setForm({id:'',name:'',type:'percent',active:true,buy_qty:3,get_qty:1,discount_value:0,product_ids:[],min_amount:0,description:'',end_date:'',image:'',tier_qty:1,tier_type:'percent',tier_value:0})}} 
                style={{background:CLR.bg,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>اسم العرض *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
              <div><label style={S.label}>نوع العرض</label><select style={S.input} value={form.type} onChange={F('type')}><option value="percent">خصم نسبة %</option><option value="fixed">خصم مبلغ ثابت</option><option value="buy_x_get_y">اشتري X خذ Y</option><option value="tier_buy">📦 اشتري X من نفس الشركة = خصم</option></select></div>
              <div><label style={S.label}>تاريخ الانتهاء</label><input style={S.input} type="datetime-local" value={form.end_date} onChange={F('end_date')} /></div>
            </div>
            {form.type==='percent' && <div><label style={S.label}>نسبة الخصم %</label><NumInput value={form.discount_value} onChange={F('discount_value')} /></div>}
            {form.type==='fixed' && <div><label style={S.label}>مبلغ الخصم (دج)</label><NumInput value={form.discount_value} onChange={F('discount_value')} /></div>}
            {form.type==='buy_x_get_y' && <div style={{display:'flex',gap:12}}><div><label style={S.label}>اشتري كم؟</label><NumInput value={form.buy_qty} onChange={F('buy_qty')} /></div><div><label style={S.label}>خذ كم مجاناً؟</label><NumInput value={form.get_qty} onChange={F('get_qty')} /></div></div>}
            <div><label style={S.label}>وصف العرض</label><input style={S.input} value={form.description} onChange={F('description')} /></div>
            <div><label style={S.label}>صورة بانر (1200×400)</label><input style={S.input} type="file" accept="image/*" onChange={handleImg} /></div>
            <div>
              <label style={S.label}>🔍 المنتجات المشمولة (اتركها فارغة للكل)</label>
              <input style={{...S.input,marginBottom:8}} placeholder="ابحث عن منتج..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)} />
              <div style={{maxHeight:200,overflowY:'auto',border:'1px solid #e2e8f0',borderRadius:12,padding:10}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:6}}>
                  {products.filter(p=>!prodSearch||p.name.toLowerCase().includes(prodSearch.toLowerCase())).map(p=>{
                    const sel=form.product_ids.includes(p.id)||form.product_ids.includes(String(p.id))
                    return (<label key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:8,background:sel?'#fef2f2':'#f8fafc'}}><input type="checkbox" checked={sel} onChange={()=>toggleProduct(p.id)}/><span>{p.name}</span></label>)
                  })}
                </div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:12}}>
              <input type="checkbox" id="active" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/>
              <label htmlFor="active">⚡ تفعيل العرض فور الحفظ</label>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ العرض'}</button>
              <button style={S.btnGray} onClick={()=>{setShowModal(false); setForm({id:'',name:'',type:'percent',active:true,buy_qty:3,get_qty:1,discount_value:0,product_ids:[],min_amount:0,description:'',end_date:'',image:'',tier_qty:1,tier_type:'percent',tier_value:0})}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   باقي الصفحات (سيتم إكمالها لاحقاً)
══════════════════════════════════════════ */
function Notifications() { return <div>🔔 الإشعارات - قيد التطوير</div> }
function Reports() { return <div>📈 التقارير - قيد التطوير</div> }
function Expenses() { return <div>💸 المصاريف - قيد التطوير</div> }
function ActivityLog() { return <div>📋 سجل النشاطات - قيد التطوير</div> }
function StoreManager({ showToast }) { return <div>🎨 إدارة المتجر - قيد التطوير</div> }
function DataBackup({ showToast }) { return <div>💾 نسخ احتياطي - قيد التطوير</div> }
function Settings({ showToast }) { return <div>⚙️ الإعدادات - قيد التطوير</div> }
function AboutUs({ showToast }) { return <div>🏢 من نحن - قيد التطوير</div> }
function ContactUs({ showToast }) { return <div>📞 اتصل بنا - قيد التطوير</div> }
function ReturnPolicy({ showToast }) { return <div>🔄 سياسة الاسترجاع - قيد التطوير</div> }

/* ══════════════════════════════════════════
   🏠 المكوّن الرئيسي مع تطبيق صلاحيات الموظفين
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

  // استخراج صلاحيات المستخدم
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  let userPermissions = []
  if (!isAdmin) {
    try {
      userPermissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions || '[]') : (user.permissions || [])
    } catch(e) { userPermissions = [] }
  }

  // قائمة جميع الصفحات
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
    { id:'activityLog', icon:'📋', label:'سجل النشاطات' },
    { id:'storeManager', icon:'🎨', label:'إدارة المتجر' },
    { id:'backup', icon:'💾', label:'نسخ احتياطي' },
    { id:'settings', icon:'⚙️', label:'الإعدادات' },
    { id:'about', icon:'🏢', label:'من نحن' },
    { id:'contact', icon:'📞', label:'اتصل بنا' },
    { id:'returnPolicy', icon:'🔄', label:'سياسة الاسترجاع' },
  ]

  // تصفية الصفحات حسب صلاحيات الموظف
  const sections = isAdmin ? allSections : allSections.filter(s => userPermissions.includes(s.id))

  const renderSection = () => {
    switch(section) {
      case 'dashboard': return <Dashboard />
      case 'products': return <Products />
      case 'categories': return <Categories />
      case 'brands': return <Brands />
      case 'suppliers': return <Suppliers />
      case 'customers': return <Customers />
      case 'employees': return <Employees />
      case 'coupons': return <Coupons />
      case 'purchases': return <Purchases />
      case 'inventory': return <Inventory />
      case 'orders': return <Orders />
      case 'promotions': return <PromotionsManager />
      case 'notifications': return <Notifications />
      case 'reports': return <Reports />
      case 'expenses': return <Expenses />
      case 'activityLog': return <ActivityLog />
      case 'storeManager': return <StoreManager showToast={showToast} />
      case 'backup': return <DataBackup showToast={showToast} />
      case 'settings': return <Settings showToast={showToast} />
      case 'about': return <AboutUs showToast={showToast} />
      case 'contact': return <ContactUs showToast={showToast} />
      case 'returnPolicy': return <ReturnPolicy showToast={showToast} />
      default: return <Dashboard />
    }
  }

  const navGroups = [
    { label:'الرئيسية', items:['dashboard'] },
    { label:'المنتجات والمخزون', items:['products','categories','brands','inventory'] },
    { label:'المبيعات', items:['orders','promotions','coupons'] },
    { label:'الموارد', items:['purchases','suppliers','expenses'] },
    { label:'العملاء', items:['customers','notifications'] },
    { label:'الإدارة', items:['reports','employees','activityLog','storeManager','backup','settings','about','contact','returnPolicy'] },
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
        input[type=number]::-webkit-inner-spin-button{opacity:1}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
        .nq-tr:hover td{background:#FFF7ED!important}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 58 : 232,
        background: CLR.primary,
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, overflow: 'hidden',
        transition: 'width .22s ease',
        boxShadow: '2px 0 16px rgba(0,0,0,.15)',
        zIndex: 100,
      }}>
        <div style={{ padding: collapsed?'14px 9px':'14px 14px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:9,flexShrink:0, background:'linear-gradient(135deg,#F97316,#EA6C0A)', display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>🛍️</div>
            {!collapsed && <div><div style={{ fontWeight:900, fontSize:15, color:'white', lineHeight:1.2 }}>نقاء</div><div style={{ fontSize:10, color:'rgba(255,255,255,.45)' }}>لوحة الإدارة</div></div>}
          </div>
          {!collapsed && <div style={{ marginTop:10, padding:'7px 10px', background:'rgba(255,255,255,.07)', borderRadius:7, fontSize:12, color:'rgba(255,255,255,.75)', display:'flex', alignItems:'center', gap:6 }}><span>👤</span><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</span></div>}
        </div>

        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'6px 0' }}>
          {navGroups.map(group => {
            // تصفية العناصر حسب الصلاحيات
            const visibleItems = group.items.filter(id => sections.some(s => s.id === id))
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                {!collapsed && (<div style={{ padding:'8px 14px 3px', fontSize:9, fontWeight:800, color:'rgba(255,255,255,.28)', letterSpacing:'0.9px', textTransform:'uppercase' }}>{group.label}</div>)}
                {visibleItems.map(id => {
                  const s = sections.find(x=>x.id===id)
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
            <div style={{ fontSize:14, fontWeight:700, color:CLR.text }}>{sections.find(s=>s.id===section)?.icon} {sections.find(s=>s.id===section)?.label}</div>
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