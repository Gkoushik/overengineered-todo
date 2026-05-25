import { createProxyMiddleware } from 'http-proxy-middleware';

const SERVICE_URLS: Record<string, string> = {
  '/auth': process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  '/tasks': process.env.TASK_SERVICE_URL || 'http://localhost:3001',
  '/ai': process.env.AI_SERVICE_URL || 'http://localhost:3004',
  '/search': process.env.SEARCH_SERVICE_URL || 'http://localhost:3005',
  '/analytics': process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006',
  '/blockchain': process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3007',
};

export function createServiceProxies() {
  return Object.entries(SERVICE_URLS).map(([path, target]) => ({
    path,
    proxy: createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (p) => p,
    }),
  }));
}
