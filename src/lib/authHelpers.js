/**
 * lib/authHelpers.js
 * مساعدات المصادقة — مشتركة بين المتجر والأدمن
 */
import CryptoJS from 'crypto-js'

export const sha256 = p => CryptoJS.SHA256(p || '').toString()

/**
 * هاش كلمة المرور
 */
export function hashPassword(plain) {
  return sha256(plain)
}

/**
 * التحقق من كلمة المرور (يدعم النص العادي القديم والهاش الجديد)
 */
export function verifyPassword(plain, stored) {
  if (!plain || !stored) return false
  if (plain === stored)             return true   // نص عادي (قديم)
  if (sha256(plain) === stored)     return true   // SHA256
  if (sha256(plain) === sha256(stored)) return true
  return false
}

/**
 * التحقق من 2FA للأدمن
 */
export function verifyTwoFA(code, expected) {
  return code === expected
}
