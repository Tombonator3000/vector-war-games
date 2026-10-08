export interface City {
  lat: number;
  lon: number;
  brightness: number;
  nationId?: string;
  index?: number;
}

export interface CityNation {
  id: string;
  lat: number;
  lon: number;
  population: number;
  cities?: number;
  eliminated?: boolean;
}
