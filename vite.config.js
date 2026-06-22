import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // تقسيم الكود لتحسين الـ loading
        manualChunks: {
          vendor:   ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    },
    // ضغط أقوى
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // حذف console.log في الإنتاج
        drop_debugger: true,
      }
    }
  },
  // PWA: نسخ sw.js و manifest.json للـ dist مباشرة
  publicDir: 'public',
})
