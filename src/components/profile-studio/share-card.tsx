"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, QrCode, Download, ExternalLink } from 'lucide-react';

interface ShareProfileCardProps {
  profileUrl?: string;
  userName: string;
}

export function ShareProfileCard({ profileUrl, userName }: ShareProfileCardProps) {
  const [copied, setCopied] = useState(false);
  
  const publicUrl = profileUrl || `https://talent3x.com/p/${userName}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName}'s Talent3X Profile`,
          text: 'Check out my verified skills and proofs on Talent3X',
          url: publicUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadQR = () => {
    // TODO: Implement QR code generation and download
    console.log('Download QR code');
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Share2 className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">Share Your Profile</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Share your verified profile with one link or QR code
      </p>

      {/* URL Display */}
      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg border border-border">
        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground truncate flex-1">{publicUrl}</span>
        <button
          onClick={handleCopy}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* QR Code Placeholder */}
      <div className="flex justify-center py-2">
        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
          <QrCode className="h-24 w-24 text-black" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadQR}
          className="w-full border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Download className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
        <Button
          size="sm"
          onClick={handleShare}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Profile
        </Button>
      </div>
    </div>
  );
}

// Keep old name for backward compatibility
export { ShareProfileCard as ShareCard };
