"use client";

import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/lib/queries";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download } from "lucide-react";
import type { Project } from "@/lib/types";
import { exportToCsv } from "@/lib/export";
import { ScoringModel } from "@/components/features/scoring-model";

const RISK_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

function RiskDashboardTab({ projects }: { projects: Project[] }) {
  const riskCounts = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    projects.forEach((p) => {
      if (p.riskLevel && counts[p.riskLevel] !== undefined) counts[p.riskLevel]++;
    });
    return Object.entries(counts).map(([level, count]) => ({ level, count }));
  }, [projects]);

  const highRiskProjects = projects.filter((p) => p.riskLevel === 'high' || p.riskLevel === 'critical');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Risk distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskCounts}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskCounts.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLOR[entry.level] ?? '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">High/critical risk projects ({highRiskProjects.length})</h3>
          {highRiskProjects.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No high/critical risk projects</p>
          )}
          <div className="space-y-2">
            {highRiskProjects.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{p.name}</span>
                <Badge
                  variant={p.riskLevel === 'critical' ? 'destructive' : 'outline'}
                  className="ml-2 text-xs flex-shrink-0"
                >
                  {p.riskLevel}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PivotTableTab({ projects }: { projects: Project[] }) {
  const [groupBy, setGroupBy] = useState<'businessUnit' | 'status' | 'riskLevel'>('businessUnit');

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(n);

  const handleExport = () => {
    const headers = ['Name', 'Business unit', 'Status', 'Risk', 'Total cost', 'Duration (Q)'];
    const rows = projects.map((p) => [
      `"${p.name}"`,
      p.businessUnitId,
      p.status,
      p.riskLevel ?? '',
      String(p.totalCost ?? 0),
      String(p.durationQuarters ?? 0),
    ]);
    exportToCsv(headers, rows, 'horizon-portfolio.csv');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Group by:</label>
          <select
            className="text-xs border rounded px-2 py-1"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
          >
            <option value="businessUnit">Business unit</option>
            <option value="status">Status</option>
            <option value="riskLevel">Risk level</option>
          </select>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="h-3 w-3 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium">Project</th>
              <th className="text-left px-3 py-2 text-xs font-medium">Business unit</th>
              <th className="text-left px-3 py-2 text-xs font-medium">Status</th>
              <th className="text-left px-3 py-2 text-xs font-medium">Risk</th>
              <th className="text-right px-3 py-2 text-xs font-medium">Total cost</th>
              <th className="text-right px-3 py-2 text-xs font-medium">Duration (Q)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.businessUnitId}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="text-xs">{p.status}</Badge>
                </td>
                <td className="px-3 py-2">
                  {p.riskLevel && (
                    <Badge
                      variant={p.riskLevel === 'critical' || p.riskLevel === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {p.riskLevel}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono">{fmt(p.totalCost ?? 0)}</td>
                <td className="px-3 py-2 text-right">{p.durationQuarters ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState("portfolio");
  const { data: projects = [], isLoading } = useProjects();

  if (isLoading) {
    return (
      <PageLayout header={{ title: "Reports" }}>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={{
        title: "Reports",
        subtitle: "Portfolio analysis, risk dashboards, and exports",
      }}
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio table</TabsTrigger>
          <TabsTrigger value="risk">Risk dashboard</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
        </TabsList>
        <TabsContent value="portfolio">
          <PivotTableTab projects={projects as Project[]} />
        </TabsContent>
        <TabsContent value="risk">
          <RiskDashboardTab projects={projects as Project[]} />
        </TabsContent>
        <TabsContent value="scoring">
          <ScoringModel projects={projects as Project[]} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
