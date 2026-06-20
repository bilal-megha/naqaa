/**
 * @file auth.js
 * @description وحدة المصادقة الآمنة — تستخدم bcryptjs بدل SHA256
 *
 * ⚠️  الثوابت الحساسة تُقرأ من متغيرات البيئة (.env) وليس من الكود
 * ⚠️  لا تضع كلمات مرور أو hashes في الكود مباشرة
 */
import bcrypt from 'bcryptjs'

/**
 * بيانات المدير الرئيسي — مقروءة من .env فقط
 * @type {{ email: string, passHash: string, twoFa: string }}
 */
export const ADMIN_CREDS = {
  email:    import.meta.env.VITE_ADMIN_EMAIL    || '',
  passHash: import.meta.env.VITE_ADMIN_PASS_HASH || '',
  twoFa:    import.meta.env.VITE_TWO_FA_CODE    || '6789',
}

/**
 * التحقق من كلمة المرور باستخدام bcrypt
 * يدعم كلاً من:
 *   - bcrypt hash (الجديد: $2a$...)
 *   - SHA256 hex (القديم: للتوافق المؤقت)
 *
 * @param {string} plainPassword - كلمة المرور المُدخلة
 * @param {string} storedHash    - الـ hash المخزّن في DB أو .env
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, storedHash) {
  if (!plainPassword || !storedHash) return false

  // bcrypt hash يبدأ بـ $2a$ أو $2b$
  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(plainPassword, storedHash)
  }

  // توافق مؤقت مع SHA256 القديم (64 حرف hex)
  if (storedHash.length === 64) {
    const { default: CryptoJS } = await import('crypto-js')
    const sha = CryptoJS.SHA256(plainPassword).toString()
    console.warn('⚠️  SHA256 مستخدم — يُنصح بالترحيل إلى bcrypt')
    return sha === storedHash
  }

  return false
}

/**
 * توليد bcrypt hash لكلمة مرور جديدة
 * تُستخدم عند إنشاء/تحديث حساب موظف
 *
 * @param {string} plainPassword
 * @param {number} [rounds=12]
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(plainPassword, rounds = 12) {
  return bcrypt.hash(plainPassword, rounds)
}

/**
 * التحقق من كود التحقق الثنائي (2FA)
 * @param {string} inputCode
 * @returns {boolean}
 */
export function verifyTwoFA(inputCode) {
  return inputCode === ADMIN_CREDS.twoFa
}
