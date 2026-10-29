import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/api/insights' || url === '/api/hint') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsedBody = body ? JSON.parse(body) : {};
              const vercelReq: any = {
                method: req.method,
                headers: req.headers,
                body: parsedBody,
                query: {},
                socket: req.socket,
              };
              const vercelRes: any = {
                setHeader: (k: string, v: string) => res.setHeader(k, v),
                status: (code: number) => {
                  res.statusCode = code;
                  return vercelRes;
                },
                json: (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return vercelRes;
                },
                end: () => res.end(),
              };

              if (url === '/api/insights') {
                const handler = (await import('./api/insights')).default;
                await handler(vercelReq, vercelRes);
              } else if (url === '/api/hint') {
                const handler = (await import('./api/hint')).default;
                await handler(vercelReq, vercelRes);
              }
            } catch (err) {
              console.error('API Dev error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.OPENROUTER_API_KEY) process.env.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  if (env.OPENROUTER_MODEL) process.env.OPENROUTER_MODEL = env.OPENROUTER_MODEL;
  if (env.SITE_URL) process.env.SITE_URL = env.SITE_URL;

  return {
    plugins: [react(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
            'report-vendor': ['jspdf', 'html2canvas'],
            'motion-vendor': ['framer-motion'],
          },
        },
      },
    },
  };
});
