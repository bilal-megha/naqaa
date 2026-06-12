/**
 * supabase.js - إعداد اتصال Supabase مع دوال إضافية
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// التحقق من وجود المتغيرات البيئية
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ خطأ: متغيرات Supabase غير موجودة في ملف .env')
}

// إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// دوال إضافية للمتجر
// ============================================

/**
 * إرسال إشعار واتساب للمسؤول عند طلب جديد
 * @param {Object} order - بيانات الطلب
 * @param {string} adminWA - رقم واتساب المسؤول
 */
export async function sendAdminWhatsAppNotification(order, adminWA) {
  try {
    if (!order || !adminWA) {
      console.warn('⚠️ لا يمكن إرسال الإشعار: بيانات ناقصة')
      return false
    }
    
    const itemsList = (order.items || []).map(i => 
      `- ${i.name}: ${i.quantity || i.qty} كرتون × ${i.price} = ${((i.price || 0) * (i.quantity || i.qty || 1)).toFixed(0)} دج`
    ).join('%0A')
    
    const msg = `🛍️ طلب جديد رقم ${order.id}%0A👤 العميل: ${order.customer_name}%0A📱 الهاتف: ${order.customer_phone}%0A📍 العنوان: ${order.customer_address || 'غير محدد'}%0A📦 المنتجات:%0A${itemsList || 'لا توجد منتجات'}%0A💰 الإجمالي: ${(order.total || 0).toFixed(0)} دج%0A🔗 لتأكيد الطلب: ${window.location.origin}/admin`
    
    window.open(`https://wa.me/${adminWA.replace(/\D/g, '')}?text=${msg}`, '_blank')
    return true
  } catch (error) {
    console.error('❌ خطأ في إرسال إشعار واتساب:', error)
    return false
  }
}

/**
 * حساب نقاط الولاء بناءً على المبلغ
 * كل 100 دج = نقطة واحدة
 * @param {number} amount - المبلغ بالدج
 * @returns {number} عدد النقاط
 */
export function calculateLoyaltyPoints(amount) {
  const points = Math.floor(Number(amount) / 100)
  return points > 0 ? points : 0
}

/**
 * حساب الخصم من النقاط
 * كل 10 نقاط = 50 دج خصم
 * @param {number} points - عدد النقاط
 * @returns {number} قيمة الخصم بالدج
 */
export function calculatePointsDiscount(points) {
  const discount = Math.floor(Number(points) / 10) * 50
  return discount > 0 ? discount : 0
}

/**
 * تحديث نقاط العميل بعد الشراء
 * @param {string|number} customerId - معرف العميل
 * @param {number} spentAmount - المبلغ المنفق
 */
export async function updateCustomerPoints(customerId, spentAmount) {
  try {
    const earnedPoints = calculateLoyaltyPoints(spentAmount)
    if (earnedPoints === 0) return { success: true, points: 0 }
    
    // جلب النقاط الحالية للعميل
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('points')
      .eq('id', customerId)
      .maybeSingle()
    
    if (fetchError) throw fetchError
    
    const newPoints = (customer?.points || 0) + earnedPoints
    
    // تحديث النقاط
    const { error: updateError } = await supabase
      .from('customers')
      .update({ points: newPoints })
      .eq('id', customerId)
    
    if (updateError) throw updateError
    
    return { success: true, points: newPoints, earned: earnedPoints }
  } catch (error) {
    console.error('❌ خطأ في تحديث نقاط العميل:', error)
    return { success: false, error: error.message }
  }
}

/**
 * جلب إعدادات واتساب من قاعدة البيانات
 * @returns {Promise<string>} رقم واتساب المسؤول
 */
export async function getAdminWhatsAppNumber() {
  try {
    // أولاً: حاول جلب من الإعدادات
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_whatsapp')
      .maybeSingle()
    
    if (!error && data?.value) {
      return data.value
    }
    
    // ثانياً: القيمة الافتراضية
    return '213696668065'
  } catch (error) {
    console.warn('⚠️ لم نتمكن من جلب رقم واتساب من الإعدادات، نستخدم الافتراضي')
    return '213696668065'
  }
}

/**
 * جلب المنتجات مع حساب سعر الكرتون تلقائياً
 * @returns {Promise<Array>} قائمة المنتجات مع سعر الكرتون
 */
export async function getProductsWithCartonPrice() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('disabled', false)
      .order('name')
    
    if (error) throw error
    
    // إضافة سعر الكرتون لكل منتج
    return (products || []).map(p => ({
      ...p,
      cartonPrice: (p.price || 0) * (p.units || 12),
      cartonPriceFormatted: `${((p.price || 0) * (p.units || 12)).toFixed(0)} دج`
    }))
  } catch (error) {
    console.error('❌ خطأ في جلب المنتجات:', error)
    return []
  }
}

/**
 * تسجيل نشاط في سجل النشاطات
 * @param {string} action - نوع النشاط
 * @param {string} details - تفاصيل النشاط
 * @param {string} userId - معرف المستخدم (اختياري)
 */
export async function logActivity(action, details, userId = null) {
  try {
    await supabase.from('activity_log').insert({
      id: Date.now(),
      action,
      details,
      user_id: userId,
      date: new Date().toLocaleString('ar-DZ')
    })
  } catch (error) {
    console.warn('⚠️ لم نتمكن من تسجيل النشاط:', error)
  }
}

/**
 * التحقق من وجود عميل مسجل
 * @param {string} emailOrPhone - البريد الإلكتروني أو رقم الهاتف
 * @param {string} password - كلمة المرور
 * @returns {Promise<Object|null>} بيانات العميل أو null
 */
export async function authenticateCustomer(emailOrPhone, password) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
      .maybeSingle()
    
    if (error || !data) return null
    
    // التحقق من كلمة المرور (تم التشفير باستخدام CryptoJS)
    const CryptoJS = (await import('crypto-js')).default
    const hashedInput = CryptoJS.SHA256(password).toString()
    
    if (data.password !== hashedInput) return null
    
    return data
  } catch (error) {
    console.error('❌ خطأ في مصادقة العميل:', error)
    return null
  }
}

// تصدير الدوال للاستخدام في الملفات الأخرى
export default {
  supabase,
  sendAdminWhatsAppNotification,
  calculateLoyaltyPoints,
  calculatePointsDiscount,
  updateCustomerPoints,
  getAdminWhatsAppNumber,
  getProductsWithCartonPrice,
  logActivity,
  authenticateCustomer
}