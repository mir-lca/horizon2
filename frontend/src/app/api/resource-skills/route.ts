import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DbResourceSkill {
  id: string;
  resource_id: string;
  skill_id: string;
  level: string | null;
  project_id: string | null;
  valid_from: string | null;
  valid_to: string | null;
  skill_name: string | null;
  skill_category: string | null;
}

function mapResourceSkill(row: DbResourceSkill) {
  return {
    id: row.id,
    resourceId: row.resource_id,
    skillId: row.skill_id,
    level: row.level,
    projectId: row.project_id,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    skillName: row.skill_name,
    skillCategory: row.skill_category,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get('resourceId');

  try {
    const rows = await query<DbResourceSkill>(
      resourceId
        ? `SELECT rs.*, s.name AS skill_name, s.category AS skill_category
           FROM resource_skills rs
           LEFT JOIN skills s ON s.id = rs.skill_id
           WHERE rs.resource_id = $1
           ORDER BY rs.valid_from ASC NULLS LAST`
        : `SELECT rs.*, s.name AS skill_name, s.category AS skill_category
           FROM resource_skills rs
           LEFT JOIN skills s ON s.id = rs.skill_id
           ORDER BY rs.valid_from ASC NULLS LAST`,
      resourceId ? [resourceId] : []
    );
    return NextResponse.json(rows.map(mapResourceSkill));
  } catch (error) {
    console.error('GET /api/resource-skills error:', error);
    return NextResponse.json({ error: 'Failed to fetch resource skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, skillId, level, projectId, validFrom, validTo } = body;

    if (!resourceId || !skillId) {
      return NextResponse.json({ error: 'resourceId and skillId are required' }, { status: 400 });
    }

    const id = uuidv4();
    const row = await query<DbResourceSkill>(
      `INSERT INTO resource_skills (id, resource_id, skill_id, level, project_id, valid_from, valid_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, resourceId, skillId, level || null, projectId || null, validFrom || null, validTo || null]
    );

    return NextResponse.json(mapResourceSkill(row[0]), { status: 201 });
  } catch (error) {
    console.error('POST /api/resource-skills error:', error);
    return NextResponse.json({ error: 'Failed to create resource skill' }, { status: 500 });
  }
}
