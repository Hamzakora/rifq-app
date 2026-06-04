"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, BookOpen, CheckCircle2, Headphones, Heart, LineChart, ListChecks, RotateCcw, ScrollText, Sparkles, Trophy } from "lucide-react";
import { getFavorites, type FavoriteItem } from "@/components/FavoriteButton";
import { getLastRead } from "@/components/LastReadBox";
import { QURAN_RECITERS } from "@/lib/quran/reciters";
import { readActivity, localDateKey, type ActivityStore } from "@/lib/client/activityStore";
import { notificationStateLabel, readNotificationSettings, getNotificationState, type RifqNotificationState } from "@/lib/client/notificationsStore";

type LastRead = ReturnType<typeof getLastRead>;

type KhatmaPlan = {
  days: number;
  startDate: string;
  completedPages: number[];
  logs?: Record<string, number[]>;
};

type AudioSummary = {
  total: number;
  reciters: { name: string; count: number }[];
};

type ProfileSnapshot = {
  lastRead: LastRead;
  favorites: FavoriteItem[];
  activity: ActivityStore;
  khatma: KhatmaPlan | null;
  audio: AudioSummary;
  notificationsEnabled: boolean;
  notificationState: RifqNotificationState;
};

const KHATMA_KEY = "qawra-khatma-plan-v1";
const TOTAL_PAGES = 604;

function toArabicNumber(value: number | string | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function readKhatmaPlan(): KhatmaPlan | null {
  if (typeof window === "undefined") return null;

  try {
    const plan = JSON.parse(localStorage.getItem(KHATMA_KEY) || "null");
    if (!plan || !Array.isArray(plan.completedPages)) return null;
    return plan;
  } catch {
    return null;
  }
}

function readAudioSummary(): AudioSummary {
  if (typeof window === "undefined") return { total: 0, reciters: [] };

  const reciters = QURAN_RECITERS.map((reciter) => {
    try {
      const saved = JSON.parse(localStorage.getItem(`rifq-audio-downloaded-${reciter.edition}`) || "[]");
      const count = Array.isArray(saved) ? saved.map(Number).filter((n) => n >= 1 && n <= 114).length : 0;
      return { name: reciter.name, count };
    } catch {
      return { name: reciter.name, count: 0 };
    }
  }).filter((item) => item.count > 0);

  return {
    total: reciters.reduce((sum, item) => sum + item.count, 0),
    reciters: reciters.sort((a, b) => b.count - a.count)
  };
}

function emptySnapshot(): ProfileSnapshot {
  return {
    lastRead: null,
    favorites: [],
    activity: readActivity(),
    khatma: null,
    audio: { total: 0, reciters: [] },
    notificationsEnabled: false,
    notificationState: "default"
  };
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${toArabicNumber(minutes)} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${toArabicNumber(hours)} س ${toArabicNumber(rest)} د` : `${toArabicNumber(hours)} ساعة`;
}

function favoriteTypeLabel(type: FavoriteItem["type"]) {
  if (type === "quran") return "قرآن";
  if (type === "tafsir") return "تفسير";
  if (type === "hadith") return "حديث";
  return "ذكر";
}

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-[#d8c094]/35 bg-white/78 p-5 shadow-sm ring-1 ring-white/60 dark:border-white/10 dark:bg-white/[0.04] dark:ring-white/5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
          {icon}
        </span>
        <p className="text-sm font-black text-slate-500 dark:text-slate-300">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black text-[#31452c] dark:text-[#f7edda]">{value}</p>
      {hint ? <p className="mt-2 text-sm font-bold leading-7 text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

function QuickLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fbf7ef] px-4 py-3 font-black text-[#31452c] ring-1 ring-[#d8c094]/45 transition hover:-translate-y-0.5 dark:bg-white/5 dark:text-[#f7edda] dark:ring-white/10">
      {icon}
      {children}
    </Link>
  );
}

export function ProfileView() {
  const [snapshot, setSnapshot] = useState<ProfileSnapshot>(emptySnapshot);

  async function sync() {
    const notificationState = await getNotificationState().catch(() => "default" as RifqNotificationState);
    setSnapshot({
      lastRead: getLastRead(),
      favorites: getFavorites(),
      activity: readActivity(),
      khatma: readKhatmaPlan(),
      audio: readAudioSummary(),
      notificationsEnabled: readNotificationSettings().enabled,
      notificationState
    });
  }

  useEffect(() => {
    const handler = () => {
      void sync();
    };
    handler();

    const events = [
      "qawra-favorites-change",
      "qawra-last-read-change",
      "rifq-activity-change",
      "qawra-khatma-change",
      "rifq-audio-downloads-change",
      "rifq-notifications-change"
    ];

    events.forEach((event) => window.addEventListener(event, handler));
    return () => events.forEach((event) => window.removeEventListener(event, handler));
  }, []);

  const today = snapshot.activity.daily[localDateKey()] || { readPages: [], readAyahs: [], listeningSeconds: 0, actions: 0 };
  const khatmaPages = snapshot.khatma?.completedPages.length || 0;
  const khatmaProgress = snapshot.khatma ? Math.min(100, Math.round((khatmaPages / TOTAL_PAGES) * 100)) : 0;
  const recentFavorites = useMemo(() => snapshot.favorites.slice(0, 5), [snapshot.favorites]);
  const topAudio = snapshot.audio.reciters.slice(0, 3);

  return (
    <div className="space-y-5">
      <section className="qawra-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <ListChecks size={23} />
            </span>
            <div>
              <h1 className="qawra-title">محفوظاتي</h1>
              <p className="mt-2 max-w-2xl leading-8 text-slate-600 dark:text-slate-300">
                آخر قراءة، الختمة، الصوتيات، والمفضلة في مكان واحد.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickLink href="/notifications" icon={<Bell size={17} />}>التنبيهات</QuickLink>
            <QuickLink href="/favorites" icon={<Heart size={17} />}>المفضلة</QuickLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<BookOpen size={20} />}
          label="آخر قراءة"
          value={snapshot.lastRead?.page ? `ص ${toArabicNumber(snapshot.lastRead.page)}` : snapshot.lastRead ? `آية ${toArabicNumber(snapshot.lastRead.ayah)}` : "لا يوجد"}
          hint={snapshot.lastRead ? `سورة ${snapshot.lastRead.chapterName}` : "ابدأ من المصحف وسيتم الحفظ تلقائيًا."}
        />
        <StatCard
          icon={<Trophy size={20} />}
          label="الختمة"
          value={snapshot.khatma ? `${toArabicNumber(khatmaProgress)}٪` : "لم تبدأ"}
          hint={snapshot.khatma ? `${toArabicNumber(khatmaPages)} من ${toArabicNumber(TOTAL_PAGES)} صفحة` : "ابدأ خطة ختمة مناسبة لك."}
        />
        <StatCard
          icon={<Headphones size={20} />}
          label="الصوتيات"
          value={`${toArabicNumber(snapshot.audio.total)} سورة`}
          hint={topAudio.length ? topAudio.map((item) => `${item.name}: ${toArabicNumber(item.count)}`).join("، ") : "حمّل السور من صفحة الصوتيات."}
        />
        <StatCard
          icon={<Bell size={20} />}
          label="التنبيهات"
          value={snapshot.notificationsEnabled ? notificationStateLabel(snapshot.notificationState) : "متوقفة"}
          hint="يمكنك ضبط تذكيرات الأذكار والورد والصلاة."
        />
      </section>

      {snapshot.lastRead && (
        <section className="qawra-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#8d773f] dark:text-[#efdcb6]">استكمال القراءة</p>
            <h2 className="mt-1 text-2xl font-black text-[#31452c] dark:text-[#f7edda]">
              سورة {snapshot.lastRead.chapterName}{snapshot.lastRead.page ? ` — صفحة ${toArabicNumber(snapshot.lastRead.page)}` : ` — آية ${toArabicNumber(snapshot.lastRead.ayah)}`}
            </h2>
          </div>
          <Link href={snapshot.lastRead.page ? `/quran?page=${snapshot.lastRead.page}` : `/quran?chapter=${snapshot.lastRead.chapter}&ayah=${snapshot.lastRead.ayah}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3f5638] px-5 py-3 font-black text-white">
            <RotateCcw size={17} />
            استكمال
          </Link>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
        <div className="qawra-card">
          <div className="mb-4 flex items-center gap-2">
            <LineChart size={20} className="text-[#8d773f]" />
            <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">نشاط اليوم</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#fbf7ef] p-4 dark:bg-white/5">
              <p className="text-sm font-black text-slate-500 dark:text-slate-300">صفحات القرآن</p>
              <p className="mt-2 text-2xl font-black">{toArabicNumber(today.readPages.length)}</p>
            </div>
            <div className="rounded-2xl bg-[#fbf7ef] p-4 dark:bg-white/5">
              <p className="text-sm font-black text-slate-500 dark:text-slate-300">الاستماع</p>
              <p className="mt-2 text-2xl font-black">{formatDuration(today.listeningSeconds)}</p>
            </div>
            <div className="rounded-2xl bg-[#fbf7ef] p-4 dark:bg-white/5">
              <p className="text-sm font-black text-slate-500 dark:text-slate-300">النشاط</p>
              <p className="mt-2 text-2xl font-black">{toArabicNumber(today.actions)}</p>
            </div>
          </div>
          {snapshot.activity.lastAction ? (
            <p className="mt-4 rounded-2xl bg-[#fffaf2] p-4 font-bold leading-7 text-slate-600 ring-1 ring-[#d8c094]/35 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/10">
              آخر نشاط: {snapshot.activity.lastAction.label}
            </p>
          ) : null}
        </div>

        <div className="qawra-card">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-[#8d773f]" />
            <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">روابط سريعة</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <QuickLink href="/quran" icon={<BookOpen size={17} />}>القرآن</QuickLink>
            <QuickLink href="/khatma" icon={<Trophy size={17} />}>الختمة</QuickLink>
            <QuickLink href="/audio" icon={<Headphones size={17} />}>الصوتيات</QuickLink>
            <QuickLink href="/hadith" icon={<ScrollText size={17} />}>الأحاديث</QuickLink>
            <QuickLink href="/azkar" icon={<Heart size={17} />}>الأذكار</QuickLink>
            <QuickLink href="/notifications" icon={<Bell size={17} />}>التنبيهات</QuickLink>
          </div>
        </div>
      </section>

      <section className="qawra-card">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">آخر المحفوظات</h2>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">أحدث العناصر التي حفظتها.</p>
          </div>
          <Link href="/favorites" className="inline-flex w-fit items-center gap-2 rounded-2xl bg-[#3f5638] px-4 py-3 font-black text-white">
            <Heart size={17} />
            عرض الكل
          </Link>
        </div>

        {recentFavorites.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {recentFavorites.map((item) => (
              <Link key={item.id} href={item.url || "/favorites"} className="rounded-3xl border border-[#d8c094]/35 bg-[#fbf7ef] p-4 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#8d773f] ring-1 ring-[#d8c094]/35 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                      {favoriteTypeLabel(item.type)}
                    </span>
                    <h3 className="mt-3 text-lg font-black text-[#31452c] dark:text-[#f7edda]">{item.title}</h3>
                  </div>
                  <CheckCircle2 size={19} className="text-emerald-700 dark:text-emerald-300" />
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{item.text}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-[#fbf7ef] p-5 font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            لم تحفظ عناصر بعد.
          </div>
        )}
      </section>
    </div>
  );
}
