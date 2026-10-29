import { Page } from "@/components/ui/Page";
import { loadProfile } from "@/lib/settings/data";
import { FollowUpForm } from "./FollowUpForm";

export default async function FollowUpPage() {
  const profile = await loadProfile();
  return (
    <Page title="Opvolging" back={{ href: "/instellingen", label: "Instellingen" }}>
      <FollowUpForm profile={profile} />
    </Page>
  );
}
