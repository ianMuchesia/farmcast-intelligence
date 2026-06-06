import { NextRequest, NextResponse } from 'next/server';
import type { TreeAnalysisResult, TreeAnalysisListResponse } from '@/types/weatherai';
import { fetchWithRetry } from '@/lib/retry';
import { treeLimiter, weatherLimiter } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/get-client-ip';

export async function POST(request: NextRequest) {
  if (!process.env.WEATHERAI_API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // ── IP rate limiting (tight — CV + Gemini is expensive) ────────────────────
  const ip = getClientIp(request);
  const limit = treeLimiter.check(ip);

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

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      return NextResponse.json(
        { error: 'image must be JPEG, PNG, or WEBP' },
        { status: 400 }
      );
    }

    if (image.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'image must be under 20MB' }, { status: 400 });
    }

    const newFormData = new FormData();
    for (const [key, value] of Array.from(formData.entries())) {
      newFormData.append(key, value);
    }

    const response = await fetchWithRetry('https://api.weather-ai.co/v1/trees/analyze', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WEATHERAI_API_KEY}`,
      },
      body: newFormData,
    });

    if (response.status === 401) {
      console.error('[WeatherAPI] Invalid API key');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (response.status === 403) {
      return NextResponse.json(
        { error: 'Tree analysis not available on your plan' },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Upstream error' },
        { status: response.status >= 500 ? 503 : 502 }
      );
    }

    const data: TreeAnalysisResult = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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

export async function GET(request: NextRequest) {
  if (!process.env.WEATHERAI_API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // ── IP rate limiting (history fetch — cheap read, use weatherLimiter) ──────
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
  const limitParam = searchParams.get('limit');
  const cursor = searchParams.get('cursor');

  const url = new URL('https://api.weather-ai.co/v1/trees/analyses');
  if (limitParam) url.searchParams.set('limit', limitParam);
  if (cursor) url.searchParams.set('cursor', cursor);

  try {
    const response = await fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.WEATHERAI_API_KEY}`,
      },
    });

    if (response.status === 401) {
      console.error('[WeatherAPI] Invalid API key');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (response.status === 403 || response.status === 404) {
      // Endpoint not available on this plan — return an empty list instead of 502
      // so AnalysisHistory shows the empty state rather than an error.
      console.warn('[Trees/GET] Analyses endpoint not available on this plan:', response.status);
      const empty: TreeAnalysisListResponse = { analyses: [], total: 0 };
      return NextResponse.json(empty, { status: 200 });
    }

    if (!response.ok) {
      let body = '';
      try { body = await response.text(); } catch (_) {}
      console.error(`[Trees/GET] Upstream ${response.status}:`, body);
      return NextResponse.json(
        { error: 'Upstream error', upstreamStatus: response.status },
        { status: response.status >= 500 ? 503 : 502 }
      );
    }

    const data: TreeAnalysisListResponse = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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
