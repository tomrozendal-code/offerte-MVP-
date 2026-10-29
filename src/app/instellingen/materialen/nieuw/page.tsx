import { Page } from "@/components/ui/Page";
import { MaterialForm } from "../MaterialForm";

export default function NewMaterialPage() {
  return (
    <Page title="Nieuw materiaal" back={{ href: "/instellingen/materialen", label: "Materialen" }}>
      <MaterialForm material={null} />
    </Page>
  );
}
