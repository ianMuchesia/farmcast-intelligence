'use client';

import { useState } from 'react';
import { AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

interface AlertBannerProps {
  variant: 'warning' | 'danger' | 'info';
  message: string;
  detail?: string;
  /** Unix ms timestamp — if set, appends "Resets at HH:MM" to the detail */
  resetAt?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AlertBanner({
  variant,
  message,
  detail,
  resetAt,
  dismissible = true,
  onDismiss,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  let containerClasses = '';
  let Icon = Info;

  switch (variant) {
    case 'warning':
      containerClasses = 'bg-secondary text-text-inverse';
      Icon = AlertTriangle;
      break;
    case 'danger':
      containerClasses = 'bg-accent text-text-inverse';
      Icon = AlertOctagon;
      break;
    case 'info':
      containerClasses = 'bg-tertiary text-text-inverse';
      Icon = Info;
      break;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  // Format reset time as HH:MM from Unix ms timestamp
  let resetDetail: string | undefined;
  if (resetAt) {
    const d = new Date(resetAt);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    resetDetail = `Resets at ${hh}:${mm}`;
  }

  const displayDetail = resetDetail ?? detail;

  return (
    // No border-radius — sits flush, instrument-panel style
    <div className={`w-full px-4 py-3 flex items-start sm:items-center gap-3 ${containerClasses}`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className="font-mono text-sm font-medium uppercase tracking-wide">{message}</span>
        {displayDetail && (
          <span className="font-body text-sm opacity-80">{displayDetail}</span>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
