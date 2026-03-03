"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui";
import { PageLayout } from "@/components/layout";
import { Project, RevenueEstimate, YearlyFinancialMetric } from "@/lib/types";
import { useProjectById } from "@/hooks/use-project-data";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { ProjectEditDialog } from "@/components/forms/project-edit-dialog";
import { FinancialChart } from "@/components/features/financial-chart";
import { ProjectFinancialGrid } from "@/components/features/ProjectFinancialGrid";
import { ProjectDescriptionCard } from "@/components/features/ProjectDescriptionCard";
import { ProjectResourceAllocationManager } from "@/components/forms/project-resource-allocation-manager";
import { MilestoneTracker } from "@/components/features/milestone-tracker";
import { RiskRegister } from "@/components/features/risk-register";
import { SvarGanttPanel } from "@/components/features/svar-gantt-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowPanel } from "@/components/features/workflow-panel";
import { EvmMetricsCard } from "@/components/features/evm-metrics-card";
import { SpendRecordsTable } from "@/components/features/spend-records-table";
import { DocumentPanel } from "@/components/features/document-panel";
import type { ProjectDocument } from "@/lib/types";

const TAB_ITEMS = [
  { value: "overview", label: "Overview" },
  { value: "schedule", label: "Schedule" },
  { value: "financials", label: "Financials" },
  { value: "resources", label: "Resources" },
  { value: "risks", label: "Risks" },
  { value: "governance", label: "Governance" },
  { value: "documents", label: "Documents" },
] as const;

function ProjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const activeTab = searchParams.get("tab") ?? "overview";

  const {
    data: projectData,
    loading,
    error,
    updateProject,
    deleteProject,
    allBusinessUnits,
    allResources,
    allCompetences,
    exists,
  } = useProjectById(projectId);

  const project = projectData?.project;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSaveProject = async (updatedProject: Project): Promise<void> => {
    await updateProject(updatedProject);
    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    const success = await deleteProject(projectId);
    if (success) {
      setNavigating(true);
      setTimeout(() => router.replace("/projects"), 100);
    }
  };

  if (loading) return <LoadingState message="Loading project details..." showBackdrop={true} />;

  if (error || !exists || !project) {
    return (
      <PageLayout
        header={{
          title: "Project not found",
          breadcrumbs: [{ label: "Projects", href: "/projects" }],
        }}
      >
        <ErrorMessage message={error?.message || `Project not found with ID: ${projectId}`} backHref="/projects" backLabel="Back to projects" />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={{
        title: project.name,
        breadcrumbs: [
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ],
        actions: (
          <>
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>Edit</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </>
        ),
      }}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <FinancialChart projects={project} cardStyle={true} title="Financial forecast" />
            </div>
            <div className="col-span-1">
              <ProjectDescriptionCard project={project} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <MilestoneTracker projectId={project.id} />
            </div>
            <div className="border rounded-lg p-4">
              <RiskRegister entityType="project" entityId={project.id} compact />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="border rounded-lg p-4">
            <SvarGanttPanel projects={[project]} />
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <FinancialChart projects={project} cardStyle={true} title="Financial forecast" />
          <ProjectFinancialGrid
            project={project}
            onSave={async (payload: {
              revenueEstimates: RevenueEstimate[];
              smCostPercentage: number;
              yearlySustainingCosts: YearlyFinancialMetric[];
              grossMarginPercentages: YearlyFinancialMetric[];
            }) => {
              await handleSaveProject({ ...project, ...payload });
            }}
          />
          <div className="border rounded-lg p-4">
            <EvmMetricsCard
              totalCost={project.totalCost ?? 0}
              spendRecords={project.spendRecords ?? []}
              startYear={project.startYear ?? new Date().getFullYear()}
              startQuarter={project.startQuarter ?? 1}
              durationQuarters={project.durationQuarters ?? 4}
              percentComplete={0}
            />
          </div>
          <div className="border rounded-lg p-4">
            <SpendRecordsTable
              projectId={project.id}
              spendRecords={project.spendRecords ?? []}
              onUpdate={async (records) => {
                await handleSaveProject({ ...project, spendRecords: records });
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <ProjectResourceAllocationManager
            project={project}
            onSave={async (updatedProject: Project) => {
              await handleSaveProject(updatedProject);
            }}
            businessUnits={allBusinessUnits}
            resources={allResources}
            competences={allCompetences}
          />
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="border rounded-lg p-4">
            <RiskRegister entityType="project" entityId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <div className="border rounded-lg p-4">
            <WorkflowPanel entityType="project" entityId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="border rounded-lg p-4">
            <DocumentPanel
              documents={project.documents ?? []}
              onUpdate={async (docs: ProjectDocument[]) => {
                await handleSaveProject({ ...project, documents: docs });
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {!navigating && project && (
        <ProjectEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={project}
          onSave={handleSaveProject}
          businessUnits={allBusinessUnits}
          dialogTitle="Edit project"
        />
      )}
    </PageLayout>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." showBackdrop={true} />}>
      <ProjectDetailContent />
    </Suspense>
  );
}
