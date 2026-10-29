import { Page } from "@/components/ui/Page";
import { loadProfile } from "@/lib/settings/data";
import { RatesForm } from "./RatesForm";

export default async function RatesPage() {
  const profile = await loadProfile();
  return (
    <Page title="Tarieven" back={{ href: "/instellingen", label: "Instellingen" }}>
      <RatesForm profile={profile} />
    </Page>
  );
}
