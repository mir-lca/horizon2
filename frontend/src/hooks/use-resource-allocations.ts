import { useMemo } from "react";
import { Project, Resource, ResourceAllocation, Competence } from "@/lib/types";
import { calculateQuarterDate } from "@/lib/financial-calculations";
import { ProjectUtils } from "@/lib/project-utils";

interface ExtendedResourceAllocation extends ResourceAllocation {
  competenceId?: string;
  competenceName?: string;
  relativeQuarter?: number;
  calendarQuarter?: number;
  calendarYear?: number;
  quantity?: number;
  updatedAt?: string;
}

interface UseResourceAllocationsOptions {
  projects: Project[];
  resources: Resource[];
  competences: Competence[];
  visibleProjectsOnly?: boolean;
  includeExtendedFields?: boolean;
  hidePastQuarters?: boolean;
}

export function useResourceAllocations({
  projects,
  resources,
  competences,
  visibleProjectsOnly = false,
  includeExtendedFields = false,
  hidePastQuarters = false,
}: UseResourceAllocationsOptions) {
  return useMemo(() => {
    const derivedAllocations: ResourceAllocation[] = [];
    const currentDate = new Date();
    const currentQuarterNum = currentDate.getFullYear() * 4 + Math.floor(currentDate.getMonth() / 3);

    const projectsToProcess = visibleProjectsOnly ? ProjectUtils.filterVisible(projects) : projects;

    projectsToProcess.forEach((project) => {
      if (!project.resourceAllocations) return;

      project.resourceAllocations.forEach((allocation) => {
        const relativeQuarter = "relativeQuarter" in allocation ? allocation.relativeQuarter : 1;
        const competenceId = "competenceId" in allocation ? allocation.competenceId : undefined;
        const allocationPercentage = allocation.allocationPercentage || 0;

        if (allocationPercentage <= 0) {
          return;
        }

        const projectStartQuarterNum = project.startYear * 4 + (project.startQuarter - 1);
        const allocationQuarterNum = projectStartQuarterNum + (relativeQuarter - 1);

        if (hidePastQuarters && allocationQuarterNum < currentQuarterNum) {
          return;
        }

        const resource = resources.find((item) => item.id === allocation.resourceId);

        if (!resource && !allocation.resourceId.startsWith("virtual-")) {
          return;
        }

        const resourceCompetenceId = competenceId || resource?.competenceId;
        const competence = competences.find((item) => item.id === resourceCompetenceId);
        if (!competence && !allocation.resourceId.startsWith("virtual-")) {
          return;
        }

        const quarterData = calculateQuarterDate(project.startYear, project.startQuarter, relativeQuarter);

        const baseAllocation: ResourceAllocation = {
          id: `${project.id}-${allocation.resourceId}-${relativeQuarter}`,
          type: "resource-allocation",
          resourceId: allocation.resourceId,
          projectId: project.id,
          allocationPercentage: allocation.allocationPercentage,
          startDate: quarterData.startDate,
          endDate: quarterData.endDate,
          role: allocation.role || "Required",
        };

        if (includeExtendedFields) {
          const calendarYear = Math.floor(allocationQuarterNum / 4);
          const calendarQuarter = (allocationQuarterNum % 4) + 1;

          const extendedAllocation = {
            ...baseAllocation,
            competenceId: resourceCompetenceId,
            competenceName: resource?.competenceName || competence?.name || "",
            relativeQuarter,
            calendarQuarter,
            calendarYear,
          } as ExtendedResourceAllocation;

          derivedAllocations.push(extendedAllocation);
        } else {
          derivedAllocations.push(baseAllocation);
        }
      });
    });

    return derivedAllocations;
  }, [projects, resources, competences, visibleProjectsOnly, includeExtendedFields, hidePastQuarters]);
}
