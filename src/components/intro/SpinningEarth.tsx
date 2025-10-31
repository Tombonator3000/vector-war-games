/**
 * SpinningEarth Component
 *
 * Realistic 3D Earth globe component with real textures and cloud layers.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import CesiumHeroGlobe from '@/components/CesiumHeroGlobe';

export const SpinningEarth = () => (
  <div className="earth-container" style={{ position: 'relative' }}>
    <CesiumHeroGlobe />
  </div>
);
