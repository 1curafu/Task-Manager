import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vela - Set your sails',
    short_name: 'Vela',
    description: 'A modern team collaboration and task management platform designed to help you organize, track, and manage your work efficiently.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#0071e3',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
