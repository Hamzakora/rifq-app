import { SiteHeader } from "@/components/SiteHeader";
import { QuranViewer } from "./QuranViewer";

export default function QuranPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl space-y-6 px-4 py-8">
        <QuranViewer />
      </main>
    </>
  );
}
