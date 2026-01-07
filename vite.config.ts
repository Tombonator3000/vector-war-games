import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Set base path for GitHub Pages deployment
  base: process.env.GITHUB_PAGES === 'true' ? '/vector-war-games/' : '/',
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Improve chunk splitting
    // NOTE: React is NOT manually chunked to avoid initialization order issues
    // when lazy loading components with module-level code (Index.tsx)
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          // 'react-vendor' removed - let Vite handle React chunking automatically
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          '3d-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'chart-vendor': ['recharts', 'reactflow', 'dagre'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    // Increase chunk size warning limit for game data
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional, can be disabled)
    sourcemap: mode === 'development',
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },
  test: {
    environment: "jsdom",
  },
}));
