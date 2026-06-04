import { SiteHeader } from "@/components/SiteHeader";
import { AudioPlayer } from "./AudioPlayer";

export default function AudioPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <AudioPlayer />
      </main>
    </>
  );
}
