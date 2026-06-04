import type { PrayerLocation } from "@/lib/prayer/prayerLocations";

export type PrayerTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

export type LocalPrayerResult = {
  code: number;
  status: string;
  data: {
    timings: PrayerTimings;
    date: {
      readable: string;
      hijri: {
        day: string;
        month: { ar: string };
        year: string;
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: { id: number; name: string };
    };
  };
};

type MethodConfig = {
  name: string;
  fajrAngle: number;
  ishaAngle?: number;
  ishaMinutes?: number;
};

const methods: Record<number, MethodConfig> = {
  2: { name: "ISNA", fajrAngle: 15, ishaAngle: 15 },
  3: { name: "MWL", fajrAngle: 18, ishaAngle: 17 },
  4: { name: "Umm Al-Qura", fajrAngle: 18.5, ishaMinutes: 90 },
  5: { name: "Egypt", fajrAngle: 19.5, ishaAngle: 17.5 },
  8: { name: "Gulf", fajrAngle: 19.5, ishaMinutes: 90 },
  9: { name: "Kuwait", fajrAngle: 18, ishaAngle: 17.5 },
  10: { name: "Qatar", fajrAngle: 18, ishaMinutes: 90 },
  12: { name: "France", fajrAngle: 12, ishaAngle: 12 },
  13: { name: "Turkey", fajrAngle: 18, ishaAngle: 17 }
};

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function radToDeg(value: number) {
  return (value * 180) / Math.PI;
}

function fixAngle(value: number) {
  return ((value % 360) + 360) % 360;
}

function fixHour(value: number) {
  return ((value % 24) + 24) % 24;
}

function dsin(value: number) {
  return Math.sin(degToRad(value));
}

function dcos(value: number) {
  return Math.cos(degToRad(value));
}

function dasin(value: number) {
  return radToDeg(Math.asin(Math.max(-1, Math.min(1, value))));
}

function darccos(value: number) {
  return radToDeg(Math.acos(Math.max(-1, Math.min(1, value))));
}

function darctan2(y: number, x: number) {
  return radToDeg(Math.atan2(y, x));
}

function julianDate(year: number, month: number, day: number) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
}

function sunPosition(julian: number) {
  const d = julian - 2451545;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const l = fixAngle(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g));
  const e = 23.439 - 0.00000036 * d;
  const rightAscension = fixHour(darctan2(dcos(e) * dsin(l), dcos(l)) / 15);
  const declination = dasin(dsin(e) * dsin(l));
  const equation = q / 15 - rightAscension;

  return { declination, equation };
}

function getPartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour === "24" ? "0" : values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = getPartsInTimeZone(date, timeZone);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return (localAsUtc - date.getTime()) / 3600000;
}

function formatMinutes(value: number) {
  const total = ((Math.round(value) % 1440) + 1440) % 1440;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatReadableDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function getHijriDate(date: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      timeZone,
      day: "numeric",
      month: "long",
      year: "numeric"
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return {
      day: values.day || "—",
      month: { ar: values.month || "—" },
      year: String(values.year || "—").replace(/\s*هـ\s*/g, "")
    };
  } catch {
    return { day: "—", month: { ar: "—" }, year: "—" };
  }
}

export function getPrayerMethodForCountry(countryName: string) {
  const normalized = countryName.trim().toLowerCase();

  if (normalized.includes("egypt")) return 5;
  if (normalized.includes("saudi")) return 4;
  if (normalized.includes("kuwait")) return 9;
  if (normalized.includes("qatar")) return 10;
  if (
    normalized.includes("united arab emirates") ||
    normalized.includes("emirates") ||
    normalized.includes("oman") ||
    normalized.includes("bahrain")
  ) return 8;
  if (normalized.includes("turkey")) return 13;
  if (normalized.includes("france")) return 12;
  if (normalized.includes("united states") || normalized.includes("usa") || normalized.includes("canada")) return 2;

  return 3;
}

export function calculateLocalPrayerTimes(params: {
  latitude: number;
  longitude: number;
  timeZone: string;
  method?: number;
  date?: Date;
}): LocalPrayerResult {
  const now = params.date || new Date();
  const timeZone = params.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const localParts = getPartsInTimeZone(now, timeZone);
  const middayUtc = new Date(Date.UTC(localParts.year, localParts.month - 1, localParts.day, 12, 0, 0));
  const timeZoneOffset = getTimeZoneOffset(middayUtc, timeZone);
  const methodId = params.method || 3;
  const method = methods[methodId] || methods[3];
  const julian = julianDate(localParts.year, localParts.month, localParts.day) - params.longitude / (15 * 24);
  const sun = sunPosition(julian);
  const noon = 12 + timeZoneOffset - params.longitude / 15 - sun.equation;
  const latRad = degToRad(params.latitude);
  const decRad = degToRad(sun.declination);

  function hourAngleForAltitude(altitude: number) {
    const value = (Math.sin(degToRad(altitude)) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    return darccos(value) / 15;
  }

  const sunriseHour = hourAngleForAltitude(-0.833);
  const fajrHour = hourAngleForAltitude(-method.fajrAngle);
  const asrAltitude = -radToDeg(Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decRad)))));
  const asrHour = hourAngleForAltitude(asrAltitude);
  const sunrise = noon - sunriseHour;
  const maghrib = noon + sunriseHour;
  const isha = method.ishaMinutes ? maghrib + method.ishaMinutes / 60 : noon + hourAngleForAltitude(-(method.ishaAngle || 17));

  return {
    code: 200,
    status: "OK",
    data: {
      timings: {
        Fajr: formatMinutes(fajrHour ? (noon - fajrHour) * 60 : sunrise * 60 - 90),
        Sunrise: formatMinutes(sunrise * 60),
        Dhuhr: formatMinutes((noon + 2 / 60) * 60),
        Asr: formatMinutes((noon + asrHour) * 60),
        Maghrib: formatMinutes(maghrib * 60),
        Isha: formatMinutes(isha * 60)
      },
      date: {
        readable: formatReadableDate(now, timeZone),
        hijri: getHijriDate(now, timeZone)
      },
      meta: {
        latitude: params.latitude,
        longitude: params.longitude,
        timezone: timeZone,
        method: { id: methodId, name: method.name }
      }
    }
  };
}

export function calculatePrayerTimesForLocation(location: PrayerLocation, method?: number) {
  return calculateLocalPrayerTimes({
    latitude: location.latitude,
    longitude: location.longitude,
    timeZone: location.timeZone,
    method: method || getPrayerMethodForCountry(location.country)
  });
}
