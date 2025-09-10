import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022'
  },
  server: {
    proxy: {
      '/api/monday': {
        target: 'https://api.monday.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/monday/, '/v2'),
        timeout: 10000,
        proxyTimeout: 10000,
        secure: true,
        headers: {
          'Origin': 'https://api.monday.com',
          'Referer': 'https://api.monday.com'
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy Error:', err);
            // Send a proper error response instead of hanging
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy connection failed' }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📤 Proxy Request:', req.method, req.url);
            // Add required headers for Monday.com API
            proxyReq.setHeader('User-Agent', 'Neon-Konfigurator/1.0');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('API-Version', '2023-10');
            // Set timeout on the proxy request
            proxyReq.setTimeout(10000, () => {
              console.error('❌ Proxy request timeout');
              proxyReq.destroy();
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📥 Proxy Response:', proxyRes.statusCode);
            // Add CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, API-Version');
          });
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
