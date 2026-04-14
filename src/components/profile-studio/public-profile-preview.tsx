"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink } from 'lucide-react';
import { TopSkill, Proof, TrustMetrics } from '@/lib/profile/types';

interface PublicProfilePreviewProps {
  userName: string;
  did: string;
  topSkills: TopSkill[];
  proofs: Proof[];
  metrics: TrustMetrics;
}

export function PublicProfilePreview({
  userName,
  did,
  topSkills,
  proofs,
  metrics
}: PublicProfilePreviewProps) {
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();
  const truncateDid = (did: string) => 
    did.length > 30 ? `${did.slice(0, 15)}...${did.slice(-12)}` : did;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Eye className="h-4 w-4 text-primary" />
          <span>Public Profile Preview</span>
        </CardTitle>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Live
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-xl p-6 bg-gradient-to-br from-background to-muted/30">
          {/* Public Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold">@{userName}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {truncateDid(did)}
              </p>
              {metrics.verified && (
                <Badge variant="default" className="mt-1 bg-green-500/10 text-green-600 text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Public Skills View */}
          {topSkills.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Top Skills</h4>
              <div className="flex flex-wrap gap-2">
                {topSkills.slice(0, 4).map((skill) => (
                  <Badge key={skill.skill_id} variant="secondary" className="font-normal">
                    {skill.name} ({skill.score})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Public Proofs View */}
          {proofs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                Recent Proofs ({proofs.length})
              </h4>
              <div className="space-y-2">
                {proofs.slice(0, 2).map((proof) => (
                  <div key={proof.proof_id} className="text-sm p-2 bg-muted/50 rounded">
                    <span className="font-medium">{proof.title}</span>
                    <span className="text-muted-foreground ml-2">
                      {proof.evaluation_score.toFixed(1)}/5
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
