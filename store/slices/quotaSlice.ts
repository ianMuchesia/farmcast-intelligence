/**
 * store/slices/quotaSlice.ts
 *
 * Tracks API quota state from /api/usage responses.
 * The aiEnabled flag is the primary signal driving the quotaGuard middleware.
 *
 * Threshold: auto-disable AI when < 10% of AI quota remains.
 * The 10% threshold is based on WeatherAI's documented billing model —
 * once quota is exhausted, AI requests return 402, not 200 with degraded output.
 */

import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import type { UsageResponse, Plan } from '@/types/weatherai';

const AI_DISABLE_THRESHOLD = 0.10; // disable AI when < 10% remaining

export interface QuotaRequests {
  used: number;
  limit: number;
  remaining: number;
}

export interface QuotaState {
  requests: QuotaRequests | null;
  aiRequests: QuotaRequests | null;
  plan: Plan | null;
  /**
   * Becomes false automatically when AI quota < 10% (via setQuota).
   * Can also be toggled manually via setAiEnabled for user override.
   */
  aiEnabled: boolean;
  lastFetched: number | null;
  isLoading: boolean;
}

const initialState: QuotaState = {
  requests: null,
  aiRequests: null,
  plan: null,
  aiEnabled: true,
  lastFetched: null,
  isLoading: false,
};

export const quotaSlice = createSlice({
  name: 'quota',
  initialState,
  reducers: {
    setQuota(state, action: PayloadAction<UsageResponse>) {
      const { plan, limits, remaining, period } = action.payload;

      state.plan = plan;

      // Map the actual API shape to our normalised QuotaRequests shape
      state.requests = {
        used: period.requestCount,
        limit: limits.requests,
        remaining: remaining.requests,
      };

      state.aiRequests = {
        used: period.aiRequestCount,
        limit: limits.aiRequests,
        remaining: remaining.aiRequests,
      };

      // Auto-derive aiEnabled — only auto-disable, never auto-re-enable
      // (re-enabling requires explicit user action or a new billing period)
      const aiRatio =
        limits.aiRequests > 0
          ? remaining.aiRequests / limits.aiRequests
          : 0;

      if (aiRatio < AI_DISABLE_THRESHOLD) {
        state.aiEnabled = false;
      }

      state.lastFetched = Date.now();
    },

    setAiEnabled(state, action: PayloadAction<boolean>) {
      state.aiEnabled = action.payload;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setQuota, setAiEnabled, setLoading } = quotaSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectQuotaRequests = (state: RootState) =>
  state.quota.requests;
export const selectAiRequests = (state: RootState) =>
  state.quota.aiRequests;
export const selectPlan = (state: RootState) => state.quota.plan;
export const selectAiEnabled = (state: RootState) => state.quota.aiEnabled;
export const selectQuotaLastFetched = (state: RootState) =>
  state.quota.lastFetched;
export const selectQuotaIsLoading = (state: RootState) =>
  state.quota.isLoading;

/**
 * Derived selector: computes whether AI should be enabled based on current quota.
 * Separate from state.quota.aiEnabled so components can read the "should be" state
 * independently of the stored flag (useful for showing the reason in the UI).
 */
export const selectAiShouldBeEnabled = createSelector(
  selectAiRequests,
  (aiRequests): boolean => {
    if (!aiRequests) return true; // default optimistic until quota loads
    if (aiRequests.limit === 0) return false;
    return aiRequests.remaining / aiRequests.limit >= AI_DISABLE_THRESHOLD;
  }
);

export default quotaSlice.reducer;
