export interface MsProjectTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  percentComplete: number;
  predecessors: string[];
  resourceNames: string[];
  isMilestone: boolean;
  notes?: string;
}

export interface MsProjectSchedule {
  projectId: string;
  projectName: string;
  tasks: MsProjectTask[];
  lastModified: string;
}

export interface MsProjectAdapter {
  getSchedule(projectId: string): Promise<MsProjectSchedule | null>;
  importTasks(projectId: string): Promise<{ imported: number; conflicts: number }>;
}

export class MockMsProjectAdapter implements MsProjectAdapter {
  async getSchedule(projectId: string): Promise<MsProjectSchedule | null> {
    return {
      projectId,
      projectName: 'Demo MS Project Import',
      lastModified: new Date().toISOString(),
      tasks: [
        { id: 'msp-1', name: 'Requirements gathering', startDate: '2025-01-06', endDate: '2025-01-24', percentComplete: 100, predecessors: [], resourceNames: ['Alice Chen'], isMilestone: false },
        { id: 'msp-2', name: 'Design phase', startDate: '2025-01-27', endDate: '2025-02-28', percentComplete: 80, predecessors: ['msp-1'], resourceNames: ['Alice Chen', 'Bob Larsen'], isMilestone: false },
        { id: 'msp-3', name: 'Design review', startDate: '2025-02-28', endDate: '2025-02-28', percentComplete: 0, predecessors: ['msp-2'], resourceNames: [], isMilestone: true },
      ],
    };
  }

  async importTasks(_projectId: string): Promise<{ imported: number; conflicts: number }> {
    return { imported: 3, conflicts: 0 };
  }
}
