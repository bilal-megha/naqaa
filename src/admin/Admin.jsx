/**
 * Admin.jsx — نقاء v7 (كامل ومصحح)
 * ✅ متوافق مع SQL الجديد
 * ✅ متوافق مع Store.jsx
 * ✅ تم إصلاح جميع الأخطاء
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

/* ─── دالة مركزية لحساب سعر الكرتون ─── */
const autoCarton = (price, units) => {
  const p = parseFloat(price) || 0
  const u = parseInt(units) || 12
  return p > 0 ? (p * u).toFixed(2) : ''
}

/* ─── حقل رقمي فقط ─── */
const NumInput = ({ value, onChange, placeholder, style, step }) => (
  <input
    type="number"
    value={value}
    onChange={onChange}
    placeholder={placeholder || '0'}
    step={step || 'any'}
    min="0"
    onKeyDown={e => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }}
    style={{ ...S.input, ...style }}
  />
)

/* ─── Toast ─── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [])
  const cfg = {
    success: { bg: '#10B981', icon: '✅' },
    error: { bg: '#EF4444', icon: '❌' },
    info: { bg: '#3B82F6', icon: 'ℹ️' }
  }[type] || { bg: '#10B981', icon: '✅' }
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: 'white',
      borderRight: `4px solid ${cfg.bg}`, color: '#1E293B',
      padding: '12px 20px', borderRadius: 10, zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,.14)', fontSize: 14,
      direction: 'rtl', display: 'flex', alignItems: 'center', gap: 8,
      minWidth: 240, animation: 'slideIn .25s ease'
    }}>
      <style>{'@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}'}</style>
      <span style={{ fontSize: 16 }}>{cfg.icon}</span>
      <span style={{ fontWeight: 600, flex: 1 }}>{msg}</span>
    </div>
  )
}

function useToast() {
  const [t, setT] = useState(null)
  const show = (msg, type = 'success') => setT({ msg, type })
  const UI = t ? <Toast msg={t.msg} type={t.type} onDone={() => setT(null)} /> : null
  return [show, UI]
}

/* ─── Confirm ─── */
function useConfirm() {
  const [c, setC] = useState(null)
  const ask = msg => new Promise(r => setC({ msg, r }))
  const UI = c ? (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', zIndex: 8000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 28, maxWidth: 340,
        textAlign: 'center', direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,.25)'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          margin: '0 auto 14px'
        }}>🗑️</div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>تأكيد الحذف</h3>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 22, lineHeight: 1.5 }}>{c.msg}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => { c.r(true); setC(null) }}
            style={{
              background: '#EF4444', color: 'white', border: 'none', borderRadius: 8,
              padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit'
            }}>نعم، احذف</button>
          <button onClick={() => { c.r(false); setC(null) }}
            style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
              padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', color: '#64748B'
            }}>إلغاء</button>
        </div>
      </div>
    </div>
  ) : null
  return [ask, UI]
}

/* ─── ألوان ─── */
const CLR = {
  primary: '#1E293B',
  accent: '#F97316',
  accentDk: '#EA6C0A',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSm: '#64748B',
  danger: '#EF4444',
  success: '#10B981',
  warn: '#F59E0B',
  info: '#3B82F6',
}

const S = {
  card: {
    background: CLR.white, borderRadius: 12, padding: 20, marginBottom: 18,
    boxShadow: '0 1px 8px rgba(0,0,0,.07)', border: `1px solid ${CLR.border}`
  },
  input: {
    background: CLR.bg, border: `1.5px solid ${CLR.border}`, borderRadius: 8,
    padding: '10px 14px', width: '100%', fontFamily: 'inherit', fontSize: 14,
    outline: 'none', color: CLR.text, transition: 'border-color .2s'
  },
  label: { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: CLR.textSm },
  btn: {
    background: `linear-gradient(135deg,${CLR.accent},${CLR.accentDk})`, color: 'white',
    padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: 14, fontFamily: 'inherit', transition: 'opacity .2s',
    display: 'inline-flex', alignItems: 'center', gap: 6
  },
  btnGray: {
    background: CLR.bg, color: CLR.textSm, padding: '10px 22px',
    borderRadius: 8, border: `1px solid ${CLR.border}`, cursor: 'pointer',
    fontWeight: 600, fontFamily: 'inherit'
  },
  btnSm: {
    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit'
  },
  th: {
    padding: '10px 12px', textAlign: 'right', background: '#F1F5F9',
    fontWeight: 700, fontSize: 12, color: '#475569',
    border: '1px solid #CBD5E1', whiteSpace: 'nowrap'
  },
  td: {
    padding: '10px 12px', textAlign: 'right', fontSize: 13,
    border: '1px solid #E2E8F0', verticalAlign: 'middle', background: 'white'
  },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 },
}

/* ─── طباعة ─── */
function printThermal(content) {
  const w = window.open('', '_blank', 'width=350,height=600')
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
  const w = window.open('', '_blank')
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
   🔐 تسجيل الدخول
══════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [code, setCode] = useState('')
  const [userData, setUserData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const step1 = async () => {
    setErr(''); setLoading(true)
    if (email.trim() === ADMIN_EMAIL && hashPwd(pass) === ADMIN_PASS_HASH) {
      setUserData({ name: 'المدير', email: ADMIN_EMAIL, role: 'admin', permissions: [] })
      setStep(2); setLoading(false); return
    }
    const { data } = await supabase.from('employees').select('*').eq('username', email.trim()).maybeSingle()
    if (data && data.password === hashPwd(pass)) {
      let perms = data.permissions
      try { perms = typeof perms === 'string' ? JSON.parse(perms) : (perms || []) } catch { perms = [] }
      setUserData({ name: data.name, email: data.email, role: data.role, permissions: perms })
      setStep(2)
    } else { setErr('البريد أو كلمة المرور غير صحيحة') }
    setLoading(false)
  }

  const step2 = () => {
    if (code !== TWO_FA_CODE) { setErr('كود التحقق غير صحيح'); return }
    onLogin(userData)
  }

  if (step === 2) return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B,#0F172A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl'
    }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40 }}>🔐</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', marginTop: 8 }}>التحقق الثنائي</h2>
          <p style={{ color: CLR.textSm, fontSize: 14, marginTop: 4 }}>أدخل كود التحقق 6789</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {['', '', '', ''].map((_, i) => (
            <input key={i} id={`otp-${i}`} maxLength={1} inputMode="numeric"
              value={code[i] || ''}
              onChange={e => {
                const v = e.target.value.replace(/\D/, '')
                const arr = code.split('')
                arr[i] = v; setCode(arr.join(''))
                if (v && i < 3) document.getElementById(`otp-${i + 1}`)?.focus()
              }}
              onKeyDown={e => { if (e.key === 'Backspace' && !code[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus() }}
              style={{
                width: 56, height: 60, border: '2px solid #e2e8f0', borderRadius: 12,
                textAlign: 'center', fontSize: 24, fontWeight: 900, outline: 'none',
                background: '#f8fafc', fontFamily: 'inherit'
              }}
            />
          ))}
        </div>
        {err && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 14, background: '#fef2f2', padding: '10px', borderRadius: 10, textAlign: 'center' }}>{err}</div>}
        <button style={{ ...S.btn, width: '100%', padding: '14px', fontSize: 16 }} onClick={step2}>✅ تأكيد الدخول</button>
        <button onClick={() => { setStep(1); setCode(''); setErr('') }} style={{ ...S.btnGray, width: '100%', marginTop: 10, padding: '12px' }}>← رجوع</button>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B,#0F172A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl'
    }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>🛍️</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', marginTop: 8 }}>نقاء</h1>
          <p style={{ color: CLR.textSm, fontSize: 14 }}>لوحة الإدارة</p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>البريد الإلكتروني</label>
          <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && step1()} autoComplete="email" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>كلمة المرور</label>
          <input style={S.input} type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && step1()} autoComplete="current-password" />
        </div>
        {err && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 14, background: '#fef2f2', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}
        <button style={{ ...S.btn, width: '100%', padding: '14px', fontSize: 16 }} onClick={step1} disabled={loading}>
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
  const [stats, setStats] = useState({ products: 0, orders: 0, sales: 0, profit: 0, todaySales: 0, lastMonthSales: 0, thisMonthSales: 0 })
  const [recent, setRecent] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [weekData, setWeekData] = useState([0, 0, 0, 0, 0, 0, 0])

  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: ords }, { data: purcs }, { data: exps }] = await Promise.all([
        supabase.from('products').select('id,name,stock,min_stock'),
        supabase.from('orders').select('*').order('id', { ascending: false }),
        supabase.from('purchases').select('total'),
        supabase.from('expenses').select('amount'),
      ])
      const now = new Date()
      const thisMonth = now.getMonth(); const thisYear = now.getFullYear()
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
      const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear
      const today = now.toLocaleDateString()
      const todayO = (ords || []).filter(o => new Date(o.created_at || o.date).toLocaleDateString() === today)
      const sales = (ords || []).reduce((s, o) => s + Number(o.total), 0)
      const pur = (purcs || []).reduce((s, p) => s + Number(p.total), 0)
      const exp = (exps || []).reduce((s, e) => s + Number(e.amount), 0)
      const week7 = Array(7).fill(0)
      ;(ords || []).forEach(o => {
        const d = new Date(o.created_at || o.date)
        const diff = Math.floor((now - d) / 86400000)
        if (diff >= 0 && diff < 7) week7[6 - diff] += Number(o.total)
      })
      const thisM = (ords || []).filter(o => { const d = new Date(o.created_at || o.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear }).reduce((s, o) => s + Number(o.total), 0)
      const lastM = (ords || []).filter(o => { const d = new Date(o.created_at || o.date); return d.getMonth() === lastMonth && d.getFullYear() === lastYear }).reduce((s, o) => s + Number(o.total), 0)
      setStats({
        products: (prods || []).length, orders: (ords || []).length, sales, profit: sales - pur - exp,
        todaySales: todayO.reduce((s, o) => s + Number(o.total), 0),
        thisMonthSales: thisM, lastMonthSales: lastM
      })
      setRecent((ords || []).slice(0, 8))
      const minStk = p => (p.min_stock || 5)
      setLowStock((prods || []).filter(p => (p.stock || 0) < minStk(p)))
      setWeekData(week7)
    }
    load()
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: CLR.text }}>لوحة القيادة</h1>
          <div style={{ fontSize: 12, color: CLR.textSm }}>{new Date().toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
        <div style={S.card}><div>📦 المنتجات</div><div style={{ fontSize: 22, fontWeight: 900 }}>{stats.products}</div></div>
        <div style={S.card}><div>📋 الطلبيات</div><div style={{ fontSize: 22, fontWeight: 900 }}>{stats.orders}</div></div>
        <div style={S.card}><div>💰 مبيعات اليوم</div><div style={{ fontSize: 22, fontWeight: 900, color: CLR.accent }}>{stats.todaySales.toFixed(0)} {CUR}</div></div>
        <div style={S.card}><div>📅 هذا الشهر</div><div style={{ fontSize: 22, fontWeight: 900, color: CLR.accent }}>{stats.thisMonthSales.toFixed(0)} {CUR}</div></div>
      </div>
      {lowStock.length > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
          <strong style={{ color: '#C2410C' }}>⚠️ مخزون منخفض — {lowStock.length} منتج</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {lowStock.map(p => (
              <span key={p.id} style={{ background: 'white', border: '1px solid #FED7AA', color: '#C2410C', padding: '2px 10px', borderRadius: 20, fontSize: 11 }}>{p.name} ({p.stock || 0})</span>
            ))}
          </div>
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14 }}>📋 آخر الطلبيات</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={S.th}>#</th><th style={S.th}>العميل</th><th style={S.th}>الهاتف</th><th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th></tr></thead>
            <tbody>{recent.map(o => (
              <tr key={o.id}>
                <td style={S.td}>{o.id}</td>
                <td style={S.td}>{o.customer_name}</td>
                <td style={S.td}>{o.phone || '—'}</td>
                <td style={S.td}>{Number(o.total).toFixed(0)} {CUR}</td>
                <td style={S.td}>{o.status || 'pending'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📦 المنتجات
══════════════════════════════════════════ */
function Products() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm()
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [brandFilter, setBrandFilter] = useState('')
  const [form, setForm] = useState({
    id: '', name: '', price: '', costPrice: '', cartonPrice: '',
    units: 12, stock: 0, minStock: 5, sku: '', brandId: '', categoryId: '',
    image: '', discount: 0, isPromo: false, description: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: b }, { data: c }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(p || []);
    setBrands(b || []);
    setCategories(c || []);
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.name.trim() || !form.price) { showToast('الاسم والسعر مطلوبان', 'error'); return }
    setSaving(true)
    const row = {
      id: form.id || Date.now(), name: form.name.trim(),
      price: parseFloat(form.price) || 0, cost_price: parseFloat(form.costPrice) || 0,
      carton_price: form.cartonPrice ? parseFloat(form.cartonPrice) : null,
      units: parseInt(form.units) || 12, stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.minStock) || 5,
      sku: form.sku || '', brand_id: form.brandId ? parseInt(form.brandId) : null,
      category_id: form.categoryId ? parseInt(form.categoryId) : null,
      image: form.image || null, is_promo: form.isPromo,
      description: form.description || '',
      discount: parseFloat(form.discount) || 0, disabled: false
    }
    const { error } = await supabase.from('products').upsert(row)
    if (error) { showToast('خطأ: ' + error.message, 'error'); setSaving(false); return }
    showToast(form.id ? '✅ تم التعديل' : '✅ تمت الإضافة')
    setForm({
      id: '', name: '', price: '', costPrice: '', cartonPrice: '', units: 12, stock: 0, minStock: 5,
      sku: '', brandId: '', categoryId: '', image: '', discount: 0, isPromo: false, description: ''
    })
    await load();
    setSaving(false)
  }

  const edit = p => {
    setForm({
      id: p.id, name: p.name, price: p.price || '', costPrice: p.cost_price || '',
      cartonPrice: p.carton_price || '', units: p.units || 12, stock: p.stock || 0,
      minStock: p.min_stock || 5, sku: p.sku || '', brandId: p.brand_id || '',
      categoryId: p.category_id || '', image: p.image || '', discount: p.discount || 0,
      isPromo: p.is_promo || false, description: p.description || ''
    })
  }

  const del = async id => {
    if (!await askConfirm('حذف هذا المنتج؟')) return
    await supabase.from('products').delete().eq('id', id)
    showToast('تم الحذف');
    await load()
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase())
    const matchBrand = !brandFilter || p.brand_id == brandFilter
    return matchSearch && matchBrand
  })

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>📦 المنتجات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: CLR.accent }}>{form.id ? '✏️ تعديل' : '➕ إضافة'} منتج</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المنتج *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>سعر البيع (قطعة) *</label><NumInput value={form.price} onChange={F('price')} /></div>
          <div><label style={S.label}>سعر الشراء (قطعة)</label><NumInput value={form.costPrice} onChange={F('costPrice')} /></div>
          <div><label style={S.label}>سعر الكرتون</label><NumInput value={form.cartonPrice} onChange={F('cartonPrice')} placeholder={autoCarton(form.costPrice, form.units)} /></div>
          <div><label style={S.label}>قطع في الكرتون</label><NumInput value={form.units} onChange={F('units')} /></div>
          <div><label style={S.label}>المخزون (كرتون)</label><NumInput value={form.stock} onChange={F('stock')} /></div>
          <div><label style={S.label}>الحد الأدنى</label><NumInput value={form.minStock} onChange={F('minStock')} /></div>
          <div><label style={S.label}>خصم %</label><NumInput value={form.discount} onChange={F('discount')} /></div>
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
            <input style={S.input} type="file" accept="image/*" onChange={e => {
              const r = new FileReader(); r.onload = ev => setForm(f => ({ ...f, image: ev.target.result })); r.readAsDataURL(e.target.files[0])
            }} /></div>
          {form.image && <img src={form.image} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />}
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="isPromo" checked={form.isPromo} onChange={e => setForm(f => ({ ...f, isPromo: e.target.checked }))} />
          <label htmlFor="isPromo" style={{ fontWeight: 700, cursor: 'pointer' }}>⚡ منتج ضمن العروض الخاصة</label>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving ? '⏳ حفظ...' : '💾 حفظ المنتج'}</button>
          <button style={S.btnGray} onClick={() => setForm({
            id: '', name: '', price: '', costPrice: '', cartonPrice: '', units: 12, stock: 0, minStock: 5,
            sku: '', brandId: '', categoryId: '', image: '', discount: 0, isPromo: false, description: ''
          })}>✖ إلغاء</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontWeight: 800 }}>قائمة المنتجات ({filtered.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...S.input, width: 180 }} placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...S.input, width: 130 }} value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
              <option value="">كل الماركات</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={S.th}>الصورة</th><th style={S.th}>الاسم</th><th style={S.th}>السعر</th><th style={S.th}>المخزون</th><th style={S.th}>الماركة</th><th style={S.th}>إجراءات</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={S.td}>{p.image ? <img src={p.image} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} /> : '📦'}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{p.name}</td>
                  <td style={{ ...S.td, color: CLR.accent }}>{p.price} {CUR}</td>
                  <td style={S.td}>{p.stock || 0} كرتون</td>
                  <td style={S.td}>{brands.find(b => b.id == p.brand_id)?.name || '—'}</td>
                  <td style={S.td}>
                    <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8', marginLeft: 5 }} onClick={() => edit(p)}>✏️</button>
                    <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626' }} onClick={() => del(p.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   📂 الفئات
══════════════════════════════════════════ */
function Categories() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null)
  const [name, setName] = useState('');
  const [image, setImage] = useState('')
  const load = async () => { const { data } = await supabase.from('categories').select('*').order('name'); setItems(data || []) }
  useEffect(() => { load() }, [])
  const save = async () => {
    if (!name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    if (editId) {
      await supabase.from('categories').update({ name: name.trim(), image: image || null }).eq('id', editId)
      showToast('✅ تم التعديل'); setEditId(null)
    } else {
      await supabase.from('categories').insert({ id: Date.now(), name: name.trim(), image: image || null })
      showToast('✅ تمت الإضافة')
    }
    setName('');
    setImage('');
    await load()
  }
  const startEdit = c => { setEditId(c.id); setName(c.name); setImage(c.image || '') }
  const cancel = () => { setEditId(null); setName(''); setImage('') }
  const del = async id => {
    if (!await askConfirm('حذف هذه الفئة؟')) return
    await supabase.from('categories').delete().eq('id', id);
    showToast('تم الحذف');
    await load()
  }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>📂 الفئات</h1>
      {editId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 440, direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 900, fontSize: 16 }}>✏️ تعديل الفئة</h3>
              <button onClick={cancel} style={{ background: CLR.bg, border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} />
            <label style={{ ...S.label, marginTop: 10 }}>صورة جديدة</label>
            <input style={S.input} type="file" accept="image/*" onChange={e => { const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(e.target.files[0]) }} />
            {image && <img src={image} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button style={S.btn} onClick={save}>💾 حفظ التعديل</button>
              <button style={S.btnGray} onClick={cancel}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10, color: CLR.accent }}>➕ إضافة فئة جديدة</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}><label style={S.label}>اسم الفئة *</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} /></div>
          <div style={{ flex: 1, minWidth: 160 }}><label style={S.label}>صورة</label>
            <input style={S.input} type="file" accept="image/*" onChange={e => { const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(e.target.files[0]) }} /></div>
          {image && <img src={image} style={{ width: 60, height: 45, borderRadius: 8, objectFit: 'cover' }} />}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button style={S.btn} onClick={save}>{editId ? '💾 حفظ التعديل' : '➕ إضافة'}</button>
          {editId && <button style={S.btnGray} onClick={cancel}>✖ إلغاء</button>}
        </div>
      </div>
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={S.th}>الصورة</th><th style={S.th}>الاسم</th><th style={S.th}>إجراءات</th></tr></thead>
          <tbody>{items.map((c, i) => (
            <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : CLR.bg, cursor: 'pointer' }} onClick={() => startEdit(c)}>
              <td style={S.td}>{c.image ? <img src={c.image} style={{ width: 56, height: 42, borderRadius: 8, objectFit: 'cover' }} /> : '📁'}</td>
              <td style={{ ...S.td, fontWeight: 700 }}>{c.name}</td>
              <td style={S.td} onClick={e => e.stopPropagation()}>
                <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8' }} onClick={() => startEdit(c)}>✏️</button>
                <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626', marginRight: 5 }} onClick={() => del(c.id)}>🗑️</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏷️ العلامات التجارية
══════════════════════════════════════════ */
function Brands() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null)
  const [name, setName] = useState('');
  const [image, setImage] = useState('')
  const load = async () => { const { data } = await supabase.from('brands').select('*').order('name'); setItems(data || []) }
  useEffect(() => { load() }, [])
  const save = async () => {
    if (!name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    if (editId) {
      await supabase.from('brands').update({ name: name.trim(), image: image || null }).eq('id', editId)
      showToast('✅ تم التعديل'); setEditId(null)
    } else {
      await supabase.from('brands').insert({ id: Date.now(), name: name.trim(), image: image || null })
      showToast('✅ تمت الإضافة')
    }
    setName('');
    setImage('');
    await load()
  }
  const del = async id => {
    if (!await askConfirm('حذف هذه العلامة؟')) return
    await supabase.from('brands').delete().eq('id', id);
    showToast('تم الحذف');
    await load()
  }
  const startEdit = b => { setEditId(b.id); setName(b.name); setImage(b.image || '') }
  const cancel = () => { setEditId(null); setName(''); setImage('') }
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>🏷️ العلامات التجارية</h1>
      {editId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 400, direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 900, fontSize: 16 }}>✏️ تعديل العلامة</h3>
              <button onClick={cancel} style={{ background: CLR.bg, border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} />
            <label style={{ ...S.label, marginTop: 10 }}>شعار جديد</label>
            <input style={S.input} type="file" accept="image/*" onChange={e => { const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(e.target.files[0]) }} />
            {image && <img src={image} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '8px auto 0' }} />}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button style={S.btn} onClick={save}>💾 حفظ التعديل</button>
              <button style={S.btnGray} onClick={cancel}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10, color: CLR.accent }}>➕ إضافة علامة جديدة</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}><label style={S.label}>اسم العلامة *</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} /></div>
          <div style={{ flex: 1, minWidth: 160 }}><label style={S.label}>شعار</label>
            <input style={S.input} type="file" accept="image/*" onChange={e => { const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(e.target.files[0]) }} /></div>
          {image && <img src={image} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button style={S.btn} onClick={save}>{editId ? '💾 حفظ التعديل' : '➕ إضافة'}</button>
          {editId && <button style={S.btnGray} onClick={cancel}>✖ إلغاء</button>}
        </div>
      </div>
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={S.th}>الشعار</th><th style={S.th}>الاسم</th><th style={S.th}>إجراءات</th></tr></thead>
          <tbody>{items.map((b, i) => (
            <tr key={b.id} style={{ background: i % 2 === 0 ? 'white' : CLR.bg, cursor: 'pointer' }} onClick={() => startEdit(b)}>
              <td style={S.td}>{b.image ? <img src={b.image} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : '🏷️'}</td>
              <td style={{ ...S.td, fontWeight: 700 }}>{b.name}</td>
              <td style={S.td} onClick={e => e.stopPropagation()}>
                <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8' }} onClick={() => startEdit(b)}>✏️</button>
                <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626', marginRight: 5 }} onClick={() => del(b.id)}>🗑️</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏭 الموردون
══════════════════════════════════════════ */
function Suppliers() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', phone: '', whatsapp: '', email: '', address: '' })
  const load = async () => { const { data } = await supabase.from('suppliers').select('*').order('name'); setItems(data || []) }
  useEffect(() => { load() }, [])
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const save = async () => {
    if (!form.name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    setSaving(true)
    await supabase.from('suppliers').upsert({ id: form.id || Date.now(), name: form.name.trim(), phone: form.phone, whatsapp: form.whatsapp, email: form.email, address: form.address })
    showToast(form.id ? '✅ تم التعديل' : '✅ تمت الإضافة')
    setForm({ id: '', name: '', phone: '', whatsapp: '', email: '', address: '' });
    await load();
    setSaving(false)
  }
  const edit = s => setForm({ id: s.id, name: s.name, phone: s.phone || '', whatsapp: s.whatsapp || '', email: s.email || '', address: s.address || '' })
  const del = async id => { if (!await askConfirm('حذف هذا المورد؟')) return; await supabase.from('suppliers').delete().eq('id', id); showToast('تم الحذف'); await load() }
  const filtered = items.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>🏭 الموردون</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: CLR.accent }}>{form.id ? '✏️ تعديل' : '➕ إضافة'} مورد</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} /></div>
          <div><label style={S.label}>واتساب</label><input style={S.input} value={form.whatsapp} onChange={F('whatsapp')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 حفظ'}</button>
          <button style={S.btnGray} onClick={() => setForm({ id: '', name: '', phone: '', whatsapp: '', email: '', address: '' })}>✖</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontWeight: 800 }}>الموردون ({filtered.length})</h3>
          <input style={{ ...S.input, width: 200 }} placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={S.th}>الاسم</th><th style={S.th}>الهاتف</th><th style={S.th}>واتساب</th><th style={S.th}>إجراءات</th></tr></thead>
            <tbody>{filtered.map(s => (
              <tr key={s.id}>
                <td style={{ ...S.td, fontWeight: 700 }}>{s.name}</td>
                <td style={S.td}>{s.phone || '—'}</td>
                <td style={S.td}>{s.whatsapp ? <a href={`https://wa.me/${s.whatsapp}`} target="_blank" style={{ color: '#25D366', fontWeight: 700 }}>💬 {s.whatsapp}</a> : '—'}</td>
                <td style={S.td}>
                  <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8' }} onClick={() => edit(s)}>✏️</button>
                  <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626', marginRight: 5 }} onClick={() => del(s.id)}>🗑️</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   👥 العملاء
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   👥 العملاء (مصحح)
══════════════════════════════════════════ */
function Customers() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', email: '', phone: '', address: '', password: '', tier: 'M1' })
  const [tierFilter, setTierFilter] = useState('all')
  const [tierSettings, setTierSettings] = useState({ m2: 5000, m3: 20000 })

  const load = async () => {
    const { data } = await supabase.from('customers').select('*').order('name')
    setItems(data || [])
  }
  useEffect(() => {
    load()
    supabase.from('settings').select('*').in('key', ['tier_m2_min', 'tier_m3_min']).then(({ data }) => {
      if (!data) return
      const m = {};
      data.forEach(r => (m[r.key] = parseFloat(r.value)))
      setTierSettings({ m2: m['tier_m2_min'] || 5000, m3: m['tier_m3_min'] || 20000 })
    })
  }, [])

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    setSaving(true)
    const ex = items.find(c => c.id == form.id)
    const { error } = await supabase.from('customers').upsert({
      id: form.id || Date.now(), name: form.name.trim(), email: form.email, phone: form.phone,
      address: form.address, tier: form.tier,
      password: form.password ? hashPwd(form.password) : (ex?.password || hashPwd('123456')),
      points: ex?.points || 0, created_at: ex?.created_at || new Date().toISOString()
    })
    if (error) { showToast('خطأ: ' + error.message, 'error'); setSaving(false); return }
    showToast(form.id ? '✅ تم التعديل' : '✅ تمت الإضافة')
    setForm({ id: '', name: '', email: '', phone: '', address: '', password: '', tier: 'M1' });
    await load();
    setSaving(false)
  }

  const edit = c => setForm({ id: c.id, name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', password: '', tier: c.tier || 'M1' })
  const del = async id => { if (!await askConfirm('حذف هذا العميل؟')) return; await supabase.from('customers').delete().eq('id', id); showToast('تم الحذف'); await load() }

  const tierLabel = t => ({ M1: '🥉 M1 عادي', M2: '🥈 M2 مميز', M3: '🥇 M3 VIP' }[t] || t)
  const filtered = items.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))

  return (
    <div>
      {ToastUI}
      {ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>👥 العملاء</h1>
      
      {/* بطاقات الرتب */}
      <div style={{ ...S.card, background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fcd34d' }}>
        <h3 style={{ fontWeight: 800, marginBottom: 12, color: '#92400e' }}>🏅 إعدادات تصنيف العملاء</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 12, textAlign: 'center', border: '2px solid #64748B' }}>
            <div style={{ fontWeight: 800, color: '#64748B' }}>🥉 M1 عادي</div>
            <div style={{ fontSize: 13 }}>من 0 دج</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: 12, textAlign: 'center', border: '2px solid #3b82f6' }}>
            <div style={{ fontWeight: 800, color: '#3b82f6' }}>🥈 M2 مميز</div>
            <div style={{ fontSize: 13 }}>من {tierSettings.m2} دج</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: 12, textAlign: 'center', border: '2px solid #f59e0b' }}>
            <div style={{ fontWeight: 800, color: '#f59e0b' }}>🥇 M3 VIP</div>
            <div style={{ fontSize: 13 }}>من {tierSettings.m3} دج</div>
          </div>
        </div>
      </div>

      {/* نموذج إضافة/تعديل */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: CLR.accent }}>{form.id ? '✏️ تعديل' : '➕ إضافة'} عميل</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={F('phone')} /></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
          <div><label style={S.label}>كلمة المرور</label><input style={S.input} type="password" value={form.password} onChange={F('password')} /></div>
          <div><label style={S.label}>الرتبة</label>
            <select style={S.input} value={form.tier} onChange={F('tier')}>
              <option value="M1">🥉 M1 — عميل عادي</option>
              <option value="M2">🥈 M2 — عميل مميز</option>
              <option value="M3">🥇 M3 — عميل VIP</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 حفظ'}</button>
          <button style={S.btnGray} onClick={() => setForm({ id: '', name: '', email: '', phone: '', address: '', password: '', tier: 'M1' })}>✖</button>
        </div>
      </div>

      {/* جدول العملاء - الجزء المصحح */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontWeight: 800 }}>العملاء ({filtered.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...S.input, width: 200 }} placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...S.input, width: 110 }} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              <option value="all">كل الرتب</option>
              <option value="M1">🥉 M1</option>
              <option value="M2">🥈 M2</option>
              <option value="M3">🥇 M3</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: CLR.bg }}>
                <th style={S.th}>الاسم</th>
                <th style={S.th}>الهاتف</th>
                <th style={S.th}>الرتبة</th>
                <th style={S.th}>المشتريات</th>
                <th style={S.th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.filter(c => tierFilter === 'all' || (c.tier || 'M1') === tierFilter).map((c, i) => {
                return (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : CLR.bg, cursor: 'pointer' }} onClick={() => edit(c)}>
                    <td style={{ ...S.td, fontWeight: 700 }}>
                      {c.name}
                      {c.email && <div style={{ fontSize: 11, color: CLR.textSm }}>{c.email}</div>}
                    </td>
                    <td style={S.td}>{c.phone || '—'}</td>
                    <td style={S.td}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#475569' }}>
                        {tierLabel(c.tier || 'M1')}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 700, color: CLR.accent }}>{Number(c.total_purchases || 0).toFixed(0)} {CUR}</td>
                    <td style={S.td} onClick={e => e.stopPropagation()}>
                      <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8' }} onClick={() => edit(c)}>✏️</button>
                      <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626', marginRight: 5 }} onClick={() => del(c.id)}>🗑️</button>
                    </td>
                  </tr>
                )
              })}
              {filtered.filter(c => tierFilter === 'all' || (c.tier || 'M1') === tierFilter).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 36, color: CLR.textSm }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>لا يوجد عملاء
                  </td>
                </tr>
              )}
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
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('id', { ascending: false })
    setItems(data || [])
  }, [])
  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    if (status === 'shipped' || status === 'delivered') {
      const { data: ord } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
      if (ord?.phone) {
        const msgs = {
          shipped: `🚚 طلبيتك رقم #${String(id).slice(-5)} في الطريق إليك!`,
          delivered: `✅ تم تسليم طلبيتك رقم #${String(id).slice(-5)} بنجاح!`
        }
        const wa = (ord.phone || '').replace(/\D/g, '')
        if (wa.length >= 9) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msgs[status])}`, '_blank')
      }
    }
    showToast('✅ تم تحديث الحالة');
    await load()
  }

  const printReceipt = o => {
    const its = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || [])
    printThermal(`<div class="center bold big">نقاء</div><div class="center">إيصال طلبية</div><div class="line"></div>
    <div class="row"><span>رقم الطلب:</span><span class="bold">${o.id}</span></div>
    <div class="row"><span>العميل:</span><span>${o.customer_name}</span></div>
    <div class="row"><span>الهاتف:</span><span>${o.phone || '—'}</span></div>
    <div class="row"><span>العنوان:</span><span>${o.address || '—'}</span></div>
    <div class="row"><span>التاريخ:</span><span>${o.date}</span></div><div class="line"></div>
    ${its.map(i => `<div class="row"><span>${i.name} ×${i.quantity}</span><span>${(i.price * i.quantity).toFixed(0)}</span></div>`).join('')}
    <div class="line"></div><div class="row total"><span>الإجمالي:</span><span>${Number(o.total).toFixed(0)} ${CUR}</span></div>`)
  }

  const filtered = items.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return String(o.id).includes(q) || o.customer_name?.toLowerCase().includes(q) || o.phone?.includes(q) || o.address?.toLowerCase().includes(q)
  })

  const statusColors = { pending: '#fef9c3', processing: '#dbeafe', shipped: '#e0e7ff', delivered: '#d1fae5' }
  const statusLabels = { pending: '⏳ انتظار', processing: '🔄 تجهيز', shipped: '🚚 شحن', delivered: '✅ تسليم' }

  return (
    <div>{ToastUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>📋 الطلبيات</h1>
      <div style={S.card}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <input style={{ ...S.input, flex: 1, minWidth: 160 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالرقم/الاسم/الهاتف..." />
          <select style={{ ...S.input, width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">تجهيز</option>
            <option value="shipped">شُحن</option>
            <option value="delivered">تسليم</option>
          </select>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: CLR.textSm }}>{filtered.length} طلبية — إجمالي: {filtered.reduce((s, o) => s + Number(o.total), 0).toFixed(0)} {CUR}</div>
      </div>
      <div style={S.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={S.th}>#</th><th style={S.th}>العميل</th><th style={S.th}>الهاتف</th><th style={S.th}>العنوان</th><th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th><th style={S.th}>إجراءات</th></tr></thead>
            <tbody>{filtered.map(o => (
              <tr key={o.id}>
                <td style={{ ...S.td, fontSize: 11, color: CLR.textSm }}>{o.id}</td>
                <td style={{ ...S.td, fontWeight: 700 }}>{o.customer_name}</td>
                <td style={S.td}>{o.phone || '—'}</td>
                <td style={{ ...S.td, fontSize: 12 }}>{o.address || '—'}</td>
                <td style={{ ...S.td, color: CLR.accent, fontWeight: 700 }}>{Number(o.total).toFixed(0)} {CUR}</td>
                <td style={S.td}><span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusColors[o.status] || '#f1f5f9' }}>{statusLabels[o.status] || o.status}</span></td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['processing', 'shipped', 'delivered'].map(s => (
                      <button key={s} style={{ ...S.btnSm, background: '#f1f5f9', color: CLR.textSm, fontSize: 11 }} onClick={() => updateStatus(o.id, s)}>
                        {{ processing: 'تجهيز', shipped: 'شحن', delivered: 'تسليم' }[s]}
                      </button>
                    ))}
                    <button style={{ ...S.btnSm, background: '#f0fdf4', color: '#059669' }} onClick={() => printReceipt(o)}>🖨️</button>
                    {o.phone && <a href={`https://wa.me/${o.phone.replace(/^0/, '213')}?text=مرحباً ${o.customer_name}، طلبكم رقم ${o.id} في الطريق`} target="_blank" style={{ ...S.btnSm, background: '#dcfce7', color: '#059669', textDecoration: 'none' }}>💬</a>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
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
  const [showToast, ToastUI] = useToast()
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('')

  const load = async () => {
    const { data } = await supabase.from('products').select('id,name,stock,price,cost_price,sku,units').order('name')
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const exportCSV = () => {
    const header = 'ID,اسم المنتج,الباركود,المخزون,السعر,سعر الشراء,قطع/كرتون'
    const rows = items.map(p => `${p.id},"${p.name}","${p.sku || ''}",${p.stock || 0},${p.price},${p.cost_price || 0},${p.units || 12}`)
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a');
    a.href = url;
    a.download = 'naqaa_inventory.csv';
    a.click()
    URL.revokeObjectURL(url)
    showToast('✅ تم تصدير المخزون')
  }

  const importCSV = e => {
    const file = e.target.files[0];
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const lines = ev.target.result.split('\n').slice(1)
      let updated = 0
      for (const line of lines) {
        const cols = line.split(',')
        if (cols.length < 4) continue
        const id = cols[0]?.trim()
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

  const filtered = items.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>{ToastUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>📦 المخزون</h1>
      <div style={S.card}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <input style={{ ...S.input, flex: 1, minWidth: 180 }} placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
          <button style={{ ...S.btnGray, background: CLR.success, color: 'white' }} onClick={exportCSV}>📥 تصدير Excel</button>
          <label style={{ ...S.btnGray, background: '#3b82f6', color: 'white', cursor: 'pointer', padding: '10px 22px', borderRadius: 30, fontWeight: 700, fontSize: 14 }}>
            📤 استيراد Excel
            <input type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={importCSV} />
          </label>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={S.th}>المنتج</th><th style={S.th}>الباركود</th><th style={S.th}>المخزون</th><th style={S.th}>الحالة</th><th style={S.th}>القيمة</th></tr></thead>
            <tbody>{filtered.map(p => (
              <tr key={p.id}>
                <td style={{ ...S.td, fontWeight: 700 }}>{p.name}</td>
                <td style={S.td}>{p.sku || '—'}</td>
                <td style={S.td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: (p.stock || 0) < 5 ? '#fee2e2' : (p.stock || 0) < 20 ? '#fef9c3' : '#d1fae5', color: (p.stock || 0) < 5 ? '#dc2626' : (p.stock || 0) < 20 ? '#b45309' : '#059669' }}>{p.stock || 0}</span></td>
                <td style={S.td}>{(p.stock || 0) < 5 ? '⚠️ منخفض' : (p.stock || 0) < 20 ? '⚡ متوسط' : '✅ جيد'}</td>
                <td style={S.td}>{((p.stock || 0) * Number(p.price)).toFixed(0)} {CUR}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontWeight: 700, color: '#3b82f6' }}>💰 إجمالي قيمة المخزون: {filtered.reduce((s, p) => s + (p.stock || 0) * Number(p.price), 0).toFixed(0)} {CUR}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   ⚙️ الإعدادات
══════════════════════════════════════════ */
function Settings({ showToast }) {
  const [form, setForm] = useState({
    store_name: 'نقاء', store_currency: 'دج',
    whatsapp_number: WA_DEFAULT, contact_whatsapp: WA_DEFAULT,
    free_shipping_threshold: '5000', shipping_cost: '500',
    tier_m2_min: '5000', tier_m3_min: '20000',
    tier_m1_discount: '0', tier_m2_discount: '5', tier_m3_discount: '10',
    maintenance_mode: '0', maintenance_msg: 'المتجر في طور التحديث، سنعود قريباً 🔧',
    terms_text: '', announce_bar: '',
    contact_hours: 'من 8 صباحاً إلى 10 مساءً', contact_address: '', contact_email: '',
  })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) { const map = {}; data.forEach(r => (map[r.key] = r.value)); setForm(f => ({ ...f, ...map })) }
    })
  }, [])
  const save = async () => {
    setSaving(true)
    await Promise.all(Object.entries(form).map(([key, value]) => supabase.from('settings').upsert({ key, value: String(value) })))
    showToast('✅ تم حفظ الإعدادات');
    setSaving(false)
  }
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>⚙️ إعدادات المتجر</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: CLR.accent }}>🏪 إعدادات عامة</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>اسم المتجر</label><input style={S.input} value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} /></div>
          <div><label style={S.label}>العملة</label><input style={S.input} value={form.store_currency} onChange={e => setForm(f => ({ ...f, store_currency: e.target.value }))} /></div>
          <div><label style={S.label}>رقم واتساب المتجر</label><input style={S.input} value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value, contact_whatsapp: e.target.value }))} /></div>
          <div><label style={S.label}>حد التوصيل المجاني</label><NumInput value={form.free_shipping_threshold} onChange={e => setForm(f => ({ ...f, free_shipping_threshold: e.target.value }))} /></div>
          <div><label style={S.label}>تكلفة التوصيل</label><NumInput value={form.shipping_cost} onChange={e => setForm(f => ({ ...f, shipping_cost: e.target.value }))} /></div>
          <div><label style={S.label}>ساعات العمل</label><input style={S.input} value={form.contact_hours} onChange={e => setForm(f => ({ ...f, contact_hours: e.target.value }))} /></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={S.label}>📢 شريط الإعلانات</label>
          <input style={S.input} value={form.announce_bar} onChange={e => setForm(f => ({ ...f, announce_bar: e.target.value }))} />
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: '#dc2626' }}>🏅 إعدادات تصنيف العملاء</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
          <div><label style={S.label}>M2 الحد الأدنى</label><NumInput value={form.tier_m2_min} onChange={e => setForm(f => ({ ...f, tier_m2_min: e.target.value }))} /></div>
          <div><label style={S.label}>M3 الحد الأدنى</label><NumInput value={form.tier_m3_min} onChange={e => setForm(f => ({ ...f, tier_m3_min: e.target.value }))} /></div>
          <div><label style={S.label}>خصم M1 %</label><NumInput value={form.tier_m1_discount} onChange={e => setForm(f => ({ ...f, tier_m1_discount: e.target.value }))} /></div>
          <div><label style={S.label}>خصم M2 %</label><NumInput value={form.tier_m2_discount} onChange={e => setForm(f => ({ ...f, tier_m2_discount: e.target.value }))} /></div>
          <div><label style={S.label}>خصم M3 %</label><NumInput value={form.tier_m3_discount} onChange={e => setForm(f => ({ ...f, tier_m3_discount: e.target.value }))} /></div>
        </div>
      </div>
      <button style={{ ...S.btn, marginTop: 16 }} onClick={save} disabled={saving}>{saving ? '⏳ جاري الحفظ...' : '💾 حفظ جميع الإعدادات'}</button>
    </div>
  )
}

/* ══════════════════════════════════════════
   🏠 المكوّن الرئيسي
══════════════════════════════════════════ */
export default function Admin() {
  const [user, setUser] = useState(null)
  const [section, setSection] = useState('dashboard')
  const [showToast, ToastUI] = useToast()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('nq_admin')
    if (saved) try { setUser(JSON.parse(saved)) } catch { }
  }, [])

  const handleLogin = u => { setUser(u); sessionStorage.setItem('nq_admin', JSON.stringify(u)) }
  const handleLogout = () => { setUser(null); sessionStorage.removeItem('nq_admin') }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  const sections = [
    { id: 'dashboard', icon: '📊', label: 'لوحة القيادة' },
    { id: 'products', icon: '📦', label: 'المنتجات' },
    { id: 'categories', icon: '📂', label: 'الفئات' },
    { id: 'brands', icon: '🏷️', label: 'العلامات التجارية' },
    { id: 'suppliers', icon: '🏭', label: 'الموردون' },
    { id: 'customers', icon: '👥', label: 'العملاء' },
    { id: 'orders', icon: '📋', label: 'الطلبيات' },
    { id: 'inventory', icon: '🗂️', label: 'المخزون' },
    { id: 'settings', icon: '⚙️', label: 'الإعدادات' },
  ]

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <Dashboard />
      case 'products': return <Products />
      case 'categories': return <Categories />
      case 'brands': return <Brands />
      case 'suppliers': return <Suppliers />
      case 'customers': return <Customers />
      case 'orders': return <Orders />
      case 'inventory': return <Inventory />
      case 'settings': return <Settings showToast={showToast} />
      default: return <Dashboard />
    }
  }

  return (
    <div dir="rtl" style={{ display: 'flex', minHeight: '100vh', background: CLR.bg }}>
      {ToastUI}
      <aside style={{
        width: collapsed ? 58 : 232, background: CLR.primary, height: '100vh', position: 'sticky', top: 0,
        transition: 'width .22s ease', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
      }}>
        <div style={{ padding: collapsed ? '14px 9px' : '14px 14px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize: collapsed ? 18 : 20, fontWeight: 900, color: 'white', whiteSpace: 'nowrap' }}>{collapsed ? 'ن' : 'نقاء'}</div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {sections.map(s => (
            <div key={s.id} onClick={() => setSection(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                background: section === s.id ? 'rgba(249,115,22,.2)' : 'transparent',
                color: section === s.id ? '#FB923C' : 'rgba(255,255,255,.7)'
              }}>
              <span>{s.icon}</span>
              {!collapsed && <span>{s.label}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <button onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
            <span>🚪</span> {!collapsed && 'خروج'}
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 22, overflowY: 'auto' }}>
        {renderSection()}
      </main>
    </div>
  )
}