"use client";

import { TrendingUp, Users, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockBadge } from "@/components/horizon-ui/mock-badge";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  confidence: number;
  severity: "info" | "warning" | "critical";
}

const MOCK_INSIGHTS: Insight[] = [
  {
    id: "ins-001",
    icon: TrendingUp,
    title: "Budget overrun risk detected",
    message:
      "Project X may be at risk of budget overrun based on current spend velocity (+23% vs plan). Consider reviewing Q3 cost allocations.",
    confidence: 84,
    severity: "warning",
  },
  {
    id: "ins-002",
    icon: Users,
    title: "Resource gap in Q3 2026",
    message:
      "Resource gap detected: 2 senior engineers needed in Q3 2026 for active projects. Current capacity is insufficient to meet demand.",
    confidence: 91,
    severity: "critical",
  },
  {
    id: "ins-003",
    icon: AlertTriangle,
    title: "Milestone slip risk",
    message:
      "Milestone slip risk: 3 milestones due this quarter have no recent updates. Last activity was more than 14 days ago.",
    confidence: 76,
    severity: "warning",
  },
];

const SEVERITY_CONFIG: Record<
  Insight["severity"],
  { card: string; badge: string; icon: string }
> = {
  info: {
    card: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: "text-blue-500",
  },
  warning: {
    card: "border-yellow-200 dark:border-yellow-800",
    badge:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: "text-yellow-500",
  },
  critical: {
    card: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: "text-red-500",
  },
};

export function AiInsightsMock() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MockBadge system="AI analytics" />
      </div>

      <div className="space-y-3">
        {MOCK_INSIGHTS.map((insight) => {
          const config = SEVERITY_CONFIG[insight.severity];
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className={cn(
                "rounded-md border p-4 space-y-2",
                config.card
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Icon
                    className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.icon)}
                  />
                  <p className="text-sm font-semibold">{insight.title}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0",
                    config.badge
                  )}
                >
                  {insight.confidence}% confidence
                </span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          disabled
          placeholder="Ask about your portfolio..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          aria-label="Natural language query (not yet available)"
        />
        <Button size="sm" disabled className="h-7 px-3 text-xs">
          Ask
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Natural language queries will be available once AI analytics integration is configured.
      </p>
    </div>
  );
}
