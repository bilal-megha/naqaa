import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * إعداد Vitest لاختبارات لوحة الإدارة
 * شغّل الاختبارات بـ: npm test
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
    include: ['src/admin/tests/**/*.test.{js,jsx}'],
  },
})
