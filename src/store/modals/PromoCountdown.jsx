import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== PromoCountdown ==========
export default function PromoCountdown({ endDate }) {
  const [t, setT] = useState({ h: '00', m: '00', s: '00' })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(endDate) - Date.now())
      setT({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endDate])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>⏳</span>
      {[t.h, t.m, t.s].map((v, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ background: '#0C2D44', color: 'white', padding: '3px 6px', borderRadius: 6, fontSize: 13, fontWeight: 900, fontFamily: 'monospace' }}>{v}</span>
          {i < 2 && <span style={{ color: '#94a3b8', fontWeight: 900 }}>:</span>}
        </span>
      ))}
    </div>
  )
}
