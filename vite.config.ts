import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react({
      // React Fast Refresh 최적화
      fastRefresh: true,
      // JSX 런타임 최적화
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5178,
    open: true, // 서버 시작 시 자동으로 브라우저 열기
    cors: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8006',
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 30000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: ['es2022', 'chrome87', 'firefox78', 'safari13'],
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false, // 빌드 시간 단축
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            'sonner'
          ],
          'motion-vendor': ['framer-motion'],
          'icons-vendor': ['lucide-react', '@phosphor-icons/react', '@heroicons/react'],
          'chart-vendor': ['recharts', 'd3'],
          'calendar-vendor': [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction'
          ],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-vendor': ['date-fns'],
          'query-vendor': ['@tanstack/react-query'],

          // Feature chunks
          'social-sharing': ['./src/components/social/SocialShareService.tsx'],
          'media-hub': ['./src/components/media/MediaIntegrationHub.tsx'],
          'mobile-interface': ['./src/components/mobile/MobileOptimizedInterface.tsx'],
          'ai-features': ['./src/components/advanced/AIEnhancedFeatures.tsx'],

          // Utility chunks
          'utils': ['./src/lib/utils.ts', './src/lib/api.ts', './src/lib/enhanced-api.ts'],
        },
        // 파일명에 해시 추가로 캐싱 최적화
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    chunkSizeWarningLimit: 1500, // 청크 크기 경고 임계값 증가
    assetsInlineLimit: 4096, // 4KB 이하 파일은 인라인으로
  },
  optimizeDeps: {
    include: [
      // React 관련
      'react',
      'react-dom',
      'react/jsx-runtime',
      // UI 라이브러리
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      // 아이콘
      'lucide-react',
      '@phosphor-icons/react',
      '@heroicons/react/24/outline',
      // 기타 라이브러리
      'sonner',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      // AI/ML 관련
      'd3',
      'three',
      // 폼 관련
      'react-hook-form',
      'zod'
    ],
    exclude: ['@fullcalendar/core'] // 문제가 있는 패키지 제외
  },
  // 개발 서버 성능 최적화
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2022',
  },
  // 환경 변수 설정
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
  },
  // CSS 최적화
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  // 프로덕션 빌드 최적화
  ...(process.env.NODE_ENV === 'production' && {
    build: {
      ...this.build,
      rollupOptions: {
        ...this.build?.rollupOptions,
        plugins: [
          // 번들 크기 분석
          // bundleAnalyzer({ open: false, filename: 'bundle-report.html' })
        ],
        external: [
          // 외부 종속성 (CDN 사용 시)
          // 'react',
          // 'react-dom'
        ]
      }
    }
  }),
});
