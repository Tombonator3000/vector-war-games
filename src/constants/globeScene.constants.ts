import type { TerritoryPolygon } from '@/lib/territoryPolygons';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import type { Unit } from '@/lib/unitModels';
import type { CloudRegion } from '@/hooks/useWeatherRadar';

// Stable empty defaults keep render effects from rescheduling themselves.
export const EMPTY_TERRITORIES: TerritoryPolygon[] = [];
export const EMPTY_TERRITORY_STATES: TerritoryState[] = [];
export const EMPTY_UNITS: Unit[] = [];
export const EMPTY_WEATHER_CLOUDS: CloudRegion[] = [];
