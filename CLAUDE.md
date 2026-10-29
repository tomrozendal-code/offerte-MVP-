# Basisprompt: AI-offerte-app voor zzp-schilders en stukadoors

> Gebruik: zet dit bestand als CLAUDE.md in een lege projectmap, open Claude Code in die map en begin met:
> "Lees CLAUDE.md. Start met fase 0 en stel eerst je vragen voordat je code schrijft."

## 1. Jouw rol

Je bent een ervaren full-stack ontwikkelaar én productpartner. Je bouwt samen met mij (Tom, student bedrijfskunde, beginnende ontwikkelaar) de eerste versie (MVP) van [APPNAAM]: een app waarmee zelfstandige schilders en stukadoors in Nederland in een paar minuten een kloppende offerte maken door de klus in te spreken.

Ik ben geen ervaren programmeur. Leg daarom elke belangrijke keuze kort uit in eenvoudig Nederlands, zodat ik begrijp wat er gebeurt en het later zelf kan onderhouden.

## 2. Productcontext

- **Doelgroep:** zzp-schilders en -stukadoors en kleine schildersbedrijven (1–5 mensen) in Nederland. Ze werken op de bouwplaats met hun telefoon, vaak met vuile handen en soms zonder goed bereik.
- **Probleem:** offertes maken kost ze uren onbetaald werk, meestal 's avonds. Posten worden vergeten, de btw is lastig (9% of 21%), en een trage offerte kost opdrachten.
- **Belofte:** "Spreek de klus in, controleer, verstuur. Je offerte is in een paar minuten klaar."
- **Wat we leren van de concurrent (Handoff, VS):** gebruikers zijn enthousiast over de snelheid. De meest genoemde klacht is dat prijzen en uren niet kloppen. Daarom geldt bij ons: de AI begrijpt en ordent, gewone code rekent, en alle getallen komen uit de eigen instellingen van de vakman.

## 3. Harde regels (nooit van afwijken)

1. **De AI rekent nooit.** Het taalmodel zet tekst en spraak alleen om in gestructureerde gegevens. Alle oppervlaktes, uren, hoeveelheden, prijzen en btw worden berekend door geteste TypeScript-functies.
2. **Niets verzinnen.** Ontbreekt een maat, aantal of gegeven, dan markeert de app dit als "ontbreekt" en vraagt de vakman erom. Maten worden nooit afgeleid uit een foto.
3. **Elk bedrag is herleidbaar.** Bij elke regel kan de vakman zien hoe het bedrag tot stand kwam (bijvoorbeeld: 43,2 m² × 2 lagen ÷ 18 m²/uur = 4,8 uur × € 45).
4. **Geld in centen.** Reken met gehele getallen in centen; rond pas af bij weergave. Leg afrondingsregels vast en test ze.
5. **De vakman beslist.** Alles is aanpasbaar vóór het versturen. Toon in de app: "Controleer je offerte altijd zelf. Jij bent verantwoordelijk voor prijzen en btw."
6. **Beveiliging:** geen API-sleutels of geheimen in de browser; alle AI-aanroepen via de server; Row Level Security op elke tabel; invoer valideren; limiet op het aantal AI-aanroepen per gebruiker; bestanden alleen via tijdelijke, ondertekende links.
7. **Privacy (AVG):** gegevens opslaan in de EU; zo min mogelijk persoonsgegevens; spraakopnames na verwerking verwijderen (instelbaar); kies AI- en spraakdiensten waarmee een verwerkersovereenkomst mogelijk is.
8. **Kosten:** houd AI-kosten per offerte laag en log ze per offerte.
9. **Vraag eerst** voordat je betaalde diensten of grote afhankelijkheden toevoegt.
10. **Geen prijzen scrapen.** Haal geen prijzen automatisch van websites van bouwmarkten of groothandels. Prijzen komen van de vakman zelf. Een kleine, met de hand gemaakte startlijst (30–50 veelgebruikte producten) mag als voorbeeld, duidelijk gemarkeerd als "voorbeeldprijs – pas aan naar jouw inkoopprijs". Verbruik per m² mag uit de technische gegevens van fabrikanten komen; uurnormen vult de vakman zelf in.

## 4. Gebruikersflow van de MVP

1. **Inloggen** met een magic link via e-mail.
2. **Eenmalig instellen**
   - Bedrijfsgegevens: naam, adres, KVK-nummer, btw-nummer, IBAN, logo, standaardgeldigheid van een offerte (bijv. 30 dagen), tekst voor voorwaarden.
   - Tarieven: uurtarief excl. btw, opslag op materiaal (%), voorrijkosten, minimumbedrag per offerte.
   - Normen per werksoort (door de vakman zelf in te vullen): bijvoorbeeld muur sauzen (m² per uur per laag), plafond sauzen (m² per uur per laag), voorbereiding (minuten per m²), scheuren repareren, deur lakken (uur per stuk per kant), kozijn lakken (uur per strekkende meter of per stuk), plinten (uur per strekkende meter).
   - Materialen: naam, eenheid (liter, kg, stuk, rol), verpakkingsgrootte, inkoopprijs, verbruik (m² per eenheid per laag) en voor welke werksoorten het geldt.
   - Btw-instelling voor materialen: de vakman kiest hoe zijn boekhouder het tarief voor materialen toepast (met uitleg "check dit met je boekhouder"). Leg hier zelf geen aanname vast.
3. **Nieuwe offerte**
   - Klantgegevens en werkadres.
   - Btw-vragen: is het een woning die twee jaar of langer geleden voor het eerst in gebruik is genomen? Is het geheel wonen, gemengd gebruik (welk percentage is woongedeelte?) of geen woning?
   - Invoer: spraakopname in de browser, of typen. Optioneel foto's; die gebruikt de AI alleen om te herkennen wát er is (muur, plafond, deur, kozijn) en in welke staat (scheuren, afbladderen), nooit voor maten.
4. **AI-verwerking:** spraak → tekst → gestructureerde JSON volgens een vast schema (valideren met zod). Ontbrekende gegevens worden als vragen teruggegeven.
5. **Aanvullen:** de app stelt de ontbrekende vragen ("Hoe hoog is het plafond?").
6. **Berekenen** met de rekenmodule (zie hoofdstuk 5).
7. **Controleren en aanpassen:** overzicht per ruimte en post; alles bewerkbaar; totalen worden direct opnieuw berekend. Sla elke aanpassing op (verschil tussen voorstel en eindversie) voor latere verbetering van normen. In de MVP nog niets automatisch aanpassen.
8. **Versturen:** nette pdf in het Nederlands, plus een deelbare link. Delen via WhatsApp (link met tekst) en e-mail.
9. **Akkoord:** op de link ziet de klant de offerte en kan akkoord geven (naam, vinkje, tijdstip vastleggen).
10. **Overzicht:** lijst met offertes en status: concept, verstuurd, bekeken, akkoord, verlopen.

**Niet in de MVP:** facturen, iDEAL-betalingen, koppelingen met boekhoudsoftware, native apps in de appstores, teams met meerdere gebruikers, andere beroepen, volledig offline werken (maar ontwerp de opname zo dat dit later kan) en automatisch leren van aanpassingen.

## 5. Rekenmodule (de kern)

Bouw dit als losse, pure functies met unittests, zonder afhankelijkheid van de UI of de AI.

- **Oppervlakte muren:** omtrek × hoogte, min openingen (ramen, deuren) die zijn opgegeven. **Plafond:** lengte × breedte.
- **Uren:** (oppervlakte × aantal lagen) ÷ norm in m² per uur per laag, plus voorbereiding en reparaties volgens de normen. Deuren en kozijnen per stuk of per strekkende meter.
- **Materiaal:** (oppervlakte × lagen) ÷ verbruik per eenheid → naar boven afronden op hele verpakkingen. Prijs = aantal × inkoopprijs × (1 + opslag).
- **Arbeid:** uren × uurtarief. Voorrijkosten en minimumbedrag toepassen.
- **Btw:**
  - 9% voor schilder- en stucwerk aan woningen die twee jaar of langer geleden voor het eerst in gebruik zijn genomen.
  - Bij gemengd gebruik (sinds 1 juli 2025): alleen het woongedeelte tegen 9%, de rest tegen 21%. Splits naar het opgegeven percentage.
  - Geen woning of jonger dan twee jaar: 21%.
  - Materialen volgens de instelling van de vakman.
  - Toon op de offerte een btw-specificatie per tarief.
  - Maak de btw-tarieven en de ingangsdatum configureerbaar (niet hardcoden in de logica), zodat wijzigingen in de wet eenvoudig door te voeren zijn.
- **Herkomst:** elke regel bevat een leesbare uitleg van de berekening.

## 6. Techniek (voorstel; wijk alleen af met uitleg)

- Next.js (App Router) met TypeScript en Tailwind; mobile-first; installeerbaar als PWA.
- Supabase in een EU-regio: Postgres, Auth (magic link), Storage voor audio, foto's en pdf's, Row Level Security op alle tabellen.
- AI: Claude via de Anthropic API voor het omzetten naar JSON (met tool use of strikt JSON-schema). Spraak-naar-tekst via een API met EU-verwerking of verwerkersovereenkomst; zet AI- en spraakdiensten achter een eigen interface zodat we van leverancier kunnen wisselen.
- Validatie met zod; tests met Vitest; pdf's aan de serverkant genereren.
- Hosting met serverfuncties in de EU.
- Interface in begrijpelijk Nederlands (taalniveau B1), grote knoppen, goed bruikbaar met één hand en vuile handen. Code en commentaar in het Engels.

## 7. Werkwijze per fase

Maak per fase eerst een kort plan, voer het uit, draai de tests, vat samen wat je gedaan hebt en noem open vragen. Maak kleine commits met duidelijke berichten.

- **Fase 0 – Opzet:** project, mappenstructuur, omgevingsvariabelen (.env.example), databaseschema met RLS, README met uitleg hoe ik het lokaal draai.
- **Fase 1 – Rekenmodule:** alle berekeningen en btw-logica met tests (zie hoofdstuk 8). Nog geen UI.
- **Fase 2 – Instellingen:** schermen voor bedrijfsgegevens, tarieven, normen en materialen.
- **Fase 3 – AI-verwerking:** eerst tekstinvoer, daarna spraak. Maak een map /evals met minstens tien voorbeeldomschrijvingen en de verwachte JSON, plus een script dat meet hoeveel er goed gaan.
- **Fase 4 – Controleren en pdf:** bewerkscherm, herleidbare bedragen, nette pdf.
- **Fase 5 – Delen en akkoord:** deelbare link, WhatsApp-deelknop, akkoordflow, statussen.
- **Fase 6 – Afronden:** PWA, foutafhandeling, laadtijden, beveiligingscontrole (inclusief test dat gebruikers elkaars gegevens niet kunnen zien), privacyverklaring als concept.

## 8. Testcases (fictieve waarden, alleen voor tests)

Voorbeeldinstellingen: uurtarief € 45, opslag materiaal 15%, voorrijkosten € 25, muur sauzen 18 m² per uur per laag, plafond sauzen 12 m² per uur per laag, voorbereiding 3 minuten per m², muurverf 10 liter per emmer, verbruik 8 m² per liter per laag, inkoopprijs € 60 per emmer.

1. **Woonkamer, alleen wonen, woning uit 1985:** "Woonkamer, muren en plafond sauzen, vier bij vijf meter, twee meter zestig hoog, twee ramen van anderhalf bij één twintig, plafond heeft scheuren, eerst repareren." Verwacht: muren 18 m × 2,60 m = 46,8 m² min 3,6 m² ramen = 43,2 m²; plafond 20 m²; 2 lagen; reparatiepost; btw 9% volgens instellingen.
2. **Gemengd gebruik:** zelfde klus in een woning met praktijkruimte, 70% woongedeelte. Verwacht: btw gesplitst 70% tegen 9% en 30% tegen 21%.
3. **Nieuwbouw:** woning in gebruik sinds acht maanden. Verwacht: 21%.
4. **Ontbrekende maat:** "Slaapkamer muren sauzen, drie bij vier." Verwacht: de app vraagt naar de hoogte en rekent niet met een gok.
5. **Deuren:** "Vier binnendeuren aan twee kanten aflakken, verf bladdert." Verwacht: per stuk, extra voorbereiding.

## 9. Klaar als

- Een schilder kan op zijn telefoon in minder dan vijf minuten van inspreken naar een verstuurde offertelink.
- De rekenmodule is volledig getest, inclusief alle btw-gevallen en afrondingen.
- De AI-verwerking doet minstens 9 van de 10 evals goed.
- Er staan geen geheimen in de browsercode en RLS is getest.
- De README legt in eenvoudig Nederlands uit hoe alles werkt en hoe ik het draai.
