/**
 * @file components/Header.jsx
 * @description الشريط العلوي للوحة الإدارة
 */

import { CLR, SECTIONS } from '../constants.js'

/**
 * الشريط العلوي — يعرض القسم الحالي والتاريخ وزر المتجر
 * @param {{ section, onToggleSidebar, collapsed }} props
 */
export default function Header({ section, onToggleSidebar, collapsed }) {
  const currentSection = SECTIONS.find(s => s.id === section)

  return (
    <header style={{
      background: 'white', borderBottom: `1px solid ${CLR.border}`,
      padding: '0 20px', height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 150, flexShrink: 0,
    }}>
      {/* الجانب الأيمن — زر الطي + اسم القسم */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: CLR.textSm, padding: '4px 6px',
            borderRadius: 6, transition: '.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = CLR.bg}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          title={collapsed ? 'فتح القائمة' : 'طي القائمة'}
        >
          {collapsed ? '☰' : '✕'}
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: CLR.text }}>
          {currentSection?.icon} {currentSection?.label}
        </div>
      </div>

      {/* الجانب الأيسر — التاريخ + رابط المتجر */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 12, color: CLR.textSm, background: CLR.bg,
          borderRadius: 6, padding: '4px 10px',
          border: `1px solid ${CLR.border}`, fontWeight: 600,
        }}>
          {new Date().toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' })}
        </span>
        <a
          href="/"
          target="_blank"
          style={{
            fontSize: 12, color: CLR.accent, background: '#FFF7ED',
            borderRadius: 6, padding: '4px 10px',
            border: '1px solid #FED7AA', textDecoration: 'none', fontWeight: 700,
          }}
        >
          🛍️ المتجر
        </a>
      </div>
    </header>
  )
}
