const CACHE_NAME = 'daldongne-static-v1';
const CACHE_PREFIX = 'daldongne-static-';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter(
                (cacheName) =>
                  cacheName.startsWith(
                    CACHE_PREFIX,
                  ) &&
                  cacheName !== CACHE_NAME,
              )
              .map((cacheName) =>
                caches.delete(cacheName),
              ),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  if (
    requestUrl.origin !==
    self.location.origin
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    return;
  }

  if (
    requestUrl.pathname.startsWith('/api/')
  ) {
    return;
  }

  const isStaticAsset =
    requestUrl.pathname.startsWith(
      '/_next/static/',
    ) ||
    requestUrl.pathname.startsWith('/app/') ||
    requestUrl.pathname.startsWith(
      '/brand/',
    );

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(
        CACHE_NAME,
      );

      const cachedResponse =
        await cache.match(request);

      const networkRequest = fetch(request)
        .then(async (response) => {
          if (response.ok) {
            await cache.put(
              request,
              response.clone(),
            );
          }

          return response;
        });

      if (cachedResponse) {
        event.waitUntil(
          networkRequest.catch(() => undefined),
        );

        return cachedResponse;
      }

      try {
        return await networkRequest;
      } catch {
        return Response.error();
      }
    })(),
  );
});