/**
 * @file ProductMovement.jsx — تتبع حركة المنتج
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR } from '../styles/constants.js'
import useToast from '../hooks/useToast.jsx'

const TODAY = new Date().toISOString().split('T')[0]
const MONTH_AGO = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]

export default function ProductMovement() {
  const [showToast, ToastUI] = useToast()
  const [products, setProducts]   = useState([])
  const [selProd, setSelProd]     = useState('')
  const [dateFrom, setDateFrom]   = useState(MONTH_AGO)
  const [dateTo, setDateTo]       = useState(TODAY)
  const [movements, setMovements] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    supabase.from('products').select('id,name,stock,sku').order('name')
      .then(({ data }) => setProducts(data || []))
  }, [])

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.includes(search)
  )

  const analyze = useCallback(async () => {
    if (!selProd) { showToast('اختر منتجاً أولاً', 'error'); return }
    setLoading(true)
    try {
      const prod = products.find(p => p.id == selProd)
      // جلب الطلبيات التي تحتوي على هذا المنتج
      const { data: orders } = await supabase
        .from('orders')
        .select('id,customer_name,phone,address,items,total,status,pay_mode,created_at,invoice_num')
        .gte('created_at', dateFrom + 'T00:00:00')
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false })

      // جلب المشتريات التي تحتوي على هذا المنتج
      const { data: purch } = await supabase
        .from('purchases')
        .select('id,supplier_name,date,items,total,invoice_num')
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false })

      // فلترة الطلبيات
      const salesMoves = (orders || []).flatMap(o => {
        const items = typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
        const match = items.filter(i => String(i.product_id) === String(selProd))
        return match.map(i => ({
          type: 'sale',
          date: o.created_at?.split('T')[0] || '',
          who: o.customer_name || 'زبون عابر',
          phone: o.phone || '',
          invoiceNum: o.invoice_num || o.id,
          qty: i.qty,
          isCarton: i.is_carton,
          price: i.price,
          total: i.total,
          payMode: o.pay_mode,
          status: o.status,
        }))
      })

      // فلترة المشتريات
      const purchMoves = (purch || []).flatMap(p => {
        const items = typeof p.items === 'string' ? JSON.parse(p.items || '[]') : (p.items || [])
        const match = items.filter(i => String(i.productId) === String(selProd))
        return match.map(i => ({
          type: 'purchase',
          date: p.date || '',
          who: p.supplier_name || '—',
          invoiceNum: p.invoice_num || p.id,
          qty: i.cartons,
          isCarton: true,
          price: i.purchasePrice,
          cartonPrice: i.cartonPrice,
          total: i.totalPurchase,
        }))
      })

      setMovements(salesMoves)
      setPurchases(purchMoves)
    } catch (err) {
      showToast('❌ خطأ: ' + err.message, 'error')
    } finally {
      setLoading(false) }
  }, [selProd, dateFrom, dateTo, products])

  const prod = products.find(p => p.id == selProd)
  const totalSold = movements.reduce((s, m) => s + (m.isCarton ? m.qty * (products.find(p=>p.id==selProd)?.units||12) : m.qty), 0)
  const totalRevenue = movements.reduce((s, m) => s + m.total, 0)
  const totalPurchased = purchases.reduce((s, p) => s + (p.qty * (products.find(x=>x.id==selProd)?.units||12)), 0)
  const totalCost = purchases.reduce((s, p) => s + p.total, 0)

  return (
    <div dir="rtl">{ToastUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, color: CLR.text }}>📦 تتبع حركة المنتج</h1>

      {/* ── فلاتر ── */}
      <div style={S.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={S.label}>المنتج *</label>
            <div style={{ position: 'relative' }}>
              <input style={S.input} value={search}
                onChange={e => { setSearch(e.target.value); setSelProd('') }}
                placeholder="ابحث عن منتج..." />
              {search && !selProd && filtered.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, zIndex: 100, maxHeight: 220, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}>
                  {filtered.map(p => (
                    <div key={p.id} onClick={() => { setSelProd(p.id); setSearch(p.name) }}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.target.style.background = '#f8fafc'}
                      onMouseLeave={e => e.target.style.background = 'white'}>
                      {p.name}
                      {p.sku && <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 8 }}>#{p.sku}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={S.label}>من تاريخ</label>
            <input type="date" style={S.input} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>إلى تاريخ</label>
            <input type="date" style={S.input} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button style={{ ...S.btn, padding: '11px 24px', alignSelf: 'end' }}
            onClick={analyze} disabled={loading || !selProd}>
            {loading ? '⏳...' : '🔍 تحليل'}
          </button>
        </div>

        {/* اختصارات الفترة */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'اليوم', from: TODAY, to: TODAY },
            { label: 'هذا الأسبوع', from: new Date(Date.now()-7*864e5).toISOString().split('T')[0], to: TODAY },
            { label: 'هذا الشهر', from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: TODAY },
            { label: '3 أشهر', from: new Date(Date.now()-90*864e5).toISOString().split('T')[0], to: TODAY },
            { label: 'هذه السنة', from: new Date().getFullYear() + '-01-01', to: TODAY },
          ].map(r => (
            <button key={r.label} onClick={() => { setDateFrom(r.from); setDateTo(r.to) }}
              style={{ ...S.btnSm, background: dateFrom===r.from&&dateTo===r.to ? '#1565C0' : '#f1f5f9', color: dateFrom===r.from&&dateTo===r.to ? 'white' : '#475569', padding: '6px 14px' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ملخص ── */}
      {(movements.length > 0 || purchases.length > 0) && prod && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { icon: '📤', label: 'إجمالي قطع مباعة', val: totalSold + ' قطعة', color: '#dc2626', bg: '#fff1f2' },
              { icon: '💰', label: 'إجمالي الإيرادات', val: totalRevenue.toFixed(0) + ' ' + CUR, color: '#16a34a', bg: '#f0fdf4' },
              { icon: '📥', label: 'إجمالي مشتريات', val: totalPurchased + ' قطعة', color: '#1565C0', bg: '#eff6ff' },
              { icon: '📦', label: 'المخزون الحالي', val: prod.stock + ' كرتون', color: prod.stock < 5 ? '#dc2626' : '#16a34a', bg: prod.stock < 5 ? '#fff1f2' : '#f0fdf4' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${s.color}22` }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* ── المبيعات ── */}
          {movements.length > 0 && (
            <div style={S.card}>
              <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15, color: '#dc2626' }}>
                📤 المبيعات — {movements.length} عملية
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>
                    {['التاريخ', 'رقم الفاتورة', 'العميل', 'الهاتف', 'الكمية', 'السعر', 'الإجمالي', 'الدفع', 'الحالة'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {movements.map((m, i) => (
                      <tr key={i} style={{ background: i%2===0?'white':'#fafafa' }}>
                        <td style={S.td}>{m.date}</td>
                        <td style={{ ...S.td, fontWeight: 700, color: '#7c3aed' }}>{m.invoiceNum}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{m.who}</td>
                        <td style={S.td}>{m.phone || '—'}</td>
                        <td style={{ ...S.td, textAlign: 'center', fontWeight: 700 }}>
                          {m.isCarton ? `${m.qty} كرتون` : `${m.qty} قطعة`}
                        </td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{m.price} {CUR}</td>
                        <td style={{ ...S.td, fontWeight: 900, color: '#dc2626' }}>{m.total.toFixed(0)} {CUR}</td>
                        <td style={S.td}>
                          <span style={{ background: m.payMode==='نقداً'?'#dcfce7':'#fef9c3', color: m.payMode==='نقداً'?'#16a34a':'#854d0e', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                            {m.payMode}
                          </span>
                        </td>
                        <td style={S.td}>
                          <span style={{ background: m.status==='confirmed'?'#dcfce7':'#fef9c3', color: m.status==='confirmed'?'#16a34a':'#854d0e', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>
                            {m.status==='confirmed'?'مؤكد':'معلق'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#fff7ed', fontWeight: 900 }}>
                      <td colSpan={6} style={{ ...S.td, fontSize: 14 }}>الإجمالي</td>
                      <td style={{ ...S.td, color: '#dc2626', fontSize: 16, fontWeight: 900 }}>{totalRevenue.toFixed(0)} {CUR}</td>
                      <td colSpan={2} style={S.td}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── المشتريات ── */}
          {purchases.length > 0 && (
            <div style={S.card}>
              <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15, color: '#1565C0' }}>
                📥 المشتريات — {purchases.length} عملية
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>
                    {['التاريخ', 'رقم الفاتورة', 'المورد', 'الكرتونات', 'سعر الشراء/قطعة', 'الإجمالي'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {purchases.map((p, i) => (
                      <tr key={i} style={{ background: i%2===0?'white':'#fafafa' }}>
                        <td style={S.td}>{p.date}</td>
                        <td style={{ ...S.td, fontWeight: 700, color: '#7c3aed' }}>{p.invoiceNum}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{p.who}</td>
                        <td style={{ ...S.td, textAlign: 'center', fontWeight: 700 }}>{p.qty} كرتون</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{p.price} {CUR}</td>
                        <td style={{ ...S.td, fontWeight: 900, color: '#1565C0' }}>{p.total.toFixed(0)} {CUR}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#eff6ff', fontWeight: 900 }}>
                      <td colSpan={5} style={{ ...S.td, fontSize: 14 }}>الإجمالي</td>
                      <td style={{ ...S.td, color: '#1565C0', fontSize: 16, fontWeight: 900 }}>{totalCost.toFixed(0)} {CUR}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && selProd && movements.length === 0 && purchases.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: 48, color: CLR.textSm }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>لا توجد حركات لهذا المنتج في الفترة المحددة</div>
        </div>
      )}
    </div>
  )
}
