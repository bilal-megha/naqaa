/**
 * @file POS.jsx — نقطة البيع السريعة
 * بيع مباشر من المستودع مع طباعة فاتورة/وصل فوري
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR } from '../styles/constants.js'
import { logActivity, printA4, printThermal } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'

const TODAY = new Date().toISOString().split('T')[0]

export default function POS() {
  const [showToast, ToastUI] = useToast()
  const [products, setProducts]   = useState([])
  const [customers, setCustomers] = useState([])
  const [settings, setSettings]   = useState({})
  const [cart, setCart]           = useState([])
  const [custId, setCustId]       = useState('')
  const [search, setSearch]       = useState('')
  const [payMode, setPayMode]     = useState('نقداً')
  const [paidAmount, setPaidAmount] = useState('')
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [invoiceCounter, setInvoiceCounter] = useState(1)
  const searchRef = useRef(null)

  const load = useCallback(async () => {
    const [{ data: p }, { data: c }, { data: s }, { data: inv }] = await Promise.all([
      supabase.from('products').select('id,name,price,carton_price,units,stock,sku,brand_id').eq('disabled', false).order('name'),
      supabase.from('customers').select('id,name,phone,address,wilaya,rc,nif,nis,art,activite,tier,debt').order('name'),
      supabase.from('settings').select('key,value'),
      supabase.from('orders').select('id').order('id', { ascending: false }).limit(1),
    ])
    setProducts(p || [])
    setCustomers(c || [])
    const sm = {}; (s || []).forEach(r => sm[r.key] = r.value); setSettings(sm)
    const lastId = inv?.[0]?.id ? parseInt(String(inv[0].id).slice(-6)) : 0
    setInvoiceCounter(lastId + 1)
  }, [])

  useEffect(() => { load() }, [load])

  // ── البحث في المنتجات ──
  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.includes(search)
  ).slice(0, 30)

  const addToCart = (prod, qty = 1, isCarton = false) => {
    const price = isCarton ? (prod.carton_price || prod.price * (prod.units || 12)) : prod.price
    const label = isCarton ? `كرتون (${prod.units || 12} قطعة)` : 'قطعة'
    setCart(prev => {
      const key = `${prod.id}-${isCarton}`
      const ex = prev.find(i => i.key === key)
      if (ex) return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty, total: (i.qty + qty) * i.price } : i)
      return [...prev, { key, id: prod.id, name: prod.name, price, label, qty, total: qty * price, isCarton, stock: prod.stock }]
    })
    setSearch('')
  }

  const updateQty = (key, qty) => {
    if (qty <= 0) { setCart(p => p.filter(i => i.key !== key)); return }
    setCart(p => p.map(i => i.key === key ? { ...i, qty, total: qty * i.price } : i))
  }

  const total     = cart.reduce((s, i) => s + i.total, 0)
  const paid      = parseFloat(paidAmount) || 0
  const change    = paid - total
  const customer  = customers.find(c => c.id == custId)

  // ── رقم الفاتورة التلقائي ──
  const year    = new Date().getFullYear().toString().slice(-2)
  const invNum  = `${String(invoiceCounter).padStart(6, '0')}/${year}`

  // ── حفظ الطلبية ──
  const save = async (printType) => {
    if (cart.length === 0) { showToast('أضف منتجاً أولاً', 'error'); return }
    setSaving(true)
    try {
      const orderId = Date.now()
      const items = cart.map(i => ({ product_id: i.id, product_name: i.name, qty: i.qty, price: i.price, total: i.total, is_carton: i.isCarton }))

      // إذا الدفع بالآجل → أضف للدين
      let debtDelta = 0
      if (payMode === 'A TERME') debtDelta = total
      else if (paid > 0 && paid < total) debtDelta = total - paid

      await supabase.from('orders').insert({
        id: orderId,
        customer_id: custId || null,
        customer_name: customer?.name || 'زبون عابر',
        phone: customer?.phone || '',
        address: (customer?.address || '') + (customer?.wilaya ? ', ' + customer.wilaya : ''),
        items: JSON.stringify(items),
        total,
        status: 'confirmed',
        pay_mode: payMode,
        paid_amount: paid || total,
        note,
        invoice_num: invNum,
        created_at: new Date().toISOString(),
      })

      // تحديث الدين إذا لزم
      if (custId && debtDelta > 0) {
        const currentDebt = parseFloat(customer?.debt || 0)
        await supabase.from('customers').update({ debt: currentDebt + debtDelta }).eq('id', custId)
      }

      // تحديث المشتريات الإجمالية للعميل
      if (custId) {
        const { data: cu } = await supabase.from('customers').select('total_purchases').eq('id', custId).maybeSingle()
        await supabase.from('customers').update({ total_purchases: (parseFloat(cu?.total_purchases || 0) + total) }).eq('id', custId)
      }

      await logActivity('بيع مباشر POS', `فاتورة ${invNum} — ${customer?.name || 'زبون عابر'} — ${total} ${CUR}`)

      const orderData = { id: orderId, invNum, customer, items, total, paid, change, payMode, note, settings }
      setLastOrder(orderData)
      setInvoiceCounter(c => c + 1)

      if (printType === 'a4') printInvoiceA4(orderData)
      else if (printType === 'bon') printBonLivraison(orderData)
      else if (printType === 'thermal') printInvoiceThermal(orderData)

      showToast(`✅ تم حفظ الفاتورة ${invNum}`)
      setCart([]); setCustId(''); setPaidAmount(''); setNote(''); setPayMode('نقداً')
      await load()
    } catch (err) {
      showToast('❌ خطأ: ' + err.message, 'error')
    } finally {
      setSaving(false); setShowPrintModal(false)
    }
  }

  // ── طباعة الفاتورة A4 (مثل الصورة) ──
  const printInvoiceA4 = (o) => {
    const c = o.customer || {}
    const s = o.settings || {}
    printA4(`
      <style>
        body{font-family:Arial,sans-serif;direction:rtl;font-size:12px}
        .hdr{border:2px solid #000;padding:10px;text-align:center;margin-bottom:8px}
        .hdr h1{font-size:16px;font-weight:900;margin:0 0 4px}
        .hdr p{margin:2px 0;font-size:11px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
        .box{border:1px solid #000;padding:8px;font-size:11px}
        .box b{display:block;font-size:10px;color:#555;margin-bottom:3px}
        table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px}
        th{background:#1E293B;color:white;padding:7px;text-align:center;border:1px solid #000}
        td{padding:6px 8px;border:1px solid #ccc;text-align:center}
        .tot{font-weight:900;font-size:13px;background:#f8f9fa}
        .footer{display:flex;justify-content:space-between;margin-top:20px}
        .sign{border-top:1px solid #000;width:140px;text-align:center;padding-top:4px;font-size:10px}
        .ttl{text-align:right}
      </style>
      <div class="hdr">
        <h1>${s.company_name || 'نقاء للمنظفات'}</h1>
        <p>${s.company_address || ''}</p>
        <p>TEL: ${s.company_phone || ''} &nbsp;|&nbsp; E-MAIL: ${s.company_email || ''}</p>
        ${s.company_rc ? `<p>RC: ${s.company_rc} &nbsp; NIF: ${s.company_nif || ''} &nbsp; NIS: ${s.company_nis || ''}</p>` : ''}
      </div>
      <div style="text-align:center;font-size:16px;font-weight:900;margin-bottom:8px;text-decoration:underline">FACTURE</div>
      <div class="grid2">
        <div class="box">
          <b>CLIENT</b>
          <div style="font-weight:700">${c.name || 'زبون عابر'}</div>
          ${c.address ? `<div>ADRESSE: ${c.address}${c.wilaya ? ', ' + c.wilaya : ''}</div>` : ''}
          ${c.activite ? `<div>ACTIVITE: ${c.activite}</div>` : ''}
          ${c.rc ? `<div>RC: ${c.rc}</div>` : ''}
          ${c.nif ? `<div>NIF: ${c.nif}</div>` : ''}
          ${c.nis ? `<div>NIS: ${c.nis}</div>` : ''}
          ${c.art ? `<div>N° Art.: ${c.art}</div>` : ''}
        </div>
        <div class="box">
          <b>FACTURE N°: ${o.invNum}</b>
          <div>DU: ${TODAY}</div>
          <div>Mode: ${o.payMode}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Item</th><th>Désignation</th><th>Nbr.Crt</th><th>U/Crt</th><th>PU HT</th><th>Montant HT</th></tr></thead>
        <tbody>
          ${o.items.map((i,idx) => `<tr>
            <td>${idx+1}</td>
            <td class="ttl" style="font-weight:700">${i.product_name}</td>
            <td>${i.is_carton ? i.qty : '—'}</td>
            <td>${i.is_carton ? (products.find(p=>p.id==i.product_id)?.units||12) : i.qty+' قطعة'}</td>
            <td>${i.price.toFixed(2)}</td>
            <td style="font-weight:900">${i.total.toFixed(2)}</td>
          </tr>`).join('')}
          <tr class="tot"><td colspan="5" class="ttl">TOTAL HT</td><td>${o.total.toFixed(2)} ${CUR}</td></tr>
        </tbody>
      </table>
      ${o.paid > 0 && o.paid < o.total ? `<div style="color:#dc2626;font-weight:700;margin-bottom:8px">المبلغ المدفوع: ${o.paid.toFixed(2)} ${CUR} — المتبقي: ${(o.total-o.paid).toFixed(2)} ${CUR}</div>` : ''}
      ${o.change > 0 ? `<div style="color:#16a34a;font-weight:700;margin-bottom:8px">الباقي للعميل: ${o.change.toFixed(2)} ${CUR}</div>` : ''}
      <div class="footer">
        <div class="sign">المستلم</div>
        <div class="sign">LE FACTURIER</div>
      </div>
    `)
  }

  // ── طباعة وصل التسليم ──
  const printBonLivraison = (o) => {
    const c = o.customer || {}
    const s = o.settings || {}
    printA4(`
      <style>
        body{font-family:Arial,sans-serif;direction:rtl;font-size:12px}
        .hdr{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
        .company{font-size:11px;line-height:1.7}
        .company h1{font-size:15px;font-weight:900;margin:0 0 4px}
        .client-box{border:2px solid #000;padding:8px;font-size:11px}
        .client-box b{font-size:10px;color:#555}
        .bon-title{font-size:18px;font-weight:900;border:2px solid #000;padding:4px 16px;display:inline-block;margin-bottom:10px}
        table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px}
        th{background:#1E293B;color:white;padding:7px;text-align:center;border:1px solid #000}
        td{padding:6px 8px;border:1px solid #ccc;text-align:center}
        .tot-box{border:1px solid #000;padding:8px;width:250px;margin-right:auto;font-size:12px}
        .tot-row{display:flex;justify-content:space-between;padding:3px 0}
        .footer-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-top:16px;font-size:11px}
        .sign{border-top:1px solid #000;text-align:center;padding-top:4px}
        .ttl{text-align:right}
      </style>
      <div class="hdr">
        <div class="company">
          <h1>${s.company_name || 'نقاء للمنظفات'}</h1>
          <div>${s.company_address || ''}</div>
          <div>TEL/FAX: ${s.company_phone || ''}</div>
          <div>MOB: ${s.company_mobile || s.company_phone || ''}</div>
          <div>E-Mail: ${s.company_email || ''}</div>
        </div>
        <div class="client-box">
          <b>Client</b><br/>
          <div style="font-weight:700">${c.name || 'زبون عابر'}</div>
          ${c.address ? `<div>${c.address}${c.wilaya ? ', ' + c.wilaya : ''}</div>` : ''}
        </div>
      </div>
      <div class="bon-title">Bon de Livraison</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">
        <span><b>N°:</b> ${o.invNum}</span>
        <span><b>Date:</b> ${TODAY}</span>
      </div>
      <table>
        <thead><tr><th>N°</th><th>Réf.</th><th>Désignation</th><th>Nbr.Crt</th><th>U/Crt</th><th>Total U</th><th>PU Vente</th><th>Montant</th></tr></thead>
        <tbody>
          ${o.items.map((i,idx) => {
            const prod = products.find(p=>p.id==i.product_id)||{}
            const units = prod.units || 12
            const isCart = i.is_carton
            const totalUnits = isCart ? i.qty * units : i.qty
            return `<tr>
              <td>${idx+1}</td>
              <td>${prod.sku||i.product_id}</td>
              <td class="ttl" style="font-weight:700">${i.product_name}</td>
              <td>${isCart ? i.qty : '—'}</td>
              <td>${isCart ? units : '—'}</td>
              <td>${totalUnits}</td>
              <td>${i.price.toFixed(2)}</td>
              <td style="font-weight:900">${i.total.toFixed(2)}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
      <div class="tot-box">
        <div class="tot-row"><span>TOTAL BON</span><span style="font-weight:900">${o.total.toFixed(2)} ${CUR}</span></div>
        ${o.paid > 0 && o.paid < o.total ? `<div class="tot-row" style="color:#dc2626"><span>المدفوع</span><span>${o.paid.toFixed(2)} ${CUR}</span></div><div class="tot-row" style="color:#dc2626;font-weight:900"><span>NET A PAYER</span><span>${(o.total-o.paid).toFixed(2)} ${CUR}</span></div>` : `<div class="tot-row"><span>NET A PAYER</span><span style="font-weight:900">${o.total.toFixed(2)} ${CUR}</span></div>`}
      </div>
      <div class="footer-grid">
        <div class="sign">Camion</div>
        <div class="sign">Chauffeur</div>
        <div class="sign">Client</div>
        <div class="sign">Service Commercial</div>
      </div>
    `)
  }

  // ── طباعة حرارية ──
  const printInvoiceThermal = (o) => {
    printThermal(`
      <div class="center bold big">${o.settings?.company_name || 'نقاء'}</div>
      <div class="line"></div>
      <div class="row"><span>فاتورة:</span><span>${o.invNum}</span></div>
      <div class="row"><span>التاريخ:</span><span>${TODAY}</span></div>
      <div class="row"><span>العميل:</span><span>${o.customer?.name || 'زبون عابر'}</span></div>
      <div class="line"></div>
      ${o.items.map(i=>`<div class="row"><span>${i.product_name} ×${i.qty}</span><span>${i.total.toFixed(0)}</span></div>`).join('')}
      <div class="line"></div>
      <div class="row total"><span>الإجمالي:</span><span>${o.total.toFixed(0)} ${CUR}</span></div>
      ${o.change > 0 ? `<div class="row"><span>الباقي:</span><span>${o.change.toFixed(0)} ${CUR}</span></div>` : ''}
      <div class="center" style="margin-top:10px;font-size:11px">شكراً لتعاملكم معنا</div>
    `)
  }

  return (
    <div dir="rtl">{ToastUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, color: CLR.text }}>🖥️ نقطة البيع السريعة (POS)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>

        {/* ── يسار: اختيار المنتجات ── */}
        <div>
          {/* بحث */}
          <div style={{ ...S.card, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input ref={searchRef} style={{ ...S.input, fontSize: 15 }}
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 ابحث عن منتج بالاسم أو الباركود..." autoFocus />
              <select style={{ ...S.input, width: 180 }} value={custId} onChange={e => setCustId(e.target.value)}>
                <option value="">زبون عابر</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {customer && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, display: 'flex', gap: 16 }}>
                <span>👤 <strong>{customer.name}</strong></span>
                {customer.phone && <span>📞 {customer.phone}</span>}
                {parseFloat(customer.debt || 0) > 0 && <span style={{ color: '#dc2626', fontWeight: 700 }}>💰 دين: {Number(customer.debt).toFixed(2)} {CUR}</span>}
              </div>
            )}
          </div>

          {/* شبكة المنتجات */}
          {search && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {filtered.map(p => (
                <div key={p.id} style={{ ...S.card, padding: 12, cursor: 'pointer', marginBottom: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0D1B2A', marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: CLR.textSm, marginBottom: 8 }}>
                    مخزون: <strong style={{ color: p.stock < 5 ? '#dc2626' : '#16a34a' }}>{p.stock}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => addToCart(p, 1, false)}
                      style={{ ...S.btn, flex: 1, padding: '7px 0', fontSize: 12, justifyContent: 'center' }}>
                      + قطعة<br/><span style={{ fontSize: 11, opacity: 0.85 }}>{p.price} {CUR}</span>
                    </button>
                    {p.carton_price && (
                      <button onClick={() => addToCart(p, 1, true)}
                        style={{ ...S.btnGray, flex: 1, padding: '7px 0', fontSize: 12, textAlign: 'center', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 8 }}>
                        + كرتون<br/><span style={{ fontSize: 11 }}>{p.carton_price} {CUR}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ color: CLR.textSm, padding: 20 }}>لا توجد نتائج</div>}
            </div>
          )}

          {!search && (
            <div style={{ ...S.card, textAlign: 'center', padding: 40, color: CLR.textSm }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>ابحث عن منتج لإضافته للفاتورة</div>
            </div>
          )}
        </div>

        {/* ── يمين: الفاتورة ── */}
        <div>
          <div style={{ ...S.card, position: 'sticky', top: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 900, fontSize: 15, margin: 0 }}>🧾 الفاتورة</h3>
              <span style={{ fontSize: 12, color: CLR.textSm, background: '#f1f5f9', padding: '3px 10px', borderRadius: 20 }}>
                #{invNum}
              </span>
            </div>

            {/* السلة */}
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: CLR.textSm }}>
                <div style={{ fontSize: 36 }}>🛒</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>السلة فارغة</div>
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 12 }}>
                {cart.map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: CLR.textSm }}>{item.label} — {item.price} {CUR}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => updateQty(item.key, item.qty - 1)}
                        style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>-</button>
                      <span style={{ width: 28, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.key, item.qty + 1)}
                        style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>+</button>
                    </div>
                    <div style={{ minWidth: 70, textAlign: 'left', fontWeight: 900, color: '#dc2626', fontSize: 13 }}>
                      {item.total.toFixed(0)} {CUR}
                    </div>
                    <button onClick={() => setCart(p => p.filter(i => i.key !== item.key))}
                      style={{ background: '#fee2e2', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', color: '#dc2626', fontSize: 12 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* الإجمالي */}
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18 }}>
                <span>الإجمالي</span>
                <span style={{ color: '#dc2626' }}>{total.toFixed(2)} {CUR}</span>
              </div>
            </div>

            {/* طريقة الدفع */}
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>طريقة الدفع</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {['نقداً', 'A TERME', 'شيك', 'تحويل'].map(m => (
                  <button key={m} onClick={() => setPayMode(m)}
                    style={{ padding: '8px', borderRadius: 8, border: '2px solid', borderColor: payMode === m ? '#F97316' : '#e2e8f0', background: payMode === m ? '#fff7ed' : 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: payMode === m ? '#F97316' : '#64748b' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* المبلغ المدفوع — فقط نقداً */}
            {payMode === 'نقداً' && (
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>المبلغ المدفوع (دج)</label>
                <input type="number" style={{ ...S.input, fontSize: 16, fontWeight: 700 }}
                  value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                  placeholder={total.toFixed(0)} />
                {paid > 0 && (
                  <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: change >= 0 ? '#16a34a' : '#dc2626' }}>
                    {change >= 0 ? `✅ الباقي: ${change.toFixed(2)} ${CUR}` : `⚠️ ناقص: ${Math.abs(change).toFixed(2)} ${CUR}`}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>ملاحظة (اختياري)</label>
              <input style={S.input} value={note} onChange={e => setNote(e.target.value)} placeholder="..." />
            </div>

            {/* أزرار الطباعة */}
            <div style={{ display: 'grid', gap: 8 }}>
              <button onClick={() => { save('a4') }} disabled={saving || cart.length === 0}
                style={{ ...S.btn, justifyContent: 'center', background: 'linear-gradient(135deg,#1565C0,#0D47A1)' }}>
                🖨️ حفظ + فاتورة A4
              </button>
              <button onClick={() => { save('bon') }} disabled={saving || cart.length === 0}
                style={{ ...S.btn, justifyContent: 'center', background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                📦 حفظ + وصل التسليم
              </button>
              <button onClick={() => { save('thermal') }} disabled={saving || cart.length === 0}
                style={{ ...S.btn, justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                🖨️ حفظ + طباعة حرارية
              </button>
              <button onClick={() => { save(null) }} disabled={saving || cart.length === 0}
                style={{ ...S.btnGray, textAlign: 'center' }}>
                💾 حفظ بدون طباعة
              </button>
            </div>

            {cart.length > 0 && (
              <button onClick={() => setCart([])} style={{ ...S.btnGray, width: '100%', marginTop: 8, color: '#dc2626', textAlign: 'center' }}>
                🗑️ تفريغ السلة
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
