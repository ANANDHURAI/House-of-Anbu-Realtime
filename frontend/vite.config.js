import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Ensure public files are copied
  publicDir: 'public',
  
  build: {
    outDir: 'dist',
    copyPublicDir: true, // Copies _redirects to dist
  },
  
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
