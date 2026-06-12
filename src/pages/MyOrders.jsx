/**
 * MyOrders.jsx — صفحة طلباتي للعميل المسجل
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export default function MyOrders({ onClose, currency, customerId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', customerId)
        .order('id', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [customerId])

  const statusStyle = (s) => {
    const styles = {
      pending: { bg: '#fef9c3', color: '#92400e', label: 'قيد الانتظار' },
      processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'قيد التجهيز' },
      shipped: { bg: '#e0e7ff', color: '#5b21b6', label: 'تم الشحن' },
      delivered: { bg: '#d1fae5', color: '#059669', label: 'تم التسليم' }
    }
    return styles[s] || styles.pending
  }

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center" style={{ maxWidth: 600 }}>
        <div className="mhead">
          <h3>📋 طلباتي السابقة</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading && <div className="empty">⏳ جاري التحميل...</div>}
          {!loading && orders.length === 0 && (
            <div className="empty">
              <i className="fas fa-box-open"></i>
              <p>لا توجد طلبات سابقة</p>
            </div>
          )}
          {orders.map(o => {
            const st = statusStyle(o.status)
            const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || [])
            return (
              <div key={o.id} className="order-card" style={{ background: 'white', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid #E8DDD5' }}>
                <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="order-id" style={{ fontWeight: 900, color: '#FF6B35' }}>#{o.id}</span>
                  <span className={`order-status ${o.status}`} style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 12, color: '#7A6A5A', marginBottom: 6 }}>{o.date}</div>
                <div style={{ marginBottom: 6 }}>
                  {items.slice(0, 3).map(i => (
                    <div key={i.id} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{i.name} × {i.quantity}</span>
                      <span>{(i.price * i.quantity).toFixed(0)} {currency}</span>
                    </div>
                  ))}
                  {items.length > 3 && <div style={{ fontSize: 11, color: '#94a3b8' }}>+{items.length - 3} منتجات أخرى</div>}
                </div>
                <div className="order-total" style={{ fontWeight: 900, color: '#1A0A00' }}>الإجمالي: {Number(o.total).toFixed(0)} {currency}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}