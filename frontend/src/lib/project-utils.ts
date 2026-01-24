/**
 * Centralized Project Utilities
 */

import { Project } from "./types";

export interface ProjectFilterOptions {
  businessUnitId?: string;
  status?: Project["status"] | Project["status"][];
  visible?: boolean;
  riskLevel?: string | string[];
  dateRange?: {
    startYear: number;
    startQuarter: number;
    endYear: number;
    endQuarter: number;
  };
  funded?: boolean;
}

export interface ProjectGroupByOptions {
  businessUnit?: boolean;
  status?: boolean;
  riskLevel?: boolean;
  year?: boolean;
  quarter?: boolean;
  custom?: (project: Project) => string;
}

export class ProjectCollection {
  private projects: Project[];

  constructor(projects: Project[]) {
    this.projects = [...projects];
  }

  filter(options: ProjectFilterOptions): ProjectCollection {
    let filtered = [...this.projects];

    if (options.businessUnitId) {
      filtered = filtered.filter((p) => p.businessUnitId === options.businessUnitId);
    }

    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      filtered = filtered.filter((p) => statuses.includes(p.status));
    }

    if (options.visible !== undefined) {
      filtered = filtered.filter((p) => (options.visible ? p.visible !== false : p.visible === false));
    }

    if (options.riskLevel) {
      const riskLevels = Array.isArray(options.riskLevel) ? options.riskLevel : [options.riskLevel];
      filtered = filtered.filter((p) => riskLevels.includes(p.riskLevel));
    }

    if (options.dateRange) {
      const { startYear, startQuarter, endYear, endQuarter } = options.dateRange;
      filtered = filtered.filter((project) => {
        const projectEndYear =
          project.startYear + Math.floor((project.startQuarter + project.durationQuarters - 1) / 4);
        const projectEndQuarter = ((project.startQuarter + project.durationQuarters - 1) % 4) + 1;

        return !(
          project.startYear > endYear ||
          (project.startYear === endYear && project.startQuarter > endQuarter) ||
          projectEndYear < startYear ||
          (projectEndYear === startYear && projectEndQuarter < startQuarter)
        );
      });
    }

    if (options.funded !== undefined) {
      filtered = filtered.filter((p) => (options.funded ? p.status !== "unfunded" : p.status === "unfunded"));
    }

    return new ProjectCollection(filtered);
  }

  groupBy(options: ProjectGroupByOptions): Record<string, Project[]> {
    const groups: Record<string, Project[]> = {};

    this.projects.forEach((project) => {
      let key: string;

      if (options.custom) {
        key = options.custom(project);
      } else if (options.businessUnit) {
        key = project.businessUnitId;
      } else if (options.status) {
        key = project.status;
      } else if (options.riskLevel) {
        key = project.riskLevel;
      } else if (options.year) {
        key = project.startYear.toString();
      } else if (options.quarter) {
        key = `${project.startYear}Q${project.startQuarter}`;
      } else {
        key = "all";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(project);
    });

    return groups;
  }

  sortBy(field: keyof Project, direction: "asc" | "desc" = "asc"): ProjectCollection {
    const sorted = [...this.projects].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return new ProjectCollection(sorted);
  }

  toArray(): Project[] {
    return [...this.projects];
  }

  count(): number {
    return this.projects.length;
  }

  isEmpty(): boolean {
    return this.projects.length === 0;
  }

  first(): Project | undefined {
    return this.projects[0];
  }

  last(): Project | undefined {
    return this.projects[this.projects.length - 1];
  }

  findById(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  map<T>(callback: (project: Project, index: number) => T): T[] {
    return this.projects.map(callback);
  }

  forEach(callback: (project: Project, index: number) => void): void {
    this.projects.forEach(callback);
  }
}

export class ProjectUtils {
  static from(projects: Project[]): ProjectCollection {
    return new ProjectCollection(projects);
  }

  static filterByBusinessUnit(projects: Project[], businessUnitId: string): Project[] {
    return projects.filter((project) => project.businessUnitId === businessUnitId);
  }

  static filterByStatus(projects: Project[], status: Project["status"] | Project["status"][]): Project[] {
    const statuses = Array.isArray(status) ? status : [status];
    return projects.filter((project) => statuses.includes(project.status));
  }

  static filterVisible(projects: Project[]): Project[] {
    return projects.filter((project) => project.visible !== false);
  }

  static getStatistics(projects: Project[]) {
    const total = projects.length;
    const funded = projects.filter((p) => p.status !== "unfunded").length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const unfunded = projects.filter((p) => p.status === "unfunded").length;

    return {
      total,
      funded,
      active,
      completed,
      unfunded,
    };
  }
}
