"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListRow } from "@/components/ui/List";
import { NumberInput } from "@/components/ui/NumberInput";
import { calculateQuote, lineKey } from "@/lib/calc";
import type { CalcLine, CalcSettings, VatConfig } from "@/lib/calc/types";
import type { Extraction } from "@/lib/ai/extraction";
import { formatEuro, formatNumber } from "@/lib/format";
import { type QuoteDraft, draftToCalcInput } from "@/lib/quotes/draft";
import { centsToInput, parseEuroToCents } from "@/lib/settings/parse";
import { saveQuote } from "../actions";

type Item = Extraction["rooms"][number]["items"][number];

const KIND_LABEL: Record<Item["kind"], string> = { walls: "Muren", ceiling: "Plafond", doors: "Deuren", frames: "Kozijnen", skirting: "Plinten" };

const emptyItem = (kind: Item["kind"]): Item => ({
  kind,
  lengthM: null,
  widthM: null,
  heightM: null,
  areaM2: null,
  openings: [],
  coats: null,
  count: null,
  sides: null,
  cracks: false,
  crackLengthM: null,
  peeling: false,
});

type Props = { id: string; initial: QuoteDraft; settings: CalcSettings; vatConfig: VatConfig; quoteDate: string; editable: boolean };

export function QuoteEditor({ id, initial, settings, vatConfig, quoteDate, editable }: Props) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // The same pure calculation as on the server, so totals change while typing.
  const calc = useMemo(() => {
    try {
      return calculateQuote({ ...draftToCalcInput(draft), settings, vatConfig, quoteDate });
    } catch {
      return null;
    }
  }, [draft, settings, vatConfig, quoteDate]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const update = (fn: (d: QuoteDraft) => void) => {
    setDraft((d) => {
      const next = structuredClone(d);
      fn(next);
      return next;
    });
    setMessage(null);
  };
  const needed = (room: string, field: string) => !!calc?.missingInfo.some((m) => m.room === room && (m.field === field || (field === "widthM" && m.field === "lengthM")));

  function save() {
    startTransition(async () => {
      const result = await saveQuote(id, draft);
      if (result.ok) {
        setSaved(draft);
        setMessage({ ok: true, text: "Opgeslagen." });
      } else {
        setMessage({ ok: false, text: result.message });
      }
    });
  }

  const vat = draft.extraction.vat;
  const missingCount = (calc?.missingInfo.length ?? 0) + (calc?.missingSettings.length ?? 0);

  return (
    <fieldset disabled={!editable || pending} className="flex min-w-0 flex-col gap-7">
      {calc && missingCount > 0 && (
        <ListGroup header={`Nog nodig (${missingCount})`} footer="Vul de oranje velden hieronder in. Zonder deze gegevens rekent de app dat deel niet uit.">
          {calc.missingInfo.map((q, i) => (
            <ListRow key={`q${i}`} title={q.question} />
          ))}
          {calc.missingSettings.map((s) => (
            <ListRow key={s.key} title={s.message} href="/instellingen" />
          ))}
        </ListGroup>
      )}

      {draft.extraction.notUnderstood.length > 0 && (
        <ListGroup header="Niet verwerkt door de app" footer="Dit kan de app niet berekenen. Voeg het als eigen regel toe onder Berekening als het op de offerte moet.">
          {draft.extraction.notUnderstood.map((t, i) => (
            <ListRow key={i} title={t} />
          ))}
        </ListGroup>
      )}

      <ListGroup header="Klant en werkadres">
        <div className="grid grid-cols-1 gap-3 p-4">
          <TextInput label="Naam klant" value={draft.client.name} onChange={(v) => update((d) => void (d.client.name = v))} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="E-mail" type="email" value={draft.client.email} onChange={(v) => update((d) => void (d.client.email = v))} />
            <TextInput label="Telefoon" type="tel" value={draft.client.phone} onChange={(v) => update((d) => void (d.client.phone = v))} />
          </div>
          <TextInput label="Straat en huisnummer" value={draft.workAddress.street} onChange={(v) => update((d) => void (d.workAddress.street = v))} />
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <TextInput label="Postcode" value={draft.workAddress.postalCode} onChange={(v) => update((d) => void (d.workAddress.postalCode = v))} />
            <TextInput label="Plaats" value={draft.workAddress.city} onChange={(v) => update((d) => void (d.workAddress.city = v))} />
          </div>
        </div>
      </ListGroup>

      <ListGroup header="Btw-vragen" footer="Bepaalt of het werk 9% of 21% btw krijgt. Check bij twijfel met je boekhouder.">
        <div className="grid gap-3 p-4">
          <SelectInput
            label="Wat voor gebouw is het?"
            value={vat.usageType ?? ""}
            needed={vat.usageType === null}
            options={[
              ["", "Kies…"],
              ["residential", "Woning"],
              ["mixed", "Deels wonen, deels werken"],
              ["non_residential", "Geen woning (winkel, kantoor, bedrijf)"],
            ]}
            onChange={(v) => update((d) => void (d.extraction.vat.usageType = v === "" ? null : (v as typeof vat.usageType)))}
          />
          {vat.usageType !== "non_residential" && (
            <SelectInput
              label="Is de woning 2 jaar of langer geleden voor het eerst in gebruik genomen?"
              value={vat.dwellingOlderThanTwoYears === null ? "" : vat.dwellingOlderThanTwoYears ? "yes" : "no"}
              needed={vat.usageType !== null && vat.dwellingOlderThanTwoYears === null}
              options={[
                ["", "Kies…"],
                ["yes", "Ja, 2 jaar of langer"],
                ["no", "Nee, korter dan 2 jaar"],
              ]}
              onChange={(v) => update((d) => void (d.extraction.vat.dwellingOlderThanTwoYears = v === "" ? null : v === "yes"))}
            />
          )}
          {vat.usageType === "mixed" && (
            <NumberInput
              label="Welk deel is woongedeelte?"
              suffix="%"
              integer
              value={vat.residentialSharePct}
              needed
              onChange={(n) => update((d) => void (d.extraction.vat.residentialSharePct = n))}
            />
          )}
        </div>
      </ListGroup>

      {draft.extraction.rooms.map((room, ri) => (
        <ListGroup key={ri} header={`Ruimte ${ri + 1}`}>
          <div className="flex items-end gap-3 border-b border-separator p-4">
            <TextInput label="Naam" value={room.name} onChange={(v) => update((d) => void (d.extraction.rooms[ri].name = v))} />
            <button type="button" onClick={() => update((d) => void d.extraction.rooms.splice(ri, 1))} className="text-subhead pb-2 text-red">
              Verwijder ruimte
            </button>
          </div>
          {room.items.map((item, ii) => (
            <ItemEditor
              key={`${ri}-${ii}-${item.kind}`}
              item={item}
              needed={(f) => needed(room.name, f)}
              onChange={(fn) => update((d) => fn(d.extraction.rooms[ri].items[ii]))}
              onRemove={() => update((d) => void d.extraction.rooms[ri].items.splice(ii, 1))}
            />
          ))}
          <div className="flex flex-wrap gap-2 p-4">
            {(Object.keys(KIND_LABEL) as Item["kind"][]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => update((d) => void d.extraction.rooms[ri].items.push(emptyItem(k)))}
                className="text-subhead rounded-control border border-separator px-3 py-2 text-tint active:bg-fill"
              >
                + {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </ListGroup>
      ))}
      <Button type="button" variant="tinted" onClick={() => update((d) => void d.extraction.rooms.push({ name: `Ruimte ${d.extraction.rooms.length + 1}`, items: [] }))}>
        + Ruimte toevoegen
      </Button>

      {calc && (
        <ListGroup header="Berekening" footer="Elk bedrag is herleidbaar. Tik op Aanpassen om een bedrag zelf te bepalen.">
          {calc.lines.map((line, i) => (
            <LineRow
              key={`${lineKey(line)}-${i}`}
              line={line}
              onOverride={(cents) =>
                update((d) => {
                  if (cents === null) delete d.overrides[lineKey(line)];
                  else d.overrides[lineKey(line)] = cents;
                })
              }
              onRemoveExtra={
                line.kind === "other"
                  ? () =>
                      update((d) => {
                        const idx = d.extraLines.findIndex((x) => x.description === line.description && x.room === line.room && x.amountCents === line.amountCents);
                        if (idx >= 0) d.extraLines.splice(idx, 1);
                      })
                  : undefined
              }
            />
          ))}
          <ExtraLineForm rooms={draft.extraction.rooms.map((r) => r.name)} onAdd={(l) => update((d) => void d.extraLines.push(l))} />
        </ListGroup>
      )}

      {calc && (
        <ListGroup header="Totaal">
          <ListRow title="Subtotaal excl. btw" value={formatEuro(calc.subtotalCents)} />
          {calc.vat ? (
            calc.vat.map((v) => <ListRow key={v.rateBp} title={`Btw ${formatNumber(v.rateBp / 100)}% over ${formatEuro(v.baseCents)}`} value={formatEuro(v.vatCents)} />)
          ) : (
            <ListRow title="Btw" value={<span className="text-orange">Nog niet te berekenen</span>} />
          )}
          {calc.totalCents !== null && (
            <ListRow title={<span className="font-semibold">Totaal incl. btw</span>} value={<span className="font-semibold text-label">{formatEuro(calc.totalCents)}</span>} />
          )}
        </ListGroup>
      )}
      {calc?.warnings.map((w) => (
        <p key={w} className="text-subhead -mt-3 rounded-card border-l-[3px] border-orange bg-orange/10 px-4 py-3">
          {w}
        </p>
      ))}

      <ListGroup header="Werkomschrijving" footer="Komt op de offerte. Zonder bedragen; pas de tekst gerust aan.">
        <div className="p-4">
          <textarea
            aria-label="Werkomschrijving"
            rows={6}
            value={draft.description}
            onChange={(e) => update((d) => void (d.description = e.target.value))}
            className="text-body w-full resize-y rounded-control border border-separator bg-surface-2 px-3 py-2 outline-none focus:border-tint"
          />
        </div>
      </ListGroup>

      <Disclaimer />

      {editable && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-10 flex flex-col gap-2 border-t border-separator bg-bg/95 py-3">
          {message && (
            <p role="status" className={`text-subhead text-center ${message.ok ? "text-green" : "text-red"}`}>
              {message.text}
            </p>
          )}
          <Button type="button" onClick={save} disabled={!dirty || pending}>
            {pending ? "Bezig met opslaan…" : dirty ? "Opslaan" : "Alles is opgeslagen"}
          </Button>
          {!dirty && calc?.complete && (
            <Link href={`/offertes/${id}/pdf`} target="_blank" className="text-body text-center text-tint">
              Pdf bekijken
            </Link>
          )}
        </div>
      )}
    </fieldset>
  );
}

function ItemEditor({ item, needed, onChange, onRemove }: { item: Item; needed: (field: string) => boolean; onChange: (fn: (i: Item) => void) => void; onRemove: () => void }) {
  const set = (field: keyof Item) => (n: number | null) => onChange((i) => void ((i as Record<string, unknown>)[field] = n));
  const surface = item.kind === "walls" || item.kind === "ceiling";
  return (
    <div data-separator className="border-b border-separator p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-headline">{KIND_LABEL[item.kind]}</span>
        <button type="button" onClick={onRemove} className="text-subhead text-red">
          Verwijder
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {surface && (
          <>
            <NumberInput label="Lengte" suffix="m" value={item.lengthM} needed={needed("lengthM")} onChange={set("lengthM")} />
            <NumberInput label="Breedte" suffix="m" value={item.widthM} needed={needed("widthM")} onChange={set("widthM")} />
            {item.kind === "walls" ? <NumberInput label="Hoogte" suffix="m" value={item.heightM} needed={needed("heightM")} onChange={set("heightM")} /> : <span />}
            <NumberInput label="Of: oppervlakte" suffix="m²" value={item.areaM2} onChange={set("areaM2")} />
            <NumberInput label="Lagen" integer value={item.coats} onChange={set("coats")} />
          </>
        )}
        {item.kind === "doors" && (
          <>
            <NumberInput label="Aantal" integer value={item.count} needed={needed("count")} onChange={set("count")} />
            <NumberInput label="Kanten" integer value={item.sides} needed={needed("sides")} onChange={set("sides")} />
          </>
        )}
        {item.kind === "frames" && (
          <>
            <NumberInput label="Aantal" integer value={item.count} needed={needed("count")} onChange={set("count")} />
            <NumberInput label="Of: meter" suffix="m" value={item.lengthM} needed={needed("lengthM")} onChange={set("lengthM")} />
          </>
        )}
        {item.kind === "skirting" && <NumberInput label="Lengte" suffix="m" value={item.lengthM} needed={needed("lengthM")} onChange={set("lengthM")} />}
      </div>

      {item.kind === "walls" && (
        <div className="mt-3">
          <span className="text-caption text-label-2">Ramen en deuren in de muren (gaan eraf)</span>
          {item.openings.map((o, oi) => (
            <div key={oi} className="mt-2 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              <NumberInput label="Breedte" suffix="m" value={o.widthM} needed={needed(`openings.${oi}`)} onChange={(n) => onChange((i) => void (i.openings[oi].widthM = n))} />
              <NumberInput label="Hoogte" suffix="m" value={o.heightM} needed={needed(`openings.${oi}`)} onChange={(n) => onChange((i) => void (i.openings[oi].heightM = n))} />
              <NumberInput label="Aantal" integer value={o.count} onChange={(n) => onChange((i) => void (i.openings[oi].count = n ?? 1))} />
              <button type="button" aria-label="Verwijder opening" onClick={() => onChange((i) => void i.openings.splice(oi, 1))} className="text-body pb-2 text-red">
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChange((i) => void i.openings.push({ widthM: null, heightM: null, count: 1 }))} className="text-subhead mt-2 text-tint">
            + Raam of deur
          </button>
        </div>
      )}

      {item.kind !== "frames" && item.kind !== "skirting" && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {item.kind !== "doors" && <Check label="Scheuren repareren" checked={item.cracks} onChange={(v) => onChange((i) => void (i.cracks = v))} />}
          <Check label="Verf bladdert" checked={item.peeling} onChange={(v) => onChange((i) => void (i.peeling = v))} />
        </div>
      )}
      {item.kind !== "frames" && item.kind !== "skirting" && item.kind !== "doors" && item.cracks && needed("crackLengthM") && (
        <div className="mt-3 max-w-40">
          <NumberInput label="Lengte scheuren" suffix="m" value={item.crackLengthM} needed onChange={set("crackLengthM")} />
        </div>
      )}
    </div>
  );
}

function LineRow({ line, onOverride, onRemoveExtra }: { line: CalcLine; onOverride: (cents: number | null) => void; onRemoveExtra?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(centsToInput(line.amountCents));
  const cents = parseEuroToCents(text);
  return (
    <div data-separator className="border-b border-separator px-4 py-3">
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
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {onRemoveExtra ? (
          <button type="button" onClick={onRemoveExtra} className="text-subhead text-red">
            Verwijder regel
          </button>
        ) : editing ? (
          <>
            <span className="flex items-center rounded-control border border-separator bg-surface-2 px-2.5 focus-within:border-tint">
              <span className="text-subhead pr-1 text-label-2">€</span>
              <input
                inputMode="decimal"
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Nieuw bedrag"
                className="text-body tabular w-24 bg-transparent py-1.5 outline-none"
              />
            </span>
            <button
              type="button"
              disabled={cents === null || cents < 0}
              onClick={() => {
                onOverride(cents);
                setEditing(false);
              }}
              className="text-subhead font-semibold text-tint disabled:text-label-3"
            >
              Gebruik dit bedrag
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-subhead text-label-2">
              Annuleer
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="text-subhead text-tint">
              Aanpassen
            </button>
            {line.calculatedAmountCents !== undefined && (
              <button type="button" onClick={() => onOverride(null)} className="text-subhead text-label-2">
                Terug naar berekend ({formatEuro(line.calculatedAmountCents)})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExtraLineForm({ rooms, onAdd }: { rooms: string[]; onAdd: (l: QuoteDraft["extraLines"][number]) => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState<"labor" | "material">("labor");
  const cents = parseEuroToCents(amount);
  const valid = description.trim().length > 0 && cents !== null;
  return (
    <div className="grid gap-3 bg-surface-2/50 p-4">
      <span className="text-headline">Eigen regel toevoegen</span>
      <TextInput label="Omschrijving" value={description} onChange={setDescription} />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-caption text-label-2">Bedrag excl. btw</span>
          <span className="flex items-center rounded-control border border-separator bg-surface px-2.5 focus-within:border-tint">
            <span className="text-subhead pr-1 text-label-2">€</span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-body tabular min-w-0 flex-1 bg-transparent py-2 outline-none" />
          </span>
        </label>
        <SelectInput
          label="Soort"
          value={category}
          options={[
            ["labor", "Werk"],
            ["material", "Materiaal"],
          ]}
          onChange={(v) => setCategory(v as "labor" | "material")}
        />
      </div>
      <SelectInput label="Ruimte" value={room} options={[["", "Hele klus"], ...rooms.map((r) => [r, r] as [string, string])]} onChange={setRoom} />
      <Button
        type="button"
        variant="tinted"
        disabled={!valid}
        onClick={() => {
          onAdd({ room: room || null, description: description.trim(), amountCents: cents!, vatCategory: category });
          setDescription("");
          setAmount("");
        }}
      >
        Regel toevoegen
      </Button>
    </div>
  );
}

function TextInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-caption text-label-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-body rounded-control border border-separator bg-surface-2 px-2.5 py-2 outline-none focus:border-tint"
      />
    </label>
  );
}

function SelectInput({ label, value, options, onChange, needed }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void; needed?: boolean }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-caption text-label-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-body rounded-control border px-2.5 py-2 outline-none focus:border-tint ${needed ? "border-orange bg-orange/10" : "border-separator bg-surface-2"}`}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="text-subhead flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[var(--tint)]" />
      {label}
    </label>
  );
}
