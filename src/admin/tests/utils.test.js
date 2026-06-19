/**
 * @file tests/utils.test.js
 * @description اختبارات وحدة (Unit Tests) للدوال المساعدة في utils.js
 *
 * للتشغيل:
 *   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom --legacy-peer-deps
 *   أضف إلى package.json scripts: "test": "vitest"
 *   ثم: npm test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── محاكاة (mock) لعميل supabase قبل استيراد utils.js ───
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    })),
  },
}))

import { logActivity, softDelete, printThermal, printA4 } from '../utils.js'

describe('logActivity', () => {
  it('يُدرج سجل نشاط بدون رمي خطأ', async () => {
    await expect(logActivity('اختبار', 'تفاصيل الاختبار')).resolves.not.toThrow()
  })

  it('يتعامل مع رسالة تفاصيل فارغة دون كسر', async () => {
    await expect(logActivity('اختبار', '')).resolves.not.toThrow()
  })
})

describe('softDelete', () => {
  it('لا يحذف شيئاً إذا رفض المستخدم التأكيد', async () => {
    const setItems = vi.fn()
    const loadFunction = vi.fn()
    const showToast = vi.fn()
    const askConfirm = vi.fn(() => Promise.resolve(false))

    await softDelete('products', 1, [{ id: 1, name: 'منتج' }], setItems, loadFunction, showToast, askConfirm)

    expect(loadFunction).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('يُظهر رسالة خطأ إذا لم يجد العنصر في القائمة', async () => {
    const setItems = vi.fn()
    const loadFunction = vi.fn()
    const showToast = vi.fn()
    const askConfirm = vi.fn(() => Promise.resolve(true))

    await softDelete('products', 999, [{ id: 1, name: 'منتج' }], setItems, loadFunction, showToast, askConfirm)

    expect(showToast).toHaveBeenCalledWith('❌ العنصر غير موجود', 'error')
  })
})

describe('printThermal / printA4', () => {
  beforeEach(() => {
    // محاكاة window.open لأن jsdom لا يدعم النوافذ الحقيقية
    global.window.open = vi.fn(() => ({
      document: { write: vi.fn(), close: vi.fn() },
    }))
  })

  it('printThermal يستدعي window.open بنجاح', () => {
    expect(() => printThermal('<div>محتوى تجريبي</div>')).not.toThrow()
    expect(window.open).toHaveBeenCalled()
  })

  it('printA4 يستدعي window.open بنجاح', () => {
    expect(() => printA4('<div>تقرير تجريبي</div>')).not.toThrow()
    expect(window.open).toHaveBeenCalled()
  })
})
