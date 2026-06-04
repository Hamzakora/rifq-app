import { SiteHeader } from "@/components/SiteHeader";
import { PrayerTimesViewer } from "./PrayerTimesViewer";

export default function PrayerTimesPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl space-y-6 px-4 py-8">
        <PrayerTimesViewer />
      </main>
    </>
  );
}
