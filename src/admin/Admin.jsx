/**
 * Admin.jsx — لوحة إدارة نقاء (نسخة احترافية)
 * ✅ تسجيل دخول محمي
 * ✅ كل قسم يجلب بياناته مباشرة من Supabase
 * ✅ طباعة حرارية + A4
 * ✅ بحث متقدم في الطلبيات
 * ✅ تجميع الطلبيات بالعنوان
 */
import { useState, useEffect, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

/* ─── ثوابت ─── */
const ADMIN_EMAIL     = 'meghamel2012@gmail.com'
const ADMIN_PASS_HASH = CryptoJS.SHA256('afbilalaf06').toString()
const CUR = 'دج'

const hashPwd = p => CryptoJS.SHA256(p).toString()

/* ─── Toast ─── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [])
  const bg = { success:'#10b981', error:'#ef4444', info:'#3b82f6' }[type] || '#10b981'
  return (
    <div style={{ position:'fixed', bottom:24, left:24, background:bg, color:'white',
      padding:'12px 24px', borderRadius:30, zIndex:9999, fontWeight:700,
      boxShadow:'0 8px 24px rgba(0,0,0,.25)', fontSize:14, direction:'rtl' }}>
      {msg}
    </div>
  )
}
function useToast() {
  const [t, setT] = useState(null)
  const show = (msg, type='success') => setT({ msg, type })
  const UI = t ? <Toast msg={t.msg} type={t.type} onDone={()=>setT(null)} /> : null
  return [show, UI]
}

/* ─── Confirm ─── */
function useConfirm() {
  const [c, setC] = useState(null)
  const ask = msg => new Promise(r => setC({ msg, r }))
  const UI = c ? (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:8000,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:20, padding:28, maxWidth:360,
        textAlign:'center', direction:'rtl' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
        <p style={{ fontSize:16, fontWeight:600, marginBottom:20 }}>{c.msg}</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button onClick={()=>{ c.r(true); setC(null) }}
            style={{ background:'#ef4444', color:'white', border:'none', borderRadius:30,
              padding:'10px 24px', cursor:'pointer', fontWeight:700 }}>نعم</button>
          <button onClick={()=>{ c.r(false); setC(null) }}
            style={{ background:'#e2e8f0', border:'none', borderRadius:30,
              padding:'10px 24px', cursor:'pointer', fontWeight:700 }}>إلغاء</button>
        </div>
      </div>
    </div>
  ) : null
  return [ask, UI]
}

/* ─── CSS مشترك ─── */
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
  td:      { padding:'11px 12px', textAlign:'right', borderBottom:'1px solid #f8fafc',
             fontSize:14 },
  grid2:   { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 },
}

/* ══════════ 🖨️ دوال الطباعة ══════════ */
function printThermal(content) {
  const w = window.open('', '_blank', 'width=350,height=600')
  w.document.write(`
    <html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Courier New', monospace; font-size:12px; direction:rtl;
             width:80mm; padding:4mm; }
      .center { text-align:center; }
      .bold   { font-weight:bold; }
      .big    { font-size:16px; }
      .line   { border-top:1px dashed #000; margin:6px 0; }
      .row    { display:flex; justify-content:space-between; margin:3px 0; }
      .total  { font-size:14px; font-weight:bold; }
    </style></head>
    <body onload="window.print(); window.close();">
    ${content}
    </body></html>
  `)
  w.document.close()
}

function printA4(content) {
  const w = window.open('', '_blank')
  w.document.write(`
    <html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Tajawal','Segoe UI',sans-serif; direction:rtl;
             padding:20mm; color:#1e293b; }
      h1  { font-size:24px; color:#dc2626; margin-bottom:8px; }
      .header { display:flex; justify-content:space-between; margin-bottom:20px;
                padding-bottom:16px; border-bottom:2px solid #dc2626; }
      table  { width:100%; border-collapse:collapse; margin:16px 0; }
      th     { background:#f8fafc; padding:10px 12px; text-align:right;
               font-weight:700; border:1px solid #e2e8f0; }
      td     { padding:10px 12px; border:1px solid #e2e8f0; }
      .total-row { background:#fef2f2; font-weight:700; font-size:16px; }
      .footer { margin-top:30px; text-align:center; color:#64748b; font-size:12px; }
    </style></head>
    <body onload="window.print(); window.close();">
    ${content}
    </body></html>
  `)
  w.document.close()
}

/* ══════════ 🔐 تسجيل الدخول ══════════ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setErr(''); setLoading(true)
    if (email.trim()===ADMIN_EMAIL && hashPwd(pass)===ADMIN_PASS_HASH) {
      onLogin({ name:'المدير', email:ADMIN_EMAIL, role:'admin' }); return
    }
    const { data } = await supabase.from('employees').select('*')
      .eq('username', email.trim()).maybeSingle()
    if (data && data.password===hashPwd(pass)) {
      onLogin({ name:data.name, email:data.email, role:data.role })
    } else { setErr('البريد أو كلمة المرور غير صحيحة') }
    setLoading(false)
  }

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
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>كلمة المرور</label>
          <input style={S.input} type="password" value={pass}
            onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()} />
        </div>
        {err && <div style={{ color:'#ef4444', fontSize:13, marginBottom:14,
          background:'#fef2f2', padding:'10px 14px', borderRadius:10 }}>{err}</div>}
        <button style={{ ...S.btn, width:'100%', padding:'14px', fontSize:16 }}
          onClick={submit} disabled={loading}>
          {loading ? '⏳ جاري الدخول...' : '🔐 دخول'}
        </button>
      </div>
    </div>
  )
}

/* ══════════ 📊 لوحة القيادة ══════════ */
function Dashboard() {
  const [stats,  setStats]  = useState({ products:0, orders:0, sales:0, profit:0 })
  const [recent, setRecent] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [todaySales, setTodaySales] = useState(0)

  useEffect(() => {
    const load = async () => {
      const [{ data:prods },{ data:ords },{ data:purcs },{ data:exps }] = await Promise.all([
        supabase.from('products').select('id,name,stock'),
        supabase.from('orders').select('*').order('id',{ascending:false}),
        supabase.from('purchases').select('total'),
        supabase.from('expenses').select('amount'),
      ])
      const today = new Date().toLocaleDateString('ar-DZ')
      const todayOrds = (ords||[]).filter(o => o.date?.includes(new Date().toLocaleDateString()))
      const sales  = (ords||[]).reduce((s,o)=>s+Number(o.total),0)
      const purTotal=(purcs||[]).reduce((s,p)=>s+Number(p.total),0)
      const expTotal=(exps||[]).reduce((s,e)=>s+Number(e.amount),0)
      setStats({ products:(prods||[]).length, orders:(ords||[]).length,
        sales, profit:sales-purTotal-expTotal })
      setRecent((ords||[]).slice(0,5))
      setLowStock((prods||[]).filter(p=>(p.stock||0)<5))
      setTodaySales(todayOrds.reduce((s,o)=>s+Number(o.total),0))
    }
    load()
  }, [])

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📊 لوحة القيادة</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { l:'المنتجات',       v:stats.products,            c:'#3b82f6', i:'📦' },
          { l:'الطلبيات',       v:stats.orders,              c:'#10b981', i:'📋' },
          { l:'مبيعات اليوم',   v:todaySales.toFixed(0)+' '+CUR, c:'#f59e0b', i:'⚡' },
          { l:'إجمالي المبيعات',v:stats.sales.toFixed(0)+' '+CUR,c:'#dc2626', i:'💰' },
          { l:'صافي الربح',     v:stats.profit.toFixed(0)+' '+CUR,c:stats.profit>=0?'#10b981':'#ef4444',i:'📈' },
        ].map((s,i)=>(
          <div key={i} style={{ ...S.card, textAlign:'center', borderTop:`3px solid ${s.c}`, marginBottom:0 }}>
            <div style={{ fontSize:28 }}>{s.i}</div>
            <div style={{ fontSize:19, fontWeight:900, color:s.c, margin:'6px 0' }}>{s.v}</div>
            <div style={{ fontSize:12, color:'#64748b' }}>{s.l}</div>
          </div>
        ))}
      </div>
      {lowStock.length>0 && (
        <div style={{ ...S.card, background:'#fef2f2', borderRight:'4px solid #dc2626', marginBottom:16 }}>
          <strong style={{ color:'#dc2626' }}>⚠️ مخزون منخفض ({lowStock.length}):</strong>{' '}
          <span style={{ fontSize:13 }}>{lowStock.map(p=>p.name).join(' — ')}</span>
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>📋 آخر الطلبيات</h3>
        {recent.length===0 ? <p style={{ textAlign:'center', color:'#94a3b8', padding:20 }}>لا توجد طلبيات</p> :
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={S.th}>#</th><th style={S.th}>العميل</th>
              <th style={S.th}>المنطقة</th><th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th>
            </tr></thead>
            <tbody>{recent.map(o=>(
              <tr key={o.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                <td style={{ ...S.td, fontSize:11, color:'#94a3b8' }}>{o.id}</td>
                <td style={{ ...S.td, fontWeight:700 }}>{o.customer_name}</td>
                <td style={S.td}>{o.customer_address?.split(',')[0]||'—'}</td>
                <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{Number(o.total).toFixed(0)} {CUR}</td>
                <td style={S.td}>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                    background:{ pending:'#fef9c3', processing:'#dbeafe', shipped:'#e0e7ff', delivered:'#d1fae5' }[o.status]||'#f1f5f9' }}>
                    {{ pending:'انتظار', processing:'تجهيز', shipped:'شُحن', delivered:'تسليم' }[o.status]||o.status}
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
    </div>
  )
}

/* ══════════ 📦 المنتجات ══════════ */
function Products() {
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [products,   setProducts]   = useState([])
  const [brands,     setBrands]     = useState([])
  const [categories, setCategories] = useState([])
  const [search,  setSearch]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    id:'', name:'', price:'', costPrice:'', cartonPrice:'',
    units:12, stock:0, sku:'', brandId:'', categoryId:'', image:''
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data:p },{ data:b },{ data:c }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(p||[]); setBrands(b||[]); setCategories(c||[]); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const handleImg = e => {
    const r = new FileReader(); r.onload = ev => setForm(f=>({...f,image:ev.target.result}))
    r.readAsDataURL(e.target.files[0])
  }

  const save = async () => {
    if (!form.name.trim()||!form.price) { showToast('الاسم والسعر مطلوبان','error'); return }
    setSaving(true)
    const row = {
      id: form.id||Date.now(), name:form.name.trim(),
      price:parseFloat(form.price)||0, cost_price:parseFloat(form.costPrice)||0,
      carton_price:form.cartonPrice?parseFloat(form.cartonPrice):null,
      units:parseInt(form.units)||12, stock:parseInt(form.stock)||0,
      sku:form.sku||'', brand_id:form.brandId?parseInt(form.brandId):null,
      category_id:form.categoryId?parseInt(form.categoryId):null,
      image:form.image||null, is_promo:false, disabled:false,
      created_at:new Date().toISOString()
    }
    const { error } = await supabase.from('products').upsert(row)
    if (error) { showToast('خطأ: '+error.message,'error'); setSaving(false); return }
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({ id:'', name:'', price:'', costPrice:'', cartonPrice:'', units:12, stock:0, sku:'', brandId:'', categoryId:'', image:'' })
    await load(); setSaving(false)
  }

  const edit = p => setForm({ id:p.id, name:p.name, price:p.price||'', costPrice:p.cost_price||'',
    cartonPrice:p.carton_price||'', units:p.units||12, stock:p.stock||0,
    sku:p.sku||'', brandId:p.brand_id||'', categoryId:p.category_id||'', image:p.image||'' })

  const del = async id => {
    if (!await askConfirm('حذف هذا المنتج؟')) return
    await supabase.from('products').delete().eq('id',id)
    showToast('تم الحذف'); await load()
  }

  const printLabel = p => {
    printThermal(`
      <div class="center bold big">${p.name}</div>
      <div class="line"></div>
      <div class="row"><span>السعر:</span><span class="bold">${p.price} ${CUR}</span></div>
      ${p.carton_price?`<div class="row"><span>الكرتون:</span><span>${p.carton_price} ${CUR}</span></div>`:''}
      <div class="row"><span>المخزون:</span><span>${p.stock||0}</span></div>
      ${p.sku?`<div class="center" style="margin-top:6px;font-size:10px">${p.sku}</div>`:''}
      <div class="line"></div>
      <div class="center" style="font-size:10px">نقاء</div>
    `)
  }

  const filtered = products.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📦 المنتجات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>
          {form.id?'✏️ تعديل':'➕ إضافة'} منتج
        </h3>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المنتج *</label>
            <input style={S.input} value={form.name} onChange={F('name')} placeholder="اسم المنتج" /></div>
          <div><label style={S.label}>سعر البيع *</label>
            <input style={S.input} type="number" value={form.price} onChange={F('price')} /></div>
          <div><label style={S.label}>سعر الشراء</label>
            <input style={S.input} type="number" value={form.costPrice} onChange={F('costPrice')} /></div>
          <div><label style={S.label}>سعر الكرتون</label>
            <input style={S.input} type="number" value={form.cartonPrice} onChange={F('cartonPrice')} /></div>
          <div><label style={S.label}>حبات/كرتون</label>
            <input style={S.input} type="number" value={form.units} onChange={F('units')} /></div>
          <div><label style={S.label}>المخزون</label>
            <input style={S.input} type="number" value={form.stock} onChange={F('stock')} /></div>
          <div><label style={S.label}>الباركود</label>
            <input style={S.input} value={form.sku} onChange={F('sku')} placeholder="اختياري" /></div>
          <div><label style={S.label}>العلامة التجارية</label>
            <select style={S.input} value={form.brandId} onChange={F('brandId')}>
              <option value="">-- بدون --</option>
              {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select></div>
          <div><label style={S.label}>الفئة</label>
            <select style={S.input} value={form.categoryId} onChange={F('categoryId')}>
              <option value="">-- بدون --</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label style={S.label}>صورة المنتج</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleImg} /></div>
          {form.image && <div style={{ display:'flex', alignItems:'center' }}>
            <img src={form.image} style={{ width:80,height:80,objectFit:'cover',borderRadius:12 }} /></div>}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
          <button style={S.btn} onClick={save} disabled={saving}>
            {saving?'⏳ حفظ...':'💾 حفظ المنتج'}</button>
          <button style={S.btnGray} onClick={()=>setForm({id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',categoryId:'',image:''})}>
            ✖ إلغاء</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontWeight:800 }}>قائمة المنتجات ({filtered.length})</h3>
          <input style={{ ...S.input, width:220 }} placeholder="🔍 بحث..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {loading ? <p style={{ textAlign:'center', color:'#94a3b8', padding:30 }}>⏳ جاري التحميل...</p> :
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={S.th}>الصورة</th><th style={S.th}>الاسم</th>
                <th style={S.th}>السعر</th><th style={S.th}>المخزون</th>
                <th style={S.th}>الإجراءات</th>
              </tr></thead>
              <tbody>{filtered.map(p=>(
                <tr key={p.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                  <td style={S.td}>{p.image?<img src={p.image} style={{width:42,height:42,objectFit:'cover',borderRadius:10}}/>:'📷'}</td>
                  <td style={{ ...S.td, fontWeight:700 }}>{p.name}</td>
                  <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{p.price} {CUR}</td>
                  <td style={S.td}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                      background:(p.stock||0)<5?'#fee2e2':'#d1fae5',
                      color:(p.stock||0)<5?'#dc2626':'#059669' }}>{p.stock||0}</span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      <button style={{ ...S.btnSm, background:'#dbeafe', color:'#1d4ed8' }} onClick={()=>edit(p)}>✏️</button>
                      <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(p.id)}>🗑️</button>
                      <button style={{ ...S.btnSm, background:'#f0fdf4', color:'#059669' }} onClick={()=>printLabel(p)}>🖨️</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>}
      </div>
    </div>
  )
}

/* ══════════ 📂 الفئات ══════════ */
function Categories() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [name,setName]=useState('')
  const [image,setImage]=useState(''); const [saving,setSaving]=useState(false)
  const load=async()=>{ const {data}=await supabase.from('categories').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const add=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return} setSaving(true)
    const {error}=await supabase.from('categories').insert({id:Date.now(),name:name.trim(),image:image||null})
    if(error){showToast('خطأ: '+error.message,'error');setSaving(false);return}
    showToast('✅ تمت الإضافة');setName('');setImage('');await load();setSaving(false)
  }
  const del=async id=>{
    if(!await askConfirm('حذف هذه الفئة؟'))return
    await supabase.from('categories').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📂 الفئات</h1>
      <div style={S.card}>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>اسم الفئة *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} /></div>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>صورة</label>
            <input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/></div>
          <button style={S.btn} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة'}</button>
        </div>
      </div>
      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الصورة</th><th style={S.th}>الاسم</th><th style={S.th}>حذف</th></tr></thead>
          <tbody>{items.map(c=>(
            <tr key={c.id} style={{borderBottom:'1px solid #f8fafc'}}>
              <td style={S.td}>{c.image?<img src={c.image} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}}/>:'📁'}</td>
              <td style={{...S.td,fontWeight:700}}>{c.name}</td>
              <td style={S.td}><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(c.id)}>🗑️</button></td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={3} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد فئات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════ 🏷️ العلامات ══════════ */
function Brands() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [name,setName]=useState('')
  const [image,setImage]=useState(''); const [saving,setSaving]=useState(false)
  const load=async()=>{ const {data}=await supabase.from('brands').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const add=async()=>{
    if(!name.trim()){showToast('الاسم مطلوب','error');return} setSaving(true)
    await supabase.from('brands').insert({id:Date.now(),name:name.trim(),image:image||null})
    showToast('✅ تمت الإضافة');setName('');setImage('');await load();setSaving(false)
  }
  const del=async id=>{
    if(!await askConfirm('حذف هذه العلامة؟'))return
    await supabase.from('brands').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🏷️ العلامات التجارية</h1>
      <div style={S.card}>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>اسم العلامة *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: Yema" /></div>
          <div style={{flex:1,minWidth:160}}><label style={S.label}>شعار</label>
            <input style={S.input} type="file" accept="image/*" onChange={e=>{const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(e.target.files[0])}}/></div>
          <button style={S.btn} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة'}</button>
        </div>
      </div>
      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الشعار</th><th style={S.th}>الاسم</th><th style={S.th}>حذف</th></tr></thead>
          <tbody>{items.map(b=>(
            <tr key={b.id} style={{borderBottom:'1px solid #f8fafc'}}>
              <td style={S.td}>{b.image?<img src={b.image} style={{width:44,height:44,borderRadius:'50%',objectFit:'cover'}}/>:'🏷️'}</td>
              <td style={{...S.td,fontWeight:700}}>{b.name}</td>
              <td style={S.td}><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(b.id)}>🗑️</button></td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={3} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد علامات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════ 🏭 الموردون ══════════ */
function Suppliers() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState('')
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})
  const load=async()=>{ const {data}=await supabase.from('suppliers').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    if(!form.name.trim()){showToast('الاسم مطلوب','error');return} setSaving(true)
    const {error}=await supabase.from('suppliers').upsert({id:form.id||Date.now(),name:form.name.trim(),phone:form.phone,whatsapp:form.whatsapp,email:form.email,address:form.address})
    if(error){showToast('خطأ: '+error.message,'error');setSaving(false);return}
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''});await load();setSaving(false)
  }
  const edit=s=>setForm({id:s.id,name:s.name,phone:s.phone||'',whatsapp:s.whatsapp||'',email:s.email||'',address:s.address||''})
  const del=async id=>{
    if(!await askConfirm('حذف هذا المورد؟'))return
    await supabase.from('suppliers').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  const filtered=items.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🏭 الموردون</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>{form.id?'✏️ تعديل':'➕ إضافة'} مورد</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} /></div>
          <div><label style={S.label}>واتساب</label><input style={S.input} value={form.whatsapp} onChange={F('whatsapp')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
          <button style={S.btnGray} onClick={()=>setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})}>✖ إلغاء</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <h3 style={{fontWeight:800}}>الموردون ({filtered.length})</h3>
          <input style={{...S.input,width:200}} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={S.th}>الاسم</th><th style={S.th}>الهاتف</th><th style={S.th}>واتساب</th><th style={S.th}>الإجراءات</th></tr></thead>
            <tbody>{filtered.map(s=>(
              <tr key={s.id} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{...S.td,fontWeight:700}}>{s.name}</td>
                <td style={S.td}>{s.phone||'—'}</td>
                <td style={S.td}>{s.whatsapp&&<a href={`https://wa.me/${s.whatsapp}`} target="_blank" style={{color:'#25D366',fontWeight:700}}>💬 {s.whatsapp}</a>}</td>
                <td style={S.td}>
                  <div style={{display:'flex',gap:5}}>
                    <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>edit(s)}>✏️</button>
                    <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(s.id)}>🗑️</button>
                  </div>
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

/* ══════════ 👥 العملاء ══════════ */
function Customers() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState('')
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({id:'',name:'',email:'',phone:'',address:'',password:''})
  const load=async()=>{ const {data}=await supabase.from('customers').select('*').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    if(!form.name.trim()){showToast('الاسم مطلوب','error');return} setSaving(true)
    const ex=items.find(c=>c.id==form.id)
    const {error}=await supabase.from('customers').upsert({
      id:form.id||Date.now(),name:form.name.trim(),email:form.email,phone:form.phone,address:form.address,
      password:form.password?hashPwd(form.password):(ex?.password||hashPwd('123456')),
      points:ex?.points||0,created_at:ex?.created_at||new Date().toISOString()
    })
    if(error){showToast('خطأ: '+error.message,'error');setSaving(false);return}
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة')
    setForm({id:'',name:'',email:'',phone:'',address:'',password:''});await load();setSaving(false)
  }
  const edit=c=>setForm({id:c.id,name:c.name,email:c.email||'',phone:c.phone||'',address:c.address||'',password:''})
  const del=async id=>{
    if(!await askConfirm('حذف هذا العميل؟'))return
    await supabase.from('customers').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  const filtered=items.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search)||c.email?.includes(search))
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>👥 العملاء</h1>
      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>{form.id?'✏️ تعديل':'➕ إضافة'} عميل</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} /></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
          <div><label style={S.label}>كلمة المرور</label><input style={S.input} type="password" value={form.password} onChange={F('password')} /></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
          <button style={S.btnGray} onClick={()=>setForm({id:'',name:'',email:'',phone:'',address:'',password:''})}>✖ إلغاء</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <h3 style={{fontWeight:800}}>العملاء ({filtered.length})</h3>
          <input style={{...S.input,width:220}} placeholder="🔍 اسم / هاتف / بريد..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={S.th}>الاسم</th><th style={S.th}>الهاتف</th><th style={S.th}>العنوان</th><th style={S.th}>النقاط</th><th style={S.th}>الإجراءات</th></tr></thead>
            <tbody>{filtered.map(c=>(
              <tr key={c.id} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{...S.td,fontWeight:700}}>{c.name}</td>
                <td style={S.td}>{c.phone||'—'}</td>
                <td style={S.td}>{c.address||'—'}</td>
                <td style={S.td}>{c.points||0}</td>
                <td style={S.td}>
                  <div style={{display:'flex',gap:5}}>
                    <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>edit(c)}>✏️</button>
                    <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>del(c.id)}>🗑️</button>
                  </div>
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

/* ══════════ 👔 الموظفون ══════════ */
function Employees() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({name:'',username:'',password:'',email:''})
  const load=async()=>{ const {data}=await supabase.from('employees').select('id,name,username,email,role').order('name'); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const add=async()=>{
    if(!form.name||!form.username||!form.password){showToast('الاسم والمستخدم والكلمة مطلوبة','error');return} setSaving(true)
    const {error}=await supabase.from('employees').insert({id:Date.now(),name:form.name,username:form.username,password:hashPwd(form.password),email:form.email,role:'staff'})
    if(error){showToast('خطأ: '+error.message,'error');setSaving(false);return}
    showToast('✅ تم إضافة الموظف');setForm({name:'',username:'',password:'',email:''});await load();setSaving(false)
  }
  const del=async id=>{
    if(!await askConfirm('حذف هذا الموظف؟'))return
    await supabase.from('employees').delete().eq('id',id);showToast('تم الحذف');await load()
  }
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
        <button style={{...S.btn,marginTop:14}} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة موظف'}</button>
      </div>
      <div style={S.card}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th style={S.th}>الاسم</th><th style={S.th}>المستخدم</th><th style={S.th}>الدور</th><th style={S.th}>حذف</th></tr></thead>
          <tbody>{items.map(e=>(
            <tr key={e.id} style={{borderBottom:'1px solid #f8fafc'}}>
              <td style={{...S.td,fontWeight:700}}>{e.name}</td>
              <td style={S.td}>{e.username}</td>
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

/* ══════════ 🎟️ الكوبونات ══════════ */
function Coupons() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0})
  const load=async()=>{ const {data}=await supabase.from('coupons').select('*').order('id',{ascending:false}); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const add=async()=>{
    if(!form.code||!form.value){showToast('الكود والقيمة مطلوبان','error');return} setSaving(true)
    const {error}=await supabase.from('coupons').insert({id:Date.now(),code:form.code.toUpperCase().trim(),type:form.type,value:parseFloat(form.value),expiry:form.expiry||null,max_uses:parseInt(form.maxUses)||100,min_order:parseFloat(form.minOrder)||0,used:0})
    if(error){showToast('خطأ: '+error.message,'error');setSaving(false);return}
    showToast('✅ تمت الإضافة');setForm({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0});await load();setSaving(false)
  }
  const del=async id=>{
    if(!await askConfirm('حذف هذا الكوبون؟'))return
    await supabase.from('coupons').delete().eq('id',id);showToast('تم الحذف');await load()
  }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🎟️ الكوبونات</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>كود الكوبون *</label><input style={S.input} value={form.code} onChange={F('code')} placeholder="SAVE20" /></div>
          <div><label style={S.label}>النوع</label><select style={S.input} value={form.type} onChange={F('type')}><option value="percent">نسبة %</option><option value="fixed">مبلغ ثابت</option></select></div>
          <div><label style={S.label}>القيمة *</label><input style={S.input} type="number" value={form.value} onChange={F('value')} /></div>
          <div><label style={S.label}>تاريخ الانتهاء</label><input style={S.input} type="date" value={form.expiry} onChange={F('expiry')} /></div>
          <div><label style={S.label}>الحد الأقصى</label><input style={S.input} type="number" value={form.maxUses} onChange={F('maxUses')} /></div>
          <div><label style={S.label}>الحد الأدنى للطلب</label><input style={S.input} type="number" value={form.minOrder} onChange={F('minOrder')} /></div>
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

/* ══════════ 🛒 المشتريات ══════════ */
function Purchases() {
  const [showToast,ToastUI]=useToast()
  const [suppliers,setSuppliers]=useState([]); const [products,setProducts]=useState([])
  const [purchases,setPurchases]=useState([])
  const [items,setItems]=useState([])
  const [suppId,setSuppId]=useState(''); const [date,setDate]=useState(new Date().toISOString().split('T')[0])
  const [showModal,setShowModal]=useState(false)
  const [modal,setModal]=useState({productId:'',cartons:1,unitsPerCarton:12,purchasePrice:0,sellPrice:0})
  const [saving,setSaving]=useState(false)

  useEffect(()=>{
    const load=async()=>{
      const [{data:s},{data:p},{data:pur}]=await Promise.all([
        supabase.from('suppliers').select('id,name').order('name'),
        supabase.from('products').select('id,name,units,cost_price,price').order('name'),
        supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20),
      ])
      setSuppliers(s||[]); setProducts(p||[]); setPurchases(pur||[])
    }
    load()
  },[])

  const total=items.reduce((s,i)=>s+i.totalPurchase,0)

  const addItem=()=>{
    const prod=products.find(p=>p.id==modal.productId)
    if(!prod||!modal.cartons||!modal.purchasePrice){showToast('اختر منتجاً وأدخل البيانات','error');return}
    const totalUnits=modal.cartons*modal.unitsPerCarton
    const totalPurchase=totalUnits*modal.purchasePrice
    setItems(prev=>[...prev,{id:Date.now(),productId:prod.id,productName:prod.name,cartons:modal.cartons,unitsPerCarton:modal.unitsPerCarton,totalUnits,purchasePrice:modal.purchasePrice,sellPrice:modal.sellPrice,totalPurchase}])
    setShowModal(false)
    setModal({productId:'',cartons:1,unitsPerCarton:12,purchasePrice:0,sellPrice:0})
  }

  const save=async()=>{
    if(!suppId){showToast('اختر المورد','error');return}
    if(items.length===0){showToast('أضف منتجاً','error');return}
    setSaving(true)
    const supplier=suppliers.find(s=>s.id==suppId)
    const purchaseId=Date.now()
    const {error}=await supabase.from('purchases').insert({
      id:purchaseId,supplier_id:parseInt(suppId),supplier_name:supplier?.name,
      date,items:JSON.stringify(items),total
    })
    if(error){showToast('خطأ: '+error.message,'error');setSaving(false);return}
    for(const item of items){
      const {data:p}=await supabase.from('products').select('stock').eq('id',item.productId).maybeSingle()
      if(p) await supabase.from('products').update({stock:(p.stock||0)+item.totalUnits}).eq('id',item.productId)
    }
    showToast('✅ تم حفظ الفاتورة')
    setSuppId(''); setItems([])
    const {data:pur}=await supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20)
    setPurchases(pur||[]); setSaving(false)
    // طباعة تلقائية
    printPurchaseInvoice({id:purchaseId,supplierName:supplier?.name,date,items,total})
  }

  const printPurchaseInvoice=(purchase)=>{
    printA4(`
      <div class="header">
        <div><h1>🛍️ نقاء</h1><p>فاتورة شراء</p></div>
        <div style="text-align:left">
          <p><strong>رقم الفاتورة:</strong> ${purchase.id}</p>
          <p><strong>التاريخ:</strong> ${purchase.date}</p>
          <p><strong>المورد:</strong> ${purchase.supplierName||'—'}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>المنتج</th><th>الكرتونات</th><th>الحبات</th><th>سعر الحبة</th><th>الإجمالي</th></tr></thead>
        <tbody>
          ${(typeof purchase.items==='string'?JSON.parse(purchase.items):purchase.items).map(i=>`
            <tr><td>${i.productName}</td><td>${i.cartons}</td><td>${i.totalUnits}</td>
                <td>${i.purchasePrice} ${CUR}</td><td>${i.totalPurchase.toFixed(0)} ${CUR}</td></tr>
          `).join('')}
          <tr class="total-row"><td colspan="4">الإجمالي</td><td>${Number(purchase.total).toFixed(0)} ${CUR}</td></tr>
        </tbody>
      </table>
      <div class="footer">نقاء — ${new Date().toLocaleDateString('ar-DZ')}</div>
    `)
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
        {items.map((item,i)=>(
          <div key={item.id} style={{background:'#f8fafc',borderRadius:12,padding:12,marginBottom:8,borderRight:'3px solid #dc2626',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:14}}><strong>{item.productName}</strong> — {item.cartons} كرتون × {item.unitsPerCarton} = {item.totalUnits} حبة — <span style={{color:'#dc2626',fontWeight:700}}>{item.totalPurchase.toFixed(0)} {CUR}</span></div>
            <button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))}>حذف</button>
          </div>
        ))}
        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={()=>setShowModal(true)} style={{...S.btnGray,background:'#10b981',color:'white'}}>➕ إضافة منتج</button>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ + طباعة'}</button>
          {items.length>0&&<span style={{fontWeight:900,color:'#dc2626',fontSize:18}}>💰 {total.toFixed(0)} {CUR}</span>}
        </div>
      </div>

      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:8000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:20,padding:28,width:480,maxWidth:'95vw',direction:'rtl'}}>
            <h3 style={{fontWeight:800,marginBottom:16}}>➕ إضافة منتج للفاتورة</h3>
            <div style={{display:'grid',gap:12}}>
              <div><label style={S.label}>المنتج</label>
                <select style={S.input} value={modal.productId} onChange={e=>{
                  const p=products.find(x=>x.id==e.target.value)
                  setModal(m=>({...m,productId:e.target.value,unitsPerCarton:p?.units||12,purchasePrice:p?.cost_price||0,sellPrice:p?.price||0}))
                }}>
                  <option value="">-- اختر منتجاً --</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={S.label}>الكرتونات</label><input style={S.input} type="number" value={modal.cartons} onChange={e=>setModal(m=>({...m,cartons:parseInt(e.target.value)||1}))}/></div>
                <div><label style={S.label}>حبات/كرتون</label><input style={S.input} type="number" value={modal.unitsPerCarton} onChange={e=>setModal(m=>({...m,unitsPerCarton:parseInt(e.target.value)||12}))}/></div>
                <div><label style={S.label}>سعر شراء الحبة</label><input style={S.input} type="number" value={modal.purchasePrice} onChange={e=>setModal(m=>({...m,purchasePrice:parseFloat(e.target.value)||0}))}/></div>
                <div><label style={S.label}>سعر بيع الحبة</label><input style={S.input} type="number" value={modal.sellPrice} onChange={e=>setModal(m=>({...m,sellPrice:parseFloat(e.target.value)||0}))}/></div>
              </div>
              <div style={{background:'#f8fafc',borderRadius:10,padding:12,fontSize:14}}>
                📦 <strong>{modal.cartons*modal.unitsPerCarton}</strong> حبة — 💰 <strong>{(modal.cartons*modal.unitsPerCarton*modal.purchasePrice).toFixed(0)} {CUR}</strong>
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={S.btn} onClick={addItem}>إضافة للفاتورة</button>
              <button style={S.btnGray} onClick={()=>setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <h3 style={{fontWeight:800,marginBottom:14}}>سجل الفواتير ({purchases.length})</h3>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={S.th}>#</th><th style={S.th}>المورد</th><th style={S.th}>التاريخ</th><th style={S.th}>الإجمالي</th><th style={S.th}>طباعة</th></tr></thead>
            <tbody>{purchases.map(p=>(
              <tr key={p.id} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{...S.td,fontSize:11,color:'#94a3b8'}}>{p.id}</td>
                <td style={{...S.td,fontWeight:700}}>{p.supplier_name}</td>
                <td style={S.td}>{p.date}</td>
                <td style={{...S.td,color:'#dc2626',fontWeight:700}}>{Number(p.total).toFixed(0)} {CUR}</td>
                <td style={S.td}>
                  <div style={{display:'flex',gap:4}}>
                    <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>printPurchaseInvoice(p)}>A4</button>
                    <button style={{...S.btnSm,background:'#f0fdf4',color:'#059669'}} onClick={()=>{
                      const its=typeof p.items==='string'?JSON.parse(p.items):p.items
                      printThermal(`
                        <div class="center bold big">نقاء</div>
                        <div class="center">فاتورة شراء</div>
                        <div class="line"></div>
                        <div class="row"><span>المورد:</span><span>${p.supplier_name}</span></div>
                        <div class="row"><span>التاريخ:</span><span>${p.date}</span></div>
                        <div class="line"></div>
                        ${its.map(i=>`<div class="row"><span>${i.productName}</span><span>${i.totalPurchase.toFixed(0)}</span></div>`).join('')}
                        <div class="line"></div>
                        <div class="row total"><span>الإجمالي:</span><span>${Number(p.total).toFixed(0)} ${CUR}</span></div>
                      `)
                    }}>🖨️</button>
                  </div>
                </td>
              </tr>
            ))}
            {purchases.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد فواتير</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════ 📦 المخزون ══════════ */
function Inventory() {
  const [items,setItems]=useState([]); const [search,setSearch]=useState('')
  useEffect(()=>{ supabase.from('products').select('id,name,stock,price').order('name').then(({data})=>setItems(data||[])) },[])
  const filtered=items.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()))
  const printInventory=()=>{
    printA4(`
      <div class="header"><div><h1>🛍️ نقاء</h1></div><div><p>تقرير المخزون — ${new Date().toLocaleDateString('ar-DZ')}</p></div></div>
      <table><thead><tr><th>المنتج</th><th>المخزون</th><th>الحالة</th><th>القيمة التقديرية</th></tr></thead>
      <tbody>${filtered.map(p=>`<tr><td>${p.name}</td><td>${p.stock||0}</td><td>${(p.stock||0)<5?'⚠️ منخفض':(p.stock||0)<20?'متوسط':'جيد'}</td><td>${((p.stock||0)*Number(p.price)).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody>
      </table>
      <div class="footer">إجمالي قيمة المخزون: ${filtered.reduce((s,p)=>s+(p.stock||0)*Number(p.price),0).toFixed(0)} ${CUR}</div>
    `)
  }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📦 المخزون</h1>
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <h3 style={{fontWeight:800}}>حالة المخزون</h3>
          <div style={{display:'flex',gap:10}}>
            <input style={{...S.input,width:180}} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
            <button style={{...S.btnGray,background:'#3b82f6',color:'white'}} onClick={printInventory}>🖨️ طباعة</button>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={S.th}>المنتج</th><th style={S.th}>الكمية</th><th style={S.th}>الحالة</th><th style={S.th}>القيمة</th></tr></thead>
            <tbody>{filtered.map(p=>(
              <tr key={p.id} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{...S.td,fontWeight:700}}>{p.name}</td>
                <td style={S.td}><span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,background:(p.stock||0)<5?'#fee2e2':(p.stock||0)<20?'#fef9c3':'#d1fae5',color:(p.stock||0)<5?'#dc2626':(p.stock||0)<20?'#b45309':'#059669'}}>{p.stock||0}</span></td>
                <td style={S.td}>{(p.stock||0)<5?'⚠️ منخفض':(p.stock||0)<20?'⚡ متوسط':'✅ جيد'}</td>
                <td style={S.td}>{((p.stock||0)*Number(p.price)).toFixed(0)} {CUR}</td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'#94a3b8'}}>لا توجد منتجات</td></tr>}
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

/* ══════════ 📋 الطلبيات (متقدمة) ══════════ */
function Orders() {
  const [showToast,ToastUI]=useToast()
  const [items,  setItems]  = useState([])
  const [search, setSearch] = useState('')
  const [searchType, setSearchType] = useState('all') // all|id|name|phone|address
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('list') // list|grouped
  const [selectedOrders, setSelectedOrders] = useState([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('id', { ascending:false })
    setItems(data||[])
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    showToast('✅ تم تحديث الحالة'); await load()
  }

  const updateMultiStatus = async (status) => {
    if (selectedOrders.length === 0) { showToast('اختر طلبيات أولاً', 'error'); return }
    await Promise.all(selectedOrders.map(id => supabase.from('orders').update({ status }).eq('id', id)))
    showToast(`✅ تم تحديث ${selectedOrders.length} طلبية`); setSelectedOrders([]); await load()
  }

  const toggleSelect = id => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])

  const statusLabel = s => ({ pending:'قيد الانتظار', processing:'تجهيز', shipped:'شُحن', delivered:'تسليم' }[s]||s)
  const statusColor = s => ({ pending:'#fef9c3', processing:'#dbeafe', shipped:'#e0e7ff', delivered:'#d1fae5' }[s]||'#f1f5f9')

  // فلترة متقدمة
  const filtered = items.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    switch (searchType) {
      case 'id':      return String(o.id).includes(q)
      case 'name':    return o.customer_name?.toLowerCase().includes(q)
      case 'phone':   return o.customer_phone?.includes(q)
      case 'address': return o.customer_address?.toLowerCase().includes(q)
      default: return (
        String(o.id).includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q) ||
        o.customer_address?.toLowerCase().includes(q)
      )
    }
  })

  // تجميع بالعنوان (للتوصيل)
  const grouped = filtered.reduce((acc, o) => {
    const zone = o.customer_address?.split(',')[0]?.trim() || 'غير محدد'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(o); return acc
  }, {})

  const printDeliveryList = () => {
    const content = Object.entries(grouped).map(([zone, orders]) => `
      <div style="margin-bottom:24px; page-break-inside:avoid">
        <h2 style="color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:8px;margin-bottom:12px">
          📍 ${zone} (${orders.length} طلبية)
        </h2>
        <table><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>العنوان</th><th>الإجمالي</th></tr></thead>
        <tbody>${orders.map(o=>`<tr><td>${o.id}</td><td>${o.customer_name}</td><td>${o.customer_phone||'—'}</td><td>${o.customer_address||'—'}</td><td>${Number(o.total).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody>
        </table>
        <p style="font-weight:bold;text-align:right;margin-top:8px">إجمالي المنطقة: ${orders.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} ${CUR}</p>
      </div>
    `).join('')
    printA4(`
      <div class="header">
        <div><h1>🛍️ نقاء</h1><p>قائمة التوصيل</p></div>
        <div style="text-align:left"><p>${new Date().toLocaleDateString('ar-DZ')}</p><p>إجمالي: ${filtered.length} طلبية</p></div>
      </div>
      ${content}
      <div class="footer">نقاء — دليل التوصيل</div>
    `)
  }

  const printOrderReceipt = (o) => {
    const items_list = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items||[])
    printThermal(`
      <div class="center bold big">نقاء</div>
      <div class="center">إيصال طلبية</div>
      <div class="line"></div>
      <div class="row"><span>رقم الطلب:</span><span class="bold">${o.id}</span></div>
      <div class="row"><span>العميل:</span><span>${o.customer_name}</span></div>
      <div class="row"><span>الهاتف:</span><span>${o.customer_phone||'—'}</span></div>
      <div class="row"><span>العنوان:</span><span>${o.customer_address||'—'}</span></div>
      <div class="row"><span>التاريخ:</span><span>${o.date}</span></div>
      <div class="line"></div>
      ${items_list.map(i=>`<div class="row"><span>${i.name} ×${i.quantity}</span><span>${(i.price*i.quantity).toFixed(0)}</span></div>`).join('')}
      <div class="line"></div>
      <div class="row total"><span>الإجمالي:</span><span class="bold">${Number(o.total).toFixed(0)} ${CUR}</span></div>
      <div class="line"></div>
      <div class="center" style="font-size:10px">شكراً لتسوقكم معنا</div>
    `)
  }

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📋 الطلبيات</h1>

      {/* أدوات البحث والفلترة */}
      <div style={S.card}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
          <select style={{ ...S.input, width:150 }} value={searchType} onChange={e=>setSearchType(e.target.value)}>
            <option value="all">🔍 كل الحقول</option>
            <option value="id">🔢 رقم الطلب</option>
            <option value="name">👤 اسم العميل</option>
            <option value="phone">📱 الهاتف</option>
            <option value="address">📍 العنوان</option>
          </select>
          <input style={{ ...S.input, flex:1, minWidth:180 }}
            placeholder={`بحث بـ ${{all:'كل الحقول',id:'الرقم',name:'الاسم',phone:'الهاتف',address:'العنوان'}[searchType]}...`}
            value={search} onChange={e=>setSearch(e.target.value)} />
          <select style={{ ...S.input, width:150 }} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">تجهيز</option>
            <option value="shipped">شُحن</option>
            <option value="delivered">تسليم</option>
          </select>
        </div>

        {/* أزرار العمليات الجماعية */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <button style={{ ...S.btnSm, background: viewMode==='list'?'#dc2626':'#e2e8f0', color:viewMode==='list'?'white':'#475569' }}
            onClick={()=>setViewMode('list')}>📋 قائمة</button>
          <button style={{ ...S.btnSm, background: viewMode==='grouped'?'#dc2626':'#e2e8f0', color:viewMode==='grouped'?'white':'#475569' }}
            onClick={()=>setViewMode('grouped')}>📍 تجميع بالعنوان</button>
          <div style={{ width:1, height:24, background:'#e2e8f0' }}></div>
          {selectedOrders.length > 0 && <>
            <span style={{ fontSize:13, color:'#475569' }}>تم تحديد {selectedOrders.length}</span>
            <button style={{ ...S.btnSm, background:'#10b981', color:'white' }} onClick={()=>updateMultiStatus('processing')}>تجهيز الكل</button>
            <button style={{ ...S.btnSm, background:'#3b82f6', color:'white' }} onClick={()=>updateMultiStatus('shipped')}>شحن الكل</button>
            <button style={{ ...S.btnSm, background:'#7c3aed', color:'white' }} onClick={()=>updateMultiStatus('delivered')}>تسليم الكل</button>
          </>}
          <button style={{ ...S.btnGray, marginRight:'auto', padding:'6px 14px', background:'#f59e0b', color:'white' }}
            onClick={printDeliveryList}>
            🖨️ طباعة قائمة التوصيل ({filtered.length})
          </button>
        </div>
      </div>

      {/* عرض مجمّع بالعنوان */}
      {viewMode === 'grouped' ? (
        <div>
          {Object.entries(grouped).map(([zone, zoneOrders]) => (
            <div key={zone} style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <h3 style={{ fontWeight:800, color:'#dc2626' }}>📍 {zone} ({zoneOrders.length} طلبية)</h3>
                <span style={{ fontWeight:700, color:'#10b981' }}>
                  {zoneOrders.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} {CUR}
                </span>
              </div>
              {zoneOrders.map(o => (
                <div key={o.id} style={{ background:'#f8fafc', borderRadius:12, padding:12, marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <div style={{ fontSize:13 }}>
                    <strong>#{o.id}</strong> — {o.customer_name} — {o.customer_phone||'—'}
                    <div style={{ color:'#64748b', fontSize:12 }}>{o.customer_address}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontWeight:700, color:'#dc2626' }}>{Number(o.total).toFixed(0)} {CUR}</span>
                    <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, background:statusColor(o.status) }}>{statusLabel(o.status)}</span>
                    <button style={{ ...S.btnSm, background:'#f0fdf4', color:'#059669' }} onClick={()=>printOrderReceipt(o)}>🖨️</button>
                    {o.customer_phone && (
                      <a href={`https://wa.me/${o.customer_phone.replace(/^0/,'213')}?text=مرحباً ${o.customer_name}، طلبكم رقم ${o.id} جاهز للتوصيل`}
                        target="_blank" style={{ ...S.btnSm, background:'#dcfce7', color:'#059669', textDecoration:'none', padding:'5px 10px' }}>💬</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {Object.keys(grouped).length===0 && <div style={{ ...S.card, textAlign:'center', color:'#94a3b8', padding:40 }}>لا توجد طلبيات</div>}
        </div>
      ) : (
        /* عرض قائمة عادي */
        <div style={S.card}>
          <div style={{ marginBottom:8, fontSize:13, color:'#64748b' }}>
            {filtered.length} طلبية — إجمالي: {filtered.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} {CUR}
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={S.th}><input type="checkbox" onChange={e=>setSelectedOrders(e.target.checked?filtered.map(o=>o.id):[])} /></th>
                <th style={S.th}>#</th><th style={S.th}>العميل</th>
                <th style={S.th}>الهاتف</th><th style={S.th}>العنوان</th>
                <th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th><th style={S.th}>الإجراءات</th>
              </tr></thead>
              <tbody>{filtered.map(o=>(
                <tr key={o.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                  <td style={S.td}><input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={()=>toggleSelect(o.id)} /></td>
                  <td style={{ ...S.td, fontSize:11, color:'#94a3b8' }}>{o.id}</td>
                  <td style={{ ...S.td, fontWeight:700 }}>{o.customer_name}</td>
                  <td style={S.td}>{o.customer_phone||'—'}</td>
                  <td style={{ ...S.td, fontSize:12 }}>{o.customer_address||'—'}</td>
                  <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{Number(o.total).toFixed(0)} {CUR}</td>
                  <td style={S.td}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:statusColor(o.status) }}>
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {['processing','shipped','delivered'].map(s=>(
                        <button key={s} style={{ ...S.btnSm, background:'#f1f5f9', color:'#475569', fontSize:11 }}
                          onClick={()=>updateStatus(o.id,s)}>
                          {{processing:'تجهيز',shipped:'شحن',delivered:'تسليم'}[s]}
                        </button>
                      ))}
                      <button style={{ ...S.btnSm, background:'#f0fdf4', color:'#059669' }} onClick={()=>printOrderReceipt(o)}>🖨️</button>
                      {o.customer_phone && (
                        <a href={`https://wa.me/${o.customer_phone.replace(/^0/,'213')}?text=مرحباً ${o.customer_name}، طلبكم رقم ${o.id} في الطريق إليكم`}
                          target="_blank" style={{ ...S.btnSm, background:'#dcfce7', color:'#059669', textDecoration:'none', padding:'5px 10px' }}>💬</a>
                      )}
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

/* ══════════ 🔔 الإشعارات ══════════ */
function Notifications() {
  const [showToast,ToastUI]=useToast()
  const [items,setItems]=useState([])
  const [title,setTitle]=useState(''); const [body,setBody]=useState('')
  const [saving,setSaving]=useState(false)
  const load=async()=>{ const {data}=await supabase.from('notifications').select('*').order('id',{ascending:false}); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const send=async()=>{
    if(!title||!body){showToast('العنوان والنص مطلوبان','error');return} setSaving(true)
    await supabase.from('notifications').insert({id:Date.now(),title,body,date:new Date().toLocaleString('ar-DZ'),is_read:false})
    showToast('✅ تم الإرسال');setTitle('');setBody('');await load();setSaving(false)
  }
  return (
    <div>{ToastUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🔔 الإشعارات</h1>
      <div style={S.card}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div><label style={S.label}>النص</label><input style={S.input} value={body} onChange={e=>setBody(e.target.value)} /></div>
        </div>
        <button style={S.btn} onClick={send} disabled={saving}>{saving?'⏳...':'📢 إرسال'}</button>
      </div>
      <div style={S.card}>
        {items.length===0?<p style={{textAlign:'center',color:'#94a3b8',padding:24}}>لا توجد إشعارات</p>:
          items.map(n=>(
            <div key={n.id} style={{borderBottom:'1px solid #f8fafc',padding:'12px 0'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><strong>{n.title}</strong><span style={{fontSize:12,color:'#94a3b8'}}>{n.date}</span></div>
              <p style={{fontSize:14,color:'#475569',marginTop:4}}>{n.body}</p>
            </div>
          ))}
      </div>
    </div>
  )
}

/* ══════════ 📊 التقارير ══════════ */
function Reports() {
  const [stats,setStats]=useState({sales:0,purchases:0,expenses:0})
  const [topProds,setTopProds]=useState([])
  const [period,setPeriod]=useState('month') // week|month|year|all

  useEffect(()=>{
    const load=async()=>{
      const [{data:orders},{data:purch},{data:exp}]=await Promise.all([
        supabase.from('orders').select('total,items,date,status'),
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
      const purchases=(purch||[]).reduce((s,p)=>s+Number(p.total),0)
      const expenses=(exp||[]).reduce((s,e)=>s+Number(e.amount),0)
      setStats({sales,purchases,expenses})
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
    printA4(`
      <div class="header"><div><h1>🛍️ نقاء</h1><p>تقرير مالي — ${{'week':'أسبوعي','month':'شهري','year':'سنوي','all':'إجمالي'}[period]}</p></div><div><p>${new Date().toLocaleDateString('ar-DZ')}</p></div></div>
      <table><thead><tr><th>البيان</th><th>المبلغ</th></tr></thead><tbody>
        <tr><td>إجمالي المبيعات</td><td>${stats.sales.toFixed(0)} ${CUR}</td></tr>
        <tr><td>إجمالي المشتريات</td><td>${stats.purchases.toFixed(0)} ${CUR}</td></tr>
        <tr><td>إجمالي المصاريف</td><td>${stats.expenses.toFixed(0)} ${CUR}</td></tr>
        <tr class="total-row"><td>صافي الربح</td><td>${profit.toFixed(0)} ${CUR}</td></tr>
      </tbody></table>
      <h2>أكثر المنتجات مبيعاً</h2>
      <table><thead><tr><th>المنتج</th><th>الكمية</th></tr></thead><tbody>
        ${topProds.map(([n,q])=>`<tr><td>${n}</td><td>${q}</td></tr>`).join('')}
      </tbody></table>
      <div class="footer">نقاء</div>
    `)
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
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:14,marginBottom:20}}>
        {[
          {l:'إجمالي المبيعات',v:stats.sales.toFixed(0)+' '+CUR,c:'#10b981',i:'💰'},
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

/* ══════════ 💸 المصاريف ══════════ */
function Expenses() {
  const [showToast,ToastUI]=useToast(); const [askConfirm,ConfirmUI]=useConfirm()
  const [items,setItems]=useState([]); const [search,setSearch]=useState('')
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({name:'',amount:'',date:new Date().toISOString().split('T')[0],category:'other'})
  const load=async()=>{ const {data}=await supabase.from('expenses').select('*').order('id',{ascending:false}); setItems(data||[]) }
  useEffect(()=>{ load() },[])
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const add=async()=>{
    if(!form.name||!form.amount){showToast('الاسم والمبلغ مطلوبان','error');return} setSaving(true)
    await supabase.from('expenses').insert({id:Date.now(),name:form.name.trim(),amount:parseFloat(form.amount),date:form.date,category:form.category})
    showToast('✅ تمت الإضافة');setForm({name:'',amount:'',date:new Date().toISOString().split('T')[0],category:'other'});await load();setSaving(false)
  }
  const del=async id=>{ if(!await askConfirm('حذف هذا المصروف؟'))return; await supabase.from('expenses').delete().eq('id',id);showToast('تم الحذف');await load() }
  const catLabel={rent:'إيجار',salary:'رواتب',utilities:'فواتير',other:'أخرى'}
  const filtered=items.filter(e=>e.name?.toLowerCase().includes(search.toLowerCase()))
  const total=items.reduce((s,e)=>s+Number(e.amount),0)
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>💸 المصاريف</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>المبلغ *</label><input style={S.input} type="number" value={form.amount} onChange={F('amount')} /></div>
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
                <td style={S.td}>{catLabel[e.category]||e.category}</td>
                <td style={S.td}>{e.date}</td>
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

/* ══════════ 📋 سجل النشاطات ══════════ */
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

/* ══════════ ⚙️ الإعدادات ══════════ */
function Settings({ showToast }) {
  const [form,setForm]=useState({store_name:'نقاء',store_currency:'دج',whatsapp_number:'',free_shipping_threshold:'500'})
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
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المتجر</label><input style={S.input} value={form.store_name} onChange={e=>setForm(f=>({...f,store_name:e.target.value}))} /></div>
          <div><label style={S.label}>العملة</label><input style={S.input} value={form.store_currency} onChange={e=>setForm(f=>({...f,store_currency:e.target.value}))} /></div>
          <div><label style={S.label}>رقم واتساب</label><input style={S.input} value={form.whatsapp_number} onChange={e=>setForm(f=>({...f,whatsapp_number:e.target.value}))} placeholder="213XXXXXXXXX" /></div>
          <div><label style={S.label}>حد التوصيل المجاني</label><input style={S.input} type="number" value={form.free_shipping_threshold} onChange={e=>setForm(f=>({...f,free_shipping_threshold:e.target.value}))} /></div>
        </div>
        <button style={{...S.btn,marginTop:20}} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ الإعدادات'}</button>
      </div>
    </div>
  )
}

/* ══════════ 🏢 من نحن ══════════ */
function AboutUs({ showToast }) {
  const [content,setContent]=useState(''); const [saving,setSaving]=useState(false)
  useEffect(()=>{ supabase.from('settings').select('value').eq('key','about_us').maybeSingle().then(({data})=>{ setContent(data?.value||'نقاء — متجر إلكتروني جزائري متخصص في توزيع المواد الغذائية ومنتجات العناية الشخصية.\n\nتأسس المتجر بهدف تقديم أفضل المنتجات بأسعار تنافسية مع ضمان الجودة والخدمة الممتازة.') }) },[])
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

/* ══════════ 📞 اتصل بنا ══════════ */
function ContactUs({ showToast }) {
  const [form,setForm]=useState({contact_phone:'',contact_whatsapp:'',contact_email:'',contact_address:'',contact_facebook:'',contact_instagram:'',contact_hours:''})
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
    showToast('✅ تم حفظ معلومات الاتصال');setSaving(false)
  }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>📞 اتصل بنا</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>📱 الهاتف</label><input style={S.input} value={form.contact_phone} onChange={F('contact_phone')} placeholder="0555 XX XX XX" /></div>
          <div><label style={S.label}>💬 واتساب</label><input style={S.input} value={form.contact_whatsapp} onChange={F('contact_whatsapp')} placeholder="213XXXXXXXXX" /></div>
          <div><label style={S.label}>📧 البريد</label><input style={S.input} value={form.contact_email} onChange={F('contact_email')} placeholder="info@naqaa.dz" /></div>
          <div><label style={S.label}>📍 العنوان</label><input style={S.input} value={form.contact_address} onChange={F('contact_address')} placeholder="الولاية، الجزائر" /></div>
          <div><label style={S.label}>📘 فيسبوك</label><input style={S.input} value={form.contact_facebook} onChange={F('contact_facebook')} /></div>
          <div><label style={S.label}>📸 إنستغرام</label><input style={S.input} value={form.contact_instagram} onChange={F('contact_instagram')} /></div>
          <div style={{gridColumn:'span 2'}}><label style={S.label}>🕒 ساعات العمل</label><input style={S.input} value={form.contact_hours} onChange={F('contact_hours')} placeholder="الأحد–الخميس: 8ص–6م" /></div>
        </div>
        <button style={{...S.btn,marginTop:18}} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
      </div>
    </div>
  )
}

/* ══════════ 🔄 سياسة الاسترجاع ══════════ */
function ReturnPolicy({ showToast }) {
  const [content,setContent]=useState(''); const [saving,setSaving]=useState(false)
  useEffect(()=>{ supabase.from('settings').select('value').eq('key','return_policy').maybeSingle().then(({data})=>{ setContent(data?.value||'يمكن للعميل استرجاع المنتج خلال 14 يوم من تاريخ الاستلام بشرط أن يكون بحالته الأصلية.\n\nشروط الاسترجاع:\n• المنتج بدون استخدام\n• مع الفاتورة الأصلية\n• في مدة أقصاها 14 يوم من الاستلام') }) },[])
  const save=async()=>{ setSaving(true); await supabase.from('settings').upsert({key:'return_policy',value:content}); showToast('✅ تم الحفظ'); setSaving(false) }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:20}}>🔄 سياسة الاسترجاع</h1>
      <div style={S.card}>
        <label style={S.label}>محتوى السياسة</label>
        <textarea style={{...S.input,minHeight:220,resize:'vertical',marginBottom:14}} value={content} onChange={e=>setContent(e.target.value)} />
        <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
      </div>
      {content&&<div style={S.card}><h3 style={{fontWeight:800,marginBottom:10}}>معاينة</h3><div style={{whiteSpace:'pre-wrap',lineHeight:1.8,color:'#475569',fontSize:14}}>{content}</div></div>}
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
    { id:'dashboard',     icon:'📊', label:'لوحة القيادة' },
    { id:'products',      icon:'📦', label:'المنتجات' },
    { id:'categories',    icon:'📂', label:'الفئات' },
    { id:'brands',        icon:'🏷️', label:'العلامات التجارية' },
    { id:'suppliers',     icon:'🏭', label:'الموردون' },
    { id:'customers',     icon:'👥', label:'العملاء' },
    { id:'employees',     icon:'👔', label:'الموظفون' },
    { id:'coupons',       icon:'🎟️', label:'الكوبونات' },
    { id:'purchases',     icon:'🛒', label:'المشتريات' },
    { id:'inventory',     icon:'📦', label:'المخزون' },
    { id:'orders',        icon:'📋', label:'الطلبيات' },
    { id:'notifications', icon:'🔔', label:'الإشعارات' },
    { id:'reports',       icon:'📊', label:'التقارير' },
    { id:'expenses',      icon:'💸', label:'المصاريف' },
    { id:'activityLog',   icon:'📋', label:'سجل النشاطات' },
    { id:'settings',      icon:'⚙️', label:'الإعدادات' },
    { id:'about',         icon:'🏢', label:'من نحن' },
    { id:'contact',       icon:'📞', label:'اتصل بنا' },
    { id:'returnPolicy',  icon:'🔄', label:'سياسة الاسترجاع' },
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
      case 'notifications': return <Notifications />
      case 'reports':       return <Reports />
      case 'expenses':      return <Expenses />
      case 'activityLog':   return <ActivityLog />
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
        .sitem { display:flex; align-items:center; gap:10px; padding:10px 16px;
          color:#475569; cursor:pointer; border-radius:12px; margin:2px 8px;
          transition:.15s; font-size:14px; font-weight:600; }
        .sitem:hover { background:rgba(220,38,38,.08); color:#dc2626; }
        .sitem.on    { background:rgba(220,38,38,.12); color:#dc2626; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width:256, background:'white', borderLeft:'1px solid #e2e8f0',
        position:'sticky', top:0, height:'100vh', overflowY:'auto', flexShrink:0 }}>
        <div style={{ padding:'18px 14px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:42, height:42, borderRadius:12,
              background:'linear-gradient(135deg,#dc2626,#7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛍️</div>
            <div>
              <div style={{ fontWeight:900, fontSize:16 }}>نقاء</div>
              <div style={{ fontSize:11, color:'#64748b' }}>لوحة الإدارة</div>
            </div>
          </div>
          <div style={{ marginTop:10, padding:'7px 12px', background:'#f8fafc',
            borderRadius:10, fontSize:13, color:'#475569' }}>👤 {user.name}</div>
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            <a href="/" target="_blank" style={{ flex:1, textAlign:'center',
              padding:'6px', borderRadius:10, background:'#f1f5f9', color:'#475569',
              fontSize:12, textDecoration:'none', fontWeight:700 }}>🛍️ المتجر</a>
            <button onClick={handleLogout} style={{ flex:1, padding:'6px', borderRadius:10,
              background:'#fee2e2', color:'#dc2626', border:'none', cursor:'pointer',
              fontSize:12, fontWeight:700 }}>🚪 خروج</button>
          </div>
        </div>
        <nav style={{ padding:'6px 0' }}>
          {sections.map(s=>(
            <div key={s.id} className={`sitem${section===s.id?' on':''}`}
              onClick={()=>setSection(s.id)}>
              <span style={{ fontSize:15 }}>{s.icon}</span>
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
