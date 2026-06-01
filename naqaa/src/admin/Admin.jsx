/**
 * Admin.jsx — لوحة إدارة نقاء
 * تستخدم Supabase عبر db.js بدلاً من localStorage
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import {
  cache, loadAll, dbInsert, dbUpdate, dbDelete, dbDeleteAll,
  syncTable, getSetting, setSetting, saveSettings
} from '../lib/db.js'

// ==================== Toast ====================
function useToast() {
  const show = (msg, isError = false) => {
    const t = document.createElement('div')
    t.className = 'toast' + (isError ? ' toast-error' : '')
    t.innerHTML = msg
    document.body.appendChild(t)
    setTimeout(() => t.remove(), 3500)
  }
  return show
}

// ==================== Modal ====================
function Modal({ show, onClose, title, children, width = 500 }) {
  if (!show) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: width }}>
        <div className="flex-between mb-4">
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#ef4444' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ==================== Confirm ====================
function useConfirm() {
  return (msg) => window.confirm(msg)
}

// ==================== كومبوننت رئيسي ====================
export default function Admin() {
  const toast   = useToast()
  const confirm = useConfirm()
  const [section, setSection]   = useState('dashboard')
  const [, forceRender]         = useState(0)
  const refresh = () => forceRender(n => n + 1)

  // إعادة تحميل عند التركيز على الصفحة (تزامن بين tabs)
  useEffect(() => {
    const onFocus = () => { loadAll().then(refresh) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    // الوضع المظلم
    if (localStorage.getItem('adminDarkMode') === 'true') document.body.classList.add('dark')
  }, [])

  const toggleDark = () => {
    document.body.classList.toggle('dark')
    localStorage.setItem('adminDarkMode', document.body.classList.contains('dark'))
  }

  // ==================== الأقسام ====================
  const sections = [
    { id: 'dashboard',    icon: 'fas fa-chart-line',      label: 'لوحة القيادة'   },
    { id: 'products',     icon: 'fas fa-boxes',            label: 'المنتجات'       },
    { id: 'categories',   icon: 'fas fa-folder',           label: 'الفئات'         },
    { id: 'brands',       icon: 'fas fa-tag',              label: 'العلامات'       },
    { id: 'suppliers',    icon: 'fas fa-truck',            label: 'الموردون'       },
    { id: 'customers',    icon: 'fas fa-users',            label: 'العملاء'        },
    { id: 'employees',    icon: 'fas fa-user-tie',         label: 'الموظفون'       },
    { id: 'coupons',      icon: 'fas fa-ticket-alt',       label: 'الكوبونات'      },
    { id: 'purchases',    icon: 'fas fa-shopping-cart',    label: 'المشتريات'      },
    { id: 'inventory',    icon: 'fas fa-warehouse',        label: 'المخزون'        },
    { id: 'orders',       icon: 'fas fa-truck-fast',       label: 'الطلبيات'       },
    { id: 'notifications',icon: 'fas fa-bell',             label: 'الإشعارات'      },
    { id: 'reports',      icon: 'fas fa-chart-simple',     label: 'التقارير'       },
    { id: 'expenses',     icon: 'fas fa-money-bill-wave',  label: 'المصاريف'       },
    { id: 'activityLog',  icon: 'fas fa-history',          label: 'سجل النشاطات'   },
    { id: 'settings',     icon: 'fas fa-cog',              label: 'الإعدادات'      },
  ]

  // ==================== الشريط الجانبي ====================
  const Sidebar = () => (
    <div style={{ position:'fixed', right:0, top:0, bottom:0, width:270, background:'white', borderLeft:'1px solid #e2e8f0', overflowY:'auto', zIndex:100, padding:'0 0 20px' }}>
      <style>{`
        body.dark .admin-sidebar { background:#1e293b !important; border-color:#334155 !important; }
        .sideitem { display:flex; align-items:center; gap:10px; padding:11px 18px; color:#475569; cursor:pointer; border-radius:12px; margin:3px 8px; transition:0.2s; font-size:14px; }
        .sideitem:hover,.sideitem.active { background:rgba(220,38,38,0.1); color:#dc2626; }
        body.dark .sideitem { color:#94a3b8; }
      `}</style>
      <div className="admin-sidebar" style={{ textAlign:'center', padding:'20px 16px', borderBottom:'1px solid #e2e8f0' }}>
        <i className="fas fa-store" style={{ fontSize:32, color:'#dc2626' }}></i>
        <div style={{ fontWeight:700, fontSize:18, marginTop:6 }}>نقاء — الإدارة</div>
        <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>المدير</div>
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:10 }}>
          <button onClick={toggleDark} style={{ padding:'4px 12px', borderRadius:20, background:'#e2e8f0', border:'none', cursor:'pointer', fontSize:12 }}>
            <i className="fas fa-moon"></i>
          </button>
          <a href="/" target="_blank" style={{ padding:'4px 12px', borderRadius:20, background:'#dc2626', color:'white', textDecoration:'none', fontSize:12 }}>
            <i className="fas fa-store"></i> المتجر
          </a>
        </div>
      </div>
      <nav style={{ padding:'8px 0' }}>
        {sections.map(s => (
          <div key={s.id} className={`sideitem${section === s.id ? ' active' : ''}`} onClick={() => setSection(s.id)}>
            <i className={s.icon} style={{ width:18, textAlign:'center' }}></i> {s.label}
          </div>
        ))}
      </nav>
    </div>
  )

  // ==================== محتوى الأقسام ====================
  const renderSection = () => {
    switch (section) {
      case 'dashboard':    return <Dashboard    toast={toast} />
      case 'products':     return <Products     toast={toast} confirm={confirm} refresh={refresh} />
      case 'categories':   return <Categories   toast={toast} confirm={confirm} refresh={refresh} />
      case 'brands':       return <Brands       toast={toast} confirm={confirm} refresh={refresh} />
      case 'suppliers':    return <Suppliers    toast={toast} confirm={confirm} refresh={refresh} />
      case 'customers':    return <Customers    toast={toast} confirm={confirm} refresh={refresh} />
      case 'employees':    return <Employees    toast={toast} confirm={confirm} refresh={refresh} />
      case 'coupons':      return <Coupons      toast={toast} confirm={confirm} refresh={refresh} />
      case 'purchases':    return <Purchases    toast={toast} confirm={confirm} refresh={refresh} />
      case 'inventory':    return <Inventory />
      case 'orders':       return <Orders       toast={toast} refresh={refresh} />
      case 'notifications':return <Notifications toast={toast} refresh={refresh} />
      case 'reports':      return <Reports />
      case 'expenses':     return <Expenses     toast={toast} confirm={confirm} refresh={refresh} />
      case 'activityLog':  return <ActivityLog />
      case 'settings':     return <Settings     toast={toast} />
      default:             return null
    }
  }

  return (
    <div dir="rtl">
      <Sidebar />
      <div style={{ marginRight: 270, padding: 24, minHeight: '100vh' }}>
        {renderSection()}
      </div>
    </div>
  )
}

// ==================== لوحة القيادة ====================
function Dashboard({ toast }) {
  const products  = cache.products
  const orders    = cache.orders
  const purchases = cache.purchases
  const expenses  = cache.expenses

  const totalSales     = orders.reduce((s, o) => s + Number(o.total), 0)
  const totalPurchases = purchases.reduce((s, p) => s + Number(p.total), 0)
  const totalExpenses  = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const profit         = totalSales - totalPurchases - totalExpenses
  const lowStock       = products.filter(p => (p.stock || 0) < 5)

  const stats = [
    { label: 'المنتجات',       value: products.length,        color: '#3b82f6', icon: 'fas fa-boxes' },
    { label: 'الطلبيات',       value: orders.length,          color: '#10b981', icon: 'fas fa-shopping-bag' },
    { label: 'إجمالي المبيعات',value: totalSales.toFixed(0)+' دج',  color: '#dc2626', icon: 'fas fa-coins' },
    { label: 'صافي الربح',     value: profit.toFixed(0)+' دج', color: profit >= 0 ? '#10b981' : '#ef4444', icon: 'fas fa-chart-line' },
  ]

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:24 }}>📊 لوحة القيادة</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-card" style={{ textAlign:'center', borderTop:`3px solid ${s.color}` }}>
            <i className={s.icon} style={{ fontSize:28, color:s.color, marginBottom:8 }}></i>
            <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {lowStock.length > 0 && (
        <div className="glass-card" style={{ background:'#fef2f2', borderRight:'4px solid #dc2626' }}>
          <i className="fas fa-exclamation-triangle" style={{ color:'#dc2626', marginLeft:8 }}></i>
          <strong>تنبيه مخزون منخفض:</strong> {lowStock.map(p => p.name).join(' | ')}
        </div>
      )}
      <div className="glass-card">
        <h3 style={{ fontWeight:700, marginBottom:12 }}>آخر 5 طلبيات</h3>
        <table>
          <thead><tr><th>#</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
          <tbody>
            {orders.slice(0,5).map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customerName}</td>
                <td>{Number(o.total).toFixed(0)} دج</td>
                <td><span style={{ padding:'2px 10px', borderRadius:20, fontSize:12, background: o.status==='delivered'?'#d1fae5':o.status==='shipped'?'#dbeafe':'#fef9c3' }}>{o.status==='pending'?'قيد الانتظار':o.status==='processing'?'تجهيز':o.status==='shipped'?'شُحن':'تسليم'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== المنتجات ====================
function Products({ toast, confirm, refresh }) {
  const [search, setSearch] = useState('')
  const [form, setForm]     = useState({ id:'', name:'', price:'', costPrice:'', cartonPrice:'', units:12, stock:0, sku:'', brandId:'', categoryId:'', image:'' })
  const [loading, setLoading] = useState(false)

  const filtered = cache.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const handleImg = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onload = ev => setForm(f => ({ ...f, image: ev.target.result }))
    r.readAsDataURL(file)
  }

  const save = async () => {
    if (!form.name || !form.price) { toast('الاسم والسعر مطلوبان', true); return }
    setLoading(true)
    const data = {
      id:          form.id || Date.now(),
      name:        form.name,
      price:       parseFloat(form.price) || 0,
      costPrice:   parseFloat(form.costPrice) || 0,
      cartonPrice: form.cartonPrice ? parseFloat(form.cartonPrice) : null,
      units:       parseInt(form.units) || 12,
      stock:       parseInt(form.stock) || 0,
      sku:         form.sku || '',
      brandId:     form.brandId ? parseInt(form.brandId) : null,
      categoryId:  form.categoryId ? parseInt(form.categoryId) : null,
      image:       form.image || null,
      isPromo:     false,
      disabled:    false,
      createdAt:   new Date().toISOString(),
    }
    await dbInsert('products', data)
    await loadAll(); refresh()
    setForm({ id:'', name:'', price:'', costPrice:'', cartonPrice:'', units:12, stock:0, sku:'', brandId:'', categoryId:'', image:'' })
    toast(form.id ? 'تم التعديل' : 'تم الإضافة')
    setLoading(false)
  }

  const edit = (p) => setForm({ id:p.id, name:p.name, price:p.price||'', costPrice:p.costPrice||'', cartonPrice:p.cartonPrice||'', units:p.units||12, stock:p.stock||0, sku:p.sku||'', brandId:p.brandId||'', categoryId:p.categoryId||'', image:p.image||'' })

  const del = async (id) => {
    if (!confirm('حذف المنتج؟')) return
    await dbDelete('products', id)
    await loadAll(); refresh()
    toast('تم الحذف')
  }

  const delAll = async () => {
    if (!confirm('حذف جميع المنتجات؟')) return
    await dbDeleteAll('products')
    await loadAll(); refresh()
    toast('تم حذف الكل')
  }

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>📦 المنتجات</h1>
      <div className="glass-card">
        <h3 style={{ fontWeight:700, marginBottom:16 }}>{form.id ? '✏️ تعديل' : '➕ إضافة'} منتج</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          <div><label>اسم المنتج *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
          <div><label>سعر البيع *</label><input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} /></div>
          <div><label>سعر الشراء</label><input type="number" value={form.costPrice} onChange={e=>setForm(f=>({...f,costPrice:e.target.value}))} /></div>
          <div><label>سعر الكرتون</label><input type="number" value={form.cartonPrice} onChange={e=>setForm(f=>({...f,cartonPrice:e.target.value}))} /></div>
          <div><label>حبات/كرتون</label><input type="number" value={form.units} onChange={e=>setForm(f=>({...f,units:e.target.value}))} /></div>
          <div><label>المخزون</label><input type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} /></div>
          <div><label>الباركود</label><input value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} /></div>
          <div>
            <label>العلامة التجارية</label>
            <select value={form.brandId} onChange={e=>setForm(f=>({...f,brandId:e.target.value}))}>
              <option value="">بدون</option>
              {cache.brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label>الفئة</label>
            <select value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))}>
              <option value="">بدون</option>
              {cache.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label>صورة المنتج</label><input type="file" accept="image/*" onChange={handleImg} /></div>
          {form.image && <div><img src={form.image} style={{ width:80, height:80, objectFit:'cover', borderRadius:12 }} /></div>}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
          <button className="btn-primary" onClick={save} disabled={loading}>{loading?'جاري الحفظ...':'💾 حفظ'}</button>
          <button onClick={()=>setForm({id:'',name:'',price:'',costPrice:'',cartonPrice:'',units:12,stock:0,sku:'',brandId:'',categoryId:'',image:''})} style={{ padding:'10px 20px', borderRadius:30, background:'#e2e8f0', border:'none', cursor:'pointer' }}>إلغاء</button>
          <button onClick={delAll} style={{ padding:'10px 20px', borderRadius:30, background:'#ef4444', color:'white', border:'none', cursor:'pointer' }}>🗑️ حذف الكل</button>
        </div>
      </div>
      <div className="glass-card">
        <div className="flex-between" style={{ marginBottom:12 }}>
          <h3 style={{ fontWeight:700 }}>قائمة المنتجات ({filtered.length})</h3>
          <input placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:200 }} />
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>الصورة</th><th>الاسم</th><th>السعر</th><th>المخزون</th><th>العلامة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td>{p.image ? <img src={p.image} style={{width:40,height:40,objectFit:'cover',borderRadius:8}} /> : '📷'}</td>
                  <td style={{ fontWeight:600 }}>{p.name}</td>
                  <td style={{ color:'#dc2626', fontWeight:700 }}>{p.price} دج</td>
                  <td><span style={{ padding:'2px 10px', borderRadius:20, fontSize:12, background:(p.stock||0)<5?'#fee2e2':'#d1fae5', color:(p.stock||0)<5?'#dc2626':'#059669' }}>{p.stock||0}</span></td>
                  <td>{cache.brands.find(b=>b.id==p.brandId)?.name || '-'}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="btn-sm" onClick={()=>edit(p)}><i className="fas fa-edit"></i></button>
                    <button className="btn-sm" onClick={()=>del(p.id)} style={{ background:'#fee2e2', color:'#dc2626' }}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'#64748b' }}>لا توجد منتجات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ==================== الفئات ====================
function Categories({ toast, confirm, refresh }) {
  const [name, setName]   = useState('')
  const [image, setImage] = useState('')
  const handleImg = e => { const r=new FileReader(); r.onload=ev=>setImage(ev.target.result); r.readAsDataURL(e.target.files[0]) }
  const add = async () => {
    if (!name) { toast('الاسم مطلوب', true); return }
    await dbInsert('categories', { id: Date.now(), name, image: image||null })
    await loadAll(); refresh(); setName(''); setImage(''); toast('تم الإضافة')
  }
  const del = async id => { if(!confirm('حذف؟')) return; await dbDelete('categories',id); await loadAll(); refresh() }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>📂 الفئات</h1>
      <div className="glass-card">
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1}}><label>اسم الفئة</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
          <div style={{flex:1}}><label>صورة</label><input type="file" accept="image/*" onChange={handleImg} /></div>
          <button className="btn-primary" onClick={add}>➕ إضافة</button>
        </div>
      </div>
      <div className="glass-card">
        <table><thead><tr><th>الصورة</th><th>الاسم</th><th>المنتجات</th><th>حذف</th></tr></thead>
        <tbody>{cache.categories.map(c=>(
          <tr key={c.id}>
            <td>{c.image?<img src={c.image} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}}/>:'📁'}</td>
            <td>{c.name}</td>
            <td>{cache.products.filter(p=>p.categoryId==c.id).length}</td>
            <td><button className="btn-sm" onClick={()=>del(c.id)} style={{background:'#fee2e2',color:'#dc2626'}}>حذف</button></td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  )
}

// ==================== العلامات التجارية ====================
function Brands({ toast, confirm, refresh }) {
  const [name, setName]   = useState('')
  const [image, setImage] = useState('')
  const handleImg = e => { const r=new FileReader(); r.onload=ev=>setImage(ev.target.result); r.readAsDataURL(e.target.files[0]) }
  const add = async () => {
    if (!name) { toast('الاسم مطلوب', true); return }
    await dbInsert('brands', { id: Date.now(), name, image: image||null })
    await loadAll(); refresh(); setName(''); setImage(''); toast('تم الإضافة')
  }
  const del = async id => { if(!confirm('حذف؟')) return; await dbDelete('brands',id); await loadAll(); refresh() }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>🏷️ العلامات التجارية</h1>
      <div className="glass-card">
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1}}><label>اسم العلامة</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
          <div style={{flex:1}}><label>صورة</label><input type="file" accept="image/*" onChange={handleImg} /></div>
          <button className="btn-primary" onClick={add}>➕ إضافة</button>
        </div>
      </div>
      <div className="glass-card">
        <table><thead><tr><th>الصورة</th><th>الاسم</th><th>المنتجات</th><th>حذف</th></tr></thead>
        <tbody>{cache.brands.map(b=>(
          <tr key={b.id}>
            <td>{b.image?<img src={b.image} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}}/>:'🏷️'}</td>
            <td>{b.name}</td>
            <td>{cache.products.filter(p=>p.brandId==b.id).length}</td>
            <td><button className="btn-sm" onClick={()=>del(b.id)} style={{background:'#fee2e2',color:'#dc2626'}}>حذف</button></td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  )
}

// ==================== الموردون ====================
function Suppliers({ toast, confirm, refresh }) {
  const [search, setSearch] = useState('')
  const [form, setForm]     = useState({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})
  const F = (k) => e => setForm(f => ({...f, [k]: e.target.value}))
  const filtered = cache.suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const save = async () => {
    if (!form.name) { toast('الاسم مطلوب', true); return }
    await dbInsert('suppliers', { id: form.id||Date.now(), name:form.name, phone:form.phone, whatsapp:form.whatsapp, email:form.email, address:form.address })
    await loadAll(); refresh(); setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''}); toast('تم الحفظ')
  }
  const edit = s => setForm({id:s.id,name:s.name,phone:s.phone||'',whatsapp:s.whatsapp||'',email:s.email||'',address:s.address||''})
  const del  = async id => { if(!confirm('حذف؟')) return; await dbDelete('suppliers',id); await loadAll(); refresh() }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>🏭 الموردون</h1>
      <div className="glass-card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          <div><label>الاسم *</label><input value={form.name} onChange={F('name')} /></div>
          <div><label>الهاتف</label><input value={form.phone} onChange={F('phone')} /></div>
          <div><label>واتساب</label><input value={form.whatsapp} onChange={F('whatsapp')} /></div>
          <div><label>البريد</label><input value={form.email} onChange={F('email')} /></div>
          <div><label>العنوان</label><input value={form.address} onChange={F('address')} /></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <button className="btn-primary" onClick={save}>💾 حفظ</button>
          <button onClick={()=>setForm({id:'',name:'',phone:'',whatsapp:'',email:'',address:''})} style={{padding:'10px 20px',borderRadius:30,background:'#e2e8f0',border:'none',cursor:'pointer'}}>إلغاء</button>
        </div>
      </div>
      <div className="glass-card">
        <div className="flex-between" style={{marginBottom:12}}>
          <h3 style={{fontWeight:700}}>قائمة الموردين</h3>
          <input placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:200}} />
        </div>
        <div className="overflow-x-auto">
          <table><thead><tr><th>الاسم</th><th>الهاتف</th><th>واتساب</th><th>البريد</th><th>الإجراءات</th></tr></thead>
          <tbody>{filtered.map(s=>(
            <tr key={s.id}>
              <td style={{fontWeight:600}}>{s.name}</td><td>{s.phone||'-'}</td><td>{s.whatsapp||'-'}</td><td>{s.email||'-'}</td>
              <td style={{display:'flex',gap:6}}>
                <button className="btn-sm" onClick={()=>edit(s)}><i className="fas fa-edit"></i></button>
                <button className="btn-sm" onClick={()=>del(s.id)} style={{background:'#fee2e2',color:'#dc2626'}}><i className="fas fa-trash"></i></button>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  )
}

// ==================== العملاء ====================
function Customers({ toast, confirm, refresh }) {
  const [search, setSearch] = useState('')
  const [form, setForm]     = useState({id:'',name:'',email:'',phone:'',address:'',password:''})
  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))
  const filtered = cache.customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const hashPwd  = p => { try { return CryptoJS.SHA256(p).toString() || p } catch { return p } }
  const save = async () => {
    if (!form.name) { toast('الاسم مطلوب',true); return }
    const existing = cache.customers.find(c=>c.id==form.id)
    await dbInsert('customers', { id:form.id||Date.now(), name:form.name, email:form.email, phone:form.phone, address:form.address, password: form.password ? hashPwd(form.password) : (existing?.password||hashPwd('123456')), points: existing?.points||0, createdAt: new Date().toISOString() })
    await loadAll(); refresh(); setForm({id:'',name:'',email:'',phone:'',address:'',password:''}); toast('تم الحفظ')
  }
  const edit = c => setForm({id:c.id,name:c.name,email:c.email||'',phone:c.phone||'',address:c.address||'',password:''})
  const del  = async id => { if(!confirm('حذف؟')) return; await dbDelete('customers',id); await loadAll(); refresh() }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>👥 العملاء</h1>
      <div className="glass-card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          <div><label>الاسم *</label><input value={form.name} onChange={F('name')} /></div>
          <div><label>البريد</label><input value={form.email} onChange={F('email')} /></div>
          <div><label>الهاتف</label><input value={form.phone} onChange={F('phone')} /></div>
          <div><label>العنوان</label><input value={form.address} onChange={F('address')} /></div>
          <div><label>كلمة المرور</label><input type="password" value={form.password} onChange={F('password')} /></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <button className="btn-primary" onClick={save}>💾 حفظ</button>
          <button onClick={()=>setForm({id:'',name:'',email:'',phone:'',address:'',password:''})} style={{padding:'10px 20px',borderRadius:30,background:'#e2e8f0',border:'none',cursor:'pointer'}}>إلغاء</button>
        </div>
      </div>
      <div className="glass-card">
        <div className="flex-between" style={{marginBottom:12}}>
          <h3 style={{fontWeight:700}}>قائمة العملاء ({filtered.length})</h3>
          <input placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:200}} />
        </div>
        <div className="overflow-x-auto">
          <table><thead><tr><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>النقاط</th><th>الإجراءات</th></tr></thead>
          <tbody>{filtered.map(c=>(
            <tr key={c.id}>
              <td style={{fontWeight:600}}>{c.name}</td><td>{c.email||'-'}</td><td>{c.phone||'-'}</td><td>{c.points||0}</td>
              <td style={{display:'flex',gap:6}}>
                <button className="btn-sm" onClick={()=>edit(c)}><i className="fas fa-edit"></i></button>
                <button className="btn-sm" onClick={()=>del(c.id)} style={{background:'#fee2e2',color:'#dc2626'}}><i className="fas fa-trash"></i></button>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  )
}

// ==================== الموظفون ====================
function Employees({ toast, confirm, refresh }) {
  const [form, setForm] = useState({name:'',username:'',password:'',email:''})
  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))
  const hashPwd = p => { try { return CryptoJS.SHA256(p).toString() || p } catch { return p } }
  const add = async () => {
    if (!form.name||!form.username||!form.password) { toast('جميع الحقول مطلوبة',true); return }
    await dbInsert('employees', { id:Date.now(), name:form.name, username:form.username, password:hashPwd(form.password), email:form.email, role:'staff' })
    await loadAll(); refresh(); setForm({name:'',username:'',password:'',email:''}); toast('تم الإضافة')
  }
  const del = async id => { if(!confirm('حذف؟')) return; await dbDelete('employees',id); await loadAll(); refresh() }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>👔 الموظفون</h1>
      <div className="glass-card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          <div><label>الاسم *</label><input value={form.name} onChange={F('name')} /></div>
          <div><label>اسم المستخدم *</label><input value={form.username} onChange={F('username')} /></div>
          <div><label>كلمة المرور *</label><input type="password" value={form.password} onChange={F('password')} /></div>
          <div><label>البريد</label><input value={form.email} onChange={F('email')} /></div>
        </div>
        <button className="btn-primary" style={{marginTop:14}} onClick={add}>➕ إضافة موظف</button>
      </div>
      <div className="glass-card">
        <table><thead><tr><th>الاسم</th><th>المستخدم</th><th>البريد</th><th>الدور</th><th>حذف</th></tr></thead>
        <tbody>{cache.employees.map(e=>(
          <tr key={e.id}>
            <td style={{fontWeight:600}}>{e.name}</td><td>{e.username}</td><td>{e.email||'-'}</td>
            <td><span style={{padding:'2px 10px',borderRadius:20,fontSize:12,background:e.role==='admin'?'#fee2e2':'#f0fdf4',color:e.role==='admin'?'#dc2626':'#059669'}}>{e.role==='admin'?'مدير':'موظف'}</span></td>
            <td>{e.role!=='admin' && <button className="btn-sm" onClick={()=>del(e.id)} style={{background:'#fee2e2',color:'#dc2626'}}>حذف</button>}</td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  )
}

// ==================== الكوبونات ====================
function Coupons({ toast, confirm, refresh }) {
  const [form, setForm] = useState({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0})
  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))
  const add = async () => {
    if (!form.code||!form.value) { toast('الكود والقيمة مطلوبان',true); return }
    await dbInsert('coupons', { id:Date.now(), code:form.code.toUpperCase(), type:form.type, value:parseFloat(form.value), expiry:form.expiry||null, maxUses:parseInt(form.maxUses)||100, minOrder:parseFloat(form.minOrder)||0, used:0 })
    await loadAll(); refresh(); setForm({code:'',type:'percent',value:'',expiry:'',maxUses:100,minOrder:0}); toast('تم الإضافة')
  }
  const del = async id => { if(!confirm('حذف؟')) return; await dbDelete('coupons',id); await loadAll(); refresh() }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>🎟️ الكوبونات</h1>
      <div className="glass-card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
          <div><label>الكود *</label><input value={form.code} onChange={F('code')} /></div>
          <div><label>النوع</label><select value={form.type} onChange={F('type')}><option value="percent">نسبة %</option><option value="fixed">مبلغ ثابت</option></select></div>
          <div><label>القيمة *</label><input type="number" value={form.value} onChange={F('value')} /></div>
          <div><label>تاريخ الانتهاء</label><input type="date" value={form.expiry} onChange={F('expiry')} /></div>
          <div><label>الحد الأقصى</label><input type="number" value={form.maxUses} onChange={F('maxUses')} /></div>
          <div><label>الحد الأدنى للطلب</label><input type="number" value={form.minOrder} onChange={F('minOrder')} /></div>
        </div>
        <button className="btn-primary" style={{marginTop:14}} onClick={add}>💾 إضافة كوبون</button>
      </div>
      <div className="glass-card">
        <table><thead><tr><th>الكود</th><th>النوع</th><th>القيمة</th><th>الاستخدامات</th><th>الانتهاء</th><th>حذف</th></tr></thead>
        <tbody>{cache.coupons.map(c=>(
          <tr key={c.id}>
            <td style={{fontWeight:700,color:'#dc2626'}}>{c.code}</td>
            <td>{c.type==='percent'?'نسبة':'ثابت'}</td>
            <td>{c.type==='percent'?`${c.value}%`:`${c.value} دج`}</td>
            <td>{c.used||0}/{c.maxUses}</td>
            <td>{c.expiry||'—'}</td>
            <td><button className="btn-sm" onClick={()=>del(c.id)} style={{background:'#fee2e2',color:'#dc2626'}}>حذف</button></td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  )
}

// ==================== المشتريات ====================
function Purchases({ toast, confirm, refresh }) {
  const [suppId, setSuppId]   = useState('')
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0])
  const [items, setItems]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modal, setModal]     = useState({ productId:'', cartons:1, unitsPerCarton:12, purchasePrice:0, sellPrice:0 })

  const calcTotal = () => items.reduce((s,i)=>s+i.totalPurchase,0)

  const openAdd = () => setShowModal(true)

  const addItem = () => {
    const prod = cache.products.find(p=>p.id==modal.productId)
    if (!prod||!modal.cartons||!modal.purchasePrice) { toast('اختر منتجاً وأدخل البيانات',true); return }
    const totalUnits    = modal.cartons * modal.unitsPerCarton
    const totalPurchase = totalUnits * modal.purchasePrice
    setItems(prev=>[...prev,{ id:Date.now(), productId:prod.id, productName:prod.name, cartons:modal.cartons, unitsPerCarton:modal.unitsPerCarton, totalUnits, purchasePrice:modal.purchasePrice, sellPrice:modal.sellPrice, totalPurchase }])
    setShowModal(false)
    setModal({ productId:'', cartons:1, unitsPerCarton:12, purchasePrice:0, sellPrice:0 })
  }

  const save = async () => {
    if (!suppId) { toast('اختر المورد',true); return }
    if (items.length===0) { toast('أضف منتجات',true); return }
    const supplier = cache.suppliers.find(s=>s.id==suppId)
    const purchase = { id:Date.now(), supplierId:parseInt(suppId), supplierName:supplier?.name||'', date, items, total:calcTotal() }
    await dbInsert('purchases', purchase)
    // تحديث المخزون
    for (const item of items) {
      const p = cache.products.find(p=>p.id==item.productId)
      if (p) await dbUpdate('products', p.id, { ...p, stock:(p.stock||0)+item.totalUnits })
    }
    await loadAll(); refresh(); setItems([]); setSuppId(''); toast('✅ تم حفظ الفاتورة')
  }

  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>🛒 المشتريات</h1>
      <div className="glass-card">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <label>المورد *</label>
            <select value={suppId} onChange={e=>setSuppId(e.target.value)}>
              <option value="">اختر مورداً</option>
              {cache.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label>التاريخ</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
        </div>
        {items.map((item,i)=>(
          <div key={item.id} style={{background:'#f8fafc',borderRadius:12,padding:12,marginTop:10,borderRight:'3px solid #dc2626',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><strong>{item.productName}</strong> — {item.cartons} كرتون × {item.unitsPerCarton} = <strong>{item.totalUnits} حبة</strong> — {item.totalPurchase.toFixed(2)} دج</div>
            <button onClick={()=>setItems(prev=>prev.filter((_,j)=>j!==i))} style={{background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:20,padding:'4px 12px',cursor:'pointer'}}>حذف</button>
          </div>
        ))}
        <div style={{marginTop:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={openAdd} style={{padding:'10px 20px',borderRadius:30,background:'#10b981',color:'white',border:'none',cursor:'pointer'}}>➕ إضافة منتج</button>
          <button className="btn-primary" onClick={save}>💾 حفظ الفاتورة</button>
          {items.length>0 && <span style={{fontWeight:700,color:'#dc2626',fontSize:18}}>💰 الإجمالي: {calcTotal().toFixed(2)} دج</span>}
        </div>
      </div>
      <Modal show={showModal} onClose={()=>setShowModal(false)} title="➕ إضافة منتج للفاتورة">
        <div style={{display:'grid',gap:12}}>
          <div>
            <label>المنتج</label>
            <select value={modal.productId} onChange={e=>{
              const p=cache.products.find(x=>x.id==e.target.value)
              setModal(m=>({...m, productId:e.target.value, unitsPerCarton:p?.units||12, purchasePrice:p?.costPrice||0, sellPrice:p?.price||0}))
            }}>
              <option value="">اختر منتجاً</option>
              {cache.products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label>عدد الكرتونات</label><input type="number" value={modal.cartons} onChange={e=>setModal(m=>({...m,cartons:parseInt(e.target.value)||1}))} /></div>
            <div><label>حبات/كرتون</label><input type="number" value={modal.unitsPerCarton} onChange={e=>setModal(m=>({...m,unitsPerCarton:parseInt(e.target.value)||12}))} /></div>
            <div><label>سعر شراء الحبة</label><input type="number" value={modal.purchasePrice} onChange={e=>setModal(m=>({...m,purchasePrice:parseFloat(e.target.value)||0}))} /></div>
            <div><label>سعر بيع الحبة</label><input type="number" value={modal.sellPrice} onChange={e=>setModal(m=>({...m,sellPrice:parseFloat(e.target.value)||0}))} /></div>
          </div>
          <div style={{background:'#f8fafc',borderRadius:12,padding:12}}>
            📦 إجمالي الحبات: <strong>{modal.cartons*modal.unitsPerCarton}</strong><br/>
            💰 إجمالي الشراء: <strong>{(modal.cartons*modal.unitsPerCarton*modal.purchasePrice).toFixed(2)} دج</strong>
          </div>
          <button className="btn-primary" onClick={addItem}>إضافة للفاتورة</button>
        </div>
      </Modal>
      <div className="glass-card" style={{marginTop:0}}>
        <h3 style={{fontWeight:700,marginBottom:12}}>سجل المشتريات</h3>
        <div className="overflow-x-auto">
          <table><thead><tr><th>#</th><th>المورد</th><th>التاريخ</th><th>الإجمالي</th><th>المنتجات</th></tr></thead>
          <tbody>{cache.purchases.map(p=>(
            <tr key={p.id}>
              <td style={{fontSize:11,color:'#94a3b8'}}>{p.id}</td>
              <td style={{fontWeight:600}}>{p.supplierName}</td>
              <td>{p.date}</td>
              <td style={{color:'#dc2626',fontWeight:700}}>{Number(p.total).toFixed(2)} دج</td>
              <td style={{fontSize:12}}>{(p.items||[]).length} منتج</td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  )
}

// ==================== المخزون ====================
function Inventory() {
  const [search, setSearch] = useState('')
  const filtered = cache.products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>📦 المخزون</h1>
      <div className="glass-card">
        <div className="flex-between" style={{marginBottom:12}}>
          <h3 style={{fontWeight:700}}>حالة المخزون</h3>
          <input placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:200}} />
        </div>
        <div className="overflow-x-auto">
          <table><thead><tr><th>المنتج</th><th>الكمية</th><th>الحالة</th></tr></thead>
          <tbody>{filtered.map(p=>(
            <tr key={p.id}>
              <td style={{fontWeight:600}}>{p.name}</td>
              <td><span style={{padding:'2px 12px',borderRadius:20,fontSize:13,background:(p.stock||0)<5?'#fee2e2':(p.stock||0)<20?'#fef9c3':'#d1fae5',color:(p.stock||0)<5?'#dc2626':(p.stock||0)<20?'#b45309':'#059669',fontWeight:700}}>{p.stock||0}</span></td>
              <td style={{fontSize:13}}>{(p.stock||0)<5?'⚠️ منخفض':(p.stock||0)<20?'⚡ متوسط':'✅ جيد'}</td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  )
}

// ==================== الطلبيات ====================
function Orders({ toast, refresh }) {
  const [search, setSearch] = useState('')
  const filtered = cache.orders.filter(o=>o.customerName?.toLowerCase().includes(search.toLowerCase()))
  const updateStatus = async (id, status) => {
    const o = cache.orders.find(x=>x.id==id)
    if (o) { await dbUpdate('orders',id,{...o,status}); await loadAll(); refresh(); toast('تم تحديث الحالة') }
  }
  const statusLabel = s => ({pending:'قيد الانتظار',processing:'تجهيز',shipped:'شُحن',delivered:'تسليم'}[s]||s)
  const statusColor = s => ({pending:'#fef9c3',processing:'#dbeafe',shipped:'#e0e7ff',delivered:'#d1fae5'}[s]||'#f1f5f9')
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>📋 الطلبيات</h1>
      <div className="glass-card">
        <div className="flex-between" style={{marginBottom:12}}>
          <h3 style={{fontWeight:700}}>الطلبيات ({filtered.length})</h3>
          <input placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:200}} />
        </div>
        <div className="overflow-x-auto">
          <table><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>{filtered.map(o=>(
            <tr key={o.id}>
              <td style={{fontSize:11}}>{o.id}</td>
              <td style={{fontWeight:600}}>{o.customerName}</td>
              <td>{o.customerPhone||'-'}</td>
              <td style={{fontSize:12}}>{o.date}</td>
              <td style={{color:'#dc2626',fontWeight:700}}>{Number(o.total).toFixed(0)} دج</td>
              <td><span style={{padding:'2px 10px',borderRadius:20,fontSize:12,background:statusColor(o.status)}}>{statusLabel(o.status)}</span></td>
              <td style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                <button className="btn-sm" style={{background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>updateStatus(o.id,'processing')}>تجهيز</button>
                <button className="btn-sm" style={{background:'#e0e7ff',color:'#4338ca'}} onClick={()=>updateStatus(o.id,'shipped')}>شحن</button>
                <button className="btn-sm" style={{background:'#d1fae5',color:'#059669'}} onClick={()=>updateStatus(o.id,'delivered')}>تسليم</button>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  )
}

// ==================== الإشعارات ====================
function Notifications({ toast, refresh }) {
  const [title, setTitle] = useState('')
  const [body,  setBody]  = useState('')
  const send = async () => {
    if (!title||!body) { toast('العنوان والنص مطلوبان',true); return }
    await dbInsert('notifications',{ id:Date.now(), title, body, date:new Date().toLocaleString(), isRead:false })
    await loadAll(); refresh(); setTitle(''); setBody(''); toast('تم الإرسال')
  }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>🔔 الإشعارات</h1>
      <div className="glass-card">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div><label>العنوان</label><input value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div><label>النص</label><input value={body} onChange={e=>setBody(e.target.value)} /></div>
        </div>
        <button className="btn-primary" style={{marginTop:14}} onClick={send}>📢 إرسال إشعار</button>
      </div>
      <div className="glass-card">
        {cache.notifications.length===0 && <p style={{textAlign:'center',color:'#64748b',padding:24}}>لا توجد إشعارات</p>}
        {cache.notifications.map(n=>(
          <div key={n.id} style={{borderBottom:'1px solid #f1f5f9',padding:'12px 0'}}>
            <div className="flex-between"><strong>{n.title}</strong><span style={{fontSize:12,color:'#94a3b8'}}>{n.date}</span></div>
            <p style={{fontSize:14,color:'#475569',marginTop:4}}>{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== التقارير ====================
function Reports() {
  const orders    = cache.orders
  const purchases = cache.purchases
  const expenses  = cache.expenses
  const totalSales = orders.reduce((s,o)=>s+Number(o.total),0)
  const totalPurch = purchases.reduce((s,p)=>s+Number(p.total),0)
  const totalExp   = expenses.reduce((s,e)=>s+Number(e.amount),0)
  const profit     = totalSales - totalPurch - totalExp

  const salesCount = {}
  orders.forEach(o=>(o.items||[]).forEach(i=>{ salesCount[i.name]=(salesCount[i.name]||0)+i.quantity }))
  const topProducts = Object.entries(salesCount).sort((a,b)=>b[1]-a[1]).slice(0,10)

  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>📊 التقارير</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,marginBottom:24}}>
        {[
          {label:'إجمالي المبيعات',value:totalSales.toFixed(0)+' دج',color:'#10b981'},
          {label:'إجمالي المشتريات',value:totalPurch.toFixed(0)+' دج',color:'#dc2626'},
          {label:'إجمالي المصاريف',value:totalExp.toFixed(0)+' دج',color:'#f59e0b'},
          {label:'صافي الربح',value:profit.toFixed(0)+' دج',color:profit>=0?'#10b981':'#ef4444'},
        ].map((s,i)=>(
          <div key={i} className="glass-card" style={{textAlign:'center',borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
            <div style={{fontSize:13,color:'#64748b'}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="glass-card">
        <h3 style={{fontWeight:700,marginBottom:12}}>🔥 أكثر المنتجات مبيعاً</h3>
        {topProducts.length===0 && <p style={{textAlign:'center',color:'#64748b'}}>لا توجد بيانات</p>}
        {topProducts.map(([name,qty],i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
            <span>#{i+1} {name}</span>
            <strong style={{color:'#dc2626'}}>{qty} قطعة</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== المصاريف ====================
function Expenses({ toast, confirm, refresh }) {
  const [form, setForm] = useState({name:'',amount:'',date:new Date().toISOString().split('T')[0],category:'other'})
  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))
  const [search, setSearch] = useState('')
  const filtered = cache.expenses.filter(e=>e.name?.toLowerCase().includes(search.toLowerCase()))
  const add = async () => {
    if (!form.name||!form.amount) { toast('الاسم والمبلغ مطلوبان',true); return }
    await dbInsert('expenses',{ id:Date.now(), name:form.name, amount:parseFloat(form.amount), date:form.date, category:form.category })
    await loadAll(); refresh(); setForm({name:'',amount:'',date:new Date().toISOString().split('T')[0],category:'other'}); toast('تم الإضافة')
  }
  const del = async id => { if(!confirm('حذف؟')) return; await dbDelete('expenses',id); await loadAll(); refresh() }
  const total = cache.expenses.reduce((s,e)=>s+Number(e.amount),0)
  const catLabel = {'rent':'إيجار','salary':'رواتب','utilities':'فواتير','other':'أخرى'}
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>💸 المصاريف</h1>
      <div className="glass-card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
          <div><label>الاسم *</label><input value={form.name} onChange={F('name')} /></div>
          <div><label>المبلغ *</label><input type="number" value={form.amount} onChange={F('amount')} /></div>
          <div><label>التاريخ</label><input type="date" value={form.date} onChange={F('date')} /></div>
          <div><label>الفئة</label><select value={form.category} onChange={F('category')}><option value="rent">إيجار</option><option value="salary">رواتب</option><option value="utilities">فواتير</option><option value="other">أخرى</option></select></div>
        </div>
        <button className="btn-primary" style={{marginTop:14}} onClick={add}>➕ إضافة مصروف</button>
      </div>
      <div className="glass-card">
        <div className="flex-between" style={{marginBottom:12}}>
          <h3 style={{fontWeight:700}}>قائمة المصاريف</h3>
          <input placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:180}} />
        </div>
        <div className="overflow-x-auto">
          <table><thead><tr><th>الاسم</th><th>المبلغ</th><th>الفئة</th><th>التاريخ</th><th>حذف</th></tr></thead>
          <tbody>{filtered.map(e=>(
            <tr key={e.id}>
              <td style={{fontWeight:600}}>{e.name}</td>
              <td style={{color:'#ef4444',fontWeight:700}}>{Number(e.amount).toFixed(0)} دج</td>
              <td>{catLabel[e.category]||e.category}</td>
              <td>{e.date}</td>
              <td><button className="btn-sm" onClick={()=>del(e.id)} style={{background:'#fee2e2',color:'#dc2626'}}>حذف</button></td>
            </tr>
          ))}</tbody></table>
        </div>
        <div style={{marginTop:12,fontWeight:700,color:'#ef4444',fontSize:16}}>💰 الإجمالي: {total.toFixed(0)} دج</div>
      </div>
    </div>
  )
}

// ==================== سجل النشاطات ====================
function ActivityLog() {
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>📋 سجل النشاطات</h1>
      <div className="glass-card" style={{maxHeight:500,overflowY:'auto'}}>
        {cache.activity_log.length===0 && <p style={{textAlign:'center',color:'#64748b',padding:24}}>لا توجد نشاطات</p>}
        {cache.activity_log.map(log=>(
          <div key={log.id} style={{borderBottom:'1px solid #f1f5f9',padding:'10px 0'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <strong style={{color:'#dc2626'}}>{log.action}</strong>
              <span style={{fontSize:11,color:'#94a3b8'}}>{log.date}</span>
            </div>
            <p style={{fontSize:13,color:'#475569',marginTop:2}}>{log.details}</p>
            <p style={{fontSize:11,color:'#94a3b8'}}>بواسطة: {log.employee}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== الإعدادات ====================
function Settings({ toast }) {
  const [form, setForm] = useState({ store_name:'', store_currency:'دج', whatsapp_number:'', free_shipping_threshold:'500' })
  const F = k => e => setForm(f=>({...f,[k]:e.target.value}))
  useEffect(() => {
    setForm({
      store_name:               cache.settings['store_name']              || 'نقاء',
      store_currency:           cache.settings['store_currency']          || 'دج',
      whatsapp_number:          cache.settings['whatsapp_number']         || '',
      free_shipping_threshold:  cache.settings['free_shipping_threshold'] || '500',
    })
  }, [])
  const save = async () => {
    await saveSettings(form)
    toast('✅ تم حفظ الإعدادات')
  }
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:20}}>⚙️ الإعدادات</h1>
      <div className="glass-card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
          <div><label>اسم المتجر</label><input value={form.store_name} onChange={F('store_name')} /></div>
          <div><label>العملة</label><input value={form.store_currency} onChange={F('store_currency')} /></div>
          <div><label>رقم واتساب</label><input value={form.whatsapp_number} onChange={F('whatsapp_number')} /></div>
          <div><label>حد التوصيل المجاني</label><input type="number" value={form.free_shipping_threshold} onChange={F('free_shipping_threshold')} /></div>
        </div>
        <button className="btn-primary" style={{marginTop:20}} onClick={save}>💾 حفظ الإعدادات</button>
      </div>
    </div>
  )
}
