import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  // Tunnel hostnames for `npm run share`; preview.allowedHosts inherits this.
  server: { allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.trycloudflare.com'] },
  // `npm test`: every test file runs in its own worker thread, in parallel.
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    pool: 'threads',
    fileParallelism: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
