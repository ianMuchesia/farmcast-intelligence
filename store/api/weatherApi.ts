/**
 * store/api/weatherApi.ts
 *
 * RTK Query API slice. All requests go to our internal Next.js proxy routes (/api/*)
 * which add the Authorization header server-side. The external API key never reaches
 * the browser.
 *
 * baseUrl: '/api' — relative so it works in both dev (localhost:3000) and production
 * without needing NEXT_PUBLIC_APP_URL for client-side RTK Query calls.
 *
 * keepUnusedDataFor values are deliberately aligned with our server-side cache TTLs
 * so the client and server caches expire in sync.
 */

// RTK Query's `params` option accepts this shape — we produce it by spreading
// our typed param objects so we keep strict typing at the call site.
type QueryParams = Record<string, string | number | boolean | undefined>;

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  WeatherResponse,
  WeatherQueryParams,
  UsageResponse,
  TreeAnalysisResult,
  TreeAnalysisListResponse,
  TreeListParams,
  AISummary,
} from '@/types/weatherai';

// Normalised shape guaranteed to components — ai_summary is never undefined
export interface NormalisedWeatherResponse extends Omit<WeatherResponse, 'ai_summary'> {
  ai_summary: AISummary | null;
}

export const weatherApi = createApi({
  reducerPath: 'weatherApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Weather', 'Usage', 'TreeAnalyses'],

  endpoints: (builder) => ({
    // -----------------------------------------------------------------------
    // GET /api/weather
    // -----------------------------------------------------------------------
    getWeather: builder.query<NormalisedWeatherResponse, WeatherQueryParams>({
      query: (params) => ({
        url: '/weather',
        // Spread into a plain record — preserves strict typing at call sites while
        // satisfying RTK Query's loose params type
        params: { ...params } as QueryParams,
      }),

      // Normalise ai_summary so components never need to guard against undefined.
      // The API omits the key entirely when AI is disabled or not applicable.
      transformResponse: (raw: WeatherResponse): NormalisedWeatherResponse => ({
        ...raw,
        ai_summary: raw.ai_summary ?? null,
      }),

      providesTags: (_result, _error, params) => [
        'Weather',
        { type: 'Weather', id: `${params.lat}-${params.lon}` },
      ],

      // 10 minutes — matches our server-side LRU cache TTL
      keepUnusedDataFor: 600,
    }),

    // -----------------------------------------------------------------------
    // GET /api/usage
    // -----------------------------------------------------------------------
    getUsage: builder.query<UsageResponse, void>({
      query: () => '/usage',
      providesTags: ['Usage'],

      // 5 minutes — shorter than weather; quota state matters more for UX accuracy
      keepUnusedDataFor: 300,
    }),

    // -----------------------------------------------------------------------
    // POST /api/trees/analyze
    // -----------------------------------------------------------------------
    analyzeTreeImage: builder.mutation<TreeAnalysisResult, FormData>({
      query: (formData) => ({
        url: '/trees',
        method: 'POST',
        body: formData,
        // Explicitly omit Content-Type so the browser sets the multipart boundary.
        // If we set it ourselves, the boundary token is missing and the server
        // cannot parse the multipart body.
        headers: {
          // Intentional: do NOT set Content-Type here
        },
        formData: true,
      }),

      // Invalidate the list so AnalysisHistory reflects the new entry immediately
      invalidatesTags: ['TreeAnalyses'],
    }),

    // -----------------------------------------------------------------------
    // GET /api/trees/analyses
    // -----------------------------------------------------------------------
    getTreeAnalyses: builder.query<TreeAnalysisListResponse, TreeListParams>({
      query: (params) => ({
        url: '/trees',
        params: { ...params } as QueryParams,
      }),
      providesTags: ['TreeAnalyses'],

      // 0 = never cache on client; user expects their latest uploads immediately
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useGetWeatherQuery,
  useGetUsageQuery,
  useAnalyzeTreeImageMutation,
  useGetTreeAnalysesQuery,
} = weatherApi;
