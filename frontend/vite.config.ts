import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all API requests under /api to the Laravel backend during development
      // Requests to /api/... will be forwarded to http://localhost:8000/... (rewritten)
      '/api': {
        target: 'http://192.168.0.100:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
    host: '0.0.0.0',
    port: 5173,
  },
})