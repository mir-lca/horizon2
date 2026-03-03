"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResourceRow {
  id: string;
  competenceName: string;
  quantity: number;
  businessUnitId: string;
  archivedAt?: string;
}

interface AllocationItem {
  resourceId: string;
  relativeQuarter: number;
  allocationPercentage: number;
}

interface ProjectRow {
  id: string;
  name: string;
  resourceAllocations?: AllocationItem[];
}

interface AssignmentGapsReportProps {
  resources: ResourceRow[];
  projects: ProjectRow[];
}

type GroupBy = "competence" | "bu";

const QUARTERS = [1, 2, 3, 4, 5, 6, 7, 8];

function getCellClass(demand: number, capacity: number): string {
  if (capacity === 0) return "text-muted-foreground";
  const ratio = demand / capacity;
  if (ratio >= 1.0) return "text-red-600 dark:text-red-400 font-semibold";
  if (ratio >= 0.75) return "text-yellow-600 dark:text-yellow-400 font-semibold";
  return "text-green-600 dark:text-green-400";
}

function getCellBg(demand: number, capacity: number): string {
  if (capacity === 0) return "";
  const ratio = demand / capacity;
  if (ratio >= 1.0) return "bg-red-50 dark:bg-red-950/20";
  if (ratio >= 0.75) return "bg-yellow-50 dark:bg-yellow-950/20";
  return "bg-green-50 dark:bg-green-950/20";
}

export function AssignmentGapsReport({
  resources,
  projects,
}: AssignmentGapsReportProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("competence");

  const activeResources = resources.filter((r) => !r.archivedAt);

  // Build a lookup: resourceId -> resource
  const resourceById = useMemo(() => {
    return new Map(activeResources.map((r) => [r.id, r]));
  }, [activeResources]);

  // Compute demand FTEs per group key per quarter
  // 100% allocation = 1 FTE
  const rows = useMemo(() => {
    const groupKey = (r: ResourceRow) =>
      groupBy === "competence" ? r.competenceName : r.businessUnitId;

    // Capacity per group key
    const capacityMap = new Map<string, number>();
    for (const r of activeResources) {
      const k = groupKey(r);
      capacityMap.set(k, (capacityMap.get(k) ?? 0) + r.quantity);
    }

    // Demand per group key per quarter
    const demandMap = new Map<string, Map<number, number>>();
    for (const project of projects) {
      for (const alloc of project.resourceAllocations ?? []) {
        const resource = resourceById.get(alloc.resourceId);
        if (!resource) continue;
        const k = groupKey(resource);
        if (!demandMap.has(k)) demandMap.set(k, new Map());
        const qMap = demandMap.get(k)!;
        qMap.set(
          alloc.relativeQuarter,
          (qMap.get(alloc.relativeQuarter) ?? 0) + alloc.allocationPercentage / 100
        );
      }
    }

    const groups = Array.from(capacityMap.keys()).sort();
    return groups.map((key) => ({
      key,
      capacity: capacityMap.get(key) ?? 0,
      demandByQuarter: demandMap.get(key) ?? new Map<number, number>(),
    }));
  }, [activeResources, projects, resourceById, groupBy]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Group by:</span>
        <Button
          variant={groupBy === "competence" ? "default" : "outline"}
          size="sm"
          onClick={() => setGroupBy("competence")}
        >
          Competence
        </Button>
        <Button
          variant={groupBy === "bu" ? "default" : "outline"}
          size="sm"
          onClick={() => setGroupBy("bu")}
        >
          Business unit
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs min-w-[160px]">
                {groupBy === "competence" ? "Competence" : "Business unit"}
              </th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">
                Capacity (FTE)
              </th>
              {QUARTERS.map((q) => (
                <th
                  key={q}
                  className="text-center px-3 py-2 font-medium text-muted-foreground text-xs"
                >
                  Q{q}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-2 font-medium">{row.key}</td>
                <td className="px-3 py-2 text-center text-muted-foreground">
                  {row.capacity}
                </td>
                {QUARTERS.map((q) => {
                  const demand = row.demandByQuarter.get(q) ?? 0;
                  return (
                    <td
                      key={q}
                      className={cn(
                        "px-3 py-2 text-center text-xs",
                        getCellBg(demand, row.capacity)
                      )}
                    >
                      <span
                        className={getCellClass(demand, row.capacity)}
                      >
                        {demand > 0
                          ? `${demand.toFixed(1)}/${row.capacity}`
                          : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-100 dark:bg-green-950/40 border border-green-300" />
          Under 75% utilization
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-yellow-100 dark:bg-yellow-950/40 border border-yellow-300" />
          75–99% utilization
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-100 dark:bg-red-950/40 border border-red-300" />
          At or over capacity
        </span>
      </div>
    </div>
  );
}
