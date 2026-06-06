'use client';

import { AISummary } from '@/types/weatherai';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AISummarySkeleton } from './WeatherSkeletons';

interface AISummaryCardProps {
  summary: AISummary | null | undefined;
  isLoading: boolean;
  lang: string;
}

export function AISummaryCard({ summary, isLoading, lang }: AISummaryCardProps) {
  if (isLoading) {
    return <AISummarySkeleton />;
  }

  if (!summary) {
    return (
      <div className="bg-bg-elevated border border-border rounded-md p-6">
        <div className="text-text-tertiary font-body text-sm">
          AI summary unavailable
        </div>
        <div className="text-xs text-text-tertiary mt-1">
          AI quota may be exhausted or disabled
        </div>
      </div>
    );
  }

  const hasRiskFlags = summary.risk_flags && summary.risk_flags.length > 0;
  const hasRecommendations = summary.recommendations && summary.recommendations.length > 0;

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
            AI AGRONOMIC SUMMARY
          </span>
          <Badge variant="secondary" size="sm">
            {lang === 'sw' ? 'SWAHILI' : 'ENGLISH'}
          </Badge>
        </div>
        <span className="font-mono text-xs text-text-tertiary">
          Powered by Gemini
        </span>
      </div>

      <p className="font-body text-text-primary text-sm leading-relaxed">
        {summary.summary}
      </p>

      {(hasRiskFlags || hasRecommendations) && (
        <div className="border-t border-border-subtle pt-4 mt-4 space-y-4">
          {hasRiskFlags && (
            <div>
              <h4 className="font-mono text-xs text-text-tertiary mb-2">RISK FLAGS</h4>
              <ul className="space-y-2">
                {summary.risk_flags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-accent mt-1 flex-shrink-0" />
                    <span className="font-body text-sm text-text-primary">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasRecommendations && (
            <div>
              <h4 className="font-mono text-xs text-text-tertiary mb-2">RECOMMENDATIONS</h4>
              <ul className="space-y-2">
                {summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                    <span className="font-body text-sm text-text-primary">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
