import React, { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, User as UserIcon, ChevronDown, CheckCircle2, RefreshCw, Cloud } from 'lucide-react';
import { useSync } from '../context/SyncContext';
import { CloudSyncModal } from './CloudSyncModal';

export const UserAuthButton: React.FC = () => {
  const { user, authLoading, login, logout, syncStatus, lastSyncedAt, syncNow } = useSync();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  if (authLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        <span className="hidden sm:inline">Signing in...</span>
      </div>
    );
  }

  // Not logged in: Show prominent "Log In" button
  if (!user) {
    return (
      <button
        onClick={login}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-blue-50/60 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-98"
        title="Log in with Google to synchronize your workouts and progress"
      >
        <LogIn className="w-3.5 h-3.5 text-blue-600" />
        <span>Log In</span>
      </button>
    );
  }

  // Logged in: Show profile badge with dropdown
  const displayName = user.displayName || user.email?.split('@')[0] || 'Athlete';
  const firstName = displayName.split(' ')[0];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-2xs"
          title={`Logged in as ${user.displayName || user.email}`}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="max-w-[85px] sm:max-w-[120px] truncate">{firstName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Connected" />
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* User Profile Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-700">
            {/* Header with User Info */}
            <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>{user.displayName || 'Planche Athlete'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="text-[11px] text-slate-500 truncate" title={user.email || ''}>
                  {user.email}
                </div>
              </div>
            </div>

            {/* Sync Status Info */}
            <div className="px-3 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Database Active</span>
              </div>
              <button
                onClick={() => {
                  syncNow();
                }}
                disabled={syncStatus === 'syncing'}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            {/* Options */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSyncModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2 text-slate-700"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Sync Details & Desktop Setup</span>
              </button>
            </div>

            {/* Sign Out */}
            <div className="pt-1 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <CloudSyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
    </>
  );
};
