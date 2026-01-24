import React from "react";
import { Badge } from "tr-workspace-components";
import { cn } from "@/lib/utils";
import { Bot, CheckCircle, Clock, DollarSign, AlertCircle, Info } from "lucide-react";

export type ProjectStatus = "unfunded" | "funded" | "active" | "completed";
export type ResourceStatus = "available" | "allocated" | "ai" | "overallocated";
export type GeneralStatus = "pending" | "approved" | "rejected" | "draft" | "published";

interface StatusBadgeProps {
  status: string;
  type?: "project" | "resource" | "general";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  muted?: boolean;
}

export function StatusBadge({
  status,
  type = "general",
  size = "default",
  showIcon = false,
  icon: CustomIcon,
  className,
  muted = false,
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    const baseConfig = {
      text: status,
      icon: null as React.ComponentType<{ className?: string }> | null,
      className: "",
    };

    if (type === "project") {
      switch (status as ProjectStatus) {
        case "active":
          return {
            ...baseConfig,
            text: "Active",
            icon: CheckCircle,
            className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 dark:border dark:border-green-700",
          };
        case "completed":
          return {
            ...baseConfig,
            text: "Completed",
            icon: CheckCircle,
            className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:border dark:border-blue-700",
          };
        case "funded":
          return {
            ...baseConfig,
            text: "Funded",
            icon: DollarSign,
            className: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 dark:border dark:border-orange-700",
          };
        case "unfunded":
          return {
            ...baseConfig,
            text: "Unfunded",
            icon: Clock,
            className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-gray-600",
          };
        default:
          return {
            ...baseConfig,
            className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          };
      }
    }

    if (type === "resource") {
      switch (status as ResourceStatus) {
        case "available":
          return {
            ...baseConfig,
            text: "Available",
            icon: CheckCircle,
            className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
          };
        case "allocated":
          return {
            ...baseConfig,
            text: "Allocated",
            icon: Clock,
            className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
          };
        case "overallocated":
          return {
            ...baseConfig,
            text: "Over-allocated",
            icon: AlertCircle,
            className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
          };
        case "ai":
          return {
            ...baseConfig,
            text: "AI",
            icon: Bot,
            className: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
          };
        default:
          return {
            ...baseConfig,
            className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          };
      }
    }

    switch (status as GeneralStatus) {
      case "pending":
        return {
          ...baseConfig,
          text: "Pending",
          icon: Clock,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
        };
      case "approved":
        return {
          ...baseConfig,
          text: "Approved",
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
        };
      case "rejected":
        return {
          ...baseConfig,
          text: "Rejected",
          icon: AlertCircle,
          className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
        };
      case "draft":
        return {
          ...baseConfig,
          text: "Draft",
          icon: Info,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        };
      case "published":
        return {
          ...baseConfig,
          text: "Published",
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
        };
      default:
        return {
          ...baseConfig,
          text: status.charAt(0).toUpperCase() + status.slice(1),
          className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        };
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "text-xs px-1.5 py-0.5";
      case "lg":
        return "text-sm px-3 py-1";
      default:
        return "text-xs px-2 py-1";
    }
  };

  const config = getStatusConfig();
  const IconComponent = CustomIcon || config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        getSizeClass(),
        config.className,
        muted && "opacity-60",
        className
      )}
    >
      {showIcon && IconComponent && (
        <IconComponent className={cn(size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3 w-3")} />
      )}
      {config.text}
    </span>
  );
}

export function ProjectStatusBadge({
  status,
  showIcon = false,
  muted = false,
  className,
}: {
  status: ProjectStatus;
  showIcon?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <StatusBadge status={status} type="project" showIcon={showIcon} muted={muted} className={className} />
  );
}

export function ResourceStatusBadge({
  status,
  showIcon = true,
  className,
}: {
  status: ResourceStatus;
  showIcon?: boolean;
  className?: string;
}) {
  return <StatusBadge status={status} type="resource" showIcon={showIcon} className={className} />;
}

export function AIResourceBadge({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return <StatusBadge status="ai" type="resource" size={size} showIcon={true} className={className} />;
}
