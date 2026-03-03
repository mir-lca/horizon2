"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../api-service";
import { ContainerTypes } from "../cosmos-config";
import { toast } from "sonner";
import type { Project, Resource, Competence, Milestone, Risk } from "../types";
import {
  ProjectApiResponseSchema,
  ResourceApiResponseSchema,
  CompetenceApiResponseSchema,
} from "../schemas";

// Query keys factory for type safety
export const queryKeys = {
  projects: ["projects"] as const,
  resources: ["resources"] as const,
  businessUnits: ["business-units"] as const,
  competences: ["competences"] as const,
  capitalAssets: ["capital-assets"] as const,
  okrs: ["okrs"] as const,
  project: (id: string) => ["projects", id] as const,
  milestones: (projectId: string) => ["milestones", projectId] as const,
  risks: (entityId: string) => ["risks", entityId] as const,
};

// Generic hook for fetching all items with validation
function useItems<T>(
  containerType: ContainerTypes,
  queryKey: readonly string[],
  schema?: any
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const data = await apiService.getAll<T>(containerType);
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
    onSuccess: (data, variables) => {
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
      // Show appropriate toast based on whether it was a create or update
      const isCreate = !variables.id || variables.id === "";
      toast.success(isCreate ? "Project created successfully" : "Project updated successfully");
    },
    onError: (error: any) => {
      // Handle structured validation errors from server
      if (error.response?.data?.validationErrors) {
        const validationErrors = error.response.data.validationErrors;
        validationErrors.forEach((err: { field: string; message: string }) => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        toast.error(`Failed to update project: ${error.message || 'Unknown error'}`);
      }
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
    onError: (error: any) => {
      // Handle structured validation errors from server
      if (error.response?.data?.validationErrors) {
        const validationErrors = error.response.data.validationErrors;
        validationErrors.forEach((err: { field: string; message: string }) => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        toast.error(`Failed to delete project: ${error.message || 'Unknown error'}`);
      }
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

// Milestones
export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: queryKeys.milestones(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/milestones?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch milestones");
      return res.json() as Promise<Milestone[]>;
    },
    enabled: !!projectId,
    staleTime: 10000,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: string; name: string; dueDate?: string; status?: string; description?: string; owner?: string }) => {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create milestone");
      return res.json() as Promise<Milestone>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones(variables.projectId) });
      toast.success("Milestone created");
    },
    onError: (error: Error) => toast.error(`Failed to create milestone: ${error.message}`),
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId, ...data }: { id: string; projectId: string; name?: string; dueDate?: string; status?: string; description?: string; owner?: string }) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update milestone");
      return res.json() as Promise<Milestone>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones(data.projectId) });
      toast.success("Milestone updated");
    },
    onError: (error: Error) => toast.error(`Failed to update milestone: ${error.message}`),
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete milestone");
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones(data.projectId) });
      toast.success("Milestone deleted");
    },
    onError: (error: Error) => toast.error(`Failed to delete milestone: ${error.message}`),
  });
}

// Risks
export function useRisks(entityId: string, entityType = "project") {
  return useQuery({
    queryKey: queryKeys.risks(entityId),
    queryFn: async () => {
      const res = await fetch(`/api/risks?entityId=${entityId}&entityType=${entityType}`);
      if (!res.ok) throw new Error("Failed to fetch risks");
      return res.json() as Promise<Risk[]>;
    },
    enabled: !!entityId,
    staleTime: 10000,
  });
}

export function useCreateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { entityType?: string; entityId: string; title: string; description?: string; probability?: string; impact?: string; status?: string; owner?: string; mitigation?: string }) => {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create risk");
      return res.json() as Promise<Risk>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks(data.entityId) });
      toast.success("Risk created");
    },
    onError: (error: Error) => toast.error(`Failed to create risk: ${error.message}`),
  });
}

export function useUpdateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, entityId, ...data }: { id: string; entityId: string; title?: string; description?: string; probability?: string; impact?: string; status?: string; owner?: string; mitigation?: string }) => {
      const res = await fetch(`/api/risks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update risk");
      return res.json() as Promise<Risk>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks(data.entityId) });
      toast.success("Risk updated");
    },
    onError: (error: Error) => toast.error(`Failed to update risk: ${error.message}`),
  });
}

export function useDeleteRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, entityId }: { id: string; entityId: string }) => {
      const res = await fetch(`/api/risks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete risk");
      return { id, entityId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks(data.entityId) });
      toast.success("Risk deleted");
    },
    onError: (error: Error) => toast.error(`Failed to delete risk: ${error.message}`),
  });
}
