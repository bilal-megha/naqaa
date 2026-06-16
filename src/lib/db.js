/**
 * db.js  —  كل عمليات قاعدة البيانات
 *
 * النمط المستخدم: ذاكرة مؤقتة (cache) + Supabase
 *   - عند التشغيل: يُحمِّل كل البيانات من Supabase مرة واحدة
 *   - عند القراءة: يُرجِع من الذاكرة (سريع)
 *   - عند الكتابة: يُحدِّث الذاكرة + يُزامن Supabase
 */

import { supabase } from './supabase.js'

// ==================== الذاكرة المؤقتة ====================
export const cache = {
  products: [],
  suppliers: [],
  customers: [],
  employees: [],
  brands: [],
  categories: [],
  purchases: [],
  orders: [],
  coupons: [],
  notifications: [],
  expenses: [],
  reviews: [],
  activity_log: [],
  wishlist: [],
  settings: {},
}

// ==================== دوال التحويل (في الأعلى قبل الاستخدام) ====================

function toSnake(obj) {
  // تحويل camelCase → snake_case
  const map = {
    costPrice: 'cost_price',
    cartonPrice: 'carton_price',
    brandId: 'brand_id',
    categoryId: 'category_id',
    isPromo: 'is_promo',
    supplierId: 'supplier_id',
    supplierName: 'supplier_name',
    customerId: 'customer_id',
    productId: 'product_id',
    sessionId: 'session_id',
    isRead: 'is_read',
    maxUses: 'max_uses',
    minOrder: 'min_order',
    createdAt: 'created_at',
    minStock: 'min_stock',
    createdAt: 'created_at',
  }
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    result[map[k] || k] = v
  }
  return result
}

function toCamel(obj) {
  const map = {
    cost_price: 'costPrice',
    carton_price: 'cartonPrice',
    brand_id: 'brandId',
    category_id: 'categoryId',
    is_promo: 'isPromo',
    supplier_id: 'supplierId',
    supplier_name: 'supplierName',
    customer_id: 'customerId',
    product_id: 'productId',
    session_id: 'sessionId',
    is_read: 'isRead',
    max_uses: 'maxUses',
    min_order: 'minOrder',
    created_at: 'createdAt',
    min_stock: 'minStock',
  }
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    result[map[k] || k] = v
  }
  return result
}

function rowsToCamel(rows) {
  return (rows || []).map(toCamel)
}

// ==================== تحميل كل البيانات ====================
export async function loadAll() {
  try {
    console.log('🔄 جاري تحميل البيانات من Supabase...')

    const tables = [
      'products',
      'suppliers',
      'customers',
      'employees',
      'brands',
      'categories',
      'purchases',
      'orders',
      'coupons',
      'notifications',
      'expenses',
      'reviews',
      'activity_log',
      'wishlist',
    ]

    // ✅ استخدم Promise.allSettled بدلاً من Promise.all
    // هذا يمنع فشل جدول واحد من إيقاف التحميل كاملاً
    const results = await Promise.allSettled(
      tables.map((t) =>
        supabase.from(t).select('*').order('id', { ascending: false })
      )
    )

    // معالجة النتائج
    tables.forEach((t, i) => {
      const result = results[i]
      if (result.status === 'fulfilled' && result.value.data) {
        cache[t] = rowsToCamel(result.value.data || [])
        console.log(`✅ تم تحميل ${t}: ${cache[t].length} سجل`)
      } else {
        console.warn(`⚠️ فشل تحميل ${t}:`, result.reason || 'جدول فارغ أو غير موجود')
        cache[t] = [] // تعيين مصفوفة فارغة بدلاً من الفشل
      }
    })

    // الإعدادات (key-value)
    try {
      const { data: settingsRows } = await supabase.from('settings').select('*')
      cache.settings = {}
      ;(settingsRows || []).forEach((r) => {
        cache.settings[r.key] = r.value
      })
      console.log('✅ تم تحميل الإعدادات')
    } catch (err) {
      console.warn('⚠️ فشل تحميل الإعدادات:', err)
      cache.settings = {}
    }

    console.log('✅ تم تحميل جميع البيانات بنجاح')
    return true
  } catch (err) {
    console.error('❌ خطأ في تحميل البيانات:', err)
    return false
  }
}

// ==================== عمليات CRUD ====================

export async function dbInsert(table, data) {
  try {
    const row = toSnake({ ...data })
    const { error } = await supabase.from(table).upsert(row)
    if (error) {
      console.error(`❌ خطأ insert ${table}:`, error)
      return false
    }
    // تحديث الذاكرة
    const idx = cache[table].findIndex((r) => r.id == data.id)
    if (idx !== -1) {
      cache[table][idx] = data
    } else {
      cache[table].unshift(data)
    }
    return true
  } catch (err) {
    console.error(`❌ خطأ insert ${table}:`, err)
    return false
  }
}

export async function dbUpdate(table, id, data) {
  try {
    const row = toSnake({ ...data, id })
    const { error } = await supabase.from(table).upsert(row)
    if (error) {
      console.error(`❌ خطأ update ${table}:`, error)
      return false
    }
    const idx = cache[table].findIndex((r) => r.id == id)
    if (idx !== -1) {
      cache[table][idx] = { ...cache[table][idx], ...data }
    }
    return true
  } catch (err) {
    console.error(`❌ خطأ update ${table}:`, err)
    return false
  }
}

export async function dbDelete(table, id) {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      console.error(`❌ خطأ delete ${table}:`, error)
      return false
    }
    cache[table] = cache[table].filter((r) => r.id != id)
    return true
  } catch (err) {
    console.error(`❌ خطأ delete ${table}:`, err)
    return false
  }
}

export async function dbDeleteAll(table) {
  try {
    const { error } = await supabase.from(table).delete().neq('id', 0)
    if (error) {
      console.error(`❌ خطأ deleteAll ${table}:`, error)
      return false
    }
    cache[table] = []
    return true
  } catch (err) {
    console.error(`❌ خطأ deleteAll ${table}:`, err)
    return false
  }
}

// ==================== الإعدادات ====================
export async function getSetting(key, defaultVal = '') {
  return cache.settings[key] ?? defaultVal
}

export async function setSetting(key, value) {
  cache.settings[key] = String(value)
  try {
    const { error } = await supabase.from('settings').upsert({
      key,
      value: String(value),
    })
    if (error) console.error('❌ خطأ settings:', error)
  } catch (err) {
    console.error('❌ خطأ settings:', err)
  }
}

export async function saveSettings(obj) {
  await Promise.all(Object.entries(obj).map(([k, v]) => setSetting(k, v)))
}

// ==================== مزامنة كاملة ====================
export async function syncTable(table, rows) {
  try {
    if (rows.length === 0) {
      await supabase.from(table).delete().neq('id', 0)
    } else {
      const snakeRows = rows.map((r) => toSnake({ ...r }))
      const { error } = await supabase.from(table).upsert(snakeRows)
      if (error) console.error(`❌ خطأ sync ${table}:`, error)
    }
    cache[table] = [...rows]
    return true
  } catch (err) {
    console.error(`❌ خطأ sync ${table}:`, err)
    return false
  }
}
