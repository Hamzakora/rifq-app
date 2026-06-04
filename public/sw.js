const CACHE_NAME = "rifq-pwa-v83-polish";
const QURAN_TEXT_CACHE = "rifq-quran-text-v1";
const QURAN_AUDIO_CACHE = "rifq-quran-audio-v1";
const QURAN_MUSHAF_IMAGE_CACHE = "rifq-mushaf-images-v1";
const RIFQ_CORE_CACHE = "rifq-core-data-v1";
const TAFSIR_CACHE = "rifq-tafsir-v1";
const HADITH_CACHE = "rifq-hadith-v1";
const MUSHAF_IMAGE_HOST = "raw.githubusercontent.com";
const MUSHAF_IMAGE_PATH_MARKER = "/Quran-PNG/master/";
const LOCAL_MUSHAF_IMAGE_PATH_MARKER = "/mushaf-pages/";
const AUDIO_HOSTS = new Set(["cdn.islamic.network"]);

const APP_SHELL = [
  "/",
  "/quran",
  "/audio",
  "/azkar",
  "/tafsir",
  "/hadith",
  "/khatma",
  "/notifications",
  "/prayer-times",
  "/calendar",
  "/favorites",
  "/settings",
  "/profile",
  "/about",
  "/report",
  "/reset-app",
  "/manifest.webmanifest",
  "/rifq-logo.png",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const preservedCaches = new Set([CACHE_NAME, QURAN_TEXT_CACHE, QURAN_AUDIO_CACHE, QURAN_MUSHAF_IMAGE_CACHE, RIFQ_CORE_CACHE, TAFSIR_CACHE, HADITH_CACHE]);

  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => preservedCaches.has(key) ? null : caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isRemoteMushafImage = url.hostname === MUSHAF_IMAGE_HOST && url.pathname.includes(MUSHAF_IMAGE_PATH_MARKER);
  const isLocalMushafImage = url.origin === self.location.origin && url.pathname.startsWith(LOCAL_MUSHAF_IMAGE_PATH_MARKER);
  const isMushafImage = isRemoteMushafImage || isLocalMushafImage;
  const isAudioFile = url.pathname.endsWith(".mp3") && (AUDIO_HOSTS.has(url.hostname) || url.hostname.includes("mp3quran"));

  if (isMushafImage) {
    event.respondWith(cacheFirst(request, QURAN_MUSHAF_IMAGE_CACHE));
    return;
  }

  if (isAudioFile) {
    event.respondWith(cacheFirst(request, QURAN_AUDIO_CACHE));
    return;
  }


  if (url.origin === self.location.origin && url.pathname.startsWith("/offline-data/")) {
    event.respondWith(cacheFirst(request, RIFQ_CORE_CACHE));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/azkar")) {
    event.respondWith(networkFirst(request, RIFQ_CORE_CACHE));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/tafsir")) {
    event.respondWith(networkFirst(request, TAFSIR_CACHE));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/hadith")) {
    event.respondWith(networkFirst(request, HADITH_CACHE));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, QURAN_TEXT_CACHE));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/")) return;

  if (url.origin !== self.location.origin) {
    event.respondWith(networkFirst(request, CACHE_NAME));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("/") || Response.error())
    );
    return;
  }

  event.respondWith(cacheFirst(request, CACHE_NAME));
});
