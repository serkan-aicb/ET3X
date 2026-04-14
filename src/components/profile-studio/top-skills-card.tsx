"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp } from 'lucide-react';
import { TopSkill } from '@/lib/profile/types';

interface TopSkillsCardProps {
  skills: TopSkill[];
  loading?: boolean;
}

const levelColors: Record<string, string> = {
  'Foundation': 'bg-slate-500',
  'Intermediate': 'bg-blue-500',
  'Advanced': 'bg-purple-500',
  'Exceptional': 'bg-amber-500'
};

export function TopSkillsCard({ skills, loading }: TopSkillsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Award className="h-4 w-4 text-primary" />
            <span>Top Skills</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-12 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-2 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Award className="h-4 w-4 text-primary" />
            <span>Top Skills</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No skills rated yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete tasks to earn skill ratings
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
          <Award className="h-4 w-4 text-primary" />
          <span>Top Skills</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {skills.map((skill) => (
          <div key={skill.skill_id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-foreground">{skill.name}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${levelColors[skill.level]} text-white border-0`}
                >
                  {skill.level}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-semibold text-foreground">{skill.score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
            </div>
            <Progress value={skill.score} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Based on {skill.evidence_count} evaluation{skill.evidence_count !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
