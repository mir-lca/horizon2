"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilestoneTracker } from "@/components/features/milestone-tracker";
import { RiskRegister } from "@/components/features/risk-register";
import { SvarGanttPanel } from "@/components/features/svar-gantt-panel";
import { LoadingState } from "@/components/ui/loading-state";
import { toast } from "sonner";
import type { Project } from "@/lib/types";

interface Program {
  id: string;
  name: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const TAB_ITEMS = [
  { value: "overview", label: "Overview" },
  { value: "schedule", label: "Schedule" },
  { value: "risks", label: "Risks" },
] as const;

export default function ProgramDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const programId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: program, isLoading, error } = useQuery<Program>({
    queryKey: ['programs', programId],
    queryFn: async () => {
      const res = await fetch(`/api/programs/${programId}`);
      if (!res.ok) throw new Error('Program not found');
      return res.json();
    },
    enabled: !!programId,
  });

  const { data: childProjects = [] } = useQuery<Project[]>({
    queryKey: ['projects', { parentProjectId: programId }],
    queryFn: async () => {
      const res = await fetch(`/api/projects?parentProjectId=${programId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!programId,
  });

  const handleDelete = async () => {
    if (!window.confirm('Delete this program? This cannot be undone.')) return;
    const res = await fetch(`/api/programs/${programId}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete program'); return; }
    queryClient.invalidateQueries({ queryKey: ['programs'] });
    toast.success('Program deleted');
    router.push('/programs');
  };

  if (isLoading) return <LoadingState message="Loading program..." showBackdrop={true} />;

  if (error || !program) {
    return (
      <PageLayout header={{ title: "Program not found", breadcrumbs: [{ label: "Programs", href: "/programs" }] }}>
        <p className="text-sm text-muted-foreground">Program not found.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={{
        title: program.name,
        breadcrumbs: [{ label: "Programs", href: "/programs" }, { label: program.name }],
        actions: (
          <>
            <Badge variant={program.status === 'active' ? 'secondary' : 'outline'} className="text-xs">
              {program.status}
            </Badge>
            <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
          </>
        ),
      }}
    >
      {program.description && (
        <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <MilestoneTracker projectId={program.id} />
            </div>
            <div className="border rounded-lg p-4">
              <RiskRegister entityType="program" entityId={program.id} compact />
            </div>
          </div>

          {childProjects.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Projects in this program ({childProjects.length})</h3>
              <div className="space-y-2">
                {childProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                    <span>{p.name}</span>
                    <Badge variant="outline" className="text-xs">{p.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="border rounded-lg p-4">
            {childProjects.length > 0 ? (
              <SvarGanttPanel projects={childProjects} />
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-8">
                No projects linked to this program yet.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="border rounded-lg p-4">
            <RiskRegister entityType="program" entityId={program.id} />
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
