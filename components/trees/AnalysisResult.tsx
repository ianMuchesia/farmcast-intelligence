'use client';

import { TreeAnalysisResult } from '@/types/weatherai';
import { TreeHealthBar } from './TreeHealthBar';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Trees, ShieldAlert, Percent, Map } from 'lucide-react';

interface AnalysisResultProps {
  result: TreeAnalysisResult;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="bg-bg-elevated border border-border rounded-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <h3 className="font-mono text-sm text-text-primary uppercase tracking-wider">
          Analysis Report
        </h3>
        {result.low_confidence && (
          <Badge variant="warning" size="sm">
            LOW CONFIDENCE
          </Badge>
        )}
      </div>

      {/* Images Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <div className="font-mono text-xs text-text-tertiary">ORIGINAL</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.original_image_url}
            alt="Original"
            className="w-full rounded border border-border"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="font-mono text-xs text-text-tertiary">ANNOTATED</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.overlay_image_url}
            alt="Overlay"
            className="w-full rounded border border-border"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tree Count"
          value={result.total_tree_count}
          icon={Trees}
          size="sm"
        />
        <StatCard
          label="Confidence"
          value={Math.round(result.confidence_score * 100)}
          unit="%"
          icon={ShieldAlert}
          size="sm"
        />
        <StatCard
          label="Canopy"
          value={Math.round(result.canopy_coverage_pct * 100) / 100}
          unit="%"
          icon={Percent}
          size="sm"
        />
        <StatCard
          label="Density"
          value={result.tree_density_per_acre ?? 0}
          unit="/acre"
          icon={Map}
          size="sm"
        />
      </div>

      {/* Health Bar */}
      <div className="mb-8 border border-border rounded-md p-4 bg-bg">
        <h4 className="font-mono text-xs text-text-secondary mb-3">HEALTH BREAKDOWN</h4>
        <TreeHealthBar health={result.tree_health} totalCount={result.total_tree_count} />
      </div>

      {/* Text Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border-subtle pt-6">
        <div>
          <h4 className="font-mono text-xs text-text-secondary mb-3">OBSERVATIONS</h4>
          {result.tree_species_guess && (
            <p className="font-body text-sm text-text-primary mb-3">
              <span className="text-text-tertiary">Species Guess: </span>
              <span className="font-medium">{result.tree_species_guess}</span>
            </p>
          )}
          <ul className="space-y-2">
            {result.observations?.map((obs, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0 font-bold">•</span>
                <span className="font-body text-sm text-text-primary">{obs}</span>
              </li>
            ))}
            {(!result.observations || result.observations.length === 0) && (
              <span className="font-body text-sm text-text-tertiary">No observations recorded.</span>
            )}
          </ul>
        </div>
        
        <div>
          <h4 className="font-mono text-xs text-text-secondary mb-3">RECOMMENDATIONS</h4>
          <ul className="space-y-2">
            {result.recommendations?.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-secondary mt-0.5 flex-shrink-0 font-bold">•</span>
                <span className="font-body text-sm text-text-primary">{rec}</span>
              </li>
            ))}
            {(!result.recommendations || result.recommendations.length === 0) && (
              <span className="font-body text-sm text-text-tertiary">No recommendations available.</span>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
