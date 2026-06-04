import { SiteHeader } from "@/components/SiteHeader";
import { KhatmaPlanner } from "./KhatmaPlanner";

export default function KhatmaPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <KhatmaPlanner />
      </main>
    </>
  );
}
