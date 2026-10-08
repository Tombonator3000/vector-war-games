import { describe, expect, it } from 'vitest';
import type { FeatureCollection, Polygon } from 'geojson';
import { collectBorderSegments } from '../borders';

describe('date line border projection', () => {
  it('splits seam crossings instead of drawing a stripe across the flat map', () => {
    const countries: FeatureCollection<Polygon> = {
      type: 'FeatureCollection', features: [{
        type: 'Feature', properties: {}, geometry: {
          type: 'Polygon', coordinates: [[[179, 10], [-179, 12], [-178, 9], [179, 10]]],
        },
      }],
    };
    const segments = collectBorderSegments(countries)!;
    expect(segments.length).toBeGreaterThan(12);
    for (let i = 0; i < segments.length; i += 4) {
      expect(Math.abs(segments[i + 2] - segments[i])).toBeLessThanOrEqual(0.5);
    }
  });
});
