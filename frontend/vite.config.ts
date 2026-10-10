import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api and /data go to backend/scripts/dev_server.py (the real Lambda handler, run locally).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/data': 'http://127.0.0.1:8787',
    },
  },
  build: { chunkSizeWarningLimit: 2500 },
});
