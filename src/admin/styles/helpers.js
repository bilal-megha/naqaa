/**
 * @file helpers.js
 * @description دوال مساعدة مشتركة: softDelete، logActivity، طباعة، حقول إدخال
 */
import { supabase } from '../../lib/supabase.js'
import { S } from './constants.js'

/**
 * تسجيل نشاط في جدول activity_log
 * @param {string} action - نوع النشاط (مثل: 'حذف', 'إضافة')
 * @param {string} [details] - تفاصيل إضافية
 */
export const logActivity = async (action, details = '') => {
  try {
    await supabase.from('activity_log').insert({
      id: Date.now(),
      action,
      details,
      date: new Date().toLocaleString('ar-DZ'),
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('❌ خطأ في تسجيل النشاط:', err)
  }
}

/**
 * حذف ناعم — ينقل العنصر إلى جدول deleted_items بدل الحذف النهائي
 * @param {string} tableName - اسم الجدول
 * @param {number|string} id - معرّف العنصر
 * @param {Array} items - قائمة العناصر الحالية
 * @param {Function} setItems - دالة تحديث القائمة (غير مستخدمة مباشرة، loadFunction تتولى)
 * @param {Function} loadFunction - دالة إعادة تحميل البيانات بعد الحذف
 * @param {Function} showToast - دالة عرض الإشعار
 * @param {Function} askConfirm - دالة طلب التأكيد
 */
export const softDelete = async (tableName, id, items, setItems, loadFunction, showToast, askConfirm) => {
  if (!(await askConfirm('⚠️ حذف هذا العنصر؟ يمكن استعادته من سلة المهملات'))) return

  try {
    const item = items.find(i => i.id === id)
    if (!item) { showToast('❌ العنصر غير موجود', 'error'); return }

    const { error: insertError } = await supabase.from('deleted_items').insert({
      table_name: tableName,
      item_id: item.id,
      data: JSON.stringify(item),
      deleted_at: new Date().toISOString(),
    })
    if (insertError) { showToast('❌ خطأ: ' + insertError.message, 'error'); return }

    const { error: deleteError } = await supabase.from(tableName).delete().eq('id', id)
    if (deleteError) { showToast('❌ خطأ في حذف العنصر', 'error'); return }

    await logActivity('حذف', `تم حذف عنصر من جدول ${tableName}`)
    showToast('✅ تم نقل العنصر إلى سلة المهملات')
    await loadFunction()
  } catch (err) {
    console.error('❌ خطأ:', err)
    showToast('❌ حدث خطأ غير متوقع', 'error')
  }
}

/**
 * طباعة إيصال حراري 80mm
 * @param {string} content - محتوى HTML للطباعة
 */
export function printThermal(content) {
  const w = window.open('', '_blank', 'width=350,height=600')
  w.document.write(`<html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:12px;direction:rtl;width:80mm;padding:4mm}
    .center{text-align:center}.bold{font-weight:bold}.big{font-size:16px}
    .line{border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between;margin:3px 0}
    .total{font-size:14px;font-weight:bold}
  </style></head><body onload="window.print();window.close();">${content}</body></html>`)
  w.document.close()
}

/**
 * طباعة تقرير A4
 * @param {string} content - محتوى HTML للطباعة
 */
export function printA4(content) {
  const w = window.open('', '_blank')
  w.document.write(`<html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Tajawal','Segoe UI',sans-serif;direction:rtl;padding:20mm;color:#1e293b}
    h1{font-size:24px;color:#F97316;margin-bottom:8px}
    .header{display:flex;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #F97316}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f8fafc;padding:10px 12px;text-align:right;font-weight:700;border:1px solid #e2e8f0}
    td{padding:10px 12px;border:1px solid #e2e8f0}
    .total-row{background:#fff7ed;font-weight:700;font-size:16px}
    .footer{margin-top:30px;text-align:center;color:#64748b;font-size:12px}
  </style></head><body onload="window.print();window.close();">${content}</body></html>`)
  w.document.close()
}

/**
 * حقل إدخال أرقام فقط
 * @param {{ value, onChange, placeholder, style, step }} props
 */
export const NumInput = ({ value, onChange, placeholder, style, step }) => (
  <input
    type="number" value={value} onChange={onChange}
    placeholder={placeholder || '0'} step={step || 'any'} min="0"
    onKeyDown={e => { if (['-','e','E','+'].includes(e.key)) e.preventDefault() }}
    style={{ ...S.input, ...style }}
  />
)

/**
 * حقل إدخال رقم هاتف (يمنع الحروف)
 * @param {{ value, onChange, placeholder, style }} props
 */
export const PhoneInput = ({ value, onChange, placeholder, style }) => (
  <input
    style={{ ...S.input, ...style }} type="text" inputMode="numeric"
    value={value} onChange={onChange} placeholder={placeholder}
    onKeyPress={e => { if (!/[0-9+]/.test(e.key)) e.preventDefault() }}
  />
)
