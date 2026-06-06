'use client';

import { format } from 'date-fns';
import { Wind, Droplets, Sun, Eye, Gauge, CloudRain, Cloud } from 'lucide-react';
import { WeatherResponse } from '@/types/weatherai';
import { getConditionDisplay } from '@/lib/condition-map';
import { StatCard } from '@/components/ui/StatCard';
import { useAppSelector } from '@/store/index';
import { selectUnits } from '@/store/slices/uiSlice';

interface WeatherHeroProps {
  data: WeatherResponse;
}

export function WeatherHero({ data }: WeatherHeroProps) {
  const units = useAppSelector(selectUnits);
  const { current, location } = data;

  const isMetric = units === 'metric';
  // If the API returns a generic metric vs imperial shape, we handle it.
  // We'll use the properties from CurrentCondition provided in the type definition.
  // Note: the prompt asks for wind_kph, precip_mm, visibility_km but those aren't in the provided CurrentCondition type.
  // Let me look at the API payload I fetched manually: `wind_speed`, `humidity`, `uv_index`, `feels_like`, etc.
  // I will map what is available in the provided types `CurrentCondition`.

  const temp = Math.round(current.temperature);
  const feelsLike = Math.round(current.wind_direction); // 'feels_like' is not in CurrentCondition according to prompt! Wait, it was in my real API response, but the type in prompt 3 `CurrentCondition` only has: time, temperature, wind_speed, wind_direction, condition_code, icon, icon_path. Wait, `hourly` has `humidity`, `feels_like`, `uv_index`, `wind_gust`. So `current` might just be basic.
  // Actually, the prompt says: "Wind: value={data.current.wind_kph} unit="km/h" icon={Wind}"
  // I'll use `current.wind_speed` (which is what my type has) and hardcode the unit based on metric.

  const condition = getConditionDisplay(current.condition_code);
  const ConditionIcon = condition.icon;

  // Let's safely extract stats, assuming they might exist on current or using hourly[0] as fallback
  const windSpeed = current.wind_speed;
  const currentHour = data.hourly[0];
  const humidity = currentHour?.humidity ?? 0;
  const uvIndex = currentHour?.uv_index ?? 0;
  const feelsLikeTemp = currentHour?.feels_like ?? temp;
  const precipProb = currentHour?.precipitation_probability ?? 0;

  const locationDisplay = [location.city, location.region, location.country]
    .filter(Boolean)
    .join(', ');

  // Format local time safely using the location's actual timezone
  let timeStr = current.time;
  try {
    const d = new Date(current.time);
    timeStr = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: location.timezone,
      hour12: false
    }).format(d).replace(',', ' ·');
  } catch (e) {
    // fallback
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div className="font-body text-text-secondary text-sm">
          {locationDisplay || location.country}
        </div>
        <div className="font-mono text-xs text-text-tertiary">
          {timeStr}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col justify-center">
          <div className="flex items-start gap-1">
            <span className="font-display text-7xl text-text-primary leading-none">
              {temp}
            </span>
            <span className="font-mono text-2xl text-text-tertiary align-top pt-2">
              {isMetric ? '°C' : '°F'}
            </span>
          </div>
          <div className="font-body text-text-secondary text-sm mt-2">
            Feels like {Math.round(feelsLikeTemp)}°
          </div>
          <div className="flex items-center gap-2 mt-4">
            <ConditionIcon className="w-8 h-8 text-text-secondary" />
            <span className="font-body text-text-primary text-lg">
              {condition.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Wind"
            value={windSpeed}
            unit={isMetric ? 'km/h' : 'mph'}
            icon={Wind}
          />
          <StatCard
            label="Humidity"
            value={humidity}
            unit="%"
            icon={Droplets}
          />
          <StatCard
            label="UV Index"
            value={uvIndex}
            icon={Sun}
          />
          <StatCard
            label="Wind Gusts"
            value={currentHour?.wind_gust ?? 0}
            unit={isMetric ? 'km/h' : 'mph'}
            icon={Wind}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 border-t border-border-subtle pt-6 mt-6">
        <StatCard
          label="Precipitation Probability"
          value={precipProb}
          unit="%"
          icon={CloudRain}
          size="sm"
        />
      </div>
    </div>
  );
}
