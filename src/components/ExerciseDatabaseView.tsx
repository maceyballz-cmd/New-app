import React, { useState } from 'react';
import { DatabaseExercise } from '../data/exerciseDatabase';
import {
  Search,
  Database,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Trash2,
  Sparkles,
  Dumbbell,
  Check
} from 'lucide-react';
import { sound } from '../utils/sound';

interface ExerciseDatabaseViewProps {
  exercises: DatabaseExercise[];
  onUpdateExercises: (exercises: DatabaseExercise[]) => void;
  onStartExercise?: (exerciseId: string) => void;
}

type FilterCategory = 'all' | 'planche' | 'push' | 'prep' | 'accessory' | 'mobility';

export const ExerciseDatabaseView: React.FC<ExerciseDatabaseViewProps> = ({
  exercises,
  onUpdateExercises,
  onStartExercise,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add Exercise Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExercise, setNewExercise] = useState<Partial<DatabaseExercise>>({
    name: '',
    category: 'push',
    categoryLabel: 'Overhead & Pushing',
    targetArea: 'Shoulders, Triceps & Chest',
    difficulty: 'Intermediate',
    type: 'Bent-Arm Dynamic',
    defaultVolume: '3–4 sets × 6–8 reps',
    restRecommended: '90s (1.5 min)',
    cues: 'Controlled eccentric, lock out at top.',
    details: 'Strength builder targeting dynamic pressing force and neuromuscular control.',
    coachingPoints: ['Control the eccentric phase', 'Full active range of motion'],
    commonMistakes: ['Cutting depth short', 'Using excessive momentum'],
  });

  const [newCheckpoint, setNewCheckpoint] = useState('');
  const [newMistake, setNewMistake] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCategoryChange = (category: 'planche' | 'push' | 'prep' | 'accessory' | 'mobility') => {
    const labels: Record<string, string> = {
      planche: 'Planche Skills',
      push: 'Overhead & Pushing',
      prep: 'Joint Prep & Wrists',
      accessory: 'Tendon & Accessories',
      mobility: 'Mobility & Recovery',
    };
    setNewExercise((prev) => ({
      ...prev,
      category,
      categoryLabel: labels[category],
    }));
  };

  const addCheckpoint = () => {
    if (!newCheckpoint.trim()) return;
    setNewExercise((prev) => ({
      ...prev,
      coachingPoints: [...(prev.coachingPoints || []), newCheckpoint.trim()],
    }));
    setNewCheckpoint('');
  };

  const removeCheckpoint = (idx: number) => {
    setNewExercise((prev) => ({
      ...prev,
      coachingPoints: prev.coachingPoints?.filter((_, i) => i !== idx),
    }));
  };

  const addMistake = () => {
    if (!newMistake.trim()) return;
    setNewExercise((prev) => ({
      ...prev,
      commonMistakes: [...(prev.commonMistakes || []), newMistake.trim()],
    }));
    setNewMistake('');
  };

  const removeMistake = (idx: number) => {
    setNewExercise((prev) => ({
      ...prev,
      commonMistakes: prev.commonMistakes?.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveNewExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.name?.trim()) {
      alert('Please enter an exercise name.');
      return;
    }

    const created: DatabaseExercise = {
      id: `custom-db-${Date.now()}`,
      name: newExercise.name.trim(),
      category: newExercise.category || 'push',
      categoryLabel: newExercise.categoryLabel || 'Overhead & Pushing',
      targetArea: newExercise.targetArea || 'Target Musculature',
      difficulty: newExercise.difficulty || 'Intermediate',
      type: newExercise.type || 'Bent-Arm Dynamic',
      defaultVolume: newExercise.defaultVolume || '3–4 sets × 8–10 reps',
      restRecommended: newExercise.restRecommended || '90s',
      cues: newExercise.cues || 'Maintain strict alignment and controlled tempo.',
      details: newExercise.details || 'Biomechanical strength and motor control builder.',
      coachingPoints: newExercise.coachingPoints?.length
        ? newExercise.coachingPoints
        : ['Maintain strict form', 'Controlled tempo'],
      commonMistakes: newExercise.commonMistakes?.length
        ? newExercise.commonMistakes
        : ['Rushing repetitions', 'Form breakdown under fatigue'],
    };

    const updated = [created, ...exercises];
    onUpdateExercises(updated);
    sound.playSuccessChime();
    setShowAddModal(false);
    setToastMessage(`"${created.name}" added to database & calculator dropdown!`);
    setTimeout(() => setToastMessage(null), 3500);

    // Reset form
    setNewExercise({
      name: '',
      category: 'push',
      categoryLabel: 'Overhead & Pushing',
      targetArea: 'Shoulders, Triceps & Chest',
      difficulty: 'Intermediate',
      type: 'Bent-Arm Dynamic',
      defaultVolume: '3–4 sets × 6–8 reps',
      restRecommended: '90s (1.5 min)',
      cues: 'Controlled eccentric, lock out at top.',
      details: 'Strength builder targeting dynamic pressing force and neuromuscular control.',
      coachingPoints: ['Control the eccentric phase', 'Full active range of motion'],
      commonMistakes: ['Cutting depth short', 'Using excessive momentum'],
    });
  };

  const handleDeleteExercise = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the exercise database?`)) {
      const updated = exercises.filter((ex) => ex.id !== id);
      onUpdateExercises(updated);
      setToastMessage(`"${name}" removed from database.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchesQuery =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targetArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.cues.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Calisthenics Exercise Database
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical reference database with volume recommendations, anatomical targets, and coaching cues.
          </p>
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise, muscle, cue..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exercise</span>
          </button>
        </div>
      </div>

      {/* Modal / Add Exercise Card */}
      {showAddModal && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Add New Exercise to Database
              </h3>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveNewExercise} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ring Dips, Barbell OHP, Pelvis Lifts..."
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newExercise.category}
                  onChange={(e) =>
                    handleCategoryChange(
                      e.target.value as 'planche' | 'push' | 'prep' | 'accessory' | 'mobility'
                    )
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="push">Overhead & Pushing (Strength)</option>
                  <option value="planche">Planche Skills (Straight-Arm)</option>
                  <option value="accessory">Tendon & Accessories (Prehab)</option>
                  <option value="prep">Joint Prep & Wrists</option>
                  <option value="mobility">Mobility & Recovery</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Movement Type
                </label>
                <select
                  value={newExercise.type}
                  onChange={(e) =>
                    setNewExercise({
                      ...newExercise,
                      type: e.target.value as DatabaseExercise['type'],
                    })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                >
                  <option value="Bent-Arm Dynamic">Bent-Arm Dynamic (Strength)</option>
                  <option value="Straight-Arm Isometric">Straight-Arm Isometric</option>
                  <option value="Joint Conditioning">Joint Conditioning</option>
                  <option value="Restorative Mobility">Restorative Mobility</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={newExercise.difficulty}
                  onChange={(e) =>
                    setNewExercise({
                      ...newExercise,
                      difficulty: e.target.value as DatabaseExercise['difficulty'],
                    })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Prescribed Volume
                </label>
                <input
                  type="text"
                  placeholder="3–4 sets × 8–10 reps"
                  value={newExercise.defaultVolume}
                  onChange={(e) =>
                    setNewExercise({ ...newExercise, defaultVolume: e.target.value })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Recommended Rest
                </label>
                <input
                  type="text"
                  placeholder="90s or 2 min"
                  value={newExercise.restRecommended}
                  onChange={(e) =>
                    setNewExercise({ ...newExercise, restRecommended: e.target.value })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target Musculature & Anatomy
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anterior Deltoids, Serratus, Triceps"
                  value={newExercise.targetArea}
                  onChange={(e) =>
                    setNewExercise({ ...newExercise, targetArea: e.target.value })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Primary Technical Form Cue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keep elbows locked straight, dome upper back"
                  value={newExercise.cues}
                  onChange={(e) => setNewExercise({ ...newExercise, cues: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 italic"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Biomechanical Overview & Details
              </label>
              <textarea
                rows={2}
                placeholder="Explain the physiological purpose and mechanical advantage..."
                value={newExercise.details}
                onChange={(e) => setNewExercise({ ...newExercise, details: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            {/* Checkpoints & Mistakes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              {/* Checkpoints */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Technique Checkpoints:
                </label>
                <div className="flex items-center gap-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="Add a form standard..."
                    value={newCheckpoint}
                    onChange={(e) => setNewCheckpoint(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCheckpoint();
                      }
                    }}
                    className="flex-1 text-xs bg-white border border-slate-300 rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={addCheckpoint}
                    className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1 text-xs">
                  {newExercise.coachingPoints?.map((pt, i) => (
                    <li key={i} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200">
                      <span className="text-slate-700">· {pt}</span>
                      <button
                        type="button"
                        onClick={() => removeCheckpoint(i)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mistakes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Common Mistakes to Avoid:
                </label>
                <div className="flex items-center gap-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="Add a common mistake..."
                    value={newMistake}
                    onChange={(e) => setNewMistake(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMistake();
                      }
                    }}
                    className="flex-1 text-xs bg-white border border-slate-300 rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={addMistake}
                    className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1 text-xs">
                  {newExercise.commonMistakes?.map((m, i) => (
                    <li key={i} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200">
                      <span className="text-rose-800">× {m}</span>
                      <button
                        type="button"
                        onClick={() => removeMistake(i)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Database</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Exercises (${exercises.length})` },
          { id: 'planche', label: 'Planche Skills' },
          { id: 'push', label: 'Overhead & Pushing' },
          { id: 'prep', label: 'Joint Prep & Wrists' },
          { id: 'accessory', label: 'Tendon & Accessories' },
          { id: 'mobility', label: 'Mobility & Recovery' },
        ].map((tab) => {
          const active = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as FilterCategory)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Database Table Matrix */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4">Exercise</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Target Musculature</th>
              <th className="py-3 px-4">Prescribed Volume</th>
              <th className="py-3 px-4">Rest</th>
              <th className="py-3 px-4">Form Focus & Details</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExercises.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                  No exercises matched your search query. Try clearing the filter or adding a new exercise above.
                </td>
              </tr>
            ) : (
              filteredExercises.map((ex) => {
                const isExpanded = expandedId === ex.id;
                const isCustom = ex.id.startsWith('custom-db-');

                return (
                  <React.Fragment key={ex.id}>
                    <tr
                      onClick={() => toggleExpand(ex.id)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{ex.name}</span>
                          {isCustom && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Custom
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              ex.difficulty === 'Elite'
                                ? 'bg-amber-100 text-amber-900'
                                : ex.difficulty === 'Advanced'
                                ? 'bg-indigo-100 text-indigo-900'
                                : ex.difficulty === 'Intermediate'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ex.difficulty}
                          </span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                          {ex.type}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                        {ex.categoryLabel}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-700 max-w-xs">
                        {ex.targetArea}
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-800 text-xs">
                        {ex.defaultVolume}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded ${
                            ex.restRecommended.includes('3 min') ||
                            ex.restRecommended.includes('4 min') ||
                            ex.restRecommended.includes('180s')
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : ex.restRecommended.includes('2 min') ||
                                ex.restRecommended.includes('120s')
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ex.restRecommended}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-sm">
                        <p className="line-clamp-2 italic text-slate-700 font-medium">
                          "{ex.cues}"
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExercise(ex.id, ex.name);
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                              title="Delete custom exercise"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            aria-label="Toggle details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Technical Breakdown Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td colSpan={7} className="p-4 sm:p-6">
                          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Biomechanical Rationale & Overview
                              </h4>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {ex.details}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                              {/* Coaching checkpoints */}
                              <div>
                                <h5 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Technique Checkpoints</span>
                                </h5>
                                <ul className="space-y-1.5 text-xs text-slate-600">
                                  {ex.coachingPoints.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-blue-500 font-bold">·</span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Common mistakes */}
                              <div>
                                <h5 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                                  <span>Common Mistakes to Avoid</span>
                                </h5>
                                <ul className="space-y-1.5 text-xs text-slate-600">
                                  {ex.commonMistakes.map((mistake, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-rose-500 font-bold">×</span>
                                      <span>{mistake}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Cues callout */}
                            <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <strong className="font-semibold block mb-0.5">Primary Technical Focus Cue:</strong>
                                <span className="italic">"{ex.cues}"</span>
                              </div>

                              {onStartExercise && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStartExercise(ex.id);
                                  }}
                                  className="self-start sm:self-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Track In Session</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footnote matching Cheat Sheet aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <strong className="block text-slate-800 font-semibold mb-0.5">
            Serratus Protraction & Depression
          </strong>
          Dome the upper back aggressively on every straight-arm hold to engage the serratus anterior and lock the scapulae.
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <strong className="block text-slate-800 font-semibold mb-0.5">
            100% Strict Elbow Lockout
          </strong>
          Any micro-bend transfers shear strain directly to the distal biceps tendon instead of bone alignment.
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <strong className="block text-slate-800 font-semibold mb-0.5">
            Automatic Calculator Sync
          </strong>
          Any strength-based exercise added here is automatically available in the RPE Calculator's repetition formula dropdown!
        </div>
      </div>
    </div>
  );
};
