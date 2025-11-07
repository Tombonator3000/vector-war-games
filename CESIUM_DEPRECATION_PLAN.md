# Cesium Deprecation & Legacy Migration Plan
**Prosjekt:** Vector War Games
**Dato:** 2025-11-07
**Status:** 🔴 Planlagt - Ikke startet

---

## Mål

1. **Deprecate Cesium** som aktiv map engine
2. **Preserve** Cesium kode i legacy branch for fremtidig gjenoppretting
3. **Konsolider** til Three.js som eneste produksjonsmotor
4. **Reduser** bundle size med ~1.7MB
5. **Eliminere** all map code duplication

---

## Pre-Requisites

- [ ] Full backup av current state
- [ ] All tests kjører grønt
- [ ] Code review av audit rapporten
- [ ] Stakeholder approval på deprecation
- [ ] Beslutning om hvilke Cesium-features som skal portes

---

## PHASE 0: Preparation (½ dag)

### Step 0.1: Feature Inventory & Prioritering
**Owner:** Tech Lead
**Estimate:** 2 timer

Opprett spreadsheet med alle Cesium-eksklusive features:

| Feature | Gameplay Value | Port Effort | Decision | Priority |
|---------|----------------|-------------|----------|----------|
| Territory GeoJSON polygons | 🟢 Høy | 🟡 Medium | PORT | P0 |
| Missile trajectories | 🟢 Høy | 🟢 Low | PORT | P0 |
| 3D unit models | 🟡 Medium | 🟢 Low | PORT | P1 |
| Weather overlays | 🔴 Lav | 🟡 Medium | DROP | - |
| Satellite orbits | 🔴 Lav | 🔴 High | DROP | - |
| Terrain elevation | 🔴 Lav | 🔴 High | DROP | - |
| Infection heatmaps | 🟡 Medium | 🟢 Low | PORT | P2 |
| Particle explosions | 🟡 Medium | 🟡 Medium | POSTPONE | P3 |

**Deliverable:** `CESIUM_FEATURE_DECISIONS.md`

### Step 0.2: Create Tracking Branch
**Estimate:** 15 min

```bash
# Fra main branch
git checkout -b deprecate/cesium-to-legacy

# Opprett legacy preservation branch
git checkout -b legacy/cesium-viewer
git push -u origin legacy/cesium-viewer

# Tilbake til working branch
git checkout deprecate/cesium-to-legacy
```

### Step 0.3: Documentation Snapshot
**Estimate:** 30 min

```bash
# Dokumenter current Cesium state
mkdir docs/legacy/
touch docs/legacy/CESIUM_FEATURES.md
touch docs/legacy/CESIUM_API_REFERENCE.md
```

Inkluder:
- Alle Cesium props interfaces
- Event handlers
- Feature toggles
- Usage examples

**Deliverable:** Full Cesium documentation for future reference

---

## PHASE 1: Extract Shared Utilities (1-2 dager)

### Step 1.1: Create Map Color Utilities
**Owner:** Developer
**Estimate:** 2 timer
**Files:** `src/lib/mapColorUtils.ts` (NEW)

```typescript
/**
 * Shared map color computation utilities
 * Used by all map renderers (Three.js, Canvas 2D)
 */

import { Color, MathUtils } from 'three';

// Color constants
const INTEL_COLOR_START = new Color('#1d4ed8');
const INTEL_COLOR_END = new Color('#38bdf8');
const RESOURCE_COLOR_START = new Color('#ea580c');
const RESOURCE_COLOR_END = new Color('#facc15');

/**
 * Compute diplomatic relationship color
 * @param score Relationship score (-100 to +100)
 * @returns Hex color string
 */
export function computeDiplomaticColor(score: number): string {
  if (score >= 60) return '#4ade80';   // Green - Allied
  if (score >= 20) return '#22d3ee';   // Cyan - Friendly
  if (score <= -40) return '#f87171';  // Red - Hostile
  return '#facc15';                    // Yellow - Neutral
}

/**
 * Compute intelligence coverage color
 * @param normalized Intelligence level (0.0 to 1.0)
 * @returns Hex color string
 */
export function computeIntelColor(normalized: number): string {
  const clamped = MathUtils.clamp(normalized, 0, 1);
  return INTEL_COLOR_START.clone().lerp(INTEL_COLOR_END, clamped).getStyle();
}

/**
 * Compute resource distribution color
 * @param normalized Resource amount (0.0 to 1.0)
 * @returns Hex color string
 */
export function computeResourceColor(normalized: number): string {
  const clamped = MathUtils.clamp(normalized, 0, 1);
  return RESOURCE_COLOR_START.clone().lerp(RESOURCE_COLOR_END, clamped).getStyle();
}

/**
 * Compute political stability/unrest color
 * @param stability Stability percentage (0-100)
 * @returns Hex color string
 */
export function computeUnrestColor(stability: number): string {
  if (stability >= 65) return '#22c55e';  // Green - Stable
  if (stability >= 45) return '#facc15';  // Yellow - Tense
  return '#f87171';                       // Red - Crisis
}

/**
 * Convert hex color to RGBA string
 * @param color Hex color string
 * @param alpha Alpha value (0.0 to 1.0)
 * @returns RGBA string
 */
export function colorToRgba(color: string, alpha: number): string {
  const parsed = new Color(color);
  const r = Math.round(parsed.r * 255);
  const g = Math.round(parsed.g * 255);
  const b = Math.round(parsed.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${MathUtils.clamp(alpha, 0, 1)})`;
}
```

### Step 1.2: Update GlobeScene to use shared utils
**Estimate:** 1 time

**Fil:** `src/components/GlobeScene.tsx`

```typescript
// BEFORE (lines 556-580)
const computeDiplomaticColor = useCallback((score: number) => {
  if (score >= 60) return '#4ade80';
  // ... duplicated code
}, []);

// AFTER
import {
  computeDiplomaticColor,
  computeIntelColor,
  computeResourceColor,
  computeUnrestColor
} from '@/lib/mapColorUtils';

// Remove all local color computation functions
// Use imported functions directly in rendering code
```

**Testing:**
- [ ] Visual inspection - farger ser identiske ut
- [ ] All map modes fungerer (diplomatic, intel, resources, unrest)
- [ ] No console errors

### Step 1.3: Update WorldRenderer to use shared utils
**Estimate:** 1 time

**Fil:** `src/rendering/worldRenderer.ts`

```typescript
// BEFORE (lines 492-513)
function computeDiplomaticColor(score: number): string {
  // ... duplicated code
}

// AFTER
import {
  computeDiplomaticColor,
  computeIntelColor,
  computeResourceColor,
  computeUnrestColor,
  colorToRgba
} from '@/lib/mapColorUtils';

// Remove all local implementations (lines 492-521)
```

**Testing:**
- [ ] Canvas 2D rendering fungerer
- [ ] Flat map modes ser identiske ut
- [ ] No regressions

### Step 1.4: Create unit tests for color utils
**Estimate:** 1 time

**Fil:** `src/lib/__tests__/mapColorUtils.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';
import {
  computeDiplomaticColor,
  computeIntelColor,
  computeResourceColor,
  computeUnrestColor,
  colorToRgba
} from '../mapColorUtils';

describe('mapColorUtils', () => {
  describe('computeDiplomaticColor', () => {
    it('returns green for allied nations (>= 60)', () => {
      expect(computeDiplomaticColor(100)).toBe('#4ade80');
      expect(computeDiplomaticColor(60)).toBe('#4ade80');
    });

    it('returns cyan for friendly nations (20-59)', () => {
      expect(computeDiplomaticColor(50)).toBe('#22d3ee');
      expect(computeDiplomaticColor(20)).toBe('#22d3ee');
    });

    it('returns red for hostile nations (<= -40)', () => {
      expect(computeDiplomaticColor(-100)).toBe('#f87171');
      expect(computeDiplomaticColor(-40)).toBe('#f87171');
    });

    it('returns yellow for neutral nations', () => {
      expect(computeDiplomaticColor(0)).toBe('#facc15');
      expect(computeDiplomaticColor(19)).toBe('#facc15');
      expect(computeDiplomaticColor(-39)).toBe('#facc15');
    });
  });

  // ... more tests
});
```

**Phase 1 Completion Criteria:**
- [ ] All color functions in shared utility file
- [ ] GlobeScene using shared utils
- [ ] WorldRenderer using shared utils
- [ ] Unit tests passing (>90% coverage)
- [ ] No visual regressions
- [ ] Commit: "refactor: extract map color utilities to shared module"

---

## PHASE 2: Port Critical Cesium Features (3-5 dager)

### Step 2.1: Port Territory Polygons til Three.js
**Owner:** Developer
**Estimate:** 1-2 dager
**Priority:** P0 - Critical for gameplay

**Current Cesium implementation:** `src/utils/cesiumTerritoryData.ts`

**New Three.js implementation:**

**Fil:** `src/lib/territoryPolygons.ts` (NEW)

```typescript
/**
 * Territory polygon rendering for Three.js
 */

import * as THREE from 'three';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

export interface TerritoryPolygon {
  id: string;
  name: string;
  geometry: Polygon | MultiPolygon;
  color: string;
}

/**
 * Convert GeoJSON polygon to THREE.Shape
 */
export function geoJsonToShape(
  coordinates: number[][][],
  latLonToVector3: (lon: number, lat: number, radius: number) => THREE.Vector3,
  radius: number
): THREE.Shape {
  const shape = new THREE.Shape();

  coordinates[0].forEach((coord, i) => {
    const [lon, lat] = coord;
    const vec = latLonToVector3(lon, lat, radius);

    // Project to 2D plane for shape
    if (i === 0) {
      shape.moveTo(vec.x, vec.y);
    } else {
      shape.lineTo(vec.x, vec.y);
    }
  });

  shape.closePath();
  return shape;
}

/**
 * Create THREE.Line for territory boundaries
 */
export function createTerritoryBoundary(
  polygon: TerritoryPolygon,
  latLonToVector3: (lon: number, lat: number, radius: number) => THREE.Vector3,
  radius: number,
  color: string = '#ffffff'
): THREE.Line {
  const points: THREE.Vector3[] = [];
  const coords = polygon.geometry.type === 'Polygon'
    ? polygon.geometry.coordinates[0]
    : polygon.geometry.coordinates[0][0];

  coords.forEach(([lon, lat]) => {
    points.push(latLonToVector3(lon, lat, radius + 0.01));
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    linewidth: 2
  });

  return new THREE.Line(geometry, material);
}

/**
 * Load territory data from Cesium format
 */
export async function loadTerritoryData(): Promise<TerritoryPolygon[]> {
  // Import existing Cesium territory boundaries
  const { TERRITORY_BOUNDARIES } = await import('@/utils/cesiumTerritoryData');

  return Object.entries(TERRITORY_BOUNDARIES).map(([id, data]: [string, any]) => ({
    id,
    name: data.name || id,
    geometry: data.polygon,
    color: data.color || '#ffffff'
  }));
}
```

**Update GlobeScene.tsx:**

```typescript
// Add to GlobeScene component
const [territoryBoundaries, setTerritoryBoundaries] = useState<THREE.Line[]>([]);

useEffect(() => {
  loadTerritoryData().then(territories => {
    const boundaries = territories.map(territory =>
      createTerritoryBoundary(territory, latLonToVector3, EARTH_RADIUS, territory.color)
    );
    setTerritoryBoundaries(boundaries);
  });
}, []);

// In render:
{territoryBoundaries.map((boundary, i) => (
  <primitive key={i} object={boundary} />
))}
```

**Testing:**
- [ ] Territory boundaries rendrer korrekt
- [ ] Polygon shapes ser riktige ut
- [ ] Colors matcher Cesium version
- [ ] Performance er akseptabel

### Step 2.2: Port Missile Trajectories
**Estimate:** 1 dag
**Priority:** P0 - Critical for gameplay

**Fil:** `src/lib/missileTrajectories.ts` (NEW)

```typescript
/**
 * Missile trajectory calculations and rendering for Three.js
 */

import * as THREE from 'three';

export interface MissileTrajectory {
  from: { lon: number; lat: number };
  to: { lon: number; lat: number };
  duration: number;
  color?: string;
}

/**
 * Calculate ballistic arc between two points
 * Uses sub-orbital trajectory physics
 */
export function calculateBallisticArc(
  fromVec: THREE.Vector3,
  toVec: THREE.Vector3,
  peakHeight: number = 0.5,
  segments: number = 50
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const midpoint = new THREE.Vector3().lerpVectors(fromVec, toVec, 0.5);
  const distance = fromVec.distanceTo(toVec);

  // Control point for quadratic bezier curve
  const controlPoint = midpoint.clone().multiplyScalar(1 + peakHeight * (distance / 2));

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    // Quadratic bezier curve
    const point = new THREE.Vector3(
      mt2 * fromVec.x + 2 * mt * t * controlPoint.x + t2 * toVec.x,
      mt2 * fromVec.y + 2 * mt * t * controlPoint.y + t2 * toVec.y,
      mt2 * fromVec.z + 2 * mt * t * controlPoint.z + t2 * toVec.z
    );

    points.push(point);
  }

  return points;
}

/**
 * Create animated missile trajectory line
 */
export function createMissileTrajectoryLine(
  trajectory: MissileTrajectory,
  latLonToVector3: (lon: number, lat: number, radius: number) => THREE.Vector3,
  radius: number
): { line: THREE.Line; animate: (t: number) => void } {
  const fromVec = latLonToVector3(trajectory.from.lon, trajectory.from.lat, radius);
  const toVec = latLonToVector3(trajectory.to.lon, trajectory.to.lat, radius);

  const points = calculateBallisticArc(fromVec, toVec);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(trajectory.color || '#ff0000'),
    linewidth: 3,
    transparent: true,
    opacity: 0.8
  });

  const line = new THREE.Line(geometry, material);

  // Animation function
  const animate = (t: number) => {
    // Draw percentage of line based on t (0.0 to 1.0)
    const visiblePoints = Math.floor(points.length * t);
    const animatedPoints = points.slice(0, visiblePoints);
    geometry.setFromPoints(animatedPoints);
  };

  return { line, animate };
}
```

**Usage i GlobeScene:**

```typescript
const [missiles, setMissiles] = useState<Array<{
  line: THREE.Line;
  startTime: number;
  duration: number;
}>>([]);

// Animation loop
useFrame(({ clock }) => {
  missiles.forEach(missile => {
    const elapsed = clock.getElapsedTime() - missile.startTime;
    const progress = Math.min(elapsed / missile.duration, 1.0);
    // Update trajectory animation
    if (progress < 1.0) {
      // Animate trajectory drawing
    }
  });
});

// Expose method via ref
const fireMissile = useCallback((from, to) => {
  const trajectory = createMissileTrajectoryLine(
    { from, to, duration: 5.0 },
    latLonToVector3,
    EARTH_RADIUS
  );
  setMissiles(prev => [...prev, {
    ...trajectory,
    startTime: clock.getElapsedTime(),
    duration: 5.0
  }]);
}, []);
```

**Testing:**
- [ ] Missiles fly korrekt arc
- [ ] Animation er smooth
- [ ] Multiple simultaneous missiles fungerer
- [ ] Cleanup etter completion

### Step 2.3: Port 3D Unit Models (Optional)
**Estimate:** ½ dag
**Priority:** P1 - Nice to have

**Fil:** `src/lib/unitModels.ts` (NEW)

```typescript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();

export async function loadUnitModel(unitType: string): Promise<THREE.Group> {
  const modelPaths: Record<string, string> = {
    'tank': '/models/units/tank.glb',
    'aircraft': '/models/units/aircraft.glb',
    'ship': '/models/units/ship.glb'
  };

  const path = modelPaths[unitType];
  if (!path) {
    throw new Error(`No model for unit type: ${unitType}`);
  }

  const gltf = await loader.loadAsync(path);
  return gltf.scene;
}
```

**Decision point:** Skal vi bruke 3D models eller billboard sprites?
- 3D models = Bedre visuals, høyere performance cost
- Billboards = Enklere, bedre performance

### Step 2.4: Update GlobeScene API
**Estimate:** 1 time

**Oppdater `GlobeSceneProps` interface:**

```typescript
export interface GlobeSceneProps {
  // ... existing props
  territories?: TerritoryPolygon[];
  units?: Array<{
    id: string;
    lon: number;
    lat: number;
    type: string;
    model?: string;
  }>;
  onNationClick?: (nationId: string) => void;
  onTerritoryClick?: (territoryId: string) => void;
  onUnitClick?: (unitId: string) => void;
}

export interface GlobeSceneHandle {
  projectLonLat: ProjectorFn;
  pickLonLat: PickerFn;
  fireMissile: (from: {lon: number, lat: number}, to: {lon: number, lat: number}) => void;
  addExplosion: (lon: number, lat: number, radiusKm?: number) => void;
}
```

**Phase 2 Completion Criteria:**
- [ ] Territory polygons rendrer i Three.js
- [ ] Missile trajectories fungerer
- [ ] Unit models decision made og implementert
- [ ] GlobeScene API parity med Cesium
- [ ] Tests passing
- [ ] Commit: "feat: port territory polygons and missiles to Three.js"

---

## PHASE 3: Deprecation Warnings (½ dag)

### Step 3.1: Add deprecation notices
**Estimate:** 1 time

**Fil:** `src/components/CesiumViewer.tsx`

```typescript
/**
 * @deprecated This component will be removed in v2.0
 * Use GlobeScene with Three.js instead
 * See: CESIUM_DEPRECATION_PLAN.md
 */
export default forwardRef<CesiumViewerHandle, CesiumViewerProps>(
  function CesiumViewer(props, ref) {
    // Add console warning in development
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[DEPRECATED] CesiumViewer is deprecated and will be removed in v2.0. ' +
          'Please migrate to GlobeScene. See CESIUM_DEPRECATION_PLAN.md'
        );
      }
    }, []);

    // ... rest of component
  }
);
```

### Step 3.2: Update OptionsMenu
**Estimate:** 30 min

**Fil:** `src/components/OptionsMenu.tsx:84-87`

```typescript
const VIEWER_OPTIONS = [
  {
    value: 'threejs',
    label: 'Three.js Tactical (Primary)',
    description: 'Primary Three.js engine with full feature support.',
  },
  {
    value: 'cesium',
    label: 'Cesium (DEPRECATED)',
    description: '⚠️ DEPRECATED - Will be removed in v2.0. Use Three.js instead.',
  },
];
```

Add toast warning när användare växlar till Cesium:

```typescript
const handleViewerChange = (viewer: 'threejs' | 'cesium') => {
  if (viewer === 'cesium') {
    toast({
      title: '⚠️ Cesium Deprecated',
      description: 'Cesium viewer will be removed in v2.0. Please use Three.js.',
      variant: 'destructive',
      duration: 5000
    });
  }
  setViewerType(viewer);
  Storage.setItem('viewer_type', viewer);
};
```

**Phase 3 Completion Criteria:**
- [ ] Deprecation warnings in code
- [ ] User-visible warnings in UI
- [ ] Documentation updated
- [ ] Commit: "chore: add Cesium deprecation warnings"

---

## PHASE 4: Remove Cesium (1 dag)

### Step 4.1: Remove viewer switching logic
**Estimate:** 2 timer

**Fil:** `src/pages/Index.tsx`

**BEFORE (lines 5702-5705):**
```typescript
const [viewerType, setViewerType] = useState<'threejs' | 'cesium'>(() => {
  const stored = Storage.getItem('viewer_type');
  return stored === 'cesium' ? 'cesium' : 'threejs';
});
```

**AFTER:**
```typescript
// Removed - always use Three.js
// Legacy: viewerType state removed in v2.0 (Cesium deprecated)
```

**BEFORE (lines 11830-11857):**
```typescript
{viewerType === 'threejs' ? (
  <GlobeScene ... />
) : (
  <CesiumViewer ... />
)}
```

**AFTER:**
```typescript
<GlobeScene
  cam={cam}
  nations={nations}
  worldCountries={worldCountries}
  territories={Object.values(conventional.state.territories)}
  units={Object.values(conventional.state.units)}
  onProjectorReady={handleProjectorReady}
  onPickerReady={handlePickerReady}
  onTerritoryClick={(id) => {/* future implementation */}}
  onUnitClick={(id) => {/* future implementation */}}
  mapStyle={mapStyle}
  modeData={mapModeData}
/>
```

**Remove forced switch logic (lines 5708-5716):**
```typescript
// REMOVE THIS ENTIRE BLOCK:
const requiresThreeTacticalEngine =
  style === 'flat' || style === 'flat-realistic' || style === 'flat-nightlights';

if (requiresThreeTacticalEngine && viewerType !== 'threejs') {
  setViewerType('threejs');
  // ...
}
```

### Step 4.2: Remove Cesium option fra OptionsMenu
**Estimate:** 30 min

**Fil:** `src/components/OptionsMenu.tsx`

```typescript
// REMOVE Cesium fra VIEWER_OPTIONS array
const VIEWER_OPTIONS = [
  {
    value: 'threejs',
    label: 'Three.js Tactical',
    description: 'Primary rendering engine with full feature support.',
  },
  // REMOVED: Cesium option
];

// REMOVE viewer type selector helt fra UI hvis kun ett alternativ
// eller fjern hele seksjonen
```

### Step 4.3: Remove imports
**Estimate:** 15 min

**Fil:** `src/pages/Index.tsx`

```typescript
// REMOVE these imports:
import CesiumViewer from '@/components/CesiumViewer';
import CesiumHeroGlobe from '@/components/CesiumHeroGlobe';
```

**Fil:** `src/components/setup/IntroScreen.tsx`
```typescript
// Remove any Cesium references
```

### Step 4.4: Move Cesium files to legacy/
**Estimate:** 30 min

```bash
# Create legacy directory structure
mkdir -p src/components/legacy/
mkdir -p src/utils/legacy/

# Move Cesium files
git mv src/components/CesiumViewer.tsx src/components/legacy/
git mv src/components/CesiumHeroGlobe.tsx src/components/legacy/
git mv src/utils/cesiumTerritoryData.ts src/utils/legacy/

# Update imports in legacy files to relative paths
# Add README explaining these are archived
cat > src/components/legacy/README.md << 'EOF'
# Legacy Components

These components have been deprecated and moved here for archival purposes.

## CesiumViewer
- **Deprecated:** v2.0
- **Reason:** Consolidated to Three.js primary engine
- **Replacement:** Use `GlobeScene` component instead
- **Restoration:** See `CESIUM_DEPRECATION_PLAN.md` for instructions

To restore Cesium support:
1. Move files back to `src/components/`
2. Restore Cesium dependencies in package.json
3. Re-add viewer switching logic in Index.tsx
EOF
```

### Step 4.5: Clean localStorage migration
**Estimate:** 30 min

**Fil:** `src/lib/storageMigration.ts` (NEW)

```typescript
/**
 * Clean up legacy storage keys from deprecated features
 */
export function cleanupLegacyStorage() {
  // Remove Cesium viewer preference
  const viewerType = localStorage.getItem('norad_viewer_type');
  if (viewerType === 'cesium') {
    console.info('[Storage Migration] Removing deprecated Cesium viewer preference');
    localStorage.removeItem('norad_viewer_type');
  }
}

// Call on app initialization
cleanupLegacyStorage();
```

**Fil:** `src/pages/Index.tsx`

```typescript
useEffect(() => {
  cleanupLegacyStorage();
}, []);
```

### Step 4.6: Remove Cesium dependencies
**Estimate:** 30 min

**Fil:** `package.json`

```bash
npm uninstall cesium
```

Verify andra dependencies:
```bash
# Check if anything else depends on Cesium
npm ls cesium

# Should output: (empty)
```

**Check imports:**
```bash
# Ensure no remaining imports except in legacy/
rg "from ['\"]cesium['\"]" src/
# Should only show matches in src/components/legacy/ and src/utils/legacy/
```

### Step 4.7: Update build configuration
**Estimate:** 30 min

**Fil:** `vite.config.ts`

Remove Cesium-specific configuration:

```typescript
// BEFORE:
export default defineConfig({
  // ... other config
  optimizeDeps: {
    include: ['cesium']
  },
  build: {
    rollupOptions: {
      external: ['cesium']
    }
  }
});

// AFTER:
export default defineConfig({
  // ... other config without Cesium references
});
```

### Step 4.8: Verify bundle size reduction
**Estimate:** 15 min

```bash
# Build production bundle
npm run build

# Check bundle size
du -sh dist/

# Compare with previous build
# Expected reduction: ~1.7MB
```

**Phase 4 Completion Criteria:**
- [ ] No Cesium code in active src/ (only in legacy/)
- [ ] No Cesium dependencies in package.json
- [ ] viewerType state removed from Index.tsx
- [ ] Always renders GlobeScene
- [ ] localStorage cleaned up
- [ ] Bundle size reduced by ~1.7MB
- [ ] All tests passing
- [ ] Commit: "feat!: remove Cesium viewer, consolidate to Three.js"
- [ ] Git tag: `v2.0-cesium-removed`

---

## PHASE 5: Testing & Validation (1 dag)

### Step 5.1: Manual testing checklist
**Owner:** QA
**Estimate:** 3 timer

- [ ] **Visual Styles:** Test all 9 map visual styles
  - [ ] realistic
  - [ ] wireframe
  - [ ] night
  - [ ] political
  - [ ] flat
  - [ ] flat-realistic
  - [ ] nightlights
  - [ ] flat-nightlights
  - [ ] topo

- [ ] **Map Modes:** Test all 5 map modes
  - [ ] standard
  - [ ] diplomatic (verify colors)
  - [ ] intel (verify coverage)
  - [ ] resources (verify distribution)
  - [ ] unrest (verify stability)

- [ ] **Ported Features:**
  - [ ] Territory polygons render correctly
  - [ ] Missile trajectories animate properly
  - [ ] Unit markers/models display
  - [ ] Click handlers work

- [ ] **Performance:**
  - [ ] No FPS drops below 30
  - [ ] Smooth zoom/pan
  - [ ] No memory leaks (check DevTools)

- [ ] **Storage:**
  - [ ] Old `viewer_type` key cleaned up
  - [ ] Map style preferences persist
  - [ ] No Cesium-related errors in console

### Step 5.2: Automated test updates
**Estimate:** 2 timer

Update test suites:

```bash
# Update component tests
src/components/__tests__/GlobeScene.test.tsx
src/rendering/__tests__/worldRenderer.test.ts
src/lib/__tests__/mapColorUtils.test.ts
src/lib/__tests__/territoryPolygons.test.ts
src/lib/__tests__/missileTrajectories.test.ts

# Remove obsolete tests
rm src/components/__tests__/CesiumViewer.test.tsx
```

Run full test suite:
```bash
npm run test
npm run test:coverage

# Target: >80% coverage for map modules
```

### Step 5.3: Visual regression testing
**Estimate:** 2 timer

Screenshot comparison:

```bash
# Before removal (from main branch)
npm run test:screenshots -- --baseline

# After removal (from deprecate branch)
npm run test:screenshots -- --compare

# Review diffs
```

Expected changes:
- ✅ Map rendering should look identical
- ✅ UI without Cesium option
- ❌ NO unexpected visual changes

### Step 5.4: Performance benchmarking
**Estimate:** 1 time

```bash
# Bundle size comparison
echo "Before: $(git show main:dist/index.js | wc -c) bytes"
echo "After: $(wc -c < dist/index.js) bytes"
echo "Reduction: ~1.7MB expected"

# Runtime performance
npm run benchmark
# Compare FPS, memory usage before/after
```

**Phase 5 Completion Criteria:**
- [ ] All manual tests passing
- [ ] All automated tests passing (>80% coverage)
- [ ] No visual regressions
- [ ] Bundle size reduced as expected
- [ ] Performance metrics stable or improved
- [ ] No console errors/warnings
- [ ] Commit: "test: update tests after Cesium removal"

---

## PHASE 6: Documentation (½ dag)

### Step 6.1: Update main README
**Estimate:** 30 min

**Fil:** `README.md`

```markdown
## Map Rendering

Vector War Games uses **Three.js** for 3D globe rendering with the following features:

- 9 visual styles (realistic, wireframe, night, political, flat modes, etc.)
- 5 map modes (standard, diplomatic, intel, resources, unrest)
- Territory polygon boundaries
- Animated missile trajectories
- 3D unit visualization
- Dynamic overlays and effects

### Legacy: Cesium Viewer

Cesium viewer was deprecated in v2.0 and removed from production.

For historical reference or restoration, see:
- `src/components/legacy/CesiumViewer.tsx`
- `docs/legacy/CESIUM_DEPRECATION_PLAN.md`
```

### Step 6.2: Create migration guide
**Estimate:** 1 time

**Fil:** `docs/CESIUM_MIGRATION_GUIDE.md` (NEW)

```markdown
# Cesium to Three.js Migration Guide

## For Users

**Q: Where did the Cesium map option go?**
A: Cesium has been deprecated and removed in v2.0. All features have been consolidated into the Three.js engine.

**Q: I was using Cesium for [feature]. Where is it now?**
A: Most Cesium features have been ported:
- Territory boundaries → Now in GlobeScene
- Missile trajectories → Now in GlobeScene
- 3D models → Now in GlobeScene

**Q: Can I still use Cesium?**
A: Technically yes, by checking out the `legacy/cesium-viewer` branch, but this is not recommended for production use.

## For Developers

### Before (Cesium)
```typescript
<CesiumViewer
  territories={territories}
  units={units}
  onTerritoryClick={handleClick}
  mapStyle={style}
/>
```

### After (Three.js)
```typescript
<GlobeScene
  nations={nations}
  territories={territories}
  units={units}
  onTerritoryClick={handleClick}
  mapStyle={style}
/>
```

### API Changes

| Cesium API | Three.js Equivalent | Notes |
|------------|---------------------|-------|
| `flyTo(lon, lat)` | `globe.current?.flyTo(lon, lat)` | Same API |
| `addMissileTrajectory()` | `globe.current?.fireMissile()` | Renamed |
| `highlightTerritory()` | Use onClick handler | Different pattern |

### Restoring Cesium (if necessary)

```bash
# Checkout legacy branch
git checkout legacy/cesium-viewer

# Cherry-pick Cesium files
git checkout legacy/cesium-viewer -- src/components/CesiumViewer.tsx
git checkout legacy/cesium-viewer -- src/utils/cesiumTerritoryData.ts

# Reinstall dependencies
npm install cesium

# Restore viewer switching in Index.tsx
# (see CESIUM_DEPRECATION_PLAN.md Phase 4 for what to restore)
```
```

### Step 6.3: Update CHANGELOG
**Estimate:** 30 min

**Fil:** `CHANGELOG.md`

```markdown
## [2.0.0] - 2025-11-XX

### Breaking Changes
- **REMOVED:** Cesium map viewer
  - All functionality consolidated to Three.js primary engine
  - Cesium dependencies removed from bundle (-1.7MB)
  - Viewer type selector removed from options
  - See `CESIUM_MIGRATION_GUIDE.md` for migration path

### Added
- Territory polygon rendering in Three.js
- Missile trajectory animation system
- 3D unit model support
- Shared map color utilities module

### Changed
- GlobeScene now handles all map rendering (territories, missiles, units)
- Simplified map configuration (single engine)

### Deprecated
- (none - Cesium already removed)

### Removed
- CesiumViewer component → moved to `src/components/legacy/`
- CesiumHeroGlobe component → moved to `src/components/legacy/`
- cesiumTerritoryData.ts → moved to `src/utils/legacy/`
- Cesium npm dependency

### Fixed
- Duplicate color computation logic consolidated
- Map mode overlays now consistent across all renderers

### Migration
Users on previous versions with `viewer_type: 'cesium'` will automatically migrate to Three.js.
Legacy Cesium code preserved in `legacy/cesium-viewer` branch for reference.
```

### Step 6.4: Update API documentation
**Estimate:** 30 min

**Fil:** `docs/API.md`

Update GlobeScene API documentation with new props:

```markdown
## GlobeScene Component

Primary map rendering component using Three.js.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `cam` | `{x, y, zoom}` | Yes | Camera position |
| `nations` | `Nation[]` | Yes | Nation markers |
| `territories` | `Territory[]` | No | Territory polygons (NEW in v2.0) |
| `units` | `Unit[]` | No | Military units (NEW in v2.0) |
| `mapStyle` | `MapStyle` | No | Visual style and mode |
| `onTerritoryClick` | `(id) => void` | No | Territory click handler (NEW) |

### Methods (via ref)

| Method | Signature | Description |
|--------|-----------|-------------|
| `fireMissile` | `(from, to) => void` | Launch missile animation (NEW in v2.0) |
| `addExplosion` | `(lon, lat, radius?) => void` | Add explosion effect (NEW) |
```

**Phase 6 Completion Criteria:**
- [ ] README updated
- [ ] Migration guide created
- [ ] CHANGELOG updated
- [ ] API docs updated
- [ ] Legacy docs archived
- [ ] Commit: "docs: update documentation after Cesium removal"

---

## ROLLBACK PLAN

If critical issues are discovered:

### Emergency Rollback (< 1 hour)

```bash
# Revert to pre-removal state
git revert HEAD~1  # Revert last commit
npm install        # Restore dependencies
npm run build
npm run deploy

# OR full reset:
git reset --hard <commit-before-removal>
```

### Restore from Legacy Branch (< 2 hours)

```bash
# Get Cesium files back
git checkout legacy/cesium-viewer -- src/components/CesiumViewer.tsx
git checkout legacy/cesium-viewer -- src/components/CesiumHeroGlobe.tsx
git checkout legacy/cesium-viewer -- src/utils/cesiumTerritoryData.ts

# Restore dependencies
npm install cesium

# Restore viewer switching logic in Index.tsx
# (see git diff between current and legacy/cesium-viewer branch)

# Restore OptionsMenu viewer selector
# (see git diff)

# Test and deploy
npm run test
npm run build
npm run deploy
```

### Rollback Decision Criteria

Rollback if ANY of these occur:
- 🔴 **Critical gameplay bugs** (game unplayable)
- 🔴 **Major visual regressions** (map not rendering)
- 🔴 **Performance degradation** (FPS drops >50%)
- 🔴 **Build failures** (cannot deploy)

Do NOT rollback for:
- 🟢 Minor visual differences (acceptable)
- 🟢 Missing non-critical Cesium features (expected)
- 🟢 User complaints about preference (educate users)

---

## SUCCESS METRICS

Track these metrics before/after:

| Metric | Before | Target After | Actual After |
|--------|--------|--------------|--------------|
| Bundle size (gzipped) | ~3.2MB | ~1.5MB | ___ MB |
| Initial load time | ~2.5s | ~1.5s | ___ s |
| Map render FPS | 60 fps | 60 fps | ___ fps |
| Lines of map code | ~5,200 | ~3,500 | ___ |
| Duplicate functions | 12+ | 0 | ___ |
| Test coverage | ~60% | >80% | ___% |
| Viewer options | 2 | 1 | ___ |
| Open map bugs | 8 | <5 | ___ |

---

## TIMELINE

| Phase | Duration | Start | End | Owner | Status |
|-------|----------|-------|-----|-------|--------|
| 0. Preparation | ½ day | ___ | ___ | Tech Lead | 🔴 Ikke startet |
| 1. Extract Utils | 1-2 days | ___ | ___ | Dev | 🔴 Ikke startet |
| 2. Port Features | 3-5 days | ___ | ___ | Dev | 🔴 Ikke startet |
| 3. Deprecation | ½ day | ___ | ___ | Dev | 🔴 Ikke startet |
| 4. Removal | 1 day | ___ | ___ | Dev | 🔴 Ikke startet |
| 5. Testing | 1 day | ___ | ___ | QA | 🔴 Ikke startet |
| 6. Documentation | ½ day | ___ | ___ | Dev | 🔴 Ikke startet |

**Total Estimate:** 7-10 arbeidsdager
**Buffer:** +2 dager for uventede problemer
**Target Completion:** ~2 uker fra start

---

## STAKEHOLDER SIGN-OFF

| Role | Name | Approved | Date | Signature |
|------|------|----------|------|-----------|
| Tech Lead | ___ | ☐ | ___ | ___ |
| Product Owner | ___ | ☐ | ___ | ___ |
| QA Lead | ___ | ☐ | ___ | ___ |
| UX Designer | ___ | ☐ | ___ | ___ |

---

## NOTES

- **Feature preservation:** Legacy branch ensures Cesium can be restored if needed
- **Low risk:** Cesium already marked "experimental", Three.js is primary
- **High reward:** Cleaner codebase, smaller bundle, easier maintenance
- **User impact:** Minimal - most users already use Three.js
- **Developer impact:** High - eliminates major technical debt

---

**STATUS:** 🔴 Planlagt - Venter på godkjenning

**NEXT STEPS:**
1. Review denne planen med team
2. Få stakeholder approval
3. Schedule Phase 0 start date
4. Create tracking GitHub issue with all subtasks
5. Begynn Phase 0: Preparation

---

**END OF DEPRECATION PLAN**
