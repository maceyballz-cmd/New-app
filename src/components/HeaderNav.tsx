import React from 'react';
import { Printer, Play, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/sound';

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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
              PlancheLab
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'overview'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Program
          </button>
          <button
            onClick={() => setActiveTab('workout')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workout'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Live Session</span>
          </button>
          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'cheatsheet'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Cheat Sheet
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'exercises'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Exercises
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'roadmap'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'calculator'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            RPE Calculator
          </button>
          <button
            onClick={() => setActiveTab('transformation')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'transformation'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Nutrition & Transformation
          </button>
        </nav>

        {/* Zone 3: Primary Action & Sound control */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Enable timer chimes'}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-700" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            onClick={onPrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            title="Print or export PDF (Ctrl+P / Cmd+P)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('workout')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Session</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer strip */}
      <div className="md:hidden flex items-center justify-around overflow-x-auto border-t border-slate-100 px-2 py-1.5 bg-slate-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'overview' ? 'text-blue-600 font-bold bg-white shadow-xs' : 'text-slate-600'
          }`}
        >
          Program
        </button>
        <button
          onClick={() => setActiveTab('workout')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'workout' ? 'text-blue-600 font-bold bg-white shadow-xs' : 'text-slate-600'
          }`}
        >
          Live Session
        </button>
        <button
          onClick={() => setActiveTab('cheatsheet')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'cheatsheet' ? 'text-blue-600 font-bold bg-white shadow-xs' : 'text-slate-600'
          }`}
        >
          Cheat Sheet
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'exercises' ? 'text-blue-600 font-bold bg-white shadow-xs' : 'text-slate-600'
          }`}
        >
          Exercises
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'roadmap' ? 'text-blue-600 font-bold bg-white shadow-xs' : 'text-slate-600'
          }`}
        >
          Roadmap
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'calculator' ? 'text-blue-600 font-bold bg-white shadow-xs' : 'text-slate-600'
          }`}
        >
          Calculator
        </button>
        <button
          onClick={() => setActiveTab('transformation')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'transformation' ? 'text-blue-600 font-bold bg-white shadow-xs' : 'text-slate-600'
          }`}
        >
          Nutrition / Tracker
        </button>
      </div>
    </header>
  );
};
