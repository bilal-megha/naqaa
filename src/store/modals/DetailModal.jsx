import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== DetailModal ==========
export default function DetailModal({ product, wishlist, onClose, onAddCart, onToggleWish, currency, products, sevenAgo, onShowProduct, promos }) {
  if (!product) return null
  const p = product
  const disc = Number(p.discount) || 0
  const finalPrice = disc > 0 ? (p.price * (1 - disc / 100)).toFixed(0) : p.price
  const related = products.filter(r => (r.category_id === p.category_id || r.brand_id === p.brand_id) && r.id !== p.id && !r.disabled).slice(0, 6)
  const volTiers = [{ qty: 6, disc: 5 }, { qty: 12, disc: 10 }, { qty: 24, disc: 15 }]

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet">
        <div className="mhandle"></div>
        {p.image ? <img src={p.image} style={{ width: '100%', height: 260, objectFit: 'cover' }} alt={p.name} /> :
          <div style={{ width: '100%', height: 200, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>🛍️</div>}
        <div className="mhead">
          <h3 style={{ flex: 1, fontSize: 15 }}>{p.name}</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              {disc > 0 && <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through', marginLeft: 8 }}>{p.price} {currency}</span>}
              <span style={{ fontSize: 24, fontWeight: 900, color: '#0077B6' }}>{finalPrice} {currency}</span>
              {disc > 0 && <span className="pc-disc" style={{ marginRight: 8 }}>-{disc}%</span>}
            </div>
            <button onClick={() => onToggleWish(p.id)} style={{ width: 40, height: 40, borderRadius: '50%', background: wishlist.includes(p.id) ? '#EFF6FF' : '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 20 }}>
              <i className="fas fa-heart" style={{ color: wishlist.includes(p.id) ? '#0077B6' : '#CBD5E1' }}></i>
            </button>
          </div>
          {p.carton_price && <p style={{ color: '#0077B6', fontSize: 13, marginBottom: 8 }}>الكرتون ({p.units || 12} قطعة): {p.carton_price} {currency}</p>}
          {(p.stock || 0) > 0 && (p.stock || 0) < 10 && <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>⚠️ متبقي {p.stock} قطعة فقط!</p>}
          {(p.stock || 0) === 0 && <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>❌ نفذ من المخزون</p>}

          <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 12, padding: 12, marginBottom: 12, border: '1px solid #059669' }}>
            <div style={{ fontWeight: 800, color: '#059669', marginBottom: 8, fontSize: 13 }}>📦 كلما اشتريت أكثر — وفّرت أكثر!</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {volTiers.map(({ qty, disc }) => (
                <div key={qty} style={{ background: 'white', borderRadius: 10, padding: '7px 4px', textAlign: 'center', border: '1px solid #059669' }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{qty}+ قطعة</div>
                  <div style={{ color: '#059669', fontWeight: 700, fontSize: 12 }}>{disc}% خصم</div>
                  <div style={{ fontSize: 11, color: '#065f46' }}>{(p.price * (1 - disc / 100)).toFixed(0)} {currency}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="abtn" onClick={() => { onAddCart(p); onClose() }} disabled={(p.stock || 0) === 0}>
            <i className="fas fa-cart-plus"></i>
            {(p.stock || 0) === 0 ? 'نفذ من المخزون' : 'أضف للسلة'}
          </button>
          <button onClick={() => {
            const msg = `🛍️ ${p.name}%0A💰 ${p.price} ${currency}/كرتون%0A📦 ${p.units || 12} قطعة/كرتون%0A🔗 ${window.location.origin}`
            window.open(`https://wa.me/?text=${msg}`, '_blank')
          }} style={{ width: '100%', padding: '10px', borderRadius: 30, border: '2px solid #25D366', background: 'none', color: '#25D366', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, fontSize: 14 }}>
            <i className="fab fa-whatsapp"></i> شارك هذا المنتج
          </button>

          {related.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>🔄 قد يعجبك أيضاً</div>
              <div className="hscroll">
                {related.map(r => (
                  <div key={r.id} onClick={() => onShowProduct(r)} style={{ minWidth: 95, cursor: 'pointer', textAlign: 'center', flexShrink: 0 }}>
                    {r.image ? <img src={r.image} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} /> :
                      <div style={{ width: 80, height: 80, borderRadius: 12, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🛍️</div>}
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#0077B6', fontWeight: 800 }}>{r.price} {currency}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ReviewsSection productId={p.id} currency={currency} />
        </div>
      </div>
    </div>
  )
}

// ========== ReviewsSection ==========
function ReviewsSection({ productId, currency }) {
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hover, setHover] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!productId) return
    supabase.from('reviews').select('*').eq('product_id', productId).order('id', { ascending: false }).limit(20)
      .then(({ data }) => { setReviews(data || []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [productId])

  const avgR = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0
  let cust = null
  try { cust = JSON.parse(localStorage.getItem('nq_customer') || 'null') } catch { cust = null }

  const submit = async () => {
    if (!cust) { showToast('سجّل دخولك لإضافة تقييم', true); return }
    if (!rating) { showToast('اختر عدد النجوم أولاً', true); return }
    setSaving(true)
    await supabase.from('reviews').insert({
      id: Date.now(), product_id: productId,
      customer_id: cust.id, customer_name: cust.name,
      rating, comment: comment.trim(),
      created_at: new Date().toISOString()
    }).catch(() => {})
    const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('id', { ascending: false }).limit(20)
    setReviews(data || []); setRating(0); setComment(''); setSaving(false)
    showToast('✅ تم إضافة تقييمك')
  }

  if (!loaded) return null

  return (
    <div style={{ borderTop: '1px solid #E0F0FA', padding: '16px 18px 0' }}>
      {reviews.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, background: '#EFF9FF', borderRadius: 12, padding: 14 }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#0077B6', lineHeight: 1 }}>{avgR}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 1, margin: '4px 0' }}>
              {[1, 2, 3, 4, 5].map(n => <span key={n} style={{ color: n <= Math.round(avgR) ? '#0077B6' : '#DBEAFE', fontSize: 14 }}>★</span>)}
            </div>
            <div style={{ fontSize: 11, color: '#0077B6' }}>{reviews.length} تقييم</div>
          </div>
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map(n => {
              const cnt = reviews.filter(r => r.rating === n).length
              const pct = reviews.length ? Math.round(cnt / reviews.length * 100) : 0
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#0077B6', width: 8, textAlign: 'center' }}>{n}</span>
                  <span style={{ color: '#0077B6', fontSize: 11 }}>★</span>
                  <div style={{ flex: 1, background: '#DBEAFE', borderRadius: 30, height: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#0077B6', borderRadius: 30, transition: 'width .5s' }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#94a3b8', width: 18, textAlign: 'left' }}>{cnt}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <h3 style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>⭐ التقييمات ({reviews.length})</h3>
      {cust ? (
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#1E293B' }}>🌟 أضف تقييمك</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}
                style={{ fontSize: 30, cursor: 'pointer', transition: 'transform .15s', color: (hover || rating) >= n ? '#0077B6' : '#DBEAFE', transform: (hover || rating) >= n ? 'scale(1.15)' : 'scale(1)' }}>★</span>
            ))}
            {rating > 0 && <span style={{ fontSize: 12, color: '#0077B6', marginRight: 4, alignSelf: 'center' }}>{['', 'سيء', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][rating]}</span>}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="اكتب تعليقك (اختياري)..." maxLength={300} rows={2}
            style={{ border: '1.5px solid #DBEAFE', borderRadius: 10, padding: '9px 12px', width: '100%', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'none', background: 'white', boxSizing: 'border-box', marginBottom: 8 }}
            onFocus={e => e.target.style.borderColor = '#0077B6'} onBlur={e => e.target.style.borderColor = '#DBEAFE'} />
          <button className="abtn" onClick={submit} disabled={saving || !rating} style={{ marginBottom: 0, padding: '10px', fontSize: 13, opacity: !rating ? 0.5 : 1 }}>{saving ? '⏳ جاري الإرسال...' : '✅ إرسال التقييم'}</button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#0077B6', marginBottom: 12, textAlign: 'center', padding: '8px', background: '#F8FAFC', borderRadius: 10 }}>🔐 <strong>سجّل دخولك</strong> لإضافة تقييم</p>
      )}
      {reviews.map(r => (
        <div key={r.id} style={{ borderBottom: '1px solid #E0F0FA', padding: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
            <div>
              <strong style={{ fontSize: 13, color: '#1E293B' }}>{r.customer_name}</strong>
              <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                {[1, 2, 3, 4, 5].map(n => <span key={n} style={{ color: n <= r.rating ? '#0077B6' : '#DBEAFE', fontSize: 13 }}>★</span>)}
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString('ar-DZ')}</span>
          </div>
          {r.comment && <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
        </div>
      ))}
      {reviews.length === 0 && loaded && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>لا توجد تقييمات بعد — كن أول من يقيّم! ⭐</p>}
    </div>
  )
}

// ========== ThankyouModal ==========
function ThankyouModal({ orderId, storeName, onClose }) {
  return (
    <div className="moverlay">
      <div className="msheet center">
        <div className="mbody" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>تمت الطلبية بنجاح!</h2>
          <p style={{ color: '#0077B6', marginBottom: 6 }}>تم تأكيد طلبك وبدأ التجهيز</p>
          <p style={{ color: '#0077B6', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>رقم الطلب: {orderId}</p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>ستصلك رسالة واتساب بتفاصيل التوصيل</p>
          <button className="abtn" onClick={onClose}><i className="fas fa-home"></i> العودة للمتجر</button>
        </div>
      </div>
    </div>
  )
}
