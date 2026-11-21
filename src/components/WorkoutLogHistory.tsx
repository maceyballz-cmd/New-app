import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Calendar,
  CheckCircle2,
  Trash2,
  FileText,
  ChevronDown,
  Clock,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useSync } from '../context/SyncContext';
import {
  LogEntry,
  NO_UNUSUAL_SYMPTOMS_TAG,
  getToneBadgeClasses,
  getToneDotClasses,
  getPerformanceTone,
  getFatigueTone,
  getControlTone,
  getSkillTone,
} from '../data/workoutTrackingTypes';

const getEntryKey = (log: LogEntry, idx: number): string => {
  return log.id || `${log.date}_${log.workoutName || 'workout'}_${idx}`;
};

export const WorkoutLogHistory: React.FC = () => {
  const { clearWorkoutHistoryInCloud } = useSync();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
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
      if (!saved) {
        setLogs([]);
        return;
      }
      try {
        const parsed: LogEntry[] = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
          setLogs([]);
          return;
        }
        // Deduplicate by id while preserving order, then sort newest-first
        const seenIds = new Set<string>();
        const deduped = parsed.filter((item) => {
          if (!item) return false;
          if (item.id) {
            if (seenIds.has(item.id)) return false;
            seenIds.add(item.id);
          }
          return true;
        });
        deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLogs(deduped);
      } catch {
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
    setExpandedKeys({});
    setConfirmClear(false);
    clearWorkoutHistoryInCloud();
    window.dispatchEvent(new Event('planche_history_updated'));
  };

  const toggleEntryExpanded = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Historical insights derived strictly from recorded fields
  const insights = useMemo(() => {
    const ratedPerf = logs.filter((l) => Boolean(l.sessionPerformance));
    const goodCount = ratedPerf.filter((l) => l.sessionPerformance === 'Good').length;
    const avgCount = ratedPerf.filter((l) => l.sessionPerformance === 'Average').length;
    const poorCount = ratedPerf.filter((l) => l.sessionPerformance === 'Poor').length;

    const ratedFatigue = logs.filter((l) => Boolean(l.physicalFatigue));
    const lowFatigueCount = ratedFatigue.filter((l) => l.physicalFatigue === 'Low').length;
    const medFatigueCount = ratedFatigue.filter((l) => l.physicalFatigue === 'Medium').length;
    const highFatigueCount = ratedFatigue.filter((l) => l.physicalFatigue === 'High').length;

    const lowFatigueGood = logs.filter(
      (l) => l.physicalFatigue === 'Low' && l.sessionPerformance === 'Good'
    ).length;
    const lowFatigueBoth = logs.filter(
      (l) => l.physicalFatigue === 'Low' && Boolean(l.sessionPerformance)
    ).length;
    const elevatedFatigueGood = logs.filter(
      (l) =>
        (l.physicalFatigue === 'Medium' || l.physicalFatigue === 'High') &&
        l.sessionPerformance === 'Good'
    ).length;
    const elevatedFatigueBoth = logs.filter(
      (l) =>
        (l.physicalFatigue === 'Medium' || l.physicalFatigue === 'High') &&
        Boolean(l.sessionPerformance)
    ).length;

    const ratedSkills = logs.filter((l) => Boolean(l.skillPerformance));
    const skillAffectedCount = ratedSkills.filter(
      (l) => l.skillPerformance === 'Reduced' || l.skillPerformance === 'Unable'
    ).length;

    const ratedControl = logs.filter((l) => Boolean(l.neuromuscularControl));
    const controlAffectedCount = ratedControl.filter(
      (l) =>
        l.neuromuscularControl === 'Reduced' || l.neuromuscularControl === 'Severely Impaired'
    ).length;

    const symptomCounts: Record<string, number> = {};
    let sessionsWithSymptoms = 0;
    let sessionsNoSymptoms = 0;

    logs.forEach((l) => {
      if (!Array.isArray(l.symptoms) || l.symptoms.length === 0) return;
      const specific = l.symptoms.filter((s) => s !== NO_UNUSUAL_SYMPTOMS_TAG);
      if (specific.length > 0) {
        sessionsWithSymptoms += 1;
        specific.forEach((sym) => {
          symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
        });
      } else if (l.symptoms.includes(NO_UNUSUAL_SYMPTOMS_TAG)) {
        sessionsNoSymptoms += 1;
      }
    });

    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const hasAnyInsights =
      ratedPerf.length > 0 ||
      ratedFatigue.length > 0 ||
      ratedSkills.length > 0 ||
      ratedControl.length > 0 ||
      sessionsWithSymptoms > 0 ||
      sessionsNoSymptoms > 0;

    return {
      hasAnyInsights,
      ratedPerfCount: ratedPerf.length,
      goodCount,
      avgCount,
      poorCount,
      ratedFatigueCount: ratedFatigue.length,
      lowFatigueCount,
      medFatigueCount,
      highFatigueCount,
      lowFatigueGood,
      lowFatigueBoth,
      elevatedFatigueGood,
      elevatedFatigueBoth,
      ratedSkillsCount: ratedSkills.length,
      skillAffectedCount,
      ratedControlCount: ratedControl.length,
      controlAffectedCount,
      sessionsWithSymptoms,
      sessionsNoSymptoms,
      topSymptoms,
    };
  }, [logs]);

  return (
    <div
      className={`bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs transition-all ${
        isCollapsed ? 'space-y-3' : 'space-y-5'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between gap-4 ${
          isCollapsed ? '' : 'pb-4 border-b border-slate-100'
        }`}
      >
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
            Click any session to inspect performance, fatigue, neuromuscular control, symptoms, and notes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {logs.length > 0 && !isCollapsed && (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-semibold">Confirm clear?</span>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
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
              Latest: <strong>{logs[0].workoutName || 'Workout'}</strong> · {formatDate(logs[0].date)} ·{' '}
              {logs[0].completedSets}/{logs[0].totalSets} sets
              {logs[0].sessionPerformance ? ` · ${logs[0].sessionPerformance}` : ''}
            </span>
          </div>
          <span className="text-blue-600 font-semibold underline underline-offset-2">
            Click to expand ({logs.length} logged)
          </span>
        </div>
      )}

      {/* Expanded History Content */}
      {!isCollapsed && (
        <>
          {logs.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 stroke-1" />
              <p className="font-semibold text-slate-700">No logged workouts yet.</p>
              <p className="text-slate-400 mt-1">
                Log a workout on the calendar or finish a Live Session to track your progress, fatigue, and patterns here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Historical Insights (Strictly Data-Backed) */}
              {insights.hasAnyInsights && (
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Historical Insights</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {insights.ratedPerfCount > 0 && (
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Session Performance ({insights.ratedPerfCount})
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                          <span className="text-emerald-700">{insights.goodCount} Good</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-amber-700">{insights.avgCount} Avg</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-rose-700">{insights.poorCount} Poor</span>
                        </div>
                      </div>
                    )}

                    {insights.ratedFatigueCount > 0 && (
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Physical Fatigue ({insights.ratedFatigueCount})
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                          <span className="text-emerald-700">{insights.lowFatigueCount} Low</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-amber-700">{insights.medFatigueCount} Med</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-rose-700">{insights.highFatigueCount} High</span>
                        </div>
                        {(insights.lowFatigueBoth > 0 || insights.elevatedFatigueBoth > 0) && (
                          <div className="text-[10px] text-slate-500">
                            {insights.lowFatigueBoth > 0 &&
                              `Low fatigue: ${insights.lowFatigueGood}/${insights.lowFatigueBoth} Good`}
                            {insights.lowFatigueBoth > 0 && insights.elevatedFatigueBoth > 0 && ' · '}
                            {insights.elevatedFatigueBoth > 0 &&
                              `Med/High: ${insights.elevatedFatigueGood}/${insights.elevatedFatigueBoth} Good`}
                          </div>
                        )}
                      </div>
                    )}

                    {(insights.ratedSkillsCount > 0 || insights.ratedControlCount > 0) && (
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Control &amp; Skills
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 space-y-0.5">
                          {insights.ratedControlCount > 0 && (
                            <div>
                              Control affected: {insights.controlAffectedCount}/{insights.ratedControlCount}
                            </div>
                          )}
                          {insights.ratedSkillsCount > 0 && (
                            <div>
                              Skills reduced/unable: {insights.skillAffectedCount}/{insights.ratedSkillsCount}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(insights.sessionsWithSymptoms > 0 || insights.sessionsNoSymptoms > 0) && (
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Symptom Patterns
                        </div>
                        {insights.topSymptoms.length > 0 ? (
                          <div className="text-[11px] font-semibold text-amber-800 leading-snug">
                            {insights.topSymptoms.map(([sym, count], i) => (
                              <span key={sym}>
                                {sym} ({count})
                                {i < insights.topSymptoms.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] font-semibold text-emerald-700">
                            No unusual symptoms in {insights.sessionsNoSymptoms} logged{' '}
                            {insights.sessionsNoSymptoms === 1 ? 'session' : 'sessions'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compact Expandable Workout History List */}
              <div className="space-y-2.5">
                {logs.map((log, idx) => {
                  const key = getEntryKey(log, idx);
                  const isExpanded = Boolean(expandedKeys[key]);
                  const perfTone = getPerformanceTone(log.sessionPerformance);
                  const fatigueTone = getFatigueTone(log.physicalFatigue);
                  const controlTone = getControlTone(log.neuromuscularControl);
                  const skillTone = getSkillTone(log.skillPerformance);

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-colors hover:border-slate-300"
                    >
                      {/* Compact Summary Row (Clickable) */}
                      <button
                        type="button"
                        onClick={() => toggleEntryExpanded(key)}
                        aria-expanded={isExpanded}
                        className="w-full text-left px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {log.workoutName || 'Calisthenics Training Session'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span>{formatDate(log.date)}</span>
                              {typeof log.durationMinutes === 'number' && log.durationMinutes > 0 && (
                                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {log.durationMinutes} min
                                </span>
                              )}
                              <span className="font-mono font-semibold text-slate-700">
                                {log.completedSets} / {log.totalSets} sets
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 pl-7 sm:pl-0 shrink-0">
                          {log.sessionPerformance && perfTone && (
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${getToneBadgeClasses(
                                perfTone
                              )}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${getToneDotClasses(perfTone)}`} />
                              {log.sessionPerformance}
                            </span>
                          )}

                          {log.physicalFatigue && fatigueTone && (
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${getToneBadgeClasses(
                                fatigueTone
                              )}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${getToneDotClasses(fatigueTone)}`} />
                              Fatigue: {log.physicalFatigue}
                            </span>
                          )}

                          {!log.sessionPerformance && !log.physicalFatigue && (
                            <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {log.progressPercent}%
                            </span>
                          )}

                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-1 ${
                              isExpanded ? 'rotate-180 text-blue-600' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Expanded Workout Detail Drawer */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                          {/* Workout Details & RPE */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Intensity
                              </div>
                              <div className="font-semibold text-slate-800 mt-0.5 truncate" title={log.workoutIntensity}>
                                {log.workoutIntensity || 'Standard'}
                              </div>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Effort / RPE
                              </div>
                              <div className="font-semibold text-slate-800 mt-0.5 truncate" title={log.targetRpe}>
                                {log.targetRpe || '—'}
                              </div>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Sets Completed
                              </div>
                              <div className="font-semibold text-slate-800 mt-0.5">
                                {log.completedSets} / {log.totalSets} ({log.progressPercent}%)
                              </div>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Duration
                              </div>
                              <div className="font-semibold text-slate-800 mt-0.5">
                                {typeof log.durationMinutes === 'number' && log.durationMinutes > 0
                                  ? `${log.durationMinutes} min`
                                  : 'Not recorded'}
                              </div>
                            </div>
                          </div>

                          {/* Session Performance, Physical Fatigue, Neuromuscular Control, Skill Performance */}
                          {(log.sessionPerformance ||
                            log.physicalFatigue ||
                            log.neuromuscularControl ||
                            log.skillPerformance) && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Session Performance
                                </div>
                                <div className="mt-1">
                                  {log.sessionPerformance && perfTone ? (
                                    <span
                                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getToneBadgeClasses(
                                        perfTone
                                      )}`}
                                    >
                                      {log.sessionPerformance}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Not recorded</span>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Physical Fatigue
                                </div>
                                <div className="mt-1">
                                  {log.physicalFatigue && fatigueTone ? (
                                    <span
                                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getToneBadgeClasses(
                                        fatigueTone
                                      )}`}
                                    >
                                      {log.physicalFatigue}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Not recorded</span>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Neuromuscular Control
                                </div>
                                <div className="mt-1">
                                  {log.neuromuscularControl && controlTone ? (
                                    <span
                                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getToneBadgeClasses(
                                        controlTone
                                      )}`}
                                    >
                                      {log.neuromuscularControl}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Not recorded</span>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Skill Performance
                                </div>
                                <div className="mt-1">
                                  {log.skillPerformance && skillTone ? (
                                    <span
                                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getToneBadgeClasses(
                                        skillTone
                                      )}`}
                                    >
                                      {log.skillPerformance}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Not recorded</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Exercises Performed */}
                          {log.exercises && log.exercises.trim().length > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                <Activity className="w-3 h-3 text-blue-600" />
                                <span>Exercises Performed</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">{log.exercises}</p>
                            </div>
                          )}

                          {/* Symptoms Recorded */}
                          {Array.isArray(log.symptoms) && log.symptoms.length > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Symptoms Recorded
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {log.symptoms.map((sym) => (
                                  <span
                                    key={sym}
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                      sym === NO_UNUSUAL_SYMPTOMS_TAG
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {sym}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Athlete Notes */}
                          {log.notes && log.notes.trim().length > 0 && (
                            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[10px] uppercase tracking-wider">
                                <FileText className="w-3 h-3 text-blue-600" />
                                <span>Athlete Notes</span>
                              </div>
                              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                                "{log.notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
