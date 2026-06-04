"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, Flame, Headphones, Heart, LineChart, RotateCcw, Sparkles } from "lucide-react";
import { ACTIVITY_EVENT, readActivity } from "@/lib/client/activityStore";

type LastRead = {
  chapter: number;
  chapterName: string;
  ayah: number;
  page?: number;
  savedAt: string;
};

type Plan = {
  days: number;
  startDate: string;
  completedPages: number[];
  logs?: Record<string, number[]>;
};

type DashboardState = {
  favoriteCount: number;
  readPagesCount: number;
  weeklyPages: number;
  listeningSeconds: number;
  listenSessions: number;
  streak: number;
  progress: number;
  lastRead: LastRead | null;
  lastAction: string;
  hasAnyActivity: boolean;
};

const FAVORITES_KEY = "qawra-favorites-v1";
const LAST_READ_KEY = "qawra-last-read-v1";
const KHATMA_KEY = "qawra-khatma-plan-v1";

function emptyState(): DashboardState {
  return {
    favoriteCount: 0,
    readPagesCount: 0,
    weeklyPages: 0,
    listeningSeconds: 0,
    listenSessions: 0,
    streak: 0,
    progress: 0,
    lastRead: null,
    lastAction: "ابدأ بالقراءة أو الاستماع لتظهر إحصائياتك هنا مباشرة.",
    hasAnyActivity: false
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isActiveDay(day?: { readPages?: number[]; readAyahs?: string[]; listeningSeconds?: number; actions?: number }) {
  if (!day) return false;
  return Boolean((day.readPages?.length || 0) > 0 || (day.readAyahs?.length || 0) > 0 || (day.listeningSeconds || 0) >= 30 || (day.actions || 0) > 0);
}

function calculateActivityStreak(daily: ReturnType<typeof readActivity>["daily"], plan?: Plan | null) {
  let streak = 0;
  const date = new Date();

  for (;;) {
    const key = localDateKey(date);
    const hasActivity = isActiveDay(daily[key]) || Boolean(plan?.logs?.[key]?.length);
    if (!hasActivity) break;
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function calculateWeeklyPages(daily: ReturnType<typeof readActivity>["daily"], plan?: Plan | null) {
  const date = new Date();
  let total = 0;

  for (let i = 0; i < 7; i += 1) {
    const key = localDateKey(date);
    const activityPages = daily[key]?.readPages?.length || 0;
    const planPages = plan?.logs?.[key]?.length || 0;
    total += Math.max(activityPages, planPages);
    date.setDate(date.getDate() - 1);
  }

  return total;
}

function formatListenTime(seconds: number) {
  if (seconds < 60) return "0 د";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} س ${rest} د` : `${hours} س`;
}

function buildDashboardState(): DashboardState {
  if (typeof window === "undefined") return emptyState();

  const activity = readActivity();
  const favorites = readJson<any[]>(FAVORITES_KEY, []);
  const lastRead = readJson<LastRead | null>(LAST_READ_KEY, null);
  const plan = readJson<Plan | null>(KHATMA_KEY, null);

  const completedPlanPages = Array.isArray(plan?.completedPages) ? plan.completedPages : [];
  const allReadPages = new Set<number>([...activity.readPages, ...completedPlanPages]);
  const readPagesCount = allReadPages.size;
  const progress = Math.min(100, Math.round((readPagesCount / 604) * 100));
  const streak = calculateActivityStreak(activity.daily, plan);
  const weeklyPages = calculateWeeklyPages(activity.daily, plan);

  const lastAction = activity.lastAction?.label
    || (lastRead ? `آخر قراءة: سورة ${lastRead.chapterName} — آية ${lastRead.ayah}${lastRead.page ? ` — صفحة ${lastRead.page}` : ""}` : emptyState().lastAction);

  return {
    favoriteCount: Array.isArray(favorites) ? favorites.length : 0,
    readPagesCount,
    weeklyPages,
    listeningSeconds: activity.listeningSeconds,
    listenSessions: activity.listenSessions,
    streak,
    progress,
    lastRead,
    lastAction,
    hasAnyActivity: Boolean(readPagesCount || favorites.length || activity.listeningSeconds || streak || lastRead)
  };
}

export function ActivityDashboard() {
  const [state, setState] = useState<DashboardState>(() => emptyState());

  useEffect(() => {
    function sync() {
      setState(buildDashboardState());
    }

    sync();
    window.addEventListener(ACTIVITY_EVENT, sync);
    window.addEventListener("qawra-favorites-change", sync);
    window.addEventListener("qawra-last-read-change", sync);
    window.addEventListener("qawra-khatma-change", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(ACTIVITY_EVENT, sync);
      window.removeEventListener("qawra-favorites-change", sync);
      window.removeEventListener("qawra-last-read-change", sync);
      window.removeEventListener("qawra-khatma-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const cards = useMemo(
    () => [
      { label: "صفحات قرأتها", value: String(state.readPagesCount), detail: `هذا الأسبوع: ${state.weeklyPages}`, icon: BookOpen, href: "/quran" },
      { label: "المفضلة", value: String(state.favoriteCount), detail: "آيات وأذكار محفوظة", icon: Heart, href: "/favorites" },
      { label: "وقت الاستماع", value: formatListenTime(state.listeningSeconds), detail: `${state.listenSessions} جلسة تشغيل`, icon: Headphones, href: "/audio" },
      { label: "أيام متتالية", value: String(state.streak), detail: "قراءة أو استماع يومي", icon: Flame, href: "/khatma" }
    ],
    [state]
  );

  const resumeHref = state.lastRead?.page
    ? `/quran?page=${state.lastRead.page}`
    : state.lastRead
      ? `/quran?chapter=${state.lastRead.chapter}&ayah=${state.lastRead.ayah}`
      : "/quran";

  return (
    <section className="rounded-[2rem] border border-[#d8c094]/35 bg-white/65 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] lg:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black text-[#b5954d]">
            <LineChart size={17} />
            نشاطك
          </p>
          <h2 className="mt-1 text-3xl font-black text-[#3f5638] dark:text-[#f7edda]">
            متابعة بسيطة للقراءة والاستماع
          </h2>
        </div>
        <Link href={resumeHref} className="inline-flex items-center gap-2 rounded-full border border-[#c8a960]/55 bg-white/70 px-4 py-2.5 text-sm font-black text-[#7f6a39] transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-[#efdcb6]">
          <RotateCcw size={16} />
          استكمال آخر نشاط
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr] lg:items-stretch">
        <div className="rounded-[1.5rem] border border-[#d8c094]/35 bg-[#fbf7ef] p-5 dark:border-white/10 dark:bg-[#101c13]">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#3f5638] text-white shadow-lg shadow-[#3f5638]/15">
              <Sparkles size={24} />
            </span>
            <div>
              <p className="text-sm font-black text-[#b5954d]">آخر تفاعل داخل رِفْق</p>
              <h3 className="mt-1 text-xl font-black leading-8 text-[#3f5638] dark:text-[#f7edda]">
                {state.lastAction}
              </h3>
              <p className="mt-2 text-sm font-bold leading-7 text-[#746a58] dark:text-[#d8cfc0]">
                {state.hasAnyActivity
                  ? "تظهر هنا قراءتك واستماعك ومحفوظاتك."
                  : "ابدأ بفتح المصحف أو تشغيل التلاوة."}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-[#746a58] dark:text-[#d8cfc0]">
              <span>تقدم القراءة من المصحف</span>
              <span>{state.progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#eadfca] dark:bg-white/10">
              <span className="block h-full rounded-full bg-[#3f5638] transition-all duration-500" style={{ width: `${state.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href} className="group rounded-[1.5rem] border border-[#d8c094]/30 bg-white/70 p-4 text-center transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5">
                <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] text-[#b5954d] transition group-hover:scale-110 dark:bg-white/10">
                  <Icon size={22} />
                </span>
                <p className="text-2xl font-black text-[#3f5638] dark:text-[#f7edda] md:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs font-black text-[#746a58] dark:text-[#d8cfc0]">{stat.label}</p>
                <p className="mt-2 text-[11px] font-bold leading-5 text-[#8b806f] dark:text-[#cbbfae]">{stat.detail}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
