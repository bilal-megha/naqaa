/**
 * @file pages/Coupons.jsx
 * @description إدارة كوبونات الخصم (نسبة أو مبلغ ثابت)
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR } from '../constants.js'
import { logActivity } from '../utils.js'
import { useToast } from '../hooks/useToast.jsx'
import { useConfirm } from '../hooks/useConfirm.jsx'
import { NumInput } from '../components/FormControls.jsx'

const EMPTY_FORM = { code: '', type: 'percent', value: '', expiry: '', maxUses: 100, minOrder: 0 }

export default function Coupons() {
  const [showToast, ToastUI]    = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items,  setItems]  = useState([])
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState(EMPTY_FORM)

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('id', { ascending: false })
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const add = async () => {
    if (!form.code || !form.value) { showToast('الكود والقيمة مطلوبان', 'error'); return }
    setSaving(true)
    try {
      await supabase.from('coupons').insert({
        id: Date.now(), code: form.code.toUpperCase().trim(), type: form.type,
        value: parseFloat(form.value), expiry: form.expiry || null,
        max_uses: parseInt(form.maxUses) || 100, min_order: parseFloat(form.minOrder) || 0, used: 0,
      })
      await logActivity('إضافة كوبون', `تم إضافة الكوبون: ${form.code}`)
      showToast('✅ تمت الإضافة')
      setForm(EMPTY_FORM)
      await load()
    } catch (err) {
      showToast('❌ خطأ: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const del = async id => {
    if (!(await askConfirm('حذف؟'))) return
    try {
      await supabase.from('coupons').delete().eq('id', id)
      await logActivity('حذف كوبون', `تم حذف الكوبون`)
      showToast('تم الحذف')
      await load()
    } catch (err) {
      showToast('❌ خطأ: ' + err.message, 'error')
    }
  }

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>🎟️ الكوبونات</h1>
      <div style={S.card}>
        <div style={S.grid2}>
          <div><label style={S.label}>الكود *</label><input style={S.input} value={form.code} onChange={F('code')} placeholder="SAVE20" /></div>
          <div>
            <label style={S.label}>النوع</label>
            <select style={S.input} value={form.type} onChange={F('type')}>
              <option value="percent">نسبة %</option>
              <option value="fixed">مبلغ ثابت</option>
            </select>
          </div>
          <div><label style={S.label}>القيمة *</label><NumInput value={form.value} onChange={F('value')} /></div>
          <div><label style={S.label}>تاريخ الانتهاء</label><input style={S.input} type="date" value={form.expiry} onChange={F('expiry')} /></div>
          <div><label style={S.label}>الحد الأقصى</label><NumInput value={form.maxUses} onChange={F('maxUses')} /></div>
          <div><label style={S.label}>الحد الأدنى للطلب</label><NumInput value={form.minOrder} onChange={F('minOrder')} /></div>
        </div>
        <button style={{ ...S.btn, marginTop: 14 }} onClick={add} disabled={saving}>{saving ? '⏳...' : '💾 إضافة كوبون'}</button>
      </div>
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={S.th}>الكود</th><th style={S.th}>النوع</th><th style={S.th}>القيمة</th><th style={S.th}>الاستخدامات</th><th style={S.th}>حذف</th></tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} className="nq-tr">
                <td style={{ ...S.td, fontWeight: 900, color: '#dc2626' }}>{c.code}</td>
                <td style={S.td}>{c.type === 'percent' ? 'نسبة' : 'ثابت'}</td>
                <td style={{ ...S.td, fontWeight: 700 }}>{c.type === 'percent' ? `${c.value}%` : `${c.value} ${CUR}`}</td>
                <td style={S.td}>{c.used || 0}/{c.max_uses}</td>
                <td style={S.td}><button style={{ ...S.btnSm, background: '#fee2e2', color: '#dc2626' }} onClick={() => del(c.id)}>🗑️</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: CLR.textSm }}>لا توجد كوبونات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
