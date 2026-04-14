"use client";

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Save } from 'lucide-react';
import { SidebarProfileStudio } from './sidebar';

interface ProfileStudioLayoutProps {
  children: ReactNode;
  userName: string;
  userDid: string;
  onPreview?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function ProfileStudioLayout({
  children,
  userName,
  userDid,
  onPreview,
  onSave,
  isSaving = false
}: ProfileStudioLayoutProps) {
  return (
    <div className="min-h-screen bg-[#000000] flex">
      {/* Left Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0">
        <SidebarProfileStudio 
          userName={userName} 
          userDid={userDid}
          profileStrength={75}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Info Banner */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">You&apos;re in control</p>
                  <p className="text-xs text-gray-500">
                    Your data is private and belongs to you. <span className="text-blue-400 cursor-pointer hover:underline">Learn more</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onPreview}
                  className="border-[#1f1f1f] bg-[#111111] text-gray-300 hover:bg-[#161616] hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Public Profile
                </Button>
                <Button 
                  size="sm" 
                  onClick={onSave}
                  disabled={isSaving}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-6 bg-[#000000]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
