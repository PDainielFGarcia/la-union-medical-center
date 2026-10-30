import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  // Production build is served by Laravel from public/spa (same origin as /api).
  base: mode === 'production' ? '/spa/' : '/',
  build: {
    outDir: 'backend/public/spa',
    emptyOutDir: true,
  },
}))
