"use client";

import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyInMillions } from "@/lib/formatting-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui";

/**
 * Unified MetricCard component supporting multiple variants:
 * - standard: Basic metric display
 * - financial: Currency formatted single value
 * - percentage: Percentage with optional +/- prefix
 * - range: Currency range (low - high)
 * - kpi: Enhanced display with trend and sparkline
 */

type MetricCardVariant = "standard" | "financial" | "percentage" | "range" | "kpi";

interface BaseMetricCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  tooltip?: React.ReactNode;
}

interface StandardVariantProps extends BaseMetricCardProps {
  variant?: "standard";
  value: string | number | React.ReactNode;
  isHighlighted?: boolean;
  showDashWhenEmpty?: boolean;
}

interface FinancialVariantProps extends BaseMetricCardProps {
  variant: "financial";
  value: number;
  isHighlighted?: boolean;
}

interface PercentageVariantProps extends BaseMetricCardProps {
  variant: "percentage";
  value: number;
  showPlusPrefix?: boolean;
}

interface RangeVariantProps extends BaseMetricCardProps {
  variant: "range";
  valueLow: number;
  valueHigh: number;
}

interface KPIVariantProps extends BaseMetricCardProps {
  variant: "kpi";
  value: number | string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  sparklineData?: number[];
}

type MetricCardProps =
  | StandardVariantProps
  | FinancialVariantProps
  | PercentageVariantProps
  | RangeVariantProps
  | KPIVariantProps;

export function MetricCard(props: MetricCardProps) {
  const {
    title,
    subtitle,
    className,
    valueClassName,
    icon: Icon,
    onClick,
    tooltip,
    variant = "standard",
  } = props;

  // Format value based on variant
  const formatValue = () => {
    if (variant === "standard") {
      const standardProps = props as StandardVariantProps;
      const { value, showDashWhenEmpty = true } = standardProps;
      if (value === undefined || value === null || value === "" || value === 0) {
        return showDashWhenEmpty ? "—" : "";
      }
      return value;
    }

    if (variant === "financial") {
      const financialProps = props as FinancialVariantProps;
      return formatCurrencyInMillions(financialProps.value);
    }

    if (variant === "percentage") {
      const percentageProps = props as PercentageVariantProps;
      const { value, showPlusPrefix = false } = percentageProps;
      const prefix = showPlusPrefix && value > 0 ? "+" : "";
      return `${prefix}${Math.round(value)}%`;
    }

    if (variant === "range") {
      const rangeProps = props as RangeVariantProps;
      return `${formatCurrencyInMillions(rangeProps.valueLow)} - ${formatCurrencyInMillions(rangeProps.valueHigh)}`;
    }

    if (variant === "kpi") {
      const kpiProps = props as KPIVariantProps;
      return kpiProps.value;
    }

    return "";
  };

  // Determine value color
  const getValueColor = () => {
    if (variant === "standard" || variant === "financial") {
      const { value, isHighlighted } = props as StandardVariantProps | FinancialVariantProps;
      if (value === undefined || value === null || value === "" || value === 0) {
        return "muted";
      }
      if (isHighlighted) {
        return "highlighted";
      }
    }
    if (variant === "percentage") {
      return "highlighted";
    }
    return "";
  };

  // KPI-specific trend and sparkline
  const renderKPIExtras = () => {
    if (variant !== "kpi") return null;

    const kpiProps = props as KPIVariantProps;
    const { trend, sparklineData } = kpiProps;
    const trendIsPositive = trend?.isPositive ?? (trend ? trend.value >= 0 : undefined);
    const chartData = sparklineData?.map((value, index) => ({ index, value })) || [];

    return (
      <>
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
          </div>
        )}
      </>
    );
  };

  const isClickable = !!onClick;
  const isKPIVariant = variant === "kpi";

  const cardContent = (
    <div
      className={cn("metric-card", isClickable && "clickable cursor-pointer", className)}
      onClick={onClick}
    >
      {/* Header with optional trend (KPI only) */}
      <div className={cn("flex items-center", isKPIVariant ? "justify-between mb-3" : "gap-2")}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="metric-icon" />}
          <p className="metric-label">{title}</p>
        </div>
        {isKPIVariant && renderKPIExtras()}
      </div>

      {/* Value */}
      <div className={cn("metric-value", getValueColor(), valueClassName)}>{formatValue()}</div>

      {/* Subtitle */}
      {subtitle && !isKPIVariant && <p className="metric-subtitle">{subtitle}</p>}

      {/* KPI sparkline section */}
      {isKPIVariant && variant === "kpi" && (props as KPIVariantProps).sparklineData && (
        <>
          {renderKPIExtras()}
          {subtitle && (
            <p className="metric-subtitle text-xs text-[var(--muted-foreground)] mt-1">
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );

  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}

// Convenience wrapper components for backward compatibility
export function FinancialMetricCard({
  title,
  value,
  subtitle,
  isHighlighted,
  tooltip,
  className,
  onClick,
}: {
  title: string;
  value: number;
  subtitle?: string;
  isHighlighted?: boolean;
  tooltip?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <MetricCard
      variant="financial"
      title={title}
      value={value}
      subtitle={subtitle}
      isHighlighted={isHighlighted}
      tooltip={tooltip}
      className={className}
      onClick={onClick}
    />
  );
}

export function FinancialRangeCard({
  title,
  valueLow,
  valueHigh,
  helperText,
  className,
}: {
  title: string;
  valueLow: string | number;
  valueHigh: string | number;
  helperText?: string;
  className?: string;
}) {
  // If already formatted as strings, use standard variant instead
  if (typeof valueLow === "string" || typeof valueHigh === "string") {
    return (
      <MetricCard
        variant="standard"
        title={title}
        value={`${valueLow} - ${valueHigh}`}
        subtitle={helperText}
        className={className}
      />
    );
  }

  return (
    <MetricCard
      variant="range"
      title={title}
      valueLow={valueLow}
      valueHigh={valueHigh}
      subtitle={helperText}
      className={className}
    />
  );
}

export function PercentageMetricCard({
  title,
  value,
  helperText,
  className,
}: {
  title: string;
  value: number;
  helperText?: string;
  className?: string;
}) {
  return (
    <MetricCard
      variant="percentage"
      title={title}
      value={value}
      showPlusPrefix
      subtitle={helperText}
      className={className}
    />
  );
}

// Export KPICard as alias for backward compatibility
export function KPICard(props: Omit<KPIVariantProps, "variant">) {
  return <MetricCard {...props} variant="kpi" />;
}

// Re-export types for backward compatibility
export type { KPIVariantProps as KPICardProps };
