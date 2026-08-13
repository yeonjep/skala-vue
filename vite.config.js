import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// vue-devtools는 100vw 오버레이로 가로 스크롤을 유발할 수 있어 기본 비활성
// 필요하면: import vueDevTools from 'vite-plugin-vue-devtools' 후 plugins에 추가

export default defineConfig({
  // GitHub Pages: DEPLOY_BASE=/skala-vue/ 로 빌드
  base: process.env.DEPLOY_BASE || '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})
