"use client";

import { CheckCircle2, FileCheck, Award } from 'lucide-react';

interface ProfileStatsCardProps {
  evaluations: number;
  skills: number;
  proofs: number;
  isVerified?: boolean;
  isPublished?: boolean;
}

export function ProfileStatsCard({
  evaluations,
  skills,
  proofs,
  isVerified = false,
  isPublished = false
}: ProfileStatsCardProps) {
  return (
    <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-5 space-y-4">
      {/* Evaluations */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-white">{evaluations}</span>
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Evaluations</span>
            {isVerified && (
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-white">{skills}</span>
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Skills</span>
            {isVerified && (
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proofs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-white">{proofs}</span>
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Proofs</span>
            {isPublished && (
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-500">Published</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
