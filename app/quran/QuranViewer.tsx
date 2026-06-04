"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import type { FormEvent, MouseEvent } from "react";
import {
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Hash,
  HelpCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { LoadingBox } from "@/components/LoadingBox";
import { FavoriteButton } from "@/components/FavoriteButton";
import { saveLastRead } from "@/components/LastReadBox";
import {
  recordReadingAyah,
  recordReadingPage,
} from "@/lib/client/activityStore";
import { ShareCardButton } from "@/components/ShareCardButton";
import { readSettings, writeSettings } from "@/components/settingsStore";
import { STATIC_SURAH_LIST } from "@/lib/static/quranSurahList";
import {
  cachedJsonFetch,
  cacheJsonResponse,
  cacheBinaryResponse,
  QURAN_MUSHAF_IMAGE_CACHE,
  QURAN_TEXT_CACHE,
  TAFSIR_CACHE,
} from "@/lib/client/offlineCache";
import { getOfflineTafsirAyahPayload } from "@/lib/client/offlineTafsir";
import { getOfflineQuranPagePayload, getOfflineSurahPayload } from "@/lib/client/offlineQuranText";

type Chapter = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
};

type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  hizbQuarter?: number;
  surah?: { number: number; name: string };
};

type SurahData = {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
};

type ViewMode = "index" | "surah" | "page" | "juz" | "hizb";

const BASMALA_DISPLAY = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
const LAST_MUSHAF_PAGE_KEY = "rifq-last-mushaf-page-v1";
const QURAN_TOOLBAR_HELP_SEEN_KEY = "rifq-quran-toolbar-help-seen-v1";
const LOCAL_MUSHAF_IMAGE_BASE_URL = "/mushaf-pages";
const REMOTE_MUSHAF_IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/GovarJabbar/Quran-PNG/master";
const ANDROID_ASSET_MUSHAF_IMAGE_BASE_URL =
  "file:///android_asset/public/mushaf-pages";
const BASMALA_PATTERN =
  /^بِ?سْمِ?\s+ٱ?للَّهِ?\s+ٱ?لرَّحْمَ[ٰـ]?نِ?\s+ٱ?لرَّحِيمِ?\s*/u;

const pageStartSurah = [
  { number: 1, start: 1, name: "الفاتحة" },
  { number: 2, start: 2, name: "البقرة" },
  { number: 3, start: 50, name: "آل عمران" },
  { number: 4, start: 77, name: "النساء" },
  { number: 5, start: 106, name: "المائدة" },
  { number: 6, start: 128, name: "الأنعام" },
  { number: 7, start: 151, name: "الأعراف" },
  { number: 8, start: 177, name: "الأنفال" },
  { number: 9, start: 187, name: "التوبة" },
  { number: 10, start: 208, name: "يونس" },
  { number: 11, start: 221, name: "هود" },
  { number: 12, start: 235, name: "يوسف" },
  { number: 13, start: 249, name: "الرعد" },
  { number: 14, start: 255, name: "إبراهيم" },
  { number: 15, start: 262, name: "الحجر" },
  { number: 16, start: 267, name: "النحل" },
  { number: 17, start: 282, name: "الإسراء" },
  { number: 18, start: 293, name: "الكهف" },
  { number: 19, start: 305, name: "مريم" },
  { number: 20, start: 312, name: "طه" },
  { number: 21, start: 322, name: "الأنبياء" },
  { number: 22, start: 332, name: "الحج" },
  { number: 23, start: 342, name: "المؤمنون" },
  { number: 24, start: 350, name: "النور" },
  { number: 25, start: 359, name: "الفرقان" },
  { number: 26, start: 367, name: "الشعراء" },
  { number: 27, start: 377, name: "النمل" },
  { number: 28, start: 385, name: "القصص" },
  { number: 29, start: 396, name: "العنكبوت" },
  { number: 30, start: 404, name: "الروم" },
  { number: 31, start: 411, name: "لقمان" },
  { number: 32, start: 415, name: "السجدة" },
  { number: 33, start: 418, name: "الأحزاب" },
  { number: 34, start: 428, name: "سبأ" },
  { number: 35, start: 434, name: "فاطر" },
  { number: 36, start: 440, name: "يس" },
  { number: 37, start: 446, name: "الصافات" },
  { number: 38, start: 453, name: "ص" },
  { number: 39, start: 458, name: "الزمر" },
  { number: 40, start: 467, name: "غافر" },
  { number: 41, start: 477, name: "فصلت" },
  { number: 42, start: 483, name: "الشورى" },
  { number: 43, start: 489, name: "الزخرف" },
  { number: 44, start: 496, name: "الدخان" },
  { number: 45, start: 499, name: "الجاثية" },
  { number: 46, start: 502, name: "الأحقاف" },
  { number: 47, start: 507, name: "محمد" },
  { number: 48, start: 511, name: "الفتح" },
  { number: 49, start: 515, name: "الحجرات" },
  { number: 50, start: 518, name: "ق" },
  { number: 51, start: 520, name: "الذاريات" },
  { number: 52, start: 523, name: "الطور" },
  { number: 53, start: 526, name: "النجم" },
  { number: 54, start: 528, name: "القمر" },
  { number: 55, start: 531, name: "الرحمن" },
  { number: 56, start: 534, name: "الواقعة" },
  { number: 57, start: 537, name: "الحديد" },
  { number: 58, start: 542, name: "المجادلة" },
  { number: 59, start: 545, name: "الحشر" },
  { number: 60, start: 549, name: "الممتحنة" },
  { number: 61, start: 551, name: "الصف" },
  { number: 62, start: 553, name: "الجمعة" },
  { number: 63, start: 554, name: "المنافقون" },
  { number: 64, start: 556, name: "التغابن" },
  { number: 65, start: 558, name: "الطلاق" },
  { number: 66, start: 560, name: "التحريم" },
  { number: 67, start: 562, name: "الملك" },
  { number: 68, start: 564, name: "القلم" },
  { number: 69, start: 566, name: "الحاقة" },
  { number: 70, start: 568, name: "المعارج" },
  { number: 71, start: 570, name: "نوح" },
  { number: 72, start: 572, name: "الجن" },
  { number: 73, start: 574, name: "المزمل" },
  { number: 74, start: 575, name: "المدثر" },
  { number: 75, start: 577, name: "القيامة" },
  { number: 76, start: 578, name: "الإنسان" },
  { number: 77, start: 580, name: "المرسلات" },
  { number: 78, start: 582, name: "النبأ" },
  { number: 79, start: 583, name: "النازعات" },
  { number: 80, start: 585, name: "عبس" },
  { number: 81, start: 586, name: "التكوير" },
  { number: 82, start: 587, name: "الانفطار" },
  { number: 83, start: 587, name: "المطففين" },
  { number: 84, start: 589, name: "الانشقاق" },
  { number: 85, start: 590, name: "البروج" },
  { number: 86, start: 591, name: "الطارق" },
  { number: 87, start: 591, name: "الأعلى" },
  { number: 88, start: 592, name: "الغاشية" },
  { number: 89, start: 593, name: "الفجر" },
  { number: 90, start: 594, name: "البلد" },
  { number: 91, start: 595, name: "الشمس" },
  { number: 92, start: 595, name: "الليل" },
  { number: 93, start: 596, name: "الضحى" },
  { number: 94, start: 596, name: "الشرح" },
  { number: 95, start: 597, name: "التين" },
  { number: 96, start: 597, name: "العلق" },
  { number: 97, start: 598, name: "القدر" },
  { number: 98, start: 598, name: "البينة" },
  { number: 99, start: 599, name: "الزلزلة" },
  { number: 100, start: 599, name: "العاديات" },
  { number: 101, start: 600, name: "القارعة" },
  { number: 102, start: 600, name: "التكاثر" },
  { number: 103, start: 601, name: "العصر" },
  { number: 104, start: 601, name: "الهمزة" },
  { number: 105, start: 601, name: "الفيل" },
  { number: 106, start: 602, name: "قريش" },
  { number: 107, start: 602, name: "الماعون" },
  { number: 108, start: 602, name: "الكوثر" },
  { number: 109, start: 603, name: "الكافرون" },
  { number: 110, start: 603, name: "النصر" },
  { number: 111, start: 603, name: "المسد" },
  { number: 112, start: 604, name: "الإخلاص" },
  { number: 113, start: 604, name: "الفلق" },
  { number: 114, start: 604, name: "الناس" },
];

function pageSurahs(page: number) {
  const current = pageStartSurah
    .filter(
      (s, i) =>
        s.start <= page &&
        (!pageStartSurah[i + 1] || pageStartSurah[i + 1].start > page),
    )
    .map((s) => s.name);
  const exact = pageStartSurah
    .filter((s) => s.start === page)
    .map((s) => s.name);
  return Array.from(new Set([...current, ...exact])).join("، ");
}

function surahStartPage(surahNumber: number) {
  return pageStartSurah.find((s) => s.number === surahNumber)?.start || 1;
}

function ayahMarker(n: number) {
  return `﴿${n}﴾`;
}

function padMushafPage(page: number) {
  return String(Math.max(1, Math.min(604, page))).padStart(3, "0");
}

function localMushafPageImageUrl(page: number) {
  return `${LOCAL_MUSHAF_IMAGE_BASE_URL}/${padMushafPage(page)}.png`;
}

function remoteMushafPageImageUrl(page: number) {
  return `${REMOTE_MUSHAF_IMAGE_BASE_URL}/${padMushafPage(page)}.png`;
}

function androidAssetMushafPageImageUrl(page: number) {
  return `${ANDROID_ASSET_MUSHAF_IMAGE_BASE_URL}/${padMushafPage(page)}.png`;
}

function capacitorMushafPageImageUrl(page: number) {
  if (typeof window === "undefined") return "";
  if (!Capacitor.isNativePlatform()) return "";

  return Capacitor.convertFileSrc(
    `${ANDROID_ASSET_MUSHAF_IMAGE_BASE_URL}/${padMushafPage(page)}.png`,
  );
}

function relativeMushafPageImageUrl(page: number) {
  return `mushaf-pages/${padMushafPage(page)}.png`;
}

function mushafPageImageUrls(page: number) {
  // Android offline build serves public assets from the local Capacitor web bundle.
  // لذلك /mushaf-pages هو المصدر الأول، ثم نحاول مسارات Android asset كاحتياط.
  return [
    localMushafPageImageUrl(page),
    relativeMushafPageImageUrl(page),
    capacitorMushafPageImageUrl(page),
    androidAssetMushafPageImageUrl(page),
    remoteMushafPageImageUrl(page),
  ].filter(Boolean);
}

function mushafPageImageUrl(page: number, sourceIndex = 0) {
  return mushafPageImageUrls(page)[sourceIndex] || localMushafPageImageUrl(page);
}

const juzStartPages = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322,
  342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

function juzFromPage(page: number) {
  let juz = 1;
  for (let index = 0; index < juzStartPages.length; index += 1) {
    if (page >= juzStartPages[index]) juz = index + 1;
  }
  return juz;
}

function hizbFromPage(page: number) {
  return Math.max(
    1,
    Math.min(
      60,
      Math.ceil(
        juzFromPage(page) * 2 -
          (page < juzStartPages[Math.min(29, juzFromPage(page) - 1)] + 10
            ? 1
            : 0),
      ),
    ),
  );
}

function preloadBrowserImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`تعذر تحميل صورة المصحف: ${src}`));
    img.src = src;
  });
}

async function cacheMushafPageImage(page: number) {
  const sources = mushafPageImageUrls(page);
  let lastError: unknown = null;

  for (const source of sources) {
    try {
      await cacheBinaryResponse(source, QURAN_MUSHAF_IMAGE_CACHE);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("تعذر حفظ صورة صفحة المصحف");
}

async function preloadMushafPageImage(page: number) {
  const sources = mushafPageImageUrls(page);
  let lastError: unknown = null;

  for (const source of sources) {
    try {
      await preloadBrowserImage(source);
      if (typeof window !== "undefined" && "caches" in window) {
        cacheBinaryResponse(source, QURAN_MUSHAF_IMAGE_CACHE).catch(
          () => undefined,
        );
      }
      return source === remoteMushafPageImageUrl(page);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("تعذر تحميل صورة المصحف");
}

function toArabicNumber(value: number | string | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(
    /[0-9]/g,
    (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)],
  );
}

function hizbFromQuarter(hizbQuarter?: number) {
  return hizbQuarter ? Math.ceil(hizbQuarter / 4) : undefined;
}

function hizbQuarterName(hizbQuarter?: number) {
  if (!hizbQuarter) return "—";
  const quarter = ((hizbQuarter - 1) % 4) + 1;
  if (quarter === 1) return "بداية الحزب";
  if (quarter === 2) return "ربع الحزب";
  if (quarter === 3) return "نصف الحزب";
  return "ثلاثة أرباع الحزب";
}

function stripEmbeddedBasmala(text: string) {
  return text.replace(BASMALA_PATTERN, "").trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function normalizeTafsirPayload(payload: any) {
  const raw = payload?.data?.result ?? payload?.data;
  const result = Array.isArray(raw) ? raw[0] : raw;
  const tafsirText =
    result?.translation ||
    result?.text ||
    result?.tafsir ||
    result?.meaning ||
    "";
  const footnotes = result?.footnotes || result?.footnote || "";

  return {
    tafsirText: typeof tafsirText === "string" ? stripHtml(tafsirText) : "",
    footnotes: typeof footnotes === "string" ? stripHtml(footnotes) : "",
  };
}

function getSavedMushafPage() {
  if (typeof window === "undefined") return 1;
  const saved = Number(localStorage.getItem(LAST_MUSHAF_PAGE_KEY) || "1");
  return Number.isInteger(saved) && saved >= 1 && saved <= 604 ? saved : 1;
}

function saveMushafPage(page: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_MUSHAF_PAGE_KEY, String(page));
}

function buildDisplayAyahs(surah: SurahData | null): {
  basmala: null | { text: string; marker?: number };
  ayahs: Ayah[];
} {
  if (!surah) return { basmala: null, ayahs: [] };
  if (surah.number === 9) return { basmala: null, ayahs: surah.ayahs };

  if (surah.number === 1) {
    const first = surah.ayahs[0];
    const rest = surah.ayahs.slice(1);
    return {
      basmala: { text: first?.text || BASMALA_DISPLAY, marker: 1 },
      ayahs: rest,
    };
  }

  const [first, ...rest] = surah.ayahs;
  const cleanedFirst = first
    ? { ...first, text: stripEmbeddedBasmala(first.text) }
    : first;
  return {
    basmala: { text: BASMALA_DISPLAY },
    ayahs: cleanedFirst ? [cleanedFirst, ...rest] : rest,
  };
}

type PageContentToken =
  | { kind: "surahTitle"; key: string; name: string }
  | { kind: "basmala"; key: string; text: string; marker?: number }
  | { kind: "ayah"; key: string; ayah: Ayah; text: string };

function buildPageContentTokens(ayahs: Ayah[]): PageContentToken[] {
  const tokens: PageContentToken[] = [];
  const renderedSurahTitles = new Set<number>();

  ayahs.forEach((ayah) => {
    const surahNumber = ayah.surah?.number || 0;
    const surahName = ayah.surah?.name || "";
    const startsSurah = ayah.numberInSurah === 1 && surahNumber > 0;

    if (startsSurah && surahName && !renderedSurahTitles.has(surahNumber)) {
      renderedSurahTitles.add(surahNumber);
      tokens.push({
        kind: "surahTitle",
        key: `surah-${surahNumber}-${ayah.number}`,
        name: surahName,
      });
    }

    if (startsSurah && surahNumber !== 9) {
      if (surahNumber === 1) {
        tokens.push({
          kind: "basmala",
          key: `basmala-${surahNumber}-${ayah.number}`,
          text: ayah.text || BASMALA_DISPLAY,
          marker: 1,
        });
        return;
      }

      tokens.push({
        kind: "basmala",
        key: `basmala-${surahNumber}-${ayah.number}`,
        text: BASMALA_DISPLAY,
      });
      const cleanedText = stripEmbeddedBasmala(ayah.text);
      if (cleanedText) {
        tokens.push({
          kind: "ayah",
          key: `ayah-${ayah.number}`,
          ayah,
          text: cleanedText,
        });
      }
      return;
    }

    tokens.push({
      kind: "ayah",
      key: `ayah-${ayah.number}`,
      ayah,
      text: ayah.text,
    });
  });

  return tokens;
}

export function QuranViewer() {
  const [chapters, setChapters] = useState<Chapter[]>(STATIC_SURAH_LIST);
  const [chapter, setChapter] = useState(1);
  const [surah, setSurah] = useState<SurahData | null>(null);
  const [fontSize, setFontSize] = useState(34);
  const [viewMode, setViewMode] = useState<ViewMode>("index");
  const [isMobile, setIsMobile] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [juzNumber, setJuzNumber] = useState(1);
  const [hizbNumber, setHizbNumber] = useState(1);
  const [loadedAyahs, setLoadedAyahs] = useState<Ayah[]>([]);
  const [mushafMode, setMushafMode] = useState(true);
  const [showPageText, setShowPageText] = useState(false);
  const [mushafImageError, setMushafImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offlineProgress, setOfflineProgress] = useState<number | null>(null);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [preloadedPages, setPreloadedPages] = useState<Record<number, boolean>>(
    {},
  );
  const [remoteFallbackPages, setRemoteFallbackPages] = useState<
    Record<number, boolean>
  >({});
  const [mushafImageSourceIndexes, setMushafImageSourceIndexes] = useState<
    Record<number, number>
  >({});
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [readingMode, setReadingMode] = useState(false);
  const [readerChromeVisible, setReaderChromeVisible] = useState(false);
  const [saveToast, setSaveToast] = useState("");
  const [indexTab, setIndexTab] = useState<"surahs" | "juz">("surahs");
  const [showJumpPanel, setShowJumpPanel] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState("");
  const [showToolbarTip, setShowToolbarTip] = useState(false);
  const [showToolbarHelp, setShowToolbarHelp] = useState(false);
  const [tafsirSheet, setTafsirSheet] = useState<{
    ayah: Ayah;
    text: string;
    loading: boolean;
    error: string;
    result: any | null;
  } | null>(null);
  const mushafScrollRef = useRef<HTMLDivElement | null>(null);
  const mushafObservedPageRef = useRef(pageNumber);
  const mushafPageChangeSourceRef = useRef<"program" | "scroll">("program");
  const mushafIgnoreScrollUntilRef = useRef(0);
  const mushafScrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedChapter = useMemo(
    () => chapters.find((item) => item.number === chapter),
    [chapters, chapter],
  );

  const display = useMemo(() => buildDisplayAyahs(surah), [surah]);
  const groupDisplayTokens = useMemo(
    () => buildPageContentTokens(loadedAyahs),
    [loadedAyahs],
  );
  const mushafPages = useMemo(
    () => Array.from({ length: 604 }, (_, index) => index + 1),
    [],
  );

  useEffect(() => {
    mushafObservedPageRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    if (viewMode !== "page") return;

    if (mushafPageChangeSourceRef.current === "scroll") {
      mushafPageChangeSourceRef.current = "program";
      return;
    }

    const target = document.getElementById(`mushaf-page-slide-${pageNumber}`);
    if (!target) return;

    mushafIgnoreScrollUntilRef.current = Date.now() + 700;
    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
    });
  }, [pageNumber, viewMode]);

  useEffect(() => {
    return () => {
      if (mushafScrollIdleTimerRef.current)
        clearTimeout(mushafScrollIdleTimerRef.current);
      if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (viewMode !== "page" && readingMode) {
      setReadingMode(false);
      setReaderChromeVisible(false);
    }
  }, [readingMode, viewMode]);

  useEffect(() => {
    if (viewMode !== "page" || !readingMode || typeof window === "undefined") return;
    if (localStorage.getItem(QURAN_TOOLBAR_HELP_SEEN_KEY) === "1") return;

    const timer = window.setTimeout(() => {
      setReaderChromeVisible(true);
      setShowToolbarTip(true);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [readingMode, viewMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const isActiveReadingMode = viewMode === "page" && readingMode;
    document.body.classList.toggle("rifq-mushaf-reading-active", isActiveReadingMode);
    document.documentElement.classList.toggle(
      "rifq-mushaf-reading-active",
      isActiveReadingMode,
    );

    return () => {
      document.body.classList.remove("rifq-mushaf-reading-active");
      document.documentElement.classList.remove("rifq-mushaf-reading-active");
    };
  }, [readingMode, viewMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function applyLayout(isPhone: boolean) {
      const settings = readSettings();
      setIsMobile(isPhone);
      setControlsOpen(!isPhone);
      setFontSize(
        isPhone ? Math.min(settings.quranFontSize, 24) : settings.quranFontSize,
      );

      const params = new URLSearchParams(window.location.search);
      const hasDirectReadingLink = ["page", "chapter", "juz", "hizb"].some(
        (key) => params.has(key),
      );

      if (!hasDirectReadingLink) {
        const savedPage = getSavedMushafPage();
        setPageNumber(savedPage);
        setViewMode("index");
        setMushafMode(true);
      }
    }

    function syncSettings() {
      const next = readSettings();
      setFontSize(
        mediaQuery.matches
          ? Math.min(next.quranFontSize, 24)
          : next.quranFontSize,
      );
    }

    applyLayout(mediaQuery.matches);

    function handleScreenChange(event: MediaQueryListEvent) {
      applyLayout(event.matches);
    }

    mediaQuery.addEventListener("change", handleScreenChange);
    window.addEventListener("qawra-settings-change", syncSettings);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenChange);
      window.removeEventListener("qawra-settings-change", syncSettings);
    };
  }, []);

  useEffect(() => {
    async function loadChapters() {
      try {
        const json = await cachedJsonFetch("/api/quran/chapters");
        const nextChapters =
          Array.isArray(json?.data) && json.data.length
            ? json.data
            : STATIC_SURAH_LIST;
        setChapters(nextChapters);
      } catch {
        setChapters(STATIC_SURAH_LIST);
      } finally {
        if (viewMode === "index") setLoading(false);
      }
    }
    loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSurah(current = chapter) {
    setLoading(true);
    setError("");
    try {
      const local = await getOfflineSurahPayload(current);
      if (local?.data) {
        setSurah(local.data as SurahData);
        setLoadedAyahs([]);
        return;
      }

      const json = await cachedJsonFetch(
        `/api/quran/verses?chapter=${current}`,
      );
      setSurah(json.data);
      setLoadedAyahs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }

  async function loadAyahGroup(url: string) {
    setLoading(true);
    setError("");
    try {
      const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      const page = Number(parsed.searchParams.get("page") || "0");

      if (url.includes("/api/quran/page") && page >= 1 && page <= 604) {
        const local = await getOfflineQuranPagePayload(page);
        if (local?.data?.ayahs?.length) {
          setLoadedAyahs(local.data.ayahs as Ayah[]);
          setSurah(null);
          return;
        }
      }

      const json = await cachedJsonFetch(url);
      setLoadedAyahs(json?.data?.ayahs || []);
      setSurah(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }

  function loadCurrent() {
    if (viewMode === "index") {
      setLoading(false);
      setError("");
      return;
    }
    if (viewMode === "surah") loadSurah(chapter);
    if (viewMode === "page") {
      if (showPageText || mushafImageError)
        loadAyahGroup(`/api/quran/page?page=${pageNumber}`);
      else {
        setLoadedAyahs([]);
        setLoading(false);
        setError("");
      }
    }
    if (viewMode === "juz") loadAyahGroup(`/api/quran/juz?juz=${juzNumber}`);
    if (viewMode === "hizb")
      loadAyahGroup(`/api/quran/hizb?hizb=${hizbNumber}`);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = Number(params.get("page"));
    const c = Number(params.get("chapter"));
    const a = Number(params.get("ayah"));

    if (p >= 1 && p <= 604) {
      mushafPageChangeSourceRef.current = "program";
      mushafIgnoreScrollUntilRef.current = Date.now() + 900;
      setViewMode("page");
      setPageNumber(p);
      setMushafMode(true);
      setReadingMode(true);
      setReaderChromeVisible(false);
      setControlsOpen(false);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    if (c >= 1 && c <= 114) {
      const startPage = surahStartPage(c);
      setChapter(c);

      if (a) {
        setViewMode("surah");
        setReadingMode(false);
        setReaderChromeVisible(false);
        setTimeout(
          () =>
            document
              .getElementById(`ayah-${a}`)
              ?.scrollIntoView({ behavior: "smooth" }),
          1200,
        );
        return;
      }

      mushafPageChangeSourceRef.current = "program";
      mushafIgnoreScrollUntilRef.current = Date.now() + 900;
      setPageNumber(startPage);
      setViewMode("page");
      setMushafMode(true);
      setReadingMode(true);
      setReaderChromeVisible(false);
      setControlsOpen(false);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  useEffect(() => {
    loadCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, viewMode, pageNumber, juzNumber, hizbNumber]);

  useEffect(() => {
    if (viewMode === "page" && (showPageText || mushafImageError)) {
      const hasPageAyahs = loadedAyahs.some((ayah) => ayah.page === pageNumber);
      if (!hasPageAyahs) loadAyahGroup(`/api/quran/page?page=${pageNumber}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPageText, mushafImageError, pageNumber, viewMode]);

  useEffect(() => {
    if (viewMode === "page") saveMushafPage(pageNumber);
    setMushafImageError(false);
    setShowPageText(false);
    setMushafImageSourceIndexes((prev) => ({ ...prev, [pageNumber]: 0 }));
  }, [pageNumber, viewMode]);

  useEffect(() => {
    if (
      viewMode !== "page" ||
      typeof window === "undefined" ||
      !("caches" in window)
    )
      return;

    const pagesToPreload = [
      pageNumber,
      pageNumber + 1,
      pageNumber - 1,
      pageNumber + 2,
      pageNumber - 2,
    ].filter((page) => page >= 1 && page <= 604);

    pagesToPreload.forEach((page) => {
      if (preloadedPages[page]) return;
      preloadMushafPageImage(page)
        .then((usedRemote) => {
          if (usedRemote)
            setRemoteFallbackPages((prev) => ({ ...prev, [page]: true }));
          setPreloadedPages((prev) => ({ ...prev, [page]: true }));
        })
        .catch(() => undefined);
    });
  }, [pageNumber, preloadedPages, viewMode]);

  useEffect(() => {
    if (viewMode !== "page" || loading || !loadedAyahs.length) return;
    const page = loadedAyahs[0]?.page || pageNumber;
    if (!page) return;
    const surahName = pageSurahs(page);
    recordReadingPage(
      page,
      `قرأت صفحة ${page}${surahName ? ` — سورة ${surahName}` : ""}`,
    );
  }, [loadedAyahs, loading, pageNumber, viewMode]);

  function title() {
    if (viewMode === "index") return "فهرس السور";
    if (viewMode === "surah")
      return surah?.name || selectedChapter?.name || "القرآن الكريم";
    if (viewMode === "page")
      return `صفحة ${pageNumber} — سورة ${pageSurahs(pageNumber)}`;
    if (viewMode === "juz") return `الجزء ${juzNumber}`;
    return `الحزب ${hizbNumber}`;
  }

  function setMushafPageProgrammatically(nextPage: number) {
    mushafPageChangeSourceRef.current = "program";
    mushafIgnoreScrollUntilRef.current = Date.now() + 700;
    setPageNumber(Math.max(1, Math.min(604, nextPage)));
  }

  function handleMushafScroll() {
    if (Date.now() < mushafIgnoreScrollUntilRef.current) return;

    const container = mushafScrollRef.current;
    if (!container) return;

    if (mushafScrollIdleTimerRef.current)
      clearTimeout(mushafScrollIdleTimerRef.current);

    mushafScrollIdleTimerRef.current = setTimeout(() => {
      if (Date.now() < mushafIgnoreScrollUntilRef.current) return;

      const slides = Array.from(
        container.querySelectorAll<HTMLElement>("[data-mushaf-page]"),
      );
      if (!slides.length) return;

      const containerBox = container.getBoundingClientRect();
      const containerCenter = containerBox.left + containerBox.width / 2;

      let closestPage = pageNumber;
      let closestDistance = Number.POSITIVE_INFINITY;

      slides.forEach((slide) => {
        const slideBox = slide.getBoundingClientRect();
        const slideCenter = slideBox.left + slideBox.width / 2;
        const distance = Math.abs(slideCenter - containerCenter);
        const slidePage = Number(slide.dataset.mushafPage);

        if (Number.isInteger(slidePage) && distance < closestDistance) {
          closestDistance = distance;
          closestPage = slidePage;
        }
      });

      if (closestPage !== mushafObservedPageRef.current) {
        mushafObservedPageRef.current = closestPage;
        mushafPageChangeSourceRef.current = "scroll";
        setPageNumber(closestPage);
      }
    }, 140);
  }

  function next() {
    if (viewMode === "index") return;
    if (viewMode === "surah") setChapter((v) => Math.min(114, v + 1));
    if (viewMode === "page") setMushafPageProgrammatically(pageNumber + 1);
    if (viewMode === "juz") setJuzNumber((v) => Math.min(30, v + 1));
    if (viewMode === "hizb") setHizbNumber((v) => Math.min(60, v + 1));
  }

  function prev() {
    if (viewMode === "index") return;
    if (viewMode === "surah") setChapter((v) => Math.max(1, v - 1));
    if (viewMode === "page") setMushafPageProgrammatically(pageNumber - 1);
    if (viewMode === "juz") setJuzNumber((v) => Math.max(1, v - 1));
    if (viewMode === "hizb") setHizbNumber((v) => Math.max(1, v - 1));
  }

  function openSurahInMushaf(surahNumber: number) {
    const startPage = surahStartPage(surahNumber);
    setChapter(surahNumber);
    mushafPageChangeSourceRef.current = "program";
    mushafIgnoreScrollUntilRef.current = Date.now() + 900;
    setPageNumber(startPage);
    setViewMode("page");
    setMushafMode(true);
    setReadingMode(true);
    setReaderChromeVisible(false);
    setControlsOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function changeQuranFont(delta: number) {
    const min = isMobile ? 18 : 24;
    const max = isMobile ? 34 : 54;
    const nextSize = Math.max(min, Math.min(max, fontSize + delta));
    setFontSize(nextSize);

    const settings = readSettings();
    writeSettings({ ...settings, quranFontSize: nextSize });
  }

  async function downloadQuranOfflineLibrary() {
    if (typeof window === "undefined" || !("caches" in window)) {
      setOfflineMessage("المتصفح لا يدعم حفظ المصحف بدون إنترنت.");
      return;
    }

    const totalItems = 604 * 2 + 1;
    let completed = 0;
    const updateProgress = (message: string) => {
      setOfflineMessage(message);
      setOfflineProgress(
        Math.min(100, Math.round((completed / totalItems) * 100)),
      );
    };

    setOfflineProgress(0);
    updateProgress("جاري حفظ فهرس السور...");

    try {
      await cacheJsonResponse("/api/quran/chapters", QURAN_TEXT_CACHE);
      completed += 1;

      for (let page = 1; page <= 604; page += 1) {
        updateProgress(`جاري حفظ نص صفحة ${page} من 604...`);
        await cacheJsonResponse(
          `/api/quran/page?page=${page}`,
          QURAN_TEXT_CACHE,
        );
        completed += 1;
      }

      for (let page = 1; page <= 604; page += 1) {
        updateProgress(`جاري حفظ صورة صفحة ${page} من 604...`);
        await cacheMushafPageImage(page);
        completed += 1;
      }

      setOfflineProgress(100);
      setOfflineMessage(
        "تم حفظ المصحف كاملًا: النص + صور الصفحات. التقليب سيصبح أسرع ويعمل بدون إنترنت بعد اكتمال التحميل.",
      );
    } catch (err) {
      setOfflineMessage(
        err instanceof Error
          ? err.message
          : "تعذر حفظ المصحف كاملًا بدون إنترنت.",
      );
    } finally {
      setTimeout(() => setOfflineProgress(null), 3000);
    }
  }

  function handleTouchStart(x: number, y: number) {
    setTouchStart({ x, y });
  }

  function handleTouchEnd(x: number, y: number) {
    if (!touchStart) return;

    const deltaX = x - touchStart.x;
    const deltaY = y - touchStart.y;
    setTouchStart(null);

    if (Math.abs(deltaX) < 58) return;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    // اتجاه مصحف عربي: السحب لليسار يذهب للصفحة التالية، والسحب لليمين يرجع للصفحة السابقة.
    if (deltaX < 0) next();
    else prev();
  }

  async function openTafsir(ayah: Ayah, text: string) {
    const sura = ayah.surah?.number || surah?.number || chapter;
    setTafsirSheet({ ayah, text, loading: true, error: "", result: null });

    try {
      const localJson = await getOfflineTafsirAyahPayload(sura, ayah.numberInSurah);
      if (localJson) {
        setTafsirSheet({ ayah, text, loading: false, error: "", result: localJson });
        return;
      }

      const json = await cachedJsonFetch(
        `/api/tafsir?sura=${sura}&aya=${ayah.numberInSurah}`,
        TAFSIR_CACHE,
      );
      setTafsirSheet({ ayah, text, loading: false, error: "", result: json });
    } catch (err) {
      setTafsirSheet({
        ayah,
        text,
        loading: false,
        error: err instanceof Error ? err.message : "تعذر تحميل التفسير",
        result: null,
      });
    }
  }

  function showSaveToast(message: string) {
    if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    setSaveToast(message);
    saveToastTimerRef.current = setTimeout(() => {
      setSaveToast("");
    }, 1800);
  }

  function markLast(ayah: Ayah) {
    const chapterName =
      surah?.name || ayah.surah?.name || selectedChapter?.name || "";
    const chapterNumber = surah?.number || ayah.surah?.number || chapter;
    if (ayah.page) saveMushafPage(ayah.page);

    if (ayah.page) {
      recordReadingPage(ayah.page, `حفظت موضعك في صفحة ${ayah.page}`);
    }
    recordReadingAyah(
      `${chapterNumber}:${ayah.numberInSurah}`,
      `حفظت موضع سورة ${chapterName} — آية ${ayah.numberInSurah}`,
    );

    saveLastRead({
      chapter: chapterNumber,
      chapterName,
      ayah: ayah.numberInSurah,
      page: ayah.page,
      savedAt: new Date().toISOString(),
    });

    showSaveToast(`تم حفظ موضعك في سورة ${chapterName || "القرآن"}`);
  }

  function saveCurrentMushafPage() {
    const chapterName = pageSurahs(pageNumber) || activeSurahNames || "القرآن";
    saveMushafPage(pageNumber);
    recordReadingPage(pageNumber, `حفظت موضعك في صفحة ${pageNumber}`);
    saveLastRead({
      chapter,
      chapterName,
      ayah: 1,
      page: pageNumber,
      savedAt: new Date().toISOString(),
    });

    showSaveToast(`تم حفظ موضعك في صفحة ${toArabicNumber(pageNumber)}`);
  }

  function handleReadingSurfaceTap(event: MouseEvent<HTMLElement>) {
    if (!readingMode) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest("button,a,input,select,textarea,[role='button']"))
      return;

    setReaderChromeVisible((value) => !value);
  }

  function markToolbarHelpSeen() {
    if (typeof window !== "undefined") {
      localStorage.setItem(QURAN_TOOLBAR_HELP_SEEN_KEY, "1");
    }
    setShowToolbarTip(false);
  }

  function openToolbarHelp() {
    markToolbarHelpSeen();
    setReaderChromeVisible(true);
    setShowToolbarHelp(true);
  }

  function openSavedPageInReadingMode() {
    const savedPage = getSavedMushafPage();
    mushafPageChangeSourceRef.current = "program";
    mushafIgnoreScrollUntilRef.current = Date.now() + 900;
    setPageNumber(savedPage);
    setViewMode("page");
    setMushafMode(true);
    setReadingMode(true);
    setReaderChromeVisible(false);
    setControlsOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function openJuzInReadingMode(juz: number) {
    const startPage = juzStartPages[juz - 1] || 1;
    setJuzNumber(juz);
    mushafPageChangeSourceRef.current = "program";
    mushafIgnoreScrollUntilRef.current = Date.now() + 900;
    setPageNumber(startPage);
    setViewMode("page");
    setMushafMode(true);
    setReadingMode(true);
    setReaderChromeVisible(false);
    setControlsOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function togglePageTafsirPanel() {
    const nextValue = !showPageText;
    setShowPageText(nextValue);
    if (nextValue) loadAyahGroup(`/api/quran/page?page=${pageNumber}`);
  }

  function submitJumpToPage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const nextPage = Number(jumpPageInput);
    if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > 604) {
      setError("اكتب رقم صفحة صحيح من 1 إلى 604.");
      return;
    }

    setError("");
    setMushafPageProgrammatically(nextPage);
    setViewMode("page");
    setShowJumpPanel(false);
    setControlsOpen(false);
  }

  const groupAyahs = loadedAyahs;
  const groupText = groupAyahs
    .map((ayah) => `${ayah.text} ${ayahMarker(ayah.numberInSurah)}`)
    .join(" ");
  const activePageMeta =
    groupAyahs.find((ayah) => ayah.page === pageNumber) || groupAyahs[0];
  const activePageNumber =
    viewMode === "page" ? pageNumber : activePageMeta?.page || pageNumber;
  const activeJuz = activePageMeta?.juz || juzFromPage(activePageNumber);
  const activeHizb =
    hizbFromQuarter(activePageMeta?.hizbQuarter) ||
    hizbFromPage(activePageNumber);
  const activeHizbQuarter = activePageMeta?.hizbQuarter
    ? hizbQuarterName(activePageMeta.hizbQuarter)
    : "";
  const activeSurahNames = pageSurahs(activePageNumber);
  const normalizedTafsir = tafsirSheet?.result
    ? normalizeTafsirPayload(tafsirSheet.result)
    : null;

  return (
    <div
      className={`quran-viewer-shell pb-24 md:pb-0 ${readingMode ? "quran-reading-mode-active" : ""}`}
    >
      <div
        className={`grid gap-4 ${viewMode === "index" || readingMode ? "lg:grid-cols-1" : "lg:grid-cols-[280px_1fr]"} lg:gap-5`}
      >
        {viewMode !== "index" && !readingMode && (
          <aside className="qawra-card quran-controls-card hidden h-fit lg:block">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 md:hidden">
                  الوضع الافتراضي للجوال: صفحة مصحف
                </p>
                <h2 className="text-2xl font-black">قارئ القرآن</h2>
              </div>
              <button
                onClick={() => setControlsOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-100 md:hidden"
              >
                <SlidersHorizontal size={16} />
                {controlsOpen ? "إخفاء" : "إعدادات"}
              </button>
            </div>

            <div
              className={`${controlsOpen ? "mt-4 block" : "hidden"} md:mt-4 md:block`}
            >
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-2 dark:bg-slate-950">
                {[
                  ["index", "الفهرس"],
                  ["page", "صفحة"],
                  ["juz", "جزء"],
                  ["hizb", "حزب"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as ViewMode)}
                    className={`rounded-xl px-3 py-2 font-black ${viewMode === mode ? "bg-emerald-700 text-white" : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <button
                  onClick={downloadQuranOfflineLibrary}
                  disabled={offlineProgress !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-70"
                >
                  <Download size={16} />
                  تحميل المصحف كاملًا بدون نت
                </button>
                {offlineProgress !== null && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-100">
                      <span>التحميل</span>
                      <span>{offlineProgress}%</span>
                    </div>
                    <div className="rifq-progress">
                      <span style={{ width: `${offlineProgress}%` }} />
                    </div>
                  </div>
                )}
                {offlineMessage && (
                  <p className="mt-3 text-xs font-bold leading-6 text-emerald-900 dark:text-emerald-100">
                    {offlineMessage}
                  </p>
                )}
              </div>

              {viewMode === "surah" && (
                <>
                  <label className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">
                    اختر السورة
                  </label>
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950"
                  >
                    {chapters.map((item) => (
                      <option key={item.number} value={item.number}>
                        {item.number}. {item.name} — {item.numberOfAyahs} آية
                      </option>
                    ))}
                  </select>
                </>
              )}

              {viewMode === "page" && (
                <>
                  <label className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">
                    رقم صفحة المصحف
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={pageNumber}
                    onChange={(e) =>
                      setMushafPageProgrammatically(Number(e.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                    سورة {pageSurahs(pageNumber)}
                  </p>
                </>
              )}

              {viewMode === "juz" && (
                <>
                  <label className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">
                    اختر الجزء
                  </label>
                  <select
                    value={juzNumber}
                    onChange={(e) => setJuzNumber(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        الجزء {n}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {viewMode === "hizb" && (
                <>
                  <label className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">
                    اختر الحزب
                  </label>
                  <select
                    value={hizbNumber}
                    onChange={(e) => setHizbNumber(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950"
                  >
                    {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        الحزب {n}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {viewMode === "surah" && (
                <button
                  onClick={() => setMushafMode((v) => !v)}
                  className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white hover:bg-emerald-800"
                >
                  {mushafMode ? "عرض آية تحت آية" : "عرض مثل المصحف"}
                </button>
              )}
            </div>
          </aside>
        )}

        <main
          className={`qawra-card quran-reader-card ${viewMode === "page" ? "quran-reader-focus-card" : ""} ${readingMode ? "quran-reader-reading-mode" : ""}`}
        >
          {!readingMode && (
            <div className="quran-reading-title mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 md:mb-6 md:pb-5">
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {viewMode === "index"
                    ? "اختر السورة للقراءة"
                    : viewMode === "surah"
                      ? selectedChapter?.revelationType === "Meccan"
                        ? "مكية"
                        : "مدنية"
                      : "عرض مصحف"}
                </p>
                <h1 className="text-2xl font-black md:text-3xl">{title()}</h1>
              </div>
              <div className="flex items-center gap-2">
                {viewMode !== "index" && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("index");
                      setControlsOpen(false);
                      if (typeof window !== "undefined")
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-[#fff8e8] px-4 py-3 font-black text-[#315339] ring-1 ring-[#dfc688]/60 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <BookOpen size={17} />
                    الفهرس
                  </button>
                )}
                <button
                  onClick={loadCurrent}
                  className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <RefreshCw size={17} />
                  تحديث
                </button>
              </div>
            </div>
          )}

          {viewMode !== "index" && loading && (
            <LoadingBox text="جاري تحميل الآيات..." />
          )}
          {error && (
            <div className="rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          {viewMode === "index" && (
            <section className="surah-index-panel khatma-index-panel" dir="rtl">
              <div className="khatma-index-header">
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#987a35]">
                    فهرس مصحف المدينة النبوية
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#315339] md:text-3xl">
                    القرآن الكريم
                  </h2>
                  <p className="mt-2 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">
                    اختر سورة أو جزءًا، وسيُفتح المصحف مباشرة في وضع القراءة
                    الهادئ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openSavedPageInReadingMode}
                  className="khatma-continue-button"
                >
                  متابعة آخر صفحة
                </button>
              </div>

              <div
                className="khatma-index-tabs"
                role="tablist"
                aria-label="فهرس القرآن"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={indexTab === "surahs"}
                  onClick={() => setIndexTab("surahs")}
                  className={indexTab === "surahs" ? "active" : ""}
                >
                  السور
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={indexTab === "juz"}
                  onClick={() => setIndexTab("juz")}
                  className={indexTab === "juz" ? "active" : ""}
                >
                  الأجزاء
                </button>
              </div>

              {(offlineProgress !== null || offlineMessage) && (
                <div className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-100 dark:ring-emerald-900/40">
                  {offlineProgress !== null && (
                    <>
                      <div className="mb-2 flex items-center justify-between text-xs font-black">
                        <span>حفظ المصحف للأوفلاين</span>
                        <span>{offlineProgress}%</span>
                      </div>
                      <div className="rifq-progress">
                        <span style={{ width: `${offlineProgress}%` }} />
                      </div>
                    </>
                  )}
                  {offlineMessage && (
                    <p className="mt-2 leading-7">{offlineMessage}</p>
                  )}
                </div>
              )}

              {indexTab === "surahs" ? (
                <div className="khatma-surah-list" role="tabpanel">
                  {(chapters.length ? chapters : STATIC_SURAH_LIST).map(
                    (item) => {
                      const startPage = surahStartPage(item.number);
                      const revelation =
                        item.revelationType === "Meccan" ? "مكية" : "مدنية";
                      return (
                        <button
                          key={item.number}
                          type="button"
                          onClick={() => openSurahInMushaf(item.number)}
                          className="khatma-surah-row"
                        >
                          <span className="khatma-surah-number">
                            {toArabicNumber(item.number)}
                          </span>
                          <span className="khatma-surah-main">
                            <span className="khatma-surah-name">
                              {item.name}
                            </span>
                            <span className="khatma-surah-subtitle">
                              {revelation} ·{" "}
                              {toArabicNumber(item.numberOfAyahs)} آية
                            </span>
                          </span>
                          <span className="khatma-surah-page">
                            صفحة {toArabicNumber(startPage)}
                          </span>
                          <ChevronLeft
                            className="khatma-surah-arrow"
                            size={18}
                          />
                        </button>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="khatma-surah-list" role="tabpanel">
                  {juzStartPages.map((startPage, index) => {
                    const juz = index + 1;
                    const nextPage = juzStartPages[index + 1]
                      ? juzStartPages[index + 1] - 1
                      : 604;
                    return (
                      <button
                        key={juz}
                        type="button"
                        onClick={() => openJuzInReadingMode(juz)}
                        className="khatma-surah-row"
                      >
                        <span className="khatma-surah-number">
                          {toArabicNumber(juz)}
                        </span>
                        <span className="khatma-surah-main">
                          <span className="khatma-surah-name">
                            الجزء {toArabicNumber(juz)}
                          </span>
                          <span className="khatma-surah-subtitle">
                            من صفحة {toArabicNumber(startPage)} إلى صفحة{" "}
                            {toArabicNumber(nextPage)}
                          </span>
                        </span>
                        <span className="khatma-surah-page">
                          صفحة {toArabicNumber(startPage)}
                        </span>
                        <ChevronLeft className="khatma-surah-arrow" size={18} />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {viewMode === "page" && (
            <article
              className={`real-mushaf-reader mushaf-page-turner mushaf-scroll-snap-reader ${readingMode ? "mushaf-fullscreen-reader" : ""} ${readingMode && readerChromeVisible ? "mushaf-chrome-visible" : "mushaf-chrome-hidden"}`}
            >
              {readingMode && (
                <div
                  className={`quran-reading-mode-top khatma-reading-mode-top rifq-reading-overlay-toolbar ${readerChromeVisible ? "is-visible" : "is-hidden"}`}
                  aria-hidden={!readerChromeVisible}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("index");
                      setReadingMode(false);
                      setReaderChromeVisible(false);
                      setControlsOpen(false);
                    }}
                    className="quran-reading-top-button quran-reading-nav-button"
                    aria-label="العودة إلى الفهرس"
                  >
                    <BookOpen size={17} />
                    <span className="quran-top-button-label">الفهرس</span>
                  </button>
                  <div className="khatma-reading-meta">
                    <p>سورة {activeSurahNames || "القرآن"}</p>
                    <h2>
                      صفحة {toArabicNumber(activePageNumber)} · الجزء{" "}
                      {toArabicNumber(activeJuz)}
                    </h2>
                    <span>الحزب {toArabicNumber(activeHizb)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openToolbarHelp}
                    className="quran-reading-top-button quran-reading-icon-button"
                    aria-label="شرح أزرار المصحف"
                  >
                    <HelpCircle size={17} />
                    <span className="quran-top-button-label">شرح</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJumpPanel(true)}
                    className="quran-reading-top-button quran-reading-icon-button"
                    aria-label="اذهب إلى صفحة"
                  >
                    <Hash size={17} />
                    <span className="quran-top-button-label">صفحة</span>
                  </button>
                  <button
                    type="button"
                    onClick={togglePageTafsirPanel}
                    className="quran-reading-top-button quran-reading-icon-button"
                    aria-label="تفسير الصفحة"
                  >
                    <BookOpen size={17} />
                    <span className="quran-top-button-label">
                      {showPageText || mushafImageError ? "إخفاء" : "تفسير"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={saveCurrentMushafPage}
                    className="quran-reading-top-button quran-reading-bookmark-button quran-reading-icon-button"
                    aria-label="حفظ الموضع الحالي"
                  >
                    <BookmarkCheck size={18} />
                    <span className="quran-top-button-label">حفظ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReadingMode(false);
                      setReaderChromeVisible(false);
                    }}
                    className="quran-reading-top-button quran-reading-icon-button"
                    aria-label="الخروج من وضع القراءة"
                  >
                    <Minimize2 size={17} />
                    <span className="quran-top-button-label">خروج</span>
                  </button>
                </div>
              )}
              {readingMode && readerChromeVisible && showToolbarTip && (
                <div className="quran-toolbar-first-tip" role="status">
                  <p>اضغط على الصفحة لإظهار أو إخفاء الشريط.</p>
                  <div>
                    <button type="button" onClick={markToolbarHelpSeen}>
                      فهمت
                    </button>
                    <button type="button" onClick={openToolbarHelp}>
                      شرح الأزرار
                    </button>
                  </div>
                </div>
              )}
              <div
                className={`real-mushaf-toolbar ${readingMode ? "reading-mode-hidden" : ""}`}
              >
                <button
                  onClick={prev}
                  className="real-mushaf-nav-button"
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="min-w-0 text-center">
                  <p className="text-xs font-black text-[#987a35]">
                    مصحف المدينة — رواية حفص
                  </p>
                  <h2 className="truncate text-base font-black text-[#315339] md:text-xl">
                    صفحة {toArabicNumber(activePageNumber)} · سورة{" "}
                    {activeSurahNames}
                  </h2>
                </div>
                <button
                  onClick={next}
                  className="real-mushaf-nav-button"
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              <div
                className={`madina-page-top-meta real-mushaf-meta ${readingMode ? "reading-mode-hidden" : ""}`}
                aria-label="بيانات صفحة مصحف المدينة النبوية"
              >
                <span>
                  الجزء <b>{toArabicNumber(activeJuz)}</b>
                </span>
                <span>سورة {activeSurahNames}</span>
                <span>
                  الحزب <b>{toArabicNumber(activeHizb)}</b>
                </span>
              </div>

              <div
                className="real-mushaf-page-shell real-mushaf-scroll-shell"
                onClick={handleReadingSurfaceTap}
              >
                {!mushafImageError ? (
                  <div
                    ref={mushafScrollRef}
                    onScroll={handleMushafScroll}
                    className="real-mushaf-scroll-snap"
                    dir="rtl"
                    aria-label="تقليب صفحات المصحف"
                  >
                    {mushafPages.map((page) => {
                      const sourceIndex = mushafImageSourceIndexes[page] || 0;
                      const isNearCurrent =
                        Math.abs(page - activePageNumber) <= 1;

                      return (
                        <div
                          key={page}
                          id={`mushaf-page-slide-${page}`}
                          data-mushaf-page={page}
                          className="real-mushaf-snap-slide"
                          aria-label={`صفحة ${page}`}
                        >
                          <img
                            key={`${page}-${sourceIndex}`}
                            src={mushafPageImageUrl(page, sourceIndex)}
                            alt={`صفحة ${page} من مصحف المدينة النبوية`}
                            className="real-mushaf-page-image"
                            loading={isNearCurrent ? "eager" : "lazy"}
                            decoding="async"
                            draggable={false}
                            onLoad={() => {
                              if (page === activePageNumber)
                                setMushafImageError(false);
                            }}
                            onError={() => {
                              const nextSourceIndex = sourceIndex + 1;
                              if (
                                nextSourceIndex <
                                mushafPageImageUrls(page).length
                              ) {
                                setMushafImageSourceIndexes((prev) => ({
                                  ...prev,
                                  [page]: nextSourceIndex,
                                }));
                              } else if (page === activePageNumber) {
                                setMushafImageError(true);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="real-mushaf-image-fallback">
                    <p className="text-lg font-black text-amber-800">
                      تعذر تحميل صورة صفحة المصحف.
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-600">
                      جرّب الضغط على “إعادة تحميل الصورة”، أو اعرض آيات الصفحة
                      مؤقتًا.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMushafImageError(false);
                          setMushafImageSourceIndexes((prev) => ({
                            ...prev,
                            [activePageNumber]: 0,
                          }));
                        }}
                        className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white"
                      >
                        إعادة تحميل الصورة
                      </button>
                      <a
                        href={remoteMushafPageImageUrl(activePageNumber)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#315339] ring-1 ring-[#dfc688]/60"
                      >
                        فتح الصورة مباشرة
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`real-mushaf-footer ${readingMode ? "reading-mode-hidden" : ""}`}
              >
                <button onClick={prev} className="real-mushaf-soft-button">
                  <ChevronRight size={17} />
                  الصفحة السابقة
                </button>
                <span className="real-mushaf-page-number">
                  {toArabicNumber(activePageNumber)}
                </span>
                <button onClick={next} className="real-mushaf-soft-button">
                  الصفحة التالية
                  <ChevronLeft size={17} />
                </button>
              </div>

              {!readingMode && (
                <div className="mt-4 grid grid-cols-2 gap-2 md:mt-5 md:grid-cols-5">
                  <button
                    type="button"
                    onClick={() => {
                      setReadingMode(true);
                      setReaderChromeVisible(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#315339] px-4 py-2 text-sm font-black text-white shadow-sm"
                  >
                    <Maximize2 size={17} />
                    وضع القراءة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJumpPanel(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#315339] shadow-sm ring-1 ring-[#dfc688]/60"
                  >
                    <Hash size={17} />
                    اذهب لصفحة
                  </button>
                  <button
                    type="button"
                    onClick={togglePageTafsirPanel}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#315339] shadow-sm ring-1 ring-[#dfc688]/60"
                  >
                    <BookOpen size={17} />
                    {showPageText || mushafImageError
                      ? "إخفاء التفسير"
                      : "تفسير الصفحة"}
                  </button>
                  <button
                    onClick={saveCurrentMushafPage}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 font-black text-white"
                  >
                    <BookmarkCheck size={17} />
                    حفظ الموضع
                  </button>
                  <ShareCardButton
                    title={title()}
                    text={groupText}
                    subtitle="من المصحف الشريف"
                  />
                </div>
              )}

              {(showPageText || mushafImageError) && (
                <div className="interactive-page-text mt-5 rounded-[1.65rem] border border-[#e3c889]/60 bg-white/95 p-4 text-right shadow-inner md:p-6 dark:border-white/10 dark:bg-slate-950/70">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#987a35] dark:text-[#efdcb6]">
                        تفسير آيات الصفحة
                      </p>
                      <h3 className="mt-1 text-2xl font-black text-[#315339] dark:text-[#f7edda]">
                        صفحة {toArabicNumber(activePageNumber)} — سورة{" "}
                        {activeSurahNames}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#fff8e8] px-4 py-2 text-xs font-black text-[#7b6431] ring-1 ring-[#dfc688]/60 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                      اختر الآية لعرض تفسيرها
                    </span>
                  </div>

                  {groupAyahs.length ? (
                    <div className="grid gap-3">
                      {groupAyahs.map((ayah) => (
                        <button
                          key={ayah.number}
                          type="button"
                          onClick={() => openTafsir(ayah, ayah.text)}
                          className="group rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] p-4 text-right transition hover:-translate-y-0.5 hover:border-[#b5954d] hover:bg-[#fff8e8] hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#7b6431] ring-1 ring-[#dfc688]/60 dark:bg-slate-900 dark:text-[#efdcb6] dark:ring-white/10">
                              آية {toArabicNumber(ayah.numberInSurah)}
                            </span>
                            <span className="text-xs font-black text-[#b5954d] opacity-0 transition group-hover:opacity-100">
                              عرض التفسير
                            </span>
                          </div>
                          <p className="quran-text text-xl font-bold leading-[2.1] text-[#24351f] dark:text-[#f7edda] md:text-2xl">
                            {ayah.text}
                            <span className="mx-2 text-[#b5954d]">
                              {ayahMarker(ayah.numberInSurah)}
                            </span>
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#fbf7ef] p-5 text-center text-sm font-black text-[#7b6431] dark:bg-white/5 dark:text-[#efdcb6]">
                      جاري تجهيز آيات هذه الصفحة للتفسير...
                    </div>
                  )}
                </div>
              )}
            </article>
          )}

          {(viewMode === "juz" || viewMode === "hizb") && !loading && (
            <article className="mushaf-page rounded-[2rem] border-4 border-double border-emerald-200 p-5 text-center shadow-inner dark:border-emerald-900 md:p-6 lg:p-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-4 text-right dark:border-emerald-900/60">
                <div>
                  <p className="text-sm font-black text-[#987a35] dark:text-[#efdcb6]">
                    {viewMode === "juz" ? "عرض آيات الجزء" : "عرض آيات الحزب"}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-100 md:text-3xl">
                    {title()}
                  </h2>
                </div>

                <span className="rounded-full bg-[#fff8e8] px-4 py-2 text-xs font-black text-[#7b6431] ring-1 ring-[#dfc688]/60 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                  {toArabicNumber(groupAyahs.length)} آية
                </span>
              </div>

              {groupAyahs.length ? (
                <>
                  <div
                    className="quran-text mushaf-reading-flow text-justify text-slate-950 dark:text-slate-50"
                    style={{ fontSize }}
                  >
                    {groupDisplayTokens.map((token) => {
                      if (token.kind === "surahTitle") {
                        return (
                          <span key={token.key} className="mushaf-surah-title">
                            سورة {token.name}
                          </span>
                        );
                      }

                      if (token.kind === "basmala") {
                        return (
                          <span key={token.key} className="mushaf-basmala">
                            {token.text}
                            {token.marker ? (
                              <span className="mushaf-ayah-marker">
                                {ayahMarker(token.marker)}
                              </span>
                            ) : null}
                          </span>
                        );
                      }

                      return (
                        <span
                          key={token.key}
                          id={`ayah-${token.ayah.numberInSurah}`}
                          className="inline"
                        >
                          {token.text}
                          <button
                            type="button"
                            onClick={() => openTafsir(token.ayah, token.text)}
                            className="mushaf-ayah-marker mushaf-ayah-marker-button"
                            title="عرض التفسير الميسر"
                          >
                            {ayahMarker(token.ayah.numberInSurah)}
                          </button>{" "}
                        </span>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() =>
                        groupAyahs[groupAyahs.length - 1] &&
                        markLast(groupAyahs[groupAyahs.length - 1])
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 font-black text-white"
                    >
                      <BookmarkCheck size={17} />
                      حفظ آخر موضع
                    </button>

                    <ShareCardButton
                      title={title()}
                      text={groupText}
                      subtitle={viewMode === "juz" ? "من الجزء" : "من الحزب"}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-3xl bg-[#fbf7ef] p-6 text-center font-black text-[#7b6431] dark:bg-white/5 dark:text-[#efdcb6]">
                  لم يتم تحميل آيات {viewMode === "juz" ? "الجزء" : "الحزب"}{" "}
                  بعد. جرّب الضغط على تحديث.
                </div>
              )}
            </article>
          )}

          {surah && !loading && viewMode === "surah" && mushafMode && (
            <article
              className="mushaf-page mushaf-mobile-page mushaf-page-turner rounded-[2rem] border-4 border-double border-emerald-200 p-5 text-center shadow-inner dark:border-emerald-900 md:p-6 lg:p-10"
              onTouchStart={(e) =>
                handleTouchStart(
                  e.changedTouches[0]?.clientX ?? 0,
                  e.changedTouches[0]?.clientY ?? 0,
                )
              }
              onTouchEnd={(e) =>
                handleTouchEnd(
                  e.changedTouches[0]?.clientX ?? 0,
                  e.changedTouches[0]?.clientY ?? 0,
                )
              }
            >
              <h2 className="mushaf-surah-heading mb-4 text-2xl font-black text-emerald-900 dark:text-emerald-100 md:text-3xl">
                {surah.name}
              </h2>

              {display.basmala && (
                <p className="quran-text mushaf-basmala mb-6 text-center text-3xl font-bold text-slate-950 dark:text-slate-50">
                  {display.basmala.text}
                  {display.basmala.marker && (
                    <span className="mushaf-ayah-marker">
                      {ayahMarker(display.basmala.marker)}
                    </span>
                  )}
                </p>
              )}

              <p
                className="quran-text mushaf-reading-flow text-justify text-slate-950 dark:text-slate-50"
                style={{ fontSize }}
              >
                {display.ayahs.map((ayah) => (
                  <span
                    key={ayah.number}
                    id={`ayah-${ayah.numberInSurah}`}
                    className="inline"
                  >
                    {ayah.text}
                    <button
                      type="button"
                      onClick={() => openTafsir(ayah, ayah.text)}
                      className="mushaf-ayah-marker mushaf-ayah-marker-button"
                      title="عرض التفسير الميسر"
                    >
                      {ayahMarker(ayah.numberInSurah)}
                    </button>{" "}
                  </span>
                ))}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() =>
                    display.ayahs[display.ayahs.length - 1] &&
                    markLast(display.ayahs[display.ayahs.length - 1])
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 font-black text-white"
                >
                  <BookmarkCheck size={17} />
                  حفظ آخر موضع
                </button>
                <FavoriteButton
                  item={{
                    id: `quran-surah-${surah.number}`,
                    type: "quran",
                    title: `سورة ${surah.name}`,
                    text: `سورة ${surah.name} كاملة`,
                  }}
                />
                <ShareCardButton
                  title={`سورة ${surah.name}`}
                  text={display.ayahs
                    .slice(0, 5)
                    .map((a) => a.text)
                    .join(" ")}
                  subtitle="من المصحف الشريف"
                />
              </div>
            </article>
          )}

          {surah && !loading && viewMode === "surah" && !mushafMode && (
            <div className="space-y-4">
              {display.basmala && (
                <article className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="quran-text text-3xl font-bold text-slate-950 dark:text-slate-50">
                    {display.basmala.text}
                    {display.basmala.marker && (
                      <span className="mx-3 inline-grid h-9 w-9 place-items-center rounded-full border border-emerald-200 bg-white text-base font-black text-emerald-700 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300">
                        {display.basmala.marker}
                      </span>
                    )}
                  </p>
                </article>
              )}

              {display.ayahs.map((ayah) => (
                <article
                  id={`ayah-${ayah.numberInSurah}`}
                  key={ayah.number}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <p
                    className="quran-text text-slate-950 dark:text-slate-50"
                    style={{ fontSize }}
                  >
                    {ayah.text}
                    <button
                      type="button"
                      onClick={() => openTafsir(ayah, ayah.text)}
                      className="mx-3 inline-grid h-9 w-9 place-items-center rounded-full border border-emerald-200 bg-white text-base font-black text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300"
                      title="عرض التفسير الميسر"
                    >
                      {ayah.numberInSurah}
                    </button>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <p className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400">
                      الجزء {ayah.juz} · صفحة {ayah.page}
                    </p>
                    <button
                      onClick={() => markLast(ayah)}
                      className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white"
                    >
                      حفظ الموضع
                    </button>
                    <FavoriteButton
                      item={{
                        id: `quran-${surah.number}-${ayah.numberInSurah}`,
                        type: "quran",
                        title: `${surah.name} — آية ${ayah.numberInSurah}`,
                        text: ayah.text,
                      }}
                    />
                    <ShareCardButton
                      title={`${surah.name} — آية ${ayah.numberInSurah}`}
                      text={ayah.text}
                      subtitle="من المصحف الشريف"
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {tafsirSheet && (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/70 p-3 backdrop-blur-sm md:place-items-center md:p-6">
          <article className="w-full max-w-3xl rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <BookOpen size={15} />
                  التفسير الميسر
                </span>
                <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                  {tafsirSheet.ayah.surah?.name ||
                    surah?.name ||
                    selectedChapter?.name}{" "}
                  — آية {tafsirSheet.ayah.numberInSurah}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTafsirSheet(null)}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70dvh] overflow-y-auto pr-1">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="quran-text text-2xl font-bold leading-[2.1] text-slate-950 dark:text-white">
                  {tafsirSheet.text}
                </p>
              </div>

              {tafsirSheet.loading && (
                <div className="mt-4 rounded-3xl bg-slate-50 p-5 text-center font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  جاري تحميل التفسير الميسر...
                </div>
              )}

              {tafsirSheet.error && (
                <div className="mt-4 rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">
                  {tafsirSheet.error}
                </div>
              )}

              {normalizedTafsir && !tafsirSheet.loading && (
                <div className="mt-4 rounded-3xl bg-slate-50 p-5 dark:bg-slate-950">
                  {normalizedTafsir.tafsirText ? (
                    <p className="text-xl font-bold leading-10 text-slate-800 dark:text-slate-100">
                      {normalizedTafsir.tafsirText}
                    </p>
                  ) : (
                    <p className="font-bold leading-8 text-amber-700 dark:text-amber-200">
                      لم يتم العثور على تفسير لهذه الآية.
                    </p>
                  )}

                  {normalizedTafsir.footnotes && (
                    <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {normalizedTafsir.footnotes}
                    </p>
                  )}

                </div>
              )}
            </div>
          </article>
        </div>
      )}

      {showToolbarHelp && (
        <div
          className="quran-toolbar-help-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="شرح أزرار المصحف"
        >
          <div className="quran-toolbar-help-sheet">
            <div className="quran-toolbar-help-header">
              <div>
                <p>شريط المصحف</p>
                <h2>شرح الأزرار</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowToolbarHelp(false)}
                aria-label="إغلاق الشرح"
              >
                <X size={18} />
              </button>
            </div>
            <div className="quran-toolbar-help-list">
              <div><strong>الفهرس</strong><span>الرجوع لقائمة السور.</span></div>
              <div><strong>شرح</strong><span>عرض معنى أزرار الشريط.</span></div>
              <div><strong>صفحة</strong><span>الانتقال إلى رقم صفحة.</span></div>
              <div><strong>تفسير</strong><span>عرض تفسير آيات الصفحة.</span></div>
              <div><strong>حفظ</strong><span>حفظ موضعك الحالي.</span></div>
              <div><strong>خروج</strong><span>العودة للعرض العادي.</span></div>
            </div>
            <p className="quran-toolbar-help-note">
              اضغط على صفحة المصحف لإظهار الشريط أو إخفائه.
            </p>
          </div>
        </div>
      )}

      <div
        className={`rifq-save-toast ${saveToast ? "is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <BookmarkCheck size={17} />
        <span>{saveToast}</span>
      </div>

      {showJumpPanel && (
        <div className="fixed inset-0 z-[100] grid place-items-end bg-slate-950/65 p-3 backdrop-blur-sm md:place-items-center md:p-6">
          <form
            onSubmit={submitJumpToPage}
            className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#987a35] dark:text-[#efdcb6]">
                  انتقال سريع
                </p>
                <h3 className="text-2xl font-black text-[#315339] dark:text-[#f7edda]">
                  اذهب إلى صفحة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJumpPanel(false)}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <input
              type="number"
              min={1}
              max={604}
              value={jumpPageInput}
              onChange={(event) => setJumpPageInput(event.target.value)}
              placeholder="رقم الصفحة من 1 إلى 604"
              className="w-full rounded-2xl border border-[#d8c094]/55 bg-[#fbf7ef] px-4 py-3 text-center text-xl font-black text-[#315339] outline-none focus:border-[#3f5638] dark:border-white/10 dark:bg-slate-950 dark:text-[#f7edda]"
              autoFocus
            />
            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-[#315339] px-5 py-3 font-black text-white"
            >
              فتح الصفحة
            </button>
          </form>
        </div>
      )}

      {viewMode !== "index" && !readingMode && (
        <div className="mushaf-mobile-fixed-nav md:hidden">
          <button
            onClick={prev}
            className="inline-flex items-center justify-center gap-1 rounded-2xl bg-white px-3 py-3 text-xs font-black text-slate-800 shadow-lg ring-1 ring-emerald-100 dark:bg-slate-900 dark:text-slate-100 dark:ring-emerald-900/60"
          >
            <ChevronRight size={16} />
            السابق
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("index");
              setControlsOpen(false);
              if (typeof window !== "undefined")
                window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-1 rounded-2xl bg-[#fff8e8] px-3 py-3 text-xs font-black text-[#315339] shadow-lg ring-1 ring-[#dfc688]/70 dark:bg-slate-900 dark:text-slate-100"
          >
            <BookOpen size={16} />
            الفهرس
          </button>
          <button
            onClick={next}
            className="inline-flex items-center justify-center gap-1 rounded-2xl bg-emerald-700 px-3 py-3 text-xs font-black text-white shadow-lg"
          >
            التالي
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
