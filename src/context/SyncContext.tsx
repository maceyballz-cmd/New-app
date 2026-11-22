import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  loginWithGoogle,
  loginWithGoogleRedirect,
  logoutUser,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  WeeklyProgressEntry,
  NutritionHeaderStep,
  MeasureUnit,
  getStoredTransformationData,
  saveStoredTransformationData,
  saveStoredNutritionSteps,
  normalizeDailyWeighIns,
  getStoredMeasureUnit,
  saveStoredMeasureUnit,
  parseMeasureUnitFromMode,
  toStoredUnitMode,
} from '../data/transformationData';
import { CalendarDayLog } from '../components/WorkoutCalendarView';
import {
  WorkoutType,
  WorkoutProgram,
  RoadmapPathFocus,
  getWorkoutProgram,
  saveWorkoutProgram,
  saveStoredRoadmapPathFocus,
} from '../data/programData';

import {
  LogEntry,
  SessionPerformance,
  PhysicalFatigue,
  NeuromuscularControl,
  SkillPerformance,
} from '../data/workoutTrackingTypes';

export type { LogEntry };

const parseSymptomsField = (data: Record<string, any>): string[] | undefined => {
  if (Array.isArray(data.symptoms)) {
    return data.symptoms.filter((s): s is string => typeof s === 'string' && s.length > 0);
  }
  if (typeof data.symptomsJson === 'string' && data.symptomsJson.trim().length > 0) {
    try {
      const parsed = JSON.parse(data.symptomsJson);
      if (Array.isArray(parsed)) {
        return parsed.filter((s): s is string => typeof s === 'string' && s.length > 0);
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return undefined;
};

const mapFirestoreWorkoutLog = (docId: string, data: Record<string, any>): LogEntry => {
  const symptoms = parseSymptomsField(data);
  const entry: LogEntry = {
    id: data.id || docId,
    date: data.date,
    completedSets: Number(data.completedSets || 0),
    totalSets: Number(data.totalSets || 0),
    progressPercent: Number(data.progressPercent || 0),
    targetRpe: data.targetRpe || 'RPE 8',
    notes: data.notes || '',
    workoutName: data.workoutName || 'Frog Planche Focus',
    workoutIntensity: data.workoutIntensity || '50–60% Submaximal',
  };
  if (typeof data.durationMinutes === 'number' && data.durationMinutes > 0) {
    entry.durationMinutes = Number(data.durationMinutes);
  }
  if (typeof data.exercises === 'string' && data.exercises.trim().length > 0) {
    entry.exercises = data.exercises;
  }
  if (data.sessionPerformance) {
    entry.sessionPerformance = data.sessionPerformance as SessionPerformance;
  }
  if (data.physicalFatigue) {
    entry.physicalFatigue = data.physicalFatigue as PhysicalFatigue;
  }
  if (data.neuromuscularControl) {
    entry.neuromuscularControl = data.neuromuscularControl as NeuromuscularControl;
  }
  if (data.skillPerformance) {
    entry.skillPerformance = data.skillPerformance as SkillPerformance;
  }
  if (symptoms && symptoms.length > 0) {
    entry.symptoms = symptoms;
  }
  return entry;
};

const buildFirestoreWorkoutLogPayload = (log: LogEntry, cleanId: string, uid: string) => {
  const payload: Record<string, any> = {
    id: cleanId,
    userId: uid,
    date: log.date || new Date().toISOString(),
    completedSets: Number(log.completedSets || 0),
    totalSets: Number(log.totalSets || 0),
    progressPercent: Number(log.progressPercent || 0),
    targetRpe: String(log.targetRpe || 'RPE 8').slice(0, 64),
    notes: String(log.notes || '').slice(0, 2048),
    workoutName: String(log.workoutName || 'Frog Planche Focus').slice(0, 256),
    workoutIntensity: String(log.workoutIntensity || '50–60% Submaximal').slice(0, 128),
    createdAt: new Date().toISOString(),
  };
  if (typeof log.durationMinutes === 'number' && log.durationMinutes > 0) {
    payload.durationMinutes = Number(log.durationMinutes);
  }
  if (typeof log.exercises === 'string' && log.exercises.trim().length > 0) {
    payload.exercises = String(log.exercises).slice(0, 2048);
  }
  if (log.sessionPerformance) {
    payload.sessionPerformance = String(log.sessionPerformance).slice(0, 32);
  }
  if (log.physicalFatigue) {
    payload.physicalFatigue = String(log.physicalFatigue).slice(0, 32);
  }
  if (log.neuromuscularControl) {
    payload.neuromuscularControl = String(log.neuromuscularControl).slice(0, 32);
  }
  if (log.skillPerformance) {
    payload.skillPerformance = String(log.skillPerformance).slice(0, 32);
  }
  if (Array.isArray(log.symptoms) && log.symptoms.length > 0) {
    payload.symptomsJson = JSON.stringify(log.symptoms).slice(0, 1024);
  }
  return payload;
};

const mapFirestoreTransformationWeek = (data: Record<string, any>): WeeklyProgressEntry => {
  let parsedWeighIns: string[] = normalizeDailyWeighIns(undefined);
  if (typeof data.dailyWeighInsJson === 'string' && data.dailyWeighInsJson.trim().length > 0) {
    try {
      parsedWeighIns = normalizeDailyWeighIns(JSON.parse(data.dailyWeighInsJson));
    } catch {
      parsedWeighIns = normalizeDailyWeighIns(undefined);
    }
  }
  const weekNum = Number(data.weekNumber);
  return {
    weekNumber: weekNum,
    weekLabel: data.weekLabel || (weekNum === 0 ? 'Start Date' : `Week ${weekNum}`),
    date: data.date || '',
    isMilestone: weekNum === 0 || weekNum === 4 || weekNum === 8 || weekNum === 12,
    weight: data.weight || '',
    dailyWeighIns: parsedWeighIns,
    chest: data.chest || '',
    rightArm: data.rightArm || '',
    leftArm: data.leftArm || '',
    navelAbove: data.navelAbove || '',
    navelAt: data.navelAt || '',
    navelBelow: data.navelBelow || '',
    hips: data.hips || '',
    rightThigh: data.rightThigh || '',
    leftThigh: data.leftThigh || '',
    height: data.height || '',
    targetRateWeight: data.targetRateWeight || '',
    targetDailySteps: data.targetDailySteps || '',
    actualDailySteps: data.actualDailySteps || '',
    trainingDays: data.trainingDays || '',
    totalTrainingTime: data.totalTrainingTime || '',
    restDays: data.restDays || '',
    trainingTime: data.trainingTime || '',
    mealTimes: data.mealTimes || '',
    trainingDayCalories: data.trainingDayCalories || '',
    trainingDayMacros: data.trainingDayMacros || '',
    restDayCalories: data.restDayCalories || '',
    restDayMacros: data.restDayMacros || '',
    actualDailyCalories: data.actualDailyCalories || '',
    proteinIntake: data.proteinIntake || '',
    calorieAdherence: data.calorieAdherence || '',
    trainingAdherence: data.trainingAdherence || '',
    sleepScore: data.sleepScore || '',
    stressScore: data.stressScore || '',
    hungerScore: data.hungerScore || '',
    fatigueScore: data.fatigueScore || '',
    energyLevel: data.energyLevel || '',
    trainingPerformance: data.trainingPerformance || '',
    progressNotes: data.progressNotes || '',
    challengesNotes: data.challengesNotes || '',
    keySkillProgress: data.keySkillProgress || '',
    photos: {
      front: data.photoFront,
      back: data.photoBack,
      leftSide: data.photoLeftSide,
      rightSide: data.photoRightSide,
    },
  };
};

const buildFirestoreTransformationWeekPayload = (
  week: WeeklyProgressEntry,
  weekId: string,
  uid: string
) => ({
  weekId,
  userId: uid,
  weekNumber: Number(week.weekNumber),
  weekLabel: String(week.weekLabel || `Week ${week.weekNumber}`).slice(0, 64),
  date: String(week.date || '').slice(0, 64),
  weight: String(week.weight || '').slice(0, 32),
  dailyWeighInsJson: JSON.stringify(normalizeDailyWeighIns(week.dailyWeighIns)).slice(0, 256),
  chest: String(week.chest || '').slice(0, 32),
  rightArm: String(week.rightArm || '').slice(0, 32),
  leftArm: String(week.leftArm || '').slice(0, 32),
  navelAbove: String(week.navelAbove || '').slice(0, 32),
  navelAt: String(week.navelAt || '').slice(0, 32),
  navelBelow: String(week.navelBelow || '').slice(0, 32),
  hips: String(week.hips || '').slice(0, 32),
  rightThigh: String(week.rightThigh || '').slice(0, 32),
  leftThigh: String(week.leftThigh || '').slice(0, 32),
  height: String(week.height || '').slice(0, 32),
  targetRateWeight: String(week.targetRateWeight || '').slice(0, 64),
  targetDailySteps: String(week.targetDailySteps || '').slice(0, 32),
  actualDailySteps: String(week.actualDailySteps || '').slice(0, 32),
  trainingDays: String(week.trainingDays || '').slice(0, 32),
  totalTrainingTime: String(week.totalTrainingTime || '').slice(0, 64),
  restDays: String(week.restDays || '').slice(0, 32),
  trainingTime: String(week.trainingTime || '').slice(0, 64),
  mealTimes: String(week.mealTimes || '').slice(0, 128),
  trainingDayCalories: String(week.trainingDayCalories || '').slice(0, 64),
  trainingDayMacros: String(week.trainingDayMacros || '').slice(0, 64),
  restDayCalories: String(week.restDayCalories || '').slice(0, 64),
  restDayMacros: String(week.restDayMacros || '').slice(0, 64),
  actualDailyCalories: String(week.actualDailyCalories || '').slice(0, 32),
  proteinIntake: String(week.proteinIntake || '').slice(0, 32),
  calorieAdherence: String(week.calorieAdherence || '').slice(0, 64),
  trainingAdherence: String(week.trainingAdherence || '').slice(0, 64),
  sleepScore: String(week.sleepScore || '').slice(0, 16),
  stressScore: String(week.stressScore || '').slice(0, 16),
  hungerScore: String(week.hungerScore || '').slice(0, 16),
  fatigueScore: String(week.fatigueScore || '').slice(0, 32),
  energyLevel: String(week.energyLevel || '').slice(0, 64),
  trainingPerformance: String(week.trainingPerformance || '').slice(0, 64),
  progressNotes: String(week.progressNotes || '').slice(0, 1024),
  challengesNotes: String(week.challengesNotes || '').slice(0, 1024),
  keySkillProgress: String(week.keySkillProgress || '').slice(0, 512),
  photoFront: String(week.photos?.front || '').slice(0, 300000),
  photoBack: String(week.photos?.back || '').slice(0, 300000),
  photoLeftSide: String(week.photos?.leftSide || '').slice(0, 300000),
  photoRightSide: String(week.photos?.rightSide || '').slice(0, 300000),
  updatedAt: new Date().toISOString(),
});

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncStats {
  workoutLogsCount: number;
  calendarLogsCount: number;
  hasTransformation: boolean;
}

export interface LoginErrorInfo {
  code: string;
  message: string;
  domain: string;
}

interface SyncContextType {
  user: User | null;
  authLoading: boolean;
  isLoggingIn: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  loginError: LoginErrorInfo | null;
  clearLoginError: () => void;
  stats: SyncStats;
  login: () => Promise<void>;
  loginWithRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  loadAllUserDataFromCloud: (uid?: string) => Promise<void>;
  saveWorkoutLogToCloud: (log: LogEntry, docId?: string) => Promise<void>;
  deleteWorkoutLogFromCloud: (logId: string) => Promise<void>;
  deleteWorkoutLogsByDateFromCloud: (targetDate: string) => Promise<void>;
  clearWorkoutHistoryInCloud: () => Promise<void>;
  saveCalendarLogToCloud: (log: CalendarDayLog) => Promise<void>;
  deleteCalendarLogFromCloud: (logId: string) => Promise<void>;
  saveTransformationToCloud: (startDate: string, entries: WeeklyProgressEntry[]) => Promise<void>;
  saveNutritionStepsToCloud: (steps: NutritionHeaderStep[], startDate?: string) => Promise<void>;
  saveMeasureUnitToCloud: (unit: MeasureUnit, startDate?: string) => Promise<void>;
  saveRoadmapPathFocusToCloud: (focus: RoadmapPathFocus) => Promise<void>;
  saveCustomWorkoutToCloud: (workout: WorkoutProgram) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<LoginErrorInfo | null>(null);
  const [stats, setStats] = useState<SyncStats>({
    workoutLogsCount: 0,
    calendarLogsCount: 0,
    hasTransformation: false,
  });

  const clearLoginError = useCallback(() => {
    setLoginError(null);
    setErrorMessage(null);
  }, []);

  // Track remote write in-flight states per collection to prevent local state loops
  const isApplyingWorkoutLogsRef = useRef<boolean>(false);
  const isApplyingCalendarRef = useRef<boolean>(false);
  const isApplyingWeeksRef = useRef<boolean>(false);

  // Load all user data from Firestore into local storage and trigger UI updates
  const loadAllUserDataFromCloud = useCallback(async (targetUid?: string) => {
    const uid = targetUid || user?.uid;
    if (!uid) return;

    try {
      setSyncStatus('syncing');

      // 1. Fetch Workout Logs
      const workoutSnap = await getDocs(collection(db, 'users', uid, 'workoutLogs'));
      const remoteLogs: LogEntry[] = [];
      workoutSnap.forEach((docSnap) => {
        remoteLogs.push(mapFirestoreWorkoutLog(docSnap.id, docSnap.data()));
      });
      remoteLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (remoteLogs.length > 0) {
        localStorage.setItem('planche_workout_history', JSON.stringify(remoteLogs));
        window.dispatchEvent(new Event('planche_history_updated'));
      }

      // 2. Fetch Calendar Logs
      const calSnap = await getDocs(collection(db, 'users', uid, 'calendarLogs'));
      const calMap: Record<string, CalendarDayLog> = {};
      let calCount = 0;
      calSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const logDate = data.date;
        if (logDate) {
          calCount += 1;
          let workoutList: any[] = [];
          if (data.allWorkoutsJson) {
            try {
              workoutList = JSON.parse(data.allWorkoutsJson);
            } catch {
              workoutList = [];
            }
          }
          if (workoutList.length === 0 && (data.type === 'workout' || data.completedSets > 0 || data.workoutName)) {
            workoutList = [{
              workoutName: data.workoutName || '',
              workoutIntensity: data.workoutIntensity || '',
              durationMinutes: data.durationMinutes || 0,
              completedSets: data.completedSets || 0,
              totalSets: data.totalSets || 0,
              targetRpe: data.targetRpe || '',
              notes: data.notes || '',
            }];
          }

          let symptomList: any[] = [];
          if (data.allSymptomsJson) {
            try {
              symptomList = JSON.parse(data.allSymptomsJson);
            } catch {
              symptomList = [];
            }
          }
          if (symptomList.length === 0 && (data.type === 'symptom' || data.hasFndAttack || data.symptomSeverity)) {
            symptomList = [{
              severity: data.symptomSeverity || 'High Symptom Attack',
              attackType: data.symptomAttackType || 'FND Attack Spike',
              duration: data.symptomDuration || '',
              triggers: data.symptomTriggers || '',
              workoutImpact: data.symptomWorkoutImpact || '',
              notes: data.symptomNotes || data.notes || '',
            }];
          }

          const hasWorkout = workoutList.length > 0;
          const hasRest = Boolean(data.hasRest || data.type === 'rest' || data.restType);
          const hasWork = Boolean(data.isWorkDay || data.type === 'work' || data.workHours > 0 || data.shiftType);
          const hasFnd = Boolean(symptomList.length > 0 || data.hasFndAttack || data.type === 'symptom');
          const isMulti = ((hasWorkout ? 1 : 0) + (hasRest ? 1 : 0) + (hasWork ? 1 : 0) + (hasFnd ? 1 : 0) > 1) || workoutList.length > 1 || data.type === 'multi';

          calMap[logDate] = {
            id: data.id || docSnap.id,
            date: logDate,
            type: isMulti ? 'multi' : data.type === 'rest' ? 'rest' : data.type === 'work' ? 'work' : data.type === 'symptom' ? 'symptom' : 'workout',
            isWorkDay: hasWork,
            hasFndAttack: hasFnd,
            hasRest,
            hasWorkout,
            workoutList: workoutList.length > 0 ? workoutList : undefined,
            workoutDetails: workoutList[0],
            restDetails: hasRest ? {
              restType: (data.restType as any) || 'Full Rest',
              sleepQuality: data.sleepQuality,
              fatigueLevel: data.fatigueLevel,
              notes: data.notes,
            } : undefined,
            workDetails: hasWork ? {
              shiftType: data.shiftType || 'Standard Shift',
              hoursWorked: data.workHours || 8,
              fatigueLevel: data.workFatigue || 'Moderate Drain (3/5)',
              physicalStrain: data.physicalStrain || 'Standing / Movement',
              notes: data.notes || '',
            } : undefined,
            symptomList: symptomList.length > 0 ? symptomList : undefined,
            symptomDetails: symptomList[0],
            createdAt: data.createdAt,
          };
        }
      });
      if (calCount > 0) {
        localStorage.setItem('planche_calendar_logs', JSON.stringify(calMap));
        window.dispatchEvent(new Event('planche_calendar_updated'));
        window.dispatchEvent(new Event('planche_history_updated'));
      }

      // 3. Fetch Transformation Meta & Weeks
      let metaStartDate = '';
      try {
        const metaDoc = await getDoc(doc(db, 'users', uid, 'transformationMeta', 'settings'));
        if (metaDoc.exists()) {
          const metaData = metaDoc.data();
          metaStartDate = metaData?.startDate || '';
          if (metaData?.unitMode) {
            const parsedUnit = parseMeasureUnitFromMode(metaData.unitMode);
            saveStoredMeasureUnit(parsedUnit);
            window.dispatchEvent(new Event('planche_measure_unit_updated'));
          }
          if (metaData?.nutritionStepsJson) {
            try {
              const parsedSteps = JSON.parse(metaData.nutritionStepsJson);
              if (Array.isArray(parsedSteps) && parsedSteps.length === 3) {
                saveStoredNutritionSteps(parsedSteps);
                window.dispatchEvent(new Event('planche_nutrition_steps_updated'));
              }
            } catch {
              // ignore
            }
          }
          if (metaData?.roadmapPathFocusJson) {
            try {
              const parsedFocus = JSON.parse(metaData.roadmapPathFocusJson) as RoadmapPathFocus;
              if (parsedFocus && typeof parsedFocus.workingStepId === 'number') {
                saveStoredRoadmapPathFocus(parsedFocus);
                localStorage.setItem('planche_roadmap_active_step_v3', String(parsedFocus.workingStepId));
                window.dispatchEvent(new Event('planche_roadmap_focus_updated'));
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }

      const transSnap = await getDocs(collection(db, 'users', uid, 'transformationWeeks'));
      if (!transSnap.empty) {
        const weekEntries: WeeklyProgressEntry[] = [];
        transSnap.forEach((docSnap) => {
          weekEntries.push(mapFirestoreTransformationWeek(docSnap.data()));
        });
        weekEntries.sort((a, b) => a.weekNumber - b.weekNumber);
        const effectiveStartDate = metaStartDate || weekEntries[0]?.date || '2026-10-17';
        saveStoredTransformationData(effectiveStartDate, weekEntries);
        window.dispatchEvent(new Event('planche_transformation_updated'));
      }

      // 4. Fetch Custom Workouts
      const workoutsSnap = await getDocs(collection(db, 'users', uid, 'customWorkouts'));
      let updatedCustomWorkouts = false;
      workoutsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.workoutJson) {
          try {
            const parsed = JSON.parse(data.workoutJson);
            if (parsed && parsed.phases) {
              saveWorkoutProgram(parsed);
              updatedCustomWorkouts = true;
            }
          } catch {
            // ignore
          }
        }
      });
      if (updatedCustomWorkouts) {
        window.dispatchEvent(new Event('planche_workout_updated'));
      }

      setStats({
        workoutLogsCount: remoteLogs.length,
        calendarLogsCount: calCount,
        hasTransformation: !transSnap.empty,
      });

      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error loading all user data from cloud:', err);
      setSyncStatus('error');
    }
  }, [user]);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Upsert user profile document
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userDocRef,
            {
              userId: currentUser.uid,
              email: currentUser.email || 'user@example.com',
              displayName: currentUser.displayName || 'Planche Athlete',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not update user doc:', err);
        }

        // Immediately load user's entire cloud library
        loadAllUserDataFromCloud(currentUser.uid);
      } else {
        setSyncStatus('idle');
      }
    });

    return () => unsubscribe();
  }, [loadAllUserDataFromCloud]);

  // Sync initial local data into cloud if cloud collections are brand new
  const uploadLocalDataIfEmpty = useCallback(async (uid: string) => {
    try {
      setSyncStatus('syncing');

      // 1. Workout Logs Migration
      const localHistoryRaw = localStorage.getItem('planche_workout_history');
      if (localHistoryRaw) {
        try {
          const localHistory: LogEntry[] = JSON.parse(localHistoryRaw);
          const historySnap = await getDocs(collection(db, 'users', uid, 'workoutLogs'));
          if (historySnap.empty && localHistory.length > 0) {
            const batch = writeBatch(db);
            localHistory.forEach((item, idx) => {
              const logId = item.id ? String(item.id).replace(/[^a-zA-Z0-9_-]/g, '_') : `log_${idx}_${Date.now()}`;
              const docRef = doc(db, 'users', uid, 'workoutLogs', logId);
              batch.set(docRef, buildFirestoreWorkoutLogPayload(item, logId, uid));
            });
            await batch.commit();
          }
        } catch (e) {
          console.warn('Initial history migration error:', e);
        }
      }

      // 2. Calendar Logs Migration (handles Map or Array)
      const localCalendarRaw = localStorage.getItem('planche_calendar_logs');
      if (localCalendarRaw) {
        try {
          const parsed = JSON.parse(localCalendarRaw);
          let localCalendar: CalendarDayLog[] = [];
          if (Array.isArray(parsed)) {
            localCalendar = parsed;
          } else if (parsed && typeof parsed === 'object') {
            localCalendar = Object.values(parsed);
          }

          const calSnap = await getDocs(collection(db, 'users', uid, 'calendarLogs'));
          if (calSnap.empty && localCalendar.length > 0) {
            const batch = writeBatch(db);
            localCalendar.forEach((entry) => {
              const cleanId = String(entry.id || `cal_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
              const docRef = doc(db, 'users', uid, 'calendarLogs', cleanId);
              const workouts = entry.workoutList && entry.workoutList.length > 0 ? entry.workoutList : entry.workoutDetails ? [entry.workoutDetails] : [];
              const symptoms = entry.symptomList && entry.symptomList.length > 0 ? entry.symptomList : entry.symptomDetails ? [entry.symptomDetails] : [];
              const primaryWorkout = workouts[0] || entry.workoutDetails;
              const primarySymptom = symptoms[0] || entry.symptomDetails;
              const hasMultipleTypes = (workouts.length > 0 ? 1 : 0) + (entry.restDetails ? 1 : 0) + (entry.workDetails ? 1 : 0) + (symptoms.length > 0 ? 1 : 0) > 1 || workouts.length > 1;
              const entryType = hasMultipleTypes ? 'multi' : entry.type === 'rest' ? 'rest' : entry.type === 'work' ? 'work' : entry.type === 'symptom' ? 'symptom' : 'workout';

              batch.set(docRef, {
                id: cleanId,
                userId: uid,
                date: entry.date,
                type: entryType,
                allWorkoutsJson: workouts.length > 0 ? JSON.stringify(workouts).slice(0, 20000) : '',
                allSymptomsJson: symptoms.length > 0 ? JSON.stringify(symptoms).slice(0, 20000) : '',
                isWorkDay: Boolean(entry.isWorkDay || entry.workDetails || entry.type === 'work'),
                hasFndAttack: Boolean(entry.hasFndAttack || symptoms.length > 0 || entry.type === 'symptom'),
                hasRest: Boolean(entry.restDetails || entry.type === 'rest'),
                hasWorkout: Boolean(workouts.length > 0),
                symptomSeverity: String(primarySymptom?.severity || '').slice(0, 128),
                symptomAttackType: String(primarySymptom?.attackType || '').slice(0, 128),
                symptomDuration: String(primarySymptom?.duration || '').slice(0, 64),
                symptomTriggers: String(primarySymptom?.triggers || '').slice(0, 256),
                symptomWorkoutImpact: String(primarySymptom?.workoutImpact || '').slice(0, 128),
                symptomNotes: String(primarySymptom?.notes || '').slice(0, 2048),
                workoutName: String(primaryWorkout?.workoutName || '').slice(0, 256),
                workoutIntensity: String(primaryWorkout?.workoutIntensity || '').slice(0, 128),
                durationMinutes: Number(primaryWorkout?.durationMinutes || 0),
                completedSets: Number(primaryWorkout?.completedSets || 0),
                totalSets: Number(primaryWorkout?.totalSets || 0),
                targetRpe: String(primaryWorkout?.targetRpe || '').slice(0, 64),
                restType: String(entry.restDetails?.restType || '').slice(0, 64),
                sleepQuality: String(entry.restDetails?.sleepQuality || '').slice(0, 64),
                fatigueLevel: String(entry.restDetails?.fatigueLevel || '').slice(0, 64),
                shiftType: String(entry.workDetails?.shiftType || '').slice(0, 128),
                workHours: Number(entry.workDetails?.hoursWorked || 0),
                workFatigue: String(entry.workDetails?.fatigueLevel || '').slice(0, 64),
                physicalStrain: String(entry.workDetails?.physicalStrain || '').slice(0, 128),
                notes: String(primaryWorkout?.notes || entry.restDetails?.notes || entry.workDetails?.notes || primarySymptom?.notes || '').slice(0, 2048),
                createdAt: new Date().toISOString(),
              });
            });
            await batch.commit();
          }
        } catch (e) {
          console.warn('Initial calendar migration error:', e);
        }
      }

      // 3. Transformation Data Migration
      const localTrans = getStoredTransformationData();
      if (localTrans && localTrans.entries.length > 0) {
        try {
          const transSnap = await getDocs(collection(db, 'users', uid, 'transformationWeeks'));
          if (transSnap.empty) {
            const batch = writeBatch(db);
            const metaRef = doc(db, 'users', uid, 'transformationMeta', 'settings');
            batch.set(metaRef, {
              userId: uid,
              startDate: localTrans.startDate,
              unitMode: toStoredUnitMode(getStoredMeasureUnit()),
              updatedAt: new Date().toISOString(),
            });

            localTrans.entries.forEach((week) => {
              const weekId = `week_${week.weekNumber}`;
              const weekRef = doc(db, 'users', uid, 'transformationWeeks', weekId);
              batch.set(weekRef, buildFirestoreTransformationWeekPayload(week, weekId, uid));
            });
            await batch.commit();
          }
        } catch (e) {
          console.warn('Initial transformation migration error:', e);
        }
      }

      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Migration error:', err);
      setSyncStatus('error');
    }
  }, []);

  // Listen to remote changes in real time (bi-directional sync across devices and tabs)
  useEffect(() => {
    if (!user) {
      setSyncStatus('idle');
      return;
    }

    const uid = user.uid;
    uploadLocalDataIfEmpty(uid);

    // 1. Listen to Workout Logs
    const pathLogs = `users/${uid}/workoutLogs`;
    const unsubLogs = onSnapshot(
      collection(db, 'users', uid, 'workoutLogs'),
      (snapshot) => {
        try {
          const remoteLogs: LogEntry[] = [];
          snapshot.forEach((docSnap) => {
            remoteLogs.push(mapFirestoreWorkoutLog(docSnap.id, docSnap.data()));
          });

          remoteLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setStats((prev) => ({ ...prev, workoutLogsCount: remoteLogs.length }));

          if (!isApplyingWorkoutLogsRef.current && remoteLogs.length > 0) {
            isApplyingWorkoutLogsRef.current = true;
            localStorage.setItem('planche_workout_history', JSON.stringify(remoteLogs));
            window.dispatchEvent(new Event('planche_history_updated'));
            setTimeout(() => {
              isApplyingWorkoutLogsRef.current = false;
            }, 100);
          }

          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        } catch (e) {
          console.warn('Error processing remote workout logs:', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathLogs);
      }
    );

    // 2. Listen to Calendar Logs
    const pathCal = `users/${uid}/calendarLogs`;
    const unsubCalendar = onSnapshot(
      collection(db, 'users', uid, 'calendarLogs'),
      (snapshot) => {
        try {
          const calMap: Record<string, CalendarDayLog> = {};
          let count = 0;
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const logDate = data.date;
            if (logDate) {
              count += 1;
              let workoutList: any[] = [];
              if (data.allWorkoutsJson) {
                try {
                  workoutList = JSON.parse(data.allWorkoutsJson);
                } catch {
                  workoutList = [];
                }
              }
              if (workoutList.length === 0 && (data.type === 'workout' || data.completedSets > 0 || data.workoutName)) {
                workoutList = [{
                  workoutName: data.workoutName || '',
                  workoutIntensity: data.workoutIntensity || '',
                  durationMinutes: data.durationMinutes || 0,
                  completedSets: data.completedSets || 0,
                  totalSets: data.totalSets || 0,
                  targetRpe: data.targetRpe || '',
                  notes: data.notes || '',
                }];
              }

              let symptomList: any[] = [];
              if (data.allSymptomsJson) {
                try {
                  symptomList = JSON.parse(data.allSymptomsJson);
                } catch {
                  symptomList = [];
                }
              }
              if (symptomList.length === 0 && (data.type === 'symptom' || data.hasFndAttack || data.symptomSeverity)) {
                symptomList = [{
                  severity: data.symptomSeverity || 'High Symptom Attack',
                  attackType: data.symptomAttackType || 'FND Attack Spike',
                  duration: data.symptomDuration || '',
                  triggers: data.symptomTriggers || '',
                  workoutImpact: data.symptomWorkoutImpact || '',
                  notes: data.symptomNotes || data.notes || '',
                }];
              }

              const hasWorkout = workoutList.length > 0;
              const hasRest = Boolean(data.hasRest || data.type === 'rest' || data.restType);
              const hasWork = Boolean(data.isWorkDay || data.type === 'work' || data.workHours > 0 || data.shiftType);
              const hasFnd = Boolean(symptomList.length > 0 || data.hasFndAttack || data.type === 'symptom');

              const isMulti = ((hasWorkout ? 1 : 0) + (hasRest ? 1 : 0) + (hasWork ? 1 : 0) + (hasFnd ? 1 : 0) > 1) || workoutList.length > 1 || data.type === 'multi';

              calMap[logDate] = {
                id: data.id || docSnap.id,
                date: logDate,
                type: isMulti ? 'multi' : data.type === 'rest' ? 'rest' : data.type === 'work' ? 'work' : data.type === 'symptom' ? 'symptom' : 'workout',
                isWorkDay: hasWork,
                hasFndAttack: hasFnd,
                hasRest,
                hasWorkout,
                workoutList: workoutList.length > 0 ? workoutList : undefined,
                workoutDetails: workoutList[0],
                restDetails: hasRest ? {
                  restType: (data.restType as any) || 'Full Rest',
                  sleepQuality: data.sleepQuality,
                  fatigueLevel: data.fatigueLevel,
                  notes: data.notes,
                } : undefined,
                workDetails: hasWork ? {
                  shiftType: data.shiftType || 'Standard Shift',
                  hoursWorked: data.workHours || 8,
                  fatigueLevel: data.workFatigue || 'Moderate Drain (3/5)',
                  physicalStrain: data.physicalStrain || 'Standing / Movement',
                  notes: data.notes || '',
                } : undefined,
                symptomList: symptomList.length > 0 ? symptomList : undefined,
                symptomDetails: symptomList[0],
                createdAt: data.createdAt,
              };
            }
          });

          setStats((prev) => ({ ...prev, calendarLogsCount: count }));

          if (!isApplyingCalendarRef.current && count > 0) {
            isApplyingCalendarRef.current = true;
            localStorage.setItem('planche_calendar_logs', JSON.stringify(calMap));
            window.dispatchEvent(new Event('planche_calendar_updated'));
            window.dispatchEvent(new Event('planche_history_updated'));
            setTimeout(() => {
              isApplyingCalendarRef.current = false;
            }, 100);
          }

          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        } catch (e) {
          console.warn('Error processing remote calendar:', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathCal);
      }
    );

    // 3. Listen to Transformation Weeks
    const pathWeeks = `users/${uid}/transformationWeeks`;
    const unsubWeeks = onSnapshot(
      collection(db, 'users', uid, 'transformationWeeks'),
      (snapshot) => {
        try {
          if (!snapshot.empty) {
            const weekEntries: WeeklyProgressEntry[] = [];
            snapshot.forEach((docSnap) => {
              weekEntries.push(mapFirestoreTransformationWeek(docSnap.data()));
            });

            weekEntries.sort((a, b) => a.weekNumber - b.weekNumber);
            setStats((prev) => ({ ...prev, hasTransformation: true }));

            if (!isApplyingWeeksRef.current) {
              isApplyingWeeksRef.current = true;
              const currentData = getStoredTransformationData();
              saveStoredTransformationData(currentData.startDate, weekEntries);
              window.dispatchEvent(new Event('planche_transformation_updated'));
              setTimeout(() => {
                isApplyingWeeksRef.current = false;
              }, 100);
            }

            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          }
        } catch (e) {
          console.warn('Error processing remote transformation weeks:', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathWeeks);
      }
    );

    // 4. Listen to Custom Workout Templates
    const pathWorkouts = `users/${uid}/customWorkouts`;
    const unsubWorkouts = onSnapshot(
      collection(db, 'users', uid, 'customWorkouts'),
      (snapshot) => {
        try {
          let updatedCustomWorkouts = false;
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.workoutType && data.workoutJson) {
              try {
                const parsed = JSON.parse(data.workoutJson);
                if (parsed && parsed.phases) {
                  saveWorkoutProgram(parsed);
                  updatedCustomWorkouts = true;
                }
              } catch {
                // ignore
              }
            }
          });
          if (updatedCustomWorkouts) {
            window.dispatchEvent(new Event('planche_workout_updated'));
          }
        } catch (e) {
          console.warn('Error processing custom workouts:', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathWorkouts);
      }
    );

    // 5. Listen to Transformation Meta (start date & custom nutrition steps)
    const pathMeta = `users/${uid}/transformationMeta/settings`;
    const unsubMeta = onSnapshot(
      doc(db, 'users', uid, 'transformationMeta', 'settings'),
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const metaData = docSnap.data();
            if (metaData?.unitMode) {
              const parsedUnit = parseMeasureUnitFromMode(metaData.unitMode);
              if (parsedUnit !== getStoredMeasureUnit()) {
                saveStoredMeasureUnit(parsedUnit);
                window.dispatchEvent(new Event('planche_measure_unit_updated'));
              }
            }
            if (metaData?.nutritionStepsJson) {
              const parsedSteps = JSON.parse(metaData.nutritionStepsJson);
              if (Array.isArray(parsedSteps) && parsedSteps.length === 3) {
                saveStoredNutritionSteps(parsedSteps);
                window.dispatchEvent(new Event('planche_nutrition_steps_updated'));
              }
            }
            if (metaData?.roadmapPathFocusJson) {
              const parsedFocus = JSON.parse(metaData.roadmapPathFocusJson) as RoadmapPathFocus;
              if (parsedFocus && typeof parsedFocus.workingStepId === 'number') {
                saveStoredRoadmapPathFocus(parsedFocus);
                localStorage.setItem('planche_roadmap_active_step_v3', String(parsedFocus.workingStepId));
                window.dispatchEvent(new Event('planche_roadmap_focus_updated'));
              }
            }
          }
        } catch {
          // ignore
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathMeta);
      }
    );

    return () => {
      unsubLogs();
      unsubCalendar();
      unsubWeeks();
      unsubWorkouts();
      unsubMeta();
    };
  }, [user, uploadLocalDataIfEmpty]);

  // Actions
  const saveWorkoutLogToCloud = async (log: LogEntry, docId?: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const targetId = docId || log.id || `log_${Date.now()}`;
      const cleanId = String(targetId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, 'users', user.uid, 'workoutLogs', cleanId);
      await setDoc(docRef, buildFirestoreWorkoutLogPayload(log, cleanId, user.uid));
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error saving workout log to cloud:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/workoutLogs`);
    }
  };

  const deleteWorkoutLogFromCloud = async (logId: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const cleanId = String(logId).replace(/[^a-zA-Z0-9_-]/g, '_');
      await deleteDoc(doc(db, 'users', user.uid, 'workoutLogs', cleanId));
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error deleting workout log from cloud:', err);
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/workoutLogs/${logId}`);
    }
  };

  const deleteWorkoutLogsByDateFromCloud = async (targetDate: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const snap = await getDocs(collection(db, 'users', user.uid, 'workoutLogs'));
      const batch = writeBatch(db);
      let count = 0;
      const sanitizedTargetDate = targetDate.replace(/[^a-zA-Z0-9_-]/g, '_');
      snap.forEach((d) => {
        const data = d.data();
        const logDate = data.date ? data.date.slice(0, 10) : '';
        if (logDate === targetDate || d.id.includes(sanitizedTargetDate)) {
          batch.delete(d.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error deleting workout logs by date from cloud:', err);
    }
  };

  const clearWorkoutHistoryInCloud = async () => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const snap = await getDocs(collection(db, 'users', user.uid, 'workoutLogs'));
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error clearing workout history in cloud:', err);
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/workoutLogs`);
    }
  };

  const saveCalendarLogToCloud = async (log: CalendarDayLog) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const cleanId = String(log.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, 'users', user.uid, 'calendarLogs', cleanId);

      const workouts = log.workoutList && log.workoutList.length > 0 ? log.workoutList : log.workoutDetails ? [log.workoutDetails] : [];
      const symptoms = log.symptomList && log.symptomList.length > 0 ? log.symptomList : log.symptomDetails ? [log.symptomDetails] : [];
      const primaryWorkout = workouts[0] || log.workoutDetails;
      const primarySymptom = symptoms[0] || log.symptomDetails;

      const hasMultipleTypes = (workouts.length > 0 ? 1 : 0) + (log.restDetails ? 1 : 0) + (log.workDetails ? 1 : 0) + (symptoms.length > 0 ? 1 : 0) > 1 || workouts.length > 1;
      const entryType = hasMultipleTypes ? 'multi' : log.type === 'rest' ? 'rest' : log.type === 'work' ? 'work' : log.type === 'symptom' ? 'symptom' : 'workout';

      await setDoc(docRef, {
        id: cleanId,
        userId: user.uid,
        date: log.date,
        type: entryType,
        allWorkoutsJson: workouts.length > 0 ? JSON.stringify(workouts).slice(0, 20000) : '',
        allSymptomsJson: symptoms.length > 0 ? JSON.stringify(symptoms).slice(0, 20000) : '',
        isWorkDay: Boolean(log.isWorkDay || log.workDetails || log.type === 'work'),
        hasFndAttack: Boolean(log.hasFndAttack || symptoms.length > 0 || log.type === 'symptom'),
        hasRest: Boolean(log.restDetails || log.type === 'rest'),
        hasWorkout: Boolean(workouts.length > 0),
        symptomSeverity: String(primarySymptom?.severity || '').slice(0, 128),
        symptomAttackType: String(primarySymptom?.attackType || '').slice(0, 128),
        symptomDuration: String(primarySymptom?.duration || '').slice(0, 64),
        symptomTriggers: String(primarySymptom?.triggers || '').slice(0, 256),
        symptomWorkoutImpact: String(primarySymptom?.workoutImpact || '').slice(0, 128),
        symptomNotes: String(primarySymptom?.notes || '').slice(0, 2048),
        workoutName: String(primaryWorkout?.workoutName || '').slice(0, 256),
        workoutIntensity: String(primaryWorkout?.workoutIntensity || '').slice(0, 128),
        durationMinutes: Number(primaryWorkout?.durationMinutes || 0),
        completedSets: Number(primaryWorkout?.completedSets || 0),
        totalSets: Number(primaryWorkout?.totalSets || 0),
        targetRpe: String(primaryWorkout?.targetRpe || '').slice(0, 64),
        restType: String(log.restDetails?.restType || '').slice(0, 64),
        sleepQuality: String(log.restDetails?.sleepQuality || '').slice(0, 64),
        fatigueLevel: String(log.restDetails?.fatigueLevel || '').slice(0, 64),
        shiftType: String(log.workDetails?.shiftType || '').slice(0, 128),
        workHours: Number(log.workDetails?.hoursWorked || 0),
        workFatigue: String(log.workDetails?.fatigueLevel || '').slice(0, 64),
        physicalStrain: String(log.workDetails?.physicalStrain || '').slice(0, 128),
        notes: String(primaryWorkout?.notes || log.restDetails?.notes || log.workDetails?.notes || primarySymptom?.notes || '').slice(0, 2048),
        createdAt: new Date().toISOString(),
      });
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error saving calendar log to cloud:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/calendarLogs`);
    }
  };

  const deleteCalendarLogFromCloud = async (logId: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const cleanId = String(logId).replace(/[^a-zA-Z0-9_-]/g, '_');
      await deleteDoc(doc(db, 'users', user.uid, 'calendarLogs', cleanId));
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error deleting calendar log from cloud:', err);
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/calendarLogs/${logId}`);
    }
  };

  const saveTransformationToCloud = async (startDate: string, entries: WeeklyProgressEntry[]) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const batch = writeBatch(db);

      const metaRef = doc(db, 'users', user.uid, 'transformationMeta', 'settings');
      batch.set(
        metaRef,
        {
          userId: user.uid,
          startDate: startDate,
          unitMode: toStoredUnitMode(getStoredMeasureUnit()),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      entries.forEach((week) => {
        const weekId = `week_${week.weekNumber}`;
        const weekRef = doc(db, 'users', user.uid, 'transformationWeeks', weekId);
        batch.set(weekRef, buildFirestoreTransformationWeekPayload(week, weekId, user.uid));
      });

      await batch.commit();
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error saving transformation to cloud:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transformationWeeks`);
    }
  };

  const saveNutritionStepsToCloud = async (steps: NutritionHeaderStep[], startDate?: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const effectiveStartDate = (startDate || getStoredTransformationData().startDate || '2026-10-17').slice(0, 32);
      const sanitized = steps.slice(0, 3).map((s, idx) => ({
        stepNumber: (idx + 1) as 1 | 2 | 3,
        title: String(s.title || '').slice(0, 120),
        notes: String(s.notes || '').slice(0, 1000),
      }));
      const metaRef = doc(db, 'users', user.uid, 'transformationMeta', 'settings');
      await setDoc(
        metaRef,
        {
          userId: user.uid,
          startDate: effectiveStartDate,
          nutritionStepsJson: JSON.stringify(sanitized).slice(0, 8000),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Error saving nutrition steps to cloud:', err);
    }
  };

  const saveMeasureUnitToCloud = async (unit: MeasureUnit, startDate?: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const effectiveStartDate = (startDate || getStoredTransformationData().startDate || '2026-10-17').slice(0, 32);
      const metaRef = doc(db, 'users', user.uid, 'transformationMeta', 'settings');
      await setDoc(
        metaRef,
        {
          userId: user.uid,
          startDate: effectiveStartDate,
          unitMode: toStoredUnitMode(unit),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Error saving measurement unit to cloud:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transformationMeta/settings`);
    }
  };

  const saveRoadmapPathFocusToCloud = async (focus: RoadmapPathFocus) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const effectiveStartDate = (getStoredTransformationData().startDate || '2026-10-17').slice(0, 32);
      const sanitized: RoadmapPathFocus = {
        currentTitle: String(focus.currentTitle || '').slice(0, 140),
        workingStepId: Number(focus.workingStepId || 3),
        regressionStepId:
          typeof focus.regressionStepId === 'number' ? Number(focus.regressionStepId) : null,
        attemptStepId:
          typeof focus.attemptStepId === 'number' ? Number(focus.attemptStepId) : null,
      };
      const metaRef = doc(db, 'users', user.uid, 'transformationMeta', 'settings');
      await setDoc(
        metaRef,
        {
          userId: user.uid,
          startDate: effectiveStartDate,
          roadmapPathFocusJson: JSON.stringify(sanitized).slice(0, 4000),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Error saving roadmap path focus to cloud:', err);
    }
  };

  const saveCustomWorkoutToCloud = async (workout: WorkoutProgram) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'customWorkouts', workout.id);
      await setDoc(docRef, {
        userId: user.uid,
        workoutType: workout.id,
        workoutJson: JSON.stringify(workout).slice(0, 50000),
        updatedAt: new Date().toISOString(),
      });
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Error saving custom workout to cloud:', err);
    }
  };

  const syncNow = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      await uploadLocalDataIfEmpty(user.uid);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch {
      setSyncStatus('error');
    }
  };

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMessage(null);
    setLoginError(null);
    try {
      await loginWithGoogle();
      setLoginError(null);
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err?.code || 'auth/unknown';
      const message = err?.message || 'Login failed';
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
      setErrorMessage(message);
      setLoginError({
        code,
        message,
        domain: currentDomain,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithRedirect = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    setLoginError(null);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      console.error('Login redirect error:', err);
      const code = err?.code || 'auth/unknown';
      const message = err?.message || 'Redirect login failed';
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
      setErrorMessage(message);
      setLoginError({
        code,
        message,
        domain: currentDomain,
      });
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setSyncStatus('idle');
      setLoginError(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <SyncContext.Provider
      value={{
        user,
        authLoading,
        isLoggingIn,
        syncStatus,
        lastSyncedAt,
        errorMessage,
        loginError,
        clearLoginError,
        stats,
        login,
        loginWithRedirect,
        logout,
        syncNow,
        loadAllUserDataFromCloud,
        saveWorkoutLogToCloud,
        deleteWorkoutLogFromCloud,
        deleteWorkoutLogsByDateFromCloud,
        clearWorkoutHistoryInCloud,
        saveCalendarLogToCloud,
        deleteCalendarLogFromCloud,
        saveTransformationToCloud,
        saveNutritionStepsToCloud,
        saveMeasureUnitToCloud,
        saveRoadmapPathFocusToCloud,
        saveCustomWorkoutToCloud,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
