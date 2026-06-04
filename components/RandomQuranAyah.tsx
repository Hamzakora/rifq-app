"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, RefreshCw } from "lucide-react";

type Chapter = {
  number: number;
  name: string;
  numberOfAyahs: number;
};

type QuranAyah = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
};

type ApiAyah = {
  text: string;
  numberInSurah: number;
};

type Props = {
  variant?: "card" | "phone";
};

const LAST_RANDOM_SURAH_KEY = "rifq-last-random-surah";

const FALLBACK_AYAHS: QuranAyah[] = [
  {
    surahNumber: 1,
    surahName: "الفاتحة",
    ayahNumber: 1,
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
  },
  {
    surahNumber: 94,
    surahName: "الشرح",
    ayahNumber: 5,
    text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا"
  },
  {
    surahNumber: 94,
    surahName: "الشرح",
    ayahNumber: 6,
    text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا"
  },
  {
    surahNumber: 93,
    surahName: "الضحى",
    ayahNumber: 5,
    text: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ"
  },
  {
    surahNumber: 112,
    surahName: "الإخلاص",
    ayahNumber: 1,
    text: "قُلْ هُوَ اللَّهُ أَحَدٌ"
  },
  {
    surahNumber: 113,
    surahName: "الفلق",
    ayahNumber: 1,
    text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ"
  },
  {
    surahNumber: 114,
    surahName: "الناس",
    ayahNumber: 1,
    text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ"
  }
];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickDifferentChapter(chapters: Chapter[]) {
  const lastSurah = typeof window !== "undefined" ? Number(localStorage.getItem(LAST_RANDOM_SURAH_KEY) || "0") : 0;
  const available = chapters.filter((chapter) => chapter.number !== lastSurah);
  return randomItem(available.length ? available : chapters);
}

function pickFallbackAyah() {
  const lastSurah = typeof window !== "undefined" ? Number(localStorage.getItem(LAST_RANDOM_SURAH_KEY) || "0") : 0;
  const available = FALLBACK_AYAHS.filter((ayah) => ayah.surahNumber !== lastSurah);
  return randomItem(available.length ? available : FALLBACK_AYAHS);
}

export function RandomQuranAyah({ variant = "card" }: Props) {
  const [ayah, setAyah] = useState<QuranAyah | null>(null);
  const [loading, setLoading] = useState(true);

  const quranLink = useMemo(() => {
    if (!ayah) return "/quran";
    return `/quran?chapter=${ayah.surahNumber}`;
  }, [ayah]);

  async function loadRandomAyah() {
    setLoading(true);

    try {
      const chaptersResponse = await fetch(`/api/quran/chapters?ts=${Date.now()}`, { cache: "no-store" });
      if (!chaptersResponse.ok) throw new Error("تعذر تحميل فهرس السور.");

      const chaptersJson = await chaptersResponse.json();
      const chapters: Chapter[] = Array.isArray(chaptersJson?.data) ? chaptersJson.data : [];
      if (!chapters.length) throw new Error("فهرس السور غير متاح.");

      const chapter = pickDifferentChapter(chapters);
      const surahResponse = await fetch(`/api/quran/verses?chapter=${chapter.number}&edition=quran-uthmani&ts=${Date.now()}`, { cache: "no-store" });
      if (!surahResponse.ok) throw new Error("تعذر تحميل السورة.");

      const surahJson = await surahResponse.json();
      const ayahs: ApiAyah[] = Array.isArray(surahJson?.data?.ayahs) ? surahJson.data.ayahs : [];
      const allValidAyahs = ayahs.filter((item) => item.text && Number.isFinite(item.numberInSurah));
      const maxLength = variant === "phone" ? 180 : 360;
      const validAyahs = allValidAyahs.filter((item) => item.text.length <= maxLength);
      const displayAyahs = validAyahs.length ? validAyahs : allValidAyahs;
      if (!displayAyahs.length) throw new Error("السورة لا تحتوي على آيات قابلة للعرض.");

      const selected = randomItem(displayAyahs);
      const nextAyah: QuranAyah = {
        surahNumber: chapter.number,
        surahName: surahJson?.data?.name || chapter.name,
        ayahNumber: selected.numberInSurah,
        text: selected.text
      };

      localStorage.setItem(LAST_RANDOM_SURAH_KEY, String(nextAyah.surahNumber));
      setAyah(nextAyah);
    } catch {
      const fallback = pickFallbackAyah();
      localStorage.setItem(LAST_RANDOM_SURAH_KEY, String(fallback.surahNumber));
      setAyah(fallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRandomAyah();
  }, []);

  if (variant === "phone") {
    return (
      <div className="min-h-[162px]">
        <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-black text-[#b5954d]">
          <BookOpen size={13} />
          <span>{ayah ? `آية من سورة ${ayah.surahName}` : "آية قرآنية"}</span>
        </div>
        <p className="text-[13px] font-black leading-8 text-[#3f5638] dark:text-[#f7edda]">
          {loading || !ayah ? "جاري تحميل آية من القرآن الكريم..." : ayah.text}
        </p>
        {ayah ? (
          <p className="mt-2 text-[11px] font-black text-[#7f6a39] dark:text-[#efdcb6]">
            سورة {ayah.surahName} — الآية {ayah.ayahNumber}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#d8c094]/35 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
      <div className="grid gap-0 lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative p-5 lg:p-7">
          <div className="pointer-events-none absolute inset-0 rifq-pattern-bg opacity-35" />
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c094]/45 bg-[#fbf7ef]/80 px-4 py-2 text-sm font-black text-[#3f5638] dark:border-white/10 dark:bg-white/10 dark:text-[#f7edda]">
                <BookOpen size={16} className="text-[#b5954d]" />
                آية اليوم
              </span>
              <button
                type="button"
                onClick={loadRandomAyah}
                className="inline-flex items-center gap-2 rounded-full border border-[#c8a960]/55 bg-white/70 px-4 py-2 text-sm font-black text-[#7f6a39] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:text-[#efdcb6]"
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                آية أخرى
              </button>
            </div>

            <h2 className="text-2xl font-black text-[#3f5638] dark:text-[#f7edda]">
              {ayah ? `سورة ${ayah.surahName}` : "آية من القرآن الكريم"}
            </h2>
            <p className="mt-4 rounded-[1.5rem] border border-[#d8c094]/30 bg-[#fbf7ef]/70 p-5 text-center text-2xl font-black leading-[2.15] text-[#24351f] shadow-inner dark:border-white/10 dark:bg-[#101c13] dark:text-[#f7edda]">
              {loading || !ayah ? "جاري تحميل آية من القرآن الكريم..." : ayah.text}
              {ayah ? <span className="mx-2 inline-flex text-[#b5954d]">﴿{ayah.ayahNumber}﴾</span> : null}
            </p>
          </div>
        </div>

        <div className="border-t border-[#d8c094]/25 bg-[#fbf7ef]/75 p-5 dark:border-white/10 dark:bg-[#101c13]/70 lg:border-r lg:border-t-0 lg:p-7">
          <p className="text-sm font-black text-[#b5954d]">تدبر قصير</p>
          <h3 className="mt-2 text-xl font-black text-[#3f5638] dark:text-[#f7edda]">آية تتغير عند فتح التطبيق</h3>
          <p className="mt-3 text-sm font-bold leading-8 text-[#746a58] dark:text-[#d8cfc0]">
            افتح السورة واقرأ الآيات في المصحف مباشرة.
          </p>
          <Link href={quranLink} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#3f5638] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#3f5638]/20 transition hover:-translate-y-0.5 hover:bg-[#31422b]">
            فتح السورة في المصحف
            <ChevronLeft size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
