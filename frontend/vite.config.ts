import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Manifest is injected automatically into index.html by the plugin
      manifest: {
        name: 'Finder E-Prescription',
        short_name: 'Apteki',
        description: 'Znajdź aptekę w swojej okolicy',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
          { src: '/pwa-192x192.png',          sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png',          sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache the Google Maps API responses and app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-maps-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['.loca.lt', '.ngrok-free.app', '.ngrok-free.dev', '.ngrok-free.dev', '.ngrok.io', '.ngrok.app'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
