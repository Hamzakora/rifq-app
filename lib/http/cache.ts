export const LONG_CACHE_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const STALE_CACHE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function cacheHeaders(seconds = LONG_CACHE_SECONDS) {
  return {
    "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${STALE_CACHE_SECONDS}`
  };
}
