import { notFound } from "next/navigation";
import { Page } from "@/components/ui/Page";
import { loadMaterial } from "@/lib/settings/data";
import { MaterialForm } from "../MaterialForm";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await loadMaterial(id);
  if (!material) notFound();
  return (
    <Page title="Materiaal" back={{ href: "/instellingen/materialen", label: "Materialen" }}>
      <MaterialForm material={material} />
    </Page>
  );
}
