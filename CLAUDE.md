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

## 11. Aanvulling: meer klussen winnen (melding, herinnering, werkomschrijving, meten)

Deze aanvulling gaat vóór eerdere hoofdstukken als ze elkaar tegenspreken. Alles hieronder hoort bij de MVP.

### Waarom

Handoff (VS) verkoopt zich vooral met "win meer klussen": een nette offerte die snel bij de klant ligt, een melding als de klant de offerte bekijkt, en opvolging. Snelheid alleen is niet genoeg; de app moet de vakman ook helpen de opdracht binnen te halen.

### 11.1 Melding als de klant de offerte bekijkt

- Zodra de klant de offertelink voor het eerst opent, krijgt de vakman direct een melding: "[Klantnaam] bekijkt nu je offerte voor [adres]. Goed moment om te bellen." met een knop om de klant te bellen.
- Gebruik web-pushmeldingen (PWA), met e-mail als terugval als push niet is toegestaan. Leg de vakman in de app uit dat push op een iPhone alleen werkt als de app op het beginscherm staat.
- Leg vast: eerste keer bekeken, laatste keer bekeken en hoe vaak.
- Bij latere bezoeken alleen opnieuw een melding als de offerte langer dan 24 uur niet bekeken is. Bezoeken van de vakman zelf tellen niet mee.
- Meet het bekijken alleen via onze eigen offertepagina: geen trackingpixels in e-mails, geen cookies van derden. Vermeld dit in de privacyverklaring.
- Deellinks gebruiken een lang, onraadbaar token en tonen alleen die ene offerte.

### 11.2 Automatische herinnering

- Geen akkoord na het ingestelde aantal dagen (standaard dag 3 en dag 7):
  - de app stuurt automatisch een vriendelijke herinneringsmail namens de vakman (afzendernaam = bedrijfsnaam, antwoordadres = e-mail van de vakman), met de offertelink;
  - heeft de klant alleen een mobiel nummer, dan krijgt de vakman een melding met een kant-en-klaar WhatsApp-bericht dat hij met één tik verstuurt. Automatisch WhatsApp-berichten versturen (WhatsApp Business API) zit niet in de MVP.
- Maximaal twee herinneringen, en nooit na de vervaldatum.
- Direct stoppen bij akkoord, afwijzing, verlopen, of als de vakman de offerte op "gewonnen" of "verloren" zet.
- De vakman ziet per offerte wanneer de volgende herinnering gepland staat en kan die overslaan of uitzetten.
- Instellingen (nieuw scherm "Opvolging"): meldingen aan/uit (push en/of e-mail), herinneringen aan/uit, na hoeveel dagen, en een eigen herinneringstekst (met een goede standaardtekst).
- Geen spam: herinneringen gaan alleen naar klanten die een offerte van deze vakman hebben gekregen.
- Techniek: de planning ("wel/niet versturen en wanneer de volgende") is een pure, geteste functie in de rekenmodule. Een cronjob (bijv. Supabase pg_cron of Vercel Cron) draait die elk kwartier. Een herinnering mag nooit twee keer verstuurd worden (idempotent).
- E-mail via een transactionele e-maildienst met EU-verwerking en verwerkersovereenkomst; SPF/DKIM instellen. Vraag mij eerst welke dienst.

### 11.3 Akkoord of afwijzen

- De klant kan op de link akkoord geven (naam, vinkje, tijdstip vastleggen) of afwijzen met een optionele reden. De vakman krijgt bij beide direct een melding.
- Statussen worden: concept, verstuurd, bekeken, herinnerd, akkoord, afgewezen, verlopen.

### 11.4 Werkomschrijving door de AI

- Na het berekenen schrijft de AI op basis van de gestructureerde gegevens een korte, professionele omschrijving van het werk per ruimte (wat er gebeurt, voorbereiding, aantal lagen, soort verf), in de "wij/ik"-vorm van de vakman, in helder Nederlands.
- Regels: geen bedragen, geen hoeveelheden of maten die niet in de gegevens staan, geen beloftes over garanties of planning. De vakman kan de tekst aanpassen.
- De AI mag dus teksten schrijven, maar rekent nog steeds nooit.

### 11.5 Meten: tijdwinst en gewonnen klussen

- Leg per offerte vast: tijdstip gestart, eerste AI-voorstel klaar, verstuurd; de actieve tijd tot versturen (pauzes langer dan 5 minuten niet meetellen); eerst bekeken, aantal keer bekeken, verstuurde herinneringen, tijdstip akkoord of afwijzing; aantal aanpassingen op het AI-voorstel.
- Dashboard voor de vakman: aantal offertes deze maand, gemiddelde tijd per offerte, percentage bekeken, percentage akkoord, en hoeveel akkoorden kwamen na een herinnering.
- Voor mij (beheerder): een CSV-export van deze cijfers over alle gebruikers, zonder klantgegevens.

### 11.6 Aanpassing van de fases

- Fase 0: voeg tabellen toe voor bekijk-gebeurtenissen, herinneringen en meetgegevens (met RLS).
- Fase 1: voeg de herinneringsplanning toe aan de rekenmodule, met tests.
- Fase 2: voeg het instellingenscherm "Opvolging" toe.
- Fase 3: voeg de werkomschrijving toe; controleer in de evals dat die geen bedragen of verzonnen hoeveelheden bevat.
- Fase 5: voeg de melding bij bekijken en akkoord/afwijzen toe.
- Nieuwe fase 6 – Opvolging en meten: herinneringen (cronjob, e-mail, WhatsApp-klaarzetbericht), meetgegevens en dashboard.
- De oude fase 6 (Afronden) wordt fase 7; voeg toe: test dat een deellink alleen die ene offerte toont.

### 11.7 Extra testcases (herinneringen na 3 en 7 dagen, geldigheid 30 dagen)

6. Offerte verstuurd op dag 0, geen reactie. Verwacht: herinnering op dag 3 en dag 7, daarna niets meer. Akkoord op dag 4: de herinnering van dag 7 vervalt.
7. Geldigheid 5 dagen. Verwacht: herinnering op dag 3, géén herinnering op dag 7.
8. Vakman zet herinneringen uit voor deze offerte. Verwacht: niets verstuurd.
9. Klant opent op dag 1 om 10:00 en 10:05, en op dag 3. Verwacht: melding op dag 1 om 10:00 en op dag 3, niet om 10:05. De vakman die zijn eigen link opent, telt niet mee.
10. Werkomschrijving bij testcase 1: geen eurobedragen, en geen andere maten dan 43,2 m² muren en 20 m² plafond.

### 11.8 Extra "klaar als"

- De vakman krijgt binnen een minuut een melding als de klant de offerte opent.
- Herinneringen worden op de juiste dagen verstuurd, nooit dubbel, en stoppen bij reactie (testcases 6–9 slagen).
- Het dashboard toont de gemiddelde tijd per offerte en het percentage akkoord.
