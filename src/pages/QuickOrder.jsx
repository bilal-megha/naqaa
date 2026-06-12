/**
 * QuickOrder.jsx — صفحة الطلب السريع
 * إضافة منتجات متعددة بكميات مختلفة من صفحة واحدة
 */
import { useState } from 'react'

export default function QuickOrder({ products, onClose, addToCart, currency }) {
  const [qtys, setQtys] = useState({})
  const [loading, setLoading] = useState(false)

  const handleQtyChange = (id, qty) => {
    setQtys(prev => ({ ...prev, [id]: Math.max(0, parseInt(qty) || 0) }))
  }

  const handleSelectAll = (e) => {
    const checked = e.target.checked
    const newQtys = {}
    if (checked) {
      products.forEach(p => { newQtys[p.id] = 1 })
    }
    setQtys(newQtys)
  }

  const addAllToCart = () => {
    let added = 0
    products.forEach(p => {
      const qty = qtys[p.id] || 0
      if (qty > 0 && (p.stock || 0) >= qty) {
        addToCart(p, qty)
        added++
      }
    })
    if (added > 0) {
      const toast = document.createElement('div')
      toast.className = 'toast'
      toast.textContent = `✅ تم إضافة ${added} منتج إلى السلة`
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2500)
      onClose()
    } else {
      const toast = document.createElement('div')
      toast.className = 'toast err'
      toast.textContent = '⚠️ لم يتم إضافة أي منتج'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2500)
    }
  }

  const totalItems = Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)
  const selectedCount = Object.keys(qtys).filter(id => (qtys[id] || 0) > 0).length

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet" style={{ maxWidth: 700 }}>
        <div className="mhandle"></div>
        <div className="mhead">
          <h3>⚡ طلب سريع (بالكرتون)</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          {/* شريط التحكم العلوي */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            padding: '8px 12px',
            background: '#FFF0EB',
            borderRadius: 12,
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input type="checkbox" onChange={handleSelectAll} checked={selectedCount === products.length && products.length > 0} />
                تحديد الكل (كرتون واحد لكل منتج)
              </label>
              <span style={{ fontSize: 12, color: '#FF6B35', fontWeight: 700 }}>📦 {totalItems} كرتون</span>
            </div>
            <button
              className="abtn"
              style={{ margin: 0, padding: '8px 16px', fontSize: 13, width: 'auto' }}
              onClick={addAllToCart}
              disabled={totalItems === 0}
            >
              🛒 إضافة الكل ({selectedCount} منتج)
            </button>
          </div>

          {/* جدول المنتجات */}
          <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E8DDD5' }}>المنتج</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #E8DDD5' }}>سعر الكرتون</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #E8DDD5' }}>الكمية (كرتون)</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #E8DDD5' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const cartonPrice = p.price * (p.units || 12)
                  const qty = qtys[p.id] || 0
                  const isOutStock = (p.stock || 0) === 0
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F7F3EF', opacity: isOutStock ? 0.5 : 1 }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.image && (
                            <img
                              src={p.image}
                              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                              alt={p.name}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 700 }}>{p.name}</div>
                            {isOutStock && <div style={{ fontSize: 10, color: '#ef4444' }}>⚠️ غير متوفر</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#FF6B35', fontWeight: 700 }}>
                        {cartonPrice.toFixed(0)} {currency}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max={p.stock || 0}
                          value={qty}
                          onChange={e => handleQtyChange(p.id, e.target.value)}
                          style={{
                            width: 70,
                            padding: '6px',
                            textAlign: 'center',
                            border: '1px solid #E8DDD5',
                            borderRadius: 8,
                            background: isOutStock ? '#f8fafc' : 'white'
                          }}
                          disabled={isOutStock}
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#1A0A00' }}>
                        {(cartonPrice * qty).toFixed(0)} {currency}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* خلاصة */}
          {totalItems > 0 && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #FF6B35, #E8430E)',
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white'
            }}>
              <span style={{ fontWeight: 700 }}>📦 إجمالي الكرتونات: {totalItems}</span>
              <button className="abtn" style={{ margin: 0, padding: '8px 20px', width: 'auto', background: 'white', color: '#FF6B35' }} onClick={addAllToCart}>
                🛒 إضافة للسلة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}