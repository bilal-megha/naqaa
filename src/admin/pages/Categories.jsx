/**
 * @file pages/Categories.jsx
 * @description إدارة الفئات مع سلة المهملات
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S } from '../constants.js'
import { logActivity, softDelete } from '../utils.js'
import { useToast } from '../hooks/useToast.jsx'
import { useConfirm } from '../hooks/useConfirm.jsx'

export default function Categories() {
  const [showToast, ToastUI] = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items, setItems] = useState([])
  const [editId, setEditId] = useState(null)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    try {
      if (editId) {
        await supabase.from('categories').update({ name: name.trim(), image: image || null }).eq('id', editId)
        await logActivity('تعديل فئة', `تم تعديل الفئة: ${name}`)
        showToast('✅ تم التعديل'); setEditId(null)
      } else {
        await supabase.from('categories').insert({ id: Date.now(), name: name.trim(), image: image || null })
        await logActivity('إضافة فئة', `تم إضافة الفئة: ${name}`)
        showToast('✅ تمت الإضافة')
      }
      setName(''); setImage(''); await load()
    } catch (err) { showToast('❌ خطأ: ' + err.message, 'error') }
  }

  const startEdit = c => { setEditId(c.id); setName(c.name); setImage(c.image || '') }
  const cancel = () => { setEditId(null); setName(''); setImage('') }
  const del = async id => { await softDelete('categories', id, items, setItems, load, showToast, askConfirm) }
  const handleImg = e => { const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(e.target.files[0]) }

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>📂 الفئات</h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10, color: CLR.accent }}>{editId ? '✏️ تعديل' : '➕ إضافة'} فئة</h3>
        <p style={{ fontSize: 12, color: CLR.textSm, marginBottom: 12 }}>📐 الحجم المثالي: <strong>400×300 بكسل</strong></p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>اسم الفئة *</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مواد غذائية" />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>صورة (400×300)</label>
            <input style={S.input} type="file" accept="image/*" onChange={handleImg} />
          </div>
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
          <tbody>
            {items.map((c, i) => (
              <tr key={c.id} className="nq-tr" style={{ background: i % 2 === 0 ? 'white' : CLR.bg, cursor: 'pointer' }} onClick={() => startEdit(c)}>
                <td style={S.td}>
                  {c.image
                    ? <img src={c.image} style={{ width: 56, height: 42, borderRadius: 8, objectFit: 'cover', border: `1px solid ${CLR.border}` }} />
                    : <div style={{ width: 56, height: 42, borderRadius: 8, background: CLR.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📁</div>
                  }
                </td>
                <td style={{ ...S.td, fontWeight: 700 }}>{c.name}</td>
                <td style={S.td} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8' }} onClick={() => startEdit(c)}>✏️</button>
                    <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626' }} onClick={() => del(c.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 28, color: CLR.textSm }}><div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>لا توجد فئات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
