"use client";

import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { Gantt } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import { useRouter } from "next/navigation";
import type { ITask, IConfig, IApi, TID } from "@svar-ui/react-gantt";
import { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SCROLLBAR_CLASSES, COMPONENT_BORDER_CLASSES } from "@/lib/ui-shared-styles";

interface SvarGanttPanelProps {
  projects: Project[];
  onProjectChange: (
    updatedProjects: Project[],
    changes?: {
      projectTimelineChanged: boolean;
      projectId: string;
      oldStartYear?: number;
      oldStartQuarter?: number;
      newStartYear: number;
      newStartQuarter: number;
    }
  ) => void;
  selectedBusinessUnit?: string;
  timeline?: { startYear: number; endYear: number };
}

// Helper function to convert quarter to month
const quarterToMonth = (quarter: number): number => {
  return (quarter - 1) * 3; // Q1=0, Q2=3, Q3=6, Q4=9
};

// Helper function to convert date to year and quarter
const dateToYearQuarter = (date: Date): { year: number; quarter: number } => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return { year, quarter };
};

// Helper function to calculate end date from start + duration (quarters)
const calculateEndDate = (startYear: number, startQuarter: number, durationQuarters: number): Date => {
  const startMonth = quarterToMonth(startQuarter);
  const startDate = new Date(startYear, startMonth, 1);

  // Add duration in quarters (3 months each)
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationQuarters * 3);

  return endDate;
};

// Helper function to calculate duration in quarters between two dates
const calculateDurationQuarters = (start: Date, end: Date): number => {
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
  return Math.ceil(totalMonths / 3);
};

// Map status to color
const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'bg-green-500',
    'planning': 'bg-blue-500',
    'completed': 'bg-gray-500',
    'on-hold': 'bg-yellow-500',
    'cancelled': 'bg-red-500',
  };
  return statusMap[status.toLowerCase()] || 'bg-blue-500';
};

export function SvarGanttPanel({
  projects,
  onProjectChange,
  selectedBusinessUnit = "all",
  timeline,
}: SvarGanttPanelProps) {
  const router = useRouter();
  const apiRef = useRef<IApi | null>(null);

  // Filter projects by business unit
  const filteredProjects = useMemo(() => {
    return projects.filter((p) =>
      selectedBusinessUnit === "all" || p.businessUnitId === selectedBusinessUnit
    );
  }, [projects, selectedBusinessUnit]);

  // Convert Project[] to ITask[]
  const tasks: ITask[] = useMemo(() => {
    console.log('SvarGanttPanel - filteredProjects:', filteredProjects.length, filteredProjects);

    const convertedTasks = filteredProjects.map((project) => {
      const startMonth = quarterToMonth(project.startQuarter);
      const startDate = new Date(project.startYear, startMonth, 1);
      const endDate = calculateEndDate(project.startYear, project.startQuarter, project.durationQuarters);

      // Determine type based on whether it has children
      const hasChildren = filteredProjects.some(p => (p as any).parentProjectId === project.id);
      const type = hasChildren ? "summary" : "task";

      const task: ITask = {
        id: project.id,
        text: project.name,
        start: startDate,
        end: endDate,
        duration: project.durationQuarters,
        progress: 0, // Could map from project data if available
        type: type,
        open: true, // Keep tasks expanded by default
        // Custom fields
        status: project.status,
        businessUnit: project.businessUnitName,
        visible: project.visible !== false,
      };

      // Only add parent if the project has one
      const parentProjectId = (project as any).parentProjectId;
      if (parentProjectId) {
        task.parent = parentProjectId;
      }

      return task;
    });

    console.log('SvarGanttPanel - convertedTasks:', convertedTasks.length, convertedTasks);
    return convertedTasks;
  }, [filteredProjects]);

  // Configure scales for quarterly view
  const scales = useMemo(() => {
    return [
      {
        unit: "year" as const,
        step: 1,
        format: (date: Date) => date.getFullYear().toString(),
      },
      {
        unit: "quarter" as const,
        step: 1,
        format: (date: Date) => {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return `Q${quarter}`;
        },
      },
    ];
  }, []);

  // Configure columns for the left panel
  // Temporarily disabled custom columns to fix SVAR Gantt initialization
  // SVAR will auto-generate columns from task data
  const columns = useMemo(() => {
    return undefined; // Let SVAR auto-generate columns
  }, []);

  // Handle task updates (drag, resize)
  const handleUpdateTask = useCallback((event: { id: TID; task: Partial<ITask> }) => {
    const { id, task: updates } = event;

    // Find the original project
    const originalProject = projects.find(p => p.id === id);
    if (!originalProject) return;

    // Calculate new timeline if start or end changed
    if (updates.start || updates.end) {
      const newStart = updates.start || originalProject.startYear;
      const newEnd = updates.end;

      let newStartYear = originalProject.startYear;
      let newStartQuarter = originalProject.startQuarter;
      let newDuration = originalProject.durationQuarters;

      if (updates.start instanceof Date) {
        const { year, quarter } = dateToYearQuarter(updates.start);
        newStartYear = year;
        newStartQuarter = quarter;
      }

      if (updates.end instanceof Date && updates.start instanceof Date) {
        newDuration = calculateDurationQuarters(updates.start, updates.end);
      }

      // Update the project
      const updatedProject = {
        ...originalProject,
        startYear: newStartYear,
        startQuarter: newStartQuarter,
        durationQuarters: newDuration,
      };

      const updatedProjects = projects.map(p => p.id === id ? updatedProject : p);

      onProjectChange(updatedProjects, {
        projectTimelineChanged: true,
        projectId: id as string,
        oldStartYear: originalProject.startYear,
        oldStartQuarter: originalProject.startQuarter,
        newStartYear,
        newStartQuarter,
      });
    }
  }, [projects, onProjectChange]);

  // Handle task selection/click
  const handleSelectTask = useCallback((event: { id: TID }) => {
    if (event.id) {
      router.push(`/projects/${event.id}`);
    }
  }, [router]);

  // Initialize API reference
  const handleInit = useCallback((api: IApi) => {
    apiRef.current = api;
  }, []);

  // Timeline configuration
  const config: Partial<IConfig> = useMemo(() => {
    const startYear = timeline?.startYear || 2020;
    const endYear = timeline?.endYear || 2030;

    const ganttConfig: Partial<IConfig> = {
      start: new Date(startYear, 0, 1),
      end: new Date(endYear, 11, 31),
      lengthUnit: "quarter" as const,
      cellWidth: 40,
      cellHeight: 40,
      zoom: false,
      readonly: false,
    };

    console.log('SvarGanttPanel - config:', ganttConfig);
    return ganttConfig;
  }, [timeline]);

  console.log('SvarGanttPanel - Rendering with tasks:', tasks.length);

  return (
    <div className={cn("h-full flex flex-col", COMPONENT_BORDER_CLASSES)}>
      <style jsx global>{`
        /* Override SVAR Gantt styles to match dark theme */
        .wx-gantt {
          --wx-color-font: var(--foreground);
          --wx-background: var(--background);
          --wx-color-primary: var(--primary);
          --wx-border: var(--border);
        }

        .wx-gantt-grid {
          background: var(--card-bg);
          border-right: 1px solid var(--border);
        }

        .wx-gantt-scale {
          background: var(--muted);
          border-bottom: 1px solid var(--border);
        }

        .wx-gantt-row {
          border-bottom: 1px solid var(--border);
        }

        .wx-gantt-row:hover {
          background: var(--hover-bg);
        }

        .wx-gantt-bar {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wx-gantt-bar:hover {
          filter: brightness(1.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        /* Custom scrollbar styling */
        .wx-gantt ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .wx-gantt ::-webkit-scrollbar-track {
          background: var(--background);
        }

        .wx-gantt ::-webkit-scrollbar-thumb {
          background: var(--muted);
          border-radius: 4px;
        }

        .wx-gantt ::-webkit-scrollbar-thumb:hover {
          background: var(--subtle);
        }
      `}</style>

      <div className="flex-1 min-h-0">
        <Gantt
          tasks={tasks}
          scales={scales}
          start={config.start}
          end={config.end}
          lengthUnit={config.lengthUnit}
          cellWidth={config.cellWidth}
          cellHeight={config.cellHeight}
          zoom={config.zoom}
          readonly={config.readonly}
          init={handleInit}
          onupdatetask={handleUpdateTask}
          onselecttask={handleSelectTask}
        />
      </div>
    </div>
  );
}
