# Rekenmodule

Hier wordt alles berekend: oppervlaktes, uren, materiaal, prijzen en btw. Het zijn gewone functies
zonder database, AI of schermen. Zo kun je ze los testen (`npm test`).

De hoofdfunctie is `calculateQuote` in `calculateQuote.ts`. Je geeft hem:

- de klus, zoals de AI die heeft uitgeschreven (ruimtes met muren, plafonds, deuren, kozijnen, plinten);
- de instellingen van de schilder (uurtarief, normen, materialen);
- de antwoorden op de btw-vragen en de btw-tarieven uit de database.

Je krijgt terug: de offerteregels (elk met uitleg), het subtotaal, de btw per tarief en het totaal.

## Nooit gokken

Kan iets niet berekend worden, dan rekent de module die regel **niet** uit en meldt waarom:

| Soort | Betekenis | Voorbeeld |
| --- | --- | --- |
| `missingInfo`, reden `missing` | gegeven ontbreekt | "Slaapkamer: hoe hoog zijn de muren?" |
| `missingInfo`, reden `invalid` | gegeven kan niet kloppen | "Keuken: een hoogte van 0 m kan niet kloppen." |
| `missingInfo`, reden `unsupported` | situatie kan de app niet berekenen | gemengd gebruik vóór 1 juli 2025 |
| `missingSettings` | instelling ontbreekt of past niet | "Vul bij Normen in: Scheuren repareren." |
| `warnings` | wordt niet berekend, voeg zelf toe | materiaal voor deuren |

Zolang er iets in `missingInfo` of `missingSettings` staat, is `complete` gelijk aan `false` en kan de
offerte niet verstuurd worden. Ontbreekt er iets voor de btw, dan zijn `vat` en `totalCents` leeg (`null`).

Het enige wat zonder vraag wordt ingevuld is het **aantal lagen** als de schilder dat niet noemt. Dat komt
uit zijn eigen instelling "standaard aantal lagen" en staat er altijd bij als "(standaard)".

## Afrondingsregels

1. Maten worden gelezen tot op de millimeter (3 decimalen).
2. Oppervlaktes worden afgerond op 0,01 m².
3. Uren worden afgerond op 0,01 uur. Daarna × uurtarief, afgerond op hele centen.
   Is er afgerond, dan staat er "≈" in de uitleg.
4. Materiaal wordt per product opgeteld over de hele offerte en naar boven afgerond op hele verpakkingen.
   Prijs = verpakkingen × inkoopprijs × (1 + opslag), afgerond op hele centen.
5. Afronden op hele centen gebeurt "half naar boven": € 0,115 wordt € 0,12.
6. Btw: elke regel wordt verdeeld over de btw-tarieven (bij gemengd gebruik bijvoorbeeld 70% / 30%,
   afgerond op centen; het restje gaat naar het laatste deel). Daarna wordt de btw **één keer per tarief**
   berekend over het totaal van dat tarief.

Intern rekent alles met exacte breuken (`fraction.ts`), dus er ontstaan geen kommagetal-foutjes.

## Btw-regels

- Woning, 2 jaar of langer in gebruik: verlaagd tarief (9%).
- Woning jonger dan 2 jaar, of geen woning: algemeen tarief (21%).
- Gemengd gebruik (vanaf 1 juli 2025): het woongedeelte tegen 9%, de rest tegen 21%.
- Voorrijkosten en de aanvulling tot het minimumbedrag volgen de btw van het arbeidsloon.
- Materialen: zoals de schilder heeft ingesteld (zelfde als arbeid, of altijd 21%).
- Tarieven en ingangsdata komen uit de database, niet uit de code.

## Opvolging (`followUp.ts`)

- `planReminder` beslist of er nu een herinnering uit moet, en anders wanneer de volgende gepland staat.
  Maximaal twee, nooit na de vervaldatum, en direct stoppen bij akkoord, afwijzing, verlopen of
  "gewonnen/verloren". Heeft de klant geen e-mail maar wel een telefoonnummer, dan krijgt de vakman een
  klaargezet WhatsApp-bericht. Was de server een tijd uit, dan gaat alleen de laatste herinnering die
  al had gemoeten, zodat de klant nooit twee tegelijk krijgt.
- `decideViewNotification` beslist of de vakman een melding krijgt als de offerte bekeken wordt: bij de
  eerste keer, en daarna alleen als er langer dan 24 uur niet gekeken is. De vakman zelf telt niet mee.
- "Dag 3" betekent: drie kalenderdagen na het versturen, om 9:00 Nederlandse tijd (instelbaar).
  Verstuurd op maandag 16:30 → herinnering op donderdag 9:00. Zomer- en wintertijd gaan vanzelf goed.

## Bekende beperkingen (later oppakken)

- Materiaal voor deuren, kozijnen en plinten wordt nog niet berekend (er komt een waarschuwing).
- Extra voorbereiding bij bladderende verf geldt voor muren, plafonds en deuren, nog niet voor kozijnen.
