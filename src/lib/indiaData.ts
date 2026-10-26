import type { EnvironmentData } from './types';

export interface CityEnv {
  city: string;
  lat: number;
  lon: number;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
  uvIndex: number;
}

// Representative Indian city environmental readings (typical seasonal values, CPCB ranges).
// Used as the live-environment data source for the demo in absence of an API key.
export const INDIA_CITIES: CityEnv[] = [
  { city: 'Delhi', lat: 28.6692, lon: 77.4538, pm25: 118, pm10: 198, temperature: 28, humidity: 55, uvIndex: 6 },
  { city: 'Mumbai', lat: 19.076, lon: 72.8777, pm25: 64, pm10: 112, temperature: 30, humidity: 75, uvIndex: 8 },
  { city: 'Bengaluru', lat: 12.9716, lon: 77.5946, pm25: 42, pm10: 78, temperature: 24, humidity: 68, uvIndex: 9 },
  { city: 'Chennai', lat: 13.0827, lon: 80.2707, pm25: 48, pm10: 88, temperature: 31, humidity: 72, uvIndex: 9 },
  { city: 'Kolkata', lat: 22.5726, lon: 88.3639, pm25: 88, pm10: 152, temperature: 29, humidity: 78, uvIndex: 7 },
  { city: 'Hyderabad', lat: 17.385, lon: 78.4867, pm25: 56, pm10: 98, temperature: 27, humidity: 60, uvIndex: 8 },
  { city: 'Pune', lat: 18.5204, lon: 73.8567, pm25: 52, pm10: 92, temperature: 26, humidity: 62, uvIndex: 8 },
  { city: 'Ahmedabad', lat: 23.0225, lon: 72.5714, pm25: 74, pm10: 128, temperature: 30, humidity: 55, uvIndex: 8 },
  { city: 'Jaipur', lat: 26.9124, lon: 75.7873, pm25: 82, pm10: 142, temperature: 29, humidity: 48, uvIndex: 8 },
  { city: 'Lucknow', lat: 26.8467, lon: 80.9462, pm25: 96, pm10: 168, temperature: 28, humidity: 62, uvIndex: 7 },
  { city: 'Chandigarh', lat: 30.7333, lon: 76.7794, pm25: 68, pm10: 118, temperature: 25, humidity: 58, uvIndex: 7 },
  { city: 'Kochi', lat: 9.9312, lon: 76.2673, pm25: 32, pm10: 58, temperature: 29, humidity: 80, uvIndex: 10 },
];

// India's National Air Quality Index (CPCB NAQI), 24-hour breakpoints, linear interpolation.
// [concentration_high, aqi_low, aqi_high] per band; bands are contiguous, lower bound = previous high.
type Band = [number, number, number];
const PM25_BANDS: Band[] = [
  [30, 0, 50],     // Good
  [60, 50, 100],   // Satisfactory
  [90, 100, 200],  // Moderate
  [120, 200, 300], // Poor
  [250, 300, 400], // Very Poor
  [380, 400, 500], // Severe
];
const PM10_BANDS: Band[] = [
  [50, 0, 50],
  [100, 50, 100],
  [250, 100, 200],
  [350, 200, 300],
  [430, 300, 400],
  [600, 400, 500],
];

function calcSubIndex(conc: number, bands: Band[]): number {
  let cLow = 0;
  for (const [cHigh, iLow, iHigh] of bands) {
    if (conc <= cHigh) {
      return Math.round(iLow + ((iHigh - iLow) / (cHigh - cLow)) * (conc - cLow));
    }
    cLow = cHigh;
  }
  return 500;
}

function aqiCategory(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getEnvironmentForCity(cityName: string): EnvironmentData {
  const found = INDIA_CITIES.find((c) => c.city.toLowerCase() === cityName.toLowerCase());
  const city = found ?? INDIA_CITIES[0];
  return getEnvironmentFromCity(city);
}

export function getEnvironmentFromCity(city: CityEnv): EnvironmentData {
  const pm25Aqi = calcSubIndex(city.pm25, PM25_BANDS);
  const pm10Aqi = calcSubIndex(city.pm10, PM10_BANDS);
  const aqi = Math.max(pm25Aqi, pm10Aqi);
  const dominant = pm25Aqi >= pm10Aqi ? 'PM2.5' : 'PM10';
  return {
    aqi,
    pm25: city.pm25,
    pm10: city.pm10,
    dominant_pollutant: dominant,
    category: aqiCategory(aqi),
    temperature: city.temperature,
    humidity: city.humidity,
    uvIndex: city.uvIndex,
    city: city.city,
    source: 'estimate',
  };
}

export const CITY_NAMES = INDIA_CITIES.map((c) => c.city);

export const COMMON_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'COPD',
  'Thyroid Disorder',
  'High Cholesterol',
];

export const COMMON_FAMILY_HISTORY = [
  'Diabetes',
  'Heart Disease',
  'Hypertension',
  'Cancer',
  'Asthma',
  'Stroke',
];

export const COMMON_SYMPTOMS = [
  'Fatigue',
  'Headache',
  'Shortness of breath',
  'Chest tightness',
  'Dizziness',
  'Cough',
  'None',
];

export const COMMON_FOODS = [
  'Leafy greens',
  'Berries',
  'Citrus fruits',
  'Nuts & seeds',
  'Whole grains',
  'Legumes',
  'Fish',
  'Dairy',
  'Turmeric',
  'Green tea',
];
