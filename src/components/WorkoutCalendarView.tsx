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
  ShieldAlert,
  HeartPulse,
  Calculator,
} from 'lucide-react';
import { WorkoutProgram, WorkoutType, getWorkoutProgram } from '../data/programData';
import {
  SessionPerformance,
  PhysicalFatigue,
  NeuromuscularControl,
  SkillPerformance,
  SESSION_PERFORMANCE_OPTIONS,
  PHYSICAL_FATIGUE_OPTIONS,
  NEUROMUSCULAR_CONTROL_OPTIONS,
  SKILL_PERFORMANCE_OPTIONS,
  SYMPTOM_TAGS,
  NO_UNUSUAL_SYMPTOMS_TAG,
  toggleSymptomSelection,
  getToneBadgeClasses,
  getPerformanceTone,
  getFatigueTone,
  getControlTone,
  getSkillTone,
} from '../data/workoutTrackingTypes';

export type DayLogType = 'workout' | 'rest' | 'work' | 'symptom' | 'multi';

export interface WorkoutLogData {
  historyId?: string;
  workoutName: string;
  workoutIntensity: string;
  durationMinutes: number;
  completedSets: number;
  totalSets: number;
  exercises?: string;
  targetRpe: string;
  notes?: string;
  sessionPerformance?: SessionPerformance;
  physicalFatigue?: PhysicalFatigue;
  neuromuscularControl?: NeuromuscularControl;
  skillPerformance?: SkillPerformance;
  symptoms?: string[];
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

export interface SymptomLogData {
  severity: string;
  attackType: string;
  duration: string;
  triggers: string;
  workoutImpact: string;
  notes?: string;
}

export interface CalendarDayLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  type?: DayLogType;
  workoutDetails?: WorkoutLogData; // legacy / primary workout
  workoutList?: WorkoutLogData[]; // array of all workouts on this day
  restDetails?: RestLogData;
  workDetails?: WorkLogData;
  symptomDetails?: SymptomLogData; // legacy / primary symptom
  symptomList?: SymptomLogData[]; // array of all FND/symptom events on this day
  isWorkDay?: boolean;
  hasFndAttack?: boolean;
  hasRest?: boolean;
  hasWorkout?: boolean;
  createdAt?: string;
}

// Normalizer helpers:
export const getDayWorkouts = (log?: CalendarDayLog): WorkoutLogData[] => {
  if (!log) return [];
  if (log.workoutList && log.workoutList.length > 0) return log.workoutList;
  if (log.workoutDetails) return [log.workoutDetails];
  return [];
};

export const getDaySymptoms = (log?: CalendarDayLog): SymptomLogData[] => {
  if (!log) return [];
  if (log.symptomList && log.symptomList.length > 0) return log.symptomList;
  if (log.symptomDetails) return [log.symptomDetails];
  return [];
};

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
  const {
    saveCalendarLogToCloud,
    deleteCalendarLogFromCloud,
    saveWorkoutLogToCloud,
    deleteWorkoutLogFromCloud,
    deleteWorkoutLogsByDateFromCloud,
  } = useSync();
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
  const [editingWorkoutIndex, setEditingWorkoutIndex] = useState<number | null>(null);
  const [editingSymptomIndex, setEditingSymptomIndex] = useState<number | null>(null);
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
  const [wSessionPerformance, setWSessionPerformance] = useState<SessionPerformance | ''>('');
  const [wPhysicalFatigue, setWPhysicalFatigue] = useState<PhysicalFatigue | ''>('');
  const [wNeuromuscularControl, setWNeuromuscularControl] = useState<NeuromuscularControl | ''>('');
  const [wSkillPerformance, setWSkillPerformance] = useState<SkillPerformance | ''>('');
  const [wSymptoms, setWSymptoms] = useState<string[]>([]);
  const [showExerciseChips, setShowExerciseChips] = useState<boolean>(false);

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
  const [workHours, setWorkHours] = useState<number | string>(8);
  const [workFatigue, setWorkFatigue] = useState<string>('High Fatigue (4/5) - Low energy & power');
  const [workPhysicalStrain, setWorkPhysicalStrain] = useState<string>('Heavy Lifting & Back Strain');
  const [workShiftTiming, setWorkShiftTiming] = useState<string>('Standard (9am-5pm)');
  const [isCustomShiftTiming, setIsCustomShiftTiming] = useState<boolean>(false);
  const [customShiftTiming, setCustomShiftTiming] = useState<string>('');
  const [showTimeCalculator, setShowTimeCalculator] = useState<boolean>(false);
  const [calcStartTime, setCalcStartTime] = useState<string>('08:30');
  const [calcEndTime, setCalcEndTime] = useState<string>('17:00');
  const [calcBreakMinutes, setCalcBreakMinutes] = useState<number>(30);
  const [workNotes, setWorkNotes] = useState<string>('');

  // Form states for High Symptom / FND Attack Modal
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [symptomDate, setSymptomDate] = useState<string>(todayKey);
  const [symptomSeverity, setSymptomSeverity] = useState<string>('Severe Attack / Major Flare');
  const [symptomAttackType, setSymptomAttackType] = useState<string>('Limb Weakness & Motor Control Loss');
  const [symptomDuration, setSymptomDuration] = useState<string>('1 - 2 Hours');
  const [symptomTriggers, setSymptomTriggers] = useState<string>('Workout Overexertion / High Strain');
  const [symptomWorkoutImpact, setSymptomWorkoutImpact] = useState<string>('No workout possible (Bed rest & safety)');
  const [symptomNotes, setSymptomNotes] = useState<string>('');

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
          const key = entry.date.length === 10 ? entry.date : formatDateToKey(new Date(entry.date));
          // If no log exists for this date, populate workout
          if (!calMap[key]) {
            calMap[key] = {
              id: `live-${idx}-${entry.date}`,
              date: key,
              type: 'workout',
              workoutDetails: {
                historyId: entry.id,
                workoutName: entry.workoutName || 'Submaximal Live Session',
                workoutIntensity: entry.workoutIntensity || '50–60% Submax',
                durationMinutes: entry.durationMinutes || 45,
                completedSets: entry.completedSets || 18,
                totalSets: entry.totalSets || 18,
                exercises: entry.exercises || '',
                targetRpe: entry.targetRpe || 'RPE 6-7',
                notes: entry.notes || '',
                sessionPerformance: entry.sessionPerformance,
                physicalFatigue: entry.physicalFatigue,
                neuromuscularControl: entry.neuromuscularControl,
                skillPerformance: entry.skillPerformance,
                symptoms: Array.isArray(entry.symptoms) ? entry.symptoms : undefined,
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

  // Summary stats for current displayed month (tallies all workouts and attacks, even multiple on one day)
  const monthStats = useMemo(() => {
    let workouts = 0;
    let restDays = 0;
    let workDays = 0;
    let totalWorkHours = 0;
    let fndAttacks = 0;
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInThisMonth; day++) {
      const dKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = calendarLogs[dKey];
      if (log) {
        const wList = getDayWorkouts(log);
        const sList = getDaySymptoms(log);
        workouts += wList.length;
        if (log.restDetails || log.type === 'rest' || log.hasRest) restDays++;
        fndAttacks += sList.length;
        if (log.workDetails || log.isWorkDay || log.type === 'work') {
          workDays++;
          totalWorkHours += Number(log.workDetails?.hoursWorked || 8);
        }
      }
    }

    const totalLogged = workouts + restDays + fndAttacks + workDays;
    const consistencyRate = Math.min(100, Math.round(((workouts + restDays) / daysInThisMonth) * 100));

    return { workouts, restDays, workDays, totalWorkHours, fndAttacks, totalLogged, consistencyRate };
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

  // Open Log Workout modal (supports adding a new workout or editing an existing workout by index)
  const openWorkoutModal = (dateStr?: string, editIndex?: number | null) => {
    const targetDate = dateStr || selectedDateKey || todayKey;
    setWDate(targetDate);
    const existingLog = calendarLogs[targetDate];
    const wList = getDayWorkouts(existingLog);

    if (editIndex !== undefined && editIndex !== null && wList[editIndex]) {
      const editW = wList[editIndex];
      setEditingLogId(existingLog?.id || null);
      setEditingWorkoutIndex(editIndex);
      setWName(editW.workoutName);
      setWIntensity(editW.workoutIntensity);
      setWDuration(editW.durationMinutes);
      setWCompletedSets(editW.completedSets);
      setWTotalSets(editW.totalSets);
      setWExercises(editW.exercises || '');
      setWRpe(editW.targetRpe);
      setWNotes(editW.notes || '');
      setWSessionPerformance(editW.sessionPerformance || '');
      setWPhysicalFatigue(editW.physicalFatigue || '');
      setWNeuromuscularControl(editW.neuromuscularControl || '');
      setWSkillPerformance(editW.skillPerformance || '');
      setWSymptoms(Array.isArray(editW.symptoms) ? editW.symptoms : []);
    } else {
      // Adding a new workout to this day (even if other workouts already exist!)
      const activeProg = currentWorkout || availablePrograms[0] || getWorkoutProgram('submax');
      setEditingLogId(existingLog?.id || null);
      setEditingWorkoutIndex(null);
      setWName(activeProg.name);
      setWIntensity(activeProg.intensityLabel);
      setWDuration(getDurationMinsFromWorkout(activeProg));
      const totalSets = getTotalSetsFromWorkout(activeProg);
      setWTotalSets(totalSets);
      setWCompletedSets(totalSets);
      setWExercises(getExercisesStringFromWorkout(activeProg));
      setWRpe(activeProg.meta?.targetRPE || 'RPE 6-7 (2-3 RIR)');
      setWNotes('');
      setWSessionPerformance('');
      setWPhysicalFatigue('');
      setWNeuromuscularControl('');
      setWSkillPerformance('');
      setWSymptoms([]);
    }
    setShowExerciseChips(false);
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
    const existing = editLog || calendarLogs[targetDate];
    if (existing && existing.restDetails) {
      setEditingLogId(existing.id);
      setRType(existing.restDetails.restType);
      setRSleep(existing.restDetails.sleepQuality || 'Good (7-8 hrs)');
      setRFatigue(existing.restDetails.fatigueLevel || 'Fresh & Ready (1/5)');
      setRNotes(existing.restDetails.notes || '');
    } else {
      setEditingLogId(null);
      setRType('Full Rest');
      setRSleep('Good (7-8 hrs)');
      setRFatigue('Fresh & Ready (1/5)');
      setRNotes('');
    }
    setIsRestModalOpen(true);
  };

  // Helper to calculate manual worked hours from start time, end time, and break minutes
  const calculateShiftHours = (start: string, end: string, breakMins: number = 0) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;

    let startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // Crosses midnight (e.g. night shift)
    }
    const workedMinutes = Math.max(0, endMinutes - startMinutes - (breakMins || 0));
    return Math.round((workedMinutes / 60) * 100) / 100;
  };

  // Open Log Work Day modal
  const openWorkModal = (dateStr?: string, editLog?: CalendarDayLog) => {
    const targetDate = dateStr || selectedDateKey || todayKey;
    setWorkDate(targetDate);
    const existing = editLog || calendarLogs[targetDate];
    const PRESET_TIMINGS = [
      'Standard (9am-5pm)',
      'Early Morning Shift (5am-1pm)',
      'Afternoon / Evening (2pm-10pm)',
      'Night / Graveyard Shift (10pm-6am)',
      '12-Hour Long Shift',
      'Split Shift / Irregular',
    ];

    if (existing && existing.workDetails) {
      setEditingLogId(existing.id);
      setWorkShiftType(existing.workDetails.shiftType || 'Physical / Manual Labor');
      setWorkHours(existing.workDetails.hoursWorked !== undefined ? existing.workDetails.hoursWorked : 8);
      setWorkFatigue(existing.workDetails.fatigueLevel || 'High Fatigue (4/5) - Low energy & power');
      setWorkPhysicalStrain(existing.workDetails.physicalStrain || 'Heavy Lifting & Back Strain');
      const timing = existing.workDetails.shiftTiming || 'Standard (9am-5pm)';
      if (PRESET_TIMINGS.includes(timing)) {
        setWorkShiftTiming(timing);
        setIsCustomShiftTiming(false);
        setCustomShiftTiming('');
      } else {
        setWorkShiftTiming('Custom / Manual Timing');
        setIsCustomShiftTiming(true);
        setCustomShiftTiming(timing);
      }
      setWorkNotes(existing.workDetails.notes || '');
    } else {
      setEditingLogId(null);
      setWorkShiftType('Physical / Manual Labor');
      setWorkHours(8);
      setWorkFatigue('High Fatigue (4/5) - Low energy & power');
      setWorkPhysicalStrain('Heavy Lifting & Back Strain');
      setWorkShiftTiming('Standard (9am-5pm)');
      setIsCustomShiftTiming(false);
      setCustomShiftTiming('');
      setWorkNotes('');
    }
    setShowTimeCalculator(false);
    setIsWorkModalOpen(true);
  };

  // Open Log High Symptom / FND Attack modal (supports adding a new attack or editing by index)
  const openSymptomModal = (dateStr?: string, editIndex?: number | null) => {
    const targetDate = dateStr || selectedDateKey || todayKey;
    setSymptomDate(targetDate);
    const existingLog = calendarLogs[targetDate];
    const sList = getDaySymptoms(existingLog);

    if (editIndex !== undefined && editIndex !== null && sList[editIndex]) {
      const editS = sList[editIndex];
      setEditingLogId(existingLog?.id || null);
      setEditingSymptomIndex(editIndex);
      setSymptomSeverity(editS.severity || 'Severe Attack / Major Flare');
      setSymptomAttackType(editS.attackType || 'Limb Weakness & Motor Control Loss');
      setSymptomDuration(editS.duration || '1 - 2 Hours');
      setSymptomTriggers(editS.triggers || 'Workout Overexertion / High Strain');
      setSymptomWorkoutImpact(editS.workoutImpact || 'No workout possible (Bed rest & safety)');
      setSymptomNotes(editS.notes || '');
    } else {
      // Adding a new FND attack to this day!
      setEditingLogId(existingLog?.id || null);
      setEditingSymptomIndex(null);
      setSymptomSeverity('Severe Attack / Major Flare');
      setSymptomAttackType('Limb Weakness & Motor Control Loss');
      setSymptomDuration('1 - 2 Hours');
      setSymptomTriggers('Workout Overexertion / High Strain');
      setSymptomWorkoutImpact('No workout possible (Bed rest & safety)');
      setSymptomNotes('');
    }
    setIsSymptomModalOpen(true);
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

  // Athlete Neurological & FND Attack Analysis Engine
  const getFndSymptomAnalysis = (symptom?: SymptomLogData) => {
    if (!symptom) return null;
    const severity = (symptom.severity || '').toLowerCase();
    const type = (symptom.attackType || '').toLowerCase();
    const triggers = (symptom.triggers || '').toLowerCase();

    let title = 'FND Neurological Attack & Central Fatigue Analysis';
    let explanation = '';
    let recommendation = '';

    if (severity.includes('severe') || severity.includes('incapacitating') || type.includes('seizure') || type.includes('paralysis') || type.includes('blackout')) {
      title = 'Severe Neurological Disruption & Deep Motor Depletion';
      explanation = `Functional Neurological Disorder (FND) affects communication in the brain's voluntary motor control pathways. During a major attack (${symptom.attackType}), central motor signaling is temporarily interrupted, resulting in severe motor inhibition, loss of power, and deep post-attack neuro-fatigue.`;
      recommendation = "Why you're fatigued: Neurological attacks deplete nervous system reserves far deeper than muscular exercise. Rest is your primary medicine right now. Avoid forced isometric holds or max effort attempts while your nervous system stabilizes. Prioritize quiet recovery, hydration, and safe mobility.";
    } else if (type.includes('tremor') || type.includes('spasm') || type.includes('dyston')) {
      title = 'Involuntary Motor Overdrive & Tendon Fatigue';
      explanation = `Tremors and involuntary muscle contractions produce continuous eccentric and isometric tension across forearms, biceps tendons, and core stabilizers without voluntary motor control. This leaves limbs feeling shaky, heavy, and unresponsive.`;
      recommendation = "Why you're fatigued: Involuntary contractions burn through local glycogen and strain forearm flexors. Avoid heavy straight-arm planche holds today. Focus on warm showers/heat, somatic breathing, and slow passive wrist/shoulder stretches.";
    } else if (triggers.includes('workout') || triggers.includes('strain') || triggers.includes('overexertion')) {
      title = 'Post-Exertional Neurological Sensitivity';
      explanation = `High-tension calisthenics (especially straight-arm planche leans and max holds) requires massive central nervous system drive. When pushed near failure, this high neurological demand can trigger an FND flare or temporary functional crash.`;
      recommendation = "Why you're fatigued: Your neurological reserve was pushed beyond its threshold. This is exactly why our 50–60% submaximal protocol and 5-min GTG 20–30% circuit are calibrated to keep sets far away from failure (3-4 RIR). Stick strictly to submax protocols once symptoms clear.";
    } else {
      title = 'Elevated Neurological Symptom Flare';
      explanation = `Elevated symptom days represent lowered central reserve, where sensory processing, motor coordination, and balance are compromised (${symptom.attackType}).`;
      recommendation = "Why you're fatigued: Brain-body signaling is strained. Calisthenics mastery with FND requires working with your nervous system, not fighting it. Acknowledge the flare, take proud credit for prioritizing recovery, and test holds only once baseline returns.";
    }

    return { title, explanation, recommendation };
  };

  // Save Workout Submission (supports multiple workouts on the same day!)
  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wDate) return;

    const existingLog = calendarLogs[wDate];
    const currentWorkouts = [...getDayWorkouts(existingLog)];
    const sanitizedDate = wDate.replace(/[^a-zA-Z0-9_-]/g, '_');

    let workoutHistoryId: string;
    if (editingWorkoutIndex !== null && editingWorkoutIndex >= 0 && editingWorkoutIndex < currentWorkouts.length) {
      workoutHistoryId =
        currentWorkouts[editingWorkoutIndex].historyId ||
        `log_cal_${sanitizedDate}_${editingWorkoutIndex}`;
    } else {
      workoutHistoryId = `log_cal_${sanitizedDate}_${Date.now()}`;
    }

    const parsedDuration = Math.max(1, Number(wDuration) || 45);
    const parsedCompleted = Math.max(0, Number(wCompletedSets) || 0);
    const parsedTotal = Math.max(1, Number(wTotalSets) || 1);

    const newWorkout: WorkoutLogData = {
      historyId: workoutHistoryId,
      workoutName: wName,
      workoutIntensity: wIntensity,
      durationMinutes: parsedDuration,
      completedSets: parsedCompleted,
      totalSets: parsedTotal,
      exercises: wExercises,
      targetRpe: wRpe,
      notes: wNotes,
      ...(wSessionPerformance ? { sessionPerformance: wSessionPerformance } : {}),
      ...(wPhysicalFatigue ? { physicalFatigue: wPhysicalFatigue } : {}),
      ...(wNeuromuscularControl ? { neuromuscularControl: wNeuromuscularControl } : {}),
      ...(wSkillPerformance ? { skillPerformance: wSkillPerformance } : {}),
      ...(wSymptoms.length > 0 ? { symptoms: wSymptoms } : {}),
    };

    if (editingWorkoutIndex !== null && editingWorkoutIndex >= 0 && editingWorkoutIndex < currentWorkouts.length) {
      currentWorkouts[editingWorkoutIndex] = newWorkout;
    } else {
      currentWorkouts.push(newWorkout);
    }

    const currentSymptoms = getDaySymptoms(existingLog);
    const hasWork = Boolean(existingLog?.workDetails || existingLog?.isWorkDay);
    const hasRest = Boolean(existingLog?.restDetails);
    const hasSymptoms = currentSymptoms.length > 0 || Boolean(existingLog?.hasFndAttack);

    const hasMulti = currentWorkouts.length > 1 || hasWork || hasRest || hasSymptoms;
    const type: DayLogType = hasMulti ? 'multi' : 'workout';

    const newLog: CalendarDayLog = {
      id: existingLog?.id || `cal-${Date.now()}`,
      date: wDate,
      type,
      workoutList: currentWorkouts,
      workoutDetails: currentWorkouts[0],
      restDetails: existingLog?.restDetails,
      workDetails: existingLog?.workDetails,
      isWorkDay: hasWork,
      hasFndAttack: hasSymptoms,
      symptomDetails: currentSymptoms[0] || existingLog?.symptomDetails,
      symptomList: currentSymptoms.length > 0 ? currentSymptoms : undefined,
      hasWorkout: true,
      hasRest,
      createdAt: existingLog?.createdAt || new Date().toISOString(),
    };

    const updated = { ...calendarLogs, [wDate]: newLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(newLog);

    // Sync with workout history so the history list right above reflects this workout and saves to cloud without duplicates
    try {
      const rawHistory = localStorage.getItem(STORAGE_WORKOUT_HISTORY_KEY);
      const historyList: any[] = rawHistory ? JSON.parse(rawHistory) : [];
      const historyEntry = {
        id: workoutHistoryId,
        date: new Date(`${wDate}T12:00:00`).toISOString(),
        completedSets: parsedCompleted,
        totalSets: parsedTotal,
        progressPercent: Math.round((parsedCompleted / parsedTotal) * 100),
        durationMinutes: parsedDuration,
        targetRpe: wRpe,
        notes: wNotes,
        workoutName: wName,
        workoutIntensity: wIntensity,
        exercises: wExercises,
        ...(wSessionPerformance ? { sessionPerformance: wSessionPerformance } : {}),
        ...(wPhysicalFatigue ? { physicalFatigue: wPhysicalFatigue } : {}),
        ...(wNeuromuscularControl ? { neuromuscularControl: wNeuromuscularControl } : {}),
        ...(wSkillPerformance ? { skillPerformance: wSkillPerformance } : {}),
        ...(wSymptoms.length > 0 ? { symptoms: wSymptoms } : {}),
      };

      const legacyId = `log_cal_${sanitizedDate}_${editingWorkoutIndex ?? 0}`;
      const existingIdx = historyList.findIndex(
        (h) =>
          h.id === workoutHistoryId ||
          (editingWorkoutIndex !== null && h.id === legacyId)
      );

      let nextHistory: any[];
      if (existingIdx !== -1) {
        nextHistory = historyList.map((item, idx) => (idx === existingIdx ? historyEntry : item));
      } else {
        nextHistory = [historyEntry, ...historyList];
      }

      // Deduplicate by id to guarantee no duplicate records
      const seenIds = new Set<string>();
      nextHistory = nextHistory.filter((item) => {
        if (!item?.id) return true;
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      });

      localStorage.setItem(STORAGE_WORKOUT_HISTORY_KEY, JSON.stringify(nextHistory));
      window.dispatchEvent(new Event('planche_history_updated'));

      // Automatically sync this workout log to the user's cloud account
      saveWorkoutLogToCloud(historyEntry, workoutHistoryId);
    } catch (err) {
      console.error('Failed to sync with history', err);
    }

    setIsWorkoutModalOpen(false);
    setEditingWorkoutIndex(null);
    setSelectedDateKey(wDate);
  };

  // Save Rest Day Submission (preserves existing workouts, work, and symptoms on the day!)
  const handleSaveRest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rDate) return;

    const existingLog = calendarLogs[rDate];
    const currentWorkouts = getDayWorkouts(existingLog);
    const currentSymptoms = getDaySymptoms(existingLog);
    const hasWork = Boolean(existingLog?.workDetails || existingLog?.isWorkDay);
    const hasWorkout = currentWorkouts.length > 0;
    const hasSymptoms = currentSymptoms.length > 0 || Boolean(existingLog?.hasFndAttack);

    const hasMulti = hasWorkout || hasWork || hasSymptoms;
    const type: DayLogType = hasMulti ? 'multi' : 'rest';

    const newLog: CalendarDayLog = {
      id: existingLog?.id || `cal-rest-${Date.now()}`,
      date: rDate,
      type,
      workoutList: existingLog?.workoutList,
      workoutDetails: existingLog?.workoutDetails,
      workDetails: existingLog?.workDetails,
      isWorkDay: hasWork,
      hasFndAttack: hasSymptoms,
      symptomDetails: existingLog?.symptomDetails,
      symptomList: existingLog?.symptomList,
      hasWorkout,
      hasRest: true,
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

  // Save Work Day Submission (preserves existing workouts, rest, and symptoms on the day!)
  const handleSaveWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDate) return;

    const existingLog = calendarLogs[workDate];
    const currentWorkouts = getDayWorkouts(existingLog);
    const currentSymptoms = getDaySymptoms(existingLog);
    const hasRest = Boolean(existingLog?.restDetails);
    const hasWorkout = currentWorkouts.length > 0;
    const hasSymptoms = currentSymptoms.length > 0 || Boolean(existingLog?.hasFndAttack);

    const hasMulti = hasWorkout || hasRest || hasSymptoms;
    const type: DayLogType = hasMulti ? 'multi' : 'work';

    const newLog: CalendarDayLog = {
      id: existingLog?.id || `cal-work-${Date.now()}`,
      date: workDate,
      type,
      isWorkDay: true,
      workoutList: existingLog?.workoutList,
      workoutDetails: existingLog?.workoutDetails,
      restDetails: existingLog?.restDetails,
      hasWorkout,
      hasRest,
      hasFndAttack: hasSymptoms,
      symptomDetails: existingLog?.symptomDetails,
      symptomList: existingLog?.symptomList,
      workDetails: {
        shiftType: workShiftType,
        hoursWorked: Math.max(0.1, Math.round((Number(workHours) || 8) * 100) / 100),
        fatigueLevel: workFatigue,
        physicalStrain: workPhysicalStrain,
        shiftTiming: isCustomShiftTiming && customShiftTiming.trim() ? customShiftTiming.trim() : workShiftTiming,
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

  // Save High Symptom / FND Attack Submission (supports multiple attacks and preserves workouts/rest/work!)
  const handleSaveSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomDate) return;

    const existingLog = calendarLogs[symptomDate];
    const currentSymptoms = [...getDaySymptoms(existingLog)];

    const newSymptom: SymptomLogData = {
      severity: symptomSeverity,
      attackType: symptomAttackType,
      duration: symptomDuration,
      triggers: symptomTriggers,
      workoutImpact: symptomWorkoutImpact,
      notes: symptomNotes,
    };

    if (editingSymptomIndex !== null && editingSymptomIndex >= 0 && editingSymptomIndex < currentSymptoms.length) {
      currentSymptoms[editingSymptomIndex] = newSymptom;
    } else {
      currentSymptoms.push(newSymptom);
    }

    const currentWorkouts = getDayWorkouts(existingLog);
    const hasWork = Boolean(existingLog?.workDetails || existingLog?.isWorkDay);
    const hasRest = Boolean(existingLog?.restDetails);
    const hasWorkout = currentWorkouts.length > 0;

    const hasMulti = currentSymptoms.length > 1 || hasWorkout || hasWork || hasRest;
    const type: DayLogType = hasMulti ? 'multi' : 'symptom';

    const newLog: CalendarDayLog = {
      id: existingLog?.id || `cal-symptom-${Date.now()}`,
      date: symptomDate,
      type,
      hasFndAttack: true,
      symptomList: currentSymptoms,
      symptomDetails: currentSymptoms[0],
      workoutList: existingLog?.workoutList,
      workoutDetails: existingLog?.workoutDetails,
      restDetails: existingLog?.restDetails,
      workDetails: existingLog?.workDetails,
      isWorkDay: hasWork,
      hasWorkout,
      hasRest,
      createdAt: existingLog?.createdAt || new Date().toISOString(),
    };

    const updated = { ...calendarLogs, [symptomDate]: newLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(newLog);
    setIsSymptomModalOpen(false);
    setEditingSymptomIndex(null);
    setSelectedDateKey(symptomDate);
  };

  // Delete single workout item by index
  const handleDeleteWorkoutItem = (targetDate: string, index: number) => {
    const existing = calendarLogs[targetDate];
    if (!existing) return;
    const current = [...getDayWorkouts(existing)];
    const removedItem = current[index];
    current.splice(index, 1);

    const targetLogId =
      removedItem?.historyId ||
      `log_cal_${targetDate.replace(/[^a-zA-Z0-9_-]/g, '_')}_${index}`;
    // Also remove from local workout history and delete from cloud
    try {
      const rawHistory = localStorage.getItem(STORAGE_WORKOUT_HISTORY_KEY);
      if (rawHistory) {
        const historyList: any[] = JSON.parse(rawHistory);
        const filtered = historyList.filter(
          (h) => h.id !== targetLogId && !(h.date && h.date.startsWith(targetDate) && index === 0 && current.length === 0 && !h.id?.startsWith('live_'))
        );
        localStorage.setItem(STORAGE_WORKOUT_HISTORY_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('planche_history_updated'));
      }
      deleteWorkoutLogFromCloud(targetLogId);
    } catch (err) {
      console.error('Failed to remove workout item from history', err);
    }

    const symptoms = getDaySymptoms(existing);
    const hasWork = Boolean(existing.workDetails || existing.isWorkDay);
    const hasRest = Boolean(existing.restDetails);

    if (current.length === 0 && !hasWork && !hasRest && symptoms.length === 0) {
      handleDeleteDateLog(targetDate);
      return;
    }

    const hasMulti = current.length > 1 || (current.length > 0 && (hasWork || hasRest || symptoms.length > 0)) || (hasWork && hasRest) || (hasWork && symptoms.length > 0) || (hasRest && symptoms.length > 0);
    const newType: DayLogType = hasMulti ? 'multi' : current.length > 0 ? 'workout' : hasWork ? 'work' : hasRest ? 'rest' : 'symptom';

    const updatedLog: CalendarDayLog = {
      ...existing,
      workoutList: current.length > 0 ? current : undefined,
      workoutDetails: current[0],
      hasWorkout: current.length > 0,
      type: newType,
    };
    const updated = { ...calendarLogs, [targetDate]: updatedLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(updatedLog);
  };

  // Delete single symptom item by index
  const handleDeleteSymptomItem = (targetDate: string, index: number) => {
    const existing = calendarLogs[targetDate];
    if (!existing) return;
    const current = [...getDaySymptoms(existing)];
    current.splice(index, 1);

    const workouts = getDayWorkouts(existing);
    const hasWork = Boolean(existing.workDetails || existing.isWorkDay);
    const hasRest = Boolean(existing.restDetails);

    if (current.length === 0 && workouts.length === 0 && !hasWork && !hasRest) {
      handleDeleteDateLog(targetDate);
      return;
    }

    const hasMulti = current.length > 1 || (current.length > 0 && (workouts.length > 0 || hasWork || hasRest)) || (workouts.length > 0 && (hasWork || hasRest)) || (hasWork && hasRest);
    const newType: DayLogType = hasMulti ? 'multi' : current.length > 0 ? 'symptom' : workouts.length > 0 ? 'workout' : hasWork ? 'work' : 'rest';

    const updatedLog: CalendarDayLog = {
      ...existing,
      symptomList: current.length > 0 ? current : undefined,
      symptomDetails: current[0],
      hasFndAttack: current.length > 0,
      type: newType,
    };
    const updated = { ...calendarLogs, [targetDate]: updatedLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(updatedLog);
  };

  // Delete only rest details for a date
  const handleDeleteRestOnly = (targetDate: string) => {
    const existing = calendarLogs[targetDate];
    if (!existing) return;
    const workouts = getDayWorkouts(existing);
    const symptoms = getDaySymptoms(existing);
    const hasWork = Boolean(existing.workDetails || existing.isWorkDay);

    if (workouts.length === 0 && symptoms.length === 0 && !hasWork) {
      handleDeleteDateLog(targetDate);
      return;
    }

    const hasMulti = workouts.length > 1 || symptoms.length > 1 || (workouts.length > 0 && (symptoms.length > 0 || hasWork)) || (symptoms.length > 0 && hasWork);
    const newType: DayLogType = hasMulti ? 'multi' : workouts.length > 0 ? 'workout' : hasWork ? 'work' : 'symptom';

    const updatedLog: CalendarDayLog = {
      ...existing,
      restDetails: undefined,
      hasRest: false,
      type: newType,
    };
    const updated = { ...calendarLogs, [targetDate]: updatedLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(updatedLog);
  };

  // Delete only work details for a date
  const handleDeleteWorkOnly = (targetDate: string) => {
    const existing = calendarLogs[targetDate];
    if (!existing) return;
    const workouts = getDayWorkouts(existing);
    const symptoms = getDaySymptoms(existing);
    const hasRest = Boolean(existing.restDetails);

    if (workouts.length === 0 && symptoms.length === 0 && !hasRest) {
      handleDeleteDateLog(targetDate);
      return;
    }

    const hasMulti = workouts.length > 1 || symptoms.length > 1 || (workouts.length > 0 && (symptoms.length > 0 || hasRest)) || (symptoms.length > 0 && hasRest);
    const newType: DayLogType = hasMulti ? 'multi' : workouts.length > 0 ? 'workout' : hasRest ? 'rest' : 'symptom';

    const updatedLog: CalendarDayLog = {
      ...existing,
      workDetails: undefined,
      isWorkDay: false,
      type: newType,
    };
    const updated = { ...calendarLogs, [targetDate]: updatedLog };
    saveCalendarLogs(updated);
    saveCalendarLogToCloud(updatedLog);
  };

  // Delete log for date
  const handleDeleteDateLog = (targetDate: string) => {
    const updated = { ...calendarLogs };
    delete updated[targetDate];
    saveCalendarLogs(updated);
    deleteCalendarLogFromCloud(targetDate);

    // Also remove from workout history if it was a workout and sync removal to cloud
    try {
      const rawHistory = localStorage.getItem(STORAGE_WORKOUT_HISTORY_KEY);
      if (rawHistory) {
        const historyList: any[] = JSON.parse(rawHistory);
        const filtered = historyList.filter(
          (h) => formatDateToKey(new Date(h.date)) !== targetDate && !(h.date && h.date.startsWith(targetDate))
        );
        localStorage.setItem(STORAGE_WORKOUT_HISTORY_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('planche_history_updated'));
      }
      deleteWorkoutLogsByDateFromCloud(targetDate);
    } catch (err) {
      console.error('Failed to remove workout history on delete date', err);
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
            onClick={() => openSymptomModal(selectedDateKey)}
            className="px-3.5 py-2 text-xs font-semibold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Log high symptom day or FND attack with severity, duration, and neurological fatigue impact"
          >
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            <span>+ Log FND Attack</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
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
          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              FND Attacks (Month)
            </div>
            <div className="text-base font-bold text-rose-700 leading-tight">
              {monthStats.fndAttacks} {monthStats.fndAttacks === 1 ? 'Attack' : 'Attacks'}
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
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
              <span>FND Attack</span>
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
                className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
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
                        openWorkoutModal(dayKey, null);
                      }}
                      title="Log workout for this day"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Day Content Badges - Expandable view displaying all logs on this day */}
                <div className="mt-1 flex-1 flex flex-col justify-end space-y-1">
                  {log ? (() => {
                    const workouts = getDayWorkouts(log);
                    const symptoms = getDaySymptoms(log);
                    const hasWork = Boolean(log.workDetails || log.isWorkDay);
                    const hasRest = Boolean(log.restDetails);

                    return (
                      <div className="space-y-1">
                        {/* Workouts badge */}
                        {workouts.length > 0 && (
                          <div className="bg-blue-500/10 hover:bg-blue-500/15 border border-blue-200/80 rounded-md p-1 sm:p-1.5 transition-colors">
                            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-700 leading-tight truncate">
                              <Dumbbell className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                              <span className="truncate">
                                {workouts.length === 1
                                  ? (workouts[0].workoutIntensity || workouts[0].workoutName || 'Workout')
                                  : `${workouts.length} Workouts`}
                              </span>
                            </div>
                            <div className="hidden sm:block text-[9px] text-blue-600/90 font-medium truncate mt-0.5">
                              {workouts.length === 1
                                ? `${workouts[0].completedSets} sets · ${workouts[0].durationMinutes}m`
                                : `${workouts.reduce((acc, w) => acc + (Number(w.completedSets) || 0), 0)} sets total`}
                            </div>
                          </div>
                        )}

                        {/* FND Attacks badge */}
                        {symptoms.length > 0 && (
                          <div className="bg-rose-500/10 hover:bg-rose-500/15 border border-rose-300/80 rounded-md p-1 sm:p-1.5 transition-colors">
                            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-rose-800 leading-tight truncate">
                              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-rose-600" />
                              <span className="truncate">
                                {symptoms.length === 1 ? 'FND Attack' : `${symptoms.length} FND Attacks`}
                              </span>
                            </div>
                            <div className="hidden sm:block text-[9px] text-rose-700/90 font-medium truncate mt-0.5">
                              {symptoms[0]?.severity?.split(' ')[0] || 'Attack'}
                            </div>
                          </div>
                        )}

                        {/* Work Day badge */}
                        {hasWork && (
                          <div className="bg-amber-500/10 hover:bg-amber-500/15 border border-amber-300/80 rounded-md p-1 sm:p-1.5 transition-colors">
                            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-800 leading-tight truncate">
                              <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-amber-600" />
                              <span className="truncate">Work · {log.workDetails?.hoursWorked || 8}h</span>
                            </div>
                          </div>
                        )}

                        {/* Rest Day badge */}
                        {hasRest && (
                          <div className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-200/80 rounded-md p-1 sm:p-1.5 transition-colors">
                            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 leading-tight truncate">
                              <Moon className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-emerald-600" />
                              <span className="truncate">{log.restDetails?.restType || 'Rest Day'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })() : null}
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
                  onClick={() => openWorkoutModal(selectedDateKey)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Log a new workout session for this day"
                >
                  <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Add Workout</span>
                </button>

                <button
                  type="button"
                  onClick={() => openSymptomModal(selectedDateKey)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Attach an FND attack or neurological flare to this day"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-600" />
                  <span>+ Add FND Attack</span>
                </button>

                {!selectedLog.workDetails && (
                  <button
                    type="button"
                    onClick={() => openWorkModal(selectedDateKey, selectedLog)}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Mark or log work shift for this date to track fatigue impact"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    <span>+ Add Work Shift</span>
                  </button>
                )}

                {!selectedLog.restDetails && (
                  <button
                    type="button"
                    onClick={() => openRestModal(selectedDateKey, selectedLog)}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Mark rest & recovery protocol for this date"
                  >
                    <Moon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Add Rest Day</span>
                  </button>
                )}

                {deleteConfirmDate === selectedDateKey ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-rose-600 font-semibold">Delete entire day?</span>
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
                    title="Delete all logs for this date"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Day</span>
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
                  onClick={() => openSymptomModal(selectedDateKey)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-600" />
                  <span>Log FND Attack</span>
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
          {selectedLog ? (() => {
            const dayWorkouts = getDayWorkouts(selectedLog);
            const daySymptoms = getDaySymptoms(selectedLog);
            const hasWork = Boolean(selectedLog.workDetails);
            const hasRest = Boolean(selectedLog.restDetails);

            return (
              <div className="space-y-5">
                {/* Multi-log summary pill bar */}
                <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                    Activity Summary:
                  </span>
                  {dayWorkouts.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                      <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
                      <span>{dayWorkouts.length} Workout{dayWorkouts.length > 1 ? 's' : ''} ({dayWorkouts.reduce((acc, w) => acc + (w.completedSets || 0), 0)} sets)</span>
                    </span>
                  )}
                  {hasWork && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                      <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                      <span>Work Shift ({selectedLog.workDetails?.hoursWorked}h)</span>
                    </span>
                  )}
                  {hasRest && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                      <Moon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedLog.restDetails?.restType}</span>
                    </span>
                  )}
                  {daySymptoms.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>{daySymptoms.length} FND Attack{daySymptoms.length > 1 ? 's' : ''}</span>
                    </span>
                  )}
                </div>

                {/* 1. Workout Sessions List */}
                {dayWorkouts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-2xs">
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>Workouts ({dayWorkouts.length})</span>
                        </span>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          Calisthenics strength & skill sessions
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openWorkoutModal(selectedDateKey)}
                        className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Another Session</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {dayWorkouts.map((workout, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-4 sm:p-5 border border-blue-100 shadow-2xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900">
                                Session #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {workout.workoutName}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                                {workout.workoutIntensity}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
                                {workout.targetRpe}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openWorkoutModal(selectedDateKey, idx)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <Edit3 className="w-3 h-3 text-slate-500" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWorkoutItem(selectedDateKey, idx)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Remove this workout session"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Sets Completed</div>
                              <div className="text-sm font-bold text-slate-900 mt-0.5">
                                {workout.completedSets} / {workout.totalSets} sets
                              </div>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Session Duration</div>
                              <div className="text-sm font-bold text-slate-900 mt-0.5">
                                {workout.durationMinutes} minutes
                              </div>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Completion Rate</div>
                              <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  {Math.round(((workout.completedSets || 1) / (workout.totalSets || 1)) * 100)}% Achieved
                                </span>
                              </div>
                            </div>
                          </div>

                          {(workout.sessionPerformance ||
                            workout.physicalFatigue ||
                            workout.neuromuscularControl ||
                            workout.skillPerformance) && (
                            <div className="flex flex-wrap gap-1.5">
                              {workout.sessionPerformance && (() => {
                                const tone = getPerformanceTone(workout.sessionPerformance);
                                return (
                                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${tone ? getToneBadgeClasses(tone) : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                    Performance: {workout.sessionPerformance}
                                  </span>
                                );
                              })()}
                              {workout.physicalFatigue && (() => {
                                const tone = getFatigueTone(workout.physicalFatigue);
                                return (
                                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${tone ? getToneBadgeClasses(tone) : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                    Fatigue: {workout.physicalFatigue}
                                  </span>
                                );
                              })()}
                              {workout.neuromuscularControl && (() => {
                                const tone = getControlTone(workout.neuromuscularControl);
                                return (
                                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${tone ? getToneBadgeClasses(tone) : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                    Control: {workout.neuromuscularControl}
                                  </span>
                                );
                              })()}
                              {workout.skillPerformance && (() => {
                                const tone = getSkillTone(workout.skillPerformance);
                                return (
                                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${tone ? getToneBadgeClasses(tone) : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                    Skills: {workout.skillPerformance}
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {workout.symptoms && workout.symptoms.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
                                Symptoms:
                              </span>
                              {workout.symptoms.map((sym) => (
                                <span
                                  key={sym}
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                    sym === NO_UNUSUAL_SYMPTOMS_TAG
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {sym}
                                </span>
                              ))}
                            </div>
                          )}

                          {workout.exercises && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Exercises Performed
                              </div>
                              <div className="text-xs text-slate-700 leading-relaxed">
                                {workout.exercises}
                              </div>
                            </div>
                          )}

                          {workout.notes && (
                            <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 space-y-1">
                              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-900">
                                <FileText className="w-3 h-3 text-blue-600" />
                                <span>Athlete Feedback & Notes</span>
                              </div>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                                "{workout.notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Work Day & Fatigue Analysis Section */}
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
                    </div>
                  );
                })()}

                {/* 3. Rest & Recovery Details Section */}
                {selectedLog.restDetails && (
                  <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Moon className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-emerald-950">Rest & Recovery Protocol</span>
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                              {selectedLog.restDetails.restType}
                            </span>
                            {selectedLog.restDetails.sleepQuality && (
                              <span className="text-[10px] bg-white text-emerald-800 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                                Sleep: {selectedLog.restDetails.sleepQuality}
                              </span>
                            )}
                            {selectedLog.restDetails.fatigueLevel && (
                              <span className="text-[10px] bg-white text-emerald-800 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                                Status: {selectedLog.restDetails.fatigueLevel}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                            Active CNS & tendon replenishment
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openRestModal(selectedDateKey, selectedLog)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-700" />
                          <span>Edit Rest</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRestOnly(selectedDateKey)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Remove rest day record from this date"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Remove Rest</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-emerald-200/70 space-y-2">
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
                      <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-200/70 space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
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

                {/* 4. High Symptom & FND Attacks Section */}
                {daySymptoms.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white shadow-2xs">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>FND Attacks & Flares ({daySymptoms.length})</span>
                        </span>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          Neurological motor & sensory event logging
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openSymptomModal(selectedDateKey)}
                        className="text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Another Attack</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {daySymptoms.map((symptom, idx) => {
                        const analysis = getFndSymptomAnalysis(symptom);
                        return (
                          <div key={idx} className="bg-rose-50/75 border border-rose-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-rose-200/60">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-rose-950">Attack #{idx + 1}</span>
                                    <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                                      {symptom.severity}
                                    </span>
                                    <span className="text-[10px] bg-white text-rose-800 font-medium px-2 py-0.5 rounded-full border border-rose-200">
                                      {symptom.duration}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-rose-800 font-medium mt-0.5">
                                    {symptom.attackType} · {symptom.triggers}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openSymptomModal(selectedDateKey, idx)}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-900 bg-white hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Edit3 className="w-3 h-3 text-rose-700" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSymptomItem(selectedDateKey, idx)}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Remove this symptom event"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-600" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>

                            {/* Metric Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                              <div className="bg-white p-2.5 rounded-xl border border-rose-200/60 shadow-2xs">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attack Severity</div>
                                <div className="text-xs font-bold text-rose-900 mt-0.5 truncate" title={symptom.severity}>
                                  {symptom.severity}
                                </div>
                              </div>
                              <div className="bg-white p-2.5 rounded-xl border border-rose-200/60 shadow-2xs">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manifestation</div>
                                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={symptom.attackType}>
                                  {symptom.attackType}
                                </div>
                              </div>
                              <div className="bg-white p-2.5 rounded-xl border border-rose-200/60 shadow-2xs">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</div>
                                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={symptom.duration}>
                                  {symptom.duration}
                                </div>
                              </div>
                              <div className="bg-white p-2.5 rounded-xl border border-rose-200/60 shadow-2xs">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workout Impact</div>
                                <div className="text-xs font-bold text-rose-800 mt-0.5 truncate" title={symptom.workoutImpact}>
                                  {symptom.workoutImpact}
                                </div>
                              </div>
                            </div>

                            {/* Why You're Fatigued Neurological Analysis */}
                            {analysis && (
                              <div className="bg-white rounded-xl p-4 border border-rose-200/90 shadow-2xs space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                                  <Zap className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>Why You're Fatigued: {analysis.title}</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  {analysis.explanation}
                                </p>
                                <div className="bg-rose-50/80 p-3 rounded-lg border border-rose-200 text-xs text-rose-950 font-medium leading-relaxed">
                                  🧠 <strong className="font-bold text-rose-900">Neurological Calibration & Recovery:</strong> {analysis.recommendation}
                                </div>
                              </div>
                            )}

                            {/* Athlete Notes */}
                            {symptom.notes && (
                              <div className="bg-white/80 p-3.5 rounded-xl border border-rose-200/70 space-y-1">
                                <div className="text-[10px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                                  <span>FND Symptom Notes & Trigger Biofeedback</span>
                                </div>
                                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                                  "{symptom.notes}"
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="py-6 text-center text-slate-500 space-y-2">
              <Activity className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                No activity, work shift, or rest logged for this date.
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Log multiple workout sessions, record FND attacks / flares, mark work shifts, and schedule rest days on the same date!
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
                  onClick={() => openSymptomModal(selectedDateKey)}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-600" />
                  <span>Log FND Attack</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingWorkoutIndex !== null ? `Edit Workout Session #${editingWorkoutIndex + 1}` : 'Log Workout'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Session details, readiness & symptom tracking</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkoutModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkout} className="space-y-4 text-xs">
              {/* 1. Core Session Details */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={wDate}
                      onChange={(e) => setWDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">Routine / Workout Title</label>
                      <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Auto-syncs
                      </span>
                    </div>
                    <select
                      value={wName}
                      onChange={(e) => handleRoutineTitleChange(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                    >
                      {availablePrograms.map((prog) => {
                        const isCurrentOnPage = currentWorkout && currentWorkout.id === prog.id;
                        return (
                          <option key={prog.id} value={prog.name}>
                            {prog.name} {isCurrentOnPage ? '★ (Active)' : ''}
                          </option>
                        );
                      })}
                      <option value="Custom Calisthenics Strength Session">
                        Custom Calisthenics Strength Session
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="col-span-2 sm:col-span-2">
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
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
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
                    <label className="block font-bold text-slate-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={wDuration}
                      onChange={(e) => setWDuration(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sets (Done / Total)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        aria-label="Sets Completed"
                        value={wCompletedSets}
                        onChange={(e) => setWCompletedSets(Number(e.target.value))}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 text-center"
                      />
                      <span className="text-slate-400 font-bold">/</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        aria-label="Total Prescribed Sets"
                        value={wTotalSets}
                        onChange={(e) => setWTotalSets(Number(e.target.value))}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perceived Effort / Target RPE</label>
                  <select
                    value={wRpe}
                    onChange={(e) => setWRpe(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  >
                    <option value="RPE 2-3 (GTG / Effortless)">RPE 2-3 (GTG / Effortless)</option>
                    <option value="RPE 5-6 (3-4 RIR - Very Fresh)">RPE 5-6 (3-4 RIR - Very Fresh)</option>
                    <option value="RPE 6-7 (2-3 RIR - Prescribed Submax)">RPE 6-7 (2-3 RIR - Prescribed Submax)</option>
                    <option value="RPE 7-8 (1-2 RIR - Solid Challenge)">RPE 7-8 (1-2 RIR - Solid Challenge)</option>
                    <option value="RPE 8-9 (1 RIR - Heavy)">RPE 8-9 (1 RIR - Heavy)</option>
                    <option value="RPE 9.5-10 (0 RIR - True Maximum)">RPE 9.5-10 (0 RIR - True Maximum)</option>
                  </select>
                </div>

                {/* Compact Exercises Performed + Toggleable Chip Picker */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <label className="block font-bold text-slate-700">Exercises Performed</label>
                    <div className="flex items-center gap-1.5">
                      {matchedProgram && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowExerciseChips((prev) => !prev)}
                            className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer transition-colors"
                          >
                            {showExerciseChips ? 'Hide Exercise Chips' : `Customize (${matchedProgram.phases.flatMap((p) => p.exercises).length})`}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWExercises(getExercisesStringFromWorkout(matchedProgram))}
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 transition-colors"
                            title="Reset exercises back to program default"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reload</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={wExercises}
                    onChange={(e) => setWExercises(e.target.value)}
                    placeholder="e.g. Frog Planche with Raised Legs, Planche Leans, Dumbbell Leans..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 leading-relaxed text-xs"
                  />
                  {matchedProgram && showExerciseChips && (
                    <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                        <span>Exercises from {matchedProgram.name}</span>
                        <span className="text-slate-400 font-normal">Click to toggle</span>
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
                                  const parts = wExercises.split(/,\s*/).filter((p) => !p.toLowerCase().includes(ex.name.toLowerCase()));
                                  setWExercises(parts.join(', '));
                                } else {
                                  const prefix = wExercises.trim() ? `${wExercises.trim()}, ` : '';
                                  setWExercises(`${prefix}${ex.name}`);
                                }
                              }}
                              className={`text-[10px] px-2 py-1 rounded-lg font-medium cursor-pointer transition-colors border flex items-center gap-1 ${
                                isIncluded
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                              }`}
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
              </div>

              {/* 2. Session Performance */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Session Performance</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SESSION_PERFORMANCE_OPTIONS.map((opt) => {
                    const selected = wSessionPerformance === opt.value;
                    const activeClasses =
                      opt.tone === 'green'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400'
                        : opt.tone === 'amber'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                        : 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400';
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setWSessionPerformance(selected ? '' : opt.value)}
                        className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          selected
                            ? activeClasses
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{opt.label}</span>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <div className="text-[10px] opacity-80 leading-snug mt-0.5">{opt.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Fatigue & Neuromuscular Tracking (3 independent selections) */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Fatigue &amp; Neuromuscular Tracking
                </div>

                {/* Physical Fatigue */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">Physical Fatigue</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PHYSICAL_FATIGUE_OPTIONS.map((opt) => {
                      const selected = wPhysicalFatigue === opt.value;
                      const activeClasses =
                        opt.tone === 'green'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400'
                          : opt.tone === 'amber'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                          : 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400';
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setWPhysicalFatigue(selected ? '' : opt.value)}
                          className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? activeClasses
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs">{opt.label}</div>
                          <div className="text-[10px] opacity-80 leading-snug mt-0.5">{opt.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Neuromuscular Control */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">Neuromuscular Control</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {NEUROMUSCULAR_CONTROL_OPTIONS.map((opt) => {
                      const selected = wNeuromuscularControl === opt.value;
                      const activeClasses =
                        opt.tone === 'green'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400'
                          : opt.tone === 'amber'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                          : 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400';
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setWNeuromuscularControl(selected ? '' : opt.value)}
                          className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? activeClasses
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs">{opt.label}</div>
                          <div className="text-[10px] opacity-80 leading-snug mt-0.5">{opt.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Skill Performance */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">Skill Performance</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SKILL_PERFORMANCE_OPTIONS.map((opt) => {
                      const selected = wSkillPerformance === opt.value;
                      const activeClasses =
                        opt.tone === 'green'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400'
                          : opt.tone === 'amber'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                          : 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400';
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setWSkillPerformance(selected ? '' : opt.value)}
                          className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? activeClasses
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs">{opt.label}</div>
                          <div className="text-[10px] opacity-80 leading-snug mt-0.5">{opt.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. Symptom Tracking */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">Symptoms</label>
                  <span className="text-[10px] text-slate-400">Select all that apply</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SYMPTOM_TAGS.map((tag) => {
                    const isSelected = wSymptoms.includes(tag);
                    const isNone = tag === NO_UNUSUAL_SYMPTOMS_TAG;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setWSymptoms((prev) => toggleSymptomSelection(prev, tag))}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? isNone
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-400'
                              : 'bg-amber-50 text-amber-900 border-amber-400 ring-1 ring-amber-400'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Simplified Athlete Feedback */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Athlete Feedback <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={wNotes}
                  onChange={(e) => setWNotes(e.target.value)}
                  placeholder="What went well? What struggled? Did anything affect your performance today?"
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
                  <span>{editingWorkoutIndex !== null ? 'Update Workout Session' : 'Save Workout Session'}</span>
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

              {/* Dedicated Manual Hours Worked Input & Shift Time Calculator */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <label className="font-bold text-slate-800 text-xs">
                      Hours Worked (Manual Input)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTimeCalculator(!showTimeCalculator)}
                    className="text-[11px] font-semibold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Calculator className="w-3 h-3 text-amber-700" />
                    <span>{showTimeCalculator ? 'Hide Shift Calculator' : 'Calculate from Start / End Time'}</span>
                  </button>
                </div>

                {/* Direct Manual Input with Step Adjusters */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0.1}
                      max={24}
                      step="any"
                      required
                      value={workHours}
                      onChange={(e) => setWorkHours(e.target.value)}
                      placeholder="e.g. 8, 7.5, 9.25"
                      className="w-full pl-3 pr-12 py-2 bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      hrs
                    </span>
                  </div>

                  {/* Step adjustments */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const current = Number(workHours) || 8;
                        setWorkHours(Math.max(0.5, Math.round((current - 0.5) * 10) / 10));
                      }}
                      className="px-2 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      title="Subtract 0.5 hours"
                    >
                      -0.5h
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = Number(workHours) || 8;
                        setWorkHours(Math.min(24, Math.round((current + 0.5) * 10) / 10));
                      }}
                      className="px-2 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      title="Add 0.5 hours"
                    >
                      +0.5h
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = Number(workHours) || 8;
                        setWorkHours(Math.min(24, Math.round((current + 1) * 10) / 10));
                      }}
                      className="px-2 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      title="Add 1 hour"
                    >
                      +1h
                    </button>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Quick presets:</span>
                    <span>Type any exact or decimal hours above</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[4, 5, 6, 7.5, 8, 8.5, 9, 10, 12].map((preset) => {
                      const isSelected = Number(workHours) === preset;
                      return (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setWorkHours(preset)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
                          }`}
                        >
                          {preset}h
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Start/End Time Calculator (when toggled) */}
                {showTimeCalculator && (() => {
                  const calculated = calculateShiftHours(calcStartTime, calcEndTime, calcBreakMinutes);
                  return (
                    <div className="pt-3 border-t border-amber-200/70 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                          <Calculator className="w-3.5 h-3.5 text-amber-700" />
                          Shift Time Calculator
                        </span>
                        <span className="text-[10px] text-slate-500">Computes exact decimal hours</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Start Time</label>
                          <input
                            type="time"
                            value={calcStartTime}
                            onChange={(e) => setCalcStartTime(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">End Time</label>
                          <input
                            type="time"
                            value={calcEndTime}
                            onChange={(e) => setCalcEndTime(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Unpaid Break</label>
                          <select
                            value={calcBreakMinutes}
                            onChange={(e) => setCalcBreakMinutes(Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value={0}>0 min</option>
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200">
                        <div className="text-xs">
                          <span className="text-slate-500 font-medium">Calculated: </span>
                          <strong className="font-bold text-amber-900">{calculated} hours</strong>
                          {calcBreakMinutes > 0 && (
                            <span className="text-[10px] text-slate-400 ml-1">(-{calcBreakMinutes}m break)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWorkHours(calculated);
                            const formattedRange = `${calcStartTime} – ${calcEndTime}${calcBreakMinutes > 0 ? ` (${calcBreakMinutes}m break)` : ''}`;
                            setIsCustomShiftTiming(true);
                            setCustomShiftTiming(formattedRange);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apply {calculated} hrs</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Timing</label>
                  <select
                    value={isCustomShiftTiming ? 'Custom / Manual Timing' : workShiftTiming}
                    onChange={(e) => {
                      if (e.target.value === 'Custom / Manual Timing') {
                        setIsCustomShiftTiming(true);
                        if (!customShiftTiming) setCustomShiftTiming('08:30 – 17:00');
                      } else {
                        setIsCustomShiftTiming(false);
                        setWorkShiftTiming(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                  >
                    <option value="Standard (9am-5pm)">Standard (9am-5pm)</option>
                    <option value="Early Morning Shift (5am-1pm)">Early Morning Shift (5am-1pm)</option>
                    <option value="Afternoon / Evening (2pm-10pm)">Afternoon / Evening (2pm-10pm)</option>
                    <option value="Night / Graveyard Shift (10pm-6am)">Night / Graveyard Shift (10pm-6am)</option>
                    <option value="12-Hour Long Shift">12-Hour Long Shift</option>
                    <option value="Split Shift / Irregular">Split Shift / Irregular</option>
                    <option value="Custom / Manual Timing">Custom / Manual Shift Hours...</option>
                  </select>
                  {isCustomShiftTiming && (
                    <div className="mt-1.5">
                      <input
                        type="text"
                        value={customShiftTiming}
                        onChange={(e) => setCustomShiftTiming(e.target.value)}
                        placeholder="e.g. 08:30 – 17:00 or 7:00 AM – 3:30 PM"
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 text-xs"
                      />
                    </div>
                  )}
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
                const numericHours = Math.max(0.1, Number(workHours) || 8);
                const preview = getWorkFatigueAnalysis({
                  shiftType: workShiftType,
                  hoursWorked: numericHours,
                  fatigueLevel: workFatigue,
                  physicalStrain: workPhysicalStrain,
                  shiftTiming: isCustomShiftTiming && customShiftTiming.trim() ? customShiftTiming.trim() : workShiftTiming,
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

      {/* MODAL 4: Log High Symptom / FND Attack Modal */}
      {isSymptomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingSymptomIndex !== null ? `Edit FND Attack #${editingSymptomIndex + 1}` : 'Log High Symptom / FND Attack'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track neurological attacks, motor fatigue, and training impact
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSymptomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSymptom} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Attack / Symptom Flare</label>
                <input
                  type="date"
                  required
                  value={symptomDate}
                  onChange={(e) => setSymptomDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attack Severity</label>
                  <select
                    value={symptomSeverity}
                    onChange={(e) => setSymptomSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                  >
                    <option value="Severe Attack / Major Flare">Severe Attack / Major Flare</option>
                    <option value="Extreme Incapacitating Attack">Extreme Incapacitating Attack</option>
                    <option value="Moderate Motor Flare">Moderate Motor Flare</option>
                    <option value="Mild Symptom Flare">Mild Symptom Flare</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attack Duration</label>
                  <select
                    value={symptomDuration}
                    onChange={(e) => setSymptomDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                  >
                    <option value="Under 30 Minutes">Under 30 Minutes</option>
                    <option value="30 - 60 Minutes">30 - 60 Minutes</option>
                    <option value="1 - 2 Hours">1 - 2 Hours</option>
                    <option value="2 - 4 Hours">2 - 4 Hours</option>
                    <option value="Half-Day (4 - 6 Hours)">Half-Day (4 - 6 Hours)</option>
                    <option value="Full Day / Multi-Day Flare">Full Day / Multi-Day Flare</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Manifestation / Symptoms</label>
                <select
                  value={symptomAttackType}
                  onChange={(e) => setSymptomAttackType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                >
                  <option value="Limb Weakness & Motor Control Loss">Limb Weakness & Motor Control Loss</option>
                  <option value="Severe Tremors & Involuntary Spasms">Severe Tremors & Involuntary Spasms</option>
                  <option value="Non-Epileptic Seizures / Dissociative Attacks">Non-Epileptic Seizures / Dissociative Attacks</option>
                  <option value="Functional Dystonia & Muscle Stiffening">Functional Dystonia & Muscle Stiffening</option>
                  <option value="Sudden Drop Attack / Temporary Paralysis">Sudden Drop Attack / Temporary Paralysis</option>
                  <option value="Sensory Flare / Neuropathic Pain & Numbness">Sensory Flare / Neuropathic Pain & Numbness</option>
                  <option value="Severe Central Exhaustion & Cognitive Fog">Severe Central Exhaustion & Cognitive Fog</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Suspected Trigger / Context</label>
                  <select
                    value={symptomTriggers}
                    onChange={(e) => setSymptomTriggers(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                  >
                    <option value="Workout Overexertion / High Strain">Workout Overexertion / High Strain</option>
                    <option value="Workplace Physical Labor & Fatigue">Workplace Physical Labor & Fatigue</option>
                    <option value="Sensory Overload & High Stress">Sensory Overload & High Stress</option>
                    <option value="Poor Sleep & Recovery Deficit">Poor Sleep & Recovery Deficit</option>
                    <option value="Heat / Temperature Sensitivity">Heat / Temperature Sensitivity</option>
                    <option value="Spontaneous / No Obvious Trigger">Spontaneous / No Obvious Trigger</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Impact on Calisthenics Training</label>
                  <select
                    value={symptomWorkoutImpact}
                    onChange={(e) => setSymptomWorkoutImpact(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                  >
                    <option value="No workout possible (Bed rest & safety)">No workout possible (Bed rest & safety)</option>
                    <option value="Dropped to 5-min GTG 20-30% supersets only">Dropped to 5-min GTG 20-30% supersets only</option>
                    <option value="Dropped to passive mobility & prehab only">Dropped to passive mobility & prehab only</option>
                    <option value="Trained submax with reduced volume & 3-4 RIR">Trained submax with reduced volume & 3-4 RIR</option>
                    <option value="Pushed through (Exacerbated neurological symptoms)">Pushed through (Exacerbated neurological symptoms)</option>
                  </select>
                </div>
              </div>

              {/* Live Athlete Neurological & Central Fatigue Preview */}
              {(() => {
                const preview = getFndSymptomAnalysis({
                  severity: symptomSeverity,
                  attackType: symptomAttackType,
                  duration: symptomDuration,
                  triggers: symptomTriggers,
                  workoutImpact: symptomWorkoutImpact,
                });
                return preview ? (
                  <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200/90 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                      <Zap className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{preview.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {preview.explanation}
                    </p>
                    <div className="text-[11px] text-rose-900 font-semibold pt-1 border-t border-rose-200/60">
                      🧠 {preview.recommendation}
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Attack Details & Biofeedback Notes
                </label>
                <textarea
                  rows={3}
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  placeholder="Describe what occurred: e.g., 'Right arm gave out after set 3 of planche leans, followed by heavy tremors and speech slurring for 45 mins. Explains why power output crashed.'"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900 leading-relaxed text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSymptomModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingSymptomIndex !== null ? 'Update FND Attack' : 'Save FND Attack'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
