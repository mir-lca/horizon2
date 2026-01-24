"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, Circle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getProjectPhaseBarClass, getProjectPhaseDotClass } from "@/lib/project-visuals";
import { Project } from "@/lib/types";
import { SCROLLBAR_CLASSES, COMPONENT_BORDER_CLASSES } from "@/lib/ui-shared-styles";

interface InteractiveGanttPanelProps {
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

const convertQuarterToNumber = (quarter: any): number => {
  if (typeof quarter === "number") {
    return quarter;
  }
  if (typeof quarter === "object" && quarter?.quarter) {
    const quarterMap: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    return quarterMap[quarter.quarter] || 1;
  }
  return 1;
};

const getQuarterIndex = (quarter: any): number => {
  const quarterNum = convertQuarterToNumber(quarter);
  return quarterNum - 1;
};

const getQuarterSortIndex = (quarter: any): number => {
  return convertQuarterToNumber(quarter);
};

interface DragState {
  isDragging: boolean;
  dragType: "move" | "resize-start" | "resize-end" | null;
  projectId: string | null;
  startX: number;
  startYear: number;
  startDuration: number;
  previewYear: number;
  previewDuration: number;
}

interface ProjectBarProps {
  project: Project;
  barStyle: { left: string; width: string };
  statusColor: string;
  isPreview?: boolean;
  onDragStart?: (event: React.MouseEvent, projectId: string, dragType: "move" | "resize-start" | "resize-end") => void;
}

function ProjectBar({ project, barStyle, statusColor, isPreview = false, onDragStart }: ProjectBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "absolute h-5 rounded-sm transition-all duration-200 border select-none",
        statusColor,
        isPreview
          ? "opacity-80 border-dashed border-neutral-500 shadow-lg z-50 cursor-grabbing"
          : "border-white/20 hover:border-white/50 shadow-sm hover:shadow-lg cursor-grab",
        isHovered && !isPreview && "ring-2 ring-white/40 scale-105 z-20"
      )}
      style={barStyle}
      onMouseEnter={() => !isPreview && setIsHovered(true)}
      onMouseLeave={() => !isPreview && setIsHovered(false)}
      onMouseDown={(event) => {
        onDragStart?.(event, project.id, "move");
      }}
      title={isPreview ? `Moving: ${project.name}` : `${project.name} - ${project.status} (Click and drag to move)`}
    >
      {isHovered && !isPreview && (
        <>
          <div
            className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-white/30 hover:bg-white/60 rounded-l-sm transition-all duration-150 flex items-center justify-center"
            onMouseDown={(event) => {
              event.stopPropagation();
              onDragStart?.(event, project.id, "resize-start");
            }}
            title="Drag to change start date"
          >
            <div className="w-0.5 h-3 bg-white/80 rounded"></div>
          </div>
          <div
            className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-white/30 hover:bg-white/60 rounded-r-sm transition-all duration-150 flex items-center justify-center"
            onMouseDown={(event) => {
              event.stopPropagation();
              onDragStart?.(event, project.id, "resize-end");
            }}
            title="Drag to change duration"
          >
            <div className="w-0.5 h-3 bg-white/80 rounded"></div>
          </div>
        </>
      )}

      {isPreview && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm animate-pulse" />
      )}
    </div>
  );
}

export function InteractiveGanttPanel({
  projects,
  onProjectChange,
  selectedBusinessUnit = "all",
  timeline,
}: InteractiveGanttPanelProps) {
  const router = useRouter();
  const [localProjectUpdates, setLocalProjectUpdates] = useState<
    Record<string, { startYear: number; durationQuarters: number; startQuarter?: number }>
  >({});
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    dragType: null,
    projectId: null,
    startX: 0,
    startYear: 0,
    startDuration: 0,
    previewYear: 0,
    previewDuration: 0,
  });

  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gantt-expanded-parents");
        if (saved) {
          return new Set(JSON.parse(saved));
        }
      } catch (error) {
        console.warn("Failed to load expanded parents from localStorage:", error);
      }
    }

    const parentIds = projects
      .filter((p) => projects.some((child) => (child as any).parentProjectId === p.id))
      .slice(0, 2)
      .map((p) => p.id);
    return new Set(parentIds);
  });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    projectId: null,
    startX: 0,
    startYear: 0,
    startDuration: 0,
    previewYear: 0,
    previewDuration: 0,
  });

  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);

    try {
      localStorage.setItem("gantt-expanded-parents", JSON.stringify(Array.from(newExpanded)));
    } catch (error) {
      console.warn("Failed to save expanded parents to localStorage:", error);
    }
  };

  const startYear = timeline?.startYear || 2020;
  const endYear = timeline?.endYear || 2030;
  const timelineYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  useEffect(() => {
    if (timelineRef.current) {
      const currentYear = new Date().getFullYear();
      const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

      let targetYear = currentYear;
      let targetQuarter = currentQuarter - 1;

      if (targetQuarter <= 0) {
        targetYear = currentYear - 1;
        targetQuarter = 4;
      }

      const yearOffset = Math.max(0, targetYear - startYear);
      const quarterOffset = targetQuarter - 1;
      const scrollPosition = (yearOffset * 4 + quarterOffset) * 40;

      const scrollContainer = timelineRef.current.querySelector(".overflow-auto");
      if (scrollContainer) {
        scrollContainer.scrollLeft = Math.max(0, scrollPosition - 200);
      }
    }
  }, [startYear]);

  const { visibleProjects, parentProjects } = useMemo(() => {
    const filtered = projects.filter((p) => selectedBusinessUnit === "all" || p.businessUnitId === selectedBusinessUnit);

    const parentGroups = new Map<string, typeof filtered>();
    const rootProjects: typeof filtered = [];

    filtered.forEach((project) => {
      const parentProjectId = (project as any).parentProjectId;
      if (!parentProjectId) {
        rootProjects.push(project);
      } else {
        if (!parentGroups.has(parentProjectId)) {
          parentGroups.set(parentProjectId, []);
        }
        parentGroups.get(parentProjectId)!.push(project);
      }
    });

    const sortProjects = (projectsToSort: typeof filtered) =>
      projectsToSort.sort((a, b) => {
        if (a.startYear !== b.startYear) return a.startYear - b.startYear;
        const aQuarter = getQuarterSortIndex(a.startQuarter);
        const bQuarter = getQuarterSortIndex(b.startQuarter);
        if (aQuarter !== bQuarter) return aQuarter - bQuarter;
        return a.name.localeCompare(b.name);
      });

    const sortedRootProjects = sortProjects(rootProjects);

    const nestedProjects = sortedRootProjects.map((project) => {
      const children = parentGroups.get(project.id) || [];
      return {
        ...project,
        childProjects: sortProjects(children),
      };
    });

    const visibleProjectsList: Project[] = [];
    nestedProjects.forEach((project) => {
      visibleProjectsList.push(project);
      if (expandedParents.has(project.id) && project.childProjects?.length) {
        project.childProjects.forEach((child) => visibleProjectsList.push(child));
      }
    });

    return {
      visibleProjects: visibleProjectsList,
      parentProjects: nestedProjects,
    };
  }, [projects, selectedBusinessUnit, expandedParents]);

  const calculateBarPosition = useCallback(
    (project: Project, isPreview = false) => {
      const projectId = project.id;
      const localUpdate = localProjectUpdates[projectId];

      const effectiveStartYear = localUpdate?.startYear ?? project.startYear;
      const effectiveStartQuarter = localUpdate?.startQuarter ?? project.startQuarter;
      const effectiveDuration = localUpdate?.durationQuarters ?? project.durationQuarters;

      const normalizedStartQuarter = convertQuarterToNumber(effectiveStartQuarter);
      const startOffset = (effectiveStartYear - startYear) * 4 + (normalizedStartQuarter - 1);

      const width = Math.max(1, effectiveDuration) * 40;
      const left = startOffset * 40;

      return {
        left: `${left}px`,
        width: `${width}px`,
      };
    },
    [localProjectUpdates, startYear]
  );

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleDragStart = (event: React.MouseEvent, projectId: string, dragType: "move" | "resize-start" | "resize-end") => {
    event.preventDefault();
    event.stopPropagation();

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const localUpdate = localProjectUpdates[projectId];
    const startYearValue = localUpdate?.startYear ?? project.startYear;
    const startQuarterValue = localUpdate?.startQuarter ?? project.startQuarter;
    const durationValue = localUpdate?.durationQuarters ?? project.durationQuarters;

    const startYearQuarter = startYearValue * 4 + getQuarterIndex(startQuarterValue);

    dragStateRef.current = {
      isDragging: true,
      dragType,
      projectId,
      startX: event.clientX,
      startYear: startYearQuarter,
      startDuration: durationValue,
      previewYear: startYearQuarter,
      previewDuration: durationValue,
    };

    setDragState(dragStateRef.current);

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragMove = useCallback(
    (event: MouseEvent) => {
      if (!dragStateRef.current.isDragging || !dragStateRef.current.projectId) return;

      const timelineElement = timelineRef.current;
      if (!timelineElement) return;

      const rect = timelineElement.getBoundingClientRect();
      const quarterWidth = 40;

      const deltaX = event.clientX - dragStateRef.current.startX;
      const quarterDelta = Math.round(deltaX / quarterWidth);

      let newStartYearQuarter = dragStateRef.current.startYear;
      let newDuration = dragStateRef.current.startDuration;

      if (dragStateRef.current.dragType === "move") {
        newStartYearQuarter = dragStateRef.current.startYear + quarterDelta;
      } else if (dragStateRef.current.dragType === "resize-start") {
        const endPosition = dragStateRef.current.startYear + dragStateRef.current.startDuration - 1;
        newStartYearQuarter = Math.min(endPosition - 1, dragStateRef.current.startYear + quarterDelta);
        newDuration = endPosition - newStartYearQuarter + 1;
      } else if (dragStateRef.current.dragType === "resize-end") {
        newDuration = Math.max(1, dragStateRef.current.startDuration + quarterDelta);
      }

      newStartYearQuarter = Math.max(0, newStartYearQuarter);

      const totalQuarters = (endYear - startYear + 1) * 4;
      if (newStartYearQuarter + newDuration > totalQuarters) {
        newDuration = totalQuarters - newStartYearQuarter;
      }

      dragStateRef.current.previewYear = newStartYearQuarter;
      dragStateRef.current.previewDuration = newDuration;

      setDragState({ ...dragStateRef.current });
    },
    [endYear, startYear]
  );

  const handleDragEnd = useCallback(() => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.projectId) return;

    const projectId = dragStateRef.current.projectId;
    const previewYearQuarter = dragStateRef.current.previewYear;
    const previewDuration = dragStateRef.current.previewDuration;

    const newStartYear = startYear + Math.floor(previewYearQuarter / 4);
    const newStartQuarter = (previewYearQuarter % 4) + 1;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedProject = {
      ...project,
      startYear: newStartYear,
      startQuarter: newStartQuarter,
      durationQuarters: previewDuration,
    };

    const updatedProjects = projects.map((p) => (p.id === projectId ? updatedProject : p));

    setLocalProjectUpdates((prev) => ({
      ...prev,
      [projectId]: {
        startYear: newStartYear,
        startQuarter: newStartQuarter,
        durationQuarters: previewDuration,
      },
    }));

    onProjectChange(updatedProjects, {
      projectTimelineChanged: true,
      projectId,
      oldStartYear: project.startYear,
      oldStartQuarter: project.startQuarter,
      newStartYear,
      newStartQuarter,
    });

    setRecentlyUpdated(projectId);
    setTimeout(() => setRecentlyUpdated(null), 2000);

    dragStateRef.current = {
      isDragging: false,
      dragType: null,
      projectId: null,
      startX: 0,
      startYear: 0,
      startDuration: 0,
      previewYear: 0,
      previewDuration: 0,
    };

    setDragState(dragStateRef.current);

    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  }, [handleDragMove, onProjectChange, projects, startYear]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const toggleVisibility = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedProject = { ...project, visible: !project.visible };
    const updatedProjects = projects.map((p) => (p.id === projectId ? updatedProject : p));

    onProjectChange(updatedProjects, {
      projectTimelineChanged: false,
      projectId,
      newStartYear: project.startYear,
      newStartQuarter: project.startQuarter,
    });
  };

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No projects available for the selected filters.
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", COMPONENT_BORDER_CLASSES)}>
      <div className="flex-1 min-h-0 flex">
        <div className="w-72 border-r border-border bg-muted/20 flex-shrink-0">
          <div className="h-12 flex items-center px-4 border-b border-border bg-muted/30">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</div>
          </div>

          <div className={`h-[calc(100%-3rem)] overflow-auto ${SCROLLBAR_CLASSES}`}>
            {parentProjects.map((project) => (
              <div key={project.id}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border-b border-border hover:bg-muted/30 cursor-pointer transition-colors",
                    recentlyUpdated === project.id && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => toggleParentExpansion(project.id)}
                >
                  {project.childProjects?.length ? (
                    expandedParents.has(project.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )
                  ) : (
                    <div className="w-4" />
                  )}
                  <Circle className={`h-2.5 w-2.5 fill-current ${getProjectPhaseDotClass(project)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{project.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{project.businessUnitName || "Unassigned"}</div>
                  </div>
                  <button onClick={(event) => toggleVisibility(project.id, event)} className="text-muted-foreground hover:text-foreground">
                    {project.visible === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {expandedParents.has(project.id) &&
                  project.childProjects?.map((child) => (
                    <div
                      key={child.id}
                      className={cn(
                        "flex items-center gap-2 pl-8 pr-3 py-2 border-b border-border hover:bg-muted/30 cursor-pointer transition-colors",
                        recentlyUpdated === child.id && "bg-blue-50 dark:bg-blue-950/20"
                      )}
                      onClick={() => handleProjectClick(child.id)}
                    >
                      <Circle className={`h-2 w-2 fill-current ${getProjectPhaseDotClass(child)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{child.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{child.businessUnitName || "Unassigned"}</div>
                      </div>
                      <button onClick={(event) => toggleVisibility(child.id, event)} className="text-muted-foreground hover:text-foreground">
                        {child.visible === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0" ref={timelineRef}>
          <div className="h-12 flex items-center border-b border-border bg-muted/30">
            <div className="flex-1 flex">
              {timelineYears.map((year) => (
                <div key={year} className="flex-1 border-r border-border">
                  <div className="text-center text-xs font-semibold">{year}</div>
                  <div className="flex">
                    {[1, 2, 3, 4].map((quarter) => (
                      <div key={`${year}-Q${quarter}`} className="w-10 text-center text-[10px] text-muted-foreground border-r border-border">
                        Q{quarter}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`h-[calc(100%-3rem)] overflow-auto ${SCROLLBAR_CLASSES}`}>
            {visibleProjects.map((project) => {
              const statusColor = getProjectPhaseBarClass(project);
              const barStyle = calculateBarPosition(project);
              const isRecentlyUpdated = recentlyUpdated === project.id;

              let previewBarStyle = barStyle;
              if (dragState.isDragging && dragState.projectId === project.id) {
                const previewYear = dragState.previewYear;
                const previewDuration = dragState.previewDuration;
                previewBarStyle = {
                  left: `${previewYear * 40}px`,
                  width: `${Math.max(1, previewDuration) * 40}px`,
                };
              }

              return (
                <div
                  key={project.id}
                  className={cn(
                    "h-10 relative border-b border-border hover:bg-muted/20 cursor-pointer transition-colors",
                    isRecentlyUpdated && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="absolute inset-0 flex">
                    {timelineYears.map((year) => (
                      <div key={`${project.id}-${year}`} className="flex-1 border-r border-border">
                        {[1, 2, 3, 4].map((quarter) => (
                          <div key={`${project.id}-${year}-Q${quarter}`} className="w-10 h-full border-r border-border inline-block"></div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <ProjectBar project={project} barStyle={barStyle} statusColor={statusColor} onDragStart={handleDragStart} />

                  {dragState.isDragging && dragState.projectId === project.id && (
                    <ProjectBar project={project} barStyle={previewBarStyle} statusColor={statusColor} isPreview={true} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
