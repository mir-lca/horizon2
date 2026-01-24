/**
 * Project management data types
 */

export interface CosmosDocument {
  id: string;
  type: string;
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}

export enum RiskFactor {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export interface RevenueEstimate {
  relativeYear: number;
  lowEstimate: number;
  highEstimate: number;
  _actualYear?: number;
  revenueStartYear?: number;
  revenueStartQuarter?: number;
  calendarYear?: number;
  calendarQuarter?: number;
}

export interface YearlyFinancialMetric {
  relativeYear: number;
  value: number;
  calendarYear?: number;
}

export enum AllocationModifier {
  Development = "development",
  Sustaining = "sustaining",
  Enablement = "enablement",
}

export interface ResourceAllocationItem {
  resourceId: string;
  competenceId: string;
  relativeQuarter: number;
  allocationPercentage: number;
  role?: string;
  modifier?: AllocationModifier;
}

export interface Project extends CosmosDocument {
  name: string;
  description?: string;
  businessUnitId: string;
  businessUnitName?: string;
  riskLevel: RiskFactor;
  startYear: number;
  startQuarter: number;
  durationQuarters: number;
  minimumDurationQuarters?: number;
  resourceAllocations?: ResourceAllocation[] | ResourceAllocationItem[];
  totalCost: number;
  smCostPercentage?: number;
  yearlySustainingCost?: number;
  yearlySustainingCosts?: { [year: number]: number } | YearlyFinancialMetric[];
  grossMarginPercentage?: number;
  grossMarginPercentages?: YearlyFinancialMetric[];
  revenueEstimates?: RevenueEstimate[];
  status: "unfunded" | "funded" | "active" | "completed";
  visible?: boolean;
  funded?: boolean;
  parentProjectId?: string;
  masterProjectId?: string;
  financialNotes?: string;
  maturityLevel?: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  type: "project";
}

export interface Resource extends CosmosDocument {
  resourceType?: string;
  competenceId: string;
  competenceName: string;
  quantity: number;
  yearlyWage: number;
  businessUnitId: string;
  businessUnitName: string;
  skills?: string[];
  name?: string;
  isAI?: boolean;
  type: "resource";
}

export interface ResourceAllocation extends CosmosDocument {
  resourceId: string;
  projectId: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
  modifier?: AllocationModifier;
  type: "resource-allocation";
}

export interface BusinessUnit extends CosmosDocument {
  name: string;
  description?: string;
  parentUnitId?: string;
  type: "business-unit";
}

export interface Competence extends CosmosDocument {
  name: string;
  description?: string;
  category?: string;
  averageSalary?: number;
  type: "competence";
}

export interface Metadata extends CosmosDocument {
  key: string;
  value: any;
  description?: string;
  type: "metadata";
}

export interface FinancialMetric extends CosmosDocument {
  name: string;
  description?: string;
  unit: string;
  target?: number;
}

export interface RiskAdjustment extends CosmosDocument {
  projectId: string;
  factor: number;
  reason: string;
  appliedDate: string;
}

export interface AnalysisTimeframe extends CosmosDocument {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface Scenario extends CosmosDocument {
  name: string;
  description: string;
  projectId: string;
  adjustments: Array<{
    metricName: string;
    factor: number;
  }>;
}

export interface GlobalSettings extends CosmosDocument {
  dateRangeStart: string;
  dateRangeEnd: string;
  businessUnits: string[];
  defaultCurrency: string;
}

export interface YearlyRevenue extends CosmosDocument {
  projectId: string | number;
  year: number;
  amount?: string;
  amountLow?: string;
  amountHigh?: string;
  createdAt: string;
  updatedAt: string;
  type: "yearly-revenue";
}

export interface YearlyCost extends CosmosDocument {
  projectId: string | number;
  year: number;
  amount?: string;
  costType?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  type: "yearly-cost";
}

export interface RelativeYearRevenue {
  relativeYear: number;
  amountLow: string | number;
  amountHigh: string | number;
}

export interface ProjectRelativeRevenue extends CosmosDocument {
  projectId: number | string;
  revenueYears: RelativeYearRevenue[];
  revenueStartQuarter: number;
  createdAt: string;
  updatedAt: string;
  type: "project-relative-revenue";
}

export interface FeedbackItem extends CosmosDocument {
  title: string;
  description: string;
  category: "feature" | "bug";
  votes: number;
  status: "open" | "completed" | "declined";
  createdAt: string;
  sourcePage?: string;
  voterIds?: string[];
  type: "feedback-item";
}
