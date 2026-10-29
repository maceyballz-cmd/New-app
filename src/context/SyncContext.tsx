import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from '../lib/firebase';
import { WeeklyProgressEntry, getStoredTransformationData, saveStoredTransformationData } from '../data/transformationData';
import { CalendarDayLog } from '../components/WorkoutCalendarView';
import { WorkoutType, WorkoutProgram, getWorkoutProgram, saveWorkoutProgram } from '../data/programData';

export interface LogEntry {
  date: string;
  completedSets: number;
  totalSets: number;
  progressPercent: number;
  targetRpe: string;
  notes?: string;
  workoutName?: string;
  workoutIntensity?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncStats {
  workoutLogsCount: number;
  calendarLogsCount: number;
  hasTransformation: boolean;
}

interface SyncContextType {
  user: User | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  stats: SyncStats;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  saveWorkoutLogToCloud: (log: LogEntry) => Promise<void>;
  clearWorkoutHistoryInCloud: () => Promise<void>;
  saveCalendarLogToCloud: (log: CalendarDayLog) => Promise<void>;
  deleteCalendarLogFromCloud: (logId: string) => Promise<void>;
  saveTransformationToCloud: (startDate: string, entries: WeeklyProgressEntry[]) => Promise<void>;
  saveCustomWorkoutToCloud: (workout: WorkoutProgram) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats>({
    workoutLogsCount: 0,
    calendarLogsCount: 0,
    hasTransformation: false,
  });

  // Track if we are currently applying remote updates to avoid circular loops
  const isApplyingRemoteRef = useRef<boolean>(false);

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
      } else {
        setSyncStatus('idle');
      }
    });

    return () => unsubscribe();
  }, []);

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
              const logId = `log_${idx}_${Date.now()}`;
              const docRef = doc(db, 'users', uid, 'workoutLogs', logId);
              batch.set(docRef, {
                id: logId,
                userId: uid,
                date: item.date || new Date().toISOString(),
                completedSets: Number(item.completedSets || 0),
                totalSets: Number(item.totalSets || 0),
                progressPercent: Number(item.progressPercent || 0),
                targetRpe: String(item.targetRpe || 'RPE 8'),
                notes: String(item.notes || '').slice(0, 2048),
                workoutName: String(item.workoutName || 'Frog Planche Focus').slice(0, 256),
                workoutIntensity: String(item.workoutIntensity || '50–60% Submaximal').slice(0, 128),
                createdAt: new Date().toISOString(),
              });
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
              batch.set(docRef, {
                id: cleanId,
                userId: uid,
                date: entry.date,
                type: entry.type === 'rest' ? 'rest' : 'workout',
                workoutName: String(entry.workoutDetails?.workoutName || '').slice(0, 256),
                workoutIntensity: String(entry.workoutDetails?.workoutIntensity || '').slice(0, 128),
                durationMinutes: Number(entry.workoutDetails?.durationMinutes || 0),
                completedSets: Number(entry.workoutDetails?.completedSets || 0),
                totalSets: Number(entry.workoutDetails?.totalSets || 0),
                targetRpe: String(entry.workoutDetails?.targetRpe || '').slice(0, 64),
                restType: String(entry.restDetails?.restType || '').slice(0, 64),
                sleepQuality: String(entry.restDetails?.sleepQuality || '').slice(0, 64),
                fatigueLevel: String(entry.restDetails?.fatigueLevel || '').slice(0, 64),
                notes: String(entry.workoutDetails?.notes || entry.restDetails?.notes || '').slice(0, 2048),
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
              unitMode: 'lbs_cm',
              updatedAt: new Date().toISOString(),
            });

            localTrans.entries.forEach((week) => {
              const weekId = `week_${week.weekNumber}`;
              const weekRef = doc(db, 'users', uid, 'transformationWeeks', weekId);
              batch.set(weekRef, {
                weekId,
                userId: uid,
                weekNumber: Number(week.weekNumber),
                weekLabel: String(week.weekLabel || `Week ${week.weekNumber}`).slice(0, 64),
                date: String(week.date || '').slice(0, 64),
                weight: String(week.weight || '').slice(0, 32),
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
                trainingDayCalories: String(week.trainingDayCalories || '').slice(0, 64),
                trainingDayMacros: String(week.trainingDayMacros || '').slice(0, 64),
                restDayCalories: String(week.restDayCalories || '').slice(0, 64),
                restDayMacros: String(week.restDayMacros || '').slice(0, 64),
                sleepScore: String(week.sleepScore || '').slice(0, 16),
                stressScore: String(week.stressScore || '').slice(0, 16),
                hungerScore: String(week.hungerScore || '').slice(0, 16),
                fatigueScore: String(week.fatigueScore || '').slice(0, 16),
                keySkillProgress: String(week.keySkillProgress || '').slice(0, 512),
                photoFront: String(week.photos?.front || '').slice(0, 300000),
                photoBack: String(week.photos?.back || '').slice(0, 300000),
                photoLeftSide: String(week.photos?.leftSide || '').slice(0, 300000),
                photoRightSide: String(week.photos?.rightSide || '').slice(0, 300000),
                updatedAt: new Date().toISOString(),
              });
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

  // Listen to remote changes in real time (bi-directional sync with desktop and web)
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
            const data = docSnap.data();
            remoteLogs.push({
              date: data.date,
              completedSets: data.completedSets,
              totalSets: data.totalSets,
              progressPercent: data.progressPercent,
              targetRpe: data.targetRpe,
              notes: data.notes,
              workoutName: data.workoutName,
              workoutIntensity: data.workoutIntensity,
            });
          });

          remoteLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setStats((prev) => ({ ...prev, workoutLogsCount: remoteLogs.length }));

          if (!isApplyingRemoteRef.current && remoteLogs.length > 0) {
            isApplyingRemoteRef.current = true;
            localStorage.setItem('planche_workout_history', JSON.stringify(remoteLogs));
            window.dispatchEvent(new Event('planche_history_updated'));
            setTimeout(() => {
              isApplyingRemoteRef.current = false;
            }, 300);
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

    // 2. Listen to Calendar Logs (stored locally as Record<string, CalendarDayLog>)
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
              calMap[logDate] = {
                id: data.id || docSnap.id,
                date: logDate,
                type: data.type === 'rest' ? 'rest' : 'workout',
                workoutDetails: data.type === 'workout' ? {
                  workoutName: data.workoutName || '',
                  workoutIntensity: data.workoutIntensity || '',
                  durationMinutes: data.durationMinutes || 0,
                  completedSets: data.completedSets || 0,
                  totalSets: data.totalSets || 0,
                  targetRpe: data.targetRpe || '',
                  notes: data.notes || '',
                } : undefined,
                restDetails: data.type === 'rest' ? {
                  restType: (data.restType as any) || 'Full Rest',
                  sleepQuality: data.sleepQuality,
                  fatigueLevel: data.fatigueLevel,
                  notes: data.notes,
                } : undefined,
                createdAt: data.createdAt,
              };
            }
          });

          setStats((prev) => ({ ...prev, calendarLogsCount: count }));

          if (!isApplyingRemoteRef.current && count > 0) {
            isApplyingRemoteRef.current = true;
            localStorage.setItem('planche_calendar_logs', JSON.stringify(calMap));
            window.dispatchEvent(new Event('planche_calendar_updated'));
            window.dispatchEvent(new Event('planche_history_updated'));
            setTimeout(() => {
              isApplyingRemoteRef.current = false;
            }, 300);
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
              const data = docSnap.data();
              weekEntries.push({
                weekNumber: Number(data.weekNumber),
                weekLabel: data.weekLabel,
                date: data.date,
                isMilestone: data.weekNumber === 0 || data.weekNumber === 4 || data.weekNumber === 8 || data.weekNumber === 12,
                weight: data.weight || '',
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
                targetRateWeight: '',
                targetDailySteps: '',
                actualDailySteps: '',
                trainingTime: '',
                mealTimes: '',
                trainingDayCalories: data.trainingDayCalories || '',
                trainingDayMacros: data.trainingDayMacros || '',
                restDayCalories: data.restDayCalories || '',
                restDayMacros: data.restDayMacros || '',
                calorieAdherence: '',
                trainingAdherence: '',
                sleepScore: data.sleepScore || '',
                stressScore: data.stressScore || '',
                hungerScore: data.hungerScore || '',
                fatigueScore: data.fatigueScore || '',
                keySkillProgress: data.keySkillProgress || '',
                photos: {
                  front: data.photoFront,
                  back: data.photoBack,
                  leftSide: data.photoLeftSide,
                  rightSide: data.photoRightSide,
                },
              });
            });

            weekEntries.sort((a, b) => a.weekNumber - b.weekNumber);
            setStats((prev) => ({ ...prev, hasTransformation: true }));

            if (!isApplyingRemoteRef.current) {
              isApplyingRemoteRef.current = true;
              const currentData = getStoredTransformationData();
              saveStoredTransformationData(currentData.startDate, weekEntries);
              window.dispatchEvent(new Event('planche_transformation_updated'));
              setTimeout(() => {
                isApplyingRemoteRef.current = false;
              }, 300);
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
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.workoutType && data.workoutJson) {
              try {
                const parsed = JSON.parse(data.workoutJson);
                if (parsed && parsed.phases) {
                  saveWorkoutProgram(parsed);
                }
              } catch {
                // ignore
              }
            }
          });
        } catch (e) {
          console.warn('Error processing custom workouts:', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathWorkouts);
      }
    );

    return () => {
      unsubLogs();
      unsubCalendar();
      unsubWeeks();
      unsubWorkouts();
    };
  }, [user, uploadLocalDataIfEmpty]);

  // Actions
  const saveWorkoutLogToCloud = async (log: LogEntry) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const cleanId = `log_${Date.now()}`;
      const docRef = doc(db, 'users', user.uid, 'workoutLogs', cleanId);
      await setDoc(docRef, {
        id: cleanId,
        userId: user.uid,
        date: log.date,
        completedSets: Number(log.completedSets),
        totalSets: Number(log.totalSets),
        progressPercent: Number(log.progressPercent),
        targetRpe: String(log.targetRpe || 'RPE 8'),
        notes: String(log.notes || '').slice(0, 2048),
        workoutName: String(log.workoutName || 'Frog Planche Focus').slice(0, 256),
        workoutIntensity: String(log.workoutIntensity || '50–60% Submaximal').slice(0, 128),
        createdAt: new Date().toISOString(),
      });
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error saving workout log to cloud:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/workoutLogs`);
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
      await setDoc(docRef, {
        id: cleanId,
        userId: user.uid,
        date: log.date,
        type: log.type === 'rest' ? 'rest' : 'workout',
        workoutName: String(log.workoutDetails?.workoutName || '').slice(0, 256),
        workoutIntensity: String(log.workoutDetails?.workoutIntensity || '').slice(0, 128),
        durationMinutes: Number(log.workoutDetails?.durationMinutes || 0),
        completedSets: Number(log.workoutDetails?.completedSets || 0),
        totalSets: Number(log.workoutDetails?.totalSets || 0),
        targetRpe: String(log.workoutDetails?.targetRpe || '').slice(0, 64),
        restType: String(log.restDetails?.restType || '').slice(0, 64),
        sleepQuality: String(log.restDetails?.sleepQuality || '').slice(0, 64),
        fatigueLevel: String(log.restDetails?.fatigueLevel || '').slice(0, 64),
        notes: String(log.workoutDetails?.notes || log.restDetails?.notes || '').slice(0, 2048),
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
      batch.set(metaRef, {
        userId: user.uid,
        startDate: startDate,
        unitMode: 'lbs_cm',
        updatedAt: new Date().toISOString(),
      });

      entries.forEach((week) => {
        const weekId = `week_${week.weekNumber}`;
        const weekRef = doc(db, 'users', user.uid, 'transformationWeeks', weekId);
        batch.set(weekRef, {
          weekId,
          userId: user.uid,
          weekNumber: Number(week.weekNumber),
          weekLabel: String(week.weekLabel || `Week ${week.weekNumber}`).slice(0, 64),
          date: String(week.date || '').slice(0, 64),
          weight: String(week.weight || '').slice(0, 32),
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
          trainingDayCalories: String(week.trainingDayCalories || '').slice(0, 64),
          trainingDayMacros: String(week.trainingDayMacros || '').slice(0, 64),
          restDayCalories: String(week.restDayCalories || '').slice(0, 64),
          restDayMacros: String(week.restDayMacros || '').slice(0, 64),
          sleepScore: String(week.sleepScore || '').slice(0, 16),
          stressScore: String(week.stressScore || '').slice(0, 16),
          hungerScore: String(week.hungerScore || '').slice(0, 16),
          fatigueScore: String(week.fatigueScore || '').slice(0, 16),
          keySkillProgress: String(week.keySkillProgress || '').slice(0, 512),
          photoFront: String(week.photos?.front || '').slice(0, 300000),
          photoBack: String(week.photos?.back || '').slice(0, 300000),
          photoLeftSide: String(week.photos?.leftSide || '').slice(0, 300000),
          photoRightSide: String(week.photos?.rightSide || '').slice(0, 300000),
          updatedAt: new Date().toISOString(),
        });
      });

      await batch.commit();
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error saving transformation to cloud:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transformationWeeks`);
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
    try {
      setErrorMessage(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err?.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setSyncStatus('idle');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <SyncContext.Provider
      value={{
        user,
        authLoading,
        syncStatus,
        lastSyncedAt,
        errorMessage,
        stats,
        login,
        logout,
        syncNow,
        saveWorkoutLogToCloud,
        clearWorkoutHistoryInCloud,
        saveCalendarLogToCloud,
        deleteCalendarLogFromCloud,
        saveTransformationToCloud,
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
