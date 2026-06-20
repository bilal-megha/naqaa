/**
 * @file hooks/useToast.jsx
 * @description Hook لإدارة إشعارات Toast — يستخدم مكوّن Toast المشترك
 */

import { useState } from 'react'
import Toast from '../components/Toast.jsx'

/**
 * Hook لعرض إشعارات Toast
 * @returns {[Function, JSX.Element|null]} [showToast, ToastUI]
 * @example
 * const [showToast, ToastUI] = useToast()
 * showToast('تم الحفظ بنجاح')
 * showToast('حدث خطأ', 'error')
 */
export function useToast() {
  const [t, setT] = useState(null)
  const show = (msg, type = 'success') => setT({ msg, type })
  const UI = t ? <Toast msg={t.msg} type={t.type} onDone={() => setT(null)} /> : null
  return [show, UI]
}
