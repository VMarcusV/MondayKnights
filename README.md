# Band-app

Setlists, repertoire, opbouw per nummer en bladmuziek per instrument — gebouwd voor gebruik op de telefoon in de oefenruimte.

## Online zetten via GitHub Pages

1. Maak op github.com een nieuwe repository (bijv. `band-app`).
2. Zet dit project erin:

   ```bash
   git init
   git add .
   git commit -m "Eerste versie band-app"
   git branch -M main
   git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/band-app.git
   git push -u origin main
   ```

3. Ga in de repository naar **Settings → Pages** en kies bij *Source* voor **GitHub Actions**.
4. Na de eerste push bouwt GitHub de app automatisch (zie het tabblad *Actions*).
   Daarna draait de app op: `https://JOUW-GEBRUIKERSNAAM.github.io/band-app/`

Elke volgende push naar `main` wordt automatisch opnieuw gepubliceerd.

## Lokaal draaien

```bash
npm install
npm run dev
```

## Goed om te weten

- Alle gegevens (nummers, opbouw, notities, foto's van bladmuziek) worden **per apparaat** opgeslagen in de browser. Bandleden die de URL openen beginnen met de standaard-setlist en bouwen hun eigen versie op.
- Gedeelde data (iedereen ziet en bewerkt hetzelfde repertoire) is de logische volgende stap; daarvoor is een backend zoals Supabase nodig. De app is zo opgezet dat die stap erbij kan zonder opnieuw te beginnen.
- Tip op de telefoon: open de URL en kies "Zet op beginscherm" — dan voelt het als een echte app.
