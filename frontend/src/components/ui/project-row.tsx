"use client";

import React, { memo } from "react";
import Link from "next/link";
import { GripVertical, MoreHorizontal, ChevronDown, ChevronRight, Circle, Loader2 } from "lucide-react";
import { TableCell, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Progress } from "tr-workspace-components";
import { DraggableRow } from "@/components/ui/draggable-row";
import { Project } from "@/lib/types";
import { getRiskColorClass, formatCompactNumber } from "@/lib/formatting-utils";
import { formatQuarterYear, calculateEndYear, calculateEndQuarter } from "@/lib/date-utils";
import { calculateIRRForProjects } from "@/lib/financial-calculations";
import { ProjectStatusBadge } from "@/components/ui/status-badge";
import { getProjectPhaseDotClass } from "@/lib/project-visuals";
import { useRouter } from "next/navigation";

interface ProjectWithChildren extends Project {
  childProjects?: ProjectWithChildren[];
}

interface ProjectRowProps {
  project: ProjectWithChildren;
  isChild?: boolean;
  isBeingDragged?: boolean;
  isDraggedOver?: boolean;
  isPending?: boolean;
  pendingMessage?: string;
  hasChildren?: boolean;
  showChildren?: boolean;
  onToggleChildren?: (id: string) => void;
  onEditProject?: (project: ProjectWithChildren) => void;
}

interface FinancialSummary {
  parentCost: number;
  childrenCost: number;
  totalCost: number;
  parentRevenueLow: number;
  parentRevenueHigh: number;
  childrenRevenueLow: number;
  childrenRevenueHigh: number;
  totalRevenueLow: number;
  totalRevenueHigh: number;
  parentIrr: number | null;
  totalIrr: number | null;
}

export const ProjectRow = memo(function ProjectRow({
  project,
  isChild = false,
  isBeingDragged = false,
  isDraggedOver = false,
  isPending = false,
  pendingMessage,
  hasChildren = false,
  showChildren = false,
  onToggleChildren,
  onEditProject,
}: ProjectRowProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleRowClick = (event: React.MouseEvent) => {
    if (
      (event.target as HTMLElement).closest("button") ||
      (event.target as HTMLElement).closest("a") ||
      (event.target as HTMLElement).closest(".dropdown-trigger")
    ) {
      return;
    }

    setIsNavigating(true);
    router.push(`/projects/${project.id}`);
  };

  const handleMouseEnter = () => {
    router.prefetch(`/projects/${project.id}`);
  };

  const endYear = calculateEndYear(project.startYear, project.startQuarter, project.durationQuarters);
  const endQuarter = calculateEndQuarter(project.startQuarter, project.durationQuarters);

  const financialSummary: FinancialSummary = React.useMemo(() => {
    const developmentCost = project.totalCost || 0;
    const revenueLow = project.revenueEstimates?.reduce((total, estimate) => total + (estimate.lowEstimate || 0), 0) || 0;
    const revenueHigh =
      project.revenueEstimates?.reduce((total, estimate) => total + (estimate.highEstimate || 0), 0) || 0;

    const avgRevenue = (revenueLow + revenueHigh) / 2;
    const smCost = (avgRevenue * (project.smCostPercentage || 0)) / 100;
    const sustainingCost = (project.yearlySustainingCost || 0) * 5;

    const parentProjectCost = developmentCost + sustainingCost + smCost;
    const parentIrr = calculateIRRForProjects(project);

    if (!hasChildren || !project.childProjects || project.childProjects.length === 0) {
      return {
        parentCost: parentProjectCost,
        childrenCost: 0,
        totalCost: parentProjectCost,
        parentRevenueLow: revenueLow,
        parentRevenueHigh: revenueHigh,
        childrenRevenueLow: 0,
        childrenRevenueHigh: 0,
        totalRevenueLow: revenueLow,
        totalRevenueHigh: revenueHigh,
        parentIrr,
        totalIrr: parentIrr,
      };
    }

    let totalChildrenCost = 0;
    let totalChildrenRevenueLow = 0;
    let totalChildrenRevenueHigh = 0;

    project.childProjects.forEach((childProject) => {
      const childDevCost = childProject.totalCost || 0;
      const childSustCost = (childProject.yearlySustainingCost || 0) * 5;

      const childRevLow =
        childProject.revenueEstimates?.reduce((total, estimate) => total + (estimate.lowEstimate || 0), 0) || 0;
      const childRevHigh =
        childProject.revenueEstimates?.reduce((total, estimate) => total + (estimate.highEstimate || 0), 0) || 0;

      const childAvgRevenue = (childRevLow + childRevHigh) / 2;
      const childSmCost = (childAvgRevenue * (childProject.smCostPercentage || 0)) / 100;

      totalChildrenCost += childDevCost + childSustCost + childSmCost;
      totalChildrenRevenueLow += childRevLow;
      totalChildrenRevenueHigh += childRevHigh;
    });

    return {
      parentCost: parentProjectCost,
      childrenCost: totalChildrenCost,
      totalCost: parentProjectCost + totalChildrenCost,
      parentRevenueLow: revenueLow,
      parentRevenueHigh: revenueHigh,
      childrenRevenueLow: totalChildrenRevenueLow,
      childrenRevenueHigh: totalChildrenRevenueHigh,
      totalRevenueLow: revenueLow + totalChildrenRevenueLow,
      totalRevenueHigh: revenueHigh + totalChildrenRevenueHigh,
      parentIrr,
      totalIrr: parentIrr,
    };
  }, [project, hasChildren]);

  const totalCost = `$${formatCompactNumber(financialSummary.totalCost)}`;
  const totalRevenueRange = {
    low: `$${formatCompactNumber(financialSummary.totalRevenueLow)}`,
    high: `$${formatCompactNumber(financialSummary.totalRevenueHigh)}`,
  };

  const parentIrrDisplay = financialSummary.parentIrr !== null ? `${financialSummary.parentIrr.toFixed(1)}%` : "N/A";

  const maturityPercentage = React.useMemo(() => {
    const fields = [
      !!project.riskLevel,
      project.durationQuarters > 0,
      !!project.startYear,
      (project.totalCost || 0) > 0,
      (project.revenueEstimates?.length || 0) > 0,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [project]);

  const getMaturityColor = (percentage: number) => {
    if (percentage < 30) return "bg-red-500";
    if (percentage < 60) return "bg-yellow-500";
    if (percentage < 85) return "bg-blue-500";
    return "bg-green-500";
  };

  const showSummary = hasChildren && (project.childProjects?.length || 0) > 0;

  return (
    <DraggableRow
      id={project.id}
      className={`
        hover:bg-muted/50 cursor-pointer transition-colors relative
        ${isChild ? "bg-gray-100 dark:bg-gray-800/50" : ""}
        ${isBeingDragged ? "opacity-50" : ""}
        ${isDraggedOver ? "border-blue-500 dark:border-blue-400 border-2" : ""}
        ${isPending ? "animate-pulse bg-blue-50 dark:bg-blue-950/30" : ""}
        ${isNavigating ? "opacity-70 cursor-wait" : ""}
      `}
      onClick={handleRowClick}
      onMouseEnter={handleMouseEnter}
    >
      <TableCell className={`font-medium ${project.status === "unfunded" ? "text-opacity-60 text-gray-700 dark:text-gray-300" : ""}`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            {hasChildren ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  if (onToggleChildren) onToggleChildren(project.id);
                }}
                className="w-full h-full flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                aria-label={showChildren ? "Collapse project" : "Expand project"}
              >
                {showChildren ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : null}
          </div>

          <div className="flex items-center">
            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded mr-1" onClick={(event) => event.stopPropagation()}>
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <Circle className={`w-2.5 h-2.5 mr-2 fill-current ${getProjectPhaseDotClass(project)}`} />
            {isPending ? (
              <div className="flex items-center gap-2">
                <span>{project.name || "Unnamed Project"}</span>
                <span className="text-xs text-blue-600">{pendingMessage}</span>
              </div>
            ) : (
              <span className="text-foreground font-medium flex items-center gap-2">
                {project.name || "Unnamed Project"}
                {isNavigating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </span>
            )}
          </div>

          {hasChildren && (project.childProjects?.length || 0) > 0 && (
            <span className="text-xs text-gray-500">({project.childProjects?.length} sub)</span>
          )}
        </div>

        {showSummary && (
          <div className="mt-1 text-xs text-muted-foreground">
            Master project summary includes {project.childProjects?.length} sub-projects
          </div>
        )}
      </TableCell>

      <TableCell>
        <ProjectStatusBadge status={project.status} muted={project.status === "unfunded"} />
      </TableCell>

      <TableCell>
        <div className="text-xs text-muted-foreground">{project.businessUnitName || "Unassigned"}</div>
      </TableCell>

      <TableCell>
        <div className="text-xs text-muted-foreground">
          {formatQuarterYear(project.startQuarter, project.startYear)} - {formatQuarterYear(endQuarter, endYear)}
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className="font-medium">{totalCost}</div>
        <div className="text-xs text-muted-foreground">IRR {parentIrrDisplay}</div>
      </TableCell>

      <TableCell>
        <div className="text-xs text-muted-foreground">
          {totalRevenueRange.low} - {totalRevenueRange.high}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={maturityPercentage} className={`h-2 ${getMaturityColor(maturityPercentage)}`} />
          <span className="text-xs text-muted-foreground">{maturityPercentage}%</span>
        </div>
      </TableCell>

      <TableCell>
        <span className={`text-xs font-medium ${getRiskColorClass(project.riskLevel)}`}>{project.riskLevel || "Unknown"}</span>
      </TableCell>

      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              className="dropdown-trigger p-1 rounded hover:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onEditProject?.(project);
              }}
            >
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}`} onClick={(event) => event.stopPropagation()}>
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </DraggableRow>
  );
});
