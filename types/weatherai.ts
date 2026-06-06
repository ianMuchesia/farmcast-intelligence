/**
 * types/weatherai.ts
 *
 * All types are derived from live API introspection against api.weather-ai.co/v1.
 * The actual response shape differs from WeatherAPI.com conventions — these types
 * reflect what the API actually returns, not what its docs imply.
 *
 * Notable: ai_summary is gated behind Pro+ plan (x-ai-allow: false on free tier).
 * condition_code is a string in the wire format (WMO codes as strings), not number.
 */

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export interface LocationData {
  lat: number;
  lon: number;
  timezone: string;
  /** Snapped coords may differ slightly from requested coords */
  requested_lat: number;
  requested_lon: number;
  country: string;
  /** Only present on ip=auto requests */
  city?: string;
  /** Only present on ip=auto requests */
  region?: string;
}

// ---------------------------------------------------------------------------
// Current conditions
// ---------------------------------------------------------------------------

export interface CurrentCondition {
  /** ISO datetime string: "2026-06-06T08:45" */
  time: string;
  temperature: number;
  wind_speed: number;
  /** Wind direction in degrees (0–360) */
  wind_direction: number;
  /** WMO weather interpretation code, returned as string by the API */
  condition_code: string;
  /** Full CDN URL to the condition icon SVG */
  icon: string;
  /** Relative path for self-hosted icon PNGs */
  icon_path: string;
}

// ---------------------------------------------------------------------------
// Hourly data
// ---------------------------------------------------------------------------

export interface HourlyData {
  /** ISO datetime string: "2026-06-06T00:00" */
  time: string;
  temperature: number;
  precipitation_probability: number;
  wind_speed: number;
  condition_code: string;
  icon: string;
  humidity: number;
  feels_like: number;
  wind_gust: number;
  uv_index: number;
  icon_path: string;
}

// ---------------------------------------------------------------------------
// Daily forecast
// ---------------------------------------------------------------------------

export interface DailyForecast {
  /** ISO date string: "2026-06-06" */
  date: string;
  temp_min: number;
  temp_max: number;
  /** Total precipitation in mm */
  precipitation_sum: number;
  /** ISO datetime string */
  sunrise: string;
  /** ISO datetime string */
  sunset: string;
  condition_code: string;
  icon: string;
  precipitation_probability: number;
  wind_max: number;
  icon_path: string;
}

// ---------------------------------------------------------------------------
// AI Summary (Pro+ plan only — absent on free tier)
// ---------------------------------------------------------------------------

export interface AISummary {
  summary: string;
  lang: string;
  agronomic_notes: string[];
  risk_flags: string[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Client geo metadata (always present)
// ---------------------------------------------------------------------------

export interface ClientGeo {
  /** ISO 3166-1 alpha-2 country code. "ZZ" means unknown/sandbox */
  country: string;
  ip_hash: string;
}

// ---------------------------------------------------------------------------
// Top-level weather response
// ---------------------------------------------------------------------------

export interface WeatherResponse {
  location: LocationData;
  current: CurrentCondition;
  /** 24 × days entries; always covers the full requested period */
  hourly: HourlyData[];
  daily: DailyForecast[];
  /** Absent on free plan or when ai=false. Normalised to null by RTK transformResponse */
  ai_summary: AISummary | null;
  client_geo: ClientGeo;
}

// ---------------------------------------------------------------------------
// Tree analysis
// ---------------------------------------------------------------------------

export interface TreeHealth {
  healthy: number;
  needs_care: number;
  needs_replacement: number;
}

export interface CvDebug {
  orig_resolution: string;
  work_resolution: string;
  canopy_px: number;
  peaks_detected: number;
  after_area_filter: number;
}

export interface TreeAnalysisResult {
  analysis_id: string;
  timestamp: string;
  farmer_id?: string;
  county?: string;
  location?: string;
  land_acres?: number;
  total_tree_count: number;
  tree_density_per_acre?: number;
  confidence_score: number;
  canopy_coverage_pct: number;
  tree_health: TreeHealth;
  low_confidence: boolean;
  tree_species_guess?: string;
  observations: string[];
  recommendations: string[];
  original_image_url: string;
  overlay_image_url: string;
  cv_debug: CvDebug;
}

export interface TreeAnalysisListResponse {
  analyses: TreeAnalysisResult[];
  next_cursor?: string;
  total: number;
}

// ---------------------------------------------------------------------------
// Usage / quota
// ---------------------------------------------------------------------------

export type Plan = 'free' | 'pro' | 'scale';

export interface UsageResponse {
  plan: Plan;
  period: {
    start: string;
    end: string;
    requestCount: number;
    aiRequestCount: number;
  };
  limits: {
    requests: number;
    aiRequests: number;
    maxDays: number;
    webhooks: boolean;
    teamSeats: number;
    sms: boolean;
  };
  remaining: {
    requests: number;
    aiRequests: number;
  };
}

// ---------------------------------------------------------------------------
// API error envelope
// ---------------------------------------------------------------------------

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Response headers we track (from rate-limit and x- headers)
// ---------------------------------------------------------------------------

export interface WeatherResponseMeta {
  /** x-ai-allow: whether this key/plan supports AI summaries */
  aiAllow: boolean;
  /** x-ai-applied: whether AI was actually applied to this response */
  aiApplied: boolean;
  /** x-plan: plan tier from response header */
  plan: Plan | null;
  /** ratelimit-remaining */
  rateLimitRemaining: number | null;
  /** ratelimit-reset: seconds until window resets */
  rateLimitReset: number | null;
  /** Cache hit/miss from our proxy layer */
  cacheStatus: 'HIT' | 'MISS' | 'STALE' | null;
}

// ---------------------------------------------------------------------------
// Query parameter types
// ---------------------------------------------------------------------------

export interface WeatherQueryParams {
  lat: number;
  lon: number;
  days?: number;
  /** Whether to request AI summary (ignored by server if plan doesn't support it) */
  ai?: boolean;
  units?: 'metric' | 'imperial';
  lang?: string;
  /** Pass "auto" to detect location from request IP */
  ip?: 'auto';
}

/**
 * TreeAnalyzeParams is browser FormData.
 * Required fields: image (File), location (string, optional), county (string, optional)
 * The FormData type is the standard browser API — no wrapper needed.
 */
export type TreeAnalyzeParams = FormData;

export interface TreeListParams {
  limit?: number;
  cursor?: string;
}
