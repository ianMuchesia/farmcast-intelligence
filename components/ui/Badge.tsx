import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

export function Badge({ variant, size = 'md', children }: BadgeProps) {
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-primary text-text-inverse';
      break;
    case 'secondary':
      variantClasses = 'bg-secondary text-text-inverse';
      break;
    case 'tertiary':
      variantClasses = 'bg-tertiary text-text-inverse';
      break;
    case 'success':
      variantClasses = 'bg-success text-text-inverse';
      break;
    case 'warning':
      variantClasses = 'bg-warning text-text-inverse';
      break;
    case 'danger':
      variantClasses = 'bg-danger text-text-inverse';
      break;
    case 'neutral':
      variantClasses = 'bg-bg-sunken text-text-secondary border border-border';
      break;
  }

  const sizeClasses =
    size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-block font-mono rounded-sm ${variantClasses} ${sizeClasses}`}
    >
      {children}
    </span>
  );
}
