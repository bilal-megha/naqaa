/**
 * Store.jsx — نسخة مبسطة خالية من الأخطاء
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

function showToast(msg, isErr = false) {
  alert(msg)
}

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from('products').select('*').eq('disabled', false)
      setProducts(data || [])
      setLoading(false)
    }
    loadProducts()
  }, [])

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item))
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }
    setCartCount(cartCount + 1)
    showToast('✅ تمت الإضافة')
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}>⏳ جاري التحميل...</div>
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', padding: 20 }}>
      <h1 style={{ color: '#FF6B35', textAlign: 'center' }}>🛍️ نقاء</h1>
      <p style={{ textAlign: 'center' }}>أفضل المنتجات بأفضل الأسعار</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
        {products.map(product => (
          <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: 40 }}>📦</div>
            <h3 style={{ fontSize: 14, margin: '8px 0' }}>{product.name}</h3>
            <p style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 16 }}>{product.price} دج</p>
            <button
              onClick={() => addToCart(product)}
              style={{ background: '#FF6B35', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 25, cursor: 'pointer', width: '100%' }}
            >
              🛒 أضف للسلة
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#FF6B35', color: 'white', padding: '10px 20px', borderRadius: 30 }}>
          🛒 {cart.reduce((s, i) => s + i.qty, 0)} منتج في السلة
        </div>
      )}
    </div>
  )
}