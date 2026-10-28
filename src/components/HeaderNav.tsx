import React from 'react';
import { Printer, Play, Volume2, VolumeX, Flame } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderNavProps {
  activeTab: 'overview' | 'workout' | 'cheatsheet' | 'exercises' | 'roadmap' | 'calculator' | 'transformation';
  setActiveTab: (tab: 'overview' | 'workout' | 'cheatsheet' | 'exercises' | 'roadmap' | 'calculator' | 'transformation') => void;
  onPrint: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print shadow-xs">
      {/* ============================================================
          ROW 1: Brand Wordmark & Top Primary Actions
          ============================================================ */}
      <div className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-4">
          {/* Brand Wordmark & Tag */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className="text-left group cursor-pointer focus:outline-none flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                PlancheLab
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded">
                Mastery
              </span>
            </button>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Download for Desktop App Button */}
            <PWAInstallButton variant="nav" />
            {/* Sound Effects Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute sound effects' : 'Enable audio cues'}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Sound"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-slate-700" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Print / Save PDF */}
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap border border-slate-200/60"
              title="Print or export PDF (Ctrl+P / Cmd+P)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print PDF</span>
            </button>

            {/* Start Live Session Button */}
            <button
              onClick={() => setActiveTab('workout')}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          ROW 2: Navigation Bar
          - Desktop / Tablet: Spacious horizontal tab row
          - Mobile: Clean 2-row organized grid so all 7 tabs fit nicely!
          ============================================================ */}

      {/* DESKTOP / TABLET NAV (Single line with spacious breathing room) */}
      <div className="hidden md:block bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-1 lg:gap-2 py-1.5 overflow-x-auto text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-semibold ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Program
            </button>

            <button
              onClick={() => setActiveTab('workout')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-semibold flex items-center gap-1.5 ${
                activeTab === 'workout'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Session</span>
            </button>

            <button
              onClick={() => setActiveTab('cheatsheet')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-semibold ${
                activeTab === 'cheatsheet'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Cheat Sheet
            </button>

            <button
              onClick={() => setActiveTab('exercises')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-semibold ${
                activeTab === 'exercises'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Exercises
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-semibold ${
                activeTab === 'roadmap'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Roadmap
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-semibold ${
                activeTab === 'calculator'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              RPE Calculator
            </button>

            <button
              onClick={() => setActiveTab('transformation')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-semibold ${
                activeTab === 'transformation'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Nutrition & Transformation
            </button>
          </nav>
        </div>
      </div>

      {/* MOBILE NAV: Structured in 2 clean, comfortable rows that fit nicely without clipping */}
      <div className="md:hidden bg-slate-50/95 border-t border-slate-100 px-2 py-1.5 space-y-1">
        {/* Mobile Nav Row 1: Core Training & Reference */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 px-1 text-[11px] font-bold rounded-md text-center transition-all truncate cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Program
          </button>

          <button
            onClick={() => setActiveTab('workout')}
            className={`py-1.5 px-1 text-[11px] font-bold rounded-md text-center transition-all truncate cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'workout'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span>Live</span>
          </button>

          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`py-1.5 px-1 text-[11px] font-bold rounded-md text-center transition-all truncate cursor-pointer ${
              activeTab === 'cheatsheet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Cheat Sheet
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`py-1.5 px-1 text-[11px] font-bold rounded-md text-center transition-all truncate cursor-pointer ${
              activeTab === 'exercises'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Exercises
          </button>
        </div>

        {/* Mobile Nav Row 2: Progression, Calculator & Transformation */}
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`py-1.5 px-1 text-[11px] font-bold rounded-md text-center transition-all truncate cursor-pointer ${
              activeTab === 'roadmap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Roadmap
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-1.5 px-1 text-[11px] font-bold rounded-md text-center transition-all truncate cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            RPE Calc
          </button>

          <button
            onClick={() => setActiveTab('transformation')}
            className={`py-1.5 px-1 text-[11px] font-bold rounded-md text-center transition-all truncate cursor-pointer ${
              activeTab === 'transformation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Transformation
          </button>
        </div>
      </div>
    </header>
  );
};
