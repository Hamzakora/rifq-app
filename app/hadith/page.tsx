import { SiteHeader } from "@/components/SiteHeader";
import { HadithSearch } from "./HadithSearch";

export default function HadithPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl space-y-6 px-4 py-8">
        <HadithSearch />
      </main>
    </>
  );
}
