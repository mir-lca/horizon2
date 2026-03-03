"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects } from "@/lib/queries";
import { SvarGanttPanel } from "@/components/features/svar-gantt-panel";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/lib/types";

interface ScenarioRow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

function ScenariosTab() {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: scenarios = [], isLoading, refetch } = useQuery<ScenarioRow[]>({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const res = await fetch('/api/scenarios');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30000,
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, createdBy: 'user' }),
    });
    setNewName('');
    setCreating(false);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Scenarios</h3>
        <Button size="sm" variant="outline" onClick={() => setCreating(!creating)}>
          <Plus className="h-3 w-3 mr-1" /> New scenario
        </Button>
      </div>

      {creating && (
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border rounded px-3 py-1.5"
            placeholder="Scenario name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          />
          <Button size="sm" onClick={handleCreate}>Create</Button>
          <Button size="sm" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && scenarios.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No scenarios created yet</p>
      )}

      <div className="space-y-2">
        {scenarios.map((s) => (
          <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [tab, setTab] = useState("gantt");
  const { data: projects = [] } = useProjects();

  return (
    <PageLayout
      header={{
        title: "Portfolio",
        subtitle: "Portfolio swimlane, scenarios, and OKR linkage",
      }}
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="gantt">Portfolio Gantt</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>
        <TabsContent value="gantt">
          <SvarGanttPanel projects={projects as Project[]} />
        </TabsContent>
        <TabsContent value="scenarios">
          <ScenariosTab />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
