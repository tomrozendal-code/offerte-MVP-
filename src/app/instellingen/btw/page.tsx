import { Page } from "@/components/ui/Page";
import { loadProfile } from "@/lib/settings/data";
import { VatForm } from "./VatForm";

export default async function VatPage() {
  const profile = await loadProfile();
  return (
    <Page title="Btw" back={{ href: "/instellingen", label: "Instellingen" }}>
      <VatForm mode={profile.material_vat_mode} />
    </Page>
  );
}
