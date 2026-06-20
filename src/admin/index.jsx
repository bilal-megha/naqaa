/**
 * @file index.jsx
 * @description المكوّن الرئيسي للوحة الإدارة — يربط كل الصفحات والمكوّنات
 *
 * هذا الملف يستبدل الملف القديم Admin.jsx (6754 سطر) بمكوّن خفيف
 * يستورد كل صفحة من مكانها الخاص بدلاً من تعريفها هنا.
 */
import { useState } from 'react'
import './styles/admin.css'

import { CLR, SECTIONS } from './constants.js'
import { useAuth } from './hooks/useAuth.jsx'
import { useToast } from './hooks/useToast.jsx'

import Sidebar from './components/Sidebar.jsx'
import Header  from './components/Header.jsx'

import LoginScreen  from './pages/LoginScreen.jsx'
import Dashboard    from './pages/Dashboard.jsx'
import Products     from './pages/Products.jsx'
import Categories   from './pages/Categories.jsx'
import Brands       from './pages/Brands.jsx'
import Suppliers    from './pages/Suppliers.jsx'
import Customers    from './pages/Customers.jsx'
import Employees    from './pages/Employees.jsx'
import Coupons      from './pages/Coupons.jsx'
import Purchases    from './pages/Purchases.jsx'
import Inventory    from './pages/Inventory.jsx'
import Orders       from './pages/Orders.jsx'
import Promotions   from './pages/Promotions.jsx'
import Notifications from './pages/Notifications.jsx'
import Reports      from './pages/Reports.jsx'
import Expenses     from './pages/Expenses.jsx'
import ActivityLog  from './pages/ActivityLog.jsx'
import StoreManager from './pages/StoreManager.jsx'
import DataBackup   from './pages/DataBackup.jsx'
import Settings     from './pages/Settings.jsx'
import AboutUs      from './pages/AboutUs.jsx'
import ContactUs    from './pages/ContactUs.jsx'
import ReturnPolicy from './pages/ReturnPolicy.jsx'
import RecycleBin   from './pages/RecycleBin.jsx'

/** خريطة الأقسام إلى المكوّنات الخاصة بها */
const PAGE_MAP = {
  dashboard:     (props) => <Dashboard {...props} />,
  products:      () => <Products />,
  categories:    () => <Categories />,
  brands:        () => <Brands />,
  suppliers:     () => <Suppliers />,
  customers:     () => <Customers />,
  employees:     () => <Employees />,
  coupons:       () => <Coupons />,
  purchases:     () => <Purchases />,
  inventory:     () => <Inventory />,
  orders:        () => <Orders />,
  promotions:    () => <Promotions />,
  notifications: () => <Notifications />,
  reports:       () => <Reports />,
  expenses:      () => <Expenses />,
  activityLog:   () => <ActivityLog />,
  storeManager:  (props) => <StoreManager {...props} />,
  backup:        (props) => <DataBackup {...props} />,
  settings:      (props) => <Settings {...props} />,
  about:         (props) => <AboutUs {...props} />,
  contact:       (props) => <ContactUs {...props} />,
  returnPolicy:  (props) => <ReturnPolicy {...props} />,
  recycle:       () => <RecycleBin />,
}

/**
 * المكوّن الرئيسي للوحة الإدارة
 * يدير المصادقة، التنقل بين الأقسام، والصلاحيات
 */
export default function Admin() {
  const { user, login, logout, hasPermission } = useAuth()
  const [section,   setSection]   = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [showToast, ToastUI]      = useToast()

  // شاشة تسجيل الدخول إذا لم يكن المستخدم مسجلاً
  if (!user) return <LoginScreen onLogin={login} />

  const handleLogout = () => {
    logout()
    setSection('dashboard')
  }

  /** عرض القسم الحالي أو رسالة عدم الصلاحية */
  const renderSection = () => {
    const currentSection = SECTIONS.find(s => s.id === section)

    if (currentSection && !hasPermission(currentSection.perm)) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 300, gap: 16, color: CLR.textSm, padding: 24,
        }}>
          <div style={{ fontSize: 56 }}>🔒</div>
          <h3 style={{ fontWeight: 800, color: CLR.text }}>لا تملك صلاحية الوصول</h3>
          <p style={{ fontSize: 14, textAlign: 'center' }}>
            {user.role === 'admin' ? 'أنت مدير، لديك صلاحية الوصول لكل شيء ✅' : 'تواصل مع المدير لمنحك الصلاحية'}
          </p>
          {user.role !== 'admin' && (
            <div style={{
              background: '#FEF9C3', padding: '12px 18px', borderRadius: 8,
              fontSize: 13, color: '#92400E', textAlign: 'center', maxWidth: 400,
            }}>
              💡 الصلاحيات الممنوحة لك: {Object.keys(user.permissions || {}).length > 0 ? Object.keys(user.permissions).join('، ') : 'لا توجد صلاحيات حالياً'}
            </div>
          )}
        </div>
      )
    }

    const render = PAGE_MAP[section] || PAGE_MAP.dashboard
    return render({ user, showToast })
  }

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: CLR.bg, fontFamily: "'Tajawal','Segoe UI',sans-serif" }}>
      {ToastUI}
      <Sidebar
        user={user}
        section={section}
        onNavigate={setSection}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header section={section} collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main style={{ flex: 1, padding: 20, overflowX: 'hidden' }}>
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
