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
  'Finance': 'bg-green-500/10 text-green-400',
  'Data Science': 'bg-purple-500/10 text-purple-400',
  'Analytics': 'bg-blue-500/10 text-blue-400',
  'Engineering': 'bg-orange-500/10 text-orange-400',
  'Design': 'bg-pink-500/10 text-pink-400'
};

export function FeaturedProofsCard({ proofs, loading, totalProofs = 0 }: FeaturedProofsCardProps) {
  if (loading) {
    return (
      <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Featured Proofs</h3>
          <div className="h-4 w-16 bg-[#1f1f1f] rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] space-y-3">
              <div className="flex items-start space-x-3">
                <div className="h-12 w-12 bg-[#1f1f1f] rounded-lg animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-[#1f1f1f] rounded animate-pulse" />
                  <div className="h-4 w-full bg-[#1f1f1f] rounded animate-pulse" />
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
      <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Featured Proofs</h3>
        </div>
        <div className="text-center py-8">
          <FileX className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No proofs available yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Complete and submit tasks to build your proof portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-white">Featured Proofs</h3>
        {totalProofs > 0 && (
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View all ({totalProofs})
          </button>
        )}
      </div>

      {/* Proofs List */}
      <div className="space-y-4">
        {proofs.slice(0, 5).map((proof) => {
          const category = proof.skills[0] || 'General';
          const categoryStyle = categoryColors[category] || 'bg-gray-500/10 text-gray-400';
          
          return (
            <div 
              key={proof.proof_id} 
              className="p-4 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors group"
            >
              <div className="flex items-start space-x-4">
                {/* Thumbnail Placeholder */}
                <div className="w-14 h-14 bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-lg flex items-center justify-center shrink-0">
                  <FileCheck className="h-6 w-6 text-gray-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {proof.title}
                      </h4>
                      {proof.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {proof.description}
                        </p>
                      )}
                    </div>
                    <button className="text-gray-600 hover:text-gray-400 transition-colors ml-2">
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
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <CheckCircle2 className="h-3 w-3 text-blue-500" />
                      <span>Evaluated</span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-white font-medium">{proof.evaluation_score.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Button */}
      <button className="w-full mt-4 py-3 border border-dashed border-[#1f1f1f] rounded-lg text-gray-500 hover:text-gray-300 hover:border-[#2a2a2a] transition-colors flex items-center justify-center space-x-2">
        <Plus className="h-4 w-4" />
        <span className="text-sm">Add New Proof</span>
      </button>
    </div>
  );
}
