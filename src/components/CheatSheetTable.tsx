import React, { useState } from 'react';
import { WorkoutProgram, getCheatSheetRows } from '../data/programData';
import { Search, FileSpreadsheet } from 'lucide-react';

interface CheatSheetTableProps {
  workout: WorkoutProgram;
  onStartExercise?: (name: string) => void;
}

export const CheatSheetTable: React.FC<CheatSheetTableProps> = ({ workout, onStartExercise }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const rows = getCheatSheetRows(workout);

  const filteredRows = rows.filter(
    (row) =>
      row.exercise.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.intensity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Master Workout Cheat Sheet ({workout.intensityLabel})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick reference guide for set counts, hold times, mandatory rests, and prescribed intensities.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercise or cue..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4">Exercise</th>
              <th className="py-3 px-4">Sets</th>
              <th className="py-3 px-4">Reps / Hold</th>
              <th className="py-3 px-4">Rest Interval</th>
              <th className="py-3 px-4">Intensity & Form Focus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">{row.exercise}</td>
                <td className="py-3.5 px-4 text-slate-700 font-mono tabular-nums">{row.sets}</td>
                <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-800">
                  {row.reps}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded ${
                      row.rest.includes('3 min') || row.rest.includes('4 min') || row.rest.includes('5 min')
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : row.rest.includes('2 min')
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {row.rest}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-600">{row.intensity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnote on RPE & Rest */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <strong className="block text-slate-800 font-semibold mb-0.5">Target: {workout.meta.targetRPE}</strong>
          Follow prescribed intensity. Terminate every set while form remains strictly pristine.
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <strong className="block text-slate-800 font-semibold mb-0.5">Neural Rest Intervals</strong>
          Essential for neural recovery and ATP replenishment. Never shorten rest on straight-arm holds.
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <strong className="block text-slate-800 font-semibold mb-0.5">Locked Elbows</strong>
          Skeletal alignment transmits force safely. Micro-bending shifts torque to the biceps tendon.
        </div>
      </div>
    </div>
  );
};
