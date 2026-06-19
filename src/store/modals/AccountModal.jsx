import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== AccountModal ==========
export default function AccountModal({ customer, onClose, onLogout, onUpdatePoints, currency }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    const fetch = async () => {
      if (!customer?.phone) { setLoading(false); return }
      const { data } = await supabase.from('orders')
        .select('id,date,total,status,items')
        .eq('customer_phone', customer.phone)
        .order('id', { ascending: false })
        .limit(10)
        .catch(() => ({ data: [] }))
      setOrders(data || [])
      setLoading(false)
    }
    fetch()
  }, [customer])

  const statusLabel = { pending: '⏳ قيد الانتظار', processing: '🔄 قيد المعالجة', shipped: '🚚 في الطريق', delivered: '✅ تم التسليم', cancelled: '❌ ملغي' }
  const statusColor = { pending: '#f59e0b', processing: '#0EA5E9', shipped: '#059669', delivered: '#10b981', cancelled: '#ef4444' }

  const tier = customer?.points >= 1000 ? { label: 'VIP ذهبي', color: '#f59e0b', icon: '🥇' }
              : customer?.points >= 500  ? { label: 'فضي', color: '#94a3b8', icon: '🥈' }
              : { label: 'برونزي', color: '#cd7f32', icon: '🥉' }

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet">
        <div className="mhandle" />
        {/* Header */}
        <div style={{ background: 'linear-gradient(150deg,#0284C7,#0EA5E9 55%,#10B981)', padding: '22px 18px 20px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '2px solid rgba(255,255,255,.5)' }}>
              {customer?.name?.[0] || '👤'}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>{customer?.name}</div>
              <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>{customer?.phone}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.2)', borderRadius: 20, padding: '3px 10px', marginTop: 6 }}>
                <span style={{ fontSize: 13 }}>{tier.icon}</span>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 12 }}>{tier.label}</span>
              </div>
            </div>
          </div>
          {/* بطاقة النقاط */}
          <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 14, padding: '12px 16px', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>⭐ رصيد نقاطك</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 26 }}>{customer?.points || 0}</div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 10 }}>كل 100 نقطة = 100 {currency} خصم</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 10, marginBottom: 4 }}>التقدم نحو VIP</div>
              <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 30, height: 8, width: 100, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, ((customer?.points || 0) / 1000) * 100)}%`, height: '100%', background: 'white', borderRadius: 30, transition: 'width .5s' }} />
              </div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 9, marginTop: 3 }}>{customer?.points || 0} / 1000 نقطة</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E0F4FF', background: 'white', position: 'sticky', top: 0, zIndex: 2 }}>
          {[{ id: 'info', label: '👤 بياناتي' }, { id: 'orders', label: '📦 طلباتي' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: activeTab === t.id ? '#0EA5E9' : '#94a3b8', borderBottom: activeTab === t.id ? '3px solid #0EA5E9' : '3px solid transparent', transition: '.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mbody">
          {activeTab === 'info' && (
            <div>
              {[
                { label: 'الاسم الكامل', value: customer?.name, icon: '👤' },
                { label: 'البريد الإلكتروني', value: customer?.email, icon: '📧' },
                { label: 'رقم الهاتف', value: customer?.phone, icon: '📱' },
                { label: 'العنوان', value: customer?.address || 'غير محدد', icon: '📍' },
                { label: 'تاريخ التسجيل', value: customer?.created_at ? new Date(customer.created_at).toLocaleDateString('ar-DZ') : '—', icon: '📅' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #E0F4FF' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0C2D44' }}>{item.value}</div>
                  </div>
                </div>
              ))}
              <button onClick={onLogout} style={{ width: '100%', marginTop: 20, padding: '13px', borderRadius: 30, background: '#FEF2F2', color: '#ef4444', border: '2px solid #FECACA', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className="fas fa-sign-out-alt"></i> تسجيل الخروج
              </button>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              {loading
                ? <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 32 }}>⏳</div><p style={{ color: '#94a3b8', marginTop: 12 }}>جاري تحميل طلباتك...</p></div>
                : orders.length === 0
                  ? <div className="empty"><i className="fas fa-box-open"></i><p>لا توجد طلبات بعد</p><p style={{ fontSize: 12, marginTop: 8 }}>ابدأ تسوّقك الآن!</p></div>
                  : orders.map(ord => {
                      let items = []
                      try { items = typeof ord.items === 'string' ? JSON.parse(ord.items || '[]') : (ord.items || []) } catch {}
                      return (
                        <div key={ord.id} style={{ border: '1.5px solid #E0F4FF', borderRadius: 16, padding: 14, marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#0C2D44' }}>طلب #{ord.id}</div>
                            <span style={{ background: statusColor[ord.status] + '22', color: statusColor[ord.status], borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
                              {statusLabel[ord.status] || ord.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>📅 {ord.date}</div>
                          {items.slice(0, 2).map((it, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#4B7FA0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span>📦</span>
                              <span style={{ flex: 1 }}>{it.name}</span>
                              <span style={{ fontWeight: 700 }}>×{it.quantity}</span>
                            </div>
                          ))}
                          {items.length > 2 && <div style={{ fontSize: 11, color: '#94a3b8' }}>+{items.length - 2} منتجات أخرى</div>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTop: '1px solid #E0F4FF', paddingTop: 10 }}>
                            <span style={{ fontWeight: 900, color: '#0EA5E9', fontSize: 16 }}>{parseFloat(ord.total).toFixed(0)} {currency}</span>
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>+{Math.floor(ord.total / 100)} نقطة مكتسبة</span>
                          </div>
                        </div>
                      )
                    })
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
