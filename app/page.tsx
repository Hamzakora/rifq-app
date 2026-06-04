import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookmarkCheck,
  BookOpen,
  BookText,
  CalendarDays,
  ChevronLeft,
  Clock,
  Headphones,
  Heart,
  PlayCircle,
  Sparkles,
  Trophy,
  Settings,
  Info,
  MessageSquareWarning,
  ScrollText
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { LastReadBox } from "@/components/LastReadBox";
import { RandomQuranAyah } from "@/components/RandomQuranAyah";
import { ActivityDashboard } from "@/components/ActivityDashboard";

const quickActions = [
  { href: "/quran", title: "افتح المصحف", text: "ابدأ القراءة من آخر موضع أو اختر سورة جديدة.", icon: BookOpen },
  { href: "/khatma", title: "تابع الختمة", text: "اعرف ورد اليوم وسجل إنجازك بسهولة.", icon: Trophy },
  { href: "/audio", title: "استمع للتلاوة", text: "اختر القارئ والسورة وحمّل ما تريد.", icon: Headphones },
  { href: "/azkar", title: "أذكار اليوم", text: "أذكار الصباح والمساء بتجربة بسيطة.", icon: Heart }
];

const sections = [
  { href: "/tafsir", title: "التفسير", text: "تفسير ميسر وقراءة أوضح للمعنى.", icon: BookText },
  { href: "/hadith", title: "الأحاديث", text: "أحاديث مرتبة مع البحث والمفضلة.", icon: ScrollText },
  { href: "/prayer-times", title: "مواقيت الصلاة", text: "أوقات الصلاة حسب مدينتك.", icon: Clock },
  { href: "/notifications", title: "التنبيهات", text: "حدد وقت الأذكار وورد القرآن كما يناسبك.", icon: Bell },
  { href: "/profile", title: "محفوظاتي", text: "آخر قراءة والختمة والمفضلة في مكان واحد.", icon: BookmarkCheck },
  { href: "/calendar", title: "التاريخ الهجري", text: "تابع التاريخ والمناسبات الهجرية.", icon: CalendarDays },
  { href: "/settings", title: "الإعدادات", text: "المظهر، المدينة، والتنبيهات.", icon: Settings },
  { href: "/about", title: "عن رِفْق", text: "تعرف على فكرة التطبيق وأرسل ملاحظتك.", icon: Info }
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell overflow-hidden bg-transparent">
        <section className="rifq-home-hero relative px-4 pb-10 pt-8 lg:pb-14 lg:pt-12">
          <div className="pointer-events-none absolute inset-0 rifq-pattern-bg opacity-60" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#f7efe1] to-transparent dark:from-[#0b1711]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.98fr] lg:items-center">
            <div className="animate-qawra-slide-up text-center lg:text-right">
              <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8c094]/50 bg-white/65 px-4 py-2 text-sm font-black text-[#3f5638] shadow-sm backdrop-blur lg:mx-0 dark:border-white/10 dark:bg-white/10 dark:text-[#f7edda]">
                <Sparkles size={16} className="text-[#b5954d]" />
                رفيقك اليومي
              </div>

              <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.28] text-[#3f5638] md:text-6xl lg:mx-0">
                رِفْق
                <span className="block text-[#526447]">في رحلة القرآن</span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-lg font-bold leading-9 text-[#6f6654] lg:mx-0 dark:text-[#e6d8bf]">
                القرآن الكريم، التفسير، الأذكار، الأحاديث، مواقيت الصلاة، والختمة في تجربة هادئة تناسب الاستخدام اليومي.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="/quran" className="inline-flex items-center gap-2 rounded-full bg-[#3f5638] px-6 py-3 font-black text-white shadow-xl shadow-[#3f5638]/20 transition hover:-translate-y-1 hover:bg-[#31422b]">
                  ابدأ القراءة
                  <ChevronLeft size={18} />
                </Link>
                <Link href="/khatma" className="inline-flex items-center gap-2 rounded-full border border-[#c8a960]/70 bg-white/70 px-6 py-3 font-black text-[#7f6a39] shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white dark:bg-white/10 dark:text-[#efdcb6]">
                  <Trophy size={18} />
                  متابعة الختمة
                </Link>
                <Link href="/audio" className="inline-flex items-center gap-2 rounded-full border border-[#c8a960]/70 bg-white/70 px-6 py-3 font-black text-[#7f6a39] shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white dark:bg-white/10 dark:text-[#efdcb6]">
                  <PlayCircle size={18} />
                  استماع
                </Link>
              </div>
            </div>

            <div className="relative min-h-[430px] lg:min-h-[510px]">
              <div className="absolute right-2 top-6 hidden h-80 w-48 rounded-[999px] border border-[#d8c094]/30 bg-[#ead9b6]/18 lg:block" />
              <div className="absolute left-0 top-12 hidden h-80 w-28 rounded-full border border-[#d8c094]/40 bg-[#fbf7ef]/50 lg:block" />
              <div className="animate-qawra-float absolute right-0 top-0 w-[58%] max-w-[370px] rounded-[2.5rem] bg-white/60 p-5 shadow-[0_30px_80px_rgba(63,86,56,.16)] ring-1 ring-[#d8c094]/40 backdrop-blur dark:bg-white/10 dark:ring-white/10 sm:right-10 lg:right-0">
                <Image
                  src="/rifq-logo.png"
                  alt="اللوجو الرسمي لتطبيق رِفْق"
                  width={650}
                  height={650}
                  priority
                  className="h-auto w-full rounded-[2rem]"
                />
              </div>

              <div className="rifq-phone-mockup absolute bottom-0 left-0 w-[44%] min-w-[190px] max-w-[250px] rotate-[-4deg] rounded-[2.2rem] border-[10px] border-[#2e3f2b] bg-[#fbf7ef] p-3 shadow-[0_30px_70px_rgba(32,40,28,.28)] dark:bg-[#111d14]">
                <div className="mb-3 flex items-center justify-between rounded-2xl bg-[#3f5638] px-3 py-2 text-xs font-black text-white">
                  <span>آية قرآنية</span>
                  <span>رفق</span>
                </div>
                <div className="rounded-[1.4rem] border border-[#d8c094]/45 bg-[#fffdf8] p-4 text-center shadow-inner dark:bg-[#0f1a12]">
                  <RandomQuranAyah variant="phone" />
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="h-1.5 w-14 rounded-full bg-[#3f5638]" />
                    <span className="h-1.5 w-8 rounded-full bg-[#d8c094]" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-around text-[#3f5638] dark:text-[#d8c094]">
                  <BookOpen size={17} />
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-[#3f5638] text-white" aria-label="تشغيل">
                    <PlayCircle size={20} />
                  </button>
                  <Headphones size={17} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-2 max-w-7xl px-4">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#b5954d]">ابدأ بسرعة</p>
              <h2 className="mt-1 text-3xl font-black text-[#3f5638] dark:text-[#f7edda]">أهم ما تحتاجه يوميًا</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="qawra-card group animate-qawra-fade-scale min-h-[170px] transition hover:-translate-y-1 hover:shadow-xl" style={{ animationDelay: `${index * 70}ms` }}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="grid h-14 w-14 place-items-center rounded-[1.2rem] bg-[#f2e5ca] text-[#3f5638] transition group-hover:scale-110 dark:bg-white/10 dark:text-[#d8c094]">
                      <Icon size={24} />
                    </span>
                    <ChevronLeft size={18} className="mt-2 text-[#b5954d] transition group-hover:-translate-x-1" />
                  </div>
                  <h2 className="text-xl font-black text-[#3f5638] dark:text-[#f7edda]">{item.title}</h2>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#746a58] dark:text-[#d8cfc0]">{item.text}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:py-10">
          <RandomQuranAyah />
          <LastReadBox />
          <ActivityDashboard />

          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#b5954d]">أقسام أخرى</p>
                <h2 className="mt-1 text-3xl font-black text-[#3f5638] dark:text-[#f7edda]">كل شيء مرتب في مكانه</h2>
              </div>
              <Link href="/report" className="inline-flex items-center gap-2 rounded-2xl border border-[#d8c094]/55 bg-white/75 px-4 py-3 text-sm font-black text-[#7b6431] transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-[#efdcb6]">
                <MessageSquareWarning size={16} />
                إرسال ملاحظة
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {sections.map((card, index) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="qawra-card animate-qawra-fade-scale group transition hover:-translate-y-1 hover:shadow-xl"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f2e5ca] text-[#3f5638] transition group-hover:scale-110 dark:bg-white/10 dark:text-[#d8c094]">
                        <Icon size={22} />
                      </div>
                      <span className="text-2xl font-black text-[#d8c094]/70">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h2 className="text-xl font-black text-[#3f5638] dark:text-[#f7edda]">{card.title}</h2>
                    <p className="mt-2 leading-7 text-[#746a58] dark:text-[#d8cfc0]">{card.text}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
