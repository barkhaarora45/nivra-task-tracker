import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy: in development, requests to /auth/* and /tasks/* are forwarded to
    // the backend server instead of going to Vite. This avoids CORS issues locally.
    // In production (Vercel), VITE_API_URL is set to the full Render backend URL.
    proxy: {
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/tasks': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
