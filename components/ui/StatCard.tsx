import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md';
}

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  size = 'md',
}: StatCardProps) {
  const isSm = size === 'sm';

  return (
    <div
      className={`bg-bg-elevated border border-border rounded flex flex-col ${
        isSm ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="text-text-tertiary w-3.5 h-3.5" />}
        <span className="text-text-secondary font-body text-xs uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono text-text-primary ${
            isSm ? 'text-lg' : 'text-2xl'
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-text-tertiary font-mono text-sm">{unit}</span>
        )}
      </div>
    </div>
  );
}
