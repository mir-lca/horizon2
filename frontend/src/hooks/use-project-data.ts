/**
 * Custom hook for project-related data fetching patterns
 */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProjects,
  useResources,
  useCompetences,
  useUpsertProject,
  useDeleteProject,
  queryKeys,
} from "@/lib/queries";
import { useBusinessUnits } from "@/contexts/org-data-context";
import { Project, Resource, OrgDataBusinessUnit, Competence } from "@/lib/types";
import { ProjectUtils } from "@/lib/project-utils";

export function useProjectData() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects();
  const { data: resources = [], isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { data: businessUnits = [], isLoading: businessUnitsLoading, error: businessUnitsError } = useBusinessUnits();
  const { data: competences = [], isLoading: competencesLoading, error: competencesError } = useCompetences();

  const upsertProjectMutation = useUpsertProject();
  const deleteProjectMutation = useDeleteProject();

  // Don't block on business units loading since they're fetched from org data
  const loading = projectsLoading || resourcesLoading || competencesLoading;
  const error = projectsError || resourcesError || competencesError;

  const lookupMaps = useMemo(() => {
    const businessUnitsMap = new Map(businessUnits.map((bu: OrgDataBusinessUnit) => [bu.id, bu]));
    const resourcesMap = new Map(resources.map((r: Resource) => [r.id, r]));
    const competencesMap = new Map(competences.map((c: Competence) => [c.id, c]));

    return {
      businessUnits: businessUnitsMap,
      resources: resourcesMap,
      competences: competencesMap,
    };
  }, [businessUnits, resources, competences]);

  const projectCollection = useMemo(() => {
    return ProjectUtils.from(projects);
  }, [projects]);

  const statistics = useMemo(() => {
    return ProjectUtils.getStatistics(projects);
  }, [projects]);

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    queryClient.invalidateQueries({ queryKey: queryKeys.resources });
    queryClient.invalidateQueries({ queryKey: ['org-data', 'business-units'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.competences });
  };

  const refetchProjects = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  };

  const refetchResources = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.resources });
  };

  const refetchBusinessUnits = () => {
    queryClient.invalidateQueries({ queryKey: ['org-data', 'business-units'] });
  };

  const refetchCompetences = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.competences });
  };

  const createProject = async (project: Project) => {
    return await upsertProjectMutation.mutateAsync(project);
  };

  const updateProject = async (project: Project) => {
    return await upsertProjectMutation.mutateAsync(project);
  };

  const deleteProject = async (id: string) => {
    await deleteProjectMutation.mutateAsync(id);
    return true;
  };

  return {
    projects,
    resources,
    businessUnits,
    competences,
    projectCollection,
    lookupMaps,
    statistics,
    loading,
    error,
    refetchAll,
    refetchProjects,
    refetchResources,
    refetchBusinessUnits,
    refetchCompetences,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProjectById(projectId: string) {
  const {
    projects,
    resources,
    businessUnits,
    competences,
    lookupMaps,
    loading,
    error,
    updateProject,
    deleteProject,
  } = useProjectData();

  const projectData = useMemo(() => {
    if (!projects || projects.length === 0) return null;

    const project = projects.find((p: Project) => p.id === projectId);

    if (!project) {
      return null;
    }

    const businessUnit = lookupMaps.businessUnits.get(project.businessUnitId);
    const projectResources = resources.filter((resource: Resource) =>
      project.resourceAllocations?.some((allocation: any) => allocation.resourceId === resource.id)
    );

    const projectCompetenceIds = new Set(projectResources.map((r: Resource) => r.competenceId));
    const projectCompetences = competences.filter((c: Competence) => projectCompetenceIds.has(c.id));

    return {
      project,
      businessUnit,
      allocatedResources: projectResources,
      resources: projectResources,
      competences: projectCompetences,
    };
  }, [projectId, projects, resources, competences, lookupMaps]);

  return {
    data: projectData,
    allResources: resources,
    allCompetences: competences,
    allBusinessUnits: businessUnits,
    loading,
    error,
    exists: projectData !== null,
    updateProject,
    deleteProject,
  };
}
