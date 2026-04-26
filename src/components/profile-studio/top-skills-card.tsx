"use client";

import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, BarChart3, PieChart, LineChart, Activity, Zap } from 'lucide-react';
import { TopSkill } from '@/lib/profile/types';

interface TopSkillsCardProps {
  skills: TopSkill[];
  loading?: boolean;
  totalSkills?: number;
}

const levelColors: Record<string, { bg: string; text: string }> = {
  'Foundation': { bg: 'bg-gray-500/20', text: 'text-gray-600' },
  'Intermediate': { bg: 'bg-blue-500/20', text: 'text-blue-600' },
  'Advanced': { bg: 'bg-purple-500/20', text: 'text-purple-600' },
  'Exceptional': { bg: 'bg-amber-500/20', text: 'text-amber-600' }
};

const skillIcons = [BarChart3, PieChart, LineChart, Activity, Zap, TrendingUp];

export function TopSkillsCard({ skills, loading, totalSkills = 0 }: TopSkillsCardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Top Skills</h3>
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-12 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-2 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Top Skills</h3>
        </div>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No skills rated yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete tasks to earn skill ratings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground">Top Skills</h3>
        {totalSkills > 0 && (
          <button className="text-sm text-primary hover:text-primary/80 transition-colors">
            View all ({totalSkills})
          </button>
        )}
      </div>

      {/* Skills List */}
      <div className="space-y-4">
        {skills.slice(0, 6).map((skill, index) => {
          const Icon = skillIcons[index % skillIcons.length];
          const colors = levelColors[skill.level] || levelColors['Foundation'];
          
          return (
            <div key={skill.skill_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center border border-border">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground">{skill.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${colors.bg} ${colors.text} border-0 font-medium`}
                  >
                    {skill.level}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-foreground">{skill.score}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden ml-11">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                  style={{ width: `${skill.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
        Skills are verified by evaluations on Talent3X
      </p>
    </div>
  );
}
