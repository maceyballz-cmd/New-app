export interface WeeklyProgressEntry {
  weekNumber: number; // 0 for Start Date, 1..12 for Week 1..12
  weekLabel: string; // "Start Date", "Week 1", etc.
  date: string;
  isMilestone?: boolean; // Highlighted columns like Week 4, 8, 12

  // Measurements & Weight
  weight: string;
  dailyWeighIns?: string[]; // 7 daily AM weigh-ins (lbs) for this week
  chest: string;
  rightArm: string;
  leftArm: string;
  navelAbove: string; // 3 Fingers Above Navel
  navelAt: string; // Stomach at Navel
  navelBelow: string; // 3 Fingers Below Navel
  hips: string;
  rightThigh: string;
  leftThigh: string;
  height: string;
  targetRateWeight: string;
  targetDailySteps: string;
  actualDailySteps: string;

  // Nutrition & Schedule
  trainingTime: string;
  mealTimes: string;
  trainingDayCalories: string;
  trainingDayMacros: string; // "P:180 C:300 F:70"
  restDayCalories: string;
  restDayMacros: string; // "P:180 C:180 F:90"
  calorieAdherence: string;
  trainingAdherence: string;

  // Biofeedback (0-5 scale)
  sleepScore: string;
  stressScore: string;
  hungerScore: string;
  fatigueScore: string;

  // Key Skill / Calisthenics Progress
  keySkillProgress: string;

  // Progress Photos (Base64 data URLs)
  photos: {
    front?: string;
    back?: string;
    leftSide?: string;
    rightSide?: string;
  };
}

export const INITIAL_START_DATE = '2026-10-17';

export function calculateDateForWeek(startDateStr: string, weekNum: number): string {
  try {
    const [y, m, d] = startDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + weekNum * 7);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return `Week ${weekNum}`;
  }
}

export function calculateDateForWeekDay(
  startDateStr: string,
  weekNum: number,
  dayOffset: number
): { shortLabel: string; weekday: string; iso: string; isToday: boolean } {
  try {
    const [y, m, d] = startDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + weekNum * 7 + dayOffset);

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const isoY = date.getFullYear();
    const isoM = String(date.getMonth() + 1).padStart(2, '0');
    const isoD = String(date.getDate()).padStart(2, '0');

    return {
      shortLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      iso: `${isoY}-${isoM}-${isoD}`,
      isToday,
    };
  } catch {
    return {
      shortLabel: `Day ${dayOffset + 1}`,
      weekday: '',
      iso: '',
      isToday: false,
    };
  }
}

export interface SevenDayAverageStats {
  avg: number | null;
  count: number;
  min: number | null;
  max: number | null;
  first: number | null;
  last: number | null;
}

export function calculateSevenDayAverage(weighIns?: string[]): SevenDayAverageStats {
  if (!Array.isArray(weighIns)) {
    return { avg: null, count: 0, min: null, max: null, first: null, last: null };
  }
  const nums = weighIns
    .slice(0, 7)
    .map((val) => parseFloat(String(val ?? '').trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);

  if (nums.length === 0) {
    return { avg: null, count: 0, min: null, max: null, first: null, last: null };
  }

  const sum = nums.reduce((acc, n) => acc + n, 0);
  const avg = sum / nums.length;
  return {
    avg,
    count: nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
    first: nums[0],
    last: nums[nums.length - 1],
  };
}

export function normalizeDailyWeighIns(weighIns?: unknown): string[] {
  const result = ['', '', '', '', '', '', ''];
  if (!Array.isArray(weighIns)) return result;
  for (let i = 0; i < 7; i++) {
    const raw = weighIns[i];
    if (typeof raw === 'string') {
      result[i] = raw;
    } else if (typeof raw === 'number' && !Number.isNaN(raw)) {
      result[i] = String(raw);
    }
  }
  return result;
}

export function generateDefaultProgressEntries(startDateStr: string = INITIAL_START_DATE): WeeklyProgressEntry[] {
  const entries: WeeklyProgressEntry[] = [];

  for (let w = 0; w <= 12; w++) {
    const isStart = w === 0;
    const isMilestone = w === 4 || w === 8 || w === 12;
    const date = calculateDateForWeek(startDateStr, w);

    if (isStart) {
      // Start Date (Week 0) populated with realistic baseline matching the screenshot
      entries.push({
        weekNumber: 0,
        weekLabel: 'Start Date',
        date,
        isMilestone: true,
        weight: '190.1',
        dailyWeighIns: ['', '', '', '', '', '', ''],
        chest: '99.1',
        rightArm: '39.2',
        leftArm: '39.2',
        navelAbove: '84.9',
        navelAt: '88.1',
        navelBelow: '84.6',
        hips: '90.3',
        rightThigh: '64.4',
        leftThigh: '63.1',
        height: '175',
        targetRateWeight: '-1–1.25 lbs / wk',
        targetDailySteps: '8000',
        actualDailySteps: '6740',
        trainingTime: '6:30',
        mealTimes: '12:00, 20:00',
        trainingDayCalories: '2550',
        trainingDayMacros: 'P:180 C:300 F:70',
        restDayCalories: '2250',
        restDayMacros: 'P:180 C:180 F:90',
        calorieAdherence: '104%',
        trainingAdherence: '100%',
        sleepScore: '1',
        stressScore: '0',
        hungerScore: '2',
        fatigueScore: '1',
        keySkillProgress: 'Frog Planche 5s hold',
        photos: {},
      });
    } else if (w === 1) {
      entries.push({
        weekNumber: 1,
        weekLabel: 'Week 1',
        date,
        isMilestone: false,
        weight: '188.9',
        dailyWeighIns: ['', '', '', '', '', '', ''],
        chest: '99.0',
        rightArm: '39.2',
        leftArm: '39.2',
        navelAbove: '84.4',
        navelAt: '87.5',
        navelBelow: '84.1',
        hips: '90.0',
        rightThigh: '64.2',
        leftThigh: '63.0',
        height: '175',
        targetRateWeight: '-1.0 lbs',
        targetDailySteps: '8000',
        actualDailySteps: '7820',
        trainingTime: '6:30',
        mealTimes: '12:00, 20:00',
        trainingDayCalories: '2540',
        trainingDayMacros: 'P:182 C:295 F:71',
        restDayCalories: '2230',
        restDayMacros: 'P:180 C:180 F:88',
        calorieAdherence: '100%',
        trainingAdherence: '100%',
        sleepScore: '1',
        stressScore: '1',
        hungerScore: '1',
        fatigueScore: '1',
        keySkillProgress: 'Frog Planche 5s × 5 sets clean',
        photos: {},
      });
    } else if (w === 2) {
      entries.push({
        weekNumber: 2,
        weekLabel: 'Week 2',
        date,
        isMilestone: false,
        weight: '187.8',
        dailyWeighIns: ['', '', '', '', '', '', ''],
        chest: '98.8',
        rightArm: '39.3',
        leftArm: '39.3',
        navelAbove: '83.9',
        navelAt: '87.0',
        navelBelow: '83.6',
        hips: '89.8',
        rightThigh: '64.0',
        leftThigh: '62.8',
        height: '175',
        targetRateWeight: '-1.1 lbs',
        targetDailySteps: '8000',
        actualDailySteps: '8150',
        trainingTime: '6:30',
        mealTimes: '12:00, 20:00',
        trainingDayCalories: '2550',
        trainingDayMacros: 'P:180 C:300 F:70',
        restDayCalories: '2240',
        restDayMacros: 'P:180 C:180 F:90',
        calorieAdherence: '98%',
        trainingAdherence: '100%',
        sleepScore: '0',
        stressScore: '1',
        hungerScore: '2',
        fatigueScore: '0',
        keySkillProgress: 'Planche Lean 10s × 3 sets',
        photos: {},
      });
    } else {
      // Blank future weeks ready for user logging
      entries.push({
        weekNumber: w,
        weekLabel: `Week ${w}`,
        date,
        isMilestone,
        weight: '',
        dailyWeighIns: ['', '', '', '', '', '', ''],
        chest: '',
        rightArm: '',
        leftArm: '',
        navelAbove: '',
        navelAt: '',
        navelBelow: '',
        hips: '',
        rightThigh: '',
        leftThigh: '',
        height: '175',
        targetRateWeight: '-1.0 lbs',
        targetDailySteps: '8000',
        actualDailySteps: '',
        trainingTime: '6:30',
        mealTimes: '12:00, 20:00',
        trainingDayCalories: '2550',
        trainingDayMacros: 'P:180 C:300 F:70',
        restDayCalories: '2250',
        restDayMacros: 'P:180 C:180 F:90',
        calorieAdherence: '',
        trainingAdherence: '',
        sleepScore: '',
        stressScore: '',
        hungerScore: '',
        fatigueScore: '',
        keySkillProgress: '',
        photos: {},
      });
    }
  }

  return entries;
}

export function generateEmptyProgressEntries(startDateStr: string = INITIAL_START_DATE): WeeklyProgressEntry[] {
  const entries: WeeklyProgressEntry[] = [];
  for (let w = 0; w <= 12; w++) {
    const isStart = w === 0;
    const isMilestone = w === 4 || w === 8 || w === 12;
    const date = calculateDateForWeek(startDateStr, w);

    entries.push({
      weekNumber: w,
      weekLabel: isStart ? 'Start Date' : `Week ${w}`,
      date,
      isMilestone,
      weight: '',
      dailyWeighIns: ['', '', '', '', '', '', ''],
      chest: '',
      rightArm: '',
      leftArm: '',
      navelAbove: '',
      navelAt: '',
      navelBelow: '',
      hips: '',
      rightThigh: '',
      leftThigh: '',
      height: '',
      targetRateWeight: '',
      targetDailySteps: '',
      actualDailySteps: '',
      trainingTime: '',
      mealTimes: '',
      trainingDayCalories: '',
      trainingDayMacros: '',
      restDayCalories: '',
      restDayMacros: '',
      calorieAdherence: '',
      trainingAdherence: '',
      sleepScore: '',
      stressScore: '',
      hungerScore: '',
      fatigueScore: '',
      keySkillProgress: '',
      photos: {},
    });
  }
  return entries;
}

const STORAGE_KEY = 'planche_transformation_progress_data';
const START_DATE_KEY = 'planche_transformation_start_date';

export function getStoredTransformationData(): {
  startDate: string;
  entries: WeeklyProgressEntry[];
} {
  if (typeof window === 'undefined') {
    return { startDate: INITIAL_START_DATE, entries: generateDefaultProgressEntries(INITIAL_START_DATE) };
  }

  const savedDate = localStorage.getItem(START_DATE_KEY) || INITIAL_START_DATE;
  const savedEntries = localStorage.getItem(STORAGE_KEY);

  if (savedEntries) {
    try {
      const parsed = JSON.parse(savedEntries);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.map((entry: WeeklyProgressEntry) => ({
          ...entry,
          dailyWeighIns: normalizeDailyWeighIns(entry.dailyWeighIns),
        }));
        return { startDate: savedDate, entries: normalized };
      }
    } catch {
      // fallback
    }
  }

  return { startDate: savedDate, entries: generateDefaultProgressEntries(savedDate) };
}

export function saveStoredTransformationData(
  startDate: string,
  entries: WeeklyProgressEntry[]
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(START_DATE_KEY, startDate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export interface NutritionHeaderStep {
  stepNumber: 1 | 2 | 3;
  title: string;
  notes: string;
}

export const DEFAULT_NUTRITION_STEPS: NutritionHeaderStep[] = [
  {
    stepNumber: 1,
    title: 'Set Weekly Calorie Targets',
    notes:
      'Enter your weight and activity level below, then pick Even Daily or High/Low Calorie Cycling.',
  },
  {
    stepNumber: 2,
    title: 'Cycle Training & Rest Days',
    notes:
      'Eat higher calories on training days to fuel planche work and lower calories on rest days while hitting your weekly total.',
  },
  {
    stepNumber: 3,
    title: 'Audit Weekly Check-Ins',
    notes:
      'Log morning weight, navel waist, adherence, biofeedback, and 4-angle photos weekly to refine targets.',
  },
];

const NUTRITION_STEPS_KEY = 'planche_nutrition_header_steps';

export function getStoredNutritionSteps(): NutritionHeaderStep[] {
  if (typeof window === 'undefined') return DEFAULT_NUTRITION_STEPS;
  try {
    const raw = localStorage.getItem(NUTRITION_STEPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return ([1, 2, 3] as const).map((num, idx) => ({
          stepNumber: num,
          title:
            typeof parsed[idx]?.title === 'string'
              ? parsed[idx].title
              : DEFAULT_NUTRITION_STEPS[idx].title,
          notes:
            typeof parsed[idx]?.notes === 'string'
              ? parsed[idx].notes
              : DEFAULT_NUTRITION_STEPS[idx].notes,
        }));
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_NUTRITION_STEPS;
}

export function saveStoredNutritionSteps(steps: NutritionHeaderStep[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NUTRITION_STEPS_KEY, JSON.stringify(steps));
  } catch {
    // ignore
  }
}

export type MeasureUnit = 'cm' | 'in';

export const CM_PER_INCH = 2.54;
const MEASURE_UNIT_KEY = 'planche_transformation_measure_unit';

export function parseMeasureUnitFromMode(unitMode?: unknown): MeasureUnit {
  if (typeof unitMode === 'string') {
    const normalized = unitMode.toLowerCase();
    if (normalized === 'in' || normalized === 'lbs_in' || normalized === 'kg_in') {
      return 'in';
    }
  }
  return 'cm';
}

export function toStoredUnitMode(unit: MeasureUnit): 'lbs_cm' | 'lbs_in' {
  return unit === 'in' ? 'lbs_in' : 'lbs_cm';
}

export function getStoredMeasureUnit(): MeasureUnit {
  if (typeof window === 'undefined') return 'cm';
  try {
    const raw = localStorage.getItem(MEASURE_UNIT_KEY);
    return raw === 'in' ? 'in' : 'cm';
  } catch {
    return 'cm';
  }
}

export function saveStoredMeasureUnit(unit: MeasureUnit): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEASURE_UNIT_KEY, unit);
  } catch {
    // ignore
  }
}

export function cmNumberToUnit(cmVal: number, unit: MeasureUnit): number {
  return unit === 'in' ? cmVal / CM_PER_INCH : cmVal;
}

export function formatCmForDisplay(cmRaw: string, unit: MeasureUnit): string {
  const trimmed = String(cmRaw ?? '').trim();
  if (!trimmed) return '';
  if (unit === 'cm') return trimmed;
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return trimmed;
  return (num / CM_PER_INCH).toFixed(1);
}

export function convertInputToCm(inputRaw: string, unit: MeasureUnit): string {
  const trimmed = String(inputRaw ?? '').trim();
  if (!trimmed) return '';
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return trimmed;
  if (unit === 'cm') return trimmed;
  return (num * CM_PER_INCH).toFixed(1);
}

