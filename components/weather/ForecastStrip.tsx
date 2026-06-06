'use client';

import { DailyForecast } from '@/types/weatherai';
import { ForecastDayCard } from './ForecastDayCard';

interface ForecastStripProps {
  forecast: DailyForecast[];
}

export function ForecastStrip({ forecast }: ForecastStripProps) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div>
      <h3 className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-3">
        FORECAST
      </h3>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {forecast.map((day, idx) => (
            <ForecastDayCard key={day.date} day={day} isToday={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
