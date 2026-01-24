import { Project } from "./types";

export interface RevenueCalculationOptions {
  dateRange?: {
    startYear: number;
    startQuarter: number;
    endYear: number;
    endQuarter: number;
  };
  includePartialYears?: boolean;
  useExpectedRevenue?: boolean;
}

export interface ProjectRevenueBounds {
  low: number;
  high: number;
  expected?: number;
}

export interface YearlyRevenueResult {
  year: number;
  revenue: number;
  revenueType: "low" | "high" | "expected";
  isPartialYear?: boolean;
  quartersCovered?: number;
}

export function calculateProjectTotalRevenue(project: Project, options: RevenueCalculationOptions = {}): number {
  if (!project.revenueEstimates || project.revenueEstimates.length === 0) {
    return 0;
  }

  return project.revenueEstimates.reduce((total, estimate) => {
    const revenue = options.useExpectedRevenue
      ? (estimate.lowEstimate + estimate.highEstimate) / 2
      : estimate.highEstimate;
    return total + revenue;
  }, 0);
}

export function calculateProjectRevenueBounds(project: Project): ProjectRevenueBounds {
  if (!project.revenueEstimates || project.revenueEstimates.length === 0) {
    return { low: 0, high: 0, expected: 0 };
  }

  const low = project.revenueEstimates.reduce((sum, estimate) => sum + estimate.lowEstimate, 0);
  const high = project.revenueEstimates.reduce((sum, estimate) => sum + estimate.highEstimate, 0);
  const expected = (low + high) / 2;

  return { low, high, expected };
}

export function calculateProjectRevenueForYear(
  project: Project,
  targetYear: number,
  options: RevenueCalculationOptions = {}
): YearlyRevenueResult | null {
  if (!project.revenueEstimates || project.revenueEstimates.length === 0) {
    return null;
  }

  const estimate = project.revenueEstimates.find((rev) => {
    const revenueYear = project.startYear + rev.relativeYear - 1;
    return revenueYear === targetYear;
  });

  if (!estimate) {
    return null;
  }

  const revenueYear = project.startYear + estimate.relativeYear - 1;
  let revenue: number;
  let revenueType: "low" | "high" | "expected";

  if (options.useExpectedRevenue) {
    revenue = (estimate.lowEstimate + estimate.highEstimate) / 2;
    revenueType = "expected";
  } else {
    revenue = estimate.highEstimate;
    revenueType = "high";
  }

  let isPartialYear = false;
  let quartersCovered = 4;

  if (options.includePartialYears && options.dateRange) {
    const { startYear, startQuarter, endYear, endQuarter } = options.dateRange;
    if (revenueYear === startYear && startQuarter > 1) {
      quartersCovered = 4 - startQuarter + 1;
      isPartialYear = true;
    } else if (revenueYear === endYear && endQuarter < 4) {
      quartersCovered = endQuarter;
      isPartialYear = true;
    }
    if (isPartialYear) {
      revenue = (revenue * quartersCovered) / 4;
    }
  }

  return {
    year: revenueYear,
    revenue,
    revenueType,
    isPartialYear,
    quartersCovered,
  };
}
