import { useMemo, useCallback } from "react";
import { ProjectWithChildren } from "./useProjectHierarchy";

export interface ProjectFilters {
  status?: string[];
  funding?: string[];
  maturityLessThan100?: boolean;
  businessUnitId?: string;
}

/**
 * Custom hook for filtering projects based on multiple criteria
 *
 * Handles filtering by status, funding, maturity, business unit, and search query.
 * Recursively filters child projects to maintain hierarchy consistency.
 *
 * @param projects - Array of projects (with hierarchy)
 * @param filters - Filter configuration object
 * @param searchQuery - Optional search string
 * @returns Object containing filtered projects and active filter count
 */
export function useProjectFilters(
  projects: ProjectWithChildren[],
  filters: ProjectFilters,
  searchQuery?: string
) {
  // Apply all filters
  const applyFilters = useCallback(
    (projectsToFilter: ProjectWithChildren[]) => {
      let filtered = [...projectsToFilter];

      // Status filter
      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter((project) => filters.status?.includes(project.status));
      }

      // Funding filter
      if (filters.funding && filters.funding.length > 0) {
        filtered = filtered.filter((project) => {
          const isFunded = project.funded ?? (project.status === "funded" || project.status === "active");
          return filters.funding?.includes(isFunded ? "funded" : "unfunded");
        });
      }

      // Maturity filter (< 100%)
      if (filters.maturityLessThan100) {
        filtered = filtered.filter((project) => {
          const completedFields = [
            !!project.riskLevel,
            project.durationQuarters > 0,
            !!project.startYear,
            (project.totalCost || 0) > 0,
            (project.revenueEstimates?.length || 0) > 0,
          ];
          const completed = completedFields.filter(Boolean).length;
          const maturity = Math.round((completed / completedFields.length) * 100);
          return maturity < 100;
        });
      }

      // Business unit filter
      if (filters.businessUnitId) {
        filtered = filtered.filter((project) => project.businessUnitId === filters.businessUnitId);
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (project) =>
            project.name?.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query) ||
            project.businessUnitName?.toLowerCase().includes(query)
        );
      }

      // Recursively filter child projects
      filtered = filtered.map((project) => {
        if (project.childProjects && project.childProjects.length > 0) {
          const filteredChildren = project.childProjects.filter((child) => {
            // Apply status filter to children
            if (filters.status && filters.status.length > 0) {
              return filters.status.includes(child.status);
            }
            return true;
          });
          return {
            ...project,
            childProjects: filteredChildren,
          };
        }
        return project;
      });

      return filtered;
    },
    [filters, searchQuery]
  );

  // Apply filters
  const filteredProjects = useMemo(() => applyFilters(projects), [projects, applyFilters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count += filters.status.length;
    if (filters.funding && filters.funding.length > 0) count += filters.funding.length;
    if (filters.maturityLessThan100) count += 1;
    if (filters.businessUnitId) count += 1;
    if (searchQuery) count += 1;
    return count;
  }, [filters, searchQuery]);

  return {
    filteredProjects,
    activeFilterCount,
    applyFilters,
  };
}
