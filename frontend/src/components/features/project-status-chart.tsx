"use client";

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Project } from "@/lib/types";

interface ProjectStatusChartProps {
  projects: Project[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "#22c55e" },
  funded: { label: "Funded", color: "#3b82f6" },
  completed: { label: "Completed", color: "#6b7280" },
  unfunded: { label: "Unfunded", color: "#f59e0b" },
};

export function ProjectStatusChart({ projects }: ProjectStatusChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const project of projects) {
      counts[project.status] = (counts[project.status] ?? 0) + 1;
    }
    return Object.entries(STATUS_CONFIG)
      .map(([status, { label, color }]) => ({
        status,
        label,
        color,
        count: counts[status] ?? 0,
      }))
      .filter((row) => row.count > 0);
  }, [projects]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
        No projects to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(60, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 32, bottom: 0, left: 72 }}
        barCategoryGap="30%"
      >
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={68}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: 12,
          }}
          formatter={(value: number) => [value, "Projects"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} minPointSize={4}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={entry.color} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
