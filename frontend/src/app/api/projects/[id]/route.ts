import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { ProjectSchema } from '@/lib/schemas';
import { validateRequest } from '@/lib/api-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projects = await query(`
      SELECT id::text,
             name,
             description,
             business_unit_id::text AS "businessUnitId",
             business_unit_name AS "businessUnitName",
             risk_level AS "riskLevel",
             start_year AS "startYear",
             start_quarter AS "startQuarter",
             duration_quarters AS "durationQuarters",
             minimum_duration_quarters AS "minimumDurationQuarters",
             resource_allocations AS "resourceAllocations",
             total_cost AS "totalCost",
             sm_cost_percentage AS "smCostPercentage",
             yearly_sustaining_cost AS "yearlySustainingCost",
             yearly_sustaining_costs AS "yearlySustainingCosts",
             gross_margin_percentage AS "grossMarginPercentage",
             gross_margin_percentages AS "grossMarginPercentages",
             revenue_estimates AS "revenueEstimates",
             status,
             visible,
             parent_project_id::text AS "parentProjectId",
             master_project_id::text AS "masterProjectId",
             financial_notes AS "financialNotes",
             maturity_level AS "maturityLevel",
             color,
             created_at AS "createdAt",
             updated_at AS "updatedAt"
      FROM projects
      WHERE id = $1
    `, [id]);

    if (projects.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(projects[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await request.json();

    // Validate request body against schema
    const validation = await validateRequest(ProjectSchema, {
      ...payload,
      id, // Ensure ID matches route param
    });

    if (!validation.success) {
      return validation.error;
    }

    const validatedData = validation.data;

    await execute(
      `UPDATE projects SET
        name = $2,
        description = $3,
        business_unit_id = $4,
        business_unit_name = $5,
        risk_level = $6,
        start_year = $7,
        start_quarter = $8,
        duration_quarters = $9,
        minimum_duration_quarters = $10,
        resource_allocations = $11,
        total_cost = $12,
        sm_cost_percentage = $13,
        yearly_sustaining_cost = $14,
        yearly_sustaining_costs = $15,
        gross_margin_percentage = $16,
        gross_margin_percentages = $17,
        revenue_estimates = $18,
        status = $19,
        visible = $20,
        parent_project_id = $21,
        master_project_id = $22,
        financial_notes = $23,
        maturity_level = $24,
        color = $25,
        updated_at = NOW()
      WHERE id = $1`,
      [
        id,
        validatedData.name,
        validatedData.description,
        validatedData.businessUnitId,
        validatedData.businessUnitName,
        validatedData.riskLevel,
        validatedData.startYear,
        validatedData.startQuarter,
        validatedData.durationQuarters,
        validatedData.minimumDurationQuarters,
        JSON.stringify(validatedData.resourceAllocations || []),
        validatedData.totalCost,
        validatedData.smCostPercentage,
        validatedData.yearlySustainingCost,
        JSON.stringify(validatedData.yearlySustainingCosts || []),
        validatedData.grossMarginPercentage,
        JSON.stringify(validatedData.grossMarginPercentages || []),
        JSON.stringify(validatedData.revenueEstimates || []),
        validatedData.status,
        validatedData.visible !== undefined ? validatedData.visible : true,
        validatedData.parentProjectId,
        validatedData.masterProjectId,
        validatedData.financialNotes,
        validatedData.maturityLevel,
        validatedData.color,
      ]
    );

    // Fetch updated project
    const updated = await query(`
      SELECT id::text,
             name,
             description,
             business_unit_id::text AS "businessUnitId",
             business_unit_name AS "businessUnitName",
             risk_level AS "riskLevel",
             start_year AS "startYear",
             start_quarter AS "startQuarter",
             duration_quarters AS "durationQuarters",
             minimum_duration_quarters AS "minimumDurationQuarters",
             resource_allocations AS "resourceAllocations",
             total_cost AS "totalCost",
             sm_cost_percentage AS "smCostPercentage",
             yearly_sustaining_cost AS "yearlySustainingCost",
             yearly_sustaining_costs AS "yearlySustainingCosts",
             gross_margin_percentage AS "grossMarginPercentage",
             gross_margin_percentages AS "grossMarginPercentages",
             revenue_estimates AS "revenueEstimates",
             status,
             visible,
             parent_project_id::text AS "parentProjectId",
             master_project_id::text AS "masterProjectId",
             financial_notes AS "financialNotes",
             maturity_level AS "maturityLevel",
             color,
             created_at AS "createdAt",
             updated_at AS "updatedAt"
      FROM projects
      WHERE id = $1
    `, [id]);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await execute('DELETE FROM projects WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
