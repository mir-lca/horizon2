"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MockBadge } from "@/components/horizon-ui";
import { Shield, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";

interface WorkflowInstanceSummary {
  id: string;
  definitionName: string;
  entityType: string;
  entityId: string;
  currentState: string;
  createdBy?: string;
  createdAt: string;
}

const STATE_COLORS: Record<string, string> = {
  draft: "secondary",
  submitted: "default",
  under_review: "default",
  approved: "secondary",
  rejected: "destructive",
  implemented: "secondary",
  kicked_off: "secondary",
  ready: "default",
};

function WorkflowQueue() {
  const { data: instances = [], isLoading } = useQuery<WorkflowInstanceSummary[]>({
    queryKey: ['workflow-instances'],
    queryFn: async () => {
      const res = await fetch('/api/workflows/instances');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30000,
  });

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-muted-foreground">Loading workflows...</p>}
      {!isLoading && instances.length === 0 && (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No active workflows</p>
        </div>
      )}
      {instances.map((inst) => (
        <div key={inst.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{inst.definitionName.replace(/_/g, ' ')}</p>
              <p className="text-xs text-muted-foreground">{inst.entityType} — {inst.entityId}</p>
            </div>
            <Badge variant={(STATE_COLORS[inst.currentState] ?? "outline") as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
              {inst.currentState.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(inst.createdAt).toLocaleDateString()} by {inst.createdBy ?? 'system'}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function GovernancePage() {
  const [tab, setTab] = useState("workflows");

  return (
    <PageLayout
      header={{
        title: "Governance",
        subtitle: "Approval workflows, stage gates, and compliance",
      }}
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Approval queue</TabsTrigger>
          <TabsTrigger value="stage-gates">Stage gates</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows">
          <WorkflowQueue />
        </TabsContent>
        <TabsContent value="stage-gates">
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Stage gate overview — configure stage gates in project settings</p>
          </div>
        </TabsContent>
        <TabsContent value="audit">
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Audit trail — records all workflow transitions and approvals</p>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
