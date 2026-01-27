"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Project } from "@/lib/types";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";

interface TimelineViewProps {
  projects: Project[];
  selectedBusinessUnit?: string;
  timeline?: { startYear: number; endYear: number };
  onProjectClick?: (projectId: string) => void;
}

/**
 * Timeline View Component
 *
 * Simplified timeline with cleaner header design
 * Follows UI/UX best practices: hierarchical headers, proper spacing, minimal clutter
 */
export function TimelineView({
  projects,
  selectedBusinessUnit = "all",
  timeline,
  onProjectClick,
}: TimelineViewProps) {
  // Filter projects by business unit
  const filteredProjects = useMemo(() => {
    return projects.filter((p) =>
      selectedBusinessUnit === "all" || p.businessUnitId === selectedBusinessUnit
    );
  }, [projects, selectedBusinessUnit]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const startYear = timeline?.startYear || 2024;
    const endYear = timeline?.endYear || 2027;
    const totalQuarters = (endYear - startYear) * 4;

    return { startYear, endYear, totalQuarters };
  }, [timeline]);

  // Calculate "today" position
  const todayPosition = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    const quartersFromStart =
      (currentYear - timelineRange.startYear) * 4 + (currentQuarter - 1);

    return (quartersFromStart / timelineRange.totalQuarters) * 100;
  }, [timelineRange]);

  // Calculate project bar position and width
  const getProjectBarStyle = (project: Project) => {
    const projectStartQuarters =
      (project.startYear - timelineRange.startYear) * 4 + (project.startQuarter - 1);

    const startPercent = (projectStartQuarters / timelineRange.totalQuarters) * 100;
    const widthPercent = (project.durationQuarters / timelineRange.totalQuarters) * 100;

    // Calculate completion percentage (mock - would come from real data)
    const completionPercent = 60; // TODO: Get from project.progress or calculate

    return {
      left: `${Math.max(0, startPercent)}%`,
      width: `${Math.min(100 - startPercent, widthPercent)}%`,
      completion: completionPercent,
    };
  };

  // Format quarter display
  const formatQuarter = (year: number, quarter: number) => {
    return `Q${quarter} ${year}`;
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)]">
        No projects to display
      </div>
    );
  }

  // Generate years for header
  const years = Array.from(
    { length: timelineRange.endYear - timelineRange.startYear + 1 },
    (_, i) => timelineRange.startYear + i
  );

  return (
    <div className="space-y-6">
      {/* Simplified Timeline Header */}
      <div className="relative">
        {/* Year Headers - Clean and Bold */}
        <div className="flex border-b-2 border-[var(--border)] pb-2 mb-2">
          {years.map((year) => (
            <div key={year} className="flex-1 text-center">
              <div className="text-lg font-bold text-[var(--foreground)]">{year}</div>
            </div>
          ))}
        </div>

        {/* Quarter Grid - Minimal Labels */}
        <div className="flex h-8 border-b border-[var(--border)]">
          {Array.from({ length: timelineRange.totalQuarters }).map((_, index) => {
            const quarter = (index % 4) + 1;
            const isFirstQuarter = quarter === 1;

            return (
              <div
                key={index}
                className="flex-1 border-r border-[var(--border)] last:border-r-0 text-center relative"
              >
                {isFirstQuarter && (
                  <div className="text-xs text-[var(--muted-foreground)] absolute top-0 left-1">
                    Q1
                  </div>
                )}
                {quarter === 2 && (
                  <div className="text-xs text-[var(--muted-foreground)] absolute top-0 left-1/2 -translate-x-1/2 opacity-50">
                    Q2
                  </div>
                )}
                {quarter === 3 && (
                  <div className="text-xs text-[var(--muted-foreground)] absolute top-0 left-1/2 -translate-x-1/2 opacity-50">
                    Q3
                  </div>
                )}
                {quarter === 4 && (
                  <div className="text-xs text-[var(--muted-foreground)] absolute top-0 right-1 opacity-50">
                    Q4
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Today marker */}
        {todayPosition >= 0 && todayPosition <= 100 && (
          <div
            className="absolute bottom-0 top-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${todayPosition}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded whitespace-nowrap">
              Today
            </div>
          </div>
        )}
      </div>

      {/* Project Rows */}
      <div className="space-y-6">
        {filteredProjects.map((project, index) => {
          const barStyle = getProjectBarStyle(project);

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group",
                onProjectClick && "cursor-pointer"
              )}
              onClick={() => onProjectClick?.(project.id)}
            >
              {/* Project Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <StatusDot status={project.status as any} />
                  <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {project.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                  <span>
                    {formatQuarter(project.startYear, project.startQuarter)} - {formatQuarter(
                      project.startYear + Math.floor((project.startQuarter + project.durationQuarters - 1) / 4),
                      ((project.startQuarter + project.durationQuarters - 1) % 4) + 1
                    )}
                  </span>
                  {project.businessUnitName && (
                    <span className="text-xs px-2 py-1 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                      {project.businessUnitName}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="relative h-14 bg-[var(--muted)]/20 rounded-lg">
                {/* Project Bar */}
                <motion.div
                  className="absolute inset-y-2 rounded-lg overflow-hidden group-hover:shadow-lg transition-shadow"
                  style={{
                    left: barStyle.left,
                    width: barStyle.width,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                >
                  {/* Completed portion - solid color */}
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all",
                      project.status === "completed" && "bg-green-500",
                      project.status === "active" && "bg-blue-500",
                      project.status === "planning" && "bg-purple-500",
                      project.status === "on-hold" && "bg-yellow-500",
                      project.status === "cancelled" && "bg-red-500"
                    )}
                    style={{ width: `${barStyle.completion}%` }}
                  />

                  {/* Remaining portion - diagonal stripes */}
                  <div
                    className="absolute inset-y-0 right-0"
                    style={{
                      width: `${100 - barStyle.completion}%`,
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        rgba(255, 255, 255, 0.1) 0px,
                        rgba(255, 255, 255, 0.1) 10px,
                        transparent 10px,
                        transparent 20px
                      )`,
                      backgroundColor: project.status === "completed" ? "rgba(34, 197, 94, 0.3)" :
                                     project.status === "active" ? "rgba(59, 130, 246, 0.3)" :
                                     project.status === "planning" ? "rgba(168, 85, 247, 0.3)" :
                                     project.status === "on-hold" ? "rgba(251, 191, 36, 0.3)" :
                                     "rgba(239, 68, 68, 0.3)"
                    }}
                  />

                  {/* Progress percentage label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white drop-shadow-lg">
                      {barStyle.completion}%
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
