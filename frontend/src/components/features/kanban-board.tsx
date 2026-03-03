"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: Array<{ id: Project["status"]; label: string }> = [
  { id: "unfunded", label: "Unfunded" },
  { id: "funded", label: "Funded" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
];

const RISK_COLOR: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(n);

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  isDragging?: boolean;
}

function ProjectCard({ project, onClick, isDragging }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing space-y-2 hover:shadow-md transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <div className="font-medium text-sm leading-snug">{project.name}</div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{project.businessUnitId}</span>
        <span>{fmt(project.totalCost)}</span>
      </div>
      {project.riskLevel && (
        <span className={cn("inline-flex text-xs px-1.5 py-0.5 rounded font-medium", RISK_COLOR[project.riskLevel] ?? "bg-muted text-muted-foreground")}>
          {project.riskLevel}
        </span>
      )}
    </div>
  );
}

interface KanbanBoardProps {
  projects: Project[];
  onUpdateStatus: (projectId: string, newStatus: Project["status"]) => Promise<void>;
  onProjectClick?: (projectId: string) => void;
}

export function KanbanBoard({ projects, onUpdateStatus, onProjectClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const byStatus = useMemo(() => {
    const groups: Record<string, Project[]> = {};
    COLUMNS.forEach((col) => { groups[col.id] = []; });
    projects.forEach((p) => {
      const status = p.status ?? 'unfunded';
      if (!groups[status]) groups[status] = [];
      groups[status].push(p);
    });
    return groups;
  }, [projects]);

  const activeProject = activeId ? projects.find((p) => p.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? (over.id as string) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const projectId = active.id as string;
    const targetId = over.id as string;

    // Check if dropped over a column id
    const targetColumn = COLUMNS.find((col) => col.id === targetId);
    if (targetColumn) {
      await onUpdateStatus(projectId, targetColumn.id);
      return;
    }

    // Dropped over another card — find what column it's in
    for (const col of COLUMNS) {
      const inCol = byStatus[col.id]?.find((p) => p.id === targetId);
      if (inCol) {
        const originalProject = projects.find((p) => p.id === projectId);
        if (originalProject && originalProject.status !== col.id) {
          await onUpdateStatus(projectId, col.id);
        }
        break;
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 h-full">
        {COLUMNS.map((col) => {
          const colProjects = byStatus[col.id] ?? [];
          const isOver = overId === col.id;
          return (
            <div
              key={col.id}
              id={col.id}
              className={cn(
                "flex flex-col rounded-lg border bg-muted/30 min-h-[400px] transition-colors",
                isOver && "ring-2 ring-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-medium">{col.label}</span>
                <Badge variant="secondary" className="text-xs">{colProjects.length}</Badge>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                <SortableContext
                  items={colProjects.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => onProjectClick?.(project.id)}
                    />
                  ))}
                </SortableContext>
              </div>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeProject && <ProjectCard project={activeProject} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
