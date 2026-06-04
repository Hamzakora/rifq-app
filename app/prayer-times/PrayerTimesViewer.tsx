"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Clock, LocateFixed, MapPin, Navigation, RefreshCw } from "lucide-react";
import { countryCities, type CountryCities } from "@/lib/sources/countriesCities";
import { readSettings, writeSettings } from "@/components/settingsStore";
import { getPrayerLocation } from "@/lib/prayer/prayerLocations";
import { calculateLocalPrayerTimes, calculatePrayerTimesForLocation, getPrayerMethodForCountry, type LocalPrayerResult } from "@/lib/prayer/localPrayerTimes";

const prayers = [
  ["Fajr", "الفجر"],
  ["Sunrise", "الشروق"],
  ["Dhuhr", "الظهر"],
  ["Asr", "العصر"],
  ["Maghrib", "المغرب"],
  ["Isha", "العشاء"]
] as const;

const nextPrayerKeys = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const SAVED_PRAYER_LOCATION_KEY = "rifq-prayer-location-v1";

type LocationMode = "manual" | "gps";

type SavedPrayerLocation = {
  mode: LocationMode;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  method?: number;
  label?: string;
  timeZone?: string;
};

function toArabicNumber(value: number | string | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function cleanPrayerTime(value: unknown) {
  if (typeof value !== "string") return "--:--";
  return value.split(" ")[0] || value;
}

function formatPrayerTime12(value: unknown) {
  const clean = cleanPrayerTime(value);
  const [hoursText, minutesText] = clean.split(":");
  const hours24 = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isFinite(hours24) || !Number.isFinite(minutes)) return clean;

  const period = hours24 >= 12 ? "م" : "ص";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function timeToMinutes(value: unknown) {
  const clean = cleanPrayerTime(value);
  const [hours, minutes] = clean.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function getNextPrayer(timings: Record<string, unknown>) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const key of nextPrayerKeys) {
    const prayerMinutes = timeToMinutes(timings[key]);
    if (prayerMinutes !== null && prayerMinutes >= currentMinutes) {
      return { key, minutesLeft: prayerMinutes - currentMinutes };
    }
  }

  const fajrMinutes = timeToMinutes(timings.Fajr);
  if (fajrMinutes !== null) {
    return { key: "Fajr", minutesLeft: 24 * 60 - currentMinutes + fajrMinutes };
  }

  return null;
}

function getPrayerArabicName(key: string) {
  return prayers.find(([prayerKey]) => prayerKey === key)?.[1] || "الصلاة";
}

function formatMinutesLeft(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours <= 0) return `بعد ${toArabicNumber(minutes)} دقيقة`;
  if (minutes === 0) return `بعد ${toArabicNumber(hours)} ساعة`;
  return `بعد ${toArabicNumber(hours)} ساعة و${toArabicNumber(minutes)} دقيقة`;
}

function readSavedPrayerLocation(): SavedPrayerLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_PRAYER_LOCATION_KEY) || "null") as SavedPrayerLocation | null;
    if (!saved || !["manual", "gps"].includes(saved.mode)) return null;
    return saved;
  } catch {
    return null;
  }
}

function savePrayerLocation(location: SavedPrayerLocation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_PRAYER_LOCATION_KEY, JSON.stringify(location));
}

function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function PrayerTimesViewer() {
  const [locations] = useState<CountryCities[]>(countryCities);
  const [country, setCountry] = useState("Egypt");
  const [city, setCity] = useState("Cairo");
  const [method, setMethod] = useState(5);
  const [locationMode, setLocationMode] = useState<LocationMode>("manual");
  const [geoPosition, setGeoPosition] = useState<{ latitude: number; longitude: number; label: string; timeZone: string } | null>(null);
  const [data, setData] = useState<LocalPrayerResult | null>(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const selectedCountry = useMemo(
    () => locations.find((item) => item.country === country) || locations[0],
    [locations, country]
  );

  const selectedCityLabel = useMemo(() => {
    return selectedCountry?.cities.find((item) => item.city === city)?.cityAr || city;
  }, [city, selectedCountry]);

  useEffect(() => {
    const settings = readSettings();
    const saved = readSavedPrayerLocation();
    const initialCountry = saved?.country || settings.prayerCountry || "Egypt";
    const initialCity = saved?.city || settings.prayerCity || "Cairo";

    if (saved?.mode === "gps" && Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude)) {
      const nextMethod = saved.method || getPrayerMethodForCountry(initialCountry);
      const nextTimeZone = saved.timeZone || getDeviceTimeZone();
      setMethod(nextMethod);
      setLocationMode("gps");
      setGeoPosition({
        latitude: saved.latitude!,
        longitude: saved.longitude!,
        label: saved.label || "موقعك الحالي",
        timeZone: nextTimeZone
      });
    } else {
      setMethod(getPrayerMethodForCountry(initialCountry));
      setLocationMode("manual");
      setCountry(initialCountry);
      setCity(initialCity);
    }

    setInitialized(true);
  }, []);

  useEffect(() => {
    const firstCity = selectedCountry?.cities?.[0]?.city;
    if (firstCity && !selectedCountry.cities.some((item) => item.city === city)) {
      setCity(firstCity);
    }
  }, [selectedCountry, city]);

  useEffect(() => {
    if (locationMode === "manual") {
      setMethod(getPrayerMethodForCountry(country));
    }
  }, [country, locationMode]);

  useEffect(() => {
    if (!initialized) return;

    if (locationMode === "gps" && geoPosition) {
      loadByCoordinates(geoPosition.latitude, geoPosition.longitude, method, false, geoPosition.timeZone);
      return;
    }

    if (locationMode === "manual") {
      loadByCity(country, city, method, false);
    }
  }, [initialized]);

  async function loadByCity(nextCountry = country, nextCity = city, nextMethod = getPrayerMethodForCountry(nextCountry), persist = true) {
    const autoMethod = getPrayerMethodForCountry(nextCountry);
    const location = getPrayerLocation(nextCountry, nextCity);

    setMethod(autoMethod);
    setLoading(true);
    setError("");
    setStatusMessage("جاري تحديث المواقيت...");

    try {
      if (!location) throw new Error("اختر مدينة من القائمة.");
      const result = calculatePrayerTimesForLocation(location, autoMethod);
      setData(result);
      setLocationMode("manual");
      setGeoPosition(null);
      setStatusMessage("تم تحديث المواقيت.");

      if (persist) {
        savePrayerLocation({ mode: "manual", country: nextCountry, city: nextCity, method: autoMethod });
        const settings = readSettings();
        writeSettings({ ...settings, prayerCountry: nextCountry, prayerCity: nextCity });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حساب المواقيت.");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  }

  async function loadByCoordinates(latitude: number, longitude: number, nextMethod = method, persist = true, timeZone = getDeviceTimeZone()) {
    setLoading(true);
    setError("");
    setStatusMessage("جاري تحديث المواقيت...");

    try {
      const result = calculateLocalPrayerTimes({ latitude, longitude, method: nextMethod, timeZone });
      setData(result);
      setLocationMode("gps");
      setGeoPosition({ latitude, longitude, label: "موقعك الحالي", timeZone });
      setStatusMessage("تم تحديث المواقيت.");

      if (persist) {
        savePrayerLocation({ mode: "gps", latitude, longitude, method: nextMethod, label: "موقعك الحالي", timeZone });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حساب المواقيت.");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  }

  function requestCurrentLocation() {
    setError("");
    setStatusMessage("");

    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("اختر المدينة يدويًا.");
      return;
    }

    setLocating(true);
    setStatusMessage("جاري تحديد الموقع...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocating(false);
        loadByCoordinates(latitude, longitude, method, true, getDeviceTimeZone());
      },
      (geoError) => {
        setLocating(false);
        setError(geoError.code === geoError.PERMISSION_DENIED ? "تم رفض إذن الموقع. اختر المدينة يدويًا." : "تعذر تحديد موقعك. اختر المدينة يدويًا.");
        setStatusMessage("");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 1000 * 60 * 20 }
    );
  }

  function refreshCurrentTimes() {
    if (locationMode === "gps" && geoPosition) {
      loadByCoordinates(geoPosition.latitude, geoPosition.longitude, method, true, geoPosition.timeZone);
      return;
    }

    loadByCity(country, city, method, true);
  }

  const timings: Record<string, unknown> = data?.data.timings || {};
  const date = data?.data.date.readable;
  const hijri = data?.data.date.hijri;
  const timezone = data?.data.meta.timezone;
  const nextPrayer = getNextPrayer(timings);
  const activeLocationLabel = locationMode === "gps"
    ? geoPosition?.label || "موقعك الحالي"
    : `${selectedCityLabel}، ${selectedCountry?.countryAr || country}`;

  return (
    <div className="space-y-5" dir="rtl">
      <section className="qawra-card p-5 md:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-stretch">
          <div className="flex items-start gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.25rem] bg-[#fff8e8] text-[#315339] ring-1 ring-[#dfc688]/70 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <MapPin size={25} />
            </span>
            <div className="min-w-0">
              <h1 className="qawra-title mt-1 text-3xl font-black md:text-4xl">مواقيت الصلاة</h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-8 text-slate-600 dark:text-slate-300">
                اختر مدينتك أو استخدم موقعك الحالي.
              </p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[#dfc688]/55 bg-white/70 p-4 shadow-inner dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-black text-slate-500 dark:text-slate-300">الموقع الحالي</p>
            <h2 className="mt-2 text-2xl font-black text-[#315339] dark:text-[#f7edda]">{activeLocationLabel}</h2>
            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
              {timezone && <span>{timezone}</span>}
              {date && <span>{date}</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[auto_auto_1fr] md:items-center">
          <button
            type="button"
            onClick={requestCurrentLocation}
            disabled={locating || loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#315339] px-5 py-3 font-black text-white shadow-lg shadow-emerald-950/10 disabled:cursor-wait disabled:opacity-70"
          >
            <LocateFixed size={18} />
            {locating ? "جاري التحديد..." : "تحديد موقعي"}
          </button>

          <button
            type="button"
            onClick={refreshCurrentTimes}
            disabled={loading || locating}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-[#315339] ring-1 ring-[#dfc688]/70 disabled:cursor-wait disabled:opacity-70 dark:bg-white/10 dark:text-[#f7edda] dark:ring-white/10"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
        </div>
      </section>

      <section className="qawra-card p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-[#987a35]">اختيار يدوي</p>
            <h2 className="text-2xl font-black text-[#315339] dark:text-[#f7edda]">الدولة والمدينة</h2>
          </div>
          <span className="rounded-full bg-[#fff8e8] px-4 py-2 text-xs font-black text-[#7b6431] ring-1 ring-[#dfc688]/60 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
            {locationMode === "gps" ? "الموقع مفعل" : "اختيار يدوي"}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            value={country}
            onChange={(e) => {
              const nextCountry = e.target.value;
              const nextCountryData = locations.find((item) => item.country === nextCountry);
              const nextCity = nextCountryData?.cities?.[0]?.city || city;

              setCountry(nextCountry);
              setCity(nextCity);
              setMethod(getPrayerMethodForCountry(nextCountry));
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none dark:border-slate-700 dark:bg-slate-950"
          >
            {locations.map((item) => (
              <option key={item.country} value={item.country}>
                {item.countryAr}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none dark:border-slate-700 dark:bg-slate-950"
          >
            {selectedCountry.cities.map((item) => (
              <option key={item.city} value={item.city}>
                {item.cityAr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadByCity(country, city, getPrayerMethodForCountry(country), true)}
            disabled={loading || locating}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#315339] px-5 py-3 font-black text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
          >
            <Clock size={17} />
            عرض المواقيت
          </button>
        </div>
      </section>

      {statusMessage && !error && (
        <div className="rounded-3xl border border-[#dfc688]/55 bg-[#fff8e8] p-4 text-sm font-black text-[#315339] dark:border-white/10 dark:bg-white/10 dark:text-[#f7edda]">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="flex gap-3 rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">
          <AlertCircle className="mt-1 shrink-0" size={20} />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <>
          <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="qawra-card p-5 md:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff8e8] text-[#315339] ring-1 ring-[#dfc688]/60 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                  <CalendarDays size={20} />
                </span>
                <div>
                  <p className="text-xs font-black text-slate-500 dark:text-slate-300">التاريخ</p>
                  <p className="mt-1 text-lg font-black text-[#315339] dark:text-[#f7edda]">
                    {date || "—"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#987a35]">
                    {hijri?.day} {hijri?.month?.ar} {hijri?.year} هـ
                  </p>
                </div>
              </div>
            </div>

            <div className="qawra-card p-5 md:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff8e8] text-[#315339] ring-1 ring-[#dfc688]/60 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                  <Navigation size={20} />
                </span>
                <div>
                  <p className="text-xs font-black text-slate-500 dark:text-slate-300">الصلاة القادمة</p>
                  <p className="mt-1 text-lg font-black text-[#315339] dark:text-[#f7edda]">
                    {nextPrayer ? getPrayerArabicName(nextPrayer.key) : "—"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#987a35]">
                    {nextPrayer ? formatMinutesLeft(nextPrayer.minutesLeft) : "جاري الحساب"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {prayers.map(([key, ar]) => (
              <div key={key} className="qawra-card p-5 text-center">
                <p className="text-sm font-black text-slate-500 dark:text-slate-400">{ar}</p>
                <p className="mt-2 text-4xl font-black text-[#315339] dark:text-[#f7edda]">
                  {toArabicNumber(formatPrayerTime12(timings[key]))}
                </p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
