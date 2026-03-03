"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

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

interface ResourceLevelingChartProps {
  resources: ResourceRow[];
  projects: ProjectRow[];
}

const PROJECT_PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
  "#84cc16",
];

const QUARTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export function ResourceLevelingChart({
  resources,
  projects,
}: ResourceLevelingChartProps) {
  const activeResources = resources.filter((r) => !r.archivedAt);

  const { chartData, projectList } = useMemo(() => {
    // Build resourceId -> competenceName lookup
    const competenceByResource = new Map(
      activeResources.map((r) => [r.id, r.competenceName])
    );

    // Collect unique projects that have allocations
    const projectsWithAllocs = projects.filter(
      (p) => p.resourceAllocations && p.resourceAllocations.length > 0
    );

    // For each quarter, sum allocation % per project (across all competences)
    const data = QUARTERS.map((q) => {
      const point: Record<string, string | number> = { quarter: `Q${q}` };

      for (const project of projectsWithAllocs) {
        let totalAlloc = 0;
        for (const alloc of project.resourceAllocations ?? []) {
          if (alloc.relativeQuarter !== q) continue;
          // Only count active resources
          if (!competenceByResource.has(alloc.resourceId)) continue;
          totalAlloc += alloc.allocationPercentage;
        }
        point[project.id] = totalAlloc;
      }

      return point;
    });

    return { chartData: data, projectList: projectsWithAllocs };
  }, [activeResources, projects]);

  if (projectList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No allocation data to display</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          barCategoryGap="20%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="quarter"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            unit="%"
            domain={[0, "auto"]}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const project = projectList.find((p) => p.id === name);
              return [`${value.toFixed(0)}%`, project?.name ?? name];
            }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
            }}
          />
          <Legend
            formatter={(value) => {
              const project = projectList.find((p) => p.id === value);
              return project?.name ?? value;
            }}
            wrapperStyle={{ fontSize: 12 }}
          />
          <ReferenceLine
            y={100}
            stroke="#ef4444"
            strokeDasharray="6 3"
            strokeWidth={2}
            label={{
              value: "100% capacity",
              position: "insideTopRight",
              fontSize: 11,
              fill: "#ef4444",
            }}
          />
          {projectList.map((project, index) => (
            <Bar
              key={project.id}
              dataKey={project.id}
              stackId="a"
              fill={PROJECT_PALETTE[index % PROJECT_PALETTE.length]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
