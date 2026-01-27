"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import type { PropsWithChildren } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useProjectData } from "@/hooks/use-project-data";
import { Project } from "@/lib/types";
import { formatCurrencyInMillions } from "@/lib/formatting-utils";
import { cn } from "@/lib/utils";
import { FinancialRangeCard, PercentageMetricCard, FinancialMetricCard } from "@/components/ui/metric-card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { useAppStore } from "@/store/app-store";
import { BusinessUnitGapAnalysis } from "@/components/features/business-unit-gap-analysis";
import { useResourceGapAnalysis } from "@/hooks/use-resource-gap-analysis";
import { SCROLL_AREA_CLASSES } from "@/lib/ui-shared-styles";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  calculateIRRForProjects,
  calculateTotalSustainingCosts,
  createAggregateYearlySustainingCosts,
  calculateTotalActiveCost,
  filterValidProjectsForIRR,
  calculateNPV,
  generateProjectCashFlows,
  calculateProjectRevenueForYear,
  createAggregateProject,
  calculatePortfolioHiringInvestment,
} from "@/lib/financial-calculations";
import { FinancialChart } from "@/components/features/financial-chart";
import useMediaQuery from "@/hooks/use-media-query";
import { Switch } from "@/components/ui";
import { Label } from "@/components/ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui";

interface ProjectGanttPanelProps {
  projects: Project[];
  onProjectChange: (
    updatedProjects: Project[],
    changes?: {
      projectTimelineChanged: boolean;
      projectId: string;
      oldStartYear?: number;
      oldStartQuarter?: number;
      newStartYear: number;
      newStartQuarter: number;
    }
  ) => void;
}

const TimelineView = dynamic(
  () => import("@/components/features/timeline-view").then((mod) => ({ default: mod.TimelineView })),
  {
    ssr: false,
    loading: () => <LoadingState message="Loading timeline..." />,
  }
);

const DashboardContainer = ({ children }: PropsWithChildren) => (
  <div className="h-[calc(100vh-4rem)] overflow-hidden">{children}</div>
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
      <CardTitle className="text-base sm:text-lg font-medium">Project Timeline</CardTitle>
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

  // Use useMemo instead of useEffect+useState to avoid render loop
  const projects = useMemo(() => {
    if (!Array.isArray(fetchedProjects)) return [];
    return fetchedProjects.map((project) => ({
      ...project,
      resourceAllocations: project.resourceAllocations || [],
    }));
  }, [fetchedProjects]);

  const businessUnitFilteredProjects = useMemo(() => {
    if (selectedBusinessUnit === "all") {
      return projects;
    }
    return projects.filter((project) => project.businessUnitId === selectedBusinessUnit);
  }, [projects, selectedBusinessUnit]);

  const visibleProjects = useMemo(() => {
    return showVisibleOnly ? businessUnitFilteredProjects.filter((project) => project.visible === true) : businessUnitFilteredProjects;
  }, [showVisibleOnly, businessUnitFilteredProjects]);

  const aggregateProject = useMemo(() => {
    return createAggregateProject(visibleProjects, dateRange);
  }, [visibleProjects, dateRange]);

  const unfundedProjects = useMemo(() => {
    return businessUnitFilteredProjects.filter((project) => project.status === "unfunded");
  }, [businessUnitFilteredProjects]);

  const visibleUnfundedProjects = useMemo(() => {
    return unfundedProjects.filter((project) => project.visible === true);
  }, [unfundedProjects]);

  const visibleUnfundedMetrics = useMemo(() => {
    const lowTotal = visibleUnfundedProjects.reduce((sum, project) => {
      const revenue = calculateProjectRevenueForYear(project, project.startYear);
      return sum + (revenue?.revenue || 0);
    }, 0);
    return {
      revenue: {
        lowTotal,
        highTotal: lowTotal,
      },
      irrIncrease: calculateIRRForProjects(visibleUnfundedProjects, dateRange) || 0,
      additionalInvestment: calculateTotalActiveCost(visibleUnfundedProjects),
      sustainingCost: calculateTotalSustainingCosts(visibleUnfundedProjects),
    };
  }, [visibleUnfundedProjects, dateRange]);

  const projectVisibilityMap = useMemo(() => {
    return businessUnitFilteredProjects.reduce((map, project) => {
      map[project.id] = project.visible === true;
      return map;
    }, {} as Record<string, boolean>);
  }, [businessUnitFilteredProjects]);

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

  const currentIRR = useMemo(() => {
    const irrValue = calculateIRRForProjects(visibleProjects, dateRange);
    return irrValue !== null ? Math.round(irrValue) : 0;
  }, [visibleProjects, dateRange]);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const hiringInvestment = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const originalDateRange = gapAnalysisProps.dateRange || dateRange;
    const filteredDateRange = {
      ...originalDateRange,
      startYear: Math.max(originalDateRange.startYear, currentYear),
      startQuarter: originalDateRange.startYear >= currentYear ? originalDateRange.startQuarter : 1,
    };

    return calculatePortfolioHiringInvestment({
      competences,
      resources: gapAnalysisProps.resources || resources,
      resourceAllocations: gapAnalysisProps.resourceAllocations || [],
      projects: gapAnalysisProps.projects || projects,
      businessUnits: gapAnalysisProps.businessUnits || businessUnits,
      projectVisibility: gapAnalysisProps.projectVisibility || projectVisibilityMap,
      selectedBusinessUnit: gapAnalysisProps.selectedBusinessUnit || selectedBusinessUnit,
      dateRange: filteredDateRange,
    });
  }, [competences, gapAnalysisProps, dateRange, resources, projects, businessUnits, projectVisibilityMap, selectedBusinessUnit]);

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
    const errorMessage = dataError?.message || "Failed to load data";
    return (
      <div className="container mx-auto px-4 py-10">
        <ErrorMessage message={errorMessage} backHref="/" backLabel="Refresh" />
      </div>
    );
  }

  const renderFinancialChart = () => {
    const hasVisibleUnfunded = unfundedProjects.length > 0;

    return (
      <Card className="overflow-hidden w-full max-w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-base sm:text-lg font-medium">Financial Forecast</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 px-6 pb-4" style={{ height: isMobile ? "18rem" : "22rem" }}>
              {aggregateProject ? (
                <FinancialChart
                  projects={aggregateProject}
                  title=""
                  className="h-full w-full"
                  cardStyle={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No visible project data to display.
                </div>
              )}
            </div>
            <div className="flex-shrink-0 border-t dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-3">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-center">
                  <div className="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Add. Revenue</div>
                  <div
                    className={cn(
                      "text-blue-600 dark:text-blue-400 font-semibold",
                      hasVisibleUnfunded && "text-blue-700 dark:text-blue-300"
                    )}
                  >
                    {formatCurrencyInMillions(visibleUnfundedMetrics.revenue.lowTotal)} -{" "}
                    {formatCurrencyInMillions(visibleUnfundedMetrics.revenue.highTotal)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-neutral-500 dark:text-neutral-400 font-medium mb-1">IRR Increase</div>
                  <div className="text-green-600 dark:text-green-400 font-semibold">{visibleUnfundedMetrics.irrIncrease}%</div>
                </div>
                <div className="text-center">
                  <div className="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Add. Investment</div>
                  <div className="text-amber-600 dark:text-amber-400 font-semibold">
                    {formatCurrencyInMillions(visibleUnfundedMetrics.additionalInvestment)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardContainer>
      <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} className="h-full">
        <ResizablePanel defaultSize={55} minSize={35} className="overflow-hidden">
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
        <ResizablePanel defaultSize={45} minSize={30} className="overflow-hidden">
          <ScrollArea className={SCROLL_AREA_CLASSES}>
            <div className="p-4 sm:p-6 space-y-6 w-full max-w-full">
              {renderFinancialChart()}

              <Card className="w-full max-w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-medium">Resource Gaps</CardTitle>
                    <div className="text-xs text-muted-foreground">By competence and quarter</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="visible-projects-toggle" className="text-xs text-muted-foreground">
                      Visible projects only
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
    </DashboardContainer>
  );
}
