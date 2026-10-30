import React, { useState, useEffect, useMemo } from 'react';
import { PROGRESSION_ROADMAP, ProgressionStep } from '../data/programData';
import {
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  Compass,
  Calendar,
  Flame,
  ShieldAlert,
  Check,
  Plus,
  Trash2,
  Clock,
  Play,
  Dumbbell,
  Activity,
  RotateCcw,
  Zap,
  TrendingUp,
  CheckSquare,
  Square,
  ChevronRight,
  Info,
} from 'lucide-react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface ProgressionRoadmapProps {
  onNavigateTab?: (
    tab: 'overview' | 'workout' | 'cheatsheet' | 'exercises' | 'roadmap' | 'calculator' | 'transformation'
  ) => void;
  onStartSession?: () => void;
}

export type RoadmapSubTab = 'path' | 'goals' | 'next-steps';

export interface RoadmapGoal {
  id: string;
  category: 'isometric' | 'hspu' | 'tendon' | 'mobility' | 'custom';
  categoryLabel: string;
  title: string;
  targetMetric: string;
  timeline: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  isCustom?: boolean;
}

const DEFAULT_ROADMAP_GOALS: RoadmapGoal[] = [
  // 1. Straight-Arm Isometric Holds
  {
    id: 'goal-tuck-15s',
    category: 'isometric',
    categoryLabel: 'Straight-Arm Isometric',
    title: '15s Flat Tuck Planche Hold',
    targetMetric: '15s hold, 100% elbow lockout',
    timeline: 'Foundation (Month 1–2)',
    status: 'completed',
    notes: 'Established solid scapular protraction and posterior pelvic tilt.',
  },
  {
    id: 'goal-adv-tuck-10s',
    category: 'isometric',
    categoryLabel: 'Straight-Arm Isometric',
    title: '10s Advanced Tuck Planche',
    targetMetric: '10–12s hold, 90° hip angle, flat back',
    timeline: 'Level 2 (Month 2–4)',
    status: 'completed',
    notes: 'Back parallel to ground without sag.',
  },
  {
    id: 'goal-frog-8s',
    category: 'isometric',
    categoryLabel: 'Straight-Arm Isometric',
    title: '8s Frog Planche with Raised Legs',
    targetMetric: '8s continuous hold, arms decoupled from knees',
    timeline: 'Level 3 · Current Target',
    status: 'in_progress',
    notes: 'Primary working step. Currently training at 4–5s submax working sets.',
  },
  {
    id: 'goal-piked-straddle-6s',
    category: 'isometric',
    categoryLabel: 'Straight-Arm Isometric',
    title: '6s Piked Straddle Planche Hold',
    targetMetric: '6s hold, wide straddle, locked elbows',
    timeline: 'Level 4 (Month 5–7)',
    status: 'pending',
    notes: 'Wide leg abduction shortens the forward torque lever arm.',
  },
  {
    id: 'goal-band-straddle-8s',
    category: 'isometric',
    categoryLabel: 'Straight-Arm Isometric',
    title: '8s Band-Assisted Flat Straddle Planche',
    targetMetric: '8s hold with 10–15mm light band across hips',
    timeline: 'Level 5 (Month 7–9)',
    status: 'pending',
    notes: 'Allows true horizontal neural alignment with 5–8 kg reduction.',
  },
  {
    id: 'goal-full-straddle-5s',
    category: 'isometric',
    categoryLabel: 'Straight-Arm Isometric',
    title: '5s Full Unassisted Straddle Planche',
    targetMetric: '5+ seconds unbroken clean horizontal hold',
    timeline: 'Mastery Achievement (Month 9–12)',
    status: 'pending',
    notes: 'Hips, shoulders, and heels dead level on the horizontal plane.',
  },

  // 2. HSPU & Dynamic Pressing
  {
    id: 'goal-pseudo-15r',
    category: 'hspu',
    categoryLabel: 'Bent-Arm Pressing (HSPU)',
    title: '15 Full-Range Pseudo Planche Push-Ups',
    targetMetric: '15 reps with hands at hip line, forward lean held',
    timeline: 'Strength Base (Month 1–3)',
    status: 'completed',
    notes: 'Chest touches ground, elbows stay tucked at 45° angle.',
  },
  {
    id: 'goal-elevated-pike-8r',
    category: 'hspu',
    categoryLabel: 'Bent-Arm Pressing (HSPU)',
    title: '8 Elevated Box Deficit Pike Push-Ups',
    targetMetric: '8 reps with feet on 20-inch box, head below hands',
    timeline: 'Intermediate Overhead (Month 3–5)',
    status: 'in_progress',
    notes: 'Simulates 80% bodyweight vertical overhead pressing power.',
  },
  {
    id: 'goal-wall-hspu-5r',
    category: 'hspu',
    categoryLabel: 'Bent-Arm Pressing (HSPU)',
    title: '5 Strict Chest-to-Wall Handstand Push-Ups',
    targetMetric: '5 strict reps with head touching floor cleanly',
    timeline: 'Advanced Overhead (Month 5–8)',
    status: 'pending',
    notes: 'Zero arching or spinal hyperextension; hollow body form.',
  },
  {
    id: 'goal-freestanding-hspu-1r',
    category: 'hspu',
    categoryLabel: 'Bent-Arm Pressing (HSPU)',
    title: '1 Clean Freestanding Handstand Push-Up',
    targetMetric: '1 full ROM rep without wall assistance',
    timeline: 'Mastery (Month 8–12)',
    status: 'pending',
    notes: 'Combines inverted vestibular balance with peak shoulder power.',
  },

  // 3. Tendon & Joint Conditioning
  {
    id: 'goal-knuckle-lifts-12r',
    category: 'tendon',
    categoryLabel: 'Tendon & Joint Resilience',
    title: '12 Bodyweight First-Knuckle Palm Lifts',
    targetMetric: '12 full lifts in quadruped with shoulders forward',
    timeline: 'Injury Prevention',
    status: 'completed',
    notes: 'Strengthens finger flexor retinaculum against wrist hyperextension.',
  },
  {
    id: 'goal-planche-lean-45deg',
    category: 'tendon',
    categoryLabel: 'Tendon & Joint Resilience',
    title: '45° Forward Planche Lean without Wrist Discomfort',
    targetMetric: '15s hold at 45° angle with taped floor mark',
    timeline: 'Structural Loading',
    status: 'in_progress',
    notes: 'Progressive centimeters of forward lean overloaded consistently.',
  },
  {
    id: 'goal-infraspinatus-rotations',
    category: 'tendon',
    categoryLabel: 'Tendon & Joint Resilience',
    title: 'DB Towel-Roll Infraspinatus Rotations (5kg × 10 reps)',
    targetMetric: '5kg dumbbell, towel glued against ribs',
    timeline: 'Rotator Cuff Health',
    status: 'in_progress',
    notes: 'Reinforces subscapularis and posterior cuff against impingement.',
  },
  {
    id: 'goal-german-hang-30s',
    category: 'tendon',
    categoryLabel: 'Tendon & Joint Resilience',
    title: '30s German Hang for Distal Biceps Tendon',
    targetMetric: '30s passive hanging shoulder extension stretch',
    timeline: 'Connective Tissue Health',
    status: 'pending',
    notes: 'Prevents acute strain on long head of biceps brachii.',
  },

  // 4. Active Mobility & Compression
  {
    id: 'goal-pancake-chest-floor',
    category: 'mobility',
    categoryLabel: 'Active Mobility & Compression',
    title: 'Middle Split Straddle Pancake (Chest to Floor)',
    targetMetric: 'Flat chest contact in seated straddle',
    timeline: 'Lever Arm Reduction',
    status: 'pending',
    notes: 'A wider straddle shortens torque by up to 25%, making the hold easier.',
  },
  {
    id: 'goal-shoulder-flexion-180',
    category: 'mobility',
    categoryLabel: 'Active Mobility & Compression',
    title: '180° Full Overhead Shoulder Flexion (Dead Hang)',
    targetMetric: 'Full passive lat & pec minor length',
    timeline: 'Overhead Alignment',
    status: 'completed',
    notes: 'Ensures stackable joint alignment for HSPU lockouts.',
  },
];

const STORAGE_GOALS_KEY = 'planche_roadmap_goals_v2';
const STORAGE_CURRENT_STEP_KEY = 'planche_roadmap_active_step';

export const ProgressionRoadmap: React.FC<ProgressionRoadmapProps> = ({
  onNavigateTab,
  onStartSession,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<RoadmapSubTab>('path');

  // Active step in roadmap (defaults to Step 3)
  const [activeStepId, setActiveStepId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_STEP_KEY);
      if (saved) return parseInt(saved, 10);
    } catch {
      // ignore
    }
    return 3;
  });

  // Goals state with persistence
  const [goals, setGoals] = useState<RoadmapGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GOALS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_ROADMAP_GOALS;
  });

  const [goalCategoryFilter, setGoalCategoryFilter] = useState<string>('all');
  const [showAddGoalModal, setShowAddGoalModal] = useState<boolean>(false);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalMetric, setNewGoalMetric] = useState<string>('');
  const [newGoalTimeline, setNewGoalTimeline] = useState<string>('Upcoming Milestone');
  const [newGoalCategory, setNewGoalCategory] = useState<'isometric' | 'hspu' | 'tendon' | 'mobility' | 'custom'>('custom');

  // Save active step preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_STEP_KEY, String(activeStepId));
    } catch {
      // ignore
    }
  }, [activeStepId]);

  // Save goals
  const saveGoals = (updated: RoadmapGoal[]) => {
    setGoals(updated);
    try {
      localStorage.setItem(STORAGE_GOALS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Toggle goal status: pending -> in_progress -> completed -> pending
  const toggleGoalStatus = (goalId: string) => {
    const nextGoals = goals.map((g) => {
      if (g.id !== goalId) return g;
      let nextStatus: 'pending' | 'in_progress' | 'completed';
      if (g.status === 'pending') {
        nextStatus = 'in_progress';
      } else if (g.status === 'in_progress') {
        nextStatus = 'completed';
        sound.playSuccessChime();
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        nextStatus = 'pending';
      }
      return {
        ...g,
        status: nextStatus,
        completedDate: nextStatus === 'completed' ? new Date().toISOString() : undefined,
      };
    });
    saveGoals(nextGoals);
  };

  const handleAddCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: RoadmapGoal = {
      id: `custom-goal-${Date.now()}`,
      category: newGoalCategory,
      categoryLabel:
        newGoalCategory === 'isometric'
          ? 'Straight-Arm Isometric'
          : newGoalCategory === 'hspu'
          ? 'Bent-Arm Pressing (HSPU)'
          : newGoalCategory === 'tendon'
          ? 'Tendon & Joint Resilience'
          : newGoalCategory === 'mobility'
          ? 'Active Mobility & Compression'
          : 'Custom Goal',
      title: newGoalTitle.trim(),
      targetMetric: newGoalMetric.trim() || 'Custom Milestone Target',
      timeline: newGoalTimeline.trim() || 'Next 30–60 Days',
      status: 'in_progress',
      isCustom: true,
    };

    saveGoals([newGoal, ...goals]);
    sound.playSuccessChime();
    setNewGoalTitle('');
    setNewGoalMetric('');
    setShowAddGoalModal(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    saveGoals(goals.filter((g) => g.id !== goalId));
  };

  const handleResetGoals = () => {
    saveGoals(DEFAULT_ROADMAP_GOALS);
  };

  // Filtered goals
  const filteredGoals = useMemo(() => {
    if (goalCategoryFilter === 'all') return goals;
    if (goalCategoryFilter === 'completed') return goals.filter((g) => g.status === 'completed');
    if (goalCategoryFilter === 'in_progress') return goals.filter((g) => g.status === 'in_progress');
    return goals.filter((g) => g.category === goalCategoryFilter);
  }, [goals, goalCategoryFilter]);

  // Goal metrics
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const inProgressGoals = goals.filter((g) => g.status === 'in_progress').length;
  const goalProgressPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ============================================================
          TOP HEADER & SUB-TAB NAVIGATION
          ============================================================ */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/80 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Biomechanical Mastery Strategy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Roadmap Plan & Strategic Path
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Systematic 6-step progression ladder, measurable milestone goals, and immediate tactical next steps for Straddle Planche & HSPU mastery.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex items-center gap-2 shrink-0">
            {onStartSession && (
              <button
                type="button"
                onClick={onStartSession}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Session</span>
              </button>
            )}
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('overview')}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <span>Dashboard</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 SUB-TABS: Progression Path | Goals | Next Steps */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('path')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'path'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Progression Path</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeSubTab === 'path' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              6 Steps
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('goals')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'goals'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Goals</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeSubTab === 'goals' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {completedGoals}/{totalGoals} Completed
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('next-steps')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'next-steps'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Next Steps</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeSubTab === 'next-steps' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Step 3 Focus
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: PROGRESSION PATH
          ============================================================ */}
      {activeSubTab === 'path' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Biomechanical Progression Ladder
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Each progression increases the forward shoulder torque moment arm. Click any step to set your active working target.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span>Active Target:</span>
              <strong className="text-blue-700">Step {activeStepId}</strong>
            </div>
          </div>

          <div className="space-y-5">
            {PROGRESSION_ROADMAP.map((step) => {
              const isCurrent = step.step === activeStepId;
              const isPassed = step.step < activeStepId;

              return (
                <div
                  key={step.step}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : isPassed
                      ? 'bg-slate-50/60 border-slate-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-sm scale-105'
                            : isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : step.step}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">
                            {step.name}
                          </h3>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-3 h-3" />
                              <span>Current Active Target</span>
                            </span>
                          )}
                          {isPassed && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Passed ✓
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{step.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStepId(step.step);
                            sound.playSuccessChime();
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                        >
                          Set as Current Target
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 my-2.5 leading-relaxed pl-11">
                    {step.description}
                  </p>

                  {/* Criteria & Coaching Cue */}
                  <div className="pl-11 mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Graduation Test Criteria:</span>
                      </span>
                      <ul className="space-y-1.5">
                        {step.criteria.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-600" />
                          <span>Coaching Point:</span>
                        </span>
                        <p className="text-slate-600 italic leading-relaxed">{step.tips}</p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                        Focus: Maintain 100% locked elbow skeletal alignment with zero joint micro-bending.
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: GOALS (Milestones & Interactive Checklist)
          ============================================================ */}
      {activeSubTab === 'goals' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Calisthenics Milestone Goals
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your key straight-arm isometric, HSPU overhead pressing, and tendon strength checkpoints. Click any goal to update status.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddGoalModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>

              <button
                type="button"
                onClick={handleResetGoals}
                title="Reset goals back to master curriculum defaults"
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Goal Progress Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Overall Journey Completion
                </span>
                <span className="text-xs text-slate-500">
                  {completedGoals} achieved · {inProgressGoals} currently in training · {totalGoals - completedGoals - inProgressGoals} upcoming
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {goalProgressPercent}%
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${goalProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { id: 'all', label: `All Goals (${goals.length})` },
              { id: 'isometric', label: 'Straight-Arm Holds' },
              { id: 'hspu', label: 'HSPU Pressing' },
              { id: 'tendon', label: 'Tendon Health' },
              { id: 'mobility', label: 'Active Mobility' },
              { id: 'in_progress', label: `In Progress (${inProgressGoals})` },
              { id: 'completed', label: `Completed (${completedGoals})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setGoalCategoryFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  goalCategoryFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Add Goal Modal / Form */}
          {showAddGoalModal && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 sm:p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Add Custom Milestone Goal</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddCustomGoal} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Goal Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10s Straddle Planche Lean on Parallettes"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Metric *</label>
                  <input
                    type="text"
                    placeholder="e.g. 10s hold, zero elbow micro-bend"
                    value={newGoalMetric}
                    onChange={(e) => setNewGoalMetric(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="isometric">Straight-Arm Isometric</option>
                    <option value="hspu">Bent-Arm Pressing (HSPU)</option>
                    <option value="tendon">Tendon & Joint Resilience</option>
                    <option value="mobility">Active Mobility</option>
                    <option value="custom">Custom Milestone</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Target Timeline</label>
                  <input
                    type="text"
                    placeholder="e.g. Next 4 Weeks / Month 3"
                    value={newGoalTimeline}
                    onChange={(e) => setNewGoalTimeline(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGoalModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                  >
                    Save Milestone Goal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Goals List */}
          <div className="space-y-3">
            {filteredGoals.map((g) => {
              const isCompleted = g.status === 'completed';
              const isInProgress = g.status === 'in_progress';

              return (
                <div
                  key={g.id}
                  onClick={() => toggleGoalStatus(g.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group select-none ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                      : isInProgress
                      ? 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/70 ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGoalStatus(g.id);
                      }}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                      title="Click to toggle status"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : isInProgress ? (
                        <div className="w-5 h-5 rounded-md border-2 border-blue-600 bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-black">
                          ●
                        </div>
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold tracking-tight ${
                            isCompleted
                              ? 'text-slate-900 line-through opacity-85'
                              : 'text-slate-900'
                          }`}
                        >
                          {g.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                          {g.categoryLabel}
                        </span>
                        {g.isCustom && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Target: <strong>{g.targetMetric}</strong></span>
                        <span>·</span>
                        <span className="text-slate-500">Timeline: {g.timeline}</span>
                      </div>

                      {g.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 italic">
                          {g.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-8 sm:pl-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : isInProgress
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Achieved</span>
                        </>
                      ) : isInProgress ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>In Training</span>
                        </>
                      ) : (
                        <span>Upcoming</span>
                      )}
                    </span>

                    {g.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGoal(g.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete custom goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: NEXT STEPS (Action Plan & Tactics)
          ============================================================ */}
      {activeSubTab === 'next-steps' && (
        <div className="space-y-6">
          {/* Working Zone Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Immediate Focus (Next 2–4 Weeks)
                </span>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Step 3 Protocol
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Frog Planche with Raised Legs Graduation Protocol
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                You are currently in the submaximal working zone. Your straight-arm goal is to build neurological motor recruitment while completely decoupling the legs from the triceps without connective tissue inflammation.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/80 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Working Sets</span>
                  <strong className="text-white text-sm">4–5s Holds</strong>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Graduation</span>
                  <strong className="text-emerald-400 text-sm">8s Unbroken</strong>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Neural Rest</span>
                  <strong className="text-white text-sm">180s (3 Min)</strong>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Next Ladder Step</span>
                  <strong className="text-blue-400 text-sm">Step 4 (Piked Straddle)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Next Steps Breakdown */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Tactical Action Plan: What To Do In Every Session
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute these four primary directives to safely bridge the gap to Step 4 (Piked Straddle Planche).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Strict Submaximal TUT Accumulation
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Never test max holds during your 50–60% submax sessions. Perform 4–5 sets of exactly 4–5 seconds of Frog Planche with raised legs, stopping with 2–3 seconds in reserve. This allows high weekly frequency without tendon micro-tears.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Measurable Forward Lean Overload
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  On Planche Leans and Dumbbell Leans, align your toes against a tile line or floor tape mark. Every 2 weeks, advance your forward lean by exactly 1 cm. Progressive overload in calisthenics is measured in forward centimeters, not guessed.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Mandatory Rotator Cuff & Wrist Flossing
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Always execute the Phase 1 warm-up protocol: Infraspinatus towel-roll rotations, first-knuckle palm lifts, and straight-arm band protraction. These 5 minutes fortify your distal biceps tendon and eliminate anterior shoulder pinching.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Graduation Test Day Every 3–4 Weeks
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Switch the protocol on the Dashboard to "100% Max Intensity" once every 3–4 weeks. Test an unbroken maximum hold. Once you register 8 continuous seconds with zero elbow micro-bend, graduate to Step 4 (Piked Straddle Planche).
                </p>
              </div>
            </div>

            {/* Troubleshooting Diagnostic Matrix */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Biomechanical Troubleshooting Matrix:</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <span className="font-bold text-amber-950 block">If Hips Are Dropping Below Shoulders</span>
                  <p className="text-amber-800 leading-relaxed">
                    You have not leaned far enough forward to shift your center of mass over your wrist line. Lean 2 cm further and actively dome the upper back.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <span className="font-bold text-amber-950 block">If Elbows Keep Micro-Bending</span>
                  <p className="text-amber-800 leading-relaxed">
                    Bending shifts load from skeletal alignment directly into your distal biceps tendon. Back off 5% of lean depth and lock elbows 100% straight before lifting feet.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <span className="font-bold text-amber-950 block">If Wrists Feel Overcompressed</span>
                  <p className="text-amber-800 leading-relaxed">
                    Turn hands outward 30–45 degrees on the floor or switch to medium parallettes. Parallettes maintain a neutral wrist joint without hyperextension.
                  </p>
                </div>
              </div>
            </div>

            {/* Tactical Shortcuts */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                Ready to train? Launch your active session with integrated rest timers and audio cues.
              </div>

              <div className="flex items-center gap-2">
                {onStartSession && (
                  <button
                    type="button"
                    onClick={onStartSession}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Live Session</span>
                  </button>
                )}
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('calculator')}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
                  >
                    <span>RPE Calculator</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
