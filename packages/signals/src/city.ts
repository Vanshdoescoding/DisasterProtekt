export interface CityConfig {
  id: string;
  name: string;
  bbox: { minLat: number; minLon: number; maxLat: number; maxLon: number };
  h3Resolution: number;
}

export const CITY_CONFIGS: Record<string, CityConfig> = {
  mv: {
    id: 'mv',
    name: 'Mountain View, CA',
    bbox: {
      minLat: 37.356,
      minLon: -122.117,
      maxLat: 37.456,
      maxLon: -122.044,
    },
    h3Resolution: 8,
  },
};

export function getCityConfig(cityId: string): CityConfig {
  return CITY_CONFIGS[cityId] ?? CITY_CONFIGS.mv;
}
