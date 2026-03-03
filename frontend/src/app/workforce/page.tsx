"use client";

import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResources, useProjects } from "@/lib/queries";
import { AssignmentGapsReport } from "@/components/features/assignment-gaps-report";
import { ResourceLevelingChart } from "@/components/features/resource-leveling-chart";
import { WorkforceHeadcount } from "@/components/features/workforce-headcount";
import type { Resource, Project, ResourceAllocationItem } from "@/lib/types";

// ─── Labour dashboard helpers ──────────────────────────────────────────────────

const NEXT_4_QUARTERS = [1, 2, 3, 4];

function getAllocationsForResource(resource: Resource, projects: Project[]): number[] {
  // Returns total allocation % per quarter index (0-3) across all projects
  const totals = [0, 0, 0, 0];
  for (const project of projects) {
    const allocs = (project.resourceAllocations ?? []) as ResourceAllocationItem[];
    for (const alloc of allocs) {
      if (alloc.resourceId !== resource.id) continue;
      const qi = alloc.relativeQuarter - 1;
      if (qi >= 0 && qi < 4) {
        totals[qi] += alloc.allocationPercentage;
      }
    }
  }
  return totals;
}

interface LabourTableRow {
  resource: Resource;
  allocations: number[];
  info: string;
}

function LabourDashboardTab({
  resources,
  projects,
}: {
  resources: Resource[];
  projects: Project[];
}) {
  const overAllocated = useMemo<LabourTableRow[]>(() => {
    return resources
      .map((r) => ({ resource: r, allocations: getAllocationsForResource(r, projects), info: "" }))
      .filter(({ allocations }) => allocations.some((a) => a > 100))
      .map(({ resource, allocations }) => ({
        resource,
        allocations,
        info: allocations
          .map((a, i) => (a > 100 ? `Q${i + 1}: ${a}%` : null))
          .filter(Boolean)
          .join(", "),
      }));
  }, [resources, projects]);

  const unassigned = useMemo<LabourTableRow[]>(() => {
    return resources
      .map((r) => ({ resource: r, allocations: getAllocationsForResource(r, projects), info: "" }))
      .filter(({ allocations }) => allocations.every((a) => a === 0))
      .map(({ resource, allocations }) => ({ resource, allocations, info: "No allocations in next 4 quarters" }));
  }, [resources, projects]);

  const assignmentErrors = useMemo<LabourTableRow[]>(() => {
    return resources
      .map((r) => ({ resource: r, allocations: getAllocationsForResource(r, projects), info: "" }))
      .filter(({ allocations }) => allocations.some((a) => a > 0 && a < 100))
      .map(({ resource, allocations }) => ({
        resource,
        allocations,
        info: allocations
          .map((a, i) => (a > 0 && a < 100 ? `Q${i + 1}: ${a}%` : null))
          .filter(Boolean)
          .join(", "),
      }));
  }, [resources, projects]);

  return (
    <div className="space-y-6">
      <ResourceTable
        title="Over-allocated resources"
        description="Resources with allocation exceeding 100% in any quarter"
        rows={overAllocated}
        emptyMessage="No over-allocated resources"
      />
      <ResourceTable
        title="Unassigned resources"
        description="Resources with no allocations in the next 4 quarters"
        rows={unassigned}
        emptyMessage="No unassigned resources"
      />
      <ResourceTable
        title="Assignment errors"
        description="Resources with partial allocation (below 100%) in any quarter"
        rows={assignmentErrors}
        emptyMessage="No assignment errors found"
      />
    </div>
  );
}

function ResourceTable({
  title,
  description,
  rows,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: LabourTableRow[];
  emptyMessage: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium">Resource</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Competence</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Business unit</th>
                {NEXT_4_QUARTERS.map((q) => (
                  <th key={q} className="text-right px-3 py-2 text-xs font-medium">Q{q}</th>
                ))}
                <th className="text-left px-3 py-2 text-xs font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(({ resource, allocations, info }) => (
                <tr key={resource.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{resource.name ?? resource.competenceName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{resource.competenceName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{resource.businessUnitId}</td>
                  {allocations.map((a, i) => (
                    <td
                      key={i}
                      className={[
                        "px-3 py-2 text-right font-mono text-xs",
                        a > 100 ? "text-destructive font-semibold" : a === 0 ? "text-muted-foreground" : "",
                      ].join(" ")}
                    >
                      {a > 0 ? `${a}%` : "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-xs text-muted-foreground">{info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WorkforcePage() {
  const [tab, setTab] = useState("labour");
  const [year, setYear] = useState(2026);
  const [businessUnitId, setBusinessUnitId] = useState("all");

  const { data: resources = [], isLoading: resourcesLoading } = useResources();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const isLoading = resourcesLoading || projectsLoading;

  if (isLoading) {
    return (
      <PageLayout header={{ title: "Workforce" }}>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={{
        title: "Workforce",
        subtitle: "Labour analysis, resource leveling, and headcount planning",
      }}
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="labour">Labour dashboard</TabsTrigger>
          <TabsTrigger value="gaps">Assignment gaps</TabsTrigger>
          <TabsTrigger value="leveling">Resource leveling</TabsTrigger>
          <TabsTrigger value="headcount">Headcount planning</TabsTrigger>
        </TabsList>

        <TabsContent value="labour">
          <LabourDashboardTab
            resources={resources as Resource[]}
            projects={projects as Project[]}
          />
        </TabsContent>

        <TabsContent value="gaps">
          <AssignmentGapsReport
            resources={resources as Resource[]}
            projects={projects as Project[]}
          />
        </TabsContent>

        <TabsContent value="leveling">
          <ResourceLevelingChart
            resources={resources as Resource[]}
            projects={projects as Project[]}
          />
        </TabsContent>

        <TabsContent value="headcount">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Year:</label>
                <select
                  className="text-xs border rounded px-2 py-1"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Business unit:</label>
                <input
                  type="text"
                  className="text-xs border rounded px-2 py-1 w-32"
                  value={businessUnitId}
                  onChange={(e) => setBusinessUnitId(e.target.value)}
                  placeholder="all"
                />
              </div>
            </div>
            <WorkforceHeadcount businessUnitId={businessUnitId} year={year} />
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
