'use client';

import { useAppSelector, useAppDispatch } from '@/store';
import { selectLanguage, setLanguage } from '@/store/slices/uiSlice';

export function LanguageToggle() {
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectLanguage);

  return (
    <div className="flex border border-border rounded-sm overflow-hidden">
      <button
        onClick={() => dispatch(setLanguage('en'))}
        className={`px-3 py-1 font-mono text-sm transition-colors ${
          language === 'en'
            ? 'bg-primary text-text-inverse'
            : 'bg-bg-elevated text-text-secondary hover:bg-bg-sunken'
        }`}
      >
        EN
      </button>
      <div className="w-px bg-border" />
      <button
        onClick={() => dispatch(setLanguage('sw'))}
        className={`px-3 py-1 font-mono text-sm transition-colors ${
          language === 'sw'
            ? 'bg-primary text-text-inverse'
            : 'bg-bg-elevated text-text-secondary hover:bg-bg-sunken'
        }`}
      >
        SW
      </button>
    </div>
  );
}
