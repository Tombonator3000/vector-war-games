import type { MapVisualStyle, MapMode, MapStyle } from '@/types/globe';

export const MAP_VISUAL_STYLES: MapVisualStyle[] = ['morphing'];
export const UNIFIED_MAP_STYLE: MapVisualStyle = 'morphing';
export const MAP_MODES: MapMode[] = [
  'standard',
  'diplomatic',
  'intel',
  'resources',
  'unrest',
  'pandemic',
  'radiation',
  'migration',
];
export const DEFAULT_MAP_STYLE: MapStyle = { visual: 'morphing', mode: 'standard' };
