import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { HadithDetailView } from "./HadithDetailView";

export default function HadithDetailPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Suspense fallback={<div className="rounded-3xl bg-white p-6 font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">جاري تحميل الحديث...</div>}>
          <HadithDetailView />
        </Suspense>
      </main>
    </>
  );
}
