/**
 * @file auth.js
 * @description المصادقة — CryptoJS فقط (بدون bcryptjs)
 */
import CryptoJS from 'crypto-js'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL    || 'meghamel2012@gmail.com'
const ADMIN_PASS  = import.meta.env.VITE_ADMIN_PASS_RAW || 'afbilalaf06'
const TWO_FA      = import.meta.env.VITE_TWO_FA_CODE    || '6789'

export const ADMIN_CREDS = { email: ADMIN_EMAIL, pass: ADMIN_PASS, twoFa: TWO_FA }

const sha256 = p => CryptoJS.SHA256(p || '').toString()

/**
 * التحقق من كلمة المرور
 * @param {string} plain - كلمة المرور المدخلة
 * @param {string} stored - المخزونة (نص عادي أو SHA256)
 */
export function verifyPassword(plain, stored) {
  if (!plain || !stored) return false
  if (plain === stored) return true              // نص عادي
  if (sha256(plain) === stored) return true      // SHA256
  if (sha256(plain) === sha256(stored)) return true
  return false
}

export function verifyTwoFA(code) { return code === TWO_FA }
export function hashPassword(p)   { return sha256(p) }
export const   sha256Fn = sha256
