import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Arcora',
        short_name: 'Arcora',
        description: "L'écrin de votre collection de montres : passeport, calendrier de portage, galerie au poignet.",
        lang: 'fr-FR',
        start_url: '/',
        display: 'standalone',
        background_color: '#1f0e11',
        theme_color: '#1f0e11',
        orientation: 'portrait-primary',
        icons: [
          { src: 'icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ],
        screenshots: [
          { src: "screenshots/screenshot1.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Ma collection de montres" },
          { src: "screenshots/screenshot2.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Actualités horlogères" },
          { src: "screenshots/screenshot3.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Galerie de photos de montres (triable)" }
        ],
        categories: ["lifestyle", "utilities", "productivity"],
        prefer_related_applications: false
      },
      workbox: {
        // Réception des notifications push et ouverture de la bonne page au toucher (public/push-sw.js)
        importScripts: ['push-sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/gwotvurtiyeaslmxnqcw\.supabase\.co\/storage\/v1\/object\/public\/avatars\/.*/i,
            handler: 'CacheFirst',
            options: {
              // Suggestion: Nom de cache unique
              cacheName: 'supabase-avatars-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/gwotvurtiyeaslmxnqcw\.supabase\.co\/storage\/v1\/object\/public\/watch\.images\/.*/i,
            handler: 'CacheFirst',
            options: {
              // Suggestion: Nom de cache unique
              cacheName: 'supabase-watch-images-cache',
              expiration: {
                maxEntries: 400, // miniatures + pleines tailles
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
})
