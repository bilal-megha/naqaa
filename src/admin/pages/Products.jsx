/**
 * @file pages/Products.jsx
 * @description صفحة إدارة المنتجات مع Pagination و Lazy Loading للصور
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR } from '../constants.js'
import { logActivity, softDelete } from '../utils.js'
import { useToast } from '../hooks/useToast.jsx'
import { useConfirm } from '../hooks/useConfirm.jsx'
import { NumInput } from '../components/FormControls.jsx'

const PAGE_SIZE = 20

/* ─── مكوّن صورة بـ Lazy Loading ─── */
function LazyImage({ src, alt, style }) {
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} style={{ ...style, background: loaded ? 'transparent' : '#F1F5F9', overflow: 'hidden' }}>
      {inView && src && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity .3s', display: 'block' }}
        />
      )}
      {(!inView || !loaded) && !src && (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
      )}
    </div>
  )
}

/* ─── نموذج المنتج الافتراضي ─── */
const DEFAULT_FORM = {
  id: '', name: '', price: '', costPrice: '', cartonPrice: '',
  units: 12, stock: 0, minStock: 5, sku: '', brandId: '',
  image: '', discount: 0, isPromo: false, description: '',
}

export default function Products() {
  const [showToast, ToastUI]   = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [products,    setProducts]    = useState([])
  const [brands,      setBrands]      = useState([])
  const [categories,  setCategories]  = useState([])
  const [selCats,     setSelCats]     = useState([])
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [brandFilter, setBrandFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [form,        setForm]        = useState(DEFAULT_FORM)
  const [showModal,   setShowModal]   = useState(false)

  // ─── Pagination ───
  const [page,       setPage]       = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // حساب الإجمالي للـ Pagination
      const countQuery = supabase.from('products').select('id', { count: 'exact', head: true })
      if (search)      countQuery.ilike('name', `%${search}%`)
      if (brandFilter) countQuery.eq('brand_id', brandFilter)
      const { count } = await countQuery
      setTotalCount(count || 0)

      // جلب الصفحة الحالية
      let query = supabase.from('products').select('*').order('name')
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      if (search)      query = query.ilike('name', `%${search}%`)
      if (brandFilter) query = query.eq('brand_id', brandFilter)
      if (stockFilter === 'low') query = query.lt('stock', 5)
      if (stockFilter === 'ok')  query = query.gte('stock', 5)

      const [{ data: p }, { data: b }, { data: c }] = await Promise.all([
        query,
        supabase.from('brands').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ])
      setProducts(p || [])
      setBrands(b || [])
      setCategories(c || [])
    } catch (err) {
      console.error('❌ خطأ في تحميل المنتجات:', err)
      showToast('❌ خطأ في تحميل المنتجات', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, brandFilter, stockFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, brandFilter, stockFilter])

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const handleImg = e => {
    const r = new FileReader()
    r.onload = ev => setForm(f => ({ ...f, image: ev.target.result }))
    r.readAsDataURL(e.target.files[0])
  }
  const generateBarcode = id => `NAQ-${String(id).padStart(6, '0')}`

  const save = async () => {
    if (!form.name.trim() || !form.price) { showToast('الاسم والسعر مطلوبان', 'error'); return }
    setSaving(true)
    try {
      const row = {
        id: form.id || Date.now(),
        name: form.name.trim(), price: parseFloat(form.price) || 0,
        cost_price: parseFloat(form.costPrice) || 0,
        carton_price: form.cartonPrice ? parseFloat(form.cartonPrice) : null,
        units: parseInt(form.units) || 12, stock: parseInt(form.stock) || 0,
        min_stock: parseInt(form.minStock) || 5,
        sku: form.sku || generateBarcode(form.id || Date.now()),
        brand_id: form.brandId ? parseInt(form.brandId) : null,
        image: form.image || null, is_promo: form.isPromo,
        description: form.description || '',
        discount: parseFloat(form.discount) || 0, disabled: false,
      }
      if (!form.id) row.created_at = new Date().toISOString()

      const { error } = await supabase.from('products').upsert(row)
      if (error) { showToast('خطأ: ' + error.message, 'error'); return }

      if (form.id) await supabase.from('product_categories').delete().eq('product_id', row.id)
      if (selCats.length > 0) {
        await supabase.from('product_categories').upsert(
          selCats.map(cid => ({ id: Date.now() + Math.random(), product_id: row.id, category_id: cid }))
        ).catch(() => {})
      }

      await logActivity(form.id ? 'تعديل منتج' : 'إضافة منتج', `${form.id ? 'تم تعديل' : 'تم إضافة'} المنتج: ${form.name}`)
      showToast(form.id ? '✅ تم التعديل' : '✅ تمت الإضافة')
      setForm(DEFAULT_FORM); setSelCats([]); setShowModal(false)
      await load()
    } catch (err) {
      showToast('❌ حدث خطأ غير متوقع', 'error')
    } finally {
      setSaving(false)
    }
  }

  const edit = async p => {
    setForm({
      id: p.id, name: p.name, price: p.price || '', costPrice: p.cost_price || '',
      cartonPrice: p.carton_price || '', units: p.units || 12, stock: p.stock || 0,
      minStock: p.min_stock || 5, sku: p.sku || generateBarcode(p.id),
      brandId: p.brand_id || '', image: p.image || '', discount: p.discount || 0,
      isPromo: p.is_promo || false, description: p.description || '',
    })
    const { data } = await supabase.from('product_categories').select('category_id').eq('product_id', p.id)
    setSelCats((data || []).map(r => r.category_id))
    setShowModal(true)
  }

  const del = async id => { await softDelete('products', id, products, setProducts, load, showToast, askConfirm) }
  const toggleCat = id => setSelCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const stockStyle = lvl => ({ low: { bg: '#FEE2E2', color: '#DC2626' }, med: { bg: '#FEF9C3', color: '#92400E' }, ok: { bg: '#D1FAE5', color: '#059669' } }[lvl])

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>📦 المنتجات</h1>

      {/* أزرار الإضافة والفلاتر */}
      <div style={{ ...S.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontWeight: 800, fontSize: 15 }}>
            قائمة المنتجات
            <span style={{ marginRight: 8, background: CLR.bg, border: '1px solid #E2E8F0', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600, color: CLR.textSm }}>
              {totalCount}
            </span>
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ ...S.input, width: 180 }} placeholder="🔍 بحث بالاسم..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...S.input, width: 130 }} value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
              <option value="">كل الماركات</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select style={{ ...S.input, width: 120 }} value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
              <option value="all">كل المخزون</option>
              <option value="low">منخفض (&lt;5)</option>
              <option value="ok">متوفر</option>
            </select>
            <button style={S.btn} onClick={() => { setForm(DEFAULT_FORM); setSelCats([]); setShowModal(true) }}>➕ إضافة منتج</button>
          </div>
        </div>

        {/* جدول المنتجات */}
        {loading ? (
          <div style={{ padding: 40 }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 48, background: '#F1F5F9', borderRadius: 8, marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: CLR.bg }}>
                  <th style={S.th}>الصورة</th><th style={S.th}>الاسم</th>
                  <th style={S.th}>السعر</th><th style={S.th}>الكرتون</th>
                  <th style={S.th}>المخزون</th><th style={S.th}>الماركة</th>
                  <th style={S.th}>الباركود</th><th style={S.th}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const stk = (p.stock || 0) < 5 ? 'low' : (p.stock || 0) < 20 ? 'med' : 'ok'
                  const ss = stockStyle(stk)
                  return (
                    <tr key={p.id} className="nq-tr" style={{ background: i % 2 === 0 ? 'white' : CLR.bg, cursor: 'pointer' }} onClick={() => edit(p)}>
                      <td style={S.td}>
                        <LazyImage src={p.image} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} />
                      </td>
                      <td style={{ ...S.td, fontWeight: 700, maxWidth: 200 }}>
                        <div>{p.name}</div>
                        {p.is_promo && <span style={{ background: '#FEF9C3', color: '#92400E', padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>عرض</span>}
                      </td>
                      <td style={{ ...S.td, fontWeight: 700, color: CLR.accent }}>{p.price} {CUR}</td>
                      <td style={{ ...S.td, color: CLR.textSm }}>{p.carton_price ? `${p.carton_price} ${CUR}` : '—'}</td>
                      <td style={S.td}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color }}>
                          {p.stock || 0} كرتون
                        </span>
                      </td>
                      <td style={{ ...S.td, color: CLR.textSm }}>{brands.find(b => b.id == p.brand_id)?.name || '—'}</td>
                      <td style={{ ...S.td, fontSize: 11, color: CLR.textSm }}><code>{p.sku || generateBarcode(p.id)}</code></td>
                      <td style={S.td} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8' }} onClick={() => edit(p)}>✏️</button>
                          <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626' }} onClick={() => del(p.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {products.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 36, color: CLR.textSm }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>لا توجد منتجات
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <button style={{ ...S.btnSm, background: page === 1 ? '#E2E8F0' : CLR.accent, color: page === 1 ? CLR.textSm : 'white' }}
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              ← السابق
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button key={pg}
                  style={{ ...S.btnSm, background: pg === page ? CLR.accent : 'white', color: pg === page ? 'white' : CLR.textSm, border: `1px solid ${pg === page ? CLR.accent : CLR.border}` }}
                  onClick={() => setPage(pg)}>
                  {pg}
                </button>
              )
            })}
            <button style={{ ...S.btnSm, background: page === totalPages ? '#E2E8F0' : CLR.accent, color: page === totalPages ? CLR.textSm : 'white' }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              التالي →
            </button>
            <span style={{ fontSize: 12, color: CLR.textSm }}>صفحة {page} من {totalPages}</span>
          </div>
        )}
      </div>

      {/* Modal إضافة/تعديل المنتج */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 900, fontSize: 17 }}>{form.id ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}</h3>
              <button onClick={() => { setShowModal(false); setForm(DEFAULT_FORM); setSelCats([]) }}
                style={{ background: CLR.bg, border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>اسم المنتج *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
              <div><label style={S.label}>سعر البيع *</label><NumInput value={form.price} onChange={F('price')} /></div>
              <div><label style={S.label}>سعر الشراء/قطعة</label><NumInput value={form.costPrice} onChange={F('costPrice')} /></div>
              <div><label style={S.label}>سعر الكرتون</label><NumInput value={form.cartonPrice} onChange={F('cartonPrice')} /></div>
              <div><label style={S.label}>قطع/كرتون</label><NumInput value={form.units} onChange={F('units')} /></div>
              <div><label style={S.label}>المخزون (قطعة)</label><NumInput value={form.stock} onChange={F('stock')} /></div>
              <div><label style={S.label}>الحد الأدنى للتنبيه</label><NumInput value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} /></div>
              <div><label style={S.label}>خصم %</label><NumInput value={form.discount} onChange={F('discount')} /></div>
              <div><label style={S.label}>الباركود / SKU</label><input style={S.input} value={form.sku} onChange={F('sku')} /></div>
              <div>
                <label style={S.label}>العلامة التجارية</label>
                <select style={S.input} value={form.brandId} onChange={F('brandId')}>
                  <option value="">-- بدون --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label style={S.label}>صورة المنتج (600×600)</label><input style={S.input} type="file" accept="image/*" onChange={handleImg} /></div>
              {form.image && <div style={{ display: 'flex', alignItems: 'center' }}><img src={form.image} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} /></div>}
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={S.label}>الفئات</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {categories.map(c => (
                  <button key={c.id} onClick={() => toggleCat(c.id)}
                    style={{ ...S.btnSm, background: selCats.includes(c.id) ? CLR.accent : '#E2E8F0', color: selCats.includes(c.id) ? 'white' : CLR.textSm }}>
                    {selCats.includes(c.id) ? '✓ ' : ''}{c.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="isPromo" checked={form.isPromo} onChange={e => setForm(f => ({ ...f, isPromo: e.target.checked }))} />
              <label htmlFor="isPromo" style={{ fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>⚡ منتج ضمن العروض الخاصة</label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button style={S.btn} onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 حفظ المنتج'}</button>
              <button style={S.btnGray} onClick={() => { setShowModal(false); setForm(DEFAULT_FORM); setSelCats([]) }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
