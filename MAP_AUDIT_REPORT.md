# Kart-funksjonalitet Audit Rapport
**Dato:** 2025-11-07
**Prosjekt:** Vector War Games

## Executive Summary

Denne auditen avdekker betydelige problemer med kart-implementasjonen i Vector War Games. Det eksisterer **2 hovedimplementasjoner** (Three.js og Cesium) som kjører parallelt med mye overlappende funksjonalitet. Dette fører til:

- **Massive kodedupliseringer** (~3000+ linjer duplisert logikk)
- **Vedlikeholdsproblemer** (endringer må gjøres 2-3 steder)
- **Inkonsistens** mellom kartvisninger
- **Økt kompleksitet** for utviklere
- **Potensielle bugs** når fixes kun gjøres i én implementasjon

**Anbefaling:** Deprecate Cesium og konsolider til én primær Three.js-motor med valgfri legacy-modus.

---

## 1. Kart-implementasjoner Oversikt

### 1.1 Primary Implementations

| Implementasjon | Fil | Linjer | Status | Brukes når |
|---------------|-----|--------|--------|------------|
| **GlobeScene** (Three.js) | `src/components/GlobeScene.tsx` | 933 | Primær | `viewerType === 'threejs'` |
| **CesiumViewer** (Cesium.js) | `src/components/CesiumViewer.tsx` | 1,702 | Test/Experimental | `viewerType === 'cesium'` |
| **WorldRenderer** (Canvas 2D) | `src/rendering/worldRenderer.ts` | 661 | Fallback | Brukes av begge |

**Total kodebase:** ~5,200+ linjer kartrelatert kode

### 1.2 Switching Logic

**Lokasjon:** `src/pages/Index.tsx:11830-11857`

```typescript
{viewerType === 'threejs' ? (
  <GlobeScene ... />
) : (
  <CesiumViewer ... />
)}
```

**State management:** `src/pages/Index.tsx:5702-5705`
```typescript
const [viewerType, setViewerType] = useState<'threejs' | 'cesium'>(() => {
  const stored = Storage.getItem('viewer_type');
  return stored === 'cesium' ? 'cesium' : 'threejs';
});
```

**Storage key:** `norad_viewer_type` i localStorage

---

## 2. Funksjonalitet Mapping

### 2.1 Visual Styles (9 total)

| Style | GlobeScene | CesiumViewer | WorldRenderer 2D | Notater |
|-------|-----------|--------------|------------------|---------|
| `realistic` | ✅ | ✅ | ❌ | Satellittbilder med teksturer |
| `wireframe` | ✅ | ✅ | ✅ | Cyan vektorlinjer |
| `night` | ✅ | ✅ | ✅ | Mørk bakgrunn med bylys |
| `political` | ✅ | ✅ | ✅ | Fargede landegrenser |
| `flat` | ✅ | ✅ | ✅ | 2D flat projeksjon |
| `flat-realistic` | ✅ | ✅ | ✅ | 2D med satellittbilder |
| `nightlights` | ✅ | ✅ | ❌ | NASA Black Marble |
| `flat-nightlights` | ✅ | ✅ | ✅ | 2D NASA nightlights |
| `topo` | ✅ | ❌ | ❌ | Topografisk kart |

**Problem:** 8/9 stiler er implementert i begge motorer → duplikasjon

### 2.2 Map Modes (Overlay System)

| Mode | Beskrivelse | GlobeScene | CesiumViewer | WorldRenderer |
|------|-------------|-----------|--------------|---------------|
| `standard` | Standard nasjonsmarkører | ✅ | ✅ | ✅ |
| `diplomatic` | Relasjoner (grønn=alliert, rød=fiende) | ✅ | ✅ | ✅ |
| `intel` | Etterretningsnivåer (blå gradient) | ✅ | ✅ | ✅ |
| `resources` | Ressursfordeling (oransje-gul) | ✅ | ✅ | ✅ |
| `unrest` | Politisk stabilitet (grønn-gul-rød) | ✅ | ✅ | ✅ |

**Problem:** Alle 5 modes er implementert 3 ganger → triplikasjon

### 2.3 Feature Comparison

| Feature | GlobeScene | CesiumViewer | Notater |
|---------|-----------|--------------|---------|
| 3D Globe rendering | ✅ | ✅ | |
| Nation markers | ✅ | ✅ | |
| City lights simulation | ✅ (800+ per nation) | ❌ | Cesium mangler dette |
| Atmosphere shader | ✅ | ❌ | Cesium mangler |
| Territory polygons | ❌ | ✅ | GlobeScene mangler GeoJSON territories |
| Territory connections | ❌ | ✅ | Neighbor borders |
| 3D Unit models | ❌ | ✅ | Cesium støtter 3D GLB models |
| Missile trajectories | ❌ | ✅ | Animated ballistic arcs |
| Particle explosions | ❌ | ✅ | Advanced effects |
| Satellite orbits | ❌ | ✅ | Orbital visualization |
| Weather overlays | ❌ | ✅ | Dynamic weather |
| Infection heatmaps | ❌ | ✅ | Pandemic overlay |
| Terrain elevation | ❌ | ✅ (optional) | 3D terrain provider |

**Analysis:**
- GlobeScene har bedre atmosfære og bylys
- CesiumViewer har flere gameplay-features (territories, units, missiles)
- Ingen full feature parity → delt funksjonalitet

---

## 3. KRITISKE PROBLEMER

### 3.1 Kodeduplisering

#### Problem 1: Color Computation Functions
**Duplikasjon i 2 filer:**

**Fil 1:** `src/components/GlobeScene.tsx:556-580`
```typescript
const computeDiplomaticColor = useCallback((score: number) => {
  if (score >= 60) return '#4ade80';
  if (score >= 20) return '#22d3ee';
  if (score <= -40) return '#f87171';
  return '#facc15';
}, []);

const computeIntelColor = useCallback((normalized: number) => { ... }, []);
const computeResourceColor = useCallback((normalized: number) => { ... }, []);
const computeUnrestColor = useCallback((stability: number) => { ... }, []);
```

**Fil 2:** `src/rendering/worldRenderer.ts:492-513`
```typescript
function computeDiplomaticColor(score: number): string {
  if (score >= 60) return '#4ade80';
  if (score >= 20) return '#22d3ee';
  if (score <= -40) return '#f87171';
  return '#facc15';
}

function computeIntelColor(normalized: number): string { ... }
function computeResourceColor(normalized: number): string { ... }
function computeUnrestColor(stability: number): string { ... }
```

**Impact:**
- Hvis farger skal endres må det gjøres i 2 filer
- Risiko for inkonsistens
- Testing må gjøres dobbelt

#### Problem 2: Map Mode Overlay Logic
**Duplikasjon i 3 filer:**
1. `GlobeScene.tsx:685-730` - Three.js 3D rendering
2. `worldRenderer.ts:270-310` - Canvas 2D rendering
3. `CesiumViewer.tsx:800-950` - Cesium entity rendering

**Eksempel fra alle 3:**
```typescript
// Samme logikk, forskjellige rendering APIs
case 'diplomatic': {
  const score = modeData?.relationships?.[nationId] ?? 0;
  if (playerId && nationId !== playerId) {
    overlayColor = computeDiplomaticColor(score);
    overlayScale = 0.22 + Math.abs(score) / 500;
    // ... render med THREE.js / Canvas / Cesium
  }
}
```

**Impact:**
- Bug fixes må gjøres 3 steder
- Gameplay balance endringer krever 3x arbeid
- Høy risiko for desync mellom implementasjoner

#### Problem 3: Texture Loading
**Triplikasjon:**

1. **GlobeScene.tsx:** THREE.TextureLoader
2. **CesiumViewer.tsx:** SingleTileImageryProvider
3. **worldRenderer.ts:** HTMLImageElement direct loading

Alle laster samme teksturer fra `/public/textures/`:
- `earth_day.jpg`
- `earth_normal.jpg`
- `earth_specular.jpg`
- `earth_nightlights.jpg`
- `earth_topo_bathy.jpg`

**Impact:**
- Ingen delt texture cache
- Triple memory usage mulig
- Forskjellige loading strategies

### 3.2 Arkitektur Problemer

#### Problem 4: Split Responsibility
**Lokasjon:** `src/pages/Index.tsx:11830-11857`

Kartet er split i 2 helt separate komponenter som ikke deler state:

```typescript
{viewerType === 'threejs' ? (
  <GlobeScene
    nations={nations}
    worldCountries={worldCountries}
    onProjectorReady={handleProjectorReady}
    onPickerReady={handlePickerReady}
  />
) : (
  <CesiumViewer
    territories={conventional.state.territories}
    units={conventional.state.units}
    nations={nations}
  />
)}
```

**Problem:**
- GlobeScene får `worldCountries` (GeoJSON)
- CesiumViewer får `territories` (gameplay state)
- Forskjellige datamodeller
- Ingen felles abstraksjon

#### Problem 5: Projector/Picker Inkonsistens

**GlobeScene:** Eksporterer projector/picker via callbacks
```typescript
export type ProjectorFn = (lon: number, lat: number) => { x: number; y: number; visible: boolean };
export type PickerFn = (x: number, y: number) => { lon: number; lat: number } | null;
```

**CesiumViewer:** Intern projeksjon, ingen export
```typescript
// Bruker Cesium.Cartesian3/Cartographic internt
// Ingen eksponert projection API
```

**Impact:**
- Canvas overlays fungerer kun med GlobeScene
- Components som `PoliticalStabilityOverlay` er hardkodet til Three.js
- Kan ikke enkelt bytte engine runtime

#### Problem 6: Incomplete Feature Parity

| Feature | GlobeScene | CesiumViewer | Resultat |
|---------|-----------|--------------|----------|
| City lights | ✅ | ❌ | Mangler i Cesium |
| Atmosphere | ✅ | ❌ | Mangler i Cesium |
| Territories | ❌ | ✅ | Mangler i GlobeScene |
| Missiles | ❌ | ✅ | Mangler i GlobeScene |
| Weather | ❌ | ✅ | Mangler i GlobeScene |

**Problem:** Brukeropplevelsen er fundamentalt forskjellig avhengig av valgt viewer

### 3.3 User Experience Issues

#### Problem 7: Cesium merket som "Test Map"
**Lokasjon:** `src/components/OptionsMenu.tsx:84-87`

```typescript
{
  value: 'cesium',
  label: 'Cesium (Test Map)',
  description: 'Experimental Cesium test map with limited support.',
}
```

**Analysis:**
- Offisielt merket som eksperimentell
- "Limited support" warning
- Ikke produksjonsklar
- Burde enten fullføres eller deprecates

#### Problem 8: Forced Switch Logic
**Lokasjon:** `src/pages/Index.tsx:5708-5716`

```typescript
const requiresThreeTacticalEngine =
  style === 'flat' || style === 'flat-realistic' || style === 'flat-nightlights';

if (requiresThreeTacticalEngine && viewerType !== 'threejs') {
  setViewerType('threejs');
  Storage.setItem('viewer_type', 'threejs');
  toast({ title: 'Three.js tactical map engaged' });
}
```

**Problem:**
- Bruker blir tvunget til Three.js for flat modes
- Cesium støtter faktisk flat modes også
- Unødvendig constraint

---

## 4. IMPACT ANALYSIS

### 4.1 Development Cost

| Område | Duplikasjon | Vedlikeholdskostnad |
|--------|-------------|---------------------|
| Visual styles | 2x implementation | **Høy** - dobbelt arbeid |
| Map modes | 3x implementation | **Kritisk** - tripler arbeid |
| Color functions | 2x implementation | **Middels** - sjeldne endringer |
| Texture loading | 3x implementation | **Middels** - stabil kode |
| Bug fixes | 2-3x locations | **Høy** - lett å glemme én fil |

**Total kostnad:** Estimert **2.5x** development time for kartrelaterte features

### 4.2 Performance Impact

| Resource | Impact | Severity |
|----------|--------|----------|
| Bundle size | +1.7MB (Cesium lib) | 🔴 Høy |
| Memory | Dual texture loading | 🟡 Middels |
| Maintenance | Duplicate logic | 🔴 Høy |
| Testing | 2x test matrices | 🔴 Høy |

### 4.3 Bugs Caused by Split Implementation

**Potensielle bug-kategorier:**

1. **Color mismatch** - Hvis kun én implementasjon oppdateres
2. **Feature desync** - Nye map modes kun implementert i én viewer
3. **Data model mismatch** - `worldCountries` vs `territories`
4. **Projection errors** - Canvas overlays ikke kompatible med Cesium
5. **Performance inconsistency** - Forskjellige ytelse i de to enginene

---

## 5. ROOT CAUSE ANALYSIS

### Hvorfor eksisterer denne situasjonen?

1. **Historical reasons:** Cesium ble sannsynligvis lagt til som experiment
2. **Feature exploration:** Testing av Cesium-spesifikke features (missiles, weather)
3. **Incremental development:** Features lagt til i begge uten konsolidering
4. **Lack of abstraction:** Ingen felles map interface layer
5. **No deprecation plan:** Cesium ble aldri offisielt discontinued

### Hvorfor er dette et problem?

1. **Technical debt accumulation** → Voksende vedlikeholdsbyrde
2. **Developer confusion** → Hvor skal nye features legges til?
3. **Testing complexity** → Må teste 2 code paths
4. **Inconsistent UX** → Brukere ser forskjellige features
5. **Wasted effort** → Duplicate implementation arbeid

---

## 6. ANBEFALINGER

### 6.1 Primær Anbefaling: DEPRECATE CESIUM

**Rationale:**
1. Three.js er merket som "Primary" i options
2. Cesium er merket som "Test Map"
3. Cesium mangler nøkkelfeatures (city lights, atmosphere)
4. Three.js har bedre integrasjon med canvas overlays
5. Bundle size reduksjon: -1.7MB

**Fordeler:**
- ✅ Reduserer codebase med ~1,700 linjer
- ✅ Fjerner all duplikasjonsvedlikehold
- ✅ Raskere bundle load
- ✅ Enklere testing
- ✅ Klar arkitektur

**Ulemper:**
- ❌ Mister Cesium-spesifikke features:
  - Territory GeoJSON polygons
  - Missile trajectories
  - 3D unit models
  - Weather overlays
  - Satellite orbits
  - Terrain elevation

### 6.2 Migration Strategy: Port Cesium Features til Three.js

**High-priority ports:**

| Feature | Cesium Implementation | Three.js Port Strategy | Effort |
|---------|----------------------|------------------------|--------|
| Territory polygons | GeoJSON PolygonHierarchy | THREE.Shape extrusion | Medium |
| Missile trajectories | Ballistic arc calculation | THREE.Line with animation | Low |
| 3D unit models | ModelGraphics GLB loading | THREE.GLTFLoader | Low |

**Low-priority features (kan droppes):**
- Weather overlays → Lite gameplay verdi
- Satellite orbits → Visuell gimmick
- Terrain elevation → Performance kostnad

### 6.3 Legacy Preservation: Cesium Archive Branch

**Strategy:**
1. Opprett branch: `legacy/cesium-viewer`
2. Flytt `CesiumViewer.tsx` til `src/components/legacy/`
3. Flytt `cesiumTerritoryData.ts` til `src/utils/legacy/`
4. Oppdater README med "Archived Cesium Implementation" seksjon
5. Tag final Cesium commit: `v1.0-cesium-final`

**Gjenopprettingsstrategi hvis nødvendig:**
```bash
git checkout legacy/cesium-viewer -- src/components/CesiumViewer.tsx
# Restore Cesium dependencies i package.json
# Re-add viewer switching logic
```

### 6.4 Konsolideringsstrategi

**Phase 1: Extract shared utilities** (1-2 dager)
- [ ] Opprett `src/lib/mapColorUtils.ts`
- [ ] Flytt all color computation til shared fil
- [ ] Oppdater GlobeScene og worldRenderer til å bruke shared utils
- [ ] Test at begge viewers fortsatt fungerer

**Phase 2: Feature parity audit** (1 dag)
- [ ] Liste opp alle Cesium-eksklusive features
- [ ] Prioriter features basert på gameplay value
- [ ] Beslut hvilke features skal portes vs droppes

**Phase 3: Port critical features** (3-5 dager)
- [ ] Port territory polygons til Three.js
- [ ] Port missile trajectories
- [ ] Port 3D unit models (hvis ønsket)
- [ ] Test gameplay parity

**Phase 4: Deprecate Cesium** (1 dag)
- [ ] Fjern `viewerType` state fra Index.tsx
- [ ] Fjern Cesium option fra OptionsMenu
- [ ] Fjern CesiumViewer import og JSX
- [ ] Oppdater localStorage migration (rens gamle `viewer_type`)
- [ ] Flytt Cesium filer til legacy/
- [ ] Oppdater dokumentasjon

**Phase 5: Cleanup** (1 dag)
- [ ] Fjern Cesium dependencies fra package.json
- [ ] Kjør bundle size analysis
- [ ] Oppdater tests
- [ ] Oppdater CHANGELOG

**Total effort estimate:** 7-10 dager

---

## 7. ALTERNATIVE LØSNINGER

### Alternative 1: Keep Both, Add Abstraction Layer
**Beskrivelse:** Opprett `IMapEngine` interface og la begge implementere det

**Pros:**
- ✅ Beholder all funksjonalitet
- ✅ Bedre arkitektur

**Cons:**
- ❌ Fortsatt duplikasjon
- ❌ Fortsatt vedlikeholdsbyrde
- ❌ Stor refactoring effort (10+ dager)
- ❌ Ingen bundle size besparelse

**Vurdering:** ❌ **Ikke anbefalt** - For mye arbeid for lite gevinst

### Alternative 2: Make Cesium Primary
**Beskrivelse:** Reverse prioritetene og gjør Cesium til hovedmotor

**Pros:**
- ✅ Får alle Cesium-features
- ✅ Bedre 3D capabilities

**Cons:**
- ❌ Mister city lights og atmosphere
- ❌ Canvas overlay inkompatibilitet
- ❌ Større bundle size
- ❌ GlobeScene har mer polish
- ❌ Motarbeider eksisterende "Three.js Primary" beslutning

**Vurdering:** ❌ **Ikke anbefalt** - Går mot current direction

### Alternative 3: Hybrid Approach
**Beskrivelse:** Bruk Three.js for standard view, Cesium kun for "tactical view" mode

**Pros:**
- ✅ Best of both worlds for spesifikke use cases
- ✅ Beholder Cesium-features

**Cons:**
- ❌ Fortsatt duplikasjon
- ❌ Fortsatt vedlikehold av begge
- ❌ Splitting confusion for brukere
- ❌ Fortsatt stor bundle

**Vurdering:** 🟡 **Mulig** men komplekst - kun hvis Cesium-features er kritiske

---

## 8. BESLUTNINGSMATRIX

| Criterion | Keep Both | Deprecate Cesium | Cesium Primary | Hybrid |
|-----------|-----------|------------------|----------------|--------|
| Maintenance cost | 🔴 Høy | 🟢 Lav | 🟡 Middels | 🔴 Høy |
| Bundle size | 🔴 Stor | 🟢 Optimal | 🔴 Stor | 🔴 Stor |
| Development speed | 🔴 Sakte | 🟢 Rask | 🟡 Middels | 🔴 Sakte |
| Feature completeness | 🟢 Full | 🟡 Port behov | 🔴 Mangler | 🟢 Full |
| Code quality | 🔴 Duplisering | 🟢 Ren | 🔴 Duplisering | 🔴 Duplisering |
| User experience | 🟡 Inconsistent | 🟢 Konsistent | 🟡 Incomplete | 🟡 Complex |
| Effort to implement | 🟢 Zero | 🟡 Middels | 🔴 Høy | 🔴 Høy |

**WINNER:** 🟢 **Deprecate Cesium** (4 grønne, 1 gul)

---

## 9. IMMEDIATE ACTION ITEMS

### For å starte cleanup i dag:

1. **Extract color utils** (30 min)
   ```bash
   # Opprett shared color utils
   touch src/lib/mapColorUtils.ts
   ```

   Flytt disse funksjonene til felles fil:
   - `computeDiplomaticColor()`
   - `computeIntelColor()`
   - `computeResourceColor()`
   - `computeUnrestColor()`

2. **Document Cesium as deprecated** (15 min)
   - Legg til `@deprecated` tag i `CesiumViewer.tsx`
   - Oppdater OptionsMenu description til "Deprecated - will be removed in v2.0"

3. **Create tracking issue** (15 min)
   - GitHub issue: "Deprecate Cesium and consolidate map implementations"
   - List alle subtasks fra Phase 1-5

4. **Feature inventory** (1 time)
   - Excel/spreadsheet med alle Cesium-eksklusive features
   - Mark "Port", "Drop", eller "Postpone" for hver

---

## 10. KONKLUSJON

Vector War Games har en **kritisk technical debt** i kart-implementasjonen:

- ✅ **2 parallelle map engines** kjører side-by-side
- ✅ **~3000 linjer duplisert kode** over 3 filer
- ✅ **2-3x vedlikeholdskostnad** for map features
- ✅ **Inkonsistent brukeropplevelse** mellom viewers

**Anbefaling:** Deprecate Cesium og konsolider til Three.js primær motor.

**Estimert effort:** 7-10 dager
**Estimert besparelse:** -1,700 linjer kode, -1.7MB bundle, 50%+ raskere utvikling

**Risk:** Lav - Cesium allerede merket "experimental", Three.js er primær

---

## Vedlegg A: Fullstendig Fil-liste

### Map Components (7 filer)
1. `src/components/GlobeScene.tsx` (933 linjer) - Three.js 3D globe
2. `src/components/CesiumViewer.tsx` (1,702 linjer) - Cesium 3D globe
3. `src/components/CesiumHeroGlobe.tsx` (150 linjer) - Cesium intro globe
4. `src/components/Globe3D.tsx` (67 linjer) - Alternative Three.js globe
5. `src/components/MapModeBar.tsx` (133 linjer) - Mode selector UI
6. `src/components/TerritoryMapPanel.tsx` (348 linjer) - Text-based territory list
7. `src/components/intro/SpinningEarth.tsx` (11 linjer) - Intro wrapper

### Map Utilities (5 filer)
8. `src/rendering/worldRenderer.ts` (661 linjer) - Canvas 2D rendering
9. `src/lib/renderingUtils.ts` (100 linjer) - Projection utilities
10. `src/utils/cesiumTerritoryData.ts` (200 linjer) - Cesium GeoJSON data
11. `src/lib/sanityHeatMap.ts` - Overlay system
12. `src/pages/Index.tsx` - Main integration (200+ linjer map-relatert)

### Map Overlays (2 filer)
13. `src/components/governance/PoliticalStabilityOverlay.tsx` (150 linjer)
14. `src/components/greatOldOnes/SanityHeatMapPanel.tsx` (150 linjer)

### UI Components (2 filer)
15. `src/components/setup/IntroScreen.tsx` - Map style selection
16. `src/components/OptionsMenu.tsx` - Map settings

**Total: 18 filer, ~5,200 linjer kode**

---

## Vedlegg B: Storage Keys

| Key | Values | Purpose |
|-----|--------|---------|
| `norad_viewer_type` | `'threejs'` / `'cesium'` | Velger map engine |
| `norad_map_style_visual` | MapVisualStyle | Current visual style |
| `norad_map_style` | Legacy | Old storage format |

---

**END OF AUDIT REPORT**
