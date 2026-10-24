export interface DatabaseExercise {
  id: string;
  name: string;
  category: 'planche' | 'push' | 'prep' | 'accessory' | 'mobility';
  categoryLabel: string;
  targetArea: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
  type: 'Straight-Arm Isometric' | 'Bent-Arm Dynamic' | 'Joint Conditioning' | 'Restorative Mobility';
  defaultVolume: string;
  restRecommended: string;
  cues: string;
  details: string;
  coachingPoints: string[];
  commonMistakes: string[];
}

export const EXERCISE_DATABASE: DatabaseExercise[] = [
  // 1. PLANCHE SKILLS
  {
    id: 'db-frog-planche',
    name: 'Frog Planche with Raised Legs',
    category: 'planche',
    categoryLabel: 'Planche Skills',
    targetArea: 'Anterior Deltoids, Serratus Anterior, Distal Biceps Tendons',
    difficulty: 'Intermediate',
    type: 'Straight-Arm Isometric',
    defaultVolume: '4–5 sets × 4–5 sec',
    restRecommended: '3 min (180s)',
    cues: 'Elbows 100% locked straight, knees held wide outside arms, hips elevated to shoulder height, upper back protracted.',
    details: 'Decouples inner thighs from elbows. Feet float freely in space to develop genuine straight-arm shoulder lean torque without resting weight on triceps.',
    coachingPoints: [
      'Do NOT rest inner thighs on elbows (that is a yoga crow pose)',
      'Rotate elbow pits forward 45 degrees to engage external rotators',
      'Dome the upper back aggressively via serratus anterior protraction',
      'Keep head neutral and gaze slightly forward of fingers'
    ],
    commonMistakes: [
      'Resting knees on elbows to cheat leverage',
      'Micro-bending elbows (shifts torque painfully to distal biceps tendon)',
      'Hips sagging below shoulder height'
    ]
  },
  {
    id: 'db-planche-leans',
    name: 'Measured Planche Leans',
    category: 'planche',
    categoryLabel: 'Planche Skills',
    targetArea: 'Anterior Delts, Core Compression, Wrist Joint Tolerance',
    difficulty: 'Intermediate',
    type: 'Straight-Arm Isometric',
    defaultVolume: '3 sets × 8–10 sec',
    restRecommended: '3 min (180s)',
    cues: 'Tuck tailbone into Posterior Pelvic Tilt (PPT), push floor away into full protraction, keep toes on a fixed floor marker.',
    details: 'Objective progressive overload tool for planche lean angle. Using tape on the floor guarantees measurable centimeter-by-centimeter forward lean progression.',
    coachingPoints: [
      'Keep toes fixed on a specific floor mark or wall line',
      'Shoulders must travel significantly forward past wrists',
      'Crush the ground through all finger pads and knuckles',
      'Squeeze glutes hard to prevent lumbar arching'
    ],
    commonMistakes: [
      'Shifting toes forward as fatigue sets in (invalidates progression)',
      'Losing upper back protraction (scapular collapse)',
      'Holding breath into extreme blood pressure spikes'
    ]
  },
  {
    id: 'db-tuck-planche',
    name: 'Tuck Planche',
    category: 'planche',
    categoryLabel: 'Planche Skills',
    targetArea: 'Anterior Delts, Serratus Anterior, Abdominal Compression',
    difficulty: 'Beginner',
    type: 'Straight-Arm Isometric',
    defaultVolume: '4–5 sets × 6–8 sec',
    restRecommended: '3 min (180s)',
    cues: 'Compress knees tightly against chest, push floor through the earth, elevate hips level with shoulders.',
    details: 'The baseline foundation of all straight-arm calisthenics. Teaches the neurological link between locked elbow extension and scapular protraction.',
    coachingPoints: [
      'Lock elbows completely before leaving the ground',
      'Round upper back to maximum protraction',
      'Actively lift knees toward chest using hip flexors'
    ],
    commonMistakes: [
      'Hips hanging below wrist level',
      'Bending arms to jump into the hold',
      'Retracting shoulder blades'
    ]
  },
  {
    id: 'db-adv-tuck-planche',
    name: 'Advanced Tuck Planche',
    category: 'planche',
    categoryLabel: 'Planche Skills',
    targetArea: 'Anterior Deltoids, Spinal Erectors, Scapular Depressors',
    difficulty: 'Intermediate',
    type: 'Straight-Arm Isometric',
    defaultVolume: '4–5 sets × 4–6 sec',
    restRecommended: '3 min (180s)',
    cues: 'Open hip angle to 90 degrees, flatten lower back parallel to floor, maintain complete elbow lockout.',
    details: 'Doubles the forward shoulder torque compared to standard tuck by moving the center of mass away from the shoulder axis.',
    coachingPoints: [
      'Spine must be flat like a tabletop, not curled in a ball',
      'Maintain strong depression (push shoulders away from ears)',
      'Keep knees bent 90 degrees without letting them drift into chest'
    ],
    commonMistakes: [
      'Allowing knees to sneak back into the chest when tired',
      'Arching lower back into anterior pelvic tilt',
      'Elbow micro-bending'
    ]
  },
  {
    id: 'db-piked-straddle',
    name: 'Piked Straddle Planche',
    category: 'planche',
    categoryLabel: 'Planche Skills',
    targetArea: 'Anterior Delts, Gluteus Medius, Distal Biceps, Core',
    difficulty: 'Advanced',
    type: 'Straight-Arm Isometric',
    defaultVolume: '3–4 sets × 3–5 sec',
    restRecommended: '3–4 min',
    cues: 'Kick legs out into wide straddle with knees completely straight; keep hips piked higher than shoulders before lowering.',
    details: 'The transitional milestone toward full straddle planche. The wide leg split reduces leverage requirements compared to full planche.',
    coachingPoints: [
      'Spread legs as wide as possible to minimize lever length',
      'Lock knee joints completely with pointed toes',
      'Squeeze outer glutes (gluteus medius) to keep legs elevated'
    ],
    commonMistakes: [
      'Bent knees during straddle',
      'Narrow leg split which spikes shoulder load prematurely',
      'Dropping hips below parallel'
    ]
  },
  {
    id: 'db-full-straddle-planche',
    name: 'Full Flat Straddle Planche',
    category: 'planche',
    categoryLabel: 'Planche Skills',
    targetArea: 'Full Kinetic Chain: Deltoids, Serratus, Glutes, Erectors',
    difficulty: 'Elite',
    type: 'Straight-Arm Isometric',
    defaultVolume: '3–5 sets × 3–5 sec',
    restRecommended: '4 min (240s)',
    cues: 'Lower hips into true horizontal alignment with shoulders and heels; lean forward aggressively; protract and lock.',
    details: 'The ultimate pinnacle of upper body straight-arm calisthenics strength. Demands immense shoulder torque and tendon stiffness.',
    coachingPoints: [
      'Shoulders, hips, and heels aligned in one straight horizontal plane',
      'Elbows locked like solid steel pillars',
      'Posterior pelvic tilt with glutes squeezed to maximum'
    ],
    commonMistakes: [
      'Banana back (anterior pelvic tilt)',
      'Shoulder blade retraction / sagging chest',
      'Heels higher than shoulders (piking upside down)'
    ]
  },
  {
    id: 'db-zanetti-raises',
    name: 'Dumbbell Straight-Arm Planche Raises',
    category: 'planche',
    categoryLabel: 'Planche Skills',
    targetArea: 'Anterior Deltoid Clavicular Head, Biceps Tendons',
    difficulty: 'Intermediate',
    type: 'Straight-Arm Isometric',
    defaultVolume: '3 sets × 6–8 reps',
    restRecommended: '90s',
    cues: 'Lying supine on flat or low incline bench, raise light dumbbells with completely locked straight arms.',
    details: 'Strengthens the specific anterior deltoid and long head biceps fibers that resist shoulder extension in planche.',
    coachingPoints: [
      'Keep elbows locked with zero micro-bend',
      'Slow 3-second negative descent',
      'Use light dumbbells (2–6 kg) to prioritize tendon health'
    ],
    commonMistakes: [
      'Swinging heavy dumbbells with body momentum',
      'Bending arms into a curl'
    ]
  },

  // 2. OVERHEAD & PUSHING
  {
    id: 'db-wall-hspu',
    name: 'Strict Wall Handstand Push-Ups',
    category: 'push',
    categoryLabel: 'Overhead & Pushing',
    targetArea: 'Anterior/Lateral Deltoids, Triceps Brachii, Upper Trapezius',
    difficulty: 'Intermediate',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '4 sets × 1–3 reps (Submax)',
    restRecommended: '2 min (120s)',
    cues: 'Control 2-second eccentric, touch nose gently to floor forming a tripod with hands, press back up to full overhead elevation.',
    details: 'Builds raw overhead pressing power that reinforces the shoulder girdle for planche balance and straight-arm pressing transitions.',
    coachingPoints: [
      'Tuck elbows 45 degrees, avoiding excessive flare',
      'Head travels forward in front of hands to form a stable tripod',
      'Lock out elbows and push active shoulders toward ears at top'
    ],
    commonMistakes: [
      'Flaring elbows 90 degrees outward (impinges rotator cuff)',
      'Bouncing head off the floor',
      'Excessive back arching (banana handstand)'
    ]
  },
  {
    id: 'db-deficit-pike-pu',
    name: 'Deficit Pike Push-Ups (Feet Elevated)',
    category: 'push',
    categoryLabel: 'Overhead & Pushing',
    targetArea: 'Anterior Delts, Upper Trapezius, Triceps',
    difficulty: 'Beginner',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '3–4 sets × 6–8 reps',
    restRecommended: '90s',
    cues: 'Feet on high bench, hips stacked directly over shoulders, descend forward into tripod, press back through shoulders.',
    details: 'The premier scalable regression for handstand push-ups. Directly mimics vertical overhead load with adjustable bodyweight resistance.',
    coachingPoints: [
      'Walk hands close to bench to keep torso vertical',
      'Head moves forward as elbows bend back 45 degrees',
      'Finish every rep with full shoulder elevation'
    ],
    commonMistakes: [
      'Allowing torso to lean back into a standard horizontal push-up',
      'Flaring elbows'
    ]
  },
  {
    id: 'db-combo-drill',
    name: 'L-Sit to Tuck Planche Press to Handstand Drill',
    category: 'push',
    categoryLabel: 'Overhead & Pushing',
    targetArea: 'Full Kinetic Chain: Core Compression, Planche Torque, Handstand Balance',
    difficulty: 'Advanced',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '2 sets × 1 clean rep',
    restRecommended: '2 min (120s)',
    cues: 'Hold L-sit 2s → smooth transition into tuck planche → press controlled into handstand → slow uniform negative back to L-sit.',
    details: 'Multi-plane neuromuscular drill connecting compression, straight-arm pressing, and overhead stability without ballistic jumping.',
    coachingPoints: [
      'Zero momentum or kicking; purely motor-controlled',
      'Depress scapulae actively during L-sit',
      'Lower down with uniform resistance'
    ],
    commonMistakes: [
      'Jumping or kicking into the handstand',
      'Rushing the negative descent'
    ]
  },
  {
    id: 'db-parallel-dips',
    name: 'Parallel Bar Deep Dips',
    category: 'push',
    categoryLabel: 'Overhead & Pushing',
    targetArea: 'Lower Pectorals, Anterior Delts, Triceps',
    difficulty: 'Beginner',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '3–4 sets × 8–12 reps',
    restRecommended: '90s',
    cues: 'Torso leaned slightly forward, lower until shoulders pass below elbows, press to full lockout with scapular depression.',
    details: 'Develops powerful anterior shoulder and tricep extension strength that supports bottom planche lean transitions.',
    coachingPoints: [
      'Full active range of motion below 90 degrees if shoulders allow',
      'Depress shoulder blades at top lockout',
      'Keep core braced without swinging legs'
    ],
    commonMistakes: [
      'Shrugging shoulders into ears at bottom',
      'Cutting depth short before 90 degrees'
    ]
  },
  {
    id: 'db-pseudo-pushups',
    name: 'Pseudo Planche Push-Ups (PPPU)',
    category: 'push',
    categoryLabel: 'Overhead & Pushing',
    targetArea: 'Anterior Delts, Upper Pectorals, Core',
    difficulty: 'Intermediate',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '3–4 sets × 6–8 reps',
    restRecommended: '90s',
    cues: 'Hands turned out 45° placed at waist level; maintain aggressive forward lean throughout both descent and ascent.',
    details: 'Combines dynamic horizontal pressing with static planche lean torque. Critical builder for bent-arm to straight-arm force transfer.',
    coachingPoints: [
      'Maintain forward lean at all times, do not shift backwards on push',
      'Protract hard at the top of every repetition',
      'Stay in hollow body posture'
    ],
    commonMistakes: [
      'Shifting hips backward when pressing up to make the rep easier',
      'Sagging lower back'
    ]
  },

  // 3. JOINT PREP & WRISTS
  {
    id: 'db-palm-lifts',
    name: 'First-Knuckle Palm Lifts',
    category: 'prep',
    categoryLabel: 'Joint Prep & Wrists',
    targetArea: 'Deep Finger Flexors, Wrist Joint Capsule, Forearm Flexors',
    difficulty: 'Beginner',
    type: 'Joint Conditioning',
    defaultVolume: '1 set × 10–12 reps',
    restRecommended: '30s',
    cues: 'Hands flat in quadruped; lift palms while keeping all 10 finger knuckles glued down; lower slowly.',
    details: 'Calf raises for the hands. Fortifies the lumbricals, flexor digitorum, and carpal bones to withstand forward planche angles.',
    coachingPoints: [
      'Keep elbows locked straight',
      'Shift bodyweight forward to increase difficulty gently',
      'Lower palms with control without slamming'
    ],
    commonMistakes: [
      'Letting the index knuckle lift off the floor',
      'Bending elbows'
    ]
  },
  {
    id: 'db-face-pulls',
    name: 'Band Face Pulls with External Rotation',
    category: 'prep',
    categoryLabel: 'Joint Prep & Wrists',
    targetArea: 'Infraspinatus, Teres Minor, Rear Deltoids, Rhomboids',
    difficulty: 'Beginner',
    type: 'Joint Conditioning',
    defaultVolume: '1 set × 12–15 reps',
    restRecommended: '30s',
    cues: 'Pull band to forehead height, rotate thumbs backward, pinch scapulae firmly at peak contraction.',
    details: 'Crucial agonist-antagonist balancer. Primes the external rotator cuff to stabilize the humeral head against heavy forward planche torque.',
    coachingPoints: [
      'Elbows must be high above wrists at finish',
      'Hold peak contraction for 1 second',
      'Do not arch lumbar spine'
    ],
    commonMistakes: [
      'Pulling too low to chin',
      'Using body momentum to yank the band'
    ]
  },
  {
    id: 'db-sweeps',
    name: 'Straight-Arm Band Sweeps',
    category: 'prep',
    categoryLabel: 'Joint Prep & Wrists',
    targetArea: 'Latissimus Dorsi, Scapular Depressors, Long Head Triceps',
    difficulty: 'Beginner',
    type: 'Joint Conditioning',
    defaultVolume: '1 set × 8–10 reps',
    restRecommended: '30s',
    cues: 'Arms locked straight, sweep band down from eye level to hips using lats; depress shoulders toward rear pockets.',
    details: 'Activates the latissimus dorsi as a scapular depressor. Straight-arm depression prevents shoulder shrugging during planche holds.',
    coachingPoints: [
      'Zero bend at the elbow',
      'Slow 2-second return to start',
      'Depress scapulae actively downwards'
    ],
    commonMistakes: [
      'Bending arms to pull',
      'Shrugging shoulders upwards'
    ]
  },
  {
    id: 'db-wrist-flex-ext',
    name: 'Dumbbell Wrist Extension & Flexion',
    category: 'prep',
    categoryLabel: 'Joint Prep & Wrists',
    targetArea: 'Wrist Extensor & Flexor Muscle Groups',
    difficulty: 'Beginner',
    type: 'Joint Conditioning',
    defaultVolume: '1 set × 12 reps (Light)',
    restRecommended: '45s',
    cues: 'Forearm supported on bench or knee, light dumbbell; smooth full active range of motion.',
    details: 'Synovial fluid lubrication for wrist joints. Warms up the extensor carpi radialis and ulnaris tendons.',
    coachingPoints: [
      'Perform both curls (palms up) and extensions (palms down)',
      'Use light weights (2–4 kg); this is joint prep, not bodybuilding',
      'Move through full stretch and squeeze'
    ],
    commonMistakes: [
      'Jerking heavy weight',
      'Lifting forearm off support'
    ]
  },

  // 4. TENDON & ACCESSORIES
  {
    id: 'db-scap-pushes',
    name: 'Planche Lean Scapular Pushes',
    category: 'accessory',
    categoryLabel: 'Tendon & Accessories',
    targetArea: 'Serratus Anterior, Scapular Depressors',
    difficulty: 'Intermediate',
    type: 'Joint Conditioning',
    defaultVolume: '3 sets × 8–10 reps',
    restRecommended: '60–90s',
    cues: 'Locked straight arms throughout; retract scapulae slowly, then protract hard to dome upper back at top.',
    details: 'Isolates the serratus anterior through full active protraction under planche lean leverage without bending arms.',
    coachingPoints: [
      'Do not bend elbows even 1 millimeter',
      'Allow chest to sink between shoulder blades',
      'Push floor away to dome upper back like an angry cat'
    ],
    commonMistakes: [
      'Bending arms to mimic push-up motion',
      'Moving neck instead of shoulder blades'
    ]
  },
  {
    id: 'db-incline-curls',
    name: 'Incline Dumbbell Biceps Curls',
    category: 'accessory',
    categoryLabel: 'Tendon & Accessories',
    targetArea: 'Distal Biceps Tendons, Brachialis, Biceps Long Head',
    difficulty: 'Intermediate',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '2–3 sets × 10–12 reps',
    restRecommended: '60s',
    cues: 'Bench angled 45–60°, let arms hang straight down behind torso, 3-second slow negative descent.',
    details: 'The single most effective prehab exercise for calisthenics straight-arm athletes. Eccentric loading in the lengthened position triggers collagen synthesis in distal biceps tendons.',
    coachingPoints: [
      'Let arms hang fully extended to load the tendon on stretch',
      'Strict 3-second lowering on every single rep',
      'Never drop weights abruptly at bottom'
    ],
    commonMistakes: [
      'Swinging dumbbells forward with momentum',
      'Stopping short of full extension'
    ]
  },
  {
    id: 'db-reverse-hypers',
    name: 'Straddle Reverse Hypers / Bench Extensions',
    category: 'accessory',
    categoryLabel: 'Tendon & Accessories',
    targetArea: 'Gluteus Medius, Gluteus Maximus, Lower Spinal Erectors',
    difficulty: 'Intermediate',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '3 sets × 10–12 reps',
    restRecommended: '60s',
    cues: 'Prone on high bench, legs in wide straddle hanging off edge; lift legs above bench height squeezing glutes.',
    details: 'Directly builds the posterior chain strength required to lift and hold heavy lower body mass in a horizontal straddle planche.',
    coachingPoints: [
      'Keep legs spread as wide as possible throughout',
      'Squeeze glutes hard at peak contraction',
      'Avoid hyperextending only from lumbar spine'
    ],
    commonMistakes: [
      'Narrowing legs when raising them',
      'Using excessive swinging momentum'
    ]
  },
  {
    id: 'db-tricep-ext',
    name: 'Bodyweight / Overhead Triceps Extensions',
    category: 'accessory',
    categoryLabel: 'Tendon & Accessories',
    targetArea: 'Triceps Long Head, Distal Triceps Tendon',
    difficulty: 'Beginner',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '2–3 sets × 10–12 reps',
    restRecommended: '60s',
    cues: 'Smooth tempo, keep elbows tucked close to ears, full extension and crisp lockout at top.',
    details: 'Balances biceps prehab by conditioning the triceps tendon and building the lockout strength needed for handstands and straight-arm holds.',
    coachingPoints: [
      'Keep elbows tucked in; do not allow them to flare wide',
      'Pause for 1 second in locked extension',
      'Full stretch at bottom'
    ],
    commonMistakes: [
      'Flaring elbows outward',
      'Using hip drive to bounce back up'
    ]
  },

  // 5. MOBILITY & RECOVERY
  {
    id: 'db-pancake-stretch',
    name: 'Seated Straddle Pancake Stretch',
    category: 'mobility',
    categoryLabel: 'Mobility & Recovery',
    targetArea: 'Adductors, Hamstrings, Pelvic Tilters',
    difficulty: 'Beginner',
    type: 'Restorative Mobility',
    defaultVolume: '2 sets × 45–60 sec',
    restRecommended: '45s',
    cues: 'Sit in wide V-straddle, tilt pelvis forward (anterior pelvic tilt), fold chest forward with long exhales.',
    details: 'Every extra inch of active straddle flexibility shortens the planche lever arm by several centimeters, making straddle planche vastly easier.',
    coachingPoints: [
      'Kneecaps must point straight up toward ceiling, never roll inward',
      'Tilt pelvis forward rather than hunching upper back',
      'Breathe deeply into belly'
    ],
    commonMistakes: [
      'Rolling feet inward',
      'Aggressively bouncing into stretch'
    ]
  },
  {
    id: 'db-passive-hang',
    name: 'Passive Bar Hang with Foot Support',
    category: 'mobility',
    categoryLabel: 'Mobility & Recovery',
    targetArea: 'Subacromial Space, Latissimus Dorsi, Spinal Decompression',
    difficulty: 'Beginner',
    type: 'Restorative Mobility',
    defaultVolume: '3 sets × 30–45 sec',
    restRecommended: '45s',
    cues: 'Hang from overhead bar with toes lightly touching ground; completely relax shoulders into full passive traction.',
    details: 'Decompresses the glenohumeral joint and opens the subacromial space, relieving impingement from high-volume forward pushing.',
    coachingPoints: [
      'Completely relax lats and traps',
      'Let gravity open space between vertebrae and shoulders',
      'Diaphragmatic breathing'
    ],
    commonMistakes: [
      'Actively pulling down (turning it into an active hang)',
      'Holding breath'
    ]
  },
  {
    id: 'db-cat-cow',
    name: 'Quadruped Cat-Cow with Scapular Waves',
    category: 'mobility',
    categoryLabel: 'Mobility & Recovery',
    targetArea: 'Thoracic Spine, Serratus Anterior, Rhomboids',
    difficulty: 'Beginner',
    type: 'Restorative Mobility',
    defaultVolume: '2 sets × 8 slow reps',
    restRecommended: '30s',
    cues: 'Inhale into gentle thoracic extension; exhale and glide shoulder blades into wide cat protraction.',
    details: 'Restores fluid thoracic mobility and prevents stiffness from heavy protracted planche training.',
    coachingPoints: [
      'Synchronize movement with breathing',
      'Feel each individual vertebra moving',
      'Glide scapulae smoothly along ribcage'
    ],
    commonMistakes: [
      'Rushing through reps',
      'Bending elbows'
    ]
  }
];

const EXERCISE_STORAGE_KEY = 'planche_exercise_database';

export function getStoredExerciseDatabase(): DatabaseExercise[] {
  if (typeof window === 'undefined') return EXERCISE_DATABASE;
  const saved = localStorage.getItem(EXERCISE_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  return EXERCISE_DATABASE;
}

export function saveStoredExerciseDatabase(exercises: DatabaseExercise[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXERCISE_STORAGE_KEY, JSON.stringify(exercises));
}

export function resetStoredExerciseDatabase(): DatabaseExercise[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(EXERCISE_STORAGE_KEY);
  }
  return EXERCISE_DATABASE;
}

