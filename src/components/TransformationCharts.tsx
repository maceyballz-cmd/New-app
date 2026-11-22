import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Scale,
  Ruler,
  Footprints,
  Utensils,
  Activity,
} from 'lucide-react';
import {
  WeeklyProgressEntry,
  MeasureUnit,
  calculateSevenDayAverage,
  cmNumberToUnit,
  parseNumericMetric,
  getEffectiveDailyCalorieTarget,
} from '../data/transformationData';

interface TransformationChartsProps {
  entries: WeeklyProgressEntry[];
  measureUnit: MeasureUnit;
}

type BodyMeasurementKey =
  | 'chest'
  | 'rightArm'
  | 'leftArm'
  | 'hips'
  | 'rightThigh'
  | 'leftThigh';

const BODY_MEASUREMENT_OPTIONS: Array<{ key: BodyMeasurementKey; label: string }> = [
  { key: 'chest', label: 'Chest' },
  { key: 'rightArm', label: 'Right Arm' },
  { key: 'leftArm', label: 'Left Arm' },
  { key: 'hips', label: 'Hips' },
  { key: 'rightThigh', label: 'Right Thigh' },
  { key: 'leftThigh', label: 'Left Thigh' },
];

interface ChartPoint {
  weekNumber: number;
  label: string;
  isMilestone?: boolean;
  value: number | null;
  secondaryValue?: number | null;
}

const NeutralDeltaBadge: React.FC<{ delta: number | null; unit: string; decimals?: number }> = ({
  delta,
  unit,
  decimals = 1,
}) => {
  if (delta === null) {
    return <span className="text-xs text-slate-400 font-medium">—</span>;
  }
  const threshold = decimals === 0 ? 0.5 : 0.05;
  const isNeutral = Math.abs(delta) < threshold;
  const isUp = delta >= threshold;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums px-2 py-0.5 rounded-md border ${
        isNeutral
          ? 'bg-slate-100 text-slate-600 border-slate-200'
          : isUp
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-sky-50 text-sky-700 border-sky-200'
      }`}
    >
      {isNeutral ? (
        <Minus className="w-3 h-3" />
      ) : isUp ? (
        <ArrowUpRight className="w-3.5 h-3.5" />
      ) : (
        <ArrowDownRight className="w-3.5 h-3.5" />
      )}
      <span>
        {delta > 0 ? `+${delta.toFixed(decimals)}` : delta.toFixed(decimals)} {unit}
      </span>
    </span>
  );
};

/* Clean, compact SVG Dual-Line Chart */
const SvgLineChart: React.FC<{
  points: ChartPoint[];
  unit: string;
  primaryLabel: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  decimals?: number;
}> = ({
  points,
  unit,
  primaryLabel,
  secondaryLabel,
  primaryColor = '#2563eb',
  secondaryColor = '#0ea5e9',
  decimals = 1,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const validValues = points
    .flatMap((p) => [p.value, p.secondaryValue])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  if (validValues.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
        Log data in weekly check-ins to display trend chart
      </div>
    );
  }

  const minRaw = Math.min(...validValues);
  const maxRaw = Math.max(...validValues);
  const pad = Math.max((maxRaw - minRaw) * 0.18, decimals === 0 ? 10 : 1);
  const minY = minRaw - pad;
  const maxY = maxRaw + pad;
  const rangeY = Math.max(0.01, maxY - minY);

  const width = 560;
  const height = 170;
  const padLeft = 42;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) =>
    points.length <= 1 ? padLeft + plotW / 2 : padLeft + (idx / (points.length - 1)) * plotW;
  const getY = (val: number) => padTop + ((maxY - val) / rangeY) * plotH;

  const buildPath = (accessor: (p: ChartPoint) => number | null | undefined) => {
    const segments: string[] = [];
    points.forEach((p, idx) => {
      const v = accessor(p);
      if (typeof v === 'number' && Number.isFinite(v)) {
        const cmd = segments.length === 0 ? 'M' : 'L';
        segments.push(`${cmd} ${getX(idx).toFixed(1)} ${getY(v).toFixed(1)}`);
      }
    });
    return segments.join(' ');
  };

  const primaryPath = buildPath((p) => p.value);
  const secondaryPath = secondaryLabel ? buildPath((p) => p.secondaryValue) : '';

  const yTicks = [maxY, minY + rangeY / 2, minY];
  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="space-y-2">
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          {/* Horizontal grid lines */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] tabular-nums"
                >
                  {tick.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          {/* Milestone subtle vertical lines (W4, W8, W12) */}
          {points.map((p, idx) =>
            p.isMilestone && p.weekNumber > 0 ? (
              <line
                key={`ms-${p.weekNumber}`}
                x1={getX(idx)}
                y1={padTop}
                x2={getX(idx)}
                y2={height - padBottom}
                stroke="#fcd34d"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            ) : null
          )}

          {/* Secondary Line */}
          {secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Primary Line */}
          {primaryPath && (
            <path
              d={primaryPath}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & X Labels */}
          {points.map((p, idx) => {
            const cx = getX(idx);
            return (
              <g
                key={p.weekNumber}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={cx - plotW / (points.length * 2)}
                  y={padTop}
                  width={Math.max(18, plotW / points.length)}
                  height={plotH + padBottom}
                  fill="transparent"
                />
                {typeof p.secondaryValue === 'number' && (
                  <circle
                    cx={cx}
                    cy={getY(p.secondaryValue)}
                    r={hoveredIdx === idx ? 4.5 : 3}
                    fill="#ffffff"
                    stroke={secondaryColor}
                    strokeWidth="2"
                  />
                )}
                {typeof p.value === 'number' && (
                  <circle
                    cx={cx}
                    cy={getY(p.value)}
                    r={hoveredIdx === idx ? 5 : 3.5}
                    fill={p.isMilestone && p.weekNumber > 0 ? '#f59e0b' : primaryColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  className={`text-[10px] tabular-nums ${
                    p.isMilestone && p.weekNumber > 0
                      ? 'fill-amber-700 font-bold'
                      : 'fill-slate-400'
                  }`}
                >
                  {p.weekNumber === 0 ? 'S' : `W${p.weekNumber}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend + Hover Inspection Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: primaryColor }}
            />
            <span>{primaryLabel}</span>
          </span>
          {secondaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-3 h-0.5 inline-block border-t-2 border-dashed"
                style={{ borderColor: secondaryColor }}
              />
              <span>{secondaryLabel}</span>
            </span>
          )}
        </div>

        {hoveredPoint && (hoveredPoint.value !== null || hoveredPoint.secondaryValue != null) ? (
          <span className="font-semibold text-slate-800 tabular-nums">
            {hoveredPoint.label}:{' '}
            {hoveredPoint.value !== null ? `${hoveredPoint.value.toFixed(decimals)} ${unit}` : '—'}
            {secondaryLabel && typeof hoveredPoint.secondaryValue === 'number'
              ? ` · ${secondaryLabel}: ${hoveredPoint.secondaryValue.toFixed(decimals)} ${unit}`
              : ''}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Hover points for exact values</span>
        )}
      </div>
    </div>
  );
};

/* Clean SVG Bar Chart for Steps / Adherence / Consistency */
const SvgBarChart: React.FC<{
  points: ChartPoint[];
  unit: string;
  barColor?: string;
  targetLineColor?: string;
  primaryLabel: string;
  targetLabel?: string;
  decimals?: number;
}> = ({
  points,
  unit,
  barColor = '#10b981',
  targetLineColor = '#64748b',
  primaryLabel,
  targetLabel,
  decimals = 0,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const validValues = points
    .flatMap((p) => [p.value, p.secondaryValue])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  if (validValues.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
        Log weekly data to view chart
      </div>
    );
  }

  const maxRaw = Math.max(...validValues);
  const maxY = Math.max(decimals === 0 ? 100 : 10, maxRaw * 1.15);

  const width = 560;
  const height = 170;
  const padLeft = 44;
  const padRight = 14;
  const padTop = 14;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const slotW = plotW / points.length;
  const barW = Math.min(24, slotW * 0.58);

  const getY = (val: number) => padTop + ((maxY - val) / maxY) * plotH;
  const yTicks = [maxY, maxY / 2, 0];

  const targetPath = (() => {
    if (!targetLabel) return '';
    const segs: string[] = [];
    points.forEach((p, idx) => {
      if (typeof p.secondaryValue === 'number' && Number.isFinite(p.secondaryValue)) {
        const x = padLeft + idx * slotW + slotW / 2;
        const y = getY(p.secondaryValue);
        segs.push(`${segs.length === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    });
    return segs.join(' ');
  })();

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="space-y-2">
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] tabular-nums"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          {points.map((p, idx) => {
            const centerX = padLeft + idx * slotW + slotW / 2;
            const hasVal = typeof p.value === 'number' && Number.isFinite(p.value);
            const barH = hasVal ? Math.max(3, ((p.value as number) / maxY) * plotH) : 0;
            const barY = padTop + plotH - barH;

            return (
              <g
                key={p.weekNumber}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={padLeft + idx * slotW}
                  y={padTop}
                  width={slotW}
                  height={plotH + padBottom}
                  fill="transparent"
                />
                {hasVal ? (
                  <rect
                    x={centerX - barW / 2}
                    y={barY}
                    width={barW}
                    height={barH}
                    rx="3"
                    fill={
                      hoveredIdx === idx
                        ? '#1d4ed8'
                        : p.isMilestone && p.weekNumber > 0
                        ? '#f59e0b'
                        : barColor
                    }
                    fillOpacity={hoveredIdx === idx ? 1 : 0.85}
                  />
                ) : (
                  <rect
                    x={centerX - barW / 2}
                    y={padTop + plotH - 3}
                    width={barW}
                    height={3}
                    rx="1.5"
                    fill="#e2e8f0"
                  />
                )}
                <text
                  x={centerX}
                  y={height - 6}
                  textAnchor="middle"
                  className={`text-[10px] tabular-nums ${
                    p.isMilestone && p.weekNumber > 0
                      ? 'fill-amber-700 font-bold'
                      : 'fill-slate-400'
                  }`}
                >
                  {p.weekNumber === 0 ? 'S' : `W${p.weekNumber}`}
                </text>
              </g>
            );
          })}

          {targetPath && (
            <path
              d={targetPath}
              fill="none"
              stroke={targetLineColor}
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs inline-block"
              style={{ backgroundColor: barColor }}
            />
            <span>{primaryLabel}</span>
          </span>
          {targetLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-3 h-0.5 inline-block border-t-2 border-dashed"
                style={{ borderColor: targetLineColor }}
              />
              <span>{targetLabel}</span>
            </span>
          )}
        </div>

        {hoveredPoint && hoveredPoint.value !== null ? (
          <span className="font-semibold text-slate-800 tabular-nums">
            {hoveredPoint.label}: {hoveredPoint.value.toLocaleString('en-US')} {unit}
            {targetLabel && hoveredPoint.secondaryValue != null
              ? ` (Target: ${hoveredPoint.secondaryValue.toLocaleString('en-US')} ${unit})`
              : ''}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Hover bars for exact values</span>
        )}
      </div>
    </div>
  );
};

export const TransformationCharts: React.FC<TransformationChartsProps> = ({
  entries,
  measureUnit,
}) => {
  const [selectedOtherMetric, setSelectedOtherMetric] = useState<BodyMeasurementKey>('chest');

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.weekNumber - b.weekNumber),
    [entries]
  );

  // Helper to compute Start, Current (latest logged), and Total Change
  const buildComparisonMetric = (
    label: string,
    unit: string,
    extractor: (e: WeeklyProgressEntry) => number | null,
    decimals = 1
  ) => {
    const vals = sortedEntries
      .map((e) => ({ label: e.weekLabel, val: extractor(e) }))
      .filter((item): item is { label: string; val: number } => item.val !== null);

    const startItem = vals[0] || null;
    const currentItem = vals[vals.length - 1] || null;
    const delta =
      startItem && currentItem && vals.length >= 2 ? currentItem.val - startItem.val : null;

    return {
      label,
      unit,
      decimals,
      start: startItem ? startItem.val : null,
      startLabel: startItem ? startItem.label : '',
      current: currentItem ? currentItem.val : null,
      currentLabel: currentItem ? currentItem.label : '',
      delta,
    };
  };

  const summaryRows = useMemo(
    () => [
      buildComparisonMetric('Body Weight', 'lbs', (e) => parseNumericMetric(e.weight)),
      buildComparisonMetric(
        '7-Day Avg Weight',
        'lbs',
        (e) => calculateSevenDayAverage(e.dailyWeighIns).avg
      ),
      buildComparisonMetric('Stomach (At Navel)', measureUnit, (e) => {
        const cm = parseNumericMetric(e.navelAt);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric('Waist (Above Navel)', measureUnit, (e) => {
        const cm = parseNumericMetric(e.navelAbove);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric('Lower Waist (Below)', measureUnit, (e) => {
        const cm = parseNumericMetric(e.navelBelow);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric('Chest', measureUnit, (e) => {
        const cm = parseNumericMetric(e.chest);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric('Right Arm', measureUnit, (e) => {
        const cm = parseNumericMetric(e.rightArm);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric('Left Arm', measureUnit, (e) => {
        const cm = parseNumericMetric(e.leftArm);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric('Hips', measureUnit, (e) => {
        const cm = parseNumericMetric(e.hips);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric('Right Thigh', measureUnit, (e) => {
        const cm = parseNumericMetric(e.rightThigh);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric('Left Thigh', measureUnit, (e) => {
        const cm = parseNumericMetric(e.leftThigh);
        return cm !== null ? cmNumberToUnit(cm, measureUnit) : null;
      }),
      buildComparisonMetric(
        'Avg Daily Steps',
        'steps',
        (e) => parseNumericMetric(e.actualDailySteps),
        0
      ),
    ],
    [sortedEntries, measureUnit]
  );

  // Chart datasets
  const weightPoints: ChartPoint[] = useMemo(
    () =>
      sortedEntries.map((e) => ({
        weekNumber: e.weekNumber,
        label: e.weekLabel,
        isMilestone: e.isMilestone,
        value: parseNumericMetric(e.weight),
        secondaryValue: calculateSevenDayAverage(e.dailyWeighIns).avg,
      })),
    [sortedEntries]
  );

  const waistPoints: ChartPoint[] = useMemo(
    () =>
      sortedEntries.map((e) => {
        const atCm = parseNumericMetric(e.navelAt);
        const aboveCm = parseNumericMetric(e.navelAbove);
        return {
          weekNumber: e.weekNumber,
          label: e.weekLabel,
          isMilestone: e.isMilestone,
          value: atCm !== null ? cmNumberToUnit(atCm, measureUnit) : null,
          secondaryValue: aboveCm !== null ? cmNumberToUnit(aboveCm, measureUnit) : null,
        };
      }),
    [sortedEntries, measureUnit]
  );

  const otherBodyPoints: ChartPoint[] = useMemo(
    () =>
      sortedEntries.map((e) => {
        const cm = parseNumericMetric(e[selectedOtherMetric] as string);
        return {
          weekNumber: e.weekNumber,
          label: e.weekLabel,
          isMilestone: e.isMilestone,
          value: cm !== null ? cmNumberToUnit(cm, measureUnit) : null,
        };
      }),
    [sortedEntries, selectedOtherMetric, measureUnit]
  );

  const stepsPoints: ChartPoint[] = useMemo(
    () =>
      sortedEntries.map((e) => ({
        weekNumber: e.weekNumber,
        label: e.weekLabel,
        isMilestone: e.isMilestone,
        value: parseNumericMetric(e.actualDailySteps),
        secondaryValue: parseNumericMetric(e.targetDailySteps),
      })),
    [sortedEntries]
  );

  const calorieAdherencePoints: ChartPoint[] = useMemo(
    () =>
      sortedEntries.map((e) => {
        const adherence = parseNumericMetric(e.calorieAdherence);
        const actualCals = parseNumericMetric(e.actualDailyCalories);
        const targetCals = getEffectiveDailyCalorieTarget(e);
        // Prefer explicit calorieAdherence %; fallback to ratio if actual & target kcal entered
        const computedPct =
          adherence !== null
            ? adherence
            : actualCals !== null && targetCals !== null && targetCals > 0
            ? Math.round((actualCals / targetCals) * 100)
            : null;
        return {
          weekNumber: e.weekNumber,
          label: e.weekLabel,
          isMilestone: e.isMilestone,
          value: computedPct,
          secondaryValue: 100,
        };
      }),
    [sortedEntries]
  );

  const trainingConsistencyPoints: ChartPoint[] = useMemo(
    () =>
      sortedEntries.map((e) => {
        const pct = parseNumericMetric(e.trainingAdherence);
        const days = parseNumericMetric(e.trainingDays);
        return {
          weekNumber: e.weekNumber,
          label: e.weekLabel,
          isMilestone: e.isMilestone,
          value: pct !== null ? pct : days !== null ? Math.round((days / 7) * 100) : null,
          secondaryValue: 100,
        };
      }),
    [sortedEntries]
  );

  const activeOtherLabel =
    BODY_MEASUREMENT_OPTIONS.find((o) => o.key === selectedOtherMetric)?.label || 'Chest';

  return (
    <div className="space-y-6">
      {/* Start -> Current -> Total Change Comparison Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Starting vs Current Measurements &amp; Total Change
              </h3>
              <p className="text-[11px] text-slate-500">
                Directional indicators show objective increases (↑) or decreases (↓) without assuming one direction is always good.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="rounded-xl p-3.5 bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">{row.label}</span>
                <NeutralDeltaBadge delta={row.delta} unit={row.unit} decimals={row.decimals} />
              </div>
              <div className="flex items-baseline justify-between text-xs tabular-nums">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Start {row.startLabel ? `(${row.startLabel})` : ''}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {row.start !== null
                      ? `${row.start.toFixed(row.decimals)} ${row.unit}`
                      : '—'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    Current {row.currentLabel ? `(${row.currentLabel})` : ''}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {row.current !== null
                      ? `${row.current.toFixed(row.decimals)} ${row.unit}`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6 Visual Progress Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Body Weight & 7-Day Average */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Body Weight &amp; 7-Day Average (lbs)
              </h3>
              <p className="text-[11px] text-slate-500">
                Weekly check-in weight alongside smoothed 7-day AM weigh-in average
              </p>
            </div>
          </div>
          <SvgLineChart
            points={weightPoints}
            unit="lbs"
            primaryLabel="Check-in Weight"
            secondaryLabel="7-Day Avg"
            primaryColor="#2563eb"
            secondaryColor="#0ea5e9"
          />
        </div>

        {/* Chart 2: Waist Measurement */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Waist Measurements ({measureUnit})
              </h3>
              <p className="text-[11px] text-slate-500">
                Stomach at navel vs upper waist (3 fingers above navel)
              </p>
            </div>
          </div>
          <SvgLineChart
            points={waistPoints}
            unit={measureUnit}
            primaryLabel="Stomach (At Navel)"
            secondaryLabel="Above Navel"
            primaryColor="#4f46e5"
            secondaryColor="#94a3b8"
          />
        </div>

        {/* Chart 3: Other Body Measurements */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-violet-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Other Body Measurements ({measureUnit})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select any circumference to inspect week-to-week progress
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {BODY_MEASUREMENT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedOtherMetric(opt.key)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                  selectedOtherMetric === opt.key
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <SvgLineChart
            points={otherBodyPoints}
            unit={measureUnit}
            primaryLabel={activeOtherLabel}
            primaryColor="#7c3aed"
          />
        </div>

        {/* Chart 4: Daily Steps */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Steps vs Target</h3>
              <p className="text-[11px] text-slate-500">
                Average daily steps recorded against your weekly step goal
              </p>
            </div>
          </div>
          <SvgBarChart
            points={stepsPoints}
            unit="steps"
            barColor="#10b981"
            targetLineColor="#475569"
            primaryLabel="Actual Daily Steps"
            targetLabel="Target Steps"
          />
        </div>

        {/* Chart 5: Calorie Adherence */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Calorie Adherence (%)</h3>
              <p className="text-[11px] text-slate-500">
                Weekly adherence to nutrition calorie targets (100% dashed reference)
              </p>
            </div>
          </div>
          <SvgBarChart
            points={calorieAdherencePoints}
            unit="%"
            barColor="#f59e0b"
            targetLineColor="#94a3b8"
            primaryLabel="Nutrition Adherence"
            targetLabel="100% Target"
          />
        </div>

        {/* Chart 6: Training Consistency */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Training Consistency (%)</h3>
              <p className="text-[11px] text-slate-500">
                Weekly session consistency &amp; training adherence percentage
              </p>
            </div>
          </div>
          <SvgBarChart
            points={trainingConsistencyPoints}
            unit="%"
            barColor="#2563eb"
            targetLineColor="#94a3b8"
            primaryLabel="Training Consistency"
            targetLabel="100% Target"
          />
        </div>
      </div>
    </div>
  );
};
