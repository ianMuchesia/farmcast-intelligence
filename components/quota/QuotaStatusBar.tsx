'use client';

import { useAppSelector } from '@/store/index';
import { selectQuotaRequests, selectAiRequests, selectPlan, selectAiEnabled } from '@/store/slices/quotaSlice';
import { Badge } from '@/components/ui/Badge';
import { QuotaBarSkeleton } from '../weather/WeatherSkeletons';

export function QuotaStatusBar() {
  const requests = useAppSelector(selectQuotaRequests);
  const aiRequests = useAppSelector(selectAiRequests);
  const plan = useAppSelector(selectPlan);
  const aiEnabled = useAppSelector(selectAiEnabled);

  if (!requests || !aiRequests || !plan) {
    return <QuotaBarSkeleton />;
  }

  const reqPct = requests.limit > 0 ? (requests.used / requests.limit) * 100 : 0;
  const aiPct = aiRequests.limit > 0 ? (aiRequests.used / aiRequests.limit) * 100 : 0;

  let planVariant: 'neutral' | 'secondary' | 'primary' = 'neutral';
  if (plan === 'pro') planVariant = 'secondary';
  if (plan === 'scale') planVariant = 'primary';

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4 flex flex-col md:flex-row gap-6 md:items-center justify-between">
      {/* Left */}
      <div className="flex flex-col gap-1 items-start">
        <span className="font-mono text-xs text-text-tertiary">API QUOTA</span>
        <Badge variant={planVariant} size="sm">
          {plan.toUpperCase()} PLAN
        </Badge>
      </div>

      {/* Middle */}
      <div className="flex-1 flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        {/* Basic Requests */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-text-tertiary">REQUESTS</span>
          </div>
          <div className="w-full bg-bg-sunken h-2 rounded-sm overflow-hidden flex">
            <div 
              className="bg-primary h-full rounded-sm" 
              style={{ width: `${Math.min(100, Math.max(0, reqPct))}%` }}
            />
          </div>
          <span className="font-mono text-xs text-text-secondary">
            {requests.used.toLocaleString()} of {requests.limit.toLocaleString()} used
          </span>
        </div>

        {/* AI Requests */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-text-tertiary">AI REQUESTS</span>
          </div>
          <div className="w-full bg-bg-sunken h-2 rounded-sm overflow-hidden flex">
            <div 
              className="bg-secondary h-full rounded-sm" 
              style={{ width: `${Math.min(100, Math.max(0, aiPct))}%` }}
            />
          </div>
          <span className="font-mono text-xs text-text-secondary">
            {aiRequests.used.toLocaleString()} of {aiRequests.limit.toLocaleString()} used
            {!aiEnabled && (
              <span className="text-accent ml-2">(disabled — quota low)</span>
            )}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col gap-1 items-start md:items-end">
        <span className="font-mono text-xs text-text-tertiary">RESETS</span>
        <span className="font-mono text-sm text-text-primary">Monthly</span>
      </div>
    </div>
  );
}
