import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        port: 5173,
        host: true,
        proxy: {
          // Proxy API calls to avoid CORS issues
          '/api/binance': {
            target: 'https://api.binance.com/api/v3',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/binance/, ''),
            secure: true
          },
          '/api/coinbase': {
            target: 'https://api.exchange.coinbase.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/coinbase/, ''),
            secure: true
          }
        }
      }
    };
});
