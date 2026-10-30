import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePdf } from "@/lib/pdf/QuotePdf";
import { calculateDraft, loadCalcContext, loadQuote, todayInNL } from "@/lib/quotes/data";
import { loadProfile } from "@/lib/settings/data";

// The PDF is generated on the server from the saved draft, always recalculated.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await loadQuote(id);
  if (!quote) return new Response("Offerte niet gevonden.", { status: 404 });

  const [profile, ctx] = await Promise.all([loadProfile(), loadCalcContext()]);
  const date = quote.sent_at ? todayInNL(new Date(quote.sent_at)) : todayInNL();
  const calculation = calculateDraft(quote.draft, ctx, date);
  if (!calculation.complete || calculation.totalCents === null) {
    return new Response("Deze offerte is nog niet compleet. Vul eerst alle ontbrekende gegevens in.", { status: 409, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (!profile.company_name) {
    return new Response("Vul eerst je bedrijfsgegevens in bij Instellingen.", { status: 409, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  // QuotePdf has no hooks, so calling it gives the <Document> element renderToBuffer expects.
  const pdf = await renderToBuffer(QuotePdf({ profile, draft: quote.draft, calculation, quoteNumber: quote.quote_number, date, validUntil: quote.valid_until }));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="offerte-${quote.quote_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
