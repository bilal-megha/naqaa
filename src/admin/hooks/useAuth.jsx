/**
 * @file hooks/useAuth.jsx
 * @description Hook لإدارة مصادقة المستخدم وصلاحياته
 */

import { useState, useEffect } from 'react'

/**
 * @typedef {Object} AdminUser
 * @property {string} name - اسم المستخدم
 * @property {string} email - البريد الإلكتروني
 * @property {'admin'|'staff'} role - الدور
 * @property {Object} permissions - الصلاحيات
 * @property {number} [id] - المعرف (للموظفين)
 */

/**
 * Hook لإدارة حالة المصادقة
 * @returns {{ user: AdminUser|null, login: Function, logout: Function, hasPermission: Function }}
 */
export function useAuth() {
  const [user, setUser] = useState(null)

  // استعادة الجلسة من sessionStorage عند التحميل
  useEffect(() => {
    const saved = sessionStorage.getItem('nq_admin')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // تحويل الصلاحيات من string إلى object إذا لزم
        if (typeof parsed.permissions === 'string') {
          try { parsed.permissions = JSON.parse(parsed.permissions || '{}') }
          catch { parsed.permissions = {} }
        }
        setUser(parsed)
      } catch (err) {
        console.error('❌ خطأ في استعادة الجلسة:', err)
        sessionStorage.removeItem('nq_admin')
      }
    }
  }, [])

  /**
   * تسجيل الدخول وحفظ الجلسة
   * @param {AdminUser} userData - بيانات المستخدم
   */
  const login = (userData) => {
    setUser(userData)
    sessionStorage.setItem('nq_admin', JSON.stringify(userData))
  }

  /**
   * تسجيل الخروج ومسح الجلسة
   */
  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('nq_admin')
  }

  /**
   * التحقق من صلاحية معينة
   * @param {string} permId - معرف الصلاحية (مثل 'products')
   * @param {'view'|'add'|'edit'|'delete'|'restore'} [action='view'] - نوع الإجراء
   * @returns {boolean}
   */
  const hasPermission = (permId, action = 'view') => {
    if (!user) return false
    if (user.role === 'admin') return true
    const perms = user.permissions || {}
    const permActions = perms[permId] || []
    return permActions.includes(action)
  }

  return { user, login, logout, hasPermission }
}
