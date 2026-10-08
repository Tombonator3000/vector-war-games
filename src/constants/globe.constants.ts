export const EARTH_RADIUS = 1.8;
export const MORPHING_FLAT_HEIGHT = EARTH_RADIUS * 2;
export const MORPHING_FLAT_WIDTH = MORPHING_FLAT_HEIGHT * 2;
export const SURFACE_SEGMENTS = { width: 128, height: 64 } as const;

export const MATERIAL_TEXTURE_KEYS = [
  'map',
  'alphaMap',
  'aoMap',
  'envMap',
  'lightMap',
  'bumpMap',
  'normalMap',
  'displacementMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'specularMap',
  'gradientMap',
] as const;

