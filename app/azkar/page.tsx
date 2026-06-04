import { SiteHeader } from "@/components/SiteHeader";
import { AzkarViewer } from "./AzkarViewer";

export default function AzkarPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AzkarViewer />
      </main>
    </>
  );
}
