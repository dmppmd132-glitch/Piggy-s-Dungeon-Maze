import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] px-3 py-2 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        title="將遊戲安裝到桌面或主畫面"
      >
        <Download className="w-3.5 h-3.5 text-[#f3b562]" />
        <span>安裝遊戲</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] px-3 py-2 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          title="將遊戲加入 iPhone / iPad 主畫面"
        >
          <Download className="w-3.5 h-3.5 text-[#f3b562]" />
          <span>加到主畫面</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-title"
          >
            <div className="pixel-panel w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b-2 border-[#4a3525] pb-2">
                <h3 id="ios-pwa-title" className="font-pixel text-base text-[#ffd95a]">
                  安裝至 iPhone / iPad 主畫面
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="text-[#b8a58d] hover:text-[#f5ebd9] p-1 cursor-pointer"
                  aria-label="關閉視窗"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-sm text-[#f5ebd9] space-y-2 leading-relaxed list-decimal list-inside">
                <li>點擊 Safari 下方工具列的「分享」圖示。</li>
                <li>往下捲動並選擇「加入主畫面」。</li>
                <li>點擊右上角「新增」即可用獨立視窗遊玩！</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="pixel-btn pixel-btn-primary w-full py-2 text-sm font-bold cursor-pointer"
              >
                知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
