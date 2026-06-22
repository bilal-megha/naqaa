import React from 'react'

export default function CartModal({ cart, setCart, onClose, onCheckout, freeShip, currency, customer, settings }) {
  const cartTotal    = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)
  const changeQty    = (id, d) => setCart(p => p.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i))
  const remove       = id     => setCart(p => p.filter(i => i.id !== id))

  // نقاط الزبون (من إعدادات المتجر)
  const pointsPer100  = parseFloat(settings?.points_per_100 || '1')
  const pointsToDzd   = parseFloat(settings?.points_to_dzd  || '1')
  const currentPoints = customer?.points || 0
  const maxDiscount   = Math.floor(currentPoints * pointsToDzd)
  const pointsDisc    = Math.min(maxDiscount, cartTotal * 0.5) // أقصى خصم 50% بالنقاط
  const finalTotal    = Math.max(0, cartTotal - pointsDisc)
  const pointsEarned  = Math.floor(finalTotal / 100 * pointsPer100)
  const freeShipVal   = parseFloat(freeShip || settings?.free_shipping_threshold || 5000)

  const pct = Math.min(100, (cartTotal / freeShipVal) * 100)
  const remaining = freeShipVal - cartTotal

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
                    <div style={{ color: '#1565C0', fontWeight: 900, fontSize: 15, marginTop: 3 }}>
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
                    🚚 أضف <strong style={{ color:'#FF6D00' }}>{remaining.toFixed(0)} {currency}</strong> للتوصيل المجاني!
                  </div>
                  <div style={{ background:'#C7D9F5', borderRadius:30, height:8, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%',
                      background:'linear-gradient(90deg,#1565C0,#42A5F5)',
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

              {/* ── النقاط ── */}
              {customer && currentPoints > 0 && (
                <div style={{ background:'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
                  borderRadius:14, padding:'12px 14px', margin:'12px 0',
                  border:'1.5px solid #FED7AA' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:900, fontSize:13, color:'#92400E' }}>
                        ⭐ رصيد نقاطك: {currentPoints} نقطة
                      </div>
                      <div style={{ fontSize:11, color:'#B45309', fontWeight:700, marginTop:3 }}>
                        = خصم {maxDiscount} {currency} (سيُطبَّق تلقائياً)
                      </div>
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#FF6D00' }}>
                      -{pointsDisc.toFixed(0)} {currency}
                    </div>
                  </div>
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
                  <span style={{ color:'#1565C0' }}>{finalTotal.toFixed(0)} {currency}</span>
                </div>
                {pointsEarned > 0 && (
                  <div style={{ marginTop:8, fontSize:12, fontWeight:800,
                    color:'#1565C0', textAlign:'center', background:'#EEF4FF',
                    borderRadius:8, padding:'6px' }}>
                    ⭐ ستكسب {pointsEarned} نقطة من هذا الطلب
                  </div>
                )}
              </div>

              <button className="abtn" onClick={() => onCheckout(finalTotal)}>
                <i className="fas fa-shopping-bag" /> إتمام الشراء — {finalTotal.toFixed(0)} {currency}
              </button>
            </>
          }
        </div>
      </div>
    </div>
  )
}
