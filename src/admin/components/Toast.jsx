/**
 * @file components/Toast.jsx
 * @description مكوّن عرض الإشعارات المؤقتة (Toast) — يُستخدم عبر useToast hook
 */
import { useEffect } from 'react'
import { CLR } from '../constants.js'

/**
 * مكوّن Toast — يظهر رسالة لمدة 3.2 ثانية ثم يختفي تلقائياً
 * @param {{ msg: string, type: 'success'|'error'|'info', onDone: Function }} props
 */
export default function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  const cfg = {
    success: { bg: CLR.success, icon: '✅' },
    error:   { bg: CLR.danger,  icon: '❌' },
    info:    { bg: CLR.info,    icon: 'ℹ️' },
  }[type] || { bg: CLR.success, icon: '✅' }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: 'white',
      borderRight: `4px solid ${cfg.bg}`, color: CLR.text,
      padding: '12px 20px', borderRadius: 10, zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,.14)', fontSize: 14,
      direction: 'rtl', display: 'flex', alignItems: 'center', gap: 8,
      minWidth: 240, animation: 'slideIn .25s ease',
    }}>
      <style>{'@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}'}</style>
      <span style={{ fontSize: 16 }}>{cfg.icon}</span>
      <span style={{ fontWeight: 600, flex: 1 }}>{msg}</span>
    </div>
  )
}
