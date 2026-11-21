import React, { useState, useEffect, useRef } from 'react';
import { useSync } from '../context/SyncContext';
import { WorkoutProgram, Exercise } from '../data/programData';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Flame,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Plus,
  Award,
  Pencil,
  FileText,
  X,
  Check,
} from 'lucide-react';

interface SetLog {
  setNumber: number;
  completed: boolean;
  value: string;
}

interface WorkoutSessionCompanionProps {
  workout: WorkoutProgram;
  initialExerciseId?: string;
  onInitialExerciseConsumed?: () => void;
  onFinishWorkout?: () => void;
}

function loadSavedProgress(program: WorkoutProgram): Record<string, boolean[]> {
  const exercises = program.phases.flatMap((p) => p.exercises);
  const initial: Record<string, boolean[]> = {};
  exercises.forEach((ex) => {
    initial[ex.id] = new Array(ex.defaultSets || 1).fill(false);
  });

  try {
    const saved = localStorage.getItem(`planche_active_progress_${program.id}`);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, boolean[]>;
      if (parsed && typeof parsed === 'object') {
        exercises.forEach((ex) => {
          const count = ex.defaultSets || 1;
          const savedArr = parsed[ex.id];
          if (Array.isArray(savedArr)) {
            initial[ex.id] = Array.from({ length: count }, (_, idx) => Boolean(savedArr[idx]));
          }
        });
      }
    }
  } catch {
    // fallback to clean initial state
  }
  return initial;
}

function loadSavedExerciseIdx(program: WorkoutProgram, initialExerciseId?: string): number {
  const exercises = program.phases.flatMap((p) => p.exercises);
  if (initialExerciseId) {
    const found = exercises.findIndex((e) => e.id === initialExerciseId);
    if (found !== -1) return found;
  }
  try {
    const savedIdx = localStorage.getItem(`planche_active_exercise_idx_${program.id}`);
    if (savedIdx !== null) {
      const parsed = parseInt(savedIdx, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < exercises.length) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

function loadSavedSessionNotes(programId: string): string {
  try {
    return (
      localStorage.getItem(`planche_live_session_notes_${programId}`) ??
      localStorage.getItem('planche_live_session_notes') ??
      ''
    );
  } catch {
    return '';
  }
}

function loadSavedRestState(programId: string): {
  deadline: number | null;
  totalDuration: number;
  secondsLeft: number;
  isActive: boolean;
} {
  try {
    const rawDeadline = localStorage.getItem(`planche_active_rest_deadline_${programId}`);
    const rawTotal = localStorage.getItem(`planche_active_rest_total_${programId}`);
    if (rawDeadline) {
      const deadline = Number(rawDeadline);
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      if (Number.isFinite(deadline) && remaining > 0) {
        const total = rawTotal ? Number(rawTotal) : remaining;
        return {
          deadline,
          totalDuration: Number.isFinite(total) && total > 0 ? total : remaining,
          secondsLeft: remaining,
          isActive: true,
        };
      }
      localStorage.removeItem(`planche_active_rest_deadline_${programId}`);
      localStorage.removeItem(`planche_active_rest_total_${programId}`);
    }
  } catch {
    // ignore
  }
  return { deadline: null, totalDuration: 0, secondsLeft: 0, isActive: false };
}

export const WorkoutSessionCompanion: React.FC<WorkoutSessionCompanionProps> = ({
  workout,
  initialExerciseId,
  onInitialExerciseConsumed,
  onFinishWorkout,
}) => {
  const { saveWorkoutLogToCloud } = useSync();
  // All exercises flattened in sequential order from active workout
  const allExercises: Exercise[] = workout.phases.flatMap((p) => p.exercises);

  // Active exercise index
  const [currentIdx, setCurrentIdx] = useState<number>(() =>
    loadSavedExerciseIdx(workout, initialExerciseId)
  );

  const currentExercise = allExercises[currentIdx] || allExercises[0];

  // Completed sets tracker: exerciseId -> array of booleans
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, boolean[]>>(() =>
    loadSavedProgress(workout)
  );

  // Rest Timer State (deadline-backed so timers stay accurate if app is backgrounded)
  const initialRest = loadSavedRestState(workout.id);
  const [restDeadline, setRestDeadline] = useState<number | null>(initialRest.deadline);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(initialRest.secondsLeft);
  const [totalRestDuration, setTotalRestDuration] = useState<number>(initialRest.totalDuration);
  const [isRestActive, setIsRestActive] = useState<boolean>(initialRest.isActive);

  // Hold Timer State (for isometric holds like Frog Planche or Planche Leans)
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdCountdown, setHoldCountdown] = useState<number>(0);
  const [isPrepActive, setIsPrepActive] = useState<boolean>(false);
  const [prepSeconds, setPrepSeconds] = useState<number>(3);

  // Workout completed flag
  const [workoutFinished, setWorkoutFinished] = useState<boolean>(false);

  // Custom Reps / Holds per Exercise & Set (so athlete can adjust based on how they feel)
  const [customRepsMap, setCustomRepsMap] = useState<Record<string, Record<number, string>>>(() => {
    try {
      const saved = localStorage.getItem('planche_custom_set_reps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active state for editing reps/seconds on a specific set
  const [editingSet, setEditingSet] = useState<{
    setIdx: number;
    value: string;
  } | null>(null);

  // Live session notes that persist with workout log history
  const [sessionNotes, setSessionNotes] = useState<string>(() =>
    loadSavedSessionNotes(workout.id)
  );

  const prevWorkoutIdRef = useRef<string>(workout.id);

  // Re-sync recovered state only when switching to a different workout protocol
  useEffect(() => {
    if (prevWorkoutIdRef.current === workout.id) {
      return;
    }
    prevWorkoutIdRef.current = workout.id;
    setExerciseProgress(loadSavedProgress(workout));
    setCurrentIdx(loadSavedExerciseIdx(workout, initialExerciseId));
    setSessionNotes(loadSavedSessionNotes(workout.id));
    const restoredRest = loadSavedRestState(workout.id);
    setRestDeadline(restoredRest.deadline);
    setRestSecondsLeft(restoredRest.secondsLeft);
    setTotalRestDuration(restoredRest.totalDuration);
    setIsRestActive(restoredRest.isActive);
    setWorkoutFinished(false);
  }, [workout.id]);

  // If caller changes initialExerciseId explicitly, jump to that exercise once
  useEffect(() => {
    if (initialExerciseId) {
      const found = allExercises.findIndex((e) => e.id === initialExerciseId);
      if (found !== -1) setCurrentIdx(found);
      onInitialExerciseConsumed?.();
    }
  }, [initialExerciseId]);

  // Persist progress & active index under the matching workout-specific keys
  useEffect(() => {
    try {
      localStorage.setItem(`planche_active_progress_${workout.id}`, JSON.stringify(exerciseProgress));
    } catch {
      // ignore storage quota errors
    }
  }, [exerciseProgress, workout.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`planche_active_exercise_idx_${workout.id}`, String(currentIdx));
    } catch {
      // ignore
    }
  }, [currentIdx, workout.id]);

  const getSetReps = (exerciseId: string, setIdx: number, defaultVal: string) => {
    return customRepsMap[exerciseId]?.[setIdx] || defaultVal;
  };

  const handleSaveSetReps = (newVal: string, applyToAll: boolean = false) => {
    if (!editingSet) return;
    const { setIdx } = editingSet;
    const trimmed = newVal.trim() || currentExercise.defaultRepsOrSec;

    setCustomRepsMap((prev) => {
      const exMap = { ...(prev[currentExercise.id] || {}) };
      if (applyToAll) {
        for (let i = 0; i < currentExercise.defaultSets; i++) {
          exMap[i] = trimmed;
        }
      } else {
        exMap[setIdx] = trimmed;
      }
      const updated = { ...prev, [currentExercise.id]: exMap };
      localStorage.setItem('planche_custom_set_reps', JSON.stringify(updated));
      return updated;
    });

    setEditingSet(null);
  };

  // Interval reference for timers
  const restTimerRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const prepTimerRef = useRef<number | null>(null);
  const lastBeepedSecondRef = useRef<number | null>(null);
  const currentExerciseRef = useRef<Exercise>(currentExercise);
  const exerciseProgressRef = useRef<Record<string, boolean[]>>(exerciseProgress);

  currentExerciseRef.current = currentExercise;
  exerciseProgressRef.current = exerciseProgress;

  // Clean up hold/prep timers only if component truly unmounts
  useEffect(() => {
    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  const clearPersistedRest = () => {
    try {
      localStorage.removeItem(`planche_active_rest_deadline_${workout.id}`);
      localStorage.removeItem(`planche_active_rest_total_${workout.id}`);
    } catch {
      // ignore
    }
  };

  // Handle deadline-backed rest countdown (survives mobile backgrounding / lock screen)
  useEffect(() => {
    if (!isRestActive || !restDeadline) {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      return;
    }

    const syncRestRemaining = () => {
      const remaining = Math.ceil((restDeadline - Date.now()) / 1000);
      if (remaining <= 0) {
        if (restTimerRef.current) clearInterval(restTimerRef.current);
        setRestSecondsLeft(0);
        setRestDeadline(null);
        setIsRestActive(false);
        clearPersistedRest();
        lastBeepedSecondRef.current = null;
        sound.playSuccessChime();
        return;
      }

      if (remaining <= 3 && lastBeepedSecondRef.current !== remaining) {
        lastBeepedSecondRef.current = remaining;
        sound.playCountdownBeep(600, 0.08);
      }
      setRestSecondsLeft(remaining);
    };

    syncRestRemaining();
    restTimerRef.current = window.setInterval(syncRestRemaining, 500);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncRestRemaining();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isRestActive, restDeadline, workout.id]);

  // Start rest timer
  const triggerRest = (seconds: number) => {
    const deadline = Date.now() + seconds * 1000;
    lastBeepedSecondRef.current = null;
    setTotalRestDuration(seconds);
    setRestSecondsLeft(seconds);
    setRestDeadline(deadline);
    setIsRestActive(true);
    try {
      localStorage.setItem(`planche_active_rest_deadline_${workout.id}`, String(deadline));
      localStorage.setItem(`planche_active_rest_total_${workout.id}`, String(seconds));
    } catch {
      // ignore
    }
  };

  const cancelRest = () => {
    setIsRestActive(false);
    setRestSecondsLeft(0);
    setRestDeadline(null);
    lastBeepedSecondRef.current = null;
    clearPersistedRest();
  };

  const addRestTime = (secondsToAdd: number) => {
    const baseDeadline = restDeadline && restDeadline > Date.now() ? restDeadline : Date.now();
    const nextDeadline = baseDeadline + secondsToAdd * 1000;
    const nextRemaining = Math.max(1, Math.ceil((nextDeadline - Date.now()) / 1000));
    const nextTotal = totalRestDuration + secondsToAdd;
    setRestDeadline(nextDeadline);
    setRestSecondsLeft(nextRemaining);
    setTotalRestDuration(nextTotal);
    try {
      localStorage.setItem(`planche_active_rest_deadline_${workout.id}`, String(nextDeadline));
      localStorage.setItem(`planche_active_rest_total_${workout.id}`, String(nextTotal));
    } catch {
      // ignore
    }
  };

  // Start Hold Exercise with 3s preparation count
  const startHoldRoutine = (targetSec: number) => {
    setIsPrepActive(true);
    setPrepSeconds(3);
    sound.playCountdownBeep(440, 0.1);

    let prepRemaining = 3;
    prepTimerRef.current = window.setInterval(() => {
      prepRemaining -= 1;
      setPrepSeconds(prepRemaining);
      if (prepRemaining > 0) {
        sound.playCountdownBeep(440, 0.1);
      } else {
        clearInterval(prepTimerRef.current!);
        setIsPrepActive(false);
        sound.playStartSignal();
        // Start actual hold
        runHold(targetSec);
      }
    }, 1000);
  };

  const runHold = (targetSec: number) => {
    setIsHolding(true);
    setHoldCountdown(targetSec);

    let secRemaining = targetSec;
    holdTimerRef.current = window.setInterval(() => {
      secRemaining -= 1;
      setHoldCountdown(secRemaining);
      if (secRemaining <= 3 && secRemaining > 0) {
        sound.playCountdownBeep(880, 0.08);
      }
      if (secRemaining <= 0) {
        clearInterval(holdTimerRef.current!);
        setIsHolding(false);
        sound.playSuccessChime();
        // Automatically check off the next incomplete set!
        markNextSetComplete();
      }
    }, 1000);
  };

  const cancelHold = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setIsPrepActive(false);
    setIsHolding(false);
    setHoldCountdown(0);
  };

  // Toggle set completion
  const toggleSet = (setIdx: number) => {
    const currentSets = [...(exerciseProgress[currentExercise.id] || [])];
    const willBeComplete = !currentSets[setIdx];
    currentSets[setIdx] = willBeComplete;

    setExerciseProgress((prev) => ({
      ...prev,
      [currentExercise.id]: currentSets,
    }));

    // If marked as complete, start rest timer!
    if (willBeComplete && currentExercise.restSeconds > 0) {
      sound.playSuccessChime();
      triggerRest(currentExercise.restSeconds);
    }
  };

  const markNextSetComplete = () => {
    const ex = currentExerciseRef.current;
    const latestSets = [...(exerciseProgressRef.current[ex.id] || new Array(ex.defaultSets || 1).fill(false))];
    const nextIncompleteIdx = latestSets.findIndex((s) => !s);
    if (nextIncompleteIdx !== -1) {
      latestSets[nextIncompleteIdx] = true;
      setExerciseProgress((prev) => ({
        ...prev,
        [ex.id]: latestSets,
      }));
      if (ex.restSeconds > 0) {
        triggerRest(ex.restSeconds);
      }
    }
  };

  const resetCurrentExerciseSets = () => {
    setExerciseProgress((prev) => ({
      ...prev,
      [currentExercise.id]: new Array(currentExercise.defaultSets).fill(false),
    }));
  };

  // Check if all exercises are completed
  const totalSetsCount = allExercises.reduce((acc, ex) => acc + ex.defaultSets, 0);
  const completedSetsCount = allExercises.reduce((acc, ex) => {
    const sets = exerciseProgress[ex.id] || [];
    return acc + sets.filter(Boolean).length;
  }, 0);
  const progressPercent = Math.round((completedSetsCount / totalSetsCount) * 100);

  const handleFinishWorkout = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
    sound.playSuccessChime();
    setWorkoutFinished(true);

    // Save workout record in history
    const logs = JSON.parse(localStorage.getItem('planche_workout_history') || '[]');
    const newEntry = {
      id: `live_${Date.now()}`,
      date: new Date().toISOString(),
      workoutName: workout.name,
      workoutIntensity: workout.intensityLabel,
      completedSets: completedSetsCount,
      totalSets: totalSetsCount,
      progressPercent,
      targetRpe: workout.meta.targetRPE || 'RPE 5–7',
      notes: sessionNotes.trim(),
      exercises: allExercises.map((e) => e.name).join(', '),
    };
    logs.unshift(newEntry);
    localStorage.setItem('planche_workout_history', JSON.stringify(logs.slice(0, 50)));
    localStorage.removeItem(`planche_active_progress_${workout.id}`);
    localStorage.removeItem(`planche_active_exercise_idx_${workout.id}`);
    localStorage.removeItem(`planche_live_session_notes_${workout.id}`);
    localStorage.removeItem('planche_live_session_notes');
    clearPersistedRest();
    setRestDeadline(null);
    setIsRestActive(false);
    setRestSecondsLeft(0);
    saveWorkoutLogToCloud(newEntry);
    window.dispatchEvent(new Event('planche_history_updated'));

    if (onFinishWorkout) onFinishWorkout();
  };

  const handleStartNewSession = () => {
    const fresh: Record<string, boolean[]> = {};
    allExercises.forEach((ex) => {
      fresh[ex.id] = new Array(ex.defaultSets || 1).fill(false);
    });
    setExerciseProgress(fresh);
    setCurrentIdx(0);
    setSessionNotes('');
    setWorkoutFinished(false);
    cancelHold();
    cancelRest();
    localStorage.removeItem(`planche_active_progress_${workout.id}`);
    localStorage.removeItem(`planche_active_exercise_idx_${workout.id}`);
    localStorage.removeItem(`planche_live_session_notes_${workout.id}`);
    localStorage.removeItem('planche_live_session_notes');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentExerciseSets = exerciseProgress[currentExercise.id] || [];
  const currentCompletedCount = currentExerciseSets.filter(Boolean).length;
  const isCurrentExComplete = currentCompletedCount === currentExercise.defaultSets;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {workoutFinished && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <Award className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Session Logged & Synced ({completedSetsCount}/{totalSetsCount} Sets)
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Saved to your workout history. You can start a fresh session whenever you&apos;re ready.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartNewSession}
            className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Start New Session
          </button>
        </div>
      )}
      {/* Top Session Progress Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-slate-600 mb-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Active Session:</span>
            </span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {workout.intensityLabel}
            </span>
          </div>
          <span className="font-mono tabular-nums text-slate-900 font-bold">
            {completedSetsCount} / {totalSetsCount} Sets ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Exercise Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-4 pt-3 border-t border-slate-100 pb-1">
          {allExercises.map((ex, idx) => {
            const sets = exerciseProgress[ex.id] || [];
            const done = sets.every(Boolean);
            const active = idx === currentIdx;
            return (
              <button
                key={ex.id}
                onClick={() => {
                  cancelHold();
                  setCurrentIdx(idx);
                }}
                className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : done
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {done && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                <span>
                  {idx + 1}. {ex.name.split(' ')[0]} {ex.name.split(' ')[1] || ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating / Active Rest Timer Box (When Active) */}
      {isRestActive && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-slate-700"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-sky-400 transition-all duration-1000 ease-linear"
                    fill="transparent"
                    strokeDasharray={175.9}
                    strokeDashoffset={
                      175.9 - (175.9 * restSecondsLeft) / (totalRestDuration || 1)
                    }
                  />
                </svg>
                <span className="absolute font-mono text-base font-bold text-white tabular-nums">
                  {formatTime(restSecondsLeft)}
                </span>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  {workout.id === 'gtg' ? 'Superset Circuit Transition' : 'Neural Recovery Rest Period'}
                </div>
                <h3 className="text-sm font-medium text-slate-200 mt-0.5">
                  Resting for {currentExercise.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {workout.id === 'gtg'
                    ? 'Brief transition rest allows immediate rotation into the next superset movement without accumulating fatigue.'
                    : 'Full 3-min rest allows complete ATP-PC resynthesis for locked-arm power.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => addRestTime(30)}
                className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+30s</span>
              </button>
              <button
                onClick={cancelRest}
                className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial justify-center px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
              >
                Skip Rest & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Exercise Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Exercise {currentIdx + 1} of {allExercises.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                cancelHold();
                setCurrentIdx((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentIdx === 0}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors cursor-pointer"
              aria-label="Previous Exercise"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                cancelHold();
                setCurrentIdx((prev) => Math.min(allExercises.length - 1, prev + 1));
              }}
              disabled={currentIdx === allExercises.length - 1}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors cursor-pointer"
              aria-label="Next Exercise"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Exercise Title and Target Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {currentExercise.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{currentExercise.targetArea}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-blue-600">{currentExercise.rpe}</span>
              <span aria-hidden="true">·</span>
              <span>Rest: {currentExercise.restSeconds}s</span>
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {currentExercise.badge}
            </span>
          </div>
        </div>

        {/* Form Cue Callout */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold text-slate-700 mb-1">Critical Form Focus:</div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            "{currentExercise.cues}"
          </p>
          <p className="text-xs text-slate-500 mt-1.5">{currentExercise.details}</p>
        </div>

        {/* Interactive Hold Timer (if hold exercise like Frog Planche or Planche Lean) */}
        {currentExercise.isHold && (
          <div className="mb-6 p-5 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-0.5">
                Guided Isometric Hold Timer
              </div>
              <p className="text-xs text-blue-800">
                Tap to count down {currentExercise.holdSeconds || 5} seconds with audio beeps and automatic set logging.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isPrepActive ? (
                <div className="flex items-center gap-2 min-h-[44px] px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm">
                  <span className="font-mono tabular-nums">Get Ready: {prepSeconds}s</span>
                  <button
                    onClick={cancelHold}
                    className="ml-2 text-xs underline cursor-pointer py-1 px-1.5"
                  >
                    Cancel
                  </button>
                </div>
              ) : isHolding ? (
                <div className="flex items-center gap-3 min-h-[44px] px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold">
                  <span className="text-base font-mono tabular-nums">HOLD: {holdCountdown}s</span>
                  <button
                    onClick={cancelHold}
                    className="ml-2 text-xs bg-blue-700 hover:bg-blue-800 px-2.5 py-1.5 rounded cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startHoldRoutine(currentExercise.holdSeconds || 5)}
                  className="min-h-[44px] sm:min-h-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start {currentExercise.holdSeconds || 5}s Hold</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sets Tracker Checkboxes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Prescribed Sets: {currentCompletedCount} / {currentExercise.defaultSets} Completed
            </span>
            <button
              onClick={resetCurrentExerciseSets}
              className="min-h-[36px] sm:min-h-0 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sets</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {currentExerciseSets.map((completed, setIdx) => {
              const repsValue = getSetReps(currentExercise.id, setIdx, currentExercise.defaultRepsOrSec);
              return (
                <div key={setIdx} className="flex flex-col items-center gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => toggleSet(setIdx)}
                    className={`w-full min-h-[88px] sm:min-h-0 p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] ${
                      completed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      <span>Set {setIdx + 1}</span>
                      {completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-xs font-mono tabular-nums font-bold text-slate-800">
                      {repsValue}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {completed ? 'Complete ✓' : 'Tap when done'}
                    </span>
                  </button>

                  {/* Edit reps button under the set */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSet({
                        setIdx,
                        value: repsValue,
                      });
                    }}
                    className="inline-flex items-center justify-center gap-1 min-h-[36px] px-3 py-1.5 sm:min-h-0 sm:px-2 sm:py-0.5 text-[11px] font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded transition-colors cursor-pointer"
                    title={`Edit reps or hold seconds for Set ${setIdx + 1}`}
                  >
                    <Pencil className="w-2.5 h-2.5 text-slate-400" />
                    <span>Edit Reps</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coaching Points */}
        <div className="pt-5 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
            Technique Standards:
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            {currentExercise.coachingPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">·</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Session Notes at bottom of live session that saves with log history */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-900">
              Session Notes & Athlete Biofeedback
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Permanently saved with your workout history
          </span>
        </div>
        <textarea
          rows={3}
          value={sessionNotes}
          onChange={(e) => {
            const val = e.target.value;
            setSessionNotes(val);
            try {
              localStorage.setItem(`planche_live_session_notes_${workout.id}`, val);
            } catch {
              // ignore
            }
          }}
          placeholder="How did you feel today? Note your form quality, lean angle, elbow joint sensation, or reps achieved (e.g. 'Felt snappy on tuck planche. Leaned further on PPPUs with parallettes. Left biceps tendon felt 100% fine. RPE 6')..."
          className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 leading-relaxed"
        />
      </div>

      {/* Edit Reps Modal */}
      {editingSet !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Set {editingSet.setIdx + 1} Reps / Hold
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]">
                  {currentExercise.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSet(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target / Achieved Reps or Seconds:
              </label>
              <input
                type="text"
                value={editingSet.value}
                onChange={(e) =>
                  setEditingSet({ ...editingSet, value: e.target.value })
                }
                placeholder="e.g. 6 reps, 8s, 10s"
                autoFocus
                className="w-full text-sm font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentExercise.isHold
                  ? ['3s', '4s', '5s', '6s', '8s', '10s', '12s', '15s'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditingSet({ ...editingSet, value: val })}
                        className={`text-xs px-2.5 py-1 rounded font-mono font-semibold transition-colors cursor-pointer ${
                          editingSet.value === val
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))
                  : ['3 reps', '4 reps', '5 reps', '6 reps', '8 reps', '10 reps', '12 reps'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditingSet({ ...editingSet, value: val })}
                        className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                          editingSet.value === val
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSaveSetReps(editingSet.value, false)}
                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Set {editingSet.setIdx + 1}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveSetReps(editingSet.value, true)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Apply this to all sets in this exercise"
              >
                All Sets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          {progressPercent === 100 ? (
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Award className="w-4 h-4" /> All prescribed sets completed! Submaximal stimulus locked in.
            </span>
          ) : (
            <span>
              Keep sets clean and stop 2–3 reps/seconds in reserve.
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {currentIdx < allExercises.length - 1 ? (
            <button
              onClick={() => {
                cancelHold();
                setCurrentIdx((prev) => prev + 1);
              }}
              className="w-full sm:w-auto min-h-[48px] sm:min-h-0 px-5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Next Exercise</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : null}

          <button
            onClick={handleFinishWorkout}
            className="w-full sm:w-auto min-h-[48px] sm:min-h-0 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish & Log Workout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
