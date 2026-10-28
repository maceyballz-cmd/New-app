import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Moon,
  Plus,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  Flame,
  Clock,
  Sparkles,
  FileText,
  Activity,
  Award,
  Zap,
} from 'lucide-react';

export type DayLogType = 'workout' | 'rest';

export interface WorkoutLogData {
  workoutName: string;
  workoutIntensity: string;
  durationMinutes: number;
  completedSets: number;
  totalSets: number;
  exercises?: string;
  targetRpe: string;
  notes?: string;
}

export interface RestLogData {
  restType: 'Full Rest' | 'Active Recovery' | 'Mobility & Prehab';
  sleepQuality?: string;
  fatigueLevel?: string;
  notes?: string;
}

export interface CalendarDayLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  type: DayLogType;
  workoutDetails?: WorkoutLogData;
  restDetails?: RestLogData;
  createdAt?: string;
}

const STORAGE_CALENDAR_KEY = 'planche_calendar_logs';
const STORAGE_WORKOUT_HISTORY_KEY = 'planche_workout_history';

// Helper to format date to YYYY-MM-DD in local time
export const formatDateToKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const WorkoutCalendarView: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateToKey(today), [today]);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [calendarLogs, setCalendarLogs] = useState<Record<string, CalendarDayLog>>({});
  
  // Modals state
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [deleteConfirmDate, setDeleteConfirmDate] = useState<string | null>(null);

  // Form states for Workout Modal
  const [wDate, setWDate] = useState<string>(todayKey);
  const [wName, setWName] = useState<string>('Planche Submaximal Protocol (50-60%)');
  const [wIntensity, setWIntensity] = useState<string>('Submaximal 50–60%');
  const [wDuration, setWDuration] = useState<number>(45);
  const [wCompletedSets, setWCompletedSets] = useState<number>(18);
  const [wTotalSets, setWTotalSets] = useState<number>(18);
  const [wExercises, setWExercises] = useState<string>(
    'Tuck Planche Holds, Pseudo Planche Push-Ups, Dumbbell Planche Leans, Reverse Hyperextensions'
  );
  const [wRpe, setWRpe] = useState<string>('RPE 6-7 (2-3 RIR)');
  const [wNotes, setWNotes] = useState<string>('');

  // Form states for Rest Modal
  const [rDate, setRDate] = useState<string>(todayKey);
  const [rType, setRType] = useState<'Full Rest' | 'Active Recovery' | 'Mobility & Prehab'>('Full Rest');
  const [rSleep, setRSleep] = useState<string>('Good (7-8 hrs)');
  const [rFatigue, setRFatigue] = useState<string>('Fresh & Ready (1/5)');
  const [rNotes, setRNotes] = useState<string>('');

  // Load calendar logs from localStorage & sync with live session history
  const loadLogs = () => {
    try {
      const rawCal = localStorage.getItem(STORAGE_CALENDAR_KEY);
      let calMap: Record<string, CalendarDayLog> = {};
      if (rawCal) {
        calMap = JSON.parse(rawCal);
      }

      // Also merge any live session entries from 'planche_workout_history' if not already tracked
      const rawHistory = localStorage.getItem(STORAGE_WORKOUT_HISTORY_KEY);
      if (rawHistory) {
        const historyList: any[] = JSON.parse(rawHistory);
        historyList.forEach((entry, idx) => {
          if (!entry.date) return;
          const entryDate = new Date(entry.date);
          const key = formatDateToKey(entryDate);
          // If no log exists for this date, or if it was an auto-session, populate workout
          if (!calMap[key]) {
            calMap[key] = {
              id: `live-${idx}-${entry.date}`,
              date: key,
              type: 'workout',
              workoutDetails: {
                workoutName: entry.workoutName || 'Submaximal Live Session',
                workoutIntensity: entry.workoutIntensity || '50–60% Submax',
                durationMinutes: entry.durationMinutes || 45,
                completedSets: entry.completedSets || 18,
                totalSets: entry.totalSets || 18,
                targetRpe: entry.targetRpe || 'RPE 6-7',
                notes: entry.notes || '',
              },
              createdAt: entry.date,
            };
          }
        });
      }

      setCalendarLogs(calMap);
    } catch (e) {
      console.error('Failed to load calendar logs', e);
    }
  };

  useEffect(() => {
    loadLogs();
    const handleUpdate = () => loadLogs();
    window.addEventListener('planche_history_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('planche_history_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Save calendar logs to localStorage
  const saveCalendarLogs = (updatedLogs: Record<string, CalendarDayLog>) => {
    setCalendarLogs(updatedLogs);
    localStorage.setItem(STORAGE_CALENDAR_KEY, JSON.stringify(updatedLogs));
    window.dispatchEvent(new Event('planche_history_updated'));
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateKey(todayKey);
  };

  // Month calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Grid calculation: standard Sunday - Saturday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Summary stats for current displayed month
  const monthStats = useMemo(() => {
    let workouts = 0;
    let restDays = 0;
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInThisMonth; day++) {
      const dKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = calendarLogs[dKey];
      if (log) {
        if (log.type === 'workout') workouts++;
        if (log.type === 'rest') restDays++;
      }
    }

    const totalLogged = workouts + restDays;
    const consistencyRate = Math.round((totalLogged / daysInThisMonth) * 100);

    return { workouts, restDays, totalLogged, consistencyRate };
  }, [calendarLogs, year, month]);

  // Overall active streak calculation (counting consecutive days logged up to today)
  const currentStreak = useMemo(() => {
    let streak = 0;
    const checkDate = new Date();
    // Check if today or yesterday has a log
    const todayStr = formatDateToKey(checkDate);
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = formatDateToKey(checkDate);

    const startFromToday = !!calendarLogs[todayStr];
    const startFromYesterday = !!calendarLogs[yesterdayStr];

    if (!startFromToday && !startFromYesterday) {
      return 0;
    }

    const runner = new Date();
    if (!startFromToday) {
      runner.setDate(runner.getDate() - 1);
    }

    while (true) {
      const key = formatDateToKey(runner);
      if (calendarLogs[key]) {
        streak++;
        runner.setDate(runner.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [calendarLogs]);

  // Open Log Workout modal
  const openWorkoutModal = (dateStr?: string, editLog?: CalendarDayLog) => {
    const targetDate = dateStr || selectedDateKey || todayKey;
    setWDate(targetDate);
    if (editLog && editLog.workoutDetails) {
      setEditingLogId(editLog.id);
      setWName(editLog.workoutDetails.workoutName);
      setWIntensity(editLog.workoutDetails.workoutIntensity);
      setWDuration(editLog.workoutDetails.durationMinutes);
      setWCompletedSets(editLog.workoutDetails.completedSets);
      setWTotalSets(editLog.workoutDetails.totalSets);
      setWExercises(editLog.workoutDetails.exercises || '');
      setWRpe(editLog.workoutDetails.targetRpe);
      setWNotes(editLog.workoutDetails.notes || '');
    } else {
      setEditingLogId(null);
      setWName('Planche Submaximal Protocol (50-60%)');
      setWIntensity('Submaximal 50–60%');
      setWDuration(45);
      setWCompletedSets(18);
      setWTotalSets(18);
      setWExercises('Tuck Planche Holds, Pseudo Planche Push-Ups, Dumbbell Planche Leans, Reverse Hyperextensions');
      setWRpe('RPE 6-7 (2-3 RIR)');
      setWNotes('');
    }
    setIsWorkoutModalOpen(true);
  };

  // Open Log Rest Day modal
  const openRestModal = (dateStr?: string, editLog?: CalendarDayLog) => {
    const targetDate = dateStr || selectedDateKey || todayKey;
    setRDate(targetDate);
    if (editLog && editLog.restDetails) {
      setEditingLogId(editLog.id);
      setRType(editLog.restDetails.restType);
      setRSleep(editLog.restDetails.sleepQuality || 'Good (7-8 hrs)');
      setRFatigue(editLog.restDetails.fatigueLevel || 'Fresh & Ready (1/5)');
      setRNotes(editLog.restDetails.notes || '');
    } else {
      setEditingLogId(null);
      setRType('Full Rest');
      setRSleep('Good (7-8 hrs)');
      setRFatigue('Fresh & Ready (1/5)');
      setRNotes('');
    }
    setIsRestModalOpen(true);
  };

  // Save Workout Submission
  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wDate) return;

    const newLog: CalendarDayLog = {
      id: editingLogId || `cal-${Date.now()}`,
      date: wDate,
      type: 'workout',
      workoutDetails: {
        workoutName: wName,
        workoutIntensity: wIntensity,
        durationMinutes: Number(wDuration) || 45,
        completedSets: Number(wCompletedSets) || 18,
        totalSets: Number(wTotalSets) || 18,
        exercises: wExercises,
        targetRpe: wRpe,
        notes: wNotes,
      },
      createdAt: new Date().toISOString(),
    };

    const updated = { ...calendarLogs, [wDate]: newLog };
    saveCalendarLogs(updated);

    // Also sync with planche_workout_history so the history list right above reflects this manual workout!
    try {
      const rawHistory = localStorage.getItem(STORAGE_WORKOUT_HISTORY_KEY);
      const historyList: any[] = rawHistory ? JSON.parse(rawHistory) : [];
      // Create a matching history entry
      const historyEntry = {
        date: new Date(`${wDate}T12:00:00`).toISOString(),
        completedSets: Number(wCompletedSets) || 18,
        totalSets: Number(wTotalSets) || 18,
        progressPercent: Math.round(((Number(wCompletedSets) || 18) / (Number(wTotalSets) || 18)) * 100),
        targetRpe: wRpe,
        notes: wNotes,
        workoutName: wName,
        workoutIntensity: wIntensity,
      };

      // Check if entry for this date already exists in history
      const existingIdx = historyList.findIndex((h) => formatDateToKey(new Date(h.date)) === wDate);
      if (existingIdx >= 0) {
        historyList[existingIdx] = historyEntry;
      } else {
        historyList.unshift(historyEntry);
      }
      localStorage.setItem(STORAGE_WORKOUT_HISTORY_KEY, JSON.stringify(historyList));
      window.dispatchEvent(new Event('planche_history_updated'));
    } catch (err) {
      console.error('Failed to sync with history', err);
    }

    setIsWorkoutModalOpen(false);
    setSelectedDateKey(wDate);
  };

  // Save Rest Day Submission
  const handleSaveRest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rDate) return;

    const newLog: CalendarDayLog = {
      id: editingLogId || `cal-rest-${Date.now()}`,
      date: rDate,
      type: 'rest',
      restDetails: {
        restType: rType,
        sleepQuality: rSleep,
        fatigueLevel: rFatigue,
        notes: rNotes,
      },
      createdAt: new Date().toISOString(),
    };

    const updated = { ...calendarLogs, [rDate]: newLog };
    saveCalendarLogs(updated);
    setIsRestModalOpen(false);
    setSelectedDateKey(rDate);
  };

  // Delete log for date
  const handleDeleteDateLog = (targetDate: string) => {
    const updated = { ...calendarLogs };
    delete updated[targetDate];
    saveCalendarLogs(updated);

    // Also remove from workout history if it was a workout
    try {
      const rawHistory = localStorage.getItem(STORAGE_WORKOUT_HISTORY_KEY);
      if (rawHistory) {
        const historyList: any[] = JSON.parse(rawHistory);
        const filtered = historyList.filter((h) => formatDateToKey(new Date(h.date)) !== targetDate);
        localStorage.setItem(STORAGE_WORKOUT_HISTORY_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('planche_history_updated'));
      }
    } catch {
      // ignore
    }

    setDeleteConfirmDate(null);
  };

  // Formatting helper for selected date
  const formatFullDate = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const selectedLog = calendarLogs[selectedDateKey];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Activity & Recovery Calendar
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log rest days, track workout sessions, and monitor your consistency streak like MyFitnessPal.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openWorkoutModal(selectedDateKey)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>+ Log Workout</span>
          </button>
          <button
            type="button"
            onClick={() => openRestModal(selectedDateKey)}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Moon className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Log Rest Day</span>
          </button>
        </div>
      </div>

      {/* MyFitnessPal Style Summary Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Active Streak
            </div>
            <div className="text-base font-bold text-slate-900 leading-tight">
              {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Workouts (Month)
            </div>
            <div className="text-base font-bold text-blue-700 leading-tight">
              {monthStats.workouts} Sessions
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Rest Days (Month)
            </div>
            <div className="text-base font-bold text-emerald-700 leading-tight">
              {monthStats.restDays} Days
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Consistency Rate
            </div>
            <div className="text-base font-bold text-indigo-700 leading-tight">
              {monthStats.consistencyRate}% ({monthStats.totalLogged} / {daysInMonth}d)
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controls & Month Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {monthName}
          </h3>
          <button
            type="button"
            onClick={jumpToToday}
            className="text-xs font-semibold px-2.5 py-1 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 mr-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              <span>Workout Day</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              <span>Rest Day</span>
            </span>
          </div>

          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous Month"
              className="p-1.5 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200"></div>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next Month"
              className="p-1.5 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-slate-800">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[75px] sm:min-h-[92px] bg-slate-50/40 p-2"></div>
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dayKey === todayKey;
            const isSelected = dayKey === selectedDateKey;
            const log = calendarLogs[dayKey];

            return (
              <div
                key={dayKey}
                onClick={() => setSelectedDateKey(dayKey)}
                className={`min-h-[75px] sm:min-h-[92px] p-1.5 sm:p-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/50 ring-2 ring-blue-500 ring-inset z-10'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Day Header: Number and Indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : isSelected
                        ? 'bg-blue-100 text-blue-900 font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Tiny Quick Add on Hover when empty */}
                  {!log && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWorkoutModal(dayKey);
                      }}
                      title="Log workout for this day"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Day Content Badges */}
                <div className="mt-1 flex-1 flex flex-col justify-end">
                  {log ? (
                    log.type === 'workout' ? (
                      <div className="bg-blue-500/10 hover:bg-blue-500/15 border border-blue-200/80 rounded-md p-1 sm:p-1.5 transition-colors">
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-700 leading-tight truncate">
                          <Dumbbell className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                          <span className="truncate">
                            {log.workoutDetails?.workoutIntensity || 'Workout'}
                          </span>
                        </div>
                        <div className="hidden sm:block text-[9px] text-blue-600/90 font-medium truncate mt-0.5">
                          {log.workoutDetails?.completedSets} sets · {log.workoutDetails?.durationMinutes}m
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-200/80 rounded-md p-1 sm:p-1.5 transition-colors">
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 leading-tight truncate">
                          <Moon className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                          <span className="truncate">
                            {log.restDetails?.restType || 'Rest Day'}
                          </span>
                        </div>
                        <div className="hidden sm:block text-[9px] text-emerald-600/90 font-medium truncate mt-0.5">
                          {log.restDetails?.sleepQuality?.split(' ')[0] || 'Rest'}
                        </div>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail Card */}
      <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Selected Day Details
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {formatFullDate(selectedDateKey)}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {selectedLog ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedLog.type === 'workout') {
                      openWorkoutModal(selectedDateKey, selectedLog);
                    } else {
                      openRestModal(selectedDateKey, selectedLog);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>

                {deleteConfirmDate === selectedDateKey ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-rose-600 font-semibold">Confirm delete?</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDateLog(selectedDateKey)}
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmDate(null)}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmDate(selectedDateKey)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openWorkoutModal(selectedDateKey)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Log Workout</span>
                </button>
                <button
                  type="button"
                  onClick={() => openRestModal(selectedDateKey)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Moon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Log Rest Day</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Log Content */}
        <div className="mt-4">
          {selectedLog ? (
            selectedLog.type === 'workout' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Workout Completed</span>
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                    {selectedLog.workoutDetails?.workoutName}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                    {selectedLog.workoutDetails?.workoutIntensity}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                    {selectedLog.workoutDetails?.targetRpe}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Sets Completed</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedLog.workoutDetails?.completedSets} / {selectedLog.workoutDetails?.totalSets} sets
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Session Duration</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedLog.workoutDetails?.durationMinutes} minutes
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                    <div className="text-[11px] text-slate-500 font-medium">Completion Rate</div>
                    <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {Math.round(
                          ((selectedLog.workoutDetails?.completedSets || 1) /
                            (selectedLog.workoutDetails?.totalSets || 1)) *
                            100
                        )}
                        % Achieved
                      </span>
                    </div>
                  </div>
                </div>

                {selectedLog.workoutDetails?.exercises && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Exercises Performed
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      {selectedLog.workoutDetails.exercises}
                    </div>
                  </div>
                )}

                {selectedLog.workoutDetails?.notes && (
                  <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-900">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Athlete Biofeedback & Session Notes</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                      "{selectedLog.workoutDetails.notes}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white">
                    <Moon className="w-3.5 h-3.5" />
                    <span>Rest & Recovery Day</span>
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                    {selectedLog.restDetails?.restType}
                  </span>
                  {selectedLog.restDetails?.sleepQuality && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                      Sleep: {selectedLog.restDetails.sleepQuality}
                    </span>
                  )}
                  {selectedLog.restDetails?.fatigueLevel && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                      Status: {selectedLog.restDetails.fatigueLevel}
                    </span>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {selectedLog.restDetails?.restType === 'Full Rest' &&
                      'Nervous system and biceps tendon regeneration day. Full rest allows complete ATP resynthesis and collagen remodeling.'}
                    {selectedLog.restDetails?.restType === 'Active Recovery' &&
                      'Light low-intensity movement to promote systemic bloodflow and accelerate muscular recovery without neural stress.'}
                    {selectedLog.restDetails?.restType === 'Mobility & Prehab' &&
                      'Focused on wrist extension prep, shoulder internal/external rotation, and thoracic spine decompressive stretches.'}
                  </div>
                </div>

                {selectedLog.restDetails?.notes && (
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recovery Notes & Biofeedback</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                      "{selectedLog.restDetails.notes}"
                    </p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="py-6 text-center text-slate-500 space-y-2">
              <Activity className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                No activity or rest logged for this date.
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Log a workout session to track your volume, or record a rest day to keep your recovery habits and consistency score high!
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openWorkoutModal(selectedDateKey)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Log Workout</span>
                </button>
                <button
                  type="button"
                  onClick={() => openRestModal(selectedDateKey)}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Moon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Log Rest Day</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Log Workout Modal */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingLogId ? 'Edit Workout Session' : 'Log Workout Session'}
                  </h3>
                  <p className="text-xs text-slate-500">Record your calisthenics training details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkoutModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkout} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Workout Date</label>
                <input
                  type="date"
                  required
                  value={wDate}
                  onChange={(e) => setWDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Routine / Workout Title</label>
                <select
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                >
                  <option value="Planche Submaximal Protocol (50-60%)">
                    Planche Submaximal Protocol (50-60%)
                  </option>
                  <option value="Planche 100% Max Hold Test">
                    Planche 100% Max Hold Test
                  </option>
                  <option value="Planche Press & Bent Arm Strength">
                    Planche Press & Bent Arm Strength
                  </option>
                  <option value="Conditioning & Core Protocol">
                    Conditioning & Core Protocol
                  </option>
                  <option value="Custom Calisthenics Strength Session">
                    Custom Calisthenics Strength Session
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prescribed Intensity</label>
                  <select
                    value={wIntensity}
                    onChange={(e) => setWIntensity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  >
                    <option value="Submaximal 50–60%">Submaximal 50–60%</option>
                    <option value="100% Maximum Intensity">100% Maximum Intensity</option>
                    <option value="Technique & Deload (40-50%)">Technique & Deload (40-50%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={wDuration}
                    onChange={(e) => setWDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sets Completed</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={wCompletedSets}
                    onChange={(e) => setWCompletedSets(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Prescribed Sets</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={wTotalSets}
                    onChange={(e) => setWTotalSets(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perceived Effort / Target RPE</label>
                <select
                  value={wRpe}
                  onChange={(e) => setWRpe(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                >
                  <option value="RPE 5-6 (3-4 RIR - Very Fresh)">RPE 5-6 (3-4 RIR - Very Fresh)</option>
                  <option value="RPE 6-7 (2-3 RIR - Prescribed Submax)">RPE 6-7 (2-3 RIR - Prescribed Submax)</option>
                  <option value="RPE 7-8 (1-2 RIR - Solid Challenge)">RPE 7-8 (1-2 RIR - Solid Challenge)</option>
                  <option value="RPE 8-9 (1 RIR - Heavy)">RPE 8-9 (1 RIR - Heavy)</option>
                  <option value="RPE 10 (0 RIR - True Maximum)">RPE 10 (0 RIR - True Maximum)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exercises Performed</label>
                <input
                  type="text"
                  value={wExercises}
                  onChange={(e) => setWExercises(e.target.value)}
                  placeholder="e.g. Tuck Planche 5x8s, PPPUs 4x6, Planche Leans 3x15s"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Athlete Biofeedback & Session Notes
                </label>
                <textarea
                  rows={3}
                  value={wNotes}
                  onChange={(e) => setWNotes(e.target.value)}
                  placeholder="How did you feel today? E.g., 'Felt snappy on tuck planche holds. Protraction was solid, no elbow discomfort. RPE 6.5.'"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWorkoutModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingLogId ? 'Update Workout' : 'Save Workout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Rest Day Modal */}
      {isRestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingLogId ? 'Edit Rest Day' : 'Log Rest & Recovery Day'}
                  </h3>
                  <p className="text-xs text-slate-500">Track recovery, tendon rest, and sleep</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rest Date</label>
                <input
                  type="date"
                  required
                  value={rDate}
                  onChange={(e) => setRDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recovery Protocol</label>
                <select
                  value={rType}
                  onChange={(e) => setRType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                >
                  <option value="Full Rest">Full Rest (Passive deload, nervous system regeneration)</option>
                  <option value="Active Recovery">Active Recovery (Walking, light bloodflow, cardio)</option>
                  <option value="Mobility & Prehab">Mobility & Prehab (Wrist prep, shoulder extension, thoracic)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sleep Quality</label>
                  <select
                    value={rSleep}
                    onChange={(e) => setRSleep(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  >
                    <option value="Excellent (8+ hrs)">Excellent (8+ hrs)</option>
                    <option value="Good (7-8 hrs)">Good (7-8 hrs)</option>
                    <option value="Moderate (6-7 hrs)">Moderate (6-7 hrs)</option>
                    <option value="Poor (<6 hrs)">Poor (&lt;6 hrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tendon / Fatigue Status</label>
                  <select
                    value={rFatigue}
                    onChange={(e) => setRFatigue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  >
                    <option value="Fresh & Ready (1/5)">Fresh & Ready (1/5)</option>
                    <option value="Mild Tightness (2/5)">Mild Tightness (2/5)</option>
                    <option value="Moderate Soreness (3/5)">Moderate Soreness (3/5)</option>
                    <option value="High Fatigue (4-5/5)">High Fatigue (4-5/5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Recovery Notes & Biofeedback
                </label>
                <textarea
                  rows={3}
                  value={rNotes}
                  onChange={(e) => setRNotes(e.target.value)}
                  placeholder="Notes on recovery: e.g., 'Took a 45 min walk, did wrist extensor stretches and warm bath. Biceps tendons feeling fresh.'"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRestModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingLogId ? 'Update Rest Day' : 'Save Rest Day'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
