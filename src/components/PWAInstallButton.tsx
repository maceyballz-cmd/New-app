import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Monitor,
  CheckCircle2,
  X,
  ExternalLink,
  Laptop,
  Apple,
  Sparkles,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'hero' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isDesktop, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already running standalone desktop app, show a subtle "Installed" badge or hide in nav
  if (isInstalled) {
    if (variant === 'nav') {
      return (
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Desktop App Installed</span>
        </div>
      );
    }
    return null;
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 4000);
        return;
      }
    }
    // If deferred prompt isn't directly dispatchable (e.g. inside iframe or Mac Safari), open guide modal
    setShowModal(true);
  };

  const openInNewWindow = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* Button Render according to variant */}
      {variant === 'nav' && (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200/90 hover:border-blue-200 rounded-xl transition-all cursor-pointer shadow-2xs ${className}`}
          title="Download and install PlancheLab as a desktop app"
        >
          <Monitor className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Download Desktop App</span>
          <span className="sm:hidden">App</span>
          <Download className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
        </button>
      )}

      {variant === 'hero' && (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-md ${className}`}
        >
          <Monitor className="w-4 h-4 text-sky-400" />
          <span>Download Desktop App</span>
          <Download className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {/* Success Notification */}
      {installedSuccess && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold">App Installed Successfully!</div>
            <div className="text-[11px] text-slate-300">
              PlancheLab is now ready on your desktop and dock.
            </div>
          </div>
        </div>
      )}

      {/* Desktop Download & Installation Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      Download PlancheLab for Desktop
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
                      PWA Desktop
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Install as a standalone native app on Windows, macOS, Linux, or ChromeOS.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct 1-Click Install if available */}
            {isInstallable && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-blue-900">
                    Direct 1-Click Desktop Installer Ready
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Your browser supports instant 1-click desktop installation.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Now</span>
                </button>
              </div>
            )}

            {/* Desktop Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" />
                  <span>Standalone Window</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  No browser tabs or address bar clutter. Runs like native desktop software.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                  <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Offline Ready</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Full service worker caching. Work out in gym basements without WiFi.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Local Storage</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your logs, custom sets, notes, and calendar stay saved safely on your device.
                </p>
              </div>
            </div>

            {/* Step-by-Step Instructions by Browser/OS */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Installation Instructions by Browser
              </div>

              {/* Chrome / Edge / Brave (Windows, Mac, Linux) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Google Chrome / Microsoft Edge / Brave</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed pl-1">
                  <li>
                    Look at the right side of your browser address bar at the top of this window.
                  </li>
                  <li>
                    Click the <strong>Install</strong> icon (a small computer screen with a down arrow <Download className="w-3 h-3 inline text-slate-700" />).
                  </li>
                  <li>
                    Click <strong>Install</strong> when prompted. PlancheLab will immediately open in its own desktop window and add a shortcut to your desktop & applications menu.
                  </li>
                </ol>
              </div>

              {/* Mac Safari (macOS Sonoma / Sequoia) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Apple className="w-4 h-4 text-slate-800" />
                  <span>Apple Safari (macOS)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed pl-1">
                  <li>In the top Mac menu bar, click <strong>File</strong>.</li>
                  <li>Select <strong>Add to Dock...</strong></li>
                  <li>
                    Confirm the name <strong>PlancheLab</strong> and click <strong>Add</strong>. It will sit in your macOS Dock and Launchpad like any native Mac app!
                  </li>
                </ol>
              </div>
            </div>

            {/* Note about preview iframe */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
              <span className="text-[11px] text-slate-500">
                Browsers restrict installation inside iframes. Opening in a direct tab enables the native install prompt:
              </span>
              <button
                type="button"
                onClick={openInNewWindow}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
