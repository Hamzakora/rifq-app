"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Eye, WifiOff } from "lucide-react";
import {
  getHadithCategoriesOfflineFirst,
  getHadithsByCategoryOfflineFirst,
  type HadithCategory,
  type HadithListItem
} from "@/lib/client/offlineHadith";

type HadithListResult = Awaited<ReturnType<typeof getHadithsByCategoryOfflineFirst>>;

function findList(data: unknown): HadithListItem[] {
  if (Array.isArray(data)) return data as HadithListItem[];
  if (typeof data === "object" && data !== null && Array.isArray((data as { data?: unknown }).data)) return (data as { data: HadithListItem[] }).data;
  if (typeof data === "object" && data !== null && Array.isArray((data as { results?: unknown }).results)) return (data as { results: HadithListItem[] }).results;
  return [];
}

function getTitle(item: HadithListItem) {
  return item.title || item.hadeeth_title || "حديث";
}

function getId(item: HadithListItem) {
  return item.id || item.hadeeth_id;
}

function normalizePositiveNumber(value: string | number | null | undefined, fallback: number) {
  const next = Number(value);
  return Number.isInteger(next) && next > 0 ? next : fallback;
}

function readInitialState() {
  if (typeof window === "undefined") return { categoryId: 1, page: 1 };
  const params = new URLSearchParams(window.location.search);
  return {
    categoryId: normalizePositiveNumber(params.get("categoryId"), 1),
    page: normalizePositiveNumber(params.get("page"), 1)
  };
}

export function HadithSearch() {
  const router = useRouter();
  const [categories, setCategories] = useState<HadithCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<HadithListResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === categoryId),
    [categories, categoryId]
  );

  async function loadHadiths(nextPage = page, nextCategoryId = categoryId, updateUrl = true) {
    setLoading(true);
    setError("");

    try {
      const json = await getHadithsByCategoryOfflineFirst({ categoryId: nextCategoryId, page: nextPage, perPage: 20 });
      setResult(json);
      setPage(nextPage);
      setCategoryId(nextCategoryId);
      if (updateUrl) router.replace(`/hadith?categoryId=${nextCategoryId}&page=${nextPage}`, { scroll: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setError("");
      try {
        const initial = readInitialState();
        const json = await getHadithCategoriesOfflineFirst();
        const data: HadithCategory[] = Array.isArray(json.data) ? json.data : [];
        if (cancelled) return;

        const firstCategory = data[0]?.id || 1;
        const nextCategoryId = data.some((item: HadithCategory) => item.id === initial.categoryId) ? initial.categoryId : firstCategory;
        const nextPage = initial.page;

        setCategories(data);
        setCategoryId(nextCategoryId);
        setPage(nextPage);
        setReady(true);
        await loadHadiths(nextPage, nextCategoryId, false);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "خطأ غير معروف");
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = findList(result?.data);
  const total = Number(result?.data?.total || rows.length || 0);
  const perPage = Number(result?.data?.per_page || 20);
  const hasNext = total ? page * perPage < total : rows.length >= perPage;

  return (
    <div className="space-y-5">
      <div className="qawra-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="qawra-title">الأحاديث النبوية</h1>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
              اختر التصنيف وافتح الحديث في صفحة مستقلة.
            </p>
          </div>
          {result?.meta?.offline && (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-100 dark:ring-emerald-900/50">
              <WifiOff size={16} />
              متاح دون اتصال
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            value={categoryId}
            onChange={(e) => {
              const nextCategoryId = Number(e.target.value);
              setCategoryId(nextCategoryId);
              setResult(null);
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none dark:border-slate-700 dark:bg-slate-950"
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} {item.hadeeths_count ? `(${item.hadeeths_count})` : ""}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadHadiths(1, categoryId)}
            disabled={!ready || loading || !categories.length}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          >
            <BookOpen size={17} />
            عرض أحاديث التصنيف
          </button>
        </div>

        {selectedCategory && (
          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            التصنيف الحالي: {selectedCategory.title}
          </p>
        )}
      </div>

      {loading && <div className="rounded-3xl bg-white p-6 font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">جاري التحميل...</div>}
      {error && <div className="rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</div>}

      {result && (
        <div className="space-y-3">
          {!rows.length && (
            <div className="rounded-3xl bg-white p-6 text-center font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              لا توجد أحاديث محفوظة في هذا التصنيف.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((item, idx) => {
              const id = Number(getId(item));
              const title = getTitle(item);
              return (
                <Link
                  key={id || idx}
                  href={id ? `/hadith/detail?id=${id}&categoryId=${categoryId}&page=${page}` : `/hadith?categoryId=${categoryId}&page=${page}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-emerald-950/20"
                >
                  <p className="font-black leading-8 text-slate-950 dark:text-white">{title}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {id ? <p className="text-xs font-bold text-slate-500 dark:text-slate-400">حديث رقم {id}</p> : <span />}
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white transition group-hover:bg-emerald-800">
                      <Eye size={14} />
                      قراءة الحديث
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <button
              disabled={page <= 1 || loading}
              onClick={() => loadHadiths(Math.max(1, page - 1), categoryId)}
              className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black disabled:opacity-40 dark:bg-slate-800"
            >
              <ChevronRight size={17} />
              السابق
            </button>

            <span className="font-black text-slate-600 dark:text-slate-300">صفحة {page}</span>

            <button
              disabled={!hasNext || loading}
              onClick={() => loadHadiths(page + 1, categoryId)}
              className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black disabled:opacity-40 dark:bg-slate-800"
            >
              التالي
              <ChevronLeft size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
