import { BellIcon, BucketIcon, BuildingIcon, ClockIcon, EuroIcon, PercentIcon } from "@/components/ui/Icons";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Page } from "@/components/ui/Page";
import { formatEuro } from "@/lib/format";
import { loadAccountEmail, loadMaterials, loadNorms, loadProfile } from "@/lib/settings/data";
import { logout } from "../login/actions";

const todo = <span className="text-orange">Nog invullen</span>;

export default async function SettingsPage() {
  const [profile, norms, materials, email] = await Promise.all([loadProfile(), loadNorms(), loadMaterials(), loadAccountEmail()]);
  const examples = materials.filter((m) => m.is_example_price).length;

  return (
    <Page title="Instellingen">
      <ListGroup header="Jouw bedrijf" footer="Deze gegevens komen op elke offerte.">
        <ListRow icon={<BuildingIcon />} title="Bedrijfsgegevens" value={profile.company_name ?? todo} href="/instellingen/bedrijf" />
        <ListRow
          icon={<EuroIcon />}
          title="Tarieven"
          value={profile.hourly_rate_cents ? `${formatEuro(profile.hourly_rate_cents)}/uur` : todo}
          href="/instellingen/tarieven"
        />
      </ListGroup>

      <ListGroup header="Rekenen" footer="Alle bedragen komen uit jouw eigen normen en prijzen. De AI rekent nooit.">
        <ListRow icon={<ClockIcon />} title="Normen" value={norms.length > 0 ? `${norms.length} ingevuld` : todo} href="/instellingen/normen" />
        <ListRow
          icon={<BucketIcon />}
          title="Materialen"
          subtitle={examples > 0 ? `${examples} met voorbeeldprijs` : undefined}
          value={materials.length > 0 ? materials.length : todo}
          href="/instellingen/materialen"
        />
        <ListRow
          icon={<PercentIcon />}
          title="Btw op materialen"
          value={profile.material_vat_mode === null ? todo : profile.material_vat_mode === "follow_labor" ? "Zelfde als arbeid" : "Altijd 21%"}
          href="/instellingen/btw"
        />
      </ListGroup>

      <ListGroup header="Klussen winnen">
        <ListRow
          icon={<BellIcon />}
          title="Opvolging"
          value={profile.reminders_enabled ? `Dag ${profile.reminder_days.join(" en ")}` : "Uit"}
          href="/instellingen/opvolging"
        />
      </ListGroup>

      {email && (
        <ListGroup header="Account">
          <ListRow title="Ingelogd als" value={email} />
          <form action={logout}>
            <button type="submit" className="text-body w-full px-4 py-3 text-left text-red active:bg-fill">
              Uitloggen
            </button>
          </form>
        </ListGroup>
      )}

      <ListGroup>
        <ListRow title="Design-voorbeelden" href="/design" />
      </ListGroup>
    </Page>
  );
}
