'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { selectSearchHistory, setCurrentLocation, addToHistory } from '@/store/slices/locationSlice';
import type { RootState } from '@/store/index';

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
  name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export function LocationSearch() {
  const dispatch = useAppDispatch();
  const searchHistory = useAppSelector(selectSearchHistory);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const searchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setIsOpen(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Geocoding error', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: GeocodeResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const name = result.name || result.display_name.split(',')[0];
    
    dispatch(setCurrentLocation({ lat, lon, name, detectedFromIP: false }));
    dispatch(addToHistory({ lat, lon, name }));
    
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectHistory = (item: { lat: number; lon: number; name: string }) => {
    dispatch(setCurrentLocation({ lat: item.lat, lon: item.lon, name: item.name, detectedFromIP: false }));
    dispatch(addToHistory(item));
  };

  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={searchLocation} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location (e.g. Nairobi, Kenya)"
          className="w-full bg-bg-sunken border border-border rounded-sm pl-10 pr-4 py-2 font-body text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
        <button type="submit" className="hidden" aria-label="Submit search"></button>
      </form>

      {isOpen && (
        <div className="absolute top-full left-0 w-full z-50 mt-1 bg-bg-elevated border border-border rounded-sm shadow-lg overflow-hidden">
          {isSearching ? (
            <div className="px-3 py-2 text-sm text-text-secondary font-body">Searching...</div>
          ) : results.length > 0 ? (
            results.map((result, idx) => {
              const secondary = [result.address.state, result.address.country].filter(Boolean).join(', ');
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(result)}
                  className="px-3 py-2 hover:bg-bg-sunken cursor-pointer border-b border-border-subtle last:border-0"
                >
                  <div className="font-body text-sm text-text-primary">
                    {result.name || result.display_name.split(',')[0]}
                  </div>
                  {secondary && (
                    <div className="text-text-tertiary text-xs font-body mt-0.5">
                      {secondary}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-text-secondary font-body">No results found</div>
          )}
        </div>
      )}

      {/* Backdrop for closing dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {searchHistory.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {searchHistory.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectHistory(item)}
              className="bg-bg-elevated border border-border rounded-sm px-2 py-1 font-mono text-xs text-text-secondary cursor-pointer hover:border-primary hover:text-text-primary transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
