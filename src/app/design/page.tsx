import { Disclaimer } from "@/components/Disclaimer";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Page } from "@/components/ui/Page";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatEuro } from "@/lib/format";

// Living style guide: shows every building block so the look can be judged in one place.
// The amounts below are the fictional example from CLAUDE.md chapter 8, typed in by hand.
export default function DesignPage() {
  return (
    <Page title="Design">
      <ListGroup header="Knoppen">
        <div className="flex flex-col gap-3 p-4">
          <Button>Offerte versturen</Button>
          <Button variant="tinted">Opslaan als concept</Button>
          <Button variant="plain">Annuleren</Button>
          <Button variant="destructive">Verwijderen</Button>
        </div>
      </ListGroup>

      <ListGroup header="Status van offertes">
        <div className="flex flex-wrap gap-2 p-4">
          <StatusBadge status="draft" />
          <StatusBadge status="sent" />
          <StatusBadge status="viewed" />
          <StatusBadge status="reminded" />
          <StatusBadge status="accepted" />
          <StatusBadge status="rejected" />
          <StatusBadge status="expired" />
        </div>
      </ListGroup>

      <ListGroup header="Offertelijst">
        <ListRow title="Fam. de Vries" subtitle="Woonkamer en hal · Utrecht" value={<StatusBadge status="accepted" />} href="/design" />
        <ListRow title="Bakkerij Jansen" subtitle="Winkelruimte · Amersfoort" value={<StatusBadge status="viewed" />} href="/design" />
        <ListRow title="Fam. Bos" subtitle="Hal en trap · Houten" value={<StatusBadge status="reminded" />} href="/design" />
        <ListRow title="M. Yilmaz" subtitle="Slaapkamer · Zeist" value={<StatusBadge status="draft" />} href="/design" />
      </ListGroup>

      <ListGroup header="Woonkamer" footer="Tik op een regel om de berekening te zien en aan te passen.">
        <div className="px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-body">Muren sauzen, 2 lagen</span>
            <span className="text-body tabular font-semibold">{formatEuro(21600)}</span>
          </div>
          <p className="text-footnote tabular mt-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-label-2">
            43,2 m² × 2 lagen ÷ 18 m²/uur = 4,8 uur × € 45
          </p>
        </div>
        <div className="border-t border-separator px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-body">Plafond: scheuren repareren</span>
            <span className="text-subhead font-semibold text-orange">Ontbreekt</span>
          </div>
          <p className="text-footnote mt-1 text-label-2">Hoeveel strekkende meter scheur is er?</p>
        </div>
      </ListGroup>

      <ListGroup header="Totaal">
        <ListRow title="Subtotaal excl. btw" value={formatEuro(21600)} />
        <ListRow title="Btw 9%" value={formatEuro(1944)} />
        <ListRow title={<span className="font-semibold">Totaal incl. btw</span>} value={<span className="font-semibold text-label">{formatEuro(23544)}</span>} />
      </ListGroup>

      <Disclaimer />
    </Page>
  );
}
