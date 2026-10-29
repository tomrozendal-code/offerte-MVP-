import { Page } from "@/components/ui/Page";
import { loadNorms } from "@/lib/settings/data";
import { NormsForm } from "./NormsForm";

export default async function NormsPage() {
  const norms = await loadNorms();
  return (
    <Page title="Normen" back={{ href: "/instellingen", label: "Instellingen" }}>
      <NormsForm norms={norms} />
    </Page>
  );
}
