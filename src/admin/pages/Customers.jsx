/**
 * @file pages/Customers.jsx
 * @description إدارة العملاء — رتب، مجموعات، نقاط، Pagination، وإشعارات جماعية
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, hashPwd } from '../constants.js'
import { logActivity, softDelete } from '../utils.js'
import { useToast } from '../hooks/useToast.jsx'
import { useConfirm } from '../hooks/useConfirm.jsx'
import { PhoneInput } from '../components/FormControls.jsx'

const PAGE_SIZE = 20
const EMPTY_FORM = { id: '', name: '', email: '', phone: '', address: '', password: '', tier: 'M1', group: '' }

export default function Customers() {
  const [showToast, ToastUI]    = useToast()
  const [askConfirm, ConfirmUI] = useConfirm()
  const [items,        setItems]        = useState([])
  const [search,       setSearch]       = useState('')
  const [saving,       setSaving]       = useState(false)
  const [tierSettings, setTierSettings] = useState({ m1: 0, m2: 5000, m3: 20000, d1: 0, d2: 5, d3: 10 })
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [tierFilter,   setTierFilter]   = useState('all')
  const [groupFilter,  setGroupFilter]  = useState('all')
  const [groups,       setGroups]       = useState([])
  const [selected,     setSelected]     = useState([])
  const [showBulkMsg,  setShowBulkMsg]  = useState(false)
  const [bulkMessage,  setBulkMessage]  = useState('')

  // ─── Pagination ───
  const [page,       setPage]       = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const load = useCallback(async () => {
    try {
      let countQ = supabase.from('customers').select('id', { count: 'exact', head: true })
      if (search)                countQ = countQ.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      if (tierFilter !== 'all')  countQ = countQ.eq('tier', tierFilter)
      if (groupFilter !== 'all') countQ = countQ.eq('group', groupFilter)
      const { count } = await countQ
      setTotalCount(count || 0)

      let q = supabase.from('customers').select('*').order('name')
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      if (search)                q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      if (tierFilter !== 'all')  q = q.eq('tier', tierFilter)
      if (groupFilter !== 'all') q = q.eq('group', groupFilter)
      const { data } = await q
      setItems(data || [])

      // تحميل كل المجموعات الفريدة (بدون pagination حتى تظهر كل الخيارات)
      const { data: allData } = await supabase.from('customers').select('group')
      setGroups([...new Set((allData || []).map(c => c.group).filter(Boolean))])
    } catch (err) {
      showToast('❌ خطأ في تحميل العملاء', 'error')
    }
  }, [page, search, tierFilter, groupFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, tierFilter, groupFilter])

  useEffect(() => {
    supabase.from('settings').select('*')
      .in('key', ['tier_m2_min', 'tier_m3_min', 'tier_m1_discount', 'tier_m2_discount', 'tier_m3_discount'])
      .then(({ data }) => {
        if (!data) return
        const m = {}
        data.forEach(r => (m[r.key] = parseFloat(r.value)))
        setTierSettings({
          m1: 0, m2: m['tier_m2_min'] || 5000, m3: m['tier_m3_min'] || 20000,
          d1: m['tier_m1_discount'] || 0, d2: m['tier_m2_discount'] || 5, d3: m['tier_m3_discount'] || 10,
        })
      })
  }, [])

  const F = k => e => {
    const value = e.target.value
    if (k === 'phone' && !/^[0-9+]*$/.test(value) && value !== '') return
    setForm(f => ({ ...f, [k]: value }))
  }

  const pointsToDiscount = points => Math.floor(points / 100)

  const save = async () => {
    if (!form.name.trim()) { showToast('الاسم مطلوب', 'error'); return }
    setSaving(true)
    try {
      const ex = items.find(c => c.id == form.id)
      const { error } = await supabase.from('customers').upsert({
        id: form.id || Date.now(), name: form.name.trim(),
        email: form.email, phone: form.phone, address: form.address,
        tier: form.tier, group: form.group || null,
        password: form.password ? hashPwd(form.password) : ex?.password || hashPwd('123456'),
        points: ex?.points || 0,
        created_at: ex?.created_at || new Date().toISOString(),
      })
      if (error) { showToast('خطأ: ' + error.message, 'error'); return }

      await logActivity(form.id ? 'تعديل عميل' : 'إضافة عميل', `${form.id ? 'تم تعديل' : 'تم إضافة'} العميل: ${form.name}`)
      showToast(form.id ? '✅ تم التعديل' : '✅ تمت الإضافة')
      setForm(EMPTY_FORM)
      await load()
    } catch (err) {
      showToast('❌ خطأ: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const edit = c => setForm({
    id: c.id, name: c.name, email: c.email || '', phone: c.phone || '',
    address: c.address || '', password: '', tier: c.tier || 'M1', group: c.group || '',
  })

  const del = async id => { await softDelete('customers', id, items, setItems, load, showToast, askConfirm) }
  const toggleSelect = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  /** إرسال إشعار جماعي عبر واتساب لكل العملاء المحددين */
  const sendBulkNotification = async () => {
    if (!bulkMessage.trim()) { showToast('اكتب رسالة أولاً', 'error'); return }
    if (selected.length === 0) { showToast('اختر عملاء أولاً', 'error'); return }
    try {
      const targets = items.filter(c => selected.includes(c.id) && c.phone)
      targets.forEach((c, i) => {
        setTimeout(() => {
          const wa = (c.phone || '').replace(/^0/, '213').replace(/\D/g, '')
          window.open(`https://wa.me/${wa}?text=${encodeURIComponent(bulkMessage)}`, '_blank')
        }, i * 400)
      })
      await logActivity('إشعار جماعي', `تم إرسال إشعار جماعي إلى ${targets.length} عميل`)
      showToast(`✅ تم فتح ${targets.length} محادثة واتساب`)
      setShowBulkMsg(false); setBulkMessage(''); setSelected([])
    } catch (err) { showToast('❌ خطأ: ' + err.message, 'error') }
  }

  const tierLabel = t => ({ M1: '🥉 M1 عادي', M2: '🥈 M2 مميز', M3: '🥇 M3 VIP' }[t] || t)
  const tierStyle = t => ({
    M1: { bg: '#F1F5F9', color: CLR.textSm },
    M2: { bg: '#DBEAFE', color: '#1D4ED8' },
    M3: { bg: '#FEF9C3', color: '#92400E' },
  }[t || 'M1'])

  return (
    <div>
      {ToastUI}{ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>👥 العملاء</h1>

      {/* إعدادات تصنيف العملاء */}
      <div style={{ ...S.card, background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fcd34d' }}>
        <h3 style={{ fontWeight: 800, marginBottom: 12, color: '#92400e' }}>🏅 إعدادات تصنيف العملاء</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { tier: 'M1', label: '🥉 M1 عادي', min: 0,              disc: tierSettings.d1, color: CLR.textSm },
            { tier: 'M2', label: '🥈 M2 مميز', min: tierSettings.m2, disc: tierSettings.d2, color: '#3b82f6' },
            { tier: 'M3', label: '🥇 M3 VIP',  min: tierSettings.m3, disc: tierSettings.d3, color: '#f59e0b' },
          ].map(({ tier, label, min, disc, color }) => (
            <div key={tier} style={{ background: 'white', borderRadius: 12, padding: 12, textAlign: 'center', border: `2px solid ${color}` }}>
              <div style={{ fontWeight: 800, color, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: CLR.textSm }}>من {min} {CUR}</div>
              <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>خصم {disc}%</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#92400e', marginTop: 10 }}>💡 لتعديل حدود الرتب اذهب إلى ⚙️ الإعدادات → تصنيف العملاء</p>
      </div>

      {/* نموذج إضافة/تعديل عميل */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: '#dc2626' }}>{form.id ? '✏️ تعديل' : '➕ إضافة'} عميل</h3>
        <div style={S.grid2}>
          <div><label style={S.label}>الاسم *</label><input style={S.input} value={form.name} onChange={F('name')} /></div>
          <div><label style={S.label}>البريد</label><input style={S.input} value={form.email} onChange={F('email')} /></div>
          <div><label style={S.label}>الهاتف</label><PhoneInput value={form.phone} onChange={F('phone')} placeholder="مثال: 0555123456" /></div>
          <div><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={F('address')} /></div>
          <div><label style={S.label}>كلمة المرور</label><input style={S.input} type="password" value={form.password} onChange={F('password')} /></div>
          <div>
            <label style={S.label}>الرتبة</label>
            <select style={S.input} value={form.tier} onChange={F('tier')}>
              <option value="M1">🥉 M1 — عميل عادي</option>
              <option value="M2">🥈 M2 — عميل مميز</option>
              <option value="M3">🥇 M3 — عميل VIP</option>
            </select>
          </div>
          <div><label style={S.label}>المجموعة</label><input style={S.input} value={form.group} onChange={F('group')} placeholder="مثال: عملاء مميزين, ولاية الجزائر" /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button style={S.btn} onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 حفظ'}</button>
          <button style={S.btnGray} onClick={() => setForm(EMPTY_FORM)}>✖</button>
        </div>
      </div>

      {/* الجدول والفلاتر */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <h3 style={{ fontWeight: 800, fontSize: 15 }}>
            العملاء
            <span style={{ marginRight: 8, background: CLR.bg, border: '1px solid #E2E8F0', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600, color: CLR.textSm }}>
              {totalCount}
            </span>
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ ...S.input, width: 200 }} placeholder="🔍 اسم / هاتف..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...S.input, width: 110 }} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              <option value="all">كل الرتب</option>
              <option value="M1">🥉 M1</option><option value="M2">🥈 M2</option><option value="M3">🥇 M3</option>
            </select>
            <select style={{ ...S.input, width: 130 }} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
              <option value="all">كل المجموعات</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {selected.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FFF7ED', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>✓ {selected.length} عميل محدد</span>
            <button style={{ ...S.btnSm, background: CLR.success, color: 'white' }} onClick={() => setShowBulkMsg(true)}>📢 إرسال إشعار جماعي</button>
            <button style={{ ...S.btnSm, background: '#E2E8F0', color: CLR.textSm }} onClick={() => setSelected([])}>إلغاء التحديد</button>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: CLR.bg }}>
              <th style={S.th}><input type="checkbox" onChange={e => setSelected(e.target.checked ? items.map(c => c.id) : [])} /></th>
              <th style={S.th}>الاسم</th><th style={S.th}>الهاتف</th><th style={S.th}>الولاية</th>
              <th style={S.th}>الرتبة</th><th style={S.th}>المجموعة</th>
              <th style={S.th}>المشتريات</th><th style={S.th}>النقاط</th><th style={S.th}>إجراءات</th>
            </tr></thead>
            <tbody>
              {items.map((c, i) => {
                const ts = tierStyle(c.tier)
                return (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : CLR.bg, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFF7ED')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : CLR.bg)}>
                    <td style={S.td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                    <td style={{ ...S.td, fontWeight: 700 }} onClick={() => edit(c)}>
                      <div>{c.name}</div>
                      {c.email && <div style={{ fontSize: 11, color: CLR.textSm }}>{c.email}</div>}
                    </td>
                    <td style={{ ...S.td, color: CLR.textSm }} onClick={() => edit(c)}>{c.phone || '—'}</td>
                    <td style={{ ...S.td, color: CLR.textSm }} onClick={() => edit(c)}>{(c.address || '—').split(',')[0]}</td>
                    <td style={S.td} onClick={() => edit(c)}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ts?.bg, color: ts?.color }}>{tierLabel(c.tier || 'M1')}</span>
                    </td>
                    <td style={{ ...S.td, color: CLR.textSm }} onClick={() => edit(c)}>{c.group || '—'}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: CLR.accent }} onClick={() => edit(c)}>{Number(c.total_purchases || 0).toFixed(0)} {CUR}</td>
                    <td style={{ ...S.td, color: CLR.textSm }} onClick={() => edit(c)}>
                      {c.points || 0} ⭐
                      {c.points > 0 && <span style={{ fontSize: 10, color: '#10b981', marginRight: 4 }}>(خصم {pointsToDiscount(c.points)}%)</span>}
                    </td>
                    <td style={S.td} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ ...S.btnSm, background: '#DBEAFE', color: '#1D4ED8' }} onClick={() => edit(c)}>✏️</button>
                        {c.phone && <a href={`https://wa.me/${(c.phone || '').replace(/^0/, '213')}`} target="_blank" style={{ ...S.btnSm, background: '#DCFCE7', color: '#059669', textDecoration: 'none' }}>💬</a>}
                        <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626' }} onClick={() => del(c.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 36, color: CLR.textSm }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>لا يوجد عملاء
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <button style={{ ...S.btnSm, background: page === 1 ? '#E2E8F0' : CLR.accent, color: page === 1 ? CLR.textSm : 'white' }}
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← السابق</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button key={pg} style={{ ...S.btnSm, background: pg === page ? CLR.accent : 'white', color: pg === page ? 'white' : CLR.textSm, border: `1px solid ${pg === page ? CLR.accent : CLR.border}` }}
                  onClick={() => setPage(pg)}>{pg}</button>
              )
            })}
            <button style={{ ...S.btnSm, background: page === totalPages ? '#E2E8F0' : CLR.accent, color: page === totalPages ? CLR.textSm : 'white' }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي →</button>
            <span style={{ fontSize: 12, color: CLR.textSm }}>صفحة {page} من {totalPages}</span>
          </div>
        )}
      </div>

      {/* Modal الإشعار الجماعي */}
      {showBulkMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, direction: 'rtl' }}>
            <h3 style={{ fontWeight: 900, marginBottom: 14 }}>📢 إشعار جماعي ({selected.length} عميل)</h3>
            <label style={S.label}>نص الرسالة</label>
            <textarea style={{ ...S.input, minHeight: 100, resize: 'vertical' }} value={bulkMessage}
              onChange={e => setBulkMessage(e.target.value)} placeholder="مثال: عرض خاص اليوم فقط لعملائنا المميزين! 🎉" />
            <p style={{ fontSize: 11, color: CLR.textSm, marginTop: 6 }}>سيتم فتح محادثة واتساب لكل عميل تلقائياً</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button style={S.btn} onClick={sendBulkNotification}>📤 إرسال</button>
              <button style={S.btnGray} onClick={() => setShowBulkMsg(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
