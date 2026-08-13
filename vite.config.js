import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages: DEPLOY_BASE=/skala-vue/
  base: process.env.DEPLOY_BASE || '/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    // ESPN은 브라우저 Origin이 붙으면 CORS/Akamai 403 → 로컬은 프록시로 우회
    proxy: {
      '/api/espn': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/espn/, ''),
      },
    },
  },
})
