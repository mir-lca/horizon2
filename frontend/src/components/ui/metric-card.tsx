import React from "react";
import { cn } from "@/lib/utils";
import { formatCurrencyInMillions } from "@/lib/formatting-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "tr-workspace-components";

interface MetricCardProps {
  title: string;
  value?: string | number | React.ReactNode;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
  isHighlighted?: boolean;
  showDashWhenEmpty?: boolean;
  tooltip?: React.ReactNode;
  formatAsCurrency?: boolean;
  currencyRange?: {
    low: number;
    high: number;
  };
  formatAsPercentage?: boolean;
  showPlusPrefix?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtitle,
  className,
  valueClassName,
  isHighlighted = false,
  showDashWhenEmpty = true,
  tooltip,
  formatAsCurrency = false,
  currencyRange,
  formatAsPercentage = false,
  showPlusPrefix = false,
  icon: Icon,
  onClick,
}: MetricCardProps) {
  const formatValue = () => {
    if (value === undefined || value === null || value === "" || value === 0) {
      return showDashWhenEmpty ? "—" : "";
    }

    if (formatAsCurrency) {
      if (currencyRange) {
        return `${formatCurrencyInMillions(currencyRange.low)} - ${formatCurrencyInMillions(currencyRange.high)}`;
      }
      if (typeof value === "number") {
        return formatCurrencyInMillions(value);
      }
    }

    if (formatAsPercentage && typeof value === "number") {
      const prefix = showPlusPrefix && value > 0 ? "+" : "";
      return `${prefix}${Math.round(value)}%`;
    }

    return value;
  };

  const getValueColor = () => {
    if (value === undefined || value === null || value === "" || value === 0) {
      return "muted";
    }
    if (isHighlighted) {
      return "highlighted";
    }
    if (formatAsPercentage) {
      return "highlighted";
    }
    return "";
  };

  const cardContent = (
    <div
      className={cn(
        "metric-card",
        onClick && "clickable",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="metric-icon" />}
        <p className="metric-label">{title}</p>
      </div>

      <div className={cn("metric-value", getValueColor(), valueClassName)}>{formatValue()}</div>

      {subtitle && <p className="metric-subtitle">{subtitle}</p>}
    </div>
  );

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
      title={title}
      value={value}
      subtitle={subtitle}
      isHighlighted={isHighlighted}
      formatAsCurrency
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
  return (
    <MetricCard
      title={title}
      value={`${valueLow} - ${valueHigh}`}
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
    <MetricCard title={title} value={value} formatAsPercentage showPlusPrefix subtitle={helperText} className={className} />
  );
}
