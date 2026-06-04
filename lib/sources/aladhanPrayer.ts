import { LONG_CACHE_SECONDS } from "@/lib/http/cache";

const ALADHAN_BASE_URL = process.env.ALADHAN_BASE_URL || "https://api.aladhan.com/v1";

export async function getPrayerTimesByCity(params: {
  city: string;
  country: string;
  method?: number;
}) {
  const url = new URL(`${ALADHAN_BASE_URL}/timingsByCity`);
  url.searchParams.set("city", params.city);
  url.searchParams.set("country", params.country);
  if (params.method) url.searchParams.set("method", String(params.method));

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 30 }
  });

  if (!res.ok) {
    throw new Error(`AlAdhan prayer times request failed: ${res.status}`);
  }

  return res.json();
}

export async function getPrayerTimesByCoordinates(params: {
  latitude: number;
  longitude: number;
  method?: number;
}) {
  if (!Number.isFinite(params.latitude) || !Number.isFinite(params.longitude)) {
    throw new Error("Invalid latitude or longitude.");
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const url = new URL(`${ALADHAN_BASE_URL}/timings/${day}-${month}-${year}`);
  url.searchParams.set("latitude", String(params.latitude));
  url.searchParams.set("longitude", String(params.longitude));
  if (params.method) url.searchParams.set("method", String(params.method));

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 30 }
  });

  if (!res.ok) {
    throw new Error(`AlAdhan prayer times by coordinates request failed: ${res.status}`);
  }

  return res.json();
}

export async function getQiblaDirection(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Invalid latitude or longitude.");
  }

  const res = await fetch(`${ALADHAN_BASE_URL}/qibla/${latitude}/${longitude}`, {
    headers: { accept: "application/json" },
    cache: "force-cache",
    next: { revalidate: LONG_CACHE_SECONDS }
  });

  if (!res.ok) {
    throw new Error(`AlAdhan qibla request failed: ${res.status}`);
  }

  return res.json();
}
