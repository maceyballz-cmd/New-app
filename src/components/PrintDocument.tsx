import React from 'react';
import { WorkoutProgram, getCheatSheetRows } from '../data/programData';

interface PrintDocumentProps {
  workout: WorkoutProgram;
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({ workout }) => {
  const cheatSheetRows = getCheatSheetRows(workout);

  return (
    <div className="print-only hidden font-sans text-slate-900 bg-white max-w-4xl mx-auto p-4">
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 rounded-xl mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
          {workout.intensityLabel}
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">
          {workout.meta.title}
        </h1>
        <p className="text-slate-300 text-sm mb-4">
          {workout.meta.subtitle}
        </p>

        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-slate-700 text-xs">
          <div className="bg-white/10 p-2.5 rounded-lg">
            <span className="text-slate-400 block uppercase font-medium">Goal</span>
            <strong className="text-white text-sm">{workout.meta.goal}</strong>
          </div>
          <div className="bg-white/10 p-2.5 rounded-lg">
            <span className="text-slate-400 block uppercase font-medium">Target Timeline</span>
            <strong className="text-white text-sm">{workout.meta.timeline}</strong>
          </div>
          <div className="bg-white/10 p-2.5 rounded-lg">
            <span className="text-slate-400 block uppercase font-medium">Session Duration</span>
            <strong className="text-white text-sm">{workout.meta.sessionDuration}</strong>
          </div>
          <div className="bg-white/10 p-2.5 rounded-lg">
            <span className="text-slate-400 block uppercase font-medium">Target RPE</span>
            <strong className="text-sky-300 text-sm">{workout.meta.targetRPE}</strong>
          </div>
        </div>
      </header>

      {/* Key Training Rules */}
      <div className="print-break-inside-avoid border border-slate-300 rounded-xl p-5 mb-6 bg-white">
        <h2 className="text-base font-bold text-blue-700 mb-3 pb-2 border-b border-blue-100">
          💡 Key Training Rules & Guidelines
        </h2>
        <ul className="space-y-2 text-xs text-slate-700">
          {workout.rules.map((rule, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>
                <strong>{rule.title}: </strong>
                {rule.rule}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Phases */}
      {workout.phases.map((phase) => (
        <div
          key={phase.id}
          className="print-break-inside-avoid border border-slate-300 rounded-xl p-5 mb-6 bg-white"
        >
          <div className="flex justify-between items-baseline mb-2 pb-2 border-b border-blue-100">
            <h2 className="text-base font-bold text-blue-700">
              {phase.title}
            </h2>
            <span className="text-xs font-semibold text-slate-600">
              {phase.durationEstimate}
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">{phase.description}</p>

          <div className="space-y-4">
            {phase.exercises.map((ex) => (
              <div
                key={ex.id}
                className="border-b border-slate-200 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-xs text-slate-900">{ex.name}</span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {ex.badge}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mb-1">{ex.details}</div>
                <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded">
                  Focus: {ex.cues}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Master Cheat Sheet Table */}
      <div className="print-break-inside-avoid border border-slate-300 rounded-xl p-5 mb-6 bg-white">
        <h2 className="text-base font-bold text-blue-700 mb-3 pb-2 border-b border-blue-100">
          📊 Master Workout Cheat Sheet ({workout.intensityLabel})
        </h2>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
              <th className="p-2 font-semibold">Exercise</th>
              <th className="p-2 font-semibold">Sets</th>
              <th className="p-2 font-semibold">Reps / Hold</th>
              <th className="p-2 font-semibold">Rest</th>
              <th className="p-2 font-semibold">Intensity & Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {cheatSheetRows.map((row, idx) => (
              <tr key={idx}>
                <td className="p-2 font-bold">{row.exercise}</td>
                <td className="p-2 font-mono">{row.sets}</td>
                <td className="p-2 font-mono">{row.reps}</td>
                <td className="p-2 font-bold text-blue-800 font-mono">{row.rest}</td>
                <td className="p-2 text-slate-600">{row.intensity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
