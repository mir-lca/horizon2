"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../api-service";
import { ContainerTypes } from "../cosmos-config";
import { toast } from "sonner";
import type { Project, Resource, BusinessUnit, Competence } from "../types";
import {
  ProjectApiResponseSchema,
  ResourceApiResponseSchema,
  BusinessUnitApiResponseSchema,
  CompetenceApiResponseSchema,
} from "../schemas";

// Query keys factory for type safety
export const queryKeys = {
  projects: ["projects"] as const,
  resources: ["resources"] as const,
  businessUnits: ["business-units"] as const,
  competences: ["competences"] as const,
  project: (id: string) => ["projects", id] as const,
};

// Generic hook for fetching all items with validation
function useItems<T>(
  containerType: ContainerTypes,
  queryKey: readonly string[],
  schema?: any
) {
  console.log(`[useItems] Hook called for ${containerType}`);
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`[useItems] Query function executing for ${containerType} - fetching data`);
      const data = await apiService.getAll<T>(containerType);
      console.log(`[useItems] Data received for ${containerType}, validating...`);
      if (schema) {
        try {
          return schema.parse(data);
        } catch (error) {
          console.error(`Validation error for ${containerType}:`, error);
          throw new Error(`Data validation failed for ${containerType}`);
        }
      }
      return data;
    },
  });
}

// Generic hook for fetching single item
function useItem<T>(
  containerType: ContainerTypes,
  queryKey: readonly string[],
  id: string
) {
  return useQuery({
    queryKey,
    queryFn: () => apiService.getById<T>(containerType, id),
    enabled: !!id,
  });
}

// Projects
export function useProjects() {
  return useItems<Project>(
    ContainerTypes.PROJECTS,
    queryKeys.projects,
    ProjectApiResponseSchema
  );
}

export function useProject(id: string) {
  return useItem<Project>(ContainerTypes.PROJECTS, queryKeys.project(id), id);
}

// Resources
export function useResources() {
  return useItems<Resource>(
    ContainerTypes.RESOURCES,
    queryKeys.resources,
    ResourceApiResponseSchema
  );
}

// Business Units
export function useBusinessUnits() {
  return useItems<BusinessUnit>(
    ContainerTypes.BUSINESS_UNITS,
    queryKeys.businessUnits,
    BusinessUnitApiResponseSchema
  );
}

// Competences
export function useCompetences() {
  return useItems<Competence>(
    ContainerTypes.COMPETENCES,
    queryKeys.competences,
    CompetenceApiResponseSchema
  );
}

// Mutations
export function useUpsertProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project: Project) =>
      apiService.upsert<Project>(ContainerTypes.PROJECTS, project),
    onSuccess: (data) => {
      // Optimistic update
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old = []) => {
        const index = old.findIndex((p) => p.id === data.id);
        if (index >= 0) {
          const updated = [...old];
          updated[index] = data;
          return updated;
        }
        return [...old, data];
      });
      toast.success("Project updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update project: ${error.message}`);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.delete(ContainerTypes.PROJECTS, id),
    onSuccess: (_, id) => {
      // Optimistic update
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old = []) =>
        old.filter((p) => p.id !== id)
      );
      toast.success("Project deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });
}

export function useUpsertResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resource: Resource) =>
      apiService.upsert<Resource>(ContainerTypes.RESOURCES, resource),
    onSuccess: (data) => {
      queryClient.setQueryData<Resource[]>(queryKeys.resources, (old = []) => {
        const index = old.findIndex((r) => r.id === data.id);
        if (index >= 0) {
          const updated = [...old];
          updated[index] = data;
          return updated;
        }
        return [...old, data];
      });
      toast.success("Resource updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update resource: ${error.message}`);
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.delete(ContainerTypes.RESOURCES, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Resource[]>(queryKeys.resources, (old = []) =>
        old.filter((r) => r.id !== id)
      );
      toast.success("Resource deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete resource: ${error.message}`);
    },
  });
}

export function useUpsertBusinessUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (businessUnit: BusinessUnit) =>
      apiService.upsert<BusinessUnit>(ContainerTypes.BUSINESS_UNITS, businessUnit),
    onSuccess: (data) => {
      queryClient.setQueryData<BusinessUnit[]>(queryKeys.businessUnits, (old = []) => {
        const index = old.findIndex((bu) => bu.id === data.id);
        if (index >= 0) {
          const updated = [...old];
          updated[index] = data;
          return updated;
        }
        return [...old, data];
      });
      toast.success("Business unit updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update business unit: ${error.message}`);
    },
  });
}

export function useDeleteBusinessUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiService.delete(ContainerTypes.BUSINESS_UNITS, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<BusinessUnit[]>(
        queryKeys.businessUnits,
        (old = []) => old.filter((bu) => bu.id !== id)
      );
      toast.success("Business unit deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete business unit: ${error.message}`);
    },
  });
}

export function useUpsertCompetence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (competence: Competence) =>
      apiService.upsert<Competence>(ContainerTypes.COMPETENCES, competence),
    onSuccess: (data) => {
      queryClient.setQueryData<Competence[]>(queryKeys.competences, (old = []) => {
        const index = old.findIndex((c) => c.id === data.id);
        if (index >= 0) {
          const updated = [...old];
          updated[index] = data;
          return updated;
        }
        return [...old, data];
      });
      toast.success("Competence updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update competence: ${error.message}`);
    },
  });
}

export function useDeleteCompetence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiService.delete(ContainerTypes.COMPETENCES, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Competence[]>(
        queryKeys.competences,
        (old = []) => old.filter((c) => c.id !== id)
      );
      toast.success("Competence deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete competence: ${error.message}`);
    },
  });
}
