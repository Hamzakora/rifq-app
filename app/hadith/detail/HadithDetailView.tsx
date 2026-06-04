"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Copy, RotateCcw, Share2 } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { getHadithByIdOfflineFirst } from "@/lib/client/offlineHadith";

type HadithResponse = {
  data?: any;
  meta?: {
    sourceName?: string;
    fetchedAt?: string;
  };
};

function hadithTitle(full: any) {
  return full?.title || full?.hadeeth_title || "نص الحديث";
}

function hadithText(full: any) {
  return full?.hadeeth || full?.text || full?.body || "";
}

function normalizeId(value: string | null) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function HadithDetailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = normalizeId(searchParams.get("id"));
  const fromCategoryId = normalizeId(searchParams.get("categoryId"));
  const fromPage = normalizeId(searchParams.get("page"));
  const backHref = fromCategoryId ? `/hadith?categoryId=${fromCategoryId}&page=${fromPage || 1}` : "/hadith";

  const [result, setResult] = useState<HadithResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHadith() {
      if (!id) {
        setLoading(false);
        setError("رقم الحديث غير صحيح.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const json = await getHadithByIdOfflineFirst(id);
        if (!cancelled) setResult(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "تعذر تحميل الحديث.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHadith();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const full = result?.data;
  const title = hadithTitle(full);
  const text = hadithText(full);

  const shareText = useMemo(() => {
    const parts = [title, text, full?.attribution ? `العزو: ${full.attribution}` : "", full?.grade ? `الدرجة: ${full.grade}` : ""].filter(Boolean);
    return parts.join("\n\n");
  }, [full, text, title]);

  function goBack() {
    router.push(backHref);
  }

  async function copyHadith() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function shareHadith() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text: shareText });
        return;
      } catch {
      }
    }

    await copyHadith();
  }

  return (
    <div className="space-y-5">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 rounded-2xl border border-[#d8c094]/55 bg-white/85 px-4 py-3 font-black text-[#31452c] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff8ec] dark:border-white/10 dark:bg-white/10 dark:text-[#f7edda] dark:hover:bg-white/15"
      >
        <ArrowRight size={18} />
        رجوع للأحاديث
      </button>

      {loading && <div className="rounded-3xl bg-white p-6 font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">جاري تحميل الحديث...</div>}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-black">{error}</p>
          <button onClick={() => router.push(backHref)} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-red-700 px-4 py-3 font-black text-white">
            <RotateCcw size={16} />
            العودة لقائمة الأحاديث
          </button>
        </div>
      )}

      {!loading && full && (
        <article className="qawra-card overflow-hidden">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-black text-emerald-800 dark:text-emerald-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 dark:bg-emerald-950/30">
              <BookOpen size={16} />
              تفاصيل الحديث
            </span>
          </div>

          <h1 className="text-2xl font-black leading-10 text-slate-950 dark:text-white md:text-3xl">{title}</h1>

          {text && (
            <div className="mt-6 rounded-[2rem] border border-[#d8c094]/40 bg-[#fffaf2] p-5 shadow-inner shadow-[#3f5638]/5 dark:border-white/10 dark:bg-slate-950">
              <p className="text-xl font-black leading-[2.35] text-[#31452c] dark:text-[#f7edda] md:text-2xl">{text}</p>
            </div>
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {full.attribution && (
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-xs font-black text-slate-500 dark:text-slate-400">العزو</p>
                <p className="mt-2 font-black text-slate-800 dark:text-slate-100">{full.attribution}</p>
              </div>
            )}
            {full.grade && (
              <div className="rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-200">الدرجة</p>
                <p className="mt-2 font-black text-emerald-900 dark:text-emerald-50">{full.grade}</p>
              </div>
            )}
          </div>

          {full.explanation && (
            <div className="mt-5 rounded-[2rem] bg-slate-50 p-5 dark:bg-slate-950">
              <h2 className="mb-3 text-lg font-black">الشرح</h2>
              <p className="leading-10 text-slate-700 dark:text-slate-200">{full.explanation}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {text && (
              <FavoriteButton
                item={{
                  id: `hadith-${full.id || full.hadeeth_id || id}`,
                  type: "hadith",
                  title,
                  text,
                }}
              />
            )}
            <button
              onClick={shareHadith}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#3f5638] px-4 py-3 font-black text-white shadow-lg shadow-[#3f5638]/15 transition hover:-translate-y-0.5"
            >
              <Share2 size={17} />
              مشاركة
            </button>
            <button
              onClick={copyHadith}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Copy size={17} />
              {copied ? "تم النسخ" : "نسخ"}
            </button>
          </div>

        </article>
      )}
    </div>
  );
}
