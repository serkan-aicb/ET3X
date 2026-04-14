"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2 } from 'lucide-react';

interface ProfileHeaderProps {
  userName: string;
  did: string;
  headline?: string;
  institution?: string;
  location?: string;
  avatarUrl?: string;
  topSkills?: string[];
}

export function ProfileHeader({
  userName,
  did,
  headline,
  institution,
  location,
  avatarUrl,
  topSkills = []
}: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const truncateDid = (did: string) => {
    if (did.length <= 30) return did;
    return `${did.slice(0, 15)}...${did.slice(-12)}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-start space-x-6">
        {/* Avatar */}
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarImage src={avatarUrl} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {/* Identity Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">@{userName}</h1>
            <p className="text-sm font-mono text-muted-foreground mt-1">
              {truncateDid(did)}
            </p>
          </div>

          {headline && (
            <p className="text-foreground/80 font-medium">
              {headline}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {institution && (
              <div className="flex items-center space-x-1">
                <Building2 className="h-4 w-4" />
                <span>{institution}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
          </div>

          {/* Skill Tags */}
          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {topSkills.slice(0, 4).map((skill, index) => (
                <Badge key={index} variant="secondary" className="font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
