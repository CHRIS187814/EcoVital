import { INDIA_CITIES, getEnvironmentForCity, getEnvironmentFromCity } from '@/lib/indiaData';
import type { EnvironmentData } from '@/lib/types';

const TIMEOUT_MS = 6000;

async function getJson(url: string): Promise<{ current?: Record<string, unknown> }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Real-time air quality + weather from Open-Meteo (free, no API key).
 * Falls back to the built-in city estimates if the network call fails,
 * so the app never breaks during a demo.
 */
export async function fetchLiveEnvironment(cityName: string, lat?: number, lon?: number): Promise<EnvironmentData> {
  const known = INDIA_CITIES.find((c) => c.city.toLowerCase() === cityName.toLowerCase());
  const latitude = known?.lat ?? lat;
  const longitude = known?.lon ?? lon;
  if (latitude == null || longitude == null) return getEnvironmentForCity(cityName);

  try {
    const [air, weather] = await Promise.all([
      getJson(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,uv_index`,
      ),
      getJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`,
      ),
    ]);

    const pm25 = Number(air?.current?.pm2_5);
    const pm10 = Number(air?.current?.pm10);
    const uv = Number(air?.current?.uv_index);
    const temp = Number(weather?.current?.temperature_2m);
    const hum = Number(weather?.current?.relative_humidity_2m);
    if ([pm25, pm10, temp, hum].some((n) => !Number.isFinite(n))) throw new Error('Incomplete data');

    const base = known ?? { city: cityName, lat: latitude, lon: longitude, pm25: 0, pm10: 0, temperature: 0, humidity: 0, uvIndex: 0 };
    const env = getEnvironmentFromCity({
      ...base,
      pm25: Math.round(pm25 * 10) / 10,
      pm10: Math.round(pm10 * 10) / 10,
      temperature: Math.round(temp),
      humidity: Math.round(hum),
      uvIndex: Number.isFinite(uv) ? Math.round(uv * 10) / 10 : base.uvIndex,
    });
    return { ...env, source: 'live' };
  } catch {
    return getEnvironmentForCity(cityName);
  }
}
