/**
 * Financial calculation utilities
 */

import {
  Project,
  RevenueEstimate,
  RiskFactor,
  Competence,
  Resource,
  ResourceAllocation,
  BusinessUnit,
} from "./types";
import {
  calculateProjectTotalRevenue,
  calculateProjectRevenueBounds,
  calculateProjectRevenueForYear,
} from "./revenue-utils";
import { generateQuarterRangeByDates } from "./date-utils";

const DEBUG_IRR = typeof window !== "undefined" && (window as any).DEBUG_IRR_ENABLED === true;
const LOGGED_PROJECTS = new Set<string>();

export function filterValidProjectsForIRR(projects: any[], dateRange?: any): any[] {
  const validProjects: any[] = [];

  projects.forEach((project) => {
    if (!project) return;

    const cashFlows = generateProjectCashFlows(project, dateRange);

    if (!cashFlows || cashFlows.length === 0) {
      return;
    }

    const hasNegative = cashFlows.some((flow) => flow < -1e-10);
    const hasPositive = cashFlows.some((flow) => flow > 1e-10);

    if (!hasNegative || !hasPositive) {
      return;
    }

    validProjects.push(project);
  });

  return validProjects;
}

export function calculateNPV(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((npv, cashFlow, index) => {
    return npv + cashFlow / Math.pow(1 + rate, index);
  }, 0);
}

export function calculateIRR(
  cashFlows: number[],
  guess: number = 0.1,
  tolerance: number = 0.0001,
  maxIterations: number = 100
): number | null {
  if (!cashFlows || !Array.isArray(cashFlows) || cashFlows.length < 2) {
    return null;
  }

  const allZero = cashFlows.every((flow) => Math.abs(flow) < 1e-10);
  if (allZero) {
    return null;
  }

  const hasNegative = cashFlows.some((flow) => flow < -1e-10);
  const hasPositive = cashFlows.some((flow) => flow > 1e-10);

  if (!hasNegative || !hasPositive) {
    return null;
  }

  let rate = guess;

  for (let i = 0; i < maxIterations; i += 1) {
    const npv = calculateNPV(cashFlows, rate);

    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    const derivative = cashFlows.reduce((sum, cashFlow, index) => {
      if (index === 0) return sum;
      return sum - (index * cashFlow) / Math.pow(1 + rate, index + 1);
    }, 0);

    if (Math.abs(derivative) < 1e-10) {
      break;
    }

    const newRate = rate - npv / derivative;

    if (newRate < -0.99 || newRate > 100) {
      return calculateIRRWithBisection(cashFlows, tolerance, maxIterations);
    }

    if (Math.abs(newRate - rate) < 1e-15) {
      return calculateIRRWithBisection(cashFlows, tolerance, maxIterations);
    }

    rate = newRate;
  }

  return calculateIRRWithBisection(cashFlows, tolerance, maxIterations);
}

function calculateIRRWithBisection(
  cashFlows: number[],
  tolerance: number = 0.0001,
  maxIterations: number = 100
): number | null {
  let lowerRate = -0.999;
  let upperRate = 1000;

  const lowerNPV = calculateNPV(cashFlows, lowerRate);
  const upperNPV = calculateNPV(cashFlows, upperRate);

  if ((lowerNPV > 0 && upperNPV > 0) || (lowerNPV < 0 && upperNPV < 0)) {
    return null;
  }

  for (let i = 0; i < maxIterations; i += 1) {
    const midRate = (lowerRate + upperRate) / 2;
    const midNPV = calculateNPV(cashFlows, midRate);

    if (Math.abs(midNPV) < tolerance) {
      return midRate;
    }

    if ((midNPV > 0 && lowerNPV > 0) || (midNPV < 0 && lowerNPV < 0)) {
      lowerRate = midRate;
    } else {
      upperRate = midRate;
    }
  }

  return (lowerRate + upperRate) / 2;
}

export function calculateProjectSustainingCosts(project: Project, forSpecificYear?: number): number {
  const sustainingCostsByYear = calculateModifierCostsByYear(project, "sustaining");
  const enablementCostsByYear = calculateModifierCostsByYear(project, "enablement");

  if (sustainingCostsByYear.size > 0 || enablementCostsByYear.size > 0) {
    if (forSpecificYear !== undefined) {
      const sustainingCost = sustainingCostsByYear.get(forSpecificYear) || 0;
      const enablementCost = enablementCostsByYear.get(forSpecificYear) || 0;
      return sustainingCost + enablementCost;
    }
    let total = 0;
    for (const cost of sustainingCostsByYear.values()) {
      total += cost;
    }
    for (const cost of enablementCostsByYear.values()) {
      total += cost;
    }
    return total;
  }

  if (forSpecificYear !== undefined) {
    const projectEndYear =
      project.startYear + Math.floor((project.startQuarter + project.durationQuarters - 1) / 4);
    const relativeYear = forSpecificYear - projectEndYear + 1;

    if (Array.isArray(project.yearlySustainingCosts)) {
      const yearCost = project.yearlySustainingCosts.find((cost) => cost.relativeYear === relativeYear);
      if (yearCost) {
        return yearCost.value || 0;
      }
    } else if (typeof project.yearlySustainingCosts === "object" && project.yearlySustainingCosts !== null) {
      const cost = (project.yearlySustainingCosts as { [year: number]: number })[forSpecificYear];
      if (typeof cost === "number") {
        return cost;
      }
    }

    if (relativeYear > 0 && relativeYear <= (project.revenueEstimates?.length || 0)) {
      const legacyCost = typeof project.yearlySustainingCost === "number" ? project.yearlySustainingCost : 0;
      return legacyCost;
    }

    return 0;
  }

  if (Array.isArray(project.yearlySustainingCosts)) {
    return project.yearlySustainingCosts.reduce((sum, item) => sum + (item.value || 0), 0);
  }
  if (typeof project.yearlySustainingCosts === "object" && project.yearlySustainingCosts !== null) {
    return Object.values(project.yearlySustainingCosts as { [year: number]: number }).reduce(
      (sum, value) => sum + (typeof value === "number" ? value : 0),
      0
    );
  }

  const years = project.revenueEstimates?.length || 0;
  const legacyCostPerYear = typeof project.yearlySustainingCost === "number" ? project.yearlySustainingCost : 0;
  return legacyCostPerYear * years;
}

export function calculateTotalSustainingCosts(projects: any[], forSpecificYear?: number): number {
  return projects.reduce((sum, project) => sum + calculateProjectSustainingCosts(project, forSpecificYear), 0);
}

export function calculateModifierCostsByYear(project: Project, modifier: string): Map<number, number> {
  const yearCosts = new Map<number, number>();

  if (!project.resourceAllocations || !Array.isArray(project.resourceAllocations)) {
    return yearCosts;
  }

  const totalPercentage = project.resourceAllocations.reduce((sum, alloc) => {
    return "relativeQuarter" in alloc ? sum + alloc.allocationPercentage : sum;
  }, 0);

  if (totalPercentage <= 0) return yearCosts;

  const { startYear, startQuarter } = project;

  project.resourceAllocations.forEach((allocation) => {
    if ("relativeQuarter" in allocation && (allocation.modifier || "development") === modifier) {
      const cost = (allocation.allocationPercentage / totalPercentage) * project.totalCost;
      const absoluteQuarter = startYear * 4 + (startQuarter - 1) + (allocation.relativeQuarter - 1);
      const year = Math.floor(absoluteQuarter / 4);
      yearCosts.set(year, (yearCosts.get(year) || 0) + cost);
    }
  });

  return yearCosts;
}

export function createYearlySustainingCostsMap(project: Project): { [year: number]: number } {
  const result: { [year: number]: number } = {};

  const projectEndYear =
    project.startYear + Math.floor((project.startQuarter + project.durationQuarters - 1) / 4);
  const projectEndQuarter = ((project.startQuarter + project.durationQuarters - 1) % 4) + 1;
  const revenueStartYear = projectEndQuarter === 4 ? projectEndYear + 1 : projectEndYear;

  const sustainingCostsByYear = calculateModifierCostsByYear(project, "sustaining");
  const enablementCostsByYear = calculateModifierCostsByYear(project, "enablement");

  const allocationBasedCosts = new Map<number, number>();
  for (const [year, cost] of sustainingCostsByYear) {
    allocationBasedCosts.set(year, cost);
  }
  for (const [year, cost] of enablementCostsByYear) {
    allocationBasedCosts.set(year, (allocationBasedCosts.get(year) || 0) + cost);
  }

  if (allocationBasedCosts.size > 0) {
    for (const [year, cost] of allocationBasedCosts) {
      result[year] = cost;
    }
    return result;
  }

  if (Array.isArray(project.yearlySustainingCosts)) {
    project.yearlySustainingCosts.forEach((yearCost) => {
      const calendarYear = yearCost.calendarYear || revenueStartYear + yearCost.relativeYear - 1;
      result[calendarYear] = yearCost.value || 0;
    });
  } else if (typeof project.yearlySustainingCosts === "object" && project.yearlySustainingCosts !== null) {
    Object.entries(project.yearlySustainingCosts).forEach(([yearStr, value]) => {
      const year = Number.parseInt(yearStr, 10);
      if (!Number.isNaN(year)) {
        result[year] = typeof value === "number" ? value : 0;
      }
    });
  } else if (project.revenueEstimates && project.revenueEstimates.length > 0) {
    project.revenueEstimates.forEach((estimate) => {
      const calendarYear = estimate.calendarYear || revenueStartYear + estimate.relativeYear - 1;
      result[calendarYear] = typeof project.yearlySustainingCost === "number" ? project.yearlySustainingCost : 0;
    });
  }

  return result;
}

export function calculateQuarterDate(startYear: number, startQuarter: number, relativeQuarter: number) {
  const absoluteQuarter = startYear * 4 + (startQuarter - 1) + (relativeQuarter - 1);
  const year = Math.floor(absoluteQuarter / 4);
  const quarter = (absoluteQuarter % 4) + 1;
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(Date.UTC(year, startMonth, 1));
  const endDate = new Date(Date.UTC(year, startMonth + 3, 0));

  return {
    year,
    quarter,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

export function generateProjectCashFlows(project: Project, dateRange?: any): number[] {
  if (!project) return [];

  const durationQuarters = project.durationQuarters || 0;
  const devCostPerQuarter = durationQuarters > 0 ? project.totalCost / durationQuarters : 0;

  const revenueYears = project.revenueEstimates?.length || 0;
  const grossMargin =
    project.grossMarginPercentage ??
    (Array.isArray(project.grossMarginPercentages) && project.grossMarginPercentages.length > 0
      ? project.grossMarginPercentages[0].value
      : 50);
  const smCostPercentage = project.smCostPercentage ?? 0;

  const totalRevenueYears = Math.max(5, revenueYears);
  const totalQuarters = durationQuarters + totalRevenueYears * 4;

  const cashFlows: number[] = [];

  for (let q = 1; q <= totalQuarters; q += 1) {
    const isDevelopment = q <= durationQuarters;
    const relativeRevenueQuarter = q - durationQuarters;
    const revenueYear = Math.ceil(relativeRevenueQuarter / 4);
    const revenueEstimate = project.revenueEstimates?.find((rev) => rev.relativeYear === revenueYear);
    const avgRevenue = revenueEstimate ? (revenueEstimate.lowEstimate + revenueEstimate.highEstimate) / 2 : 0;
    const revenuePerQuarter = avgRevenue / 4;

    const sustainingCost =
      !isDevelopment && revenueYear > 0
        ? calculateProjectSustainingCosts(project, project.startYear + durationQuarters / 4 + revenueYear - 1) / 4
        : 0;

    const grossProfit = revenuePerQuarter * (grossMargin / 100);
    const smCost = revenuePerQuarter * (smCostPercentage / 100);
    const developmentCost = isDevelopment ? devCostPerQuarter : 0;

    const cashFlow = grossProfit - (developmentCost + sustainingCost + smCost);
    cashFlows.push(cashFlow);
  }

  return cashFlows;
}

export function calculateIRRForProjects(projectOrProjects: any | any[], dateRange?: any): number | null {
  if (Array.isArray(projectOrProjects)) {
    if (!projectOrProjects || projectOrProjects.length === 0) {
      return null;
    }

    const validProjects = filterValidProjectsForIRR(projectOrProjects, dateRange);
    if (validProjects.length === 0) {
      return null;
    }

    if (validProjects.length === 1) {
      const cashFlows = generateProjectCashFlows(validProjects[0], dateRange);
      const irr = calculateIRR(cashFlows);
      return irr !== null ? irr * 100 : null;
    }

    const combinedCashFlows: number[] = [];
    validProjects.forEach((project) => {
      const flows = generateProjectCashFlows(project, dateRange);
      flows.forEach((flow, idx) => {
        combinedCashFlows[idx] = (combinedCashFlows[idx] || 0) + flow;
      });
    });

    const irr = calculateIRR(combinedCashFlows);
    return irr !== null ? irr * 100 : null;
  }

  const cashFlows = generateProjectCashFlows(projectOrProjects, dateRange);
  const irr = calculateIRR(cashFlows);
  return irr !== null ? irr * 100 : null;
}

export function createAggregateYearlySustainingCosts(
  projects: any[],
  startYear: number,
  startQuarter: number,
  endYear: number
) {
  const result: { [year: number]: number } = {};
  projects.forEach((project) => {
    const map = createYearlySustainingCostsMap(project);
    Object.entries(map).forEach(([yearStr, value]) => {
      const year = Number.parseInt(yearStr, 10);
      if (year >= startYear && year <= endYear) {
        result[year] = (result[year] || 0) + (value || 0);
      }
    });
  });
  return result;
}

export function calculateTotalActiveCost(projects: Project[]): number {
  return projects
    .filter((project) => project.status === "active" || project.status === "funded")
    .reduce((sum, project) => sum + (project.totalCost || 0), 0);
}

export function calculateResourceCostsByYear(project: Project, resources: Resource[]): Map<number, number> {
  const costsByYear = new Map<number, number>();

  if (!project.resourceAllocations || !Array.isArray(project.resourceAllocations)) {
    return costsByYear;
  }

  project.resourceAllocations.forEach((allocation) => {
    if (!("relativeQuarter" in allocation)) {
      return;
    }
    const resource = resources.find((item) => item.id === allocation.resourceId);
    const wage = resource?.yearlyWage || 0;
    const absoluteQuarter = project.startYear * 4 + (project.startQuarter - 1) + (allocation.relativeQuarter - 1);
    const year = Math.floor(absoluteQuarter / 4);
    const costPerQuarter = (wage / 4) * (allocation.allocationPercentage / 100);
    costsByYear.set(year, (costsByYear.get(year) || 0) + costPerQuarter);
  });

  return costsByYear;
}

export function debugResourceAllocations(project: Project): void {
  if (!DEBUG_IRR || !project) return;
  if (LOGGED_PROJECTS.has(project.id)) return;
  LOGGED_PROJECTS.add(project.id);
  console.log("[resource-allocations]", project.name, project.resourceAllocations || []);
}

export function analyzeResourceAllocations(project: Project) {
  const totals = { development: 0, sustaining: 0, enablement: 0 };
  if (!project.resourceAllocations || !Array.isArray(project.resourceAllocations)) {
    return totals;
  }
  project.resourceAllocations.forEach((allocation) => {
    if (!("relativeQuarter" in allocation)) return;
    const modifier = allocation.modifier || "development";
    totals[modifier as keyof typeof totals] += allocation.allocationPercentage || 0;
  });
  return totals;
}

export function calculateDevelopmentCostPageMethod(project: Project, resources: Resource[]): number {
  try {
    if (!project.resourceAllocations || !Array.isArray(project.resourceAllocations)) {
      return project.totalCost || 0;
    }
    let totalCost = 0;
    project.resourceAllocations.forEach((allocation) => {
      if (!("relativeQuarter" in allocation)) return;
      const modifier = allocation.modifier || "development";
      if (modifier !== "development") return;
      const resource = resources.find((item) => item.id === allocation.resourceId);
      const wage = resource?.yearlyWage || 0;
      const costPerQuarter = (wage / 4) * (allocation.allocationPercentage / 100);
      totalCost += costPerQuarter;
    });
    return Math.round(totalCost);
  } catch (error) {
    console.error("[calculateDevelopmentCostPageMethod] Error calculating cost:", error);
    return project.totalCost || 0;
  }
}

export interface CashFlowParams {
  revenueLow: number;
  revenueHigh: number;
  developmentCost?: number;
  sustainingCost?: number;
  smCostPercentage?: number;
  grossMarginPercentage?: number;
}

export function calculatePeriodCashFlow(params: CashFlowParams): number {
  const {
    revenueLow = 0,
    revenueHigh = 0,
    developmentCost = 0,
    sustainingCost = 0,
    smCostPercentage = 0,
    grossMarginPercentage = 100,
  } = params;

  const avgRevenue = (revenueLow + revenueHigh) / 2;
  const grossProfit = avgRevenue * (grossMarginPercentage / 100);
  const smCost = avgRevenue * (smCostPercentage / 100);
  const totalCosts = developmentCost + sustainingCost + smCost;
  return grossProfit - totalCosts;
}

export function calculateCumulativeCashFlow(periodCashFlows: number[]): number[] {
  let cumulative = 0;
  return periodCashFlows.map((flow) => {
    cumulative += flow;
    return cumulative;
  });
}

export function calculateCashFlows(periods: CashFlowParams[]): {
  periodCashFlows: number[];
  cumulativeCashFlows: number[];
} {
  const periodCashFlows = periods.map((params) => calculatePeriodCashFlow(params));
  const cumulativeCashFlows = calculateCumulativeCashFlow(periodCashFlows);
  return { periodCashFlows, cumulativeCashFlows };
}

export function createAggregateProject(projects: Project[], dateRange?: any): Project | null {
  if (!projects || projects.length === 0) return null;

  const visibleProjects = projects.filter((project) => project.visible !== false);
  if (visibleProjects.length === 0) return null;

  const earliestStart = visibleProjects.reduce((min, project) => {
    const value = project.startYear * 4 + (project.startQuarter - 1);
    return Math.min(min, value);
  }, Number.MAX_SAFE_INTEGER);

  const startYear = Math.floor(earliestStart / 4);
  const startQuarter = (earliestStart % 4) + 1;

  const totalCost = visibleProjects.reduce((sum, project) => sum + (project.totalCost || 0), 0);
  const revenueEstimates: RevenueEstimate[] = [];

  visibleProjects.forEach((project) => {
    project.revenueEstimates?.forEach((estimate) => {
      const existing = revenueEstimates.find((item) => item.relativeYear === estimate.relativeYear);
      if (existing) {
        existing.lowEstimate += estimate.lowEstimate;
        existing.highEstimate += estimate.highEstimate;
      } else {
        revenueEstimates.push({ ...estimate });
      }
    });
  });

  return {
    id: "aggregate",
    type: "project",
    name: "Aggregate Project",
    description: "Aggregated portfolio",
    businessUnitId: "all",
    riskLevel: RiskFactor.Medium,
    startYear,
    startQuarter,
    durationQuarters: visibleProjects.reduce((max, project) => Math.max(max, project.durationQuarters || 0), 0),
    totalCost,
    status: "active",
    revenueEstimates,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function calculatePortfolioHiringInvestment({
  competences,
  resources,
  resourceAllocations,
  projects,
  businessUnits,
  projectVisibility,
  selectedBusinessUnit,
  dateRange,
}: {
  competences: Competence[];
  resources: Resource[];
  resourceAllocations: ResourceAllocation[];
  projects: Project[];
  businessUnits: BusinessUnit[];
  projectVisibility: Record<string, boolean>;
  selectedBusinessUnit: string;
  dateRange: { startYear: number; startQuarter: number; endYear: number; endQuarter: number };
}) {
  if (!resourceAllocations || resourceAllocations.length === 0) {
    return 0;
  }

  const visibleProjects = projects.filter((project) => projectVisibility[project.id] !== false);
  const visibleProjectIds = new Set(visibleProjects.map((project) => project.id));
  const allocations = resourceAllocations.filter((allocation) => visibleProjectIds.has(allocation.projectId));

  const costByCompetence: Record<string, number> = {};
  allocations.forEach((allocation) => {
    const resource = resources.find((item) => item.id === allocation.resourceId);
    const wage = resource?.yearlyWage || 0;
    const cost = (wage / 4) * (allocation.allocationPercentage / 100);
    costByCompetence[resource?.competenceId || "unknown"] =
      (costByCompetence[resource?.competenceId || "unknown"] || 0) + cost;
  });

  return Object.values(costByCompetence).reduce((sum, value) => sum + value, 0);
}

export { calculateProjectTotalRevenue, calculateProjectRevenueBounds, calculateProjectRevenueForYear };

