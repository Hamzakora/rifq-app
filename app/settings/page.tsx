import { SiteHeader } from "@/components/SiteHeader";
import { SettingsView } from "./SettingsView";

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <SettingsView />
      </main>
    </>
  );
}
