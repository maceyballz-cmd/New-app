import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Play,
  Check,
  ChevronLeft,
  Volume2,
  VolumeX,
  Clock,
  Dumbbell,
} from 'lucide-react';
import {
  WorkoutType,
  WorkoutProgram,
  WORKOUT_TYPES,
  getWorkoutProgram,
} from '../data/programData';
import { WorkoutSessionCompanion } from './WorkoutSessionCompanion';
import { UserAuthButton } from './UserAuthButton';
import { CloudSyncButton } from './CloudSyncButton';
import { sound } from '../utils/sound';

const MOBILE_SELECTED_PROTOCOL_KEY = 'planche_mobile_selected_protocol';
const MOBILE_IN_SESSION_KEY = 'planche_mobile_in_session';

const PROTOCOL_DISPLAY: Record<
  WorkoutType,
  {
    title: string;
    activeCard: string;
    activeDot: string;
    activeBadge: string;
  }
> = {
  max: {
    title: '100% Max Intensity',
    activeCard: 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20',
    activeDot: 'bg-amber-500',
    activeBadge: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  submax: {
    title: '50–60% Submax Intensity',
    activeCard: 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20',
    activeDot: 'bg-blue-600',
    activeBadge: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  gtg: {
    title: 'GTG 20–30%',
    activeCard: 'border-violet-600 bg-violet-50/70 ring-2 ring-violet-600/20',
    activeDot: 'bg-violet-600',
    activeBadge: 'bg-violet-100 text-violet-900 border-violet-300',
  },
  recovery: {
    title: '0–10% Nothing/Active Recovery',
    activeCard: 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20',
    activeDot: 'bg-emerald-600',
    activeBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
};

function getSavedSetCounts(program: WorkoutProgram): { completed: number; total: number } {
  const allExercises = program.phases.flatMap((p) => p.exercises);
  const total = allExercises.reduce((acc, ex) => acc + (ex.defaultSets || 0), 0);
  try {
    const raw = localStorage.getItem(`planche_active_progress_${program.id}`);
    if (!raw) return { completed: 0, total };
    const parsed = JSON.parse(raw) as Record<string, boolean[]>;
    const completed = allExercises.reduce((acc, ex) => {
      const arr = parsed[ex.id];
      if (!Array.isArray(arr)) return acc;
      return acc + arr.slice(0, ex.defaultSets || 1).filter(Boolean).length;
    }, 0);
    return { completed, total };
  } catch {
    return { completed: 0, total };
  }
}

export const MobileWorkoutLogger: React.FC = () => {
  const [selectedType, setSelectedType] = useState<WorkoutType>(() => {
    try {
      const saved = localStorage.getItem(MOBILE_SELECTED_PROTOCOL_KEY) as WorkoutType | null;
      if (saved && WORKOUT_TYPES.some((w) => w.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'submax';
  });

  const [inSession, setInSession] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MOBILE_IN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [currentWorkout, setCurrentWorkout] = useState<WorkoutProgram>(() =>
    getWorkoutProgram(selectedType)
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.isEnabled());

  // Keep workout program synced with selectedType & any cloud-synced custom workouts
  useEffect(() => {
    setCurrentWorkout(getWorkoutProgram(selectedType));
    try {
      localStorage.setItem(MOBILE_SELECTED_PROTOCOL_KEY, selectedType);
    } catch {
      // ignore
    }
  }, [selectedType]);

  useEffect(() => {
    try {
      localStorage.setItem(MOBILE_IN_SESSION_KEY, String(inSession));
    } catch {
      // ignore
    }
  }, [inSession]);

  useEffect(() => {
    const handleWorkoutUpdated = () => {
      setCurrentWorkout(getWorkoutProgram(selectedType));
    };
    window.addEventListener('planche_workout_updated', handleWorkoutUpdated);
    return () => window.removeEventListener('planche_workout_updated', handleWorkoutUpdated);
  }, [selectedType]);

  const handleSelectProtocol = (type: WorkoutType) => {
    setSelectedType(type);
    setCurrentWorkout(getWorkoutProgram(type));
  };

  const handleStartSession = () => {
    setCurrentWorkout(getWorkoutProgram(selectedType));
    setInSession(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
  };

  const selectedMeta = WORKOUT_TYPES.find((w) => w.id === selectedType) || WORKOUT_TYPES[1];
  const selectedSavedCounts = useMemo(
    () => getSavedSetCounts(currentWorkout),
    [currentWorkout, inSession]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-6">
      {/* Compact Mobile Header: Statics Lab branding + Firebase Account/Sync + Sound */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 whitespace-nowrap truncate">
              Statics Lab
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <UserAuthButton />
            <CloudSyncButton />
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable audio cues'}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-slate-700" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-5">
        {!inSession ? (
          <div className="space-y-5">
            {/* Protocol Selector Heading */}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Select Workout Protocol
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Choose today&apos;s training intensity and launch your live workout session.
              </p>
            </div>

            {/* Four Workout Protocol Selection Buttons */}
            <div className="space-y-3" role="radiogroup" aria-label="Workout Protocol">
              {WORKOUT_TYPES.map((protocol) => {
                const isSelected = selectedType === protocol.id;
                const display = PROTOCOL_DISPLAY[protocol.id];
                const program = getWorkoutProgram(protocol.id);
                const counts = getSavedSetCounts(program);
                const exerciseCount = program.phases.reduce(
                  (acc, p) => acc + p.exercises.length,
                  0
                );

                return (
                  <button
                    key={protocol.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectProtocol(protocol.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer min-h-[76px] flex items-center justify-between gap-3 active:scale-[0.99] ${
                      isSelected
                        ? display.activeCard
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isSelected ? display.activeDot : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-base font-bold text-slate-900 tracking-tight">
                          {display.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 pl-4.5">
                        {protocol.sublabel}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pl-4.5 pt-0.5 tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Dumbbell className="w-3 h-3 text-slate-400" />
                          {exerciseCount} exercises · {counts.total} sets
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {program.meta.sessionDuration}
                        </span>
                        {counts.completed > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-blue-700">
                              {counts.completed}/{counts.total} logged
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Start Session CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartSession}
                className="w-full min-h-[54px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-base shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {selectedSavedCounts.completed > 0
                    ? `Start Session (Resume ${selectedSavedCounts.completed}/${selectedSavedCounts.total} Sets)`
                    : 'Start Session'}
                </span>
              </button>
              <p className="text-center text-[11px] text-slate-500 mt-2.5">
                Selected: <strong className="text-slate-800">{PROTOCOL_DISPLAY[selectedMeta.id].title}</strong> · {currentWorkout.meta.targetRPE}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Minimal Return-to-Protocol Bar */}
            <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
              <button
                type="button"
                onClick={() => setInSession(false)}
                className="min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Protocols</span>
              </button>

              <span className="text-xs font-bold text-slate-800 truncate">
                {PROTOCOL_DISPLAY[selectedType].title}
              </span>
            </div>

            {/* Reused Live Session Component */}
            <WorkoutSessionCompanion workout={currentWorkout} />
          </div>
        )}
      </main>
    </div>
  );
};
