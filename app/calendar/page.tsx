import { SiteHeader } from "@/components/SiteHeader";
import { HijriCalendar } from "./HijriCalendar";

export default function CalendarPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <HijriCalendar />
      </main>
    </>
  );
}
