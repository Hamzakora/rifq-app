"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Flame, LineChart, RotateCcw, Sparkles } from "lucide-react";
import { readSettings } from "@/components/settingsStore";
import { recordActivityAction, recordReadingPage } from "@/lib/client/activityStore";

type Plan = {
  days: number;
  startDate: string;
  completedPages: number[];
  logs?: Record<string, number[]>;
};

const KEY = "qawra-khatma-plan-v1";
const TOTAL_PAGES = 604;
const PRESET_DAYS = [7, 15, 30, 60];

function toArabicNumber(value: number | string | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readPlan(): Plan | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

function writePlan(plan: Plan) {
  localStorage.setItem(KEY, JSON.stringify(plan));
  window.dispatchEvent(new Event("qawra-khatma-change"));
}

const pageStartSurah: { start: number; name: string; number: number }[] = [
  { start: 1, name: "الفاتحة", number: 1 },
  { start: 2, name: "البقرة", number: 2 },
  { start: 50, name: "آل عمران", number: 3 },
  { start: 77, name: "النساء", number: 4 },
  { start: 106, name: "المائدة", number: 5 },
  { start: 128, name: "الأنعام", number: 6 },
  { start: 151, name: "الأعراف", number: 7 },
  { start: 177, name: "الأنفال", number: 8 },
  { start: 187, name: "التوبة", number: 9 },
  { start: 208, name: "يونس", number: 10 },
  { start: 221, name: "هود", number: 11 },
  { start: 235, name: "يوسف", number: 12 },
  { start: 249, name: "الرعد", number: 13 },
  { start: 255, name: "إبراهيم", number: 14 },
  { start: 262, name: "الحجر", number: 15 },
  { start: 267, name: "النحل", number: 16 },
  { start: 282, name: "الإسراء", number: 17 },
  { start: 293, name: "الكهف", number: 18 },
  { start: 305, name: "مريم", number: 19 },
  { start: 312, name: "طه", number: 20 },
  { start: 322, name: "الأنبياء", number: 21 },
  { start: 332, name: "الحج", number: 22 },
  { start: 342, name: "المؤمنون", number: 23 },
  { start: 350, name: "النور", number: 24 },
  { start: 359, name: "الفرقان", number: 25 },
  { start: 367, name: "الشعراء", number: 26 },
  { start: 377, name: "النمل", number: 27 },
  { start: 385, name: "القصص", number: 28 },
  { start: 396, name: "العنكبوت", number: 29 },
  { start: 404, name: "الروم", number: 30 },
  { start: 411, name: "لقمان", number: 31 },
  { start: 415, name: "السجدة", number: 32 },
  { start: 418, name: "الأحزاب", number: 33 },
  { start: 428, name: "سبأ", number: 34 },
  { start: 434, name: "فاطر", number: 35 },
  { start: 440, name: "يس", number: 36 },
  { start: 446, name: "الصافات", number: 37 },
  { start: 453, name: "ص", number: 38 },
  { start: 458, name: "الزمر", number: 39 },
  { start: 467, name: "غافر", number: 40 },
  { start: 477, name: "فصلت", number: 41 },
  { start: 483, name: "الشورى", number: 42 },
  { start: 489, name: "الزخرف", number: 43 },
  { start: 496, name: "الدخان", number: 44 },
  { start: 499, name: "الجاثية", number: 45 },
  { start: 502, name: "الأحقاف", number: 46 },
  { start: 507, name: "محمد", number: 47 },
  { start: 511, name: "الفتح", number: 48 },
  { start: 515, name: "الحجرات", number: 49 },
  { start: 518, name: "ق", number: 50 },
  { start: 520, name: "الذاريات", number: 51 },
  { start: 523, name: "الطور", number: 52 },
  { start: 526, name: "النجم", number: 53 },
  { start: 528, name: "القمر", number: 54 },
  { start: 531, name: "الرحمن", number: 55 },
  { start: 534, name: "الواقعة", number: 56 },
  { start: 537, name: "الحديد", number: 57 },
  { start: 542, name: "المجادلة", number: 58 },
  { start: 545, name: "الحشر", number: 59 },
  { start: 549, name: "الممتحنة", number: 60 },
  { start: 551, name: "الصف", number: 61 },
  { start: 553, name: "الجمعة", number: 62 },
  { start: 554, name: "المنافقون", number: 63 },
  { start: 556, name: "التغابن", number: 64 },
  { start: 558, name: "الطلاق", number: 65 },
  { start: 560, name: "التحريم", number: 66 },
  { start: 562, name: "الملك", number: 67 },
  { start: 564, name: "القلم", number: 68 },
  { start: 566, name: "الحاقة", number: 69 },
  { start: 568, name: "المعارج", number: 70 },
  { start: 570, name: "نوح", number: 71 },
  { start: 572, name: "الجن", number: 72 },
  { start: 574, name: "المزمل", number: 73 },
  { start: 575, name: "المدثر", number: 74 },
  { start: 577, name: "القيامة", number: 75 },
  { start: 578, name: "الإنسان", number: 76 },
  { start: 580, name: "المرسلات", number: 77 },
  { start: 582, name: "النبأ", number: 78 },
  { start: 583, name: "النازعات", number: 79 },
  { start: 585, name: "عبس", number: 80 },
  { start: 586, name: "التكوير", number: 81 },
  { start: 587, name: "الانفطار", number: 82 },
  { start: 587, name: "المطففين", number: 83 },
  { start: 589, name: "الانشقاق", number: 84 },
  { start: 590, name: "البروج", number: 85 },
  { start: 591, name: "الطارق", number: 86 },
  { start: 591, name: "الأعلى", number: 87 },
  { start: 592, name: "الغاشية", number: 88 },
  { start: 593, name: "الفجر", number: 89 },
  { start: 594, name: "البلد", number: 90 },
  { start: 595, name: "الشمس", number: 91 },
  { start: 595, name: "الليل", number: 92 },
  { start: 596, name: "الضحى", number: 93 },
  { start: 596, name: "الشرح", number: 94 },
  { start: 597, name: "التين", number: 95 },
  { start: 597, name: "العلق", number: 96 },
  { start: 598, name: "القدر", number: 97 },
  { start: 598, name: "البينة", number: 98 },
  { start: 599, name: "الزلزلة", number: 99 },
  { start: 599, name: "العاديات", number: 100 },
  { start: 600, name: "القارعة", number: 101 },
  { start: 600, name: "التكاثر", number: 102 },
  { start: 601, name: "العصر", number: 103 },
  { start: 601, name: "الهمزة", number: 104 },
  { start: 601, name: "الفيل", number: 105 },
  { start: 602, name: "قريش", number: 106 },
  { start: 602, name: "الماعون", number: 107 },
  { start: 602, name: "الكوثر", number: 108 },
  { start: 603, name: "الكافرون", number: 109 },
  { start: 603, name: "النصر", number: 110 },
  { start: 603, name: "المسد", number: 111 },
  { start: 604, name: "الإخلاص", number: 112 },
  { start: 604, name: "الفلق", number: 113 },
  { start: 604, name: "الناس", number: 114 }
];

function pageSurahs(page: number) {
  const active = pageStartSurah
    .filter((s, i) => s.start <= page && (!pageStartSurah[i + 1] || pageStartSurah[i + 1].start > page))
    .map((s) => s.name);
  const exact = pageStartSurah.filter((s) => s.start === page).map((s) => s.name);
  return Array.from(new Set([...active, ...exact])).join("، ");
}

function calculateStreak(logs?: Record<string, number[]>) {
  if (!logs) return 0;
  let streak = 0;
  const date = new Date();

  for (;;) {
    const key = todayKey(date);
    if (logs[key]?.length) {
      streak += 1;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function pagesThisWeek(logs?: Record<string, number[]>) {
  if (!logs) return 0;
  const date = new Date();
  let total = 0;

  for (let i = 0; i < 7; i += 1) {
    const key = todayKey(date);
    total += logs[key]?.length || 0;
    date.setDate(date.getDate() - 1);
  }

  return total;
}

export function KhatmaPlanner() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setPlan(readPlan());
    setDays(readSettings().defaultKhatmaDays);
  }, []);

  const safeDays = Math.max(1, Math.min(365, Number(days) || 30));
  const completedCount = plan?.completedPages.length || 0;
  const progress = plan ? Math.min(100, Math.round((completedCount / TOTAL_PAGES) * 100)) : 0;
  const pagesPerDay = plan ? Math.ceil(TOTAL_PAGES / plan.days) : Math.ceil(TOTAL_PAGES / safeDays);
  const todayIndex = plan ? Math.max(1, Math.floor((Date.now() - new Date(plan.startDate).getTime()) / 86400000) + 1) : 1;
  const todayStart = Math.min(TOTAL_PAGES, (todayIndex - 1) * pagesPerDay + 1);
  const todayEnd = Math.min(TOTAL_PAGES, todayIndex * pagesPerDay);
  const streak = calculateStreak(plan?.logs);
  const weeklyPages = pagesThisWeek(plan?.logs);

  const todayPages = useMemo(() => {
    const arr = [];
    for (let p = todayStart; p <= todayEnd; p += 1) arr.push(p);
    return arr;
  }, [todayStart, todayEnd]);

  const todayDone = plan ? todayPages.filter((page) => plan.completedPages.includes(page)).length : 0;
  const todayProgress = todayPages.length ? Math.round((todayDone / todayPages.length) * 100) : 0;
  const planComplete = completedCount >= TOTAL_PAGES;

  function start(customDays = safeDays) {
    const normalizedDays = Math.max(1, Math.min(365, Number(customDays) || 30));
    const newPlan: Plan = { days: normalizedDays, startDate: new Date().toISOString(), completedPages: [], logs: {} };
    writePlan(newPlan);
    setPlan(newPlan);
    setDays(normalizedDays);
    recordActivityAction("khatma", `بدأت ختمة ${normalizedDays} يوم`);
  }

  function updatePlan(next: Plan) {
    writePlan(next);
    setPlan(next);
  }

  function togglePage(page: number) {
    if (!plan) return;
    const exists = plan.completedPages.includes(page);
    const key = todayKey();
    const logs = { ...(plan.logs || {}) };
    const todaySet = new Set(logs[key] || []);

    if (exists) {
      todaySet.delete(page);
      recordActivityAction("khatma", `ألغيت صفحة ${page} من الختمة`);
    } else {
      todaySet.add(page);
      recordReadingPage(page, `أنهيت صفحة ${page} من ورد الختمة`);
    }

    logs[key] = Array.from(todaySet).sort((a, b) => a - b);

    updatePlan({
      ...plan,
      logs,
      completedPages: exists ? plan.completedPages.filter((p) => p !== page) : [...plan.completedPages, page].sort((a, b) => a - b)
    });
  }

  function markTodayDone() {
    if (!plan) return;
    const key = todayKey();
    const completed = new Set(plan.completedPages);
    const logs = { ...(plan.logs || {}) };
    const todaySet = new Set(logs[key] || []);

    todayPages.forEach((page) => {
      completed.add(page);
      todaySet.add(page);
    });

    logs[key] = Array.from(todaySet).sort((a, b) => a - b);
    updatePlan({ ...plan, logs, completedPages: Array.from(completed).sort((a, b) => a - b) });
    recordActivityAction("khatma", "أنهيت ورد اليوم");
  }

  function resetPlan() {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("qawra-khatma-change"));
    recordActivityAction("khatma", "أعدت ضبط الختمة");
    setPlan(null);
  }

  return (
    <div className="space-y-5">
      <div className="qawra-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="qawra-title">الختمة</h1>
            <p className="mt-2 max-w-3xl leading-8 text-slate-600 dark:text-slate-300">
              اختر المدة، وسيظهر وردك اليومي حسب صفحات المصحف.
            </p>
          </div>
          {plan && (
            <button onClick={resetPlan} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700 dark:bg-red-950/30 dark:text-red-200">
              <RotateCcw size={17} />
              إعادة الخطة
            </button>
          )}
        </div>

        {!plan && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {PRESET_DAYS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => start(item)}
                  className="rounded-2xl bg-[#fbf7ef] px-4 py-4 text-center font-black text-[#315339] ring-1 ring-[#d8c094]/45 transition hover:-translate-y-0.5 dark:bg-white/5 dark:text-[#efdcb6] dark:ring-white/10"
                >
                  {toArabicNumber(item)} يوم
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder="عدد أيام الختمة"
              />
              <button onClick={() => start()} className="rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white">
                بدء الختمة
              </button>
            </div>
          </div>
        )}

        {plan && (
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-sm font-black text-slate-500">ورد اليوم</p>
              <p className="mt-1 text-2xl font-black">ص {toArabicNumber(todayStart)} - {toArabicNumber(todayEnd)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-sm font-black text-slate-500">اليوم</p>
              <p className="mt-1 text-2xl font-black">{toArabicNumber(todayProgress)}٪</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-sm font-black text-slate-500">الختمة</p>
              <p className="mt-1 text-2xl font-black">{toArabicNumber(progress)}٪</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="flex items-center gap-1 text-sm font-black text-slate-500"><Flame size={15} /> الاستمرارية</p>
              <p className="mt-1 text-2xl font-black">{toArabicNumber(streak)} يوم</p>
            </div>
          </div>
        )}
      </div>

      {plan && (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="qawra-card">
            <p className="flex items-center gap-2 text-sm font-black text-slate-500"><LineChart size={16} /> هذا الأسبوع</p>
            <p className="mt-2 text-3xl font-black">{toArabicNumber(weeklyPages)} صفحة</p>
          </div>
          <div className="qawra-card">
            <p className="text-sm font-black text-slate-500">المتبقي</p>
            <p className="mt-2 text-3xl font-black">{toArabicNumber(TOTAL_PAGES - completedCount)} صفحة</p>
          </div>
          <div className="qawra-card">
            <p className="text-sm font-black text-slate-500">تمت قراءتها</p>
            <p className="mt-2 text-3xl font-black">{toArabicNumber(completedCount)} صفحة</p>
          </div>
        </section>
      )}

      {plan && planComplete && (
        <section className="qawra-card bg-emerald-50 dark:bg-emerald-950/25">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-700 text-white"><Sparkles size={22} /></span>
            <div>
              <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-200">تمت الختمة</h2>
              <p className="mt-1 font-bold text-emerald-700 dark:text-emerald-100">يمكنك بدء ختمة جديدة من زر إعادة الخطة.</p>
            </div>
          </div>
        </section>
      )}

      {plan && (
        <section className="qawra-card">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">ورد اليوم</h2>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                {toArabicNumber(todayDone)} من {toArabicNumber(todayPages.length)} صفحة
              </p>
            </div>
            <button onClick={markTodayDone} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white">
              <CheckCircle2 size={17} />
              أنهيت ورد اليوم
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {todayPages.map((page) => {
              const done = plan.completedPages.includes(page);
              return (
                <div key={page} className={`rounded-3xl border p-4 ${done ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-500 dark:text-slate-400">صفحة {toArabicNumber(page)}</p>
                      <h3 className="mt-1 text-xl font-black">سورة {pageSurahs(page)}</h3>
                    </div>
                    {done && <CheckCircle2 className="text-emerald-700 dark:text-emerald-300" />}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/quran?page=${page}`} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black dark:bg-slate-800">
                      <BookOpen size={16} />
                      فتح الصفحة
                    </Link>
                    <button onClick={() => togglePage(page)} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">
                      {done ? "إلغاء" : "تمت القراءة"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
