/*
 * Hornalla funciona sin conexión.
 *
 * El sitio es estático, así que alcanza con guardar en el dispositivo las páginas
 * y los archivos que ya se visitaron. No hay datos de personas ni analíticas:
 * el service worker solo copia archivos públicos del propio sitio.
 *
 * Para publicar una versión nueva, cambiar VERSION. Las copias viejas se borran solas.
 */
const VERSION = "hornalla-v1";
const CACHE = VERSION + "-estatico";

// Páginas que se guardan apenas se instala (si alguna falla, sigue igual).
const PAGINAS = [
  "/",
  "/index.html",
  "/herramienta.html",
  "/mapa.html",
  "/donar.html",
  "/instructivo.html",
  "/manifest.webmanifest",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/fogata-poster.png",
  "/logo.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.all(PAGINAS.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((clave) => clave !== CACHE).map((clave) => caches.delete(clave))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (evento) => {
  if (evento.data === "SKIP_WAITING") self.skipWaiting();
});

/** Archivos que no conviene guardar: los del servidor de desarrollo y los del propio worker. */
function seGuarda(url) {
  return !(
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.includes("/node_modules/") ||
    url.pathname === "/sw.js"
  );
}

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;

  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;
  if (!seGuarda(url)) return;

  // Navegar: primero la red (para tener siempre la última versión) y, si no hay
  // conexión, la copia guardada. Así el sitio abre igual en un comedor sin internet.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE).then((cache) => cache.put(pedido, copia));
          }
          return respuesta;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          return (await cache.match(pedido)) || (await cache.match("/")) || (await cache.match("/index.html"));
        })
    );
    return;
  }

  // Archivos (JS, CSS, imágenes): primero la copia guardada, que es instantánea.
  evento.respondWith(
    caches.match(pedido).then((guardada) => {
      if (guardada) return guardada;
      return fetch(pedido).then((respuesta) => {
        if (respuesta && respuesta.ok && respuesta.type === "basic") {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(pedido, copia));
        }
        return respuesta;
      });
    })
  );
});
