import { SiteHeader } from "@/components/SiteHeader";
import { ReportIssueClient } from "./ReportIssueClient";

export default function ReportPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-6xl px-4 py-8">
        <ReportIssueClient />
      </main>
    </>
  );
}
