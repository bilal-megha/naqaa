/**
 * NotificationBell.jsx
 * جرس الإشعارات في المتجر — متصل بـ Supabase Realtime
 */
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function NotificationBell({ onNavigate, primaryColor = '#1565C0' }) {
  const [notifs,   setNotifs]   = useState([])
  const [open,     setOpen]     = useState(false)
  const [readIds,  setReadIds]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('nq_read_notifs') || '[]') } catch { return [] }
  })
  const panelRef = useRef(null)

  // جلب الإشعارات من Supabase
  const load = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('id', { ascending: false })
        .limit(30)
      if (data) setNotifs(data)
    } catch (e) { console.error('❌ notifs:', e) }
  }

  useEffect(() => {
    load()

    // Realtime subscription — يستقبل الإشعارات الجديدة فوراً
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        setNotifs(prev => [payload.new, ...prev])
        // اهتزاز خفيف على الجرس
        setBounce(true)
        setTimeout(() => setBounce(false), 1000)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // إغلاق عند الضغط خارج الـ panel
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  const [bounce, setBounce] = useState(false)

  const unread = notifs.filter(n => !readIds.includes(String(n.id))).length

  const markRead = (id) => {
    const newIds = [...new Set([...readIds, String(id)])]
    setReadIds(newIds)
    localStorage.setItem('nq_read_notifs', JSON.stringify(newIds))
  }

  const markAllRead = () => {
    const newIds = notifs.map(n => String(n.id))
    setReadIds(newIds)
    localStorage.setItem('nq_read_notifs', JSON.stringify(newIds))
  }

  const handleNotifClick = (notif) => {
    markRead(notif.id)
    setOpen(false)

    // التنقل حسب نوع الرابط
    if (!notif.link_type || notif.link_type === 'none') return

    if (notif.link_type === 'product' && notif.link_id) {
      onNavigate('product', notif.link_id)
    } else if (notif.link_type === 'category' && notif.link_id) {
      onNavigate('category', notif.link_id)
    } else if (notif.link_type === 'brand' && notif.link_id) {
      onNavigate('brand', notif.link_id)
    } else if (notif.link_type === 'promo') {
      onNavigate('promos')
    } else if (notif.link_type === 'url' && notif.link_id) {
      window.open(notif.link_id, '_blank')
    }
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    // إذا كان created_at
    try {
      const d = new Date(dateStr)
      if (isNaN(d)) return dateStr
      const diff = (Date.now() - d.getTime()) / 1000
      if (diff < 60) return 'الآن'
      if (diff < 3600) return `${Math.floor(diff/60)} دق`
      if (diff < 86400) return `${Math.floor(diff/3600)} س`
      return `${Math.floor(diff/86400)} ي`
    } catch { return dateStr }
  }

  const linkIcon = (type) => {
    const icons = { product: '🛍️', category: '📂', brand: '🏷️', promo: '🎯', url: '🔗' }
    return icons[type] || ''
  }

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* زر الجرس */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(255,255,255,.18)',
          border: '1.5px solid rgba(255,255,255,.5)',
          color: 'white',
          width: 38, height: 38,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17,
          position: 'relative',
          animation: bounce ? 'bellBounce .4s ease' : 'none',
          transition: '.2s',
          fontFamily: 'inherit',
        }}>
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            background: '#EF4444', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: 10, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white', lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* لوحة الإشعارات */}
      {open && (
        <div style={{
          position: 'absolute', top: 46, left: 0,
          width: 300, maxWidth: 'calc(100vw - 28px)',
          background: 'white', borderRadius: 18,
          boxShadow: '0 8px 40px rgba(0,0,0,.18)',
          zIndex: 999, overflow: 'hidden',
          border: '1px solid #E2E8F0',
          // RTL — يظهر للجهة اليسرى
          transformOrigin: 'top left',
          animation: 'fadeIn .18s ease',
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}DD)`,
            padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 14 }}>
              🔔 الإشعارات {unread > 0 && `(${unread} جديد)`}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead}
                style={{ background: 'rgba(255,255,255,.2)', color: 'white', border: 'none',
                  borderRadius: 20, padding: '3px 10px', fontSize: 11,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                قراءة الكل
              </button>
            )}
          </div>

          {/* القائمة */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                <div style={{ fontSize: 36 }}>🔕</div>
                <div style={{ fontSize: 13, marginTop: 8, fontWeight: 700 }}>لا توجد إشعارات</div>
              </div>
            ) : notifs.map(n => {
              const isUnread = !readIds.includes(String(n.id))
              const hasLink = n.link_type && n.link_type !== 'none'
              return (
                <div key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F1F5F9',
                    background: isUnread ? '#F0F7FF' : 'white',
                    cursor: hasLink ? 'pointer' : 'default',
                    transition: '.15s',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => { if (hasLink) e.currentTarget.style.background = '#EEF4FF' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isUnread ? '#F0F7FF' : 'white' }}>
                  {/* نقطة الغير مقروء */}
                  <div style={{ flexShrink: 0, marginTop: 5 }}>
                    {isUnread
                      ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: primaryColor }} />
                      : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E2E8F0' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isUnread ? 900 : 700, fontSize: 13, color: '#0D1B2A',
                      marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginTop: 5 }}>
                      {hasLink && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: primaryColor,
                          background: `${primaryColor}15`, padding: '2px 8px', borderRadius: 20 }}>
                          {linkIcon(n.link_type)} اضغط للعرض
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600,
                        marginRight: 'auto' }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellBounce {
          0%,100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:scale(.95); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  )
}
