import { SiteHeader } from "@/components/SiteHeader";
import { DailyWird } from "./DailyWird";

export default function DailyPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <DailyWird />
      </main>
    </>
  );
}
