import React from 'react';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
  Laptop,
  Globe,
  Dumbbell,
  Calendar,
  Sparkles,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useSync } from '../context/SyncContext';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    authLoading,
    syncStatus,
    lastSyncedAt,
    errorMessage,
    stats,
    login,
    logout,
    syncNow,
  } = useSync();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Desktop & Web Sync
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Firebase Cloud
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time two-way synchronization between your desktop app and browser.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Visual Sync Graphic (Web <-> Cloud <-> Desktop) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-around text-center text-xs">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
                <Globe className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-700">Web Browser</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center text-emerald-600">
                <span className="text-xs font-mono font-bold">⇄</span>
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-mono font-bold">⇄</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Live Cloud
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-700">Desktop App</span>
            </div>
          </div>

          {/* Account Status */}
          {user ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-emerald-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">
                        {user.displayName || 'Calisthenics Athlete'}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    </div>
                    <span className="text-xs text-slate-500 block truncate max-w-[220px]">
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Status and counts */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100 text-center">
                <div className="bg-white rounded-lg p-2 border border-emerald-100/60 shadow-2xs">
                  <span className="text-xs font-bold text-slate-900 block">
                    {stats.workoutLogsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                    <Dumbbell className="w-3 h-3 text-blue-600" /> Logs
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2 border border-emerald-100/60 shadow-2xs">
                  <span className="text-xs font-bold text-slate-900 block">
                    {stats.calendarLogsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-600" /> Calendar
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2 border border-emerald-100/60 shadow-2xs">
                  <span className="text-xs font-bold text-emerald-700 block">12 Wk</span>
                  <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Photos
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>
                  Last synced:{' '}
                  <strong className="text-slate-800">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Just now'}
                  </strong>
                </span>
                <button
                  onClick={syncNow}
                  disabled={syncStatus === 'syncing'}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                  />
                  <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 text-center space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Enable Cross-Platform Synchronization
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Sign in with Google on both this browser and the downloaded desktop app. Your workout
                  routines, completed sessions, calendar rest days, and progress photos will sync
                  automatically!
                </p>
              </div>

              {errorMessage && (
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-1.5 justify-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={login}
                disabled={authLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 hover:shadow active:scale-99 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}

          {/* Quick instructions / features */}
          <div className="space-y-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
              How it works:
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
              <li>
                <strong>Automatic Real-Time Sync:</strong> As soon as you log a workout, note, or rest
                day, it pushes to your secure cloud database instantly.
              </li>
              <li>
                <strong>Desktop App Compatible:</strong> Install the desktop app using the &quot;Desktop
                App&quot; button in the top bar, sign in with the same Google account, and your data is
                always matching.
              </li>
              <li>
                <strong>Offline-Ready:</strong> If your internet drops or you train in a gym without
                reception, changes save locally and sync as soon as you reconnect.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
