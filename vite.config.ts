import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Ajout de l'import pour VitePWA

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ // Début de la configuration VitePWA
      registerType: 'autoUpdate',
      manifest: {
        name: 'THE BOX - Votre Écrin Numérique',
        short_name: 'THE BOX',
        description: 'Gérez et partagez votre collection de montres avec THE BOX, votre écrin numérique personnel.',
        lang: 'fr-FR',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000', // Couleur principale de votre application
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icons/icon-72x72.png', // Chemin relatif au dossier public
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        // CORRECTION: Mise à jour de la section screenshots
        screenshots: [
          {
            src: "screenshots/screenshot1.png", // Assurez-vous que ce fichier existe dans public/screenshots/
            sizes: "1080x1920", // Mettez la taille réelle de votre image
            type: "image/png",
            form_factor: "narrow",
            label: "Ma collection de montres"
          },
          {
            src: "screenshots/screenshot2.png", // Assurez-vous que ce fichier existe dans public/screenshots/
            sizes: "1080x1920", // Mettez la taille réelle de votre image
            type: "image/png",
            form_factor: "narrow",
            label: "Actualités horlogères"
          },
          {
            src: "screenshots/screenshot3.png", // Assurez-vous que ce fichier existe dans public/screenshots/
            sizes: "1080x1920", // Mettez la taille réelle de votre image
            type: "image/png",
            form_factor: "narrow",
            label: "Galerie de photos de montres (triable)"
          }
        ],
        categories: ["lifestyle", "utilities", "productivity"],
        prefer_related_applications: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Adaptez 'your-supabase-project-id' et 'your-bucket-name'
            // Exemple : /^https:\/\/xyzabc\.supabase\.co\/storage\/v1\/object\/public\/avatars\/.*/i
            // Assurez-vous que your-bucket-name est le nom de votre bucket principal pour les images publiques, ou ajoutez plusieurs règles si nécessaire.
            urlPattern: /^https:\/\/your-supabase-project-id\.supabase\.co\/storage\/v1\/object\/public\/your-bucket-name\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images-cache',
              expiration: {
                maxEntries: 60, // Nombre maximum d'images à mettre en cache
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Adaptez 'your-supabase-project-id'
            // Exemple : /^https:\/\/xyzabc\.supabase\.co\/rest\/v1\/.*/i
            urlPattern: /^https:\/\/your-supabase-project-id\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst', // Essaye le réseau d'abord, puis le cache si hors ligne ou échec réseau
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10, // Temps avant de basculer sur le cache
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 jour
              },
              cacheableResponse: {
                statuses: [0, 200] // Met en cache uniquement les réponses valides
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Utile pour tester en développement, peut être mis à false en production
      }
    }) // Fin de la configuration VitePWA
  ],
  // Potentielles autres configurations de Vite (server, build, etc.)
  // server: {
  //   port: 3000,
  // },
  // build: {
  //   outDir: 'dist',
  // },
})
