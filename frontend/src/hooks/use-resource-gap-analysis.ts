"use client";

import { useMemo } from "react";
import { Project, Resource, BusinessUnit, Competence } from "@/lib/types";
import { useResourceAllocations } from "./use-resource-allocations";
import { ProjectUtils } from "@/lib/project-utils";

interface UseResourceGapAnalysisOptions {
  resources: Resource[];
  projects: Project[];
  businessUnits: BusinessUnit[];
  competences: Competence[];
  dateRange: {
    startYear: number;
    startQuarter: number;
    endYear: number;
    endQuarter: number;
  };
  selectedBusinessUnit: string;
  showAIOnly?: boolean;
  isAdvancedMode?: boolean;
  isBasicModeExpanded?: boolean;
  hidePastQuarters?: boolean;
  visibleProjectsOnly?: boolean;
  customProjectVisibility?: Record<string, boolean>;
}

export function useResourceGapAnalysis({
  resources,
  projects,
  businessUnits,
  competences,
  dateRange,
  selectedBusinessUnit,
  showAIOnly = false,
  isAdvancedMode = false,
  isBasicModeExpanded = true,
  hidePastQuarters = false,
  visibleProjectsOnly = false,
  customProjectVisibility,
}: UseResourceGapAnalysisOptions) {
  const filteredResources = useMemo(() => {
    let filtered = resources;
    if (selectedBusinessUnit !== "all" && selectedBusinessUnit !== "consolidated") {
      filtered = filtered.filter((resource) => resource.businessUnitId === selectedBusinessUnit);
    }
    if (showAIOnly) {
      filtered = filtered.filter((resource) => resource.isAI);
    }
    return filtered;
  }, [resources, selectedBusinessUnit, showAIOnly]);

  const filteredProjects = useMemo(() => {
    if (selectedBusinessUnit === "all" || selectedBusinessUnit === "consolidated") {
      return projects;
    }
    return ProjectUtils.filterByBusinessUnit(projects, selectedBusinessUnit);
  }, [projects, selectedBusinessUnit]);

  const resourceAllocations = useResourceAllocations({
    projects: filteredProjects,
    resources,
    competences,
    visibleProjectsOnly,
    includeExtendedFields: true,
    hidePastQuarters,
  });

  const projectVisibility = useMemo(() => {
    if (customProjectVisibility) {
      return customProjectVisibility;
    }
    return filteredProjects.reduce((map, project) => {
      map[project.id] = project.visible !== false;
      return map;
    }, {} as Record<string, boolean>);
  }, [filteredProjects, customProjectVisibility]);

  return {
    gapAnalysisProps: {
      resources: filteredResources,
      resourceAllocations,
      businessUnits,
      projects: filteredProjects,
      dateRange,
      selectedBusinessUnit: selectedBusinessUnit === "all" ? "consolidated" : selectedBusinessUnit,
      projectVisibility,
      isAdvancedMode,
      isBasicModeExpanded,
      hidePastQuarters,
    },
    filteredResources,
    filteredProjects,
    resourceAllocations,
  };
}
