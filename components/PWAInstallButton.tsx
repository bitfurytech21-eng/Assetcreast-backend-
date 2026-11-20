'use client';

import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'full';
  onFallbackClick?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onFallbackClick,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="py-2.5 px-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Installed as App
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    if (onFallbackClick) {
      onFallbackClick();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'full'
            ? 'py-2.5 px-4 rounded-md bg-[#2b4865] text-white font-medium text-xs text-center hover:bg-[#223a52] transition flex items-center justify-center gap-2 cursor-pointer'
            : 'flex items-center gap-1.5 rounded-md bg-white/15 hover:bg-white/25 border border-white/20 px-2.5 py-1.5 text-xs font-medium text-white transition cursor-pointer'
        }
      >
        {isInstallable ? (
          <>
            <Download className="h-3.5 w-3.5" />
            {variant === 'full' ? 'Install Native WebAPK' : 'Install App'}
          </>
        ) : isIOS ? (
          <>
            <Smartphone className="h-3.5 w-3.5" />
            Install on iOS
          </>
        ) : (
          <>
            <Smartphone className="h-3.5 w-3.5" />
            {variant === 'full' ? 'Install PWA on Android' : 'Install App'}
          </>
        )}
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-white border border-slate-200 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2b4865] flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[#2b4865]" />
                {isIOS ? 'Install on iPhone / iPad' : 'Install directly on Android / Chrome'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isIOS ? (
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Open this app URL directly in Safari (outside embedded frames).</li>
                <li>Tap the <strong>Share</strong> button in Safari&apos;s toolbar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              </ol>
            ) : (
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Open this app URL directly in <strong>Chrome for Android</strong> (or scan the QR code in the APK Studio).</li>
                <li>Tap the Chrome menu (<strong>⋮</strong>) and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Android Chrome automatically compiles and installs a standalone <strong>WebAPK</strong> on your phone.</li>
              </ol>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-md bg-[#2b4865] py-2.5 text-xs font-semibold text-white hover:bg-[#223a52] transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
