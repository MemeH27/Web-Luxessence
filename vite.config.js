import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'img/*.{png,svg,ico}'],
      manifest: {
        name: 'Luxessence',
        short_name: 'Luxessence',
        description: 'Luxessence - Professional Fragrance Store',
        theme_color: '#B8860B',
        background_color: '#1A1A1A',
        icons: [
          {
            src: 'img/logo-luxessence.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'img/logo-luxessence.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
