'use client';

import { useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Navbar } from '@/components/layout/Navbar';
import { ImageUploader } from '@/components/trees/ImageUploader';
import { AnalysisResult } from '@/components/trees/AnalysisResult';
import { AnalysisHistory } from '@/components/trees/AnalysisHistory';
import { Badge } from '@/components/ui/Badge';
import { TreeAnalysisResult } from '@/types/weatherai';
import { useGetUsageQuery } from '@/store/api/weatherApi';

export default function FarmAnalysisPage() {
  const [latestResult, setLatestResult] = useState<TreeAnalysisResult | null>(null);
  
  // Usage quota badge showing analyses used/remaining 
  // We use the usage API to grab AI requests since tree analysis uses AI.
  const { data: usageData } = useGetUsageQuery();
  const aiQuota = usageData?.remaining?.aiRequests;
  const aiLimit = usageData?.limits?.aiRequests;

  return (
    <>
      <Navbar />
      <PageWrapper className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-text-primary mb-2">
              Farm Tree Intelligence
            </h1>
            <p className="font-body text-text-secondary text-sm max-w-2xl">
              Upload drone imagery of your farm to automatically detect trees, 
              estimate canopy coverage, and assess overall orchard health using our computer vision models.
            </p>
          </div>
          {aiLimit !== undefined && aiQuota !== undefined && (
            <div className="flex-shrink-0 mt-2 sm:mt-0">
              <Badge variant="secondary" size="md">
                {aiLimit - aiQuota} / {aiLimit} USED
              </Badge>
            </div>
          )}
        </div>

        {/* Upload Zone */}
        <ImageUploader 
          onSuccess={(result) => setLatestResult(result)} 
        />

        {/* Latest Result (shown immediately after successful upload) */}
        {latestResult && (
          <div className="space-y-4">
            <h3 className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
              LATEST RESULT
            </h3>
            <div className="border-l-4 border-primary pl-4">
              <AnalysisResult result={latestResult} />
            </div>
          </div>
        )}

        {/* History */}
        <AnalysisHistory />

      </PageWrapper>
    </>
  );
}
