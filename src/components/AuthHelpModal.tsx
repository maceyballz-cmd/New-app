import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  X,
  ShieldAlert,
  ArrowRight,
  Globe,
  LogIn,
} from 'lucide-react';
import { useSync, LoginErrorInfo } from '../context/SyncContext';

interface AuthHelpModalProps {
  error: LoginErrorInfo;
  onClose: () => void;
}

export const AuthHelpModal: React.FC<AuthHelpModalProps> = ({ error, onClose }) => {
  const { login, loginWithRedirect, isLoggingIn } = useSync();
  const [copied, setCopied] = useState(false);

  const currentHostname = error.domain || (typeof window !== 'undefined' ? window.location.hostname : '');
  const isUnauthorizedDomain = error.code === 'auth/unauthorized-domain' || error.message.includes('authorized domain');
  const isPopupClosedByUser = error.code === 'auth/popup-closed-by-user';
  const isPopupBlocked = error.code === 'auth/popup-blocked';
  const inIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleCopyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      const textArea = document.createElement('textarea');
      textArea.value = currentHostname;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={`p-4 sm:p-5 text-white flex items-center justify-between ${
          isUnauthorizedDomain ? 'bg-amber-600' : 'bg-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              {isUnauthorizedDomain ? (
                <ShieldAlert className="w-5 h-5 text-white" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                {isUnauthorizedDomain
                  ? 'Domain Authorization Required'
                  : isPopupClosedByUser
                  ? 'Sign-In Window Closed'
                  : isPopupBlocked
                  ? 'Pop-up Window Blocked'
                  : 'Google Sign-In Issue'}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                {isUnauthorizedDomain
                  ? 'Firebase requires approving this domain to allow Google login'
                  : 'Why the Google sign-in window closed and how to proceed'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600">
          {/* Detailed Context */}
          {isUnauthorizedDomain ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
                <p className="font-semibold text-amber-950 mb-1">Why did the window open and close?</p>
                Firebase security automatically closes Google sign-in popups when the hosting domain isn&apos;t listed in the Firebase project&apos;s <strong>Authorized domains</strong> list.
              </div>

              {/* Domain box with Copy */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Your Current Domain:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 break-all select-all flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentHostname}</span>
                  </div>
                  <button
                    onClick={handleCopyDomain}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-2xs active:scale-98"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 3 Step Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Quick 1-Minute Fix:
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                  <li>
                    Click below to open <strong>Firebase Authentication Settings</strong> in your project.
                  </li>
                  <li>
                    Scroll down to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.
                  </li>
                  <li>
                    Paste <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800 font-semibold">{currentHostname}</code> and click <strong>Save</strong>.
                  </li>
                </ol>

                <div className="pt-2">
                  <a
                    href="https://console.firebase.google.com/project/skillful-beanbag-604qf/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs"
                  >
                    <span>Open Firebase Console Settings</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs leading-relaxed">
                <p className="font-semibold text-slate-900 mb-1">Popup Interrupted</p>
                The authentication window was closed before completion. This typically happens if:
                <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-600">
                  <li>Your browser or ad-blocker blocked the cross-window communication.</li>
                  <li>You are testing inside an embedded frame (where popups lose parent references).</li>
                  <li>The popup was closed manually or dismissed before account selection finished.</li>
                </ul>
              </div>

              {/* Raw Error Code */}
              <div className="px-3 py-2 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-600 border border-slate-200 truncate">
                Code: {error.code} {error.message && `— ${error.message}`}
              </div>
            </div>
          )}

          {/* Alternative Sign-In Options */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Alternative Sign-In Methods:
            </div>

            {/* Option 1: Full-Page Redirect Sign-In */}
            <button
              onClick={() => loginWithRedirect()}
              disabled={isLoggingIn}
              className="w-full text-left p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 transition-colors flex items-center justify-between cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                    <span>Sign in with Full-Page Redirect</span>
                    <span className="text-[10px] bg-blue-200/80 text-blue-800 font-bold px-1.5 py-0.2 rounded">Recommended</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bypasses popup windows entirely. Navigates to Google and returns authenticated.
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Option 2: Open App in Top-Level Tab (if iframe) */}
            {inIframe && (
              <button
                onClick={handleOpenNewTab}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600">
                      Open App in Full Browser Tab
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Opens outside this embedded preview where all popups and cookies are permitted.
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Option 3: Retry Popup */}
            <button
              onClick={() => login()}
              disabled={isLoggingIn}
              className="w-full py-2 px-3 text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoggingIn ? 'animate-spin' : ''}`} />
              <span>{isLoggingIn ? 'Opening Sign-In...' : 'Retry Google Popup'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Workouts & progress stay saved locally offline.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
