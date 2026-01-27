"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type StatusType = "active" | "planning" | "completed" | "on-hold" | "cancelled" | "pending";

export interface StatusDotProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
  label?: string;
}

/**
 * Status Dot Component
 *
 * Simple colored circle indicator for status visualization
 * Based on Dribbble pattern #6
 *
 * @example
 * <StatusDot status="active" />
 * <StatusDot status="completed" showLabel label="Completed" />
 */
export function StatusDot({
  status,
  size = "md",
  className,
  showLabel = false,
  label,
}: StatusDotProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  const statusColors = {
    active: "bg-blue-500",
    planning: "bg-purple-500",
    completed: "bg-green-500",
    "on-hold": "bg-yellow-500",
    cancelled: "bg-red-500",
    pending: "bg-gray-400",
  };

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span
          className={cn(
            "rounded-full flex-shrink-0",
            sizeClasses[size],
            statusColors[status]
          )}
        />
        <span className="text-sm text-[var(--foreground)]">{displayLabel}</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "rounded-full inline-block flex-shrink-0",
        sizeClasses[size],
        statusColors[status],
        className
      )}
      title={displayLabel}
      aria-label={displayLabel}
    />
  );
}
