import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BucketIcon, PlusIcon } from "@/components/ui/Icons";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Page } from "@/components/ui/Page";
import { formatEuro, formatNumber } from "@/lib/format";
import { loadMaterials } from "@/lib/settings/data";
import { EXAMPLE_PRICE_LABEL, STARTER_MATERIALS } from "@/lib/settings/starterMaterials";
import { addStarterMaterials } from "../actions";

export default async function MaterialsPage() {
  const materials = await loadMaterials();
  const examples = materials.filter((m) => m.is_example_price).length;

  return (
    <Page
      title="Materialen"
      back={{ href: "/instellingen", label: "Instellingen" }}
      action={
        <Link href="/instellingen/materialen/nieuw" aria-label="Nieuw materiaal" className="flex size-11 items-center justify-center text-tint active:opacity-60">
          <PlusIcon className="size-6" />
        </Link>
      }
    >
      {examples > 0 && (
        <p className="text-subhead rounded-2xl bg-orange/12 px-4 py-3">
          <strong className="font-semibold">{examples} producten hebben nog een voorbeeldprijs.</strong> Tik erop en vul je eigen inkoopprijs in.
        </p>
      )}

      {materials.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl bg-surface px-6 py-10 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-[18px] bg-[#5856d6]/15 text-[#5856d6]">
            <BucketIcon className="size-8" />
          </span>
          <h2 className="text-title-2">Nog geen materialen</h2>
          <p className="text-body mt-2 max-w-xs text-label-2">
            Begin met een voorbeeldlijst van {STARTER_MATERIALS.length} veelgebruikte producten. Pas daarna de prijzen aan naar jouw inkoopprijs.
          </p>
          <form action={addStarterMaterials} className="mt-8 w-full max-w-xs">
            <Button type="submit">Voorbeeldlijst toevoegen</Button>
          </form>
          <Link href="/instellingen/materialen/nieuw" className="text-body mt-4 text-tint">
            Of zelf een materiaal toevoegen
          </Link>
        </section>
      ) : (
        <ListGroup footer="Het bovenste materiaal bij een werksoort wordt standaard gebruikt in de berekening.">
          {materials.map((m) => (
            <ListRow
              key={m.id}
              title={m.name}
              subtitle={
                <>
                  {formatEuro(m.purchase_price_cents)} per {formatNumber(Number(m.package_size))} {m.unit}
                  {m.coverage_m2_per_unit_per_coat !== null && ` · ${formatNumber(Number(m.coverage_m2_per_unit_per_coat))} m² per ${m.unit}`}
                </>
              }
              value={m.is_example_price ? <span className="text-footnote font-semibold text-orange">Voorbeeld</span> : undefined}
              href={`/instellingen/materialen/${m.id}`}
            />
          ))}
        </ListGroup>
      )}

      {materials.length > 0 && examples > 0 && <p className="text-footnote -mt-4 px-4 text-label-2">&quot;Voorbeeld&quot; = {EXAMPLE_PRICE_LABEL.toLowerCase()}.</p>}
    </Page>
  );
}
