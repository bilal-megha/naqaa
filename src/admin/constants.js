/**
 * @file constants.js
 * @description الثوابت والأدوات المشتركة في لوحة الإدارة
 */

import CryptoJS from 'crypto-js'

/* ─── ثوابت المتجر ─── */
export const ADMIN_EMAIL     = 'meghamel2012@gmail.com'
export const ADMIN_PASS_HASH = CryptoJS.SHA256('afbilalaf06').toString()
export const TWO_FA_CODE     = '6789'
export const CUR             = 'دج'
export const WA_DEFAULT      = '213696668065'

/** @param {string} p - كلمة المرور */
export const hashPwd = p => CryptoJS.SHA256(p).toString()

/* ─── ألوان التطبيق ─── */
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

/* ─── أنماط CSS المشتركة ─── */
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
  td:      { padding: '10px 12px', textAlign: 'right', fontSize: 13,
             border: '1px solid #E2E8F0', verticalAlign: 'middle', background: 'white' },
  grid2:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 },
}

/* ─── قائمة أقسام الإدارة ─── */
export const SECTIONS = [
  { id: 'dashboard',     icon: '📊', label: 'لوحة القيادة',        perm: 'dashboard' },
  { id: 'products',      icon: '📦', label: 'المنتجات',             perm: 'products' },
  { id: 'categories',    icon: '📂', label: 'الفئات',               perm: 'categories' },
  { id: 'brands',        icon: '🏷️', label: 'العلامات التجارية',   perm: 'brands' },
  { id: 'suppliers',     icon: '🏭', label: 'الموردون',             perm: 'suppliers' },
  { id: 'customers',     icon: '👥', label: 'العملاء',              perm: 'customers' },
  { id: 'employees',     icon: '👔', label: 'الموظفون',             perm: 'employees' },
  { id: 'coupons',       icon: '🎟️', label: 'الكوبونات',           perm: 'coupons' },
  { id: 'purchases',     icon: '🛒', label: 'المشتريات',            perm: 'purchases' },
  { id: 'inventory',     icon: '🗂️', label: 'المخزون',             perm: 'inventory' },
  { id: 'orders',        icon: '📋', label: 'الطلبيات',             perm: 'orders' },
  { id: 'promotions',    icon: '🎯', label: 'العروض',               perm: 'promotions' },
  { id: 'notifications', icon: '🔔', label: 'الإشعارات',            perm: 'notifications' },
  { id: 'reports',       icon: '📈', label: 'التقارير',             perm: 'reports' },
  { id: 'expenses',      icon: '💸', label: 'المصاريف',             perm: 'expenses' },
  { id: 'activityLog',   icon: '📋', label: 'سجل النشاطات',         perm: 'activityLog' },
  { id: 'storeManager',  icon: '🎨', label: 'إدارة المتجر',         perm: 'storeManager' },
  { id: 'backup',        icon: '💾', label: 'نسخ احتياطي',          perm: 'backup' },
  { id: 'settings',      icon: '⚙️', label: 'الإعدادات',            perm: 'settings' },
  { id: 'about',         icon: '🏢', label: 'من نحن',               perm: 'about' },
  { id: 'contact',       icon: '📞', label: 'اتصل بنا',             perm: 'contact' },
  { id: 'returnPolicy',  icon: '🔄', label: 'سياسة الاسترجاع',      perm: 'returnPolicy' },
  { id: 'recycle',       icon: '🗑️', label: 'سلة المهملات',        perm: 'recycle' },
]

/* ─── مجموعات التنقل في الشريط الجانبي ─── */
export const NAV_GROUPS = [
  { label: 'الرئيسية',            items: ['dashboard'] },
  { label: 'المنتجات والمخزون',   items: ['products', 'categories', 'brands', 'inventory'] },
  { label: 'المبيعات',            items: ['orders', 'promotions', 'coupons'] },
  { label: 'الموارد',             items: ['purchases', 'suppliers', 'expenses'] },
  { label: 'العملاء',             items: ['customers', 'notifications'] },
  { label: 'الإدارة',             items: ['reports', 'employees', 'activityLog', 'storeManager', 'backup', 'settings', 'about', 'contact', 'returnPolicy', 'recycle'] },
]

/* ─── صلاحيات الموظفين ─── */
export const ALL_PERMISSIONS = [
  { id: 'dashboard',     label: '📊 لوحة القيادة',          actions: ['view'] },
  { id: 'products',      label: '📦 المنتجات',               actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'categories',    label: '📂 الفئات',                 actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'brands',        label: '🏷️ العلامات التجارية',     actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'suppliers',     label: '🏭 الموردون',               actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'customers',     label: '👥 العملاء',                actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'coupons',       label: '🎟️ الكوبونات',             actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'purchases',     label: '🛒 المشتريات',              actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'inventory',     label: '🗂️ المخزون',               actions: ['view', 'edit'] },
  { id: 'orders',        label: '📋 الطلبيات',               actions: ['view', 'edit', 'delete'] },
  { id: 'promotions',    label: '🎯 العروض',                 actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'notifications', label: '🔔 الإشعارات',              actions: ['view', 'add'] },
  { id: 'reports',       label: '📈 التقارير',               actions: ['view'] },
  { id: 'expenses',      label: '💸 المصاريف',               actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'activityLog',   label: '📋 سجل النشاطات',           actions: ['view'] },
  { id: 'storeManager',  label: '🎨 إدارة المتجر',           actions: ['view', 'edit'] },
  { id: 'recycle',       label: '🗑️ سلة المهملات',          actions: ['view', 'restore', 'delete'] },
]
