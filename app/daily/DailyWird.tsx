"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Minus, Plus, RefreshCw, Settings2, Sparkles } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";

type Ayah = {
  text?: string;
  numberInSurah?: number;
  number?: number;
};

type DailyPrefs = {
  ayahs: number;
  tafsirs: number;
  hadiths: number;
  azkar: number;
};

type ZekrItem = {
  text: string;
  repeat?: string | number;
};

const DEFAULT_PREFS: DailyPrefs = {
  ayahs: 2,
  tafsirs: 1,
  hadiths: 1,
  azkar: 2
};

function dayIndex(max: number) {
  const d = new Date();
  const key = Number(`${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`);
  return (key % Math.max(1, max)) + 1;
}

function takeWrapped<T>(list: T[], start: number, count: number): T[] {
  if (!Array.isArray(list) || !list.length || count <= 0) return [];
  const result: T[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(list[(start + i) % list.length]);
  }
  return result;
}

function cleanText(value: unknown): string {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join("\n");
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeItem(item: any): ZekrItem {
  if (typeof item === "string") return { text: item };
  return {
    text: cleanText(item?.zekr || item?.text || item?.content || item?.arabic || item?.body || item),
    repeat: item?.repeat || item?.count || item?.times
  };
}

function normalizeAzkarCategories(data: any): { title: string; items: ZekrItem[] }[] {
  if (!data || typeof data !== "object") return [];

  return Object.entries(data)
    .map(([title, value]) => {
      if (Array.isArray(value)) return { title, items: value.map(normalizeItem).filter((item) => item.text) };
      if (value && typeof value === "object") {
        const texts = (value as any).text || (value as any).azkar || (value as any).items || (value as any).content || (value as any).data;
        if (Array.isArray(texts)) {
          return { title, items: texts.map(normalizeItem).filter((item) => item.text) };
        }
      }
      return null;
    })
    .filter(Boolean) as { title: string; items: ZekrItem[] }[];
}

function getHadithText(item: any): string {
  return item?.title || item?.hadeeth_title || item?.hadeeth || item?.text || item?.body || "حديث";
}

function getSavedPrefs(): DailyPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem("rifq-daily-prefs");
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      ayahs: Math.max(0, Math.min(5, Number(parsed.ayahs ?? DEFAULT_PREFS.ayahs))),
      tafsirs: Math.max(0, Math.min(5, Number(parsed.tafsirs ?? DEFAULT_PREFS.tafsirs))),
      hadiths: Math.max(0, Math.min(5, Number(parsed.hadiths ?? DEFAULT_PREFS.hadiths))),
      azkar: Math.max(0, Math.min(5, Number(parsed.azkar ?? DEFAULT_PREFS.azkar)))
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function DailyWird() {
  const [prefs, setPrefs] = useState<DailyPrefs>(DEFAULT_PREFS);
  const [draftPrefs, setDraftPrefs] = useState<DailyPrefs>(DEFAULT_PREFS);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [tafsirs, setTafsirs] = useState<{ ayahNumber: number; text: string }[]>([]);
  const [azkar, setAzkar] = useState<ZekrItem[]>([]);
  const [azkarCategory, setAzkarCategory] = useState("");
  const [hadithList, setHadithList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const chapter = useMemo(() => dayIndex(114), []);

  useEffect(() => {
    const saved = getSavedPrefs();
    setPrefs(saved);
    setDraftPrefs(saved);
  }, []);


  async function load(activePrefs = prefs) {
    setLoading(true);
    setError("");

    try {
      const qs = new URLSearchParams({
        ayahs: String(activePrefs.ayahs),
        tafsirs: String(activePrefs.tafsirs),
        hadiths: String(activePrefs.hadiths),
        azkar: String(activePrefs.azkar)
      });

      const res = await fetch(`/api/daily?${qs.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "تعذر تحميل ورد اليوم");

      setAyahs(json?.data?.ayahs || []);
      setTafsirs(json?.data?.tafsirs || []);
      setHadithList(json?.data?.hadiths || []);
      setAzkarCategory(json?.data?.azkarCategory || "الأذكار");
      setAzkar(json?.data?.azkar || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    load(prefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.ayahs, prefs.tafsirs, prefs.hadiths, prefs.azkar]);

  function savePrefsAndReload() {
    localStorage.setItem("rifq-daily-prefs", JSON.stringify(draftPrefs));
    setPrefs(draftPrefs);
  }

  function updateCount(key: keyof DailyPrefs, delta: number) {
    setDraftPrefs((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(5, prev[key] + delta))
    }));
  }

  function copyAll() {
    const text = [
      ayahs.length ? `آيات اليوم:\n${ayahs.map((item, index) => `${index + 1}) ${item.text}`).join("\n\n")}` : "",
      tafsirs.length ? `\nالتفسير:\n${tafsirs.map((item) => `الآية ${item.ayahNumber}: ${item.text}`).join("\n\n")}` : "",
      hadithList.length ? `\nأحاديث اليوم:\n${hadithList.map((item, index) => `${index + 1}) ${getHadithText(item)}`).join("\n\n")}` : "",
      azkar.length ? `\nأذكار اليوم (${azkarCategory}):\n${azkar.map((item, index) => `${index + 1}) ${item.text}`).join("\n\n")}` : ""
    ].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
  }

  const sectionsVisible = {
    ayahs: prefs.ayahs > 0,
    tafsirs: prefs.tafsirs > 0,
    hadiths: prefs.hadiths > 0,
    azkar: prefs.azkar > 0
  };

  return (
    <div className="space-y-5">
      <div className="qawra-card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <div>
            <span className="rifq-badge mb-3">
              <Sparkles size={15} />
              ورد مرن حسب اختيارك
            </span>
            <h1 className="qawra-title">ورد اليوم</h1>
            <p className="mt-3 leading-8 text-slate-600 dark:text-slate-300">
              اختر عدد الآيات أو التفسير أو الأحاديث أو الأذكار التي تريد ظهورها، وسيتم حفظ تفضيلك تلقائيًا.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rifq-badge">سورة اليوم: {chapter}</span>
              <span className="rifq-badge">عدد الأقسام الظاهرة: {Object.values(sectionsVisible).filter(Boolean).length}</span>
            </div>
          </div>

          <div className="rifq-soft-panel rounded-[1.75rem] p-5 dark:bg-[#09141c]">
            <div className="mb-4 flex items-center gap-2 text-[var(--rifq-ink)] dark:text-[#f7efe2]">
              <Settings2 size={18} />
              <h2 className="text-xl font-black">تخصيص ورد اليوم</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["ayahs", "الآيات"],
                ["tafsirs", "التفسير"],
                ["hadiths", "الأحاديث"],
                ["azkar", "الأذكار"]
              ].map(([key, label]) => {
                const typedKey = key as keyof DailyPrefs;
                return (
                  <div key={key} className="rounded-2xl border border-[#d9c4a0]/30 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-sm font-black text-slate-500 dark:text-slate-400">{label}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button onClick={() => updateCount(typedKey, -1)} className="rifq-btn-secondary px-3 py-2">
                        <Minus size={16} />
                      </button>
                      <span className="text-2xl font-black text-[var(--rifq-ink)] dark:text-[#f7efe2]">{draftPrefs[typedKey]}</span>
                      <button onClick={() => updateCount(typedKey, 1)} className="rifq-btn-secondary px-3 py-2">
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">0 يعني إخفاء القسم</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={savePrefsAndReload} className="rifq-btn-primary">
                تطبيق الاختيارات
              </button>
              <button onClick={() => load(prefs)} className="rifq-btn-secondary inline-flex items-center gap-2">
                <RefreshCw size={17} />
                تحديث
              </button>
              <button onClick={copyAll} className="rifq-btn-secondary inline-flex items-center gap-2">
                <Copy size={17} />
                نسخ الورد
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="qawra-card text-slate-500 dark:text-slate-400">جاري تحميل ورد اليوم...</div>}
      {error && <div className="rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-2">
          {sectionsVisible.ayahs && (
            <article className="qawra-card space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-black">آيات اليوم</h2>
                <span className="rifq-badge">{ayahs.length} آية</span>
              </div>
              <div className="space-y-3">
                {ayahs.map((ayah, index) => (
                  <div key={`${ayah.numberInSurah || index}-${ayah.text}`} className="rounded-[1.5rem] border border-[#d9c4a0]/30 bg-[#fffaf2] p-5 dark:border-white/10 dark:bg-[#09141c]">
                    <p className="mb-2 text-sm font-black text-[#4f777b] dark:text-[#e9d6b4]">الآية {ayah.numberInSurah || index + 1}</p>
                    <p className="quran-text text-3xl font-bold leading-[2.2]">{ayah.text}</p>
                    {ayah.text && (
                      <div className="mt-4">
                        <FavoriteButton item={{ id: `daily-ayah-${chapter}-${ayah.numberInSurah || index + 1}`, type: "quran", title: `آية من سورة ${chapter}`, text: ayah.text }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          )}

          {sectionsVisible.tafsirs && (
            <article className="qawra-card space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-black">التفسير المختصر</h2>
                <span className="rifq-badge">{tafsirs.length} تفسير</span>
              </div>
              <div className="space-y-3">
                {tafsirs.map((item) => (
                  <div key={item.ayahNumber} className="rounded-[1.5rem] border border-[#d9c4a0]/30 bg-[#fffaf2] p-5 leading-8 dark:border-white/10 dark:bg-[#09141c]">
                    <p className="mb-2 text-sm font-black text-[#4f777b] dark:text-[#e9d6b4]">تفسير الآية {item.ayahNumber}</p>
                    <p className="text-lg font-bold leading-9">{item.text || "لم يتم تحميل التفسير."}</p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {sectionsVisible.hadiths && (
            <article className="qawra-card space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-black">أحاديث اليوم</h2>
                <span className="rifq-badge">{hadithList.length} حديث</span>
              </div>
              <div className="space-y-3">
                {hadithList.map((item, index) => (
                  <div key={item?.id || index} className="rounded-[1.5rem] border border-[#d9c4a0]/30 bg-[#fffaf2] p-5 dark:border-white/10 dark:bg-[#09141c]">
                    <p className="mb-2 text-sm font-black text-[#4f777b] dark:text-[#e9d6b4]">حديث {index + 1}</p>
                    <p className="text-lg font-bold leading-9">{getHadithText(item)}</p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {sectionsVisible.azkar && (
            <article className="qawra-card space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-black">أذكار اليوم</h2>
                <span className="rifq-badge">{azkarCategory || "الأذكار"}</span>
              </div>
              <div className="space-y-3">
                {azkar.map((item, index) => (
                  <div key={`${item.text}-${index}`} className="rounded-[1.5rem] border border-[#d9c4a0]/30 bg-[#fffaf2] p-5 dark:border-white/10 dark:bg-[#09141c]">
                    <p className="mb-2 text-sm font-black text-[#4f777b] dark:text-[#e9d6b4]">ذكر {index + 1}</p>
                    <p className="text-lg font-bold leading-9 whitespace-pre-line">{item.text}</p>
                    {item.repeat && <span className="mt-3 inline-flex rounded-full bg-[#f3ebe0] px-3 py-1.5 text-sm font-black text-[#274b57] dark:bg-white/10 dark:text-[#f7efe2]">التكرار المقترح: {item.repeat}</span>}
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
