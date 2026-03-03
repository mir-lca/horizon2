export interface HrEmployee {
  id: string;
  email: string;
  displayName: string;
  jobTitle: string;
  department: string;
  businessUnit: string;
  division: string;
  laborRate?: number;
  skills?: string[];
  region?: string;
  seniorityLevel?: string;
  employeeClass: 'permanent' | 'contractor' | 'planned';
}

export interface HrSyncAdapter {
  getEmployees(): Promise<HrEmployee[]>;
  getEmployee(id: string): Promise<HrEmployee | null>;
  syncEmployees(): Promise<{ synced: number; errors: number }>;
}

export class MockHrSyncAdapter implements HrSyncAdapter {
  private employees: HrEmployee[];

  constructor() {
    // Import fixture inline to avoid module issues
    this.employees = [
      { id: 'hr-001', email: 'alice.chen@example.com', displayName: 'Alice Chen', jobTitle: 'Software Engineer', department: 'Engineering', businessUnit: 'Universal Robots', division: 'Robotics', laborRate: 120, skills: ['Python', 'React', 'ML'], region: 'EMEA', seniorityLevel: 'senior', employeeClass: 'permanent' },
      { id: 'hr-002', email: 'bob.larsen@example.com', displayName: 'Bob Larsen', jobTitle: 'Hardware Engineer', department: 'Hardware', businessUnit: 'MiR', division: 'Robotics', laborRate: 110, skills: ['CAD', 'Electronics', 'PCB Design'], region: 'EMEA', seniorityLevel: 'mid', employeeClass: 'permanent' },
      { id: 'hr-003', email: 'carol.smith@example.com', displayName: 'Carol Smith', jobTitle: 'Product Manager', department: 'Product', businessUnit: 'Universal Robots', division: 'Robotics', laborRate: 130, skills: ['Roadmapping', 'Agile', 'Stakeholder Management'], region: 'Americas', seniorityLevel: 'senior', employeeClass: 'permanent' },
      { id: 'hr-004', email: 'david.kim@example.com', displayName: 'David Kim', jobTitle: 'Data Scientist', department: 'AI', businessUnit: 'Teradyne Robotics', division: 'Robotics', laborRate: 140, skills: ['Python', 'PyTorch', 'Statistics'], region: 'Americas', seniorityLevel: 'senior', employeeClass: 'contractor' },
    ];
  }

  async getEmployees(): Promise<HrEmployee[]> {
    return this.employees;
  }

  async getEmployee(id: string): Promise<HrEmployee | null> {
    return this.employees.find((e) => e.id === id) ?? null;
  }

  async syncEmployees(): Promise<{ synced: number; errors: number }> {
    return { synced: this.employees.length, errors: 0 };
  }
}
