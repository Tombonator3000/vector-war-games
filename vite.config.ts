import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Set base path for GitHub Pages deployment
  base: process.env.GITHUB_PAGES === 'true' ? '/vector-war-games/' : '/',
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.svg', 'textures/*.jpg', 'leaders/*.jpg', 'data/*.json'],
      manifest: {
        name: 'Aegis Protocol - NORAD Vector',
        short_name: 'Aegis Protocol',
        description: 'Cold War crisis management simulation - strategic nuclear, diplomatic, and pandemic gameplay',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['games', 'entertainment', 'strategy'],
        screenshots: [],
        shortcuts: [
          {
            name: 'New Game',
            short_name: 'New Game',
            description: 'Start a new campaign',
            url: '/?action=new',
            icons: [{ src: '/pwa-icons/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Cache strategies for different asset types
        // Exclude large media files from precache - they use runtime caching instead
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Ignore large files in precache (will use runtime caching)
        globIgnores: ['**/Muzak/**', '**/sfx/**', '**/textures/**'],
        // Allow larger JS chunks to be precached (up to 10MB)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Runtime caching for assets not in the precache
        runtimeCaching: [
          {
            // Cache game textures
            urlPattern: /^.*\/textures\/.*\.(jpg|png)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'textures-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache leader portraits
            urlPattern: /^.*\/leaders\/.*\.(jpg|png)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaders-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache music files
            urlPattern: /^.*\/Muzak\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'music-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache sound effects
            urlPattern: /^.*\/sfx\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sfx-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache geo data
            urlPattern: /^.*\/data\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geodata-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Network first for API calls (if any)
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          {
            // Cache all other static assets (fallback)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ],
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true, // Enable PWA in development for testing
        type: 'module'
      }
    })
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
