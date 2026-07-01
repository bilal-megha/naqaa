import { useState, useCallback } from 'react'

export default function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const ToastUI = toast ? (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: toast.type === 'error' ? '#EF4444' : toast.type === 'warning' ? '#F59E0B' : '#10B981',
      color: 'white', padding: '12px 24px', borderRadius: 12,
      fontWeight: 700, fontSize: 14, zIndex: 9999,
      boxShadow: '0 8px 24px rgba(0,0,0,.2)',
      animation: 'slideUp .3s ease',
      whiteSpace: 'nowrap',
    }}>
      {toast.msg}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  ) : null

  return [showToast, ToastUI]
}
