import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
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
      ORDER BY name
    `);

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    if (!payload.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const projectId = randomUUID();

    await execute(
      `
      INSERT INTO projects (
        id,
        name,
        description,
        business_unit_id,
        business_unit_name,
        risk_level,
        start_year,
        start_quarter,
        duration_quarters,
        minimum_duration_quarters,
        resource_allocations,
        total_cost,
        sm_cost_percentage,
        yearly_sustaining_cost,
        yearly_sustaining_costs,
        gross_margin_percentage,
        gross_margin_percentages,
        revenue_estimates,
        status,
        visible,
        parent_project_id,
        master_project_id,
        financial_notes,
        maturity_level,
        color
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25
      )
      `,
      [
        projectId,
        payload.name.trim(),
        payload.description || null,
        payload.businessUnitId || null,
        payload.businessUnitName || null,
        payload.riskLevel || null,
        payload.startYear || null,
        payload.startQuarter || null,
        payload.durationQuarters || null,
        payload.minimumDurationQuarters || null,
        payload.resourceAllocations ? JSON.stringify(payload.resourceAllocations) : null,
        payload.totalCost || null,
        payload.smCostPercentage || null,
        payload.yearlySustainingCost || null,
        payload.yearlySustainingCosts ? JSON.stringify(payload.yearlySustainingCosts) : null,
        payload.grossMarginPercentage || null,
        payload.grossMarginPercentages ? JSON.stringify(payload.grossMarginPercentages) : null,
        payload.revenueEstimates ? JSON.stringify(payload.revenueEstimates) : null,
        payload.status || 'unfunded',
        payload.visible !== undefined ? payload.visible : true,
        payload.parentProjectId || null,
        payload.masterProjectId || null,
        payload.financialNotes || null,
        payload.maturityLevel || null,
        payload.color || null,
      ]
    );

    return NextResponse.json({ id: projectId }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
