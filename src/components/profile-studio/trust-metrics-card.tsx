"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileCheck, Star, CheckCircle2 } from 'lucide-react';
import { TrustMetrics } from '@/lib/profile/types';

interface TrustMetricsCardProps {
  metrics: TrustMetrics;
}

export function TrustMetricsCard({ metrics }: TrustMetricsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center space-x-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>Trust Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verification Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {metrics.verified ? (
            <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary">
              Unverified
            </Badge>
          )}
        </div>

        {/* Total Evaluations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Evaluations</span>
          </div>
          <span className="font-semibold text-foreground">{metrics.total_evaluations}</span>
        </div>

        {/* Total Proofs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Proofs</span>
          </div>
          <span className="font-semibold text-foreground">{metrics.total_proofs}</span>
        </div>

        {/* Verification Message */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {metrics.verified 
              ? `Verified by ${metrics.total_evaluations} on-chain evaluations`
              : 'Complete tasks to earn verified credentials'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
