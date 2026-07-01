import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { CLR, S } from '../styles/constants.js'

const ROLE_STYLE = {
  admin:    { bg:'#FEF3C7', color:'#92400E', label:'مدير',   icon:'👑' },
  employee: { bg:'#DBEAFE', color:'#1D4ED8', label:'موظف',   icon:'👷' },
  driver:   { bg:'#D1FAE5', color:'#059669', label:'سائق',   icon:'🚗' },
}

const ACTION_ICONS = {
  'إضافة':'➕','تعديل':'✏️','حذف':'🗑️','تسجيل':'🔐',
  'إشعار':'🔔','طباعة':'🖨️','تحديث':'🔄','تفعيل':'✅',
  'إيقاف':'⏸️','أرشفة':'📦','بيع':'🖥️','صندوق':'🏦',
}

function getIcon(action = '') {
  for (const [k, v] of Object.entries(ACTION_ICONS))
    if (action.includes(k)) return v
  return '📋'
}

export default function ActivityLog({ user }) {
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page,       setPage]       = useState(1)
  const PER = 100

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('activity_log').select('*')
        .order('id', { ascending: false })
        .range((p-1)*PER, p*PER-1)
      if (p === 1) setItems(data || [])
      else setItems(prev => [...prev, ...(data || [])])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(1) }, [load])

  const now = new Date()
  const today = items.filter(l => {
    if (!l.created_at) return false
    const d = new Date(l.created_at)
    return d.toDateString() === now.toDateString()
  }).length

  const filtered = items.filter(l => {
    const matchRole = roleFilter === 'all' || (l.employee_role || 'admin') === roleFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (l.action||'').toLowerCase().includes(q) ||
      (l.details||'').toLowerCase().includes(q) ||
      (l.employee_name||'').toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:900, marginBottom:20, color:CLR.text }}>
        📋 سجل النشاطات
      </h1>

      {/* إحصائيات */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:'إجمالي النشاطات', value:items.length,  icon:'📊', bg:'#EFF6FF', color:'#1D4ED8' },
          { label:'نشاطات اليوم',    value:today,          icon:'📅', bg:'#F0FDF4', color:'#059669' },
          { label:'بواسطة المدير',   value:items.filter(l=>(l.employee_role||'admin')==='admin').length,    icon:'👑', bg:'#FEF3C7', color:'#92400E' },
          { label:'بواسطة الموظفين', value:items.filter(l=>l.employee_role==='employee').length, icon:'👷', bg:'#F5F3FF', color:'#7C3AED' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'14px 16px',
            boxShadow:'0 1px 6px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:CLR.textSm, fontWeight:600, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        {/* أدوات */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <input style={{ ...S.input, width:220, flex:'1 1 180px' }}
            placeholder="🔍 بحث في النشاطات أو الاسم..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display:'flex', gap:6 }}>
            {[{key:'all',label:'الكل'},{key:'admin',label:'👑 مدير'},{key:'employee',label:'👷 موظف'}].map(f => (
              <button key={f.key} onClick={() => setRoleFilter(f.key)}
                style={{ ...S.btnSm, padding:'6px 14px', fontWeight:700,
                  background: roleFilter===f.key ? CLR.accent : CLR.bg,
                  color:      roleFilter===f.key ? 'white'    : CLR.textSm,
                  border:     `1.5px solid ${roleFilter===f.key ? CLR.accent : CLR.border}` }}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => load(1)}
            style={{ ...S.btnSm, background:'#DBEAFE', color:'#1D4ED8', padding:'6px 14px', fontWeight:700 }}>
            🔄
          </button>
          <span style={{ fontSize:12, color:CLR.textSm, fontWeight:600 }}>{filtered.length} نشاط</span>
        </div>

        {/* جدول */}
        {loading && items.length===0 ? (
          <div style={{ textAlign:'center', padding:40, color:CLR.textSm }}>⏳ جاري التحميل...</div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:'center', padding:40, color:CLR.textSm }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
            لا توجد نشاطات مطابقة
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>النشاط</th>
                  <th style={S.th}>التفاصيل</th>
                  <th style={S.th}>بواسطة</th>
                  <th style={S.th}>الصفة</th>
                  <th style={S.th}>التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const role  = l.employee_role || 'admin'
                  const rs    = ROLE_STYLE[role] || ROLE_STYLE.admin
                  const name  = l.employee_name || 'المدير العام'
                  let dateStr = '—', timeStr = ''
                  if (l.created_at) {
                    try {
                      const d = new Date(l.created_at)
                      dateStr = d.toLocaleDateString('ar-DZ', { year:'numeric', month:'short', day:'numeric' })
                      timeStr = d.toLocaleTimeString('ar-DZ', { hour:'2-digit', minute:'2-digit' })
                    } catch {}
                  }
                  return (
                    <tr key={l.id}
                      style={{ background: i%2===0 ? 'white' : CLR.bg }}
                      onMouseEnter={e => e.currentTarget.style.background='#FFF7ED'}
                      onMouseLeave={e => e.currentTarget.style.background=i%2===0?'white':CLR.bg}>
                      <td style={{ ...S.td, color:CLR.textSm, fontSize:11, width:40 }}>{i+1}</td>
                      <td style={{ ...S.td, fontWeight:700, whiteSpace:'nowrap' }}>
                        <span style={{ marginLeft:6 }}>{getIcon(l.action)}</span>{l.action||'—'}
                      </td>
                      <td style={{ ...S.td, color:CLR.textSm, maxWidth:260,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                        title={l.details}>{l.details||'—'}</td>
                      <td style={S.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%',
                            background:rs.bg, display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:14, flexShrink:0 }}>
                            {rs.icon}
                          </div>
                          <span style={{ fontWeight:700 }}>{name}</span>
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11,
                          fontWeight:700, background:rs.bg, color:rs.color }}>
                          {rs.label}
                        </span>
                      </td>
                      <td style={{ ...S.td, whiteSpace:'nowrap' }}>
                        <div style={{ fontWeight:600, fontSize:12 }}>{dateStr}</div>
                        <div style={{ fontSize:11, color:'#94A3B8' }}>{timeStr}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {items.length >= PER && (
          <div style={{ textAlign:'center', padding:'14px 0' }}>
            <button onClick={() => { const n=page+1; setPage(n); load(n) }}
              style={{ ...S.btnGray, fontSize:13 }}>
              ⬇️ تحميل المزيد
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
