import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '달동네 출판사',
    short_name: '달동네',
    description:
      '사진과 글을 모아 가족의 삶을 한 권의 인생책으로 만드는 달동네 출판사 앱',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7efe0',
    theme_color: '#6b3f18',
    categories: ['books', 'lifestyle', 'photo'],
    icons: [
      {
        src: '/app/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/app/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}