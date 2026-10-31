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
  Edit3,
  X,
  Save,
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

export interface NextStepDirective {
  id: number;
  title: string;
  description: string;
}

export interface NextStepsHeaderData {
  timelineTag: string;
  protocolBadge: string;
  title: string;
  description: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
  metric3Label: string;
  metric3Value: string;
  metric4Label: string;
  metric4Value: string;
  isCustomized?: boolean;
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

const DEFAULT_NEXT_STEP_DIRECTIVES: NextStepDirective[] = [
  {
    id: 1,
    title: 'Strict Submaximal TUT Accumulation',
    description:
      'Never test max holds during your 50–60% submax sessions. Perform 4–5 sets of exactly 4–5 seconds of Frog Planche with raised legs, stopping with 2–3 seconds in reserve. This allows high weekly frequency without tendon micro-tears.',
  },
  {
    id: 2,
    title: 'Measurable Forward Lean Overload',
    description:
      'On Planche Leans and Dumbbell Leans, align your toes against a tile line or floor tape mark. Every 2 weeks, advance your forward lean by exactly 1 cm. Progressive overload in calisthenics is measured in forward centimeters, not guessed.',
  },
  {
    id: 3,
    title: 'Mandatory Rotator Cuff & Wrist Flossing',
    description:
      'Always execute the Phase 1 warm-up protocol: Infraspinatus towel-roll rotations, first-knuckle palm lifts, and straight-arm band protraction. These 5 minutes fortify your distal biceps tendon and eliminate anterior shoulder pinching.',
  },
  {
    id: 4,
    title: 'Graduation Test Day Every 3–4 Weeks',
    description:
      'Switch the protocol on the Dashboard to "100% Max Intensity" once every 3–4 weeks. Test an unbroken maximum hold. Once you register 8 continuous seconds with zero elbow micro-bend, graduate to Step 4 (Piked Straddle Planche).',
  },
];

const STORAGE_GOALS_KEY = 'planche_roadmap_goals_v3';
const STORAGE_CURRENT_STEP_KEY = 'planche_roadmap_active_step_v3';
const STORAGE_STEPS_KEY = 'planche_roadmap_steps_v3';
const STORAGE_DIRECTIVES_KEY = 'planche_roadmap_directives_v3';
const STORAGE_NEXT_STEPS_HEADER_KEY = 'planche_roadmap_next_steps_header_v3';

const getDefaultNextStepsHeader = (
  stepNum: number,
  stepName?: string,
  stepDesc?: string
): NextStepsHeaderData => ({
  timelineTag: 'Immediate Focus (Next 2–4 Weeks)',
  protocolBadge: `Step ${stepNum} Protocol`,
  title: `${stepName || 'Frog Planche with Raised Legs'} Graduation Protocol`,
  description:
    stepDesc ||
    'You are currently in the submaximal working zone. Your straight-arm goal is to build neurological motor recruitment while completely decoupling the legs from the triceps without connective tissue inflammation.',
  metric1Label: 'Current Working Sets',
  metric1Value: '4–5s Holds',
  metric2Label: 'Target Graduation',
  metric2Value: '8s Unbroken',
  metric3Label: 'Neural Rest',
  metric3Value: '180s (3 Min)',
  metric4Label: 'Active Roadmap Step',
  metric4Value: `Step ${stepNum}`,
  isCustomized: false,
});

export const ProgressionRoadmap: React.FC<ProgressionRoadmapProps> = ({
  onNavigateTab,
  onStartSession,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<RoadmapSubTab>('path');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // 1. STEPS (PROGRESSION PATH) STATE
  // -------------------------------------------------------------
  const [steps, setSteps] = useState<ProgressionStep[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STEPS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return PROGRESSION_ROADMAP;
  });

  const [activeStepId, setActiveStepId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_STEP_KEY);
      if (saved) return parseInt(saved, 10);
    } catch {
      // ignore
    }
    return 3;
  });

  const saveSteps = (updated: ProgressionStep[]) => {
    setSteps(updated);
    try {
      localStorage.setItem(STORAGE_STEPS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_STEP_KEY, String(activeStepId));
    } catch {
      // ignore
    }
  }, [activeStepId]);

  // Step Editing Modals
  const [editingStep, setEditingStep] = useState<ProgressionStep | null>(null);
  const [isAddingStep, setIsAddingStep] = useState<boolean>(false);
  const [stepFormState, setStepFormState] = useState<{
    step: number;
    name: string;
    subtitle: string;
    description: string;
    criteria: string[];
    tips: string;
  }>({
    step: 1,
    name: '',
    subtitle: '',
    description: '',
    criteria: [],
    tips: '',
  });
  const [newCriterionInput, setNewCriterionInput] = useState<string>('');

  const openEditStepModal = (step: ProgressionStep) => {
    setEditingStep(step);
    setIsAddingStep(false);
    setStepFormState({
      step: step.step,
      name: step.name,
      subtitle: step.subtitle,
      description: step.description,
      criteria: [...step.criteria],
      tips: step.tips,
    });
    setNewCriterionInput('');
  };

  const openAddStepModal = () => {
    setIsAddingStep(true);
    setEditingStep(null);
    const nextStepNum = steps.length > 0 ? Math.max(...steps.map((s) => s.step)) + 1 : 1;
    setStepFormState({
      step: nextStepNum,
      name: '',
      subtitle: '',
      description: '',
      criteria: ['Clean unbroken hold form', '100% locked elbow extension'],
      tips: '',
    });
    setNewCriterionInput('');
  };

  const handleSaveStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepFormState.name.trim()) return;

    if (isAddingStep) {
      const newStep: ProgressionStep = {
        step: Number(stepFormState.step) || steps.length + 1,
        name: stepFormState.name.trim(),
        subtitle: stepFormState.subtitle.trim(),
        description: stepFormState.description.trim(),
        criteria: stepFormState.criteria.filter((c) => c.trim().length > 0),
        tips: stepFormState.tips.trim(),
      };
      const updated = [...steps, newStep].sort((a, b) => a.step - b.step);
      saveSteps(updated);
      sound.playSuccessChime();
      showToast(`Step "${newStep.name}" added successfully!`);
    } else if (editingStep) {
      const updated = steps.map((s) => {
        if (s.step === editingStep.step) {
          return {
            ...s,
            step: Number(stepFormState.step) || s.step,
            name: stepFormState.name.trim(),
            subtitle: stepFormState.subtitle.trim(),
            description: stepFormState.description.trim(),
            criteria: stepFormState.criteria.filter((c) => c.trim().length > 0),
            tips: stepFormState.tips.trim(),
          };
        }
        return s;
      }).sort((a, b) => a.step - b.step);
      saveSteps(updated);
      sound.playSuccessChime();
      showToast(`Step ${editingStep.step} updated!`);
    }

    setEditingStep(null);
    setIsAddingStep(false);
  };

  const handleDeleteStep = (stepNumber: number) => {
    if (steps.length <= 1) {
      alert('You must have at least 1 step in the roadmap.');
      return;
    }
    const updated = steps.filter((s) => s.step !== stepNumber);
    saveSteps(updated);
    if (activeStepId === stepNumber && updated.length > 0) {
      setActiveStepId(updated[0].step);
    }
    showToast(`Step ${stepNumber} removed.`);
  };

  const handleResetSteps = () => {
    saveSteps(PROGRESSION_ROADMAP);
    setActiveStepId(3);
    sound.playSuccessChime();
    showToast('Roadmap progression steps restored to default curriculum!');
  };

  const handleAddCriterion = () => {
    if (!newCriterionInput.trim()) return;
    setStepFormState((prev) => ({
      ...prev,
      criteria: [...prev.criteria, newCriterionInput.trim()],
    }));
    setNewCriterionInput('');
  };

  const handleRemoveCriterion = (index: number) => {
    setStepFormState((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateCriterion = (index: number, val: string) => {
    setStepFormState((prev) => {
      const next = [...prev.criteria];
      next[index] = val;
      return { ...prev, criteria: next };
    });
  };

  // -------------------------------------------------------------
  // 2. GOALS STATE & EDITING
  // -------------------------------------------------------------
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
  const [editingGoal, setEditingGoal] = useState<RoadmapGoal | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState<boolean>(false);

  const [goalFormState, setGoalFormState] = useState<{
    title: string;
    targetMetric: string;
    timeline: string;
    category: 'isometric' | 'hspu' | 'tendon' | 'mobility' | 'custom';
    status: 'pending' | 'in_progress' | 'completed';
    notes: string;
  }>({
    title: '',
    targetMetric: '',
    timeline: '',
    category: 'custom',
    status: 'in_progress',
    notes: '',
  });

  const saveGoals = (updated: RoadmapGoal[]) => {
    setGoals(updated);
    try {
      localStorage.setItem(STORAGE_GOALS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const openEditGoalModal = (goal: RoadmapGoal) => {
    setEditingGoal(goal);
    setIsAddingGoal(false);
    setGoalFormState({
      title: goal.title,
      targetMetric: goal.targetMetric,
      timeline: goal.timeline,
      category: goal.category,
      status: goal.status,
      notes: goal.notes || '',
    });
  };

  const openAddGoalModal = () => {
    setIsAddingGoal(true);
    setEditingGoal(null);
    setGoalFormState({
      title: '',
      targetMetric: '',
      timeline: 'Upcoming 30–60 Days',
      category: 'custom',
      status: 'in_progress',
      notes: '',
    });
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalFormState.title.trim()) return;

    const categoryLabel =
      goalFormState.category === 'isometric'
        ? 'Straight-Arm Isometric'
        : goalFormState.category === 'hspu'
        ? 'Bent-Arm Pressing (HSPU)'
        : goalFormState.category === 'tendon'
        ? 'Tendon & Joint Resilience'
        : goalFormState.category === 'mobility'
        ? 'Active Mobility & Compression'
        : 'Custom Goal';

    if (isAddingGoal) {
      const newGoal: RoadmapGoal = {
        id: `goal-${Date.now()}`,
        category: goalFormState.category,
        categoryLabel,
        title: goalFormState.title.trim(),
        targetMetric: goalFormState.targetMetric.trim() || 'Custom Milestone Target',
        timeline: goalFormState.timeline.trim() || 'Next 30–60 Days',
        status: goalFormState.status,
        notes: goalFormState.notes.trim(),
        isCustom: true,
      };
      saveGoals([newGoal, ...goals]);
      sound.playSuccessChime();
      showToast(`Goal "${newGoal.title}" added!`);
    } else if (editingGoal) {
      const updated = goals.map((g) => {
        if (g.id === editingGoal.id) {
          return {
            ...g,
            category: goalFormState.category,
            categoryLabel,
            title: goalFormState.title.trim(),
            targetMetric: goalFormState.targetMetric.trim(),
            timeline: goalFormState.timeline.trim(),
            status: goalFormState.status,
            notes: goalFormState.notes.trim(),
          };
        }
        return g;
      });
      saveGoals(updated);
      sound.playSuccessChime();
      showToast(`Goal "${goalFormState.title}" updated!`);
    }

    setEditingGoal(null);
    setIsAddingGoal(false);
  };

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

  const handleDeleteGoal = (goalId: string) => {
    saveGoals(goals.filter((g) => g.id !== goalId));
    showToast('Goal removed.');
  };

  const handleResetGoals = () => {
    saveGoals(DEFAULT_ROADMAP_GOALS);
    sound.playSuccessChime();
    showToast('Milestone goals restored to defaults!');
  };

  // Filtered goals
  const filteredGoals = useMemo(() => {
    if (goalCategoryFilter === 'all') return goals;
    if (goalCategoryFilter === 'completed') return goals.filter((g) => g.status === 'completed');
    if (goalCategoryFilter === 'in_progress') return goals.filter((g) => g.status === 'in_progress');
    return goals.filter((g) => g.category === goalCategoryFilter);
  }, [goals, goalCategoryFilter]);

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const inProgressGoals = goals.filter((g) => g.status === 'in_progress').length;
  const goalProgressPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // -------------------------------------------------------------
  // 3. NEXT STEPS DIRECTIVES (EDITABLE)
  // -------------------------------------------------------------
  const [directives, setDirectives] = useState<NextStepDirective[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DIRECTIVES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_NEXT_STEP_DIRECTIVES;
  });

  const [editingDirective, setEditingDirective] = useState<NextStepDirective | null>(null);
  const [directiveFormState, setDirectiveFormState] = useState<{ title: string; description: string }>({
    title: '',
    description: '',
  });

  const saveDirectives = (updated: NextStepDirective[]) => {
    setDirectives(updated);
    try {
      localStorage.setItem(STORAGE_DIRECTIVES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const openEditDirectiveModal = (d: NextStepDirective) => {
    setEditingDirective(d);
    setDirectiveFormState({
      title: d.title,
      description: d.description,
    });
  };

  const handleSaveDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDirective || !directiveFormState.title.trim()) return;

    const updated = directives.map((d) =>
      d.id === editingDirective.id
        ? { ...d, title: directiveFormState.title.trim(), description: directiveFormState.description.trim() }
        : d
    );
    saveDirectives(updated);
    sound.playSuccessChime();
    showToast(`Action Step #${editingDirective.id} updated!`);
    setEditingDirective(null);
  };

  const handleResetDirectives = () => {
    saveDirectives(DEFAULT_NEXT_STEP_DIRECTIVES);
    sound.playSuccessChime();
    showToast('Tactical action steps restored to defaults!');
  };

  // -------------------------------------------------------------
  // 4. NEXT STEPS HEADER (EDITABLE)
  // -------------------------------------------------------------
  const [customNextStepsHeader, setCustomNextStepsHeader] = useState<NextStepsHeaderData | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NEXT_STEPS_HEADER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const activeStepObj = steps.find((s) => s.step === activeStepId);
  const defaultNextStepsHeader = useMemo(
    () => getDefaultNextStepsHeader(activeStepId, activeStepObj?.name, activeStepObj?.description),
    [activeStepId, activeStepObj]
  );

  const currentNextStepsHeader: NextStepsHeaderData = customNextStepsHeader || defaultNextStepsHeader;

  const [isEditingNextStepsHeader, setIsEditingNextStepsHeader] = useState<boolean>(false);
  const [nextStepsHeaderForm, setNextStepsHeaderForm] = useState<NextStepsHeaderData>(defaultNextStepsHeader);

  const openEditNextStepsHeaderModal = () => {
    setNextStepsHeaderForm({ ...currentNextStepsHeader });
    setIsEditingNextStepsHeader(true);
  };

  const handleSaveNextStepsHeader = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: NextStepsHeaderData = {
      ...nextStepsHeaderForm,
      timelineTag: nextStepsHeaderForm.timelineTag.trim() || 'Immediate Focus (Next 2–4 Weeks)',
      protocolBadge: nextStepsHeaderForm.protocolBadge.trim() || `Step ${activeStepId} Protocol`,
      title:
        nextStepsHeaderForm.title.trim() ||
        `${activeStepObj?.name || 'Frog Planche with Raised Legs'} Graduation Protocol`,
      description: nextStepsHeaderForm.description.trim(),
      metric1Label: nextStepsHeaderForm.metric1Label.trim() || 'Current Working Sets',
      metric1Value: nextStepsHeaderForm.metric1Value.trim() || '4–5s Holds',
      metric2Label: nextStepsHeaderForm.metric2Label.trim() || 'Target Graduation',
      metric2Value: nextStepsHeaderForm.metric2Value.trim() || '8s Unbroken',
      metric3Label: nextStepsHeaderForm.metric3Label.trim() || 'Neural Rest',
      metric3Value: nextStepsHeaderForm.metric3Value.trim() || '180s (3 Min)',
      metric4Label: nextStepsHeaderForm.metric4Label.trim() || 'Active Roadmap Step',
      metric4Value: nextStepsHeaderForm.metric4Value.trim() || `Step ${activeStepId}`,
      isCustomized: true,
    };
    setCustomNextStepsHeader(updated);
    try {
      localStorage.setItem(STORAGE_NEXT_STEPS_HEADER_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    sound.playSuccessChime();
    showToast('Next Steps header updated successfully!');
    setIsEditingNextStepsHeader(false);
  };

  const handleResetNextStepsHeader = () => {
    setCustomNextStepsHeader(null);
    try {
      localStorage.removeItem(STORAGE_NEXT_STEPS_HEADER_KEY);
    } catch {
      // ignore
    }
    sound.playSuccessChime();
    showToast('Next Steps header restored to step defaults!');
    setIsEditingNextStepsHeader(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              Systematic progression ladder, measurable milestone goals, and immediate tactical next steps for Straddle Planche & HSPU mastery — all fully customizable and editable.
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
              {steps.length} Steps
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
              {directives.length} Directives
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: PROGRESSION PATH (EDITABLE STEPS)
          ============================================================ */}
      {activeSubTab === 'path' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Biomechanical Progression Ladder
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Each progression increases the forward shoulder torque moment arm. Click any step to set your target, or edit names, criteria, and cues.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openAddStepModal}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>

              <button
                type="button"
                onClick={handleResetSteps}
                title="Reset all progression steps back to original curriculum"
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Target Banner */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-slate-700">Current Working Target:</span>
              <strong className="text-blue-900 font-bold">
                Step {activeStepId}: {steps.find((s) => s.step === activeStepId)?.name || 'Custom Target'}
              </strong>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Click "Set as Current Target" on any step below
            </span>
          </div>

          {/* Steps List */}
          <div className="space-y-5">
            {steps.map((step) => {
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
                        {step.subtitle && <div className="text-xs text-slate-500">{step.subtitle}</div>}
                      </div>
                    </div>

                    {/* Step Action Controls */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStepId(step.step);
                            sound.playSuccessChime();
                            showToast(`Active target set to Step ${step.step}: ${step.name}`);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                        >
                          Set as Target
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditStepModal(step)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        title="Edit step details and graduation criteria"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStep(step.step)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Delete this step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {step.description && (
                    <p className="text-xs sm:text-sm text-slate-700 my-2.5 leading-relaxed pl-11">
                      {step.description}
                    </p>
                  )}

                  {/* Criteria & Coaching Cue */}
                  <div className="pl-11 mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Graduation Test Criteria:</span>
                      </span>
                      {step.criteria.length === 0 ? (
                        <p className="text-slate-400 italic">No criteria specified yet. Click Edit to add checkpoints.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {step.criteria.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-600" />
                          <span>Coaching Point:</span>
                        </span>
                        <p className="text-slate-600 italic leading-relaxed">
                          {step.tips || 'Focus on strict elbow lockout and serratus protraction.'}
                        </p>
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
          MODAL: ADD OR EDIT PROGRESSION STEP
          ============================================================ */}
      {(editingStep || isAddingStep) && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => {
            setEditingStep(null);
            setIsAddingStep(false);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {isAddingStep ? 'Add New Progression Step' : `Edit Step ${editingStep?.step}: ${editingStep?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingStep(null);
                  setIsAddingStep(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStep} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Step #</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={stepFormState.step}
                    onChange={(e) =>
                      setStepFormState((prev) => ({ ...prev, step: parseInt(e.target.value, 10) || 1 }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Step Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Piked Straddle Planche"
                    value={stepFormState.name}
                    onChange={(e) => setStepFormState((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtitle / Posture Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Wide straddle, floating hips level with shoulders"
                  value={stepFormState.subtitle}
                  onChange={(e) => setStepFormState((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biomechanical Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain torque increase, limb position, and straight-arm demands..."
                  value={stepFormState.description}
                  onChange={(e) => setStepFormState((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Graduation Criteria List Builder */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Graduation Criteria (Checkpoints to advance)
                </label>
                <div className="space-y-2 mb-2">
                  {stepFormState.criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={c}
                        onChange={(e) => handleUpdateCriterion(i, e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(i)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                        title="Remove criterion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a new graduation requirement..."
                    value={newCriterionInput}
                    onChange={(e) => setNewCriterionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCriterion();
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coaching Point & Form Cues</label>
                <textarea
                  rows={2}
                  placeholder="Key form cue for safe tendon adaptation..."
                  value={stepFormState.tips}
                  onChange={(e) => setStepFormState((prev) => ({ ...prev, tips: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStep(null);
                    setIsAddingStep(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAddingStep ? 'Create Progression Step' : 'Save Step Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: GOALS (EDITABLE MILESTONES)
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
                Track and customize your straight-arm holds, HSPU pressing, and tendon strength goals. Click any goal checkbox to toggle progress, or click Edit to customize title, target metric, or timeline.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openAddGoalModal}
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

          {/* Goals List */}
          <div className="space-y-3">
            {filteredGoals.map((g) => {
              const isCompleted = g.status === 'completed';
              const isInProgress = g.status === 'in_progress';

              return (
                <div
                  key={g.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group select-none ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : isInProgress
                      ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleGoalStatus(g.id)}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                      title="Click to cycle status (Pending -> In Training -> Achieved)"
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

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-8 sm:pl-0">
                    {/* Status Badge (Click to toggle) */}
                    <button
                      type="button"
                      onClick={() => toggleGoalStatus(g.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-transform active:scale-95 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                          : isInProgress
                          ? 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Click to advance status"
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
                    </button>

                    {/* Edit Goal Button */}
                    <button
                      type="button"
                      onClick={() => openEditGoalModal(g)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Edit this goal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* Delete Goal Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD OR EDIT GOAL
          ============================================================ */}
      {(editingGoal || isAddingGoal) && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => {
            setEditingGoal(null);
            setIsAddingGoal(false);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {isAddingGoal ? 'Add Milestone Goal' : 'Edit Milestone Goal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingGoal(null);
                  setIsAddingGoal(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10s Frog Planche Hold"
                  value={goalFormState.title}
                  onChange={(e) => setGoalFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={goalFormState.category}
                    onChange={(e) => setGoalFormState((prev) => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                  >
                    <option value="isometric">Straight-Arm Isometric</option>
                    <option value="hspu">Bent-Arm Pressing (HSPU)</option>
                    <option value="tendon">Tendon & Joint Resilience</option>
                    <option value="mobility">Active Mobility</option>
                    <option value="custom">Custom Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Status</label>
                  <select
                    value={goalFormState.status}
                    onChange={(e) => setGoalFormState((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                  >
                    <option value="pending">Upcoming / Not Started</option>
                    <option value="in_progress">In Training (Active)</option>
                    <option value="completed">Achieved / Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Metric *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8s unbroken hold, zero elbow micro-bend"
                  value={goalFormState.targetMetric}
                  onChange={(e) => setGoalFormState((prev) => ({ ...prev, targetMetric: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Timeline</label>
                <input
                  type="text"
                  placeholder="e.g. Level 3 · Month 3–5"
                  value={goalFormState.timeline}
                  onChange={(e) => setGoalFormState((prev) => ({ ...prev, timeline: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes & Biomechanical Focus</label>
                <textarea
                  rows={2}
                  placeholder="Additional cues, prerequisites, or equipment..."
                  value={goalFormState.notes}
                  onChange={(e) => setGoalFormState((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(null);
                    setIsAddingGoal(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAddingGoal ? 'Add Goal' : 'Save Goal Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: NEXT STEPS (ACTION PLAN & EDITABLE DIRECTIVES)
          ============================================================ */}
      {activeSubTab === 'next-steps' && (
        <div className="space-y-6">
          {/* Working Zone Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {currentNextStepsHeader.timelineTag}
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    {currentNextStepsHeader.protocolBadge}
                  </span>
                  {customNextStepsHeader && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Customized
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {customNextStepsHeader && (
                    <button
                      type="button"
                      onClick={handleResetNextStepsHeader}
                      title="Reset header back to step defaults"
                      className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Defaults</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openEditNextStepsHeaderModal}
                    title="Edit Next Steps Protocol Header"
                    className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Header</span>
                  </button>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {currentNextStepsHeader.title}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                {currentNextStepsHeader.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/80 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    {currentNextStepsHeader.metric1Label}
                  </span>
                  <strong className="text-white text-sm">{currentNextStepsHeader.metric1Value}</strong>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    {currentNextStepsHeader.metric2Label}
                  </span>
                  <strong className="text-emerald-400 text-sm">{currentNextStepsHeader.metric2Value}</strong>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    {currentNextStepsHeader.metric3Label}
                  </span>
                  <strong className="text-white text-sm">{currentNextStepsHeader.metric3Value}</strong>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    {currentNextStepsHeader.metric4Label}
                  </span>
                  <strong className="text-blue-400 text-sm">{currentNextStepsHeader.metric4Value}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Next Steps Breakdown */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Tactical Action Plan: What To Do In Every Session
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute these primary directives to safely bridge the gap to your next progression milestone. Click Edit on any card to tailor instructions.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDirectives}
                title="Reset directives back to defaults"
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200 self-start sm:self-auto"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {directives.map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 relative group hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {d.id}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{d.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditDirectiveModal(d)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                      title="Edit this tactical action step"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-8">
                    {d.description}
                  </p>
                </div>
              ))}
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

      {/* ============================================================
          MODAL: EDIT DIRECTIVE
          ============================================================ */}
      {editingDirective && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setEditingDirective(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Action Directive #{editingDirective.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDirective(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDirective} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Directive Title *</label>
                <input
                  type="text"
                  required
                  value={directiveFormState.title}
                  onChange={(e) => setDirectiveFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Directive Instructions *</label>
                <textarea
                  rows={4}
                  required
                  value={directiveFormState.description}
                  onChange={(e) => setDirectiveFormState((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDirective(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Directive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EDIT NEXT STEPS HEADER BANNER
          ============================================================ */}
      {isEditingNextStepsHeader && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsEditingNextStepsHeader(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Next Steps Protocol Header
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Customize the working zone timeline tags, title, description, and key performance metrics.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingNextStepsHeader(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNextStepsHeader} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Timeline Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Immediate Focus (Next 2–4 Weeks)"
                    value={nextStepsHeaderForm.timelineTag}
                    onChange={(e) =>
                      setNextStepsHeaderForm((prev) => ({ ...prev, timelineTag: e.target.value }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Protocol Badge *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Step 3 Protocol"
                    value={nextStepsHeaderForm.protocolBadge}
                    onChange={(e) =>
                      setNextStepsHeaderForm((prev) => ({ ...prev, protocolBadge: e.target.value }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Protocol Header Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frog Planche with Raised Legs Graduation Protocol"
                  value={nextStepsHeaderForm.title}
                  onChange={(e) =>
                    setNextStepsHeaderForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Strategic Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Biomechanical working zone objectives, straight-arm goals, connective tissue cues..."
                  value={nextStepsHeaderForm.description}
                  onChange={(e) =>
                    setNextStepsHeaderForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* 4 Metric Cards */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block font-bold text-slate-800 mb-2">Key Metric Cards (4 Slots)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Metric 1 */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Metric 1</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Current Working Sets)"
                      value={nextStepsHeaderForm.metric1Label}
                      onChange={(e) =>
                        setNextStepsHeaderForm((prev) => ({ ...prev, metric1Label: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 4–5s Holds)"
                      value={nextStepsHeaderForm.metric1Value}
                      onChange={(e) =>
                        setNextStepsHeaderForm((prev) => ({ ...prev, metric1Value: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>

                  {/* Metric 2 */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Metric 2</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Target Graduation)"
                      value={nextStepsHeaderForm.metric2Label}
                      onChange={(e) =>
                        setNextStepsHeaderForm((prev) => ({ ...prev, metric2Label: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 8s Unbroken)"
                      value={nextStepsHeaderForm.metric2Value}
                      onChange={(e) =>
                        setNextStepsHeaderForm((prev) => ({ ...prev, metric2Value: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>

                  {/* Metric 3 */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Metric 3</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Neural Rest)"
                      value={nextStepsHeaderForm.metric3Label}
                      onChange={(e) =>
                        setNextStepsHeaderForm((prev) => ({ ...prev, metric3Label: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 180s (3 Min))"
                      value={nextStepsHeaderForm.metric3Value}
                      onChange={(e) =>
                        setNextStepsHeaderForm((prev) => ({ ...prev, metric3Value: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>

                  {/* Metric 4 */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Metric 4</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Active Roadmap Step)"
                      value={nextStepsHeaderForm.metric4Label}
                      onChange={(e) =>
                        setNextStepsHeaderForm((prev) => ({ ...prev, metric4Label: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Step 3)"
                      value={nextStepsHeaderForm.metric4Value}
                      onChange={(e) =>
                        setNextStepsHeaderForm((prev) => ({ ...prev, metric4Value: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetNextStepsHeader}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Step Defaults</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingNextStepsHeader(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Header Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
