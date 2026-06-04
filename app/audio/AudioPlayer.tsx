"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Headphones, Loader2, Pause, Play, Radio, RefreshCw, Repeat, SkipBack, SkipForward, Trash2, Volume2, WifiOff } from "lucide-react";
import { readSettings } from "@/components/settingsStore";
import { QURAN_AUDIO_CACHE, quranAudioUrl } from "@/lib/client/offlineCache";
import { recordListenSeconds, recordListenStart } from "@/lib/client/activityStore";
import { QURAN_RECITERS, getAyahAudioEdition, getQuranSurahAudioCandidates, getReciterByEdition, isAvailableReciter } from "@/lib/quran/reciters";
import { STATIC_SURAH_LIST } from "@/lib/static/quranSurahList";

type Chapter = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
};

function toArabicNumber(value: number | string | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function getCachedSetKey(edition: string) {
  return `rifq-audio-downloaded-${edition}`;
}

function readDownloadedSet(edition: string) {
  if (typeof window === "undefined") return new Set<number>();
  try {
    const arr = JSON.parse(localStorage.getItem(getCachedSetKey(edition)) || "[]");
    return new Set<number>(Array.isArray(arr) ? arr.map(Number).filter((n) => n >= 1 && n <= 114) : []);
  } catch {
    return new Set<number>();
  }
}

function writeDownloadedSet(edition: string, pages: Set<number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getCachedSetKey(edition), JSON.stringify(Array.from(pages).sort((a, b) => a - b)));
  window.dispatchEvent(new Event("rifq-audio-downloads-change"));
}

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [chapters] = useState<Chapter[]>(STATIC_SURAH_LIST);
  const [chapter, setChapter] = useState(1);
  const [edition, setEdition] = useState("ar.alafasy");
  const [surah, setSurah] = useState<any>(null);
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);
  const [audioCandidates, setAudioCandidates] = useState<string[]>([]);
  const [audioCandidateIndex, setAudioCandidateIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [repeatAyah, setRepeatAyah] = useState(false);
  const [mode, setMode] = useState<"full" | "ayah">("full");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offlineProgress, setOfflineProgress] = useState<number | null>(null);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [offlineJob, setOfflineJob] = useState<"surah" | "full" | "clear" | null>(null);
  const [downloadedSurahs, setDownloadedSurahs] = useState<Set<number>>(() => new Set());

  const selectedChapter = chapters.find((item) => item.number === chapter);
  const ayah = surah?.ayahs?.[index];
  const currentAudioSrc = mode === "full" ? fullAudioUrl : ayah?.audio || null;
  const hasAudio = typeof currentAudioSrc === "string" && currentAudioSrc.length > 0;
  const currentListenLabel = `استمعت إلى ${selectedChapter?.name || surah?.name || "سورة من القرآن"}`;
  const activeReciter = getReciterByEdition(edition).name;
  const selectedTitle = selectedChapter?.name || surah?.name || "السورة";
  const selectedIsDownloaded = downloadedSurahs.has(chapter);
  const downloadedCount = downloadedSurahs.size;

  useEffect(() => {
    const settings = readSettings();
    setEdition(isAvailableReciter(settings.reciter) ? settings.reciter : "ar.alafasy");

    function syncSettings() {
      const next = readSettings();
      setEdition(isAvailableReciter(next.reciter) ? next.reciter : "ar.alafasy");
    }

    window.addEventListener("qawra-settings-change", syncSettings);
    return () => window.removeEventListener("qawra-settings-change", syncSettings);
  }, []);

  useEffect(() => {
    setDownloadedSurahs(readDownloadedSet(edition));
  }, [edition]);

  async function isSurahCached(surahNumber: number) {
    if (typeof window === "undefined" || !("caches" in window)) return false;
    const cache = await caches.open(QURAN_AUDIO_CACHE);
    const candidates = getQuranSurahAudioCandidates(edition, surahNumber);
    for (const url of candidates) {
      if (await cache.match(url)) return true;
    }
    return false;
  }

  async function refreshDownloadedSurahs() {
    if (typeof window === "undefined" || !("caches" in window)) return;
    const next = new Set<number>();
    for (let surahNumber = 1; surahNumber <= 114; surahNumber += 1) {
      if (await isSurahCached(surahNumber)) next.add(surahNumber);
    }
    writeDownloadedSet(edition, next);
    setDownloadedSurahs(next);
  }

  async function load() {
    setError("");
    setPlaying(false);
    setLoading(true);

    const localCandidates = getQuranSurahAudioCandidates(edition, chapter);
    const fallbackFullUrl = localCandidates[0] || quranAudioUrl(edition, chapter) || "";
    setAudioCandidates(localCandidates.length ? localCandidates : fallbackFullUrl ? [fallbackFullUrl] : []);
    setAudioCandidateIndex(0);
    setFullAudioUrl(fallbackFullUrl || null);

    try {
      if (mode === "full") return;

      const ayahEdition = getAyahAudioEdition(edition);
      if (!ayahEdition) throw new Error("آية بآية غير متاحة لهذا القارئ.");

      let ayahJson: any;
      try {
        const ayahRes = await fetch(`/api/quran/audio?chapter=${chapter}&edition=${ayahEdition}`);
        ayahJson = await ayahRes.json();
        if (!ayahRes.ok) throw new Error("تعذر تجهيز آيات السورة.");
      } catch {
        const directRes = await fetch(`https://api.alquran.cloud/v1/surah/${chapter}/${ayahEdition}`);
        ayahJson = await directRes.json();
        if (!directRes.ok) throw new Error("تعذر تجهيز آيات السورة.");
      }

      setSurah(ayahJson.data);
      setIndex(0);
    } catch (err) {
      setFullAudioUrl(fallbackFullUrl || null);
      setAudioCandidates(localCandidates.length ? localCandidates : fallbackFullUrl ? [fallbackFullUrl] : []);
      setAudioCandidateIndex(0);
      setError(err instanceof Error ? err.message : "تعذر تشغيل الصوت.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, edition, mode]);

  useEffect(() => {
    if (!playing) return;

    const timer = window.setInterval(() => {
      recordListenSeconds(5, currentListenLabel);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [currentListenLabel, playing]);

  useEffect(() => {
    refreshDownloadedSurahs().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edition]);

  async function playPause() {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play();
      recordListenStart(currentListenLabel);
      setPlaying(true);
    }
  }

  function next() {
    setIndex((v) => {
      const max = (surah?.ayahs?.length || 1) - 1;
      return v >= max ? 0 : v + 1;
    });
    setPlaying(false);
  }

  function prev() {
    setIndex((v) => Math.max(0, v - 1));
    setPlaying(false);
  }

  function getSurahAudioCandidates(surahNumber: number) {
    const localCandidates = getQuranSurahAudioCandidates(edition, surahNumber);
    const candidates = [...localCandidates, quranAudioUrl(edition, surahNumber)].filter((url): url is string => typeof url === "string" && url.length > 0);
    return Array.from(new Set(candidates));
  }

  async function cacheSurahAudio(surahNumber: number) {
    const cache = await caches.open(QURAN_AUDIO_CACHE);
    const candidates = getSurahAudioCandidates(surahNumber);
    let lastError: unknown = null;

    for (const url of candidates) {
      try {
        const cached = await cache.match(url);
        if (cached) return url;

        let res: Response;
        try {
          res = await fetch(url, { cache: "reload" });
        } catch {
          res = await fetch(url, { cache: "reload", mode: "no-cors" });
        }

        if (!res.ok && res.type !== "opaque") throw new Error("تعذر تحميل السورة.");
        await cache.put(url, res.clone());
        return url;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("تعذر تحميل الصوت.");
  }

  function rememberDownloaded(surahNumber: number) {
    const next = new Set(downloadedSurahs);
    next.add(surahNumber);
    writeDownloadedSet(edition, next);
    setDownloadedSurahs(next);
  }

  async function downloadSelectedSurahOffline() {
    if (typeof window === "undefined" || !("caches" in window)) {
      setOfflineMessage("الحفظ غير مدعوم على هذا الجهاز.");
      return;
    }

    setOfflineJob("surah");
    setOfflineProgress(0);
    setOfflineMessage("جاري تحميل السورة...");

    try {
      await cacheSurahAudio(chapter);
      rememberDownloaded(chapter);
      setOfflineProgress(100);
      setOfflineMessage("تم تحميل السورة.");
    } catch (err) {
      setOfflineMessage(err instanceof Error ? err.message : "تعذر تحميل السورة.");
    } finally {
      setTimeout(() => {
        setOfflineProgress(null);
        setOfflineJob(null);
      }, 1800);
    }
  }

  async function downloadFullReciterOffline() {
    if (typeof window === "undefined" || !("caches" in window)) {
      setOfflineMessage("الحفظ غير مدعوم على هذا الجهاز.");
      return;
    }

    setOfflineJob("full");
    setOfflineProgress(0);
    setOfflineMessage("جاري تحميل المصحف كاملًا...");

    try {
      const next = new Set(downloadedSurahs);
      for (let surahNumber = 1; surahNumber <= 114; surahNumber += 1) {
        await cacheSurahAudio(surahNumber);
        next.add(surahNumber);
        if (surahNumber % 5 === 0 || surahNumber === 114) {
          writeDownloadedSet(edition, next);
          setDownloadedSurahs(new Set(next));
        }
        setOfflineProgress(Math.round((surahNumber / 114) * 100));
      }

      setOfflineMessage("تم تحميل المصحف كاملًا.");
    } catch (err) {
      setOfflineMessage(err instanceof Error ? err.message : "تعذر تحميل المصحف كاملًا.");
    } finally {
      setTimeout(() => {
        setOfflineProgress(null);
        setOfflineJob(null);
      }, 2500);
    }
  }

  async function clearSelectedSurahDownload() {
    if (typeof window === "undefined" || !("caches" in window)) return;
    setOfflineJob("clear");
    setOfflineMessage("جاري حذف السورة...");

    try {
      const cache = await caches.open(QURAN_AUDIO_CACHE);
      await Promise.all(getSurahAudioCandidates(chapter).map((url) => cache.delete(url)));
      const next = new Set(downloadedSurahs);
      next.delete(chapter);
      writeDownloadedSet(edition, next);
      setDownloadedSurahs(next);
      setOfflineMessage("تم حذف السورة من التحميلات.");
    } catch {
      setOfflineMessage("تعذر حذف السورة.");
    } finally {
      setTimeout(() => setOfflineJob(null), 1200);
    }
  }

  const quickSurahs = useMemo(() => chapters.filter((item) => [1, 2, 18, 36, 55, 67, 112, 113, 114].includes(item.number)), [chapters]);

  return (
    <div className="space-y-5">
      <section className="qawra-card relative overflow-hidden p-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#c8a960]/20 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#3f5638]/15 blur-3xl" />
        <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff8e8] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <Headphones size={16} />
              الصوتيات
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.35] text-[#31452c] dark:text-[#f7edda] md:text-5xl">تلاوات القرآن</h1>
            <p className="mt-3 max-w-3xl text-base font-bold leading-8 text-slate-600 dark:text-slate-300">
              اختر القارئ والسورة، واحفظ ما تريد للاستماع لاحقًا.
            </p>
          </div>

          <div className="rounded-[2rem] bg-[#fffaf2]/80 p-4 ring-1 ring-[#d8c094]/35 dark:bg-white/[0.05] dark:ring-white/10">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#315339] text-white">
                <Radio size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-[#987a35] dark:text-[#efdcb6]">القارئ</p>
                <h2 className="truncate text-xl font-black text-[#31452c] dark:text-[#f7edda]">{activeReciter}</h2>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/75 p-3 text-center dark:bg-white/[0.05]">
                <p className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">{toArabicNumber(downloadedCount)}</p>
                <p className="mt-1 text-xs font-black text-slate-500 dark:text-slate-400">سور محمّلة</p>
              </div>
              <div className="rounded-2xl bg-white/75 p-3 text-center dark:bg-white/[0.05]">
                <p className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">{selectedIsDownloaded ? "محفوظة" : "غير محمّلة"}</p>
                <p className="mt-1 text-xs font-black text-slate-500 dark:text-slate-400">السورة الحالية</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="qawra-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">اختيار التلاوة</h2>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">اختر القارئ والسورة ثم اضغط تشغيل.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-[#315339] px-5 py-3 font-black text-white transition hover:-translate-y-0.5">
            <RefreshCw size={17} />
            تجهيز الصوت
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">القارئ</span>
            <select
              value={edition}
              onChange={(e) => {
                setEdition(e.target.value);
                setError("");
              }}
              className="rifq-input"
            >
              <optgroup label="شيوخ قدامى">
                {QURAN_RECITERS.filter((r) => r.group === "classic").map((r) => (
                  <option key={r.edition} value={r.edition}>{r.name}</option>
                ))}
              </optgroup>
              <optgroup label="شيوخ معاصرون">
                {QURAN_RECITERS.filter((r) => r.group === "modern").map((r) => (
                  <option key={r.edition} value={r.edition}>{r.name}</option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">السورة</span>
            <select value={chapter} onChange={(e) => setChapter(Number(e.target.value))} className="rifq-input">
              {chapters.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} — {s.numberOfAyahs} آية
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">طريقة الاستماع</span>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as "full" | "ayah");
                setPlaying(false);
              }}
              className="rifq-input"
            >
              <option value="full">السورة كاملة</option>
              <option value="ayah">آية بآية</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickSurahs.map((item) => (
            <button
              key={item.number}
              type="button"
              onClick={() => setChapter(item.number)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${chapter === item.number ? "bg-[#315339] text-white" : "bg-[#fbf7ef] text-[#315339] ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-[#efdcb6] dark:ring-white/10"}`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-3xl bg-[#fffaf2] p-4 ring-1 ring-[#d8c094]/25 dark:bg-white/[0.05] dark:ring-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#3f5638] text-white">
                {selectedIsDownloaded ? <CheckCircle2 size={19} /> : <WifiOff size={19} />}
              </span>
              <div>
                <h3 className="font-black text-[#31452c] dark:text-[#f7edda]">التحميلات</h3>
                <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                  {selectedIsDownloaded ? "هذه السورة محفوظة على جهازك." : "حمّل السورة للاستماع بدون إنترنت."}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={downloadSelectedSurahOffline}
                disabled={offlineProgress !== null || offlineJob !== null}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-[#315339] ring-1 ring-[#d8c094]/55 disabled:cursor-wait disabled:opacity-70 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10"
              >
                <Download size={17} />
                {offlineJob === "surah" ? "جاري التحميل..." : selectedIsDownloaded ? "تحديث السورة" : "تحميل السورة"}
              </button>
              <button
                onClick={downloadFullReciterOffline}
                disabled={offlineProgress !== null || offlineJob !== null}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#315339] px-5 py-3 font-black text-white disabled:cursor-wait disabled:opacity-70"
              >
                <Download size={17} />
                {offlineJob === "full" ? "جاري التحميل..." : "تحميل المصحف"}
              </button>
              {selectedIsDownloaded && (
                <button
                  onClick={clearSelectedSurahDownload}
                  disabled={offlineJob !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-3 font-black text-red-700 disabled:cursor-wait disabled:opacity-70 dark:bg-red-950/30 dark:text-red-200"
                >
                  <Trash2 size={17} />
                  حذف السورة
                </button>
              )}
            </div>
          </div>
          {offlineProgress !== null && (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-black text-[#315339] dark:text-[#efdcb6]">
                <span>التحميل</span>
                <span>{toArabicNumber(offlineProgress)}٪</span>
              </div>
              <div className="rifq-progress"><span style={{ width: `${offlineProgress}%` }} /></div>
            </div>
          )}
          {offlineMessage && <p className="mt-3 text-sm font-bold leading-7 text-[#315339] dark:text-[#efdcb6]">{offlineMessage}</p>}
        </div>
      </section>

      {error && <div className="rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</div>}

      <article className="qawra-card overflow-hidden p-0">
        <div className="bg-gradient-to-br from-[#315339] to-[#71815c] p-6 text-white md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#efdcb6]">الآن</p>
              <h2 className="mt-1 text-3xl font-black md:text-4xl">{selectedTitle}</h2>
              <p className="mt-2 text-sm font-bold text-white/80">
                {mode === "full"
                  ? "تلاوة كاملة"
                  : `الآية ${toArabicNumber(ayah?.numberInSurah || 0)} من ${toArabicNumber(surah?.numberOfAyahs || selectedChapter?.numberOfAyahs || 0)}`}
              </p>
            </div>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/15">{activeReciter}</span>
          </div>

          <div className="mt-7 flex justify-center">
            <button
              onClick={playPause}
              disabled={!hasAudio || loading}
              className="grid h-24 w-24 place-items-center rounded-full bg-white text-[#315339] shadow-2xl shadow-black/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={playing ? "إيقاف" : "تشغيل"}
            >
              {loading ? <Loader2 className="animate-spin" size={34} /> : playing ? <Pause size={38} fill="currentColor" /> : <Play size={38} fill="currentColor" />}
            </button>
          </div>

          <p className="mt-4 text-center text-sm font-black text-white/85">{playing ? "جاري التشغيل" : loading ? "جاري التجهيز" : "اضغط للتشغيل"}</p>
        </div>

        <div className="p-5 md:p-6">
          {mode === "ayah" ? (
            <div className="rounded-3xl bg-[#fffaf2] p-5 text-center ring-1 ring-[#d8c094]/25 dark:bg-white/[0.05] dark:ring-white/10">
              <p className="quran-text text-3xl font-bold leading-[2.2] text-[#25381f] dark:text-[#f7edda]">
                {ayah?.text || "جاري التجهيز..."}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#fffaf2] p-5 text-center ring-1 ring-[#d8c094]/25 dark:bg-white/[0.05] dark:ring-white/10">
              <Volume2 className="mx-auto text-[#987a35]" size={30} />
              <p className="mt-3 text-sm font-black text-[#987a35] dark:text-[#efdcb6]">السورة المختارة</p>
              <p className="mt-2 text-3xl font-black text-[#31452c] dark:text-[#f7edda]">{selectedTitle}</p>
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">{selectedIsDownloaded ? "متاحة بدون إنترنت." : "تحتاج إنترنت للتشغيل قبل التحميل."}</p>
            </div>
          )}

          {loading && (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              جاري تجهيز الصوت...
            </div>
          )}

          {!loading && hasAudio && (
            <audio
              ref={audioRef}
              key={`${mode}-${currentAudioSrc}`}
              src={currentAudioSrc}
              onEnded={() => {
                if (mode === "full") {
                  setPlaying(false);
                  return;
                }

                if (repeatAyah) {
                  audioRef.current?.play();
                  return;
                }

                setPlaying(false);
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={() => {
                setPlaying(false);
                if (mode === "full" && audioCandidateIndex + 1 < audioCandidates.length) {
                  const nextIndex = audioCandidateIndex + 1;
                  setAudioCandidateIndex(nextIndex);
                  setFullAudioUrl(audioCandidates[nextIndex]);
                  setError("جرّب التشغيل مرة أخرى.");
                  return;
                }

                setError("تعذر تشغيل هذه التلاوة الآن. جرّب قارئًا آخر.");
                if (mode === "full") setFullAudioUrl(null);
              }}
              className="mt-5 w-full"
              controls
            />
          )}

          {!loading && !hasAudio && !error && (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-center font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
              اختر قارئًا آخر أو اضغط تجهيز الصوت.
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {mode === "ayah" && (
              <button onClick={prev} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black dark:bg-slate-800">
                <SkipForward size={17} />
                السابق
              </button>
            )}

            <button
              onClick={playPause}
              disabled={!hasAudio || loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#315339] px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
              {playing ? "إيقاف" : "تشغيل"}
            </button>

            {mode === "ayah" && (
              <>
                <button onClick={next} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black dark:bg-slate-800">
                  التالي
                  <SkipBack size={17} />
                </button>
                <button
                  onClick={() => setRepeatAyah((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-black ${
                    repeatAyah
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <Repeat size={17} />
                  تكرار الآية
                </button>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
