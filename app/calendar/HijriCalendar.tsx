"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

const events = [
  { month: 1, day: 10, title: "عاشوراء" },
  { month: 3, day: 12, title: "ذكرى المولد النبوي عند من يوافق عليها" },
  { month: 9, day: 1, title: "بداية رمضان" },
  { month: 9, day: 27, title: "ليلة 27 رمضان" },
  { month: 10, day: 1, title: "عيد الفطر" },
  { month: 12, day: 9, title: "يوم عرفة" },
  { month: 12, day: 10, title: "عيد الأضحى" },
  { month: 12, day: 11, title: "أيام التشريق" },
  { month: 12, day: 12, title: "أيام التشريق" },
  { month: 12, day: 13, title: "أيام التشريق" }
];

export function HijriCalendar() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/hijri/today")
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok) throw new Error(json.error || "تعذر تحميل التاريخ الهجري");
        setData(json.data);
      })
      .catch((err) => setError(err.message));
  }, []);

  const hijri = data?.hijri;
  const monthNumber = Number(hijri?.month?.number);
  const dayNumber = Number(hijri?.day);
  const todayEvent = events.find((e) => e.month === monthNumber && e.day === dayNumber);

  return (
    <div className="space-y-5">
      <div className="qawra-card">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CalendarDays size={22} />
          </span>
          <div>
            <h1 className="qawra-title">التقويم الهجري</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">التاريخ الهجري من AlAdhan مع أهم المناسبات.</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-3xl bg-red-50 p-5 font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</div>}

      {hijri ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="qawra-card">
            <p className="text-sm font-black text-slate-500">اليوم الهجري</p>
            <p className="mt-2 text-4xl font-black">{hijri.day}</p>
          </div>
          <div className="qawra-card">
            <p className="text-sm font-black text-slate-500">الشهر</p>
            <p className="mt-2 text-3xl font-black">{hijri.month?.ar}</p>
          </div>
          <div className="qawra-card">
            <p className="text-sm font-black text-slate-500">السنة</p>
            <p className="mt-2 text-4xl font-black">{hijri.year} هـ</p>
          </div>
        </section>
      ) : (
        <div className="qawra-card text-slate-500">جاري تحميل التاريخ...</div>
      )}

      {todayEvent && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 font-black text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          مناسبة اليوم: {todayEvent.title}
        </div>
      )}

      <section className="qawra-card">
        <h2 className="mb-4 text-2xl font-black">مناسبات إسلامية مهمة</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {events.map((event, idx) => (
            <div key={idx} className="rounded-2xl bg-slate-50 p-4 font-bold dark:bg-slate-950">
              {event.title} — {event.day}/{event.month} هـ
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
