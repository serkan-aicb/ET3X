"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  User,
  FileCheck,
  Award,
  Shield,
  ClipboardList,
  Settings,
  Crown,
  ChevronRight
} from 'lucide-react';

interface SidebarProfileStudioProps {
  userName: string;
  userDid: string;
  avatarUrl?: string;
  profileStrength?: number;
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

const navigationItems = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'proofs', label: 'My Proofs', icon: FileCheck },
  { id: 'skills', label: 'Skills', icon: Award },
  { id: 'vault', label: 'Vault', icon: Shield },
  { id: 'evaluations', label: 'Evaluations', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function SidebarProfileStudio({
  userName,
  userDid,
  avatarUrl,
  profileStrength = 75,
  activeSection = 'profile',
  onNavigate
}: SidebarProfileStudioProps) {
  const [active, setActive] = useState(activeSection);

  const handleNavigate = (sectionId: string) => {
    setActive(sectionId);
    onNavigate?.(sectionId);
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const truncateDid = (did: string) => {
    if (did.length <= 20) return did;
    return `${did.slice(0, 10)}...${did.slice(-8)}`;
  };

  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col">
      {/* User Block */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">@{userName}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {truncateDid(userDid)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </button>
          );
        })}
      </nav>

      {/* Profile Strength */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Profile Strength</span>
            <span className="font-medium text-foreground">{profileStrength}%</span>
          </div>
          <Progress value={profileStrength} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Complete your profile to increase visibility
          </p>
        </div>
      </div>

      {/* Upgrade Block */}
      <div className="p-4 border-t border-border">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-sm">Talent3X Pro</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Unlock advanced features and verified credentials
          </p>
          <Button variant="outline" size="sm" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
}
