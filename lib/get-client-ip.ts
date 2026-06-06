import { NextRequest } from 'next/server';

/**
 * lib/get-client-ip.ts
 *
 * Extracts the real client IP from a NextRequest by checking
 * proxy-forwarded headers before falling back to 127.0.0.1.
 *
 * Header priority:
 *   1. x-forwarded-for  — standard proxy header (may be comma-list)
 *   2. x-real-ip        — set by nginx and some CDNs
 *   3. 127.0.0.1        — safe fallback for local dev / missing headers
 */
export function getClientIp(request: NextRequest): string {
  // x-forwarded-for can be "IP1, IP2, IP3" — first entry is the original client
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}
