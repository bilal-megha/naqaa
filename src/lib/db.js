import { supabase } from './supabase.js'

export const cache = {
  products:[], brands:[], categories:[], coupons:[],
  customers:[], employees:[], expenses:[], notifications:[],
  orders:[], purchases:[], reviews:[], suppliers:[],
  wishlist:[], activity_log:[], promotions:[], settings:{},
}

export async function loadAll() {
  try {
    const [
      rProducts, rBrands, rCategories, rCoupons,
      rCustomers, rEmployees, rExpenses, rNotifications,
      rOrders, rPurchases, rReviews, rSuppliers,
      rWishlist, rActivityLog, rPromotions, rSettings
    ] = await Promise.allSettled([
      supabase.from('products').select('*').order('id', {ascending:false}),
      supabase.from('brands').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('coupons').select('*'),
      supabase.from('customers').select('*').order('id', {ascending:false}),
      supabase.from('employees').select('*'),
      supabase.from('expenses').select('*').order('id', {ascending:false}),
      supabase.from('notifications').select('*').order('id', {ascending:false}),
      supabase.from('orders').select('*').order('id', {ascending:false}),
      supabase.from('purchases').select('*').order('id', {ascending:false}),
      supabase.from('reviews').select('*').order('id', {ascending:false}),
      supabase.from('suppliers').select('*'),
      supabase.from('wishlist').select('*'),
      supabase.from('activity_log').select('*').order('id', {ascending:false}).limit(200),
      supabase.from('promotions').select('*'),
      supabase.from('settings').select('*'),
    ])

    const set = (key, res) => {
      if (res.status === 'fulfilled') cache[key] = res.value.data || []
      else console.warn(`⚠️ ${key}:`, res.reason)
    }

    set('products',    rProducts)
    set('brands',      rBrands)
    set('categories',  rCategories)
    set('coupons',     rCoupons)
    set('customers',   rCustomers)
    set('employees',   rEmployees)
    set('expenses',    rExpenses)
    set('notifications', rNotifications)
    set('orders',      rOrders)
    set('purchases',   rPurchases)
    set('reviews',     rReviews)
    set('suppliers',   rSuppliers)
    set('wishlist',    rWishlist)
    set('activity_log', rActivityLog)
    set('promotions',  rPromotions)

    // settings كـ key-value map
    if (rSettings.status === 'fulfilled') {
      cache.settings = {}
      ;(rSettings.value.data || []).forEach(r => { cache.settings[r.key] = r.value })
    }

    console.log('✅ تم تحميل البيانات من Supabase')
    return true
  } catch(e) {
    console.error('❌ loadAll خطأ:', e)
    return false
  }
}

export async function dbInsert(table, data) {
  const { error } = await supabase.from(table).upsert(data)
  if (error) { console.error(error); return }
  const idx = cache[table]?.findIndex(r => r.id == data.id)
  if (idx > -1) cache[table][idx] = data
  else cache[table]?.unshift(data)
}

export async function dbUpdate(table, id, data) {
  const { error } = await supabase.from(table).upsert({...data, id})
  if (error) { console.error(error); return }
  const idx = cache[table]?.findIndex(r => r.id == id)
  if (idx > -1) cache[table][idx] = {...cache[table][idx], ...data}
}

export async function dbDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) { console.error(error); return }
  if (cache[table]) cache[table] = cache[table].filter(r => r.id != id)
}

export async function dbDeleteAll(table) {
  await supabase.from(table).delete().neq('id', 0)
  cache[table] = []
}

export async function getSetting(key, def='') {
  return cache.settings[key] ?? def
}

export async function setSetting(key, value) {
  cache.settings[key] = String(value)
  await supabase.from('settings').upsert({key, value: String(value)})
}

export async function saveSettings(obj) {
  await Promise.all(Object.entries(obj).map(([k,v]) => setSetting(k,v)))
}

export async function syncTable(table, rows) {
  if (!rows.length) await supabase.from(table).delete().neq('id', 0)
  else await supabase.from(table).upsert(rows)
  cache[table] = [...rows]
}
