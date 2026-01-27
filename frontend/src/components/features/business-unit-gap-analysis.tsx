"use client";

import React, { useMemo } from "react";
import { Resource, ResourceAllocation, BusinessUnit, Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface BusinessUnitGapAnalysisProps {
  resources: Resource[];
  resourceAllocations: ResourceAllocation[];
  businessUnits: BusinessUnit[];
  projects: Project[];
  dateRange: {
    startYear: number;
    startQuarter: number;
    endYear: number;
    endQuarter: number;
  };
  selectedBusinessUnit: string;
  projectVisibility: Record<string, boolean>;
  isAdvancedMode: boolean;
  isBasicModeExpanded?: boolean;
  hidePastQuarters?: boolean;
  useInternalScrolling?: boolean;
  onProjectClick?: (projectId: string) => void;
}

type Quarter = { year: number; quarter: number; label: string };

function buildQuarters(dateRange: BusinessUnitGapAnalysisProps["dateRange"]): Quarter[] {
  const result: Quarter[] = [];
  let currentYear = dateRange.startYear;
  let currentQuarter = dateRange.startQuarter;
  while (
    currentYear < dateRange.endYear ||
    (currentYear === dateRange.endYear && currentQuarter <= dateRange.endQuarter)
  ) {
    result.push({ year: currentYear, quarter: currentQuarter, label: `Q${currentQuarter} ${currentYear}` });
    currentQuarter += 1;
    if (currentQuarter > 4) {
      currentQuarter = 1;
      currentYear += 1;
    }
  }
  return result;
}

export function BusinessUnitGapAnalysis({
  resources,
  resourceAllocations,
  dateRange,
  selectedBusinessUnit,
  projectVisibility,
}: BusinessUnitGapAnalysisProps) {
  const quarters = useMemo(() => buildQuarters(dateRange), [dateRange]);

  const competences = useMemo(() => {
    const map = new Map<string, string>();
    resources.forEach((resource) => {
      map.set(resource.competenceId, resource.competenceName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [resources]);

  const resourceCapacity = useMemo(() => {
    const capacity: Record<string, number> = {};
    resources.forEach((resource) => {
      capacity[resource.competenceId] = (capacity[resource.competenceId] || 0) + (resource.quantity || 0);
    });
    return capacity;
  }, [resources]);

  const allocationsByCompetenceQuarter = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    resourceAllocations.forEach((allocation: any) => {
      if (selectedBusinessUnit !== "consolidated") {
        const resource = resources.find((item) => item.id === allocation.resourceId);
        if (resource && resource.businessUnitId !== selectedBusinessUnit) {
          return;
        }
      }
      if (projectVisibility && allocation.projectId && projectVisibility[allocation.projectId] === false) {
        return;
      }
      const competenceId = allocation.competenceId || resources.find((r) => r.id === allocation.resourceId)?.competenceId;
      const quarterKey = `${allocation.calendarYear}-Q${allocation.calendarQuarter}`;
      if (!competenceId || !allocation.calendarYear || !allocation.calendarQuarter) return;
      if (!map[competenceId]) map[competenceId] = {};
      map[competenceId][quarterKey] =
        (map[competenceId][quarterKey] || 0) + (allocation.allocationPercentage || 0) / 100;
    });
    return map;
  }, [resourceAllocations, resources, projectVisibility, selectedBusinessUnit]);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b">Competence</th>
              {quarters.map((quarter) => (
                <th key={quarter.label} className="text-center p-2 border-b">
                  {quarter.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competences.map((competence) => {
              const capacity = resourceCapacity[competence.id] || 0;
              return (
                <tr key={competence.id}>
                  <td className="p-2 border-b font-medium">{competence.name}</td>
                  {quarters.map((quarter) => {
                    const key = `${quarter.year}-Q${quarter.quarter}`;
                    const demand = allocationsByCompetenceQuarter[competence.id]?.[key] || 0;
                    const gap = demand - capacity;
                    return (
                      <td
                        key={`${competence.id}-${key}`}
                        className={cn(
                          "p-2 text-center border-b",
                          gap > 0 ? "text-red-600" : gap < 0 ? "text-emerald-600" : "text-muted-foreground"
                        )}
                      >
                        {gap.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
