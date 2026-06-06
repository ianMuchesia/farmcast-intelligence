'use client';

import { HourlyData } from '@/types/weatherai';
import { getConditionDisplay } from '@/lib/condition-map';

interface HourlyChartProps {
  hours: HourlyData[];
}

export function HourlyChart({ hours }: HourlyChartProps) {
  if (!hours || hours.length === 0) return null;

  // Filter next 24 hours
  const nowUnix = Date.now();
  const next24 = hours
    .filter((h) => new Date(h.time).getTime() >= nowUnix - 3600000)
    .slice(0, 24);

  if (next24.length === 0) return null;

  const minTemp = Math.min(...next24.map((h) => h.temperature));
  const maxTemp = Math.max(...next24.map((h) => h.temperature));
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div className="bg-bg-elevated border border-border p-4">
      <h3 className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-4">
        HOURLY TEMPERATURE
      </h3>
      <div className="overflow-x-auto">
        <div className="flex gap-0 items-end min-w-max border-b border-border-subtle pb-1">
          {next24.map((hour, idx) => {
            const date = new Date(hour.time);
            const timeLabel = `${date.getHours().toString().padStart(2, '0')}:00`;
            const height = Math.max(8, 8 + ((hour.temperature - minTemp) / tempRange) * 56);

            const condition = getConditionDisplay(hour.condition_code);
            let barColor = 'bg-bg-sunken';
            switch (condition.severity) {
              case 'clear':  barColor = 'bg-secondary'; break;
              case 'cloudy': barColor = 'bg-tertiary';  break;
              case 'rain':   barColor = 'bg-primary';   break;
              case 'storm':  barColor = 'bg-accent';    break;
            }

            const isNow = idx === 0;

            return (
              <div
                key={hour.time}
                className={`flex flex-col items-center w-11 flex-shrink-0 border-r border-border-subtle last:border-0 px-1 ${
                  isNow ? 'bg-bg-sunken' : ''
                }`}
              >
                <span className="font-mono text-[10px] text-text-tertiary mb-2 leading-none">
                  {timeLabel}
                </span>
                <div
                  className={`w-3 ${barColor}`}
                  style={{ height: `${height}px` }}
                />
                <span className="font-mono text-[10px] text-text-primary mt-1 font-medium leading-none">
                  {Math.round(hour.temperature)}°
                </span>
                <span className="font-mono text-[10px] h-3 mt-0.5 leading-none">
                  {hour.precipitation_probability > 0 ? (
                    <span className="text-tertiary">{hour.precipitation_probability}%</span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {(['clear', 'cloudy', 'rain', 'storm'] as const).map((sev) => {
          const colorMap = {
            clear: 'bg-secondary',
            cloudy: 'bg-tertiary',
            rain: 'bg-primary',
            storm: 'bg-accent',
          };
          return (
            <div key={sev} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 ${colorMap[sev]}`} />
              <span className="font-mono text-[10px] text-text-tertiary uppercase">
                {sev}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
