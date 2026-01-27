import { useMemo } from "react";
import { Project } from "@/lib/types";

export interface ProjectWithChildren extends Project {
  childProjects?: ProjectWithChildren[];
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

/**
 * Custom hook for organizing projects into parent-child hierarchy
 *
 * Takes a flat list of projects and organizes them into a tree structure
 * based on parentProjectId relationships. Handles sorting at both parent
 * and child levels.
 *
 * @param projects - Flat array of projects
 * @param sortConfig - Optional sort configuration
 * @returns Organized array of top-level projects with nested children
 */
export function useProjectHierarchy(
  projects: Project[],
  sortConfig?: SortConfig | null
): ProjectWithChildren[] {
  return useMemo((): ProjectWithChildren[] => {
    // Create a map for quick lookup
    const projectMap = new Map<string, ProjectWithChildren>();

    projects.forEach((project) => {
      projectMap.set(project.id, { ...project, childProjects: [] });
    });

    const topLevelProjects: ProjectWithChildren[] = [];

    // Build hierarchy
    projects.forEach((project) => {
      const projectWithChildren = projectMap.get(project.id);
      if (!projectWithChildren) return;

      if (project.parentProjectId) {
        const masterId = project.parentProjectId;
        const masterProject = projectMap.get(masterId);

        if (masterProject) {
          // Parent exists - add as child
          if (!masterProject.childProjects) {
            masterProject.childProjects = [];
          }
          masterProject.childProjects.push(projectWithChildren);
        } else {
          // Orphaned child - clean parent reference and add to top level
          const cleanedProject = {
            ...projectWithChildren,
            parentProjectId: undefined,
          };
          topLevelProjects.push(cleanedProject);
        }
      } else {
        // Top-level project
        topLevelProjects.push(projectWithChildren);
      }
    });

    // Sort function
    const sortProjects = (projectsToSort: ProjectWithChildren[]): ProjectWithChildren[] => {
      if (!sortConfig) return projectsToSort;

      const { key, direction } = sortConfig;

      const sorted = [...projectsToSort].sort((a, b) => {
        if (key === "name") return (a.name || "").localeCompare(b.name || "");
        if (key === "status") return (a.status || "").localeCompare(b.status || "");
        if (key === "startYear") return (a.startYear || 0) - (b.startYear || 0);
        if (key === "totalCost") return (a.totalCost || 0) - (b.totalCost || 0);
        if (key === "riskLevel") {
          const riskOrder = { low: 1, medium: 2, high: 3 };
          const aRisk = riskOrder[a.riskLevel as keyof typeof riskOrder] || 0;
          const bRisk = riskOrder[b.riskLevel as keyof typeof riskOrder] || 0;
          return aRisk - bRisk;
        }
        return 0;
      });

      return direction === "desc" ? sorted.reverse() : sorted;
    };

    // Sort children recursively
    topLevelProjects.forEach((project) => {
      if (project.childProjects) {
        project.childProjects = sortProjects(project.childProjects);
      }
    });

    return sortProjects(topLevelProjects);
  }, [projects, sortConfig]);
}
