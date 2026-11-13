import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 pixel-panel border-[#e05a47] bg-[#3b1b16] px-3.5 py-2 text-xs text-[#ffe5e0] flex items-center gap-2"
    >
      <WifiOff className="w-4 h-4 text-[#ff8a7d] shrink-0" />
      <span>目前處於離線狀態 · AI 地下城主需要網路連線</span>
    </div>
  );
};
