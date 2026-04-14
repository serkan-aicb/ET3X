"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Star, FileCheck } from 'lucide-react';
import { TopSkill, Proof, TrustMetrics } from '@/lib/profile/types';

interface MobilePreviewProps {
  userName: string;
  topSkills: TopSkill[];
  proofs: Proof[];
  metrics: TrustMetrics;
}

export function MobilePreview({
  userName,
  topSkills,
  proofs,
  metrics
}: MobilePreviewProps) {
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <span>Mobile Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          {/* Mobile Frame */}
          <div className="w-[280px] border-[8px] border-foreground rounded-[2rem] overflow-hidden bg-background shadow-2xl">
            {/* Notch */}
            <div className="h-6 bg-foreground flex justify-center items-end pb-1">
              <div className="w-20 h-4 bg-background rounded-t-full" />
            </div>

            {/* Mobile Content */}
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={undefined} alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm">@{userName}</h3>
                  {metrics.verified && (
                    <Badge variant="default" className="text-[10px] bg-green-500/10 text-green-600 px-1 py-0">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-around py-2 border-y">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-3 w-3 text-amber-500" />
                    <span className="font-bold text-sm">{metrics.total_evaluations}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Reviews</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <FileCheck className="h-3 w-3 text-blue-500" />
                    <span className="font-bold text-sm">{metrics.total_proofs}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Proofs</span>
                </div>
              </div>

              {/* Skills */}
              {topSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {topSkills.slice(0, 3).map((skill) => (
                      <Badge key={skill.skill_id} variant="secondary" className="text-[10px] font-normal">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Proofs */}
              {proofs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Proofs</h4>
                  <div className="space-y-2">
                    {proofs.slice(0, 2).map((proof) => (
                      <div key={proof.proof_id} className="p-2 bg-muted rounded text-xs">
                        <div className="font-medium truncate">{proof.title}</div>
                        <div className="text-muted-foreground">
                          {proof.evaluation_score.toFixed(1)}/5
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="h-6 bg-foreground flex justify-center items-center">
              <div className="w-24 h-1 bg-background rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
