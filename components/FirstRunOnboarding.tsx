"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, Headphones, Heart, Sparkles, X } from "lucide-react";

const ONBOARDING_KEY = "rifq-onboarding-complete-v1";

const features = [
  {
    icon: BookOpen,
    title: "مصحف كامل بتقليب الصفحات",
    text: "ابدأ من فهرس السور، وافتح السورة على صفحة بدايتها مع حفظ آخر صفحة تلقائيًا."
  },
  {
    icon: Headphones,
    title: "صوتيات اختيارية",
    text: "اختر القارئ وحمّل السورة أو المصحف كاملًا عند الحاجة."
  },
  {
    icon: Heart,
    title: "وردك وأذكارك في مكان واحد",
    text: "تابع نشاطك اليومي، المفضلة، الختمة، والتلاوة من واجهة واحدة هادئة."
  }
];

export function FirstRunOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(ONBOARDING_KEY) !== "done");
    } catch {
      setOpen(false);
    }
  }, []);

  function finish() {
    try {
      localStorage.setItem(ONBOARDING_KEY, "done");
    } catch {
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-slate-950/55 px-3 pb-3 pt-16 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="ترحيب بتطبيق رفق">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-[#d8c094]/45 bg-[#fffaf2] p-4 shadow-[0_35px_100px_rgba(0,0,0,.35)] ring-1 ring-white/70 dark:border-white/10 dark:bg-[#0b1711] dark:ring-white/5 sm:p-6">
        <button
          type="button"
          onClick={finish}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-[#3f5638] shadow-sm ring-1 ring-[#d8c094]/45 transition hover:bg-[#fff8ec] dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10"
          aria-label="إغلاق شاشة الترحيب"
        >
          <X size={18} />
        </button>

        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="mx-auto w-full max-w-[260px] rounded-[2rem] bg-white/75 p-4 shadow-xl ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:ring-white/10">
            <Image src="/rifq-logo.png" alt="شعار تطبيق رفق" width={520} height={520} priority className="h-auto w-full rounded-[1.6rem]" />
          </div>

          <div className="text-center lg:text-right">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff8e8] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <Sparkles size={16} />
              أهلًا بك في رِفْق
            </span>
            <h2 className="mt-4 text-3xl font-black leading-[1.35] text-[#31452c] dark:text-[#f7edda] md:text-5xl">
              رفيقك اليومي في القرآن، الذكر، والاستماع
            </h2>
            <p className="mt-4 text-base font-bold leading-8 text-slate-600 dark:text-slate-300">
              تم ضبط التطبيق ليبدأ بوضع النهار للمستخدم الجديد، ويمكنك تغيير المظهر والإعدادات في أي وقت من زر الترس بالأعلى.
            </p>

            <div className="mt-5 grid gap-3">
              {features.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-3 rounded-[1.35rem] border border-[#d8c094]/30 bg-white/72 p-3 text-right shadow-sm dark:border-white/10 dark:bg-white/5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                      <Icon size={19} />
                    </span>
                    <div>
                      <h3 className="font-black text-[#31452c] dark:text-[#f7edda]">{item.title}</h3>
                      <p className="mt-1 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link onClick={finish} href="/quran" className="inline-flex items-center gap-2 rounded-2xl bg-[#3f5638] px-5 py-3 font-black text-white shadow-lg shadow-[#3f5638]/20 transition hover:-translate-y-0.5">
                ابدأ من القرآن
                <ChevronLeft size={18} />
              </Link>
              <Link onClick={finish} href="/audio" className="inline-flex items-center gap-2 rounded-2xl border border-[#d8c094]/55 bg-white/80 px-5 py-3 font-black text-[#7b6431] shadow-sm transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-[#efdcb6]">
                <Headphones size={18} />
                الصوتيات
              </Link>
              <button type="button" onClick={finish} className="rounded-2xl px-5 py-3 font-black text-slate-600 transition hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10">
                متابعة الآن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
