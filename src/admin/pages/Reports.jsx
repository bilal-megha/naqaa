/**
 * @file Reports.jsx — التقارير الشاملة
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR } from '../styles/constants.js'
import { printA4 } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'

const TODAY  = new Date().toISOString().split('T')[0]
const M_START = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function Reports() {
  const [showToast, ToastUI] = useToast()
  const [tab, setTab]           = useState('daily')
  const [dateFrom, setDateFrom] = useState(M_START)
  const [dateTo, setDateTo]     = useState(TODAY)
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: orders }, { data: products }, { data: customers }, { data: purchases }, { data: expenses }] = await Promise.all([
        supabase.from('orders').select('*').gte('created_at', dateFrom+'T00:00:00').lte('created_at', dateTo+'T23:59:59').order('created_at', { ascending: false }),
        supabase.from('products').select('id,name,stock,price,units').eq('disabled', false),
        supabase.from('customers').select('id,name,phone,debt,total_purchases,tier').order('total_purchases', { ascending: false }),
        supabase.from('purchases').select('*').gte('date', dateFrom).lte('date', dateTo),
        supabase.from('expenses').select('*').gte('date', dateFrom).lte('date', dateTo),
      ])

      const ords = orders || []
      const prods = products || []

      // إجمالي المبيعات
      const totalSales = ords.reduce((s, o) => s + Number(o.total), 0)
      const totalPurch = (purchases || []).reduce((s, p) => s + Number(p.total), 0)
      const totalExp   = (expenses || []).reduce((s, e) => s + Number(e.amount), 0)
      const profit     = totalSales - totalPurch - totalExp

      // أكثر المنتجات مبيعاً
      const prodSales = {}
      ords.forEach(o => {
        const items = typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
        items.forEach(i => {
          if (!prodSales[i.product_id]) prodSales[i.product_id] = { name: i.product_name, qty: 0, revenue: 0 }
          prodSales[i.product_id].qty += i.qty
          prodSales[i.product_id].revenue += i.total
        })
      })
      const topProducts = Object.values(prodSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

      // أكثر العملاء شراءً في الفترة
      const custSales = {}
      ords.forEach(o => {
        const key = o.customer_name || 'زبون عابر'
        if (!custSales[key]) custSales[key] = { name: key, phone: o.phone || '', orders: 0, total: 0 }
        custSales[key].orders++
        custSales[key].total += Number(o.total)
      })
      const topCustomers = Object.values(custSales).sort((a, b) => b.total - a.total).slice(0, 10)

      // المنتجات منخفضة المخزون
      const lowStock = prods.filter(p => (p.stock || 0) <= 5).sort((a, b) => a.stock - b.stock)

      // المنتجات الراكدة (لم تُباع في الفترة)
      const soldIds = new Set(Object.keys(prodSales).map(Number))
      const stagnant = prods.filter(p => !soldIds.has(p.id) && p.stock > 0)

      // ديون العملاء
      const debtors = (customers || []).filter(c => parseFloat(c.debt || 0) > 0).sort((a, b) => b.debt - a.debt)
      const totalDebt = debtors.reduce((s, c) => s + parseFloat(c.debt || 0), 0)

      // مبيعات يومية (آخر 7 أيام للرسم البياني)
      const daily = {}
      ords.forEach(o => {
        const d = o.created_at?.split('T')[0] || ''
        if (!daily[d]) daily[d] = 0
        daily[d] += Number(o.total)
      })

      setData({ totalSales, totalPurch, totalExp, profit, topProducts, topCustomers, lowStock, stagnant, debtors, totalDebt, ordersCount: ords.length, daily })
    } catch (err) {
      showToast('❌ خطأ: ' + err.message, 'error')
    } finally { setLoading(false) }
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const TABS = [
    { id: 'daily',    label: '📊 الملخص' },
    { id: 'products', label: '📦 المنتجات' },
    { id: 'customers',label: '👥 العملاء' },
    { id: 'debt',     label: '💰 الديون' },
    { id: 'stock',    label: '🏭 المخزون' },
  ]

  const printReport = () => {
    if (!data) return
    printA4(`
      <style>body{font-family:Arial,sans-serif;direction:rtl;font-size:12px} table{width:100%;border-collapse:collapse;margin-bottom:16px} th{background:#1E293B;color:white;padding:7px;border:1px solid #000} td{padding:6px 8px;border:1px solid #ccc} h2{color:#1565C0;margin:16px 0 8px} .stat{display:inline-block;border:1px solid #ccc;padding:10px 20px;border-radius:8px;margin:4px;text-align:center} .stat b{display:block;font-size:18px;margin-bottom:4px}</style>
      <h1 style="text-align:center;margin-bottom:16px">تقرير المبيعات — ${dateFrom} إلى ${dateTo}</h1>
      <div>
        <span class="stat"><b style="color:#16a34a">${data.totalSales.toFixed(0)} ${CUR}</b>إجمالي المبيعات</span>
        <span class="stat"><b style="color:#dc2626">${data.totalPurch.toFixed(0)} ${CUR}</b>إجمالي المشتريات</span>
        <span class="stat"><b style="color:#7c3aed">${data.totalExp.toFixed(0)} ${CUR}</b>المصاريف</span>
        <span class="stat"><b style="color:${data.profit>=0?'#16a34a':'#dc2626'}">${data.profit.toFixed(0)} ${CUR}</b>الربح الصافي</span>
        <span class="stat"><b>${data.ordersCount}</b>عدد الطلبيات</span>
      </div>
      <h2>أكثر المنتجات مبيعاً</h2>
      <table><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>الإيراد</th></tr></thead><tbody>
        ${data.topProducts.map((p,i)=>`<tr><td>${i+1}</td><td>${p.name}</td><td>${p.qty}</td><td>${p.revenue.toFixed(0)} ${CUR}</td></tr>`).join('')}
      </tbody></table>
      <h2>أفضل العملاء</h2>
      <table><thead><tr><th>#</th><th>العميل</th><th>الطلبيات</th><th>الإجمالي</th></tr></thead><tbody>
        ${data.topCustomers.map((c,i)=>`<tr><td>${i+1}</td><td>${c.name}</td><td>${c.orders}</td><td>${c.total.toFixed(0)} ${CUR}</td></tr>`).join('')}
      </tbody></table>
      ${data.debtors.length>0?`<h2>الديون المتراكمة</h2><table><thead><tr><th>العميل</th><th>الهاتف</th><th>الدين</th></tr></thead><tbody>${data.debtors.map(c=>`<tr><td>${c.name}</td><td>${c.phone||'—'}</td><td style="color:#dc2626;font-weight:700">${Number(c.debt).toFixed(2)} ${CUR}</td></tr>`).join('')}</tbody></table>`:''}
    `)
  }

  const StatCard = ({ icon, label, value, sub, color = CLR.text, bg = 'white' }) => (
    <div style={{ background: bg, borderRadius: 14, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
    </div>
  )

  return (
    <div dir="rtl">{ToastUI}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: CLR.text, margin: 0 }}>📊 التقارير</h1>
        <button style={S.btn} onClick={printReport} disabled={!data}>🖨️ طباعة التقرير</button>
      </div>

      {/* فلاتر الفترة */}
      <div style={{ ...S.card, padding: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <div><label style={S.label}>من</label><input type="date" style={{ ...S.input, width: 160 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
          <div><label style={S.label}>إلى</label><input type="date" style={{ ...S.input, width: 160 }} value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          <button style={S.btn} onClick={load} disabled={loading}>{loading ? '⏳...' : '🔍 تحديث'}</button>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { l: 'اليوم', f: TODAY, t: TODAY },
              { l: 'هذا الأسبوع', f: new Date(Date.now()-7*864e5).toISOString().split('T')[0], t: TODAY },
              { l: 'هذا الشهر', f: M_START, t: TODAY },
              { l: '3 أشهر', f: new Date(Date.now()-90*864e5).toISOString().split('T')[0], t: TODAY },
              { l: 'هذه السنة', f: new Date().getFullYear()+'-01-01', t: TODAY },
            ].map(r => (
              <button key={r.l} onClick={() => { setDateFrom(r.f); setDateTo(r.t) }}
                style={{ ...S.btnSm, background: dateFrom===r.f&&dateTo===r.t?'#1565C0':'#f1f5f9', color: dateFrom===r.f&&dateTo===r.t?'white':'#475569', padding: '6px 12px' }}>
                {r.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* تابات */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...S.btnSm, padding: '9px 18px', whiteSpace: 'nowrap', background: tab===t.id ? '#1565C0' : '#f1f5f9', color: tab===t.id ? 'white' : '#475569', fontSize: 13, fontWeight: tab===t.id ? 800 : 600 }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: CLR.textSm }}>⏳ جاري التحميل...</div>}

      {data && !loading && (
        <>
          {/* ── الملخص ── */}
          {tab === 'daily' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
                <StatCard icon="💰" label="إجمالي المبيعات" value={`${data.totalSales.toFixed(0)} ${CUR}`} color="#16a34a" bg="#f0fdf4" sub={`${data.ordersCount} طلبية`} />
                <StatCard icon="🛒" label="تكلفة المشتريات" value={`${data.totalPurch.toFixed(0)} ${CUR}`} color="#dc2626" bg="#fff1f2" />
                <StatCard icon="📋" label="المصاريف" value={`${data.totalExp.toFixed(0)} ${CUR}`} color="#7c3aed" bg="#faf5ff" />
                <StatCard icon="📈" label="الربح الصافي" value={`${data.profit.toFixed(0)} ${CUR}`} color={data.profit >= 0 ? '#16a34a' : '#dc2626'} bg={data.profit >= 0 ? '#f0fdf4' : '#fff1f2'} />
                <StatCard icon="⚠️" label="إجمالي الديون" value={`${data.totalDebt.toFixed(0)} ${CUR}`} color="#dc2626" bg="#fff1f2" sub={`${data.debtors.length} عميل`} />
                <StatCard icon="📦" label="منتجات منخفضة" value={data.lowStock.length} color={data.lowStock.length > 0 ? '#dc2626' : '#16a34a'} sub="أقل من 5 كرتون" />
              </div>

              {/* أكثر المنتجات مبيعاً */}
              <div style={S.card}>
                <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>🏆 أكثر المنتجات مبيعاً</h3>
                {data.topProducts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i<3?['#ffd700','#c0c0c0','#cd7f32'][i]:'#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0, color: i<3?'white':'#475569' }}>{i+1}</div>
                    <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{p.qty} وحدة</div>
                    <div style={{ fontWeight: 900, color: '#16a34a', fontSize: 14 }}>{p.revenue.toFixed(0)} {CUR}</div>
                    <div style={{ width: 100, background: '#f1f5f9', borderRadius: 20, height: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#1565C0', borderRadius: 20, width: `${Math.min(100, (p.revenue/data.topProducts[0].revenue)*100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── المنتجات ── */}
          {tab === 'products' && (
            <div style={S.card}>
              <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>📦 تفاصيل مبيعات المنتجات</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['#','المنتج','الكمية المباعة','الإيراد','متوسط السعر'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.topProducts.map((p,i) => (
                    <tr key={i} style={{ background: i%2===0?'white':'#fafafa' }}>
                      <td style={{ ...S.td, textAlign: 'center' }}>{i+1}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{p.name}</td>
                      <td style={{ ...S.td, textAlign: 'center', fontWeight: 700 }}>{p.qty}</td>
                      <td style={{ ...S.td, fontWeight: 900, color: '#16a34a' }}>{p.revenue.toFixed(0)} {CUR}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>{p.qty > 0 ? (p.revenue/p.qty).toFixed(0) : '—'} {CUR}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── العملاء ── */}
          {tab === 'customers' && (
            <div style={S.card}>
              <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>👥 أفضل العملاء في الفترة</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['#','العميل','الهاتف','الطلبيات','الإجمالي','المتوسط'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.topCustomers.map((c,i) => (
                    <tr key={i} style={{ background: i%2===0?'white':'#fafafa' }}>
                      <td style={{ ...S.td, textAlign: 'center' }}>{i+1}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{c.name}</td>
                      <td style={S.td}>{c.phone || '—'}</td>
                      <td style={{ ...S.td, textAlign: 'center', fontWeight: 700 }}>{c.orders}</td>
                      <td style={{ ...S.td, fontWeight: 900, color: '#16a34a' }}>{c.total.toFixed(0)} {CUR}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>{c.orders > 0 ? (c.total/c.orders).toFixed(0) : '—'} {CUR}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── الديون ── */}
          {tab === 'debt' && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, margin: 0, color: '#dc2626' }}>💰 قائمة الديون — الإجمالي: {data.totalDebt.toFixed(0)} {CUR}</h3>
              </div>
              {data.debtors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#16a34a', fontWeight: 700 }}>✅ لا توجد ديون مستحقة</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['العميل','الهاتف','الرتبة','الدين','إجمالي مشترياته'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {data.debtors.map((c,i) => (
                      <tr key={i} style={{ background: i%2===0?'white':'#fafafa' }}>
                        <td style={{ ...S.td, fontWeight: 700 }}>{c.name}</td>
                        <td style={S.td}>{c.phone || '—'}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{c.tier || 'M1'}</td>
                        <td style={{ ...S.td, fontWeight: 900, color: '#dc2626', fontSize: 15 }}>{Number(c.debt).toFixed(2)} {CUR}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{Number(c.total_purchases || 0).toFixed(0)} {CUR}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#fff1f2', fontWeight: 900 }}>
                      <td colSpan={3} style={{ ...S.td, fontSize: 14 }}>إجمالي الديون</td>
                      <td style={{ ...S.td, color: '#dc2626', fontSize: 16, fontWeight: 900 }}>{data.totalDebt.toFixed(2)} {CUR}</td>
                      <td style={S.td}></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── المخزون ── */}
          {tab === 'stock' && (
            <>
              <div style={S.card}>
                <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15, color: '#dc2626' }}>⚠️ منتجات منخفضة المخزون ({data.lowStock.length})</h3>
                {data.lowStock.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#16a34a', fontWeight: 700 }}>✅ المخزون بخير</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>{['المنتج','المخزون الحالي (كرتون)','الحالة'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.lowStock.map((p,i) => (
                        <tr key={i} style={{ background: p.stock===0?'#fff1f2':i%2===0?'white':'#fafafa' }}>
                          <td style={{ ...S.td, fontWeight: 700 }}>{p.name}</td>
                          <td style={{ ...S.td, textAlign: 'center', fontWeight: 900, color: p.stock===0?'#dc2626':'#f59e0b', fontSize: 16 }}>{p.stock}</td>
                          <td style={{ ...S.td, textAlign: 'center' }}>
                            <span style={{ background: p.stock===0?'#fee2e2':'#fef9c3', color: p.stock===0?'#dc2626':'#854d0e', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                              {p.stock===0?'🔴 نفد المخزون':'🟡 منخفض'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={S.card}>
                <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15, color: '#64748b' }}>😴 منتجات راكدة لم تُباع في الفترة ({data.stagnant.length})</h3>
                {data.stagnant.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#16a34a', fontWeight: 700 }}>✅ كل المنتجات تُباع</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>{['المنتج','المخزون'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.stagnant.map((p,i) => (
                        <tr key={i} style={{ background: i%2===0?'white':'#fafafa' }}>
                          <td style={{ ...S.td, fontWeight: 700 }}>{p.name}</td>
                          <td style={{ ...S.td, textAlign: 'center' }}>{p.stock} كرتون</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
