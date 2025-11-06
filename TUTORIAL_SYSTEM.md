# Tutorial and Database System

## Oversikt

Dette dokumentet beskriver det nye omfattende tutorial- og database-systemet for Vector War Games.

## Nye Funksjoner

### 1. **Spill-database** (GameDatabase)

En komplett referanse-database som dekker alle spillmekanikker og systemer.

#### Funksjoner:
- **40+ detaljerte oppføringer** som dekker alle spillsystemer
- **14 kategorier**: Grunnleggende, Atomvåpen, Forsvar, Forskning, Diplomati, Konvensjonell Krigføring, Cyberkrigføring, Bio-krigføring, Pandemier, Styresett, Etterretning, Seiersbetingelser, Spesielle Moduser, og Strategi
- **Søkefunksjon**: Søk etter mekanikker, våpen, eller strategier
- **Låsesystem**: Funksjoner låses opp progressivt basert på spillets runde
- **Kryssreferanser**: Relaterte emner lenket sammen
- **Praktiske tips**: Strategiske tips og advarsler for hver mekanikk

#### Innhold inkluderer:
- Ressurssystem (Produksjon, Uran, Intel)
- DEFCON-system og krigsberedskap
- Atomvåpen (ICBMs, Bombefly, Stridshoder, Ubåter)
- Forsvarssystemer (Missilforsvar, Orbital Defense, Kraftfelt)
- Forskningssystem og teknologitre
- Diplomatisystem (Allianser, Tillit, Favører)
- Sivilisasjonsledger (Alt+L, makrooversikt over relasjoner, styrke og intel)
- Konvensjonell krigføring (Hærer, Flåter, Territorial kontroll)
- Cyberkrigføring (Hacking, Sabotasje, False-flag)
- Bio-krigføring (Plague-typer, Evolusjonstre, DNA Points)
- Pandemisystem
- Styresett og moral
- Etterretning og spionasje
- Alle 6 seiersbetingelser
- Great Old Ones kampanje
- Avanserte strategier

#### Tilgang:
Åpne **Options-menyen** og klikk på **"Spill-database"** under "TUTORIALS & REFERENCE".

### 2. **Komplett Tutorial** (ComprehensiveTutorial)

Et interaktivt tutorial-system som guider spillere gjennom alle spillmekanikker trinn for trinn.

#### Funksjoner:
- **11 hovedseksjoner** med 30+ detaljerte leksjoner
- **Progressiv læring**: Låser opp basert på spillets runde
- **Fremdriftssporing**: Se hvilke leksjoner du har fullført
- **Praktiske oppgaver**: Øvingsoppgaver for hver leksjon
- **Pro-tips**: Avanserte strategier og ekspert-råd
- **Advarsler**: Viktige ting å unngå
- **Nøkkelpunkter**: Kortfattet oppsummering av hver leksjon

#### Seksjoner:

1. **Grunnleggende Mekanikker** (Runde 1+)
   - Velkommen til Vector War Games
   - Ressurssystemet
   - DEFCON-systemet
   - Rundestruktur og Timing

2. **Atomvåpen og Strategisk Krigføring** (Runde 1+)
   - ICBMs
   - Strategiske Bombefly
   - Atomstridshoder
   - Atomubåter

3. **Forsvarssystemer** (Runde 1+)
   - Missilforsvar
   - Orbital Defense Grid
   - Befolkningsforsvar og Bunkers

4. **Forskning og Teknologi** (Runde 6+)
   - Grunnleggende Forskningsmekanikk
   - Forskningsprioriteringer

5. **Diplomati og Allianser** (Runde 1+)
   - Grunnleggende Diplomati
   - Allianser og Traktater
   - Tillit og Favørsystemet

6. **Konvensjonell Krigføring** (Runde 11+)
   - Introduksjon til Konvensjonell Krigføring
   - Territorial Kontroll og Okkupasjon

7. **Cyberkrigføring** (Runde 11+)
   - Introduksjon til Cyber-operasjoner

8. **Biologisk Krigføring** (Runde 26+)
   - Introduksjon til Bio-krigføring
   - Evolusjonstre og DNA Points

9. **Etterretning og Spionasje** (Runde 1+)
   - Grunnleggende Etterretning

10. **Seiersbetingelser** (Runde 1+)
    - Oversikt over Seiersbetingelser
    - Diplomatisk Seier - Detaljert Guide

11. **Styresett og Moral** (Runde 1+)
    - Befolkningstilfredshet og Moral

#### Tilgang:
Åpne **Options-menyen** og klikk på **"Komplett Tutorial"** under "TUTORIALS & REFERENCE".

## Integrasjon med Spillet

### Options Menu
Begge systemene er integrert i Options-menyen under en ny seksjon kalt **"TUTORIALS & REFERENCE"**.

- **Spill-database**: Klikk for å åpne den omfattende referanse-databasen
- **Komplett Tutorial**: Klikk for å starte den interaktive tutorialen

### Progressive Unlocking
Både databasen og tutorialen bruker spillets nåværende runde for å låse opp innhold progressivt:

- **Runde 1**: Grunnleggende systemer tilgjengelige
- **Runde 6**: Forskningssystemer låses opp
- **Runde 11**: Konvensjonell og cyber-krigføring
- **Runde 26**: Bio-krigføring systemer

Dette sikrer at spillere ikke overveldes av informasjon tidlig i spillet.

## Teknisk Implementering

### Nye Komponenter

1. **`src/components/GameDatabase.tsx`**
   - Omfattende database-komponent
   - 40+ database-oppføringer
   - Søk- og filtreringsfunksjonalitet
   - Responsive design med tabs og kategorier

2. **`src/components/ComprehensiveTutorial.tsx`**
   - Interaktivt tutorial-system
   - 11 seksjoner, 30+ leksjoner
   - Fremdriftssporing med localStorage
   - Sidebar-navigasjon

3. **Oppdatert `src/components/OptionsMenu.tsx`**
   - Ny "TUTORIALS & REFERENCE" seksjon
   - Integrering av database og tutorial
   - Sender `currentTurn` prop for feature unlocking

### UI-komponenter brukt
- Dialog (for modaler)
- Sheet (for sidepaneler)
- Tabs (for kategorisering)
- Accordion (for kollapsbare seksjoner)
- Progress (for fremdriftsindikatorer)
- ScrollArea (for scrollbare områder)
- Input (for søkefunksjonalitet)
- Button, Badge, Separator (for UI-elementer)

## Bruksanvisning for Spillere

### For Nybegynnere
1. Start spillet
2. Åpne **Options** (⚙️ ikon)
3. Scroll ned til **"TUTORIALS & REFERENCE"**
4. Klikk på **"Komplett Tutorial"**
5. Gå gjennom seksjonene i rekkefølge

### For Erfarne Spillere
1. Åpne **Options** under spilling
2. Klikk på **"Spill-database"**
3. Bruk søkefunksjonen eller kategoriene for å finne spesifikk informasjon
4. Klikk på et emne for detaljert informasjon

### Tips
- **Database**: Perfekt som hurtigreferanse under spilling
- **Tutorial**: Best for læring før/mellom spillsesjoner
- **Søk**: Bruk søkefunksjonen i databasen for rask tilgang
- **Relaterte emner**: Klikk på relaterte emner for å utforske sammenkoblede konsepter
- **Civilization Ledger**: Trykk Alt+L i Civilization Info Panel for å sortere og filtrere alle nasjoner etter trusler, allianser og seiersprogresjon

## Fremtidig Utvikling

Mulige forbedringer:
- [ ] Legg til flere leksjoner for Great Old Ones kampanje
- [ ] Video-tutorials integrert i systemet
- [ ] Interaktive quizzer for å teste kunnskap
- [ ] Spillerens notater/bokmerker i databasen
- [ ] Eksport av database til PDF/Markdown
- [ ] Flerspråklig støtte (engelsk, norsk, etc.)
- [ ] In-game kontekstuell hjelp (hover over elementer)
- [ ] Achievements for tutorial-fullføring

## Vedlikehold

### Legge til ny database-oppføring
1. Åpne `src/components/GameDatabase.tsx`
2. Legg til ny oppføring i `DATABASE_ENTRIES` array
3. Følg eksisterende struktur med nødvendige felt
4. Legg til i riktig kategori

### Legge til ny tutorial-leksjon
1. Åpne `src/components/ComprehensiveTutorial.tsx`
2. Finn riktig seksjon i `TUTORIAL_SECTIONS` array
3. Legg til ny leksjon i `lessons` array
4. Inkluder alle nødvendige felt (title, content, keyPoints, etc.)

## Support og Feedback

For spørsmål, feil, eller forslag:
- Åpne et issue på GitHub
- Kontakt utviklingsteamet

---

**Versjon**: 1.0
**Sist oppdatert**: 2025-11-02
**Forfatter**: Claude AI via Vector War Games Development Team
