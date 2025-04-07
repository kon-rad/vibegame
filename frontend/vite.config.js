import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow access from any IP address
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
    },
    allowedHosts: ['localhost', '8720-37-19-205-149.ngrok-free.app', '.ngrok-free.app'] // Explicitly allow the ngrok domain
  }
}); 