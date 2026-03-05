"use client";

import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { Gantt, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import { useRouter } from "next/navigation";
import type { ITask, IApi } from "@svar-ui/react-gantt";
import { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { COMPONENT_BORDER_CLASSES } from "@/lib/ui-shared-styles";

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

const quarterToMonth = (quarter: number): number => (quarter - 1) * 3;

const dateToYearQuarter = (date: Date): { year: number; quarter: number } => ({
  year: date.getFullYear(),
  quarter: Math.floor(date.getMonth() / 3) + 1,
});

const calculateEndDate = (startYear: number, startQuarter: number, durationQuarters: number): Date => {
  const startDate = new Date(startYear, quarterToMonth(startQuarter), 1);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationQuarters * 3);
  return endDate;
};

const calculateDurationQuarters = (start: Date, end: Date): number => {
  const totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, Math.ceil(totalMonths / 3));
};

export function SvarGanttPanel({
  projects,
  onProjectChange,
  selectedBusinessUnit = "all",
  timeline,
}: SvarGanttPanelProps) {
  const router = useRouter();

  // Stable refs to avoid stale closures in init callback
  const projectsRef = useRef(projects);
  useEffect(() => { projectsRef.current = projects; });

  const onProjectChangeRef = useRef(onProjectChange);
  useEffect(() => { onProjectChangeRef.current = onProjectChange; });

  const filteredProjects = useMemo(
    () =>
      selectedBusinessUnit === "all"
        ? projects
        : projects.filter((p) => p.businessUnitId === selectedBusinessUnit),
    [projects, selectedBusinessUnit]
  );

  const tasks: ITask[] = useMemo(
    () =>
      filteredProjects.map((project) => {
        const task: ITask = {
          id: project.id,
          text: project.name,
          start: new Date(project.startYear, quarterToMonth(project.startQuarter), 1),
          end: calculateEndDate(project.startYear, project.startQuarter, project.durationQuarters),
          duration: project.durationQuarters,
          progress: 0,
          type: filteredProjects.some((p) => (p as any).parentProjectId === project.id)
            ? "summary"
            : "task",
          open: true,
          status: project.status,
          visible: project.visible !== false,
        };
        if ((project as any).parentProjectId) {
          task.parent = (project as any).parentProjectId;
        }
        return task;
      }),
    [filteredProjects]
  );

  const startDate = new Date(timeline?.startYear ?? 2020, 0, 1);
  const endDate = new Date(timeline?.endYear ?? 2030, 11, 31);

  const handleInit = useCallback(
    (api: IApi) => {
      api.on("update-task", (ev) => {
        const { id, task: updates } = ev;
        const originalProject = projectsRef.current.find((p) => p.id === id);
        if (!originalProject || (!updates.start && !updates.end)) return;

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

        const updatedProject = {
          ...originalProject,
          startYear: newStartYear,
          startQuarter: newStartQuarter,
          durationQuarters: newDuration,
        };
        const updatedProjects = projectsRef.current.map((p) =>
          p.id === id ? updatedProject : p
        );

        onProjectChangeRef.current(updatedProjects, {
          projectTimelineChanged: true,
          projectId: id as string,
          oldStartYear: originalProject.startYear,
          oldStartQuarter: originalProject.startQuarter,
          newStartYear,
          newStartQuarter,
        });
      });

      api.on("select-task", (ev) => {
        if (ev.id) router.push(`/projects/${ev.id}`);
      });
    },
    [router]
  );

  return (
    <div className={cn("h-full flex flex-col", COMPONENT_BORDER_CLASSES)}>
      <div className="flex-1 min-h-0">
        <Willow fonts={false}>
          <Gantt
            tasks={tasks}
            links={[]}
            start={startDate}
            end={endDate}
            lengthUnit="quarter"
            cellWidth={40}
            cellHeight={40}
            zoom={false}
            init={handleInit}
          />
        </Willow>
      </div>
    </div>
  );
}
