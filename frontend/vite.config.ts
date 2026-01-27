import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/gh-signage/',
  plugins: [react()],
  server: {
    allowedHosts: true,
    port: 5173,
  },
})
