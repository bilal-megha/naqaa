import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S } from '../styles/constants.js'
import { logActivity } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'

const LINK_TYPES = [
  { value: 'none',     label: '— بدون رابط' },
  { value: 'product',  label: '🛍️ منتج محدد' },
  { value: 'category', label: '📂 فئة' },
  { value: 'brand',    label: '🏷️ ماركة' },
  { value: 'promo',    label: '🎯 صفحة العروض' },
  { value: 'url',      label: '🔗 رابط خارجي' },
]

export default function Notifications() {
  const [showToast, ToastUI] = useToast()
  const [items,      setItems]      = useState([])
  const [customers,  setCustomers]  = useState([])
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [brands,     setBrands]     = useState([])

  const [title,         setTitle]         = useState('')
  const [body,          setBody]          = useState('')
  const [targetType,    setTargetType]    = useState('all')
  const [addressFilter, setAddressFilter] = useState('')
  const [linkType,      setLinkType]      = useState('none')
  const [linkId,        setLinkId]        = useState('')
  const [customUrl,     setCustomUrl]     = useState('')
  const [saving,        setSaving]        = useState(false)

  const load = async () => {
    try {
      const [{ data: n }, { data: c }, { data: p }, { data: cat }, { data: br }] = await Promise.all([
        supabase.from('notifications').select('*').order('id', { ascending: false }),
        supabase.from('customers').select('id,name,tier,address,phone').order('name'),
        supabase.from('products').select('id,name,image').eq('disabled', false).order('name'),
        supabase.from('categories').select('id,name').order('name'),
        supabase.from('brands').select('id,name').order('name'),
      ])
      setItems(n || [])
      setCustomers(c || [])
      setProducts(p || [])
      setCategories(cat || [])
      setBrands(br || [])
    } catch (err) { console.error('❌', err) }
  }

  useEffect(() => { load() }, [])

  const targeted = customers.filter(c => {
    if (targetType === 'all') return true
    if (['M1','M2','M3'].includes(targetType)) return (c.tier || 'M1') === targetType
    if (targetType === 'address') return addressFilter && (c.address || '').toLowerCase().includes(addressFilter.toLowerCase())
    return true
  })

  const send = async () => {
    if (!title || !body) { showToast('العنوان والنص مطلوبان', 'error'); return }
    setSaving(true)
    try {
      const finalLinkId = linkType === 'url' ? customUrl : linkType === 'none' ? null : linkId || null
      await supabase.from('notifications').insert({
        id: Date.now(),
        title,
        body,
        target_type: targetType,
        target_count: targeted.length,
        date: new Date().toLocaleString('ar-DZ'),
        is_read: false,
        link_type: linkType,
        link_id: finalLinkId,
      })
      await logActivity('إرسال إشعار', `تم إرسال إشعار لـ ${targeted.length} عميل: ${title}`)
      showToast(`✅ تم الإرسال لـ ${targeted.length} عميل`)
      setTitle(''); setBody(''); setLinkType('none'); setLinkId(''); setCustomUrl('')
      await load()
    } catch (err) {
      showToast('❌ خطأ: ' + err.message, 'error')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('حذف هذا الإشعار؟')) return
    await supabase.from('notifications').delete().eq('id', id)
    await load()
    showToast('🗑️ تم الحذف')
  }

  const tierLabels = { all: 'الكل', M1: 'M1 عادي', M2: 'M2 مميز', M3: 'M3 VIP', address: 'حسب العنوان' }
  const tierColors = { all: '#475569', M1: '#475569', M2: '#1d4ed8', M3: '#92400e', address: '#059669' }

  const linkLabel = (item) => {
    if (!item.link_type || item.link_type === 'none') return null
    if (item.link_type === 'product') {
      const p = products.find(x => String(x.id) === String(item.link_id))
      return p ? `🛍️ ${p.name}` : `🛍️ منتج #${item.link_id}`
    }
    if (item.link_type === 'category') {
      const c = categories.find(x => String(x.id) === String(item.link_id))
      return c ? `📂 ${c.name}` : `📂 فئة #${item.link_id}`
    }
    if (item.link_type === 'brand') {
      const b = brands.find(x => String(x.id) === String(item.link_id))
      return b ? `🏷️ ${b.name}` : `🏷️ ماركة #${item.link_id}`
    }
    if (item.link_type === 'promo') return '🎯 صفحة العروض'
    if (item.link_type === 'url') return `🔗 ${item.link_id}`
    return null
  }

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>🔔 الإشعارات</h1>

      {/* ── إرسال إشعار جديد ── */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 16, color: '#dc2626' }}>📢 إرسال إشعار جديد</h3>

        {/* الجمهور */}
        <label style={S.label}>👥 أرسل إلى</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {Object.entries(tierLabels).map(([k, v]) => (
            <button key={k} onClick={() => setTargetType(k)}
              style={{ ...S.btnSm,
                background: targetType === k ? tierColors[k] : '#f1f5f9',
                color: targetType === k ? 'white' : '#64748b',
                border: `2px solid ${targetType === k ? tierColors[k] : 'transparent'}`,
                fontWeight: 700 }}>
              {v}
            </button>
          ))}
        </div>
        {targetType === 'address' && (
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>🗺️ فلتر العنوان</label>
            <input style={S.input} value={addressFilter}
              onChange={e => setAddressFilter(e.target.value)} placeholder="مثال: الجزائر" />
          </div>
        )}
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14, fontWeight: 700 }}>
          📊 سيصل لـ <strong style={{ color: '#1565C0' }}>{targeted.length}</strong> عميل
        </div>

        {/* العنوان والنص */}
        <div style={S.grid2}>
          <div>
            <label style={S.label}>📌 عنوان الإشعار</label>
            <input style={S.input} value={title}
              onChange={e => setTitle(e.target.value)} placeholder="مثال: عرض خاص على منتجاتنا 🎉" />
          </div>
          <div>
            <label style={S.label}>✏️ نص الإشعار</label>
            <input style={S.input} value={body}
              onChange={e => setBody(e.target.value)} placeholder="مثال: خصم 20% على جميع العطور اليوم فقط!" />
          </div>
        </div>

        {/* الرابط الوجهة */}
        <div style={{ marginTop: 14, background: '#F8FAFC', borderRadius: 12, padding: 14, border: '1px solid #E2E8F0' }}>
          <label style={{ ...S.label, marginBottom: 10 }}>🔗 عند الضغط على الإشعار — يذهب إلى</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {LINK_TYPES.map(lt => (
              <button key={lt.value} onClick={() => { setLinkType(lt.value); setLinkId('') }}
                style={{ ...S.btnSm,
                  background: linkType === lt.value ? CLR.accent : 'white',
                  color: linkType === lt.value ? 'white' : '#475569',
                  border: `1.5px solid ${linkType === lt.value ? CLR.accent : '#E2E8F0'}`,
                  fontWeight: 700 }}>
                {lt.label}
              </button>
            ))}
          </div>

          {linkType === 'product' && (
            <div>
              <label style={S.label}>اختر المنتج</label>
              <select style={S.input} value={linkId} onChange={e => setLinkId(e.target.value)}>
                <option value="">-- اختر منتجاً --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          {linkType === 'category' && (
            <div>
              <label style={S.label}>اختر الفئة</label>
              <select style={S.input} value={linkId} onChange={e => setLinkId(e.target.value)}>
                <option value="">-- اختر فئة --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {linkType === 'brand' && (
            <div>
              <label style={S.label}>اختر الماركة</label>
              <select style={S.input} value={linkId} onChange={e => setLinkId(e.target.value)}>
                <option value="">-- اختر ماركة --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          {linkType === 'url' && (
            <div>
              <label style={S.label}>رابط خارجي</label>
              <input style={S.input} value={customUrl}
                onChange={e => setCustomUrl(e.target.value)} placeholder="https://..." />
            </div>
          )}
          {linkType === 'promo' && (
            <div style={{ fontSize: 13, color: '#059669', fontWeight: 700 }}>
              ✅ سيفتح صفحة العروض في المتجر
            </div>
          )}
        </div>

        <button style={{ ...S.btn, marginTop: 16 }} onClick={send} disabled={saving}>
          {saving ? '⏳ جاري الإرسال...' : `📤 إرسال لـ ${targeted.length} عميل`}
        </button>
      </div>

      {/* ── قائمة الإشعارات المرسلة ── */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 16, color: CLR.text }}>
          📋 الإشعارات المرسلة ({items.length})
        </h3>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>لا توجد إشعارات مرسلة</div>
        ) : items.map(item => (
          <div key={item.id} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px',
            marginBottom: 10, border: '1px solid #E2E8F0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>🔔</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: CLR.text }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>{item.body}</div>
              {linkLabel(item) && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700,
                  background: '#EEF4FF', color: '#1565C0', display: 'inline-block',
                  padding: '2px 10px', borderRadius: 20 }}>
                  🔗 {linkLabel(item)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
                <span>👥 {item.target_count || 0} عميل</span>
                <span>📅 {item.date}</span>
                <span style={{ background: item.target_type === 'all' ? '#E0F2FE' : '#FEF3C7',
                  color: item.target_type === 'all' ? '#0369A1' : '#92400E',
                  padding: '1px 8px', borderRadius: 10 }}>
                  {item.target_type === 'all' ? 'الكل' : item.target_type}
                </span>
              </div>
            </div>
            <button onClick={() => del(item.id)}
              style={{ border: 'none', background: '#FEE2E2', color: '#DC2626',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer', flexShrink: 0 }}>
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
