import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';

  return {
    plugins: [react(), tailwindcss()],
    // Dev proxy: only active locally; in production Vercel uses VITE_API_URL directly
    server: isDev ? {
      proxy: {
        '/api': {
          target: env.LOCAL_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        }
      }
    } : {},
  };
});
