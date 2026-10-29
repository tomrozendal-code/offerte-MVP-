# Voortgang en overdracht

Dit bestand houdt bij waar we zijn, zodat een nieuwe sessie direct verder kan. Lees ook CLAUDE.md (de opdracht) en README.md.

## Status (29 oktober 2026)

| Fase | Status |
| --- | --- |
| 0 – Opzet, database, design | Klaar |
| 1 – Rekenmodule en herinneringsplanning | Klaar (tests slagen) |
| 2 – Inloggen en instellingen | Gebouwd. Live test met ingelogde gebruikers nog te doen (zie hieronder) |
| 3 – AI-verwerking | Nog niet begonnen |
| 4 t/m 7 | Nog niet begonnen |

## Supabase

- Project: `https://qxrqrmqysonlypvwwpjs.supabase.co` (EU-regio).
- Alle migraties zijn uitgevoerd via `supabase/setup-alles.sql` (15 tabellen staan erin).
- Authentication → URL Configuration: Site URL `http://localhost:3000`, Redirect URL `http://localhost:3000/auth/confirm`.
- Al getest op het echte project: anonieme bezoekers zien niets en kunnen niets toevoegen (RLS werkt); de app stuurt niet-ingelogde bezoekers naar `/login`.

## Omgevingsvariabelen in de cloudomgeving

`.env.local` staat niet in git. Een nieuwe sessie leest deze waarden uit de cloudomgeving:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (geheim; alleen op de server en voor tests)
- `ANTHROPIC_API_KEY` (geheim; voor fase 3)

Maak bij de start van een sessie `.env.local` aan met `npm run env:local` (schrijft alleen de namen naar het scherm, nooit de waarden).

## Volgende stap: live test fase 2

Met `SUPABASE_SECRET_KEY`:

1. Maak twee testgebruikers aan via de Supabase Admin API (`auth.admin.createUser`, e-mail bevestigd), bijvoorbeeld `test-a@offerte.test` en `test-b@offerte.test`.
2. Log in via een met `auth.admin.generateLink` gemaakte magic link en doorloop de app met Playwright: bedrijfsgegevens, tarieven, normen, voorbeeldlijst materialen, btw, opvolging opslaan en na herladen controleren.
3. Controleer dat gebruiker B niets van gebruiker A ziet en niets kan wijzigen (RLS live).
4. Verwijder beide testgebruikers en hun gegevens weer.
5. Zet het resultaat hier en in de README.

Daarna: fase 3 (AI-verwerking). Vraag eerst akkoord voor de spraak-naar-tekstdienst (betaald, CLAUDE.md regel 9).

## Afspraken met Tom

- Uitleg in eenvoudig Nederlands, kort per keuze.
- De AI verzint nooit iets: ontbreekt iets of kan iets niet, dan zegt de app dat letterlijk.
- Herinneringen om 9:00 Nederlandse tijd op dag 3 en 7.
- Design: zakelijke stijl (geïnspireerd op grote adviesbureaus), geen Apple-look.
- Tom heeft later nog eigen aanpassingen; keuzes staan in `src/lib/calc/README.md`.
- Push naar `main` op `tomrozendal-code/offerte-MVP-`.
