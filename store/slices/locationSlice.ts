/**
 * store/slices/locationSlice.ts
 *
 * Manages the user's current location and their search history.
 * History is capped at 10 entries to avoid unbounded localStorage growth.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

const MAX_HISTORY = 10;

export interface LocationEntry {
  lat: number;
  lon: number;
  name: string;
  timestamp: number;
}

export interface CurrentLocation {
  lat: number;
  lon: number;
  name: string;
  detectedFromIP: boolean;
}

export interface LocationState {
  current: CurrentLocation | null;
  searchHistory: LocationEntry[];
  isDetecting: boolean;
  detectionError: string | null;
}

const initialState: LocationState = {
  current: null,
  searchHistory: [],
  isDetecting: false,
  detectionError: null,
};

export const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation(
      state,
      action: PayloadAction<{
        lat: number;
        lon: number;
        name: string;
        detectedFromIP: boolean;
      }>
    ) {
      state.current = action.payload;
    },

    addToHistory(
      state,
      action: PayloadAction<{ lat: number; lon: number; name: string }>
    ) {
      const { lat, lon, name } = action.payload;

      // Deduplicate by name (case-insensitive) — same farm shouldn't appear twice
      const deduped = state.searchHistory.filter(
        (entry) => entry.name.toLowerCase() !== name.toLowerCase()
      );

      const newEntry: LocationEntry = {
        lat,
        lon,
        name,
        timestamp: Date.now(),
      };

      // Prepend then trim to MAX_HISTORY
      state.searchHistory = [newEntry, ...deduped].slice(0, MAX_HISTORY);
    },

    clearHistory(state) {
      state.searchHistory = [];
    },

    setDetecting(state, action: PayloadAction<boolean>) {
      state.isDetecting = action.payload;
    },

    setDetectionError(state, action: PayloadAction<string | null>) {
      state.detectionError = action.payload;
    },
  },
});

export const {
  setCurrentLocation,
  addToHistory,
  clearHistory,
  setDetecting,
  setDetectionError,
} = locationSlice.actions;

// Selectors
export const selectCurrentLocation = (state: RootState) =>
  state.location.current;
export const selectSearchHistory = (state: RootState) =>
  state.location.searchHistory;
export const selectIsDetecting = (state: RootState) =>
  state.location.isDetecting;
export const selectDetectionError = (state: RootState) =>
  state.location.detectionError;

export default locationSlice.reducer;
