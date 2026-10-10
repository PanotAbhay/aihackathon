import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  // Tunnel hostnames for `npm run share`; preview.allowedHosts inherits this.
  server: { allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.trycloudflare.com'] },
})
