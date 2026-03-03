import type { RevenueEstimate, YearlyFinancialMetric, SpendRecord } from './types';

export type { SpendRecord };

export interface EvmMetrics {
  bac: number;   // Budget at completion
  pv: number;    // Planned value
  ev: number;    // Earned value
  ac: number;    // Actual cost
  sv: number;    // Schedule variance (EV - PV)
  cv: number;    // Cost variance (EV - AC)
  spi: number;   // Schedule performance index (EV / PV)
  cpi: number;   // Cost performance index (EV / AC)
  eac: number;   // Estimate at completion
  vac: number;   // Variance at completion (BAC - EAC)
  percentComplete: number;
}

export interface EvmTimePoint {
  period: string;
  pv: number;
  ev: number;
  ac: number;
}

export function calculateEvm(
  totalCost: number,
  spendRecords: SpendRecord[],
  percentComplete: number,
  startYear: number,
  startQuarter: number,
  durationQuarters: number
): EvmMetrics {
  const bac = totalCost;
  const ac = spendRecords
    .filter((s) => s.type === 'realized')
    .reduce((sum, s) => sum + s.amount, 0);

  // Earned value = % complete * BAC
  const ev = (percentComplete / 100) * bac;

  // Planned value: linear spend assumption
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowQuarter = Math.ceil((now.getMonth() + 1) / 3);

  const projectStartAbsQuarter = startYear * 4 + startQuarter;
  const nowAbsQuarter = nowYear * 4 + nowQuarter;
  const elapsedQuarters = Math.max(0, nowAbsQuarter - projectStartAbsQuarter);
  const plannedProgress = Math.min(1, elapsedQuarters / Math.max(1, durationQuarters));
  const pv = plannedProgress * bac;

  const sv = ev - pv;
  const cv = ev - ac;
  const spi = pv > 0 ? ev / pv : 0;
  const cpi = ac > 0 ? ev / ac : 0;
  const eac = cpi > 0 ? bac / cpi : bac;
  const vac = bac - eac;

  return { bac, pv, ev, ac, sv, cv, spi, cpi, eac, vac, percentComplete };
}

export function getEvmTimeSeries(
  totalCost: number,
  spendRecords: SpendRecord[],
  startYear: number,
  startQuarter: number,
  durationQuarters: number
): EvmTimePoint[] {
  const points: EvmTimePoint[] = [];
  let cumulativeAc = 0;

  for (let i = 0; i < durationQuarters; i++) {
    const absQ = startYear * 4 + startQuarter + i;
    const y = Math.floor((absQ - 1) / 4);
    const q = ((absQ - 1) % 4) + 1;
    const period = `${y}-Q${q}`;

    const plannedProgress = (i + 1) / durationQuarters;
    const pv = plannedProgress * totalCost;

    const periodRecords = spendRecords.filter((s) => {
      const recPeriod = s.period ?? (s.date ? `${new Date(s.date).getFullYear()}-Q${Math.ceil((new Date(s.date).getMonth() + 1) / 3)}` : null);
      return recPeriod === period && s.type === 'realized';
    });
    cumulativeAc += periodRecords.reduce((sum, s) => sum + s.amount, 0);

    // Placeholder EV = same as PV (no granular completion data)
    const ev = pv;

    points.push({ period, pv, ev, ac: cumulativeAc });
  }

  return points;
}

export function evmStatusColor(value: number): string {
  if (value >= 1.0) return 'text-green-600 dark:text-green-400';
  if (value >= 0.9) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}
