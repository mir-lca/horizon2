"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalQueuePanel } from "@/components/features/approval-queue-panel";
import { GovernanceStagePipeline } from "@/components/features/governance-stage-pipeline";
import { AuditLogViewer } from "@/components/features/audit-log-viewer";

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
          <ApprovalQueuePanel />
        </TabsContent>

        <TabsContent value="stage-gates">
          <GovernanceStagePipeline />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer entityType="system" entityId="portfolio" />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
