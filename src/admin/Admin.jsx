/**
 * Admin.jsx — نقاء v6 (نسخة احترافية شاملة)
 * ✅ مصادقة ثنائية (6789)
 * ✅ تصنيف العملاء M1/M2/M3
 * ✅ إدارة العروض الكاملة
 * ✅ استيراد/تصدير Excel
 * ✅ نسخ احتياطي
 * ✅ حقول رقمية فقط
 * ✅ جميع الميزات السابقة
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
  const bg = { success:'#10b981', error:'#ef4444', info:'#3b82f6' }[type]||'#10b981'
  return (
    <div style={{ position:'fixed', bottom:24, left:24, background:bg, color:'white',
      padding:'12px 24px', borderRadius:30, zIndex:9999, fontWeight:700,
      boxShadow:'0 8px 24px rgba(0,0,0,.25)', fontSize:14, direction:'rtl' }}>
      {msg}
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:8000,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:20, padding:28, maxWidth:360, textAlign:'center', direction:'rtl' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
        <p style={{ fontSize:16, fontWeight:600, marginBottom:20 }}>{c.msg}</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button onClick={()=>{ c.r(true); setC(null) }}
            style={{ background:'#ef4444', color:'white', border:'none', borderRadius:30, padding:'10px 24px', cursor:'pointer', fontWeight:700 }}>نعم</button>
          <button onClick={()=>{ c.r(false); setC(null) }}
            style={{ background:'#e2e8f0', border:'none', borderRadius:30, padding:'10px 24px', cursor:'pointer', fontWeight:700 }}>إلغاء</button>
        </div>
      </div>
    </div>
  ) : null
  return [ask, UI]
}

/* ─── CSS ─── */
const S = {
  card:    { background:'white', borderRadius:16, padding:20, marginBottom:20,
             boxShadow:'0 2px 12px rgba(0,0,0,.06)', border:'1px solid #f1f5f9' },
  input:   { background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:12,
             padding:'10px 14px', width:'100%', fontFamily:'inherit', fontSize:14, outline:'none' },
  label:   { display:'block', marginBottom:6, fontWeight:700, fontSize:13, color:'#475569' },
  btn:     { background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white',
             padding:'10px 22px', borderRadius:30, border:'none', cursor:'pointer',
             fontWeight:700, fontSize:14, fontFamily:'inherit' },
  btnGray: { background:'#e2e8f0', color:'#475569', padding:'10px 22px',
             borderRadius:30, border:'none', cursor:'pointer', fontWeight:700, fontFamily:'inherit' },
  btnSm:   { padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer',
             fontSize:12, fontWeight:700, fontFamily:'inherit' },
  th:      { padding:'11px 12px', textAlign:'right', background:'#f8fafc',
             fontWeight:700, fontSize:13, color:'#475569' },
  td:      { padding:'11px 12px', textAlign:'right', borderBottom:'1px solid #f8fafc', fontSize:14 },
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
  const refs = [useState(null)[0],useState(null)[0],useState(null)[0],useState(null)[0]]

  const step1 = async () => {
    setErr(''); setLoading(true)
    if (email.trim()===ADMIN_EMAIL && hashPwd(pass)===ADMIN_PASS_HASH) {
      setUserData({ name:'المدير', email:ADMIN_EMAIL, role:'admin' })
      setStep(2); setLoading(false); return
    }
    const { data } = await supabase.from('employees').select('*')
      .eq('username', email.trim()).maybeSingle()
    if (data && data.password===hashPwd(pass)) {
      setUserData({ name:data.name, email:data.email, role:data.role })
      setStep(2)
    } else { setErr('البريد أو كلمة المرور غير صحيحة') }
    setLoading(false)
  }

  const step2 = () => {
    if (code !== TWO_FA_CODE) { setErr('كود التحقق غير صحيح'); return }
    onLogin(userData)
  }

  if (step===2) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#dc2626,#7c3aed)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:24, padding:36, width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:40 }}>🔐</div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#1e293b', marginTop:8 }}>التحقق الثنائي</h2>
          <p style={{ color:'#64748b', fontSize:14, marginTop:4 }}>أدخل كود التحقق المكون من 4 أرقام</p>
          <div style={{ background:'#fef9c3', borderRadius:10, padding:10, marginTop:12, fontSize:13, color:'#92400e' }}>
            🔑 الكود الحالي: <strong style={{ fontSize:20 }}>{TWO_FA_CODE}</strong>
            <div style={{ fontSize:11, marginTop:4 }}>سيُرسل لاحقاً عبر البريد الإلكتروني تلقائياً</div>
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
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#dc2626,#7c3aed)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:24, padding:36, width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40 }}>🛍️</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1e293b', marginTop:8 }}>نقاء</h1>
          <p style={{ color:'#64748b', fontSize:14 }}>لوحة الإدارة</p>
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
function Dashboard() {
  const [stats,  setStats]  = useState({ products:0, orders:0, sales:0, profit:0, todaySales:0 })
  const [recent, setRecent] = useState([])
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    const load = async () => {
      const [{ data:prods },{ data:ords },{ data:purcs },{ data:exps }] = await Promise.all([
        supabase.from('products').select('id,name,stock'),
        supabase.from('orders').select('*').order('id',{ascending:false}),
        supabase.from('purchases').select('total'),
        supabase.from('expenses').select('amount'),
      ])
      const today = new Date().toLocaleDateString()
      const todayO = (ords||[]).filter(o=>new Date(o.created_at||o.date).toLocaleDateString()===today)
      const sales  = (ords||[]).reduce((s,o)=>s+Number(o.total),0)
      const pur    = (purcs||[]).reduce((s,p)=>s+Number(p.total),0)
      const exp    = (exps||[]).reduce((s,e)=>s+Number(e.amount),0)
      setStats({ products:(prods||[]).length, orders:(ords||[]).length, sales, profit:sales-pur-exp,
        todaySales:todayO.reduce((s,o)=>s+Number(o.total),0) })
      setRecent((ords||[]).slice(0,5))
      setLowStock((prods||[]).filter(p=>(p.stock||0)<5))
    }
    load()
  }, [])

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📊 لوحة القيادة</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { l:'المنتجات',       v:stats.products,             c:'#3b82f6', i:'📦' },
          { l:'الطلبيات',       v:stats.orders,               c:'#10b981', i:'📋' },
          { l:'مبيعات اليوم',   v:stats.todaySales.toFixed(0)+' '+CUR, c:'#f59e0b', i:'⚡' },
          { l:'إجمالي المبيعات',v:stats.sales.toFixed(0)+' '+CUR, c:'#dc2626', i:'💰' },
          { l:'صافي الربح',     v:stats.profit.toFixed(0)+' '+CUR, c:stats.profit>=0?'#10b981':'#ef4444', i:'📈' },
        ].map((s,i)=>(
          <div key={i} style={{ ...S.card, textAlign:'center', borderTop:`3px solid ${s.c}`, marginBottom:0 }}>
            <div style={{ fontSize:28 }}>{s.i}</div>
            <div style={{ fontSize:19, fontWeight:900, color:s.c, margin:'6px 0' }}>{s.v}</div>
            <div style={{ fontSize:12, color:'#64748b' }}>{s.l}</div>
          </div>
        ))}
      </div>
      {lowStock.length>0 && (
        <div style={{ ...S.card, background:'#fef2f2', borderRight:'4px solid #dc2626' }}>
          <strong style={{ color:'#dc2626' }}>⚠️ تنبيه — مخزون منخفض ({lowStock.length} منتج):</strong>
          <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:6 }}>
            {lowStock.map(p=>(
              <span key={p.id} style={{ background:'#fee2e2', color:'#dc2626', padding:'2px 10px',
                borderRadius:20, fontSize:12, fontWeight:600 }}>{p.name} ({p.stock||0})</span>
            ))}
          </div>
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>📋 آخر الطلبيات</h3>
        {recent.length===0 ? <p style={{ textAlign:'center', color:'#94a3b8', padding:20 }}>لا توجد طلبيات</p> :
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th style={S.th}>#</th><th style={S.th}>العميل</th><th style={S.th}>المنطقة</th><th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th></tr></thead>
            <tbody>{recent.map(o=>(
              <tr key={o.id}>
                <td style={{ ...S.td, fontSize:11, color:'#94a3b8' }}>{o.id}</td>
                <td style={{ ...S.td, fontWeight:700 }}>{o.customer_name}</td>
                <td style={S.td}>{o.customer_address?.split(',')[0]||'—'}</td>
                <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{Number(o.total).toFixed(0)} {CUR}</td>
                <td style={S.td}>
                  <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11,
                    background:{pending:'#fef9c3',processing:'#dbeafe',shipped:'#e0e7ff',delivered:'#d1fae5'}[o.status]||'#f1f5f9' }}>
                    {{pending:'انتظار',processing:'تجهيز',shipped:'شحن',delivered:'تسليم'}[o.status]||o.status}
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>}
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
  const [selCats, setSelCats]=useState([]) // فئات متعددة
  const [search,setSearch]=useState(''); const [loading,setLoading]=useState(false)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({ id:'',name:'',price:'',costPrice:'',cartonPrice:'',
    units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false })

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
      sku:form.sku||'', brand_id:form.brandId?parseInt(form.brandId):null,
      image:form.image||null, is_promo:form.isPromo,
      discount:parseFloat(form.discount)||0, disabled:false,
      created_at:form.id?undefined:new Date().toISOString()
    }
    if (!form.id) delete row.created_at
    const { error } = await supabase.from('products').upsert(row)
    if (error) { showToast('خطأ: '+error.message,'error'); setSaving(false); return }
    // حفظ الفئات المتعددة
    if (form.id) await supabase.from('product_categories').delete().eq('product_id',row.id)
    if (selCats.length>0) {
      await supabase.from('product_categories').upsert(
        selCats.map(cid=>({ id:Date.now()+Math.random(), product_id:row.id, category_id:cid }))
      ).catch(()=>{})
    }
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({ id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',image:'',discount:0,isPromo:false })
    setSelCats([])
    await load(); setSaving(false)
  }

  const edit = async p => {
    setForm({ id:p.id, name:p.name, price:p.price||'', costPrice:p.cost_price||'',
      cartonPrice:p.carton_price||'', units:p.units||12, stock:p.stock||0,
      sku:p.sku||'', brandId:p.brand_id||'', image:p.image||'',
      discount:p.discount||0, isPromo:p.is_promo||false })
    const { data } = await supabase.from('product_categories').select('category_id').eq('product_id',p.id)
    setSelCats((data||[]).map(r=>r.category_id))
  }

  const del = async id => {
    if (!await askConfirm('حذف هذا المنتج؟')) return
    await supabase.from('products').delete().eq('id',id)
    showToast('تم الحذف'); await load()
  }

  const toggleCat = id => setSelCats(prev => prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])

  const filtered = products.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📦 المنتجات</h1>

      {/* نصائح أحجام الصور */}
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
        {/* فئات متعددة */}
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
        {/* منتج عرض */}
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
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontWeight:800 }}>قائمة المنتجات ({filtered.length})</h3>
          <input style={{ ...S.input, width:220 }} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {loading ? <p style={{ textAlign:'center', color:'#94a3b8', padding:30 }}>⏳ تحميل...</p> :
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={S.th}>الصورة</th><th style={S.th}>الاسم</th>
                <th style={S.th}>السعر/قطعة</th><th style={S.th}>الخصم</th>
                <th style={S.th}>المخزون</th><th style={S.th}>الإجراءات</th>
              </tr></thead>
              <tbody>{filtered.map(p=>(
                <tr key={p.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                  <td style={S.td}>{p.image?<img src={p.image} style={{width:42,height:42,objectFit:'cover',borderRadius:10}}/>:'📷'}</td>
                  <td style={{ ...S.td, fontWeight:700 }}>
                    {p.name}
                    {p.is_promo&&<span style={{marginRight:6,background:'#fef9c3',color:'#92400e',padding:'1px 6px',borderRadius:20,fontSize:10}}>عرض</span>}
                  </td>
                  <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{p.price} {CUR}</td>
                  <td style={S.td}>{p.discount>0?<span style={{color:'#10b981',fontWeight:700}}>{p.discount}%</span>:'—'}</td>
                  <td style={S.td}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                      background:(p.stock||0)<5?'#fee2e2':(p.stock||0)<20?'#fef9c3':'#d1fae5',
                      color:(p.stock||0)<5?'#dc2626':(p.stock||0)<20?'#b45309':'#059669' }}>
                      {p.stock||0}
                    </span>
                  </td>
                  <td style={{ ...S.td, display:'flex', gap:5 }}>
                    <button style={{ ...S.btnSm, background:'#dbeafe', color:'#1d4ed8' }} onClick={()=>edit(p)}>✏️</button>
                    <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(p.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:30,color:'#94a3b8'}}>لا توجد منتجات</td></tr>}
              </tbody>
            </table>
          </div>}
      </div>
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
  const load=async()=>{ const {data}=await supabase.from('categories').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const save=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return}
    if(editId){
      await supabase.from('categories').update({name:name.trim(),image:image||null}).eq('id',editId)
      showToast('✅ تم التعديل'); setEditId(null)
    } else {
      await supabase.from('categories').insert({id:Date.now(),name:name.trim(),image:image||null})
      showToast('✅ تمت الإضافة')
    }
    setName(''); setImage(''); await load()
  }
  const startEdit=c=>{ setEditId(c.id); setName(c.name); setImage(c.image||'') }
  const cancel=()=>{ setEditId(null); setName(''); setImage('') }
  const del=async id=>{
    if(!await askConfirm('حذف هذه الفئة؟'))return
    await supabase.from('categories').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📂 الفئات</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:10,color:'#dc2626'}}>{editId?'✏️ تعديل فئة':'➕ إضافة فئة'}</h3>
        <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>📐 حجم صورة الفئة المثالي: <strong>400×300 بكسل</strong></p>
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
          <tbody>{items.map(c=>(
            <tr key={c.id} style={{borderBottom:'1px solid #f8fafc'}}>
              <td style={S.td}>{c.image?<img src={c.image} style={{width:60,height:45,borderRadius:8,objectFit:'cover'}}/>:'📁'}</td>
              <td style={{...S.td,fontWeight:700}}>{c.name}</td>
              <td style={{...S.td,display:'flex',gap:5}}>
                <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>startEdit(c)}>✏️ تعديل</button>
                <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(c.id)}>🗑️</button>
              </td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={3} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد فئات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏷️ العلامات
══════════════════════════════════════════ */
function Brands() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [editId,setEditId]=useState(null)
  const [name,setName]=useState(''); const [image,setImage]=useState('')
  const load=async()=>{ const {data}=await supabase.from('brands').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const save=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return}
    if(editId){
      await supabase.from('brands').update({name:name.trim(),image:image||null}).eq('id',editId)
      showToast('✅ تم التعديل'); setEditId(null)
    } else {
      await supabase.from('brands').insert({id:Date.now(),name:name.trim(),image:image||null})
      showToast('✅ تمت الإضافة')
    }
    setName(''); setImage(''); await load()
  }
  const del=async id=>{
    if(!await askConfirm('حذف هذه العلامة؟'))return
    await supabase.from('brands').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  const startEdit=b=>{ setEditId(b.id); setName(b.name); setImage(b.image||'') }
  const cancel=()=>{ setEditId(null); setName(''); setImage('') }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🏷️ العلامات التجارية</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:10,color:'#dc2626'}}>{editId?'✏️ تعديل علامة':'➕ إضافة علامة'}</h3>
        <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>📐 حجم شعار الماركة المثالي: <strong>300×300 بكسل</strong> (مربع)</p>
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
          <tbody>{items.map(b=>(
            <tr key={b.id} style={{borderBottom:'1px solid #f8fafc'}}>
              <td style={S.td}>{b.image?<img src={b.image} style={{width:44,height:44,borderRadius:'50%',objectFit:'cover'}}/>:'🏷️'}</td>
              <td style={{...S.td,fontWeight:700}}>{b.name}</td>
              <td style={{...S.td,display:'flex',gap:5}}>
                <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>startEdit(b)}>✏️ تعديل</button>
                <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(b.id)}>🗑️</button>
              </td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={3} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد علامات</td></tr>}
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
  const load=async()=>{ const {data}=await supabase.from('suppliers').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    if(!form.name.trim()){showToast('الاسم مطلوب','error');return} setSaving(true)
    await supabase.from('suppliers').upsert({id:form.id||Date.now(),name:form.name.trim(),phone:form.phone,whatsapp:form.whatsapp,email:form.email,address:form.address})
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''});await load();setSaving(false)
  }
  const edit=s=>setForm({id:s.id,name:s.name,phone:s.phone||'',whatsapp:s.whatsapp||'',email:s.email||'',address:s.address||''})
  const del=async id=>{if(!await askConfirm('حذف هذا المورد؟'))return;await supabase.from('suppliers').delete().eq('id',id);showToast('تم الحذف');await load()}
  const filtered=items.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🏭 الموردون</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>{form.id?'✏️ تعديل':'➕ إضافة'} مورد</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} inputMode="numeric"/></div>
          <div><label style={S.label}>واتساب</label><input style={S.input} value={form.whatsapp} onChange={F('whatsapp')} inputMode="numeric"/></div>
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
              <tr key={s.id} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{...S.td,fontWeight:700}}>{s.name}</td><td style={S.td}>{s.phone||'—'}</td>
                <td style={S.td}>{s.whatsapp?<a href={`https://wa.me/${s.whatsapp}`} target="_blank" style={{color:'#25D366',fontWeight:700}}>💬 {s.whatsapp}</a>:'—'}</td>
                <td style={{...S.td,display:'flex',gap:5}}>
                  <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>edit(s)}>✏️</button>
                  <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(s.id)}>🗑️</button>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد موردين</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   👥 العملاء + تصنيف M1/M2/M3
══════════════════════════════════════════ */
function Customers() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false)
  const [tierSettings,setTierSettings]=useState({ m1:0, m2:5000, m3:20000, d1:0, d2:5, d3:10 })
  const [form,setForm]=useState({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1'})

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

  const autoTier = (total) => {
    if (total >= tierSettings.m3) return 'M3'
    if (total >= tierSettings.m2) return 'M2'
    return 'M1'
  }

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
    setForm({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1'});await load();setSaving(false)
  }

  const edit=c=>setForm({id:c.id,name:c.name,email:c.email||'',phone:c.phone||'',address:c.address||'',password:'',tier:c.tier||'M1'})
  const del=async id=>{if(!await askConfirm('حذف هذا العميل؟'))return;await supabase.from('customers').delete().eq('id',id);showToast('تم الحذف');await load()}

  const tierColor = t => ({ M1:'#e2e8f0', M2:'#dbeafe', M3:'#fef9c3' }[t]||'#e2e8f0')
  const tierText  = t => ({ M1:'#475569', M2:'#1d4ed8', M3:'#92400e' }[t]||'#475569')
  const tierLabel = t => ({ M1:'🥉 M1 عادي', M2:'🥈 M2 مميز', M3:'🥇 M3 VIP' }[t]||t)

  const filtered=items.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search))

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>👥 العملاء</h1>

      {/* إعدادات الرتب */}
      <div style={{...S.card, background:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'1px solid #fcd34d'}}>
        <h3 style={{fontWeight:800,marginBottom:12,color:'#92400e'}}>🏅 إعدادات تصنيف العملاء</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {tier:'M1',label:'🥉 M1 عادي',min:0,disc:tierSettings.d1,color:'#64748b'},
            {tier:'M2',label:'🥈 M2 مميز',min:tierSettings.m2,disc:tierSettings.d2,color:'#3b82f6'},
            {tier:'M3',label:'🥇 M3 VIP',min:tierSettings.m3,disc:tierSettings.d3,color:'#f59e0b'},
          ].map(({tier,label,min,disc,color})=>(
            <div key={tier} style={{background:'white',borderRadius:12,padding:12,textAlign:'center',border:`2px solid ${color}`}}>
              <div style={{fontWeight:800,color,marginBottom:4}}>{label}</div>
              <div style={{fontSize:13,color:'#475569'}}>من {min} {CUR}</div>
              <div style={{fontSize:13,color:'#10b981',fontWeight:700}}>خصم {disc}%</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:12,color:'#92400e',marginTop:10}}>
          💡 لتعديل حدود الرتب اذهب إلى ⚙️ الإعدادات → تصنيف العملاء
        </p>
      </div>

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>{form.id?'✏️ تعديل':'➕ إضافة'} عميل</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} inputMode="numeric"/></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
          <div><label style={S.label}>كلمة المرور</label><input style={S.input} type="password" value={form.password} onChange={F('password')} /></div>
          <div><label style={S.label}>الرتبة</label>
            <select style={S.input} value={form.tier} onChange={F('tier')}>
              <option value="M1">🥉 M1 — عميل عادي</option>
              <option value="M2">🥈 M2 — عميل مميز</option>
              <option value="M3">🥇 M3 — عميل VIP</option>
            </select></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
          <button style={S.btnGray} onClick={()=>setForm({id:'',name:'',email:'',phone:'',address:'',password:'',tier:'M1'})}>✖</button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <h3 style={{fontWeight:800}}>العملاء ({filtered.length})</h3>
          <input style={{...S.input,width:220}} placeholder="🔍 اسم / هاتف..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={S.th}>الاسم</th><th style={S.th}>الهاتف</th><th style={S.th}>الرتبة</th><th style={S.th}>النقاط</th><th style={S.th}>إجراءات</th></tr></thead>
            <tbody>{filtered.map(c=>(
              <tr key={c.id} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{...S.td,fontWeight:700}}>{c.name}</td>
                <td style={S.td}>{c.phone||'—'}</td>
                <td style={S.td}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,
                    background:tierColor(c.tier||'M1'),color:tierText(c.tier||'M1')}}>
                    {tierLabel(c.tier||'M1')}
                  </span>
                </td>
                <td style={S.td}>{c.points||0}</td>
                <td style={{...S.td,display:'flex',gap:5}}>
                  <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>edit(c)}>✏️</button>
                  <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(c.id)}>🗑️</button>
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد عملاء</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   👔 الموظفون
══════════════════════════════════════════ */
function Employees() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({name:'',username:'',password:'',email:''})
  const load=async()=>{ const {data}=await supabase.from('employees').select('id,name,username,email,role').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const add=async()=>{
    if(!form.name||!form.username||!form.password){showToast('الاسم والمستخدم والكلمة مطلوبة','error');return} setSaving(true)
    await supabase.from('employees').insert({id:Date.now(),name:form.name,username:form.username,password:hashPwd(form.password),email:form.email,role:'staff'})
    showToast('✅ تم إضافة الموظف');setForm({name:'',username:'',password:'',email:''});await load();setSaving(false)
  }
  const del=async id=>{if(!await askConfirm('حذف هذا الموظف؟'))return;await supabase.from('employees').delete().eq('id',id);showToast('تم الحذف');await load()}
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>👔 الموظفون</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>اسم المستخدم *</label><input style={S.input} value={form.username} onChange={F('username')} /></div>
          <div><label style={S.label}>كلمة المرور *</label><input style={S.input} type="password" value={form.password} onChange={F('password')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
        </div>
        <button style={{...S.btn,marginTop:14}} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة'}</button>
      </div>
      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الاسم</th><th style={S.th}>المستخدم</th><th style={S.th}>الدور</th><th style={S.th}>حذف</th></tr></thead>
          <tbody>{items.map(e=>(
            <tr key={e.id} style={{borderBottom:'1px solid #f8fafc'}}>
              <td style={{...S.td,fontWeight:700}}>{e.name}</td><td style={S.td}>{e.username}</td>
              <td style={S.td}><span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:e.role==='admin'?'#fee2e2':'#d1fae5',color:e.role==='admin'?'#dc2626':'#059669'}}>{e.role==='admin'?'مدير':'موظف'}</span></td>
              <td style={S.td}>{e.role!=='admin'&&<button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(e.id)}>🗑️</button>}</td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد موظفين</td></tr>}
          </tbody>
        </table>
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
    await supabase.from('coupons').insert({id:Date.now(),code:form.code.toUpperCase().trim(),type:form.type,value:parseFloat(form.value),expiry:form.expiry||null,max_uses:parseInt(form.maxUses)||100,min_order:parseFloat(form.minOrder)||0,used:0})
    showToast('✅ تمت الإضافة');setForm({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0});await load();setSaving(false)
  }
  const del=async id=>{if(!await askConfirm('حذف؟'))return;await supabase.from('coupons').delete().eq('id',id);showToast('تم الحذف');await load()}
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🎟️ الكوبونات</h1>
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
            <tr key={c.id} style={{borderBottom:'1px solid #f8fafc'}}>
              <td style={{...S.td,fontWeight:900,color:'#dc2626'}}>{c.code}</td>
              <td style={S.td}>{c.type==='percent'?'نسبة':'ثابت'}</td>
              <td style={{...S.td,fontWeight:700}}>{c.type==='percent'?`${c.value}%`:`${c.value} دج`}</td>
              <td style={S.td}>{c.used||0}/{c.max_uses}</td>
              <td style={S.td}><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(c.id)}>🗑️</button></td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد كوبونات</td></tr>}
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

  // سعر الكارتون = سعر الشراء × عدد القطع
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
    showToast('✅ تم حفظ الفاتورة وطباعتها');setSuppId('');setItems([])
    const {data:pur}=await supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20)
    setPurchases(pur||[]); setSaving(false)
  }

  return (
    <div>{ToastUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🛒 المشتريات</h1>
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

        {/* جدول المنتجات */}
        {items.length>0&&(
          <div style={{overflowX:'auto',marginBottom:14}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'linear-gradient(135deg,#dc2626,#7c3aed)'}}>
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
                    <td style={{...S.td,textAlign:'center',color:'#475569'}}>{item.totalUnits}</td>
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
          <div style={{textAlign:'center',padding:'20px',color:'#94a3b8',border:'2px dashed #e2e8f0',borderRadius:12,marginBottom:14}}>
            📦 لا توجد منتجات — ابدأ بإضافة منتج
          </div>
        )}

        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={()=>setShowModal(true)} style={{...S.btnGray,background:'#10b981',color:'white'}}>➕ إضافة منتج</button>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ + طباعة'}</button>
          {items.length>0&&<span style={{fontWeight:900,color:'#dc2626',fontSize:18}}>💰 {total.toFixed(0)} {CUR}</span>}
        </div>
      </div>

      {/* مودال إضافة منتج */}
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

      {/* مودال إضافة منتج جديد */}
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
                <tr key={p.id} style={{borderBottom:'1px solid #f8fafc'}}>
                  <td style={{...S.td,fontSize:11,color:'#94a3b8'}}>{p.id}</td>
                  <td style={{...S.td,fontWeight:700}}>{p.supplier_name}</td>
                  <td style={S.td}>{p.date}</td>
                  <td style={S.td}>{its.length} منتج</td>
                  <td style={{...S.td,color:'#dc2626',fontWeight:700}}>{Number(p.total).toFixed(0)} {CUR}</td>
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
            {purchases.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد فواتير</td></tr>}
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

  // تصدير CSV (يفتح في Excel)
  const exportCSV = () => {
    const header = 'ID,اسم المنتج,الباركود,المخزون,السعر,سعر الشراء,قطع/كرتون'
    const rows = items.map(p => `${p.id},"${p.name}","${p.sku||''}",${p.stock||0},${p.price},${p.cost_price||0},${p.units||12}`)
    const csv = '\uFEFF' + header + '\n' + rows.join('\n') // BOM for Arabic
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='naqaa_inventory.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('✅ تم تصدير المخزون')
  }

  // استيراد CSV
  const importCSV = e => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const lines = ev.target.result.split('\n').slice(1) // تخطي الـ header
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
      <tbody>${filtered.map(p=>`<tr><td>${p.name}</td><td>${p.sku||'—'}</td><td>${p.stock||0}</td><td>${(p.stock||0)<5?'⚠️ منخفض':(p.stock||0)<20?'متوسط':'جيد'}</td><td>${((p.stock||0)*Number(p.price)).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody></table>
      <div class="footer">إجمالي قيمة المخزون: ${filtered.reduce((s,p)=>s+(p.stock||0)*Number(p.price),0).toFixed(0)} ${CUR}</div>
    `)
  }

  return (
    <div>{ToastUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📦 المخزون</h1>
      <div style={S.card}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
          <input style={{...S.input,flex:1,minWidth:180}} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
          <button style={{...S.btnGray,background:'#10b981',color:'white'}} onClick={exportCSV}>📥 تصدير Excel</button>
          <label style={{...S.btnGray,background:'#3b82f6',color:'white',cursor:'pointer',padding:'10px 22px',borderRadius:30,fontWeight:700,fontSize:14}}>
            📤 استيراد Excel
            <input type="file" accept=".csv,.xlsx" style={{display:'none'}} onChange={importCSV}/>
          </label>
          <button style={{...S.btnGray,background:'#7c3aed',color:'white'}} onClick={printInventory}>🖨️ طباعة</button>
        </div>
        {/* تعليمات الاستيراد */}
        <div style={{background:'#f0f9ff',borderRadius:10,padding:12,marginBottom:14,fontSize:12,color:'#1d4ed8'}}>
          💡 <strong>تعليمات الاستيراد:</strong> صدّر الملف أولاً، عدّل الكميات والأسعار في Excel، ثم استورده مجدداً. العمود الأول (ID) لا تغيّره.
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={S.th}>المنتج</th><th style={S.th}>الباركود</th>
              <th style={S.th}>المخزون</th><th style={S.th}>الحالة</th>
              <th style={S.th}>القيمة</th>
            </tr></thead>
            <tbody>{filtered.map(p=>(
              <tr key={p.id} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{...S.td,fontWeight:700}}>{p.name}</td>
                <td style={S.td}>{p.sku||'—'}</td>
                <td style={S.td}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,
                    background:(p.stock||0)<5?'#fee2e2':(p.stock||0)<20?'#fef9c3':'#d1fae5',
                    color:(p.stock||0)<5?'#dc2626':(p.stock||0)<20?'#b45309':'#059669'}}>
                    {p.stock||0}
                  </span>
                </td>
                <td style={S.td}>{(p.stock||0)<5?'⚠️ منخفض':(p.stock||0)<20?'⚡ متوسط':'✅ جيد'}</td>
                <td style={S.td}>{((p.stock||0)*Number(p.price)).toFixed(0)} {CUR}</td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد منتجات</td></tr>}
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
   📋 الطلبيات (بحث متقدم + تجميع + طباعة)
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
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📋 الطلبيات</h1>
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
            <span style={{fontSize:13,color:'#475569'}}>✓ {selectedOrders.length} محدد</span>
            <button style={{...S.btnSm,background:'#10b981',color:'white'}} onClick={()=>updateMulti('processing')}>تجهيز الكل</button>
            <button style={{...S.btnSm,background:'#3b82f6',color:'white'}} onClick={()=>updateMulti('shipped')}>شحن الكل</button>
            <button style={{...S.btnSm,background:'#7c3aed',color:'white'}} onClick={()=>updateMulti('delivered')}>تسليم الكل</button>
          </>}
          <button style={{...S.btnGray,background:'#f59e0b',color:'white',marginRight:'auto'}} onClick={printDelivery}>
            🖨️ طباعة قائمة الكاميو ({filtered.length})
          </button>
        </div>
        <div style={{marginTop:10,fontSize:13,color:'#64748b'}}>
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
                  <div style={{color:'#64748b',fontSize:12}}>{o.customer_address}</div>
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
                <tr key={o.id} style={{borderBottom:'1px solid #f8fafc'}}>
                  <td style={S.td}><input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={()=>setSelectedOrders(p=>p.includes(o.id)?p.filter(x=>x!==o.id):[...p,o.id])}/></td>
                  <td style={{...S.td,fontSize:11,color:'#94a3b8'}}>{o.id}</td>
                  <td style={{...S.td,fontWeight:700}}>{o.customer_name}</td>
                  <td style={S.td}>{o.customer_phone||'—'}</td>
                  <td style={{...S.td,fontSize:12}}>{o.customer_address||'—'}</td>
                  <td style={{...S.td,color:'#dc2626',fontWeight:700}}>{Number(o.total).toFixed(0)} {CUR}</td>
                  <td style={S.td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700,background:sColor(o.status)}}>{sLabel(o.status)}</span></td>
                  <td style={S.td}>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {['processing','shipped','delivered'].map(s=>(
                        <button key={s} style={{...S.btnSm,background:'#f1f5f9',color:'#475569',fontSize:11}} onClick={()=>updateStatus(o.id,s)}>
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
              {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:30,color:'#94a3b8'}}>لا توجد طلبيات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   🎯 إدارة العروض الكاملة
══════════════════════════════════════════ */
function PromotionsManager() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [promos,setPromos]=useState([]); const [products,setProducts]=useState([])
  const [saving,setSaving]=useState(false)
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
    await load(); setSaving(false)
  }

  const edit=p=>setForm({
    id:p.id, name:p.name, type:p.type, active:p.active,
    buy_qty:p.buy_qty||3, get_qty:p.get_qty||1, discount_value:p.discount_value||0,
    product_ids:typeof p.product_ids==='string'?JSON.parse(p.product_ids||'[]'):(p.product_ids||[]),
    min_amount:p.min_amount||0, description:p.description||'', end_date:p.end_date?.split('T')[0]||'', image:p.image||'',
    tier_qty:p.tier_qty||1, tier_type:p.tier_type||'percent', tier_value:p.tier_value||0
  })

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
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🎯 إدارة العروض</h1>

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>{form.id?'✏️ تعديل':'➕ إنشاء'} عرض</h3>

        <div style={S.grid2}>
          <div><label style={S.label}>اسم العرض *</label>
            <input style={S.input} value={form.name} onChange={F('name')} placeholder="مثال: عرض الصيف" /></div>
          <div><label style={S.label}>نوع العرض</label>
            <select style={S.input} value={form.type} onChange={F('type')}>
              <option value="percent">خصم نسبة % على المنتجات</option>
              <option value="fixed">خصم مبلغ ثابت</option>
              <option value="buy_x_get_y">اشتري X خذ Y مجاناً</option>
              <option value="tier_buy">📦 اشتري X من نفس الشركة = خصم</option>
            </select></div>
          <div><label style={S.label}>تاريخ الانتهاء</label>
            <input style={S.input} type="datetime-local" value={form.end_date} onChange={F('end_date')} /></div>
          <div><label style={S.label}>الحد الأدنى للطلب</label>
            <NumInput value={form.min_amount} onChange={F('min_amount')} /></div>
        </div>

        {/* خيارات حسب النوع */}
        {form.type==='percent'&&(
          <div style={{marginTop:12}}>
            <label style={S.label}>نسبة الخصم %</label>
            <NumInput value={form.discount_value} onChange={F('discount_value')} placeholder="مثال: 20" style={{width:200}}/>
          </div>
        )}
        {form.type==='fixed'&&(
          <div style={{marginTop:12}}>
            <label style={S.label}>مبلغ الخصم (دج)</label>
            <NumInput value={form.discount_value} onChange={F('discount_value')} style={{width:200}}/>
          </div>
        )}
        {form.type==='buy_x_get_y'&&(
          <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
            <div><label style={S.label}>اشتري كم؟</label>
              <NumInput value={form.buy_qty} onChange={F('buy_qty')} style={{width:120}}/></div>
            <div><label style={S.label}>خذ كم مجاناً؟</label>
              <NumInput value={form.get_qty} onChange={F('get_qty')} style={{width:120}}/></div>
            <div style={{padding:'14px 0',fontSize:14,color:'#475569',alignSelf:'flex-end'}}>
              ← أي منتج من الأرخص يكون مجاناً
            </div>
          </div>
        )}

        {/* وصف العرض */}
        <div style={{marginTop:12}}>
          <label style={S.label}>وصف العرض (يظهر للزبون)</label>
          <input style={S.input} value={form.description} onChange={F('description')} placeholder="مثال: عند شراء 3 منتجات تحصل على الرابع مجاناً!" />
        </div>

        {/* صورة بانر العرض */}
        <div style={{marginTop:12}}>
          <label style={S.label}>صورة بانر العرض (1200×400)</label>
          <input style={S.input} type="file" accept="image/*" onChange={handleImg} />
          {form.image&&<img src={form.image} style={{width:'100%',height:80,objectFit:'cover',borderRadius:10,marginTop:6}}/>}
        </div>

        {/* tier_buy خيارات */}
        {form.type==='tier_buy'&&(
          <div style={{background:'#f0f9ff',borderRadius:12,padding:14,marginTop:12}}>
            <p style={{fontWeight:700,fontSize:14,marginBottom:10,color:'#1d4ed8'}}>📦 عند شراء X كرتون من نفس الشركة → خصم</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              <div><label style={S.label}>عدد الكراتين المطلوب</label><NumInput value={form.tier_qty} onChange={F('tier_qty')} /></div>
              <div><label style={S.label}>نوع الخصم</label>
                <select style={S.input} value={form.tier_type} onChange={F('tier_type')}>
                  <option value="percent">نسبة %</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select></div>
              <div><label style={S.label}>قيمة الخصم</label><NumInput value={form.tier_value} onChange={F('tier_value')} /></div>
            </div>
            <p style={{fontSize:12,color:'#64748b',marginTop:8}}>مثال: اشتري {form.tier_qty} كرتون من نفس الشركة → {form.tier_value}{form.tier_type==='percent'?'%':' '+CUR} خصم</p>
          </div>
        )}

        {/* اختيار المنتجات — بحث + checkbox */}
        <div style={{marginTop:14}}>
          <label style={S.label}>
            🔍 المنتجات المشمولة بالعرض
            <span style={{fontWeight:400,color:'#94a3b8',marginRight:8,fontSize:12}}>(اتركها فارغة لتشمل جميع المنتجات)</span>
          </label>
          <input style={{...S.input,marginBottom:8}} placeholder="ابحث عن منتج..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)} />
          <div style={{maxHeight:220,overflowY:'auto',border:'1.5px solid #e2e8f0',borderRadius:12,padding:10}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:6}}>
              {products.filter(p=>!prodSearch||p.name.toLowerCase().includes(prodSearch.toLowerCase())).map(p=>{
                const sel=form.product_ids.includes(p.id)||form.product_ids.includes(String(p.id))
                return (
                  <label key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                    borderRadius:10,cursor:'pointer',background:sel?'#fef2f2':'#f8fafc',
                    border:`1.5px solid ${sel?'#dc2626':'transparent'}`,transition:'.15s'}}>
                    <input type="checkbox" checked={sel} onChange={()=>toggleProduct(p.id)} style={{accentColor:'#dc2626'}}/>
                    {p.image&&<img src={p.image} style={{width:28,height:28,borderRadius:6,objectFit:'cover',flexShrink:0}}/>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{p.name}</div>
                      <div style={{fontSize:11,color:'#94a3b8'}}>{p.price} {CUR}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
          {form.product_ids.length>0&&(
            <div style={{marginTop:6,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,color:'#10b981',fontWeight:700}}>✓ {form.product_ids.length} منتج محدد</span>
              <button onClick={()=>setForm(f=>({...f,product_ids:[]}))} style={{...S.btnSm,background:'#fee2e2',color:'#dc2626',fontSize:11}}>إلغاء الكل</button>
            </div>
          )}
        </div>

        {/* تفعيل العرض */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginTop:14}}>
          <input type="checkbox" id="active" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/>
          <label htmlFor="active" style={{fontWeight:700,cursor:'pointer'}}>⚡ تفعيل العرض فور الحفظ</label>
        </div>

        <div style={{display:'flex',gap:10,marginTop:16,flexWrap:'wrap'}}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ العرض'}</button>
          <button style={S.btnGray} onClick={()=>setForm({id:'',name:'',type:'percent',active:true,buy_qty:3,get_qty:1,discount_value:0,product_ids:[],min_amount:0,description:'',end_date:'',image:''})}>✖ إلغاء</button>
        </div>
      </div>

      {/* قائمة العروض */}
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14}}>العروض الحالية ({promos.length})</h3>
        {promos.length===0&&<p style={{textAlign:'center',color:'#94a3b8',padding:24}}>لا توجد عروض — أنشئ أول عرض الآن!</p>}
        {promos.map(p=>{
          const pids=typeof p.product_ids==='string'?JSON.parse(p.product_ids||'[]'):(p.product_ids||[])
          const isExpired=p.end_date&&new Date(p.end_date)<new Date()
          return (
            <div key={p.id} style={{background:p.active&&!isExpired?'#f0fdf4':'#f8fafc',borderRadius:14,padding:14,marginBottom:10,border:`1px solid ${p.active&&!isExpired?'#10b981':'#e2e8f0'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontWeight:800,fontSize:15}}>{p.name}</div>
                  <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{typeLabel[p.type]||p.type}</div>
                  {p.description&&<div style={{fontSize:12,color:'#475569',marginTop:4,fontStyle:'italic'}}>"{p.description}"</div>}
                  {p.end_date&&<div style={{fontSize:11,color:isExpired?'#ef4444':'#f59e0b',marginTop:2}}>
                    {isExpired?'⏰ انتهى':'⏳ ينتهي'}: {new Date(p.end_date).toLocaleDateString('ar-DZ')}
                  </div>}
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>
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
    </div>
  )
}

/* ══════════════════════════════════════════
   🔔 الإشعارات
══════════════════════════════════════════ */
function Notifications() {
  const [showToast,ToastUI]=useToast()
  const [items,setItems]=useState([]); const [customers,setCustomers]=useState([])
  const [title,setTitle]=useState(''); const [body,setBody]=useState('')
  const [targetType,setTargetType]=useState('all')
  const [addressFilter,setAddressFilter]=useState('')
  const [saving,setSaving]=useState(false)
  const load=async()=>{
    const [{data:n},{data:c}]=await Promise.all([
      supabase.from('notifications').select('*').order('id',{ascending:false}),
      supabase.from('customers').select('id,name,tier,address').order('name'),
    ])
    setItems(n||[]); setCustomers(c||[])
  }
  useEffect(()=>{ load() },[])
  const targeted=customers.filter(c=>{
    if(targetType==='all') return true
    if(['M1','M2','M3'].includes(targetType)) return (c.tier||'M1')===targetType
    if(targetType==='address') return addressFilter&&(c.address||'').includes(addressFilter)
    return true
  })
  const send=async()=>{
    if(!title||!body){showToast('العنوان والنص مطلوبان','error');return} setSaving(true)
    await supabase.from('notifications').insert({
      id:Date.now(),title,body,
      target_type:targetType,target_count:targeted.length,
      date:new Date().toLocaleString('ar-DZ'),is_read:false
    })
    showToast(`✅ تم الإرسال لـ ${targeted.length} عميل`);setTitle('');setBody('');await load();setSaving(false)
  }
  const tierLabels={all:'الكل',M1:'M1 عادي',M2:'M2 مميز',M3:'M3 VIP',address:'حسب العنوان'}
  const tierColors={all:'#475569',M1:'#475569',M2:'#1d4ed8',M3:'#92400e',address:'#059669'}
  return (
    <div>{ToastUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🔔 الإشعارات</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>📢 إرسال إشعار</h3>
        <label style={S.label}>👥 أرسل إلى</label>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
          {Object.entries(tierLabels).map(([k,v])=>(
            <button key={k} onClick={()=>setTargetType(k)}
              style={{...S.btnSm,background:targetType===k?tierColors[k]:'#f1f5f9',
                color:targetType===k?'white':'#64748b',
                border:`2px solid ${targetType===k?tierColors[k]:'transparent'}`,fontWeight:700}}>
              {v}
            </button>
          ))}
        </div>
        {targetType==='address'&&(
          <div style={{marginBottom:12}}>
            <label style={S.label}>🗺️ فلتر العنوان (ولاية أو حي)</label>
            <input style={S.input} value={addressFilter} onChange={e=>setAddressFilter(e.target.value)} placeholder="مثال: الجزائر العاصمة" />
          </div>
        )}
        <div style={{background:'#f0fdf4',borderRadius:10,padding:'10px 14px',marginBottom:12,fontSize:13,fontWeight:700,color:'#059669'}}>
          👥 سيصل الإشعار إلى: <strong>{targeted.length}</strong> عميل
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div><label style={S.label}>العنوان *</label><input style={S.input} value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div><label style={S.label}>النص *</label><input style={S.input} value={body} onChange={e=>setBody(e.target.value)} /></div>
        </div>
        <button style={S.btn} onClick={send} disabled={saving||targeted.length===0}>{saving?'⏳...':'📢 إرسال'}</button>
      </div>
      <div style={S.card}>
        {items.length===0?<p style={{textAlign:'center',color:'#94a3b8',padding:24}}>لا توجد إشعارات</p>:
          items.map(n=>(
            <div key={n.id} style={{borderBottom:'1px solid #f8fafc',padding:'12px 0'}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
                <strong>{n.title}</strong>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  {n.target_type&&n.target_type!=='all'&&<span style={{fontSize:11,background:'#f1f5f9',borderRadius:20,padding:'2px 8px'}}>{tierLabels[n.target_type]||n.target_type}</span>}
                  {n.target_count>0&&<span style={{fontSize:11,color:'#10b981',fontWeight:700}}>{n.target_count} عميل</span>}
                  <span style={{fontSize:12,color:'#94a3b8'}}>{n.date}</span>
                </div>
              </div>
              <p style={{fontSize:14,color:'#475569',marginTop:4}}>{n.body}</p>
            </div>
          ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📊 التقارير
══════════════════════════════════════════ */
function Reports() {
  const [stats,setStats]=useState({sales:0,purchases:0,expenses:0})
  const [topProds,setTopProds]=useState([]); const [period,setPeriod]=useState('month')
  useEffect(()=>{
    const load=async()=>{
      const [{data:orders},{data:purch},{data:exp}]=await Promise.all([
        supabase.from('orders').select('total,items,date'),
        supabase.from('purchases').select('total'),
        supabase.from('expenses').select('amount'),
      ])
      const now=new Date()
      const filtered=(orders||[]).filter(o=>{
        const d=new Date(o.date)
        if(period==='week') return (now-d)<7*24*3600*1000
        if(period==='month') return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()
        if(period==='year') return d.getFullYear()===now.getFullYear()
        return true
      })
      const sales=filtered.reduce((s,o)=>s+Number(o.total),0)
      setStats({sales,purchases:(purch||[]).reduce((s,p)=>s+Number(p.total),0),expenses:(exp||[]).reduce((s,e)=>s+Number(e.amount),0)})
      const sc={}
      filtered.forEach(o=>{
        let its=o.items; if(typeof its==='string'){try{its=JSON.parse(its)}catch{its=[]}}
        ;(its||[]).forEach(i=>(sc[i.name]=(sc[i.name]||0)+i.quantity))
      })
      setTopProds(Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,10))
    }
    load()
  },[period])
  const profit=stats.sales-stats.purchases-stats.expenses
  const printReport=()=>{
    printA4(`<div class="header"><div><h1>🛍️ نقاء</h1><p>تقرير ${{week:'أسبوعي',month:'شهري',year:'سنوي',all:'إجمالي'}[period]}</p></div><div>${new Date().toLocaleDateString('ar-DZ')}</div></div>
    <table><thead><tr><th>البيان</th><th>المبلغ</th></tr></thead><tbody>
    <tr><td>إجمالي المبيعات</td><td>${stats.sales.toFixed(0)} ${CUR}</td></tr>
    <tr><td>إجمالي المشتريات</td><td>${stats.purchases.toFixed(0)} ${CUR}</td></tr>
    <tr><td>إجمالي المصاريف</td><td>${stats.expenses.toFixed(0)} ${CUR}</td></tr>
    <tr class="total-row"><td>صافي الربح</td><td>${profit.toFixed(0)} ${CUR}</td></tr>
    </tbody></table>
    <h2>أكثر المنتجات مبيعاً</h2>
    <table><thead><tr><th>المنتج</th><th>الكمية</th></tr></thead><tbody>${topProds.map(([n,q])=>`<tr><td>${n}</td><td>${q}</td></tr>`).join('')}</tbody></table>
    <div class="footer">نقاء</div>`)
  }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📊 التقارير</h1>
      <div style={{...S.card,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontWeight:700}}>الفترة:</span>
        {[['week','هذا الأسبوع'],['month','هذا الشهر'],['year','هذه السنة'],['all','الكل']].map(([v,l])=>(
          <button key={v} style={{...S.btnSm,background:period===v?'#dc2626':'#e2e8f0',color:period===v?'white':'#475569'}} onClick={()=>setPeriod(v)}>{l}</button>
        ))}
        <button style={{...S.btnGray,background:'#3b82f6',color:'white',marginRight:'auto'}} onClick={printReport}>🖨️ طباعة التقرير</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:14,marginBottom:20}}>
        {[{l:'إجمالي المبيعات',v:stats.sales.toFixed(0)+' '+CUR,c:'#10b981',i:'💰'},
          {l:'إجمالي المشتريات',v:stats.purchases.toFixed(0)+' '+CUR,c:'#dc2626',i:'🛒'},
          {l:'إجمالي المصاريف',v:stats.expenses.toFixed(0)+' '+CUR,c:'#f59e0b',i:'💸'},
          {l:'صافي الربح',v:profit.toFixed(0)+' '+CUR,c:profit>=0?'#10b981':'#ef4444',i:'📈'},
        ].map((s,i)=>(
          <div key={i} style={{...S.card,textAlign:'center',borderTop:`3px solid ${s.c}`,marginBottom:0}}>
            <div style={{fontSize:28}}>{s.i}</div>
            <div style={{fontSize:19,fontWeight:900,color:s.c,margin:'6px 0'}}>{s.v}</div>
            <div style={{fontSize:12,color:'#64748b'}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14}}>🔥 أكثر المنتجات مبيعاً</h3>
        {topProds.length===0?<p style={{textAlign:'center',color:'#94a3b8',padding:20}}>لا توجد بيانات</p>:
          topProds.map(([name,qty],i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f8fafc'}}>
              <span style={{fontSize:14}}>#{i+1} {name}</span>
              <strong style={{color:'#dc2626'}}>{qty} قطعة</strong>
            </div>
          ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   💸 المصاريف
══════════════════════════════════════════ */
function Expenses() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({name:'',amount:'',date:new Date().toISOString().split('T')[0],category:'other'})
  const load=async()=>{ const {data}=await supabase.from('expenses').select('*').order('id',{ascending:false}); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const add=async()=>{
    if(!form.name||!form.amount){showToast('الاسم والمبلغ مطلوبان','error');return} setSaving(true)
    await supabase.from('expenses').insert({id:Date.now(),name:form.name.trim(),amount:parseFloat(form.amount),date:form.date,category:form.category})
    showToast('✅ تمت الإضافة');setForm({name:'',amount:'',date:new Date().toISOString().split('T')[0],category:'other'});await load();setSaving(false)
  }
  const del=async id=>{if(!await askConfirm('حذف؟'))return;await supabase.from('expenses').delete().eq('id',id);showToast('تم الحذف');await load()}
  const catLabel={rent:'إيجار',salary:'رواتب',utilities:'فواتير',other:'أخرى'}
  const filtered=items.filter(e=>e.name?.toLowerCase().includes(search.toLowerCase()))
  const total=items.reduce((s,e)=>s+Number(e.amount),0)
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>💸 المصاريف</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>المبلغ *</label><NumInput value={form.amount} onChange={F('amount')} /></div>
          <div><label style={S.label}>التاريخ</label><input style={S.input} type="date" value={form.date} onChange={F('date')} /></div>
          <div><label style={S.label}>الفئة</label><select style={S.input} value={form.category} onChange={F('category')}><option value="rent">إيجار</option><option value="salary">رواتب</option><option value="utilities">فواتير</option><option value="other">أخرى</option></select></div>
        </div>
        <button style={{...S.btn,marginTop:14}} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة'}</button>
      </div>
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <h3 style={{fontWeight:800}}>المصاريف</h3>
          <input style={{...S.input,width:200}} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={S.th}>الاسم</th><th style={S.th}>المبلغ</th><th style={S.th}>الفئة</th><th style={S.th}>التاريخ</th><th style={S.th}>حذف</th></tr></thead>
            <tbody>{filtered.map(e=>(
              <tr key={e.id} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{...S.td,fontWeight:700}}>{e.name}</td>
                <td style={{...S.td,color:'#ef4444',fontWeight:700}}>{Number(e.amount).toFixed(0)} {CUR}</td>
                <td style={S.td}>{catLabel[e.category]||e.category}</td><td style={S.td}>{e.date}</td>
                <td style={S.td}><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(e.id)}>🗑️</button></td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد مصاريف</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:14,fontWeight:900,color:'#ef4444',fontSize:16}}>💰 الإجمالي: {total.toFixed(0)} {CUR}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📋 سجل النشاطات
══════════════════════════════════════════ */
function ActivityLog() {
  const [items,setItems]=useState([])
  useEffect(()=>{ supabase.from('activity_log').select('*').order('id',{ascending:false}).limit(50).then(({data})=>setItems(data||[])) },[])
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📋 سجل النشاطات</h1>
      <div style={{...S.card,maxHeight:500,overflowY:'auto'}}>
        {items.length===0?<p style={{textAlign:'center',color:'#94a3b8',padding:24}}>لا توجد نشاطات</p>:
          items.map(log=>(
            <div key={log.id} style={{borderBottom:'1px solid #f8fafc',padding:'10px 0'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><strong style={{color:'#dc2626'}}>{log.action}</strong><span style={{fontSize:12,color:'#94a3b8'}}>{log.date}</span></div>
              <p style={{fontSize:13,color:'#475569',marginTop:2}}>{log.details}</p>
            </div>
          ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   ⚙️ الإعدادات
══════════════════════════════════════════ */
function Settings({ showToast }) {
  const [form,setForm]=useState({
    store_name:'نقاء', store_currency:'دج',
    whatsapp_number:WA_DEFAULT, free_shipping_threshold:'500',
    tier_m2_min:'5000', tier_m3_min:'20000',
    tier_m1_discount:'0', tier_m2_discount:'5', tier_m3_discount:'10'
  })
  const [saving,setSaving]=useState(false)
  useEffect(()=>{
    supabase.from('settings').select('*').then(({data})=>{
      if(data){const map={};data.forEach(r=>(map[r.key]=r.value));setForm(f=>({...f,...map}))}
    })
  },[])
  const save=async()=>{
    setSaving(true)
    await Promise.all(Object.entries(form).map(([key,value])=>supabase.from('settings').upsert({key,value:String(value)})))
    showToast('✅ تم حفظ الإعدادات');setSaving(false)
  }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>⚙️ إعدادات المتجر</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>إعدادات عامة</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المتجر</label><input style={S.input} value={form.store_name} onChange={e=>setForm(f=>({...f,store_name:e.target.value}))} /></div>
          <div><label style={S.label}>العملة</label><input style={S.input} value={form.store_currency} onChange={e=>setForm(f=>({...f,store_currency:e.target.value}))} /></div>
          <div><label style={S.label}>رقم واتساب</label><input style={S.input} value={form.whatsapp_number} onChange={e=>setForm(f=>({...f,whatsapp_number:e.target.value}))} /></div>
          <div><label style={S.label}>حد التوصيل المجاني</label><NumInput value={form.free_shipping_threshold} onChange={e=>setForm(f=>({...f,free_shipping_threshold:e.target.value}))} /></div>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>🏅 إعدادات تصنيف العملاء</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14}}>
          <div><label style={S.label}>🥈 M2 — الحد الأدنى (دج)</label><NumInput value={form.tier_m2_min} onChange={e=>setForm(f=>({...f,tier_m2_min:e.target.value}))} /></div>
          <div><label style={S.label}>🥇 M3 — الحد الأدنى (دج)</label><NumInput value={form.tier_m3_min} onChange={e=>setForm(f=>({...f,tier_m3_min:e.target.value}))} /></div>
          <div><label style={S.label}>خصم M1 %</label><NumInput value={form.tier_m1_discount} onChange={e=>setForm(f=>({...f,tier_m1_discount:e.target.value}))} /></div>
          <div><label style={S.label}>خصم M2 %</label><NumInput value={form.tier_m2_discount} onChange={e=>setForm(f=>({...f,tier_m2_discount:e.target.value}))} /></div>
          <div><label style={S.label}>خصم M3 %</label><NumInput value={form.tier_m3_discount} onChange={e=>setForm(f=>({...f,tier_m3_discount:e.target.value}))} /></div>
        </div>
      </div>
      <button style={{...S.btn,marginTop:4}} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ الإعدادات'}</button>
    </div>
  )
}

/* ══════════════════════════════════════════
   🎨 إدارة واجهة المتجر
══════════════════════════════════════════ */
function StoreManager({ showToast }) {
  const [banners,setBanners]=useState([]); const [form,setForm]=useState({title:'',subtitle:'',image:''})
  const [promoText,setPromoText]=useState(''); const [announceBar,setAnnounceBar]=useState(''); const [saving,setSaving]=useState(false)
  const [primaryColor,setPrimaryColor]=useState('#dc2626')
  const [storeLogo,setStoreLogo]=useState('')
  const [storeName2,setStoreName2]=useState('')
  useEffect(()=>{
    supabase.from('settings').select('*').then(({data})=>{
      if(!data) return; const map={}; data.forEach(r=>(map[r.key]=r.value))
      try{setBanners(JSON.parse(map['store_banners']||'[]'))}catch{}
      setPromoText(map['promo_text']||''); setAnnounceBar(map['announce_bar']||'')
      setPrimaryColor(map['primary_color']||'#dc2626')
      setStoreLogo(map['store_logo']||'')
      setStoreName2(map['store_name']||'نقاء')
    })
  },[])
  const handleLogo=e=>{const r=new FileReader();r.onload=ev=>setStoreLogo(ev.target.result);r.readAsDataURL(e.target.files[0])}
  const handleImg=e=>{const r=new FileReader();r.onload=ev=>setForm(f=>({...f,image:ev.target.result}));r.readAsDataURL(e.target.files[0])}
  const addBanner=async()=>{
    if(!form.title&&!form.image){showToast('أضف صورة أو عنوان','error');return} setSaving(true)
    const updated=[...banners,{id:Date.now(),...form}]
    await supabase.from('settings').upsert({key:'store_banners',value:JSON.stringify(updated)})
    setBanners(updated);setForm({title:'',subtitle:'',image:''});showToast('✅ تمت الإضافة');setSaving(false)
  }
  const delBanner=async id=>{
    const updated=banners.filter(b=>b.id!==id)
    await supabase.from('settings').upsert({key:'store_banners',value:JSON.stringify(updated)})
    setBanners(updated);showToast('تم الحذف')
  }
  const saveTexts=async()=>{
    setSaving(true)
    await Promise.all([
      supabase.from('settings').upsert({key:'promo_text',value:promoText}),
      supabase.from('settings').upsert({key:'announce_bar',value:announceBar}),
      supabase.from('settings').upsert({key:'primary_color',value:primaryColor}),
      supabase.from('settings').upsert({key:'store_logo',value:storeLogo}),
      supabase.from('settings').upsert({key:'store_name',value:storeName2}),
    ])
    showToast('✅ تم الحفظ');setSaving(false)
  }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🎨 إدارة واجهة المتجر</h1>
      <div style={{...S.card,background:'#f0f9ff',border:'1px solid #bfdbfe'}}>
        <strong style={{color:'#1d4ed8'}}>📐 أحجام الصور:</strong>
        <div style={{display:'flex',gap:16,marginTop:8,flexWrap:'wrap',fontSize:13}}>
          <span>🖼️ بانر: <strong>1200×450px</strong></span>
          <span>🏷️ ماركة: <strong>300×300px</strong></span>
          <span>📂 فئة: <strong>400×300px</strong></span>
          <span>📦 منتج: <strong>600×600px</strong></span>
          <span>🎯 بانر عرض: <strong>1200×400px</strong></span>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>📢 النصوص الترويجية</h3>
        <label style={S.label}>شريط الإعلانات (أعلى الصفحة)</label>
        <input style={S.input} value={announceBar} onChange={e=>setAnnounceBar(e.target.value)} placeholder="🎉 توصيل مجاني على الطلبات فوق 500 دج" />
        <div style={{marginTop:12}}>
          <label style={S.label}>نص ترويجي (تحت البانر)</label>
          <input style={S.input} value={promoText} onChange={e=>setPromoText(e.target.value)} placeholder="اشتري 3 خذ 4 مجاناً!" />
        </div>
        <button style={{...S.btn,marginTop:14}} onClick={saveTexts} disabled={saving}>{saving?'⏳...':'💾 حفظ النصوص'}</button>
      </div>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>🎨 الهوية البصرية للمتجر</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المتجر</label>
            <input style={S.input} value={storeName2} onChange={e=>setStoreName2(e.target.value)} /></div>
          <div><label style={S.label}>اللون الأساسي</label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)} style={{width:46,height:38,border:'none',borderRadius:8,cursor:'pointer'}}/>
              <input style={{...S.input,width:120}} value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)}/>
            </div></div>
          <div><label style={S.label}>شعار المتجر (Logo)</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleLogo}/>
            {storeLogo&&<img src={storeLogo} style={{height:50,marginTop:6,borderRadius:8}}/>}</div>
        </div>
        <button style={{...S.btn,marginTop:14}} onClick={saveTexts} disabled={saving}>{saving?'⏳...':'💾 حفظ الهوية'}</button>
      </div>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>🖼️ البانرات المتحركة</h3>
        <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>📐 حجم البانر المثالي: <strong>1200×450 بكسل</strong></p>
        <div style={S.grid2}>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="عروض الصيف" /></div>
          <div><label style={S.label}>نص فرعي</label><input style={S.input} value={form.subtitle} onChange={e=>setForm(f=>({...f,subtitle:e.target.value}))} /></div>
          <div><label style={S.label}>صورة (1200×450)</label><input style={S.input} type="file" accept="image/*" onChange={handleImg} /></div>
          {form.image&&<div><img src={form.image} style={{width:'100%',height:60,objectFit:'cover',borderRadius:10}}/></div>}
        </div>
        <button style={{...S.btn,marginTop:14}} onClick={addBanner} disabled={saving}>{saving?'⏳...':'➕ إضافة بانر'}</button>
      </div>
      {banners.length>0&&(
        <div style={S.card}>
          <h3 style={{fontWeight:800,marginBottom:14}}>البانرات ({banners.length})</h3>
          {banners.map((b,i)=>(
            <div key={b.id} style={{display:'flex',gap:12,alignItems:'center',background:'#f8fafc',borderRadius:12,padding:12,marginBottom:8}}>
              <span style={{fontWeight:700,color:'#94a3b8'}}>#{i+1}</span>
              {b.image&&<img src={b.image} style={{width:80,height:45,objectFit:'cover',borderRadius:8,flexShrink:0}}/>}
              <div style={{flex:1}}><div style={{fontWeight:700}}>{b.title||'(بدون عنوان)'}</div>{b.subtitle&&<div style={{fontSize:12,color:'#64748b'}}>{b.subtitle}</div>}</div>
              <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>delBanner(b.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   💾 نسخ احتياطي
══════════════════════════════════════════ */
function DataBackup({ showToast }) {
  const [loading,setLoading]=useState(false)
  const tables=['products','orders','customers','suppliers','brands','categories','purchases','coupons','expenses','notifications','settings']

  const backup=async()=>{
    setLoading(true)
    const backup={}
    for(const table of tables){
      const {data}=await supabase.from(table).select('*')
      backup[table]=data||[]
    }
    backup._date=new Date().toISOString()
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download=`naqaa_backup_${new Date().toISOString().split('T')[0]}.json`; a.click()
    URL.revokeObjectURL(url)
    showToast('✅ تم تحميل النسخة الاحتياطية')
    setLoading(false)
  }

  const restore=e=>{
    const file=e.target.files[0]; if(!file) return
    if(!confirm('هذا سيستبدل البيانات الحالية. هل أنت متأكد؟')) return
    const reader=new FileReader()
    reader.onload=async ev=>{
      try{
        const data=JSON.parse(ev.target.result)
        let restored=0
        for(const table of tables){
          if(data[table]&&Array.isArray(data[table])&&data[table].length>0){
            await supabase.from(table).upsert(data[table])
            restored+=data[table].length
          }
        }
        showToast(`✅ تم استعادة ${restored} سجل`)
      }catch(err){ showToast('خطأ في ملف النسخة الاحتياطية','error') }
    }
    reader.readAsText(file)
    e.target.value=''
  }

  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>💾 النسخ الاحتياطي</h1>
      <div style={S.card}>
        <p style={{color:'#64748b',fontSize:14,marginBottom:20}}>
          احفظ نسخة من جميع بيانات متجرك (منتجات، طلبيات، عملاء، إعدادات...) في ملف JSON.
          <br/>يمكنك استعادتها في أي وقت.
        </p>
        <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
          <button style={{...S.btn,padding:'14px 28px',fontSize:15}} onClick={backup} disabled={loading}>
            {loading?'⏳ جاري التحميل...':'📥 تحميل نسخة احتياطية'}
          </button>
          <label style={{...S.btnGray,padding:'14px 28px',fontSize:15,cursor:'pointer',borderRadius:30,fontWeight:700}}>
            📤 استعادة من ملف
            <input type="file" accept=".json" style={{display:'none'}} onChange={restore}/>
          </label>
        </div>
        <div style={{marginTop:20,background:'#fef9c3',borderRadius:12,padding:14,fontSize:13,color:'#92400e'}}>
          ⚠️ <strong>تنبيه:</strong> استعادة النسخة الاحتياطية ستضيف البيانات للموجودة ولن تحذف شيئاً.
          يُنصح بعمل نسخة احتياطية أسبوعية.
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏢 من نحن
══════════════════════════════════════════ */
function AboutUs({ showToast }) {
  const [content,setContent]=useState(''); const [saving,setSaving]=useState(false)
  useEffect(()=>{ supabase.from('settings').select('value').eq('key','about_us').maybeSingle().then(({data})=>setContent(data?.value||'نقاء — متجر إلكتروني جزائري متخصص في توزيع المواد الغذائية ومنتجات العناية الشخصية.\n\nتأسس المتجر بهدف تقديم أفضل المنتجات بأسعار تنافسية مع ضمان الجودة والخدمة الممتازة.')) },[])
  const save=async()=>{ setSaving(true); await supabase.from('settings').upsert({key:'about_us',value:content}); showToast('✅ تم الحفظ'); setSaving(false) }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🏢 من نحن</h1>
      <div style={S.card}>
        <label style={S.label}>محتوى الصفحة</label>
        <textarea style={{...S.input,minHeight:200,resize:'vertical',marginBottom:14}} value={content} onChange={e=>setContent(e.target.value)} />
        <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
      </div>
      {content&&<div style={S.card}><h3 style={{fontWeight:800,marginBottom:10}}>معاينة</h3><div style={{whiteSpace:'pre-wrap',lineHeight:1.8,color:'#475569',fontSize:14}}>{content}</div></div>}
    </div>
  )
}

/* ══════════════════════════════════════════
   📞 اتصل بنا
══════════════════════════════════════════ */
function ContactUs({ showToast }) {
  const [form,setForm]=useState({
    contact_phone:'0696668065', contact_whatsapp:WA_DEFAULT,
    contact_email:'', contact_address:'', contact_facebook:'', contact_instagram:'', contact_hours:'السبت–الخميس: 8ص–6م'
  })
  const [saving,setSaving]=useState(false)
  useEffect(()=>{
    supabase.from('settings').select('*').then(({data})=>{
      if(data){const map={};data.forEach(r=>(map[r.key]=r.value));setForm(f=>({...f,...map}))}
    })
  },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    setSaving(true)
    await Promise.all(Object.entries(form).map(([key,value])=>supabase.from('settings').upsert({key,value:String(value)})))
    showToast('✅ تم الحفظ');setSaving(false)
  }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📞 اتصل بنا</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>📱 الهاتف</label><input style={S.input} value={form.contact_phone} onChange={F('contact_phone')} /></div>
          <div><label style={S.label}>💬 واتساب</label><input style={S.input} value={form.contact_whatsapp} onChange={F('contact_whatsapp')} /></div>
          <div><label style={S.label}>📧 البريد</label><input style={S.input} value={form.contact_email} onChange={F('contact_email')} /></div>
          <div><label style={S.label}>📍 العنوان</label><input style={S.input} value={form.contact_address} onChange={F('contact_address')} /></div>
          <div><label style={S.label}>📘 فيسبوك</label><input style={S.input} value={form.contact_facebook} onChange={F('contact_facebook')} /></div>
          <div><label style={S.label}>📸 إنستغرام</label><input style={S.input} value={form.contact_instagram} onChange={F('contact_instagram')} /></div>
          <div style={{gridColumn:'span 2'}}><label style={S.label}>🕒 ساعات العمل</label><input style={S.input} value={form.contact_hours} onChange={F('contact_hours')} /></div>
        </div>
        <button style={{...S.btn,marginTop:18}} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🔄 سياسة الاسترجاع
══════════════════════════════════════════ */
function ReturnPolicy({ showToast }) {
  const [content,setContent]=useState(''); const [saving,setSaving]=useState(false)
  useEffect(()=>{ supabase.from('settings').select('value').eq('key','return_policy').maybeSingle().then(({data})=>setContent(data?.value||'يمكن للعميل استرجاع المنتج خلال 14 يوم من الاستلام بشرط أن يكون بحالته الأصلية.\n\nشروط الاسترجاع:\n• المنتج بدون استخدام\n• مع الفاتورة الأصلية\n• خلال 14 يوم')) },[])
  const save=async()=>{ setSaving(true); await supabase.from('settings').upsert({key:'return_policy',value:content}); showToast('✅ تم الحفظ'); setSaving(false) }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🔄 سياسة الاسترجاع</h1>
      <div style={S.card}>
        <label style={S.label}>محتوى السياسة</label>
        <textarea style={{...S.input,minHeight:220,resize:'vertical',marginBottom:14}} value={content} onChange={e=>setContent(e.target.value)} />
        <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏠 المكوّن الرئيسي
══════════════════════════════════════════ */
export default function Admin() {
  const [user,    setUser]    = useState(null)
  const [section, setSection] = useState('dashboard')
  const [showToast, ToastUI]  = useToast()

  useEffect(() => {
    const saved = sessionStorage.getItem('nq_admin')
    if (saved) try { setUser(JSON.parse(saved)) } catch {}
  }, [])

  const handleLogin  = u => { setUser(u); sessionStorage.setItem('nq_admin', JSON.stringify(u)) }
  const handleLogout = () => { setUser(null); sessionStorage.removeItem('nq_admin') }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  const sections = [
    { id:'dashboard',        icon:'📊', label:'لوحة القيادة' },
    { id:'products',         icon:'📦', label:'المنتجات' },
    { id:'categories',       icon:'📂', label:'الفئات' },
    { id:'brands',           icon:'🏷️', label:'العلامات التجارية' },
    { id:'suppliers',        icon:'🏭', label:'الموردون' },
    { id:'customers',        icon:'👥', label:'العملاء (M1/M2/M3)' },
    { id:'employees',        icon:'👔', label:'الموظفون' },
    { id:'coupons',          icon:'🎟️', label:'الكوبونات' },
    { id:'purchases',        icon:'🛒', label:'المشتريات' },
    { id:'inventory',        icon:'📦', label:'المخزون + Excel' },
    { id:'orders',           icon:'📋', label:'الطلبيات' },
    { id:'promotions',       icon:'🎯', label:'إدارة العروض' },
    { id:'notifications',    icon:'🔔', label:'الإشعارات' },
    { id:'reports',          icon:'📊', label:'التقارير' },
    { id:'expenses',         icon:'💸', label:'المصاريف' },
    { id:'activityLog',      icon:'📋', label:'سجل النشاطات' },
    { id:'storeManager',     icon:'🎨', label:'إدارة واجهة المتجر' },
    { id:'backup',           icon:'💾', label:'نسخ احتياطي' },
    { id:'settings',         icon:'⚙️', label:'الإعدادات' },
    { id:'about',            icon:'🏢', label:'من نحن' },
    { id:'contact',          icon:'📞', label:'اتصل بنا' },
    { id:'returnPolicy',     icon:'🔄', label:'سياسة الاسترجاع' },
  ]

  const renderSection = () => {
    switch(section) {
      case 'dashboard':     return <Dashboard />
      case 'products':      return <Products />
      case 'categories':    return <Categories />
      case 'brands':        return <Brands />
      case 'suppliers':     return <Suppliers />
      case 'customers':     return <Customers />
      case 'employees':     return <Employees />
      case 'coupons':       return <Coupons />
      case 'purchases':     return <Purchases />
      case 'inventory':     return <Inventory />
      case 'orders':        return <Orders />
      case 'promotions':    return <PromotionsManager />
      case 'notifications': return <Notifications />
      case 'reports':       return <Reports />
      case 'expenses':      return <Expenses />
      case 'activityLog':   return <ActivityLog />
      case 'storeManager':  return <StoreManager showToast={showToast} />
      case 'backup':        return <DataBackup showToast={showToast} />
      case 'settings':      return <Settings showToast={showToast} />
      case 'about':         return <AboutUs showToast={showToast} />
      case 'contact':       return <ContactUs showToast={showToast} />
      case 'returnPolicy':  return <ReturnPolicy showToast={showToast} />
      default:              return <Dashboard />
    }
  }

  return (
    <div dir="rtl" style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      {ToastUI}
      <style>{`
        .sitem { display:flex; align-items:center; gap:10px; padding:10px 14px;
          color:#475569; cursor:pointer; border-radius:12px; margin:2px 8px;
          transition:.15s; font-size:13px; font-weight:600; }
        .sitem:hover { background:rgba(220,38,38,.08); color:#dc2626; }
        .sitem.on    { background:rgba(220,38,38,.12); color:#dc2626; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 1; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width:252, background:'white', borderLeft:'1px solid #e2e8f0',
        position:'sticky', top:0, height:'100vh', overflowY:'auto', flexShrink:0 }}>
        <div style={{ padding:'16px 14px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:42, height:42, borderRadius:12,
              background:'linear-gradient(135deg,#dc2626,#7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛍️</div>
            <div>
              <div style={{ fontWeight:900, fontSize:16 }}>نقاء</div>
              <div style={{ fontSize:11, color:'#64748b' }}>لوحة الإدارة</div>
            </div>
          </div>
          <div style={{ marginTop:10, padding:'7px 12px', background:'#f8fafc', borderRadius:10, fontSize:13, color:'#475569' }}>
            👤 {user.name}
          </div>
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            <a href="/" target="_blank" style={{ flex:1, textAlign:'center', padding:'6px', borderRadius:10,
              background:'#f1f5f9', color:'#475569', fontSize:12, textDecoration:'none', fontWeight:700 }}>
              🛍️ المتجر
            </a>
            <button onClick={handleLogout} style={{ flex:1, padding:'6px', borderRadius:10,
              background:'#fee2e2', color:'#dc2626', border:'none', cursor:'pointer', fontSize:12, fontWeight:700 }}>
              🚪 خروج
            </button>
          </div>
        </div>
        <nav style={{ padding:'6px 0' }}>
          {sections.map(s=>(
            <div key={s.id} className={`sitem${section===s.id?' on':''}`} onClick={()=>setSection(s.id)}>
              <span style={{ fontSize:14 }}>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, padding:24, overflowY:'auto' }}>
        {renderSection()}
      </div>
    </div>
  )
}
