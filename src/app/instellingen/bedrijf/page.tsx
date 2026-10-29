import { Page } from "@/components/ui/Page";
import { loadProfile } from "@/lib/settings/data";
import { CompanyForm } from "./CompanyForm";

export default async function CompanyPage() {
  const profile = await loadProfile();
  return (
    <Page title="Bedrijfsgegevens" back={{ href: "/instellingen", label: "Instellingen" }}>
      <CompanyForm profile={profile} />
    </Page>
  );
}
