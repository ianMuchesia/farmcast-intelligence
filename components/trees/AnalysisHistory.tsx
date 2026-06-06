'use client';

import { useState } from 'react';
import { useGetTreeAnalysesQuery } from '@/store/api/weatherApi';
import { format, parseISO } from 'date-fns';
import { Trees, ChevronDown, ChevronUp } from 'lucide-react';
import { AnalysisResult } from './AnalysisResult';

export function AnalysisHistory() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, isFetching } = useGetTreeAnalysesQuery({ limit: 10, cursor });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 w-full bg-bg-elevated rounded animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-bg-elevated border border-border rounded-md p-6 text-center">
        <p className="font-body text-sm text-text-secondary">Failed to load analysis history.</p>
      </div>
    );
  }

  const analyses = data?.analyses || [];

  if (analyses.length === 0) {
    return (
      <div className="bg-bg-elevated border border-border rounded-md p-10 flex flex-col items-center justify-center text-center">
        <Trees className="w-12 h-12 text-text-tertiary mb-3" />
        <h3 className="font-body text-lg text-text-primary mb-1">No past analyses</h3>
        <p className="font-body text-sm text-text-secondary max-w-sm">
          Upload an image above to get started with farm tree intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-2">
        HISTORY
      </h3>
      
      <div className="space-y-3">
        {analyses.map((result) => {
          const isExpanded = expandedId === result.analysis_id;
          let dateStr = result.timestamp;
          try {
            dateStr = format(parseISO(result.timestamp), "MMM dd, yyyy · HH:mm");
          } catch(e) {}

          const meta = [result.county, result.location].filter(Boolean).join(', ');

          return (
            <div key={result.analysis_id} className="flex flex-col gap-2">
              {/* Compact Card */}
              <div 
                className={`bg-bg-elevated border border-border rounded-md p-4 flex items-center justify-between cursor-pointer transition-colors hover:border-primary ${isExpanded ? 'border-primary shadow-sm' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : result.analysis_id)}
              >
                <div className="flex flex-col gap-1">
                  <div className="font-mono text-sm text-text-primary">
                    {dateStr}
                  </div>
                  {meta && (
                    <div className="font-body text-xs text-text-tertiary">
                      {meta}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <span className="font-mono text-xs text-text-secondary">Trees</span>
                    <span className="font-mono text-sm text-text-primary">{result.total_tree_count}</span>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <span className="font-mono text-xs text-text-secondary">Confidence</span>
                    <span className="font-mono text-sm text-text-primary">{Math.round(result.confidence_score * 100)}%</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-tertiary" />
                  )}
                </div>
              </div>

              {/* Expanded Inline Result */}
              {isExpanded && (
                <div className="ml-0 sm:ml-4 border-l-2 border-primary pl-0 sm:pl-4 mt-2 mb-2">
                  <AnalysisResult result={result} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data?.next_cursor && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setCursor(data.next_cursor)}
            disabled={isFetching}
            className={`px-4 py-2 bg-bg-elevated border border-border rounded-sm font-mono text-sm transition-colors ${
              isFetching ? 'text-text-tertiary cursor-not-allowed' : 'text-text-primary hover:bg-bg-sunken'
            }`}
          >
            {isFetching ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
