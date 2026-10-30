import { notFound } from "next/navigation";
import { Page } from "@/components/ui/Page";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { calculateDraft, loadCalcContext, loadQuote, todayInNL } from "@/lib/quotes/data";
import { deleteQuote } from "../actions";
import { QuoteEditor } from "./QuoteEditor";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await loadQuote(id);
  if (!quote) notFound();
  const ctx = await loadCalcContext();
  const today = todayInNL();
  const editable = quote.status === "draft";
  // Validate early so a broken stored draft gives a clear error instead of a crash in the browser.
  calculateDraft(quote.draft, ctx, today);

  return (
    <Page title={`Offerte ${quote.quote_number}`} back={{ href: "/", label: "Offertes" }}>
      <div className="-mt-4 flex items-center gap-3 px-1">
        <StatusBadge status={quote.status} />
        {quote.valid_until && <span className="text-footnote text-label-2">Geldig tot {new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("nl-NL")}</span>}
      </div>
      <QuoteEditor id={quote.id} initial={quote.draft} settings={ctx.settings} vatConfig={ctx.vatConfig} quoteDate={today} editable={editable} />
      {editable && (
        <form action={deleteQuote} className="pb-24">
          <input type="hidden" name="id" value={quote.id} />
          <button type="submit" className="text-subhead w-full py-3 text-red">
            Concept verwijderen
          </button>
        </form>
      )}
    </Page>
  );
}
