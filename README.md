# MVP Offerte

Een app waarmee zzp-schilders en stukadoors in een paar minuten een kloppende offerte maken door de klus in te spreken.

**Spreek de klus in, controleer, verstuur.**

De belangrijkste afspraak: **de AI rekent nooit.** De AI begrijpt wat de schilder zegt en zet het netjes op een rij. Alle bedragen worden berekend door gewone, geteste code, met de prijzen en normen van de schilder zelf. De volledige opdracht staat in [CLAUDE.md](CLAUDE.md).

## Waar staan we?

| Fase | Wat | Status |
| --- | --- | --- |
| 0 | Opzet: project, database, design, README | ✅ Klaar |
| 1 | Rekenmodule met tests | ✅ Klaar |
| 2 | Instellingen (bedrijf, tarieven, normen, materialen) | ⏳ |
| 3 | AI-verwerking (tekst, daarna spraak) | ⏳ |
| 4 | Controleren en pdf | ⏳ |
| 5 | Delen en akkoord | ⏳ |
| 6 | Afronden (PWA, beveiliging, privacy) | ⏳ |

## Lokaal draaien

Je hebt nodig: [Node.js](https://nodejs.org) versie 20 of hoger.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open daarna http://localhost:3000. Op je telefoon kun je de app ook openen: gebruik dan het IP-adres van je computer (staat in de terminal bij "Network").

Zonder Supabase werkt de app ook. Je ziet dan een oranje melding dat de database nog niet gekoppeld is.

## Handige commando's

| Commando | Wat het doet |
| --- | --- |
| `npm run dev` | Start de app op je computer |
| `npm test` | Draait alle tests (rekenwerk en opmaak) |
| `npm run test:db` | Test de database en of gebruikers elkaars gegevens echt niet kunnen zien. Hiervoor moet PostgreSQL op je computer staan. |
| `npm run typecheck` | Controleert of de TypeScript-code klopt |
| `npm run lint` | Controleert de code op veelgemaakte fouten |

## Supabase koppelen (kan later)

Supabase is de database, de login en de opslag voor bestanden. Je hebt het pas echt nodig in fase 2 (inloggen en instellingen opslaan). Tot die tijd draait alles zonder.

1. Maak een gratis account op [supabase.com](https://supabase.com).
2. Maak een nieuw project. **Kies als regio een EU-regio, bijvoorbeeld Frankfurt** (dit is nodig voor de AVG).
3. Ga naar **SQL Editor** en voer de bestanden in `supabase/migrations/` één voor één uit, in volgorde van de naam.
4. Ga naar **Project Settings → API** en kopieer de **Project URL** en de **anon key** naar `.env.local`.
5. Zet bij **Authentication → URL Configuration** de Site URL op `http://localhost:3000`.
6. Start de app opnieuw met `npm run dev`. De oranje melding is dan weg.

## Hoe het in elkaar zit

```
src/
  app/              De schermen (elke map is een pagina)
    page.tsx        Offertes (startscherm)
    nieuw/          Nieuwe offerte (inspreken komt in fase 3)
    instellingen/   Instellingen
    design/         Overzicht van alle design-onderdelen
  components/ui/    Herbruikbare bouwstenen: knoppen, lijsten, tabbalk
  lib/
    calc/           De rekenmodule: alle berekeningen en btw (zie de README daar)
    ai/             AI-verwerking, alleen op de server (fase 3)
    supabase/       Verbinding met de database
    format.ts       Bedragen en getallen netjes in het Nederlands tonen
  proxy.ts          Houdt de login actief bij elke paginaweergave
supabase/
  migrations/       Het databaseschema, met beveiliging per gebruiker
  tests/            Test dat gebruikers elkaars gegevens niet kunnen zien
evals/              Testvoorbeelden voor de AI (fase 3)
```

### Keuzes in gewone taal

- **Next.js** is het framework voor de website. Het draait zowel in de browser als op de server. Geheime sleutels (zoals die voor de AI) blijven altijd op de server.
- **Tailwind** is een manier om de opmaak direct in de code te schrijven.
- **Design in Apple-stijl.** De kleuren, lettertypes en onderdelen volgen de richtlijnen van Apple (Human Interface Guidelines): grijze achtergrond met witte kaarten, grote titels, een tabbalk onderin en grote knoppen (minstens 50 pixels hoog) die je makkelijk met één duim raakt. Op iPhone gebruikt de app het Apple-lettertype San Francisco, op andere toestellen Inter. Donkere modus gaat automatisch mee met je telefoon. Alle kleuren staan op één plek: `src/app/globals.css`. Bekijk alle onderdelen op `/design`.
- **Geld in centen.** We rekenen met hele centen (4500 in plaats van 45,00). Zo krijg je geen afrondingsfoutjes. Pas bij het tonen maken we er euro's van.
- **Row Level Security (RLS)** is een slot op elke databasetabel: een schilder kan alleen zijn eigen klanten, offertes en prijzen zien, ook als iemand de app probeert te omzeilen. `npm run test:db` bewijst dat.
- **Btw-tarieven staan in de database** (tabel `vat_rates`), niet in de code. Verandert de wet, dan pas je alleen die tabel aan.
