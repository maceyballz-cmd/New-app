import React from 'react';
import { PROGRESSION_ROADMAP } from '../data/programData';
import { Target, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export const ProgressionRoadmap: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Progression Path to Straddle Planche
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Step-by-step biomechanical roadmap. Current working zone: Step 3 (Frog Planche with Raised Legs).
        </p>
      </div>

      <div className="space-y-6">
        {PROGRESSION_ROADMAP.map((step) => {
          const isCurrent = step.isCurrent;
          return (
            <div
              key={step.step}
              className={`p-5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {step.name}
                    </h3>
                    <div className="text-xs text-slate-500">{step.subtitle}</div>
                  </div>
                </div>

                {isCurrent && (
                  <span className="self-start sm:self-auto text-xs font-bold px-2.5 py-1 rounded-md bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>Current Active Target</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 my-2 leading-relaxed pl-10">
                {step.description}
              </p>

              {/* Criteria */}
              <div className="pl-10 mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">
                    Graduation Test Criteria:
                  </span>
                  <ul className="space-y-1">
                    {step.criteria.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-800 block mb-0.5">
                    Coaching Cue:
                  </span>
                  <p className="text-slate-600 italic">{step.tips}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
