import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // the optional AI server of the edit chat (npm run server); without it /api answers with an error and the page works offline
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false }, '^/s/': { target: 'http://127.0.0.1:8787', changeOrigin: false } } },
})
