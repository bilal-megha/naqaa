import React, { useState } from 'react'

export default function CartModal({ cart, setCart, onClose, onCheckout, freeShip, currency, customer, settings, onPointsUpdate }) {
  const [usePoints, setUsePoints] = useState(false)

  const cartTotal    = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)
  const changeQty    = (id, d) => setCart(p => p.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i))
  const remove       = id     => setCart(p => p.filter(i => i.id !== id))

  // نظام النقاط — من إعدادات المتجر
  const pointsPerOrder = parseFloat(settings?.points_per_order || '100')  // كل 100 دج = نقطة
  const pointsToDzd    = parseFloat(settings?.points_to_dzd   || '1')     // نقطة = 1 دج خصم
  const currentPoints  = customer?.points || 0
  const maxPointsDisc  = Math.floor(currentPoints * pointsToDzd)
  const pointsDisc     = usePoints ? Math.min(maxPointsDisc, cartTotal) : 0
  const finalTotal     = Math.max(0, cartTotal - pointsDisc)
  const pointsEarned   = Math.floor(finalTotal / pointsPerOrder)
  const freeShipVal    = parseFloat(freeShip || settings?.free_shipping_threshold || 5000)
  const pct            = Math.min(100, (cartTotal / freeShipVal) * 100)
  const remaining      = freeShipVal - cartTotal

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet">
        <div className="mhandle" />
        <div className="mhead">
          <h3>🛒 سلة المشتريات ({cart.reduce((s,i) => s + i.qty, 0)} كرتون)</h3>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">
          {cart.length === 0
            ? <div className="empty"><i className="fas fa-shopping-cart" /><p>السلة فارغة</p></div>
            : <>
              {/* ── عناصر السلة ── */}
              {cart.map(i => (
                <div key={i.id} className="ci">
                  {i.image
                    ? <img src={i.image} className="ci-img" alt="" loading="lazy" />
                    : <div className="ci-img">🛍️</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, color: '#0D1B2A',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {i.name}
                    </div>
                    <div style={{ color: 'var(--clr-primary,#1565C0)', fontWeight: 900, fontSize: 15, marginTop: 3 }}>
                      {(i.price * i.qty).toFixed(0)} {currency}
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginRight: 5 }}>
                        ({i.price} × {i.qty})
                      </span>
                    </div>
                    <div className="qty-row">
                      <button className="qty-b" onClick={() => changeQty(i.id, -1)}>−</button>
                      <span style={{ fontWeight: 900, fontSize: 15, minWidth: 30, textAlign: 'center' }}>
                        {i.qty}
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}> كرتون</span>
                      </span>
                      <button className="qty-b" onClick={() => changeQty(i.id, 1)}>+</button>
                    </div>
                  </div>
                  <button onClick={() => remove(i.id)}
                    style={{ border:'none', background:'none', color:'#EF4444',
                      cursor:'pointer', fontSize:20, padding:6, flexShrink:0 }}>
                    🗑️
                  </button>
                </div>
              ))}

              {/* ── شريط التوصيل المجاني ── */}
              {cartTotal < freeShipVal && (
                <div style={{ background:'linear-gradient(135deg,#EEF4FF,#C7D9F5)',
                  borderRadius:14, padding:'12px 14px', margin:'12px 0',
                  border:'1.5px solid #C7D9F5' }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#0D47A1', marginBottom:7 }}>
                    🚚 أضف <strong style={{ color:'var(--clr-accent,#FF6D00)' }}>{remaining.toFixed(0)} {currency}</strong> للتوصيل المجاني!
                  </div>
                  <div style={{ background:'#C7D9F5', borderRadius:30, height:8, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%',
                      background:'linear-gradient(90deg,var(--clr-primary,#1565C0),#42A5F5)',
                      borderRadius:30, transition:'width .4s' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    fontSize:10, color:'#64748B', marginTop:4, fontWeight:700 }}>
                    <span>0</span>
                    <span>{freeShipVal.toLocaleString()} {currency} = توصيل مجاني 🎉</span>
                  </div>
                </div>
              )}

              {cartTotal >= freeShipVal && (
                <div style={{ background:'#D1FAE5', borderRadius:14, padding:'10px 14px',
                  margin:'12px 0', textAlign:'center',
                  fontSize:13, fontWeight:900, color:'#065F46' }}>
                  🎉 مبروك! التوصيل مجاني لهذا الطلب
                </div>
              )}

              {/* ── النقاط — اختياري ── */}
              {customer && currentPoints > 0 && (
                <div style={{ background: usePoints
                    ? 'linear-gradient(135deg,#ECFDF5,#D1FAE5)'
                    : 'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
                  borderRadius:14, padding:'14px', margin:'12px 0',
                  border: usePoints ? '1.5px solid #6EE7B7' : '1.5px solid #FED7AA',
                  transition:'.3s' }}>
                  <div style={{ fontWeight:900, fontSize:14, color:'#92400E', marginBottom:10 }}>
                    ⭐ رصيد نقاطك: <span style={{ color:'var(--clr-accent,#FF6D00)' }}>{currentPoints} نقطة</span>
                    <span style={{ fontSize:12, color:'#B45309', marginRight:6 }}>
                      = {maxPointsDisc} {currency} خصم
                    </span>
                  </div>

                  {/* زر التبديل */}
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => setUsePoints(false)}
                      style={{ flex:1, padding:'10px', borderRadius:12, border:'2px solid',
                        borderColor: !usePoints ? '#92400E' : '#E2E8F0',
                        background: !usePoints ? '#FEF3C7' : 'white',
                        fontWeight:800, fontSize:12, cursor:'pointer',
                        color: !usePoints ? '#92400E' : '#94a3b8',
                        fontFamily:'inherit', transition:'.2s' }}>
                      💰 جمع النقاط
                      <div style={{ fontSize:10, marginTop:3, fontWeight:600 }}>
                        +{Math.floor(finalTotal / pointsPerOrder)} نقطة جديدة
                      </div>
                    </button>
                    <button onClick={() => setUsePoints(true)}
                      style={{ flex:1, padding:'10px', borderRadius:12, border:'2px solid',
                        borderColor: usePoints ? '#059669' : '#E2E8F0',
                        background: usePoints ? '#D1FAE5' : 'white',
                        fontWeight:800, fontSize:12, cursor:'pointer',
                        color: usePoints ? '#065F46' : '#94a3b8',
                        fontFamily:'inherit', transition:'.2s' }}>
                      🎁 استخدام النقاط
                      <div style={{ fontSize:10, marginTop:3, fontWeight:600 }}>
                        خصم {maxPointsDisc} {currency}
                      </div>
                    </button>
                  </div>

                  {usePoints && (
                    <div style={{ marginTop:10, fontSize:12, fontWeight:700,
                      color:'#065F46', textAlign:'center', background:'#A7F3D0',
                      borderRadius:8, padding:'6px' }}>
                      ✅ سيُخصم {pointsDisc.toFixed(0)} {currency} من نقاطك
                    </div>
                  )}
                </div>
              )}

              {/* ── ملخص الطلب ── */}
              <div style={{ background:'#F5F7FA', borderRadius:16,
                padding:'14px', margin:'14px 0', border:'1.5px solid #E2E8F0' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  marginBottom:8, fontSize:14, fontWeight:700 }}>
                  <span style={{ color:'#64748B' }}>إجمالي المنتجات</span>
                  <span style={{ color:'#0D1B2A' }}>{cartTotal.toFixed(0)} {currency}</span>
                </div>
                {pointsDisc > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between',
                    marginBottom:8, fontSize:13, fontWeight:700 }}>
                    <span style={{ color:'#059669' }}>⭐ خصم النقاط</span>
                    <span style={{ color:'#059669' }}>-{pointsDisc.toFixed(0)} {currency}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between',
                  marginBottom:8, fontSize:13, fontWeight:700 }}>
                  <span style={{ color:'#64748B' }}>التوصيل</span>
                  <span style={{ color: cartTotal >= freeShipVal ? '#059669' : '#64748B', fontWeight:900 }}>
                    {cartTotal >= freeShipVal ? '🎉 مجاني' : 'حسب المنطقة'}
                  </span>
                </div>
                <div style={{ height:1, background:'#E2E8F0', margin:'8px 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between',
                  fontSize:18, fontWeight:900 }}>
                  <span style={{ color:'#0D1B2A' }}>الإجمالي</span>
                  <span style={{ color:'var(--clr-primary,#1565C0)' }}>{finalTotal.toFixed(0)} {currency}</span>
                </div>
                {!usePoints && pointsEarned > 0 && (
                  <div style={{ marginTop:8, fontSize:12, fontWeight:800,
                    color:'var(--clr-primary,#1565C0)', textAlign:'center',
                    background:'#EEF4FF', borderRadius:8, padding:'6px' }}>
                    ⭐ ستكسب {pointsEarned} نقطة من هذا الطلب
                  </div>
                )}
              </div>

              <button className="abtn" onClick={() => onCheckout(finalTotal, usePoints ? pointsDisc : 0)}>
                <i className="fas fa-shopping-bag" /> إتمام الشراء — {finalTotal.toFixed(0)} {currency}
              </button>
            </>
          }
        </div>
      </div>
    </div>
  )
}
