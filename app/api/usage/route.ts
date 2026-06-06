import { NextRequest, NextResponse } from 'next/server';
import type { UsageResponse } from '@/types/weatherai';
import { usageCache } from '@/lib/weather-cache';
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

  const cachedData = usageCache.get('usage');
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

  try {
    const response = await fetchWithRetry('https://api.weather-ai.co/v1/usage', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.WEATHERAI_API_KEY}`,
      },
    });

    if (response.status === 401) {
      console.error('[WeatherAPI] Invalid API key');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Upstream error' },
        { status: response.status >= 500 ? 503 : 502 }
      );
    }

    const data: UsageResponse = await response.json();

    usageCache.set('usage', data);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-RateLimit-Remaining': String(limit.remaining),
        'X-RateLimit-Reset': String(limit.resetAt),
      },
    });
  } catch (error: unknown) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status: number }).status
        : 502;
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: status === 500 || status === 503 ? 503 : 502 }
    );
  }
}
