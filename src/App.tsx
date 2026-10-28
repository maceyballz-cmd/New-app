/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { HeroOverview } from './components/HeroOverview';
import { WorkoutSessionCompanion } from './components/WorkoutSessionCompanion';
import { CheatSheetTable } from './components/CheatSheetTable';
import { ExerciseDatabaseView } from './components/ExerciseDatabaseView';
import { ProgressionRoadmap } from './components/ProgressionRoadmap';
import { RpeCalculator } from './components/RpeCalculator';
import { TransformationView } from './components/TransformationView';
import { WorkoutLogHistory } from './components/WorkoutLogHistory';
import { PrintDocument, PrintScope } from './components/PrintDocument';
import { sound } from './utils/sound';
import {
  WorkoutType,
  WorkoutProgram,
  getWorkoutProgram,
  saveWorkoutProgram,
  resetWorkoutProgram,
} from './data/programData';
import {
  DatabaseExercise,
  getStoredExerciseDatabase,
  saveStoredExerciseDatabase,
} from './data/exerciseDatabase';
import { Printer, X, CheckCircle2, Layers, BookOpen, Sparkles, FileText } from 'lucide-react';

const TAB_INFO: Record<string, { title: string; desc: string }> = {
  overview: {
    title: 'Program Overview & Guidelines',
    desc: 'Prescribed rules, weekly frequency, and detailed 4-phase exercise breakdown.',
  },
  workout: {
    title: 'Workout Session & History',
    desc: 'Live session companion details and logged workout history entries.',
  },
  cheatsheet: {
    title: 'Master Workout Cheat Sheet',
    desc: 'High-contrast summary table with sets, reps, rest periods, and cues.',
  },
  exercises: {
    title: 'Exercise Database',
    desc: 'All 6 movement categories with difficulty levels, volume, and biomechanical cues.',
  },
  roadmap: {
    title: 'Progression Path to Straddle Planche',
    desc: '6-step progression ladder with prerequisites, hold times, and form checkpoints.',
  },
  calculator: {
    title: 'RPE Formulas & Scale Reference',
    desc: 'Isometric duration formula, dynamic rep prescriptions, and 10-point scale.',
  },
  transformation: {
    title: 'Nutrition & 12-Week Transformation',
    desc: 'Weekly body circumferences, weight changes, macro targets, and progress audit.',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'workout' | 'cheatsheet' | 'exercises' | 'roadmap' | 'calculator' | 'transformation'
  >('overview');

  const [activeWorkoutType, setActiveWorkoutType] = useState<WorkoutType>('submax');
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutProgram>(() =>
    getWorkoutProgram('submax')
  );

  const [exerciseDatabase, setExerciseDatabase] = useState<DatabaseExercise[]>(() =>
    getStoredExerciseDatabase()
  );

  const handleUpdateExerciseDatabase = (updated: DatabaseExercise[]) => {
    saveStoredExerciseDatabase(updated);
    setExerciseDatabase(updated);
  };

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.isEnabled());

  // Print Dialog & Scope State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printScope, setPrintScope] = useState<PrintScope>('current');
  const [selectedCustomScope, setSelectedCustomScope] = useState<PrintScope>('current');

  // Switch between 100% max, 50-60% submax, and 0-10% recovery
  const handleSelectWorkoutType = (type: WorkoutType) => {
    setActiveWorkoutType(type);
    const loaded = getWorkoutProgram(type);
    setCurrentWorkout(loaded);
  };

  // Save customized workout changes
  const handleSaveWorkout = (updatedWorkout: WorkoutProgram) => {
    saveWorkoutProgram(updatedWorkout);
    setCurrentWorkout(updatedWorkout);
  };

  // Reset to default prescribed template
  const handleResetWorkout = (type: WorkoutType) => {
    const defaultProg = resetWorkoutProgram(type);
    setCurrentWorkout(defaultProg);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
  };

  const handlePrint = () => {
    setSelectedCustomScope('current');
    setShowPrintModal(true);
  };

  const executePrint = (scope: PrintScope) => {
    setPrintScope(scope);
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Keyboard shortcut listener for Ctrl+P / Cmd+P defaults to current page
  useEffect(() => {
    const handleBeforePrint = () => {
      if (!showPrintModal) {
        setPrintScope('current');
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, [showPrintModal]);

  const handleStartSession = (exerciseId?: string) => {
    setSelectedExerciseId(exerciseId);
    setActiveTab('workout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Interactive Web Header (hidden during printing) */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPrint={handlePrint}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* Main Content Area (hidden during printing) */}
      <main className="no-print flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <HeroOverview
              currentWorkout={currentWorkout}
              activeWorkoutType={activeWorkoutType}
              onSelectWorkoutType={handleSelectWorkoutType}
              onSaveWorkout={handleSaveWorkout}
              onResetWorkout={handleResetWorkout}
              onStartSession={handleStartSession}
            />
            <CheatSheetTable
              workout={currentWorkout}
              onStartExercise={(name) => handleStartSession()}
            />
          </div>
        )}

        {activeTab === 'workout' && (
          <WorkoutSessionCompanion
            workout={currentWorkout}
            initialExerciseId={selectedExerciseId}
            onFinishWorkout={() => {}}
          />
        )}

        {activeTab === 'cheatsheet' && (
          <div className="space-y-8">
            <CheatSheetTable
              workout={currentWorkout}
              onStartExercise={(name) => handleStartSession()}
            />
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-8">
            <ExerciseDatabaseView
              exercises={exerciseDatabase}
              onUpdateExercises={handleUpdateExerciseDatabase}
              onStartExercise={(id) => handleStartSession(id)}
            />
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            <ProgressionRoadmap />
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="space-y-8">
            <RpeCalculator exerciseDatabase={exerciseDatabase} />
          </div>
        )}

        {activeTab === 'transformation' && (
          <div className="space-y-8">
            <TransformationView />
          </div>
        )}

        {/* History Section Drawer / Accordion */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <WorkoutLogHistory />
        </div>
      </main>

      {/* Footer conforming to design constitution */}
      <footer className="no-print border-t border-slate-200 bg-white py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Master Calisthenics Program</span>
            <span>·</span>
            <span>{currentWorkout.intensityLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('exercises')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Exercise Database
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('calculator')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              RPE Formula
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('transformation')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Nutrition & Transformation
            </button>
          </div>
        </div>
      </footer>

      {/* Print PDF Selection Modal Dialog */}
      {showPrintModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 no-print"
          onClick={() => setShowPrintModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Print / Save as PDF</h3>
                  <p className="text-xs text-slate-500">Choose the format and sections to include</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-5">
              {/* Option 1: Current Page */}
              <label
                onClick={() => setSelectedCustomScope('current')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedCustomScope === 'current'
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="print-scope"
                  checked={selectedCustomScope === 'current'}
                  onChange={() => setSelectedCustomScope('current')}
                  className="mt-0.5 accent-blue-600 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      Current Page: {TAB_INFO[activeTab]?.title || activeTab}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {TAB_INFO[activeTab]?.desc || 'Clean print layout formatted specifically for this page.'}
                  </p>
                </div>
              </label>

              {/* Option 2: All Pages / Complete Master Guide */}
              <label
                onClick={() => setSelectedCustomScope('all')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedCustomScope === 'all'
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="print-scope"
                  checked={selectedCustomScope === 'all'}
                  onChange={() => setSelectedCustomScope('all')}
                  className="mt-0.5 accent-blue-600 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      Complete Master Guide (All Pages Combined)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                      Full Booklet
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Combines Program Overview, Cheat Sheet, All Exercises, Roadmap, RPE Calculator, Nutrition Tracker & Session History into one complete PDF.
                  </p>
                </div>
              </label>

              {/* Option 3: Quick Specific Section Selector */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Or Print a Specific Section:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: 'overview', label: 'Program & Rules' },
                    { id: 'cheatsheet', label: 'Cheat Sheet Table' },
                    { id: 'exercises', label: 'Exercise Database' },
                    { id: 'roadmap', label: 'Progression Roadmap' },
                    { id: 'calculator', label: 'RPE Formulas & Scale' },
                    { id: 'transformation', label: 'Nutrition & 12-Wk Tracker' },
                    { id: 'workout', label: 'Session History Logs' },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedCustomScope(sec.id as PrintScope)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer ${
                        selectedCustomScope === sec.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 mb-5 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>PDF Export Tip:</strong> In your browser's print dialog, select <strong>"Save as PDF"</strong> as the destination and ensure <strong>"Background graphics"</strong> is checked for high-contrast tables.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executePrint(selectedCustomScope)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Print / PDF Dialog</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Document: Formatted strictly for print / PDF output */}
      <PrintDocument
        workout={currentWorkout}
        activeTab={activeTab}
        printScope={printScope}
        exerciseDatabase={exerciseDatabase}
      />
    </div>
  );
}
