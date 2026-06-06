/**
 * store/middleware/quotaGuard.ts
 *
 * Cross-cutting RTK middleware that intercepts getWeather query initiations
 * and strips the `ai` parameter when the quota slice says AI is disabled.
 *
 * This is the correct architectural pattern for cross-cutting concerns:
 * - Components dispatch getWeather(params) as normal
 * - The middleware silently enforces the quota policy before the request fires
 * - No component needs to know about quota state to make correct requests
 *
 * Middleware ordering matters: quotaGuard must be BEFORE weatherApi.middleware
 * in the store configuration so it can intercept actions before RTK Query
 * processes them. See store/index.ts.
 */

import type { Middleware } from '@reduxjs/toolkit';
import { weatherApi } from '@/store/api/weatherApi';
import type { RootState } from '@/store';

export const quotaGuard: Middleware<
  Record<string, never>, // no custom dispatch signature
  RootState
> = (storeAPI) => (next) => (action) => {
  // Only intercept pending getWeather initiations — not other lifecycle actions
  if (
    weatherApi.endpoints.getWeather.matchPending(
      action as Parameters<typeof weatherApi.endpoints.getWeather.matchPending>[0]
    )
  ) {
    const state = storeAPI.getState();
    const aiEnabled = state.quota.aiEnabled;

    if (!aiEnabled) {
      // The action's originalArgs carries the query params.
      // RTK Query uses the args to deduplicate and cache — mutating here means
      // the upstream call goes out with ai=false, and the cache key reflects that.
      const typedAction = action as {
        meta?: { arg?: { originalArgs?: Record<string, unknown> } };
      };

      if (typedAction.meta?.arg?.originalArgs) {
        typedAction.meta.arg.originalArgs['ai'] = false;
        console.debug(
          '[QuotaGuard] AI disabled — stripping ai param from getWeather request'
        );
      }
    }
  }

  return next(action);
};
