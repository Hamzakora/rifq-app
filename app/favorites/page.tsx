import { SiteHeader } from "@/components/SiteHeader";
import { FavoritesView } from "./FavoritesView";

export default function FavoritesPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <FavoritesView />
      </main>
    </>
  );
}
