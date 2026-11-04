import React, { useState, useEffect, useMemo } from 'react';
import { useSync } from '../context/SyncContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Moon,
  Briefcase,
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
  RotateCcw,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { WorkoutProgram, WorkoutType, getWorkoutProgram } from '../data/programData';

export type DayLogType = 'workout' | 'rest' | 'work';

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

export interface WorkLogData {
  shiftType: string;
  hoursWorked: number;
  fatigueLevel: string;
  physicalStrain: string;
  shiftTiming?: string;
  notes?: string;
}

export interface CalendarDayLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  type: DayLogType;
  workoutDetails?: WorkoutLogData;
  restDetails?: RestLogData;
  workDetails?: WorkLogData;
  isWorkDay?: boolean;
  createdAt?: string;
}

export interface WorkoutCalendarViewProps {
  currentWorkout?: WorkoutProgram;
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

// Helper to extract a clean exercises string for a workout program from the program page
export const getExercisesStringFromWorkout = (workout: WorkoutProgram): string => {
  const exNames = workout.phases.flatMap((p) => p.exercises.map((e) => e.name));
  return exNames.join(', ');
};

// Helper to extract total sets count for a workout program
export const getTotalSetsFromWorkout = (workout: WorkoutProgram): number => {
  return workout.phases.flatMap((p) => p.exercises).reduce((acc, e) => acc + (e.defaultSets || 1), 0);
};

// Helper to extract approximate duration in minutes from a workout program
export const getDurationMinsFromWorkout = (workout: WorkoutProgram): number => {
  if (workout.id === 'gtg') return 5;
  const match = workout.meta.sessionDuration.match(/(\d+)/);
  return match ? Number(match[1]) : 45;
};

export const WorkoutCalendarView: React.FC<WorkoutCalendarViewProps> = ({ currentWorkout }) => {
  const { saveCalendarLogToCloud, deleteCalendarLogFromCloud } = useSync();
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateToKey(today), [today]);

  // Available programs from the program page (including user custom edits)
  const availablePrograms = useMemo(() => {
    const list: WorkoutProgram[] = [];
    if (currentWorkout) {
      list.push(currentWorkout);
    }
    const standardIds: WorkoutType[] = ['submax', 'max', 'gtg', 'recovery'];
    standardIds.forEach((type) => {
      const p = getWorkoutProgram(type);
      if (!list.some((existing) => existing.id === p.id)) {
        list.push(p);
      }
    });
    return list;
  }, [currentWorkout]);

  const defaultProg = currentWorkout || availablePrograms[0] || getWorkoutProgram('submax');

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [calendarLogs, setCalendarLogs] = useState<Record<string, CalendarDayLog>>({});
  
  // Modals state
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [deleteConfirmDate, setDeleteConfirmDate] = useState<string | null>(null);

  // Form states for Workout Modal - pre-filled with the active routine and exercises from the program page
  const [wDate, setWDate] = useState<string>(todayKey);
  const [wName, setWName] = useState<string>(() => defaultProg.name);
  const [wIntensity, setWIntensity] = useState<string>(() => defaultProg.intensityLabel);
  const [wDuration, setWDuration] = useState<number>(() => getDurationMinsFromWorkout(defaultProg));
  const [wCompletedSets, setWCompletedSets] = useState<number>(() => getTotalSetsFromWorkout(defaultProg));
  const [wTotalSets, setWTotalSets] = useState<number>(() => getTotalSetsFromWorkout(defaultProg));
  const [wExercises, setWExercises] = useState<string>(() => getExercisesStringFromWorkout(defaultProg));
  const [wRpe, setWRpe] = useState<string>(() => defaultProg.meta.targetRPE || 'RPE 6-7 (2-3 RIR)');
  const [wNotes, setWNotes] = useState<string>('');

  // Keep defaults updated with active program page workout whenever it changes and modal is closed
  useEffect(() => {
    if (!isWorkoutModalOpen && currentWorkout) {
      setWName(currentWorkout.name);
      setWIntensity(currentWorkout.intensityLabel);
      setWDuration(getDurationMinsFromWorkout(currentWorkout));
      const totalSets = getTotalSetsFromWorkout(currentWorkout);
      setWTotalSets(totalSets);
      setWCompletedSets(totalSets);
      setWExercises(getExercisesStringFromWorkout(currentWorkout));
      if (currentWorkout.meta?.targetRPE) {
        setWRpe(currentWorkout.meta.targetRPE);
      }
    }
  }, [currentWorkout, isWorkoutModalOpen]);

  // Form states for Rest Modal
  const [rDate, setRDate] = useState<string>(todayKey);
  const [rType, setRType] = useState<'Full Rest' | 'Active Recovery' | 'Mobility & Prehab'>('Full Rest');
  const [rSleep, setRSleep] = useState<string>('Good (7-8 hrs)');
  const [rFatigue, setRFatigue] = useState<string>('Fresh & Ready (1/5)');
  const [rNotes, setRNotes] = useState<string>('');

  // Form states for Work Day Modal
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [workDate, setWorkDate] = useState<string>(todayKey);
  const [workShiftType, setWorkShiftType] = useState<string>('Physical / Manual Labor');
  const [workHours, setWorkHours] = useState<number>(8);
  const [workFatigue, setWorkFatigue] = useState<string>('High Fatigue (4/5) - Low energy & power');
  const [workPhysicalStrain, setWorkPhysicalStrain] = useState<string>('Heavy Lifting & Back Strain');
  const [workShiftTiming, setWorkShiftTiming] = useState<string>('Standard (9am-5pm)');
  const [workNotes, setWorkNotes] = useState<string>('');

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
    window.addEventListener('planche_calendar_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('planche_history_updated', handleUpdate);
      window.removeEventListener('planche_calendar_updated', handleUpdate);
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
    let workDays = 0;
    let totalWorkHours = 0;
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInThisMonth; day++) {
      const dKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = calendarLogs[dKey];
      if (log) {
        if (log.type === 'workout') workouts++;
        if (log.type === 'rest') restDays++;
        if (log.type === 'work' || log.isWorkDay || log.workDetails) {
          workDays++;
          totalWorkHours += Number(log.workDetails?.hoursWorked || (log.type === 'work' ? 8 : 0));
        }
      }
    }

    const totalLogged = workouts + restDays;
    const consistencyRate = Math.min(100, Math.round(((workouts + restDays) / daysInThisMonth) * 100));

    return { workouts, restDays, workDays, totalWorkHours, totalLogged, consistencyRate };
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
      // Automatically pre-fill with the routine and exercises currently on the program page!
      const activeProg = currentWorkout || availablePrograms[0] || getWorkoutProgram('submax');
      setEditingLogId(null);
      setWName(activeProg.name);
      setWIntensity(activeProg.intensityLabel);
      setWDuration(getDurationMinsFromWorkout(activeProg));
      const totalSets = getTotalSetsFromWorkout(activeProg);
      setWTotalSets(totalSets);
      setWCompletedSets(totalSets);
      setWExercises(getExercisesStringFromWorkout(activeProg));
      setWRpe(activeProg.meta?.targetRPE || 'RPE 6-7 (2-3 RIR)');
      setWNotes('');
    }
    setIsWorkoutModalOpen(true);
  };

  // Find currently matched workout program based on wName
  const matchedProgram = useMemo(() => {
    return availablePrograms.find(
      (p) =>
        p.name.trim().toLowerCase() === wName.trim().toLowerCase() ||
        p.id.toLowerCase() === wName.trim().toLowerCase()
    );
  }, [availablePrograms, wName]);

  // Handler when routine / workout title is selected: automatically updates exercises and metrics
  const handleRoutineTitleChange = (newTitle: string) => {
    setWName(newTitle);
    const matched = availablePrograms.find(
      (p) =>
        p.name.trim().toLowerCase() === newTitle.trim().toLowerCase() ||
        p.id.toLowerCase() === newTitle.trim().toLowerCase()
    );
    if (matched) {
      setWExercises(getExercisesStringFromWorkout(matched));
      setWIntensity(matched.intensityLabel);
      setWDuration(getDurationMinsFromWorkout(matched));
      const totalSets = getTotalSetsFromWorkout(matched);
      setWTotalSets(totalSets);
      setWCompletedSets(totalSets);
      if (matched.meta?.targetRPE) {
        setWRpe(matched.meta.targetRPE);
      }
    }
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

  // Open Log Work Day modal
  const openWorkModal = (dateStr?: string, editLog?: CalendarDayLog) => {
    const targetDate = dateStr || selectedDateKey || todayKey;
    setWorkDate(targetDate);
    const existing = editLog || calendarLogs[targetDate];
    if (existing && existing.workDetails) {
      setEditingLogId(existing.id);
      setWorkShiftType(existing.workDetails.shiftType || 'Physical / Manual Labor');
      setWorkHours(existing.workDetails.hoursWorked || 8);
      setWorkFatigue(existing.workDetails.fatigueLevel || 'High Fatigue (4/5) - Low energy & power');
      setWorkPhysicalStrain(existing.workDetails.physicalStrain || 'Heavy Lifting & Back Strain');
      setWorkShiftTiming(existing.workDetails.shiftTiming || 'Standard (9am-5pm)');
      setWorkNotes(existing.workDetails.notes || '');
    } else {
      setEditingLogId(null);
      setWorkShiftType('Physical / Manual Labor');
      setWorkHours(8);
      setWorkFatigue('High Fatigue (4/5) - Low energy & power');
      setWorkPhysicalStrain('Heavy Lifting & Back Strain');
      setWorkShiftTiming('Standard (9am-5pm)');
      setWorkNotes('');
    }
    setIsWorkModalOpen(true);
  };

  // Athlete Fatigue & Biomechanics Analysis Engine
  const getWorkFatigueAnalysis = (work?: WorkLogData) => {
    if (!work) return null;
    const shift = (work.shiftType || '').toLowerCase();
    const strain = (work.physicalStrain || '').toLowerCase();
    const timing = (work.shiftTiming || '').toLowerCase();
    const fatigue = (work.fatigueLevel || '').toLowerCase();

    const isPhysical = shift.includes('physical') || shift.includes('labor') || strain.includes('lifting') || strain.includes('heavy');
    const isStanding = shift.includes('standing') || shift.includes('retail') || strain.includes('feet');
    const isDesk = shift.includes('desk') || shift.includes('sedentary') || strain.includes('neck') || strain.includes('eye');
    const isNight = shift.includes('night') || timing.includes('night') || shift.includes('graveyard') || shift.includes('healthcare');
    const isHighStress = shift.includes('stress') || shift.includes('crunch') || fatigue.includes('extreme') || fatigue.includes('5/5');

    let title = 'Shift Fatigue & Performance Impact';
    let explanation = '';
    let recommendation = '';

    if (isPhysical) {
      title = 'Heavy Muscular Depletion & Spinal Loading';
      explanation = `A ${work.hoursWorked}h physical/manual shift consumes significant muscular glycogen and taxes your lower back, lat stabilizers, and forearms. Because straight-arm planche holds depend directly on scapular depression and unbroken core tension, raw strength will naturally feel reduced.`;
      recommendation = "Why you're fatigued: Your physical energy reserves have gone into work tasks. If training today, don't attempt maximum isometric PRs. Drop intensity to 50–60% submax or 5-min GTG supersets, and emphasize wrist and forearm decompression.";
    } else if (isDesk) {
      title = 'Prolonged Postural Tension & Wrist Stiffening';
      explanation = `Sustained seated desk work for ${work.hoursWorked} hours tightens the hip flexors, increases thoracic rounding (kyphosis), and causes forward shoulder roll. This restricts the open shoulder angle and scapular protraction needed for a clean straight-body planche lean.`;
      recommendation = "Why you're fatigued: Passive sitting causes postural stagnation and mental eye fatigue. Spend 5 minutes on thoracic foam rolling and wrist extension stretches before starting holds to avoid forearm splints and unlock protraction.";
    } else if (isNight) {
      title = 'Circadian Misalignment & CNS Recovery Delay';
      explanation = `Night and rotating shift schedules disrupt cortisol and melatonin rhythms, decreasing motor unit synchronization and tendon collagen recovery rate.`;
      recommendation = "Why you're fatigued: Irregular sleep cycles blunt maximum central nervous system output. Warm up with extra submaximal sets, avoid pushing to failure (keep RIR ≥ 2-3), and prioritize electrolyte hydration.";
    } else if (isStanding) {
      title = 'Lower Extremity Exhaustion & Core Stabilization Strain';
      explanation = `Being on your feet for ${work.hoursWorked} hours tires out the gluteus medius, plantar fascia, and lumbar erectors. This makes holding posterior pelvic tilt (PPT) in tuck and straddle planche positions feel much heavier than usual.`;
      recommendation = "Why you're fatigued: Standing accumulates venous pooling and lumbar fatigue. Elevate your legs for 10 minutes before training to restore circulation and reduce lower back arching.";
    } else if (isHighStress) {
      title = 'High Cognitive Load & Central Nervous System (CNS) Drain';
      explanation = `Intense mental stress elevates sympathetic nervous system activation, which reduces neuromuscular rate of force development (RFD).`;
      recommendation = "Why you're fatigued: High mental strain increases perceived effort (RPE) by +1 to +2 points for the exact same physical weight. Be kind to yourself today and count a solid submax session as a major win.";
    } else {
      title = 'Cumulative Daily Allostatic Load';
      explanation = `A ${work.hoursWorked}h shift contributes significantly to total daily physiological strain. Central fatigue lowers motivation and makes initial warm-ups feel sluggish.`;
      recommendation = "Why you're fatigued: Work hours deplete your daily cognitive battery. Once you warm up, momentum builds—but listen to biofeedback and avoid pushing beyond RPE 7-8.";
    }

    return { title, explanation, recommendation };
  };

  // Save Workout Submission
  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wDate) return;

    const existingLog = calendarLogs[wDate];
    const newLog: CalendarDayLog = {
      id: editingLogId || existingLog?.id || `cal-${Date.now()}`,
      date: wDate,
      type: 'workout',
      isWorkDay: existingLog?.isWorkDay,
      workDetails: existingLog?.workDetails,
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
      createdAt: existingLog?.createdAt || new Date().toISOString(),
    };

    const updated = { ...calendarLogs, [wDate]: newLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(newLog);

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

    const existingLog = calendarLogs[rDate];
    const newLog: CalendarDayLog = {
      id: editingLogId || `cal-rest-${Date.now()}`,
      date: rDate,
      type: 'rest',
      isWorkDay: existingLog?.isWorkDay,
      workDetails: existingLog?.workDetails,
      restDetails: {
        restType: rType,
        sleepQuality: rSleep,
        fatigueLevel: rFatigue,
        notes: rNotes,
      },
      createdAt: existingLog?.createdAt || new Date().toISOString(),
    };

    const updated = { ...calendarLogs, [rDate]: newLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(newLog);
    setIsRestModalOpen(false);
    setSelectedDateKey(rDate);
  };

  // Save Work Day Submission
  const handleSaveWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDate) return;

    const existingLog = calendarLogs[workDate];
    const newLog: CalendarDayLog = {
      id: editingLogId || existingLog?.id || `cal-work-${Date.now()}`,
      date: workDate,
      type: existingLog?.workoutDetails ? 'workout' : 'work',
      isWorkDay: true,
      workoutDetails: existingLog?.workoutDetails,
      restDetails: existingLog?.type === 'rest' ? existingLog.restDetails : undefined,
      workDetails: {
        shiftType: workShiftType,
        hoursWorked: Number(workHours) || 8,
        fatigueLevel: workFatigue,
        physicalStrain: workPhysicalStrain,
        shiftTiming: workShiftTiming,
        notes: workNotes,
      },
      createdAt: existingLog?.createdAt || new Date().toISOString(),
    };

    const updated = { ...calendarLogs, [workDate]: newLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(newLog);
    setIsWorkModalOpen(false);
    setSelectedDateKey(workDate);
  };

  // Delete only work details for a date
  const handleDeleteWorkOnly = (targetDate: string) => {
    const existing = calendarLogs[targetDate];
    if (!existing) return;
    if (existing.workoutDetails) {
      const updatedLog: CalendarDayLog = {
        ...existing,
        type: 'workout',
        isWorkDay: false,
        workDetails: undefined,
      };
      const updated = { ...calendarLogs, [targetDate]: updatedLog };
      saveCalendarLogs(updated);
      saveCalendarLogToCloud(updatedLog);
    } else if (existing.restDetails) {
      const updatedLog: CalendarDayLog = {
        ...existing,
        type: 'rest',
        isWorkDay: false,
        workDetails: undefined,
      };
      const updated = { ...calendarLogs, [targetDate]: updatedLog };
      saveCalendarLogs(updated);
      saveCalendarLogToCloud(updatedLog);
    } else {
      handleDeleteDateLog(targetDate);
    }
  };

  // Delete log for date
  const handleDeleteDateLog = (targetDate: string) => {
    const updated = { ...calendarLogs };
    delete updated[targetDate];
    saveCalendarLogs(updated);
    deleteCalendarLogFromCloud(targetDate);

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
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openWorkoutModal(selectedDateKey)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title={`Log ${currentWorkout?.name || 'Workout'} (${currentWorkout ? currentWorkout.phases.flatMap((p) => p.exercises).length : 0} exercises)`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>+ Log Workout</span>
            {currentWorkout && (
              <span className="hidden sm:inline-block text-[10px] bg-blue-500/40 px-1.5 py-0.5 rounded-md font-medium text-blue-100 border border-blue-400/30">
                {currentWorkout.intensityLabel}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => openWorkModal(selectedDateKey)}
            className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Log work day shift hours, physical strain, and fatigue so you know why you're fatigued"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Log Work Day</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
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
          <div className="w-9 h-9 rounded-lg bg-amber-50/80 border border-amber-200/70 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Work Days (Month)
            </div>
            <div className="text-base font-bold text-amber-800 leading-tight">
              {monthStats.workDays} Shifts ({monthStats.totalWorkHours}h)
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

        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-2xs col-span-2 sm:col-span-1">
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
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Work Day</span>
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
                <div className="mt-1 flex-1 flex flex-col justify-end space-y-1">
                  {log ? (
                    log.type === 'work' ? (
                      <div className="bg-amber-500/10 hover:bg-amber-500/15 border border-amber-300/80 rounded-md p-1 sm:p-1.5 transition-colors">
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-800 leading-tight truncate">
                          <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-amber-600" />
                          <span className="truncate">Work · {log.workDetails?.hoursWorked || 8}h</span>
                        </div>
                        <div className="hidden sm:block text-[9px] text-amber-700/90 font-medium truncate mt-0.5">
                          {log.workDetails?.fatigueLevel?.split(' ')[0] || 'Work Day'}
                        </div>
                      </div>
                    ) : log.type === 'workout' ? (
                      <div>
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
                        {log.workDetails && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-800 bg-amber-50 border border-amber-200/80 px-1 py-0.5 rounded font-bold truncate">
                            <Briefcase className="w-2 h-2 text-amber-600 shrink-0" />
                            <span className="truncate">+{log.workDetails.hoursWorked}h Work</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
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
                        {log.workDetails && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-800 bg-amber-50 border border-amber-200/80 px-1 py-0.5 rounded font-bold truncate">
                            <Briefcase className="w-2 h-2 text-amber-600 shrink-0" />
                            <span className="truncate">+{log.workDetails.hoursWorked}h Work</span>
                          </div>
                        )}
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

          <div className="flex items-center flex-wrap gap-2">
            {selectedLog ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedLog.type === 'workout') {
                      openWorkoutModal(selectedDateKey, selectedLog);
                    } else if (selectedLog.type === 'work') {
                      openWorkModal(selectedDateKey, selectedLog);
                    } else {
                      openRestModal(selectedDateKey, selectedLog);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit {selectedLog.type === 'work' ? 'Work Log' : selectedLog.type === 'workout' ? 'Workout' : 'Rest Log'}</span>
                </button>

                {!selectedLog.workDetails && (
                  <button
                    type="button"
                    onClick={() => openWorkModal(selectedDateKey, selectedLog)}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Mark or log work shift for this date to track fatigue impact"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    <span>+ Add Work Shift</span>
                  </button>
                )}

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
              <div className="flex items-center flex-wrap gap-2">
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
                  onClick={() => openWorkModal(selectedDateKey)}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  <span>Log Work Day</span>
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
            <div className="space-y-4">
              {/* Workout Details if present */}
              {selectedLog.workoutDetails && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white">
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>Workout Completed</span>
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                      {selectedLog.workoutDetails.workoutName}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                      {selectedLog.workoutDetails.workoutIntensity}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                      {selectedLog.workoutDetails.targetRpe}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Sets Completed</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {selectedLog.workoutDetails.completedSets} / {selectedLog.workoutDetails.totalSets} sets
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-medium">Session Duration</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {selectedLog.workoutDetails.durationMinutes} minutes
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-slate-500 font-medium">Completion Rate</div>
                      <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {Math.round(
                            ((selectedLog.workoutDetails.completedSets || 1) /
                              (selectedLog.workoutDetails.totalSets || 1)) *
                              100
                          )}
                          % Achieved
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedLog.workoutDetails.exercises && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Exercises Performed
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed">
                        {selectedLog.workoutDetails.exercises}
                      </div>
                    </div>
                  )}

                  {selectedLog.workoutDetails.notes && (
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
              )}

              {/* Rest Details if present and not a pure workout */}
              {selectedLog.restDetails && !selectedLog.workoutDetails && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white">
                      <Moon className="w-3.5 h-3.5" />
                      <span>Rest & Recovery Day</span>
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                      {selectedLog.restDetails.restType}
                    </span>
                    {selectedLog.restDetails.sleepQuality && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                        Sleep: {selectedLog.restDetails.sleepQuality}
                      </span>
                    )}
                    {selectedLog.restDetails.fatigueLevel && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                        Status: {selectedLog.restDetails.fatigueLevel}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs text-slate-600 leading-relaxed">
                      {selectedLog.restDetails.restType === 'Full Rest' &&
                        'Nervous system and biceps tendon regeneration day. Full rest allows complete ATP resynthesis and collagen remodeling.'}
                      {selectedLog.restDetails.restType === 'Active Recovery' &&
                        'Light low-intensity movement to promote systemic bloodflow and accelerate muscular recovery without neural stress.'}
                      {selectedLog.restDetails.restType === 'Mobility & Prehab' &&
                        'Focused on wrist extension prep, shoulder internal/external rotation, and thoracic spine decompressive stretches.'}
                    </div>
                  </div>

                  {selectedLog.restDetails.notes && (
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
              )}

              {/* Work Day & Fatigue Analysis Section (shows whenever workDetails is present) */}
              {selectedLog.workDetails && (() => {
                const analysis = getWorkFatigueAnalysis(selectedLog.workDetails);
                return (
                  <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-amber-950">Work Day Recorded</span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                              {selectedLog.workDetails.hoursWorked} Hours
                            </span>
                            {selectedLog.workDetails.shiftTiming && (
                              <span className="text-[10px] bg-white text-amber-800 font-medium px-2 py-0.5 rounded-full border border-amber-200">
                                {selectedLog.workDetails.shiftTiming}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                            {selectedLog.workDetails.shiftType} · {selectedLog.workDetails.physicalStrain}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openWorkModal(selectedDateKey, selectedLog)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3 text-amber-700" />
                          <span>Edit Shift</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkOnly(selectedDateKey)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Remove work day record from this date"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Remove Shift</span>
                        </button>
                      </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Duration</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedLog.workDetails.hoursWorked} hrs</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Category</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={selectedLog.workDetails.shiftType}>
                          {selectedLog.workDetails.shiftType}
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Fatigue</div>
                        <div className="text-xs font-bold text-amber-800 mt-0.5 truncate" title={selectedLog.workDetails.fatigueLevel}>
                          {selectedLog.workDetails.fatigueLevel}
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Physical Strain</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={selectedLog.workDetails.physicalStrain}>
                          {selectedLog.workDetails.physicalStrain}
                        </div>
                      </div>
                    </div>

                    {/* Why You're Fatigued Athlete Biomechanical Breakdown */}
                    {analysis && (
                      <div className="bg-white rounded-xl p-4 border border-amber-200/90 shadow-2xs space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Why You're Fatigued: {analysis.title}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {analysis.explanation}
                        </p>
                        <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 text-xs text-amber-950 font-medium leading-relaxed">
                          💡 <strong className="font-bold text-amber-900">Training Calibration:</strong> {analysis.recommendation}
                        </div>
                      </div>
                    )}

                    {/* Personal Fatigue & Work Notes */}
                    {selectedLog.workDetails.notes && (
                      <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/70 space-y-1">
                        <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Workplace Fatigue Biofeedback Notes</span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                          "{selectedLog.workDetails.notes}"
                        </p>
                      </div>
                    )}

                    {/* Quick prompt to log workout if purely a work day */}
                    {selectedLog.type === 'work' && !selectedLog.workoutDetails && (
                      <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="text-blue-900">
                          <span className="font-bold">Did you train before or after this work shift?</span>
                          <p className="text-[11px] text-blue-700 mt-0.5">Attach a workout session to this date to record your exercises and sets.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openWorkoutModal(selectedDateKey)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>+ Log Workout</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 space-y-2">
              <Activity className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                No activity, work shift, or rest logged for this date.
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Log a workout session, mark a work day to monitor fatigue impact, or record a rest day to keep your recovery habits high!
              </p>
              <div className="pt-2 flex items-center justify-center flex-wrap gap-2.5">
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
                  onClick={() => openWorkModal(selectedDateKey)}
                  className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  <span>Log Work Day</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Routine / Workout Title</label>
                  <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                    <Sparkles className="w-3 h-3" /> Auto-syncs exercises
                  </span>
                </div>
                <select
                  value={wName}
                  onChange={(e) => handleRoutineTitleChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                >
                  {availablePrograms.map((prog) => {
                    const isCurrentOnPage = currentWorkout && currentWorkout.id === prog.id;
                    return (
                      <option key={prog.id} value={prog.name}>
                        {prog.name} {isCurrentOnPage ? '★ (Active on Program Page)' : ''}
                      </option>
                    );
                  })}
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
                    onChange={(e) => {
                      const newIntensity = e.target.value;
                      setWIntensity(newIntensity);
                      const matched = availablePrograms.find(
                        (p) => p.intensityLabel.toLowerCase() === newIntensity.toLowerCase()
                      );
                      if (matched) {
                        handleRoutineTitleChange(matched.name);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  >
                    <option value="50 - 60 % Submax intensity">50 - 60 % Submax intensity</option>
                    <option value="100% max intensity">100% max intensity</option>
                    <option value="GTG 20%-30%">GTG 20%-30%</option>
                    <option value="0%-10% Nothing/Active recovery">0%-10% Nothing/Active recovery</option>
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
                  <option value="RPE 2-3 (GTG / Effortless)">RPE 2-3 (GTG / Effortless)</option>
                  <option value="RPE 5-6 (3-4 RIR - Very Fresh)">RPE 5-6 (3-4 RIR - Very Fresh)</option>
                  <option value="RPE 6-7 (2-3 RIR - Prescribed Submax)">RPE 6-7 (2-3 RIR - Prescribed Submax)</option>
                  <option value="RPE 7-8 (1-2 RIR - Solid Challenge)">RPE 7-8 (1-2 RIR - Solid Challenge)</option>
                  <option value="RPE 8-9 (1 RIR - Heavy)">RPE 8-9 (1 RIR - Heavy)</option>
                  <option value="RPE 9.5-10 (0 RIR - True Maximum)">RPE 9.5-10 (0 RIR - True Maximum)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Exercises Performed</label>
                  {matchedProgram && (
                    <button
                      type="button"
                      onClick={() => setWExercises(getExercisesStringFromWorkout(matchedProgram))}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 transition-colors"
                      title="Reset exercises back to program default"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reload {matchedProgram.intensityLabel} Exercises</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={wExercises}
                  onChange={(e) => setWExercises(e.target.value)}
                  placeholder="e.g. Frog Planche with Raised Legs, Planche Leans, Dumbbell Leans..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 leading-relaxed text-xs"
                />

                {/* Interactive Exercise Chips from the Selected Routine on the Program Page */}
                {matchedProgram && (
                  <div className="mt-2 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Exercises from {matchedProgram.name} ({matchedProgram.phases.flatMap((p) => p.exercises).length} total):
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">Click chip to toggle</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedProgram.phases.flatMap((p) => p.exercises).map((ex) => {
                        const isIncluded = wExercises.toLowerCase().includes(ex.name.toLowerCase());
                        return (
                          <button
                            type="button"
                            key={ex.id}
                            onClick={() => {
                              if (isIncluded) {
                                const parts = wExercises.split(/,\s*/).filter(p => !p.toLowerCase().includes(ex.name.toLowerCase()));
                                setWExercises(parts.join(', '));
                              } else {
                                const prefix = wExercises.trim() ? `${wExercises.trim()}, ` : '';
                                setWExercises(`${prefix}${ex.name}`);
                              }
                            }}
                            className={`text-[10px] px-2 py-1 rounded-lg font-medium cursor-pointer transition-colors border flex items-center gap-1 ${
                              isIncluded
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                            }`}
                            title={isIncluded ? 'Click to remove from exercises list' : 'Click to add to exercises list'}
                          >
                            <span>{isIncluded ? '✓' : '+'}</span>
                            <span>{ex.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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

      {/* MODAL 3: Log Work Day Modal */}
      {isWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingLogId ? 'Edit Work Day Log' : 'Log Work Day & Shift Fatigue'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track your shift hours, strain, and see why you're fatigued
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWork} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Date</label>
                <input
                  type="date"
                  required
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Category / Job Type</label>
                  <select
                    value={workShiftType}
                    onChange={(e) => setWorkShiftType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                  >
                    <option value="Physical / Manual Labor">Physical / Manual Labor</option>
                    <option value="Standing / Retail / Hospitality">Standing / Retail / Hospitality</option>
                    <option value="Desk / Sedentary Focus">Desk / Sedentary Focus</option>
                    <option value="Healthcare / Shift Work">Healthcare / Shift Work</option>
                    <option value="High-Stress Project Crunch">High-Stress Project Crunch</option>
                    <option value="Standard Office Shift">Standard Office Shift</option>
                    <option value="Warehouse / Heavy Logistics">Warehouse / Heavy Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hours Worked</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    step={0.5}
                    required
                    value={workHours}
                    onChange={(e) => setWorkHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Timing</label>
                  <select
                    value={workShiftTiming}
                    onChange={(e) => setWorkShiftTiming(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                  >
                    <option value="Standard (9am-5pm)">Standard (9am-5pm)</option>
                    <option value="Early Morning Shift (5am-1pm)">Early Morning Shift (5am-1pm)</option>
                    <option value="Afternoon / Evening (2pm-10pm)">Afternoon / Evening (2pm-10pm)</option>
                    <option value="Night / Graveyard Shift (10pm-6am)">Night / Graveyard Shift (10pm-6am)</option>
                    <option value="12-Hour Long Shift">12-Hour Long Shift</option>
                    <option value="Split Shift / Irregular">Split Shift / Irregular</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Muscular / Physical Strain</label>
                  <select
                    value={workPhysicalStrain}
                    onChange={(e) => setWorkPhysicalStrain(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                  >
                    <option value="Heavy Lifting & Back Strain">Heavy Lifting & Back Strain</option>
                    <option value="Feet & Lower Body Soreness">Feet & Lower Body Soreness</option>
                    <option value="Neck, Traps & Eye Strain">Neck, Traps & Eye Strain</option>
                    <option value="Full-Body Systemic Exhaustion">Full-Body Systemic Exhaustion</option>
                    <option value="Light / Low Physical Demand">Light / Low Physical Demand</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perceived Fatigue Level</label>
                <select
                  value={workFatigue}
                  onChange={(e) => setWorkFatigue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                >
                  <option value="Extreme Exhaustion (5/5) - Severe training fatigue">
                    Extreme Exhaustion (5/5) - Severe training fatigue
                  </option>
                  <option value="High Fatigue (4/5) - Low energy & power">
                    High Fatigue (4/5) - Low energy & power
                  </option>
                  <option value="Moderate Drain (3/5) - Noticeably tired">
                    Moderate Drain (3/5) - Noticeably tired
                  </option>
                  <option value="Mild Tiredness (2/5) - Manageable">
                    Mild Tiredness (2/5) - Manageable
                  </option>
                  <option value="Fresh / Light (1/5) - Plenty of energy">
                    Fresh / Light (1/5) - Plenty of energy
                  </option>
                </select>
              </div>

              {/* Live Fatigue & Planche Biomechanics Impact Preview */}
              {(() => {
                const preview = getWorkFatigueAnalysis({
                  shiftType: workShiftType,
                  hoursWorked: workHours,
                  fatigueLevel: workFatigue,
                  physicalStrain: workPhysicalStrain,
                  shiftTiming: workShiftTiming,
                });
                return preview ? (
                  <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/90 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{preview.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {preview.explanation}
                    </p>
                    <div className="text-[11px] text-amber-900 font-semibold pt-1 border-t border-amber-200/50">
                      💡 {preview.recommendation}
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Why I'm Fatigued & Workplace Notes
                </label>
                <textarea
                  rows={3}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Describe your day: e.g., 'On feet 8.5 hours handling pallets, lower back fatigued and forearms pumped. Explains why planche lean felt heavier today.'"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 leading-relaxed text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWorkModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingLogId ? 'Update Work Day' : 'Save Work Day'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
