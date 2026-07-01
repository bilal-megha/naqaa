// ══════════════════════════════════════════════════════
// صفاء — Admin — Design Tokens & Shared Styles
// ══════════════════════════════════════════════════════

export const CLR = {
  accent:   '#F97316',       // برتقالي — اللون الرئيسي
  accentHover: '#EA6C0A',
  success:  '#10B981',
  danger:   '#EF4444',
  warning:  '#F59E0B',
  info:     '#3B82F6',
  text:     '#1E293B',
  textSm:   '#64748B',
  border:   '#E2E8F0',
  bg:       '#F8FAFC',
  white:    '#FFFFFF',
  sidebar:  '#1E293B',
  sidebarHover: '#334155',
}

export const CUR = 'دج'

// ── Shared Styles ──────────────────────────────────────
export const S = {
  // بطاقة
  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    border: '1px solid #E2E8F0',
    marginBottom: 16,
  },

  // شبكة عمودين
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
    gap: 12,
    marginBottom: 12,
  },

  // حقل إدخال
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    background: '#FFFFFF',
    color: '#1E293B',
    boxSizing: 'border-box',
    marginBottom: 0,
    direction: 'rtl',
    transition: 'border-color .2s',
  },

  // تسمية
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748B',
    marginBottom: 5,
  },

  // زر رئيسي
  btn: {
    background: '#F97316',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: '.2s',
  },

  // زر رمادي
  btnGray: {
    background: '#F1F5F9',
    color: '#64748B',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    padding: '10px 20px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // زر صغير
  btnSm: {
    background: '#F1F5F9',
    color: '#64748B',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: '5px 10px',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // رأس جدول
  th: {
    padding: '10px 12px',
    textAlign: 'right',
    fontWeight: 700,
    fontSize: 12,
    color: '#64748B',
    borderBottom: '2px solid #E2E8F0',
    whiteSpace: 'nowrap',
    background: '#F8FAFC',
  },

  // خلية جدول
  td: {
    padding: '10px 12px',
    fontSize: 13,
    color: '#1E293B',
    borderBottom: '1px solid #F1F5F9',
    verticalAlign: 'middle',
  },
}
