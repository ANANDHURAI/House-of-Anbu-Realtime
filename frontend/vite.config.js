import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      stream: 'readable-stream',
      util: 'util',
      buffer: 'buffer',
      process: path.resolve(__dirname, 'node_modules/process/browser.js'),
      events: 'events',
    },
  },
  optimizeDeps: {
    include: ['simple-peer', 'buffer', 'process/browser', 'readable-stream', 'events'],
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
})