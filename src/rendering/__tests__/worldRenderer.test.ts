import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';

import { computeFeatureLabelAnchor } from '../worldRenderer';

describe('computeFeatureLabelAnchor', () => {
  it('computes centroid for a simple polygon feature', () => {
    const feature: Feature<Polygon> = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
            [0, 0],
          ],
        ],
      },
      properties: { name: 'Testland' },
    };

    const anchor = computeFeatureLabelAnchor(feature);
    expect(anchor).not.toBeNull();
    expect(anchor?.lon).toBeCloseTo(1, 6);
    expect(anchor?.lat).toBeCloseTo(1, 6);
  });

  it('area-weights multipolygon centroids', () => {
    const feature: Feature<MultiPolygon> = {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [2, 0],
              [2, 2],
              [0, 2],
              [0, 0],
            ],
          ],
          [
            [
              [10, 0],
              [14, 0],
              [14, 4],
              [10, 4],
              [10, 0],
            ],
          ],
        ],
      },
      properties: { name: 'Dualia' },
    };

    const anchor = computeFeatureLabelAnchor(feature);
    expect(anchor).not.toBeNull();
    expect(anchor?.lon).toBeCloseTo(9.8, 6);
    expect(anchor?.lat).toBeCloseTo(1.8, 6);
  });

  it('falls back to averaging for near-degenerate polygons', () => {
    const feature: Feature<Polygon> = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 1],
            [2, 2],
            [0, 0],
          ],
        ],
      },
      properties: { name: 'Linearia' },
    };

    const anchor = computeFeatureLabelAnchor(feature);
    expect(anchor).not.toBeNull();
    expect(anchor?.lon).toBeCloseTo(0.75, 6);
    expect(anchor?.lat).toBeCloseTo(0.75, 6);
  });
});
