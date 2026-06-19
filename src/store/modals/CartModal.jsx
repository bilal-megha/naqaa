import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== CartModal ==========
export default function CartModal({ cart, setCart, onClose, onCheckout, freeShip, currency, promos, customer }) {
  const cartTotal = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)
  const changeQty = (id, d) => setCart(p => p.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i))
  const remove = id => setCart(p => p.filter(i => i.id !== id))

  const getBuy3Get1Discount = () => {
    const buyPromo = promos && promos.length > 0 ? promos.find(p => p.active && p.type === 'buy_x_get_y') : null
    if (!buyPromo) return 0
    const pids = typeof buyPromo.product_ids === 'string' ? JSON.parse(buyPromo.product_ids || '[]') : (buyPromo.product_ids || [])
    const eligible = cart.filter(i => pids.length === 0 || pids.includes(i.id))
    const totalQty = eligible.reduce((s, i) => s + i.qty, 0)
    const buyQty = buyPromo.buy_qty || 3
    const getQty = buyPromo.get_qty || 1
    if (totalQty < buyQty + getQty) return 0
    const cheapest = [...eligible].sort((a, b) => a.price - b.price)[0]
    return (cheapest?.price || 0) * getQty
  }
  const buy3Disc = getBuy3Get1Discount()
  const buyPromoActive = promos && promos.length > 0 ? promos.find(p => p.active && p.type === 'buy_x_get_y') : null

  const volTiers = [
    { min: 500, disc: 5, label: 'خصم 5%' },
    { min: 1000, disc: 10, label: 'خصم 10%' },
    { min: 2000, disc: 15, label: 'خصم 15%' },
  ]
  const currentTier = [...volTiers].reverse().find(t => cartTotal >= t.min)
  const nextTier = volTiers.find(t => cartTotal < t.min)
  const volDisc = currentTier ? cartTotal * (currentTier.disc / 100) : 0

  const pointsDiscount = customer ? Math.min(customer.points || 0, cartTotal - buy3Disc - volDisc) : 0
  const finalTotal = cartTotal - buy3Disc - volDisc - pointsDiscount

  const pointsEarned = Math.floor(finalTotal / 100)
  const currentPoints = customer?.points || 0
  const totalAfter = currentPoints + pointsEarned

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet">
        <div className="mhandle"></div>
        <div className="mhead">
          <h3>🛒 سلة المشتريات ({cart.reduce((s, i) => s + i.qty, 0)} كرتون)</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          {cart.length === 0
            ? <div className="empty"><i className="fas fa-shopping-cart"></i><p>السلة فارغة</p></div>
            : <>
              {cart.map(i => (
                <div key={i.id} className="ci">
                  {i.image ? <img src={i.image} className="ci-img" alt="" /> : <div className="ci-img">🛍️</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0C2D44' }}>{i.name}</div>
                    <div style={{ color: '#0EA5E9', fontWeight: 900, fontSize: 15, marginTop: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#4B7FA0' }}>سعر الكرتون: </span>
                      {i.price} {currency} × {i.qty} كرتون = {(i.price * i.qty).toFixed(0)} {currency}
                    </div>
                    <div className="qty-row">
                      <button className="qty-b" onClick={() => changeQty(i.id, -1)}>−</button>
                      <span style={{ fontWeight: 800, fontSize: 15, minWidth: 22, textAlign: 'center' }}>{i.qty} كرتون{i.unitsPerCarton ? ` (${i.qty * (i.unitsPerCarton || 12)} قطعة)` : ''}</span>
                      <button className="qty-b" onClick={() => changeQty(i.id, 1)}>+</button>
                    </div>
                  </div>
                  <button onClick={() => remove(i.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>🗑️</button>
                </div>
              ))}

              {buy3Disc > 0 && buyPromoActive && (
                <div style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', borderRadius: 14, padding: 12, margin: '10px 0', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>🎁 {buyPromoActive.name}</div>
                  <div style={{ fontSize: 13, color: '#065f46', marginTop: 4 }}>خصم: <strong>{buy3Disc.toFixed(0)} {currency}</strong></div>
                </div>
              )}

              {cartTotal < freeShip && (
                <div style={{ background: '#EFF9FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#C2410C', marginBottom: 5 }}>
                    🚚 أضف <strong style={{ color: '#0EA5E9', fontSize: 15 }}>{(freeShip - cartTotal).toFixed(0)} {currency}</strong> للتوصيل المجاني!
                  </div>
                  <div style={{ background: '#BAE6FD', borderRadius: 30, height: 7, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (cartTotal / freeShip) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#0EA5E9,#10b981)', borderRadius: 30, transition: 'width .4s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                    <span>0 {currency}</span><span style={{ color: '#10b981', fontWeight: 700 }}>🎁 {freeShip} {currency} = توصيل مجاني</span>
                  </div>
                </div>
              )}
              {cartTotal >= freeShip && (
                <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '8px 12px', marginBottom: 12, textAlign: 'center', fontWeight: 700, color: '#059669', fontSize: 13 }}>
                  🎉 أحسنت! التوصيل مجاني لهذا الطلب
                </div>
              )}

              {/* شريط تقدم النقاط */}
              <div style={{ background: '#DBEAFE', borderRadius: 14, padding: '12px 14px', margin: '12px 0', border: '1px solid #34D399' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: '#0369A1' }}>⭐ ستكسب من هذا الطلب</span>
                  <span style={{ color: '#0EA5E9' }}>{pointsEarned} نقطة</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  <span>نقاطك الحالية: {currentPoints}</span>
                  <span>→ بعد الطلب: {totalAfter}</span>
                </div>
                <div style={{ background: '#BAE6FD', borderRadius: 30, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (totalAfter / 1000) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg,#34D399,#10B981)',
                    borderRadius: 30,
                    transition: 'width .5s'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                  <span>0</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>🏅 1000 نقطة = مستوى VIP</span>
                </div>
              </div>

              <div className="prog-bar-wrap">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                  {currentTier
                    ? <span style={{ color: '#10b981' }}>🎉 خصم {currentTier.disc}% مفعّل! وفّرت {volDisc.toFixed(0)} {currency}</span>
                    : nextTier
                      ? <span>أضف {(nextTier.min - cartTotal).toFixed(0)} {currency} للحصول على {nextTier.label}</span>
                      : <span>🏆 أقصى خصم محقق!</span>
                  }
                  <span style={{ color: '#0EA5E9' }}>{Math.min(100, (cartTotal / 2000 * 100)).toFixed(0)}%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: `${Math.min(100, cartTotal / 2000 * 100)}%` }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                  <span>500دج→5%</span><span>1000دج→10%</span><span>2000دج→15%</span>
                </div>
              </div>

              {customer && customer.points > 0 && (
                <div style={{ background: '#DBEAFE', borderRadius: 14, padding: 12, margin: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>⭐ خصم النقاط</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>لديك {customer.points} نقطة</div>
                  </div>
                  <div style={{ fontWeight: 900, color: '#0EA5E9', fontSize: 16 }}>
                    - {pointsDiscount.toFixed(0)} {currency}
                  </div>
                </div>
              )}

              {(buy3Disc > 0 || volDisc > 0 || pointsDiscount > 0) && (
                <div style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through', textAlign: 'left', marginBottom: 4 }}>
                  {cartTotal.toFixed(0)} {currency}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18, marginBottom: 16 }}>
                <span>الإجمالي</span>
                <span style={{ color: '#0EA5E9' }}>{finalTotal.toFixed(0)} {currency}</span>
              </div>
              <button className="abtn" onClick={() => onCheckout(finalTotal, buy3Disc + volDisc + pointsDiscount)}>
                <i className="fas fa-credit-card"></i> إتمام الشراء
              </button>
            </>}
        </div>
      </div>
    </div>
  )
}
