import React, { useState, useRef } from 'react';
import {
  Calendar,
  Scale,
  Ruler,
  Utensils,
  Camera,
  Activity,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Eraser,
  Eye,
  ArrowRightLeft,
  X,
  Plus,
  CheckCircle2,
  Info,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  WeeklyProgressEntry,
  INITIAL_START_DATE,
  calculateDateForWeek,
  generateDefaultProgressEntries,
  generateEmptyProgressEntries,
  getStoredTransformationData,
  saveStoredTransformationData,
} from '../data/transformationData';

export const TransformationView: React.FC = () => {
  const [data, setData] = useState<{
    startDate: string;
    entries: WeeklyProgressEntry[];
  }>(() => getStoredTransformationData());

  const [activeSubTab, setActiveSubTab] = useState<'spreadsheet' | 'photos' | 'summary'>('spreadsheet');
  const [selectedPhotoWeek, setSelectedPhotoWeek] = useState<number>(0);
  const [comparisonWeekA, setComparisonWeekA] = useState<number>(0);
  const [comparisonWeekB, setComparisonWeekB] = useState<number>(4);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [unitMode, setUnitMode] = useState<'lbs_cm' | 'kg_cm'>('lbs_cm');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUploadAngle, setPendingUploadAngle] = useState<'front' | 'back' | 'leftSide' | 'rightSide' | null>(null);

  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Trigger brief auto-save toast
  const triggerSaveNotification = (msg: string = 'Changes saved') => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 2000);
  };

  // Handle start date update
  const handleStartDateChange = (newDate: string) => {
    const updatedEntries = data.entries.map((entry) => ({
      ...entry,
      date: calculateDateForWeek(newDate, entry.weekNumber),
    }));
    const nextData = { startDate: newDate, entries: updatedEntries };
    setData(nextData);
    saveStoredTransformationData(newDate, updatedEntries);
    triggerSaveNotification('Start date & weekly dates updated');
  };

  // Handle cell edits in spreadsheet
  const handleCellChange = (
    weekNumber: number,
    field: keyof WeeklyProgressEntry,
    val: string
  ) => {
    const updatedEntries = data.entries.map((entry) => {
      if (entry.weekNumber === weekNumber) {
        return {
          ...entry,
          [field]: val,
        };
      }
      return entry;
    });

    const nextData = { ...data, entries: updatedEntries };
    setData(nextData);
    saveStoredTransformationData(data.startDate, updatedEntries);
  };

  // Open in-app Reset modal
  const handleResetData = () => {
    setShowResetModal(true);
  };

  // Execute reset to default baseline template
  const executeResetDefaults = () => {
    const defaults = generateDefaultProgressEntries(INITIAL_START_DATE);
    setData({ startDate: INITIAL_START_DATE, entries: defaults });
    saveStoredTransformationData(INITIAL_START_DATE, defaults);
    triggerSaveNotification('Reset to baseline template');
    setShowResetModal(false);
  };

  // Open in-app Clear modal
  const handleClearForm = () => {
    setShowClearModal(true);
  };

  // Execute clear all form entries and photos for a fresh blank tracker
  const executeClearForm = () => {
    const blankEntries = generateEmptyProgressEntries(data.startDate);
    const nextData = { startDate: data.startDate, entries: blankEntries };
    setData(nextData);
    saveStoredTransformationData(data.startDate, blankEntries);
    triggerSaveNotification('Form cleared. All measurements reset to blank.');
    setShowClearModal(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Metric', ...data.entries.map((e) => `${e.weekLabel} (${e.date})`)];
    const rows: string[][] = [
      headers,
      ['Weight', ...data.entries.map((e) => `"${e.weight}"`)],
      ['Chest (cm)', ...data.entries.map((e) => `"${e.chest}"`)],
      ['Right Arm (cm)', ...data.entries.map((e) => `"${e.rightArm}"`)],
      ['Left Arm (cm)', ...data.entries.map((e) => `"${e.leftArm}"`)],
      ['3 Fingers Above Navel (cm)', ...data.entries.map((e) => `"${e.navelAbove}"`)],
      ['Stomach at Navel (cm)', ...data.entries.map((e) => `"${e.navelAt}"`)],
      ['3 Fingers Below Navel (cm)', ...data.entries.map((e) => `"${e.navelBelow}"`)],
      ['Hips (cm)', ...data.entries.map((e) => `"${e.hips}"`)],
      ['Right Thigh (cm)', ...data.entries.map((e) => `"${e.rightThigh}"`)],
      ['Left Thigh (cm)', ...data.entries.map((e) => `"${e.leftThigh}"`)],
      ['Height (cm)', ...data.entries.map((e) => `"${e.height}"`)],
      ['Target Rate of Weight Change', ...data.entries.map((e) => `"${e.targetRateWeight}"`)],
      ['Target Daily Steps', ...data.entries.map((e) => `"${e.targetDailySteps}"`)],
      ['Actual Daily Steps', ...data.entries.map((e) => `"${e.actualDailySteps}"`)],
      ['Training Time', ...data.entries.map((e) => `"${e.trainingTime}"`)],
      ['Meal Times', ...data.entries.map((e) => `"${e.mealTimes}"`)],
      ['Training Day Calories', ...data.entries.map((e) => `"${e.trainingDayCalories}"`)],
      ['Training Day Macros', ...data.entries.map((e) => `"${e.trainingDayMacros}"`)],
      ['Rest Day Calories', ...data.entries.map((e) => `"${e.restDayCalories}"`)],
      ['Rest Day Macros', ...data.entries.map((e) => `"${e.restDayMacros}"`)],
      ['Calorie Adherence', ...data.entries.map((e) => `"${e.calorieAdherence}"`)],
      ['Training Adherence', ...data.entries.map((e) => `"${e.trainingAdherence}"`)],
      ['Sleep (0-5)', ...data.entries.map((e) => `"${e.sleepScore}"`)],
      ['Stress (0-5)', ...data.entries.map((e) => `"${e.stressScore}"`)],
      ['Hunger (0-5)', ...data.entries.map((e) => `"${e.hungerScore}"`)],
      ['Fatigue (0-5)', ...data.entries.map((e) => `"${e.fatigueScore}"`)],
      ['Key Skill / Lift Progress', ...data.entries.map((e) => `"${e.keySkillProgress}"`)],
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

    // Check size limit: 4MB max for browser storage
    if (file.size > 4 * 1024 * 1024) {
      alert('Please select an image under 4MB for fast in-browser preview.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const updatedEntries = data.entries.map((entry) => {
          if (entry.weekNumber === selectedPhotoWeek) {
            return {
              ...entry,
              photos: {
                ...entry.photos,
                [pendingUploadAngle]: base64,
              },
            };
          }
          return entry;
        });

        const nextData = { ...data, entries: updatedEntries };
        setData(nextData);
        saveStoredTransformationData(data.startDate, updatedEntries);
        triggerSaveNotification(`Photo added for ${pendingUploadAngle}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (weekNum: number, angle: 'front' | 'back' | 'leftSide' | 'rightSide') => {
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

    const nextData = { ...data, entries: updatedEntries };
    setData(nextData);
    saveStoredTransformationData(data.startDate, updatedEntries);
    triggerSaveNotification(`Photo removed`);
  };

  // Helper stats
  const startWeight = parseFloat(data.entries[0]?.weight) || 0;
  const currentWeekEntry = [...data.entries].reverse().find((e) => e.weight && parseFloat(e.weight) > 0) || null;
  const currentWeight = currentWeekEntry ? parseFloat(currentWeekEntry.weight) : (startWeight || 0);
  const weightChange = currentWeight && startWeight ? (currentWeight - startWeight).toFixed(1) : '0.0';

  const startNavel = parseFloat(data.entries[0]?.navelAt) || 0;
  const currentNavelEntry = [...data.entries].reverse().find((e) => e.navelAt && parseFloat(e.navelAt) > 0) || null;
  const currentNavel = currentNavelEntry ? parseFloat(currentNavelEntry.navelAt) : (startNavel || 0);
  const navelChange = currentNavel && startNavel ? (currentNavel - startNavel).toFixed(1) : '0.0';

  // Selected entry for photos tab
  const currentSelectedPhotoEntry = data.entries.find((e) => e.weekNumber === selectedPhotoWeek) || data.entries[0];
  const compEntryA = data.entries.find((e) => e.weekNumber === comparisonWeekA) || data.entries[0];
  const compEntryB = data.entries.find((e) => e.weekNumber === comparisonWeekB) || data.entries[4];

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
            <h3 className="text-lg font-bold text-slate-900">Clear Transformation Form?</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              This will wipe all 13 weeks of data including weights, body circumferences, daily step counts, nutrition targets, biofeedback scores, and all uploaded progress photos. You will get a completely blank spreadsheet to log your personal data.
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
              This will reload the reference 12-week physique audit template data and replace your current entries and uploaded photos.
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <Scale className="w-3.5 h-3.5" />
              <span>Nutrition & Transformation Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Body Transformation & Nutrition System
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Modeled after the comprehensive 12-week physique audit spreadsheet: tracking weight changes,
              circumference measurements, macro adherence, biofeedback scores, and 4-point progress photos.
            </p>
          </div>

          {/* Quick Date & Control Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
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

            <button
              onClick={handleExportCSV}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Download spreadsheet as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleClearForm}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 cursor-pointer active:scale-95"
              title="Clear all measurements and photos to start with a blank form"
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

        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
              Current Weight
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {currentWeight > 0 ? `${currentWeight}` : '—'}
              </span>
              <span className="text-xs text-slate-500">lbs</span>
              {startWeight > 0 && currentWeight > 0 && (
                <span
                  className={`ml-auto text-xs font-semibold tabular-nums ${
                    parseFloat(weightChange) <= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {parseFloat(weightChange) > 0 ? `+${weightChange}` : weightChange} lbs
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {startWeight > 0 ? `From ${startWeight} lbs at start` : 'Enter start weight below'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
              Stomach at Navel
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {currentNavel > 0 ? `${currentNavel}` : '—'}
              </span>
              <span className="text-xs text-slate-500">cm</span>
              {startNavel > 0 && currentNavel > 0 && (
                <span
                  className={`ml-auto text-xs font-semibold tabular-nums ${
                    parseFloat(navelChange) <= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {parseFloat(navelChange) > 0 ? `+${navelChange}` : navelChange} cm
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {startNavel > 0 ? 'Key waistline indicator' : 'Enter waist circumference'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
              Training Day Target
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {data.entries[0]?.trainingDayCalories ? `${data.entries[0].trainingDayCalories}` : '—'}
              </span>
              <span className="text-xs text-slate-500">kcal</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              {data.entries[0]?.trainingDayMacros ? data.entries[0].trainingDayMacros : '—'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">
              Rest Day Target
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {data.entries[0]?.restDayCalories ? `${data.entries[0].restDayCalories}` : '—'}
              </span>
              <span className="text-xs text-slate-500">kcal</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              {data.entries[0]?.restDayMacros ? data.entries[0].restDayMacros : '—'}
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveSubTab('spreadsheet')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'spreadsheet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <span>Spreadsheet Tracker</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20">13 Weeks</span>
          </button>

          <button
            onClick={() => setActiveSubTab('photos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'photos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Progress Photos (Front/Back/Sides)</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: Interactive Spreadsheet Table */}
      {activeSubTab === 'spreadsheet' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header Note */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Click any cell</strong> to edit directly. Golden columns (<strong>Week 4, Week 8, Week 12</strong>) represent major review milestones.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                ★ Milestone Check (W4, W8, W12)
              </span>
            </div>
          </div>

          {/* Horizontally scrollable table container with sticky column */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700">
                  {/* Sticky Metric Title Column */}
                  <th className="sticky left-0 z-20 bg-slate-100 px-4 py-3 font-bold uppercase tracking-wider text-[11px] min-w-[210px] w-[210px] shadow-[2px_0_4px_rgba(0,0,0,0.03)] border-r border-slate-200">
                    Metric / Week
                  </th>

                  {/* 13 Week Columns (0 to 12) */}
                  {data.entries.map((entry) => {
                    const isMilestone = entry.isMilestone;
                    return (
                      <th
                        key={entry.weekNumber}
                        className={`px-3 py-2.5 text-center min-w-[130px] w-[130px] border-r border-slate-200 font-semibold ${
                          entry.weekNumber === 0
                            ? 'bg-slate-200/70 text-slate-900'
                            : isMilestone
                            ? 'bg-amber-100 text-amber-950 font-bold border-amber-300'
                            : 'text-slate-800'
                        }`}
                      >
                        <div className="text-xs">{entry.weekLabel}</div>
                        <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                          {entry.date}
                        </div>
                        {isMilestone && entry.weekNumber > 0 && (
                          <div className="mt-0.5 inline-block text-[9px] font-bold text-amber-800 bg-amber-200/90 px-1.5 py-0.2 rounded uppercase">
                            Milestone
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-normal">
                {/* SECTION 1: MEASUREMENTS & WEIGHT */}
                <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={14}
                    className="sticky left-0 z-10 px-4 py-2 border-y border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-blue-600" />
                      <span>Body Weight & Circumference Measurements</span>
                    </div>
                  </td>
                </tr>

                {/* Weight */}
                <TableRowInput
                  label="Weight (lbs)"
                  badge="Fast morning"
                  field="weight"
                  entries={data.entries}
                  onChange={handleCellChange}
                  highlight
                />

                {/* Chest */}
                <TableRowInput
                  label="Chest (cm)"
                  badge="Nipples line"
                  field="chest"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Right Arm */}
                <TableRowInput
                  label="Right Arm (cm)"
                  badge="Flexed peak"
                  field="rightArm"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Left Arm */}
                <TableRowInput
                  label="Left Arm (cm)"
                  badge="Flexed peak"
                  field="leftArm"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* 3 Fingers Above Navel */}
                <TableRowInput
                  label="3 Fingers Above Navel (cm)"
                  badge="Narrowest"
                  field="navelAbove"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Stomach at Navel */}
                <TableRowInput
                  label="Stomach at Navel (cm)"
                  badge="Key belly fat"
                  field="navelAt"
                  entries={data.entries}
                  onChange={handleCellChange}
                  highlight
                />

                {/* 3 Fingers Below Navel */}
                <TableRowInput
                  label="3 Fingers Below Navel (cm)"
                  badge="Lower belly"
                  field="navelBelow"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Hips */}
                <TableRowInput
                  label="Hips (cm)"
                  badge="Widest glutes"
                  field="hips"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Right Thigh */}
                <TableRowInput
                  label="Right Thigh (cm)"
                  badge="Mid-thigh"
                  field="rightThigh"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Left Thigh */}
                <TableRowInput
                  label="Left Thigh (cm)"
                  badge="Mid-thigh"
                  field="leftThigh"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Height */}
                <TableRowInput
                  label="Height (cm)"
                  field="height"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Target Rate of Weight Change */}
                <TableRowInput
                  label="Target Rate of Weight Change"
                  field="targetRateWeight"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Target Daily Steps */}
                <TableRowInput
                  label="Target Daily Steps"
                  field="targetDailySteps"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Actual Daily Steps */}
                <TableRowInput
                  label="Actual Daily Steps"
                  field="actualDailySteps"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* SECTION 2: NUTRITION & SCHEDULE */}
                <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={14}
                    className="sticky left-0 z-10 px-4 py-2 border-y border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nutrition Targets & Adherence</span>
                    </div>
                  </td>
                </tr>

                {/* Training Time */}
                <TableRowInput
                  label="Training Time"
                  field="trainingTime"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Meal Times */}
                <TableRowInput
                  label="Meal Times"
                  field="mealTimes"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Training Day Calories */}
                <TableRowInput
                  label="Training Day Calories"
                  badge="Target kcal"
                  field="trainingDayCalories"
                  entries={data.entries}
                  onChange={handleCellChange}
                  highlight
                />

                {/* Training Day Macros */}
                <TableRowInput
                  label="Training Day Macros"
                  badge="P / C / F"
                  field="trainingDayMacros"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Rest Day Calories */}
                <TableRowInput
                  label="Rest Day Calories"
                  badge="Target kcal"
                  field="restDayCalories"
                  entries={data.entries}
                  onChange={handleCellChange}
                  highlight
                />

                {/* Rest Day Macros */}
                <TableRowInput
                  label="Rest Day Macros"
                  badge="P / C / F"
                  field="restDayMacros"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Calorie Adherence */}
                <TableRowInput
                  label="Calorie Adherence (%)"
                  field="calorieAdherence"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Training Adherence */}
                <TableRowInput
                  label="Training Adherence (%)"
                  field="trainingAdherence"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* SECTION 3: BIOFEEDBACK */}
                <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={14}
                    className="sticky left-0 z-10 px-4 py-2 border-y border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-violet-600" />
                      <span>Biofeedback (0–5 Scale: 0=Best, 5=Severe)</span>
                    </div>
                  </td>
                </tr>

                {/* Sleep */}
                <TableRowInput
                  label="Sleep Quality (0-5)"
                  badge="0=rested, 5=poor"
                  field="sleepScore"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Stress */}
                <TableRowInput
                  label="Stress Level (0-5)"
                  badge="0=calm, 5=high"
                  field="stressScore"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Hunger */}
                <TableRowInput
                  label="Hunger Level (0-5)"
                  badge="0=satiated, 5=starving"
                  field="hungerScore"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* Fatigue */}
                <TableRowInput
                  label="Fatigue Level (0-5)"
                  badge="0=fresh, 5=exhausted"
                  field="fatigueScore"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* SECTION 4: KEY SKILLS */}
                <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={14}
                    className="sticky left-0 z-10 px-4 py-2 border-y border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-amber-600" />
                      <span>Key Planche & Calisthenics Strength Progress</span>
                    </div>
                  </td>
                </tr>

                {/* Key Skill Progress */}
                <TableRowInput
                  label="Key Skill Progress"
                  badge="e.g. Hold s, Reps"
                  field="keySkillProgress"
                  entries={data.entries}
                  onChange={handleCellChange}
                />

                {/* SECTION 5: PHOTOS ROW */}
                <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={14}
                    className="sticky left-0 z-10 px-4 py-2 border-y border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Progress Photos (Front / Back / Sides)</span>
                      </div>
                      <button
                        onClick={() => setActiveSubTab('photos')}
                        className="text-blue-600 hover:text-blue-700 text-xs normal-case font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Photo Studio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="sticky left-0 z-20 bg-white px-4 py-3 font-medium text-slate-700 text-xs shadow-[2px_0_4px_rgba(0,0,0,0.03)] border-r border-slate-200">
                    <div className="font-semibold text-slate-900">Photos Status</div>
                    <div className="text-[10px] text-slate-400">Front, Back, L/R Side</div>
                  </td>

                  {data.entries.map((entry) => {
                    const photoCount = Object.keys(entry.photos || {}).filter(
                      (k) => !!entry.photos[k as keyof typeof entry.photos]
                    ).length;

                    return (
                      <td
                        key={entry.weekNumber}
                        className={`px-2 py-2 text-center border-r border-slate-200 ${
                          entry.isMilestone ? 'bg-amber-50/50' : 'bg-white'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setSelectedPhotoWeek(entry.weekNumber);
                            setActiveSubTab('photos');
                          }}
                          className={`w-full py-1.5 px-2 rounded text-[11px] font-medium transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            photoCount > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-dashed border-slate-200 hover:text-slate-600'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{photoCount > 0 ? `${photoCount}/4 Photos` : '+ Add'}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Progress Photos Gallery & Side-by-Side Comparison */}
      {activeSubTab === 'photos' && (
        <div className="space-y-6">
          {/* Week Selector Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Physical Progress Photos</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standardized front, back, and side postures under consistent lighting and morning fasting conditions.
                </p>
              </div>

              {/* Week Pill Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {data.entries.map((e) => (
                  <button
                    key={e.weekNumber}
                    onClick={() => setSelectedPhotoWeek(e.weekNumber)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      selectedPhotoWeek === e.weekNumber
                        ? 'bg-blue-600 text-white shadow-xs'
                        : e.isMilestone
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{e.weekLabel}</span>
                    {Object.keys(e.photos || {}).length > 0 && (
                      <span className="ml-1 text-[10px] opacity-80">
                        ({Object.keys(e.photos || {}).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Photo Upload Grid for Selected Week */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {currentSelectedPhotoEntry.weekLabel} ({currentSelectedPhotoEntry.date}) Photos
                </h3>
                <span className="text-xs text-slate-500">
                  Body Weight: {currentSelectedPhotoEntry.weight ? `${currentSelectedPhotoEntry.weight} lbs` : 'Not logged'} · Waist: {currentSelectedPhotoEntry.navelAt ? `${currentSelectedPhotoEntry.navelAt} cm` : 'Not logged'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. FRONT ANGLE */}
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

              {/* 2. BACK ANGLE */}
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

              {/* 3. LEFT SIDE */}
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

              {/* 4. RIGHT SIDE */}
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

              {/* Selectors for Week A vs Week B */}
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

            {/* Comparison Grid (Front & Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Panel A */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {compEntryA.weekLabel} · {compEntryA.date}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold tabular-nums">
                    {compEntryA.weight ? `${compEntryA.weight} lbs` : '—'} | Waist:{' '}
                    {compEntryA.navelAt ? `${compEntryA.navelAt} cm` : '—'}
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

              {/* Panel B */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {compEntryB.weekLabel} · {compEntryB.date}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold tabular-nums">
                    {compEntryB.weight ? `${compEntryB.weight} lbs` : '—'} | Waist:{' '}
                    {compEntryB.navelAt ? `${compEntryB.navelAt} cm` : '—'}
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
    </div>
  );
};

/* --- Table Sub-Row Helper for Interactive Spreadsheet Cells --- */
interface TableRowInputProps {
  label: string;
  badge?: string;
  field: keyof WeeklyProgressEntry;
  entries: WeeklyProgressEntry[];
  onChange: (weekNum: number, field: keyof WeeklyProgressEntry, val: string) => void;
  highlight?: boolean;
}

const TableRowInput: React.FC<TableRowInputProps> = ({
  label,
  badge,
  field,
  entries,
  onChange,
  highlight,
}) => {
  return (
    <tr className={`hover:bg-blue-50/40 transition-colors ${highlight ? 'bg-amber-50/20' : ''}`}>
      {/* Sticky Metric Column */}
      <td className="sticky left-0 z-10 bg-white hover:bg-slate-50 px-4 py-2 font-medium text-slate-800 text-xs shadow-[2px_0_4px_rgba(0,0,0,0.03)] border-r border-slate-200 whitespace-nowrap">
        <div className="flex items-center justify-between gap-2">
          <span className={highlight ? 'font-semibold text-slate-900' : ''}>{label}</span>
          {badge && (
            <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.2 rounded">
              {badge}
            </span>
          )}
        </div>
      </td>

      {/* 13 Input Cells */}
      {entries.map((entry) => {
        const val = (entry[field] as string) || '';
        const isMilestone = entry.isMilestone;

        return (
          <td
            key={entry.weekNumber}
            className={`p-0 border-r border-slate-200 text-center ${
              isMilestone ? 'bg-amber-50/40' : ''
            }`}
          >
            <input
              type="text"
              value={val}
              onChange={(e) => onChange(entry.weekNumber, field, e.target.value)}
              placeholder="—"
              className={`w-full px-2.5 py-2 text-center text-xs tabular-nums bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                highlight && val ? 'font-semibold text-slate-900' : 'text-slate-700'
              }`}
            />
          </td>
        );
      })}
    </tr>
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
            <span className="text-[11px] text-slate-400 mt-0.5 mb-3">Front lighting recommended</span>
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
