"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

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

  const handleSaveProject = async (updatedProject: Project): Promise<void> => {
    await updateProject(updatedProject);
    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    const success = await deleteProject(projectId);
    if (success) {
      setNavigating(true);
      // Delay to ensure dialog unmounts cleanly before navigation
      setTimeout(() => {
        router.replace("/projects");
      }, 100);
    }
  };

  if (loading) {
    return <LoadingState message="Loading project details..." showBackdrop={true} />;
  }

  if (error || !exists || !project) {
    return (
      <PageLayout
        header={{
          title: "Project Not Found",
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: "Projects", href: "/projects" },
          ],
        }}
      >
        <ErrorMessage message={error?.message || `Project not found with ID: ${projectId}`} backHref="/projects" backLabel="Back to Projects" />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={{
        title: project.name,
        breadcrumbs: [
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ],
        actions: (
          <>
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </>
        ),
      }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <FinancialChart projects={project} cardStyle={true} title="Financial Forecast" />
        </div>
        <div className="col-span-1">
          <ProjectDescriptionCard project={project} />
        </div>
      </div>

      <ProjectFinancialGrid
        project={project}
        onSave={async (payload: {
          revenueEstimates: RevenueEstimate[];
          smCostPercentage: number;
          yearlySustainingCosts: YearlyFinancialMetric[];
          grossMarginPercentages: YearlyFinancialMetric[];
        }) => {
          const { revenueEstimates, smCostPercentage, yearlySustainingCosts, grossMarginPercentages } = payload;
          await handleSaveProject({
            ...project,
            revenueEstimates,
            smCostPercentage,
            yearlySustainingCosts,
            grossMarginPercentages,
          });
        }}
      />

      <ProjectResourceAllocationManager
        project={project}
        onSave={async (updatedProject: Project) => {
          await handleSaveProject(updatedProject);
        }}
        businessUnits={allBusinessUnits}
        resources={allResources}
        competences={allCompetences}
      />
      </div>

      {!navigating && project && (
        <ProjectEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={project}
          onSave={handleSaveProject}
          businessUnits={allBusinessUnits}
          dialogTitle="Edit Project"
        />
      )}
    </PageLayout>
  );
}
