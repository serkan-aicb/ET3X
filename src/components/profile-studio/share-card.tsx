"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, QrCode } from 'lucide-react';

interface ShareCardProps {
  profileUrl?: string;
  userName: string;
}

export function ShareCard({ profileUrl, userName }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  
  const publicUrl = profileUrl || `https://talent3x.io/p/${userName}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center space-x-2">
          <Share2 className="h-4 w-4 text-primary" />
          <span>Share Profile</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Placeholder */}
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center">
              <QrCode className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">QR Code</span>
            </div>
          </div>
        </div>

        {/* URL Input */}
        <div className="flex space-x-2">
          <Input
            value={publicUrl}
            readOnly
            className="text-xs font-mono bg-muted"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Share your verified profile with employers and peers
        </p>
      </CardContent>
    </Card>
  );
}
