import React, { useState, useEffect } from 'react';
import {
  WorkoutProgram,
  WorkoutType,
  WORKOUT_TYPES,
  Exercise,
  Phase,
  TrainingRule,
} from '../data/programData';
import {
  ShieldCheck,
  CheckCircle2,
  Flame,
  Activity,
  Dumbbell,
  Info,
  ChevronDown,
  ChevronUp,
  Play,
  Edit3,
  Save,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Check,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface HeroOverviewProps {
  currentWorkout: WorkoutProgram;
  activeWorkoutType: WorkoutType;
  onSelectWorkoutType: (type: WorkoutType) => void;
  onSaveWorkout: (workout: WorkoutProgram) => void;
  onResetWorkout: (type: WorkoutType) => void;
  onStartSession: (exerciseId?: string) => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({
  currentWorkout,
  activeWorkoutType,
  onSelectWorkoutType,
  onSaveWorkout,
  onResetWorkout,
  onStartSession,
}) => {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftWorkout, setDraftWorkout] = useState<WorkoutProgram>(() =>
    JSON.parse(JSON.stringify(currentWorkout))
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProgramCollapsed, setIsProgramCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('planche_program_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Save collapse preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('planche_program_collapsed', String(isProgramCollapsed));
    } catch {
      // ignore
    }
  }, [isProgramCollapsed]);

  // When user starts editing, auto-expand so all phases and exercises are accessible
  useEffect(() => {
    if (isEditing) {
      setIsProgramCollapsed(false);
    }
  }, [isEditing]);

  // Sync draft when currentWorkout or workoutType changes if not actively editing
  useEffect(() => {
    if (!isEditing) {
      setDraftWorkout(JSON.parse(JSON.stringify(currentWorkout)));
    }
  }, [currentWorkout, isEditing]);

  const toggleExpand = (id: string) => {
    setExpandedExercise((prev) => (prev === id ? null : id));
  };

  const handleStartEditing = () => {
    setDraftWorkout(JSON.parse(JSON.stringify(currentWorkout)));
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraftWorkout(JSON.parse(JSON.stringify(currentWorkout)));
    setIsEditing(false);
  };

  const handleSave = () => {
    onSaveWorkout(draftWorkout);
    setIsEditing(false);
    sound.playSuccessChime();
    setToastMessage('Workout template changes saved!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReset = () => {
    onResetWorkout(activeWorkoutType);
    setIsEditing(false);
    sound.playSuccessChime();
    setToastMessage('Workout restored to default template!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mutators for Draft Editing
  const updateMetaField = (key: keyof WorkoutProgram['meta'], value: string) => {
    setDraftWorkout((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        [key]: value,
      },
    }));
  };

  const updateRule = (index: number, field: keyof TrainingRule, value: string) => {
    setDraftWorkout((prev) => {
      const nextRules = [...prev.rules];
      nextRules[index] = { ...nextRules[index], [field]: value };
      return { ...prev, rules: nextRules };
    });
  };

  const addRule = () => {
    setDraftWorkout((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          title: 'New Training Guideline',
          rule: 'Specify coaching rationale or intensity parameter.',
        },
      ],
    }));
  };

  const deleteRule = (index: number) => {
    setDraftWorkout((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const updatePhase = (phaseIndex: number, field: keyof Phase, value: any) => {
    setDraftWorkout((prev) => {
      const nextPhases = [...prev.phases];
      nextPhases[phaseIndex] = { ...nextPhases[phaseIndex], [field]: value };
      return { ...prev, phases: nextPhases };
    });
  };

  const updateExercise = (
    phaseIndex: number,
    exerciseIndex: number,
    field: keyof Exercise,
    value: any
  ) => {
    setDraftWorkout((prev) => {
      const nextPhases = [...prev.phases];
      const nextExercises = [...nextPhases[phaseIndex].exercises];
      nextExercises[exerciseIndex] = {
        ...nextExercises[exerciseIndex],
        [field]: value,
      };
      nextPhases[phaseIndex] = {
        ...nextPhases[phaseIndex],
        exercises: nextExercises,
      };
      return { ...prev, phases: nextPhases };
    });
  };

  const addExercise = (phaseIndex: number) => {
    const newEx: Exercise = {
      id: `custom-ex-${Date.now()}`,
      phaseId: draftWorkout.phases[phaseIndex].id,
      name: 'New Custom Exercise',
      badge: '3 Sets × 8–10 Reps | Rest: 60s',
      details: 'Technical execution guidelines.',
      cues: 'Primary form focus cue.',
      targetArea: 'Target Muscle Group',
      defaultSets: 3,
      defaultRepsOrSec: '8–10 reps',
      restSeconds: 60,
      rpe: 'RPE 6',
      coachingPoints: ['Maintain strict form', 'Controlled tempo'],
    };

    setDraftWorkout((prev) => {
      const nextPhases = [...prev.phases];
      nextPhases[phaseIndex] = {
        ...nextPhases[phaseIndex],
        exercises: [...nextPhases[phaseIndex].exercises, newEx],
      };
      return { ...prev, phases: nextPhases };
    });
  };

  const deleteExercise = (phaseIndex: number, exerciseIndex: number) => {
    setDraftWorkout((prev) => {
      const nextPhases = [...prev.phases];
      const nextExercises = nextPhases[phaseIndex].exercises.filter(
        (_, i) => i !== exerciseIndex
      );
      nextPhases[phaseIndex] = {
        ...nextPhases[phaseIndex],
        exercises: nextExercises,
      };
      return { ...prev, phases: nextPhases };
    });
  };

  const updateCoachingPoint = (
    phaseIndex: number,
    exerciseIndex: number,
    pointIndex: number,
    value: string
  ) => {
    setDraftWorkout((prev) => {
      const nextPhases = [...prev.phases];
      const nextEx = { ...nextPhases[phaseIndex].exercises[exerciseIndex] };
      const nextPoints = [...nextEx.coachingPoints];
      nextPoints[pointIndex] = value;
      nextEx.coachingPoints = nextPoints;
      nextPhases[phaseIndex].exercises[exerciseIndex] = nextEx;
      return { ...prev, phases: nextPhases };
    });
  };

  const addCoachingPoint = (phaseIndex: number, exerciseIndex: number) => {
    setDraftWorkout((prev) => {
      const nextPhases = [...prev.phases];
      const nextEx = { ...nextPhases[phaseIndex].exercises[exerciseIndex] };
      nextEx.coachingPoints = [...nextEx.coachingPoints, 'New technique checkpoint'];
      nextPhases[phaseIndex].exercises[exerciseIndex] = nextEx;
      return { ...prev, phases: nextPhases };
    });
  };

  const deleteCoachingPoint = (
    phaseIndex: number,
    exerciseIndex: number,
    pointIndex: number
  ) => {
    setDraftWorkout((prev) => {
      const nextPhases = [...prev.phases];
      const nextEx = { ...nextPhases[phaseIndex].exercises[exerciseIndex] };
      nextEx.coachingPoints = nextEx.coachingPoints.filter((_, i) => i !== pointIndex);
      nextPhases[phaseIndex].exercises[exerciseIndex] = nextEx;
      return { ...prev, phases: nextPhases };
    });
  };

  // Workout being rendered
  const workout = isEditing ? draftWorkout : currentWorkout;
  const totalExercises = workout.phases.reduce((sum, p) => sum + p.exercises.length, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP WORKOUT SWITCHER & EDIT BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 3 Workout Buttons */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Select workout intensity protocol:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WORKOUT_TYPES.map((type) => {
              const isSelected = activeWorkoutType === type.id;
              let activeClasses = '';
              if (type.id === 'max') {
                activeClasses = isSelected
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
                  : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100/70 border border-amber-200/60';
              } else if (type.id === 'submax') {
                activeClasses = isSelected
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                  : 'bg-blue-50/60 text-blue-900 hover:bg-blue-100/70 border border-blue-200/60';
              } else {
                activeClasses = isSelected
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                  : 'bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/70 border border-emerald-200/60';
              }

              return (
                <button
                  key={type.id}
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                    }
                    onSelectWorkoutType(type.id);
                  }}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeClasses}`}
                >
                  {type.id === 'max' && <Zap className="w-3.5 h-3.5" />}
                  {type.id === 'submax' && <Activity className="w-3.5 h-3.5" />}
                  {type.id === 'recovery' && <Sparkles className="w-3.5 h-3.5" />}
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Right: Edit Workout Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                title="Reset this workout to original template"
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>

              <button
                onClick={handleCancelEditing}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEditing}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="Edit exercises, sets, reps, cues, or rules for this workout template"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Workout</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Notice Banner */}
      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <strong className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
              <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Editing Mode Active for: {workout.intensityLabel}
            </strong>
            <p className="text-amber-800">
              Scroll down to edit any title, duration, goal, rule, set/rep volume, cue, or add/remove exercises across all phases. Hit "Save Changes" at top right when complete.
            </p>
          </div>
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Now</span>
          </button>
        </div>
      )}

      {/* HEADER BANNER / META - COLLAPSIBLE VIA ARROW TOGGLE */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-800 relative overflow-hidden transition-all duration-300">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 max-w-4xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2.5 py-0.5 rounded-full">
                  {workout.intensityLabel}
                </span>
                {isEditing && (
                  <span className="text-[10px] bg-amber-500/30 text-amber-200 font-bold px-2 py-0.5 rounded border border-amber-400/40">
                    EDITING
                  </span>
                )}
                {isProgramCollapsed && !isEditing && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded-full border border-slate-700">
                    Program Details Collapsed
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Program Title:
                    </label>
                    <input
                      type="text"
                      value={draftWorkout.meta.title}
                      onChange={(e) => updateMetaField('title', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Subtitle / Focus:
                    </label>
                    <input
                      type="text"
                      value={draftWorkout.meta.subtitle}
                      onChange={(e) => updateMetaField('subtitle', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Physiological Philosophy:
                    </label>
                    <textarea
                      rows={2}
                      value={draftWorkout.meta.philosophy}
                      onChange={(e) => updateMetaField('philosophy', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 text-balance">
                    {workout.meta.title}
                  </h1>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    {workout.meta.subtitle}
                  </p>
                  {(!isProgramCollapsed || isEditing) && (
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {workout.meta.philosophy}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Collapsible toggle arrow button */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsProgramCollapsed((prev) => !prev)}
                aria-expanded={!isProgramCollapsed}
                className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:bg-slate-700 text-white transition-all cursor-pointer border border-slate-700 shadow-xs shrink-0 select-none"
                title={isProgramCollapsed ? 'Expand entire program details' : 'Collapse rest of program'}
                aria-label={isProgramCollapsed ? 'Expand Program' : 'Collapse Program'}
              >
                <span className="text-xs font-bold hidden sm:inline">
                  {isProgramCollapsed ? 'Expand Program' : 'Collapse Program'}
                </span>
                <div
                  className={`p-1 rounded-md bg-slate-700/60 group-hover:bg-slate-700 transition-transform duration-300 ${
                    isProgramCollapsed ? '' : 'rotate-180'
                  }`}
                >
                  <ChevronDown className="w-4 h-4 text-white" />
                </div>
              </button>
            )}
          </div>

          {/* Quick summary bar when collapsed */}
          {isProgramCollapsed && !isEditing && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Goal: <strong className="text-white">{workout.meta.goal}</strong></span>
                <span>·</span>
                <span>Timeline: <strong className="text-white">{workout.meta.timeline}</strong></span>
                <span>·</span>
                <span>Duration: <strong className="text-white">{workout.meta.sessionDuration}</strong></span>
                <span>·</span>
                <span>Target RPE: <strong className="text-amber-400 font-bold">{workout.meta.targetRPE}</strong></span>
                <span>·</span>
                <span>Phases: <strong className="text-white">{workout.phases.length} ({totalExercises} exercises)</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setIsProgramCollapsed(false)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Click arrow or here to expand
              </button>
            </div>
          )}

          {/* Meta Grid (visible when expanded or editing) */}
          {(!isProgramCollapsed || isEditing) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 backdrop-blur-xs">
                <span className="block text-xs text-slate-400 font-medium uppercase tracking-wide">
                  Goal
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={draftWorkout.meta.goal}
                    onChange={(e) => updateMetaField('goal', e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <strong className="text-sm sm:text-base font-semibold text-white">
                    {workout.meta.goal}
                  </strong>
                )}
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 backdrop-blur-xs">
                <span className="block text-xs text-slate-400 font-medium uppercase tracking-wide">
                  Target Timeline
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={draftWorkout.meta.timeline}
                    onChange={(e) => updateMetaField('timeline', e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <strong className="text-sm sm:text-base font-semibold text-white">
                    {workout.meta.timeline}
                  </strong>
                )}
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 backdrop-blur-xs">
                <span className="block text-xs text-slate-400 font-medium uppercase tracking-wide">
                  Session Duration
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={draftWorkout.meta.sessionDuration}
                    onChange={(e) => updateMetaField('sessionDuration', e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <strong className="text-sm sm:text-base font-semibold text-white">
                    {workout.meta.sessionDuration}
                  </strong>
                )}
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 backdrop-blur-xs">
                <span className="block text-xs text-slate-400 font-medium uppercase tracking-wide">
                  Target RPE
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={draftWorkout.meta.targetRPE}
                    onChange={(e) => updateMetaField('targetRPE', e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-amber-400 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <strong className="text-sm sm:text-base font-semibold text-amber-400">
                    {workout.meta.targetRPE}
                  </strong>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* COLLAPSED PROGRAM NOTIFICATION BANNER */}
      {isProgramCollapsed && !isEditing && (
        <div
          onClick={() => setIsProgramCollapsed(false)}
          className="bg-blue-50/90 hover:bg-blue-100/90 border border-blue-200 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-900 group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-xs">
              <ChevronDown className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-900 text-sm">Rest of Program is Collapsed</div>
              <p className="text-xs text-slate-600">
                Key Training Rules and all {workout.phases.length} phases ({totalExercises} exercises) are currently tucked away. Click here or use the header arrow to expand.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsProgramCollapsed(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs group-hover:bg-blue-700 transition-colors shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Expand Program</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* REST OF PROGRAM: RULES & ALL PHASES */}
      <div className={isProgramCollapsed && !isEditing ? 'hidden print:block space-y-6' : 'space-y-6'}>

      {/* KEY TRAINING RULES */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Key Training Rules & Principles
            </h2>
          </div>
          {isEditing && (
            <button
              onClick={addRule}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rule</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workout.rules.map((rule, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 relative group"
            >
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={rule.title}
                      onChange={(e) => updateRule(idx, 'title', e.target.value)}
                      placeholder="Rule Title"
                      className="text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 w-full mr-2"
                    />
                    <button
                      onClick={() => deleteRule(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={rule.rule}
                    onChange={(e) => updateRule(idx, 'rule', e.target.value)}
                    placeholder="Rule explanation"
                    className="text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 w-full"
                  />
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{rule.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{rule.rule}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PHASES OVERVIEW & EXERCISES */}
      <div className="space-y-6">
        {workout.phases.map((phase, pIdx) => (
          <section
            key={phase.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs"
          >
            {/* Phase Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {phase.id === 1 && <Flame className="w-5 h-5 text-amber-500" />}
                  {phase.id === 2 && <Activity className="w-5 h-5 text-blue-600" />}
                  {phase.id === 3 && <Dumbbell className="w-5 h-5 text-indigo-600" />}
                  {phase.id === 4 && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                  {isEditing ? (
                    <input
                      type="text"
                      value={phase.title}
                      onChange={(e) => updatePhase(pIdx, 'title', e.target.value)}
                      className="font-bold text-slate-900 text-base sm:text-lg bg-slate-50 border border-slate-300 rounded px-2 py-1 w-full max-w-md"
                    />
                  ) : (
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {phase.title}
                    </h2>
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={phase.subtitle}
                    onChange={(e) => updatePhase(pIdx, 'subtitle', e.target.value)}
                    placeholder="Phase Subtitle"
                    className="text-xs text-slate-600 bg-slate-50 border border-slate-300 rounded px-2 py-0.5 mt-1.5 w-full max-w-lg"
                  />
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">{phase.subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={phase.durationEstimate}
                    onChange={(e) => updatePhase(pIdx, 'durationEstimate', e.target.value)}
                    placeholder="Duration estimate"
                    className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300 w-28 text-center"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {phase.durationEstimate}
                  </span>
                )}
              </div>
            </div>

            {/* Phase Description */}
            {isEditing ? (
              <textarea
                rows={2}
                value={phase.description}
                onChange={(e) => updatePhase(pIdx, 'description', e.target.value)}
                className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-xl p-2.5 mb-5"
                placeholder="Phase guidance description..."
              />
            ) : (
              <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {phase.description}
              </p>
            )}

            {/* Exercises List (or Table for Phase 1 in non-edit mode) */}
            {!isEditing && phase.id === 1 && phase.exercises.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="py-2.5 px-3 font-semibold text-slate-700">Exercise</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-700">Volume</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-700">Target Area</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-700 hidden sm:table-cell">
                        Key Cue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {phase.exercises.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{ex.name}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-mono tabular-nums text-xs">
                          {ex.defaultRepsOrSec}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs">{ex.targetArea}</td>
                        <td className="py-2.5 px-3 text-slate-500 italic text-xs hidden sm:table-cell">
                          {ex.cues}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Exercise Cards (or Full Editable Exercises in Edit Mode) */
              <div className="space-y-4">
                {phase.exercises.map((ex, eIdx) => {
                  const isExpanded = expandedExercise === ex.id;
                  return (
                    <div
                      key={ex.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white relative"
                    >
                      {isEditing ? (
                        /* EDITABLE EXERCISE FORM */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                              Exercise {eIdx + 1}
                            </span>
                            <button
                              onClick={() => deleteExercise(pIdx, eIdx)}
                              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                              title="Delete this exercise"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Exercise Name:
                              </label>
                              <input
                                type="text"
                                value={ex.name}
                                onChange={(e) =>
                                  updateExercise(pIdx, eIdx, 'name', e.target.value)
                                }
                                className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Badge / Volume Summary:
                              </label>
                              <input
                                type="text"
                                value={ex.badge}
                                onChange={(e) =>
                                  updateExercise(pIdx, eIdx, 'badge', e.target.value)
                                }
                                placeholder="e.g. 4–5 Sets × 4–5 Sec | Rest: 3 Mins"
                                className="w-full text-xs font-semibold text-blue-700 bg-blue-50/50 border border-blue-200 rounded px-2.5 py-1.5"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                Sets:
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={ex.defaultSets}
                                onChange={(e) =>
                                  updateExercise(pIdx, eIdx, 'defaultSets', Number(e.target.value))
                                }
                                className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                Reps / Hold Text:
                              </label>
                              <input
                                type="text"
                                value={ex.defaultRepsOrSec}
                                onChange={(e) =>
                                  updateExercise(pIdx, eIdx, 'defaultRepsOrSec', e.target.value)
                                }
                                placeholder="4–5 sec or 8–10 reps"
                                className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                Rest Interval (Sec):
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="600"
                                step="15"
                                value={ex.restSeconds}
                                onChange={(e) =>
                                  updateExercise(pIdx, eIdx, 'restSeconds', Number(e.target.value))
                                }
                                className="w-full text-xs border border-slate-300 rounded px-2 py-1 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                Target RPE:
                              </label>
                              <input
                                type="text"
                                value={ex.rpe}
                                onChange={(e) =>
                                  updateExercise(pIdx, eIdx, 'rpe', e.target.value)
                                }
                                placeholder="RPE 6"
                                className="w-full text-xs border border-slate-300 rounded px-2 py-1 text-blue-700 font-semibold"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Primary Form Cue:
                            </label>
                            <input
                              type="text"
                              value={ex.cues}
                              onChange={(e) =>
                                updateExercise(pIdx, eIdx, 'cues', e.target.value)
                              }
                              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 italic"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Target Area:
                              </label>
                              <input
                                type="text"
                                value={ex.targetArea}
                                onChange={(e) =>
                                  updateExercise(pIdx, eIdx, 'targetArea', e.target.value)
                                }
                                className="w-full text-xs text-slate-700 border border-slate-300 rounded px-2 py-1"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Technical Details:
                              </label>
                              <input
                                type="text"
                                value={ex.details}
                                onChange={(e) =>
                                  updateExercise(pIdx, eIdx, 'details', e.target.value)
                                }
                                className="w-full text-xs text-slate-700 border border-slate-300 rounded px-2 py-1"
                              />
                            </div>
                          </div>

                          {/* Coaching Points */}
                          <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-semibold text-slate-700">
                                Checklist Coaching Points:
                              </span>
                              <button
                                onClick={() => addCoachingPoint(pIdx, eIdx)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Point</span>
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {ex.coachingPoints.map((point, ptIdx) => (
                                <div key={ptIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={point}
                                    onChange={(e) =>
                                      updateCoachingPoint(pIdx, eIdx, ptIdx, e.target.value)
                                    }
                                    className="w-full text-xs text-slate-700 border border-slate-200 rounded px-2 py-1"
                                  />
                                  <button
                                    onClick={() => deleteCoachingPoint(pIdx, eIdx, ptIdx)}
                                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* READ-ONLY VIEW */
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm sm:text-base">
                                {ex.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                {ex.badge}
                              </span>
                              <button
                                onClick={() => onStartSession(ex.id)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Jump to this exercise in live session"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Track</span>
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 mb-2">{ex.details}</div>

                          <div className="bg-slate-50 text-slate-700 text-xs italic px-3 py-2 rounded-lg border border-slate-100 mb-2">
                            <strong className="not-italic font-semibold text-slate-800">
                              Form Cue:{' '}
                            </strong>
                            {ex.cues}
                          </div>

                          {/* Expandable Technical Checkpoints */}
                          <div>
                            <button
                              onClick={() => toggleExpand(ex.id)}
                              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer pt-1"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>
                                {isExpanded
                                  ? 'Hide Technical Cues'
                                  : 'View Detailed Form Checklist'}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                <div>
                                  <strong className="block text-slate-800 font-semibold mb-1">
                                    Coaching Checkpoints:
                                  </strong>
                                  <ul className="list-disc list-inside space-y-1">
                                    {ex.coachingPoints.map((point, i) => (
                                      <li key={i}>{point}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <strong className="block text-slate-800 font-semibold mb-1">
                                    Target Physiology:
                                  </strong>
                                  <p className="text-slate-600">{ex.targetArea}</p>
                                  <div className="mt-2 text-xs">
                                    <span className="font-semibold text-slate-700">
                                      Rest Interval:{' '}
                                    </span>
                                    <span className="font-mono text-slate-900 font-semibold">
                                      {ex.restSeconds} seconds
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Add Exercise button in Edit Mode */}
                {isEditing && (
                  <button
                    onClick={() => addExercise(pIdx)}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Exercise to {phase.title}</span>
                  </button>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
      </div>
    </div>
  );
};
