"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  FileCheck,
  Award,
  Shield,
  ClipboardList,
  Settings,
  Check,
  Sparkles
} from 'lucide-react';

interface SidebarProfileStudioProps {
  userName: string;
  realName?: string | null;
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
  realName,
  avatarUrl,
  profileStrength = 75,
  activeSection = 'profile',
  onNavigate
}: SidebarProfileStudioProps) {
  const [active, setActive] = useState(activeSection);
  const displayName = realName || userName;

  const handleNavigate = (sectionId: string) => {
    setActive(sectionId);
    onNavigate?.(sectionId);
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-64 h-full bg-muted border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">Talent3X</span>
        </div>
      </div>

      {/* Section Label */}
      <div className="px-6 pb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Profile Studio
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile Strength Card */}
      <div className="p-4 mx-3 mb-3 bg-card rounded-xl border border-border">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Profile strength</span>
            <span className="text-lg font-bold text-primary">{profileStrength}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
              style={{ width: `${profileStrength}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Keep going! Add more proofs and get evaluated.
          </p>
        </div>
      </div>

      {/* Upgrade Card */}
      <div className="p-4 mx-3 mb-3 bg-card rounded-xl border border-border">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground">Unlock more with</span>
          </div>
          <p className="text-lg font-bold text-foreground">Talent3X Pro</p>
          <ul className="space-y-1.5">
            {['Advanced analytics', 'Private AI feedback', 'Priority assessment', 'Custom integrations'].map((feature, i) => (
              <li key={i} className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button 
            size="sm" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
            disabled
          >
            Upgrade (Coming Soon)
          </Button>
        </div>
      </div>

      {/* User Card */}
      <div className="p-4 mx-3 mb-4 bg-card rounded-xl border border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">Free Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
