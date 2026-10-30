// The quote as the client sees it: a clean A4 PDF in Dutch, generated on the server.
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { QuoteCalculation } from "@/lib/calc/types";
import { formatEuro, formatNumber } from "@/lib/format";
import type { QuoteDraft } from "@/lib/quotes/draft";
import type { ProfileRow } from "@/lib/settings/toCalcSettings";

const NAVY = "#051c2c";
const BLUE = "#2251ff";
const GREY = "#51606c";
const RULE = "#dce1e5";

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 10, color: NAVY, lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  company: { fontFamily: "Times-Bold", fontSize: 18, lineHeight: 1.15, marginBottom: 4 },
  small: { fontSize: 8.5, color: GREY },
  accent: { width: 36, height: 3, backgroundColor: BLUE, marginBottom: 8 },
  title: { fontFamily: "Times-Roman", fontSize: 26, lineHeight: 1.1, marginBottom: 14 },
  meta: { flexDirection: "row", gap: 24, marginBottom: 16 },
  label: { fontSize: 7.5, color: GREY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  section: { marginBottom: 14 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.8, color: GREY, marginBottom: 6 },
  row: { flexDirection: "row", paddingVertical: 3.5, borderBottomWidth: 0.5, borderBottomColor: RULE },
  desc: { flex: 1, paddingRight: 8 },
  qty: { width: 80, textAlign: "right", color: GREY },
  amount: { width: 80, textAlign: "right" },
  roomTitle: { fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 2 },
  totals: { marginLeft: "auto", width: 240, marginTop: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTopWidth: 1.5, borderTopColor: NAVY, fontFamily: "Helvetica-Bold", fontSize: 12 },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 7.5, color: GREY },
});

type Props = {
  profile: ProfileRow;
  draft: QuoteDraft;
  calculation: QuoteCalculation;
  quoteNumber: string;
  date: string;
  validUntil: string | null;
};

const nlDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

export function QuotePdf({ profile, draft, calculation, quoteNumber, date, validUntil }: Props) {
  const rooms = [...new Set(calculation.lines.map((l) => l.room))];
  const address = [draft.workAddress.street, [draft.workAddress.postalCode, draft.workAddress.city].filter(Boolean).join(" ")].filter(Boolean);
  const companyAddress = [profile.street, [profile.postal_code, profile.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <Document title={`Offerte ${quoteNumber}`} author={profile.company_name ?? undefined} language="nl">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.company}>{profile.company_name}</Text>
            {companyAddress && <Text style={s.small}>{companyAddress}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {profile.email && <Text style={s.small}>{profile.email}</Text>}
            {profile.phone && <Text style={s.small}>{profile.phone}</Text>}
            {profile.kvk_number && <Text style={s.small}>KVK {profile.kvk_number}</Text>}
            {profile.vat_number && <Text style={s.small}>Btw-id {profile.vat_number}</Text>}
            {profile.iban && <Text style={s.small}>IBAN {profile.iban}</Text>}
          </View>
        </View>

        <View style={s.accent} />
        <Text style={s.title}>Offerte</Text>
        <View style={s.meta}>
          <View>
            <Text style={s.label}>Nummer</Text>
            <Text>{quoteNumber}</Text>
          </View>
          <View>
            <Text style={s.label}>Datum</Text>
            <Text>{nlDate(date)}</Text>
          </View>
          {validUntil && (
            <View>
              <Text style={s.label}>Geldig tot</Text>
              <Text>{nlDate(validUntil)}</Text>
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Voor</Text>
          <Text>{draft.client.name || "—"}</Text>
          {address.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>

        {draft.description.trim() && (
          <View style={s.section}>
            <Text style={s.h2}>Werkomschrijving</Text>
            {draft.description.trim().split(/\n\s*\n/).map((p, i) => (
              <Text key={i} style={{ marginBottom: 4 }}>
                {p.trim()}
              </Text>
            ))}
          </View>
        )}

        <View style={s.section}>
          <Text style={s.h2}>Specificatie</Text>
          <View style={[s.row, { borderBottomColor: NAVY }]}>
            <Text style={[s.desc, s.small]}>Omschrijving</Text>
            <Text style={[s.qty, s.small]}>Aantal</Text>
            <Text style={[s.amount, s.small]}>Bedrag excl. btw</Text>
          </View>
          {rooms.map((room) => (
            <View key={room ?? "_"} wrap={false}>
              <Text style={s.roomTitle}>{room ?? "Algemeen"}</Text>
              {calculation.lines
                .filter((l) => l.room === room)
                .map((l, i) => (
                  <View key={i} style={s.row}>
                    {/* "(standaard)" is a note for the painter, not for the client. */}
                    <Text style={s.desc}>{l.description.replace(" (standaard)", "")}</Text>
                    <Text style={s.qty}>{l.kind === "other" || l.unit === "keer" ? "" : `${formatNumber(l.quantity)} ${l.unit}`}</Text>
                    <Text style={s.amount}>{formatEuro(l.amountCents)}</Text>
                  </View>
                ))}
            </View>
          ))}

          <View style={s.totals} wrap={false}>
            <View style={s.totalRow}>
              <Text>Subtotaal excl. btw</Text>
              <Text>{formatEuro(calculation.subtotalCents)}</Text>
            </View>
            {calculation.vat?.map((v) => (
              <View key={v.rateBp} style={s.totalRow}>
                <Text>
                  Btw {formatNumber(v.rateBp / 100)}% over {formatEuro(v.baseCents)}
                </Text>
                <Text>{formatEuro(v.vatCents)}</Text>
              </View>
            ))}
            <View style={s.grand}>
              <Text>Totaal incl. btw</Text>
              <Text>{formatEuro(calculation.totalCents ?? 0)}</Text>
            </View>
          </View>
        </View>

        {profile.terms_text && (
          <View style={s.section}>
            <Text style={s.h2} minPresenceAhead={24}>
              Voorwaarden
            </Text>
            <Text style={s.small}>{profile.terms_text}</Text>
          </View>
        )}

        <Text style={s.footer} fixed>
          {profile.company_name} · Offerte {quoteNumber}
        </Text>
      </Page>
    </Document>
  );
}
