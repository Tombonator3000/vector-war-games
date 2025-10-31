import { describe, expect, it } from 'vitest';

import { getGameTimestamp, calculateGameTime } from '../timeSystem';
import { SCENARIOS } from '../../types/scenario';

describe('Cold War scenario timeline', () => {
  const config = SCENARIOS.coldWar.timeConfig;

  it('starts the campaign in 1950', () => {
    const timestamp = getGameTimestamp(0, config);
    expect(timestamp).toBe('1950');
  });

  it('enters the 1960s when mid era unlocks at turn 11', () => {
    const midEraYear = calculateGameTime(10, config).year;
    expect(midEraYear).toBe(1960);

    const timestamp = getGameTimestamp(10, config);
    expect(timestamp).toBe('1960');
  });

  it('reaches the mid-1970s when late era unlocks at turn 26', () => {
    const lateEraYear = calculateGameTime(25, config).year;
    expect(lateEraYear).toBe(1975);

    const timestamp = getGameTimestamp(25, config);
    expect(timestamp).toBe('1975');
  });
});
