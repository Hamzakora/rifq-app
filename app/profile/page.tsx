import { SiteHeader } from "@/components/SiteHeader";
import { ProfileView } from "./ProfileView";

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="rifq-page-shell mx-auto max-w-7xl px-4 py-8">
        <ProfileView />
      </main>
    </>
  );
}
