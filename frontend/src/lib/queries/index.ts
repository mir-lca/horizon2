"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../api-service";
import { ContainerTypes } from "../cosmos-config";
import { toast } from "sonner";
import type {
  Project, Resource, Competence, Milestone, Risk,
  Workstream, KanbanTask, Skill, ResourceSkill, LabourRate,
  SpendRecordFull, CapitalAssetItem, EquipmentLoan,
  GovernanceStage, ApprovalRequest, Notification, CustomCalendar,
  PmGuideline, UserRole, ProjectPermission, HeadcountTarget, AuditLogEntry,
} from "../types";
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
  workstreams: (projectId: string) => ["workstreams", projectId] as const,
  kanbanTasks: (projectId: string) => ["kanban-tasks", projectId] as const,
  skills: ["skills"] as const,
  resourceSkills: (resourceId: string) => ["resource-skills", resourceId] as const,
  labourRates: ["labour-rates"] as const,
  spendRecords: (projectId: string) => ["spend-records", projectId] as const,
  capitalAssetItems: (assetId: string) => ["asset-items", assetId] as const,
  equipmentLoans: (assetId: string) => ["equipment-loans", assetId] as const,
  governanceStages: ["governance-stages"] as const,
  approvalRequests: (entityType: string, entityId: string) => ["approval-requests", entityType, entityId] as const,
  allApprovalRequests: ["approval-requests-all"] as const,
  notifications: (userEmail: string) => ["notifications", userEmail] as const,
  customCalendars: ["custom-calendars"] as const,
  pmGuidelines: ["pm-guidelines"] as const,
  userRoles: ["user-roles"] as const,
  projectPermissions: (projectId: string) => ["project-permissions", projectId] as const,
  auditLog: (entityType: string, entityId: string) => ["audit-log", entityType, entityId] as const,
  headcountTargets: (buId: string, year: number) => ["headcount-targets", buId, year] as const,
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

// ─── Workstreams ───────────────────────────────────────────────────────────────

export function useWorkstreams(projectId: string) {
  return useQuery({
    queryKey: queryKeys.workstreams(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/workstreams?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch workstreams");
      return res.json() as Promise<Workstream[]>;
    },
    enabled: !!projectId,
    staleTime: 10000,
  });
}

export function useUpsertWorkstream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Workstream> & { projectId: string }) => {
      const url = data.id ? `/api/workstreams/${data.id}` : "/api/workstreams";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save workstream");
      return res.json() as Promise<Workstream>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workstreams(data.projectId) });
      toast.success("Workstream saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWorkstream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const res = await fetch(`/api/workstreams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete workstream");
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workstreams(data.projectId) });
      toast.success("Workstream deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Kanban tasks ──────────────────────────────────────────────────────────────

export function useKanbanTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.kanbanTasks(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/kanban-tasks?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch kanban tasks");
      return res.json() as Promise<KanbanTask[]>;
    },
    enabled: !!projectId,
    staleTime: 10000,
  });
}

export function useUpsertKanbanTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<KanbanTask> & { projectId: string }) => {
      const url = data.id ? `/api/kanban-tasks/${data.id}` : "/api/kanban-tasks";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save task");
      return res.json() as Promise<KanbanTask>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kanbanTasks(data.projectId) });
      toast.success("Task saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteKanbanTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const res = await fetch(`/api/kanban-tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kanbanTasks(data.projectId) });
      toast.success("Task deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Skills ────────────────────────────────────────────────────────────────────

export function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: async () => {
      const res = await fetch("/api/skills");
      if (!res.ok) throw new Error("Failed to fetch skills");
      return res.json() as Promise<Skill[]>;
    },
    staleTime: 60000,
  });
}

export function useUpsertSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Skill>) => {
      const url = data.id ? `/api/skills/${data.id}` : "/api/skills";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save skill");
      return res.json() as Promise<Skill>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
      toast.success("Skill saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete skill");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
      toast.success("Skill deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Resource skills ───────────────────────────────────────────────────────────

export function useResourceSkills(resourceId: string) {
  return useQuery({
    queryKey: queryKeys.resourceSkills(resourceId),
    queryFn: async () => {
      const res = await fetch(`/api/resource-skills?resourceId=${resourceId}`);
      if (!res.ok) throw new Error("Failed to fetch resource skills");
      return res.json() as Promise<ResourceSkill[]>;
    },
    enabled: !!resourceId,
    staleTime: 10000,
  });
}

export function useAddResourceSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ResourceSkill, "id" | "skillName" | "skillCategory">) => {
      const res = await fetch("/api/resource-skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to add skill");
      return res.json() as Promise<ResourceSkill>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resourceSkills(data.resourceId) });
      toast.success("Skill added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteResourceSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resourceId }: { id: string; resourceId: string }) => {
      const res = await fetch(`/api/resource-skills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete skill");
      return { id, resourceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resourceSkills(data.resourceId) });
      toast.success("Skill removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Labour rates ──────────────────────────────────────────────────────────────

export function useLabourRates() {
  return useQuery({
    queryKey: queryKeys.labourRates,
    queryFn: async () => {
      const res = await fetch("/api/labour-rates");
      if (!res.ok) throw new Error("Failed to fetch labour rates");
      return res.json() as Promise<LabourRate[]>;
    },
    staleTime: 60000,
  });
}

export function useUpsertLabourRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LabourRate>) => {
      const url = data.id ? `/api/labour-rates/${data.id}` : "/api/labour-rates";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save rate");
      return res.json() as Promise<LabourRate>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labourRates });
      toast.success("Rate saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLabourRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/labour-rates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rate");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labourRates });
      toast.success("Rate deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Spend records ─────────────────────────────────────────────────────────────

export function useSpendRecords(projectId: string) {
  return useQuery({
    queryKey: queryKeys.spendRecords(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/spend-records?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch spend records");
      return res.json() as Promise<SpendRecordFull[]>;
    },
    enabled: !!projectId,
    staleTime: 10000,
  });
}

export function useUpsertSpendRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SpendRecordFull> & { projectId: string }) => {
      const url = data.id ? `/api/spend-records/${data.id}` : "/api/spend-records";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save spend record");
      return res.json() as Promise<SpendRecordFull>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spendRecords(data.projectId) });
      toast.success("Spend record saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSpendRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const res = await fetch(`/api/spend-records/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete spend record");
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spendRecords(data.projectId) });
      toast.success("Spend record deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Capital asset items ────────────────────────────────────────────────────────

export function useCapitalAssetItems(assetId: string) {
  return useQuery({
    queryKey: queryKeys.capitalAssetItems(assetId),
    queryFn: async () => {
      const res = await fetch(`/api/capital-asset-items?assetId=${assetId}`);
      if (!res.ok) throw new Error("Failed to fetch asset items");
      return res.json() as Promise<CapitalAssetItem[]>;
    },
    enabled: !!assetId,
    staleTime: 10000,
  });
}

export function useUpsertAssetItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CapitalAssetItem> & { assetId: string }) => {
      const url = data.id ? `/api/capital-asset-items/${data.id}` : "/api/capital-asset-items";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save item");
      return res.json() as Promise<CapitalAssetItem>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.capitalAssetItems(data.assetId) });
      toast.success("Asset item saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAssetItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assetId }: { id: string; assetId: string }) => {
      const res = await fetch(`/api/capital-asset-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      return { id, assetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.capitalAssetItems(data.assetId) });
      toast.success("Asset item deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Equipment loans ───────────────────────────────────────────────────────────

export function useEquipmentLoans(assetId: string) {
  return useQuery({
    queryKey: queryKeys.equipmentLoans(assetId),
    queryFn: async () => {
      const res = await fetch(`/api/equipment-loans?assetId=${assetId}`);
      if (!res.ok) throw new Error("Failed to fetch equipment loans");
      return res.json() as Promise<EquipmentLoan[]>;
    },
    enabled: !!assetId,
    staleTime: 10000,
  });
}

export function useUpsertEquipmentLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<EquipmentLoan> & { assetId: string }) => {
      const url = data.id ? `/api/equipment-loans/${data.id}` : "/api/equipment-loans";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save loan");
      return res.json() as Promise<EquipmentLoan>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentLoans(data.assetId) });
      toast.success("Loan record saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEquipmentLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assetId }: { id: string; assetId: string }) => {
      const res = await fetch(`/api/equipment-loans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete loan");
      return { id, assetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentLoans(data.assetId) });
      toast.success("Loan record deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Governance stages ─────────────────────────────────────────────────────────

export function useGovernanceStages() {
  return useQuery({
    queryKey: queryKeys.governanceStages,
    queryFn: async () => {
      const res = await fetch("/api/governance-stages");
      if (!res.ok) throw new Error("Failed to fetch governance stages");
      return res.json() as Promise<GovernanceStage[]>;
    },
    staleTime: 60000,
  });
}

export function useUpsertGovernanceStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<GovernanceStage>) => {
      const url = data.id ? `/api/governance-stages/${data.id}` : "/api/governance-stages";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save stage");
      return res.json() as Promise<GovernanceStage>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.governanceStages });
      toast.success("Stage saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGovernanceStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/governance-stages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete stage");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.governanceStages });
      toast.success("Stage deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Approval requests ─────────────────────────────────────────────────────────

export function useApprovalRequests(entityType?: string, entityId?: string) {
  return useQuery({
    queryKey: entityType && entityId ? queryKeys.approvalRequests(entityType, entityId) : queryKeys.allApprovalRequests,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entityType) params.set("entityType", entityType);
      if (entityId) params.set("entityId", entityId);
      const res = await fetch(`/api/approval-requests?${params}`);
      if (!res.ok) throw new Error("Failed to fetch approval requests");
      return res.json() as Promise<ApprovalRequest[]>;
    },
    staleTime: 10000,
  });
}

export function useCreateApprovalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ApprovalRequest, "id" | "requestedAt" | "decidedAt">) => {
      const res = await fetch("/api/approval-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create request");
      return res.json() as Promise<ApprovalRequest>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRequests(data.entityType, data.entityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allApprovalRequests });
      toast.success("Approval request submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decisionNotes }: { id: string; decisionNotes?: string }) => {
      const res = await fetch(`/api/approval-requests/${id}/approve`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decisionNotes }) });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json() as Promise<ApprovalRequest>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRequests(data.entityType, data.entityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allApprovalRequests });
      toast.success("Request approved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decisionNotes }: { id: string; decisionNotes?: string }) => {
      const res = await fetch(`/api/approval-requests/${id}/reject`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decisionNotes }) });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json() as Promise<ApprovalRequest>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRequests(data.entityType, data.entityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allApprovalRequests });
      toast.success("Request rejected");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export function useNotifications(userEmail: string) {
  return useQuery({
    queryKey: queryKeys.notifications(userEmail),
    queryFn: async () => {
      const res = await fetch(`/api/notifications?userEmail=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json() as Promise<Notification[]>;
    },
    enabled: !!userEmail,
    staleTime: 15000,
    refetchInterval: 60000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userEmail }: { id: string; userEmail: string }) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark read");
      return { id, userEmail };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(data.userEmail) });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userEmail: string) => {
      const res = await fetch(`/api/notifications/read-all`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userEmail }) });
      if (!res.ok) throw new Error("Failed to mark all read");
      return userEmail;
    },
    onSuccess: (userEmail) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userEmail) });
      toast.success("All notifications marked as read");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── User roles ────────────────────────────────────────────────────────────────

export function useUserRoles() {
  return useQuery({
    queryKey: queryKeys.userRoles,
    queryFn: async () => {
      const res = await fetch("/api/user-roles");
      if (!res.ok) throw new Error("Failed to fetch user roles");
      return res.json() as Promise<UserRole[]>;
    },
    staleTime: 60000,
  });
}

export function useUpsertUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<UserRole>) => {
      const url = data.id ? `/api/user-roles/${data.id}` : "/api/user-roles";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save user role");
      return res.json() as Promise<UserRole>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userRoles });
      toast.success("User role saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user-roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user role");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userRoles });
      toast.success("User role deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Project permissions ───────────────────────────────────────────────────────

export function useProjectPermissions(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectPermissions(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/project-permissions?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json() as Promise<ProjectPermission[]>;
    },
    enabled: !!projectId,
    staleTime: 30000,
  });
}

export function useUpsertProjectPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ProjectPermission, "id">) => {
      const res = await fetch("/api/project-permissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save permission");
      return res.json() as Promise<ProjectPermission>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectPermissions(data.projectId) });
      toast.success("Permission saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProjectPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const res = await fetch(`/api/project-permissions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete permission");
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectPermissions(data.projectId) });
      toast.success("Permission removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Audit log ─────────────────────────────────────────────────────────────────

export function useAuditLog(entityType: string, entityId: string) {
  return useQuery({
    queryKey: queryKeys.auditLog(entityType, entityId),
    queryFn: async () => {
      const res = await fetch(`/api/audit-log?entityType=${entityType}&entityId=${entityId}`);
      if (!res.ok) throw new Error("Failed to fetch audit log");
      return res.json() as Promise<AuditLogEntry[]>;
    },
    enabled: !!entityType && !!entityId,
    staleTime: 30000,
  });
}

// ─── Headcount targets ─────────────────────────────────────────────────────────

export function useHeadcountTargets(buId: string, year: number) {
  return useQuery({
    queryKey: queryKeys.headcountTargets(buId, year),
    queryFn: async () => {
      const res = await fetch(`/api/headcount-targets?businessUnitId=${buId}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch headcount targets");
      return res.json() as Promise<HeadcountTarget[]>;
    },
    enabled: !!buId && !!year,
    staleTime: 30000,
  });
}

export function useUpsertHeadcountTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<HeadcountTarget>) => {
      const url = data.id ? `/api/headcount-targets/${data.id}` : "/api/headcount-targets";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save target");
      return res.json() as Promise<HeadcountTarget>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.headcountTargets(data.businessUnitId, data.effectiveYear) });
      toast.success("Headcount target saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteHeadcountTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessUnitId, effectiveYear }: { id: string; businessUnitId: string; effectiveYear: number }) => {
      const res = await fetch(`/api/headcount-targets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete target");
      return { id, businessUnitId, effectiveYear };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.headcountTargets(data.businessUnitId, data.effectiveYear) });
      toast.success("Target deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Custom calendars ──────────────────────────────────────────────────────────

export function useCustomCalendars() {
  return useQuery({
    queryKey: queryKeys.customCalendars,
    queryFn: async () => {
      const res = await fetch("/api/custom-calendars");
      if (!res.ok) throw new Error("Failed to fetch calendars");
      return res.json() as Promise<CustomCalendar[]>;
    },
    staleTime: 60000,
  });
}

export function useUpsertCustomCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CustomCalendar>) => {
      const url = data.id ? `/api/custom-calendars/${data.id}` : "/api/custom-calendars";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save calendar");
      return res.json() as Promise<CustomCalendar>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customCalendars });
      toast.success("Calendar saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCustomCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/custom-calendars/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete calendar");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customCalendars });
      toast.success("Calendar deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── PM guidelines ─────────────────────────────────────────────────────────────

export function usePmGuidelines() {
  return useQuery({
    queryKey: queryKeys.pmGuidelines,
    queryFn: async () => {
      const res = await fetch("/api/pm-guidelines");
      if (!res.ok) throw new Error("Failed to fetch guidelines");
      return res.json() as Promise<PmGuideline[]>;
    },
    staleTime: 60000,
  });
}

export function useUpsertPmGuideline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PmGuideline>) => {
      const url = data.id ? `/api/pm-guidelines/${data.id}` : "/api/pm-guidelines";
      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save guideline");
      return res.json() as Promise<PmGuideline>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pmGuidelines });
      toast.success("Guideline saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePmGuideline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pm-guidelines/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete guideline");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pmGuidelines });
      toast.success("Guideline deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
