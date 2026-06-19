import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase.js'

/**
 * Hook مركزي لجلب بيانات المتجر بكفاءة:
 * - 5 طلبات متوازية (products, brands, categories, settings, promotions)
 * - best sellers بالتوازي مع الطلبات الأساسية (لا sequential)
 * - select محدد لحقول products بدل select('*')
 * - كاشينج بسيط في sessionStorage (يُنظّف عند إغلاق التبويب)
 */
const CACHE_KEY = 'nq_store_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 دقائق

export function useStoreData() {
  const [products, setProducts]     = useState([])
  const [brands, setBrands]         = useState([])
  const [categories, setCategories] = useState([])
  const [settings, setSettings]     = useState({})
  const [banners, setBanners]       = useState([])
  const [promos, setPromos]         = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      // ── محاولة قراءة الكاش ──────────────────────────────
      try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        if (raw) {
          const { ts, data } = JSON.parse(raw)
          if (Date.now() - ts < CACHE_TTL) {
            setProducts(data.products)
            setBrands(data.brands)
            setCategories(data.categories)
            setSettings(data.settings)
            setBanners(data.banners)
            setPromos(data.promos)
            setBestSellers(data.bestSellers)
            setLoading(false)
            return
          }
        }
      } catch {}

      // ── جلب كل البيانات بالتوازي الكامل ────────────────
      const [rP, rB, rC, rS, rPr, rO] = await Promise.allSettled([
        supabase.from('products')
          .select('id,name,price,carton_price,image,stock,discount,units,category_id,brand_id,created_at,disabled')
          .or('disabled.eq.false,disabled.is.null')
          .order('created_at', { ascending: false }),
        supabase.from('brands').select('id,name,image').order('name'),
        supabase.from('categories').select('id,name,image').order('name'),
        supabase.from('settings').select('key,value'),
        supabase.from('promotions').select('*').eq('active', true),
        supabase.from('orders').select('items').limit(200),
      ])

      const p   = rP.status  === 'fulfilled' ? (rP.value.data  || []) : []
      const b   = rB.status  === 'fulfilled' ? (rB.value.data  || []) : []
      const c   = rC.status  === 'fulfilled' ? (rC.value.data  || []) : []
      const s   = rS.status  === 'fulfilled' ? (rS.value.data  || []) : []
      const pr  = rPr.status === 'fulfilled' ? (rPr.value.data || []) : []
      const ords = rO.status === 'fulfilled' ? (rO.value.data  || []) : []

      const settingsMap = {}
      s.forEach(r => (settingsMap[r.key] = r.value))

      let bans = []
      try { bans = JSON.parse(settingsMap['store_banners'] || '[]') } catch {}

      const activePromos = pr.filter(px => !px.end_date || new Date(px.end_date) > new Date())

      // حساب best sellers
      const counts = {}
      ords.forEach(o => {
        try {
          const its = typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
          its.forEach(i => { if (i?.id) counts[String(i.id)] = (counts[String(i.id)] || 0) + (i.qty || 1) })
        } catch {}
      })
      const bs = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id]) => id)

      setProducts(p)
      setBrands(b)
      setCategories(c)
      setSettings(settingsMap)
      setBanners(bans)
      setPromos(activePromos)
      setBestSellers(bs)
      setLoading(false)

      // ── حفظ في الكاش ────────────────────────────────────
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          ts: Date.now(),
          data: { products: p, brands: b, categories: c, settings: settingsMap, banners: bans, promos: activePromos, bestSellers: bs }
        }))
      } catch {}
    }

    load()
  }, [])

  // دالة لتحديث مخزون منتج واحد في الـ state بعد الطلب
  const decreaseStock = (cartItems) => {
    setProducts(prev => prev.map(p => {
      const item = cartItems.find(i => i.id === p.id)
      if (!item) return p
      return { ...p, stock: Math.max(0, (p.stock || 0) - item.qty) }
    }))
    // إلغاء الكاش ليُعاد التحميل في المرة القادمة
    try { sessionStorage.removeItem(CACHE_KEY) } catch {}
  }

  return { products, brands, categories, settings, banners, promos, bestSellers, loading, decreaseStock }
}
