"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Unlock, Database } from 'lucide-react';

interface VaultCardProps {
  isLocked?: boolean;
}

export function VaultCard({ isLocked = true }: VaultCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center space-x-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>Vault</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {isLocked ? (
                <Lock className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Unlock className="h-8 w-8 text-green-500" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Database className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="font-medium text-foreground">
            {isLocked ? 'Vault Locked' : 'Vault Active'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isLocked 
              ? 'Your credentials are securely stored'
              : 'Full control over your data'
            }
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Storage</span>
            <span className="font-medium">0 / 100 MB</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-0 bg-primary transition-all" />
          </div>
        </div>

        <Button variant="outline" className="w-full" disabled>
          Manage Vault
        </Button>
      </CardContent>
    </Card>
  );
}
