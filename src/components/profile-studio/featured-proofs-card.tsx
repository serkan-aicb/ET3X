"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Star, ExternalLink, FileX, Plus, CheckCircle2 } from 'lucide-react';
import { Proof } from '@/lib/profile/types';

interface FeaturedProofsCardProps {
  proofs: Proof[];
  loading?: boolean;
  totalProofs?: number;
}

const categoryColors: Record<string, string> = {
  'Finance': 'bg-green-500/10 text-green-600',
  'Data Science': 'bg-purple-500/10 text-purple-600',
  'Analytics': 'bg-blue-500/10 text-blue-600',
  'Engineering': 'bg-orange-500/10 text-orange-600',
  'Design': 'bg-pink-500/10 text-pink-600'
};

export function FeaturedProofsCard({ proofs, loading, totalProofs = 0 }: FeaturedProofsCardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Featured Proofs</h3>
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-muted rounded-lg border border-border space-y-3">
              <div className="flex items-start space-x-3">
                <div className="h-12 w-12 bg-muted rounded-lg animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Featured Proofs</h3>
        </div>
        <div className="text-center py-8">
          <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No proofs available yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete and submit tasks to build your proof portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground">Featured Proofs</h3>
        {totalProofs > 0 && (
          <button className="text-sm text-primary hover:text-primary/80 transition-colors">
            View all ({totalProofs})
          </button>
        )}
      </div>

      {/* Proofs List */}
      <div className="space-y-4">
        {proofs.slice(0, 5).map((proof) => {
          const category = proof.skills[0] || 'General';
          const categoryStyle = categoryColors[category] || 'bg-gray-500/10 text-gray-600';
          
          return (
            <div 
              key={proof.proof_id} 
              className="p-4 bg-muted rounded-lg border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start space-x-4">
                {/* Thumbnail Placeholder */}
                <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0">
                  <FileCheck className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {proof.title}
                      </h4>
                      {proof.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {proof.description}
                        </p>
                      )}
                    </div>
                    <button className="text-muted-foreground hover:text-foreground transition-colors ml-2">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Tags Row */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${categoryStyle} border-0 font-medium`}
                    >
                      {category}
                    </Badge>
                    
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-blue-500" />
                      <span>Evaluated</span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-foreground font-medium">{proof.evaluation_score.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Button */}
      <button className="w-full mt-4 py-3 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center space-x-2">
        <Plus className="h-4 w-4" />
        <span className="text-sm">Add New Proof</span>
      </button>
    </div>
  );
}
