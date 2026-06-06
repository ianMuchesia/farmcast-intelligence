'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectTheme, toggleTheme } from '@/store/slices/uiSlice';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  const ThemeIcon = theme === 'dark' ? Sun : Moon;

  return (
    <header className="sticky top-0 z-50 w-full bg-bg-elevated border-b border-border">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg text-text-primary">
            FARMCAST
          </span>
          <span className="text-text-tertiary">·</span>
          <span className="text-text-tertiary text-sm font-body hidden sm:inline-block">
            Intelligence Platform
          </span>
        </div>

        {/* Center: Nav links (Desktop only) */}
        <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className={`font-body text-sm transition-colors ${
              pathname === '/'
                ? 'text-text-primary border-b-2 border-primary pb-1 font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/farm-analysis"
            className={`font-body text-sm transition-colors ${
              pathname === '/farm-analysis'
                ? 'text-text-primary border-b-2 border-primary pb-1 font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Farm Analysis
          </Link>
        </nav>

        {/* Right: Toggles */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button
            onClick={() => dispatch(toggleTheme())}
            className="bg-bg-elevated border border-border rounded-sm p-2 hover:bg-bg-sunken transition-colors"
            aria-label="Toggle theme"
          >
            <ThemeIcon className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  );
}
