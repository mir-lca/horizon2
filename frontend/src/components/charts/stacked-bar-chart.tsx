"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export interface StackedBarDataItem {
  name: string; // X-axis label (e.g., "Mon", "Q1", "Jan")
  [key: string]: string | number; // Dynamic keys for stacked categories
}

export interface StackConfig {
  dataKey: string; // Key in data object
  name: string; // Display name
  color: string; // Bar color
  stackId?: string; // Stack identifier (same stackId = stacked together)
}

export interface StackedBarChartProps {
  data: StackedBarDataItem[];
  stacks: StackConfig[];
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
  height?: number;
}

/**
 * Stacked Bar Chart Component
 *
 * Displays multiple data series as stacked vertical bars
 * Based on Dribbble pattern #5 - Stacked Bar Charts with Soft Gradients
 *
 * @example
 * <StackedBarChart
 *   data={[
 *     { day: "Mon", completed: 10, inProgress: 5, notStarted: 3 },
 *     { day: "Tue", completed: 12, inProgress: 6, notStarted: 2 },
 *   ]}
 *   stacks={[
 *     { dataKey: "completed", name: "Completed", color: "#22c55e", stackId: "a" },
 *     { dataKey: "inProgress", name: "In Progress", color: "#3b82f6", stackId: "a" },
 *     { dataKey: "notStarted", name: "Not Started", color: "#94a3b8", stackId: "a" },
 *   ]}
 *   xAxisKey="day"
 * />
 */
export function StackedBarChart({
  data,
  stacks,
  xAxisKey = "name",
  showGrid = true,
  showLegend = true,
  className,
  height = 300,
}: StackedBarChartProps) {
  // Custom tooltip renderer
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    // Calculate total
    const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-[var(--foreground)] mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[var(--foreground)]">{item.name}:</span>
            </div>
            <span className="font-medium text-[var(--foreground)]">{item.value}</span>
          </div>
        ))}
        <div className="border-t border-[var(--border)] mt-2 pt-2 flex justify-between text-sm">
          <span className="font-semibold text-[var(--foreground)]">Total:</span>
          <span className="font-semibold text-[var(--foreground)]">{total}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
              }}
              iconType="square"
            />
          )}
          {stacks.map((stack, index) => (
            <Bar
              key={index}
              dataKey={stack.dataKey}
              name={stack.name}
              fill={stack.color}
              stackId={stack.stackId || "default"}
              radius={index === stacks.length - 1 ? [4, 4, 0, 0] : undefined} // Round top bar only
              animationBegin={index * 100}
              animationDuration={800}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
