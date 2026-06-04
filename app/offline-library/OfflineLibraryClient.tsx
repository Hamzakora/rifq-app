"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Download, Headphones, RefreshCw, ScrollText, Sparkles, Trash2, WifiOff } from "lucide-react";
import { readSettings } from "@/components/settingsStore";
import { QURAN_RECITERS } from "@/lib/quran/reciters";
import {
  cacheAzkarLibrary,
  cacheEssentialOfflineLibrary,
  cacheHadithLibrary,
  cacheReciterLibrary,
  cacheTafsirLibrary,
  clearOfflineLibraryCaches,
  getOfflineCacheStats,
  TAFSIR_AYAH_TOTAL,
  type OfflineCacheStats,
  type OfflineJobKey
} from "@/lib/client/offlineLibrary";

const emptyStats: OfflineCacheStats = {
  supported: true,
  quranText: 0,
  mushafImages: 0,
  audio: 0,
  core: 0,
  tafsir: 0,
  hadith: 0,
  total: 0
};

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function ProgressLine({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="rifq-progress"><span style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function LibraryCard({
  icon: Icon,
  title,
  description,
  status,
  disabled,
  running,
  actionLabel,
  onClick
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  status: string;
  disabled?: boolean;
  running?: boolean;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <article className="rounded-[1.8rem] border border-[#d8c094]/35 bg-white/82 p-5 shadow-sm ring-1 ring-white/60 dark:border-white/10 dark:bg-slate-950/45 dark:ring-white/5">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
          <Icon size={21} />
        </span>
        <div className="min-w-0">
          <h3 className="text-xl font-black text-[#31452c] dark:text-[#f7edda]">{title}</h3>
          <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-[#fbf7ef] p-3 text-sm font-black text-[#7b6431] dark:bg-white/5 dark:text-[#efdcb6]">
        {status}
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || running}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3f5638] px-4 py-3 font-black text-white shadow-lg shadow-[#3f5638]/15 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
      >
        {running ? <RefreshCw size={17} className="animate-spin" /> : <Download size={17} />}
        {running ? "جاري التحميل..." : actionLabel}
      </button>
    </article>
  );
}

export function OfflineLibraryClient() {
  const [stats, setStats] = useState<OfflineCacheStats>(emptyStats);
  const [activeJob, setActiveJob] = useState<OfflineJobKey | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobMessage, setJobMessage] = useState("جاهز للاستخدام.");
  const [reciter, setReciter] = useState("ar.alafasy");
  const [error, setError] = useState("");

  const selectedReciter = useMemo(() => QURAN_RECITERS.find((item) => item.edition === reciter) || QURAN_RECITERS[0], [reciter]);
  const audioProgress = percent(stats.audio, 114);
  const azkarProgress = stats.core > 0 ? 100 : 0;
  const tafsirProgress = percent(stats.tafsir, TAFSIR_AYAH_TOTAL);
  const hadithProgress = stats.hadith > 0 ? 100 : 0;

  async function refreshStats() {
    const next = await getOfflineCacheStats();
    setStats(next);
  }

  useEffect(() => {
    const settings = readSettings();
    if (QURAN_RECITERS.some((item) => item.edition === settings.reciter)) setReciter(settings.reciter);
    refreshStats().catch(() => undefined);
  }, []);

  async function runJob(job: OfflineJobKey, runner: (onProgress: (done: number, total: number, message: string) => void) => Promise<void>) {
    setError("");
    setActiveJob(job);
    setJobProgress(0);

    try {
      await runner((done, total, message) => {
        setJobMessage(message);
        setJobProgress(percent(done, total));
      });
      setJobProgress(100);
      setJobMessage("تم التحميل.");
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تنفيذ الطلب.");
    } finally {
      setTimeout(() => setActiveJob(null), 700);
    }
  }

  async function clearAll() {
    setError("");
    setActiveJob("clear");
    setJobMessage("جاري الحذف...");
    setJobProgress(15);
    try {
      await clearOfflineLibraryCaches();
      setJobProgress(100);
      setJobMessage("تم الحذف.");
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حذف الملفات.");
    } finally {
      setTimeout(() => setActiveJob(null), 700);
    }
  }

  return (
    <div className="space-y-5">
      <section className="qawra-card overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff8e8] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <WifiOff size={16} />
              بدون إنترنت
            </span>
            <h1 className="mt-4 text-3xl font-black text-[#31452c] dark:text-[#f7edda] md:text-4xl">المحتوى بدون إنترنت</h1>
            <p className="mt-3 max-w-3xl text-base font-bold leading-8 text-slate-600 dark:text-slate-300">
              المصحف والتفسير والأذكار والأحاديث جاهزة بدون إنترنت. الصوتيات اختيارية.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={refreshStats}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/85 px-5 py-3 font-black text-[#3f5638] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10"
            >
              <RefreshCw size={17} />
              تحديث
            </button>
            <button
              type="button"
              onClick={() => runJob("allCore", cacheEssentialOfflineLibrary)}
              disabled={Boolean(activeJob)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3f5638] px-5 py-3 font-black text-white shadow-lg shadow-[#3f5638]/15 disabled:cursor-wait disabled:opacity-60"
            >
              {activeJob === "allCore" ? <RefreshCw size={17} className="animate-spin" /> : <Download size={17} />}
              تحميل الكل
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {["المصحف", "التفسير", "الأذكار", "الأحاديث"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-2xl bg-[#fbf7ef] px-4 py-3 font-black text-[#315339] dark:bg-white/5 dark:text-[#f7edda]">
              <CheckCircle2 size={18} />
              {item}
            </div>
          ))}
        </div>
      </section>

      {!stats.supported && (
        <div className="rounded-3xl bg-amber-50 p-5 font-bold leading-8 text-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          التحميل غير مدعوم في هذا المتصفح.
        </div>
      )}

      {error && (
        <div className="rounded-3xl bg-red-50 p-5 font-bold leading-8 text-red-700 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="qawra-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">المحتوى</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{jobMessage}</p>
          </div>
          <span className="rounded-full bg-[#fff8e8] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/50 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
            جاهز للاستخدام
          </span>
        </div>
        {activeJob && (
          <div className="mt-4">
            <ProgressLine label="التقدم" value={jobProgress} />
          </div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <LibraryCard
          icon={BookOpen}
          title="التفسير"
          description="متاح للقراءة دون اتصال."
          status={stats.tafsir > 0 ? "محفوظ" : "متاح"}
          running={activeJob === "tafsir"}
          disabled={Boolean(activeJob)}
          actionLabel="تحميل التفسير"
          onClick={() => runJob("tafsir", cacheTafsirLibrary)}
        />

        <LibraryCard
          icon={ScrollText}
          title="الأحاديث"
          description="القائمة والتفاصيل جاهزة بدون إنترنت."
          status={stats.hadith > 0 ? "محفوظ" : "متاح"}
          running={activeJob === "hadith"}
          disabled={Boolean(activeJob)}
          actionLabel="تحميل الأحاديث"
          onClick={() => runJob("hadith", cacheHadithLibrary)}
        />

        <LibraryCard
          icon={Sparkles}
          title="الأذكار"
          description="متاحة بدون إنترنت."
          status={stats.core > 0 ? "محفوظ" : "متاح"}
          running={activeJob === "azkar"}
          disabled={Boolean(activeJob)}
          actionLabel="تحميل الأذكار"
          onClick={() => runJob("azkar", cacheAzkarLibrary)}
        />

        <article className="rounded-[1.8rem] border border-[#d8c094]/35 bg-white/82 p-5 shadow-sm ring-1 ring-white/60 dark:border-white/10 dark:bg-slate-950/45 dark:ring-white/5">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <Headphones size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black text-[#31452c] dark:text-[#f7edda]">الصوتيات</h3>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
                اختر القارئ وحمّل ما تريد.
              </p>
            </div>
          </div>
          <select
            value={reciter}
            onChange={(e) => setReciter(e.target.value)}
            className="mt-4 w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold outline-none dark:border-white/10 dark:bg-white/5"
          >
            <optgroup label="شيوخ قدامى">
              {QURAN_RECITERS.filter((item) => item.group === "classic").map((item) => <option key={item.edition} value={item.edition}>{item.name}</option>)}
            </optgroup>
            <optgroup label="شيوخ معاصرون">
              {QURAN_RECITERS.filter((item) => item.group === "modern").map((item) => <option key={item.edition} value={item.edition}>{item.name}</option>)}
            </optgroup>
          </select>
          <div className="mt-4 rounded-2xl bg-[#fbf7ef] p-3 text-sm font-black text-[#7b6431] dark:bg-white/5 dark:text-[#efdcb6]">
            {selectedReciter.name}
          </div>
          {audioProgress > 0 && <ProgressLine label="الصوتيات" value={audioProgress} />}
          <button
            type="button"
            onClick={() => runJob("reciter", (onProgress) => cacheReciterLibrary(reciter, onProgress))}
            disabled={Boolean(activeJob)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3f5638] px-4 py-3 font-black text-white shadow-lg shadow-[#3f5638]/15 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            {activeJob === "reciter" ? <RefreshCw size={17} className="animate-spin" /> : <Download size={17} />}
            {activeJob === "reciter" ? "جاري التحميل..." : "تحميل الصوتيات"}
          </button>
        </article>
      </section>

      <section className="qawra-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">التخزين</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ProgressLine label="التفسير" value={tafsirProgress} />
            <ProgressLine label="الأحاديث" value={hadithProgress} />
            <ProgressLine label="الأذكار" value={azkarProgress} />
          </div>
        </div>
        <button
          type="button"
          onClick={clearAll}
          disabled={Boolean(activeJob)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-900/15 disabled:cursor-wait disabled:opacity-60"
        >
          <Trash2 size={17} />
          حذف التحميلات
        </button>
      </section>
    </div>
  );
}
