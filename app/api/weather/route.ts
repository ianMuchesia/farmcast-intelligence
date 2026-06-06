import { NextRequest, NextResponse } from 'next/server';
import type { WeatherResponse, WeatherQueryParams } from '@/types/weatherai';
import { weatherCache, buildWeatherCacheKey } from '@/lib/weather-cache';
import { fetchWithRetry } from '@/lib/retry';
import { weatherLimiter } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/get-client-ip';

export async function GET(request: NextRequest) {
  if (!process.env.WEATHERAI_API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // ── IP rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const limit = weatherLimiter.check(ip);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', resetAt: limit.resetAt },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(limit.resetAt),
        },
      }
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  const { searchParams } = new URL(request.url);
  const ipAuto = searchParams.get('ip') === 'auto';

  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');

  const lat = parseFloat(latStr || '');
  const lon = parseFloat(lonStr || '');

  if (!ipAuto && (isNaN(lat) || isNaN(lon))) {
    return NextResponse.json(
      { error: 'lat and lon are required unless ip=auto is provided' },
      { status: 400 }
    );
  }

  const days = parseInt(searchParams.get('days') || '7', 10);
  const ai = searchParams.get('ai') !== 'false';
  const units = (searchParams.get('units') as 'metric' | 'imperial') || 'metric';
  const lang = searchParams.get('lang') || 'en';

  const cacheParams: WeatherQueryParams = ipAuto
    ? { ip: 'auto', lat: 0, lon: 0, days, ai, units, lang }
    : { lat, lon, days, ai, units, lang };

  const cacheKey = buildWeatherCacheKey(cacheParams);

  const cachedData = weatherCache.get(cacheKey);
  if (cachedData) {
    return NextResponse.json(cachedData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'X-RateLimit-Remaining': String(limit.remaining),
        'X-RateLimit-Reset': String(limit.resetAt),
      },
    });
  }

  const url = new URL('https://api.weather-ai.co/v1/weather');
  if (ipAuto) {
    url.searchParams.set('ip', 'auto');
  } else {
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
  }
  url.searchParams.set('days', days.toString());
  url.searchParams.set('ai', ai.toString());
  url.searchParams.set('units', units);
  url.searchParams.set('lang', lang);

  try {
    const response = await fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.WEATHERAI_API_KEY}`,
      },
    });

    if (response.status === 429) {
      const resetAt = response.headers.get('X-RateLimit-Reset');
      return NextResponse.json(
        { error: 'API quota exceeded', resetAt },
        { status: 429 }
      );
    }

    if (response.status === 401) {
      console.error('[WeatherAPI] Invalid API key');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Upstream error', status: response.status },
        { status: 502 }
      );
    }

    const data: WeatherResponse = await response.json();
    weatherCache.set(cacheKey, data);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=600',
        'X-RateLimit-Remaining': String(limit.remaining),
        'X-RateLimit-Reset': String(limit.resetAt),
      },
    });
  } catch (error: unknown) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status: number }).status
        : 502;
    if (status >= 500 && status < 600) {
      return NextResponse.json({ error: 'Weather service unavailable' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
