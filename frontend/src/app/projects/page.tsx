"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui";
import { Project, BusinessUnit, RiskFactor } from "@/lib/types";
import { useProjectSortConfig, useProjectFilterState, useLocalStorage } from "@/lib/storage-utils";
import { useProjectData } from "@/hooks/use-project-data";
import { useProjectHierarchy, ProjectWithChildren } from "@/hooks/useProjectHierarchy";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { GripVertical, ArrowUpDown } from "lucide-react";
import { SearchBar, SearchSuggestion } from "@/components/features/SearchBar";
import { ProjectRow } from "@/components/features/project-row";
import { ProjectEditDialog } from "@/components/forms/project-edit-dialog";
import { DropZone } from "@/components/ui/draggable-row";
import { FilterPanel, FilterState } from "@/components/features/filter-panel";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui";
import { calculateIRRForProjects } from "@/lib/financial-calculations";
import { useAppStore } from "@/store/app-store";
import { PageLayout } from "@/components/layout";

export default function ProjectsPage() {
  const selectedBusinessUnit = useAppStore((state) => state.selectedBusinessUnit);

  const {
    projects,
    businessUnits,
    loading,
    error,
    updateProject,
    createProject,
    refetchAll,
  } = useProjectData();

  const [searchQuery, setSearchQuery] = useState("");
  const [showChildProjects, setShowChildProjects] = useLocalStorage<{ [key: string]: boolean }>("projects_expanded_state", {});
  const [activeProject, setActiveProject] = useState<ProjectWithChildren | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [filters, setFilters] = useProjectFilterState();
  const [pendingHierarchyChanges, setPendingHierarchyChanges] = useState<{ [key: string]: string }>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditProject, setCurrentEditProject] = useState<ProjectWithChildren | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [sortConfig, setSortConfig] = useProjectSortConfig();

  const prevProjectsSignatureRef = React.useRef<string>("");
  useEffect(() => {
    if (!Array.isArray(projects)) return;

    const signature = projects
      .map((p) => `${p.id}:${p.updatedAt || ""}:${p.parentProjectId || ""}`)
      .sort()
      .join("|");

    if (prevProjectsSignatureRef.current === signature) return;

    setLocalProjects(projects as Project[]);
    prevProjectsSignatureRef.current = signature;
  }, [projects]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {})
  );

  const businessUnitFilteredProjects = useMemo(() => {
    if (selectedBusinessUnit === "all") {
      return localProjects;
    }
    return localProjects.filter((project) => project.businessUnitId === selectedBusinessUnit);
  }, [localProjects, selectedBusinessUnit]);

  const projectsList = businessUnitFilteredProjects;

  const searchSuggestions = useMemo((): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];

    projectsList.forEach((project) => {
      if (project.name) {
        suggestions.push({
          id: `project-${project.id}`,
          label: project.name,
          value: project.name,
          category: "Projects",
          subtitle: project.businessUnitName || "No Business Unit",
          metadata: project.status || "No Status",
        });
      }
    });

    const uniqueBusinessUnits = Array.from(new Set(projectsList.map((p) => p.businessUnitName).filter(Boolean)));
    uniqueBusinessUnits.forEach((buName) => {
      if (buName) {
        suggestions.push({
          id: `bu-${buName}`,
          label: buName,
          value: buName,
          category: "Business Units",
          subtitle: "Business Unit",
          metadata: `${projectsList.filter((p) => p.businessUnitName === buName).length} projects`,
        });
      }
    });

    const uniqueStatuses = Array.from(new Set(projectsList.map((p) => p.status).filter(Boolean)));
    uniqueStatuses.forEach((status) => {
      if (status) {
        suggestions.push({
          id: `status-${status}`,
          label: status,
          value: status,
          category: "Status",
          subtitle: "Project Status",
          metadata: `${projectsList.filter((p) => p.status === status).length} projects`,
        });
      }
    });

    return suggestions;
  }, [projectsList]);

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.value);

    if (suggestion.category === "Business Units") {
      const businessUnit = businessUnits.find((bu: BusinessUnit) => bu.name === suggestion.value);
      if (businessUnit) {
        setFilters((prev) => ({ ...prev, businessUnitId: businessUnit.id }));
      }
    } else if (suggestion.category === "Status") {
      setFilters((prev) => ({ ...prev, status: [suggestion.value] }));
    }
  };

  const toggleChildProjects = (projectId: string): void => {
    setShowChildProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  // Use custom hooks for hierarchy and filtering
  const organizedProjects = useProjectHierarchy(projectsList, sortConfig);
  const { filteredProjects, activeFilterCount } = useProjectFilters(organizedProjects, filters, searchQuery);

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id.toString();
    const project = projectsList.find((p) => p.id === activeId);
    if (project) {
      setActiveProject(project as ProjectWithChildren);
    }
  };

  const findProjectById = (id: string, projectsToSearch: ProjectWithChildren[]): ProjectWithChildren | null => {
    for (const project of projectsToSearch) {
      if (project.id === id) {
        return project;
      }

      if (project.childProjects && project.childProjects.length > 0) {
        const found = findProjectById(id, project.childProjects);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  const isDescendantOf = (targetId: string, projectId: string, projectsToSearch: ProjectWithChildren[]): boolean => {
    const project = findProjectById(projectId, projectsToSearch);

    if (!project || !project.childProjects) {
      return false;
    }

    for (const child of project.childProjects) {
      if (child.id === targetId) {
        return true;
      }

      if (isDescendantOf(targetId, child.id, projectsToSearch)) {
        return true;
      }
    }

    return false;
  };

  const handleDragOver = (event: any) => {
    const { over } = event;
    if (!over) {
      setDragOverId(null);
      return;
    }
    setDragOverId(over.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      toast.info("Drop cancelled - no valid target detected");
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const draggedProject = projectsList.find((p) => p.id === activeId);
    if (!draggedProject) {
      toast.error("Couldn't find the dragged project");
      return;
    }

    if (overId === "root") {
      if (!draggedProject.parentProjectId) {
        toast.info("Project is already at the root level");
        return;
      }

      const toastId = toast.loading("Making project a master project...");
      setPendingHierarchyChanges((prev) => ({ ...prev, [draggedProject.id]: "Moving to root..." }));

      try {
        const updatedProject = {
          ...draggedProject,
          parentProjectId: undefined,
          updatedAt: new Date().toISOString(),
        };

        const result = await updateProject(updatedProject as any);

        if (result) {
          toast.success("Project moved to root level", { id: toastId });
        } else {
          toast.error("Failed to update project hierarchy", { id: toastId });
        }
      } catch (error) {
        console.error("Error updating project hierarchy:", error);
        toast.error("Failed to update project hierarchy", { id: toastId });
      } finally {
        setPendingHierarchyChanges((prev) => {
          const newState = { ...prev };
          delete newState[draggedProject.id];
          return newState;
        });
      }
      return;
    }

    const droppedOnProject = projectsList.find((p) => p.id === overId);
    if (!droppedOnProject) {
      toast.error("Couldn't find the target project");
      return;
    }

    if (isDescendantOf(droppedOnProject.id, draggedProject.id, organizedProjects)) {
      toast.error("Cannot move a project into one of its descendants");
      return;
    }

    if (draggedProject.parentProjectId === droppedOnProject.id) {
      toast.info("Project is already a child of this project");
      return;
    }

    const toastId = toast.loading(`Moving project to ${droppedOnProject.name}...`);
    setPendingHierarchyChanges((prev) => ({ ...prev, [draggedProject.id]: `Moving to ${droppedOnProject.name}...` }));

    try {
      const updatedProject = {
        ...draggedProject,
        parentProjectId: droppedOnProject.id,
        updatedAt: new Date().toISOString(),
      };

      const result = await updateProject(updatedProject as any);

      if (result) {
        toast.success(`Project moved to ${droppedOnProject.name}`, { id: toastId });
      } else {
        toast.error("Failed to update project hierarchy", { id: toastId });
      }
    } catch (error) {
      console.error("Error updating project hierarchy:", error);
      toast.error("Failed to update project hierarchy", { id: toastId });
    } finally {
      setPendingHierarchyChanges((prev) => {
        const newState = { ...prev };
        delete newState[draggedProject.id];
        return newState;
      });
    }
  };

  const handleOpenEditDialog = (project: ProjectWithChildren) => {
    setCurrentEditProject(project);
    setEditDialogOpen(true);
  };

  const handleOpenCreateDialog = () => {
    const newProject: Project = {
      id: "",
      name: "",
      businessUnitId: "",
      businessUnitName: "",
      startQuarter: 1,
      startYear: new Date().getFullYear(),
      durationQuarters: 4,
      minimumDurationQuarters: 1,
      totalCost: 0,
      yearlySustainingCost: 0,
      smCostPercentage: 0,
      grossMarginPercentage: 100,
      riskLevel: RiskFactor.Low,
      status: "active",
      funded: false,
      revenueEstimates: [],
      resourceAllocations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: "project",
    };

    setCurrentEditProject(newProject);
    setCreateDialogOpen(true);
  };

  const handleSaveProject = async (updatedProject: Project) => {
    try {
      const result = await updateProject(updatedProject as any);

      if (result) {
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleCreateProject = async (newProject: Project) => {
    try {
      const projectPayload = {
        ...newProject,
        id: "",
      };

      const result = await createProject(projectPayload as any);

      if (result) {
        setCreateDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const DraggedProjectPreview = ({ project }: { project: ProjectWithChildren }) => {
    return (
      <div className="bg-white p-3 rounded-md shadow-lg border-2 border-blue-500 opacity-95 min-w-[200px] flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-blue-500" />
        {project.name || "Unnamed Project"}
      </div>
    );
  };

  const renderProjects = (projectsToRender: ProjectWithChildren[]) => {
    return projectsToRender.map((project) => (
      <React.Fragment key={project.id}>
        <ProjectRow
          project={project}
          isChild={!!project.parentProjectId}
          isBeingDragged={activeProject?.id === project.id}
          isDraggedOver={dragOverId === project.id}
          isPending={pendingHierarchyChanges[project.id] !== undefined}
          pendingMessage={pendingHierarchyChanges[project.id]}
          hasChildren={!!(project.childProjects && project.childProjects.length > 0)}
          showChildren={activeFilterCount > 0 ? true : showChildProjects[project.id] ?? true}
          onToggleChildren={toggleChildProjects}
          onEditProject={handleOpenEditDialog}
        />

        {project.childProjects && project.childProjects.length > 0 && showChildProjects[project.id] && renderProjects(project.childProjects)}
      </React.Fragment>
    ));
  };

  const totalIrr = useMemo(() => calculateIRRForProjects(projectsList), [projectsList]);

  if (loading) {
    return <LoadingState message="Loading projects data..." showBackdrop={true} />;
  }

  if (error) {
    return (
      <PageLayout
        header={{
          title: "Projects",
          subtitle: "Manage projects and hierarchy",
        }}
      >
        <div className="flex items-center justify-center h-full">
          <ErrorMessage message={error.message || "Failed to load projects"} backHref="/" backLabel="Back to Home" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={{
        title: "Projects",
        subtitle: "Manage projects and hierarchy",
        actions: (
          <Button onClick={handleOpenCreateDialog}>
            Create Project
          </Button>
        ),
      }}
      className="container mx-auto px-4 py-3 h-[calc(100vh-4rem)] overflow-hidden flex flex-col max-w-7xl"
    >
      <div className="flex flex-col min-h-0 flex-1">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-64 flex-shrink-0">
            <SearchBar
              placeholder="Search projects..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              suggestions={searchSuggestions}
              onSuggestionSelect={handleSuggestionSelect}
              showDropdownOnFocus={true}
            />
          </div>

          <FilterPanel
            filters={filters as FilterState}
            onFilterChange={setFilters}
            businessUnits={businessUnits as BusinessUnit[]}
            activeFilterCount={activeFilterCount}
            onClearFilters={handleClearFilters}
          />

          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <div>Total Projects: {projectsList.length}</div>
            <div>Portfolio IRR: {totalIrr?.toFixed(1) || "0.0"}%</div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto border rounded-md">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
          >
            {/* Root Drop Zone - Outside Table for Valid HTML */}
            <DropZone id="root" className="bg-muted/10 border-b border-dashed border-muted-foreground/20 mb-2 text-xs text-muted-foreground text-center py-2">
              Drop here to make project a master project
            </DropZone>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Business Unit</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Maturity</TableHead>
                  <TableHead
                    aria-sort={
                      sortConfig?.key === "riskLevel"
                        ? sortConfig.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className="flex items-center gap-1"
                      aria-label={`Sort by risk level ${
                        sortConfig?.key === "riskLevel"
                          ? sortConfig.direction === "asc"
                            ? "descending"
                            : "ascending"
                          : "ascending"
                      }`}
                      onClick={() =>
                        setSortConfig({
                          key: "riskLevel",
                          direction: sortConfig?.direction === "asc" ? "desc" : "asc",
                        })
                      }
                    >
                      Risk <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length > 0 ? renderProjects(filteredProjects) : (
                  <TableRow>
                    <td colSpan={9} className="text-center py-6 text-muted-foreground">
                      No projects match the current filters
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <DragOverlay>{activeProject && <DraggedProjectPreview project={activeProject} />}</DragOverlay>
          </DndContext>
        </div>
      </div>

      {editDialogOpen && currentEditProject && (
        <ProjectEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={currentEditProject}
          onSave={handleSaveProject}
          businessUnits={businessUnits}
          dialogTitle="Edit Project"
        />
      )}

      {createDialogOpen && currentEditProject && (
        <ProjectEditDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          project={currentEditProject}
          onSave={handleCreateProject}
          businessUnits={businessUnits}
          dialogTitle="Create Project"
        />
      )}
    </PageLayout>
  );
}
