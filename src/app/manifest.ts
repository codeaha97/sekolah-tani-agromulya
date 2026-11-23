import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sekolah Tani Organik by Agro Mulya',
    short_name: 'Agro Mulya',
    description: 'Sistem Informasi Pembelajaran, Monitoring Kebun, dan Agribisnis Organik',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#022c22',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}