"use client";

import { useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useProjectData } from "@/hooks/use-project-data";
import { Project } from "@/lib/types";
import { MetricCard } from "@/components/ui/metric-card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { useAppStore } from "@/store/app-store";
import { BusinessUnitGapAnalysis } from "@/components/features/business-unit-gap-analysis";
import { ProjectStatusChart } from "@/components/features/project-status-chart";
import { useResourceGapAnalysis } from "@/hooks/use-resource-gap-analysis";
import { SCROLL_AREA_CLASSES } from "@/lib/ui-shared-styles";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  calculateTotalActiveCost,
  createAggregateProject,
} from "@/lib/financial-calculations";
import { FinancialChart } from "@/components/features/financial-chart";
import useMediaQuery from "@/hooks/use-media-query";
import { Switch } from "@/components/ui";
import { Label } from "@/components/ui";

const TimelineView = dynamic(
  () => import("@/components/features/timeline-view").then((mod) => ({ default: mod.TimelineView })),
  {
    ssr: false,
    loading: () => <LoadingState message="Loading timeline..." />,
  }
);

const GanttPanelContent = ({
  filteredProjects,
  selectedBusinessUnit,
  dateRange,
  onSaveProjects,
  onProjectClick,
}: {
  filteredProjects: Project[];
  selectedBusinessUnit: string;
  dateRange: any;
  onSaveProjects: (projects: Project[]) => Promise<void>;
  onProjectClick: (projectId: string) => void;
}) => (
  <Card className="h-full flex flex-col overflow-hidden max-w-full">
    <CardHeader className="flex-shrink-0">
      <CardTitle className="text-base sm:text-lg font-medium">Project timeline</CardTitle>
    </CardHeader>
    <CardContent className="flex-1 min-h-0 min-w-0 pt-12 overflow-y-auto">
      <Suspense fallback={<LoadingState message="Loading timeline..." />}>
        <TimelineView
          projects={filteredProjects}
          selectedBusinessUnit={selectedBusinessUnit}
          timeline={{ startYear: dateRange.startYear, endYear: dateRange.endYear }}
          onProjectClick={onProjectClick}
        />
      </Suspense>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const router = useRouter();
  const dateRange = useAppStore((state) => state.dateRange);
  const selectedBusinessUnit = useAppStore((state) => state.selectedBusinessUnit);

  const { projects: fetchedProjects, resources, businessUnits, competences, loading: isLoading, error: dataError, updateProject } =
    useProjectData();

  const [showVisibleOnly, setShowVisibleOnly] = useState(true);

  const projects = useMemo(() => {
    if (!Array.isArray(fetchedProjects)) return [];
    return fetchedProjects.map((project) => ({
      ...project,
      resourceAllocations: project.resourceAllocations || [],
    }));
  }, [fetchedProjects]);

  const businessUnitFilteredProjects = useMemo(() => {
    if (selectedBusinessUnit === "all") return projects;
    return projects.filter((project) => project.businessUnitId === selectedBusinessUnit);
  }, [projects, selectedBusinessUnit]);

  const visibleProjects = useMemo(
    () =>
      showVisibleOnly
        ? businessUnitFilteredProjects.filter((p) => p.visible === true)
        : businessUnitFilteredProjects,
    [showVisibleOnly, businessUnitFilteredProjects]
  );

  const aggregateProject = useMemo(
    () => createAggregateProject(visibleProjects, dateRange),
    [visibleProjects, dateRange]
  );

  const projectVisibilityMap = useMemo(
    () =>
      businessUnitFilteredProjects.reduce((map, project) => {
        map[project.id] = project.visible === true;
        return map;
      }, {} as Record<string, boolean>),
    [businessUnitFilteredProjects]
  );

  const { gapAnalysisProps } = useResourceGapAnalysis({
    resources,
    projects,
    businessUnits,
    competences,
    dateRange,
    selectedBusinessUnit,
    isAdvancedMode: false,
    isBasicModeExpanded: true,
    visibleProjectsOnly: true,
    customProjectVisibility: projectVisibilityMap,
  });

  const isMobile = useMediaQuery("(max-width: 768px)");

  // KPI metrics
  const portfolioCost = useMemo(() => calculateTotalActiveCost(visibleProjects), [visibleProjects]);

  const activeCount = useMemo(
    () => visibleProjects.filter((p) => p.status === "active").length,
    [visibleProjects]
  );

  const onTrackPct = useMemo(() => {
    if (visibleProjects.length === 0) return 0;
    return Math.round((activeCount / visibleProjects.length) * 100);
  }, [activeCount, visibleProjects.length]);

  const avgDurationQtrs = useMemo(() => {
    if (visibleProjects.length === 0) return 0;
    const total = visibleProjects.reduce((s, p) => s + (p.durationQuarters ?? 0), 0);
    return Math.round(total / visibleProjects.length);
  }, [visibleProjects]);

  const handleSaveProjects = async (updated: Project[]) => {
    await Promise.all(updated.map((project) => updateProject({ ...project, updatedAt: new Date().toISOString() })));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <LoadingState message="Loading project and resource data..." showBackdrop={true} />
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="container mx-auto px-4 py-10">
        <ErrorMessage message={dataError?.message || "Failed to load data"} backHref="/" backLabel="Refresh" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Full-width KPI header */}
      <div className="flex-none px-4 sm:px-6 pt-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          variant="financial"
          title="Portfolio cost"
          value={portfolioCost}
        />
        <MetricCard
          variant="standard"
          title="Active projects"
          value={activeCount}
        />
        <MetricCard
          variant="percentage"
          title="On-track"
          value={onTrackPct}
        />
        <MetricCard
          variant="standard"
          title="Avg. duration"
          value={`${avgDurationQtrs}q`}
        />
      </div>

      {/* Main content: Gantt left + right widgets */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} className="h-full">
          <ResizablePanel defaultSize={60} minSize={35} className="overflow-hidden">
            <div className="h-full p-4 sm:p-6 max-w-full overflow-hidden">
              <GanttPanelContent
                filteredProjects={businessUnitFilteredProjects}
                selectedBusinessUnit={selectedBusinessUnit}
                dateRange={dateRange}
                onSaveProjects={handleSaveProjects}
                onProjectClick={(projectId) => router.push(`/projects/${projectId}`)}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={25} className="overflow-hidden">
            <ScrollArea className={SCROLL_AREA_CLASSES}>
              <div className="p-4 sm:p-6 space-y-6 w-full max-w-full">
                {/* Status distribution */}
                <Card className="overflow-hidden w-full max-w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg font-medium">Status distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <ProjectStatusChart projects={visibleProjects} />
                  </CardContent>
                </Card>

                {/* Financial forecast */}
                <Card className="overflow-hidden w-full max-w-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg font-medium">Financial forecast</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div style={{ height: isMobile ? "18rem" : "22rem" }} className="px-6 pb-4">
                      {aggregateProject ? (
                        <FinancialChart
                          projects={aggregateProject}
                          title=""
                          className="h-full w-full"
                          cardStyle={false}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          No visible project data to display.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Resource gaps */}
                <Card className="w-full max-w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-medium">Resource gaps</CardTitle>
                      <div className="text-xs text-muted-foreground">By competence and quarter</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="visible-projects-toggle" className="text-xs text-muted-foreground">
                        Visible only
                      </Label>
                      <Switch
                        id="visible-projects-toggle"
                        checked={showVisibleOnly}
                        onCheckedChange={setShowVisibleOnly}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <BusinessUnitGapAnalysis {...gapAnalysisProps} />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
