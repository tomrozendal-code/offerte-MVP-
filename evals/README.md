# Evals

Testen of de AI een ingesproken klus goed omzet naar gegevens.

- `cases.ts` – 11 voorbeeldomschrijvingen met het verwachte resultaat (testcases 1–5 uit CLAUDE.md en 6 extra).
- `compare.ts` – vergelijkt het antwoord van de AI met het verwachte resultaat. Streng op het belangrijkste:
  een getal dat niet genoemd is, moet leeg blijven ("verzonnen!" in de uitvoer), en elk genoemd getal moet kloppen.
- `run.mts` – stuurt alle voorbeelden naar de echte AI, telt hoeveel er goed zijn (doel: minstens 9 van 10)
  en controleert de werkomschrijving (geen bedragen, geen andere maten dan 43,2 m² en 20 m²).

Draaien (kost een paar cent, `ANTHROPIC_API_KEY` moet in `.env.local` staan):

```bash
npm run evals
```
