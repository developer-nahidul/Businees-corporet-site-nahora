import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_GITHUB_PAGES === 'true' ? '/nahora-frontend/' : '/',
  plugins: [react()],
  define: {
    __NAHORA_STATIC_PREVIEW__: JSON.stringify(process.env.VITE_STATIC_PREVIEW === 'true'),
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    restoreMocks: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/\/node_modules\/(recharts|d3-[^/]+)\//.test(id)) return 'charts'
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'framework'
          if (/\/node_modules\/(react-hook-form|zod|@hookform)\//.test(id)) return 'forms'
          if (/\/node_modules\/(i18next|react-i18next|zustand)\//.test(id)) return 'state'
        },
      },
    },
  },
})
