import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { showToast } from '../utils.js'

// ========== ThankyouModal ==========
export default function ThankyouModal({ orderId, storeName, onClose }) {
  return (
    <div className="moverlay">
      <div className="msheet center">
        <div className="mbody" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>تمت الطلبية بنجاح!</h2>
          <p style={{ color: '#1565C0', marginBottom: 6 }}>تم تأكيد طلبك وبدأ التجهيز</p>
          <p style={{ color: '#1565C0', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>رقم الطلب: {orderId}</p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>ستصلك رسالة واتساب بتفاصيل التوصيل</p>
          <button className="abtn" onClick={onClose}><i className="fas fa-home"></i> العودة للمتجر</button>
        </div>
      </div>
    </div>
  )
}
