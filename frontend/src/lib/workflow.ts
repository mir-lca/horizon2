import { query, queryOne, execute, getClient } from './db';
import type { WorkflowInstance, WorkflowEvent, WorkflowDefinition } from './types';

interface DbWorkflowDefinition {
  id: string;
  name: string;
  states: string;
  transitions: string;
}

interface DbWorkflowInstance {
  id: string;
  definition_id: string;
  entity_type: string;
  entity_id: string;
  current_state: string;
  payload: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DbWorkflowEvent {
  id: string;
  instance_id: string;
  from_state: string;
  to_state: string;
  actor: string;
  comment: string | null;
  created_at: string;
}

function mapDefinition(row: DbWorkflowDefinition): WorkflowDefinition {
  return {
    id: row.id,
    name: row.name,
    states: typeof row.states === 'string' ? JSON.parse(row.states) : row.states,
    transitions: typeof row.transitions === 'string' ? JSON.parse(row.transitions) : row.transitions,
  };
}

function mapInstance(row: DbWorkflowInstance, definition?: WorkflowDefinition): WorkflowInstance {
  return {
    id: row.id,
    definitionId: row.definition_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    currentState: row.current_state,
    payload: row.payload ? (typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload) : undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    definition,
  };
}

function mapEvent(row: DbWorkflowEvent): WorkflowEvent {
  return {
    id: row.id,
    instanceId: row.instance_id,
    fromState: row.from_state,
    toState: row.to_state,
    actor: row.actor,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  };
}

export async function createWorkflowInstance(
  definitionName: string,
  entityType: string,
  entityId: string,
  createdBy: string
): Promise<WorkflowInstance> {
  const defRow = await queryOne<DbWorkflowDefinition>(
    'SELECT * FROM workflow_definitions WHERE name = $1',
    [definitionName]
  );
  if (!defRow) throw new Error(`Workflow definition "${definitionName}" not found`);

  const definition = mapDefinition(defRow);
  const initialState = definition.states[0];

  const row = await queryOne<DbWorkflowInstance>(
    `INSERT INTO workflow_instances (definition_id, entity_type, entity_id, current_state, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [defRow.id, entityType, entityId, initialState, createdBy]
  );

  return mapInstance(row!, definition);
}

export async function transitionWorkflow(
  instanceId: string,
  toState: string,
  actor: string,
  comment?: string
): Promise<WorkflowInstance> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const instRow = await client.query<DbWorkflowInstance>(
      'SELECT wi.*, wd.states, wd.transitions FROM workflow_instances wi JOIN workflow_definitions wd ON wd.id = wi.definition_id WHERE wi.id = $1 FOR UPDATE',
      [instanceId]
    );

    if (instRow.rows.length === 0) throw new Error('Workflow instance not found');

    const inst = instRow.rows[0];
    const transitions = typeof inst.transitions === 'string' ? JSON.parse(inst.transitions as string) : (inst as any).transitions;
    const valid = transitions.find((t: { from: string; to: string }) => t.from === inst.current_state && t.to === toState);
    if (!valid) throw new Error(`Invalid transition from "${inst.current_state}" to "${toState}"`);

    await client.query(
      'UPDATE workflow_instances SET current_state = $1, updated_at = now() WHERE id = $2',
      [toState, instanceId]
    );

    await client.query(
      'INSERT INTO workflow_events (instance_id, from_state, to_state, actor, comment) VALUES ($1, $2, $3, $4, $5)',
      [instanceId, inst.current_state, toState, actor, comment ?? null]
    );

    await client.query('COMMIT');

    const updated = await queryOne<DbWorkflowInstance>(
      'SELECT wi.*, wd.states, wd.transitions, wd.name as definition_name FROM workflow_instances wi JOIN workflow_definitions wd ON wd.id = wi.definition_id WHERE wi.id = $1',
      [instanceId]
    );

    const defRow = await queryOne<DbWorkflowDefinition>(
      'SELECT * FROM workflow_definitions WHERE id = $1',
      [updated!.definition_id]
    );

    return mapInstance(updated!, defRow ? mapDefinition(defRow) : undefined);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | null> {
  const row = await queryOne<DbWorkflowInstance>(
    'SELECT wi.* FROM workflow_instances wi WHERE wi.id = $1',
    [instanceId]
  );
  if (!row) return null;

  const defRow = await queryOne<DbWorkflowDefinition>(
    'SELECT * FROM workflow_definitions WHERE id = $1',
    [row.definition_id]
  );

  return mapInstance(row, defRow ? mapDefinition(defRow) : undefined);
}

export async function getWorkflowInstanceForEntity(
  entityType: string,
  entityId: string
): Promise<WorkflowInstance | null> {
  const row = await queryOne<DbWorkflowInstance>(
    'SELECT * FROM workflow_instances WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT 1',
    [entityType, entityId]
  );
  if (!row) return null;

  const defRow = await queryOne<DbWorkflowDefinition>(
    'SELECT * FROM workflow_definitions WHERE id = $1',
    [row.definition_id]
  );

  return mapInstance(row, defRow ? mapDefinition(defRow) : undefined);
}

export async function getWorkflowHistory(instanceId: string): Promise<WorkflowEvent[]> {
  const rows = await query<DbWorkflowEvent>(
    'SELECT * FROM workflow_events WHERE instance_id = $1 ORDER BY created_at ASC',
    [instanceId]
  );
  return rows.map(mapEvent);
}
