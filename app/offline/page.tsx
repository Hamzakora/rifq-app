import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-3xl px-4 py-12">
        <div className="qawra-card text-center">
          <h1 className="qawra-title">أنت غير متصل بالإنترنت</h1>
          <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
            افتح الصفحة الرئيسية أو المحتوى الذي تم تحميله مسبقًا.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white">
            الرجوع للرئيسية
          </Link>
        </div>
      </main>
    </>
  );
}
