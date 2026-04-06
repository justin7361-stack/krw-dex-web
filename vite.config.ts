import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Wallet + chain infrastructure (largest, rarely changes)
          'vendor-wallet': ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
          // Charts (only needed on /trade and /market)
          'vendor-charts': ['lightweight-charts'],
        },
      },
    },
    // Raise warning limit slightly — we've addressed the main chunks
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
