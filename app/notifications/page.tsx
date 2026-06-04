import { SiteHeader } from "@/components/SiteHeader";
import { NotificationSettings } from "./NotificationSettings";

export default function NotificationsPage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <NotificationSettings />
      </main>
    </>
  );
}
