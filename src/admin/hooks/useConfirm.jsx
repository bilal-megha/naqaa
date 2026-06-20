/**
 * @file hooks/useConfirm.jsx
 * @description Hook لإدارة مودال التأكيد
 */

import { useState } from 'react'
import { CLR, S } from '../constants.js'

/**
 * Hook لعرض مودال تأكيد الحذف
 * @returns {[Function, JSX.Element|null]} [askConfirm, ConfirmUI]
 * @example
 * const [askConfirm, ConfirmUI] = useConfirm()
 * const confirmed = await askConfirm('هل تريد الحذف؟')
 * if (confirmed) { ... }
 */
export function useConfirm() {
  const [c, setC] = useState(null)
  const ask = msg => new Promise(r => setC({ msg, r }))

  const UI = c ? (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', zIndex: 8000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 28, maxWidth: 340,
        textAlign: 'center', direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,.25)'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          margin: '0 auto 14px'
        }}>🗑️</div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: CLR.text, marginBottom: 8 }}>تأكيد الحذف</h3>
        <p style={{ fontSize: 14, color: CLR.textSm, marginBottom: 22, lineHeight: 1.5 }}>{c.msg}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => { c.r(true); setC(null) }}
            style={{
              background: CLR.danger, color: 'white', border: 'none', borderRadius: 8,
              padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit'
            }}
          >
            نعم، احذف
          </button>
          <button
            onClick={() => { c.r(false); setC(null) }}
            style={{
              background: CLR.bg, border: `1px solid ${CLR.border}`, borderRadius: 8,
              padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              fontFamily: 'inherit', color: CLR.textSm
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  ) : null

  return [ask, UI]
}
