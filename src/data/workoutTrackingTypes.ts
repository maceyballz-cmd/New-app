export type SessionPerformance = 'Good' | 'Average' | 'Poor';
export type PhysicalFatigue = 'Low' | 'Medium' | 'High';
export type NeuromuscularControl = 'Normal' | 'Reduced' | 'Severely Impaired';
export type SkillPerformance = 'Normal' | 'Reduced' | 'Unable';

export interface TrackingOption<T extends string> {
  value: T;
  label: string;
  description: string;
  tone: 'green' | 'amber' | 'red';
}

export const SESSION_PERFORMANCE_OPTIONS: TrackingOption<SessionPerformance>[] = [
  {
    value: 'Good',
    label: 'Good',
    description: 'Strong session, performed as expected or better.',
    tone: 'green',
  },
  {
    value: 'Average',
    label: 'Average',
    description: 'Mixed performance, some difficulties.',
    tone: 'amber',
  },
  {
    value: 'Poor',
    label: 'Poor',
    description: 'Struggled considerably during the session.',
    tone: 'red',
  },
];

export const PHYSICAL_FATIGUE_OPTIONS: TrackingOption<PhysicalFatigue>[] = [
  {
    value: 'Low',
    label: 'Low',
    description: 'Good energy and physical capacity.',
    tone: 'green',
  },
  {
    value: 'Medium',
    label: 'Medium',
    description: 'Tired, heavy limbs or reduced capacity.',
    tone: 'amber',
  },
  {
    value: 'High',
    label: 'High',
    description: 'Severe fatigue and significantly reduced capacity.',
    tone: 'red',
  },
];

export const NEUROMUSCULAR_CONTROL_OPTIONS: TrackingOption<NeuromuscularControl>[] = [
  {
    value: 'Normal',
    label: 'Normal',
    description: 'Normal coordination and balance.',
    tone: 'green',
  },
  {
    value: 'Reduced',
    label: 'Reduced',
    description: 'Coordination, balance or movement affected.',
    tone: 'amber',
  },
  {
    value: 'Severely Impaired',
    label: 'Severely Impaired',
    description: 'Significant difficulty controlling movements.',
    tone: 'red',
  },
];

export const SKILL_PERFORMANCE_OPTIONS: TrackingOption<SkillPerformance>[] = [
  {
    value: 'Normal',
    label: 'Normal',
    description: 'Skills performed as expected.',
    tone: 'green',
  },
  {
    value: 'Reduced',
    label: 'Reduced',
    description: 'Skills harder than usual.',
    tone: 'amber',
  },
  {
    value: 'Unable',
    label: 'Unable',
    description: 'Unable to safely perform certain skills, such as handstands.',
    tone: 'red',
  },
];

export const NO_UNUSUAL_SYMPTOMS_TAG = 'No unusual symptoms';

export const SYMPTOM_TAGS: string[] = [
  'Muscle soreness',
  'Joint pain',
  'Heavy limbs',
  'Low energy',
  'Dizziness',
  'Poor balance',
  'Muscle weakness',
  'Tics / involuntary movements',
  NO_UNUSUAL_SYMPTOMS_TAG,
];

export function toggleSymptomSelection(current: string[], tag: string): string[] {
  if (tag === NO_UNUSUAL_SYMPTOMS_TAG) {
    return current.includes(NO_UNUSUAL_SYMPTOMS_TAG) ? [] : [NO_UNUSUAL_SYMPTOMS_TAG];
  }
  const withoutNone = current.filter((item) => item !== NO_UNUSUAL_SYMPTOMS_TAG);
  if (withoutNone.includes(tag)) {
    return withoutNone.filter((item) => item !== tag);
  }
  return [...withoutNone, tag];
}

export function getToneBadgeClasses(tone: 'green' | 'amber' | 'red'): string {
  switch (tone) {
    case 'green':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'red':
      return 'bg-rose-50 text-rose-700 border-rose-200';
  }
}

export function getToneDotClasses(tone: 'green' | 'amber' | 'red'): string {
  switch (tone) {
    case 'green':
      return 'bg-emerald-500';
    case 'amber':
      return 'bg-amber-500';
    case 'red':
      return 'bg-rose-500';
  }
}

export function getPerformanceTone(val?: string): 'green' | 'amber' | 'red' | null {
  if (val === 'Good') return 'green';
  if (val === 'Average') return 'amber';
  if (val === 'Poor') return 'red';
  return null;
}

export function getFatigueTone(val?: string): 'green' | 'amber' | 'red' | null {
  if (val === 'Low') return 'green';
  if (val === 'Medium') return 'amber';
  if (val === 'High') return 'red';
  return null;
}

export function getControlTone(val?: string): 'green' | 'amber' | 'red' | null {
  if (val === 'Normal') return 'green';
  if (val === 'Reduced') return 'amber';
  if (val === 'Severely Impaired') return 'red';
  return null;
}

export function getSkillTone(val?: string): 'green' | 'amber' | 'red' | null {
  if (val === 'Normal') return 'green';
  if (val === 'Reduced') return 'amber';
  if (val === 'Unable') return 'red';
  return null;
}

export interface LogEntry {
  id?: string;
  date: string;
  completedSets: number;
  totalSets: number;
  progressPercent: number;
  targetRpe: string;
  notes?: string;
  workoutName?: string;
  workoutIntensity?: string;
  durationMinutes?: number;
  exercises?: string;
  sessionPerformance?: SessionPerformance;
  physicalFatigue?: PhysicalFatigue;
  neuromuscularControl?: NeuromuscularControl;
  skillPerformance?: SkillPerformance;
  symptoms?: string[];
}
