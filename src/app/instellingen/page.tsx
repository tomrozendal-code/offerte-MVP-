import { BucketIcon, BuildingIcon, ClockIcon, EuroIcon, PercentIcon } from "@/components/ui/Icons";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Page } from "@/components/ui/Page";

export default function SettingsPage() {
  return (
    <Page title="Instellingen">
      <ListGroup header="Jouw bedrijf" footer="Deze gegevens komen op elke offerte.">
        <ListRow icon={<BuildingIcon />} title="Bedrijfsgegevens" value="Fase 2" />
        <ListRow icon={<EuroIcon />} iconColor="bg-green" title="Tarieven" value="Fase 2" />
      </ListGroup>

      <ListGroup header="Rekenen" footer="Alle bedragen komen uit jouw eigen normen en prijzen. De AI rekent nooit.">
        <ListRow icon={<ClockIcon />} iconColor="bg-orange" title="Normen per werksoort" value="Fase 2" />
        <ListRow icon={<BucketIcon />} iconColor="bg-[#5856d6]" title="Materialen" value="Fase 2" />
        <ListRow icon={<PercentIcon />} iconColor="bg-red" title="Btw op materialen" value="Fase 2" />
      </ListGroup>

      <ListGroup>
        <ListRow title="Design-voorbeelden" href="/design" />
      </ListGroup>
    </Page>
  );
}
