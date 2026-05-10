import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri-compatible Vite config
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5174,
    strictPort: true,
    host: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5174,
    },
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': { target: 'ws://localhost:3001', ws: true },
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
  },
});
