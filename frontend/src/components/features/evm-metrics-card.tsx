"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { calculateEvm, getEvmTimeSeries, evmStatusColor, type SpendRecord } from "@/lib/evm-calculations";
import { cn } from "@/lib/utils";
import { MockBadge } from "@/components/horizon-ui";

interface EvmMetricsCardProps {
  totalCost: number;
  spendRecords: SpendRecord[];
  startYear: number;
  startQuarter: number;
  durationQuarters: number;
  percentComplete?: number;
}

export function EvmMetricsCard({
  totalCost,
  spendRecords,
  startYear,
  startQuarter,
  durationQuarters,
  percentComplete = 0,
}: EvmMetricsCardProps) {
  const evm = useMemo(
    () => calculateEvm(totalCost, spendRecords, percentComplete, startYear, startQuarter, durationQuarters),
    [totalCost, spendRecords, percentComplete, startYear, startQuarter, durationQuarters]
  );

  const timeSeries = useMemo(
    () => getEvmTimeSeries(totalCost, spendRecords, startYear, startQuarter, durationQuarters),
    [totalCost, spendRecords, startYear, startQuarter, durationQuarters]
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(n);

  const kpis = [
    { label: 'SPI', value: evm.spi, formatted: evm.spi.toFixed(2), isIndex: true },
    { label: 'CPI', value: evm.cpi, formatted: evm.cpi.toFixed(2), isIndex: true },
    { label: 'EV', value: null, formatted: fmt(evm.ev), isIndex: false },
    { label: 'AC', value: null, formatted: fmt(evm.ac), isIndex: false },
    { label: 'PV', value: null, formatted: fmt(evm.pv), isIndex: false },
    { label: 'EAC', value: null, formatted: fmt(evm.eac), isIndex: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Earned value analysis</h3>
        <MockBadge system="Oracle ERP" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="border rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">{kpi.label}</div>
            <div className={cn("text-lg font-bold", kpi.isIndex && kpi.value !== null ? evmStatusColor(kpi.value) : "")}>
              {kpi.formatted}
            </div>
          </div>
        ))}
      </div>

      {timeSeries.length > 0 && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} width={60} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="pv" name="Planned value" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ev" name="Earned value" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ac" name="Actual cost" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
