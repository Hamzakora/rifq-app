"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Grid2X2, Heart, Plus, RefreshCw, RotateCcw, Search, Sparkles } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareCardButton } from "@/components/ShareCardButton";
import { recordActivityAction } from "@/lib/client/activityStore";
import { STATIC_AZKAR } from "@/lib/static/staticAzkar";

type NormalizedZekr = {
  text: string;
  footnote?: string;
  repeat?: string | number;
};

type NormalizedCategory = {
  title: string;
  items: NormalizedZekr[];
};

function cleanText(value: unknown): string {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join("\n");
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeItem(item: any, fallbackFootnote?: unknown): NormalizedZekr {
  if (typeof item === "string") {
    return { text: item, footnote: cleanText(fallbackFootnote) || undefined };
  }

  return {
    text: cleanText(item?.zekr || item?.text || item?.content || item?.arabic || item?.body || item),
    footnote: cleanText(item?.footnote || item?.bless || item?.description || fallbackFootnote) || undefined,
    repeat: item?.repeat || item?.count || item?.times
  };
}

function normalizeObjectCategory(title: string, value: any): NormalizedCategory | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return {
      title,
      items: value.map((item) => normalizeItem(item)).filter((item) => item.text)
    };
  }

  if (typeof value === "object") {
    const texts = value.text || value.azkar || value.items || value.content || value.data;
    const footnotes = value.footnote || value.footnotes || value.notes;

    if (Array.isArray(texts)) {
      return {
        title,
        items: texts
          .map((textItem: any, index: number) =>
            normalizeItem(textItem, Array.isArray(footnotes) ? footnotes[index] : footnotes)
          )
          .filter((item: NormalizedZekr) => item.text)
      };
    }

    const directText = value.zekr || value.text || value.content || value.arabic;
    if (directText) {
      return {
        title,
        items: [normalizeItem(value)]
      };
    }
  }

  return null;
}

function normalizeCategories(data: any): NormalizedCategory[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return [
      {
        title: "الأذكار",
        items: data.map((item) => normalizeItem(item)).filter((item) => item.text)
      }
    ];
  }

  if (Array.isArray(data.content)) {
    return [
      {
        title: data.title || "الأذكار",
        items: data.content.map((item: any) => normalizeItem(item)).filter((item: NormalizedZekr) => item.text)
      }
    ];
  }

  if (typeof data === "object") {
    const categories = Object.entries(data)
      .map(([title, value]) => normalizeObjectCategory(title, value))
      .filter(Boolean) as NormalizedCategory[];

    return categories.sort((a, b) => {
      const preferred = ["أذكار الصباح", "أذكار المساء", "أذكار بعد الصلاة", "تسابيح", "أذكار النوم"];
      const ai = preferred.indexOf(a.title);
      const bi = preferred.indexOf(b.title);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);

      const aIntro = /مقدمة|المقدمة/i.test(a.title);
      const bIntro = /مقدمة|المقدمة/i.test(b.title);
      if (aIntro && !bIntro) return 1;
      if (!aIntro && bIntro) return -1;
      return 0;
    });
  }

  return [];
}

function categoryDescription(title: string, count: number) {
  if (title.includes("الصباح")) return "بداية يوم هادئة وذكر متدرج.";
  if (title.includes("المساء")) return "ختام اليوم بسكينة وطمأنينة.";
  if (title.includes("النوم")) return "أذكار ما قبل النوم بترتيب مريح.";
  if (title.includes("الصلاة")) return "ورد مختصر بعد الصلاة.";
  if (title.includes("الدعاء") || title.includes("أدعية")) return "أدعية مختارة للقراءة والحفظ.";
  return `${count} ذكر في هذا القسم.`;
}

function toArabicNumber(value: number | string | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

export function AzkarViewer() {
  const [result] = useState<any>({
    data: STATIC_AZKAR,
    meta: { sourceName: "حصن المسلم / ملف أذكار محلي مُراجع" }
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const todayKey = `rifq-azkar-counts-${new Date().toISOString().slice(0, 10)}`;
    try {
      setCounts(JSON.parse(localStorage.getItem(todayKey) || "{}"));
    } catch {
      setCounts({});
    }
  }, []);

  useEffect(() => {
    const todayKey = `rifq-azkar-counts-${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(todayKey, JSON.stringify(counts));
  }, [counts]);

  const categories = useMemo(() => normalizeCategories(result?.data), [result]);
  const current = selected !== null ? categories[selected] : null;

  useEffect(() => {
    if (selected !== null && selected >= categories.length) setSelected(null);
  }, [categories.length, selected]);

  const filteredItems = useMemo(() => {
    if (!current) return [];
    if (!query.trim()) return current.items;
    return current.items.filter((item) => item.text.includes(query.trim()) || item.footnote?.includes(query.trim()));
  }, [current, query]);

  const totalAzkar = useMemo(() => categories.reduce((sum, cat) => sum + cat.items.length, 0), [categories]);

  const completedCurrent = useMemo(() => {
    if (!current || selected === null) return 0;
    return current.items.reduce((sum, item, idx) => {
      const value = counts[`${selected}-${idx}`] || 0;
      const target = Number(item.repeat || 0);
      return sum + (target > 0 && value >= target ? 1 : 0);
    }, 0);
  }, [counts, current, selected]);

  const totalCompleted = useMemo(() => {
    return categories.reduce((sum, cat, catIndex) => {
      return sum + cat.items.reduce((innerSum, item, itemIndex) => {
        const value = counts[`${catIndex}-${itemIndex}`] || 0;
        const target = Number(item.repeat || 0);
        return innerSum + (target > 0 && value >= target ? 1 : 0);
      }, 0);
    }, 0);
  }, [categories, counts]);

  function increase(idx: number, target?: number) {
    if (selected === null) return;
    const key = `${selected}-${idx}`;
    const currentValue = counts[key] || 0;
    const nextValue = target ? Math.min(currentValue + 1, target) : currentValue + 1;

    recordActivityAction(
      "azkar",
      target && nextValue >= target ? `أكملت ذكرًا من ${current?.title || "الأذكار"}` : `رددت ذكرًا من ${current?.title || "الأذكار"}`
    );

    setCounts((prev) => ({ ...prev, [key]: nextValue }));
  }

  function reset(idx: number) {
    if (selected === null) return;
    const key = `${selected}-${idx}`;
    setCounts((prev) => ({ ...prev, [key]: 0 }));
  }

  function resetCurrentCategory() {
    if (!current || selected === null) return;
    const next = { ...counts };
    current.items.forEach((_, idx) => delete next[`${selected}-${idx}`]);
    setCounts(next);
  }

  return (
    <div className="space-y-5">
      <section className="qawra-card relative overflow-hidden p-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#c8a960]/20 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#3f5638]/15 blur-3xl" />
        <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff8e8] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <Heart size={16} />
              وِرد اليوم
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.35] text-[#31452c] dark:text-[#f7edda] md:text-5xl">الأذكار</h1>
            <p className="mt-3 max-w-3xl text-base font-bold leading-8 text-slate-600 dark:text-slate-300">
              اختر القسم المناسب وردّد الذكر بعداده الخاص.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-3xl bg-white/75 p-4 text-center ring-1 ring-[#d8c094]/25 dark:bg-white/[0.05] dark:ring-white/10">
              <p className="text-3xl font-black text-[#31452c] dark:text-[#f7edda]">{toArabicNumber(categories.length)}</p>
              <p className="mt-1 text-xs font-black text-slate-500 dark:text-slate-400">الأقسام</p>
            </div>
            <div className="rounded-3xl bg-white/75 p-4 text-center ring-1 ring-[#d8c094]/25 dark:bg-white/[0.05] dark:ring-white/10">
              <p className="text-3xl font-black text-[#31452c] dark:text-[#f7edda]">{toArabicNumber(totalAzkar)}</p>
              <p className="mt-1 text-xs font-black text-slate-500 dark:text-slate-400">الأذكار</p>
            </div>
            <div className="rounded-3xl bg-white/75 p-4 text-center ring-1 ring-[#d8c094]/25 dark:bg-white/[0.05] dark:ring-white/10">
              <p className="text-3xl font-black text-[#31452c] dark:text-[#f7edda]">{toArabicNumber(totalCompleted)}</p>
              <p className="mt-1 text-xs font-black text-slate-500 dark:text-slate-400">مكتمل اليوم</p>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</div>}
      {!error && !result && <div className="qawra-card text-slate-500 dark:text-slate-400">جاري تحميل الأذكار...</div>}

      {result && categories.length === 0 && (
        <div className="rounded-3xl bg-amber-50 p-5 font-bold leading-8 text-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          تعذر عرض الأذكار الآن.
        </div>
      )}

      {categories.length > 0 && selected === null && (
        <section className="qawra-card">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rifq-badge mb-3">
                <Grid2X2 size={15} />
                أقسام الأذكار
              </span>
              <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">اختر القسم</h2>
              <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                كل قسم يفتح في صفحة هادئة مع عداد وتقدم يومي.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fff8e8] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <Sparkles size={15} />
              {toArabicNumber(categories.length)} قسم
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat, idx) => {
              const done = cat.items.reduce((sum, item, innerIdx) => {
                const value = counts[`${idx}-${innerIdx}`] || 0;
                const target = Number(item.repeat || 0);
                return sum + (target > 0 && value >= target ? 1 : 0);
              }, 0);
              const progress = cat.items.length ? Math.round((done / cat.items.length) * 100) : 0;

              return (
                <button
                  key={`${cat.title}-${idx}`}
                  onClick={() => {
                    setSelected(idx);
                    setQuery("");
                  }}
                  className="group relative overflow-hidden rounded-[1.55rem] bg-gradient-to-br from-[#315339] to-[#71815c] p-5 text-right text-white shadow-lg shadow-[#315339]/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ animation: "qawra-soft-rise .45s ease-out both", animationDelay: `${idx * 35}ms` }}
                >
                  <span className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-[#dfc688]/20 blur-2xl transition group-hover:scale-125" />
                  <span className="relative flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-2xl font-black leading-9">{cat.title}</span>
                      <span className="mt-2 block text-sm font-bold leading-7 text-white/85">
                        {categoryDescription(cat.title, cat.items.length)}
                      </span>
                    </span>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
                      <Heart size={19} />
                    </span>
                  </span>
                  <span className="relative mt-4 block rounded-2xl bg-white/14 p-3">
                    <span className="mb-2 flex items-center justify-between text-xs font-black text-white/85">
                      <span>{toArabicNumber(cat.items.length)} ذكر</span>
                      <span>{toArabicNumber(progress)}٪</span>
                    </span>
                    <span className="block h-2 overflow-hidden rounded-full bg-white/20">
                      <span className="block h-full rounded-full bg-[#efdcb6]" style={{ width: `${progress}%` }} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {categories.length > 0 && current && selected !== null && (
        <section className="space-y-4">
          <div className="qawra-card sticky top-20 z-20 backdrop-blur-md dark:bg-[#0b1711]/95">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <button
                  onClick={() => {
                    setSelected(null);
                    setQuery("");
                  }}
                  className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-[#f3ebe0] px-4 py-2 text-sm font-black text-[#274b57] transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-[#f7efe2]"
                >
                  <ArrowRight size={16} />
                  الرجوع للأقسام
                </button>
                <h2 className="text-3xl font-black text-[#31452c] dark:text-[#f7edda]">{current.title}</h2>
                <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                  {toArabicNumber(current.items.length)} ذكر · مكتمل {toArabicNumber(completedCurrent)}
                </p>
              </div>
              <button onClick={resetCurrentCategory} className="rifq-btn-secondary inline-flex items-center gap-2 px-4 py-2">
                <RefreshCw size={16} />
                إعادة القسم
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px] lg:items-center">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث داخل هذا القسم" className="rifq-input pr-11" />
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 dark:bg-white/[0.05]">
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span>إنجاز القسم</span>
                  <span>{toArabicNumber(current.items.length ? Math.round((completedCurrent / current.items.length) * 100) : 0)}٪</span>
                </div>
                <div className="rifq-progress">
                  <span style={{ width: `${current.items.length ? Math.round((completedCurrent / current.items.length) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {filteredItems.map((item, idx) => {
            const foundIndex = current.items.findIndex(
              (currentItem) => currentItem.text === item.text && currentItem.footnote === item.footnote
            );
            const originalIndex = foundIndex === -1 ? idx : foundIndex;
            const value = counts[`${selected}-${originalIndex}`] || 0;
            const target = Number(item.repeat || 0);
            const remaining = target ? Math.max(0, target - value) : null;
            const done = target ? remaining === 0 : false;
            const progress = target ? Math.round((value / target) * 100) : 0;

            return (
              <article key={`${item.text}-${idx}`} className="qawra-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8c094]/25 pb-4 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.repeat && (
                      <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-black ${
                        done
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
                          : "bg-[#f3ebe0] text-[#274b57] dark:bg-white/10 dark:text-[#f7efe2]"
                      }`}>
                        {done ? "تم الذكر" : `المتبقي: ${toArabicNumber(remaining)}`}
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      عدادك: {toArabicNumber(value)}
                    </span>
                  </div>
                  {done && (
                    <span className="inline-flex items-center gap-1 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                      <CheckCircle2 size={15} />
                      مكتمل
                    </span>
                  )}
                </div>

                <p className="quran-text mt-5 whitespace-pre-line text-[1.55rem] font-bold leading-[2.15] text-[#25381f] dark:text-[#f7edda] md:text-3xl">
                  {item.text}
                </p>

                {item.repeat && (
                  <div className="mt-5 rounded-2xl bg-[#fffaf2] p-4 dark:bg-white/[0.05]">
                    <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                      <span>نسبة الإنجاز</span>
                      <span>{toArabicNumber(Math.min(progress, 100))}٪</span>
                    </div>
                    <div className="rifq-progress"><span style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                  </div>
                )}

                {item.footnote && (
                  <div className="mt-4 whitespace-pre-line rounded-[1.4rem] border border-[#d9c4a0]/25 bg-[#fffaf2] p-4 text-sm font-bold leading-7 text-slate-600 dark:border-white/10 dark:bg-[#09141c] dark:text-slate-300">
                    {item.footnote}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button onClick={() => increase(originalIndex, target || undefined)} className="rifq-btn-primary inline-flex items-center gap-2 px-4 py-2">
                    <Plus size={16} />
                    تكرار
                  </button>
                  <button onClick={() => reset(originalIndex)} className="rifq-btn-secondary inline-flex items-center gap-2 px-4 py-2">
                    <RotateCcw size={16} />
                    إعادة
                  </button>
                  <FavoriteButton
                    item={{
                      id: `azkar-${current.title}-${originalIndex}`,
                      type: "azkar",
                      title: current.title,
                      text: item.text,
                      source: "رِفْق"
                    }}
                  />
                  <ShareCardButton title={current.title} text={item.text} subtitle="من الأذكار" source="رِفْق" />
                </div>
              </article>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="qawra-card text-slate-500 dark:text-slate-400">لا توجد نتائج مطابقة لهذا البحث داخل القسم الحالي.</div>
          )}
        </section>
      )}
    </div>
  );
}
