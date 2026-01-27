"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

export interface RingChartDataItem {
  name: string;
  value: number;
  color: string;
}

export interface RingChartProps {
  data: RingChartDataItem[];
  centerLabel?: string;
  centerValue?: string | number;
  showLegend?: boolean;
  className?: string;
  size?: number; // Chart size in pixels
  innerRadius?: number; // Inner radius percentage (0-100)
  outerRadius?: number; // Outer radius percentage (0-100)
}

/**
 * Ring Chart Component (Donut Chart)
 *
 * Displays data as a ring/donut chart with optional center label
 * Based on Dribbble pattern #7 - Ring/Donut Charts
 *
 * @example
 * <RingChart
 *   data={[
 *     { name: "Completed", value: 45, color: "#22c55e" },
 *     { name: "In Progress", value: 30, color: "#3b82f6" },
 *     { name: "Not Started", value: 25, color: "#94a3b8" }
 *   ]}
 *   centerLabel="Total"
 *   centerValue="73%"
 *   showLegend
 * />
 */
export function RingChart({
  data,
  centerLabel,
  centerValue,
  showLegend = true,
  className,
  size = 200,
  innerRadius = 60,
  outerRadius = 80,
}: RingChartProps) {
  // Calculate total for percentage display
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom label renderer for center text
  const renderCenterLabel = () => {
    if (!centerValue) return null;

    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-[var(--foreground)]"
      >
        <tspan x="50%" dy="-0.5em" className="text-3xl font-bold">
          {centerValue}
        </tspan>
        {centerLabel && (
          <tspan x="50%" dy="1.5em" className="text-sm fill-[var(--muted-foreground)]">
            {centerLabel}
          </tspan>
        )}
      </text>
    );
  };

  // Custom legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => {
          const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";

          return (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-[var(--foreground)]">
                {entry.value} {entry.payload.name}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={`${innerRadius}%`}
            outerRadius={`${outerRadius}%`}
            paddingAngle={2}
            dataKey="value"
            label={false}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showLegend && (
            <Legend
              content={renderLegend}
              wrapperStyle={{ paddingTop: "20px" }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* SVG overlay for center label */}
      {(centerValue || centerLabel) && (
        <svg
          width={size}
          height={size}
          style={{
            position: "absolute",
            pointerEvents: "none",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {renderCenterLabel()}
        </svg>
      )}
    </div>
  );
}
