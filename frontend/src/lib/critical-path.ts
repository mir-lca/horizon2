/**
 * Critical path calculation using topological sort + forward/backward pass
 */

export interface CriticalPathNode {
  id: string;
  name: string;
  durationDays: number;
  predecessors: string[];
  startDay?: number;
  endDay?: number;
  slack?: number;
  isCritical?: boolean;
}

interface EarlyTimes {
  [id: string]: { es: number; ef: number };
}

interface LateTimes {
  [id: string]: { ls: number; lf: number };
}

function topologicalSort(nodes: CriticalPathNode[]): string[] {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};

  nodes.forEach((n) => {
    inDegree[n.id] = inDegree[n.id] ?? 0;
    adjList[n.id] = adjList[n.id] ?? [];
    n.predecessors.forEach((predId) => {
      inDegree[n.id] = (inDegree[n.id] ?? 0) + 1;
      adjList[predId] = adjList[predId] ?? [];
      adjList[predId].push(n.id);
    });
  });

  const queue = nodes.filter((n) => (inDegree[n.id] ?? 0) === 0).map((n) => n.id);
  const sorted: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    (adjList[id] ?? []).forEach((successor) => {
      inDegree[successor]--;
      if (inDegree[successor] === 0) queue.push(successor);
    });
  }

  return sorted;
}

export function calculateCriticalPath(nodes: CriticalPathNode[]): CriticalPathNode[] {
  if (nodes.length === 0) return [];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const sorted = topologicalSort(nodes);

  // Forward pass
  const early: EarlyTimes = {};
  sorted.forEach((id) => {
    const node = nodeMap.get(id)!;
    const maxPredEf = node.predecessors.length === 0
      ? 0
      : Math.max(...node.predecessors.map((predId) => early[predId]?.ef ?? 0));
    early[id] = { es: maxPredEf, ef: maxPredEf + node.durationDays };
  });

  // Project completion
  const projectEnd = Math.max(...Object.values(early).map((e) => e.ef));

  // Backward pass
  const late: LateTimes = {};
  [...sorted].reverse().forEach((id) => {
    const node = nodeMap.get(id)!;
    const successors = nodes.filter((n) => n.predecessors.includes(id));
    const minSuccLs = successors.length === 0
      ? projectEnd
      : Math.min(...successors.map((s) => late[s.id]?.ls ?? projectEnd));
    late[id] = { ls: minSuccLs - node.durationDays, lf: minSuccLs };
  });

  return nodes.map((node) => {
    const e = early[node.id];
    const l = late[node.id];
    const slack = l && e ? l.ls - e.es : 0;
    return {
      ...node,
      startDay: e?.es,
      endDay: e?.ef,
      slack,
      isCritical: slack === 0,
    };
  });
}
