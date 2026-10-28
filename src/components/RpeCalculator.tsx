import React, { useState, useMemo } from 'react';
import { Calculator, ShieldAlert, Sparkles, Dumbbell, Activity, CheckCircle2 } from 'lucide-react';
import { DatabaseExercise, getStoredExerciseDatabase } from '../data/exerciseDatabase';

interface RpeCalculatorProps {
  exerciseDatabase?: DatabaseExercise[];
}

export const RpeCalculator: React.FC<RpeCalculatorProps> = ({ exerciseDatabase }) => {
  // Use passed database or fallback to stored
  const allDatabaseExercises = useMemo(() => {
    return exerciseDatabase && exerciseDatabase.length > 0
      ? exerciseDatabase
      : getStoredExerciseDatabase();
  }, [exerciseDatabase]);

  // ==========================================
  // BOX 1: ISOMETRIC HOLD FORMULA (Auto-Synced)
  // ==========================================
  const isometricExercises = useMemo(() => {
    return allDatabaseExercises.filter(
      (e) =>
        e.type === 'Straight-Arm Isometric' ||
        e.type === 'Core Isometric' ||
        e.type.toLowerCase().includes('isometric') ||
        e.category === 'planche-progressions' ||
        e.category === 'planche-press' ||
        (e.category as string) === 'planche' ||
        e.id.includes('planche') ||
        e.id.includes('lean') ||
        e.id.includes('hold') ||
        e.id.includes('hang')
    );
  }, [allDatabaseExercises]);

  const customIsometricExercises = useMemo(() => {
    return isometricExercises.filter((e) => e.id.startsWith('custom-db-'));
  }, [isometricExercises]);

  const standardIsometricExercises = useMemo(() => {
    return isometricExercises.filter((e) => !e.id.startsWith('custom-db-'));
  }, [isometricExercises]);

  // Active Hold Exercise
  const [selectedHoldExerciseId, setSelectedHoldExerciseId] = useState<string>(
    () => isometricExercises.find((e) => e.id.includes('frog'))?.id || isometricExercises[0]?.id || ''
  );

  const selectedHoldObj = useMemo(() => {
    return (
      allDatabaseExercises.find((e) => e.id === selectedHoldExerciseId) ||
      isometricExercises[0] ||
      allDatabaseExercises[0]
    );
  }, [allDatabaseExercises, isometricExercises, selectedHoldExerciseId]);

  const [holdExerciseName, setHoldExerciseName] = useState<string>(
    () => selectedHoldObj?.name || 'Frog Planche with Raised Legs'
  );

  const [maxHoldSeconds, setMaxHoldSeconds] = useState<number>(8);

  const minHold = Math.max(2, Math.round(maxHoldSeconds * 0.5));
  const maxHold = Math.max(minHold, Math.round(maxHoldSeconds * 0.65));
  const holdSets = maxHoldSeconds <= 6 ? 4 : 5;
  const totalHoldVolumeLow = minHold * holdSets;
  const totalHoldVolumeHigh = maxHold * holdSets;

  const holdRestSec = useMemo(() => {
    if (selectedHoldObj?.restRecommended) {
      if (selectedHoldObj.restRecommended.includes('180') || selectedHoldObj.restRecommended.includes('3 min') || selectedHoldObj.restRecommended.includes('4 min')) return 180;
      if (selectedHoldObj.restRecommended.includes('120') || selectedHoldObj.restRecommended.includes('2 min')) return 120;
      if (selectedHoldObj.restRecommended.includes('90')) return 90;
      if (selectedHoldObj.restRecommended.includes('60')) return 60;
    }
    return 180;
  }, [selectedHoldObj]);

  const handleHoldDropdownSelect = (id: string) => {
    setSelectedHoldExerciseId(id);
    const found = allDatabaseExercises.find((e) => e.id === id);
    if (found) {
      setHoldExerciseName(found.name);
      if (found.id.includes('lean')) setMaxHoldSeconds(12);
      else if (found.id.includes('frog')) setMaxHoldSeconds(8);
      else if (found.id.includes('tuck')) setMaxHoldSeconds(10);
      else if (found.id.includes('straddle')) setMaxHoldSeconds(6);
    }
  };

  // ==========================================
  // BOX 2: REPETITION & STRENGTH FORMULA
  // ==========================================
  const planchePushExercises = useMemo(
    () => allDatabaseExercises.filter((e) => e.category === 'planche-push' && !e.id.startsWith('custom-db-')),
    [allDatabaseExercises]
  );

  const planchePressExercises = useMemo(
    () => allDatabaseExercises.filter((e) => e.category === 'planche-press' && !e.id.startsWith('custom-db-')),
    [allDatabaseExercises]
  );

  const bentArmExercises = useMemo(
    () => allDatabaseExercises.filter((e) => e.category === 'bent-arm' && !e.id.startsWith('custom-db-')),
    [allDatabaseExercises]
  );

  const conditioningExercises = useMemo(
    () => allDatabaseExercises.filter((e) => e.category === 'conditioning' && !e.id.startsWith('custom-db-')),
    [allDatabaseExercises]
  );

  const coreExercises = useMemo(
    () => allDatabaseExercises.filter((e) => e.category === 'core' && !e.id.startsWith('custom-db-')),
    [allDatabaseExercises]
  );

  const plancheProgExercises = useMemo(
    () => allDatabaseExercises.filter((e) => e.category === 'planche-progressions' && !e.id.startsWith('custom-db-')),
    [allDatabaseExercises]
  );

  const customRepExercises = useMemo(
    () => allDatabaseExercises.filter((e) => e.id.startsWith('custom-db-')),
    [allDatabaseExercises]
  );

  const [selectedRepExerciseId, setSelectedRepExerciseId] = useState<string>(
    () =>
      allDatabaseExercises.find((e) => e.category === 'planche-push')?.id ||
      allDatabaseExercises.find((e) => e.category === 'bent-arm')?.id ||
      allDatabaseExercises[0]?.id ||
      ''
  );

  const selectedRepExerciseObj = useMemo(() => {
    return allDatabaseExercises.find((e) => e.id === selectedRepExerciseId) || allDatabaseExercises[0];
  }, [allDatabaseExercises, selectedRepExerciseId]);

  const [repExerciseName, setRepExerciseName] = useState<string>(
    () => selectedRepExerciseObj?.name || 'Pseudo Planche Push-Ups'
  );
  const [maxReps, setMaxReps] = useState<number>(5);

  const calcSubmaxMinReps = Math.max(1, Math.floor(maxReps * 0.5));
  const calcSubmaxMaxReps = Math.max(calcSubmaxMinReps, Math.ceil(maxReps * 0.6));
  const calcPrescribedSets = maxReps <= 4 ? 4 : maxReps <= 15 ? 4 : 3;

  const totalMinReps = calcSubmaxMinReps * calcPrescribedSets;
  const totalMaxReps = calcSubmaxMaxReps * calcPrescribedSets;

  const repRestSec = useMemo(() => {
    if (selectedRepExerciseObj?.restRecommended) {
      if (selectedRepExerciseObj.restRecommended.includes('180') || selectedRepExerciseObj.restRecommended.includes('3 min')) return 180;
      if (selectedRepExerciseObj.restRecommended.includes('120') || selectedRepExerciseObj.restRecommended.includes('2 min')) return 120;
      if (selectedRepExerciseObj.restRecommended.includes('90')) return 90;
      if (selectedRepExerciseObj.restRecommended.includes('60')) return 60;
      if (selectedRepExerciseObj.restRecommended.includes('45')) return 45;
      if (selectedRepExerciseObj.restRecommended.includes('30')) return 30;
    }
    return maxReps <= 5 ? 120 : maxReps <= 15 ? 90 : 60;
  }, [selectedRepExerciseObj, maxReps]);

  const handleRepDropdownSelect = (id: string) => {
    setSelectedRepExerciseId(id);
    const found = allDatabaseExercises.find((e) => e.id === id);
    if (found) {
      setRepExerciseName(found.name);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Submaximal (50–70%) Prescription Calculator
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Science-backed volume formula: Leave 2–3 reps or seconds in reserve to maximize motor unit recruitment without connective tissue strain.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* BOX 1: Isometric Planche Hold Formula (Auto-Synced Dropdown) */}
        {/* ========================================================= */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>1. Isometric Hold Formula</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                50–65% TUT
              </span>
            </div>

            {/* Drop Down Menu of All Isometric & Planche Exercises (Auto-Synced!) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Isometric Exercise (Auto-Synced with Exercise Database):
              </label>
              <select
                value={selectedHoldExerciseId}
                onChange={(e) => handleHoldDropdownSelect(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-xs"
              >
                {/* Custom Isometric Exercises */}
                {customIsometricExercises.length > 0 && (
                  <optgroup label="── Custom Added Isometric Exercises (Live Synced) ──">
                    {customIsometricExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        ★ {ex.name} ({ex.targetArea.split(',')[0]})
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* Planche & Straight-Arm Isometrics */}
                <optgroup label="── Planche & Straight-Arm Isometric Skills ──">
                  {standardIsometricExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.difficulty})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Exercise Information Banner */}
            {selectedHoldObj && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-950 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[11px] font-bold text-blue-900">
                    Target: {selectedHoldObj.targetArea}
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                    {selectedHoldObj.difficulty}
                  </span>
                </div>
                <p className="italic text-slate-600 text-[11px]">
                  "{selectedHoldObj.cues}"
                </p>
              </div>
            )}

            {/* Hold Duration Slider & Direct Number Input */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700">
                  Clean Max Hold Duration (3–45s):
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="3"
                    max="45"
                    value={maxHoldSeconds}
                    onChange={(e) => {
                      const val = Math.max(3, Math.min(45, Number(e.target.value) || 3));
                      setMaxHoldSeconds(val);
                    }}
                    className="w-14 text-center text-xs font-mono font-bold text-blue-600 bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-500">sec max</span>
                </div>
              </div>

              <input
                type="range"
                min="3"
                max="45"
                step="1"
                value={maxHoldSeconds}
                onChange={(e) => setMaxHoldSeconds(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>3s (Entry)</span>
                <span>15s (Advanced)</span>
                <span>45s (Endurance)</span>
              </div>
            </div>
          </div>

          {/* Result Prescription */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 mt-4">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block">
              Calculated Submax Prescription for {holdExerciseName}:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {minHold === maxHold ? `${minHold} sec` : `${minHold}–${maxHold} sec`}
              </span>
              <span className="text-xs text-slate-500">per working set</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Sets:</span>
                <strong className="text-slate-800">{holdSets} Sets</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Mandatory Rest:</span>
                <strong className="text-blue-600 font-mono">
                  {holdRestSec >= 60 ? `${holdRestSec / 60} min (${holdRestSec}s)` : `${holdRestSec}s`}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Total Session TUT:</span>
                <strong className="text-slate-800 font-mono">
                  {totalHoldVolumeLow === totalHoldVolumeHigh
                    ? `${totalHoldVolumeLow}s`
                    : `${totalHoldVolumeLow}–${totalHoldVolumeHigh}s`}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Target Intensity:</span>
                <strong className="text-emerald-700">RPE 6 (Clean stop)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOX 2: Repetition & Strength Formula (Auto-Synced Dropdown) */}
        {/* ========================================================= */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-indigo-600" />
                <span>2. Repetition & Strength Formula</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                50–60% Volume
              </span>
            </div>

            {/* Drop Down Menu of All Strength & Database Exercises */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Strength Exercise (Auto-Synced with Exercise Database):
              </label>
              <select
                value={selectedRepExerciseId}
                onChange={(e) => handleRepDropdownSelect(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs"
              >
                {/* 1. Planche Push */}
                {planchePushExercises.length > 0 && (
                  <optgroup label="── Planche Push ──">
                    {planchePushExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 2. Planche Press */}
                {planchePressExercises.length > 0 && (
                  <optgroup label="── Planche Press ──">
                    {planchePressExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 3. Bent Arm Progressions */}
                {bentArmExercises.length > 0 && (
                  <optgroup label="── Bent Arm Progressions ──">
                    {bentArmExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 4. Conditioning */}
                {conditioningExercises.length > 0 && (
                  <optgroup label="── Conditioning ──">
                    {conditioningExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 5. Core */}
                {coreExercises.length > 0 && (
                  <optgroup label="── Core ──">
                    {coreExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 6. Custom Added Exercises */}
                {customRepExercises.length > 0 && (
                  <optgroup label="── Custom Added Exercises (Live Synced) ──">
                    {customRepExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        ★ {ex.name} ({ex.categoryLabel})
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 7. Planche Progressions */}
                {plancheProgExercises.length > 0 && (
                  <optgroup label="── Planche Progressions ──">
                    {plancheProgExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Exercise Information Banner */}
            {selectedRepExerciseObj && (
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-2.5 text-xs text-indigo-950 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[11px] font-bold text-indigo-900">
                    Target: {selectedRepExerciseObj.targetArea}
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                    {selectedRepExerciseObj.type}
                  </span>
                </div>
                <p className="italic text-slate-600 text-[11px]">
                  "{selectedRepExerciseObj.cues}"
                </p>
              </div>
            )}

            {/* Rep Slider & Number Box (Supports Up to 30 Reps!) */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700">
                  Your Clean Max Repetitions (1–30):
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={maxReps}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(30, Number(e.target.value) || 1));
                      setMaxReps(val);
                    }}
                    className="w-14 text-center text-xs font-mono font-bold text-indigo-600 bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-500">reps max</span>
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={maxReps}
                onChange={(e) => setMaxReps(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1 rep (Strength)</span>
                <span>15 reps (Hypertrophy)</span>
                <span>30 reps (High Volume)</span>
              </div>
            </div>
          </div>

          {/* Result Prescription */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 mt-4">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block">
              Calculated Submax Prescription for {repExerciseName}:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {calcSubmaxMinReps === calcSubmaxMaxReps
                  ? `${calcSubmaxMinReps} reps`
                  : `${calcSubmaxMinReps}–${calcSubmaxMaxReps} reps`}
              </span>
              <span className="text-xs text-slate-500">per working set</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Prescribed Sets:</span>
                <strong className="text-slate-800">{calcPrescribedSets} Sets</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Recommended Rest:</span>
                <strong className="text-indigo-600 font-mono">
                  {repRestSec >= 60
                    ? `${repRestSec / 60} min (${repRestSec}s)`
                    : `${repRestSec}s`}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Total Session Volume:</span>
                <strong className="text-slate-800 font-mono">
                  {totalMinReps === totalMaxReps
                    ? `${totalMinReps} reps`
                    : `${totalMinReps}–${totalMaxReps} reps`}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Target Intensity:</span>
                <strong className="text-emerald-700">RPE 5–6 (Crisp tempo)</strong>
              </div>
            </div>
          </div>

          {/* Helpful Coaching Footnote */}
          {maxReps <= 2 && (
            <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2 mt-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                If your max is 1–2 reps, perform singles with 2-minute rests or regress to an elevated/assisted variation to accumulate clean volume.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Why Submaximal Training Works */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-2">
        <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          The Science of Submaximal Calisthenics (Why 50–65% Volume Builds Peak Performance)
        </h4>
        <p className="text-blue-900 leading-relaxed">
          Tendons and neuromuscular pathways adapt through frequent, high-velocity repetitions and submaximal isometric holds with zero form degradation. By holding 50–65% of your max duration and performing 50–60% of your max reps across clean sets, every movement is executed with explosive intent, pristine bone stacking, and crisp joint alignment. This stimulates connective tissue remodeling without the excessive neural burnout and prolonged recovery times associated with training to failure.
        </p>
      </div>
    </div>
  );
};
