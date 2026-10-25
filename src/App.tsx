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
import { PrintDocument } from './components/PrintDocument';
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
import { Printer } from 'lucide-react';

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
    window.print();
  };

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

      {/* Print Document: Formatted strictly for print / PDF output */}
      <PrintDocument workout={currentWorkout} />
    </div>
  );
}
