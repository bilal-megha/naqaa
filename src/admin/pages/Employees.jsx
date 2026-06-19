/**
 * @file pages/Employees.jsx
 * @description إدارة الموظفين مع صلاحيات تفصيلية لكل قسم
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, ALL_PERMISSIONS, hashPwd } from '../constants.js'
import { logActivity, softDelete } from '../utils.js'
import { useToast } from '../hooks/useToast.jsx'
import { useConfirm } from '../hooks/useConfirm.jsx'
import { PhoneInput } from '../components/FormControls.jsx'

const ACTION_LABELS = { view: '👁️ عرض', add: '➕ إضافة', edit: '✏️ تعديل', delete: '🗑️ حذف', restore: '↩️ استعادة' }
const EMPTY_FORM = { name: '', username: '', password: '', email: '', phone: '', permissions: {} }

export default function Employees() {
  const [showToast, ToastUI]    = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items,    setItems]    = useState([])
  const [saving,   setSaving]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)

  const load = async () => {
    const { data } = await supabase.from('employees').select('id,name,username,email,phone,role,permissions').order('name')
    const formatted = (data || []).map(emp => {
      let perms = {}
      try { perms = typeof emp.permissions === 'string' ? JSON.parse(emp.permissions || '{}') : (emp.permissions || {}) }
      catch { perms = {} }
      return { ...emp, permissions: perms }
    })
    setItems(formatted)
  }
  useEffect(() => { load() }, [])

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const togglePermission = (permId, action) => {
    setForm(prev => {
      const current = prev.permissions[permId] || []
      const newActions = current.includes(action) ? current.filter(a => a !== action) : [...current, action]
      return { ...prev, permissions: { ...prev.permissions, [permId]: newActions } }
    })
  }

  const hasPermission = (permId, action) => (form.permissions[permId] || []).includes(action)

  const add = async () => {
    if (!form.name || !form.username || !form.password) {
      if (editItem && form.name && form.username) {
        // عند التعديل، كلمة المرور اختيارية
      } else {
        showToast('الاسم والمستخدم والكلمة مطلوبة', 'error'); return
      }
    }
    setSaving(true)
    try {
      if (editItem) {
        await supabase.from('employees').update({
          name: form.name, username: form.username, email: form.email,
          phone: form.phone, permissions: JSON.stringify(form.permissions),
        }).eq('id', editItem)
        await logActivity('تعديل موظف', `تم تعديل الموظف: ${form.name}`)
        showToast('✅ تم التعديل')
        setEditItem(null)
      } else {
        await supabase.from('employees').insert({
          id: Date.now(), name: form.name, username: form.username,
          password: hashPwd(form.password), email: form.email, phone: form.phone,
          role: 'staff', permissions: JSON.stringify(form.permissions),
        })
        await logActivity('إضافة موظف', `تم إضافة الموظف: ${form.name}`)
        showToast('✅ تم إضافة الموظف')
      }
      setForm(EMPTY_FORM)
      await load()
    } catch (err) {
      showToast('❌ خطأ: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const del = async id => { await softDelete('employees', id, items, setItems, load, showToast, askConfirm) }

  const edit = emp => {
    let perms = {}
    try { perms = typeof emp.permissions === 'string' ? JSON.parse(emp.permissions || '{}') : (emp.permissions || {}) }
    catch { perms = {} }
    setEditItem(emp.id)
    setForm({ name: emp.name, username: emp.username, password: '', email: emp.email || '', phone: emp.phone || '', permissions: perms })
  }

  const resetPermissions = () => {
    const allPerms = {}
    ALL_PERMISSIONS.forEach(p => (allPerms[p.id] = p.actions))
    setForm(prev => ({ ...prev, permissions: allPerms }))
  }
  const clearPermissions = () => setForm(prev => ({ ...prev, permissions: {} }))

  return (
    <div>{ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>👔 الموظفون</h1>
      {editItem && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#C2410C' }}>
          ⚠️ تعديل الموظف المحدد
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: CLR.accent }}>{editItem ? '✏️ تعديل موظف' : '➕ إضافة موظف جديد'}</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم الكامل *</label><input style={S.input} value={form.name} onChange={F('name')} placeholder="محمد علي" /></div>
          <div><label style={S.label}>اسم المستخدم *</label><input style={S.input} value={form.username} onChange={F('username')} placeholder="mohammed.ali" /></div>
          <div><label style={S.label}>كلمة المرور {editItem ? '(اترك فارغاً للإبقاء)' : ' *'}</label><input style={S.input} type="password" value={form.password} onChange={F('password')} placeholder="••••••••" /></div>
          <div><label style={S.label}>البريد الإلكتروني</label><input style={S.input} value={form.email} onChange={F('email')} placeholder="email@example.com" /></div>
          <div><label style={S.label}>رقم الهاتف (للإشعارات)</label><PhoneInput value={form.phone} onChange={F('phone')} placeholder="مثال: 0555123456" /></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ ...S.label, marginBottom: 8 }}>🔑 الصلاحيات التفصيلية</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8, border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, background: '#F8FAFC', maxHeight: 300, overflowY: 'auto' }}>
            {ALL_PERMISSIONS.map(p => (
              <div key={p.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 8, background: 'white' }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{p.label}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {p.actions.map(action => (
                    <label key={action} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                      <input type="checkbox" checked={hasPermission(p.id, action)} onChange={() => togglePermission(p.id, action)} style={{ accentColor: '#F97316' }} />
                      {ACTION_LABELS[action]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button style={{ ...S.btnSm, background: '#F97316', color: 'white', fontSize: 11 }} onClick={resetPermissions}>✅ كل الصلاحيات</button>
            <button style={{ ...S.btnSm, background: '#E2E8F0', color: '#475569', fontSize: 11 }} onClick={clearPermissions}>❌ إلغاء الكل</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button style={S.btn} onClick={add} disabled={saving}>{saving ? '⏳...' : `💾 ${editItem ? 'حفظ التعديل' : 'إضافة موظف'}`}</button>
          {editItem && <button style={S.btnGray} onClick={() => { setEditItem(null); setForm(EMPTY_FORM) }}>إلغاء</button>}
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>قائمة الموظفين ({items.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#F1F5F9' }}>
              <th style={S.th}>الاسم / المستخدم</th><th style={S.th}>الدور</th><th style={S.th}>الصلاحيات</th><th style={S.th}>إجراءات</th>
            </tr></thead>
            <tbody>
              {items.map((e, i) => {
                const perms = e.permissions || {}
                const totalPerms = Object.values(perms).reduce((sum, actions) => sum + actions.length, 0)
                const maxPerms = ALL_PERMISSIONS.reduce((sum, p) => sum + p.actions.length, 0)
                return (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? 'white' : '#F8FAFC', cursor: 'pointer' }} onClick={() => edit(e)}>
                    <td style={{ ...S.td, fontWeight: 700 }}>
                      <div>{e.name}</div>
                      <div style={{ fontSize: 11, color: CLR.textSm }}>{e.username}</div>
                      {e.phone && <div style={{ fontSize: 10, color: CLR.textSm }}>📱 {e.phone}</div>}
                    </td>
                    <td style={S.td}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: e.role === 'admin' ? '#FEE2E2' : '#D1FAE5', color: e.role === 'admin' ? '#DC2626' : '#059669' }}>
                        {e.role === 'admin' ? '🔴 مدير' : '🟢 موظف'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
                        {totalPerms} / {maxPerms} صلاحية
                      </span>
                    </td>
                    <td style={S.td} onClick={ev => ev.stopPropagation()}>
                      {e.role !== 'admin' && <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626' }} onClick={() => del(e.id)}>🗑️</button>}
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 28, color: CLR.textSm }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>👔</div>لا توجد موظفين
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
