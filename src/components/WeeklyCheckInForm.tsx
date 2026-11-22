import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Scale,
  Ruler,
  Activity,
  Utensils,
  MessageSquare,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import {
  WeeklyProgressEntry,
  MeasureUnit,
  calculateSevenDayAverage,
  formatCmForDisplay,
  convertInputToCm,
  parseNumericMetric,
  getEffectiveDailyCalorieTarget,
  extractProteinFromMacros,
} from '../data/transformationData';

interface WeeklyCheckInFormProps {
  entries: WeeklyProgressEntry[];
  selectedWeek: number;
  measureUnit: MeasureUnit;
  onMeasureUnitChange: (unit: MeasureUnit) => void;
  onSelectWeek: (weekNum: number) => void;
  onSaveEntry: (updatedEntry: WeeklyProgressEntry, toastMessage?: string) => void;
  onJumpToWeighIn?: (weekNum: number) => void;
}

const ENERGY_OPTIONS = ['1 - Very Low', '2 - Low', '3 - Moderate', '4 - Good', '5 - High'];
const PERFORMANCE_OPTIONS = ['Strong', 'Good', 'Average', 'Struggled'];
const FATIGUE_OPTIONS = [
  { value: '0', label: '0 · Fresh' },
  { value: '1', label: '1 · Minimal' },
  { value: '2', label: '2 · Mild' },
  { value: '3', label: '3 · Moderate' },
  { value: '4', label: '4 · High' },
  { value: '5', label: '5 · Severe' },
];

export const WeeklyCheckInForm: React.FC<WeeklyCheckInFormProps> = ({
  entries,
  selectedWeek,
  measureUnit,
  onMeasureUnitChange,
  onSelectWeek,
  onSaveEntry,
  onJumpToWeighIn,
}) => {
  const sourceEntry = useMemo(
    () => entries.find((e) => e.weekNumber === selectedWeek) || entries[0],
    [entries, selectedWeek]
  );

  const prevWeekEntry = useMemo(() => {
    if (selectedWeek <= 0) return null;
    for (let w = selectedWeek - 1; w >= 0; w--) {
      const candidate = entries.find((e) => e.weekNumber === w);
      if (candidate) return candidate;
    }
    return null;
  }, [entries, selectedWeek]);

  const [draft, setDraft] = useState<WeeklyProgressEntry>(() => sourceEntry);
  const [measureDrafts, setMeasureDrafts] = useState<Record<string, string>>({});
  const [focusedMeasureKey, setFocusedMeasureKey] = useState<string | null>(null);
  const [dailyCalorieTargetInput, setDailyCalorieTargetInput] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(false);

  const autoSaveTimerRef = useRef<number | null>(null);
  const draftRef = useRef<WeeklyProgressEntry>(draft);
  const isDirtyRef = useRef<boolean>(isDirty);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Sync draft when selected week changes or external updates arrive (CalorieCalculator / AM weigh-ins / cloud sync)
  useEffect(() => {
    if (!sourceEntry) return;

    // Auto-populate missing protein from legacy macros if proteinIntake is empty
    const legacyProtein = !sourceEntry.proteinIntake
      ? extractProteinFromMacros(sourceEntry.trainingDayMacros)
      : '';

    const nextDraft: WeeklyProgressEntry = {
      ...sourceEntry,
      proteinIntake: sourceEntry.proteinIntake || legacyProtein || '',
      progressNotes: sourceEntry.progressNotes ?? '',
    };

    setDraft(nextDraft);
    setFocusedMeasureKey(null);
    setMeasureDrafts({
      chest: formatCmForDisplay(nextDraft.chest, measureUnit),
      rightArm: formatCmForDisplay(nextDraft.rightArm, measureUnit),
      leftArm: formatCmForDisplay(nextDraft.leftArm, measureUnit),
      navelAbove: formatCmForDisplay(nextDraft.navelAbove, measureUnit),
      navelAt: formatCmForDisplay(nextDraft.navelAt, measureUnit),
      navelBelow: formatCmForDisplay(nextDraft.navelBelow, measureUnit),
      hips: formatCmForDisplay(nextDraft.hips, measureUnit),
      rightThigh: formatCmForDisplay(nextDraft.rightThigh, measureUnit),
      leftThigh: formatCmForDisplay(nextDraft.leftThigh, measureUnit),
      height: formatCmForDisplay(nextDraft.height, measureUnit),
    });

    const effectiveTarget = getEffectiveDailyCalorieTarget(nextDraft);
    setDailyCalorieTargetInput(effectiveTarget !== null ? String(effectiveTarget) : '');
    setIsDirty(false);
  }, [sourceEntry, measureUnit]);

  // Flush any pending auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (isDirtyRef.current && draftRef.current) {
        onSaveEntry(draftRef.current);
      }
    };
  }, [onSaveEntry]);

  const scheduleAutoSave = (nextEntry: WeeklyProgressEntry) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      onSaveEntry(nextEntry);
      setIsDirty(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    }, 800);
  };

  const updateField = (field: keyof WeeklyProgressEntry, value: string) => {
    setDraft((prev) => {
      const updated: WeeklyProgressEntry = {
        ...prev,
        [field]: value,
      };
      // Smart assist: if user updates trainingDays (0..7) and restDays was empty or matched 7-prev, update restDays
      if (field === 'trainingDays') {
        const parsedTrain = parseNumericMetric(value);
        if (parsedTrain !== null && parsedTrain >= 0 && parsedTrain <= 7) {
          const prevTrain = parseNumericMetric(prev.trainingDays);
          const prevRest = parseNumericMetric(prev.restDays);
          const wasAutoRest =
            !prev.restDays ||
            (prevTrain !== null && prevRest !== null && prevTrain + prevRest === 7);
          if (wasAutoRest) {
            updated.restDays = String(7 - Math.round(parsedTrain));
          }
        }
      }
      setIsDirty(true);
      scheduleAutoSave(updated);
      return updated;
    });
  };

  const handleMeasureFocus = (field: string) => {
    setFocusedMeasureKey(field);
  };

  const handleMeasureChange = (field: keyof WeeklyProgressEntry, rawValue: string) => {
    setMeasureDrafts((prev) => ({ ...prev, [field]: rawValue }));
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      updateField(field, '');
      return;
    }
    const parsed = parseFloat(trimmed);
    if (!Number.isNaN(parsed)) {
      const canonicalCm = convertInputToCm(trimmed, measureUnit);
      setDraft((prev) => {
        const updated = { ...prev, [field]: canonicalCm };
        setIsDirty(true);
        scheduleAutoSave(updated);
        return updated;
      });
    }
  };

  const handleMeasureBlur = (field: keyof WeeklyProgressEntry) => {
    setFocusedMeasureKey(null);
    const raw = measureDrafts[field] ?? '';
    const canonical = convertInputToCm(raw, measureUnit);
    setDraft((prev) => {
      const updated = { ...prev, [field]: canonical };
      setMeasureDrafts((m) => ({
        ...m,
        [field]: formatCmForDisplay(canonical, measureUnit),
      }));
      if (canonical !== prev[field]) {
        setIsDirty(true);
        scheduleAutoSave(updated);
      }
      return updated;
    });
  };

  const handleDailyCalorieTargetChange = (val: string) => {
    setDailyCalorieTargetInput(val);
    const cleaned = val.trim();
    setDraft((prev) => {
      const updated: WeeklyProgressEntry = {
        ...prev,
        trainingDayCalories: cleaned,
        restDayCalories: prev.restDayCalories && prev.restDayCalories !== prev.trainingDayCalories
          ? prev.restDayCalories
          : cleaned,
      };
      setIsDirty(true);
      scheduleAutoSave(updated);
      return updated;
    });
  };

  const handleExplicitSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    onSaveEntry(draft, `${draft.weekLabel} check-in saved`);
    setIsDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleWeekSwitch = (nextWeek: number) => {
    if (isDirty) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      onSaveEntry(draft);
      setIsDirty(false);
    }
    onSelectWeek(nextWeek);
  };

  const handleCopyTargetsFromPrevious = () => {
    if (!prevWeekEntry) return;
    const prevProtein =
      prevWeekEntry.proteinIntake || extractProteinFromMacros(prevWeekEntry.trainingDayMacros);
    const updated: WeeklyProgressEntry = {
      ...draft,
      targetDailySteps: draft.targetDailySteps || prevWeekEntry.targetDailySteps || '8000',
      trainingDayCalories: draft.trainingDayCalories || prevWeekEntry.trainingDayCalories || '',
      restDayCalories: draft.restDayCalories || prevWeekEntry.restDayCalories || '',
      trainingDayMacros: draft.trainingDayMacros || prevWeekEntry.trainingDayMacros || '',
      restDayMacros: draft.restDayMacros || prevWeekEntry.restDayMacros || '',
      proteinIntake: draft.proteinIntake || prevProtein || '',
      mealTimes: draft.mealTimes || prevWeekEntry.mealTimes || '',
      height: draft.height || prevWeekEntry.height || '',
    };
    setDraft(updated);
    const eff = getEffectiveDailyCalorieTarget(updated);
    setDailyCalorieTargetInput(eff !== null ? String(eff) : '');
    if (updated.height) {
      setMeasureDrafts((m) => ({
        ...m,
        height: formatCmForDisplay(updated.height, measureUnit),
      }));
    }
    onSaveEntry(updated, `Targets copied from ${prevWeekEntry.weekLabel}`);
    setIsDirty(false);
  };

  const sevenDayStats = useMemo(
    () => calculateSevenDayAverage(draft?.dailyWeighIns),
    [draft?.dailyWeighIns]
  );

  const handleApplySevenDayAvgToWeight = () => {
    if (sevenDayStats.avg === null) return;
    const avgStr = sevenDayStats.avg.toFixed(1);
    updateField('weight', avgStr);
  };

  if (!draft) return null;

  const measurementFields: Array<{
    key: keyof WeeklyProgressEntry;
    label: string;
    hint: string;
  }> = [
    { key: 'chest', label: 'Chest', hint: 'Nipples line' },
    { key: 'rightArm', label: 'Right Arm', hint: 'Flexed peak' },
    { key: 'leftArm', label: 'Left Arm', hint: 'Flexed peak' },
    { key: 'navelAbove', label: 'Waist (3 Fingers Above)', hint: 'Upper waist' },
    { key: 'navelAt', label: 'Stomach (At Navel)', hint: 'Midline waist' },
    { key: 'navelBelow', label: 'Lower Waist (3 Below)', hint: 'Lower belly' },
    { key: 'hips', label: 'Hips', hint: 'Widest glutes' },
    { key: 'rightThigh', label: 'Right Thigh', hint: 'Mid-thigh' },
    { key: 'leftThigh', label: 'Left Thigh', hint: 'Mid-thigh' },
  ];

  const isCyclingTargets =
    Boolean(draft.trainingDayCalories && draft.restDayCalories) &&
    draft.trainingDayCalories !== draft.restDayCalories;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Form Header Bar */}
      <div
        className={`px-4 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          draft.isMilestone && draft.weekNumber > 0
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-slate-50/80 border-slate-200'
        }`}
      >
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => handleWeekSwitch(Math.max(0, selectedWeek - 1))}
              disabled={selectedWeek <= 0}
              aria-label="Previous week"
              className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              aria-label="Select check-in week"
              value={selectedWeek}
              onChange={(e) => handleWeekSwitch(Number(e.target.value))}
              className="bg-transparent px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {entries.map((e) => (
                <option key={e.weekNumber} value={e.weekNumber}>
                  {e.weekLabel} · {e.date}
                  {e.isMilestone && e.weekNumber > 0 ? ' ★ Milestone' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleWeekSwitch(Math.min(12, selectedWeek + 1))}
              disabled={selectedWeek >= 12}
              aria-label="Next week"
              className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {draft.isMilestone && draft.weekNumber > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Milestone Review Week</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {prevWeekEntry && (
            <button
              type="button"
              onClick={handleCopyTargetsFromPrevious}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title={`Fill blank targets from ${prevWeekEntry.weekLabel}`}
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Auto-Fill Targets</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExplicitSave}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : justSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {justSaved && !isDirty ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isDirty ? 'Save Check-In*' : 'Save Check-In'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Organized Check-In Sections */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* SECTION A: WEIGHT & MEASUREMENTS */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">A. Weight &amp; Measurements</h3>
                <p className="text-[11px] text-slate-500">
                  Only log what you measured this week — all fields are optional.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              <Ruler className="w-3 h-3 text-slate-500 ml-1.5" />
              <button
                type="button"
                onClick={() => onMeasureUnitChange('cm')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                  measureUnit === 'cm'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                cm
              </button>
              <button
                type="button"
                onClick={() => onMeasureUnitChange('in')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                  measureUnit === 'in'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                inches
              </button>
            </div>
          </div>

          {/* Body Weight & Auto 7-Day Avg Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
              <label
                htmlFor="checkin-weight"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5"
              >
                <span>Body Weight</span>
                <span className="text-[11px] font-normal text-slate-400">lbs (fasted AM)</span>
              </label>
              <div className="relative">
                <input
                  id="checkin-weight"
                  type="text"
                  inputMode="decimal"
                  value={draft.weight || ''}
                  onChange={(e) => updateField('weight', e.target.value)}
                  placeholder="e.g. 188.5"
                  className="w-full px-3 py-2 pr-10 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  lbs
                </span>
              </div>
            </div>

            <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-blue-900">
                  7-Day Average Weight (Auto)
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 tabular-nums">
                  {sevenDayStats.count}/7 weigh-ins
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {sevenDayStats.avg !== null ? `${sevenDayStats.avg.toFixed(1)} lbs` : 'No AM logs yet'}
                </span>
                <div className="flex items-center gap-1.5">
                  {sevenDayStats.avg !== null && (
                    <button
                      type="button"
                      onClick={handleApplySevenDayAvgToWeight}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      Use as Weight
                    </button>
                  )}
                  {onJumpToWeighIn && (
                    <button
                      type="button"
                      onClick={() => onJumpToWeighIn(selectedWeek)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                    >
                      <span>Edit AM</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 9 Circumference Measurements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {measurementFields.map(({ key, label, hint }) => {
              const fieldKey = String(key);
              const val =
                focusedMeasureKey === fieldKey
                  ? measureDrafts[fieldKey] ?? ''
                  : formatCmForDisplay((draft[key] as string) || '', measureUnit);

              return (
                <div
                  key={fieldKey}
                  className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80 focus-within:border-blue-400 focus-within:bg-white transition-colors"
                >
                  <label
                    htmlFor={`checkin-${fieldKey}`}
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1"
                  >
                    <span>{label}</span>
                    <span className="text-[10px] font-normal text-slate-400">{hint}</span>
                  </label>
                  <div className="relative">
                    <input
                      id={`checkin-${fieldKey}`}
                      type="text"
                      inputMode="decimal"
                      value={val}
                      onFocus={() => handleMeasureFocus(fieldKey)}
                      onBlur={() => handleMeasureBlur(key)}
                      onChange={(e) => handleMeasureChange(key, e.target.value)}
                      placeholder="—"
                      className="w-full px-2.5 py-1.5 pr-9 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                      {measureUnit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION B: ACTIVITY & TRAINING */}
        <section className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">B. Activity &amp; Training</h3>
              <p className="text-[11px] text-slate-500">
                Daily movement volume, training sessions, and recovery days.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-target-steps"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Target Daily Steps
              </label>
              <input
                id="checkin-target-steps"
                type="text"
                inputMode="numeric"
                value={draft.targetDailySteps || ''}
                onChange={(e) => updateField('targetDailySteps', e.target.value)}
                placeholder="e.g. 8000"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-actual-steps"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Actual Average Daily Steps
              </label>
              <input
                id="checkin-actual-steps"
                type="text"
                inputMode="numeric"
                value={draft.actualDailySteps || ''}
                onChange={(e) => updateField('actualDailySteps', e.target.value)}
                placeholder="e.g. 8450"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-training-consistency"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Training Consistency (%)
              </label>
              <input
                id="checkin-training-consistency"
                type="text"
                value={draft.trainingAdherence || ''}
                onChange={(e) => updateField('trainingAdherence', e.target.value)}
                placeholder="e.g. 100%"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-training-days"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1"
              >
                <span>Training Days</span>
                <span className="text-[10px] font-normal text-slate-400">days / wk</span>
              </label>
              <input
                id="checkin-training-days"
                type="text"
                inputMode="numeric"
                value={draft.trainingDays || ''}
                onChange={(e) => updateField('trainingDays', e.target.value)}
                placeholder="e.g. 4"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-training-time"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1"
              >
                <span>Total Training Time</span>
                <span className="text-[10px] font-normal text-slate-400">mins or hrs</span>
              </label>
              <input
                id="checkin-training-time"
                type="text"
                value={draft.totalTrainingTime || ''}
                onChange={(e) => updateField('totalTrainingTime', e.target.value)}
                placeholder="e.g. 4h 30m or 270 mins"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-rest-days"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1"
              >
                <span>Rest Days</span>
                <span className="text-[10px] font-normal text-slate-400">days / wk</span>
              </label>
              <input
                id="checkin-rest-days"
                type="text"
                inputMode="numeric"
                value={draft.restDays || ''}
                onChange={(e) => updateField('restDays', e.target.value)}
                placeholder="e.g. 3"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION C: NUTRITION & ADHERENCE */}
        <section className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">C. Nutrition &amp; Adherence</h3>
                <p className="text-[11px] text-slate-500">
                  Calorie targets, actual intake, protein consistency, and meal schedule.
                </p>
              </div>
            </div>
            {isCyclingTargets && (
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md tabular-nums">
                Cycled: {draft.trainingDayCalories} High / {draft.restDayCalories} Low kcal
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-cal-target"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1"
              >
                <span>Daily Calorie Target</span>
                <span className="text-[10px] font-normal text-slate-400">kcal / day</span>
              </label>
              <input
                id="checkin-cal-target"
                type="text"
                inputMode="numeric"
                value={dailyCalorieTargetInput}
                onChange={(e) => handleDailyCalorieTargetChange(e.target.value)}
                placeholder="e.g. 2400"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-actual-cals"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1"
              >
                <span>Actual Average Daily Calories</span>
                <span className="text-[10px] font-normal text-slate-400">kcal / day</span>
              </label>
              <input
                id="checkin-actual-cals"
                type="text"
                inputMode="numeric"
                value={draft.actualDailyCalories || ''}
                onChange={(e) => updateField('actualDailyCalories', e.target.value)}
                placeholder="e.g. 2380"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-protein"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1"
              >
                <span>Protein Intake</span>
                <span className="text-[10px] font-normal text-slate-400">grams / day</span>
              </label>
              <input
                id="checkin-protein"
                type="text"
                value={draft.proteinIntake || ''}
                onChange={(e) => updateField('proteinIntake', e.target.value)}
                placeholder="e.g. 180g"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-meal-times"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Meal Times
              </label>
              <input
                id="checkin-meal-times"
                type="text"
                value={draft.mealTimes || ''}
                onChange={(e) => updateField('mealTimes', e.target.value)}
                placeholder="e.g. 12:00, 16:00, 20:00"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label
                  htmlFor="checkin-nutrition-adherence"
                  className="text-xs font-semibold text-slate-700"
                >
                  Adherence to Nutrition Targets
                </label>
                <div className="flex items-center gap-1">
                  {['100%', '95%', '90%', '80%', '70%'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateField('calorieAdherence', preset)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                        draft.calorieAdherence === preset
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="checkin-nutrition-adherence"
                type="text"
                value={draft.calorieAdherence || ''}
                onChange={(e) => updateField('calorieAdherence', e.target.value)}
                placeholder="e.g. 95% (6/7 days on target)"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION D: WEEKLY FEEDBACK */}
        <section className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-1">
            <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">D. Weekly Feedback</h3>
              <p className="text-[11px] text-slate-500">
                Energy, training output, fatigue, wins, and challenges for the week.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Energy Levels */}
            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Energy Levels</label>
              <div className="flex flex-wrap gap-1.5">
                {ENERGY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateField('energyLevel', opt)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                      draft.energyLevel === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Training Performance */}
            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Training Performance
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PERFORMANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateField('trainingPerformance', opt)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                      draft.trainingPerformance === opt
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Fatigue */}
            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Overall Fatigue (0–5)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FATIGUE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('fatigueScore', opt.value)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                      draft.fatigueScore === opt.value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-progress-notes"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Progress Notes &amp; Skill Milestones
              </label>
              <textarea
                id="checkin-progress-notes"
                rows={3}
                value={draft.progressNotes || draft.keySkillProgress || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((prev) => {
                    const updated = {
                      ...prev,
                      progressNotes: v,
                      keySkillProgress: v.slice(0, 512),
                    };
                    setIsDirty(true);
                    scheduleAutoSave(updated);
                    return updated;
                  });
                }}
                placeholder="What improved this week? e.g. Frog Planche holds cleaner, waist felt tighter, energy stable..."
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed"
              />
            </div>

            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-200/80">
              <label
                htmlFor="checkin-challenges"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Challenges or Difficulties
              </label>
              <textarea
                id="checkin-challenges"
                rows={3}
                value={draft.challengesNotes || ''}
                onChange={(e) => updateField('challengesNotes', e.target.value)}
                placeholder="Any soreness, poor sleep, social meals, work stress, or recovery hurdles?"
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Collapsible Legacy / Optional Extra Fields (Height, Training/Rest Macros, Sleep/Stress/Hunger) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowExtraDetails((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showExtraDetails ? 'rotate-180' : ''}`}
              />
              <span>
                {showExtraDetails ? 'Hide' : 'Show'} optional biofeedback &amp; macro breakdown
              </span>
            </button>

            {showExtraDetails && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Height ({measureUnit})
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      focusedMeasureKey === 'height'
                        ? measureDrafts.height ?? ''
                        : formatCmForDisplay(draft.height || '', measureUnit)
                    }
                    onFocus={() => handleMeasureFocus('height')}
                    onBlur={() => handleMeasureBlur('height')}
                    onChange={(e) => handleMeasureChange('height', e.target.value)}
                    placeholder="—"
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Sleep (0–5)
                  </label>
                  <input
                    type="text"
                    value={draft.sleepScore || ''}
                    onChange={(e) => updateField('sleepScore', e.target.value)}
                    placeholder="0=best"
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Stress (0–5)
                  </label>
                  <input
                    type="text"
                    value={draft.stressScore || ''}
                    onChange={(e) => updateField('stressScore', e.target.value)}
                    placeholder="0=calm"
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Hunger (0–5)
                  </label>
                  <input
                    type="text"
                    value={draft.hungerScore || ''}
                    onChange={(e) => updateField('hungerScore', e.target.value)}
                    placeholder="0=full"
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Train Day Cals/Macros
                  </label>
                  <input
                    type="text"
                    value={draft.trainingDayCalories || ''}
                    onChange={(e) => updateField('trainingDayCalories', e.target.value)}
                    placeholder="kcal"
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Rest Day Cals/Macros
                  </label>
                  <input
                    type="text"
                    value={draft.restDayCalories || ''}
                    onChange={(e) => updateField('restDayCalories', e.target.value)}
                    placeholder="kcal"
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
