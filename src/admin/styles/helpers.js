/**
 * @file helpers.js — دوال مساعدة خالصة (بدون JSX)
 */
import { supabase } from '../../lib/supabase.js'

export const logActivity = async (action, details = '') => {
  try {
    await supabase.from('activity_log').insert({
      id: Date.now(),
      action,
      details,
      employee: 'admin',
      created_at: new Date().toISOString(),
    })
  } catch (err) { console.error('logActivity error:', err) }
}

export const softDelete = async (tableName, id, items, setItems, loadFn, showToast, askConfirm) => {
  if (!(await askConfirm('⚠️ حذف هذا العنصر؟ يمكن استعادته من سلة المهملات'))) return
  try {
    const item = items.find(i => i.id === id)
    if (!item) { showToast('❌ العنصر غير موجود', 'error'); return }
    const { error: ie } = await supabase.from('deleted_items').insert({
      table_name: tableName, item_id: item.id,
      data: JSON.stringify(item), deleted_at: new Date().toISOString(),
    })
    if (ie) { showToast('❌ ' + ie.message, 'error'); return }
    const { error: de } = await supabase.from(tableName).delete().eq('id', id)
    if (de) { showToast('❌ خطأ في الحذف', 'error'); return }
    await logActivity('حذف', `جدول ${tableName}`)
    showToast('✅ تم النقل لسلة المهملات')
    await loadFn()
  } catch (err) { showToast('❌ خطأ غير متوقع', 'error') }
}

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

export function printA4(content) {
  const w = window.open('', '_blank')
  w.document.write(`<html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Tajawal',sans-serif;direction:rtl;padding:20mm;color:#1e293b}
    h1{font-size:24px;color:#F97316;margin-bottom:8px}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f8fafc;padding:10px 12px;text-align:right;font-weight:700;border:1px solid #e2e8f0}
    td{padding:10px 12px;border:1px solid #e2e8f0}
    .total-row{background:#fff7ed;font-weight:700}
    .footer{margin-top:30px;text-align:center;color:#64748b;font-size:12px}
  </style></head><body onload="window.print();window.close();">${content}</body></html>`)
  w.document.close()
}
