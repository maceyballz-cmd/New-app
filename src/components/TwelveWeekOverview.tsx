import React from 'react';
import {
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import {
  WeeklyProgressEntry,
  MeasureUnit,
  calculateSevenDayAverage,
  formatCmForDisplay,
  parseNumericMetric,
  getEffectiveDailyCalorieTarget,
  getWeekCheckInSummaryStats,
} from '../data/transformationData';

interface TwelveWeekOverviewProps {
  entries: WeeklyProgressEntry[];
  selectedWeek: number;
  measureUnit: MeasureUnit;
  onSelectWeekForCheckIn: (weekNum: number) => void;
}

export const TwelveWeekOverview: React.FC<TwelveWeekOverviewProps> = ({
  entries,
  selectedWeek,
  measureUnit,
  onSelectWeekForCheckIn,
}) => {
  const startEntry = entries.find((e) => e.weekNumber === 0) || entries[0];
  const startWeightNum = (() => {
    const avg = calculateSevenDayAverage(startEntry?.dailyWeighIns).avg;
    return avg ?? parseNumericMetric(startEntry?.weight);
  })();

  const getDisplayWeight = (entry: WeeklyProgressEntry): number | null => {
    const logged = parseNumericMetric(entry.weight);
    if (logged !== null) return logged;
    return calculateSevenDayAverage(entry.dailyWeighIns).avg;
  };

  const phases: Array<{ title: string; subtitle: string; weekNums: number[] }> = [
    {
      title: 'Baseline & Weeks 1–4',
      subtitle: 'Phase 1 · Ends with Week 4 Milestone Review',
      weekNums: [0, 1, 2, 3, 4],
    },
    {
      title: 'Weeks 5–8',
      subtitle: 'Phase 2 · Ends with Week 8 Milestone Review',
      weekNums: [5, 6, 7, 8],
    },
    {
      title: 'Weeks 9–12',
      subtitle: 'Phase 3 · Ends with Week 12 Final Milestone Review',
      weekNums: [9, 10, 11, 12],
    },
  ];

  return (
    <div className="space-y-5">
      {phases.map((phase) => {
        const phaseEntries = phase.weekNums
          .map((w) => entries.find((e) => e.weekNumber === w))
          .filter((e): e is WeeklyProgressEntry => Boolean(e));

        return (
          <div key={phase.title} className="space-y-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {phase.title}
              </h3>
              <span className="text-[11px] text-slate-400">{phase.subtitle}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {phaseEntries.map((entry) => {
                const isSelected = entry.weekNumber === selectedWeek;
                const isMilestone = Boolean(entry.isMilestone && entry.weekNumber > 0);
                const weightVal = getDisplayWeight(entry);
                const weightDelta =
                  entry.weekNumber > 0 && weightVal !== null && startWeightNum !== null
                    ? weightVal - startWeightNum
                    : null;

                const waistDisplay = entry.navelAt
                  ? `${formatCmForDisplay(entry.navelAt, measureUnit)} ${measureUnit}`
                  : '—';

                const stepsNum = parseNumericMetric(entry.actualDailySteps);
                const stepsDisplay =
                  stepsNum !== null ? stepsNum.toLocaleString('en-US') : '—';

                const actualCals = parseNumericMetric(entry.actualDailyCalories);
                const targetCals = getEffectiveDailyCalorieTarget(entry);
                const caloriesDisplay =
                  actualCals !== null
                    ? `${actualCals.toLocaleString('en-US')} kcal`
                    : targetCals !== null
                    ? `${targetCals.toLocaleString('en-US')} target`
                    : '—';

                const trainingDisplay = entry.trainingAdherence
                  ? entry.trainingAdherence
                  : entry.trainingDays
                  ? `${entry.trainingDays} days`
                  : '—';

                const { filledSections } = getWeekCheckInSummaryStats(entry);

                return (
                  <button
                    key={entry.weekNumber}
                    type="button"
                    onClick={() => onSelectWeekForCheckIn(entry.weekNumber)}
                    className={`text-left rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : isMilestone
                        ? 'bg-amber-50/50 hover:bg-amber-50/90 border-amber-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-xs font-bold ${
                                isSelected
                                  ? 'text-blue-900'
                                  : isMilestone
                                  ? 'text-amber-950'
                                  : 'text-slate-900'
                              }`}
                            >
                              {entry.weekLabel}
                            </span>
                            {isMilestone && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[9px] font-bold uppercase tracking-wider">
                                <Sparkles className="w-2.5 h-2.5" />
                                Milestone
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{entry.date}</span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : filledSections > 0
                              ? 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700'
                              : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-700'
                          }`}
                        >
                          {filledSections === 4 ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Pencil className="w-2.5 h-2.5" />
                          )}
                          <span>{isSelected ? 'Editing' : filledSections > 0 ? `${filledSections}/4` : 'Log'}</span>
                        </span>
                      </div>

                      {/* Primary Weight + Neutral Change Indicator */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                            Weight
                          </span>
                          <span className="text-base font-bold text-slate-900 tabular-nums">
                            {weightVal !== null ? `${weightVal.toFixed(1)} lbs` : '—'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                            vs Start
                          </span>
                          {weightDelta !== null ? (
                            <span
                              className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
                                Math.abs(weightDelta) < 0.05
                                  ? 'text-slate-500'
                                  : weightDelta > 0
                                  ? 'text-indigo-700'
                                  : 'text-sky-700'
                              }`}
                            >
                              {Math.abs(weightDelta) < 0.05 ? (
                                <Minus className="w-3 h-3" />
                              ) : weightDelta > 0 ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {weightDelta > 0
                                  ? `+${weightDelta.toFixed(1)}`
                                  : weightDelta.toFixed(1)}{' '}
                                lbs
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              {entry.weekNumber === 0 ? 'Baseline' : '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4 Compact Key Metrics */}
                    <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Waist</span>
                        <span className="font-semibold text-slate-800 tabular-nums truncate block">
                          {waistDisplay}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Avg Steps</span>
                        <span className="font-semibold text-slate-800 tabular-nums truncate block">
                          {stepsDisplay}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Avg Calories</span>
                        <span className="font-semibold text-slate-800 tabular-nums truncate block">
                          {caloriesDisplay}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Training</span>
                        <span className="font-semibold text-slate-800 tabular-nums truncate block">
                          {trainingDisplay}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
