'use client';

import type { WeatherConditions, AirQuality } from '@/types';

/**
 * REAL environmental data via Open-Meteo (keyless, no signup, CORS-enabled).
 * - Weather: api.open-meteo.com
 * - Air quality (US AQI, PM2.5/PM10, CO): air-quality-api.open-meteo.com
 *
 * These are genuinely live observations, not simulated. Every value returned
 * carries source: 'real' so the UI can show a REAL badge instead of PREVIEW.
 * If the network fails (offline / blocked), we return null and the caller keeps
 * its previous (simulated) values — we never fake a "real" result.
 */

const WMO: Record<number, { condition: WeatherConditions['condition']; icon: string }> = {
  0: { condition: 'clear', icon: '☀️' },
  1: { condition: 'clear', icon: '🌤️' },
  2: { condition: 'cloudy', icon: '⛅' },
  3: { condition: 'cloudy', icon: '☁️' },
  45: { condition: 'foggy', icon: '🌫️' },
  48: { condition: 'foggy', icon: '🌫️' },
  51: { condition: 'rainy', icon: '🌦️' },
  53: { condition: 'rainy', icon: '🌦️' },
  55: { condition: 'rainy', icon: '🌧️' },
  56: { condition: 'rainy', icon: '🌧️' },
  57: { condition: 'rainy', icon: '🌧️' },
  61: { condition: 'rainy', icon: '🌧️' },
  63: { condition: 'rainy', icon: '🌧️' },
  65: { condition: 'rainy', icon: '🌧️' },
  66: { condition: 'rainy', icon: '🌧️' },
  67: { condition: 'rainy', icon: '🌧️' },
  71: { condition: 'snowy', icon: '🌨️' },
  73: { condition: 'snowy', icon: '❄️' },
  75: { condition: 'snowy', icon: '❄️' },
  77: { condition: 'snowy', icon: '❄️' },
  80: { condition: 'rainy', icon: '🌦️' },
  81: { condition: 'rainy', icon: '🌧️' },
  82: { condition: 'rainy', icon: '🌧️' },
  85: { condition: 'snowy', icon: '🌨️' },
  86: { condition: 'snowy', icon: '❄️' },
  95: { condition: 'stormy', icon: '⛈️' },
  96: { condition: 'stormy', icon: '⛈️' },
  99: { condition: 'stormy', icon: '⛈️' },
};

export interface EnvSnapshot {
  weather: WeatherConditions;
  airQuality: AirQuality | null;
}

export async function fetchRealEnv(
  lat: number,
  lng: number,
  unit: 'f' | 'c' = 'f',
): Promise<EnvSnapshot | null> {
  try {
    const tUnit = unit === 'c' ? 'celsius' : 'fahrenheit';
    const wUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code` +
      `&temperature_unit=${tUnit}&wind_speed_unit=kmh`;
    const aUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
      `&current=us_aqi,pm2_5,pm10,carbon_monoxide`;

    const [wRes, aRes] = await Promise.all([
      fetch(wUrl, { signal: AbortSignal.timeout(12000) }),
      fetch(aUrl, { signal: AbortSignal.timeout(12000) }),
    ]);
    if (!wRes.ok) return null;

    const w = await wRes.json();
    const cur = w.current || {};
    const code = Number(cur.weather_code ?? 0);
    const mapped = WMO[code] || { condition: 'cloudy', icon: '☁️' };

    const weather: WeatherConditions = {
      temperature: Number(cur.temperature_2m ?? 0),
      condition: mapped.condition,
      humidity: Number(cur.relative_humidity_2m ?? 0),
      windSpeed: Number(cur.wind_speed_10m ?? 0),
      precipitation: Number(cur.precipitation ?? 0),
      icon: mapped.icon,
      source: 'real',
      timestamp: new Date().toISOString(),
    };

    let airQuality: AirQuality | null = null;
    if (aRes.ok) {
      const a = await aRes.json();
      const ac = a.current || {};
      airQuality = {
        usAqi: Number(ac.us_aqi ?? 0),
        pm2_5: Number(ac.pm2_5 ?? 0),
        pm10: Number(ac.pm10 ?? 0),
        carbonMonoxide: Number(ac.carbon_monoxide ?? 0),
        source: 'real',
        timestamp: new Date().toISOString(),
      };
    }
    return { weather, airQuality };
  } catch {
    // Network/CORS/offline — caller keeps prior values; never fabricate.
    return null;
  }
}

export function aqiLabel(aqi: number): { label: string; color: string } {
  if (aqi <= 50) return { label: 'Good', color: '#22c55e' };
  if (aqi <= 100) return { label: 'Moderate', color: '#eab308' };
  if (aqi <= 150) return { label: 'Unhealthy (sensitive)', color: '#f97316' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444' };
  if (aqi <= 300) return { label: 'Very unhealthy', color: '#a855f7' };
  return { label: 'Hazardous', color: '#7f1d1d' };
}
