import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { ButtonLink } from "@/components/ui/Button";
import { DocIcon, PlusIcon } from "@/components/ui/Icons";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Page } from "@/components/ui/Page";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatEuro } from "@/lib/format";
import { type QuoteListItem, listQuotes } from "@/lib/quotes/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function QuotesPage() {
  const configured = isSupabaseConfigured();
  const quotes: QuoteListItem[] = configured ? await listQuotes() : [];

  return (
    <Page
      title="Offertes"
      action={
        <Link href="/nieuw" aria-label="Nieuwe offerte" className="flex size-11 items-center justify-center rounded-full text-tint active:opacity-60">
          <PlusIcon className="size-6" />
        </Link>
      }
    >
      {!configured && (
        <div className="text-subhead rounded-card border-l-[3px] border-orange bg-orange/10 px-4 py-3 text-label">
          <strong className="font-semibold">Database nog niet gekoppeld.</strong> De app werkt, maar slaat nog niets op. Zie de README.
        </div>
      )}

      {quotes.length === 0 ? (
        <section className="flex flex-col items-center rounded-card border border-separator bg-surface px-6 py-12 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-card bg-tint-soft text-tint">
            <DocIcon className="size-8" />
          </span>
          <h2 className="text-title-2">Nog geen offertes</h2>
          <p className="text-body mt-2 max-w-xs text-label-2">Spreek de klus in, controleer, verstuur. Je offerte is in een paar minuten klaar.</p>
          <ButtonLink href="/nieuw" className="mt-8 max-w-xs">
            <PlusIcon />
            Nieuwe offerte
          </ButtonLink>
        </section>
      ) : (
        <>
          <ListGroup header={`${quotes.length} ${quotes.length === 1 ? "offerte" : "offertes"}`}>
            {quotes.map((q) => (
              <ListRow
                key={q.id}
                title={q.client_name ?? "Klant nog onbekend"}
                subtitle={[q.quote_number, q.work_street, q.work_city, q.total_cents !== null ? formatEuro(q.total_cents) : null].filter(Boolean).join(" · ")}
                value={<StatusBadge status={q.status} />}
                href={`/offertes/${q.id}`}
              />
            ))}
          </ListGroup>
          <ButtonLink href="/nieuw">
            <PlusIcon />
            Nieuwe offerte
          </ButtonLink>
        </>
      )}

      <Disclaimer />
    </Page>
  );
}
