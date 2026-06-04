import Image from "next/image";
import Link from "next/link";
import { Bell, BookOpen, BookText, Headphones, Heart, MessageSquareWarning, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const features = [
  {
    title: "مصحف المدينة",
    icon: BookOpen,
    text: "قراءة هادئة بصفحات المصحف، فهرس واضح، حفظ آخر موضع، وتجربة قريبة من المصحف الحقيقي على الجوال."
  },
  {
    title: "التفسير",
    icon: BookText,
    text: "الوصول إلى تفسير الصفحة والآية بسهولة، حتى تبقى القراءة مرتبطة بالفهم والتدبر."
  },
  {
    title: "الأذكار",
    icon: Heart,
    text: "أذكار منظمة للصباح والمساء والنوم وما بعد الصلاة مع عداد تكرار وتجربة سهلة يوميًا."
  },
  {
    title: "الصوتيات",
    icon: Headphones,
    text: "استماع للتلاوة بصوت عدد من القراء، مع وضع السورة كاملة أو آية بآية للمراجعة والحفظ."
  }
];

const values = [
  "واجهة هادئة لا تزاحم القارئ أثناء التلاوة.",
  "ألوان إسلامية مريحة مستوحاة من الأخضر والذهبي.",
  "تجربة مهيأة للجوال وسهلة الاستخدام اليومي.",
  "تجربة مناسبة للاستخدام اليومي في القرآن والذكر والاستماع."
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl space-y-6 px-4 py-8">
        <section className="qawra-card relative overflow-hidden p-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#c8a960]/20 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-[#3f5638]/15 blur-3xl" />

          <div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:p-10">
            <div className="mx-auto w-full max-w-[310px] rounded-[2.2rem] bg-[#fffaf2] p-4 shadow-2xl shadow-[#31452c]/10 ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:ring-white/10">
              <Image
                src="/rifq-logo.png"
                alt="شعار رِفْق"
                width={520}
                height={520}
                className="h-auto w-full rounded-[1.65rem]"
                priority
              />
            </div>

            <div className="text-center lg:text-right">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fff8e8] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                <Sparkles size={16} />
                عن رِفْق
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.35] text-[#31452c] dark:text-[#f7edda] md:text-5xl">
                رِفْق… مصحف وذكر واستماع في تجربة إسلامية هادئة
              </h1>
              <p className="mt-5 text-base font-bold leading-9 text-slate-600 dark:text-slate-300 md:text-lg">
                صُمم رِفْق ليكون رفيقًا يوميًا للمسلم: تقرأ القرآن من صفحات المصحف، تحفظ موضعك، تستمع للتلاوة، تراجع الأذكار، وتصل للتفسير في واجهة بسيطة تركز على الخشوع والراحة.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="/quran" className="rounded-2xl bg-[#3f5638] px-5 py-3 font-black text-white shadow-lg shadow-[#3f5638]/15 transition hover:-translate-y-0.5">
                  افتح القرآن
                </Link>
                <Link href="/azkar" className="rounded-2xl border border-[#d8c094]/55 bg-white/80 px-5 py-3 font-black text-[#7b6431] transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-[#efdcb6]">
                  ابدأ الأذكار
                </Link>
                <Link href="/audio" className="rounded-2xl border border-[#d8c094]/55 bg-white/80 px-5 py-3 font-black text-[#7b6431] transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-[#efdcb6]">
                  استمع للتلاوة
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="qawra-card transition hover:-translate-y-1 hover:shadow-xl">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                  <Icon size={22} />
                </span>
                <h2 className="mt-4 text-xl font-black text-[#31452c] dark:text-[#f7edda]">{item.title}</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
          <div className="qawra-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
                <ShieldCheck size={22} />
              </span>
              <div>
                <p className="text-sm font-black text-[#987a35] dark:text-[#efdcb6]">فلسفة التطبيق</p>
                <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">بساطة، خشوع، واستمرار</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {values.map((item) => (
                <div key={item} className="rounded-2xl bg-[#fbf7ef] p-4 text-sm font-bold leading-7 text-slate-700 ring-1 ring-[#d8c094]/25 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="qawra-card border-[#d8c094]/45 bg-[#fff8e8] text-[#31452c] dark:bg-[#102018] dark:text-[#f7edda]">
            <Bell size={34} className="text-[#8d773f] dark:text-[#efdcb6]" />
            <h2 className="mt-4 text-2xl font-black">رفيق يومي منظم</h2>
            <p className="mt-3 font-bold leading-8 text-[#5f553f] dark:text-[#eadfc9]">
              اضبط أوقات الأذكار وورد القرآن، وتابع قراءتك ومحفوظاتك بسهولة.
            </p>
            <Link href="/notifications" className="mt-5 inline-flex rounded-2xl bg-[#3f5638] px-5 py-3 font-black text-white shadow-lg shadow-[#3f5638]/15">
              إدارة التنبيهات
            </Link>
          </div>
        </section>

        <section className="qawra-card flex flex-col gap-4 bg-[#fff8e8]/80 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <MessageSquareWarning size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#31452c] dark:text-[#f7edda]">لاحظت مشكلة أو اقتراح؟</h2>
              <p className="mt-1 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
                أرسل بلاغًا مختصرًا من داخل التطبيق، وسنراعيه في النسخ القادمة بإذن الله.
              </p>
            </div>
          </div>
          <Link href="/report" className="rounded-2xl bg-[#3f5638] px-5 py-3 text-center font-black text-white">
            إرسال بلاغ
          </Link>
        </section>
      </main>
    </>
  );
}
