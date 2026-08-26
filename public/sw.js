/**
 * @fileoverview Service Worker nativo para DevForge (PWA - Mejora 25).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Versionado estricto de caché para invalidar versiones obsoletas (`devforge-v1`).
 * - Estrategia Cache-First para recursos estáticos (CSS, JS, SVG, Web Fonts).
 * - Estrategia Network-First para navegaciones HTML y documentos.
 * - REGLA DE SEGURIDAD: NUNCA almacenar en caché peticiones a APIs privadas o que contengan tokens.
 * - Limpieza de cachés antiguas en el evento 'activate' para evitar acumulación de memoria.
 * - Soporte para actualización en caliente mediante el mensaje 'SKIP_WAITING'.
 */

const CACHE_NAME = 'devforge-v1'

/**
 * Recursos esenciales para pre-cachear durante la instalación del Service Worker.
 */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
]

/**
 * 1. Evento de instalación: Pre-cachear el App Shell básico.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

/**
 * 2. Evento de activación: Purgar cachés antiguas y tomar control de los clientes inmediatamente.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

/**
 * 3. Evento de intercepción de peticiones (Fetch).
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo procesar peticiones GET
  if (request.method !== 'GET') return

  // Ignorar esquemas que no sean http o https (como chrome-extension://)
  if (!url.protocol.startsWith('http')) return

  // SEGURIDAD: NO cachear llamadas directas a APIs dinámicas externas o endpoints de auth
  if (
    url.hostname === 'api.github.com' ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/auth')
  ) {
    return
  }

  // A) Navegación HTML (Páginas): Network-First con fallback a caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Si la respuesta es válida, clonar y actualizar la caché de navegación
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return networkResponse
        })
        .catch(async () => {
          // En caso de estar offline, servir desde la caché
          const cachedResponse = await caches.match(request)
          if (cachedResponse) return cachedResponse

          // Fallback final a la raíz del SPA
          return (await caches.match('/index.html')) || (await caches.match('/'))
        })
    )
    return
  }

  // B) Recursos estáticos (JS, CSS, Fuentes, Imágenes, Iconos): Cache-First con actualización de fondo
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // En background actualizamos la caché para mantener los recursos frescos
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse))
            }
          })
          .catch(() => {
            /* Silenciar fallo de red si estamos offline */
          })

        return cachedResponse
      }

      // Si no estaba en caché, pedir a la red y guardar copia
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse
        }

        const responseClone = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        return networkResponse
      })
    })
  )
})

/**
 * 4. Mensajes desde la aplicación web (por ejemplo, para forzar actualización).
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
