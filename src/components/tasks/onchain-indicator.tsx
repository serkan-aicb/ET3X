// Component to display on-chain status and PolygonScan links for skill ratings
"use client";

import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

interface OnChainIndicatorProps {
  onChain: boolean;
  txHash?: string | null;
}

export function OnChainIndicator({ onChain, txHash }: OnChainIndicatorProps) {
  if (!onChain) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        Off-Chain
      </span>
    );
  }

  if (!txHash) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        On-Chain
      </span>
    );
  }

  return (
    <Link 
      href={`https://polygonscan.com/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 hover:underline"
    >
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        On-Chain
      </span>
      <ExternalLinkIcon className="h-3 w-3" />
    </Link>
  );
}