export interface WeeklyProgressEntry {
  weekNumber: number; // 0 for Start Date, 1..12 for Week 1..12
  weekLabel: string; // "Start Date", "Week 1", etc.
  date: string;
  isMilestone?: boolean; // Highlighted columns like Week 4, 8, 12

  // Measurements & Weight
  weight: string;
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
        return { startDate: savedDate, entries: parsed };
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
