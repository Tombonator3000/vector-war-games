/**
 * SpinningEarth Component
 *
 * Realistic 3D Earth globe component with real textures matching dramatic space view.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import { Globe3D } from '@/components/Globe3D';

export const SpinningEarth = () => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
    <Globe3D />
  </div>
);
