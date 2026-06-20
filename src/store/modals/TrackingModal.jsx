import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== TrackingModal ==========
export default function TrackingModal({ onClose, currency }) {
  const [num, setNum] = useState('')
  const [phone, setPhone] = useState('')
  const [res, setRes] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const steps = ['pending', 'processing', 'shipped', 'delivered']
  const labels = { pending: 'تم استلام الطلب', processing: 'قيد التجهيز', shipped: 'في الطريق', delivered: 'تم التسليم' }

  const track = async () => {
    if (!num.trim() && !phone.trim()) return
    setLoading(true); setRes(null); setOrders([])
    try {
      if (num.trim()) {
        const { data } = await supabase.from('orders').select('*').eq('id', num.trim()).maybeSingle()
        setRes(data || false)
      } else {
        const { data } = await supabase.from('orders').select('*').eq('phone', phone.trim()).order('id', { ascending: false }).limit(10)
        setOrders(data || [])
        if (!data || data.length === 0) setRes(false)
      }
    } catch { setRes(false) }
    setLoading(false)
  }

  const statusColors = { pending: '#38BDF8', processing: '#3b82f6', shipped: '#059669', delivered: '#059669', cancelled: '#ef4444' }
  const statusLabels = { pending: '⏳ انتظار', processing: '🔄 تجهيز', shipped: '🚚 شحن', delivered: '✅ تسليم', cancelled: '❌ ملغي' }

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📍 تتبع الطلب</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <input className="fi" value={num} onChange={e => setNum(e.target.value)} placeholder="🔢 رقم الطلب" style={{ marginBottom: 0 }} onKeyDown={e => e.key === 'Enter' && track()} />
            <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>أو</div>
            <input className="fi" value={phone} onChange={e => setPhone(e.target.value)} placeholder="📱 رقم هاتفك" type="tel" style={{ marginBottom: 0 }} onKeyDown={e => e.key === 'Enter' && track()} />
          </div>
          <button className="abtn" onClick={track} disabled={loading}>{loading ? '⏳ جاري البحث...' : '🔍 تتبع طلبي'}</button>
          {res === false && orders.length === 0 && !loading && (num || phone) && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#ef4444' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
              <p style={{ fontWeight: 700 }}>لا توجد طلبيات بهذه البيانات</p>
            </div>
          )}
          {res && res.id && (
            <div style={{ marginTop: 16, background: '#EFF9FF', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 900, fontSize: 15 }}>طلب #{String(res.id).slice(-6)}</span>
                <span style={{ background: statusColors[res.status] || '#94a3b8', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{statusLabels[res.status] || res.status}</span>
              </div>
              <div style={{ color: '#0077B6', fontSize: 13 }}>{res.customer_name} — {res.phone}</div>
              <div style={{ color: '#0077B6', fontWeight: 900, fontSize: 18, margin: '6px 0' }}>{Number(res.total).toFixed(0)} {currency}</div>
              {steps.map((s, i) => {
                const cur = steps.indexOf(res.status)
                return (
                  <div key={s} className="trstep">
                    <div className={`trdot ${i <= cur ? 'done' : 'wait'}`}>{i <= cur ? '✓' : i + 1}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: i <= cur ? '#0077B6' : '#94a3b8' }}>{labels[s]}</div>
                  </div>
                )
              })}
            </div>
          )}
          {orders.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 10, fontSize: 14 }}>طلبياتك ({orders.length})</div>
              {orders.map(o => (
                <div key={o.id} style={{ background: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700 }}>#{String(o.id).slice(-6)}</span>
                    <span style={{ background: statusColors[o.status] || '#94a3b8', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{statusLabels[o.status] || o.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#0077B6' }}>{new Date(o.created_at).toLocaleDateString('ar-DZ')}</div>
                  <div style={{ fontWeight: 700, color: '#0077B6', marginTop: 4 }}>{Number(o.total).toFixed(0)} {currency}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
