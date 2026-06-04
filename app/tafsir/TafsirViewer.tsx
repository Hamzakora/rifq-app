"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ListTree, Search } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { cachedJsonFetch, TAFSIR_CACHE } from "@/lib/client/offlineCache";
import { STATIC_SURAH_LIST } from "@/lib/static/quranSurahList";
import { TAFSIR_SOURCES, getTafsirSource } from "@/lib/tafsir/tafsirSources";
import {
  getOfflineTafsirAyahPayload,
  getOfflineTafsirSurahPayload,
  offlineTafsirMissingMessage
} from "@/lib/client/offlineTafsir";

type Chapter = {
  number: number;
  name: string;
  numberOfAyahs: number;
  revelationType: string;
};

type TafsirMode = "surah" | "ayah";

type TafsirItem = {
  aya: number;
  ayahText: string;
  tafsirText: string;
  footnotes: string;
  raw: any;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function pickString(...values: any[]) {
  const found = values.find((value) => typeof value === "string" && value.trim());
  return found ? stripHtml(found) : "";
}

function getVerseNumber(item: any, fallback: number) {
  const verseKey = typeof item?.verse_key === "string" ? item.verse_key.split(":")[1] : null;
  const aya = Number(
    item?.aya ||
      item?.aya_number ||
      item?.ayaNumber ||
      item?.ayah ||
      item?.verse_number ||
      item?.number_in_surah ||
      item?.numberInSurah ||
      item?.id ||
      verseKey ||
      fallback
  );

  return Number.isFinite(aya) && aya > 0 ? aya : fallback;
}

function getTafsirText(item: any) {
  const tafsir = Array.isArray(item?.tafsirs) ? item.tafsirs[0] : item?.tafsir;
  return pickString(
    item?.translation,
    item?.text,
    item?.tafsir,
    item?.meaning,
    item?.description,
    tafsir?.text,
    tafsir?.body,
    tafsir?.content
  );
}

function normalizeTafsirItems(payload: any): TafsirItem[] {
  const raw = payload?.data?.result ?? payload?.data?.translations ?? payload?.data?.ayahs ?? payload?.data?.verses ?? payload?.verses ?? payload?.verse ?? payload?.data;
  const list = Array.isArray(raw) ? raw : raw?.result || raw?.translations || raw?.ayahs || raw?.verses || [raw];

  return list
    .filter(Boolean)
    .map((item: any, index: number) => ({
      aya: getVerseNumber(item, index + 1),
      ayahText: pickString(item?.arabic_text, item?.aya_text, item?.quran_text, item?.text_uthmani, item?.text_uthmani_simple, item?.source_text),
      tafsirText: getTafsirText(item),
      footnotes: pickString(item?.footnotes, item?.footnote),
      raw: item
    }))
    .filter((item: TafsirItem) => item.tafsirText || item.ayahText);
}

function toArabicNumber(value: number | string | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

export function TafsirViewer() {
  const [chapters, setChapters] = useState<Chapter[]>(STATIC_SURAH_LIST);
  const [sura, setSura] = useState(1);
  const [aya, setAya] = useState(1);
  const [mode, setMode] = useState<TafsirMode>("surah");
  const [result, setResult] = useState<any>(null);
  const [sourceId, setSourceId] = useState("muyassar");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => chapters.find((item) => item.number === sura),
    [chapters, sura]
  );

  const ayahOptions = useMemo(() => {
    const count = selected?.numberOfAyahs || 1;
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [selected?.numberOfAyahs]);

  useEffect(() => {
    setChapters(STATIC_SURAH_LIST);
  }, []);

  useEffect(() => {
    setResult(null);
    setError("");
    if (selected && aya > selected.numberOfAyahs) setAya(1);
  }, [sura, mode, selected, aya]);


  async function loadOnlineTafsir() {
    const source = getTafsirSource(sourceId);
    if (!source.slug) throw new Error("اختر تفسيرًا صحيحًا.");

    const endpoint =
      mode === "surah"
        ? `https://api.islamic.app/v1/verses/by_chapter/${sura}?tafsirs=${source.slug}`
        : `https://api.islamic.app/v1/verses/by_key/${sura}:${aya}?tafsirs=${source.slug}`;

    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) throw new Error("يحتاج هذا التفسير إلى اتصال بالإنترنت.");
    const json = await res.json();

    return {
      data: json,
      meta: {
        sourceName: source.sourceName,
        sourceUrl: endpoint,
        fetchedAt: new Date().toISOString()
      }
    };
  }

  async function loadTafsir() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const source = getTafsirSource(sourceId);

      if (source.onlineOnly) {
        setResult(await loadOnlineTafsir());
        return;
      }

      const localJson =
        mode === "surah"
          ? await getOfflineTafsirSurahPayload(sura)
          : await getOfflineTafsirAyahPayload(sura, aya);

      if (localJson) {
        setResult(localJson);
        return;
      }

      const url =
        mode === "surah"
          ? `/api/tafsir?sura=${sura}&scope=surah`
          : `/api/tafsir?sura=${sura}&aya=${aya}&scope=ayah`;
      const json = await cachedJsonFetch(url, TAFSIR_CACHE);
      setResult(json);
    } catch (err) {
      const fallbackMessage = err instanceof Error ? err.message : offlineTafsirMissingMessage();
      setError(fallbackMessage);
    } finally {
      setLoading(false);
    }
  }

  const selectedSource = getTafsirSource(sourceId);
  const tafsirItems = result ? normalizeTafsirItems(result).sort((a, b) => a.aya - b.aya) : [];
  const fullTafsirText = tafsirItems
    .map((item) => `الآية ${item.aya}: ${item.tafsirText}`)
    .join("\n\n");

  const favoriteTitle =
    mode === "surah"
      ? `تفسير سورة ${selected?.name || sura}`
      : `تفسير سورة ${selected?.name || sura} — آية ${aya}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
      <aside className="qawra-card h-fit">
        <h2 className="mb-4 text-2xl font-black">التفسير</h2>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-2 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setMode("surah")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black ${mode === "surah" ? "bg-emerald-700 text-white" : "text-slate-700 dark:text-slate-200"}`}
          >
            <ListTree size={17} />
            سورة كاملة
          </button>
          <button
            type="button"
            onClick={() => setMode("ayah")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black ${mode === "ayah" ? "bg-emerald-700 text-white" : "text-slate-700 dark:text-slate-200"}`}
          >
            <BookOpen size={17} />
            آية معينة
          </button>
        </div>

        <label className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">اختر التفسير</label>
        <select
          value={sourceId}
          onChange={(e) => {
            setSourceId(e.target.value);
            setResult(null);
            setError("");
          }}
          className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950"
        >
          {TAFSIR_SOURCES.map((source) => (
            <option key={source.id} value={source.id}>{source.label}</option>
          ))}
        </select>

        <label className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">اختر السورة</label>
        <select
          value={sura}
          onChange={(e) => {
            setSura(Number(e.target.value));
            setAya(1);
          }}
          className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950"
        >
          {chapters.map((item) => (
            <option key={item.number} value={item.number}>
              {item.number}. {item.name}
            </option>
          ))}
        </select>

        {mode === "ayah" && (
          <>
            <label className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">اختر رقم الآية</label>
            <select
              value={aya}
              onChange={(e) => setAya(Number(e.target.value))}
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950"
            >
              {ayahOptions.map((item) => (
                <option key={item} value={item}>
                  الآية {item}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          onClick={loadTafsir}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
          disabled={loading || !selected}
        >
          <Search size={17} />
          {loading
            ? "جاري تحميل التفسير..."
            : mode === "surah"
              ? "عرض تفسير السورة كاملة"
              : "عرض تفسير الآية"}
        </button>

        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          {selectedSource.onlineOnly ? "هذا التفسير يحتاج إنترنت." : "التفسير الميسر متاح دون اتصال."}
        </div>
      </aside>

      <main className="qawra-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{selectedSource.label}</p>
            <h1 className="text-3xl font-black">
              {selected?.name
                ? mode === "surah"
                  ? `تفسير سورة ${selected.name}`
                  : `تفسير سورة ${selected.name} — آية ${toArabicNumber(aya)}`
                : "تفسير القرآن الكريم"}
            </h1>
          </div>
          {tafsirItems.length > 0 && selected && (
            <FavoriteButton
              item={{
                id: mode === "surah" ? `tafsir-${sourceId}-surah-${sura}` : `tafsir-${sourceId}-${sura}-${aya}`,
                type: "tafsir",
                title: favoriteTitle,
                text: fullTafsirText.slice(0, 9000),
              }}
            />
          )}
        </div>

        {loading && (
          <div className="rounded-3xl bg-slate-50 p-6 font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            {mode === "surah" ? "جاري تحميل تفسير السورة كاملة..." : "جاري تحميل تفسير الآية..."}
          </div>
        )}

        {error && (
          <div className="rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="rounded-3xl bg-slate-50 p-6 leading-8 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            اختر السورة، ثم اختر هل تريد تفسير السورة كاملة أو تفسير آية معينة، واضغط زر العرض.
          </div>
        )}

        {result && !loading && tafsirItems.length === 0 && (
          <div className="rounded-3xl bg-amber-50 p-6 font-bold leading-8 text-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            لم يتم العثور على تفسير لهذه الآية.
          </div>
        )}

        {tafsirItems.length > 0 && (
          <article className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:p-6">
            <div className="mb-2 rounded-2xl bg-white p-4 text-sm font-black text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
              <span>{mode === "surah" ? `عدد الآيات المعروضة: ${toArabicNumber(tafsirItems.length)}` : `الآية المعروضة: ${toArabicNumber(tafsirItems[0]?.aya || aya)}`}</span>
            </div>

            {tafsirItems.map((item) => (
              <section key={`${item.aya}-${mode}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                <h3 className="mb-3 text-lg font-black text-[#315339] dark:text-emerald-200">
                  الآية {toArabicNumber(item.aya)}
                </h3>

                {item.ayahText && (
                  <p className="quran-text mb-4 rounded-2xl bg-[#fff8e8] p-4 text-2xl font-bold leading-[2.2] text-slate-950 dark:bg-slate-950 dark:text-white">
                    {item.ayahText}
                  </p>
                )}

                <p className="text-lg font-bold leading-10 text-slate-800 dark:text-slate-100">
                  {item.tafsirText}
                </p>

                {item.footnotes && (
                  <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-7 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                    {item.footnotes}
                  </p>
                )}
              </section>
            ))}
          </article>
        )}
      </main>
    </div>
  );
}
