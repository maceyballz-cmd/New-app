export type WorkoutType = 'max' | 'submax' | 'recovery' | 'gtg';

export interface Exercise {
  id: string;
  phaseId: number;
  name: string;
  badge: string;
  details: string;
  cues: string;
  targetArea: string;
  defaultSets: number;
  defaultRepsOrSec: string;
  holdSeconds?: number;
  isHold?: boolean;
  restSeconds: number;
  rpe: string;
  coachingPoints: string[];
}

export interface Phase {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  durationEstimate: string;
  description: string;
  exercises: Exercise[];
}

export interface ProgressionStep {
  step: number;
  name: string;
  subtitle: string;
  description: string;
  criteria: string[];
  tips: string;
  isCurrent?: boolean;
}

export interface TrainingRule {
  title: string;
  rule: string;
}

export interface ProgramMeta {
  title: string;
  subtitle: string;
  goal: string;
  timeline: string;
  sessionDuration: string;
  targetRPE: string;
  frequency: string;
  philosophy: string;
}

export interface WorkoutProgram {
  id: WorkoutType;
  name: string;
  intensityLabel: string;
  meta: ProgramMeta;
  rules: TrainingRule[];
  phases: Phase[];
}

export const WORKOUT_TYPES: { id: WorkoutType; label: string; sublabel: string; color: string }[] = [
  {
    id: 'max',
    label: '100% max intensity',
    sublabel: 'Max Effort / Peak Neural Drive Day',
    color: 'amber',
  },
  {
    id: 'submax',
    label: '50 - 60 % Submax intensity',
    sublabel: 'Submaximal Adaptation Baseline',
    color: 'blue',
  },
  {
    id: 'gtg',
    label: 'GTG 20%-30%',
    sublabel: '5-Minute Circuit · 5 Supersets',
    color: 'violet',
  },
  {
    id: 'recovery',
    label: '0%-10% Nothing/Active recovery',
    sublabel: 'Joint Decompression & Flossing',
    color: 'emerald',
  },
];

// 1. DEFAULT SUBMAXIMAL (50-60%) WORKOUT (The Core Baseline Program)
export const DEFAULT_SUBMAX_WORKOUT: WorkoutProgram = {
  id: 'submax',
  name: 'Submaximal Calisthenics Program (50–60%)',
  intensityLabel: '50 - 60 % Submax intensity',
  meta: {
    title: 'Master Calisthenics Program',
    subtitle: 'Straddle Planche & HSPU Submaximal (50–70%) Training Plan',
    goal: 'Straddle Planche & HSPU Mastery',
    timeline: '6–10 Months',
    sessionDuration: '60–75 Minutes',
    targetRPE: '5–7 (Submaximal)',
    frequency: '3–4 Sessions / Week (Alternate Days)',
    philosophy:
      'Submaximal volume allows high-frequency neural adaptation without connective tissue inflammation. Leaving 2–3 reps/seconds in reserve protects distal biceps tendons and the rotator cuff while maximizing quality motor recruitment.',
  },
  rules: [
    {
      title: 'Quality Over Grind',
      rule: 'Finish every set 2–3 reps or seconds before failure. Stop clean. Form breakdown invalidates the neurological adaptation.',
    },
    {
      title: 'Strict Elbow Lock',
      rule: 'On all straight-arm holds (Frog Planche, Planche Leans), elbows must be 100% locked out. Any micro-bend shifts torque directly onto the biceps tendon instead of skeletal alignment.',
    },
    {
      title: '3-Minute Planche Rest',
      rule: 'Take full 3-minute rests on main skill holds (180s). Straight-arm isometric holds demand complete ATP-PC (phosphagen) resynthesis and neural recovery.',
    },
    {
      title: 'Measured Distance Leans',
      rule: 'Keep a fixed tape mark or tile line for your toes. Do not guess lean distance; progressive overload requires measurable centimeters of forward lean.',
    },
  ],
  phases: [
    {
      id: 1,
      title: 'Phase 1: Warm-Up & Joint Prep',
      subtitle: 'Joint activation, rotator cuff priming & wrist conditioning',
      badge: '10–12 Mins',
      durationEstimate: '10–12 Mins',
      description:
        'Perform 1 set of each exercise back-to-back before starting any straight-arm skill work to lubricate wrists, elbows, and prime scapular stabilizers.',
      exercises: [
        {
          id: 'submax-w1',
          phaseId: 1,
          name: 'Band Face Pulls',
          badge: '1 Set × 12–15 Reps | Rest: 30s',
          details: 'External rotation focus with light resistance band at eye level.',
          cues: 'Pull towards forehead, thumbs pointing backward, pinch scapulae firmly at peak contraction.',
          targetArea: 'Rear Delts & Upper Back',
          defaultSets: 1,
          defaultRepsOrSec: '12–15 reps',
          restSeconds: 30,
          rpe: 'RPE 4',
          coachingPoints: [
            'Keep elbows high above wrists at the finish',
            'Focus on external rotator cuff activation',
            'Do not arch lower back',
          ],
        },
        {
          id: 'submax-w2',
          phaseId: 1,
          name: 'Straight-Arm Band Sweeps',
          badge: '1 Set × 8–10 Reps | Rest: 30s',
          details: 'Arm straight, depress and engage lats through full shoulder extension.',
          cues: 'Keep elbows fully locked, depress scapulae downwards towards rear pockets.',
          targetArea: 'Lats & Scapular Control',
          defaultSets: 1,
          defaultRepsOrSec: '8–10 reps',
          restSeconds: 30,
          rpe: 'RPE 4',
          coachingPoints: [
            'Zero bend at the elbow joint',
            'Engage latissimus dorsi to pull band to hips',
            'Slow 2-second return',
          ],
        },
        {
          id: 'submax-w3',
          phaseId: 1,
          name: 'Band Internal & External Rotations',
          badge: '1 Set × 8 Reps / Side | Rest: 30s',
          details: 'Tuck a towel roll under elbow against ribs to isolate the infraspinatus and subscapularis.',
          cues: 'Smooth 90-degree elbow bend, rotate outward cleanly without hiking the shoulder.',
          targetArea: 'Rotator Cuff Health',
          defaultSets: 1,
          defaultRepsOrSec: '8 reps / side',
          restSeconds: 30,
          rpe: 'RPE 4',
          coachingPoints: [
            'Maintain elbow glued to the side',
            'Continuous light tension throughout rotation',
            'Symmetric reps on both left and right',
          ],
        },
        {
          id: 'submax-w4',
          phaseId: 1,
          name: 'Straight-Arm Band Protraction',
          badge: '1 Set × 10–12 Reps | Rest: 30s',
          details: 'Stand facing away or anchored at back, push straight arms forward into full protraction.',
          cues: 'Round the upper back and push hands away using serratus anterior.',
          targetArea: 'Serratus Anterior',
          defaultSets: 1,
          defaultRepsOrSec: '10–12 reps',
          restSeconds: 30,
          rpe: 'RPE 4',
          coachingPoints: [
            'Protraction comes from shoulder blades gliding forward, not hunching neck',
            'Hold peak protraction for 1 full second',
          ],
        },
        {
          id: 'submax-w5',
          phaseId: 1,
          name: 'First-Knuckle Palm Lifts',
          badge: '1 Set × 10 Reps | Rest: 30s',
          details: 'Hands flat on floor in quadruped, lift palms while keeping finger knuckles glued down.',
          cues: 'Push through knuckles like a calf raise for the hand, conditioning finger flexors.',
          targetArea: 'Wrist & Flexor Conditioning',
          defaultSets: 1,
          defaultRepsOrSec: '10 reps',
          restSeconds: 30,
          rpe: 'RPE 4',
          coachingPoints: [
            'Shift body weight forward to increase difficulty gently',
            'Control the descent without slamming palms',
            'Crucial safeguard against wrist sprains',
          ],
        },
        {
          id: 'submax-w6',
          phaseId: 1,
          name: 'Dumbbell Wrist Extension & Flexion',
          badge: '1 Set × 12 Reps (Light) | Rest: 45s',
          details: 'Forearms supported on bench or knee, light 2–5 kg dumbbell.',
          cues: 'Full active range of motion, stretch flexors and extensors smoothly.',
          targetArea: 'Wrist Joint Preparation',
          defaultSets: 1,
          defaultRepsOrSec: '12 reps',
          restSeconds: 45,
          rpe: 'RPE 4',
          coachingPoints: [
            'Perform both extensions (palms down) and curls (palms up)',
            'Never jerk heavy weight; this is synovial fluid lubrication',
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'Phase 2: Straight-Arm Planche Skill Block',
      subtitle: 'Maximal neural drive, isometric straight-arm capacity & serratus locking',
      badge: 'Primary Skill',
      durationEstimate: '20–25 Mins',
      description:
        'The core straight-arm isometric volume of the day. Strict 3-minute rests between sets are mandatory for full central nervous system restoration.',
      exercises: [
        {
          id: 'submax-s1',
          phaseId: 2,
          name: 'Frog Planche with Raised Legs (Primary Hold)',
          badge: '4–5 Sets × 4–5 Sec | Rest: 3 Mins',
          details: 'Submaximal hold time (~50–60% of an 8-second max effort hold).',
          cues: 'Elbows 100% locked straight, knees wide, hips elevated to shoulder height, upper back protracted.',
          targetArea: 'Anterior Deltoids, Serratus, Biceps Tendons',
          defaultSets: 5,
          defaultRepsOrSec: '4–5 sec',
          holdSeconds: 5,
          isHold: true,
          restSeconds: 180,
          rpe: 'RPE 6',
          coachingPoints: [
            'Do NOT rest knees on elbows (that is a crow pose, not a planche)',
            'Arms must be locked rigidly like solid steel pillars',
            'Spread knees wide and actively float feet upward',
            'Stop immediately at 5 seconds while still clean',
          ],
        },
        {
          id: 'submax-s2',
          phaseId: 2,
          name: 'Measured Planche Leans',
          badge: '3 Sets × 8–10 Sec | Rest: 3 Mins',
          details: 'Maintain a fixed toe-mark on the floor for consistent, objective lean depth.',
          cues: 'Tuck tailbone (Posterior Pelvic Tilt), push floor away aggressively, maintain complete elbow extension.',
          targetArea: 'Anterior Delts, Core Compression, Wrist Tolerance',
          defaultSets: 3,
          defaultRepsOrSec: '8–10 sec',
          holdSeconds: 10,
          isHold: true,
          restSeconds: 180,
          rpe: 'RPE 6',
          coachingPoints: [
            'Toes on marked floor tape or wall line',
            'Shoulders must travel significantly forward past wrists',
            'Hollow body position with glutes squeezed tight',
            'Breathe calmly; do not hold breath into extreme blood pressure spikes',
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Phase 3: Overhead Pushing & Skill Precision Block',
      subtitle: 'Bent-arm pressing horsepower, balance control & multi-plane transitions',
      badge: 'Bent-Arm Power',
      durationEstimate: '15–18 Mins',
      description:
        'Vertical pressing builds massive shoulder hypertrophy and clavicular head strength that directly reinforces planche holds.',
      exercises: [
        {
          id: 'submax-p1',
          phaseId: 3,
          name: 'Submaximal Handstand Push-Ups (Wall or Freestanding)',
          badge: '4 Sets × 1–2 Reps | Rest: 2 Mins',
          details: 'Submaximal volume to build overhead pressing capacity without muscle fatigue or failure (or Deficit Pike Push-Ups).',
          cues: '2-second controlled eccentric, tight hollow core, crisp press speed back to top lockout.',
          targetArea: 'Shoulders, Triceps, Upper Trapezius',
          defaultSets: 4,
          defaultRepsOrSec: '1–2 reps',
          restSeconds: 120,
          rpe: 'RPE 5–6',
          coachingPoints: [
            'Tuck elbows at 45 degrees, avoid flaring out to sides',
            'Head travels forward to create a tripod with hands at bottom',
            'Push all the way to active shoulder elevation at lockout',
            'Scale to elevated pike push-ups if wall HSPU exceeds RPE 7',
          ],
        },
        {
          id: 'submax-p2',
          phaseId: 3,
          name: 'Precision Skill Combination Drill',
          badge: '2 Sets × 1 Clean Rep | Rest: 2 Mins',
          details: 'Sequence: L-sit → Tuck Planche Press to Handstand → Controlled Negative descent back to L-sit.',
          cues: 'Pure motor control; end set immediately if execution or speed breaks down.',
          targetArea: 'Full Calisthenics Kinetic Chain',
          defaultSets: 2,
          defaultRepsOrSec: '1 clean combo',
          restSeconds: 120,
          rpe: 'RPE 6',
          coachingPoints: [
            'Hold L-sit for 2 seconds with depressed scapulae',
            'Smooth transition through tuck planche without jumping',
            'Press into handstand with controlled tempo',
            'Lower down with uniform resistance',
          ],
        },
      ],
    },
    {
      id: 4,
      title: 'Phase 4 & 5: Accessories & Tendon Prehab',
      subtitle: 'Scapular motor patterning, posterior chain extension & connective tissue fortification',
      badge: 'Prehab & Hypertrophy',
      durationEstimate: '15–20 Mins',
      description:
        'Essential structural reinforcement. Planche creates immense traction on the distal biceps tendon and anterior capsule; these accessories build bulletproof resilience.',
      exercises: [
        {
          id: 'submax-a1',
          phaseId: 4,
          name: 'Planche Lean Scapular Pushes',
          badge: '3 Sets × 8–10 Reps | Rest: 60–90s',
          details: 'Set up in a moderate planche lean on floor or parallettes.',
          cues: 'Locked straight arms throughout; retract scapulae slowly, then protract hard at top.',
          targetArea: 'Serratus Anterior & Scapular Depressors',
          defaultSets: 3,
          defaultRepsOrSec: '8–10 reps',
          restSeconds: 90,
          rpe: 'RPE 7',
          coachingPoints: [
            'Do not bend elbows even 1 millimeter',
            'Allow chest to sink between shoulder blades (retraction)',
            'Push the floor through the earth to dome the upper back (protraction)',
          ],
        },
        {
          id: 'submax-a2',
          phaseId: 4,
          name: 'Straddle Reverse Hypers / Bench Extensions',
          badge: '3 Sets × 10–12 Reps | Rest: 60s',
          details: 'Lie prone on high bench or table with legs hanging off in wide straddle.',
          cues: 'Squeeze glutes and lower back at top extension to build straddle leg-lifting power.',
          targetArea: 'Gluteus Medius/Maximus, Spinal Erectors, Hamstrings',
          defaultSets: 3,
          defaultRepsOrSec: '10–12 reps',
          restSeconds: 60,
          rpe: 'RPE 7',
          coachingPoints: [
            'Keep legs spread as wide as possible',
            'Lift feet above bench height without excessive lower back hyperextension',
            'This directly powers your future horizontal straddle planche hold',
          ],
        },
        {
          id: 'submax-a3',
          phaseId: 4,
          name: 'Incline Dumbbell Biceps Curls',
          badge: '2–3 Sets × 10–12 Reps | Rest: 60s',
          details: 'Bench angled at 45–60 degrees. Moderate dumbbells.',
          cues: 'Slow 2–3 second negative to condition distal biceps tendons in lengthened position.',
          targetArea: 'Distal Biceps Tendons & Brachialis',
          defaultSets: 3,
          defaultRepsOrSec: '10–12 reps',
          restSeconds: 60,
          rpe: 'RPE 7',
          coachingPoints: [
            'Let arms hang straight down behind torso to place biceps on stretch',
            'Slow eccentric phase is what signals collagen synthesis in tendons',
            'Never drop weights abruptly',
          ],
        },
        {
          id: 'submax-a4',
          phaseId: 4,
          name: 'Bodyweight / Overhead Triceps Extensions',
          badge: '2–3 Sets × 10–12 Reps | Rest: 60s',
          details: 'Using barbell in rack, rings, or overhead dumbbell.',
          cues: 'Smooth tempo, full extension and crisp lockout at top.',
          targetArea: 'Triceps Long Head & Tendon Strength',
          defaultSets: 3,
          defaultRepsOrSec: '10–12 reps',
          restSeconds: 60,
          rpe: 'RPE 7',
          coachingPoints: [
            'Keep elbows tucked in, do not let them flare wide',
            'Pause for 1 second in locked extension',
          ],
        },
      ],
    },
  ],
};

// 2. DEFAULT 100% MAX INTENSITY WORKOUT (Testing / High Neural Drive)
export const DEFAULT_MAX_WORKOUT: WorkoutProgram = {
  id: 'max',
  name: '100% Max Intensity Testing & Neural Overload',
  intensityLabel: '100% max intensity',
  meta: {
    title: '100% Max Intensity Planche & HSPU Protocol',
    subtitle: 'Max Effort Testing, Peak Force Generation & Neural Benchmark Day',
    goal: 'Max Hold Benchmarks & High-Threshold Motor Unit Recruitment',
    timeline: '1x Every 10–14 Days',
    sessionDuration: '65–80 Minutes',
    targetRPE: '9–10 (Maximal Effort)',
    frequency: 'Once every 10–14 days (or test week)',
    philosophy:
      'Maximal effort testing exposes true technical breakdown thresholds and tests graduation readiness for subsequent progressions. Rest intervals are extended to 4–5 minutes for full central nervous system restoration, with reduced volume to prevent tissue failure.',
  },
  rules: [
    {
      title: 'Full 4–5 Minute Neural Rest',
      rule: 'Maximal isometric straight-arm output completely drains intracellular phosphocreatine and central drive. Never rush attempts.',
    },
    {
      title: 'Technical Failure Cutoff',
      rule: 'Terminate max holds the instant elbows micro-bend or hips drop below shoulder level. Grinding with collapsed scapulae causes acute biceps strain.',
    },
    {
      title: 'Video Every Max Attempt',
      rule: 'Film your holds from 90° side profile. Subjective perception during max exertion often hallucinates horizontal body alignment.',
    },
    {
      title: 'Extended High-Potentiation Warmup',
      rule: 'Spend at least 15 minutes preparing the nervous system and distal tendon sheaths before touching maximal loads.',
    },
  ],
  phases: [
    {
      id: 1,
      title: 'Phase 1: High-Potentiation Joint Priming',
      subtitle: 'CNS activation, wrist pre-loading & serratus potentiation',
      badge: '12–15 Mins',
      durationEstimate: '12–15 Mins',
      description:
        'Thorough progressive loading to elevate nervous system excitability and synovial temperature before maximal isometric strain.',
      exercises: [
        {
          id: 'max-w1',
          phaseId: 1,
          name: 'High-Tension Band Pull-Aparts',
          badge: '2 Sets × 10 Reps | Rest: 45s',
          details: 'Heavy band pulled across upper chest with maximum scapular pinch.',
          cues: 'Zero momentum; squeeze upper back with 2s hold at peak contraction.',
          targetArea: 'Rhomboids, Middle Trapezius & Rear Deltoids',
          defaultSets: 2,
          defaultRepsOrSec: '10 reps',
          restSeconds: 45,
          rpe: 'RPE 5',
          coachingPoints: ['Keep neck relaxed', 'Pinch shoulder blades hard'],
        },
        {
          id: 'max-w2',
          phaseId: 1,
          name: 'Progressive Loaded Wrist Extension & Rockers',
          badge: '2 Sets × 10 Reps | Rest: 45s',
          details: 'Quadruped wrist rockers with bodyweight leaning progressively forward.',
          cues: 'Keep arms fully locked, pulse forward gently into deep wrist extension.',
          targetArea: 'Forearm Flexors & Wrist Joint Capsule',
          defaultSets: 2,
          defaultRepsOrSec: '10 reps',
          restSeconds: 45,
          rpe: 'RPE 5',
          coachingPoints: ['Grip floor with fingertips', 'Do not bounce aggressively'],
        },
        {
          id: 'max-w3',
          phaseId: 1,
          name: 'Scapular Wall Slides with Bands',
          badge: '2 Sets × 8 Reps | Rest: 45s',
          details: 'Forearms on wall with mini-band around wrists, sliding upwards.',
          cues: 'Maintain outward band tension; feel serratus anterior burning.',
          targetArea: 'Serratus Anterior & Scapular Upward Rotators',
          defaultSets: 2,
          defaultRepsOrSec: '8 reps',
          restSeconds: 45,
          rpe: 'RPE 5',
          coachingPoints: ['Stay in posterior pelvic tilt', 'Push elbows outward'],
        },
      ],
    },
    {
      id: 2,
      title: 'Phase 2: 100% Maximal Planche Testing Block',
      subtitle: 'True maximal duration test & peak forward lean limit',
      badge: 'Max Testing',
      durationEstimate: '25–30 Mins',
      description:
        'The ultimate testing block. Each attempt is performed to clean technical maximum, followed by full 4–5 minute passive recovery.',
      exercises: [
        {
          id: 'max-s1',
          phaseId: 2,
          name: '100% Max Frog Planche / Piked Straddle Test',
          badge: '3 Sets × Max Clean Sec | Rest: 4–5 Mins',
          details: 'Perform a clean, unbroken hold to technical failure (stop when form breaks).',
          cues: 'Squeeze glutes with maximum force; dome upper back; lock elbows 100% straight; breathe in short pulses.',
          targetArea: 'Maximum Anterior Deltoid & Serratus Force',
          defaultSets: 3,
          defaultRepsOrSec: 'Max Sec (RPE 9.5)',
          holdSeconds: 8,
          isHold: true,
          restSeconds: 240,
          rpe: 'RPE 9.5',
          coachingPoints: [
            'Record on camera to check horizontal hip height',
            'Stop immediately when elbows begin to shake or bend',
            'Take full 4–5 minutes before next attempt',
          ],
        },
        {
          id: 'max-s2',
          phaseId: 2,
          name: 'Max-Distance Planche Lean Limit Hold',
          badge: '3 Sets × 10–12 Sec (Max Lean) | Rest: 4 Mins',
          details: 'Lean forward to the absolute threshold where feet are on the verge of floating off the floor.',
          cues: 'Full PPT hollow body; crush floor into ground; maximize distance past wrists.',
          targetArea: 'Anterior Delts, Biceps Tendon Tensile Strength',
          defaultSets: 3,
          defaultRepsOrSec: '10–12 sec',
          holdSeconds: 12,
          isHold: true,
          restSeconds: 240,
          rpe: 'RPE 9',
          coachingPoints: [
            'Mark new personal record distance on the floor',
            'Push shoulders forward past knuckles',
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Phase 3: Maximal Overhead Pushing Capacity',
      subtitle: 'High-load vertical pressing & max rep output',
      badge: 'Max Pushing',
      durationEstimate: '15–20 Mins',
      description:
        'Testing peak vertical pressing horsepower to evaluate shoulder pressing reserve.',
      exercises: [
        {
          id: 'max-p1',
          phaseId: 3,
          name: 'Max Rep Strict Wall / Freestanding HSPU',
          badge: '3 Sets × Max Clean Reps | Rest: 3 Mins',
          details: 'Test clean repetition capacity with full range of motion touching nose to floor.',
          cues: 'Controlled eccentric, explode upward with maximum pressing speed to full lockout.',
          targetArea: 'Shoulders, Triceps & Upper Trapezius',
          defaultSets: 3,
          defaultRepsOrSec: 'Max reps',
          restSeconds: 180,
          rpe: 'RPE 9',
          coachingPoints: [
            'Tuck elbows 45 degrees',
            'Push head through arms at the top',
          ],
        },
        {
          id: 'max-p2',
          phaseId: 3,
          name: 'Freestanding Handstand Max Balance Hold',
          badge: '3 Sets × Max Sec | Rest: 2 Mins',
          details: 'Balance focus with straight line from wrists through toes.',
          cues: 'Push through fingertips; tight hollow core; active shoulder elevation.',
          targetArea: 'Wrist Micro-Adjusters & Balance System',
          defaultSets: 3,
          defaultRepsOrSec: '30–60 sec',
          restSeconds: 120,
          rpe: 'RPE 7',
          coachingPoints: ['Breathe evenly', 'Look between hands'],
        },
      ],
    },
    {
      id: 4,
      title: 'Phase 4 & 5: Heavy Eccentric & Tendon Overload',
      subtitle: 'High-tension eccentric loading for tendon stiffness',
      badge: 'Heavy Overload',
      durationEstimate: '12–15 Mins',
      description:
        'Controlled heavy eccentric contractions stimulate tendon thickening and structural collagen alignment.',
      exercises: [
        {
          id: 'max-a1',
          phaseId: 4,
          name: 'Heavy 4-Second Eccentric Incline DB Curls',
          badge: '3 Sets × 6–8 Reps | Rest: 90s',
          details: 'Heavier dumbbell load with strict 4-second lowering phase.',
          cues: 'Control every millimeter of the descent; pause in deep stretch at bottom.',
          targetArea: 'Distal Biceps Tendons & Brachialis',
          defaultSets: 3,
          defaultRepsOrSec: '6–8 reps',
          restSeconds: 90,
          rpe: 'RPE 8.5',
          coachingPoints: [
            'Slow 4s descent triggers maximum tenocyte activation',
            'Do not bounce at bottom',
          ],
        },
        {
          id: 'max-a2',
          phaseId: 4,
          name: 'Weighted / Banded Straddle Hyperextensions',
          badge: '3 Sets × 8–10 Reps | Rest: 90s',
          details: 'Straddle hip extension with resistance band or light plate.',
          cues: 'Explode up, squeeze glutes hard for 2 seconds at peak straddle extension.',
          targetArea: 'Gluteus Medius, Lower Spinal Erectors',
          defaultSets: 3,
          defaultRepsOrSec: '8–10 reps',
          restSeconds: 90,
          rpe: 'RPE 8',
          coachingPoints: ['Spread legs wide', 'Zero lower back jerking'],
        },
      ],
    },
  ],
};

// 3. DEFAULT 0%-10% NOTHING/ACTIVE RECOVERY WORKOUT (Rest & Restoration)
export const DEFAULT_RECOVERY_WORKOUT: WorkoutProgram = {
  id: 'recovery',
  name: 'Active Recovery & Tendon Regeneration (0–10%)',
  intensityLabel: '0%-10% Nothing/Active recovery',
  meta: {
    title: 'Active Recovery & Joint Restoration Protocol',
    subtitle: '0–10% Active Decompression, Wrist Therapy & Synovial Fluid Flossing',
    goal: 'Accelerated Collagen Synthesis, Lymphatic Drainage & Nervous System Reset',
    timeline: 'Off-Days & Rest Days',
    sessionDuration: '25–35 Minutes',
    targetRPE: 'RPE 1–2 (Zero Strain)',
    frequency: '2–3 Times / Week on Rest Days',
    philosophy:
      'Connective tissues (distal biceps tendons, rotator cuffs, wrist retinacula) possess minimal vascularity compared to skeletal muscle. Gentle movement, tendon flossing, isometric glides, and decompression pump synovial fluid into joints without incurring muscular fatigue or CNS depletion.',
  },
  rules: [
    {
      title: 'Zero Muscular Burn',
      rule: 'If you feel lactic acid accumulation, muscle trembling, or elevated heart rate, reduce resistance immediately. This is pure restorative therapy.',
    },
    {
      title: 'Deep Parasympathetic Breathing',
      rule: 'Inhale for 4 seconds through the nose, exhale for 6–8 seconds through mouth. This downregulates the sympathetic nervous system and enhances healing.',
    },
    {
      title: 'Continuous Synovial Flossing',
      rule: 'Keep all movements fluid, gentle, and unhurried. Focus on joint lubrication rather than end-range stretching strain.',
    },
    {
      title: 'Total Rest Mindset',
      rule: 'Do not turn recovery days into sneak workouts. Active recovery preserves your readiness for the next submaximal session.',
    },
  ],
  phases: [
    {
      id: 1,
      title: 'Phase 1: Wrist & Forearm Decompression',
      subtitle: 'Carpal tunnel decompression, gentle knuckle lifts & wrist circles',
      badge: '8–10 Mins',
      durationEstimate: '8–10 Mins',
      description:
        'Relieves deep compression from forward leans and hand balancing. Increases circulation to forearm flexors and median nerve pathway.',
      exercises: [
        {
          id: 'rec-w1',
          phaseId: 1,
          name: 'Slow Wrist Circles & Figure-8s',
          badge: '1 Set × 15 Reps / Direction | Rest: None',
          details: 'Interlock fingers and rotate wrists in smooth, fluid circles.',
          cues: 'Move through full circular range without cracking or forcing.',
          targetArea: 'Wrist Articular Lubrication',
          defaultSets: 1,
          defaultRepsOrSec: '15 reps each way',
          restSeconds: 0,
          rpe: 'RPE 1',
          coachingPoints: ['Breathe deeply', 'Relax shoulders entirely'],
        },
        {
          id: 'rec-w2',
          phaseId: 1,
          name: 'Gentle Kneeling Prayer Stretch & Reverse Prayer',
          badge: '2 Sets × 30 Sec | Rest: 30s',
          details: 'Hands pressed in prayer position at chest height, then reversed palms together.',
          cues: 'Gentle traction, feeling a pleasant stretch in flexors and extensors.',
          targetArea: 'Wrist Flexor & Extensor Sheaths',
          defaultSets: 2,
          defaultRepsOrSec: '30 sec hold',
          holdSeconds: 30,
          isHold: true,
          restSeconds: 30,
          rpe: 'RPE 1',
          coachingPoints: ['Do not force elbows down', 'Breathe calmly'],
        },
        {
          id: 'rec-w3',
          phaseId: 1,
          name: 'Light First-Knuckle Glides (Low Load)',
          badge: '2 Sets × 10 Reps | Rest: 30s',
          details: 'Hands on floor with knees directly under hips (minimal bodyweight).',
          cues: 'Lift palms gently without weight, massaging the base of the fingers.',
          targetArea: 'Intrinsic Hand Muscles & Tendon Gliding',
          defaultSets: 2,
          defaultRepsOrSec: '10 smooth reps',
          restSeconds: 30,
          rpe: 'RPE 1',
          coachingPoints: ['Zero pain', 'Smooth lifting and lowering'],
        },
      ],
    },
    {
      id: 2,
      title: 'Phase 2: Scapular Mobility & Thoracic Glides',
      subtitle: 'Restoring thoracic extension, serratus gliding & ribcage expansion',
      badge: '8–10 Mins',
      durationEstimate: '8–10 Mins',
      description:
        'Counteracts the rounded protracted posture of planche by opening the thoracic spine and gently mobilizing the scapulae.',
      exercises: [
        {
          id: 'rec-s1',
          phaseId: 2,
          name: 'Quadruped Cat-Cow with Scapular Waves',
          badge: '2 Sets × 8 Slow Reps | Rest: 30s',
          details: 'Move smoothly between full spinal flexion and gentle thoracic extension.',
          cues: 'Inhale into cow pose, exhale and glide shoulder blades into cat protraction.',
          targetArea: 'Spine, Serratus & Rhomboid Gliding',
          defaultSets: 2,
          defaultRepsOrSec: '8 slow breaths',
          restSeconds: 30,
          rpe: 'RPE 1',
          coachingPoints: ['Synchronize with breathing', 'Feel fluid movement across every vertebra'],
        },
        {
          id: 'rec-s2',
          phaseId: 2,
          name: 'Wall Angel Scapular Glides',
          badge: '2 Sets × 10 Reps | Rest: 30s',
          details: 'Back flat against wall, slide elbows and back of hands up and down.',
          cues: 'Keep lower back glued to wall; glide shoulder blades along ribcage.',
          targetArea: 'Thoracic Mobility & Lower Trapezius Activation',
          defaultSets: 2,
          defaultRepsOrSec: '10 reps',
          restSeconds: 30,
          rpe: 'RPE 1',
          coachingPoints: ['Do not arch lower back away from wall', 'Relax neck muscles'],
        },
      ],
    },
    {
      id: 3,
      title: 'Phase 3: Rotator Cuff & Distal Biceps Therapy',
      subtitle: 'Gentle band traction, passive hanging & restorative biceps flow',
      badge: '8 Mins',
      durationEstimate: '8 Mins',
      description:
        'Light passive hanging decompresses the glenohumeral joint and creates gentle traction on the distal biceps tendon insertion.',
      exercises: [
        {
          id: 'rec-p1',
          phaseId: 3,
          name: 'Passive Bar Hang with Supported Feet',
          badge: '3 Sets × 30–45 Sec | Rest: 45s',
          details: 'Hang from pull-up bar with toes lightly touching ground to regulate traction.',
          cues: 'Let bodyweight decompress the shoulders and spine; breathe into the belly.',
          targetArea: 'Subacromial Space Decompression & Biceps Long Head',
          defaultSets: 3,
          defaultRepsOrSec: '30–45 sec',
          holdSeconds: 45,
          isHold: true,
          restSeconds: 45,
          rpe: 'RPE 1',
          coachingPoints: ['Completely relax lat muscles', 'Feel space opening in shoulder joint'],
        },
        {
          id: 'rec-p2',
          phaseId: 3,
          name: 'Ultra-Light Band External Rotations (Blood Flow)',
          badge: '2 Sets × 15 Reps / Side | Rest: 30s',
          details: 'Very thin resistance band, pumping fresh oxygenated blood to the infraspinatus.',
          cues: 'Effortless fluid rotation with zero fatigue.',
          targetArea: 'Infraspinatus & Teres Minor Capillary Perfusion',
          defaultSets: 2,
          defaultRepsOrSec: '15 reps / side',
          restSeconds: 30,
          rpe: 'RPE 2',
          coachingPoints: ['Pure blood pumping', 'Zero burn'],
        },
      ],
    },
    {
      id: 4,
      title: 'Phase 4: Straddle Flexibility & Hip Decompression',
      subtitle: 'Pancake stretch, butterfly pulses & adductor relaxation',
      badge: '8 Mins',
      durationEstimate: '8 Mins',
      description:
        'Wide straddle flexibility drastically shortens the mechanical lever arm for the future straddle planche.',
      exercises: [
        {
          id: 'rec-a1',
          phaseId: 4,
          name: 'Seated Straddle Pancake Relaxed Stretch',
          badge: '2 Sets × 45–60 Sec | Rest: 45s',
          details: 'Sit on floor in wide V-straddle, fold forward with hands supported on block or floor.',
          cues: 'Never bounce; relax adductors and hamstrings on each long out-breath.',
          targetArea: 'Adductors, Hamstrings & Pelvic Openers',
          defaultSets: 2,
          defaultRepsOrSec: '45–60 sec',
          holdSeconds: 60,
          isHold: true,
          restSeconds: 45,
          rpe: 'RPE 2',
          coachingPoints: ['Tilt pelvis forward', 'Keep kneecaps pointing up towards ceiling'],
        },
        {
          id: 'rec-a2',
          phaseId: 4,
          name: 'Prone Frog Stretch & Adductor Flossing',
          badge: '2 Sets × 45 Sec | Rest: 30s',
          details: 'On hands and knees, spread knees wide and gently rock hips backward.',
          cues: 'Gentle opening through inner thighs and hip capsules.',
          targetArea: 'Hip Capsule Mobility & Groin Flexibility',
          defaultSets: 2,
          defaultRepsOrSec: '45 sec hold',
          holdSeconds: 45,
          isHold: true,
          restSeconds: 30,
          rpe: 'RPE 2',
          coachingPoints: ['Keep feet turned out parallel to knees', 'Breathe deeply into pelvis'],
        },
      ],
    },
  ],
};

// 4. GTG 20%-30% WORKOUT (5-Minute Superset Circuit)
export const DEFAULT_GTG_WORKOUT: WorkoutProgram = {
  id: 'gtg',
  name: 'GTG 20%-30% (5-Minute Circuit)',
  intensityLabel: 'GTG 20%-30%',
  meta: {
    title: 'GTG 20%-30% 5-Minute Circuit Protocol',
    subtitle: 'Grease the Groove (GTG) 5-Minute Neural Superset Circuit · 5 Exercises',
    goal: 'Neurological Motor Patterning & Frequent Sub-Fatigue Grooving',
    timeline: 'Daily Micro-Sessions (Ongoing)',
    sessionDuration: '5 Minutes',
    targetRPE: 'RPE 2–3 (20%–30% GTG)',
    frequency: '1–4 Micro-Sessions / Day (Spaced 2–4 Hours)',
    philosophy:
      'Grease the Groove (GTG) at 20%–30% sub-fatigue intensity conditions the central nervous system without causing muscular micro-trauma or tendon inflammation. By chaining 5 complementary calisthenics exercises in a continuous 5-minute superset circuit, you groove the motor pathways for straight-arm planche holds, vertical pressing alignment, and scapular protraction while remaining completely fresh.',
  },
  rules: [
    {
      title: 'Continuous Superset Flow',
      rule: 'Execute the 5 exercises back-to-back as a seamless superset circuit with only 10–15s transition between movements. Complete 2 brisk rounds in 5 minutes.',
    },
    {
      title: 'Zero Fatigue / Never Grind',
      rule: 'Every repetition and hold must feel crisp, light, and effortless. Always terminate each set leaving 70%–80% in reserve. Never test maxes in GTG.',
    },
    {
      title: 'Laser Form & 100% Lockout',
      rule: 'Low intensity is not sloppy execution. Lock straight arms completely, protract scapulae actively, and maintain strict posterior pelvic tilt on every second.',
    },
    {
      title: 'Anytime Micro-Dosing',
      rule: 'This 5-minute circuit can be performed anytime during the day (e.g., between work tasks or as a morning primer) without interfering with your main workout sessions.',
    },
  ],
  phases: [
    {
      id: 1,
      title: 'Phase 1: 5-Minute GTG Superset Circuit (5 Exercises)',
      subtitle: 'Continuous non-fatigue superset circuit · 2 quick rounds · 5 minutes total',
      badge: '5-Min Circuit',
      durationEstimate: '5 Mins',
      description:
        'Execute all 5 exercises consecutively as a continuous superset circuit. Perform 2 rapid rounds with 10–15s transitions between exercises. Stay strictly at 20%–30% effort with zero shaking or strain.',
      exercises: [
        {
          id: 'gtg-e1',
          phaseId: 1,
          name: 'Frog Planche / Low-Lever Lean Hold',
          badge: 'Superset (A1/5) · 2 Sets × 3–4 Sec Hold | Rest: 15s',
          details: 'Submaximal straight-arm isometric groove. Knees elevated wide or light forward lean on parallettes.',
          cues: '100% straight locked elbows, active serratus doming, stop while feeling completely fresh.',
          targetArea: 'Straight-Arm Planche Neural Groove & Serratus Lockout',
          defaultSets: 2,
          defaultRepsOrSec: '3–4 sec hold',
          holdSeconds: 4,
          isHold: true,
          restSeconds: 15,
          rpe: 'RPE 2–3',
          coachingPoints: [
            'Zero elbow micro-bend',
            'Leave at least 5–6 seconds in reserve',
            'Focus on clean scapular protraction',
          ],
        },
        {
          id: 'gtg-e2',
          phaseId: 1,
          name: 'Elevated Pike / Wall Handstand Alignment Hold',
          badge: 'Superset (A2/5) · 2 Sets × 5–6 Sec Hold | Rest: 15s',
          details: 'Overhead vertical pressing groove. Feet elevated on box or against wall in stacked line.',
          cues: 'Push ground away vigorously, shrug shoulders to ears, lock ribcage and hollow core.',
          targetArea: 'Vertical Overhead Pressing Pathway & Shoulder Elevation',
          defaultSets: 2,
          defaultRepsOrSec: '5–6 sec hold',
          holdSeconds: 6,
          isHold: true,
          restSeconds: 15,
          rpe: 'RPE 2–3',
          coachingPoints: [
            'Stack wrists, shoulders, and hips',
            'Active shoulder elevation at the top',
            'Smooth nasal breathing',
          ],
        },
        {
          id: 'gtg-e3',
          phaseId: 1,
          name: 'Scapular Push-Up Protraction Pulses',
          badge: 'Superset (A3/5) · 2 Sets × 6–8 Reps | Rest: 15s',
          details: 'Straight-arm scapular isolation on floor or push-up bars.',
          cues: 'Keep elbows completely straight. Glide scapulae through retraction and push up into maximal dome.',
          targetArea: 'Serratus Anterior & Scapular Gliding Mechanics',
          defaultSets: 2,
          defaultRepsOrSec: '6–8 reps',
          restSeconds: 15,
          rpe: 'RPE 2–3',
          coachingPoints: [
            'Movement occurs exclusively at the shoulder blades',
            'Pause for 1 second in peak protraction',
            'No sagging in lower spine',
          ],
        },
        {
          id: 'gtg-e4',
          phaseId: 1,
          name: 'Hollow Body Straddle Compression Pulse',
          badge: 'Superset (A4/5) · 2 Sets × 8–10 Sec Hold | Rest: 15s',
          details: 'Supine compression hold. Lower back pressed into floor, legs spread in wide straddle.',
          cues: 'Posterior pelvic tilt (PPT), squeeze quads, reach fingers forward between straddle legs.',
          targetArea: 'Transverse Abdominis, Hip Flexor Compression & PPT Lock',
          defaultSets: 2,
          defaultRepsOrSec: '8–10 sec hold',
          holdSeconds: 10,
          isHold: true,
          restSeconds: 15,
          rpe: 'RPE 2–3',
          coachingPoints: [
            'Zero air gap under lower back',
            'Point toes and lock knees straight',
            'Effortless sub-fatigue compression',
          ],
        },
        {
          id: 'gtg-e5',
          phaseId: 1,
          name: 'First-Knuckle Planche Weight Shifts',
          badge: 'Superset (A5/5) · 2 Sets × 5–6 Reps | Rest: 30s',
          details: 'Quadruped or plank position, gentle forward lean past wrist crease with active knuckle press.',
          cues: 'Claw floor with fingertips, gentle lean forward and return without joint discomfort.',
          targetArea: 'Distal Biceps Tendons & Wrist Sheath Resilience',
          defaultSets: 2,
          defaultRepsOrSec: '5–6 reps',
          restSeconds: 30,
          rpe: 'RPE 2–3',
          coachingPoints: [
            'Elbow pits rotated forward',
            'Synovial fluid pumping without fatigue',
            'Completes 1 full round of the superset circuit',
          ],
        },
      ],
    },
  ],
};

// STORAGE HELPERS
const STORAGE_KEY_PREFIX = 'planche_custom_workout_';

export function getWorkoutProgram(type: WorkoutType): WorkoutProgram {
  if (typeof window === 'undefined') {
    return getInitialDefault(type);
  }
  const key = `${STORAGE_KEY_PREFIX}${type}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.phases && parsed.meta) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  return getInitialDefault(type);
}

export function saveWorkoutProgram(workout: WorkoutProgram): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_KEY_PREFIX}${workout.id}`;
  localStorage.setItem(key, JSON.stringify(workout));
}

export function resetWorkoutProgram(type: WorkoutType): WorkoutProgram {
  if (typeof window !== 'undefined') {
    const key = `${STORAGE_KEY_PREFIX}${type}`;
    localStorage.removeItem(key);
  }
  return getInitialDefault(type);
}

function getInitialDefault(type: WorkoutType): WorkoutProgram {
  switch (type) {
    case 'max':
      return JSON.parse(JSON.stringify(DEFAULT_MAX_WORKOUT));
    case 'recovery':
      return JSON.parse(JSON.stringify(DEFAULT_RECOVERY_WORKOUT));
    case 'gtg':
      return JSON.parse(JSON.stringify(DEFAULT_GTG_WORKOUT));
    case 'submax':
    default:
      return JSON.parse(JSON.stringify(DEFAULT_SUBMAX_WORKOUT));
  }
}

// Global static Progression Roadmap
export const PROGRESSION_ROADMAP: ProgressionStep[] = [
  {
    step: 1,
    name: 'Tuck Planche',
    subtitle: 'Knees compressed tight to chest, hips level with shoulders',
    description: 'The baseline foundation for straight-arm pushing strength and serratus protraction.',
    criteria: [
      '15s solid hold with zero elbow micro-bend',
      'Protracted upper back (no sagging scapulae)',
      'Posterior pelvic tilt established',
    ],
    tips: 'Focus on protracting as hard as possible. If hips sit below shoulders, lean slightly further forward.',
  },
  {
    step: 2,
    name: 'Advanced Tuck Planche',
    subtitle: '90° angle at hips and knees, flat back parallel to floor',
    description: 'Extends the lever arm by moving knees away from chest, doubling forward shoulder torque.',
    criteria: [
      '10–12s clean hold with flat spine',
      'Elbow pits rotated forward 45°',
      'Neutral head position',
    ],
    tips: 'Keep your lower back flat, not rounded into a ball. Do not let elbows bend.',
  },
  {
    step: 3,
    name: 'Frog Planche with Raised Legs',
    subtitle: 'Current Program Step — Knees wide, floating legs, 100% straight arms',
    description: 'Submaximal working zone. Spreading knees opens the straddle pathway while elevating feet off elbows.',
    criteria: [
      '8s max hold capability (trained at 4–5s sets)',
      'Arms completely decoupled from knees',
      'Active serratus anterior doming',
    ],
    tips: 'Crucial rule: Arms must NOT touch inner thighs. This is true straight-arm floating balance.',
    isCurrent: true,
  },
  {
    step: 4,
    name: 'Piked Straddle Planche',
    subtitle: 'Legs kicked out into wide straddle with hips elevated above shoulders',
    description: 'Legs are fully straight in a wide V-straddle. Hips remain piked high to reduce torque before lowering.',
    criteria: [
      '6–8s hold with straight knees and pointed toes',
      'Glute engagement lifting straddle legs',
      'Controlled slow descent into hold',
    ],
    tips: 'Wider straddle drastically shortens the lever arm. Work on active middle split flexibility.',
  },
  {
    step: 5,
    name: 'Band-Assisted Flat Straddle Planche',
    subtitle: 'Horizontal body line with light resistance band across hips',
    description: 'Teaches the exact neurological horizontal groove while de-loading 5–10 kg of body mass.',
    criteria: [
      '8–10s with lightest band',
      'Dead-flat body parallel to ground',
      'Total locked elbow confidence',
    ],
    tips: 'Gradually decrease band tension (from 15mm to 10mm band) over 8 weeks.',
  },
  {
    step: 6,
    name: 'Full Flat Straddle Planche',
    subtitle: 'Ultimate Target — Complete horizontal alignment, locked arms, hollow body',
    description: 'Mastery achievement. Complete horizontal straight-arm suspension with wide straddle and protracted scapulae.',
    criteria: [
      '5+ seconds unbroken isometric hold',
      'Hips, shoulders, and heels aligned on horizontal plane',
      'Effortless lockout with zero strain on elbows',
    ],
    tips: 'The pinnacle of upper body calisthenics straight-arm strength. Achieved through consistent submaximal volume.',
  },
];

// Helper to extract Cheat Sheet rows dynamically from any workout program
export function getCheatSheetRows(workout: WorkoutProgram) {
  const rows: {
    exercise: string;
    sets: string;
    reps: string;
    rest: string;
    intensity: string;
  }[] = [];

  workout.phases.forEach((phase) => {
    phase.exercises.forEach((ex) => {
      rows.push({
        exercise: ex.name,
        sets: `${ex.defaultSets} ${ex.defaultSets === 1 ? 'set' : 'sets'}`,
        reps: ex.defaultRepsOrSec,
        rest: ex.restSeconds > 0 ? (ex.restSeconds >= 60 ? `${Math.round(ex.restSeconds / 60)} min` : `${ex.restSeconds}s`) : '—',
        intensity: `${ex.rpe} | ${ex.cues.slice(0, 50)}${ex.cues.length > 50 ? '...' : ''}`,
      });
    });
  });

  return rows;
}
