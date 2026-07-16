'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    const registerServiceWorker = () => {
      void navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then((registration) => {
          void registration.update();
        })
        .catch((error: unknown) => {
          console.error(
            '달동네 서비스 워커 등록 실패:',
            error,
          );
        });
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
      return;
    }

    window.addEventListener(
      'load',
      registerServiceWorker,
      { once: true },
    );

    return () => {
      window.removeEventListener(
        'load',
        registerServiceWorker,
      );
    };
  }, []);

  return null;
}