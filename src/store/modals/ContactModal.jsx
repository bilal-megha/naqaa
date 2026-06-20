import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== ContactModal ==========
export default function ContactModal({ settings, onClose }) {
  const WA = settings?.contact_whatsapp || settings?.whatsapp_number || settings?.admin_phone || WA_NUM
  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center">
        <div className="mhead"><h3>📞 اتصل بنا</h3><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40 }}>🛍️</div>
            <div style={{ fontWeight: 900, fontSize: 18, marginTop: 8 }}>{settings?.store_name || 'نقاء'}</div>
          </div>
          {settings?.contact_phone && <a href={`tel:${settings.contact_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#EEF4FF', borderRadius: 14, padding: 14, marginBottom: 10, textDecoration: 'none' }}>
            <span style={{ fontSize: 28 }}>📱</span><div><div style={{ fontWeight: 800, color: '#0D1B2A' }}>الهاتف</div><div style={{ fontSize: 13, color: '#1565C0' }}>{settings.contact_phone}</div></div>
          </a>}
          {WA && <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', borderRadius: 14, padding: 14, marginBottom: 10, textDecoration: 'none' }}>
            <span style={{ fontSize: 28 }}>💬</span><div><div style={{ fontWeight: 800, color: '#0D1B2A' }}>واتساب</div><div style={{ fontSize: 13, color: '#1565C0' }}>{WA}</div></div>
          </a>}
          {settings?.contact_address && <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f1f5f9', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>📍</span><div><div style={{ fontWeight: 800, color: '#0D1B2A' }}>العنوان</div><div style={{ fontSize: 13, color: '#1565C0' }}>{settings.contact_address}</div></div>
          </div>}
          {settings?.contact_hours && <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#C7D9F5', borderRadius: 14, padding: 14 }}>
            <span style={{ fontSize: 28 }}>🕒</span><div><div style={{ fontWeight: 800, color: '#0D1B2A' }}>ساعات العمل</div><div style={{ fontSize: 13, color: '#1565C0' }}>{settings.contact_hours}</div></div>
          </div>}
        </div>
      </div>
    </div>
  )
}
