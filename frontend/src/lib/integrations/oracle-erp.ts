export interface OracleActual {
  projectId: string;
  period: string; // e.g. "2025-Q1"
  soNumber?: string;
  poNumber?: string;
  amount: number;
  category: 'labor' | 'nre' | 'capital' | 'other';
  type: 'realized' | 'pending';
  vendor?: string;
  description?: string;
}

export interface OracleErpAdapter {
  getActuals(projectId: string): Promise<OracleActual[]>;
  getAllActuals(): Promise<OracleActual[]>;
}

export class MockOracleErpAdapter implements OracleErpAdapter {
  private actuals: OracleActual[] = [
    { projectId: 'demo-1', period: '2024-Q1', soNumber: 'SO-10001', poNumber: 'PO-20001', amount: 125000, category: 'labor', type: 'realized', description: 'Engineering labor Q1' },
    { projectId: 'demo-1', period: '2024-Q2', soNumber: 'SO-10002', poNumber: 'PO-20002', amount: 87500, category: 'nre', type: 'realized', vendor: 'Acme Parts Inc', description: 'Prototype parts' },
    { projectId: 'demo-1', period: '2024-Q3', amount: 150000, category: 'labor', type: 'realized', description: 'Engineering labor Q3' },
    { projectId: 'demo-1', period: '2024-Q4', amount: 45000, category: 'capital', type: 'pending', description: 'Test equipment' },
  ];

  async getActuals(projectId: string): Promise<OracleActual[]> {
    return this.actuals.filter((a) => a.projectId === projectId);
  }

  async getAllActuals(): Promise<OracleActual[]> {
    return this.actuals;
  }
}
