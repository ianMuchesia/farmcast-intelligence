/**
 * store/slices/uiSlice.ts
 *
 * UI preferences: theme, language, units, active tab.
 * These are persisted to localStorage via redux-persist (configured in store/index.ts).
 *
 * toggleTheme mutates the DOM directly because Tailwind's dark mode uses the
 * `class` strategy — the class must be on <html> immediately, not after React
 * re-renders, to avoid a flash of wrong theme.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'sw';
export type Units = 'metric' | 'imperial';
export type ActiveTab = 'weather' | 'farm-analysis';

export interface UiState {
  theme: Theme;
  language: Language;
  units: Units;
  activeTab: ActiveTab;
}

const initialState: UiState = {
  theme: 'dark',
  language: 'en',
  units: 'metric',
  activeTab: 'weather',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      const newTheme: Theme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = newTheme;

      // Side-effect: synchronise Tailwind dark class and localStorage.
      // This runs in the reducer which is normally discouraged, but it is
      // the only reliable way to avoid theme flash before hydration completes.
      // RTK uses Immer so this mutation is safe.
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('farmcast-theme', newTheme);
      }
    },

    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },

    setUnits(state, action: PayloadAction<Units>) {
      state.units = action.payload;
    },

    setActiveTab(state, action: PayloadAction<ActiveTab>) {
      state.activeTab = action.payload;
    },
  },
});

export const { toggleTheme, setLanguage, setUnits, setActiveTab } =
  uiSlice.actions;

// Selectors
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectLanguage = (state: RootState) => state.ui.language;
export const selectUnits = (state: RootState) => state.ui.units;
export const selectActiveTab = (state: RootState) => state.ui.activeTab;

export default uiSlice.reducer;
