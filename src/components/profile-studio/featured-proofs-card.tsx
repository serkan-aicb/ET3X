"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Star, ExternalLink, FileX } from 'lucide-react';
import { Proof } from '@/lib/profile/types';
import { formatDistanceToNow } from '@/lib/utils';

interface FeaturedProofsCardProps {
  proofs: Proof[];
  loading?: boolean;
}

const difficultyColors: Record<string, string> = {
  'Novice': 'bg-green-500/10 text-green-600',
  'Skilled': 'bg-blue-500/10 text-blue-600',
  'Expert': 'bg-purple-500/10 text-purple-600',
  'Master': 'bg-amber-500/10 text-amber-600'
};

export function FeaturedProofsCard({ proofs, loading }: FeaturedProofsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <FileCheck className="h-4 w-4 text-primary" />
            <span>Featured Proofs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (proofs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <FileCheck className="h-4 w-4 text-primary" />
            <span>Featured Proofs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No proofs available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete and submit tasks to build your proof portfolio
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center space-x-2">
          <FileCheck className="h-4 w-4 text-primary" />
          <span>Featured Proofs</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {proofs.map((proof) => (
          <div 
            key={proof.proof_id} 
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{proof.title}</h4>
                {proof.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {proof.description}
                  </p>
                )}
              </div>
              {proof.on_chain && (
                <Badge variant="outline" className="shrink-0 ml-2 text-xs">
                  On-Chain
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {proof.task_difficulty && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${difficultyColors[proof.task_difficulty] || 'bg-muted'}`}
                >
                  {proof.task_difficulty}
                </Badge>
              )}
              {proof.skills.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  {skill}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium">{proof.evaluation_score.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(proof.timestamp))}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
