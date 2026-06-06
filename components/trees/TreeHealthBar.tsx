'use client';

import { TreeHealth } from '@/types/weatherai';

interface TreeHealthBarProps {
  health: TreeHealth;
  totalCount: number;
}

export function TreeHealthBar({ health, totalCount }: TreeHealthBarProps) {
  if (totalCount === 0) return null;

  const healthyPct = (health.healthy / totalCount) * 100;
  const carePct = (health.needs_care / totalCount) * 100;
  const replacePct = (health.needs_replacement / totalCount) * 100;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="w-full bg-bg-sunken h-4 rounded overflow-hidden flex">
        <div className="bg-primary h-full transition-all" style={{ width: `${healthyPct}%` }} />
        <div className="bg-secondary h-full transition-all" style={{ width: `${carePct}%` }} />
        <div className="bg-accent h-full transition-all" style={{ width: `${replacePct}%` }} />
      </div>
      <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span>Healthy ({health.healthy})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-secondary" />
          <span>Needs Care ({health.needs_care})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
          <span>Replace ({health.needs_replacement})</span>
        </div>
      </div>
    </div>
  );
}
