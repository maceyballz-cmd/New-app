import React, { useMemo } from 'react';
import { WorkoutProgram, PROGRESSION_ROADMAP, getCheatSheetRows } from '../data/programData';
import { DatabaseExercise } from '../data/exerciseDatabase';
import { getStoredTransformationData } from '../data/transformationData';

export type PrintScope =
  | 'current'
  | 'all'
  | 'overview'
  | 'workout'
  | 'cheatsheet'
  | 'exercises'
  | 'roadmap'
  | 'calculator'
  | 'transformation';

interface PrintDocumentProps {
  workout: WorkoutProgram;
  activeTab: 'overview' | 'workout' | 'cheatsheet' | 'exercises' | 'roadmap' | 'calculator' | 'transformation';
  printScope: PrintScope;
  exerciseDatabase: DatabaseExercise[];
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({
  workout,
  activeTab,
  printScope,
  exerciseDatabase,
}) => {
  const cheatSheetRows = useMemo(() => getCheatSheetRows(workout), [workout]);
  const transformationData = useMemo(() => getStoredTransformationData(), []);

  // Retrieve saved workout logs
  const workoutLogs = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('planche_workout_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // Helper to determine if a section should be printed
  const shouldPrint = (section: 'overview' | 'workout' | 'cheatsheet' | 'exercises' | 'roadmap' | 'calculator' | 'transformation') => {
    if (printScope === 'all') return true;
    if (printScope === 'current') return activeTab === section;
    return printScope === section;
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Categorize exercises for print
  const categorizedExercises = useMemo(() => {
    const categories: Record<string, { label: string; items: DatabaseExercise[] }> = {
      'planche-progressions': { label: 'Planche Progressions', items: [] },
      'planche-push': { label: 'Planche Push', items: [] },
      'planche-press': { label: 'Planche Press', items: [] },
      'bent-arm': { label: 'Bent Arm Progressions', items: [] },
      'conditioning': { label: 'Conditioning', items: [] },
      'core': { label: 'Core & Compression', items: [] },
    };

    exerciseDatabase.forEach((ex) => {
      const catKey = (ex.category as string) || 'planche-progressions';
      if (categories[catKey]) {
        categories[catKey].items.push(ex);
      } else {
        categories['planche-progressions'].items.push(ex);
      }
    });

    return categories;
  }, [exerciseDatabase]);

  return (
    <div className="print-only hidden font-sans text-slate-900 bg-white max-w-5xl mx-auto p-4 sm:p-6 text-xs">
      {/* ============================================================
          DOCUMENT MASTER HEADER (Always on first page)
          ============================================================ */}
      <header className="border-b-2 border-slate-900 pb-4 mb-6 bg-white">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight text-slate-900 uppercase">
              PlancheLab Mastery
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 uppercase tracking-wider">
              {workout.intensityLabel}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Printed: {currentDate} · PlancheLab Program System
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {printScope === 'all'
                ? 'Complete Master Program Guide & Athlete Workbook'
                : printScope === 'current'
                ? `Section: ${activeTab.toUpperCase()} · ${workout.meta.title}`
                : `Section: ${printScope.toUpperCase()} · ${workout.meta.title}`}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">{workout.meta.subtitle}</p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Goal</span>
            <span className="text-xs font-bold text-blue-700">{workout.meta.goal}</span>
          </div>
        </div>

        {/* Quick Meta Key Metrics Strip */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-center">
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Timeline</span>
            <strong className="text-xs text-slate-900">{workout.meta.timeline}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Duration</span>
            <strong className="text-xs text-slate-900">{workout.meta.sessionDuration}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Target RPE</span>
            <strong className="text-xs text-blue-700">{workout.meta.targetRPE}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Frequency</span>
            <strong className="text-xs text-slate-900">{workout.meta.frequency}</strong>
          </div>
        </div>
      </header>

      {/* ============================================================
          SECTION 1: PROGRAM OVERVIEW & GUIDELINES
          ============================================================ */}
      {shouldPrint('overview') && (
        <section className="print-break-inside-avoid mb-8">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              1. Prescribed Workout Template & Training Rules
            </h2>
            <span className="text-[10px] text-slate-500 font-semibold">{workout.name}</span>
          </div>

          {/* Philosophy Banner */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg mb-4 text-xs">
            <strong className="text-blue-950 font-bold block mb-1">
              Training Philosophy & Connective Tissue Adaptation:
            </strong>
            <p className="text-blue-900 leading-relaxed text-[11px]">{workout.meta.philosophy}</p>
          </div>

          {/* Key Training Rules */}
          <div className="border border-slate-300 rounded-xl p-4 mb-5 bg-white">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-100">
              💡 Essential Training Rules & Protocols
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              {workout.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200/60">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-slate-900 font-semibold">{rule.title}: </strong>
                    <span className="text-[11px] text-slate-600">{rule.rule}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Workout Phases */}
          <div className="space-y-4">
            {workout.phases.map((phase) => (
              <div key={phase.id} className="print-break-inside-avoid border border-slate-300 rounded-xl p-4 bg-white">
                <div className="flex justify-between items-baseline mb-2 pb-1.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase">
                      {phase.badge}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{phase.title}</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{phase.durationEstimate}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">{phase.description}</p>

                <div className="space-y-2.5">
                  {phase.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50"
                    >
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-xs text-slate-900">{ex.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold text-blue-700">
                            {ex.defaultSets} sets × {ex.defaultRepsOrSec}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Rest: {ex.restSeconds > 0 ? (ex.restSeconds >= 60 ? `${Math.round(ex.restSeconds / 60)} min` : `${ex.restSeconds}s`) : 'None'}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 mb-1">{ex.details}</div>
                      <div className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-200">
                        <strong>Key Focus:</strong> {ex.cues}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 2: MASTER WORKOUT CHEAT SHEET
          ============================================================ */}
      {(shouldPrint('cheatsheet') || (shouldPrint('overview') && printScope !== 'all')) && (
        <section className="print-break-inside-avoid mb-8">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              📊 Master Workout Cheat Sheet ({workout.intensityLabel})
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Quick Reference Grid</span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[11px]">
                  <th className="p-2.5 font-bold">Exercise</th>
                  <th className="p-2.5 font-bold text-center w-20">Sets</th>
                  <th className="p-2.5 font-bold text-center w-28">Reps / Hold</th>
                  <th className="p-2.5 font-bold text-center w-24">Rest</th>
                  <th className="p-2.5 font-bold">Intensity & Coaching Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cheatSheetRows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="p-2.5 font-bold text-slate-900">{row.exercise}</td>
                    <td className="p-2.5 font-mono text-center font-semibold text-slate-700">{row.sets}</td>
                    <td className="p-2.5 font-mono text-center font-semibold text-blue-700">{row.reps}</td>
                    <td className="p-2.5 font-mono text-center text-slate-600">{row.rest}</td>
                    <td className="p-2.5 text-[11px] text-slate-600">{row.intensity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 3: EXERCISE DATABASE
          ============================================================ */}
      {shouldPrint('exercises') && (
        <section className="print-break-inside-avoid mb-8">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              🏋️ Comprehensive Calisthenics Exercise Database
            </h2>
            <span className="text-[10px] text-slate-500 font-semibold">
              {exerciseDatabase.length} Total Exercises
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mb-4">
            Curated library categorized by biomechanical focus: Planche Progressions, Planche Push, Planche Press, Bent Arm Progressions, Conditioning, and Core.
          </p>

          <div className="space-y-5">
            {Object.entries(categorizedExercises).map(([key, cat]) => {
              if (cat.items.length === 0) return null;
              return (
                <div key={key} className="print-break-inside-avoid border border-slate-300 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      {cat.label} ({cat.items.length})
                    </h3>
                  </div>

                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                        <th className="p-2 font-bold w-1/4">Exercise Name</th>
                        <th className="p-2 font-bold w-20">Difficulty</th>
                        <th className="p-2 font-bold w-28">Prescribed Volume</th>
                        <th className="p-2 font-bold w-20">Rest</th>
                        <th className="p-2 font-bold">Key Technical Cue & Checkpoint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cat.items.map((ex) => (
                        <tr key={ex.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">
                            <div>{ex.name}</div>
                            <div className="text-[9px] text-slate-400 font-normal">{ex.targetArea}</div>
                          </td>
                          <td className="p-2 font-semibold">
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-700">
                              {ex.difficulty}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-slate-700">{ex.defaultVolume}</td>
                          <td className="p-2 font-mono text-slate-600">{ex.restRecommended}</td>
                          <td className="p-2 text-slate-600 text-[10px] leading-tight">
                            <span className="italic font-medium text-slate-800">"{ex.cues}"</span>
                            {ex.coachingPoints && ex.coachingPoints[0] && (
                              <span className="block text-[9px] text-slate-500 mt-0.5">
                                · {ex.coachingPoints[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 4: PROGRESSION ROADMAP
          ============================================================ */}
      {shouldPrint('roadmap') && (
        <section className="print-break-inside-avoid mb-8">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              🎯 Progression Path to Straddle Planche
            </h2>
            <span className="text-[10px] text-slate-500 font-semibold">6-Step Biomechanical Ladder</span>
          </div>

          <div className="space-y-3.5">
            {PROGRESSION_ROADMAP.map((step) => (
              <div
                key={step.step}
                className={`print-break-inside-avoid border rounded-xl p-4 bg-white ${
                  step.isCurrent
                    ? 'border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/30'
                    : 'border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {step.step}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{step.name}</h3>
                  </div>

                  {step.isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">
                      ★ Current Target
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 italic mb-2 pl-8">{step.subtitle}</div>
                <p className="text-[11px] text-slate-700 leading-relaxed mb-2.5 pl-8">{step.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 pt-2 border-t border-slate-100 text-[10px]">
                  <div>
                    <strong className="text-slate-800 block mb-0.5">Mastery Standards:</strong>
                    <ul className="space-y-0.5 text-slate-600">
                      {step.criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">·</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-slate-800 block mb-0.5">Coaching Secret:</strong>
                    <p className="italic text-slate-600">{step.tips}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 5: RPE & STRENGTH CALCULATORS
          ============================================================ */}
      {shouldPrint('calculator') && (
        <section className="print-break-inside-avoid mb-8">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              ⚡ RPE, Submaximal Formulas & Load Prescription Guide
            </h2>
            <span className="text-[10px] text-slate-500 font-semibold">Tendon & CNS Optimization</span>
          </div>

          {/* Formulas Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="border border-slate-300 rounded-xl p-4 bg-white">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">
                Formula 1: Isometric Hold Duration (Straight-Arm)
              </h3>
              <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                Working hold duration = <strong>50%–65% of tested maximal hold</strong>.
              </p>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono space-y-1">
                <div>Max 8s hold → <strong>4s to 5s</strong> working sets (RPE 6)</div>
                <div>Max 10s hold → <strong>5s to 6s</strong> working sets (RPE 6)</div>
                <div>Max 15s hold → <strong>8s to 10s</strong> working sets (RPE 6)</div>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2">
                Rest: 90s to 120s between sets. Accumulate 5–8 total pristine sets.
              </span>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 bg-white">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">
                Formula 2: Dynamic Strength & Repetition Prescription
              </h3>
              <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                Submaximal reps per set = <strong>50%–60% of test max</strong> (2–3 reps in reserve).
              </p>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono space-y-1">
                <div>Max 5 reps → <strong>2 to 3 reps</strong> per set (4–5 sets)</div>
                <div>Max 10 reps → <strong>5 to 6 reps</strong> per set (3–4 sets)</div>
                <div>Max 15 reps → <strong>8 to 9 reps</strong> per set (3 sets)</div>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2">
                Rest: 90s (Push-ups/Dips) to 120s (Handstand Push-ups).
              </span>
            </div>
          </div>

          {/* Calisthenics RPE Scale Reference Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-100 p-2.5 border-b border-slate-300">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Official Calisthenics 10-Point RPE Scale Reference
              </h3>
            </div>
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[10px]">
                  <th className="p-2 font-bold w-16 text-center">RPE</th>
                  <th className="p-2 font-bold w-24">Exertion</th>
                  <th className="p-2 font-bold">Calisthenics Biomechanical Meaning</th>
                  <th className="p-2 font-bold w-28 text-center">Tendon Stress</th>
                  <th className="p-2 font-bold w-28 text-center">Prescribed Rest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 text-center font-bold text-rose-700">10</td>
                  <td className="p-2 font-semibold">Max Effort</td>
                  <td className="p-2 text-slate-600">Absolute failure. Elbows shaking, form break, zero reserve.</td>
                  <td className="p-2 text-center text-rose-600 font-semibold">Extreme</td>
                  <td className="p-2 text-center font-mono">3–5 min</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-bold text-amber-600">9</td>
                  <td className="p-2 font-semibold">Very Hard</td>
                  <td className="p-2 text-slate-600">Could have done 1 more second or 1 more rep with grit.</td>
                  <td className="p-2 text-center text-amber-600 font-semibold">High</td>
                  <td className="p-2 text-center font-mono">2–3 min</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-bold text-blue-600">8</td>
                  <td className="p-2 font-semibold">Hard</td>
                  <td className="p-2 text-slate-600">2 reps or 2–3s in reserve. Good speed, slight slowing.</td>
                  <td className="p-2 text-center text-blue-600 font-semibold">Moderate</td>
                  <td className="p-2 text-center font-mono">2 min</td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className="p-2 text-center font-bold text-emerald-600">7</td>
                  <td className="p-2 font-semibold">Submaximal ★</td>
                  <td className="p-2 text-slate-800 font-medium">3 reps in reserve. Effortless form, crisp bar lockout. Target zone.</td>
                  <td className="p-2 text-center text-emerald-600 font-semibold">Optimal</td>
                  <td className="p-2 text-center font-mono">90–120s</td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className="p-2 text-center font-bold text-emerald-600">6</td>
                  <td className="p-2 font-semibold">Submaximal ★</td>
                  <td className="p-2 text-slate-800 font-medium">Fast bar speed, complete control, tendon-friendly volume.</td>
                  <td className="p-2 text-center text-emerald-600 font-semibold">Optimal</td>
                  <td className="p-2 text-center font-mono">90s</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-bold text-slate-400">5</td>
                  <td className="p-2 font-semibold">Light / Warm-up</td>
                  <td className="p-2 text-slate-600">Effortless activation. Joint mobility, scapular flossing.</td>
                  <td className="p-2 text-center text-slate-400 font-semibold">Low</td>
                  <td className="p-2 text-center font-mono">60s</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 6: NUTRITION & TRANSFORMATION TRACKER
          ============================================================ */}
      {shouldPrint('transformation') && (
        <section className="print-break-inside-avoid mb-8">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              ⚖️ 12-Week Body Transformation & Nutrition System
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              Start Date: {transformationData.startDate}
            </span>
          </div>

          {/* Measurements Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white mb-5">
            <div className="bg-slate-100 p-2 border-b border-slate-300 font-bold text-[11px] text-slate-800">
              Circumference & Weight Audit (Start Date through Week 12)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="p-1.5 font-bold">Week</th>
                    <th className="p-1.5 font-bold">Date</th>
                    <th className="p-1.5 font-bold">Weight (lbs)</th>
                    <th className="p-1.5 font-bold">Chest (cm)</th>
                    <th className="p-1.5 font-bold">Arms (cm)</th>
                    <th className="p-1.5 font-bold">Navel (cm)</th>
                    <th className="p-1.5 font-bold">Hips (cm)</th>
                    <th className="p-1.5 font-bold">Thigh (cm)</th>
                    <th className="p-1.5 font-bold">Target Steps</th>
                    <th className="p-1.5 font-bold">Calories</th>
                    <th className="p-1.5 font-bold">Key Skill / Progress Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transformationData.entries.map((entry) => (
                    <tr
                      key={entry.weekNumber}
                      className={entry.isMilestone ? 'bg-amber-50/50 font-medium' : 'hover:bg-slate-50'}
                    >
                      <td className="p-1.5 font-bold text-slate-900 whitespace-nowrap">
                        {entry.weekLabel} {entry.isMilestone && '★'}
                      </td>
                      <td className="p-1.5 text-slate-500 whitespace-nowrap">{entry.date}</td>
                      <td className="p-1.5 font-semibold text-slate-900">{entry.weight || '—'}</td>
                      <td className="p-1.5 text-slate-700">{entry.chest || '—'}</td>
                      <td className="p-1.5 text-slate-700">
                        {entry.rightArm || entry.leftArm ? `${entry.rightArm || '—'} / ${entry.leftArm || '—'}` : '—'}
                      </td>
                      <td className="p-1.5 font-semibold text-blue-700">{entry.navelAt || '—'}</td>
                      <td className="p-1.5 text-slate-700">{entry.hips || '—'}</td>
                      <td className="p-1.5 text-slate-700">{entry.rightThigh || '—'}</td>
                      <td className="p-1.5 text-slate-600">{entry.targetDailySteps || '—'}</td>
                      <td className="p-1.5 text-slate-600">{entry.trainingDayCalories || '—'}</td>
                      <td className="p-1.5 text-slate-700 italic max-w-[160px] truncate">
                        {entry.keySkillProgress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 7: WORKOUT SESSION LOG HISTORY
          ============================================================ */}
      {shouldPrint('workout') && (
        <section className="print-break-inside-avoid mb-8">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              📝 Athlete Session History Logs ({workoutLogs.length} Logged Sessions)
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Recorded Progress</span>
          </div>

          {workoutLogs.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-200 text-center text-slate-500 text-xs italic">
              No live workout sessions recorded yet. Hit "Start Session" to log sets and live notes.
            </div>
          ) : (
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[11px]">
                    <th className="p-2.5 font-bold w-1/4">Date & Time</th>
                    <th className="p-2.5 font-bold w-1/4">Session Type</th>
                    <th className="p-2.5 font-bold text-center w-24">Sets Done</th>
                    <th className="p-2.5 font-bold text-center w-24">Target RPE</th>
                    <th className="p-2.5 font-bold">Athlete Notes & Live Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {workoutLogs.slice(0, 10).map((log: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2.5 font-medium text-slate-900">
                        {new Date(log.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-2.5 font-semibold text-blue-700">
                        {log.workoutIntensity || 'Submaximal Session'}
                      </td>
                      <td className="p-2.5 font-mono text-center text-slate-800">
                        {log.completedSets} / {log.totalSets}
                      </td>
                      <td className="p-2.5 font-mono text-center text-emerald-700 font-semibold">
                        {log.targetRpe || 'RPE 6'}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-600 italic">
                        {log.notes || 'No session notes entered.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          PRINT DOCUMENT FOOTER
          ============================================================ */}
      <footer className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 font-mono">
        PlancheLab Mastery Program · High-Frequency Submaximal Calisthenics System · All rights reserved.
      </footer>
    </div>
  );
};
