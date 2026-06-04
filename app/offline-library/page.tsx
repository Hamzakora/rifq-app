import { SiteHeader } from "@/components/SiteHeader";
import { OfflineLibraryClient } from "./OfflineLibraryClient";

export default function OfflineLibraryPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <OfflineLibraryClient />
      </main>
    </>
  );
}
