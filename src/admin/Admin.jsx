/**
 * Admin.jsx — لوحة إدارة نقاء (نسخة محسّنة)
 * - تسجيل دخول محمي
 * - كل قسم يجلب بياناته مباشرة من Supabase
 * - جميع عمليات CRUD تعمل بشكل صحيح
 */
import { useState, useEffect, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

/* ─── ثوابت ─── */
const ADMIN_EMAIL    = 'meghamel2012@gmail.com'
const ADMIN_PASS_HASH = CryptoJS.SHA256('afbilalaf06').toString()
const CURRENCY = 'دج'

/* ─── مساعدات ─── */
const hashPwd = p => CryptoJS.SHA256(p).toString()

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [])
  if (!msg) return null
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
  return (
    <div style={{ position:'fixed', bottom:24, left:24, background:bg, color:'white',
      padding:'12px 24px', borderRadius:30, zIndex:9999, fontWeight:700,
      boxShadow:'0 8px 24px rgba(0,0,0,.25)', fontSize:14 }}>
      {msg}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (msg, type = 'success') => setToast({ msg, type })
  const Toast2 = toast
    ? <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
    : null
  return [show, Toast2]
}

function Confirm({ msg, onYes, onNo }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:8000,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:20, padding:28, maxWidth:360,
        textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
        <p style={{ fontSize:16, fontWeight:600, marginBottom:20 }}>{msg}</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button onClick={onYes} style={{ background:'#ef4444', color:'white', border:'none',
            borderRadius:30, padding:'10px 24px', cursor:'pointer', fontWeight:700, fontSize:14 }}>
            نعم، احذف
          </button>
          <button onClick={onNo} style={{ background:'#e2e8f0', border:'none',
            borderRadius:30, padding:'10px 24px', cursor:'pointer', fontWeight:700, fontSize:14 }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

function useConfirm() {
  const [conf, setConf] = useState(null)
  const ask = (msg) => new Promise(resolve => setConf({ msg, resolve }))
  const UI = conf ? (
    <Confirm msg={conf.msg}
      onYes={() => { conf.resolve(true);  setConf(null) }}
      onNo ={() => { conf.resolve(false); setConf(null) }} />
  ) : null
  return [ask, UI]
}

/* ─── CSS مشترك ─── */
const S = {
  card:  { background:'white', borderRadius:16, padding:20, marginBottom:20,
           boxShadow:'0 2px 12px rgba(0,0,0,.06)', border:'1px solid #f1f5f9' },
  input: { background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:12,
           padding:'10px 14px', width:'100%', fontFamily:'inherit', fontSize:14,
           outline:'none', transition:'.2s' },
  label: { display:'block', marginBottom:6, fontWeight:700, fontSize:13, color:'#475569' },
  btn:   { background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white',
           padding:'10px 22px', borderRadius:30, border:'none', cursor:'pointer',
           fontWeight:700, fontSize:14, fontFamily:'inherit', transition:'.2s' },
  btnGray: { background:'#e2e8f0', color:'#475569', padding:'10px 22px',
             borderRadius:30, border:'none', cursor:'pointer', fontWeight:700,
             fontSize:14, fontFamily:'inherit' },
  btnSm: { padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer',
           fontSize:12, fontWeight:700, fontFamily:'inherit' },
  th:    { padding:'12px', textAlign:'right', background:'#f8fafc',
           fontWeight:700, fontSize:13, color:'#475569' },
  td:    { padding:'12px', textAlign:'right', borderBottom:'1px solid #f1f5f9',
           fontSize:14, color:'#1e293b' },
  grid2: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 },
}

/* ══════════════════════════════════════════
   🔐 شاشة تسجيل الدخول
══════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setErr(''); setLoading(true)
    // تحقق من المدير الرئيسي
    if (email.trim() === ADMIN_EMAIL && hashPwd(pass) === ADMIN_PASS_HASH) {
      onLogin({ name:'المدير', email:ADMIN_EMAIL, role:'admin' })
      return
    }
    // تحقق من قاعدة البيانات
    const { data } = await supabase.from('employees').select('*')
      .eq('username', email.trim()).maybeSingle()
    if (data && data.password === hashPwd(pass)) {
      onLogin({ name:data.name, email:data.email, role:data.role })
    } else {
      setErr('البريد أو كلمة المرور غير صحيحة')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#dc2626,#7c3aed)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:24, padding:36, width:'100%',
        maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🛍️</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1e293b' }}>نقاء</h1>
          <p style={{ color:'#64748b', fontSize:14, marginTop:4 }}>لوحة الإدارة</p>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>البريد الإلكتروني</label>
          <input style={S.input} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="أدخل بريدك الإلكتروني"
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>كلمة المرور</label>
          <input style={S.input} type="password" value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="أدخل كلمة المرور"
            onKeyDown={e => e.key === 'Enter' && submit()} />
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

/* ══════════════════════════════════════════
   📊 لوحة القيادة
══════════════════════════════════════════ */
function Dashboard() {
  const [stats, setStats] = useState({ products:0, orders:0, sales:0, profit:0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: ords }, { data: purcs }, { data: exps }] = await Promise.all([
        supabase.from('products').select('id,stock'),
        supabase.from('orders').select('id,total,status,customer_name,date').order('id',{ascending:false}).limit(5),
        supabase.from('purchases').select('total'),
        supabase.from('expenses').select('amount'),
      ])
      const totalSales = (ords||[]).reduce((s,o) => s + Number(o.total), 0)
      const totalPurch = (purcs||[]).reduce((s,p) => s + Number(p.total), 0)
      const totalExp   = (exps||[]).reduce((s,e) => s + Number(e.amount), 0)
      setStats({ products:(prods||[]).length, orders:(ords||[]).length,
        sales:totalSales, profit:totalSales - totalPurch - totalExp })
      setRecentOrders(ords||[])
      setLowStock((prods||[]).filter(p => (p.stock||0) < 5))
    }
    load()
  }, [])

  const statusLabel = s => ({ pending:'قيد الانتظار', processing:'تجهيز',
    shipped:'شُحن', delivered:'تسليم' }[s] || s)

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📊 لوحة القيادة</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { label:'المنتجات',     value:stats.products,           color:'#3b82f6', icon:'📦' },
          { label:'الطلبيات',     value:stats.orders,             color:'#10b981', icon:'📋' },
          { label:'إجمالي المبيعات', value:stats.sales.toFixed(0)+' '+CURRENCY, color:'#dc2626', icon:'💰' },
          { label:'صافي الربح',   value:stats.profit.toFixed(0)+' '+CURRENCY, color:stats.profit>=0?'#10b981':'#ef4444', icon:'📈' },
        ].map((s,i) => (
          <div key={i} style={{ ...S.card, textAlign:'center', borderTop:`3px solid ${s.color}`, marginBottom:0 }}>
            <div style={{ fontSize:28 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:s.color, margin:'6px 0' }}>{s.value}</div>
            <div style={{ fontSize:13, color:'#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {lowStock.length > 0 && (
        <div style={{ ...S.card, background:'#fef2f2', borderRight:'4px solid #dc2626' }}>
          <strong>⚠️ تنبيه مخزون منخفض ({lowStock.length} منتج):</strong>{' '}
          {lowStock.slice(0,5).map(p => p.id).join(' | ')}
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>📋 آخر الطلبيات</h3>
        {recentOrders.length === 0
          ? <p style={{ color:'#94a3b8', textAlign:'center', padding:20 }}>لا توجد طلبيات بعد</p>
          : <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={S.th}>#</th><th style={S.th}>العميل</th>
                <th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th>
              </tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td style={S.td}>{o.id}</td>
                    <td style={{ ...S.td, fontWeight:700 }}>{o.customer_name}</td>
                    <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{Number(o.total).toFixed(0)} {CURRENCY}</td>
                    <td style={S.td}>{statusLabel(o.status)}</td>
                  </tr>
                ))}
              </tbody>
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
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [products,   setProducts]   = useState([])
  const [brands,     setBrands]     = useState([])
  const [categories, setCategories] = useState([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({
    id:'', name:'', price:'', costPrice:'', cartonPrice:'',
    units:12, stock:0, sku:'', brandId:'', categoryId:'', image:''
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: b }, { data: c }] = await Promise.all([
      supabase.from('products').select('*').order('id', { ascending:false }),
      supabase.from('brands').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(p || [])
    setBrands(b || [])
    setCategories(c || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleImg = e => {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => setForm(f => ({ ...f, image: ev.target.result }))
    r.readAsDataURL(file)
  }

  const save = async () => {
    if (!form.name.trim() || !form.price) { showToast('الاسم والسعر مطلوبان', 'error'); return }
    setSaving(true)
    const row = {
      id:           form.id || Date.now(),
      name:         form.name.trim(),
      price:        parseFloat(form.price) || 0,
      cost_price:   parseFloat(form.costPrice) || 0,
      carton_price: form.cartonPrice ? parseFloat(form.cartonPrice) : null,
      units:        parseInt(form.units) || 12,
      stock:        parseInt(form.stock) || 0,
      sku:          form.sku || '',
      brand_id:     form.brandId ? parseInt(form.brandId) : null,
      category_id:  form.categoryId ? parseInt(form.categoryId) : null,
      image:        form.image || null,
      is_promo:     false,
      disabled:     false,
      created_at:   new Date().toISOString(),
    }
    const { error } = await supabase.from('products').upsert(row)
    if (error) { showToast('خطأ: ' + error.message, 'error'); setSaving(false); return }
    showToast(form.id ? '✅ تم التعديل' : '✅ تمت الإضافة')
    setForm({ id:'', name:'', price:'', costPrice:'', cartonPrice:'', units:12, stock:0, sku:'', brandId:'', categoryId:'', image:'' })
    await load()
    setSaving(false)
  }

  const edit = p => setForm({
    id: p.id, name: p.name, price: p.price || '', costPrice: p.cost_price || '',
    cartonPrice: p.carton_price || '', units: p.units || 12, stock: p.stock || 0,
    sku: p.sku || '', brandId: p.brand_id || '', categoryId: p.category_id || '',
    image: p.image || ''
  })

  const del = async id => {
    if (!await askConfirm('هل تريد حذف هذا المنتج؟')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { showToast('خطأ في الحذف', 'error'); return }
    showToast('تم الحذف')
    await load()
  }

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📦 المنتجات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:16, color:'#dc2626' }}>
          {form.id ? '✏️ تعديل منتج' : '➕ إضافة منتج جديد'}
        </h3>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المنتج *</label>
            <input style={S.input} value={form.name} onChange={F('name')} placeholder="اسم المنتج" /></div>
          <div><label style={S.label}>سعر البيع (دج) *</label>
            <input style={S.input} type="number" value={form.price} onChange={F('price')} placeholder="0" /></div>
          <div><label style={S.label}>سعر الشراء (دج)</label>
            <input style={S.input} type="number" value={form.costPrice} onChange={F('costPrice')} placeholder="0" /></div>
          <div><label style={S.label}>سعر الكرتون (دج)</label>
            <input style={S.input} type="number" value={form.cartonPrice} onChange={F('cartonPrice')} placeholder="0" /></div>
          <div><label style={S.label}>حبات في الكرتون</label>
            <input style={S.input} type="number" value={form.units} onChange={F('units')} /></div>
          <div><label style={S.label}>المخزون</label>
            <input style={S.input} type="number" value={form.stock} onChange={F('stock')} /></div>
          <div><label style={S.label}>الباركود / SKU</label>
            <input style={S.input} value={form.sku} onChange={F('sku')} placeholder="اختياري" /></div>
          <div><label style={S.label}>العلامة التجارية</label>
            <select style={S.input} value={form.brandId} onChange={F('brandId')}>
              <option value="">-- بدون --</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select></div>
          <div><label style={S.label}>الفئة</label>
            <select style={S.input} value={form.categoryId} onChange={F('categoryId')}>
              <option value="">-- بدون --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label style={S.label}>صورة المنتج</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleImg} /></div>
          {form.image && <div style={{ display:'flex', alignItems:'center' }}>
            <img src={form.image} style={{ width:80, height:80, objectFit:'cover',
              borderRadius:12, border:'2px solid #e2e8f0' }} /></div>}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:18, flexWrap:'wrap' }}>
          <button style={S.btn} onClick={save} disabled={saving}>
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ المنتج'}
          </button>
          <button style={S.btnGray} onClick={() => setForm({ id:'', name:'', price:'', costPrice:'',
            cartonPrice:'', units:12, stock:0, sku:'', brandId:'', categoryId:'', image:'' })}>
            ✖ إلغاء
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontWeight:800 }}>قائمة المنتجات ({filtered.length})</h3>
          <input style={{ ...S.input, width:220 }} placeholder="🔍 بحث..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <p style={{ textAlign:'center', color:'#94a3b8', padding:30 }}>⏳ جاري التحميل...</p> :
          filtered.length === 0 ? <p style={{ textAlign:'center', color:'#94a3b8', padding:30 }}>لا توجد منتجات</p> :
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={S.th}>الصورة</th><th style={S.th}>الاسم</th>
                <th style={S.th}>السعر</th><th style={S.th}>المخزون</th>
                <th style={S.th}>العلامة</th><th style={S.th}>الإجراءات</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={S.td}>
                      {p.image ? <img src={p.image} style={{ width:44, height:44, objectFit:'cover', borderRadius:10 }} />
                        : <span style={{ fontSize:24 }}>📷</span>}
                    </td>
                    <td style={{ ...S.td, fontWeight:700 }}>{p.name}</td>
                    <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{p.price} {CURRENCY}</td>
                    <td style={S.td}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                        background:(p.stock||0)<5?'#fee2e2':'#d1fae5',
                        color:(p.stock||0)<5?'#dc2626':'#059669' }}>
                        {p.stock||0}
                      </span>
                    </td>
                    <td style={S.td}>{brands.find(b=>b.id==p.brand_id)?.name || '—'}</td>
                    <td style={{ ...S.td, display:'flex', gap:6 }}>
                      <button style={{ ...S.btnSm, background:'#dbeafe', color:'#1d4ed8' }} onClick={() => edit(p)}>✏️</button>
                      <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={() => del(p.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
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
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items, setItems] = useState([])
  const [name, setName]   = useState('')
  const [image, setImage] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const handleImg = e => {
    const r = new FileReader(); r.onload = ev => setImage(ev.target.result)
    r.readAsDataURL(e.target.files[0])
  }

  const add = async () => {
    if (!name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('categories').insert({ id:Date.now(), name:name.trim(), image:image||null })
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    showToast('✅ تمت الإضافة'); setName(''); setImage(''); await load(); setSaving(false)
  }

  const del = async id => {
    if (!await askConfirm('حذف هذه الفئة؟')) return
    await supabase.from('categories').delete().eq('id', id)
    showToast('تم الحذف'); await load()
  }

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📂 الفئات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>➕ إضافة فئة</h3>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:1, minWidth:160 }}>
            <label style={S.label}>اسم الفئة *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: مواد غذائية" />
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            <label style={S.label}>صورة (اختياري)</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleImg} />
          </div>
          <button style={S.btn} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة'}</button>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>قائمة الفئات ({items.length})</h3>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>
            <th style={S.th}>الصورة</th><th style={S.th}>الاسم</th><th style={S.th}>حذف</th>
          </tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                <td style={S.td}>{c.image?<img src={c.image} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}}/>:'📁'}</td>
                <td style={{ ...S.td, fontWeight:700 }}>{c.name}</td>
                <td style={S.td}><button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(c.id)}>🗑️ حذف</button></td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={3} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد فئات</td></tr>}
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
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items, setItems] = useState([])
  const [name, setName]   = useState('')
  const [image, setImage] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('brands').select('*').order('name')
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const handleImg = e => {
    const r = new FileReader(); r.onload = ev => setImage(ev.target.result)
    r.readAsDataURL(e.target.files[0])
  }

  const add = async () => {
    if (!name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('brands').insert({ id:Date.now(), name:name.trim(), image:image||null })
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    showToast('✅ تمت الإضافة'); setName(''); setImage(''); await load(); setSaving(false)
  }

  const del = async id => {
    if (!await askConfirm('حذف هذه العلامة؟')) return
    await supabase.from('brands').delete().eq('id', id)
    showToast('تم الحذف'); await load()
  }

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🏷️ العلامات التجارية</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>➕ إضافة علامة</h3>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:1, minWidth:160 }}>
            <label style={S.label}>اسم العلامة *</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: Yema" />
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            <label style={S.label}>صورة (شعار)</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleImg} />
          </div>
          <button style={S.btn} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة'}</button>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>قائمة العلامات ({items.length})</h3>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>
            <th style={S.th}>الشعار</th><th style={S.th}>الاسم</th><th style={S.th}>حذف</th>
          </tr></thead>
          <tbody>
            {items.map(b => (
              <tr key={b.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                <td style={S.td}>{b.image?<img src={b.image} style={{width:44,height:44,borderRadius:'50%',objectFit:'cover'}}/>:'🏷️'}</td>
                <td style={{ ...S.td, fontWeight:700 }}>{b.name}</td>
                <td style={S.td}><button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(b.id)}>🗑️ حذف</button></td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={3} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد علامات</td></tr>}
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
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items,  setItems]  = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ id:'', name:'', phone:'', whatsapp:'', email:'', address:'' })

  const load = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name')
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const F = k => e => setForm(f => ({ ...f, [k]:e.target.value }))
  const reset = () => setForm({ id:'', name:'', phone:'', whatsapp:'', email:'', address:'' })

  const save = async () => {
    if (!form.name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    setSaving(true)
    const row = { id:form.id||Date.now(), name:form.name.trim(), phone:form.phone,
      whatsapp:form.whatsapp, email:form.email, address:form.address }
    const { error } = await supabase.from('suppliers').upsert(row)
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة'); reset(); await load(); setSaving(false)
  }

  const edit = s => setForm({ id:s.id, name:s.name, phone:s.phone||'',
    whatsapp:s.whatsapp||'', email:s.email||'', address:s.address||'' })

  const del = async id => {
    if (!await askConfirm('حذف هذا المورد؟')) return
    await supabase.from('suppliers').delete().eq('id', id)
    showToast('تم الحذف'); await load()
  }

  const filtered = items.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🏭 الموردون</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>{form.id?'✏️ تعديل':'➕ إضافة'} مورد</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} /></div>
          <div><label style={S.label}>واتساب</label><input style={S.input} value={form.whatsapp} onChange={F('whatsapp')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
          <button style={S.btnGray} onClick={reset}>✖ إلغاء</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontWeight:800 }}>قائمة الموردين ({filtered.length})</h3>
          <input style={{ ...S.input, width:200 }} placeholder="🔍 بحث..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={S.th}>الاسم</th><th style={S.th}>الهاتف</th>
              <th style={S.th}>واتساب</th><th style={S.th}>الإجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ ...S.td, fontWeight:700 }}>{s.name}</td>
                  <td style={S.td}>{s.phone||'—'}</td>
                  <td style={S.td}>{s.whatsapp||'—'}</td>
                  <td style={{ ...S.td, display:'flex', gap:6 }}>
                    <button style={{ ...S.btnSm, background:'#dbeafe', color:'#1d4ed8' }} onClick={()=>edit(s)}>✏️</button>
                    <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(s.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={4} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد موردين</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   👥 العملاء
══════════════════════════════════════════ */
function Customers() {
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items,  setItems]  = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ id:'', name:'', email:'', phone:'', address:'', password:'' })

  const load = async () => {
    const { data } = await supabase.from('customers').select('*').order('name')
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const F = k => e => setForm(f => ({ ...f, [k]:e.target.value }))
  const reset = () => setForm({ id:'', name:'', email:'', phone:'', address:'', password:'' })

  const save = async () => {
    if (!form.name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    setSaving(true)
    const existing = items.find(c => c.id == form.id)
    const row = { id:form.id||Date.now(), name:form.name.trim(), email:form.email,
      phone:form.phone, address:form.address,
      password: form.password ? hashPwd(form.password) : (existing?.password || hashPwd('123456')),
      points: existing?.points || 0, created_at: existing?.created_at || new Date().toISOString() }
    const { error } = await supabase.from('customers').upsert(row)
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    showToast(form.id?'✅ تم التعديل':'✅ تمت الإضافة'); reset(); await load(); setSaving(false)
  }

  const edit = c => setForm({ id:c.id, name:c.name, email:c.email||'',
    phone:c.phone||'', address:c.address||'', password:'' })

  const del = async id => {
    if (!await askConfirm('حذف هذا العميل؟')) return
    await supabase.from('customers').delete().eq('id', id)
    showToast('تم الحذف'); await load()
  }

  const filtered = items.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>👥 العملاء</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>{form.id?'✏️ تعديل':'➕ إضافة'} عميل</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} /></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
          <div><label style={S.label}>كلمة المرور {form.id ? '(اتركها فارغة لعدم التغيير)' : ''}</label>
            <input style={S.input} type="password" value={form.password} onChange={F('password')} /></div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
          <button style={S.btnGray} onClick={reset}>✖ إلغاء</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontWeight:800 }}>قائمة العملاء ({filtered.length})</h3>
          <input style={{ ...S.input, width:200 }} placeholder="🔍 بحث..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={S.th}>الاسم</th><th style={S.th}>البريد</th>
              <th style={S.th}>الهاتف</th><th style={S.th}>النقاط</th><th style={S.th}>الإجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ ...S.td, fontWeight:700 }}>{c.name}</td>
                  <td style={S.td}>{c.email||'—'}</td>
                  <td style={S.td}>{c.phone||'—'}</td>
                  <td style={S.td}>{c.points||0}</td>
                  <td style={{ ...S.td, display:'flex', gap:6 }}>
                    <button style={{ ...S.btnSm, background:'#dbeafe', color:'#1d4ed8' }} onClick={()=>edit(c)}>✏️</button>
                    <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(c.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد عملاء</td></tr>}
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
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items,  setItems]  = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', username:'', password:'', email:'' })

  const load = async () => {
    const { data } = await supabase.from('employees').select('id,name,username,email,role').order('name')
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const F = k => e => setForm(f => ({ ...f, [k]:e.target.value }))

  const add = async () => {
    if (!form.name||!form.username||!form.password) { showToast('الاسم والمستخدم والكلمة مطلوبة', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('employees').insert({
      id:Date.now(), name:form.name, username:form.username,
      password:hashPwd(form.password), email:form.email, role:'staff'
    })
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    showToast('✅ تم إضافة الموظف'); setForm({ name:'', username:'', password:'', email:'' })
    await load(); setSaving(false)
  }

  const del = async id => {
    if (!await askConfirm('حذف هذا الموظف؟')) return
    await supabase.from('employees').delete().eq('id', id)
    showToast('تم الحذف'); await load()
  }

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>👔 الموظفون</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>➕ إضافة موظف</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>اسم المستخدم *</label><input style={S.input} value={form.username} onChange={F('username')} /></div>
          <div><label style={S.label}>كلمة المرور *</label><input style={S.input} type="password" value={form.password} onChange={F('password')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
        </div>
        <button style={{ ...S.btn, marginTop:14 }} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة موظف'}</button>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>قائمة الموظفين ({items.length})</h3>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>
            <th style={S.th}>الاسم</th><th style={S.th}>المستخدم</th>
            <th style={S.th}>البريد</th><th style={S.th}>الدور</th><th style={S.th}>حذف</th>
          </tr></thead>
          <tbody>
            {items.map(e => (
              <tr key={e.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                <td style={{ ...S.td, fontWeight:700 }}>{e.name}</td>
                <td style={S.td}>{e.username}</td>
                <td style={S.td}>{e.email||'—'}</td>
                <td style={S.td}>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                    background:e.role==='admin'?'#fee2e2':'#d1fae5',
                    color:e.role==='admin'?'#dc2626':'#059669' }}>
                    {e.role==='admin'?'مدير':'موظف'}
                  </span>
                </td>
                <td style={S.td}>
                  {e.role !== 'admin' &&
                    <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(e.id)}>🗑️</button>}
                </td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد موظفين</td></tr>}
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
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items,  setItems]  = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code:'', type:'percent', value:'', expiry:'', maxUses:100, minOrder:0 })

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('id', { ascending:false })
    setItems(data || [])
  }
  useEffect(() => { load() }, [])
  const F = k => e => setForm(f => ({ ...f, [k]:e.target.value }))

  const add = async () => {
    if (!form.code||!form.value) { showToast('الكود والقيمة مطلوبان', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('coupons').insert({
      id:Date.now(), code:form.code.toUpperCase().trim(), type:form.type,
      value:parseFloat(form.value), expiry:form.expiry||null,
      max_uses:parseInt(form.maxUses)||100, min_order:parseFloat(form.minOrder)||0, used:0
    })
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    showToast('✅ تمت الإضافة'); setForm({ code:'', type:'percent', value:'', expiry:'', maxUses:100, minOrder:0 })
    await load(); setSaving(false)
  }

  const del = async id => {
    if (!await askConfirm('حذف هذا الكوبون؟')) return
    await supabase.from('coupons').delete().eq('id', id)
    showToast('تم الحذف'); await load()
  }

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🎟️ الكوبونات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>➕ إضافة كوبون</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>كود الكوبون *</label>
            <input style={S.input} value={form.code} onChange={F('code')} placeholder="مثال: SAVE20" /></div>
          <div><label style={S.label}>النوع</label>
            <select style={S.input} value={form.type} onChange={F('type')}>
              <option value="percent">نسبة مئوية %</option>
              <option value="fixed">مبلغ ثابت دج</option>
            </select></div>
          <div><label style={S.label}>القيمة *</label>
            <input style={S.input} type="number" value={form.value} onChange={F('value')} placeholder="مثال: 20" /></div>
          <div><label style={S.label}>تاريخ الانتهاء</label>
            <input style={S.input} type="date" value={form.expiry} onChange={F('expiry')} /></div>
          <div><label style={S.label}>الحد الأقصى للاستخدام</label>
            <input style={S.input} type="number" value={form.maxUses} onChange={F('maxUses')} /></div>
          <div><label style={S.label}>الحد الأدنى للطلب</label>
            <input style={S.input} type="number" value={form.minOrder} onChange={F('minOrder')} /></div>
        </div>
        <button style={{ ...S.btn, marginTop:14 }} onClick={add} disabled={saving}>{saving?'⏳...':'💾 إضافة كوبون'}</button>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>الكوبونات المتاحة ({items.length})</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={S.th}>الكود</th><th style={S.th}>النوع</th><th style={S.th}>القيمة</th>
              <th style={S.th}>الاستخدامات</th><th style={S.th}>الانتهاء</th><th style={S.th}>حذف</th>
            </tr></thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ ...S.td, fontWeight:900, color:'#dc2626' }}>{c.code}</td>
                  <td style={S.td}>{c.type==='percent'?'نسبة %':'ثابت'}</td>
                  <td style={{ ...S.td, fontWeight:700 }}>{c.type==='percent'?`${c.value}%`:`${c.value} دج`}</td>
                  <td style={S.td}>{c.used||0}/{c.max_uses}</td>
                  <td style={S.td}>{c.expiry||'—'}</td>
                  <td style={S.td}><button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(c.id)}>🗑️</button></td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد كوبونات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🛒 المشتريات
══════════════════════════════════════════ */
function Purchases() {
  const [showToast, ToastUI] = useToast()
  const [suppliers,  setSuppliers]  = useState([])
  const [products,   setProducts]   = useState([])
  const [purchases,  setPurchases]  = useState([])
  const [items,      setItems]      = useState([])
  const [suppId,     setSuppId]     = useState('')
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0])
  const [showModal,  setShowModal]  = useState(false)
  const [modal, setModal] = useState({ productId:'', cartons:1, unitsPerCarton:12, purchasePrice:0, sellPrice:0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data:s }, { data:p }, { data:pur }] = await Promise.all([
        supabase.from('suppliers').select('id,name').order('name'),
        supabase.from('products').select('id,name,units,cost_price,price').order('name'),
        supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20),
      ])
      setSuppliers(s||[]); setProducts(p||[]); setPurchases(pur||[])
    }
    load()
  }, [])

  const total = items.reduce((s,i) => s+i.totalPurchase, 0)

  const addItem = () => {
    const prod = products.find(p => p.id == modal.productId)
    if (!prod||!modal.cartons||!modal.purchasePrice) { showToast('اختر منتجاً وأدخل البيانات', 'error'); return }
    const totalUnits    = modal.cartons * modal.unitsPerCarton
    const totalPurchase = totalUnits * modal.purchasePrice
    setItems(prev => [...prev, {
      id: Date.now(), productId:prod.id, productName:prod.name,
      cartons:modal.cartons, unitsPerCarton:modal.unitsPerCarton,
      totalUnits, purchasePrice:modal.purchasePrice, sellPrice:modal.sellPrice, totalPurchase
    }])
    setShowModal(false)
    setModal({ productId:'', cartons:1, unitsPerCarton:12, purchasePrice:0, sellPrice:0 })
  }

  const save = async () => {
    if (!suppId) { showToast('اختر المورد', 'error'); return }
    if (items.length===0) { showToast('أضف منتجاً على الأقل', 'error'); return }
    setSaving(true)
    const supplier = suppliers.find(s => s.id == suppId)
    const { error } = await supabase.from('purchases').insert({
      id:Date.now(), supplier_id:parseInt(suppId), supplier_name:supplier?.name,
      date, items:JSON.stringify(items), total
    })
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    // تحديث المخزون
    for (const item of items) {
      const { data:p } = await supabase.from('products').select('stock').eq('id',item.productId).maybeSingle()
      if (p) await supabase.from('products').update({ stock:(p.stock||0)+item.totalUnits }).eq('id',item.productId)
    }
    showToast('✅ تم حفظ الفاتورة'); setSuppId(''); setItems([])
    const { data:pur } = await supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20)
    setPurchases(pur||[]); setSaving(false)
  }

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🛒 المشتريات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>➕ فاتورة شراء جديدة</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div><label style={S.label}>المورد *</label>
            <select style={S.input} value={suppId} onChange={e=>setSuppId(e.target.value)}>
              <option value="">-- اختر مورداً --</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div><label style={S.label}>التاريخ</label>
            <input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
        </div>
        {items.map((item,i) => (
          <div key={item.id} style={{ background:'#f8fafc', borderRadius:12, padding:12, marginBottom:8,
            borderRight:'3px solid #dc2626', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:14 }}>
              <strong>{item.productName}</strong> — {item.cartons} كرتون × {item.unitsPerCarton} = {item.totalUnits} حبة
              <span style={{ color:'#dc2626', fontWeight:700, marginRight:8 }}>{item.totalPurchase.toFixed(0)} دج</span>
            </div>
            <button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }}
              onClick={()=>setItems(prev=>prev.filter((_,j)=>j!==i))}>حذف</button>
          </div>
        ))}
        <div style={{ display:'flex', gap:10, marginTop:12, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={()=>setShowModal(true)} style={{ ...S.btnGray, background:'#10b981', color:'white' }}>
            ➕ إضافة منتج
          </button>
          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ الفاتورة'}</button>
          {items.length>0 && <span style={{ fontWeight:900, color:'#dc2626', fontSize:18 }}>💰 {total.toFixed(0)} دج</span>}
        </div>
      </div>
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:8000,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:20, padding:28, width:480, maxWidth:'95vw' }}>
            <h3 style={{ fontWeight:800, marginBottom:16 }}>➕ إضافة منتج للفاتورة</h3>
            <div style={{ display:'grid', gap:12 }}>
              <div><label style={S.label}>المنتج</label>
                <select style={S.input} value={modal.productId} onChange={e=>{
                  const p=products.find(x=>x.id==e.target.value)
                  setModal(m=>({...m,productId:e.target.value,unitsPerCarton:p?.units||12,purchasePrice:p?.cost_price||0,sellPrice:p?.price||0}))
                }}>
                  <option value="">-- اختر منتجاً --</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={S.label}>عدد الكرتونات</label>
                  <input style={S.input} type="number" value={modal.cartons} onChange={e=>setModal(m=>({...m,cartons:parseInt(e.target.value)||1}))} /></div>
                <div><label style={S.label}>حبات/كرتون</label>
                  <input style={S.input} type="number" value={modal.unitsPerCarton} onChange={e=>setModal(m=>({...m,unitsPerCarton:parseInt(e.target.value)||12}))} /></div>
                <div><label style={S.label}>سعر شراء الحبة</label>
                  <input style={S.input} type="number" value={modal.purchasePrice} onChange={e=>setModal(m=>({...m,purchasePrice:parseFloat(e.target.value)||0}))} /></div>
                <div><label style={S.label}>سعر بيع الحبة</label>
                  <input style={S.input} type="number" value={modal.sellPrice} onChange={e=>setModal(m=>({...m,sellPrice:parseFloat(e.target.value)||0}))} /></div>
              </div>
              <div style={{ background:'#f8fafc', borderRadius:10, padding:12, fontSize:14 }}>
                📦 الإجمالي: <strong>{modal.cartons*modal.unitsPerCarton}</strong> حبة —
                💰 <strong>{(modal.cartons*modal.unitsPerCarton*modal.purchasePrice).toFixed(0)} دج</strong>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button style={S.btn} onClick={addItem}>إضافة للفاتورة</button>
              <button style={S.btnGray} onClick={()=>setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>سجل الفواتير ({purchases.length})</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={S.th}>#</th><th style={S.th}>المورد</th>
              <th style={S.th}>التاريخ</th><th style={S.th}>الإجمالي</th>
            </tr></thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ ...S.td, fontSize:11, color:'#94a3b8' }}>{p.id}</td>
                  <td style={{ ...S.td, fontWeight:700 }}>{p.supplier_name}</td>
                  <td style={S.td}>{p.date}</td>
                  <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{Number(p.total).toFixed(0)} دج</td>
                </tr>
              ))}
              {purchases.length===0 && <tr><td colSpan={4} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد فواتير</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📦 المخزون
══════════════════════════════════════════ */
function Inventory() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  useEffect(() => {
    supabase.from('products').select('id,name,stock').order('name').then(({data}) => setItems(data||[]))
  }, [])
  const filtered = items.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📦 المخزون</h1>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontWeight:800 }}>حالة المخزون</h3>
          <input style={{ ...S.input, width:200 }} placeholder="🔍 بحث..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th style={S.th}>المنتج</th><th style={S.th}>الكمية</th><th style={S.th}>الحالة</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ ...S.td, fontWeight:700 }}>{p.name}</td>
                  <td style={S.td}>
                    <span style={{ padding:'3px 12px', borderRadius:20, fontSize:13, fontWeight:700,
                      background:(p.stock||0)<5?'#fee2e2':(p.stock||0)<20?'#fef9c3':'#d1fae5',
                      color:(p.stock||0)<5?'#dc2626':(p.stock||0)<20?'#b45309':'#059669' }}>
                      {p.stock||0}
                    </span>
                  </td>
                  <td style={S.td}>{(p.stock||0)<5?'⚠️ منخفض':(p.stock||0)<20?'⚡ متوسط':'✅ جيد'}</td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={3} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد منتجات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📋 الطلبيات
══════════════════════════════════════════ */
function Orders() {
  const [showToast, ToastUI] = useToast()
  const [items,  setItems]  = useState([])
  const [search, setSearch] = useState('')

  const load = async () => {
    const { data } = await supabase.from('orders').select('*').order('id',{ascending:false})
    setItems(data||[])
  }
  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    showToast('✅ تم تحديث الحالة'); await load()
  }

  const statusLabel = s => ({ pending:'قيد الانتظار', processing:'تجهيز', shipped:'شُحن', delivered:'تسليم' }[s]||s)
  const statusColor = s => ({ pending:'#fef9c3', processing:'#dbeafe', shipped:'#e0e7ff', delivered:'#d1fae5' }[s]||'#f1f5f9')

  const filtered = items.filter(o => o.customer_name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📋 الطلبيات</h1>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontWeight:800 }}>الطلبيات ({filtered.length})</h3>
          <input style={{ ...S.input, width:200 }} placeholder="🔍 بحث..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={S.th}>#</th><th style={S.th}>العميل</th><th style={S.th}>الهاتف</th>
              <th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th><th style={S.th}>الإجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ ...S.td, fontSize:11, color:'#94a3b8' }}>{o.id}</td>
                  <td style={{ ...S.td, fontWeight:700 }}>{o.customer_name}</td>
                  <td style={S.td}>{o.customer_phone||'—'}</td>
                  <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{Number(o.total).toFixed(0)} دج</td>
                  <td style={S.td}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                      background:statusColor(o.status) }}>{statusLabel(o.status)}</span>
                  </td>
                  <td style={{ ...S.td }}>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {['processing','shipped','delivered'].map(s => (
                        <button key={s} style={{ ...S.btnSm, background:'#f1f5f9', color:'#475569' }}
                          onClick={()=>updateStatus(o.id,s)}>
                          {{processing:'تجهيز',shipped:'شحن',delivered:'تسليم'}[s]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد طلبيات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🔔 الإشعارات
══════════════════════════════════════════ */
function Notifications() {
  const [showToast, ToastUI] = useToast()
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [body,  setBody]  = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('notifications').select('*').order('id',{ascending:false})
    setItems(data||[])
  }
  useEffect(() => { load() }, [])

  const send = async () => {
    if (!title||!body) { showToast('العنوان والنص مطلوبان', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('notifications').insert({
      id:Date.now(), title, body, date:new Date().toLocaleString('ar-DZ'), is_read:false
    })
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    showToast('✅ تم الإرسال'); setTitle(''); setBody(''); await load(); setSaving(false)
  }

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🔔 الإشعارات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>📢 إرسال إشعار جديد</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div><label style={S.label}>العنوان</label>
            <input style={S.input} value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div><label style={S.label}>النص</label>
            <input style={S.input} value={body} onChange={e=>setBody(e.target.value)} /></div>
        </div>
        <button style={S.btn} onClick={send} disabled={saving}>{saving?'⏳...':'📢 إرسال الإشعار'}</button>
      </div>
      <div style={S.card}>
        {items.length===0 ? <p style={{ textAlign:'center', color:'#94a3b8', padding:24 }}>لا توجد إشعارات</p> :
          items.map(n => (
            <div key={n.id} style={{ borderBottom:'1px solid #f1f5f9', padding:'12px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <strong>{n.title}</strong>
                <span style={{ fontSize:12, color:'#94a3b8' }}>{n.date}</span>
              </div>
              <p style={{ fontSize:14, color:'#475569', marginTop:4 }}>{n.body}</p>
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
  const [stats, setStats] = useState({ sales:0, purchases:0, expenses:0 })
  const [topProds, setTopProds] = useState([])

  useEffect(() => {
    const load = async () => {
      const [{ data:orders }, { data:purch }, { data:exp }] = await Promise.all([
        supabase.from('orders').select('total,items'),
        supabase.from('purchases').select('total'),
        supabase.from('expenses').select('amount'),
      ])
      const sales = (orders||[]).reduce((s,o)=>s+Number(o.total),0)
      const purchases = (purch||[]).reduce((s,p)=>s+Number(p.total),0)
      const expenses  = (exp||[]).reduce((s,e)=>s+Number(e.amount),0)
      setStats({ sales, purchases, expenses })
      const sc = {}
      ;(orders||[]).forEach(o => {
        let items = o.items
        if (typeof items === 'string') { try { items = JSON.parse(items) } catch { items = [] } }
        ;(items||[]).forEach(i => (sc[i.name]=(sc[i.name]||0)+i.quantity))
      })
      setTopProds(Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,10))
    }
    load()
  }, [])

  const profit = stats.sales - stats.purchases - stats.expenses

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📊 التقارير</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { l:'إجمالي المبيعات',    v:stats.sales.toFixed(0)+' دج',    c:'#10b981', i:'💰' },
          { l:'إجمالي المشتريات',   v:stats.purchases.toFixed(0)+' دج', c:'#dc2626', i:'🛒' },
          { l:'إجمالي المصاريف',    v:stats.expenses.toFixed(0)+' دج',  c:'#f59e0b', i:'💸' },
          { l:'صافي الربح',         v:profit.toFixed(0)+' دج',          c:profit>=0?'#10b981':'#ef4444', i:'📈' },
        ].map((s,i) => (
          <div key={i} style={{ ...S.card, textAlign:'center', borderTop:`3px solid ${s.c}`, marginBottom:0 }}>
            <div style={{ fontSize:28 }}>{s.i}</div>
            <div style={{ fontSize:20, fontWeight:900, color:s.c, margin:'6px 0' }}>{s.v}</div>
            <div style={{ fontSize:13, color:'#64748b' }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14 }}>🔥 أكثر المنتجات مبيعاً</h3>
        {topProds.length===0 ? <p style={{ textAlign:'center', color:'#94a3b8', padding:20 }}>لا توجد بيانات</p> :
          topProds.map(([name,qty],i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0',
              borderBottom:'1px solid #f1f5f9' }}>
              <span>#{i+1} {name}</span>
              <strong style={{ color:'#dc2626' }}>{qty} قطعة</strong>
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
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items,  setItems]  = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', amount:'', date:new Date().toISOString().split('T')[0], category:'other' })

  const load = async () => {
    const { data } = await supabase.from('expenses').select('*').order('id',{ascending:false})
    setItems(data||[])
  }
  useEffect(() => { load() }, [])

  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const add = async () => {
    if (!form.name||!form.amount) { showToast('الاسم والمبلغ مطلوبان', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('expenses').insert({
      id:Date.now(), name:form.name.trim(), amount:parseFloat(form.amount),
      date:form.date, category:form.category
    })
    if (error) { showToast('خطأ: '+error.message, 'error'); setSaving(false); return }
    showToast('✅ تمت الإضافة'); setForm({ name:'', amount:'', date:new Date().toISOString().split('T')[0], category:'other' })
    await load(); setSaving(false)
  }

  const del = async id => {
    if (!await askConfirm('حذف هذا المصروف؟')) return
    await supabase.from('expenses').delete().eq('id', id)
    showToast('تم الحذف'); await load()
  }

  const catLabel = { rent:'إيجار', salary:'رواتب', utilities:'فواتير', other:'أخرى' }
  const filtered  = items.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()))
  const total     = items.reduce((s,e) => s+Number(e.amount), 0)

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>💸 المصاريف</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:14, color:'#dc2626' }}>➕ إضافة مصروف</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>المبلغ *</label><input style={S.input} type="number" value={form.amount} onChange={F('amount')} /></div>
          <div><label style={S.label}>التاريخ</label><input style={S.input} type="date" value={form.date} onChange={F('date')} /></div>
          <div><label style={S.label}>الفئة</label>
            <select style={S.input} value={form.category} onChange={F('category')}>
              <option value="rent">إيجار</option><option value="salary">رواتب</option>
              <option value="utilities">فواتير</option><option value="other">أخرى</option>
            </select></div>
        </div>
        <button style={{ ...S.btn, marginTop:14 }} onClick={add} disabled={saving}>{saving?'⏳...':'➕ إضافة مصروف'}</button>
      </div>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontWeight:800 }}>قائمة المصاريف</h3>
          <input style={{ ...S.input, width:200 }} placeholder="🔍 بحث..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={S.th}>الاسم</th><th style={S.th}>المبلغ</th>
              <th style={S.th}>الفئة</th><th style={S.th}>التاريخ</th><th style={S.th}>حذف</th>
            </tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ ...S.td, fontWeight:700 }}>{e.name}</td>
                  <td style={{ ...S.td, color:'#ef4444', fontWeight:700 }}>{Number(e.amount).toFixed(0)} دج</td>
                  <td style={S.td}>{catLabel[e.category]||e.category}</td>
                  <td style={S.td}>{e.date}</td>
                  <td style={S.td}><button style={{ ...S.btnSm, background:'#fee2e2', color:'#dc2626' }} onClick={()=>del(e.id)}>🗑️</button></td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>لا توجد مصاريف</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:14, fontWeight:900, color:'#ef4444', fontSize:16 }}>
          💰 إجمالي المصاريف: {total.toFixed(0)} دج
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📋 سجل النشاطات
══════════════════════════════════════════ */
function ActivityLog() {
  const [items, setItems] = useState([])
  useEffect(() => {
    supabase.from('activity_log').select('*').order('id',{ascending:false}).limit(50)
      .then(({data}) => setItems(data||[]))
  }, [])
  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📋 سجل النشاطات</h1>
      <div style={{ ...S.card, maxHeight:500, overflowY:'auto' }}>
        {items.length===0 ? <p style={{ textAlign:'center', color:'#94a3b8', padding:24 }}>لا توجد نشاطات</p> :
          items.map(log => (
            <div key={log.id} style={{ borderBottom:'1px solid #f1f5f9', padding:'10px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <strong style={{ color:'#dc2626' }}>{log.action}</strong>
                <span style={{ fontSize:12, color:'#94a3b8' }}>{log.date}</span>
              </div>
              <p style={{ fontSize:13, color:'#475569', marginTop:2 }}>{log.details}</p>
              <p style={{ fontSize:11, color:'#94a3b8' }}>بواسطة: {log.employee}</p>
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
  const [form, setForm] = useState({
    store_name:'نقاء', store_currency:'دج',
    whatsapp_number:'', free_shipping_threshold:'500'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) {
        const map = {}; data.forEach(r => (map[r.key] = r.value))
        setForm(f => ({ ...f, ...map }))
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    await Promise.all(Object.entries(form).map(([key,value]) =>
      supabase.from('settings').upsert({ key, value:String(value) })
    ))
    showToast('✅ تم حفظ الإعدادات'); setSaving(false)
  }

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>⚙️ إعدادات المتجر</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المتجر</label>
            <input style={S.input} value={form.store_name} onChange={e=>setForm(f=>({...f,store_name:e.target.value}))} /></div>
          <div><label style={S.label}>العملة</label>
            <input style={S.input} value={form.store_currency} onChange={e=>setForm(f=>({...f,store_currency:e.target.value}))} /></div>
          <div><label style={S.label}>رقم واتساب</label>
            <input style={S.input} value={form.whatsapp_number} onChange={e=>setForm(f=>({...f,whatsapp_number:e.target.value}))} placeholder="213XXXXXXXXX" /></div>
          <div><label style={S.label}>حد التوصيل المجاني (دج)</label>
            <input style={S.input} type="number" value={form.free_shipping_threshold} onChange={e=>setForm(f=>({...f,free_shipping_threshold:e.target.value}))} /></div>
        </div>
        <button style={{ ...S.btn, marginTop:20 }} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ الإعدادات'}</button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏢 من نحن
══════════════════════════════════════════ */
function AboutUs({ showToast }) {
  const [content, setContent] = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    supabase.from('settings').select('value').eq('key','about_us').maybeSingle()
      .then(({data}) => data && setContent(data.value))
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('settings').upsert({ key:'about_us', value:content })
    showToast('✅ تم الحفظ'); setSaving(false)
  }

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🏢 من نحن</h1>
      <div style={S.card}>
        <p style={{ color:'#64748b', fontSize:14, marginBottom:16 }}>
          أدخل معلومات عن متجرك — ستظهر في صفحة "من نحن" للزبائن
        </p>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>محتوى صفحة "من نحن"</label>
          <textarea style={{ ...S.input, minHeight:200, resize:'vertical' }}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`مثال:\nنقاء — متجر إلكتروني جزائري متخصص في توزيع المواد الغذائية ومنتجات العناية الشخصية.\n\nتأسس المتجر عام 2024 بهدف تقديم أفضل المنتجات بأسعار تنافسية مع ضمان الجودة والخدمة الممتازة.\n\nمهمتنا: توفير تجربة تسوق سهلة وآمنة لكل عميل.`} />
        </div>
        <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ'}</button>
      </div>
      {content && (
        <div style={S.card}>
          <h3 style={{ fontWeight:800, marginBottom:10 }}>معاينة</h3>
          <div style={{ whiteSpace:'pre-wrap', lineHeight:1.8, color:'#475569', fontSize:14 }}>{content}</div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   📞 اتصل بنا
══════════════════════════════════════════ */
function ContactUs({ showToast }) {
  const [form, setForm] = useState({
    phone:'', whatsapp:'', email:'',
    address:'', facebook:'', instagram:'', working_hours:''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').in('key',['contact_phone','contact_whatsapp','contact_email','contact_address','contact_facebook','contact_instagram','contact_hours'])
      .then(({data}) => {
        if (data) {
          const map = {}; data.forEach(r => (map[r.key] = r.value))
          setForm({
            phone: map['contact_phone']||'',
            whatsapp: map['contact_whatsapp']||'',
            email: map['contact_email']||'',
            address: map['contact_address']||'',
            facebook: map['contact_facebook']||'',
            instagram: map['contact_instagram']||'',
            working_hours: map['contact_hours']||'',
          })
        }
      })
  }, [])

  const save = async () => {
    setSaving(true)
    const rows = [
      { key:'contact_phone',     value:form.phone },
      { key:'contact_whatsapp',  value:form.whatsapp },
      { key:'contact_email',     value:form.email },
      { key:'contact_address',   value:form.address },
      { key:'contact_facebook',  value:form.facebook },
      { key:'contact_instagram', value:form.instagram },
      { key:'contact_hours',     value:form.working_hours },
    ]
    await Promise.all(rows.map(r => supabase.from('settings').upsert(r)))
    showToast('✅ تم حفظ معلومات الاتصال'); setSaving(false)
  }

  const F = k => e => setForm(f => ({ ...f, [k]:e.target.value }))

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📞 اتصل بنا</h1>
      <div style={S.card}>
        <p style={{ color:'#64748b', fontSize:14, marginBottom:16 }}>
          هذه المعلومات ستظهر للزبائن في صفحة "اتصل بنا"
        </p>
        <div style={S.grid2}>
          <div><label style={S.label}>📱 رقم الهاتف</label>
            <input style={S.input} value={form.phone} onChange={F('phone')} placeholder="0555 XX XX XX" /></div>
          <div><label style={S.label}>💬 رقم واتساب</label>
            <input style={S.input} value={form.whatsapp} onChange={F('whatsapp')} placeholder="213XXXXXXXXX" /></div>
          <div><label style={S.label}>📧 البريد الإلكتروني</label>
            <input style={S.input} value={form.email} onChange={F('email')} placeholder="info@naqaa.com" /></div>
          <div><label style={S.label}>📍 العنوان</label>
            <input style={S.input} value={form.address} onChange={F('address')} placeholder="الولاية، الجزائر" /></div>
          <div><label style={S.label}>📘 فيسبوك</label>
            <input style={S.input} value={form.facebook} onChange={F('facebook')} placeholder="facebook.com/..." /></div>
          <div><label style={S.label}>📸 إنستغرام</label>
            <input style={S.input} value={form.instagram} onChange={F('instagram')} placeholder="@نقاء" /></div>
          <div style={{ gridColumn:'span 2' }}>
            <label style={S.label}>🕒 ساعات العمل</label>
            <input style={S.input} value={form.working_hours} onChange={F('working_hours')} placeholder="الأحد–الخميس: 8ص–6م" /></div>
        </div>
        <button style={{ ...S.btn, marginTop:18 }} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ معلومات الاتصال'}</button>
      </div>
      {/* معاينة */}
      <div style={S.card}>
        <h3 style={{ fontWeight:800, marginBottom:12 }}>معاينة البطاقة</h3>
        <div style={{ display:'grid', gap:10 }}>
          {form.phone && <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:14 }}><span style={{ fontSize:20 }}>📱</span><span>{form.phone}</span></div>}
          {form.whatsapp && <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:14 }}><span style={{ fontSize:20 }}>💬</span><span>{form.whatsapp}</span></div>}
          {form.email && <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:14 }}><span style={{ fontSize:20 }}>📧</span><span>{form.email}</span></div>}
          {form.address && <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:14 }}><span style={{ fontSize:20 }}>📍</span><span>{form.address}</span></div>}
          {form.working_hours && <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:14 }}><span style={{ fontSize:20 }}>🕒</span><span>{form.working_hours}</span></div>}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🔄 سياسة الاسترجاع
══════════════════════════════════════════ */
function ReturnPolicy({ showToast }) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('value').eq('key','return_policy').maybeSingle()
      .then(({data}) => {
        setContent(data?.value || 'يمكن للعميل استرجاع المنتج خلال 14 يوم من تاريخ الاستلام بشرط أن يكون بحالته الأصلية وبعبوته الأصلية.\n\nشروط الاسترجاع:\n- المنتج بدون استخدام\n- مع الفاتورة الأصلية\n- في مدة أقصاها 14 يوم')
      })
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('settings').upsert({ key:'return_policy', value:content })
    showToast('✅ تم حفظ السياسة'); setSaving(false)
  }

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🔄 سياسة الاسترجاع</h1>
      <div style={S.card}>
        <label style={S.label}>محتوى سياسة الاسترجاع</label>
        <textarea style={{ ...S.input, minHeight:220, resize:'vertical', marginBottom:14 }}
          value={content} onChange={e=>setContent(e.target.value)} />
        <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ السياسة'}</button>
      </div>
      {content && (
        <div style={S.card}>
          <h3 style={{ fontWeight:800, marginBottom:10 }}>معاينة</h3>
          <div style={{ whiteSpace:'pre-wrap', lineHeight:1.8, color:'#475569', fontSize:14 }}>{content}</div>
        </div>
      )}
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

  // تحقق من جلسة محفوظة
  useEffect(() => {
    const saved = sessionStorage.getItem('nq_admin')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const handleLogin = (u) => {
    setUser(u); sessionStorage.setItem('nq_admin', JSON.stringify(u))
  }

  const handleLogout = () => {
    setUser(null); sessionStorage.removeItem('nq_admin'); setSection('dashboard')
  }

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
        body.dark .admin-sidebar { background:#1e293b !important; }
        .sidebar-item { display:flex; align-items:center; gap:10px; padding:10px 16px;
          color:#475569; cursor:pointer; border-radius:12px; margin:2px 8px;
          transition:.2s; font-size:14px; font-weight:600; }
        .sidebar-item:hover { background:rgba(220,38,38,.08); color:#dc2626; }
        .sidebar-item.active { background:rgba(220,38,38,.12); color:#dc2626; }
        body.dark .sidebar-item { color:#94a3b8; }
        body.dark .sidebar-item:hover, body.dark .sidebar-item.active { color:#f87171; }
        @media(max-width:768px) { .admin-sidebar { position:fixed; z-index:200; transform:translateX(100%); }
          .admin-sidebar.open { transform:translateX(0); } }
      `}</style>

      {/* SIDEBAR */}
      <div className="admin-sidebar" style={{ width:260, background:'white',
        borderLeft:'1px solid #e2e8f0', position:'sticky', top:0,
        height:'100vh', overflowY:'auto', flexShrink:0 }}>
        <div style={{ padding:'20px 16px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:44, height:44, borderRadius:12,
              background:'linear-gradient(135deg,#dc2626,#7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, flexShrink:0 }}>🛍️</div>
            <div>
              <div style={{ fontWeight:900, fontSize:16, color:'#1e293b' }}>نقاء</div>
              <div style={{ fontSize:12, color:'#64748b' }}>لوحة الإدارة</div>
            </div>
          </div>
          <div style={{ marginTop:12, padding:'8px 12px', background:'#f8fafc',
            borderRadius:10, fontSize:13, color:'#475569' }}>
            👤 {user.name}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <a href="/" target="_blank" style={{ flex:1, display:'block', textAlign:'center',
              padding:'7px', borderRadius:10, background:'#f1f5f9', color:'#475569',
              fontSize:12, textDecoration:'none', fontWeight:700 }}>
              🛍️ المتجر
            </a>
            <button onClick={handleLogout} style={{ flex:1, padding:'7px', borderRadius:10,
              background:'#fee2e2', color:'#dc2626', border:'none', cursor:'pointer',
              fontSize:12, fontWeight:700 }}>
              🚪 خروج
            </button>
          </div>
        </div>
        <nav style={{ padding:'8px 0' }}>
          {sections.map(s => (
            <div key={s.id}
              className={`sidebar-item${section===s.id?' active':''}`}
              onClick={() => setSection(s.id)}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
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
