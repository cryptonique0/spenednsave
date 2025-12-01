import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.jsx'],
    exclude: ['test/Rewards.test.js'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 15,
        functions: 10,
        branches: 8,
        statements: 15
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor'
            if (id.includes('wagmi')) return 'wagmi-vendor'
            return 'vendor'
          }
        }
      }
    }
  }
})
