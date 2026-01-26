import { z } from "zod";

// Enums
export const RiskFactorSchema = z.enum(["low", "medium", "high", "critical"]);

export const AllocationModifierSchema = z.enum([
  "development",
  "sustaining",
  "enablement",
]);

export const ProjectStatusSchema = z.enum([
  "unfunded",
  "funded",
  "active",
  "completed",
]);

// Nested objects
export const RevenueEstimateSchema = z.object({
  relativeYear: z.number(),
  lowEstimate: z.number(),
  highEstimate: z.number(),
  _actualYear: z.number().optional(),
  revenueStartYear: z.number().optional(),
  revenueStartQuarter: z.number().optional(),
  calendarYear: z.number().optional(),
  calendarQuarter: z.number().optional(),
});

export const YearlyFinancialMetricSchema = z.object({
  relativeYear: z.number(),
  value: z.number(),
  calendarYear: z.number().optional(),
});

export const ResourceAllocationItemSchema = z.object({
  resourceId: z.string(),
  competenceId: z.string(),
  relativeQuarter: z.number(),
  allocationPercentage: z.number(),
  role: z.string().optional(),
  modifier: AllocationModifierSchema.optional(),
});

// Main entity schemas
export const BusinessUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parentUnitId: z.string().optional(),
  type: z.literal("business-unit"),
  _rid: z.string().optional(),
  _self: z.string().optional(),
  _etag: z.string().optional(),
  _attachments: z.string().optional(),
  _ts: z.number().optional(),
});

export const CompetenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  averageSalary: z.number().optional(),
  type: z.literal("competence"),
  _rid: z.string().optional(),
  _self: z.string().optional(),
  _etag: z.string().optional(),
  _attachments: z.string().optional(),
  _ts: z.number().optional(),
});

export const ResourceSchema = z.object({
  id: z.string(),
  resourceType: z.string().optional(),
  competenceId: z.string(),
  competenceName: z.string(),
  quantity: z.number(),
  yearlyWage: z.number(),
  businessUnitId: z.string(),
  businessUnitName: z.string(),
  skills: z.array(z.string()).optional(),
  name: z.string().optional(),
  isAI: z.boolean().optional(),
  type: z.literal("resource"),
  _rid: z.string().optional(),
  _self: z.string().optional(),
  _etag: z.string().optional(),
  _attachments: z.string().optional(),
  _ts: z.number().optional(),
});

// Project schema with normalized types (fixing the ambiguous properties)
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  businessUnitId: z.string(),
  businessUnitName: z.string().optional(),
  riskLevel: RiskFactorSchema,
  startYear: z.number(),
  startQuarter: z.number(),
  durationQuarters: z.number(),
  minimumDurationQuarters: z.number().optional(),
  // Normalized as array only
  resourceAllocations: z.array(ResourceAllocationItemSchema).optional(),
  totalCost: z.number(),
  smCostPercentage: z.number().optional(),
  yearlySustainingCost: z.number().optional(),
  // Normalized as array only
  yearlySustainingCosts: z.array(YearlyFinancialMetricSchema).optional(),
  grossMarginPercentage: z.number().optional(),
  // Normalized as array only
  grossMarginPercentages: z.array(YearlyFinancialMetricSchema).optional(),
  revenueEstimates: z.array(RevenueEstimateSchema).optional(),
  status: ProjectStatusSchema,
  visible: z.boolean().optional(),
  funded: z.boolean().optional(),
  parentProjectId: z.string().optional(),
  masterProjectId: z.string().optional(),
  financialNotes: z.string().optional(),
  maturityLevel: z.number().optional(),
  color: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  type: z.literal("project"),
  _rid: z.string().optional(),
  _self: z.string().optional(),
  _etag: z.string().optional(),
  _attachments: z.string().optional(),
  _ts: z.number().optional(),
});

// API response schemas (can differ from internal types)
export const ProjectApiResponseSchema = z.array(ProjectSchema);
export const ResourceApiResponseSchema = z.array(ResourceSchema);
export const BusinessUnitApiResponseSchema = z.array(BusinessUnitSchema);
export const CompetenceApiResponseSchema = z.array(CompetenceSchema);

// Type exports for use in TypeScript
export type ValidatedProject = z.infer<typeof ProjectSchema>;
export type ValidatedResource = z.infer<typeof ResourceSchema>;
export type ValidatedBusinessUnit = z.infer<typeof BusinessUnitSchema>;
export type ValidatedCompetence = z.infer<typeof CompetenceSchema>;
