import { describe, expect, it, vi } from 'vitest';
import { drawCityLights } from '../cityLightsRenderer';

describe('city light overlay', () => {
  it('draws only visible cities at projected CSS coordinates and restores canvas state', () => {
    const context = { save: vi.fn(), restore: vi.fn(), fillRect: vi.fn() } as unknown as CanvasRenderingContext2D;
    const cities = [{ lat: 0, lon: 0, brightness: 1 }, { lat: 0, lon: 180, brightness: 1 }];
    drawCityLights(context, cities, lon => ({ x: 120, y: 80, visible: lon === 0 }), 1, 0);
    expect(context.fillRect).toHaveBeenCalledTimes(1);
    expect(context.fillRect).toHaveBeenCalledWith(119, 79, 2, 2);
    expect(context.save).toHaveBeenCalledOnce();
    expect(context.restore).toHaveBeenCalledOnce();
  });
});
