import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSync } from '../context/SyncContext';
import {
  Calendar,
  Scale,
  Ruler,
  Camera,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Eraser,
  Eye,
  ArrowRightLeft,
  X,
  CheckCircle2,
  Pencil,
  ClipboardCheck,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  WeeklyProgressEntry,
  NutritionHeaderStep,
  MeasureUnit,
  DEFAULT_NUTRITION_STEPS,
  INITIAL_START_DATE,
  calculateDateForWeek,
  calculateSevenDayAverage,
  normalizeDailyWeighIns,
  generateDefaultProgressEntries,
  generateEmptyProgressEntries,
  getStoredTransformationData,
  saveStoredTransformationData,
  getStoredNutritionSteps,
  saveStoredNutritionSteps,
  getStoredMeasureUnit,
  saveStoredMeasureUnit,
  cmNumberToUnit,
  formatCmForDisplay,
  parseNumericMetric,
  getEffectiveDailyCalorieTarget,
} from '../data/transformationData';
import { CalorieCalculator } from './CalorieCalculator';
import { DailyWeighInTracker } from './DailyWeighInTracker';
import { TwelveWeekOverview } from './TwelveWeekOverview';
import { WeeklyCheckInForm } from './WeeklyCheckInForm';
import { TransformationCharts } from './TransformationCharts';

export const TransformationView: React.FC = () => {
  const { saveTransformationToCloud, saveNutritionStepsToCloud, saveMeasureUnitToCloud } = useSync();
  const [data, setData] = useState<{
    startDate: string;
    entries: WeeklyProgressEntry[];
  }>(() => getStoredTransformationData());

  const [headerSteps, setHeaderSteps] = useState<NutritionHeaderStep[]>(() =>
    getStoredNutritionSteps()
  );
  const stepsSyncTimerRef = useRef<number | null>(null);
  const weighInSyncTimerRef = useRef<number | null>(null);
  const checkInSectionRef = useRef<HTMLDivElement | null>(null);
  const weighInSectionRef = useRef<HTMLDivElement | null>(null);

  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    try {
      const initial = getStoredTransformationData();
      const [y, m, d] = initial.startDate.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.floor(
        (todayMidnight.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays < 13 * 7) {
        return Math.floor(diffDays / 7);
      }
    } catch {
      // fallback
    }
    return 0;
  });

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'charts' | 'photos'>('overview');
  const [selectedPhotoWeek, setSelectedPhotoWeek] = useState<number>(0);
  const [comparisonWeekA, setComparisonWeekA] = useState<number>(0);
  const [comparisonWeekB, setComparisonWeekB] = useState<number>(4);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [measureUnit, setMeasureUnit] = useState<MeasureUnit>(() => getStoredMeasureUnit());
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUploadAngle, setPendingUploadAngle] = useState<
    'front' | 'back' | 'leftSide' | 'rightSide' | null
  >(null);

  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Listen for real-time remote updates from other open browser tabs or synced devices
  useEffect(() => {
    const handleRemoteUpdate = () => {
      setData(getStoredTransformationData());
    };
    const handleStepsRemoteUpdate = () => {
      setHeaderSteps(getStoredNutritionSteps());
    };
    const handleUnitRemoteUpdate = () => {
      setMeasureUnit(getStoredMeasureUnit());
    };
    window.addEventListener('planche_transformation_updated', handleRemoteUpdate);
    window.addEventListener('planche_nutrition_steps_updated', handleStepsRemoteUpdate);
    window.addEventListener('planche_measure_unit_updated', handleUnitRemoteUpdate);
    return () => {
      window.removeEventListener('planche_transformation_updated', handleRemoteUpdate);
      window.removeEventListener('planche_nutrition_steps_updated', handleStepsRemoteUpdate);
      window.removeEventListener('planche_measure_unit_updated', handleUnitRemoteUpdate);
      if (stepsSyncTimerRef.current) clearTimeout(stepsSyncTimerRef.current);
      if (weighInSyncTimerRef.current) clearTimeout(weighInSyncTimerRef.current);
    };
  }, []);

  const triggerSaveNotification = useCallback((msg: string = 'Changes saved') => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 2000);
  }, []);

  const persistChanges = useCallback(
    (newDate: string, updatedEntries: WeeklyProgressEntry[], toastMsg?: string) => {
      saveStoredTransformationData(newDate, updatedEntries);
      saveTransformationToCloud(newDate, updatedEntries);
      if (toastMsg) triggerSaveNotification(toastMsg);
    },
    [saveTransformationToCloud, triggerSaveNotification]
  );

  // Switch body measurements display & entry units (cm <-> in)
  const handleMeasureUnitChange = (nextUnit: MeasureUnit) => {
    if (nextUnit === measureUnit) return;
    setMeasureUnit(nextUnit);
    saveStoredMeasureUnit(nextUnit);
    saveMeasureUnitToCloud(nextUnit, data.startDate);
    triggerSaveNotification(
      nextUnit === 'in'
        ? 'Measurements switched to inches (in)'
        : 'Measurements switched to centimeters (cm)'
    );
  };

  // Handle start date update
  const handleStartDateChange = (newDate: string) => {
    const updatedEntries = data.entries.map((entry) => ({
      ...entry,
      date: calculateDateForWeek(newDate, entry.weekNumber),
    }));
    const nextData = { startDate: newDate, entries: updatedEntries };
    setData(nextData);
    persistChanges(newDate, updatedEntries, 'Start date & weekly dates updated');
  };

  // Save a complete updated WeeklyProgressEntry from the WeeklyCheckInForm
  const handleSaveCheckInEntry = useCallback(
    (updatedEntry: WeeklyProgressEntry, toastMessage?: string) => {
      setData((prev) => {
        const updatedEntries = prev.entries.map((entry) =>
          entry.weekNumber === updatedEntry.weekNumber ? updatedEntry : entry
        );
        saveStoredTransformationData(prev.startDate, updatedEntries);
        saveTransformationToCloud(prev.startDate, updatedEntries);
        return { ...prev, entries: updatedEntries };
      });
      if (toastMessage) {
        triggerSaveNotification(toastMessage);
      }
    },
    [saveTransformationToCloud, triggerSaveNotification]
  );

  // Clicking a week card in 12-Week Overview selects it and scrolls cleanly to its Check-In Form
  const handleSelectWeekFromOverview = (weekNum: number) => {
    setSelectedWeek(weekNum);
    setTimeout(() => {
      checkInSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleJumpToWeighIn = (weekNum: number) => {
    setSelectedWeek(weekNum);
    setTimeout(() => {
      weighInSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  // Handle individual Daily AM weigh-in edits with debounced cloud persistence
  const handleDailyWeighInChange = (weekNumber: number, dayIdx: number, valueLbs: string) => {
    const updatedEntries = data.entries.map((entry) => {
      if (entry.weekNumber !== weekNumber) return entry;
      const nextWeighIns = normalizeDailyWeighIns(entry.dailyWeighIns);
      nextWeighIns[dayIdx] = valueLbs;
      return {
        ...entry,
        dailyWeighIns: nextWeighIns,
      };
    });

    setData((prev) => ({ ...prev, entries: updatedEntries }));
    saveStoredTransformationData(data.startDate, updatedEntries);

    if (weighInSyncTimerRef.current) {
      clearTimeout(weighInSyncTimerRef.current);
    }
    weighInSyncTimerRef.current = window.setTimeout(() => {
      saveTransformationToCloud(data.startDate, updatedEntries);
    }, 600);
  };

  // Apply calculated 7-day average to the selected week's Weight field
  const handleApplyAvgToWeekWeight = (weekNumber: number, avgLbs: string) => {
    if (weighInSyncTimerRef.current) {
      clearTimeout(weighInSyncTimerRef.current);
      weighInSyncTimerRef.current = null;
    }
    const targetEntry = data.entries.find((e) => e.weekNumber === weekNumber);
    const updatedEntries = data.entries.map((entry) =>
      entry.weekNumber === weekNumber ? { ...entry, weight: avgLbs } : entry
    );
    setData((prev) => ({ ...prev, entries: updatedEntries }));
    persistChanges(
      data.startDate,
      updatedEntries,
      `Synced 7-day average (${avgLbs} lbs) to ${targetEntry?.weekLabel || `Week ${weekNumber}`}`
    );
  };

  // Clear all 7 AM weigh-ins for a selected week
  const handleClearWeekWeighIns = (weekNumber: number) => {
    if (weighInSyncTimerRef.current) {
      clearTimeout(weighInSyncTimerRef.current);
      weighInSyncTimerRef.current = null;
    }
    const targetEntry = data.entries.find((e) => e.weekNumber === weekNumber);
    const updatedEntries = data.entries.map((entry) =>
      entry.weekNumber === weekNumber
        ? { ...entry, dailyWeighIns: ['', '', '', '', '', '', ''] }
        : entry
    );
    setData((prev) => ({ ...prev, entries: updatedEntries }));
    persistChanges(
      data.startDate,
      updatedEntries,
      `Cleared AM weigh-ins for ${targetEntry?.weekLabel || `Week ${weekNumber}`}`
    );
  };

  // Handle edits to the 3 header steps (custom title & notes)
  const handleStepFieldChange = (
    stepNumber: 1 | 2 | 3,
    field: 'title' | 'notes',
    value: string
  ) => {
    const updatedSteps = headerSteps.map((step) =>
      step.stepNumber === stepNumber ? { ...step, [field]: value } : step
    );
    setHeaderSteps(updatedSteps);
    saveStoredNutritionSteps(updatedSteps);

    if (stepsSyncTimerRef.current) {
      clearTimeout(stepsSyncTimerRef.current);
    }
    stepsSyncTimerRef.current = window.setTimeout(() => {
      saveNutritionStepsToCloud(updatedSteps, data.startDate);
    }, 600);
  };

  const handleStepBlur = () => {
    if (stepsSyncTimerRef.current) {
      clearTimeout(stepsSyncTimerRef.current);
      stepsSyncTimerRef.current = null;
    }
    saveNutritionStepsToCloud(headerSteps, data.startDate);
  };

  const handleResetHeaderSteps = () => {
    setHeaderSteps(DEFAULT_NUTRITION_STEPS);
    saveStoredNutritionSteps(DEFAULT_NUTRITION_STEPS);
    saveNutritionStepsToCloud(DEFAULT_NUTRITION_STEPS, data.startDate);
    triggerSaveNotification('Header steps reset to defaults');
  };

  // Apply calculated daily or cycled High/Low calories to selected transformation week
  const handleApplyCalculatorCalories = (
    weekNumber: number,
    trainingDayCalories: number,
    restDayCalories: number,
    goalLabel: string
  ) => {
    const targetEntry = data.entries.find((e) => e.weekNumber === weekNumber);
    const updatedEntries = data.entries.map((entry) => {
      if (entry.weekNumber === weekNumber) {
        return {
          ...entry,
          trainingDayCalories: String(trainingDayCalories),
          restDayCalories: String(restDayCalories),
        };
      }
      return entry;
    });

    const nextData = { ...data, entries: updatedEntries };
    setData(nextData);
    const isCycled = trainingDayCalories !== restDayCalories;
    const summaryText = isCycled
      ? `${trainingDayCalories.toLocaleString('en-US')} High / ${restDayCalories.toLocaleString('en-US')} Low kcal`
      : `${trainingDayCalories.toLocaleString('en-US')} kcal/day`;
    persistChanges(
      data.startDate,
      updatedEntries,
      `Applied ${goalLabel} (${summaryText}) to ${
        targetEntry?.weekLabel || `Week ${weekNumber}`
      }`
    );
  };

  const handleResetData = () => setShowResetModal(true);

  const executeResetDefaults = () => {
    const defaults = generateDefaultProgressEntries(INITIAL_START_DATE);
    setData({ startDate: INITIAL_START_DATE, entries: defaults });
    persistChanges(INITIAL_START_DATE, defaults, 'Reset to baseline template');
    setShowResetModal(false);
  };

  const handleClearForm = () => setShowClearModal(true);

  const executeClearForm = () => {
    const blankEntries = generateEmptyProgressEntries(data.startDate);
    const nextData = { startDate: data.startDate, entries: blankEntries };
    setData(nextData);
    persistChanges(
      data.startDate,
      blankEntries,
      'Form cleared. All measurements reset to blank.'
    );
    setShowClearModal(false);
  };

  // Export CSV (preserves all existing & new check-in columns)
  const handleExportCSV = () => {
    const headers = ['Metric', ...data.entries.map((e) => `${e.weekLabel} (${e.date})`)];
    const rows: string[][] = [
      headers,
      ['Weight (lbs)', ...data.entries.map((e) => `"${e.weight || ''}"`)],
      [
        '7-Day AM Avg (lbs)',
        ...data.entries.map((e) => {
          const s = calculateSevenDayAverage(e.dailyWeighIns);
          return s.avg !== null ? `"${s.avg.toFixed(1)}"` : '""';
        }),
      ],
      [
        `Chest (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.chest, measureUnit)}"`),
      ],
      [
        `Right Arm (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.rightArm, measureUnit)}"`),
      ],
      [
        `Left Arm (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.leftArm, measureUnit)}"`),
      ],
      [
        `3 Fingers Above Navel (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.navelAbove, measureUnit)}"`),
      ],
      [
        `Stomach at Navel (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.navelAt, measureUnit)}"`),
      ],
      [
        `3 Fingers Below Navel (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.navelBelow, measureUnit)}"`),
      ],
      [
        `Hips (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.hips, measureUnit)}"`),
      ],
      [
        `Right Thigh (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.rightThigh, measureUnit)}"`),
      ],
      [
        `Left Thigh (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.leftThigh, measureUnit)}"`),
      ],
      [
        `Height (${measureUnit})`,
        ...data.entries.map((e) => `"${formatCmForDisplay(e.height, measureUnit)}"`),
      ],
      ['Target Daily Steps', ...data.entries.map((e) => `"${e.targetDailySteps || ''}"`)],
      ['Actual Daily Steps', ...data.entries.map((e) => `"${e.actualDailySteps || ''}"`)],
      ['Training Days', ...data.entries.map((e) => `"${e.trainingDays || ''}"`)],
      ['Total Training Time', ...data.entries.map((e) => `"${e.totalTrainingTime || ''}"`)],
      ['Rest Days', ...data.entries.map((e) => `"${e.restDays || ''}"`)],
      ['Training Consistency (%)', ...data.entries.map((e) => `"${e.trainingAdherence || ''}"`)],
      [
        'Daily Calorie Target',
        ...data.entries.map((e) => {
          const eff = getEffectiveDailyCalorieTarget(e);
          return eff !== null ? `"${eff}"` : '""';
        }),
      ],
      ['Actual Daily Calories', ...data.entries.map((e) => `"${e.actualDailyCalories || ''}"`)],
      ['Protein Intake', ...data.entries.map((e) => `"${e.proteinIntake || ''}"`)],
      ['Meal Times', ...data.entries.map((e) => `"${e.mealTimes || ''}"`)],
      ['Calorie Adherence (%)', ...data.entries.map((e) => `"${e.calorieAdherence || ''}"`)],
      ['Energy Level', ...data.entries.map((e) => `"${e.energyLevel || ''}"`)],
      ['Training Performance', ...data.entries.map((e) => `"${e.trainingPerformance || ''}"`)],
      ['Overall Fatigue (0-5)', ...data.entries.map((e) => `"${e.fatigueScore || ''}"`)],
      [
        'Progress Notes',
        ...data.entries.map((e) =>
          `"${(e.progressNotes || e.keySkillProgress || '').replace(/"/g, '""')}"`
        ),
      ],
      [
        'Challenges',
        ...data.entries.map((e) => `"${(e.challengesNotes || '').replace(/"/g, '""')}"`),
      ],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Transformation_Progress_${data.startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Photo upload handler
  const initiatePhotoUpload = (angle: 'front' | 'back' | 'leftSide' | 'rightSide') => {
    setPendingUploadAngle(angle);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadAngle) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      if (!rawBase64) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        const updatedEntries = data.entries.map((entry) => {
          if (entry.weekNumber === selectedPhotoWeek) {
            return {
              ...entry,
              photos: {
                ...entry.photos,
                [pendingUploadAngle]: compressedBase64,
              },
            };
          }
          return entry;
        });

        setData({ ...data, entries: updatedEntries });
        persistChanges(data.startDate, updatedEntries, `Photo added for ${pendingUploadAngle}`);
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (
    weekNum: number,
    angle: 'front' | 'back' | 'leftSide' | 'rightSide'
  ) => {
    const updatedEntries = data.entries.map((entry) => {
      if (entry.weekNumber === weekNum) {
        const updatedPhotos = { ...entry.photos };
        delete updatedPhotos[angle];
        return {
          ...entry,
          photos: updatedPhotos,
        };
      }
      return entry;
    });

    setData({ ...data, entries: updatedEntries });
    persistChanges(data.startDate, updatedEntries, 'Photo removed');
  };

  // Top KPI Metrics Summary Calculations
  const startWeight = parseNumericMetric(data.entries[0]?.weight) || 0;
  const currentWeightEntry =
    [...data.entries].reverse().find((e) => (parseNumericMetric(e.weight) || 0) > 0) || null;
  const currentWeight = currentWeightEntry
    ? parseNumericMetric(currentWeightEntry.weight) || 0
    : startWeight || 0;
  const weightDeltaNum = currentWeight && startWeight ? currentWeight - startWeight : null;

  const latestSevenDayStats = (() => {
    const rev = [...data.entries].reverse();
    for (const entry of rev) {
      const s = calculateSevenDayAverage(entry.dailyWeighIns);
      if (s.avg !== null) {
        return { weekLabel: entry.weekLabel, ...s };
      }
    }
    return null;
  })();

  const startNavel = parseNumericMetric(data.entries[0]?.navelAt) || 0;
  const currentNavelEntry =
    [...data.entries].reverse().find((e) => (parseNumericMetric(e.navelAt) || 0) > 0) || null;
  const currentNavel = currentNavelEntry
    ? parseNumericMetric(currentNavelEntry.navelAt) || 0
    : startNavel || 0;
  const displayStartNavel = startNavel > 0 ? cmNumberToUnit(startNavel, measureUnit) : 0;
  const displayCurrentNavel = currentNavel > 0 ? cmNumberToUnit(currentNavel, measureUnit) : 0;
  const navelDeltaNum =
    displayCurrentNavel > 0 && displayStartNavel > 0
      ? displayCurrentNavel - displayStartNavel
      : null;

  const selectedEntry =
    data.entries.find((e) => e.weekNumber === selectedWeek) || data.entries[0];
  const effectiveSelectedTargetCals = selectedEntry
    ? getEffectiveDailyCalorieTarget(selectedEntry)
    : null;

  const currentSelectedPhotoEntry =
    data.entries.find((e) => e.weekNumber === selectedPhotoWeek) || data.entries[0];
  const compEntryA =
    data.entries.find((e) => e.weekNumber === comparisonWeekA) || data.entries[0];
  const compEntryB =
    data.entries.find((e) => e.weekNumber === comparisonWeekB) || data.entries[4];

  const renderNeutralDelta = (delta: number | null, unit: string) => {
    if (delta === null) return null;
    const isNeutral = Math.abs(delta) < 0.05;
    const isUp = delta >= 0.05;
    return (
      <span
        className={`ml-auto inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
          isNeutral ? 'text-slate-500' : isUp ? 'text-indigo-700' : 'text-sky-700'
        }`}
      >
        {isNeutral ? (
          <Minus className="w-3 h-3" />
        ) : isUp ? (
          <ArrowUpRight className="w-3.5 h-3.5" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5" />
        )}
        <span>
          {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} {unit}
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for photos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*"
        className="hidden"
      />

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* In-App Confirmation Modal: Clear Form */}
      {showClearModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowClearModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Eraser className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clear Transformation Tracker?</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              This will wipe all 13 weeks of data including weights, body circumferences, daily
              step counts, nutrition targets, weekly feedback, and uploaded progress photos.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeClearForm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Yes, Clear Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Reset Defaults */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Reset to Sample Template?</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              This will reload the reference 12-week transformation template data and replace your
              current entries and uploaded photos.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeResetDefaults}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Lightbox */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl p-2 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <span className="font-semibold text-sm">{enlargedPhoto.title}</span>
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={enlargedPhoto.url}
                alt={enlargedPhoto.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <Scale className="w-3.5 h-3.5" />
              <span>Nutrition &amp; Transformation Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Body Transformation &amp; Weekly Check-In
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Simple weekly check-ins, automatic 7-day weight averages, milestone reviews at Weeks
              4, 8, and 12, visual trend charts, and 4-point progress photos.
            </p>
          </div>

          {/* Quick Date & Control Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <label htmlFor="start-date-input" className="text-xs font-medium text-slate-600">
                Start Date:
              </label>
              <input
                id="start-date-input"
                type="date"
                value={data.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div
              className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1"
              role="group"
              aria-label="Measurement units"
            >
              <Ruler className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
              <button
                type="button"
                onClick={() => handleMeasureUnitChange('cm')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  measureUnit === 'cm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                cm
              </button>
              <button
                type="button"
                onClick={() => handleMeasureUnitChange('in')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  measureUnit === 'in'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                inches
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Download 12-week transformation log as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleClearForm}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 cursor-pointer active:scale-95"
              title="Clear all measurements and photos to start fresh"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Form</span>
            </button>

            <button
              onClick={handleResetData}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer active:scale-95"
              title="Reset to sample baseline template values"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* 3 Customizable Header Steps */}
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Pencil className="w-3 h-3 text-slate-400" />
              <span>3-Step Nutrition Workflow (Click title or notes to customize)</span>
            </span>
            {JSON.stringify(headerSteps) !== JSON.stringify(DEFAULT_NUTRITION_STEPS) && (
              <button
                type="button"
                onClick={handleResetHeaderSteps}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Reset Steps
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {headerSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-slate-50/80 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 transition-colors flex flex-col gap-1.5 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                    Step {step.stepNumber}
                  </span>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) =>
                      handleStepFieldChange(step.stepNumber, 'title', e.target.value)
                    }
                    onBlur={handleStepBlur}
                    placeholder={`Step ${step.stepNumber} title...`}
                    aria-label={`Step ${step.stepNumber} custom title`}
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded px-1.5 py-0.5 focus:outline-none transition-colors"
                  />
                </div>
                <textarea
                  rows={2}
                  value={step.notes}
                  onChange={(e) =>
                    handleStepFieldChange(step.stepNumber, 'notes', e.target.value)
                  }
                  onBlur={handleStepBlur}
                  placeholder={`Add custom notes for Step ${step.stepNumber}...`}
                  aria-label={`Step ${step.stepNumber} custom notes`}
                  className="w-full text-xs text-slate-600 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded px-1.5 py-1 focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
              Current Weight
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {currentWeight > 0 ? currentWeight.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500">lbs</span>
              {renderNeutralDelta(weightDeltaNum, 'lbs')}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {latestSevenDayStats && latestSevenDayStats.avg !== null
                ? `7-Day Avg (${latestSevenDayStats.weekLabel}): ${latestSevenDayStats.avg.toFixed(1)} lbs`
                : startWeight > 0
                ? `From ${startWeight} lbs at start`
                : 'Log weight in check-in'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
              Stomach at Navel
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {displayCurrentNavel > 0 ? displayCurrentNavel.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500">{measureUnit}</span>
              {renderNeutralDelta(navelDeltaNum, measureUnit)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {displayStartNavel > 0
                ? `From ${displayStartNavel.toFixed(1)} ${measureUnit} at start`
                : 'Enter waist measurement'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
              {selectedEntry?.weekLabel || 'Selected'} Calories
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {effectiveSelectedTargetCals !== null
                  ? effectiveSelectedTargetCals.toLocaleString('en-US')
                  : '—'}
              </span>
              <span className="text-xs text-slate-500">kcal/d</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              {selectedEntry?.actualDailyCalories
                ? `Actual avg: ${selectedEntry.actualDailyCalories} kcal · Adherence: ${
                    selectedEntry.calorieAdherence || '—'
                  }`
                : selectedEntry?.trainingDayCalories &&
                  selectedEntry?.restDayCalories &&
                  selectedEntry.trainingDayCalories !== selectedEntry.restDayCalories
                ? `Cycled: ${selectedEntry.trainingDayCalories} High / ${selectedEntry.restDayCalories} Low`
                : 'Target calorie intake'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
              {selectedEntry?.weekLabel || 'Selected'} Activity
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {selectedEntry?.actualDailySteps
                  ? Number(selectedEntry.actualDailySteps).toLocaleString('en-US')
                  : '—'}
              </span>
              <span className="text-xs text-slate-500">steps</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              {selectedEntry?.trainingAdherence
                ? `Training consistency: ${selectedEntry.trainingAdherence}`
                : selectedEntry?.trainingDays
                ? `${selectedEntry.trainingDays} training days logged`
                : `Target: ${selectedEntry?.targetDailySteps || '8,000'} steps/day`}
            </span>
          </div>
        </div>

        {/* Clean View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>12-Week Overview &amp; Check-In</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('charts')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'charts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visual Progress &amp; Charts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('photos')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'photos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Progress Photos</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: 12-Week Overview & Weekly Check-In Form */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 12-Week Clickable Overview Cards */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  12-Week Transformation Overview
                </h2>
                <p className="text-xs text-slate-500">
                  Click any week to open its weekly check-in form. Weeks 4, 8, and 12 are highlighted
                  milestone reviews.
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                Editing: {selectedEntry?.weekLabel}
              </span>
            </div>

            <TwelveWeekOverview
              entries={data.entries}
              selectedWeek={selectedWeek}
              measureUnit={measureUnit}
              onSelectWeekForCheckIn={handleSelectWeekFromOverview}
            />
          </div>

          {/* Weekly Check-In Form */}
          <div ref={checkInSectionRef} className="scroll-mt-4">
            <WeeklyCheckInForm
              entries={data.entries}
              selectedWeek={selectedWeek}
              measureUnit={measureUnit}
              onMeasureUnitChange={handleMeasureUnitChange}
              onSelectWeek={setSelectedWeek}
              onSaveEntry={handleSaveCheckInEntry}
              onJumpToWeighIn={handleJumpToWeighIn}
            />
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Visual Progress Tracking & Charts */}
      {activeSubTab === 'charts' && (
        <TransformationCharts entries={data.entries} measureUnit={measureUnit} />
      )}

      {/* SUB-VIEW 3: Progress Photos & Side-by-Side Comparison */}
      {activeSubTab === 'photos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Progress Photo Studio</h2>
                <p className="text-xs text-slate-500">
                  Select any week to upload Front, Back, Left Side, and Right Side progress photos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="photo-week-select"
                className="text-xs font-semibold text-slate-600"
              >
                Viewing Week:
              </label>
              <select
                id="photo-week-select"
                value={selectedPhotoWeek}
                onChange={(e) => setSelectedPhotoWeek(Number(e.target.value))}
                className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {data.entries.map((entry) => (
                  <option key={entry.weekNumber} value={entry.weekNumber}>
                    {entry.weekLabel} ({entry.date}) {entry.isMilestone ? '★ Milestone' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Photo Upload Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {currentSelectedPhotoEntry.weekLabel} ({currentSelectedPhotoEntry.date}) Photos
                </h3>
                <span className="text-xs text-slate-500">
                  Body Weight:{' '}
                  {currentSelectedPhotoEntry.weight
                    ? `${currentSelectedPhotoEntry.weight} lbs`
                    : 'Not logged'}{' '}
                  · Waist:{' '}
                  {currentSelectedPhotoEntry.navelAt
                    ? `${formatCmForDisplay(currentSelectedPhotoEntry.navelAt, measureUnit)} ${measureUnit}`
                    : 'Not logged'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PhotoCard
                angleLabel="Front View"
                angleKey="front"
                imageUrl={currentSelectedPhotoEntry.photos?.front}
                onUpload={() => initiatePhotoUpload('front')}
                onDelete={() => handleDeletePhoto(selectedPhotoWeek, 'front')}
                onEnlarge={(url) =>
                  setEnlargedPhoto({
                    url,
                    title: `${currentSelectedPhotoEntry.weekLabel} - Front View`,
                  })
                }
              />
              <PhotoCard
                angleLabel="Back View"
                angleKey="back"
                imageUrl={currentSelectedPhotoEntry.photos?.back}
                onUpload={() => initiatePhotoUpload('back')}
                onDelete={() => handleDeletePhoto(selectedPhotoWeek, 'back')}
                onEnlarge={(url) =>
                  setEnlargedPhoto({
                    url,
                    title: `${currentSelectedPhotoEntry.weekLabel} - Back View`,
                  })
                }
              />
              <PhotoCard
                angleLabel="Left Side View"
                angleKey="leftSide"
                imageUrl={currentSelectedPhotoEntry.photos?.leftSide}
                onUpload={() => initiatePhotoUpload('leftSide')}
                onDelete={() => handleDeletePhoto(selectedPhotoWeek, 'leftSide')}
                onEnlarge={(url) =>
                  setEnlargedPhoto({
                    url,
                    title: `${currentSelectedPhotoEntry.weekLabel} - Left Side View`,
                  })
                }
              />
              <PhotoCard
                angleLabel="Right Side View"
                angleKey="rightSide"
                imageUrl={currentSelectedPhotoEntry.photos?.rightSide}
                onUpload={() => initiatePhotoUpload('rightSide')}
                onDelete={() => handleDeletePhoto(selectedPhotoWeek, 'rightSide')}
                onEnlarge={(url) =>
                  setEnlargedPhoto({
                    url,
                    title: `${currentSelectedPhotoEntry.weekLabel} - Right Side View`,
                  })
                }
              />
            </div>
          </div>

          {/* Side-by-Side Comparison Tool */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Side-by-Side Milestone Comparison
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Compare:</span>
                  <select
                    value={comparisonWeekA}
                    onChange={(e) => setComparisonWeekA(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800"
                  >
                    {data.entries.map((e) => (
                      <option key={e.weekNumber} value={e.weekNumber}>
                        {e.weekLabel} ({e.date})
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-400 font-bold">vs</span>

                <div className="flex items-center gap-1.5 text-xs">
                  <select
                    value={comparisonWeekB}
                    onChange={(e) => setComparisonWeekB(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800"
                  >
                    {data.entries.map((e) => (
                      <option key={e.weekNumber} value={e.weekNumber}>
                        {e.weekLabel} ({e.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {compEntryA.weekLabel} · {compEntryA.date}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold tabular-nums">
                    {compEntryA.weight ? `${compEntryA.weight} lbs` : '—'} | Waist:{' '}
                    {compEntryA.navelAt
                      ? `${formatCmForDisplay(compEntryA.navelAt, measureUnit)} ${measureUnit}`
                      : '—'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ComparisonSlot
                    title="Front"
                    url={compEntryA.photos?.front}
                    onEnlarge={() =>
                      compEntryA.photos?.front &&
                      setEnlargedPhoto({
                        url: compEntryA.photos.front,
                        title: `${compEntryA.weekLabel} - Front`,
                      })
                    }
                  />
                  <ComparisonSlot
                    title="Side"
                    url={compEntryA.photos?.leftSide || compEntryA.photos?.rightSide}
                    onEnlarge={() => {
                      const u = compEntryA.photos?.leftSide || compEntryA.photos?.rightSide;
                      if (u)
                        setEnlargedPhoto({
                          url: u,
                          title: `${compEntryA.weekLabel} - Side`,
                        });
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {compEntryB.weekLabel} · {compEntryB.date}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold tabular-nums">
                    {compEntryB.weight ? `${compEntryB.weight} lbs` : '—'} | Waist:{' '}
                    {compEntryB.navelAt
                      ? `${formatCmForDisplay(compEntryB.navelAt, measureUnit)} ${measureUnit}`
                      : '—'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ComparisonSlot
                    title="Front"
                    url={compEntryB.photos?.front}
                    onEnlarge={() =>
                      compEntryB.photos?.front &&
                      setEnlargedPhoto({
                        url: compEntryB.photos.front,
                        title: `${compEntryB.weekLabel} - Front`,
                      })
                    }
                  />
                  <ComparisonSlot
                    title="Side"
                    url={compEntryB.photos?.leftSide || compEntryB.photos?.rightSide}
                    onEnlarge={() => {
                      const u = compEntryB.photos?.leftSide || compEntryB.photos?.rightSide;
                      if (u)
                        setEnlargedPhoto({
                          url: u,
                          title: `${compEntryB.weekLabel} - Side`,
                        });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily AM Weigh-In (7 Days) & Calculated 7-Day Average */}
      <div ref={weighInSectionRef} className="scroll-mt-4">
        <DailyWeighInTracker
          startDate={data.startDate}
          entries={data.entries}
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
          onDailyWeighInChange={handleDailyWeighInChange}
          onApplyAvgToWeekWeight={handleApplyAvgToWeekWeight}
          onClearWeekWeighIns={handleClearWeekWeighIns}
        />
      </div>

      {/* Calorie & Lifestyle TDEE Calculator */}
      <CalorieCalculator
        initialWeightLbs={
          latestSevenDayStats && latestSevenDayStats.avg !== null
            ? Math.round(latestSevenDayStats.avg * 10) / 10
            : currentWeight
        }
        entries={data.entries}
        onApplyCalories={handleApplyCalculatorCalories}
      />
    </div>
  );
};

/* --- Photo Card Component --- */
interface PhotoCardProps {
  angleLabel: string;
  angleKey: string;
  imageUrl?: string;
  onUpload: () => void;
  onDelete: () => void;
  onEnlarge: (url: string) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  angleLabel,
  imageUrl,
  onUpload,
  onDelete,
  onEnlarge,
}) => {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col group">
      <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">{angleLabel}</span>
        {imageUrl && (
          <button
            onClick={onDelete}
            title="Delete this photo"
            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="relative aspect-3/4 flex items-center justify-center bg-slate-200/60 overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={angleLabel}
              className="w-full h-full object-cover transition-transform group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => onEnlarge(imageUrl)}
                className="p-2 bg-white/90 hover:bg-white text-slate-900 rounded-lg shadow-md transition-colors"
                title="Enlarge"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={onUpload}
                className="p-2 bg-white/90 hover:bg-white text-slate-900 rounded-lg shadow-md transition-colors"
                title="Replace photo"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 text-center flex flex-col items-center">
            <Camera className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />
            <span className="text-xs font-medium text-slate-600">No Photo</span>
            <span className="text-[11px] text-slate-400 mt-0.5 mb-3">
              Front lighting recommended
            </span>
            <button
              onClick={onUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- Comparison Slot Helper --- */
const ComparisonSlot: React.FC<{
  title: string;
  url?: string;
  onEnlarge: () => void;
}> = ({ title, url, onEnlarge }) => {
  return (
    <div className="relative aspect-3/4 bg-slate-200 rounded-lg overflow-hidden border border-slate-300/80 flex items-center justify-center">
      {url ? (
        <div className="relative w-full h-full cursor-pointer group" onClick={onEnlarge}>
          <img src={url} alt={title} className="w-full h-full object-cover" />
          <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs">
            {title}
          </div>
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Eye className="w-5 h-5 drop-shadow" />
          </div>
        </div>
      ) : (
        <div className="text-center p-2">
          <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1 stroke-1" />
          <span className="text-[10px] font-medium text-slate-500">No {title} Photo</span>
        </div>
      )}
    </div>
  );
};
