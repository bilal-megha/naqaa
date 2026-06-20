/**
 * @file components/FormControls.jsx
 * @description مكوّنات حقول الإدخال المشتركة
 */

import { S } from '../constants.js'

/**
 * حقل إدخال أرقام — يمنع الأحرف والقيم السالبة
 * @param {{ value, onChange, placeholder, style, step }} props
 */
export const NumInput = ({ value, onChange, placeholder, style, step }) => (
  <input
    type="number"
    value={value}
    onChange={onChange}
    placeholder={placeholder || '0'}
    step={step || 'any'}
    min="0"
    onKeyDown={e => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }}
    style={{ ...S.input, ...style }}
  />
)

/**
 * حقل إدخال رقم الهاتف — يقبل الأرقام و + فقط
 * @param {{ value, onChange, placeholder, style }} props
 */
export const PhoneInput = ({ value, onChange, placeholder, style }) => (
  <input
    style={{ ...S.input, ...style }}
    type="text"
    inputMode="numeric"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    onKeyPress={e => { if (!/[0-9+]/.test(e.key)) e.preventDefault() }}
  />
)
