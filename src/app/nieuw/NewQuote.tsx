"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import { SubmitButton } from "@/components/ui/Form";
import { ListGroup, ListRow } from "@/components/ui/List";
import { summarizeItem, summarizeVat } from "@/lib/ai/summary";
import { formatEuro, formatNumber } from "@/lib/format";
import { type AnalyzeState, analyze } from "./actions";

const EXAMPLE =
  "Bijvoorbeeld: Woonkamer, muren en plafond sauzen, vier bij vijf meter, twee meter zestig hoog, twee ramen van anderhalf bij één twintig. Woning uit 1985.";

export function NewQuote() {
  const [state, action] = useActionState<AnalyzeState, FormData>(analyze, { status: "idle" });
  const r = state.result;

  return (
    <div className="flex flex-col gap-7">
      <form action={action} className="flex flex-col gap-4">
        <div className="rounded-card border border-separator bg-surface px-4 py-3 focus-within:border-tint">
          <label htmlFor="text" className="text-section mb-2 block text-label-2">
            Beschrijf de klus
          </label>
          <textarea
            id="text"
            name="text"
            rows={6}
            required
            defaultValue={state.text}
            placeholder={EXAMPLE}
            className="text-body w-full resize-y bg-transparent outline-none placeholder:text-label-3"
          />
        </div>
        {state.status === "error" && (
          <p role="alert" className="text-subhead rounded-card border-l-[3px] border-red bg-red/10 px-4 py-3">
            {state.message}
          </p>
        )}
        <SubmitButton>{r ? "Opnieuw verwerken" : "Verwerken"}</SubmitButton>
        <p className="text-footnote px-1 text-label-2">Inspreken komt hierna. De AI ordent alleen wat je zegt; de app rekent alles met jouw eigen instellingen.</p>
      </form>

      {r && (
        <>
          {(r.calculation.missingInfo.length > 0 || r.calculation.missingSettings.length > 0) && (
            <ListGroup header="Nog nodig" footer="Zonder deze gegevens rekent de app dat deel niet uit. Aanvullen in de app komt in de volgende stap.">
              {r.calculation.missingInfo.map((q, i) => (
                <ListRow key={`q${i}`} title={q.question} value={<Tag reason={q.reason} />} />
              ))}
              {r.calculation.missingSettings.map((s) => (
                <ListRow key={s.key} title={s.message} href="/instellingen" />
              ))}
            </ListGroup>
          )}

          {r.extraction.notUnderstood.length > 0 && (
            <ListGroup header="Niet verwerkt" footer="Dit kan de app niet berekenen. Voeg het zelf toe aan de offerte.">
              {r.extraction.notUnderstood.map((t, i) => (
                <ListRow key={i} title={t} />
              ))}
            </ListGroup>
          )}

          {r.extraction.rooms.map((room, ri) => (
            <ListGroup key={ri} header={`Begrepen: ${room.name}`}>
              {room.items.map((item, ii) => (
                <ListRow key={ii} title={summarizeItem(item)} />
              ))}
            </ListGroup>
          ))}

          <ListGroup header="Btw en klant">
            <ListRow title="Gebouw" value={summarizeVat(r.extraction.vat)} />
            <ListRow title="Klant" value={r.extraction.client.name ?? "Niet genoemd"} />
            {r.extraction.client.address && <ListRow title="Adres" value={r.extraction.client.address} />}
          </ListGroup>

          {r.calculation.lines.length > 0 && (
            <ListGroup header="Berekening" footer="Elk bedrag is herleidbaar: de uitleg staat onder de regel.">
              {r.calculation.lines.map((line, i) => (
                <div key={i} data-separator className="border-b border-separator px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-body">
                      {line.room ? <span className="text-label-2">{line.room} · </span> : null}
                      {line.description}
                    </span>
                    <span className="text-body tabular shrink-0 font-semibold">{formatEuro(line.amountCents)}</span>
                  </div>
                  {line.explanation.map((e, j) => (
                    <p key={j} className="text-footnote tabular mt-1.5 border-l-2 border-tint bg-tint-soft px-2.5 py-1 text-label-2">
                      {e}
                    </p>
                  ))}
                </div>
              ))}
            </ListGroup>
          )}

          <ListGroup header="Totaal">
            <ListRow title="Subtotaal excl. btw" value={formatEuro(r.calculation.subtotalCents)} />
            {r.calculation.vat ? (
              r.calculation.vat.map((v) => <ListRow key={v.rateBp} title={`Btw ${formatNumber(v.rateBp / 100)}% over ${formatEuro(v.baseCents)}`} value={formatEuro(v.vatCents)} />)
            ) : (
              <ListRow title="Btw" value={<span className="text-orange">Nog niet te berekenen</span>} />
            )}
            {r.calculation.totalCents !== null && (
              <ListRow title={<span className="font-semibold">Totaal incl. btw</span>} value={<span className="font-semibold text-label">{formatEuro(r.calculation.totalCents)}</span>} />
            )}
          </ListGroup>

          {r.calculation.warnings.map((w) => (
            <p key={w} className="text-subhead -mt-3 rounded-card border-l-[3px] border-orange bg-orange/10 px-4 py-3">
              {w}
            </p>
          ))}

          <ListGroup header="Werkomschrijving" footer={r.descriptionSource === "ai" ? "Geschreven door de AI, zonder bedragen. Je kunt de tekst straks aanpassen." : "Standaardtekst. De AI-tekst is niet gebruikt omdat die niet aan de regels voldeed."}>
            <p className="text-body whitespace-pre-line px-4 py-3">{r.description}</p>
          </ListGroup>

          <Disclaimer />
          <p className="text-footnote -mt-4 text-center text-label-2">
            Klopt een instelling niet? <Link href="/instellingen" className="text-tint">Pas hem aan</Link> en verwerk opnieuw.
          </p>
        </>
      )}
    </div>
  );
}

function Tag({ reason }: { reason: "missing" | "invalid" | "unsupported" }) {
  const label = reason === "missing" ? "Ontbreekt" : reason === "invalid" ? "Klopt niet" : "Kan niet";
  return <span className="text-section rounded-control border border-orange/50 bg-orange/10 px-2 py-[3px] text-[11px] text-orange">{label}</span>;
}
