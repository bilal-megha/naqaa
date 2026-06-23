import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR } from '../styles/constants.js'
import { logActivity, printA4 } from '../styles/helpers.js'
import { NumInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Purchases() {
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [items, setItems] = useState([])
  const [suppId, setSuppId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [invoiceNum, setInvoiceNum] = useState('')
  const [payMode, setPayMode] = useState('نقداً')
  const [showModal, setShowModal] = useState(false)
  const [showNewProdModal, setShowNewProdModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(null) // purchase to edit
  const [modal, setModal] = useState({ productId: '', cartons: 1, unitsPerCarton: 12, purchasePrice: 0, sellPrice: 0 })
  const [newProd, setNewProd] = useState({ name: '', price: '', units: 12, brandId: '' })
  const [brands, setBrands] = useState([])
  const [saving, setSaving] = useState(false)
  const [scanMode, setScanMode] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeRef = useRef(null)

  const autoCarton = (price, units) => parseFloat(price || 0) * parseInt(units || 12)

  const load = useCallback(async () => {
    const [{ data: s }, { data: p }, { data: pur }, { data: b }] = await Promise.all([
      supabase.from('suppliers').select('id,name').order('name'),
      supabase.from('products').select('id,name,units,cost_price,price,sku').order('name'),
      supabase.from('purchases').select('*').order('id', { ascending: false }).limit(50),
      supabase.from('brands').select('id,name').order('name'),
    ])
    setSuppliers(s || []); setProducts(p || []); setPurchases(pur || []); setBrands(b || [])
  }, [])

  useEffect(() => { load() }, [load])

  // ── باركود ──
  const handleBarcode = (e) => {
    if (e.key === 'Enter') {
      const sku = barcodeInput.trim()
      const found = products.find(p => p.sku === sku || String(p.id) === sku)
      if (found) {
        setModal(m => ({ ...m, productId: String(found.id), unitsPerCarton: found.units || 12, purchasePrice: found.cost_price || 0, sellPrice: found.price || 0 }))
        setShowModal(true); setScanMode(false); setBarcodeInput('')
        showToast(`✅ تم العثور على: ${found.name}`)
      } else {
        showToast('❌ المنتج غير موجود', 'error')
      }
      setBarcodeInput('')
    }
  }

  const total = items.reduce((s, i) => s + i.totalPurchase, 0)

  const addItem = () => {
    const prod = products.find(p => p.id == modal.productId)
    if (!prod || !modal.cartons || !modal.purchasePrice) { showToast('اختر منتجاً وأدخل البيانات', 'error'); return }
    const existing = items.find(i => i.productId == prod.id)
    if (existing) {
      const cartonPrice = autoCarton(modal.purchasePrice, modal.unitsPerCarton)
      const newCartons = existing.cartons + parseInt(modal.cartons)
      setItems(prev => prev.map(i => i.productId == prod.id ? {
        ...i, cartons: newCartons,
        totalUnits: newCartons * parseInt(modal.unitsPerCarton),
        cartonPrice, totalPurchase: newCartons * cartonPrice
      } : i))
      showToast('✅ تمت إضافة الكمية للمنتج الموجود')
    } else {
      const totalUnits = parseInt(modal.cartons) * parseInt(modal.unitsPerCarton)
      const cartonPrice = autoCarton(modal.purchasePrice, modal.unitsPerCarton)
      setItems(prev => [...prev, {
        id: Date.now(), productId: prod.id, productName: prod.name,
        cartons: parseInt(modal.cartons), unitsPerCarton: parseInt(modal.unitsPerCarton),
        totalUnits, purchasePrice: parseFloat(modal.purchasePrice),
        sellPrice: parseFloat(modal.sellPrice) || 0,
        cartonPrice, totalPurchase: parseInt(modal.cartons) * cartonPrice
      }])
    }
    setShowModal(false); setModal({ productId: '', cartons: 1, unitsPerCarton: 12, purchasePrice: 0, sellPrice: 0 })
  }

  const saveNewProduct = async () => {
    if (!newProd.name || !newProd.price) { showToast('الاسم والسعر مطلوبان', 'error'); return }
    try {
      const id = Date.now()
      await supabase.from('products').insert({ id, name: newProd.name.trim(), price: parseFloat(newProd.price), units: parseInt(newProd.units) || 12, brand_id: newProd.brandId ? parseInt(newProd.brandId) : null, stock: 0, disabled: false, created_at: new Date().toISOString() })
      await logActivity('إضافة منتج', `تم إضافة المنتج: ${newProd.name}`)
      const { data: p } = await supabase.from('products').select('id,name,units,cost_price,price,sku').order('name')
      setProducts(p || [])
      setModal(m => ({ ...m, productId: String(id), unitsPerCarton: parseInt(newProd.units) || 12 }))
      setNewProd({ name: '', price: '', units: 12, brandId: '' })
      setShowNewProdModal(false); setShowModal(true)
      showToast('✅ تمت إضافة المنتج')
    } catch (err) { showToast('❌ خطأ: ' + err.message, 'error') }
  }

  const printPurchaseA4 = (p, its, totalVal) => {
    const supplier = suppliers.find(s => s.id == p.supplier_id) || { name: p.supplier_name || '—' }
    printA4(`
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; }
        .header { border: 2px solid #000; padding: 12px; margin-bottom: 10px; text-align: center; }
        .header h1 { font-size: 18px; margin: 0 0 4px; font-weight: 900; }
        .header p { font-size: 12px; margin: 2px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .info-box { border: 1px solid #000; padding: 8px; font-size: 12px; }
        .info-box strong { display: block; font-size: 11px; color: #555; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1E293B; color: white; padding: 8px; text-align: center; border: 1px solid #000; }
        td { padding: 7px 8px; border: 1px solid #ccc; text-align: center; }
        .total-row td { font-weight: 900; background: #f8f9fa; font-size: 14px; }
        .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; }
        .sign-box { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 4px; font-size: 11px; }
      </style>
      <div class="header">
        <h1>فاتورة شراء</h1>
        <p>نقاء للمنظفات ومواد العناية</p>
      </div>
      <div class="info-grid">
        <div class="info-box">
          <strong>معلومات المورد</strong>
          ${supplier.name}
        </div>
        <div class="info-box">
          <strong>رقم الفاتورة: ${p.invoice_num || p.id}</strong>
          التاريخ: ${p.date}<br/>
          طريقة الدفع: ${p.pay_mode || 'نقداً'}
        </div>
      </div>
      <table>
        <thead><tr><th>#</th><th>المنتج</th><th>الكرتونات</th><th>قطع/كرتون</th><th>إجمالي قطع</th><th>سعر/قطعة</th><th>سعر الكرتون</th><th>الإجمالي HT</th></tr></thead>
        <tbody>
          ${its.map((i, idx) => `<tr>
            <td>${idx + 1}</td><td style="text-align:right;font-weight:700">${i.productName}</td>
            <td>${i.cartons}</td><td>${i.unitsPerCarton}</td><td>${i.totalUnits}</td>
            <td>${i.purchasePrice} ${CUR}</td>
            <td style="font-weight:700;color:#7c3aed">${(i.cartonPrice || 0).toFixed(0)} ${CUR}</td>
            <td style="font-weight:900;color:#dc2626">${i.totalPurchase.toFixed(0)} ${CUR}</td>
          </tr>`).join('')}
          <tr class="total-row"><td colspan="7" style="text-align:right">الإجمالي الكلي</td><td>${totalVal.toFixed(0)} ${CUR}</td></tr>
        </tbody>
      </table>
      <div class="footer">
        <div class="sign-box">المستلم</div>
        <div class="sign-box">المورد</div>
        <div class="sign-box">المدير</div>
      </div>
    `)
  }

  const save = async () => {
    if (!suppId) { showToast('اختر المورد', 'error'); return }
    if (items.length === 0) { showToast('أضف منتجاً', 'error'); return }
    setSaving(true)
    try {
      const supplier = suppliers.find(s => s.id == suppId)
      const purchaseId = Date.now()
      await supabase.from('purchases').insert({
        id: purchaseId, supplier_id: parseInt(suppId), supplier_name: supplier?.name,
        date, items: JSON.stringify(items), total, invoice_num: invoiceNum, pay_mode: payMode
      })
      for (const item of items) {
        const { data: p } = await supabase.from('products').select('stock').eq('id', item.productId).maybeSingle()
        if (p) await supabase.from('products').update({ stock: (p.stock || 0) + item.cartons, cost_price: item.purchasePrice, carton_price: item.cartonPrice }).eq('id', item.productId)
      }
      await logActivity('إضافة شراء', `تم إضافة فاتورة شراء بقيمة ${total} دج`)
      printPurchaseA4({ id: purchaseId, supplier_id: suppId, supplier_name: supplier?.name, date, invoice_num: invoiceNum, pay_mode: payMode }, items, total)
      showToast('✅ تم حفظ الفاتورة وطباعتها')
      setSuppId(''); setItems([]); setInvoiceNum(''); setPayMode('نقداً')
      await load()
    } catch (err) { showToast('❌ خطأ: ' + err.message, 'error') }
    finally { setSaving(false) }
  }

  // ── تعديل فاتورة موجودة ──
  const openEdit = (pur) => {
    const its = typeof pur.items === 'string' ? JSON.parse(pur.items || '[]') : (pur.items || [])
    setShowEditModal({ ...pur, parsedItems: its.map(i => ({ ...i, id: i.id || Date.now() + Math.random() })) })
  }

  const saveEdit = async () => {
    if (!showEditModal) return
    setSaving(true)
    try {
      const newTotal = showEditModal.parsedItems.reduce((s, i) => s + i.totalPurchase, 0)
      await supabase.from('purchases').update({
        items: JSON.stringify(showEditModal.parsedItems),
        total: newTotal,
        supplier_id: showEditModal.supplier_id,
        supplier_name: showEditModal.supplier_name,
        date: showEditModal.date,
        invoice_num: showEditModal.invoice_num,
        pay_mode: showEditModal.pay_mode,
      }).eq('id', showEditModal.id)
      await logActivity('تعديل شراء', `تم تعديل فاتورة #${showEditModal.id}`)
      showToast('✅ تم حفظ التعديلات')
      setShowEditModal(null); await load()
    } catch (err) { showToast('❌ خطأ: ' + err.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div dir="rtl">{ToastUI}{ConfirmUI}

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>🛒 المشتريات</h1>

      {/* ── فاتورة جديدة ── */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: '#dc2626' }}>➕ فاتورة شراء جديدة</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div><label style={S.label}>المورد *</label>
            <select style={S.input} value={suppId} onChange={e => setSuppId(e.target.value)}>
              <option value="">-- اختر مورداً --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div><label style={S.label}>التاريخ</label>
            <input style={S.input} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label style={S.label}>رقم الفاتورة</label>
            <input style={S.input} placeholder="مثال: 001181/26" value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} /></div>
          <div><label style={S.label}>طريقة الدفع</label>
            <select style={S.input} value={payMode} onChange={e => setPayMode(e.target.value)}>
              <option>نقداً</option><option>A TERME</option><option>شيك</option><option>تحويل</option>
            </select></div>
        </div>

        {/* جدول المنتجات */}
        {items.length > 0 && (
          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#1E293B,#0F172A)' }}>
                  {['المنتج', 'الكرتونات', 'قطع/كرتون', 'إجمالي قطع', 'سعر/قطعة', 'سعر الكرتون', 'الإجمالي', ''].map((h, i) => (
                    <th key={i} style={{ ...S.th, color: 'white', background: 'transparent', padding: '10px 8px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...S.td, fontWeight: 700 }}>{item.productName}</td>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 700 }}>{item.cartons}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{item.unitsPerCarton}</td>
                    <td style={{ ...S.td, textAlign: 'center', color: CLR.textSm }}>{item.totalUnits}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{item.purchasePrice} {CUR}</td>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: '#7c3aed' }}>{item.cartonPrice.toFixed(0)} {CUR}</td>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>{item.totalPurchase.toFixed(0)} {CUR}</td>
                    <td style={S.td}><button style={{ ...S.btnSm, background: '#fee2e2', color: '#dc2626' }} onClick={() => setItems(p => p.filter((_, j) => j !== i))}>🗑️</button></td>
                  </tr>
                ))}
                <tr style={{ background: '#fff7ed', fontWeight: 900 }}>
                  <td colSpan={6} style={{ ...S.td, fontSize: 15 }}>💰 الإجمالي الكلي</td>
                  <td style={{ ...S.td, fontSize: 18, color: '#dc2626', fontWeight: 900 }}>{total.toFixed(0)} {CUR}</td>
                  <td style={S.td}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: CLR.textSm, border: '2px dashed #e2e8f0', borderRadius: 12, marginBottom: 14 }}>
            📦 لا توجد منتجات — ابدأ بإضافة منتج
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowModal(true)} style={{ ...S.btnGray, background: CLR.success, color: 'white' }}>➕ إضافة منتج</button>
          <button onClick={() => { setScanMode(true); setTimeout(() => barcodeRef.current?.focus(), 100) }}
            style={{ ...S.btnGray, background: '#7c3aed', color: 'white' }}>📷 باركود</button>
          <button style={S.btn} onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 حفظ + طباعة'}</button>
          {items.length > 0 && <span style={{ fontWeight: 900, color: '#dc2626', fontSize: 18 }}>💰 {total.toFixed(0)} {CUR}</span>}
        </div>

        {/* حقل الباركود */}
        {scanMode && (
          <div style={{ marginTop: 14, padding: 14, background: '#f0fdf4', borderRadius: 12, border: '2px solid #86efac' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#16a34a' }}>📷 وجّه الكاميرا أو اكتب الباركود ثم اضغط Enter</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={barcodeRef} style={{ ...S.input, flex: 1, fontSize: 16 }}
                value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcode} placeholder="امسح أو اكتب الباركود..." autoFocus />
              <button style={{ ...S.btnGray, color: '#dc2626' }} onClick={() => { setScanMode(false); setBarcodeInput('') }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>💡 تأكد أن حقل SKU مملوء في المنتجات لكي يعمل الباركود</div>
          </div>
        )}
      </div>

      {/* ── سجل الفواتير ── */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14 }}>📋 سجل الفواتير</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['#', 'رقم الفاتورة', 'المورد', 'التاريخ', 'المنتجات', 'الإجمالي', 'الدفع', 'إجراءات'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{purchases.map(p => {
              const its = typeof p.items === 'string' ? JSON.parse(p.items || '[]') : (p.items || [])
              return (
                <tr key={p.id} className="nq-tr">
                  <td style={{ ...S.td, fontSize: 11, color: CLR.textSm }}>{String(p.id).slice(-6)}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: '#7c3aed' }}>{p.invoice_num || '—'}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{p.supplier_name}</td>
                  <td style={S.td}>{p.date}</td>
                  <td style={S.td}>{its.length} منتج</td>
                  <td style={{ ...S.td, color: '#dc2626', fontWeight: 700 }}>{Number(p.total).toFixed(0)} {CUR}</td>
                  <td style={S.td}><span style={{ background: p.pay_mode === 'نقداً' ? '#dcfce7' : '#fef9c3', color: p.pay_mode === 'نقداً' ? '#16a34a' : '#854d0e', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{p.pay_mode || 'نقداً'}</span></td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ ...S.btnSm, background: '#dbeafe', color: '#1d4ed8' }}
                        onClick={() => printPurchaseA4(p, its, Number(p.total))}>🖨️ A4</button>
                      <button style={{ ...S.btnSm, background: '#fef9c3', color: '#854d0e' }}
                        onClick={() => openEdit(p)}>✏️ تعديل</button>
                    </div>
                  </td>
                </tr>
              )
            })}
              {purchases.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: CLR.textSm }}>لا توجد فواتير</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── مودال إضافة منتج ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: 520, maxWidth: '95vw', direction: 'rtl', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>➕ إضافة منتج للفاتورة</h3>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={S.label}>المنتج</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select style={{ ...S.input, flex: 1 }} value={modal.productId} onChange={e => {
                    const p = products.find(x => x.id == e.target.value)
                    setModal(m => ({ ...m, productId: e.target.value, unitsPerCarton: p?.units || 12, purchasePrice: p?.cost_price || 0, sellPrice: p?.price || 0 }))
                  }}>
                    <option value="">-- اختر منتجاً --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button onClick={() => { setShowModal(false); setShowNewProdModal(true) }}
                    style={{ ...S.btn, padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>+ جديد</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={S.label}>الكرتونات (Nbr. Crt)</label><NumInput value={modal.cartons} onChange={e => setModal(m => ({ ...m, cartons: parseInt(e.target.value) || 1 }))} /></div>
                <div><label style={S.label}>قطع/كرتون (U/Crt)</label><NumInput value={modal.unitsPerCarton} onChange={e => setModal(m => ({ ...m, unitsPerCarton: parseInt(e.target.value) || 12 }))} /></div>
                <div><label style={S.label}>سعر الشراء/قطعة (PU HT)</label><NumInput value={modal.purchasePrice} onChange={e => setModal(m => ({ ...m, purchasePrice: parseFloat(e.target.value) || 0 }))} /></div>
                <div><label style={S.label}>سعر البيع/قطعة</label><NumInput value={modal.sellPrice} onChange={e => setModal(m => ({ ...m, sellPrice: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
              {modal.purchasePrice > 0 && modal.unitsPerCarton > 0 && (
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12, fontSize: 13 }}>
                  <div>📦 <strong>{modal.cartons * modal.unitsPerCarton}</strong> قطعة إجمالاً</div>
                  <div style={{ marginTop: 4 }}>💜 سعر الكرتون = {modal.purchasePrice} × {modal.unitsPerCarton} = <strong style={{ color: '#7c3aed' }}>{autoCarton(modal.purchasePrice, modal.unitsPerCarton).toFixed(0)} {CUR}</strong></div>
                  <div style={{ marginTop: 4 }}>💰 الإجمالي = {modal.cartons} × {autoCarton(modal.purchasePrice, modal.unitsPerCarton).toFixed(0)} = <strong style={{ color: '#dc2626', fontSize: 16 }}>{(modal.cartons * autoCarton(modal.purchasePrice, modal.unitsPerCarton)).toFixed(0)} {CUR}</strong></div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button style={S.btn} onClick={addItem}>✅ إضافة للفاتورة</button>
              <button style={S.btnGray} onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ── مودال إضافة منتج جديد ── */}
      {showNewProdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: 440, maxWidth: '95vw', direction: 'rtl' }}>
            <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 18 }}>🆕 إضافة منتج جديد</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={S.label}>اسم المنتج *</label>
                <input style={S.input} value={newProd.name} onChange={e => setNewProd(f => ({ ...f, name: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={S.label}>سعر البيع *</label>
                  <NumInput value={newProd.price} onChange={e => setNewProd(f => ({ ...f, price: e.target.value }))} /></div>
                <div><label style={S.label}>قطع/كرتون</label>
                  <NumInput value={newProd.units} onChange={e => setNewProd(f => ({ ...f, units: e.target.value }))} /></div>
              </div>
              <div><label style={S.label}>العلامة التجارية</label>
                <select style={S.input} value={newProd.brandId} onChange={e => setNewProd(f => ({ ...f, brandId: e.target.value }))}>
                  <option value="">-- بدون --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button style={S.btn} onClick={saveNewProduct}>💾 حفظ وإضافة للفاتورة</button>
              <button style={S.btnGray} onClick={() => { setShowNewProdModal(false); setShowModal(true) }}>رجوع</button>
            </div>
          </div>
        </div>
      )}

      {/* ── مودال تعديل الفاتورة ── */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: 700, maxWidth: '98vw', direction: 'rtl', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: '#854d0e' }}>✏️ تعديل الفاتورة #{showEditModal.invoice_num || showEditModal.id}</h3>
              <button onClick={() => setShowEditModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={S.label}>المورد</label>
                <select style={S.input} value={showEditModal.supplier_id} onChange={e => {
                  const s = suppliers.find(x => x.id == e.target.value)
                  setShowEditModal(m => ({ ...m, supplier_id: e.target.value, supplier_name: s?.name || m.supplier_name }))
                }}>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              <div><label style={S.label}>التاريخ</label>
                <input style={S.input} type="date" value={showEditModal.date} onChange={e => setShowEditModal(m => ({ ...m, date: e.target.value }))} /></div>
              <div><label style={S.label}>رقم الفاتورة</label>
                <input style={S.input} value={showEditModal.invoice_num || ''} onChange={e => setShowEditModal(m => ({ ...m, invoice_num: e.target.value }))} /></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
              <thead><tr style={{ background: '#fef9c3' }}>
                {['المنتج', 'الكرتونات', 'قطع/كرتون', 'سعر/قطعة', 'الإجمالي', ''].map(h => (
                  <th key={h} style={{ ...S.th, background: '#854d0e', color: 'white' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {showEditModal.parsedItems.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...S.td, fontWeight: 700 }}>{item.productName}</td>
                    <td style={S.td}>
                      <input type="number" style={{ ...S.input, width: 70, padding: '4px 8px', textAlign: 'center' }}
                        value={item.cartons} onChange={e => {
                          const cartons = parseInt(e.target.value) || 0
                          const cp = autoCarton(item.purchasePrice, item.unitsPerCarton)
                          setShowEditModal(m => ({ ...m, parsedItems: m.parsedItems.map((x, j) => j === i ? { ...x, cartons, totalUnits: cartons * x.unitsPerCarton, cartonPrice: cp, totalPurchase: cartons * cp } : x) }))
                        }} />
                    </td>
                    <td style={S.td}>
                      <input type="number" style={{ ...S.input, width: 70, padding: '4px 8px', textAlign: 'center' }}
                        value={item.unitsPerCarton} onChange={e => {
                          const u = parseInt(e.target.value) || 12
                          const cp = autoCarton(item.purchasePrice, u)
                          setShowEditModal(m => ({ ...m, parsedItems: m.parsedItems.map((x, j) => j === i ? { ...x, unitsPerCarton: u, totalUnits: x.cartons * u, cartonPrice: cp, totalPurchase: x.cartons * cp } : x) }))
                        }} />
                    </td>
                    <td style={S.td}>
                      <input type="number" style={{ ...S.input, width: 90, padding: '4px 8px', textAlign: 'center' }}
                        value={item.purchasePrice} onChange={e => {
                          const pp = parseFloat(e.target.value) || 0
                          const cp = autoCarton(pp, item.unitsPerCarton)
                          setShowEditModal(m => ({ ...m, parsedItems: m.parsedItems.map((x, j) => j === i ? { ...x, purchasePrice: pp, cartonPrice: cp, totalPurchase: x.cartons * cp } : x) }))
                        }} />
                    </td>
                    <td style={{ ...S.td, fontWeight: 900, color: '#dc2626' }}>{item.totalPurchase.toFixed(0)} {CUR}</td>
                    <td style={S.td}><button style={{ ...S.btnSm, background: '#fee2e2', color: '#dc2626' }}
                      onClick={() => setShowEditModal(m => ({ ...m, parsedItems: m.parsedItems.filter((_, j) => j !== i) }))}>🗑️</button></td>
                  </tr>
                ))}
                <tr style={{ background: '#fff7ed', fontWeight: 900 }}>
                  <td colSpan={4} style={{ ...S.td, fontSize: 14 }}>الإجمالي</td>
                  <td style={{ ...S.td, color: '#dc2626', fontSize: 16, fontWeight: 900 }}>
                    {showEditModal.parsedItems.reduce((s, i) => s + i.totalPurchase, 0).toFixed(0)} {CUR}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.btn} onClick={saveEdit} disabled={saving}>{saving ? '⏳...' : '💾 حفظ التعديلات'}</button>
              <button style={S.btnGray} onClick={() => setShowEditModal(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
