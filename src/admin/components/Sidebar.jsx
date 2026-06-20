/**
 * @file components/Sidebar.jsx
 * @description القائمة الجانبية للوحة الإدارة
 */

import { CLR, SECTIONS, NAV_GROUPS } from '../constants.js'

/**
 * الشريط الجانبي للتنقل بين أقسام لوحة الإدارة
 * @param {{ user, section, onNavigate, collapsed, onToggleCollapse, onLogout }} props
 */
export default function Sidebar({ user, section, onNavigate, collapsed, onToggleCollapse, onLogout }) {

  /**
   * التحقق من صلاحية المستخدم
   * @param {string} permId
   * @returns {boolean}
   */
  const hasPermission = (permId) => {
    if (!user) return false
    if (user.role === 'admin') return true
    const perms = user.permissions || {}
    return Object.keys(perms).includes(permId) && (perms[permId] || []).includes('view')
  }

  return (
    <aside style={{
      width: collapsed ? 58 : 232,
      background: CLR.primary,
      position: 'sticky', top: 0, height: '100vh',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      overflow: 'hidden', transition: 'width .22s ease',
      boxShadow: '2px 0 16px rgba(0,0,0,.15)', zIndex: 100,
    }}>
      {/* رأس الشريط الجانبي */}
      <div style={{
        padding: collapsed ? '14px 9px' : '14px 14px',
        borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* زر طي/فتح القائمة */}
          <button
            onClick={onToggleCollapse}
            style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,#F97316,#EA6C0A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, border: 'none', cursor: 'pointer',
            }}
            title={collapsed ? 'فتح القائمة' : 'طي القائمة'}
          >
            🛍️
          </button>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'white', lineHeight: 1.2 }}>نقاء</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)' }}>لوحة الإدارة</div>
            </div>
          )}
        </div>

        {/* معلومات المستخدم */}
        {!collapsed && (
          <div style={{
            marginTop: 10, padding: '7px 10px',
            background: 'rgba(255,255,255,.07)', borderRadius: 7,
            fontSize: 12, color: 'rgba(255,255,255,.75)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>👤</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'المدير'}
            </span>
            {user?.role === 'admin' && (
              <span style={{
                fontSize: 8, background: 'rgba(239,68,68,.3)',
                padding: '1px 6px', borderRadius: 10, color: '#FCA5A5',
              }}>
                مدير
              </span>
            )}
          </div>
        )}
      </div>

      {/* قائمة التنقل */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <div style={{
                padding: '8px 14px 3px', fontSize: 9, fontWeight: 800,
                color: 'rgba(255,255,255,.28)', letterSpacing: '0.9px', textTransform: 'uppercase',
              }}>
                {group.label}
              </div>
            )}
            {group.items.map(id => {
              const s = SECTIONS.find(x => x.id === id)
              if (!s || !hasPermission(s.perm)) return null
              const isActive = section === s.id
              return (
                <div
                  key={s.id}
                  className={`sitem${isActive ? ' on' : ''}`}
                  onClick={() => onNavigate(s.id)}
                  title={collapsed ? s.label : ''}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="ico">{s.icon}</span>
                  {!collapsed && <span>{s.label}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* أزرار الجزء السفلي */}
      <div style={{ padding: '8px 6px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
        <a
          href="/"
          target="_blank"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            borderRadius: 7, color: 'rgba(255,255,255,.5)', textDecoration: 'none',
            fontSize: 12, fontWeight: 600, marginBottom: 3,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.5)'; e.currentTarget.style.background = 'none' }}
        >
          <span>🛍️</span>
          {!collapsed && <span>عرض المتجر</span>}
        </a>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            borderRadius: 7, color: 'rgba(239,68,68,.7)', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            width: '100%', textAlign: 'right', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,.7)'; e.currentTarget.style.background = 'none' }}
        >
          <span>🚪</span>
          {!collapsed && <span>خروج</span>}
        </button>
      </div>
    </aside>
  )
}
