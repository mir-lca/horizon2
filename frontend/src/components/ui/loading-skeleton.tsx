"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui";

/**
 * Base skeleton component for animated loading placeholders
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 9 }: { columns?: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

/**
 * Skeleton for full table with header and rows
 */
export function TableSkeleton({ rows = 5, columns = 9 }: { rows?: number; columns?: number }) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Skeleton for metric cards
 */
export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for chart cards
 */
export function ChartCardSkeleton({ height = "320px" }: { height?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for project row (hierarchical table)
 */
export function ProjectRowSkeleton({ isChild = false }: { isChild?: boolean }) {
  return (
    <TableRow>
      <TableCell>
        <div className={cn("flex items-center gap-2", isChild && "pl-6")}>
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-20 ml-auto" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-12 rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * Skeleton for dashboard with Gantt chart and metrics
 */
export function DashboardSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] p-4 sm:p-6 flex gap-6">
      {/* Left side - Gantt chart */}
      <div className="flex-1 min-w-0">
        <Card className="h-full">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Right side - Metrics */}
      <div className="w-[480px] space-y-6 overflow-auto">
        <ChartCardSkeleton />
        <div className="grid grid-cols-2 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Skeleton for projects page with table and filters
 */
export function ProjectsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-3 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <TableSkeleton rows={8} columns={9} />
      </div>
    </div>
  );
}

/**
 * CSS-Based Loading Skeletons (Reference App Pattern)
 * Uses CSS animations from components.css for consistent shimmer effect
 */
interface LoadingSkeletonProps {
  variant: "card" | "table" | "chart";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant, count = 1, className }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("grid gap-4", className)}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="skeleton-card" />
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("skeleton-table", className)}>
        <div className="table-skeleton">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={cn("skeleton-line", index % 2 === 0 && "wide")} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "chart") {
    return <div className={cn("skeleton-chart", className)} />;
  }

  return null;
}

/**
 * Skeleton Grid Component
 * Displays grid of skeleton cards (for dashboard metrics)
 */
interface SkeletonGridProps {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function SkeletonGrid({ count = 4, columns = 2, className }: SkeletonGridProps) {
  const gridClass = columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className={cn("grid gap-4", gridClass, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card" />
      ))}
    </div>
  );
}
