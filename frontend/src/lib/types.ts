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

export interface ProjectDocument {
  id: string;
  title: string;
  url: string;
  type: 'sharepoint' | 'link' | 'file';
  addedAt: string;
  addedBy?: string;
}

export interface Project extends CosmosDocument {
  name: string;
  description?: string;
  businessUnitId: string; // Stores org data BU ID (e.g., "ur", "mir", "robotics")
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
  spendRecords?: SpendRecord[];
  costBreakdown?: Record<string, any>;
  documents?: ProjectDocument[];
  createdAt: string;
  updatedAt: string;
  type: "project";
}

export interface EmployeeReference {
  employeeId: string;
  email: string;
  displayName: string;
  jobTitle?: string;
  businessUnit?: string;
  businessUnitId?: string;
  division?: string;
  allocationFte: number;
  linkedAt: string;
}

export interface Resource extends CosmosDocument {
  resourceType?: string;
  competenceId: string;
  competenceName: string;
  quantity: number;
  yearlyWage: number;
  businessUnitId: string; // Stores org data BU ID (e.g., "ur", "mir")
  skills?: string[];
  name?: string;
  isAI?: boolean;
  employeeReferences?: EmployeeReference[]; // Optional employee linking
  archivedAt?: string;
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

// REMOVED: BusinessUnit interface - BUs are now fetched from org data, not stored in Horizon
// Use OrgDataBusinessUnit instead (see below)

/**
 * Org Data Types - These represent data from org-data-sync-function
 */

export interface OrgDataEmployee {
  id: string;
  email: string;
  displayName: string;
  givenName: string;
  surname: string;
  jobTitle: string;
  division: string;
  divisionId: string;
  businessUnit: string;
  businessUnitId: string;
  functionCategory: string;
  managerId: string;
  managerEmail: string;
}

export interface OrgDataFunction {
  id: string;
  name: string;
  headcount: number;
}

export interface OrgDataBusinessUnit {
  id: string; // e.g., "ur", "mir"
  name: string; // e.g., "Universal Robots (UR)"
  headcount: number;
  division: string;
  divisionId: string;
  functions: OrgDataFunction[];
}

export interface OrgDataDivision {
  id: string; // e.g., "robotics"
  name: string; // e.g., "Robotics"
  headcount: number;
  businessUnits: OrgDataBusinessUnit[];
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

export interface LegacyScenario extends CosmosDocument {
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

// PPM extended types

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'at_risk';
  description?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Risk {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  probability?: 'low' | 'medium' | 'high';
  impact?: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'mitigated' | 'closed' | 'accepted';
  owner?: string;
  mitigation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  states: string[];
  transitions: Array<{ from: string; to: string; label: string }>;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  entityType: string;
  entityId: string;
  currentState: string;
  payload?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  definition?: WorkflowDefinition;
}

export interface WorkflowEvent {
  id: string;
  instanceId: string;
  fromState: string;
  toState: string;
  actor: string;
  comment?: string;
  createdAt: string;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  baseType: string;
  baseId?: string;
  status: 'draft' | 'published' | 'archived';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioOverride {
  id: string;
  scenarioId: string;
  projectId: string;
  startYear?: number;
  startQuarter?: number;
  durationQuarters?: number;
  totalCost?: number;
  status?: string;
  visible?: boolean;
  revenueEstimates?: RevenueEstimate[];
  extraOverrides?: Record<string, any>;
}

export interface Okr {
  id: string;
  title: string;
  description?: string;
  type: 'objective' | 'key_result';
  parentId?: string;
  owner?: string;
  targetValue?: number;
  unit?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  children?: Okr[];
}

export interface ProjectOkrLink {
  projectId: string;
  okrId: string;
  contributionWeight: number;
}

export interface ProjectDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  lagDays: number;
  dependencyType: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}

export interface CapitalAsset {
  id: string;
  name: string;
  assetType: string;
  projectId?: string;
  value?: number;
  depreciationSchedule?: Record<string, any>;
  location?: string;
  status?: string;
  owner?: string;
  calibrationDue?: string;
  notes?: string;
  customAttributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  id: string;
  name: string;
  conditionType: string;
  conditionConfig: Record<string, any>;
  notificationChannels: string[];
  escalationHours?: number;
  active: boolean;
  createdAt: string;
}

export interface CustomAttributeDefinition {
  id: string;
  key: string;
  label: string;
  fieldType: 'text' | 'number' | 'select' | 'boolean' | 'date';
  options?: string[];
  appliesTo: string[];
  required: boolean;
  sortOrder: number;
}

export interface ProjectCalendar {
  id: string;
  name: string;
  year: number;
  blackoutDates: string[];
  holidays: Array<{ date: string; name: string }>;
  appliesTo: string[];
}

export interface SpendRecord {
  date?: string;
  period?: string;
  category: string;
  amount: number;
  type: 'realized' | 'pending';
  soNumber?: string;
  poNumber?: string;
  status?: string;
  realizationDate?: string;
}
