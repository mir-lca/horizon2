"use client";

import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number; // Percentage change
    isPositive?: boolean; // Optional: auto-detect from value if not provided
  };
  sparklineData?: number[]; // Array of numbers for sparkline
  icon?: LucideIcon;
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
}

/**
 * KPI Card Component
 *
 * Displays a key performance indicator with:
 * - Large metric value
 * - Optional trend indicator (↑ 12%)
 * - Optional sparkline chart
 * - Optional icon
 * - Optional subtitle
 *
 * @example
 * <KPICard
 *   title="Total Projects"
 *   value={24}
 *   trend={{ value: 12.5, isPositive: true }}
 *   sparklineData={[10, 15, 12, 18, 20, 24]}
 *   icon={FolderIcon}
 * />
 */
export function KPICard({
  title,
  value,
  subtitle,
  trend,
  sparklineData,
  icon: Icon,
  className,
  valueClassName,
  onClick,
}: KPICardProps) {
  // Auto-detect trend direction if not provided
  const trendIsPositive = trend?.isPositive ?? (trend ? trend.value >= 0 : undefined);

  // Format sparkline data for Recharts
  const chartData = sparklineData?.map((value, index) => ({
    index,
    value
  })) || [];

  // Determine if card is clickable
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        "metric-card",
        isClickable && "clickable cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Header: Icon + Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="metric-icon w-5 h-5 text-[var(--muted-foreground)]" />}
          <p className="metric-label text-sm font-medium text-[var(--muted-foreground)]">
            {title}
          </p>
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold",
              trendIsPositive
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--danger)]/10 text-[var(--danger)]"
            )}
          >
            <span>{trendIsPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div
        className={cn(
          "metric-value text-3xl font-bold mb-2",
          valueClassName
        )}
      >
        {value}
      </div>

      {/* Subtitle or Sparkline */}
      {subtitle && !sparklineData && (
        <p className="metric-subtitle text-sm text-[var(--muted-foreground)]">
          {subtitle}
        </p>
      )}

      {/* Sparkline Chart */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          {subtitle && (
            <p className="metric-subtitle text-xs text-[var(--muted-foreground)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
