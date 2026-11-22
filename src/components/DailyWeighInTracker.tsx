import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Eraser,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import {
  WeeklyProgressEntry,
  calculateDateForWeekDay,
  calculateSevenDayAverage,
  normalizeDailyWeighIns,
} from '../data/transformationData';

const COLLAPSED_KEY = 'planche_daily_weighin_collapsed';
const UNIT_KEY = 'planche_daily_weighin_unit';
const KG_PER_LB = 0.45359237;

interface DailyWeighInTrackerProps {
  startDate: string;
  entries: WeeklyProgressEntry[];
  selectedWeek: number;
  onSelectWeek: (weekNum: number) => void;
  onDailyWeighInChange: (weekNum: number, dayIdx: number, valueLbs: string) => void;
  onApplyAvgToWeekWeight: (weekNum: number, avgLbs: string) => void;
  onClearWeekWeighIns: (weekNum: number) => void;
}

export const DailyWeighInTracker: React.FC<DailyWeighInTrackerProps> = ({
  startDate,
  entries,
  selectedWeek,
  onSelectWeek,
  onDailyWeighInChange,
  onApplyAvgToWeekWeight,
  onClearWeekWeighIns,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [unit, setUnit] = useState<'lbs' | 'kg'>(() => {
    try {
      return localStorage.getItem(UNIT_KEY) === 'kg' ? 'kg' : 'lbs';
    } catch {
      return 'lbs';
    }
  });

  const [focusedDayIdx, setFocusedDayIdx] = useState<number | null>(null);
  const [appliedWeekFlash, setAppliedWeekFlash] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(UNIT_KEY, unit);
    } catch {
      // ignore
    }
  }, [unit]);

  const currentEntry = useMemo(
    () => entries.find((e) => e.weekNumber === selectedWeek) || entries[0],
    [entries, selectedWeek]
  );

  const storedLbsArray = useMemo(
    () => normalizeDailyWeighIns(currentEntry?.dailyWeighIns),
    [currentEntry]
  );

  // Format stored lbs string into active display unit
  const formatLbsForUnit = (lbsStr: string, targetUnit: 'lbs' | 'kg'): string => {
    const trimmed = lbsStr.trim();
    if (!trimmed) return '';
    const num = parseFloat(trimmed);
    if (Number.isNaN(num) || num <= 0) return '';
    if (targetUnit === 'lbs') return trimmed;
    return (num * KG_PER_LB).toFixed(1);
  };

  // Local draft strings so typing decimals in kg never jumps the cursor
  const [localInputs, setLocalInputs] = useState<string[]>(() =>
    storedLbsArray.map((v) => formatLbsForUnit(v, unit))
  );

  useEffect(() => {
    if (focusedDayIdx === null) {
      setLocalInputs(storedLbsArray.map((v) => formatLbsForUnit(v, unit)));
    }
  }, [storedLbsArray, unit, selectedWeek, focusedDayIdx]);

  const handleDayInputChange = (dayIdx: number, rawInput: string) => {
    // Allow digits and a single decimal point
    const cleaned = rawInput.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;

    setLocalInputs((prev) => {
      const next = [...prev];
      next[dayIdx] = sanitized;
      return next;
    });

    if (sanitized.trim() === '') {
      onDailyWeighInChange(selectedWeek, dayIdx, '');
      return;
    }

    const parsed = parseFloat(sanitized);
    if (!Number.isNaN(parsed) && parsed > 0) {
      const lbsValue = unit === 'lbs' ? sanitized : (parsed / KG_PER_LB).toFixed(2);
      onDailyWeighInChange(selectedWeek, dayIdx, lbsValue);
    }
  };

  const handleUnitChange = (nextUnit: 'lbs' | 'kg') => {
    if (nextUnit === unit) return;
    setFocusedDayIdx(null);
    setUnit(nextUnit);
  };

  const statsLbs = useMemo(() => calculateSevenDayAverage(storedLbsArray), [storedLbsArray]);

  const prevWeekStatsLbs = useMemo(() => {
    if (selectedWeek <= 0) return null;
    const prevEntry = entries.find((e) => e.weekNumber === selectedWeek - 1);
    if (!prevEntry) return null;
    const prevAvg = calculateSevenDayAverage(prevEntry.dailyWeighIns);
    if (prevAvg.avg !== null) {
      return { avg: prevAvg.avg, label: prevEntry.weekLabel };
    }
    const manualPrev = parseFloat(prevEntry.weight);
    if (!Number.isNaN(manualPrev) && manualPrev > 0) {
      return { avg: manualPrev, label: prevEntry.weekLabel };
    }
    return null;
  }, [entries, selectedWeek]);

  // Day metadata for the 7 days of the selected week
  const dayMetaList = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        dayIdx: i,
        ...calculateDateForWeekDay(startDate, selectedWeek, i),
      })),
    [startDate, selectedWeek]
  );

  // Convert lbs numeric value to active unit for display
  const toDisplayNum = (lbsVal: number): number =>
    unit === 'kg' ? lbsVal * KG_PER_LB : lbsVal;

  const avgDisplay = statsLbs.avg !== null ? toDisplayNum(statsLbs.avg) : null;
  const minDisplay = statsLbs.min !== null ? toDisplayNum(statsLbs.min) : null;
  const maxDisplay = statsLbs.max !== null ? toDisplayNum(statsLbs.max) : null;

  const weeklyChangeDisplay = useMemo(() => {
    if (statsLbs.avg === null) return null;
    if (prevWeekStatsLbs) {
      return {
        delta: toDisplayNum(statsLbs.avg - prevWeekStatsLbs.avg),
        referenceLabel: `vs ${prevWeekStatsLbs.label}`,
      };
    }
    if (statsLbs.first !== null && statsLbs.last !== null && statsLbs.count >= 2) {
      return {
        delta: toDisplayNum(statsLbs.last - statsLbs.first),
        referenceLabel: 'Day 1 → latest',
      };
    }
    return null;
  }, [statsLbs, prevWeekStatsLbs, unit]);

  // Day-by-day numeric values in lbs for deltas and mini chart
  const numericLbsByDay = useMemo(
    () =>
      storedLbsArray.map((val) => {
        const n = parseFloat(val);
        return !Number.isNaN(n) && n > 0 ? n : null;
      }),
    [storedLbsArray]
  );

  const handleApplyToWeek = () => {
    if (statsLbs.avg === null) return;
    onApplyAvgToWeekWeight(selectedWeek, statsLbs.avg.toFixed(1));
    setAppliedWeekFlash(selectedWeek);
    setTimeout(() => setAppliedWeekFlash(null), 2000);
  };

  // Find week matching today's date if within the 13-week schedule
  const todayWeekNumber = useMemo(() => {
    try {
      const [y, m, d] = startDate.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.floor(
        (todayMidnight.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays < 13 * 7) {
        return Math.floor(diffDays / 7);
      }
      return null;
    } catch {
      return null;
    }
  }, [startDate]);

  return (
    <section
      aria-label="Daily AM Weigh-In and 7-Day Average"
      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="cursor-pointer select-none flex-1 min-w-[220px]"
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <Scale className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Daily AM Weigh-In &amp; 7-Day Average
            </h2>
            {statsLbs.avg !== null && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold tabular-nums">
                <span>
                  {currentEntry?.weekLabel}: {avgDisplay?.toFixed(1)} {unit} avg
                </span>
                <span className="text-blue-400">·</span>
                <span>{statsLbs.count}/7d</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log fasted morning weigh-ins across 7 days to compute a smooth 7-day average and track true weight trends.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-expanded={!isCollapsed}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
          <ChevronDown
            className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
              isCollapsed ? '' : 'rotate-180'
            }`}
          />
        </button>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Week Selector & Unit Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
              <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => onSelectWeek(Math.max(0, selectedWeek - 1))}
                  disabled={selectedWeek <= 0}
                  aria-label="Previous week"
                  className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  aria-label="Select tracking week"
                  value={selectedWeek}
                  onChange={(e) => onSelectWeek(Number(e.target.value))}
                  className="bg-transparent px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {entries.map((entry) => {
                    const wkStats = calculateSevenDayAverage(entry.dailyWeighIns);
                    const suffix =
                      wkStats.count > 0 && wkStats.avg !== null
                        ? ` — ${toDisplayNum(wkStats.avg).toFixed(1)} ${unit} (${wkStats.count}/7)`
                        : '';
                    return (
                      <option key={entry.weekNumber} value={entry.weekNumber}>
                        {entry.weekLabel} ({entry.date}){suffix}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={() => onSelectWeek(Math.min(12, selectedWeek + 1))}
                  disabled={selectedWeek >= 12}
                  aria-label="Next week"
                  className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {todayWeekNumber !== null && todayWeekNumber !== selectedWeek && (
                <button
                  type="button"
                  onClick={() => onSelectWeek(todayWeekNumber)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                >
                  Jump to Current Week
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {statsLbs.count > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFocusedDayIdx(null);
                    onClearWeekWeighIns(selectedWeek);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear Week</span>
                </button>
              )}

              {/* Unit Toggle */}
              <div
                role="group"
                aria-label="Weigh-in Unit"
                className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => handleUnitChange('lbs')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    unit === 'lbs'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  lbs
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange('kg')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    unit === 'kg'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  kg
                </button>
              </div>
            </div>
          </div>

          {/* 7-Day AM Input Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {dayMetaList.map((day) => {
              const currLbs = numericLbsByDay[day.dayIdx];
              // Find nearest previous logged day within this week for day-to-day delta
              let prevLbs: number | null = null;
              for (let j = day.dayIdx - 1; j >= 0; j--) {
                if (numericLbsByDay[j] !== null) {
                  prevLbs = numericLbsByDay[j];
                  break;
                }
              }
              const dayDelta =
                currLbs !== null && prevLbs !== null ? toDisplayNum(currLbs - prevLbs) : null;

              return (
                <div
                  key={day.dayIdx}
                  className={`rounded-xl p-2.5 border transition-colors ${
                    day.isToday
                      ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-500/20'
                      : currLbs !== null
                      ? 'bg-slate-50/90 border-slate-300/90'
                      : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-800">
                      Day {day.dayIdx + 1}
                    </span>
                    {day.isToday ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white">
                        Today
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        {day.weekday}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 mb-1.5 truncate">
                    {day.weekday ? `${day.weekday}, ${day.shortLabel}` : day.shortLabel}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`Day ${day.dayIdx + 1} AM weight (${unit})`}
                      value={localInputs[day.dayIdx] ?? ''}
                      onFocus={() => setFocusedDayIdx(day.dayIdx)}
                      onBlur={() => setFocusedDayIdx(null)}
                      onChange={(e) => handleDayInputChange(day.dayIdx, e.target.value)}
                      placeholder="—"
                      className="w-full px-2.5 py-1.5 pr-8 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none">
                      {unit}
                    </span>
                  </div>

                  <div className="mt-1.5 h-4 flex items-center justify-between text-[10px] tabular-nums">
                    {dayDelta !== null ? (
                      <span
                        className={`font-semibold ${
                          Math.abs(dayDelta) < 0.05
                            ? 'text-slate-400'
                            : dayDelta < 0
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {dayDelta > 0 ? `+${dayDelta.toFixed(1)}` : dayDelta.toFixed(1)} {unit}
                      </span>
                    ) : currLbs !== null ? (
                      <span className="text-slate-400">AM logged</span>
                    ) : (
                      <span className="text-slate-300">Fast AM</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calculated 7-Day Average Summary & Sync Action */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* 7-Day Avg KPI Card */}
            <div className="lg:col-span-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  Calculated 7-Day Average
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 tabular-nums">
                  {statsLbs.count} / 7 days
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
                  {avgDisplay !== null ? avgDisplay.toFixed(1) : '—'}
                </span>
                {avgDisplay !== null && (
                  <span className="text-sm font-semibold text-slate-600">{unit}</span>
                )}
                {statsLbs.avg !== null && (
                  <span className="ml-auto text-xs text-slate-500 tabular-nums">
                    {unit === 'lbs'
                      ? `${(statsLbs.avg * KG_PER_LB).toFixed(1)} kg`
                      : `${statsLbs.avg.toFixed(1)} lbs`}
                  </span>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-blue-200/70 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-600">
                  {currentEntry?.weight
                    ? `Week weight: ${currentEntry.weight} lbs`
                    : 'Week weight not set'}
                </span>
                <button
                  type="button"
                  disabled={statsLbs.avg === null}
                  onClick={handleApplyToWeek}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  {appliedWeekFlash === selectedWeek ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Applied</span>
                    </>
                  ) : (
                    <>
                      <span>Sync to {currentEntry?.weekLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Trend & Fluctuation Range + Visual 7-Day Plot */}
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Weekly Trend
                  </span>
                  {weeklyChangeDisplay !== null ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      {weeklyChangeDisplay.delta < -0.05 ? (
                        <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : weeklyChangeDisplay.delta > 0.05 ? (
                        <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          weeklyChangeDisplay.delta < -0.05
                            ? 'text-emerald-700'
                            : weeklyChangeDisplay.delta > 0.05
                            ? 'text-amber-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {weeklyChangeDisplay.delta > 0
                          ? `+${weeklyChangeDisplay.delta.toFixed(1)}`
                          : weeklyChangeDisplay.delta.toFixed(1)}{' '}
                        {unit}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm font-bold text-slate-400">—</div>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {weeklyChangeDisplay ? weeklyChangeDisplay.referenceLabel : 'Log 2+ days or prev week'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    7-Day Low / High
                  </span>
                  <div className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                    {minDisplay !== null && maxDisplay !== null
                      ? `${minDisplay.toFixed(1)} – ${maxDisplay.toFixed(1)} ${unit}`
                      : '—'}
                  </div>
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    {minDisplay !== null && maxDisplay !== null
                      ? `${(maxDisplay - minDisplay).toFixed(1)} ${unit} daily swing`
                      : 'Shows daily water variance'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Completion
                  </span>
                  <div className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                    {statsLbs.count} of 7 AM Weigh-Ins
                  </div>
                  <div className="mt-1.5 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((statsLbs.count / 7) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Clean 7-Day Visual Comparison Strip */}
              <div className="pt-2.5 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                  <span className="font-semibold text-slate-600">
                    Daily Variance vs 7-Day Average
                  </span>
                  {avgDisplay !== null && (
                    <span className="tabular-nums">
                      Avg line: <strong className="text-blue-700">{avgDisplay.toFixed(1)} {unit}</strong>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1.5 items-end h-14">
                  {dayMetaList.map((day) => {
                    const lbsVal = numericLbsByDay[day.dayIdx];
                    const val = lbsVal !== null ? toDisplayNum(lbsVal) : null;
                    const minRange = minDisplay !== null ? minDisplay - 0.5 : 0;
                    const maxRange = maxDisplay !== null ? maxDisplay + 0.5 : 1;
                    const span = Math.max(1, maxRange - minRange);
                    const pct =
                      val !== null ? Math.min(100, Math.max(18, ((val - minRange) / span) * 100)) : 0;
                    const isBelowAvg =
                      val !== null && avgDisplay !== null && val <= avgDisplay;

                    return (
                      <div key={day.dayIdx} className="flex flex-col items-center gap-1 h-full justify-end">
                        {val !== null ? (
                          <div
                            title={`Day ${day.dayIdx + 1}: ${val.toFixed(1)} ${unit}`}
                            className={`w-full rounded-t-md transition-all ${
                              isBelowAvg ? 'bg-emerald-500/80' : 'bg-blue-500/80'
                            }`}
                            style={{ height: `${pct}%` }}
                          />
                        ) : (
                          <div className="w-full h-1.5 rounded bg-slate-200/80" />
                        )}
                        <span className="text-[9px] font-semibold text-slate-500 tabular-nums">
                          D{day.dayIdx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
