import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Remove the rewrite rule so the /api prefix is preserved
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/colyseus': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  }
}); 