/**
 * store/index.ts
 *
 * Store configuration with redux-persist.
 *
 * Persist strategy:
 *   whitelist: location (last known position survives reload) + ui (theme/lang/units)
 *   blacklist: quota (always re-fetch on load) + weatherApi (RTK manages its own cache)
 *
 * Middleware ordering: quotaGuard → weatherApi.middleware → default middleware
 * quotaGuard must come first so it intercepts weather actions before RTK processes them.
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
// redux-persist uses localStorage which doesn't exist on the server.
// We provide a noop storage for SSR — the client rehydrates from localStorage
// on first render via PersistGate, so no data is lost.
const createNoopStorage = () => ({
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, value: string) => Promise.resolve(value),
  removeItem: (_key: string) => Promise.resolve(),
});

const storage =
  typeof window !== 'undefined'
    ? require('redux-persist/lib/storage').default
    : createNoopStorage();
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import locationReducer from '@/store/slices/locationSlice';
import quotaReducer from '@/store/slices/quotaSlice';
import uiReducer from '@/store/slices/uiSlice';
import { weatherApi } from '@/store/api/weatherApi';
import { quotaGuard } from '@/store/middleware/quotaGuard';

// ---------------------------------------------------------------------------
// Persist configuration
// ---------------------------------------------------------------------------

const persistConfig = {
  key: 'farmcast-root',
  storage,
  whitelist: ['location', 'ui'],
  // quota and weatherApi are intentionally excluded:
  // - quota: always re-fetched on load to get current billing state
  // - weatherApi: RTK manages its own in-memory cache; persisting it would serve
  //   stale data that bypasses our server-side TTL cache
};

const rootReducer = combineReducers({
  location: locationReducer,
  quota: quotaReducer,
  ui: uiReducer,
  [weatherApi.reducerPath]: weatherApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist dispatches these internal actions with non-serialisable
        // values (functions, Promises). This is expected and safe to ignore.
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      // quotaGuard before weatherApi so it can intercept pending weather actions
      .prepend(quotaGuard)
      .concat(weatherApi.middleware),
});

export const persistor = persistStore(store);

// ---------------------------------------------------------------------------
// TypeScript helpers
// ---------------------------------------------------------------------------

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
