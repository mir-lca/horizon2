"use client";

import React from "react";

export interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  title?: string;
  showTotal?: boolean;
  formatter?: (value: number, name: string) => string;
}

/**
 * Custom Tooltip Component for Recharts
 *
 * Provides consistent dark-themed tooltips across all charts
 * Based on Dribbble pattern #13 - Chart Hover Tooltips
 *
 * Features:
 * - Dark background with white text
 * - Multi-line data formatting
 * - Optional total calculation
 * - Custom value formatting
 * - Color indicators
 *
 * @example
 * <Tooltip content={<CustomTooltip />} />
 * <Tooltip content={<CustomTooltip showTotal />} />
 * <Tooltip content={<CustomTooltip formatter={(value) => `$${value}M`} />} />
 */
export function CustomTooltip({
  active,
  payload,
  label,
  title,
  showTotal = false,
  formatter,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Calculate total if requested
  const total = showTotal
    ? payload.reduce((sum, item) => sum + (typeof item.value === "number" ? item.value : 0), 0)
    : 0;

  // Default formatter
  const formatValue = formatter || ((value: number) => value.toString());

  return (
    <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-3 shadow-xl">
      {/* Title or Label */}
      <p className="font-semibold text-white mb-2 text-sm">
        {title || label}
      </p>

      {/* Data Items */}
      <div className="space-y-1">
        {payload.map((item, index) => {
          const value = typeof item.value === "number" ? item.value : 0;
          const formattedValue = formatValue(value, item.name || item.dataKey);

          return (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color || item.fill }}
                />
                <span className="text-gray-300">
                  {item.name || item.dataKey}:
                </span>
              </div>
              <span className="font-medium text-white">{formattedValue}</span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      {showTotal && (
        <div className="border-t border-[#3a3a3a] mt-2 pt-2 flex justify-between text-sm">
          <span className="font-semibold text-gray-300">Total:</span>
          <span className="font-semibold text-white">{formatValue(total, "Total")}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Tooltip Component
 *
 * Minimal tooltip for sparklines and small charts
 */
export function SimpleTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-1 shadow-lg">
      <span className="text-white text-xs font-medium">
        {payload[0]?.value}
      </span>
    </div>
  );
}
