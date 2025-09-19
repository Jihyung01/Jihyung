import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5178,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8006',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'motion-vendor': ['framer-motion'],
          'three-vendor': ['three', '@react-three/fiber'],
          'calendar-vendor': ['@fullcalendar/core', '@fullcalendar/react', '@fullcalendar/daygrid'],

          // Feature chunks
          'dashboard': ['./src/components/DashboardView-UltraModern.tsx'],
          'notes': ['./src/components/pages/NotesPage-UltraModern.tsx'],
          'tasks': ['./src/components/pages/TasksPage-UltraModern.tsx'],
          'calendar': ['./src/components/pages/CalendarPage-UltraModern-Enhanced.tsx'],
          'collaboration': ['./src/components/pages/CollaborationPage.tsx'],

          // Utility chunks
          'utils': ['./src/lib/utils.ts', './src/lib/api.ts'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
      '@phosphor-icons/react'
    ]
  }
});
