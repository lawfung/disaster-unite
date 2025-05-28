import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/disaster-unite/',
  define: {
    global: 'globalThis',
    'process.env': {}   
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [
        '@safe-globalThis/safe-ethers-adapters',
        '@safe-globalThis/safe-core-sdk',
        '@safe-globalThis/safe-ethers-lib'
      ]
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
})

