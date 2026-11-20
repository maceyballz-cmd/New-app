import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Flame,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  Check,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';
import { WeeklyProgressEntry } from '../data/transformationData';

export type LifestyleKey =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export type PaceKey = 'conservative' | 'standard' | 'aggressive';
export type CalorieMode = 'even' | 'cycling';
export type CyclingSpreadKey = 'moderate' | 'standard' | 'high';

interface LifestyleOption {
  key: LifestyleKey;
  label: string;
  shortDesc: string;
  stepsHint: string;
  kcalPerLb: number;
}

const LIFESTYLE_OPTIONS: LifestyleOption[] = [
  {
    key: 'sedentary',
    label: 'Sedentary',
    shortDesc: 'Desk job, minimal daily movement',
    stepsHint: '< 4,000 steps/day',
    kcalPerLb: 12,
  },
  {
    key: 'lightly_active',
    label: 'Lightly Active',
    shortDesc: 'Light walking, 1–2 workouts/wk',
    stepsHint: '4,000–7,000 steps/day',
    kcalPerLb: 13.5,
  },
  {
    key: 'moderately_active',
    label: 'Moderately Active',
    shortDesc: 'Active routine or 3–4 workouts/wk',
    stepsHint: '7,000–10,000 steps/day',
    kcalPerLb: 15,
  },
  {
    key: 'very_active',
    label: 'Very Active',
    shortDesc: 'Physical work or 5–6 intense sessions/wk',
    stepsHint: '10,000–14,000 steps/day',
    kcalPerLb: 16.5,
  },
  {
    key: 'extra_active',
    label: 'Extra Active',
    shortDesc: 'Heavy physical job + daily training',
    stepsHint: '14,000+ steps/day',
    kcalPerLb: 18,
  },
];

interface PaceOption {
  key: PaceKey;
  label: string;
  fatLossDelta: number;
  gainDelta: number;
  lossRateLabel: string;
  gainRateLabel: string;
}

const PACE_OPTIONS: PaceOption[] = [
  {
    key: 'conservative',
    label: 'Conservative',
    fatLossDelta: 300,
    gainDelta: 200,
    lossRateLabel: '~0.6 lb / wk',
    gainRateLabel: '~0.4 lb / wk',
  },
  {
    key: 'standard',
    label: 'Standard',
    fatLossDelta: 500,
    gainDelta: 300,
    lossRateLabel: '~1.0 lb / wk',
    gainRateLabel: '~0.6 lb / wk',
  },
  {
    key: 'aggressive',
    label: 'Aggressive',
    fatLossDelta: 750,
    gainDelta: 500,
    lossRateLabel: '~1.5 lb / wk',
    gainRateLabel: '~1.0 lb / wk',
  },
];

interface SpreadOption {
  key: CyclingSpreadKey;
  label: string;
  boostRatio: number;
  hint: string;
}

const SPREAD_OPTIONS: SpreadOption[] = [
  {
    key: 'moderate',
    label: 'Gentle (+15%)',
    boostRatio: 0.15,
    hint: '+15% on training days',
  },
  {
    key: 'standard',
    label: 'Standard (+25%)',
    boostRatio: 0.25,
    hint: '+25% on training days',
  },
  {
    key: 'high',
    label: 'Strong (+35%)',
    boostRatio: 0.35,
    hint: '+35% on training days',
  },
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DEFAULT_TRAINING_SCHEDULE = [true, true, false, true, true, false, false];

const PREFS_STORAGE_KEY = 'planche_calorie_calc_prefs';

interface StoredCalcPrefs {
  weightInput: string;
  unit: 'lbs' | 'kg';
  lifestyle: LifestyleKey;
  pace: PaceKey;
  collapsed?: boolean;
  calorieMode?: CalorieMode;
  cyclingSpread?: CyclingSpreadKey;
  trainingSchedule?: boolean[];
}

interface CycledGoalTargets {
  dailyAvg: number;
  highDay: number;
  lowDay: number;
  weeklyTotal: number;
  isFloored: boolean;
}

function computeCycledTargets(
  baseDaily: number,
  trainingDays: number,
  boostRatio: number,
  isCycling: boolean
): CycledGoalTargets {
  const safeDaily = Math.max(1200, baseDaily);
  if (!isCycling) {
    return {
      dailyAvg: safeDaily,
      highDay: safeDaily,
      lowDay: safeDaily,
      weeklyTotal: safeDaily * 7,
      isFloored: baseDaily < 1200,
    };
  }

  const T = Math.min(6, Math.max(1, trainingDays));
  const R = 7 - T;
  const targetWeekly = safeDaily * 7;

  const lowRaw = targetWeekly / (T * (1 + boostRatio) + R);
  const isLowFloored = lowRaw < 1200;
  const lowDay = Math.max(1200, Math.round(lowRaw / 10) * 10);

  const highRaw = (targetWeekly - R * lowDay) / T;
  const highDay = Math.max(1200, Math.round(highRaw / 10) * 10);

  const weeklyTotal = T * highDay + R * lowDay;
  const dailyAvg = Math.round(weeklyTotal / 7);

  return {
    dailyAvg,
    highDay,
    lowDay,
    weeklyTotal,
    isFloored: baseDaily < 1200 || isLowFloored,
  };
}

interface CalorieCalculatorProps {
  initialWeightLbs?: number;
  entries?: WeeklyProgressEntry[];
  onApplyCalories?: (
    weekNumber: number,
    trainingDayCalories: number,
    restDayCalories: number,
    goalLabel: string
  ) => void;
}

export const CalorieCalculator: React.FC<CalorieCalculatorProps> = ({
  initialWeightLbs,
  entries = [],
  onApplyCalories,
}) => {
  const readPrefs = (): Partial<StoredCalcPrefs> => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const [unit, setUnit] = useState<'lbs' | 'kg'>(() => {
    const p = readPrefs();
    return p.unit === 'kg' || p.unit === 'lbs' ? p.unit : 'lbs';
  });

  const [weightInput, setWeightInput] = useState<string>(() => {
    const p = readPrefs();
    if (p.weightInput && parseFloat(p.weightInput) > 0) {
      return p.weightInput;
    }
    return initialWeightLbs && initialWeightLbs > 0
      ? String(Math.round(initialWeightLbs * 10) / 10)
      : '185';
  });

  const [lifestyle, setLifestyle] = useState<LifestyleKey>(() => {
    const p = readPrefs();
    if (p.lifestyle && LIFESTYLE_OPTIONS.some((o) => o.key === p.lifestyle)) {
      return p.lifestyle;
    }
    return 'moderately_active';
  });

  const [pace, setPace] = useState<PaceKey>(() => {
    const p = readPrefs();
    if (p.pace && PACE_OPTIONS.some((o) => o.key === p.pace)) {
      return p.pace;
    }
    return 'standard';
  });

  const [calorieMode, setCalorieMode] = useState<CalorieMode>(() => {
    const p = readPrefs();
    return p.calorieMode === 'cycling' ? 'cycling' : 'even';
  });

  const [cyclingSpread, setCyclingSpread] = useState<CyclingSpreadKey>(() => {
    const p = readPrefs();
    if (p.cyclingSpread && SPREAD_OPTIONS.some((s) => s.key === p.cyclingSpread)) {
      return p.cyclingSpread;
    }
    return 'standard';
  });

  const [trainingSchedule, setTrainingSchedule] = useState<boolean[]>(() => {
    const p = readPrefs();
    if (Array.isArray(p.trainingSchedule) && p.trainingSchedule.length === 7) {
      const count = p.trainingSchedule.filter(Boolean).length;
      if (count >= 1 && count <= 6) {
        return p.trainingSchedule.map(Boolean);
      }
    }
    return DEFAULT_TRAINING_SCHEDULE;
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const p = readPrefs();
    return Boolean(p.collapsed);
  });

  const [selectedApplyWeek, setSelectedApplyWeek] = useState<number>(0);
  const [appliedGoal, setAppliedGoal] = useState<string | null>(null);

  // Persist user preferences locally
  useEffect(() => {
    try {
      const prefs: StoredCalcPrefs = {
        weightInput,
        unit,
        lifestyle,
        pace,
        collapsed: isCollapsed,
        calorieMode,
        cyclingSpread,
        trainingSchedule,
      };
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [
    weightInput,
    unit,
    lifestyle,
    pace,
    isCollapsed,
    calorieMode,
    cyclingSpread,
    trainingSchedule,
  ]);

  const handleUnitSwitch = (nextUnit: 'lbs' | 'kg') => {
    if (nextUnit === unit) return;
    const currentNumeric = parseFloat(weightInput);
    if (!Number.isNaN(currentNumeric) && currentNumeric > 0) {
      const converted =
        nextUnit === 'kg'
          ? currentNumeric * 0.45359237
          : currentNumeric / 0.45359237;
      setWeightInput(String(Math.round(converted * 10) / 10));
    }
    setUnit(nextUnit);
  };

  const handleSyncTrackerWeight = () => {
    if (!initialWeightLbs || initialWeightLbs <= 0) return;
    const targetVal =
      unit === 'kg' ? initialWeightLbs * 0.45359237 : initialWeightLbs;
    setWeightInput(String(Math.round(targetVal * 10) / 10));
  };

  const toggleTrainingDay = (dayIdx: number) => {
    setTrainingSchedule((prev) => {
      const next = [...prev];
      next[dayIdx] = !next[dayIdx];
      const nextCount = next.filter(Boolean).length;
      // Keep between 1 and 6 training days so High/Low cycling always has both day types
      if (nextCount < 1 || nextCount > 6) {
        return prev;
      }
      return next;
    });
  };

  const trainingDaysCount = useMemo(
    () => trainingSchedule.filter(Boolean).length,
    [trainingSchedule]
  );
  const restDaysCount = 7 - trainingDaysCount;

  const parsedWeight = parseFloat(weightInput);
  const isValidWeight =
    !Number.isNaN(parsedWeight) && parsedWeight >= 40 && parsedWeight <= 700;

  const weightInLbs = useMemo(() => {
    if (!isValidWeight) return 0;
    return unit === 'kg' ? parsedWeight / 0.45359237 : parsedWeight;
  }, [parsedWeight, unit, isValidWeight]);

  const selectedLifestyle = useMemo(
    () =>
      LIFESTYLE_OPTIONS.find((o) => o.key === lifestyle) ||
      LIFESTYLE_OPTIONS[2],
    [lifestyle]
  );

  const selectedPace = useMemo(
    () => PACE_OPTIONS.find((p) => p.key === pace) || PACE_OPTIONS[1],
    [pace]
  );

  const selectedSpread = useMemo(
    () => SPREAD_OPTIONS.find((s) => s.key === cyclingSpread) || SPREAD_OPTIONS[1],
    [cyclingSpread]
  );

  const isCycling = calorieMode === 'cycling';

  // Core daily and weekly calorie calculations (supports both Even Daily & High/Low Cycling)
  const results = useMemo(() => {
    if (!isValidWeight || weightInLbs <= 0) {
      return null;
    }

    const rawMaintenanceDaily = weightInLbs * selectedLifestyle.kcalPerLb;
    const baseMaintDaily = Math.round(rawMaintenanceDaily / 10) * 10;
    const baseLossDaily = baseMaintDaily - selectedPace.fatLossDelta;
    const baseGainDaily = baseMaintDaily + selectedPace.gainDelta;

    const maintenance = computeCycledTargets(
      baseMaintDaily,
      trainingDaysCount,
      selectedSpread.boostRatio,
      isCycling
    );
    const fatLoss = computeCycledTargets(
      baseLossDaily,
      trainingDaysCount,
      selectedSpread.boostRatio,
      isCycling
    );
    const gain = computeCycledTargets(
      baseGainDaily,
      trainingDaysCount,
      selectedSpread.boostRatio,
      isCycling
    );

    const fatLossWeeklyDelta = fatLoss.weeklyTotal - maintenance.weeklyTotal;
    const gainWeeklyDelta = gain.weeklyTotal - maintenance.weeklyTotal;

    const proteinLow = Math.round(weightInLbs * 0.8);
    const proteinHigh = Math.round(weightInLbs * 1.0);

    return {
      maintenance,
      fatLoss,
      gain,
      fatLossWeeklyDelta,
      gainWeeklyDelta,
      proteinLow,
      proteinHigh,
    };
  }, [
    isValidWeight,
    weightInLbs,
    selectedLifestyle,
    selectedPace,
    trainingDaysCount,
    selectedSpread,
    isCycling,
  ]);

  const formatNum = (val: number) => val.toLocaleString('en-US');

  const handleApply = (
    trainingDayCalories: number,
    restDayCalories: number,
    goalLabel: string
  ) => {
    if (!onApplyCalories) return;
    onApplyCalories(
      selectedApplyWeek,
      trainingDayCalories,
      restDayCalories,
      goalLabel
    );
    setAppliedGoal(goalLabel);
    setTimeout(() => {
      setAppliedGoal(null);
    }, 2000);
  };

  const trackerWeightInCurrentUnit =
    initialWeightLbs && initialWeightLbs > 0
      ? Math.round(
          (unit === 'kg'
            ? initialWeightLbs * 0.45359237
            : initialWeightLbs) * 10
        ) / 10
      : null;

  return (
    <section
      aria-label="Calorie Calculator"
      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="cursor-pointer select-none flex-1 min-w-[220px]"
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Daily &amp; Weekly Calorie Calculator
            </h2>
            {isCycling && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                <ArrowUpDown className="w-3 h-3" />
                <span>High/Low Cycling ({trainingDaysCount}T / {restDaysCount}R)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter body weight and activity level to calculate daily and 7-day weekly targets for maintenance, fat loss, and lean gain—with optional High (training) / Low (rest) calorie cycling.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isCollapsed && results && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 tabular-nums mr-1">
              {isCycling ? (
                <>
                  <span>
                    Maint:{' '}
                    <strong className="text-slate-900">
                      {formatNum(results.maintenance.highDay)}/{formatNum(results.maintenance.lowDay)}
                    </strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>
                    Cut:{' '}
                    <strong className="text-emerald-700">
                      {formatNum(results.fatLoss.highDay)}/{formatNum(results.fatLoss.lowDay)}
                    </strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>
                    Gain:{' '}
                    <strong className="text-blue-700">
                      {formatNum(results.gain.highDay)}/{formatNum(results.gain.lowDay)}
                    </strong>
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Maint:{' '}
                    <strong className="text-slate-900">
                      {formatNum(results.maintenance.dailyAvg)}
                    </strong>
                    /d
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>
                    Cut:{' '}
                    <strong className="text-emerald-700">
                      {formatNum(results.fatLoss.dailyAvg)}
                    </strong>
                    /d
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>
                    Gain:{' '}
                    <strong className="text-blue-700">
                      {formatNum(results.gain.dailyAvg)}
                    </strong>
                    /d
                  </span>
                </>
              )}
            </div>
          )}

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
      </div>

      {/* Calculator Body */}
      {!isCollapsed && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Controls Row: Weight Input + Pace + Cycling Toggle + Activity Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Weight Input, Pace & Cycling Config (4 cols) */}
            <div className="lg:col-span-4 space-y-4 bg-slate-50/80 border border-slate-200 rounded-xl p-4">
              {/* Weight + Unit */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="calc-weight-input"
                    className="text-xs font-bold text-slate-800"
                  >
                    Body Weight
                  </label>

                  {/* Segmented Unit Toggle */}
                  <div
                    role="group"
                    aria-label="Weight Unit"
                    className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-lg"
                  >
                    <button
                      type="button"
                      onClick={() => handleUnitSwitch('lbs')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        unit === 'lbs'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      lbs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnitSwitch('kg')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        unit === 'kg'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      kg
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="calc-weight-input"
                    type="number"
                    min={unit === 'kg' ? 25 : 55}
                    max={unit === 'kg' ? 300 : 660}
                    step="0.5"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder={unit === 'kg' ? '84' : '185'}
                    className="w-full px-3.5 py-2.5 pr-12 text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    {unit}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 gap-2">
                  {isValidWeight ? (
                    <span className="tabular-nums">
                      {unit === 'lbs'
                        ? `${(parsedWeight * 0.45359237).toFixed(1)} kg`
                        : `${(parsedWeight / 0.45359237).toFixed(1)} lbs`}
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      Protein:{' '}
                      {results
                        ? `${results.proteinLow}–${results.proteinHigh}g/d`
                        : '—'}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-medium">
                      Enter a valid weight (
                      {unit === 'kg' ? '25–300 kg' : '55–660 lbs'})
                    </span>
                  )}

                  {trackerWeightInCurrentUnit &&
                    Math.abs(trackerWeightInCurrentUnit - (parsedWeight || 0)) >=
                      0.2 && (
                      <button
                        type="button"
                        onClick={handleSyncTrackerWeight}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap shrink-0"
                        title="Use current weight from your 12-week tracker"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>
                          Use {trackerWeightInCurrentUnit} {unit}
                        </span>
                      </button>
                    )}
                </div>
              </div>

              {/* Rate / Pace Selector */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Cut / Gain Pace
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {PACE_OPTIONS.map((opt) => {
                    const active = pace === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPace(opt.key)}
                        className={`px-2 py-2 rounded-lg text-center border transition-colors cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold whitespace-nowrap">
                          {opt.label}
                        </div>
                        <div
                          className={`text-[10px] tabular-nums mt-0.5 ${
                            active ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          -{opt.fatLossDelta} / +{opt.gainDelta}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calorie Cycling Toggle & High/Low Schedule */}
              <div className="pt-3 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Calorie Strategy
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isCycling ? 'High / Low split' : 'Equal every day'}
                  </span>
                </div>

                <div
                  role="group"
                  aria-label="Calorie Strategy"
                  className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => setCalorieMode('even')}
                    aria-pressed={!isCycling}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      !isCycling
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Even Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalorieMode('cycling')}
                    aria-pressed={isCycling}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      isCycling
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
                    <span>Calorie Cycling</span>
                  </button>
                </div>

                {isCycling && (
                  <div className="space-y-3 bg-white border border-slate-200 rounded-lg p-3">
                    {/* Interactive 7-day Training vs Rest Picker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700">
                          High Days (Training)
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 tabular-nums">
                          {trainingDaysCount} Train · {restDaysCount} Rest
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {WEEKDAY_LABELS.map((day, idx) => {
                          const isTrain = trainingSchedule[idx];
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleTrainingDay(idx)}
                              aria-pressed={isTrain}
                              title={
                                isTrain
                                  ? `${day}: High Calorie (Training Day) — tap to switch to Rest Day`
                                  : `${day}: Low Calorie (Rest Day) — tap to switch to Training Day`
                              }
                              className={`py-1.5 rounded-md border text-center transition-colors cursor-pointer ${
                                isTrain
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <div className="text-[10px] font-bold leading-tight">
                                {day}
                              </div>
                              <div
                                className={`text-[9px] font-medium leading-tight mt-0.5 ${
                                  isTrain ? 'text-blue-100' : 'text-slate-400'
                                }`}
                              >
                                {isTrain ? 'High' : 'Low'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Tap days to set your weekly High (training) &amp; Low (rest) schedule (1–6 training days).
                      </p>
                    </div>

                    {/* High / Low Spread Selector */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700">
                          High / Low Spread
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {selectedSpread.hint}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {SPREAD_OPTIONS.map((opt) => {
                          const active = cyclingSpread === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setCyclingSpread(opt.key)}
                              className={`px-1.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                active
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              +{Math.round(opt.boostRatio * 100)}%
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lifestyle Selector + Results (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="calc-lifestyle-select"
                  className="text-xs font-bold text-slate-800"
                >
                  Lifestyle &amp; Activity Level
                </label>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  Selected multiplier:{' '}
                  <strong className="text-slate-800">
                    {selectedLifestyle.kcalPerLb} kcal/lb
                  </strong>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span>
                    {(selectedLifestyle.kcalPerLb * 2.20462).toFixed(1)} kcal/kg
                  </span>
                </span>
              </div>

              {/* Accessible Dropdown for compact / keyboard selection */}
              <select
                id="calc-lifestyle-select"
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value as LifestyleKey)}
                className="sm:hidden w-full px-3 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {LIFESTYLE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} — {opt.shortDesc} ({opt.stepsHint})
                  </option>
                ))}
              </select>

              {/* Desktop/Tablet Interactive Lifestyle Selector Grid */}
              <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
                {LIFESTYLE_OPTIONS.map((opt) => {
                  const isSelected = lifestyle === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setLifestyle(opt.key)}
                      aria-pressed={isSelected}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[112px] ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/30'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-blue-900' : 'text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {opt.shortDesc}
                        </p>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-medium text-slate-500 tabular-nums">
                        <span>{opt.stepsHint}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile hint for selected lifestyle */}
              <div className="sm:hidden text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <strong className="text-slate-800">
                  {selectedLifestyle.label}:
                </strong>{' '}
                {selectedLifestyle.shortDesc} ({selectedLifestyle.stepsHint})
              </div>

              {/* Results Grid: Maintenance, Fat Loss, Muscle Gain */}
              {results ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  {/* 1. MAINTENANCE */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                          <Flame className="w-4 h-4 text-slate-600" />
                          <span>Maintenance</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                          {isCycling ? 'High / Low Cycle' : 'TDEE Baseline'}
                        </span>
                      </div>

                      {isCycling ? (
                        <div className="space-y-2.5 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200/80">
                              <span className="text-[10px] font-semibold text-blue-700 block">
                                High · Train ({trainingDaysCount}d)
                              </span>
                              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight mt-0.5">
                                {formatNum(results.maintenance.highDay)}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                kcal / day
                              </span>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200/80">
                              <span className="text-[10px] font-semibold text-slate-600 block">
                                Low · Rest ({restDaysCount}d)
                              </span>
                              <div className="text-xl font-bold text-slate-800 tabular-nums tracking-tight mt-0.5">
                                {formatNum(results.maintenance.lowDay)}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                kcal / day
                              </span>
                            </div>
                          </div>
                          <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/70 text-xs tabular-nums">
                            <span className="text-slate-500">Weekly Total</span>
                            <span className="font-bold text-slate-900">
                              {formatNum(results.maintenance.weeklyTotal)} kcal
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[11px] text-slate-500 block">
                              Daily Calories
                            </span>
                            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                              {formatNum(results.maintenance.dailyAvg)}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              kcal / day
                            </span>
                          </div>

                          <div className="pl-2 border-l border-slate-200">
                            <span className="text-[11px] text-slate-500 block">
                              Weekly Calories
                            </span>
                            <div className="text-lg font-bold text-slate-800 tabular-nums tracking-tight mt-0.5">
                              {formatNum(results.maintenance.weeklyTotal)}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              kcal / week
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="tabular-nums">
                        {isCycling
                          ? `Avg ${formatNum(results.maintenance.dailyAvg)}/d · Weight stable`
                          : '0 kcal/wk · Weight stable'}
                      </span>
                      {onApplyCalories && (
                        <button
                          type="button"
                          onClick={() =>
                            handleApply(
                              results.maintenance.highDay,
                              results.maintenance.lowDay,
                              'Maintenance'
                            )
                          }
                          className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {appliedGoal === 'Maintenance' ? 'Applied' : 'Apply'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. FAT LOSS */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                          <TrendingDown className="w-4 h-4 text-emerald-600" />
                          <span>Fat Loss</span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-700 tabular-nums">
                          -{selectedPace.fatLossDelta} kcal/day avg
                        </span>
                      </div>

                      {isCycling ? (
                        <div className="space-y-2.5 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded-lg p-2.5 border border-emerald-200">
                              <span className="text-[10px] font-semibold text-emerald-700 block">
                                High · Train ({trainingDaysCount}d)
                              </span>
                              <div className="text-xl font-bold text-emerald-950 tabular-nums tracking-tight mt-0.5">
                                {formatNum(results.fatLoss.highDay)}
                              </div>
                              <span className="text-[10px] text-emerald-800/70">
                                kcal / day
                              </span>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-emerald-200">
                              <span className="text-[10px] font-semibold text-emerald-800/80 block">
                                Low · Rest ({restDaysCount}d)
                              </span>
                              <div className="text-xl font-bold text-emerald-900 tabular-nums tracking-tight mt-0.5">
                                {formatNum(results.fatLoss.lowDay)}
                              </div>
                              <span className="text-[10px] text-emerald-800/70">
                                kcal / day
                              </span>
                            </div>
                          </div>
                          <div className="flex items-baseline justify-between pt-1 border-t border-emerald-200/70 text-xs tabular-nums">
                            <span className="text-emerald-800/80">Weekly Total</span>
                            <span className="font-bold text-emerald-950">
                              {formatNum(results.fatLoss.weeklyTotal)} kcal
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[11px] text-emerald-800/80 block">
                              Daily Calories
                            </span>
                            <div className="text-2xl font-bold text-emerald-900 tabular-nums tracking-tight">
                              {formatNum(results.fatLoss.dailyAvg)}
                            </div>
                            <span className="text-[11px] text-emerald-800/80">
                              kcal / day
                            </span>
                          </div>

                          <div className="pl-2 border-l border-emerald-200">
                            <span className="text-[11px] text-emerald-800/80 block">
                              Weekly Calories
                            </span>
                            <div className="text-lg font-bold text-emerald-800 tabular-nums tracking-tight mt-0.5">
                              {formatNum(results.fatLoss.weeklyTotal)}
                            </div>
                            <span className="text-[11px] text-emerald-800/80">
                              kcal / week
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-emerald-200/70 flex items-center justify-between gap-2 text-[11px] text-emerald-800">
                      <span className="tabular-nums">
                        {formatNum(results.fatLossWeeklyDelta)} kcal/wk ·{' '}
                        {selectedPace.lossRateLabel}
                        {results.fatLoss.isFloored ? ' (1,200 floor)' : ''}
                      </span>
                      {onApplyCalories && (
                        <button
                          type="button"
                          onClick={() =>
                            handleApply(
                              results.fatLoss.highDay,
                              results.fatLoss.lowDay,
                              'Fat Loss'
                            )
                          }
                          className="font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {appliedGoal === 'Fat Loss' ? 'Applied' : 'Apply'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. GAIN (MUSCLE GAIN) */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-blue-950 font-bold text-xs">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span>Muscle Gain</span>
                        </div>
                        <span className="text-[11px] font-medium text-blue-700 tabular-nums">
                          +{selectedPace.gainDelta} kcal/day avg
                        </span>
                      </div>

                      {isCycling ? (
                        <div className="space-y-2.5 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                              <span className="text-[10px] font-semibold text-blue-700 block">
                                High · Train ({trainingDaysCount}d)
                              </span>
                              <div className="text-xl font-bold text-blue-950 tabular-nums tracking-tight mt-0.5">
                                {formatNum(results.gain.highDay)}
                              </div>
                              <span className="text-[10px] text-blue-900/70">
                                kcal / day
                              </span>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                              <span className="text-[10px] font-semibold text-blue-800/80 block">
                                Low · Rest ({restDaysCount}d)
                              </span>
                              <div className="text-xl font-bold text-blue-900 tabular-nums tracking-tight mt-0.5">
                                {formatNum(results.gain.lowDay)}
                              </div>
                              <span className="text-[10px] text-blue-900/70">
                                kcal / day
                              </span>
                            </div>
                          </div>
                          <div className="flex items-baseline justify-between pt-1 border-t border-blue-200/70 text-xs tabular-nums">
                            <span className="text-blue-900/75">Weekly Total</span>
                            <span className="font-bold text-blue-950">
                              {formatNum(results.gain.weeklyTotal)} kcal
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[11px] text-blue-900/75 block">
                              Daily Calories
                            </span>
                            <div className="text-2xl font-bold text-blue-900 tabular-nums tracking-tight">
                              {formatNum(results.gain.dailyAvg)}
                            </div>
                            <span className="text-[11px] text-blue-900/75">
                              kcal / day
                            </span>
                          </div>

                          <div className="pl-2 border-l border-blue-200">
                            <span className="text-[11px] text-blue-900/75 block">
                              Weekly Calories
                            </span>
                            <div className="text-lg font-bold text-blue-800 tabular-nums tracking-tight mt-0.5">
                              {formatNum(results.gain.weeklyTotal)}
                            </div>
                            <span className="text-[11px] text-blue-900/75">
                              kcal / week
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-blue-200/70 flex items-center justify-between gap-2 text-[11px] text-blue-900">
                      <span className="tabular-nums">
                        +{formatNum(results.gainWeeklyDelta)} kcal/wk ·{' '}
                        {selectedPace.gainRateLabel}
                      </span>
                      {onApplyCalories && (
                        <button
                          type="button"
                          onClick={() =>
                            handleApply(
                              results.gain.highDay,
                              results.gain.lowDay,
                              'Muscle Gain'
                            )
                          }
                          className="font-semibold text-blue-700 hover:text-blue-900 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {appliedGoal === 'Muscle Gain' ? 'Applied' : 'Apply'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  Enter a valid body weight above to calculate daily and weekly calorie targets.
                </div>
              )}

              {/* Weekly Day-by-Day Calorie Cycling Schedule Table (Shown when Calorie Cycling is active) */}
              {results && isCycling && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-100/70">
                    <span className="text-xs font-bold text-slate-800">
                      7-Day Cycling Breakdown (Each Day &amp; Weekly Total)
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {trainingDaysCount} High Training Days + {restDaysCount} Low Rest Days
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-200 bg-white text-[11px] text-slate-600">
                          <th className="px-3 py-2 font-bold text-slate-800 min-w-[110px]">
                            Goal
                          </th>
                          {WEEKDAY_LABELS.map((day, idx) => {
                            const isTrain = trainingSchedule[idx];
                            return (
                              <th
                                key={day}
                                className="px-2 py-2 text-center font-semibold min-w-[64px]"
                              >
                                <div className="text-slate-800">{day}</div>
                                <div
                                  className={`text-[10px] font-semibold ${
                                    isTrain ? 'text-blue-600' : 'text-slate-400'
                                  }`}
                                >
                                  {isTrain ? 'High' : 'Low'}
                                </div>
                              </th>
                            );
                          })}
                          <th className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-50 border-l border-slate-200 min-w-[92px]">
                            Weekly
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 bg-white">
                        <tr>
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            Maintenance
                          </td>
                          {WEEKDAY_LABELS.map((day, idx) => {
                            const isTrain = trainingSchedule[idx];
                            return (
                              <td
                                key={day}
                                className={`px-2 py-2 text-center ${
                                  isTrain
                                    ? 'font-bold text-slate-900 bg-blue-50/30'
                                    : 'text-slate-600'
                                }`}
                              >
                                {formatNum(
                                  isTrain
                                    ? results.maintenance.highDay
                                    : results.maintenance.lowDay
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-50 border-l border-slate-200">
                            {formatNum(results.maintenance.weeklyTotal)}
                          </td>
                        </tr>

                        <tr>
                          <td className="px-3 py-2 font-semibold text-emerald-900">
                            Fat Loss
                          </td>
                          {WEEKDAY_LABELS.map((day, idx) => {
                            const isTrain = trainingSchedule[idx];
                            return (
                              <td
                                key={day}
                                className={`px-2 py-2 text-center ${
                                  isTrain
                                    ? 'font-bold text-emerald-900 bg-emerald-50/40'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {formatNum(
                                  isTrain
                                    ? results.fatLoss.highDay
                                    : results.fatLoss.lowDay
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right font-bold text-emerald-900 bg-slate-50 border-l border-slate-200">
                            {formatNum(results.fatLoss.weeklyTotal)}
                          </td>
                        </tr>

                        <tr>
                          <td className="px-3 py-2 font-semibold text-blue-900">
                            Muscle Gain
                          </td>
                          {WEEKDAY_LABELS.map((day, idx) => {
                            const isTrain = trainingSchedule[idx];
                            return (
                              <td
                                key={day}
                                className={`px-2 py-2 text-center ${
                                  isTrain
                                    ? 'font-bold text-blue-900 bg-blue-50/40'
                                    : 'text-blue-700'
                                }`}
                              >
                                {formatNum(
                                  isTrain
                                    ? results.gain.highDay
                                    : results.gain.lowDay
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right font-bold text-blue-900 bg-slate-50 border-l border-slate-200">
                            {formatNum(results.gain.weeklyTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Weekly Comparison Summary Strip & Week Target Selector */}
              {results && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 tabular-nums">
                    <span>Weekly Totals (7 days):</span>
                    <span>
                      Maintenance{' '}
                      <strong className="text-slate-900">
                        {formatNum(results.maintenance.weeklyTotal)}
                      </strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      Fat Loss{' '}
                      <strong className="text-emerald-700">
                        {formatNum(results.fatLoss.weeklyTotal)}
                      </strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      Gain{' '}
                      <strong className="text-blue-700">
                        {formatNum(results.gain.weeklyTotal)}
                      </strong>
                    </span>
                  </div>

                  {onApplyCalories && entries.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor="apply-week-select"
                        className="text-[11px] font-medium text-slate-500 whitespace-nowrap"
                      >
                        Apply {isCycling ? 'High/Low' : 'target'} to:
                      </label>
                      <select
                        id="apply-week-select"
                        value={selectedApplyWeek}
                        onChange={(e) =>
                          setSelectedApplyWeek(Number(e.target.value))
                        }
                        className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {entries.map((entry) => (
                          <option
                            key={entry.weekNumber}
                            value={entry.weekNumber}
                          >
                            {entry.weekLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
