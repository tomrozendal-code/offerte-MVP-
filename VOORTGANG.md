# Voortgang en overdracht

Dit bestand houdt bij waar we zijn, zodat een nieuwe sessie direct verder kan. Lees ook CLAUDE.md (de opdracht) en README.md.

## Status (29 oktober 2026)

| Fase | Status |
| --- | --- |
| 0 – Opzet, database, design | Klaar |
| 1 – Rekenmodule en herinneringsplanning | Klaar (tests slagen) |
| 2 – Inloggen en instellingen | Klaar en live getest op het echte Supabase-project |
| 3 – AI-verwerking | Nog niet begonnen |
| 4 t/m 7 | Nog niet begonnen |

## Supabase

- Project: `https://qxrqrmqysonlypvwwpjs.supabase.co` (EU-regio).
- Alle migraties zijn uitgevoerd via `supabase/setup-alles.sql` (15 tabellen staan erin).
- Authentication → URL Configuration: Site URL `http://localhost:3000`, Redirect URL `http://localhost:3000/auth/confirm`.
- Al getest op het echte project: anonieme bezoekers zien niets en kunnen niets toevoegen (RLS werkt); de app stuurt niet-ingelogde bezoekers naar `/login`.

## Omgevingsvariabelen in de cloudomgeving

`.env.local` staat niet in git. In de cloudomgeving staan als (openbare) omgevingsvariabelen:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Maak bij de start van een sessie `.env.local` aan met `npm run env:local`.

**Geen geheimen in de omgevingsvariabelen:** iedereen die de omgeving gebruikt kan ze lezen. De Supabase secret key is niet nodig gebleken. Voor fase 3 is een `ANTHROPIC_API_KEY` nodig; die kan niet als netwerkgeheim (de proxy voegt geen sleutels toe aan `api.anthropic.com`), dus overleg met Tom hoe hij die toevoegt.

In deze cloudcontainer gaat uitgaand verkeer via een proxy. Node.js-fetch gebruikt die alleen met `NODE_USE_ENV_PROXY=1`, dus start de app voor tests met `NODE_USE_ENV_PROXY=1 npm run dev`.

## Live test fase 2 (29 oktober 2026): geslaagd

Getest met twee testgebruikers op het echte project (aangemaakt met e-mail + wachtwoord terwijl "Confirm email" tijdelijk uit stond):

- Database (13/13): profiel wordt bij aanmelden aangemaakt met e-mail; btw-tarieven leesbaar maar niet te wijzigen; gebruiker B ziet en wijzigt niets van A; B kan geen regel aan de offerte van A toevoegen; een gebruiker kan geen herinnering als "verstuurd" markeren.
- App (16/16): alle instellingenschermen opslaan en na herladen terugzien; voorbeeldlijst (33 producten, standaard muurverf bovenaan); eigen prijs haalt het label "Voorbeeld" weg; overzicht toont de waarden.
- App, gebruiker B (3/3): ziet alleen eigen lege instellingen, geen materialen van A, en krijgt 404 op een link naar een materiaal van A.

Na de test: "Confirm email" weer aanzetten en de testgebruikers `test-a.offerte-mvp@example.com` en `test-b.offerte-mvp@example.com` verwijderen (hun gegevens verdwijnen dan automatisch mee).

Daarna: fase 3 (AI-verwerking). Vraag eerst akkoord voor de spraak-naar-tekstdienst (betaald, CLAUDE.md regel 9).

## Afspraken met Tom

- Uitleg in eenvoudig Nederlands, kort per keuze.
- De AI verzint nooit iets: ontbreekt iets of kan iets niet, dan zegt de app dat letterlijk.
- Herinneringen om 9:00 Nederlandse tijd op dag 3 en 7.
- Design: zakelijke stijl (geïnspireerd op grote adviesbureaus), geen Apple-look.
- Tom heeft later nog eigen aanpassingen; keuzes staan in `src/lib/calc/README.md`.
- Push naar `main` op `tomrozendal-code/offerte-MVP-`.
