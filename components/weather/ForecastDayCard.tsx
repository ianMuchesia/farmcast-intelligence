'use client';

import { format, parseISO } from 'date-fns';
import { DailyForecast } from '@/types/weatherai';
import { getConditionDisplay } from '@/lib/condition-map';
import { Droplets, Wind } from 'lucide-react';

interface ForecastDayCardProps {
  day: DailyForecast;
  isToday: boolean;
}

export function ForecastDayCard({ day, isToday }: ForecastDayCardProps) {
  const condition = getConditionDisplay(day.condition_code);
  const Icon = condition.icon;

  let dateLabel = '';
  let dayNum = '';
  try {
    if (isToday) {
      dateLabel = 'TODAY';
      dayNum = format(parseISO(day.date), 'dd');
    } else {
      dateLabel = format(parseISO(day.date), 'EEE').toUpperCase();
      dayNum = format(parseISO(day.date), 'dd');
    }
  } catch (e) {
    dateLabel = day.date;
    dayNum = '';
  }

  return (
    <div
      className={`flex flex-col items-center gap-1.5 bg-bg-elevated border p-3 min-w-[76px] ${
        isToday ? 'border-primary border-l-2' : 'border-border'
      }`}
    >
      {/* Day label */}
      <div className="flex flex-col items-center leading-none">
        <span className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
          {dateLabel}
        </span>
        <span className="font-mono text-xs text-text-secondary">
          {dayNum}
        </span>
      </div>

      {/* Condition icon */}
      <Icon className="w-4 h-4 text-text-secondary" />

      {/* Temp range */}
      <div className="flex items-baseline gap-0.5">
        <span className="font-mono text-sm text-text-primary font-medium">
          {Math.round(day.temp_max)}°
        </span>
        <span className="font-mono text-xs text-text-tertiary">
          /{Math.round(day.temp_min)}°
        </span>
      </div>

      {/* Precipitation */}
      <div className="flex items-center gap-0.5 h-4">
        {day.precipitation_probability > 0 && (
          <>
            <Droplets className="w-2.5 h-2.5 text-tertiary" />
            <span className="font-mono text-[10px] text-tertiary">
              {day.precipitation_probability}%
            </span>
          </>
        )}
      </div>

      {/* Wind max */}
      <div className="flex items-center gap-0.5">
        <Wind className="w-2.5 h-2.5 text-text-tertiary" />
        <span className="font-mono text-[10px] text-text-tertiary">
          {Math.round(day.wind_max)}
        </span>
      </div>
    </div>
  );
}
