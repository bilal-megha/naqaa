/**
 * db.js  —  كل عمليات قاعدة البيانات
 */

import { supabase } from './supabase.js'

// ==================== الذاكرة المؤقتة ====================
export const cache = {
  products:     [],
  suppliers:    [],
  customers:    [],
  employees:    [],
  brands:       [],
  categories:   [],
  purchases:    [],
  orders:       [],
  coupons:      [],
  notifications:[],
  expenses:     [],
  reviews:      [],
  activity_log: [],
  wishlist:     [],
  settings:     {},
}

// ==================== مساعد عام ====================
function toSnake(obj) {
  const map = {
    costPrice:    'cost_price',
    cartonPrice:  'carton_price',
    brandId:      'brand_id',
    categoryId:   'category_id',
    isPromo:      'is_promo',
    supplierId:   'supplier_id',
    supplierName: 'supplier_name',
    customerId:   'customer_id',
    productId:    'product_id',
    sessionId:    'session_id',
    isRead:       'is_read',
    maxUses:      'max_uses',
    minOrder:     'min_order',
    createdAt:    'created_at',
  }
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    result[map[k] || k] = v
  }
  return result
}

function toCamel(obj) {
  const map = {
    cost_price:    'costPrice',
    carton_price:  'cartonPrice',
    brand_id:      'brandId',
    category_id:   'categoryId',
    is_promo:      'isPromo',
    supplier_id:   'supplierId',
    supplier_name: 'supplierName',
    customer_id:   'customerId',
    product_id:    'productId',
    session_id:    'sessionId',
    is_read:       'isRead',
    max_uses:      'maxUses',
    min_order:     'minOrder',
    created_at:    'createdAt',
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
    const tables = [
      'products','suppliers','customers','employees',
      'brands','categories','purchases','orders',
      'coupons','notifications','expenses','reviews',
      'activity_log','wishlist'
    ]

    // نحمّل كل جدول بشكل مستقل حتى لو فشل أحدها
    const results = await Promise.allSettled(
      tables.map(t => supabase.from(t).select('*').order('id', { ascending: false }))
    )

    tables.forEach((t, i) => {
      if (results[i].status === 'fulfilled') {
        cache[t] = rowsToCamel(results[i].value.data || [])
      } else {
        console.warn(`⚠️ جدول ${t} غير متاح`)
        cache[t] = []
      }
    })

    // الإعدادات (key-value)
    try {
      const { data: settingsRows } = await supabase.from('settings').select('*')
      cache.settings = {}
      ;(settingsRows || []).forEach(r => { cache.settings[r.key] = r.value })
    } catch {
      cache.settings = {}
    }

    console.log('✅ تم تحميل البيانات من Supabase')
    return true
  } catch (err) {
    console.error('❌ خطأ في تحميل البيانات:', err)
    return false
  }
}

// ==================== عمليات CRUD ====================

export async function dbInsert(table, data) {
  const row = toSnake({ ...data })
  const { error } = await supabase.from(table).upsert(row)
  if (error) console.error(`خطأ insert ${table}:`, error)
  const idx = cache[table].findIndex(r => r.id == data.id)
  if (idx !== -1) cache[table][idx] = data
  else cache[table].unshift(data)
}

export async function dbUpdate(table, id, data) {
  const row = toSnake({ ...data, id })
  const { error } = await supabase.from(table).upsert(row)
  if (error) console.error(`خطأ update ${table}:`, error)
  const idx = cache[table].findIndex(r => r.id == id)
  if (idx !== -1) cache[table][idx] = { ...cache[table][idx], ...data }
}

export async function dbDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) console.error(`خطأ delete ${table}:`, error)
  cache[table] = cache[table].filter(r => r.id != id)
}

export async function dbDeleteAll(table) {
  const { error } = await supabase.from(table).delete().neq('id', 0)
  if (error) console.error(`خطأ deleteAll ${table}:`, error)
  cache[table] = []
}

// ==================== الإعدادات ====================
export async function getSetting(key, defaultVal = '') {
  return cache.settings[key] ?? defaultVal
}

export async function setSetting(key, value) {
  cache.settings[key] = String(value)
  const { error } = await supabase.from('settings').upsert({ key, value: String(value) })
  if (error) console.error('خطأ settings:', error)
}

export async function saveSettings(obj) {
  await Promise.all(Object.entries(obj).map(([k, v]) => setSetting(k, v)))
}

// ==================== مزامنة كاملة ====================
export async function syncTable(table, rows) {
  if (rows.length === 0) {
    await supabase.from(table).delete().neq('id', 0)
  } else {
    const snakeRows = rows.map(r => toSnake({ ...r }))
    const { error } = await supabase.from(table).upsert(snakeRows)
    if (error) console.error(`خطأ sync ${table}:`, error)
  }
  cache[table] = [...rows]
}