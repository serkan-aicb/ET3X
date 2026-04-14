"use client";

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Info, Eye, Save } from 'lucide-react';
import { SidebarProfileStudio } from './sidebar';

interface ProfileStudioLayoutProps {
  children: ReactNode;
  userName: string;
  userDid: string;
  onPreview?: () => void;
  onSave?: () => void;
}

export function ProfileStudioLayout({
  children,
  userName,
  userDid,
  onPreview,
  onSave
}: ProfileStudioLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <div className="hidden lg:block">
        <SidebarProfileStudio 
          userName={userName} 
          userDid={userDid}
          profileStrength={75}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="border-b border-border bg-card/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Info Banner */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 text-primary" />
                <span>You are in control of your profile data</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={onPreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Public Profile
                </Button>
                <Button size="sm" onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
