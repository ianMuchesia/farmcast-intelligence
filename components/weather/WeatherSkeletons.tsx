export function WeatherHeroSkeleton() {
  return (
    <div className="bg-bg-elevated border border-border rounded-md p-6 animate-pulse">
      {/* Top line */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-4 w-48 bg-bg-sunken rounded" />
        <div className="h-4 w-32 bg-bg-sunken rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left column */}
        <div className="flex flex-col justify-center">
          <div className="flex items-start gap-2 mb-2">
            <div className="h-20 w-32 bg-bg-sunken rounded" />
            <div className="h-8 w-8 bg-bg-sunken rounded mt-2" />
          </div>
          <div className="h-4 w-24 bg-bg-sunken rounded mb-4" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-bg-sunken rounded" />
            <div className="h-6 w-32 bg-bg-sunken rounded" />
          </div>
        </div>

        {/* Right column - 2x2 grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-bg-sunken rounded" />
          <div className="h-24 bg-bg-sunken rounded" />
          <div className="h-24 bg-bg-sunken rounded" />
          <div className="h-24 bg-bg-sunken rounded" />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4 border-t border-border-subtle pt-6">
        <div className="h-24 bg-bg-sunken rounded" />
        <div className="h-24 bg-bg-sunken rounded" />
        <div className="h-24 bg-bg-sunken rounded" />
      </div>
    </div>
  );
}

export function ForecastStripSkeleton() {
  return (
    <div>
      <div className="h-4 w-24 bg-bg-elevated rounded mb-3 animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="h-28 w-24 flex-shrink-0 bg-bg-elevated rounded animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function AISummarySkeleton() {
  return (
    <div className="bg-bg-elevated border border-border rounded-md p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-40 bg-bg-sunken rounded" />
        <div className="h-6 w-20 bg-bg-sunken rounded" />
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-4 w-full bg-bg-sunken rounded" />
        <div className="h-4 w-4/5 bg-bg-sunken rounded" />
        <div className="h-4 w-3/5 bg-bg-sunken rounded" />
      </div>
      <div className="border-t border-border-subtle pt-4 space-y-3">
        <div className="h-4 w-32 bg-bg-sunken rounded" />
        <div className="h-4 w-full bg-bg-sunken rounded" />
        <div className="h-4 w-5/6 bg-bg-sunken rounded" />
      </div>
    </div>
  );
}

export function QuotaBarSkeleton() {
  return <div className="h-20 w-full bg-bg-elevated rounded-md animate-pulse" />;
}
