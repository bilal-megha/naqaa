/**
 * @file pages/Brands.jsx
 * @description إدارة العلامات التجارية مع سلة المهملات
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S } from '../constants.js'
import { logActivity, softDelete } from '../utils.js'
import { useToast } from '../hooks/useToast.jsx'
import { useConfirm } from '../hooks/useConfirm.jsx'

export default function Brands() {
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items, setItems] = useState([])
  const [editId, setEditId] = useState(null)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')

  const load = async () => { const { data } = await supabase.from('brands').select('*').order('name'); setItems(data || []) }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    try {
      if (editId) {
        await supabase.from('brands').update({ name: name.trim(), image: image || null }).eq('id', editId)
        await logActivity('تعديل علامة', `تم تعديل العلامة: ${name}`)
        showToast('✅ تم التعديل'); setEditId(null)
      } else {
        await supabase.from('brands').insert({ id: Date.now(), name: name.trim(), image: image || null })
        await logActivity('إضافة علامة', `تم إضافة العلامة: ${name}`)
        showToast('✅ تمت الإضافة')
      }
      setName(''); setImage(''); await load()
    } catch (err) { showToast('❌ خطأ: ' + err.message, 'error') }
  }

  const startEdit = b => { setEditId(b.id); setName(b.name); setImage(b.image || '') }
  const cancel = () => { setEditId(null); setName(''); setImage('') }
  const del = async id => { await softDelete('brands', id, items, setItems, load, showToast, askConfirm) }
  const handleImg = e => { const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(e.target.files[0]) }

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>🏷️ العلامات التجارية</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10, color: CLR.accent }}>{editId ? '✏️ تعديل' : '➕ إضافة'} علامة</h3>
        <p style={{ fontSize: 12, color: CLR.textSm, marginBottom: 12 }}>📐 الحجم المثالي: <strong>300×300 بكسل</strong> (مربع)</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>اسم العلامة *</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: Yema" />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>شعار (300×300)</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleImg} />
          </div>
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
          <tbody>
            {items.map((b, i) => (
              <tr key={b.id} className="nq-tr" style={{ background: i % 2 === 0 ? 'white' : CLR.bg, cursor: 'pointer' }} onClick={() => startEdit(b)}>
                <td style={S.td}>
                  {b.image
                    ? <img src={b.image} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${CLR.border}` }} />
                    : <div style={{ width: 44, height: 44, borderRadius: '50%', background: CLR.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏷️</div>
                  }
                </td>
                <td style={{ ...S.td, fontWeight: 700 }}>{b.name}</td>
                <td style={S.td} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8' }} onClick={() => startEdit(b)}>✏️</button>
                    <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626' }} onClick={() => del(b.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 28, color: CLR.textSm }}>لا توجد علامات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
