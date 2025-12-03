/**
 * SpinningEarth Component
 *
 * Realistic 3D Earth globe component with real textures matching dramatic space view.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import { Globe3D } from '@/components/Globe3D';

export const SpinningEarth = () => (
  <div className="earth-container">
    <Globe3D />
  </div>
);
