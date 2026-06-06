'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { selectLanguage, selectUnits } from '@/store/slices/uiSlice';
import { selectCurrentLocation, setCurrentLocation } from '@/store/slices/locationSlice';
import { selectAiEnabled, setQuota } from '@/store/slices/quotaSlice';
import { useGetWeatherQuery, useGetUsageQuery } from '@/store/api/weatherApi';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Navbar } from '@/components/layout/Navbar';
import { AlertBanner } from '@/components/layout/AlertBanner';
import { LocationSearch } from '@/components/search/LocationSearch';
import { WeatherHero } from '@/components/weather/WeatherHero';
import { AISummaryCard } from '@/components/weather/AISummaryCard';
import { ForecastStrip } from '@/components/weather/ForecastStrip';
import { HourlyChart } from '@/components/weather/HourlyChart';
import { QuotaStatusBar } from '@/components/quota/QuotaStatusBar';
import { 
  WeatherHeroSkeleton, 
  AISummarySkeleton, 
  ForecastStripSkeleton 
} from '@/components/weather/WeatherSkeletons';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  
  const location = useAppSelector(selectCurrentLocation);
  const language = useAppSelector(selectLanguage);
  const units = useAppSelector(selectUnits);
  const aiEnabled = useAppSelector(selectAiEnabled);

  // 1. Quota fetch
  const { data: usageData } = useGetUsageQuery();
  useEffect(() => {
    if (usageData) {
      dispatch(setQuota(usageData));
    }
  }, [usageData, dispatch]);

  // 2. Initial Location Auto-detection
  useEffect(() => {
    if (!location) {
      // First load: hit weather API with ip=auto directly
      fetch('/api/weather?ip=auto&days=7')
        .then(res => res.json())
        .then(data => {
          if (data && data.location) {
            dispatch(setCurrentLocation({
              lat: data.location.lat,
              lon: data.location.lon,
              name: data.location.city || data.location.region || data.location.country || 'Current Location',
              detectedFromIP: true,
            }));
          }
        })
        .catch(err => console.error('Failed to auto-detect location', err));
    }
  }, [location, dispatch]);

  // 3. RTK Query Weather Fetch
  // isFetching is true on EVERY in-flight request (including location changes).
  // isLoading is only true on the very first fetch — using it caused stale Nairobi
  // data to remain visible while Mombasa was loading.
  const { data: weatherData, isFetching, isError } = useGetWeatherQuery(
    {
      lat: location?.lat ?? 0,
      lon: location?.lon ?? 0,
      days: 7,
      ai: aiEnabled,
      lang: language,
      units: units,
    },
    { skip: !location }
  );

  const showSkeletons = !location || isFetching;

  return (
    <>
      <Navbar />
      <PageWrapper className="space-y-6">
        
        {/* Alerts */}
        {!aiEnabled && (
          <AlertBanner 
            variant="warning"
            message="AI summaries disabled"
            detail="Your AI quota is below 10%. Summaries have been automatically disabled to preserve your allocation."
            dismissible={false}
          />
        )}
        
        {isError && (
          <AlertBanner
            variant="danger"
            message="Weather data unavailable"
            detail="Showing last known data if available."
          />
        )}

        {/* Search */}
        <LocationSearch />

        {/* Content */}
        {showSkeletons && (
          <>
            <WeatherHeroSkeleton />
            <AISummarySkeleton />
            <ForecastStripSkeleton />
          </>
        )}

        {weatherData && !isFetching && (
          <>
            <WeatherHero data={weatherData} />
            <AISummaryCard
              summary={weatherData.ai_summary}
              isLoading={false}
              lang={language}
            />
            <ForecastStrip
              forecast={weatherData.daily}
            />
            <HourlyChart
              hours={weatherData.hourly}
            />
          </>
        )}

        {/* Quota */}
        <QuotaStatusBar />

      </PageWrapper>
    </>
  );
}
