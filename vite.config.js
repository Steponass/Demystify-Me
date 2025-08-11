import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig({
  plugins: [react()],
    resolve: {
    alias: {
      '@': path.resolve('./src'),
      '@components': path.resolve('./src/components'),
      '@hooks': path.resolve('./src/hooks'),
      '@store': path.resolve('./src/store'),
      '@utils': path.resolve('./src/utils'),
      '@assets': path.resolve('./src/assets'),
      '@styles': path.resolve('./src/styles'),
      '@data': path.resolve('./src/data'),
      '@levels': path.resolve('./src/levels')
    }
  }
})
