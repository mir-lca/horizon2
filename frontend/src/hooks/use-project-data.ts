/**
 * Custom hook for project-related data fetching patterns
 */

import { useMemo } from "react";
import { useCachedCosmosData } from "@/lib/use-cosmos-cache";
import { ContainerTypes } from "@/lib/cosmos-config";
import { Project, Resource, BusinessUnit, Competence } from "@/lib/types";
import { ProjectUtils } from "@/lib/project-utils";
import { useDatabaseRefresh } from "./use-database-refresh";

export function useProjectData() {
  const {
    data: projects = [],
    loading: projectsLoading,
    error: projectsError,
    refreshData: refetchProjects,
    updateItem: upsertProject,
    deleteItem: removeProject,
  } = useCachedCosmosData<Project>(ContainerTypes.PROJECTS);

  const {
    data: resources = [],
    loading: resourcesLoading,
    error: resourcesError,
    refreshData: refetchResources,
  } = useCachedCosmosData<Resource>(ContainerTypes.RESOURCES);

  const {
    data: businessUnits = [],
    loading: businessUnitsLoading,
    error: businessUnitsError,
    refreshData: refetchBusinessUnits,
  } = useCachedCosmosData<BusinessUnit>(ContainerTypes.BUSINESS_UNITS);

  const {
    data: competences = [],
    loading: competencesLoading,
    error: competencesError,
    refreshData: refetchCompetences,
  } = useCachedCosmosData<Competence>(ContainerTypes.COMPETENCES);

  const loading = projectsLoading || resourcesLoading || businessUnitsLoading || competencesLoading;
  const error = projectsError || resourcesError || businessUnitsError || competencesError;

  const lookupMaps = useMemo(() => {
    const businessUnitsMap = new Map(businessUnits.map((bu) => [bu.id, bu]));
    const resourcesMap = new Map(resources.map((r) => [r.id, r]));
    const competencesMap = new Map(competences.map((c) => [c.id, c]));

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
    refetchProjects();
    refetchResources();
    refetchBusinessUnits();
    refetchCompetences();
  };

  const createProject = async (project: Project) => {
    return await upsertProject(project);
  };

  const updateProject = async (project: Project) => {
    return await upsertProject(project);
  };

  const deleteProject = async (id: string) => {
    return await removeProject(id);
  };

  useDatabaseRefresh(refetchAll);

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

    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      return null;
    }

    const businessUnit = lookupMaps.businessUnits.get(project.businessUnitId);
    const projectResources = resources.filter((resource) =>
      project.resourceAllocations?.some((allocation) => allocation.resourceId === resource.id)
    );

    const projectCompetenceIds = new Set(projectResources.map((r) => r.competenceId));
    const projectCompetences = competences.filter((c) => projectCompetenceIds.has(c.id));

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
