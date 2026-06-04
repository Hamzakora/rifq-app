import { SiteHeader } from "@/components/SiteHeader";
import { ResetAppClient } from "./ResetAppClient";

export default function ResetAppPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-3xl px-4 py-10">
        <ResetAppClient />
      </main>
    </>
  );
}
