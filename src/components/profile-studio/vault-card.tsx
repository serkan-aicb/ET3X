"use client";

import { Button } from '@/components/ui/button';
import { Shield, Lock, User, FileCheck, Award, Link2 } from 'lucide-react';

interface VaultItem {
  id: string;
  label: string;
  status: 'Private' | 'You control' | 'Shared';
  icon: React.ReactNode;
}

interface VaultCardProps {
  onOpenVault?: () => void;
}

export function VaultCard({ onOpenVault }: VaultCardProps) {
  const vaultItems: VaultItem[] = [
    { id: 'personal', label: 'Personal Data', status: 'Private', icon: <User className="h-4 w-4" /> },
    { id: 'evaluations', label: 'Evaluations', status: 'Private', icon: <FileCheck className="h-4 w-4" /> },
    { id: 'proofs', label: 'Proofs', status: 'You control', icon: <Award className="h-4 w-4" /> },
    { id: 'connections', label: 'Connections', status: 'You control', icon: <Link2 className="h-4 w-4" /> },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Private':
        return 'text-gray-500';
      case 'You control':
        return 'text-blue-400';
      case 'Shared':
        return 'text-green-400';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-blue-400" />
          <h3 className="font-semibold text-white">Your Vault</h3>
        </div>
        <Lock className="h-4 w-4 text-gray-600" />
      </div>

      <p className="text-sm text-gray-500">
        You own your data. Choose what to share and with whom.
      </p>

      {/* Vault Items */}
      <div className="space-y-2">
        {vaultItems.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between py-2 px-3 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f]"
          >
            <div className="flex items-center space-x-3">
              <div className="text-gray-500">{item.icon}</div>
              <span className="text-sm text-gray-300">{item.label}</span>
            </div>
            <span className={`text-xs ${getStatusColor(item.status)}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {/* Open Vault Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenVault}
        className="w-full border-[#1f1f1f] bg-[#0a0a0a] text-gray-300 hover:bg-[#161616] hover:text-white"
      >
        Open Vault
      </Button>
    </div>
  );
}
