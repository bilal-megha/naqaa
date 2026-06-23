/**
 * @file constants.js
 * @description الثوابت والأنماط المشتركة لكل لوحة الإدارة
 */

/** @type {string} عملة المتجر */
export const CUR = 'دج'

/** @type {string} رقم واتساب الافتراضي */
export const WA_DEFAULT = '213696668065'

/**
 * @typedef {Object} Colors
 * @description لوحة الألوان المركزية للوحة الإدارة
 */
export const CLR = {
  primary:  '#1E293B',
  accent:   '#F97316',
  accentDk: '#EA6C0A',
  bg:       '#F8FAFC',
  white:    '#FFFFFF',
  border:   '#E2E8F0',
  text:     '#1E293B',
  textSm:   '#64748B',
  danger:   '#EF4444',
  success:  '#10B981',
  warn:     '#F59E0B',
  info:     '#3B82F6',
}

/**
 * @typedef {Object} Styles
 * @description أنماط inline مشتركة لكل الصفحات
 */
export const S = {
  card:    { background: CLR.white, borderRadius: 12, padding: 20, marginBottom: 18,
             boxShadow: '0 1px 8px rgba(0,0,0,.07)', border: `1px solid ${CLR.border}` },
  input:   { background: CLR.bg, border: `1.5px solid ${CLR.border}`, borderRadius: 8,
             padding: '10px 14px', width: '100%', fontFamily: 'inherit', fontSize: 14,
             outline: 'none', color: CLR.text, transition: 'border-color .2s' },
  label:   { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: CLR.textSm },
  btn:     { background: `linear-gradient(135deg,${CLR.accent},${CLR.accentDk})`, color: 'white',
             padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
             fontWeight: 700, fontSize: 14, fontFamily: 'inherit', transition: 'opacity .2s',
             display: 'inline-flex', alignItems: 'center', gap: 6 },
  btnGray: { background: CLR.bg, color: CLR.textSm, padding: '10px 22px',
             borderRadius: 8, border: `1px solid ${CLR.border}`, cursor: 'pointer',
             fontWeight: 600, fontFamily: 'inherit' },
  btnSm:   { padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
             fontSize: 12, fontWeight: 600, fontFamily: 'inherit' },
  th:      { padding: '10px 12px', textAlign: 'right', background: '#F1F5F9',
             fontWeight: 700, fontSize: 12, color: '#475569',
             border: '1px solid #CBD5E1', whiteSpace: 'nowrap', userSelect: 'none' },
  td:      { padding: '10px 12px', textAlign: 'right', fontSize: 13, color: '#0D1B2A',
             border: '1px solid #E2E8F0', verticalAlign: 'middle', background: 'white' },
  grid2:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 },
}
