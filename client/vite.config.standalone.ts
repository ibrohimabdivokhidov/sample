import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { vitePlugin as cartographer } from '@replit/vite-plugin-cartographer';
import { vitePlugin as errorOverlay } from '@replit/vite-plugin-runtime-error-modal';
import tailwindcss from '@tailwindcss/vite';

const sharedPaths = {
  '@shared': path.resolve('shared'),
};

export default defineConfig({
  plugins: [react(), cartographer({ projectType: 'react' }), errorOverlay(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve('client/src'),
      ...sharedPaths,
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
  },
});