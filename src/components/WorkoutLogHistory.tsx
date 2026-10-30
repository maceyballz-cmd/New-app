import React, { useState, useEffect } from 'react';
import { History, Calendar, CheckCircle2, Trash2, FileText, ChevronDown } from 'lucide-react';
import { useSync } from '../context/SyncContext';

interface LogEntry {
  date: string;
  completedSets: number;
  totalSets: number;
  progressPercent: number;
  targetRpe: string;
  notes?: string;
  workoutName?: string;
  workoutIntensity?: string;
}

export const WorkoutLogHistory: React.FC = () => {
  const { clearWorkoutHistoryInCloud } = useSync();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('planche_history_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('planche_history_collapsed', String(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  useEffect(() => {
    const loadLogs = () => {
      const saved = localStorage.getItem('planche_workout_history');
      if (saved) {
        try {
          setLogs(JSON.parse(saved));
        } catch {
          // ignore
        }
      } else {
        setLogs([]);
      }
    };

    loadLogs();
    window.addEventListener('planche_history_updated', loadLogs);
    return () => {
      window.removeEventListener('planche_history_updated', loadLogs);
    };
  }, []);

  const [confirmClear, setConfirmClear] = useState(false);

  const clearHistory = () => {
    localStorage.removeItem('planche_workout_history');
    setLogs([]);
    setConfirmClear(false);
    clearWorkoutHistoryInCloud();
    window.dispatchEvent(new Event('planche_history_updated'));
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs transition-all ${isCollapsed ? 'space-y-3' : 'space-y-6'}`}>
      <div className={`flex items-center justify-between gap-4 ${isCollapsed ? '' : 'pb-4 border-b border-slate-100'}`}>
        <div
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="cursor-pointer select-none group flex-1"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
              Workout Session History
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {logs.length} {logs.length === 1 ? 'Session' : 'Sessions'}
            </span>
            {isCollapsed && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                Collapsed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your weekly consistency, logged reps, and live session feedback notes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {logs.length > 0 && !isCollapsed && (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-semibold">Confirm clear?</span>
                <button
                  onClick={clearHistory}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 cursor-pointer font-medium mr-1"
                title="Clear all saved workout session history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Logs</span>
              </button>
            )
          )}

          {/* Collapsible toggle arrow button */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer border border-slate-200 flex items-center gap-1.5 shadow-2xs select-none"
            title={isCollapsed ? 'Expand workout session history' : 'Collapse workout session history'}
            aria-label={isCollapsed ? 'Expand workout session history' : 'Collapse workout session history'}
          >
            <span className="hidden sm:inline">{isCollapsed ? 'Expand' : 'Collapse'}</span>
            <div className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
              <ChevronDown className="w-4 h-4 text-slate-600" />
            </div>
          </button>
        </div>
      </div>

      {/* Collapsed preview banner if collapsed and logs exist */}
      {isCollapsed && logs.length > 0 && (
        <div
          onClick={() => setIsCollapsed(false)}
          className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 cursor-pointer hover:text-blue-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Latest: <strong>{formatDate(logs[0].date)}</strong> ({logs[0].workoutIntensity || 'Submaximal'}) · {logs[0].completedSets}/{logs[0].totalSets} sets
            </span>
          </div>
          <span className="text-blue-600 font-semibold underline underline-offset-2">
            Click to expand ({logs.length} logged)
          </span>
        </div>
      )}

      {/* Expanded Logs Content */}
      {!isCollapsed && (
        <>
          {logs.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 stroke-1" />
              <p className="font-semibold text-slate-700">No logged workouts yet.</p>
              <p className="text-slate-400 mt-1">
                Hit "Start Session" in the top bar to track sets and rest times. Your progress and notes will be saved here automatically!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log, idx) => (
                <div key={idx} className="py-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{formatDate(log.date)}</span>
                          {log.workoutIntensity && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {log.workoutIntensity}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {log.workoutName || 'Submaximal Calisthenics Protocol'} · {log.targetRpe}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pl-7 sm:pl-0">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                        {log.completedSets} / {log.totalSets} Sets ({log.progressPercent}%)
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        Logged ✓
                      </span>
                    </div>
                  </div>

                  {/* Saved Session Notes */}
                  {log.notes && log.notes.trim().length > 0 && (
                    <div className="ml-7 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px] uppercase tracking-wide">
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span>Session Notes</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                        "{log.notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
