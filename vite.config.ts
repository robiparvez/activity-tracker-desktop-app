import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        electron([
            {
                entry: 'electron/main.ts',
                onstart(args) {
                    args.startup()
                },
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['better-sqlite3']
                        }
                    },
                },
            },
            {
                entry: 'electron/preload.ts',
                onstart(args) {
                    args.reload()
                },
                vite: {
                    build: {
                        outDir: 'dist-electron',
                    },
                },
            },
        ]),
        renderer(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    base: './',
    server: {
        port: 5173,
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'recharts-vendor': ['recharts'],
                    'ui-vendor': ['lucide-react', 'framer-motion', 'date-fns'],
                },
            },
        },
    },
})
